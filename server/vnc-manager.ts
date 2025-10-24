import { spawn, ChildProcess } from 'child_process';
import { WebSocketServer } from 'ws';
import net from 'net';

interface VNCProcesses {
  xvfb: ChildProcess | null;
  vnc: ChildProcess | null;
  websockify: ChildProcess | null;
}

class VNCManager {
  private processes: VNCProcesses = {
    xvfb: null,
    vnc: null,
    websockify: null
  };
  private displayNumber = 99;
  private vncPort = 5900;
  private wsPort = 6080;
  private isRunning = false;

  async start(): Promise<string> {
    if (this.isRunning) {
      console.log('[VNC] Already running, returning existing URL');
      return `ws://localhost:${this.wsPort}`;
    }

    try {
      // Start Xvfb
      console.log(`[VNC] Starting Xvfb on :${this.displayNumber}`);
      this.processes.xvfb = spawn('Xvfb', [
        `:${this.displayNumber}`,
        '-screen', '0', '1920x1080x24',
        '-ac',
        '+extension', 'GLX',
        '+render',
        '-noreset'
      ], {
        stdio: 'pipe',
        detached: false
      });

      this.processes.xvfb.on('error', (err) => {
        console.error('[VNC] Xvfb error:', err);
      });

      this.processes.xvfb.stderr?.on('data', (data) => {
        console.error('[VNC] Xvfb stderr:', data.toString());
      });

      // Wait for Xvfb to start
      await this.sleep(2000);

      // Start x11vnc
      console.log(`[VNC] Starting x11vnc on port ${this.vncPort}`);
      this.processes.vnc = spawn('x11vnc', [
        '-display', `:${this.displayNumber}`,
        '-nopw',
        '-forever',
        '-shared',
        '-rfbport', this.vncPort.toString(),
        '-ncache', '10'
      ], {
        stdio: 'pipe',
        detached: false,
        env: { ...process.env, DISPLAY: `:${this.displayNumber}` }
      });

      this.processes.vnc.on('error', (err) => {
        console.error('[VNC] x11vnc error:', err);
      });

      this.processes.vnc.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('PORT=')) {
          console.log('[VNC] x11vnc ready:', output.trim());
        }
      });

      this.processes.vnc.stderr?.on('data', (data) => {
        console.error('[VNC] x11vnc stderr:', data.toString());
      });

      // Wait for VNC to start
      await this.sleep(2000);
      await this.waitForPort(this.vncPort);

      // Start websockify
      console.log(`[VNC] Starting websockify on port ${this.wsPort}`);
      this.processes.websockify = spawn('websockify', [
        '--web=/node_modules/@novnc/novnc',
        `${this.wsPort}`,
        `localhost:${this.vncPort}`
      ], {
        stdio: 'pipe',
        detached: false
      });

      this.processes.websockify.on('error', (err) => {
        console.error('[VNC] websockify error:', err);
      });

      this.processes.websockify.stdout?.on('data', (data) => {
        console.log('[VNC] websockify:', data.toString().trim());
      });

      this.processes.websockify.stderr?.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('WARNING')) {
          console.error('[VNC] websockify stderr:', output);
        }
      });

      // Wait for websockify to start
      await this.sleep(1000);
      await this.waitForPort(this.wsPort);

      this.isRunning = true;
      console.log(`[VNC] All processes started successfully`);
      console.log(`[VNC] Display: :${this.displayNumber}`);
      console.log(`[VNC] WebSocket URL: ws://localhost:${this.wsPort}`);

      return `ws://localhost:${this.wsPort}`;
    } catch (error) {
      console.error('[VNC] Failed to start VNC stack:', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('[VNC] Stopping all VNC processes');
    
    if (this.processes.websockify) {
      this.processes.websockify.kill('SIGTERM');
      this.processes.websockify = null;
    }

    if (this.processes.vnc) {
      this.processes.vnc.kill('SIGTERM');
      this.processes.vnc = null;
    }

    if (this.processes.xvfb) {
      this.processes.xvfb.kill('SIGTERM');
      this.processes.xvfb = null;
    }

    this.isRunning = false;
    console.log('[VNC] All processes stopped');
  }

  getDisplayNumber(): number {
    return this.displayNumber;
  }

  getWebSocketURL(): string {
    return `ws://localhost:${this.wsPort}`;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private waitForPort(port: number, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkPort = () => {
        const client = new net.Socket();
        
        client.on('connect', () => {
          client.destroy();
          resolve();
        });

        client.on('error', () => {
          client.destroy();
          
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for port ${port}`));
          } else {
            setTimeout(checkPort, 500);
          }
        });

        client.connect(port, 'localhost');
      };

      checkPort();
    });
  }
}

// Singleton instance
export const vncManager = new VNCManager();
