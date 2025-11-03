export enum NotificationType {
  NONE = 0,
  TEST_NOTIFICATION = 32,
  INVITE_REDEEMED = 64,
  INVITE_EXPIRED = 128,
  USER_CREATED = 256,
  LOCAL_MESSAGE = 512,
  NEW_EVENT = 1024,
  SYSTEM = 2048,
  UPDATES = 4096,
  FRIEND_WATCHING = 8192,
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
