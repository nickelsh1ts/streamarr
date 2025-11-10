import { Router } from 'express';
import { getRepository } from '@server/datasource';
import { Invite } from '@server/entity/Invite';
import PlexTvAPI from '@server/api/plextv';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import { getSettings } from '@server/lib/settings';
import { InviteStatus } from '@server/constants/invite';
import { UserType } from '@server/constants/user';
import axios from 'axios';
import logger from '@server/logger';
import crypto from 'crypto';

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

// Step 2: Plex authentication and user creation
signupRoutes.post('/plexauth', async (req, res) => {
  try {
    const { authToken, icode } = req.body;
    if (!authToken || !icode) {
      res.status(400).json({
        success: false,
        message: 'Auth token and invite code required.',
      });
      return;
    }

    // Validate invite code first
    const inviteRepository = getRepository(Invite);
    const invite = await inviteRepository.findOne({
      where: { icode },
      relations: ['redeemedBy'],
    });
    if (!invite) {
      res.status(404).json({ success: false, message: 'Invite not found.' });
      return;
    }

    // Check if invite is active
    if (invite.status !== InviteStatus.ACTIVE) {
      res
        .status(400)
        .json({ success: false, message: 'Invite code is not active.' });
      return;
    }

    // Check invite expiry
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

    // Authenticate with Plex
    const plextv = new PlexTvAPI(authToken);
    const plexUser = await plextv.getUser();
    const userRepository = getRepository(User);

    // Check if user is already a member of Plex server
    const mainUser = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.plexToken')
      .where('user.id = :id', { id: 1 })
      .getOne();
    let alreadyOnPlex = false;
    if (mainUser && mainUser.plexToken) {
      try {
        const plexTvApi = new PlexTvAPI(mainUser.plexToken);
        alreadyOnPlex = await plexTvApi.checkUserAccess(plexUser.id);
      } catch (e) {
        {
          logger.warn('Plex access check failed', {
            label: 'SignUp',
            plexUserId: plexUser.id,
            error: e.message,
          });
        }
        alreadyOnPlex = false;
      }
    } else {
      logger.warn('Cannot check Plex access - admin user missing token', {
        label: 'SignUp',
      });
    }

    // Check if user already exists
    let user = await userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.settings', 'settings')
      .where('user.plexId = :id', { id: plexUser.id })
      .orWhere('user.email = :email', { email: plexUser.email.toLowerCase() })
      .getOne();

    if (user) {
      // User already exists - redirect to login
      res.status(400).json({
        success: false,
        message: 'User already exists. Please sign in instead.',
      });
      return;
    }

    // If user already has Plex access but no account, they should log in instead
    if (alreadyOnPlex) {
      res.status(400).json({
        success: false,
        message:
          'You already have access to this Plex server. Please sign in instead of signing up.',
      });
      return;
    }

    // Check usage limit before creating user
    if (
      typeof invite.usageLimit === 'number' &&
      invite.usageLimit > 0 &&
      invite.uses >= invite.usageLimit
    ) {
      res.status(400).json({
        success: false,
        message: 'Invite has reached its usage limit.',
      });
      return;
    }

    // Create new user with default permissions and set display name
    const settings = getSettings();
    user = new User({
      plexId: plexUser.id,
      email: plexUser.email.toLowerCase(),
      plexUsername: plexUser.username,
      displayName: plexUser.username, // Set display name immediately
      avatar: plexUser.thumb,
      userType: UserType.PLEX,
      plexToken: plexUser.authToken,
      permissions: settings.main.defaultPermissions, // Assign default permissions from admin settings
    });

    // Set up user settings with invite libraries
    if (invite.sharedLibraries) {
      user.settings = new UserSettings({
        sharedLibraries: invite.sharedLibraries,
      });
    }

    await userRepository.save(user);

    logger.info('User created successfully', {
      label: 'SignUp',
      userId: user.id,
      email: user.email,
      invitedBy: invite.createdBy ? invite.createdBy.displayName : 'Unknown',
      inviteCode: invite.icode,
    });

    // Handle Plex server invitation immediately to avoid inconsistent state
    if (invite.sharedLibraries || invite.sharedLibraries === '') {
      const mainUser = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      if (!mainUser || !mainUser.plexToken) {
        logger.error('Admin Plex token missing', {
          label: 'SignUp',
          hasMainUser: !!mainUser,
          hasPlexToken: !!(mainUser && mainUser.plexToken),
        });
        // Clean up: remove the user we just created since Plex invite will fail
        await userRepository.remove(user);
        res.status(500).json({
          success: false,
          message: 'Admin Plex token is missing. Please contact administrator.',
        });
        return;
      }

      // Validate the admin token before proceeding
      const plexTvApi = new PlexTvAPI(mainUser.plexToken);
      try {
        await plexTvApi.pingToken();
      } catch (error) {
        logger.error('Admin Plex token validation failed', {
          label: 'SignUp',
          error: error.message,
        });
        // Clean up: remove the user we just created since Plex invite will fail
        await userRepository.remove(user);
        res.status(500).json({
          success: false,
          message: 'Admin Plex token is invalid. Please contact administrator.',
        });
        return;
      }

      // Handle Plex server invitation - filter libraries based on admin settings
      // When invite or admin default is "all", only grant access to enabled libraries
      const plexServerId = getSettings().plex.machineId;
      let librarySectionIds = [];

      if (invite.sharedLibraries === 'all') {
        // Get only enabled libraries from settings
        const plexSettings = getSettings();
        const enabledLibraries = plexSettings.plex.libraries.filter(
          (lib) => lib.enabled
        );
        librarySectionIds = enabledLibraries.map((lib) => lib.id);
      } else if (
        invite.sharedLibraries === 'server' ||
        invite.sharedLibraries === ''
      ) {
        // Use app settings for default libraries
        const defaultLibs = getSettings().main.sharedLibraries;

        if (defaultLibs === 'all' || !defaultLibs) {
          // Admin set default to "All Libraries" - filter to only enabled libraries
          const plexSettings = getSettings();
          const enabledLibraries = plexSettings.plex.libraries.filter(
            (lib) => lib.enabled
          );
          librarySectionIds = enabledLibraries.map((lib) => lib.id);
        } else {
          // Admin has specific libraries configured - filter against enabled libraries
          const plexSettings = getSettings();
          const enabledLibraries = plexSettings.plex.libraries.filter(
            (lib) => lib.enabled
          );

          const adminConfiguredLibs = defaultLibs
            ? defaultLibs
                .split(/[,|]/)
                .map((id) => id.trim())
                .filter((id) => id !== '')
            : [];

          // Only include admin-configured libraries that are also enabled
          librarySectionIds = adminConfiguredLibs.filter((libId) =>
            enabledLibraries.some((enabled) => enabled.id === libId)
          );
        }
      } else if (typeof invite.sharedLibraries === 'string') {
        const plexSettings = getSettings();
        const enabledLibraries = plexSettings.plex.libraries.filter(
          (lib) => lib.enabled
        );

        const requestedLibs = invite.sharedLibraries
          .split(/[,|]/)
          .map((id) => id.trim())
          .filter((id) => id !== '');

        // Only include requested libraries that are also enabled
        librarySectionIds = requestedLibs.filter((libId) =>
          enabledLibraries.some((enabled) => enabled.id === libId)
        );
      } else if (Array.isArray(invite.sharedLibraries)) {
        const plexSettings = getSettings();
        const enabledLibraries = plexSettings.plex.libraries.filter(
          (lib) => lib.enabled
        );

        const requestedLibs = (invite.sharedLibraries as string[])
          .flatMap((id) => String(id).split(/[,|]/))
          .map((id) => id.trim())
          .filter((id) => id !== '');

        // Only include requested libraries that are also enabled
        librarySectionIds = requestedLibs.filter((libId) =>
          enabledLibraries.some((enabled) => enabled.id === libId)
        );
      }

      // Safeguard: If we have an empty array but expected specific libraries,
      // this indicates a configuration error - fail rather than grant all access
      if (
        librarySectionIds.length === 0 &&
        invite.sharedLibraries !== 'all' &&
        invite.sharedLibraries !== 'server' &&
        invite.sharedLibraries !== ''
      ) {
        logger.error(
          'Library filtering resulted in empty array - potential misconfiguration',
          {
            label: 'SignUp',
            inviteSharedLibraries: invite.sharedLibraries,
            adminDefaultLibs: getSettings().main.sharedLibraries,
          }
        );
        // Clean up: remove the user we just created
        await userRepository.remove(user);
        res.status(500).json({
          success: false,
          message: 'Library configuration error. Please contact administrator.',
        });
        return;
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
            user_token: user.plexToken,
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
          logger.warn(
            `Plex invite attempt failed for ${identifier}: ${err.message}`,
            {
              label: 'SignUp',
            }
          );
        }
      }

      if (inviteError && !inviteResult) {
        // Check if the error is about already sharing with this user
        const errorMessage = inviteError.message || inviteError.toString();
        let pythonError = '';
        if (
          inviteError.response &&
          inviteError.response.data &&
          inviteError.response.data.error
        ) {
          pythonError = inviteError.response.data.error;
        }

        if (
          errorMessage.includes('already sharing this server with') ||
          errorMessage.includes('already sharing') ||
          pythonError.includes('already sharing this server with') ||
          pythonError.includes('already sharing')
        ) {
          logger.info(
            `User ${user.email} already has Plex access but tried to sign up`,
            {
              label: 'SignUp',
            }
          );
          // Clean up: remove the user we just created since they should log in instead
          await userRepository.remove(user);
          res.status(400).json({
            success: false,
            message:
              'You already have access to this Plex server. Please sign in instead of signing up.',
          });
          return;
        } else {
          // Clean up: remove the user we just created since Plex invite failed
          await userRepository.remove(user);
          res.status(500).json({
            success: false,
            message:
              'Failed to invite user to Plex server. Please contact administrator.',
          });
          return;
        }
      }
    } else {
      logger.info('Skipping Plex invitation - no shared libraries on invite', {
        label: 'SignUp',
      });
    }

    // Update invite usage immediately after successful user creation and Plex invitation
    invite.uses = (invite.uses || 0) + 1;
    if (!invite.redeemedBy) invite.redeemedBy = [];
    if (!invite.redeemedBy.some((u) => u.id === user.id)) {
      invite.redeemedBy.push(user);
    }

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

    // Set session for the user (log them in after successful creation)
    if (req.session) {
      req.session.userId = user.id;
    }

    res.status(200).json({
      success: true,
      alreadyHasAccess: alreadyOnPlex,
      user: {
        id: user.id,
        email: user.email,
        plexUsername: user.plexUsername,
        plexId: user.plexId,
        avatar: user.avatar,
        displayName: user.displayName,
        userType: user.userType,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: 'Account created successfully. You are now logged in.',
    });
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during signup.',
      });
    }
    logger.error('Error in signup/plexauth:', {
      label: 'SignUp',
      error: e.message,
    });
  }
});

