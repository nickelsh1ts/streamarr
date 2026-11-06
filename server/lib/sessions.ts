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
import { createHash } from 'crypto';
import type { Request } from 'express';
import type { SessionData } from 'express-session';
import type { Server as SocketIOServer } from 'socket.io';
import { In, MoreThan } from 'typeorm';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export const toPublicSessionId = (sid: string): string =>
  createHash('sha256').update(sid).digest('hex').slice(0, 32);

const parseSessionData = (json: string): Partial<SessionData> => {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
};

const getLiveSessions = async (userId: number) => {
  const now = Date.now();
  const sessions = await getRepository(Session).find({
    where: { userId, expiredAt: MoreThan(now) },
    order: { expiredAt: 'DESC' },
  });

  // The store slides expiredAt on every request but the cookie expiry is fixed
  return sessions
    .map((session) => ({ session, data: parseSessionData(session.json) }))
    .filter(({ data }) => {
      const expires = data.cookie?.expires;
      return !expires || new Date(expires).getTime() > now;
    });
};

export const disconnectSessionSockets = async (
  io: SocketIOServer | undefined,
  userId: number,
  sids: string[]
): Promise<void> => {
  if (!io || !sids.length) {
    return;
  }

  try {
    const sockets = await io.in(String(userId)).fetchSockets();
    for (const socket of sockets) {
      if (sids.includes(socket.data?.sid)) {
        socket.emit('sessionRevoked');
        socket.disconnect(true);
      }
    }
  } catch (e) {
    logger.debug('Failed to disconnect sockets for revoked sessions', {
      label: 'Sessions',
      userId,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
  }
};

const softDeleteSessions = async (
  userId: number,
  sessions: Pick<Session, 'id' | 'json'>[],
  io?: SocketIOServer
): Promise<number> => {
  if (!sessions.length) {
    return 0;
  }

  const sids = sessions.map((session) => session.id);
  const pushEndpoints = sessions
    .map((session) => parseSessionData(session.json).pushEndpoint)
    .filter((endpoint): endpoint is string => !!endpoint);

  await getRepository(Session).softDelete({ id: In(sids) });
  // Revoked devices can't unsubscribe themselves, so stop pushing to them here
  if (pushEndpoints.length) {
    // A browser keeps its endpoint across sign-ins, so spare ones still in use
    const inUse = new Set(
      (await getLiveSessions(userId)).map(({ data }) => data.pushEndpoint)
    );
    const orphaned = pushEndpoints.filter((endpoint) => !inUse.has(endpoint));

    if (orphaned.length) {
      await getRepository(UserPushSubscription).delete({
        user: { id: userId },
        endpoint: In(orphaned),
      });
    }
  }
  await disconnectSessionSockets(io, userId, sids);

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
  }: {
    reason: SessionRevokeReason;
    revokedByUserId?: number;
    exceptSid?: string;
    publicIds?: string[];
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
    io
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
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve()))
  );
  req.session.userId = user.id;
  req.session.meta = {
    createdAt: new Date().toISOString(),
    ...(getSettings().network.sessionIpTracking && req.ip
      ? { ip: req.ip }
      : {}),
    userAgent: req.get('user-agent')?.slice(0, 512),
    loginMethod,
  };

  await enforceSessionCap(user.id, req.app.get('io'));
};

export const listUserSessions = async (
  userId: number,
  currentSid: string | undefined
): Promise<UserSessionResponse[]> => {
  const showIp = getSettings().network.sessionIpTracking;
  const sessions = await getLiveSessions(userId);

  return sessions.map(({ session, data: { meta } }) => ({
    id: toPublicSessionId(session.id),
    current: session.id === currentSid,
    createdAt: meta?.createdAt ? new Date(meta.createdAt) : null,
    lastActiveAt: new Date(
      Number(session.expiredAt) - SESSION_TTL_SECONDS * 1000
    ),
    ...(showIp ? { ipAddress: meta?.ip ?? null } : {}),
    userAgent: meta?.userAgent ?? null,
    loginMethod: meta?.loginMethod ?? null,
  }));
};

export const clearSessionIpAddresses = async (): Promise<void> => {
  await getRepository(Session)
    .createQueryBuilder()
    .update()
    .set({ json: () => `json_remove("json", '$.meta.ip')` })
    .where(`json_extract("json", '$.meta.ip') IS NOT NULL`)
    .execute();
};
