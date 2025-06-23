import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface DebugTestOptions {
  testFile: string;
  testName?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  breakpoints?: number[];
}

export interface DebugSession {
  sessionId: string;
  testFile: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentLine?: number;
  variables?: Record<string, any>;
  stackTrace?: string[];
}

export class PlaywrightDebugger {
  private workspaceRoot: string;
  private activeSessions: Map<string, DebugSession> = new Map();

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  async debugTest(options: DebugTestOptions): Promise<DebugSession> {
    const sessionId = this.generateSessionId();
    const session: DebugSession = {
      sessionId,
      testFile: options.testFile,
      status: 'running',
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Add breakpoints to the test file if specified
      if (options.breakpoints && options.breakpoints.length > 0) {
        await this.addBreakpoints(options.testFile, options.breakpoints);
      }

      const args = ['test', options.testFile, '--debug'];
      
      if (options.testName) {
        args.push('--grep', options.testName);
      }
      
      if (options.browser) {
        args.push('--project', options.browser);
      }

      // Start the debug session
      const debugProcess = spawn('npx', ['playwright', ...args], {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle debug session output
      debugProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.parseDebugOutput(sessionId, output);
      });

      debugProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('Debug session error:', error);
      });

      debugProcess.on('close', (code) => {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.status = code === 0 ? 'completed' : 'failed';
          this.activeSessions.set(sessionId, session);
        }
      });

      // Return initial session state
      return session;
    } catch (error) {
      session.status = 'failed';
      this.activeSessions.set(sessionId, session);
      throw new Error(`Failed to start debug session: ${error}`);
    }
  }

  private generateSessionId(): string {
    return `debug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async addBreakpoints(testFile: string, breakpoints: number[]): Promise<void> {
    try {
      const filePath = path.isAbsolute(testFile) ? testFile : path.join(this.workspaceRoot, testFile);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Add debugger statements at specified line numbers
      for (const lineNumber of breakpoints) {
        if (lineNumber > 0 && lineNumber <= lines.length) {
          const line = lines[lineNumber - 1];
          if (!line.includes('debugger;')) {
            lines[lineNumber - 1] = `  debugger; // Auto-added breakpoint\n${line}`;
          }
        }
      }

      // Write the modified content back
      await fs.writeFile(filePath, lines.join('\n'));
      console.log(`Added breakpoints to ${testFile} at lines: ${breakpoints.join(', ')}`);
    } catch (error) {
      console.error('Failed to add breakpoints:', error);
    }
  }

  private parseDebugOutput(sessionId: string, output: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Parse debug output for useful information
    if (output.includes('Debugger attached')) {
      session.status = 'paused';
    }

    // Look for current line information
    const lineMatch = output.match(/at .*:(\d+):\d+/);
    if (lineMatch) {
      session.currentLine = parseInt(lineMatch[1], 10);
    }

    // Look for variable information (simplified)
    const variableMatch = output.match(/(\w+):\s*(.+)/);
    if (variableMatch) {
      if (!session.variables) session.variables = {};
      session.variables[variableMatch[1]] = variableMatch[2];
    }

    this.activeSessions.set(sessionId, session);
  }

  async getSession(sessionId: string): Promise<DebugSession | undefined> {
    return this.activeSessions.get(sessionId);
  }

  async listActiveSessions(): Promise<DebugSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async stopSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  async stepOver(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      // In a real implementation, this would send commands to the debug adapter
      console.log(`Step over command sent for session ${sessionId}`);
      return true;
    }
    return false;
  }

  async stepInto(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      // In a real implementation, this would send commands to the debug adapter
      console.log(`Step into command sent for session ${sessionId}`);
      return true;
    }
    return false;
  }

  async continue(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'running';
      this.activeSessions.set(sessionId, session);
      console.log(`Continue command sent for session ${sessionId}`);
      return true;
    }
    return false;
  }

  async evaluateExpression(sessionId: string, expression: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'paused') {
      // In a real implementation, this would evaluate the expression in the debug context
      console.log(`Evaluating expression "${expression}" in session ${sessionId}`);
      
      // Mock evaluation based on session variables
      if (session.variables && session.variables[expression]) {
        return session.variables[expression];
      }
      
      return `Expression "${expression}" evaluated in debug context`;
    }
    throw new Error('Session not found or not in paused state');
  }
}
