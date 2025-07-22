import { Router } from 'express';
import { getRepository } from '@server/datasource';
import { Invite } from '@server/entity/Invite';
import PlexTvAPI from '@server/api/plextv';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import { getSettings } from '@server/lib/settings';
import { InviteStatus } from '@server/constants/invite';
import axios from 'axios';

const signupRoutes = Router();

// Step 1: Validate invite code
signupRoutes.get('/validate/:icode', async (req, res, next) => {
  try {
    const inviteRepository = getRepository(Invite);
    const invite = await inviteRepository.findOne({
      where: { icode: req.params.icode },
    });
    if (!invite) {
      res.status(404).json({ valid: false, message: 'Invite code not found.' });
      return;
    }
    if (invite.status !== InviteStatus.ACTIVE) {
      res
        .status(400)
        .json({ valid: false, message: 'Invite code is not active.' });
      return;
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      res
        .status(400)
        .json({ valid: false, message: 'Invite code has expired.' });
      return;
    }
    res.status(200).json({ valid: true, message: 'Invite code is valid.' });
  } catch (e) {
    next(e);
  }
});

// Step 2: Plex authentication
signupRoutes.get('/plexauth/:authToken', async (req, res, next) => {
  try {
    const plextv = new PlexTvAPI(req.params.authToken);
    const plexUser = await plextv.getUser();
    const userRepository = getRepository(User);
    let user = await userRepository
      .createQueryBuilder('user')
      .where('user.plexId = :id', { id: plexUser.id })
      .orWhere('user.email = :email', { email: plexUser.email.toLowerCase() })
      .getOne();
    // Check if user is already a member of Plex server
    const mainUser = await userRepository.findOne({ where: { id: 1 } });
    let alreadyOnPlex = false;
    if (mainUser && mainUser.plexToken) {
      try {
        const plexTvApi = new PlexTvAPI(mainUser.plexToken);
        alreadyOnPlex = await plexTvApi.checkUserAccess(plexUser.id);
      } catch {
        // ignore errors in checkUserAccess
      }
    }
    if (!user) {
      user = new User({
        plexId: plexUser.id,
        email: plexUser.email.toLowerCase(),
        plexUsername: plexUser.username,
        avatar: plexUser.thumb,
        userType: 1, // UserType.PLEX
      });
      await userRepository.save(user);
      // --- Mark invite as used if invite code is present in query ---
      let inviteCode = undefined;
      if (typeof req.query.icode === 'string') {
        inviteCode = req.query.icode;
      } else if (Array.isArray(req.query.icode)) {
        inviteCode = req.query.icode[0];
      }
      if (inviteCode) {
        const inviteRepository = getRepository(Invite);
        const invite = await inviteRepository.findOne({
          where: { icode: inviteCode },
        });
        if (invite) {
          invite.uses = (invite.uses || 0) + 1;
          if (!invite.redeemedBy) invite.redeemedBy = [];
          if (!invite.redeemedBy.some((u) => u.id === user.id))
            invite.redeemedBy.push(user);
          // Mark as redeemed if usage limit reached
          if (
            typeof invite.usageLimit === 'number' &&
            invite.usageLimit > 0 &&
            invite.uses >= invite.usageLimit
          ) {
            invite.status = InviteStatus.REDEEMED;
          }
          invite.updatedBy = user;
          await inviteRepository.save(invite);
        }
      }
      // --- End invite update ---
    }
    // Always set session for the user (new or existing)
    if (req.session) req.session.userId = user.id;
    res.status(200).json({
      alreadyHasAccess: !!(user && alreadyOnPlex),
      user: user.filter(),
      message:
        user && alreadyOnPlex
          ? 'User already has access. Signed in.'
          : 'User authenticated and session set.',
    });
  } catch (e) {
    next(e);
  }
});

