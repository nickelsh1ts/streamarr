import type { PythonServiceStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import { isDocker } from '@server/utils/isDocker';
import axios from 'axios';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { createConnection } from 'net';

const LABEL = 'Plex Sync';
const HEALTH_URL = 'http://localhost:5005/health';
const HEALTH_TIMEOUT = 3000;
const POLL_INTERVAL = 30_000;
const SERVICE_PORT = 5005;

type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

class PythonServiceManager {
  private status: ServiceStatus = 'unknown';
  private lastChecked: Date | null = null;
  private lastHealthy: Date | null = null;
  private consecutiveFailures = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private isRestarting = false;
  private preserveProcesses = false;
  private spawnedPid: number | null = null;

  private markHealthy(): void {
    this.status = 'healthy';
    this.lastChecked = new Date();
    this.lastHealthy = new Date();
    this.consecutiveFailures = 0;
  }

  private tryKill(pid: number, signal: NodeJS.Signals | 0): boolean {
    try {
      process.kill(pid, signal);
      return true;
    } catch {
      return false;
    }
  }

  public prepareForServerRestart(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.spawnedPid = null;
    this.preserveProcesses = true;
  }

  public initialize(): void {
    this.checkHealth();
    this.pollTimer = setInterval(() => this.checkHealth(), POLL_INTERVAL);

    logger.info('Service health monitoring started', { label: LABEL });
  }

  public getStatus(): PythonServiceStatusResponse {
    return {
      status: this.status,
      lastChecked: this.lastChecked?.toISOString() ?? null,
      lastHealthy: this.lastHealthy?.toISOString() ?? null,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  public async restart(): Promise<{ success: boolean; message: string }> {
    if (this.isRestarting) {
      return { success: false, message: 'Restart already in progress' };
    }

    this.isRestarting = true;

    try {
      await this.killExistingProcesses();
      await this.waitForPortFree(SERVICE_PORT, 10);
      this.spawnPythonService();

      const healthy = await this.waitForHealthy(15);

      if (healthy) {
        logger.info('Plex Sync service restarted successfully', {
          label: LABEL,
        });
        return { success: true, message: 'Plex Sync service restarted' };
      } else {
        logger.warn("Plex Sync service couldn't be reached after restart", {
          label: LABEL,
        });
        return {
          success: false,
          message:
            'Plex Sync service process started but health check failed after 15s',
        };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Failed to restart Plex Sync service', {
        label: LABEL,
        message: msg,
      });
      return { success: false, message: msg };
    } finally {
      this.isRestarting = false;
    }
  }


  private async checkHealth(): Promise<void> {
    if (this.isRestarting) return;

    try {
      await axios.get(HEALTH_URL, { timeout: HEALTH_TIMEOUT });

      const wasUnhealthy = this.status === 'unhealthy';
      this.markHealthy();

      if (wasUnhealthy) {
        logger.info('Plex Sync service recovered', { label: LABEL });
      }
    } catch {
      this.consecutiveFailures++;
      this.lastChecked = new Date();

      if (this.consecutiveFailures >= 2 && this.status !== 'unhealthy') {
        this.status = 'unhealthy';
        logger.warn('Plex Sync service is unreachable', { label: LABEL });
      }
    }
  }

  private async killExistingProcesses(): Promise<void> {
    const pidsToKill: number[] = [];

    if (this.spawnedPid && this.tryKill(this.spawnedPid, 'SIGTERM')) {
      pidsToKill.push(this.spawnedPid);
      this.spawnedPid = null;
    }

    for (const pid of this.findPythonServicePids()) {
      if (!pidsToKill.includes(pid) && this.tryKill(pid, 'SIGTERM')) {
        pidsToKill.push(pid);
      }
    }

    if (pidsToKill.length > 0) {
      await this.waitForProcessExit(pidsToKill, 5);
    }
  }

  private findPythonServicePids(): number[] {
    if (existsSync('/proc')) {
      return this.findPidsViaProc();
    }
    return this.findPidsViaPgrep();
  }

  private findPidsViaProc(): number[] {
    try {
      const entries = readdirSync('/proc').filter((e) => /^\d+$/.test(e));
      const pids: number[] = [];

      for (const entry of entries) {
        const pid = parseInt(entry, 10);
        if (pid === process.pid) continue;

        try {
          const cmdline = readFileSync(`/proc/${entry}/cmdline`, 'utf-8');
          if (!cmdline.includes('plex_invite')) continue;
          const exe = cmdline.split('\0')[0].toLowerCase();
          const basename = exe.split('/').pop() ?? '';
          if (
            basename.startsWith('python') ||
            basename.startsWith('gunicorn')
          ) {
            pids.push(pid);
          }
        } catch {
          // Process may have exited between readdir and readFile
        }
      }

      return pids;
    } catch {
      return [];
    }
  }

  private findPidsViaPgrep(): number[] {
    try {
      const output = execSync('pgrep -f plex_invite', {
        encoding: 'utf-8',
        timeout: 3000,
      }).trim();
      if (!output) return [];
      return output
        .split('\n')
        .map((s) => parseInt(s.trim(), 10))
        .filter((pid) => !isNaN(pid) && pid !== process.pid);
    } catch {
      return [];
    }
  }

  private async waitForProcessExit(
    pids: number[],
    gracefulSeconds: number
  ): Promise<void> {
    const deadline = Date.now() + gracefulSeconds * 1000;

    while (Date.now() < deadline) {
      if (pids.every((pid) => !this.tryKill(pid, 0))) {
        return;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    const remaining = pids.filter((pid) => this.tryKill(pid, 0));
    if (remaining.length > 0) {
      remaining.forEach((pid) => this.tryKill(pid, 'SIGKILL'));
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  private async waitForPortFree(
    port: number,
    maxSeconds: number
  ): Promise<void> {
    const deadline = Date.now() + maxSeconds * 1000;

    while (Date.now() < deadline) {
      const inUse = await new Promise<boolean>((resolve) => {
        const sock = createConnection({ port, host: '127.0.0.1' });
        sock.once('connect', () => {
          sock.destroy();
          resolve(true);
        });
        sock.once('error', () => resolve(false));
        sock.setTimeout(500, () => {
          sock.destroy();
          resolve(false);
        });
      });

      if (!inUse) {
        return;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    logger.warn(
      `Port ${port} still in use after ${maxSeconds}s, proceeding anyway`,
      { label: LABEL }
    );
  }

  private spawnPythonService(): void {
    const inDocker = isDocker();

    let command: string;
    let args: string[];
    let cwd: string;

    if (inDocker && process.env.NODE_ENV === 'production') {
      command = './venv/bin/gunicorn';
      args = [
        '--no-control-socket',
        '-w',
        '2',
        '-b',
        `0.0.0.0:${SERVICE_PORT}`,
        'python.plex_invite:app',
      ];
      cwd = process.cwd();
    } else if (process.env.NODE_ENV === 'production') {
      command = 'gunicorn';
      args = [
        '-w',
        '2',
        '-b',
        `0.0.0.0:${SERVICE_PORT}`,
        '--timeout',
        '60',
        '--graceful-timeout',
        '30',
        '--keep-alive',
        '5',
        'plex_invite:app',
      ];
      cwd = `${process.cwd()}/server/python`;
    } else {
      command = 'python3';
      args = ['plex_invite.py'];
      cwd = `${process.cwd()}/server/python`;
    }

    const configDir =
      process.env.CONFIG_DIRECTORY ||
      (inDocker ? '/app/config' : `${process.cwd()}/config`);

    const logDir = `${configDir}/logs`;
    const shellCmd = `CONFIG_DIRECTORY=${configDir} ${command} ${args.join(' ')} > /dev/null 2>>${logDir}/plex-sync-stderr.log & echo $!`;

    try {
      const output = execSync(shellCmd, {
        cwd,
        encoding: 'utf-8',
        timeout: 5000,
      });

      const pid = parseInt(output.trim(), 10);
      if (isNaN(pid) || pid <= 0) {
        throw new Error(`Invalid PID from spawn: ${output.trim()}`);
      }

      this.spawnedPid = pid;
      logger.debug(`Plex Sync service spawned with PID ${pid}`, {
        label: LABEL,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('Failed to spawn Plex Sync service', {
        label: LABEL,
        message: msg,
      });
      throw e;
    }
  }

  private async waitForHealthy(maxAttempts: number): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      if (this.spawnedPid !== null && !this.tryKill(this.spawnedPid, 0)) {
        logger.error(
          `Plex Sync service (PID ${this.spawnedPid}) exited before becoming healthy`,
          { label: LABEL }
        );
        this.spawnedPid = null;
        return false;
      }

      try {
        await axios.get(HEALTH_URL, { timeout: HEALTH_TIMEOUT });
        this.markHealthy();
        return true;
      } catch {
        // Still starting up
      }
    }
    return false;
  }

  public destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.preserveProcesses) {
      this.spawnedPid = null;
      return;
    }

    const killed: number[] = [];

    if (this.spawnedPid && this.tryKill(this.spawnedPid, 'SIGTERM')) {
      killed.push(this.spawnedPid);
      this.spawnedPid = null;
    }

    for (const pid of this.findPythonServicePids()) {
      if (!killed.includes(pid) && this.tryKill(pid, 'SIGTERM')) {
        killed.push(pid);
      }
    }

    if (killed.length > 0) {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        if (killed.every((pid) => !this.tryKill(pid, 0))) return;
      }

      const remaining = killed.filter((pid) => this.tryKill(pid, 0));
      remaining.forEach((pid) => this.tryKill(pid, 'SIGKILL'));
    }
  }
}

const pythonService = new PythonServiceManager();
export default pythonService;
