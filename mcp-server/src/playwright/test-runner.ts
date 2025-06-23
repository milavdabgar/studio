import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface TestRunOptions {
  testFile?: string;
  testName?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  debug?: boolean;
}

export interface TestGenerationOptions {
  url: string;
  testName: string;
  actions: Array<{
    type: 'click' | 'fill' | 'navigate' | 'wait' | 'assert';
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
}

export interface TestRunResult {
  success: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  duration: number;
  failures: Array<{
    test: string;
    error: string;
    location: string;
  }>;
  reportPath?: string;
}

export class PlaywrightTestRunner {
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  async runTests(options: TestRunOptions): Promise<TestRunResult> {
    const args = ['test'];
    
    if (options.testFile) {
      args.push(options.testFile);
    }
    
    if (options.testName) {
      args.push('--grep', options.testName);
    }
    
    if (options.browser) {
      args.push('--project', options.browser);
    }
    
    if (options.headless === false) {
      args.push('--headed');
    }
    
    if (options.debug) {
      args.push('--debug');
    }
    
    args.push('--reporter=json');

    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['playwright', ...args], {
        cwd: this.workspaceRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          const result = this.parseTestOutput(stdout, stderr, code === 0);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse test output: ${error}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run Playwright tests: ${error.message}`));
      });
    });
  }

  private parseTestOutput(stdout: string, stderr: string, success: boolean): TestRunResult {
    let summary = { total: 0, passed: 0, failed: 0, skipped: 0 };
    let failures: Array<{ test: string; error: string; location: string }> = [];
    let duration = 0;

    try {
      // Try to parse JSON output
      const lines = stdout.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.stats) {
            summary = {
              total: data.stats.total || 0,
              passed: data.stats.passed || 0,
              failed: data.stats.failed || 0,
              skipped: data.stats.skipped || 0,
            };
            duration = data.stats.duration || 0;
          }
          if (data.errors) {
            failures = data.errors.map((error: any) => ({
              test: error.title || 'Unknown test',
              error: error.message || 'Unknown error',
              location: error.location || 'Unknown location',
            }));
          }
        } catch {
          // Skip lines that aren't JSON
        }
      }
    } catch (error) {
      // Fallback to stderr parsing
      console.error('Failed to parse JSON output, using stderr:', error);
    }

    return {
      success,
      summary,
      duration,
      failures,
      reportPath: path.join(this.workspaceRoot, 'playwright-report'),
    };
  }

  async generateTest(options: TestGenerationOptions): Promise<string> {
    const testCode = this.generateTestCode(options);
    const testFileName = `${options.testName.replace(/\s+/g, '-').toLowerCase()}.spec.ts`;
    const testFilePath = path.join(this.workspaceRoot, 'e2e', testFileName);
    
    await fs.writeFile(testFilePath, testCode);
    
    return `Test generated and saved to: ${testFilePath}\n\n${testCode}`;
  }

  private generateTestCode(options: TestGenerationOptions): string {
    const { url, testName, actions } = options;
    
    let testCode = `import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  // Navigate to the page
  await page.goto('${url}');
  
`;

    for (const action of actions) {
      switch (action.type) {
        case 'navigate':
          testCode += `  await page.goto('${action.value}');\n`;
          break;
        case 'click':
          testCode += `  await page.click('${action.selector}');\n`;
          break;
        case 'fill':
          testCode += `  await page.fill('${action.selector}', '${action.value}');\n`;
          break;
        case 'wait':
          if (action.selector) {
            testCode += `  await page.waitForSelector('${action.selector}'${action.timeout ? `, { timeout: ${action.timeout} }` : ''});\n`;
          } else {
            testCode += `  await page.waitForTimeout(${action.timeout || 1000});\n`;
          }
          break;
        case 'assert':
          if (action.selector) {
            testCode += `  await expect(page.locator('${action.selector}')).toBeVisible();\n`;
            if (action.value) {
              testCode += `  await expect(page.locator('${action.selector}')).toContainText('${action.value}');\n`;
            }
          }
          break;
      }
    }

    testCode += `});
`;
    
    return testCode;
  }

  async listTestFiles(options: { pattern?: string } = {}): Promise<string[]> {
    const testDir = path.join(this.workspaceRoot, 'e2e');
    
    try {
      const files = await fs.readdir(testDir);
      let testFiles = files.filter(file => file.endsWith('.spec.ts') || file.endsWith('.spec.js'));
      
      if (options.pattern) {
        const regex = new RegExp(options.pattern, 'i');
        testFiles = testFiles.filter(file => regex.test(file));
      }
      
      return testFiles.map(file => path.join(testDir, file));
    } catch (error) {
      console.error('Failed to list test files:', error);
      return [];
    }
  }
}
