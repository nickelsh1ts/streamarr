export enum NotificationType {
  NONE = 0,
  TEST_NOTIFICATION = 32,
  INVITE_REDEEMED = 64,
  INVITE_EXPIRED = 128,
  USER_CREATED = 256,
  LOCAL_MESSAGE = 512,
  NEW_EVENT = 1024,
  // 2048, 4096, 8192 reserved (previously SYSTEM / UPDATES / FRIEND_WATCHING — unused)
  NEW_INVITE = 16384,
  ACCESS_EXTENSION_REQUESTED = 32768,
  PLEX_ACCESS_LOST = 65536,
}

export enum NotificationSeverity {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ACCENT = 'accent',
}
