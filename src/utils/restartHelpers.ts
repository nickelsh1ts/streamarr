import axios from 'axios';

const POLL_INTERVAL = 1000;
const STATUS_ENDPOINT = '/api/v1/status';
const STATUS_TIMEOUT = 2000;
const MAX_DOWN_ATTEMPTS = 15;
const MAX_UP_ATTEMPTS = 30;

/**
 * Two-phase restart polling: waits for the server to go down, then come back up.
 * Phase 1: Poll until the server stops responding (max 15s).
 * Phase 2: Poll until the server responds again (max 30s).
 * @returns true if the server came back up, false if it timed out.
 */
export const waitForRestart = async (): Promise<boolean> => {
  // Phase 1: Wait for the server to go DOWN
  for (let i = 0; i < MAX_DOWN_ATTEMPTS; i++) {
    try {
      await axios.get(STATUS_ENDPOINT, { timeout: STATUS_TIMEOUT });
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    } catch {
      break;
    }
  }

  // Phase 2: Wait for the server to come BACK UP
  for (let i = 0; i < MAX_UP_ATTEMPTS; i++) {
    try {
      await axios.get(STATUS_ENDPOINT, { timeout: STATUS_TIMEOUT });
      await new Promise((r) => setTimeout(r, 1000));
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }

  return false;
};