// Step 2b: Local user creation
signupRoutes.post('/localauth', async (req, res) => {
  try {
    const appSettings = getSettings();

    // Check if local login is enabled
    if (!appSettings.main.localLogin) {
      res.status(400).json({
        success: false,
        message: 'Local user creation is disabled.',
      });
      return;
    }

    const { email, username, password, confirmPassword, icode } = req.body;

    if (!email || !username || !password || !confirmPassword || !icode) {
      res.status(400).json({
        success: false,
        message:
          'Email, username, password, confirm password, and invite code are required.',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    // Validate invite code first
    const inviteRepository = getRepository(Invite);
    const invite = await inviteRepository.findOne({
      where: { icode },
      relations: ['redeemedBy'],
    });
    if (!invite) {
      res.status(404).json({ success: false, message: 'Invite not found.' });
      return;
    }

    // Check if invite is active
    if (invite.status !== InviteStatus.ACTIVE) {
      res
        .status(400)
        .json({ success: false, message: 'Invite code is not active.' });
      return;
    }

    // Check invite expiry
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

    const userRepository = getRepository(User);

    // Check if user already exists
    let user = await userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.settings', 'settings')
      .where('user.email = :email', { email: email.toLowerCase() })
      .orWhere('user.plexUsername = :username', { username })
      .getOne();

    if (user) {
      res.status(400).json({
        success: false,
        message:
          'User with this email or username already exists. Please sign in instead.',
      });
      return;
    }

    // Check usage limit before creating user
    if (
      typeof invite.usageLimit === 'number' &&
      invite.usageLimit > 0 &&
      invite.uses >= invite.usageLimit
    ) {
      res.status(400).json({
        success: false,
        message: 'Invite has reached its usage limit.',
      });
      return;
    }

    // Generate Gravatar avatar URL
    const avatar = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex')}?d=mm&s=200`;

    // Create new local user
    user = new User({
      email: email.toLowerCase(),
      username: username,
      displayName: username,
      plexToken: '',
      avatar: avatar,
      userType: UserType.LOCAL,
      permissions: appSettings.main.defaultPermissions,
    });

    // Set password
    await user.setPassword(password);

    // Set up user settings with invite libraries
    if (invite.sharedLibraries) {
      user.settings = new UserSettings({
        sharedLibraries: invite.sharedLibraries,
      });
    }

    await userRepository.save(user);

    logger.info('Local user created successfully', {
      label: 'SignUp',
      userId: user.id,
      email: user.email,
      username: user.username,
      invitedBy: invite.createdBy ? invite.createdBy.displayName : 'Unknown',
      inviteCode: invite.icode,
    });

    // Update invite usage
    invite.uses = (invite.uses || 0) + 1;
    if (!invite.redeemedBy) invite.redeemedBy = [];
    if (!invite.redeemedBy.some((u) => u.id === user.id)) {
      invite.redeemedBy.push(user);
    }

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

    // Set session for the user (log them in after successful creation)
    if (req.session) {
      req.session.userId = user.id;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        userType: user.userType,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: 'Account created successfully. You are now logged in.',
    });
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during local signup.',
      });
    }
    logger.error('Error in signup/localauth:', {
      label: 'SignUp',
      error: e.message,
    });
  }
});

// Step 3: Optional profile customization
signupRoutes.post('/complete', async (req, res) => {
  try {
    const { userId, displayName, password } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID required.' });
      return;
    }

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['settings'],
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Update user profile if provided
    if (displayName) user.displayName = displayName;
    if (password) await user.setPassword(password);
    await userRepository.save(user);

    // Ensure user is logged in
    if (req.session) {
      req.session.userId = user.id;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        email: user.email,
        plexUsername: user.plexUsername,
        plexId: user.plexId,
        avatar: user.avatar,
        displayName: user.displayName,
        userType: user.userType,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    logger.error('Error in signup/complete:', {
      label: 'SignUp',
      error: e.message,
    });
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: 'Internal server error.' });
    }
  }
});

export default signupRoutes;
