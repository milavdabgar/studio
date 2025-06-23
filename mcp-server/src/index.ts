#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PlaywrightTestRunner } from './playwright/test-runner.js';
import { PlaywrightDebugger } from './playwright/debugger.js';
import { PlaywrightReporter } from './playwright/reporter.js';

// Zod schemas for tool arguments
const RunTestSchema = z.object({
  testFile: z.string().optional(),
  testName: z.string().optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
  headless: z.boolean().optional(),
  debug: z.boolean().optional(),
});

const DebugTestSchema = z.object({
  testFile: z.string(),
  testName: z.string().optional(),
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
  breakpoints: z.array(z.number()).optional(),
});

const GenerateTestSchema = z.object({
  url: z.string(),
  testName: z.string(),
  actions: z.array(z.object({
    type: z.enum(['click', 'fill', 'navigate', 'wait', 'assert']),
    selector: z.string().optional(),
    value: z.string().optional(),
    timeout: z.number().optional(),
  })),
});

const AnalyzeTestResultsSchema = z.object({
  testRunId: z.string().optional(),
  format: z.enum(['json', 'html', 'text']).optional(),
});

class PlaywrightMCPServer {
  private server: Server;
  private testRunner: PlaywrightTestRunner;
  private debugger: PlaywrightDebugger;
  private reporter: PlaywrightReporter;

  constructor() {
    this.server = new Server(
      {
        name: 'playwright-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.testRunner = new PlaywrightTestRunner();
    this.debugger = new PlaywrightDebugger();
    this.reporter = new PlaywrightReporter();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'run_playwright_test',
            description: 'Run Playwright tests with specified configuration',
            inputSchema: {
              type: 'object',
              properties: {
                testFile: {
                  type: 'string',
                  description: 'Specific test file to run (optional)',
                },
                testName: {
                  type: 'string',
                  description: 'Specific test name to run (optional)',
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser to run tests on',
                },
                headless: {
                  type: 'boolean',
                  description: 'Run tests in headless mode',
                },
                debug: {
                  type: 'boolean',
                  description: 'Run tests in debug mode',
                },
              },
            },
          },
          {
            name: 'debug_playwright_test',
            description: 'Debug a specific Playwright test with breakpoints',
            inputSchema: {
              type: 'object',
              properties: {
                testFile: {
                  type: 'string',
                  description: 'Test file to debug',
                },
                testName: {
                  type: 'string',
                  description: 'Specific test name to debug (optional)',
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser to debug on',
                },
                breakpoints: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Line numbers to set breakpoints on',
                },
              },
              required: ['testFile'],
            },
          },
          {
            name: 'generate_playwright_test',
            description: 'Generate a new Playwright test based on user actions',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to test',
                },
                testName: {
                  type: 'string',
                  description: 'Name for the generated test',
                },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['click', 'fill', 'navigate', 'wait', 'assert'],
                      },
                      selector: { type: 'string' },
                      value: { type: 'string' },
                      timeout: { type: 'number' },
                    },
                    required: ['type'],
                  },
                  description: 'Array of actions to perform in the test',
                },
              },
              required: ['url', 'testName', 'actions'],
            },
          },
          {
            name: 'analyze_test_results',
            description: 'Analyze and format Playwright test results',
            inputSchema: {
              type: 'object',
              properties: {
                testRunId: {
                  type: 'string',
                  description: 'ID of the test run to analyze (optional)',
                },
                format: {
                  type: 'string',
                  enum: ['json', 'html', 'text'],
                  description: 'Output format for the analysis',
                },
              },
            },
          },
          {
            name: 'get_test_coverage',
            description: 'Get test coverage report for the current test suite',
            inputSchema: {
              type: 'object',
              properties: {
                format: {
                  type: 'string',
                  enum: ['json', 'html', 'text'],
                  description: 'Output format for the coverage report',
                },
              },
            },
          },
          {
            name: 'list_test_files',
            description: 'List all available Playwright test files',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Pattern to filter test files (optional)',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_playwright_test': {
            const parsed = RunTestSchema.parse(args);
            const result = await this.testRunner.runTests(parsed);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'debug_playwright_test': {
            const parsed = DebugTestSchema.parse(args);
            const result = await this.debugger.debugTest(parsed);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'generate_playwright_test': {
            const parsed = GenerateTestSchema.parse(args);
            const result = await this.testRunner.generateTest(parsed);
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          case 'analyze_test_results': {
            const parsed = AnalyzeTestResultsSchema.parse(args);
            const result = await this.reporter.analyzeResults(parsed);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_test_coverage': {
            const result = await this.reporter.getCoverage(args);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'list_test_files': {
            const result = await this.testRunner.listTestFiles(args);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid arguments: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP server running on stdio');
  }
}

const server = new PlaywrightMCPServer();
server.run().catch(console.error);
