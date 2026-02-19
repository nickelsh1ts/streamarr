import type { PythonServiceStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import logger from '@server/logger';
import { isDocker } from '@server/utils/isDocker';
import axios from 'axios';
import {
  existsSync,
  readFileSync,
  readdirSync,
  utimesSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { spawn } from 'child_process';
import { createConnection } from 'net';
import path from 'path';

const LABEL = 'Plex Sync';
const HEALTH_URL = 'http://localhost:5005/health';
const HEALTH_TIMEOUT = 3000;
const POLL_INTERVAL = 30_000;
const PID_FILE = path.join(process.cwd(), 'tmp', 'gunicorn.pid');

type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

class PythonServiceManager {
  private status: ServiceStatus = 'unknown';
  private lastChecked: Date | null = null;
  private lastHealthy: Date | null = null;
  private consecutiveFailures = 0;
  private pollTimer: NodeJS.Timeout | null = null;
  private isRestarting = false;
  private preserveProcesses = false;
  private spawnedPids: Set<number> = new Set();

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

  private readPidFile(): number | null {
    try {
      if (!existsSync(PID_FILE)) return null;
      const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
      return pid && !isNaN(pid) ? pid : null;
    } catch {
      return null;
    }
  }

  public prepareForServerRestart(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
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
      if (process.env.NODE_ENV !== 'production') {
        return await this.restartDev();
      }

      const killedPids = this.killExistingProcess();
      if (killedPids.length > 0) {
        await this.waitForProcessExit(killedPids, 5);
        await this.waitForPortFree(5005, 10);
      }

      this.removePidFile();
      this.spawnPythonService();

      const healthy = await this.waitForHealthy(15);

      if (healthy) {
        logger.info('Plex Sync service restarted successfully', {
          label: LABEL,
        });
        return { success: true, message: 'Plex Sync service restarted' };
      } else {
        logger.warn("Plex Sync service restarted but couldn't be reached", {
          label: LABEL,
        });
        return {
          success: true,
          message:
            'Plex Sync service restarted but remains unreachable after 15s',
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

  private async restartDev(): Promise<{ success: boolean; message: string }> {
    const scriptPath = path.join(
      process.cwd(),
      'server',
      'python',
      'plex_invite.py'
    );

    const isRunning = await this.isServiceResponding();

    if (isRunning) {
      if (!existsSync(scriptPath)) {
        return {
          success: false,
          message: `Cannot find ${scriptPath} to trigger reload`,
        };
      }

      const now = new Date();
      utimesSync(scriptPath, now, now);
    } else {
      logger.debug('Plex Sync service is down, spawning new process', {
        label: LABEL,
      });
      this.spawnPythonService();
    }

    const healthy = await this.waitForHealthy(isRunning ? 10 : 15);
    if (healthy) {
      return { success: true, message: 'Plex Sync service restarted' };
    }

    logger.warn(`Plex Sync service not responding after restart`, {
      label: LABEL,
    });
    return {
      success: isRunning,
      message: isRunning
        ? 'Plex Sync service restart triggered but it remains unreachable after 10s'
        : 'Failed to start Plex Sync service',
    };
  }

  private async isServiceResponding(): Promise<boolean> {
    try {
      await axios.get(HEALTH_URL, { timeout: 2000 });
      return true;
    } catch {
      return false;
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

      if (this.consecutiveFailures >= 2) {
        if (this.status !== 'unhealthy') {
          this.status = 'unhealthy';
          logger.warn('Plex Sync service is unreachable', { label: LABEL });
        }
      }
    }
  }

  private killExistingProcess(): number[] {
    const killed: number[] = [];
    const filePid = this.readPidFile();
    if (filePid && this.tryKill(filePid, 'SIGTERM')) {
      killed.push(filePid);
    }

    for (const pid of this.findPythonServicePids()) {
      if (!killed.includes(pid) && this.tryKill(pid, 'SIGTERM')) {
        killed.push(pid);
      }
    }

    return killed;
  }

  private findPythonServicePids(): number[] {
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

  private removePidFile(): void {
    try {
      if (existsSync(PID_FILE)) {
        unlinkSync(PID_FILE);
        logger.debug('Removed stale PID file', { label: LABEL });
      }
    } catch {
      // Non-critical
    }
  }

  private async waitForProcessExit(
    pids: number[],
    gracefulSeconds: number
  ): Promise<void> {
    const start = Date.now();
    const deadline = start + gracefulSeconds * 1000;

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
    const start = Date.now();
    const deadline = start + maxSeconds * 1000;

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
        '--pid',
        PID_FILE,
        '--no-control-socket',
        '-w',
        '2',
        '-b',
        '0.0.0.0:5005',
        'python.plex_invite:app',
      ];
      cwd = process.cwd();
    } else if (process.env.NODE_ENV === 'production') {
      command = 'gunicorn';
      args = [
        '--pid',
        PID_FILE,
        '--no-control-socket',
        '-w',
        '2',
        '-b',
        '0.0.0.0:5005',
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

    const env = {
      ...process.env,
      CONFIG_DIRECTORY:
        process.env.CONFIG_DIRECTORY ||
        (inDocker ? '/app/config' : `${process.cwd()}/config`),
    };

    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'ignore',
      detached: true,
    });

    child.on('error', (e) => {
      logger.error(`Plex Sync service spawn error`, {
        label: LABEL,
        message: e.message || String(e),
      });
    });

    child.unref();
    this.spawnedPids.clear();
    if (child.pid) {
      this.spawnedPids.add(child.pid);
      if (!inDocker && process.env.NODE_ENV !== 'production') {
        try {
          writeFileSync(PID_FILE, String(child.pid));
        } catch {
          // Non-critical
        }
      }
    }

    logger.debug(
      `Plex Sync service started successfully with PID ${child.pid}`,
      { label: LABEL }
    );
  }

  private async waitForHealthy(maxAttempts: number): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 1000));
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
      this.spawnedPids.clear();
      return;
    }

    const killed: number[] = [];
    for (const pid of this.spawnedPids) {
      if (this.tryKill(pid, 'SIGTERM')) killed.push(pid);
    }

    const filePid = this.readPidFile();
    if (
      filePid &&
      !killed.includes(filePid) &&
      this.tryKill(filePid, 'SIGTERM')
    ) {
      killed.push(filePid);
    }

    if (process.env.NODE_ENV === 'production') {
      for (const pid of this.findPythonServicePids()) {
        if (!killed.includes(pid) && this.tryKill(pid, 'SIGTERM')) {
          killed.push(pid);
        }
      }
    }

    if (killed.length > 0) {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        if (killed.every((pid) => !this.tryKill(pid, 0))) break;
      }

      killed.forEach((pid) => this.tryKill(pid, 'SIGKILL'));
    }

    this.spawnedPids.clear();
    this.removePidFile();
  }
}

const pythonService = new PythonServiceManager();
export default pythonService;
