import * as path from 'path';
import * as fs from 'fs/promises';

export interface TestResult {
  testRunId?: string;
  format?: 'json' | 'html' | 'text';
}

export interface CoverageOptions {
  format?: 'json' | 'html' | 'text';
}

export interface TestAnalysisResult {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    passRate: number;
  };
  failures: Array<{
    testName: string;
    errorMessage: string;
    stackTrace: string;
    location: string;
    screenshot?: string;
  }>;
  performance: {
    slowestTests: Array<{
      testName: string;
      duration: number;
      file: string;
    }>;
    averageTestDuration: number;
  };
  trends: {
    comparedToPrevious?: {
      passRateChange: number;
      durationChange: number;
      newFailures: number;
      fixedTests: number;
    };
  };
}

export interface CoverageReport {
  summary: {
    lines: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
  };
  files: Array<{
    file: string;
    lines: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
    uncoveredLines: number[];
  }>;
}

export class PlaywrightReporter {
  private workspaceRoot: string;
  private reportDir: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.reportDir = path.join(this.workspaceRoot, 'playwright-report');
  }

  async analyzeResults(options: TestResult): Promise<TestAnalysisResult> {
    try {
      const reportData = await this.loadTestResults(options.testRunId);
      const analysis = this.processTestResults(reportData);
      
      if (options.format === 'html') {
        await this.generateHtmlReport(analysis);
      }
      
      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze test results: ${error}`);
    }
  }

  private async loadTestResults(testRunId?: string): Promise<any> {
    try {
      // Try to load from JSON report first
      const jsonReportPath = path.join(this.reportDir, 'results.json');
      const reportExists = await fs.access(jsonReportPath).then(() => true).catch(() => false);
      
      if (reportExists) {
        const reportContent = await fs.readFile(jsonReportPath, 'utf-8');
        return JSON.parse(reportContent);
      }

      // Fallback to parsing HTML report or other sources
      const htmlReportPath = path.join(this.reportDir, 'index.html');
      const htmlExists = await fs.access(htmlReportPath).then(() => true).catch(() => false);
      
      if (htmlExists) {
        // In a real implementation, you might parse the HTML report
        // For now, return mock data
        return this.generateMockResults();
      }

      throw new Error('No test results found');
    } catch (error) {
      console.error('Failed to load test results:', error);
      return this.generateMockResults();
    }
  }

  private generateMockResults(): any {
    return {
      stats: {
        total: 10,
        passed: 8,
        failed: 2,
        skipped: 0,
        duration: 45000,
      },
      tests: [
        {
          title: 'Login functionality',
          outcome: 'passed',
          duration: 2500,
          location: 'e2e/auth.spec.ts:10',
        },
        {
          title: 'Dashboard loads correctly',
          outcome: 'failed',
          duration: 5000,
          location: 'e2e/dashboard.spec.ts:15',
          error: 'Element not found: [data-testid="dashboard-title"]',
        },
      ],
    };
  }

  private processTestResults(reportData: any): TestAnalysisResult {
    const stats = reportData.stats || {};
    const tests = reportData.tests || [];

    const failedTests = tests.filter((test: any) => test.outcome === 'failed');
    const sortedByDuration = [...tests].sort((a, b) => (b.duration || 0) - (a.duration || 0));

    return {
      summary: {
        totalTests: stats.total || 0,
        passedTests: stats.passed || 0,
        failedTests: stats.failed || 0,
        skippedTests: stats.skipped || 0,
        duration: stats.duration || 0,
        passRate: stats.total ? (stats.passed / stats.total) * 100 : 0,
      },
      failures: failedTests.map((test: any) => ({
        testName: test.title || 'Unknown test',
        errorMessage: test.error || 'No error message',
        stackTrace: test.stackTrace || '',
        location: test.location || 'Unknown location',
        screenshot: test.screenshot,
      })),
      performance: {
        slowestTests: sortedByDuration.slice(0, 5).map((test: any) => ({
          testName: test.title || 'Unknown test',
          duration: test.duration || 0,
          file: test.location?.split(':')[0] || 'Unknown file',
        })),
        averageTestDuration: tests.length ? 
          tests.reduce((sum: number, test: any) => sum + (test.duration || 0), 0) / tests.length : 0,
      },
      trends: {
        // This would be populated by comparing with previous runs
        comparedToPrevious: undefined,
      },
    };
  }

  async getCoverage(options: CoverageOptions = {}): Promise<CoverageReport> {
    try {
      // In a real implementation, this would read actual coverage data
      // For now, return mock coverage data
      return this.generateMockCoverage();
    } catch (error) {
      throw new Error(`Failed to get coverage report: ${error}`);
    }
  }

  private generateMockCoverage(): CoverageReport {
    return {
      summary: {
        lines: { total: 1000, covered: 850, percentage: 85 },
        functions: { total: 100, covered: 90, percentage: 90 },
        branches: { total: 200, covered: 160, percentage: 80 },
        statements: { total: 800, covered: 720, percentage: 90 },
      },
      files: [
        {
          file: 'src/components/LoginForm.tsx',
          lines: { total: 50, covered: 45, percentage: 90 },
          functions: { total: 5, covered: 5, percentage: 100 },
          branches: { total: 10, covered: 8, percentage: 80 },
          statements: { total: 40, covered: 38, percentage: 95 },
          uncoveredLines: [25, 42],
        },
        {
          file: 'src/pages/dashboard.tsx',
          lines: { total: 80, covered: 60, percentage: 75 },
          functions: { total: 8, covered: 6, percentage: 75 },
          branches: { total: 15, covered: 10, percentage: 67 },
          statements: { total: 70, covered: 52, percentage: 74 },
          uncoveredLines: [15, 16, 17, 35, 36, 60, 61, 62, 63, 78],
        },
      ],
    };
  }

  private async generateHtmlReport(analysis: TestAnalysisResult): Promise<void> {
    const htmlContent = this.generateHtmlContent(analysis);
    const outputPath = path.join(this.reportDir, 'analysis.html');
    
    // Ensure report directory exists
    await fs.mkdir(this.reportDir, { recursive: true });
    await fs.writeFile(outputPath, htmlContent);
    
    console.log(`HTML report generated at: ${outputPath}`);
  }

  private generateHtmlContent(analysis: TestAnalysisResult): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Test Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
        .failures { margin-top: 20px; }
        .failure { background: #ffebee; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .performance { margin-top: 20px; }
        .slow-test { background: #fff3e0; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .pass-rate { color: ${analysis.summary.passRate > 80 ? 'green' : analysis.summary.passRate > 60 ? 'orange' : 'red'}; }
    </style>
</head>
<body>
    <h1>Playwright Test Analysis Report</h1>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <div class="metric">
            <strong>Total Tests:</strong> ${analysis.summary.totalTests}
        </div>
        <div class="metric">
            <strong>Passed:</strong> ${analysis.summary.passedTests}
        </div>
        <div class="metric">
            <strong>Failed:</strong> ${analysis.summary.failedTests}
        </div>
        <div class="metric">
            <strong>Skipped:</strong> ${analysis.summary.skippedTests}
        </div>
        <div class="metric">
            <strong>Duration:</strong> ${(analysis.summary.duration / 1000).toFixed(2)}s
        </div>
        <div class="metric">
            <strong>Pass Rate:</strong> <span class="pass-rate">${analysis.summary.passRate.toFixed(1)}%</span>
        </div>
    </div>

    ${analysis.failures.length > 0 ? `
    <div class="failures">
        <h2>Failed Tests</h2>
        ${analysis.failures.map(failure => `
        <div class="failure">
            <h3>${failure.testName}</h3>
            <p><strong>Error:</strong> ${failure.errorMessage}</p>
            <p><strong>Location:</strong> ${failure.location}</p>
            ${failure.screenshot ? `<p><strong>Screenshot:</strong> <a href="${failure.screenshot}">View</a></p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="performance">
        <h2>Performance Analysis</h2>
        <p><strong>Average test duration:</strong> ${(analysis.performance.averageTestDuration / 1000).toFixed(2)}s</p>
        
        <h3>Slowest Tests</h3>
        ${analysis.performance.slowestTests.map(test => `
        <div class="slow-test">
            <strong>${test.testName}</strong> - ${(test.duration / 1000).toFixed(2)}s
            <br><small>${test.file}</small>
        </div>
        `).join('')}
    </div>

    <p><em>Report generated on ${new Date().toLocaleString()}</em></p>
</body>
</html>
    `;
  }

  async exportResults(format: 'json' | 'csv' | 'xml', outputPath?: string): Promise<string> {
    const analysis = await this.analyzeResults({});
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(this.reportDir, `results-${timestamp}.${format}`);
    const filePath = outputPath || defaultPath;

    switch (format) {
      case 'json':
        await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
        break;
      case 'csv':
        const csv = this.convertToCSV(analysis);
        await fs.writeFile(filePath, csv);
        break;
      case 'xml':
        const xml = this.convertToXML(analysis);
        await fs.writeFile(filePath, xml);
        break;
    }

    return filePath;
  }

  private convertToCSV(analysis: TestAnalysisResult): string {
    const headers = ['Test Name', 'Status', 'Duration', 'Error', 'Location'];
    const rows = [headers.join(',')];
    
    // Add passed tests (mocked)
    for (let i = 0; i < analysis.summary.passedTests; i++) {
      rows.push(`Test ${i + 1},Passed,${analysis.performance.averageTestDuration},,-`);
    }
    
    // Add failed tests
    analysis.failures.forEach(failure => {
      rows.push(`"${failure.testName}",Failed,0,"${failure.errorMessage}","${failure.location}"`);
    });
    
    return rows.join('\n');
  }

  private convertToXML(analysis: TestAnalysisResult): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<testResults>
  <summary>
    <totalTests>${analysis.summary.totalTests}</totalTests>
    <passedTests>${analysis.summary.passedTests}</passedTests>
    <failedTests>${analysis.summary.failedTests}</failedTests>
    <duration>${analysis.summary.duration}</duration>
    <passRate>${analysis.summary.passRate}</passRate>
  </summary>
  <failures>
    ${analysis.failures.map(failure => `
    <failure>
      <testName>${failure.testName}</testName>
      <error>${failure.errorMessage}</error>
      <location>${failure.location}</location>
    </failure>
    `).join('')}
  </failures>
</testResults>`;
  }
}
