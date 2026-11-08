import { MAX_SESSIONS_PER_USER } from '@server/constants/user';
import { getRepository } from '@server/datasource';
import { Session } from '@server/entity/Session';
import type { User } from '@server/entity/User';
import { UserPushSubscription } from '@server/entity/UserPushSubscription';
import type {
  SessionLoginMethod,
  UserSessionResponse,
} from '@server/interfaces/api/userSettingsInterfaces';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import AsyncLock from '@server/utils/asyncLock';
import { createHash } from 'crypto';
import type { Request } from 'express';
import type { SessionData } from 'express-session';
import type { Server as SocketIOServer } from 'socket.io';
import { In, MoreThan } from 'typeorm';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const credentialLock = new AsyncLock();

export const withUserCredentialLock = async <Result>(
  userId: number,
  callback: () => Promise<Result>
): Promise<Result> => {
  let result: Result;
  await credentialLock.dispatch(userId, async () => {
    result = await callback();
  });
  return result;
};

export const toPublicSessionId = (sid: string): string =>
  createHash('sha256').update(sid).digest('hex').slice(0, 32);

export const sessionRoom = (sid: string): string => `session:${sid}`;

const parseSessionData = (json: string): Partial<SessionData> => {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
};

const getLiveSessions = async (userId: number) => {
  const sessions = await getRepository(Session).find({
    where: { userId, expiredAt: MoreThan(Date.now()) },
    order: { expiredAt: 'DESC' },
  });

  return sessions.map((session) => ({
    session,
    data: parseSessionData(session.json),
  }));
};

export const disconnectSessionSockets = (
  io: SocketIOServer | undefined,
  sids: string[]
): void => {
  if (!io || !sids.length) {
    return;
  }

  const sockets = io.in(sids.map(sessionRoom));
  sockets.emit('sessionRevoked');
  sockets.disconnectSockets(true);
};

type SessionRef = { sid: string; userId: number };

// Sockets authenticate once at connect, so follow this browser to its new session
const moveSessionSockets = (
  io: SocketIOServer | undefined,
  previous: SessionRef,
  next: SessionRef
): void => {
  if (!io) {
    return;
  }

  const sockets = io.in(sessionRoom(previous.sid));
  if (previous.userId !== next.userId) {
    sockets.disconnectSockets(true);
    return;
  }
  sockets.socketsJoin(sessionRoom(next.sid));
  sockets.socketsLeave(sessionRoom(previous.sid));
};

const softDeleteSessions = async (
  userId: number,
  sessions: Pick<Session, 'id' | 'json'>[],
  io?: SocketIOServer,
  { removeUnlinkedPush = false } = {}
): Promise<number> => {
  if (!sessions.length && !removeUnlinkedPush) {
    return 0;
  }

  const sids = sessions.map((session) => session.id);
  const pushEndpoints = sessions
    .map((session) => parseSessionData(session.json).pushEndpoint)
    .filter((endpoint): endpoint is string => !!endpoint);

  if (sids.length) {
    await getRepository(Session).softDelete({ id: In(sids) });
  }
  try {
    // Revoked devices can't unsubscribe themselves, so stop pushing to them here
    if (pushEndpoints.length || removeUnlinkedPush) {
      // A browser keeps its endpoint across sign-ins, so spare ones still in use
      const inUse = new Set(
        (await getLiveSessions(userId)).map(({ data }) => data.pushEndpoint)
      );
      const subscriptionRepository = getRepository(UserPushSubscription);
      const subscriptions = await subscriptionRepository.find({
        select: { id: true, endpoint: true },
        where: { user: { id: userId } },
      });
      // Unlinked subscriptions can only be attributed when no session remains
      const orphaned = subscriptions.filter(
        ({ endpoint }) =>
          !inUse.has(endpoint) &&
          (removeUnlinkedPush || pushEndpoints.includes(endpoint))
      );

      if (orphaned.length) {
        await subscriptionRepository.delete({
          id: In(orphaned.map(({ id }) => id)),
        });
      }
    }
  } finally {
    disconnectSessionSockets(io, sids);
  }

  return sids.length;
};

export type SessionRevokeReason =
  'manual' | 'password-change' | 'password-reset' | 'user-deleted';

export const revokeUserSessions = async (
  userId: number,
  {
    reason,
    revokedByUserId,
    exceptSid,
    publicIds,
    removeUnlinkedPush = !publicIds && !exceptSid,
  }: {
    reason: SessionRevokeReason;
    revokedByUserId?: number;
    exceptSid?: string;
    publicIds?: string[];
    removeUnlinkedPush?: boolean;
  },
  io?: SocketIOServer
): Promise<number> => {
  const sessions = await getRepository(Session).find({
    select: { id: true, json: true },
    where: { userId },
  });

  const revoked = await softDeleteSessions(
    userId,
    sessions.filter(
      ({ id }) =>
        id !== exceptSid &&
        (!publicIds || publicIds.includes(toPublicSessionId(id)))
    ),
    io,
    { removeUnlinkedPush }
  );

  if (revoked) {
    logger.info('Revoked user sessions', {
      label: 'Sessions',
      userId,
      revokedByUserId,
      reason,
      count: revoked,
    });
  }

  return revoked;
};

// Runs before the new session is saved, so it leaves room for one more
const enforceSessionCap = async (
  userId: number,
  io?: SocketIOServer
): Promise<void> => {
  const sessions = await getLiveSessions(userId);
  const excess = sessions.length - (MAX_SESSIONS_PER_USER - 1);

  if (excess <= 0) {
    return;
  }

  const evicted = sessions.slice(-excess).map(({ session }) => session);
  await softDeleteSessions(userId, evicted, io);

  logger.warn(
    'Session limit reached; signed out least recently active sessions',
    {
      label: 'Sessions',
      userId,
      evicted: evicted.length,
    }
  );
};

export const startUserSession = async (
  req: Request,
  user: User,
  loginMethod: SessionLoginMethod
): Promise<void> => {
  const previous = { sid: req.sessionID, userId: req.session.userId };
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve()))
  );
  req.session.userId = user.id;

  const io: SocketIOServer | undefined = req.app.get('io');
  if (previous.userId) {
    moveSessionSockets(io, previous, { sid: req.sessionID, userId: user.id });
  }

  await enforceSessionCap(user.id, io);

  // Saved now so the row exists for the device details below
  await new Promise<void>((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve()))
  );
  await getRepository(Session).update(
    { id: req.sessionID },
    {
      createdAt: new Date(),
      ip: (getSettings().network.sessionIpTracking && req.ip) || null,
      userAgent: req.get('user-agent')?.slice(0, 512) ?? null,
      loginMethod,
    }
  );
};

export const listUserSessions = async (
  userId: number,
  currentSid: string | undefined
): Promise<UserSessionResponse[]> => {
  const showIp = getSettings().network.sessionIpTracking;
  const sessions = await getLiveSessions(userId);

  return sessions.map(({ session }) => ({
    id: toPublicSessionId(session.id),
    current: session.id === currentSid,
    createdAt: session.createdAt ?? null,
    lastActiveAt: new Date(
      Number(session.expiredAt) - SESSION_TTL_SECONDS * 1000
    ),
    ...(showIp ? { ipAddress: session.ip ?? null } : {}),
    userAgent: session.userAgent ?? null,
    loginMethod: session.loginMethod ?? null,
  }));
};

export const clearSessionIpAddresses = async (): Promise<void> => {
  await getRepository(Session)
    .createQueryBuilder()
    .update()
    .set({ ip: null })
    .where('ip IS NOT NULL')
    .execute();
};
