export enum UserType {
  PLEX = 1,
  LOCAL = 2,
}

export type AccessRevokedReason = 'trial_expired' | 'plex_removed';

export const MAX_SESSIONS_PER_USER = 50;
