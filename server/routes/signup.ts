import PlexTvAPI from '@server/api/plextv';
import { InviteStatus } from '@server/constants/invite';
import { UserType } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { Invite } from '@server/entity/Invite';
import { User } from '@server/entity/User';
import { UserSettings } from '@server/entity/UserSettings';
import { Permission } from '@server/lib/permissions';
import { resolvePlexAuthToken } from '@server/lib/plexAuth';
import { plexSync } from '@server/lib/plexSync';
import { plexAuthLimiter } from '@server/lib/rateLimiters';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import {
  isDefaultSentinel,
  materializeDefaultSnapshot,
  normalizeSharedLibrariesValue,
  resolveSharedLibraryKeys,
} from '@server/utils/sharedLibraries';
import crypto from 'crypto';
import { Router } from 'express';

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
    if (invite.isExpired()) {
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
signupRoutes.post('/plexauth', plexAuthLimiter, async (req, res) => {
  try {
    const { icode, pinId } = req.body as {
      authToken?: string;
      icode?: string;
      pinId?: string;
    };
    const { token: authToken, commit: commitPlexAuth } = resolvePlexAuthToken(
      req.body
    );
    if (!authToken || !icode) {
      res.status(pinId && !authToken ? 401 : 400).json({
        success: false,
        message:
          pinId && !authToken
            ? 'Plex sign-in session is invalid or has expired. Please try again.'
            : 'Auth token and invite code required.',
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

    if (invite.isExpired()) {
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
    // Token authenticated against plex.tv; consume the single-use pin session.
    // Invite-code validation above runs first, so an invalid/expired invite
    // leaves the session intact for a retry.
    commitPlexAuth(true);
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
      plexToken: authToken,
      permissions: settings.main.defaultPermissions, // Assign default permissions from admin settings
    });

    const enabledLibraries = settings.plex.libraries.filter(
      (lib) => lib.enabled
    );
    const sharedLibrariesSnapshot = isDefaultSentinel(invite.sharedLibraries)
      ? materializeDefaultSnapshot({
          adminDefault: settings.main.sharedLibraries,
          enabledLibraries,
        })
      : normalizeSharedLibrariesValue(invite.sharedLibraries);

    user.settings = new UserSettings({
      ...(sharedLibrariesSnapshot
        ? { sharedLibraries: sharedLibrariesSnapshot }
        : {}),
      allowDownloads: invite.downloads ?? false,
      allowLiveTv: invite.liveTv ?? false,
      allowPlexHome: invite.plexHome ?? false,
      trialPeriodOutcome:
        invite.trialPeriodOutcome ?? settings.main.trialPeriodOutcome,
    });

    if (
      settings.main.enableTrialPeriod &&
      !user.hasPermission(
        [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
        { type: 'or' }
      ) &&
      user.id !== 1
    ) {
      const trialEndDate = new Date(
        Date.now() +
          (invite.trialPeriodDays ?? settings.main.trialPeriodDays) * 86400000
      );
      user.settings.trialPeriodEndsAt = trialEndDate;
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
    if (user.settings.sharedLibraries) {
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

      // Resolve the snapshotted selection to explicit enabled library keys
      const librarySectionIds = resolveSharedLibraryKeys({
        value: user.settings.sharedLibraries,
        adminDefault: settings.main.sharedLibraries,
        enabledLibraries,
      });

      // Safeguard: an empty resolution is a configuration error - fail
      // rather than grant unintended access
      if (librarySectionIds.length === 0) {
        logger.error(
          'Library resolution resulted in an empty set - potential misconfiguration',
          {
            label: 'SignUp',
            inviteSharedLibraries: invite.sharedLibraries,
            adminDefaultLibs: settings.main.sharedLibraries,
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

      // Invite via plexSync (email first, then username); auto-accept runs
      // in the background using the user's token
      let inviteError: Error | null = null;
      try {
        await plexSync.inviteUser(user, {
          libraries: librarySectionIds,
          allowSync: invite.downloads ?? false,
          plexHome: invite.plexHome ?? false,
          userTokenOverride: authToken,
        });
      } catch (e) {
        inviteError = e instanceof Error ? e : new Error(String(e));
      }

      if (inviteError) {
        // Check if the error is about an invite that already exists
        const errorMessage = inviteError.message || inviteError.toString();

        if (/already (shar|invit)/i.test(errorMessage)) {
          logger.info(
            'A Plex invite is already pending for this user — Attempting auto-accept of the existing invite',
            {
              label: 'SignUp',
              userId: user.id,
              plexError: errorMessage,
            }
          );
          plexSync.scheduleAutoAccept(user, {
            userTokenOverride: authToken,
          });
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

    if (invite.isExpired()) {
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
    const settings = getSettings();
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

    const enabledLibraries = appSettings.plex.libraries.filter(
      (lib) => lib.enabled
    );
    const sharedLibrariesSnapshot = isDefaultSentinel(invite.sharedLibraries)
      ? materializeDefaultSnapshot({
          adminDefault: appSettings.main.sharedLibraries,
          enabledLibraries,
        })
      : normalizeSharedLibrariesValue(invite.sharedLibraries);

    user.settings = new UserSettings({
      ...(sharedLibrariesSnapshot
        ? { sharedLibraries: sharedLibrariesSnapshot }
        : {}),
      allowDownloads: invite.downloads ?? false,
      allowLiveTv: invite.liveTv ?? false,
      allowPlexHome: invite.plexHome ?? false,
      trialPeriodOutcome:
        invite.trialPeriodOutcome ?? settings.main.trialPeriodOutcome,
    });

    if (
      settings.main.enableTrialPeriod &&
      !user.hasPermission(
        [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
        { type: 'or' }
      ) &&
      user.id !== 1
    ) {
      const trialEndDate = new Date(
        Date.now() +
          (invite.trialPeriodDays ?? settings.main.trialPeriodDays) * 86400000
      );
      user.settings.trialPeriodEndsAt = trialEndDate;
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

    // Security: Verify the session user matches the requested userId
    if (!req.session?.userId || req.session.userId !== Number(userId)) {
      res.status(403).json({
        success: false,
        message: 'You can only complete signup for your own account.',
      });
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