// Step 2b: Assign libraries and permissions
signupRoutes.post('/invite', async (req, res, next) => {
  try {
    const { icode, userId } = req.body;
    if (!icode || !userId) {
      res
        .status(400)
        .json({ success: false, message: 'Invite code and userId required.' });
      return;
    }
    const inviteRepository = getRepository(Invite);
    const userRepository = getRepository(User);
    const invite = await inviteRepository.findOne({ where: { icode } });
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!invite) {
      res.status(404).json({ success: false, message: 'Invite not found.' });
      return;
    }
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    await userRepository.save(user);
    const mainUser = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.plexToken')
      .where('user.id = :id', { id: 1 })
      .getOne();
    if (!mainUser || !mainUser.plexToken) {
      res.status(500).json({
        success: false,
        message:
          'Admin Plex token is missing. Please set your Plex token in your profile/settings as the main user.',
      });
      return;
    }
    // Assign libraries from invite
    if (invite.sharedLibraries) {
      if (!user.settings) {
        user.settings = new UserSettings({
          sharedLibraries: invite.sharedLibraries,
          user,
        });
      } else {
        user.settings.sharedLibraries = invite.sharedLibraries;
      }
      // Validate the admin token before proceeding
      const plexTvApi = new (await import('@server/api/plextv')).default(
        mainUser.plexToken
      );
      try {
        await plexTvApi.pingToken();
      } catch {
        res.status(500).json({
          success: false,
          message:
            'Admin Plex token is invalid or expired. Please update your Plex token in your profile/settings as the main user.',
        });
        return;
      }
      const plexServerId = getSettings().plex.machineId;
      let librarySectionIds = [];
      if (invite.sharedLibraries === 'all') {
        librarySectionIds = [];
      } else if (invite.sharedLibraries === 'server') {
        // Use app settings for default libraries
        const defaultLibs = getSettings().main.sharedLibraries;
        librarySectionIds = defaultLibs
          ? defaultLibs
              .split(/[,|]/)
              .map((id) => id.trim())
              .filter((id) => id !== '')
          : [];
      } else if (typeof invite.sharedLibraries === 'string') {
        librarySectionIds = invite.sharedLibraries
          .split(/[,|]/)
          .map((id) => id.trim())
          .filter((id) => id !== '');
      } else if (Array.isArray(invite.sharedLibraries)) {
        librarySectionIds = (invite.sharedLibraries as string[])
          .flatMap((id) => String(id).split(/[,|]/))
          .map((id) => id.trim())
          .filter((id) => id !== '');
      }
      // Try inviting by email first, then username if available
      const inviteAttempts = [user.email, user.plexUsername].filter(Boolean);
      let inviteResult = null;
      let inviteError = null;
      for (const identifier of inviteAttempts) {
        try {
          // Build plex_base_url for Plex Home invites
          let plex_base_url = undefined;
          if (invite.plexHome) {
            const plexSettings = getSettings().plex;
            const protocol = plexSettings.useSsl ? 'https' : 'http';
            plex_base_url = `${protocol}://${plexSettings.ip}:${plexSettings.port}`;
          }
          const response = await axios.post('http://localhost:5005/invite', {
            token: mainUser.plexToken,
            server_id: plexServerId,
            email: identifier,
            libraries: librarySectionIds,
            allow_sync: invite.downloads ?? false,
            allow_camera_upload: false,
            allow_channels: invite.liveTv ?? false,
            plex_home: invite.plexHome ?? false,
            plex_base_url,
          });
          if (!response.data.success)
            throw new Error(
              response.data.error || 'Failed to invite user via Python service'
            );
          inviteResult = response.data;
          inviteError = null;
          break;
        } catch (err) {
          inviteError = err;
        }
      }
      if (inviteError && !inviteResult) {
        res.status(500).json({
          success: false,
          message:
            'Failed to invite user to Plex (python service). Please check your Plex admin token and try again.',
        });
        return;
      }
    }
    // Ensure default permissions for new users from settings
    const settings = getSettings();
    if (user && !user.permissions) {
      user.permissions = settings.main.defaultPermissions;
      await userRepository.save(user);
    }
    res.status(200).json({
      success: true,
      message: 'Libraries assigned and Plex invite sent.',
    });
  } catch (e) {
    if (!res.headersSent)
      res
        .status(500)
        .json({ success: false, message: 'Internal server error.' });
    next(e);
  }
});

// Step 3: Confirm account and update profile
signupRoutes.post('/complete', async (req, res, next) => {
  try {
    const { userId, icode, displayName, password } = req.body;
    if (!userId || !icode) {
      res
        .status(400)
        .json({ success: false, message: 'User ID and invite code required.' });
      return;
    }
    const userRepository = getRepository(User);
    const inviteRepository = getRepository(Invite);
    const user = await userRepository.findOne({ where: { id: userId } });
    const invite = await inviteRepository.findOne({ where: { icode } });
    if (!user || !invite) {
      res
        .status(404)
        .json({ success: false, message: 'User or invite not found.' });
      return;
    }
    // --- Expiry check ---
    let isExpired = false;
    let expiryDate;
    if (invite.expiresAt) {
      expiryDate = new Date(invite.expiresAt);
    } else if (invite.expiryLimit !== 0) {
      let msPerUnit = 86400000;
      if (invite.expiryTime === 'weeks') msPerUnit = 604800000;
      if (invite.expiryTime === 'months') msPerUnit = 2629800000;
      expiryDate = new Date(
        invite.createdAt.getTime() + invite.expiryLimit * msPerUnit
      );
    }
    if (expiryDate && Date.now() > expiryDate.getTime()) {
      isExpired = true;
    }
    if (isExpired) {
      invite.status = InviteStatus.EXPIRED;
      await inviteRepository.save(invite);
      res
        .status(400)
        .json({ success: false, message: 'Invite code has expired.' });
      return;
    }
    // --- End expiry check ---
    user.displayName = displayName || user.displayName;
    if (password) await user.setPassword(password);
    invite.uses = (invite.uses || 0) + 1;
    if (!invite.redeemedBy) invite.redeemedBy = [];
    if (!invite.redeemedBy.some((u) => u.id === user.id))
      invite.redeemedBy.push(user);
    // Mark as redeemed if usage limit reached
    if (
      typeof invite.usageLimit === 'number' &&
      invite.usageLimit > 0 &&
      invite.uses >= invite.usageLimit
    ) {
      invite.status = InviteStatus.REDEEMED;
    }
    // Set updatedBy to the user who redeemed the invite
    invite.updatedBy = user;
    await userRepository.save(user);
    await inviteRepository.save(invite);
    if (req.session) req.session.userId = user.id;
    res.status(200).json({
      success: true,
      message: 'Account finalized.',
      user: user.filter(),
    });
  } catch (e) {
    next(e);
  }
});

export default signupRoutes;
