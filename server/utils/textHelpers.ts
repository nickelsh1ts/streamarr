/**
 * Truncates a string to a maximum length, appending an ellipsis when the
 * value is shortened. Used to respect the hard limits some notification
 * providers enforce on titles/messages (e.g. Pushover, Telegram, Discord).
 */
export const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1)}\u2026` : value;
