import { existsSync } from 'fs';

/**
 * Detect whether the process is running inside a Docker / OCI container.
 */
export function isDocker(): boolean {
  return (
    existsSync('/.dockerenv') ||
    existsSync('/run/.containerenv') ||
    process.env.CONTAINER === 'true'
  );
}
