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
import * as fs from 'fs';
import * as path from 'path';

// Test generation schemas
const TestGenerationSchema = z.object({
  filePath: z.string(),
  testType: z.enum(['unit', 'integration', 'e2e']),
  framework: z.enum(['jest', 'vitest', 'mocha', 'playwright']),
  includeSetup: z.boolean().default(true),
  includeTeardown: z.boolean().default(true),
  mockDependencies: z.boolean().default(true),
});

const GeneratedTestSchema = z.object({
  testFilePath: z.string(),
  testContent: z.string(),
  framework: z.string(),
  coverage: z.object({
    functions: z.array(z.string()),
    classes: z.array(z.string()),
    exports: z.array(z.string()),
  }),
  dependencies: z.array(z.string()),
  setup: z.string().optional(),
  teardown: z.string().optional(),
});

type TestGeneration = z.infer<typeof TestGenerationSchema>;
type GeneratedTest = z.infer<typeof GeneratedTestSchema>;

class SimpleTestGenerator {
  private extractExports(code: string): { functions: string[], classes: string[], components: string[] } {
    const functions: string[] = [];
    const classes: string[] = [];
    const components: string[] = [];
    
    // Simple regex-based extraction (more reliable than AST parsing for now)
    const exportFunctionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    const exportConstFunctionRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    const exportArrowFunctionRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
    const exportClassRegex = /export\s+(?:default\s+)?class\s+(\w+)/g;
    const exportDefaultRegex = /export\s+default\s+(?:function\s+)?(\w+)/g;
    
    // Extract functions
    let match;
    while ((match = exportFunctionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    while ((match = exportConstFunctionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    while ((match = exportArrowFunctionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    // Extract classes
    while ((match = exportClassRegex.exec(code)) !== null) {
      classes.push(match[1]);
    }
    
    // Extract default exports
    while ((match = exportDefaultRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }
    
    // Detect React components (functions that start with capital letter and contain JSX)
    const componentRegex = /export\s+(?:const\s+|function\s+)?([A-Z]\w+)/g;
    if (code.includes('jsx') || code.includes('tsx') || code.includes('<')) {
      while ((match = componentRegex.exec(code)) !== null) {
        components.push(match[1]);
      }
    }
    
    return {
      functions: [...new Set(functions)],
      classes: [...new Set(classes)],
      components: [...new Set(components)]
    };
  }

  private generateJestUnitTest(filePath: string, exports: { functions: string[], classes: string[], components: string[] }): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    const importPath = `./${fileName}`;
    
    let testContent = `import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';\n`;
    
    // Add imports
    const allExports = [...exports.functions, ...exports.classes, ...exports.components];
    if (allExports.length > 0) {
      testContent += `import { ${allExports.join(', ')} } from '${importPath}';\n`;
    }
    
    // Add React testing library if components are present
    if (exports.components.length > 0) {
      testContent += `import { render, screen, fireEvent } from '@testing-library/react';\n`;
      testContent += `import '@testing-library/jest-dom';\n`;
    }
    
    testContent += `\n`;
    
    // Generate describe block
    testContent += `describe('${fileName}', () => {\n`;
    
    // Add setup and teardown
    testContent += `  beforeEach(() => {\n`;
    testContent += `    jest.clearAllMocks();\n`;
    testContent += `  });\n\n`;
    
    testContent += `  afterEach(() => {\n`;
    testContent += `    jest.restoreAllMocks();\n`;
    testContent += `  });\n\n`;
    
    // Generate tests for functions
    exports.functions.forEach(func => {
      testContent += `  describe('${func}', () => {\n`;
      testContent += `    it('should be defined', () => {\n`;
      testContent += `      expect(${func}).toBeDefined();\n`;
      testContent += `      expect(typeof ${func}).toBe('function');\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should execute without throwing', () => {\n`;
      testContent += `      expect(() => ${func}()).not.toThrow();\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should handle different inputs', () => {\n`;
      testContent += `      // Test with various inputs\n`;
      testContent += `      expect(() => ${func}(null)).not.toThrow();\n`;
      testContent += `      expect(() => ${func}(undefined)).not.toThrow();\n`;
      testContent += `      expect(() => ${func}('')).not.toThrow();\n`;
      testContent += `    });\n`;
      testContent += `  });\n\n`;
    });
    
    // Generate tests for classes
    exports.classes.forEach(cls => {
      testContent += `  describe('${cls}', () => {\n`;
      testContent += `    let instance: ${cls};\n\n`;
      
      testContent += `    beforeEach(() => {\n`;
      testContent += `      instance = new ${cls}();\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should be instantiated', () => {\n`;
      testContent += `      expect(instance).toBeInstanceOf(${cls});\n`;
      testContent += `      expect(instance).toBeDefined();\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should have expected methods', () => {\n`;
      testContent += `      expect(instance.constructor).toBe(${cls});\n`;
      testContent += `    });\n`;
      testContent += `  });\n\n`;
    });
    
    // Generate tests for React components
    exports.components.forEach(component => {
      testContent += `  describe('${component}', () => {\n`;
      testContent += `    it('should render without crashing', () => {\n`;
      testContent += `      render(<${component} />);\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should be in the document', () => {\n`;
      testContent += `      render(<${component} />);\n`;
      testContent += `      // Add specific assertions based on component content\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should handle props correctly', () => {\n`;
      testContent += `      const testProps = { testProp: 'test-value' };\n`;
      testContent += `      render(<${component} {...testProps} />);\n`;
      testContent += `      // Add prop-specific assertions\n`;
      testContent += `    });\n\n`;
      
      testContent += `    it('should handle user interactions', () => {\n`;
      testContent += `      render(<${component} />);\n`;
      testContent += `      // Add interaction tests (clicks, form inputs, etc.)\n`;
      testContent += `    });\n`;
      testContent += `  });\n\n`;
    });
    
    testContent += `});\n`;
    
    return testContent;
  }

  private generatePlaywrightE2ETest(filePath: string, exports: { functions: string[], classes: string[], components: string[] }): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    let testContent = `import { test, expect } from '@playwright/test';\n\n`;
    
    testContent += `test.describe('${fileName} E2E Tests', () => {\n`;
    
    testContent += `  test.beforeEach(async ({ page }) => {\n`;
    testContent += `    // Navigate to the page containing this component/feature\n`;
    testContent += `    await page.goto('/'); // Update with actual URL\n`;
    testContent += `  });\n\n`;
    
    exports.components.forEach(component => {
      testContent += `  test('${component} should be interactive', async ({ page }) => {\n`;
      testContent += `    // Test ${component} component interaction\n`;
      testContent += `    const element = page.locator('[data-testid="${component.toLowerCase()}"]');\n`;
      testContent += `    await expect(element).toBeVisible();\n`;
      testContent += `    \n`;
      testContent += `    // Test interactions\n`;
      testContent += `    await element.click();\n`;
      testContent += `    \n`;
      testContent += `    // Add specific E2E test assertions\n`;
      testContent += `    await expect(page).toHaveTitle(/.*/);\n`;
      testContent += `  });\n\n`;
    });
    
    exports.functions.forEach(func => {
      testContent += `  test('${func} functionality should work end-to-end', async ({ page }) => {\n`;
      testContent += `    // Test ${func} in a real browser environment\n`;
      testContent += `    await page.evaluate(() => {\n`;
      testContent += `      // Call the function in browser context\n`;
      testContent += `      // Add appropriate test logic\n`;
      testContent += `    });\n`;
      testContent += `  });\n\n`;
    });
    
    testContent += `});\n`;
    
    return testContent;
  }

  async generateTests(options: TestGeneration): Promise<GeneratedTest> {
    const { filePath, testType, framework, includeSetup, includeTeardown, mockDependencies } = options;
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const code = fs.readFileSync(filePath, 'utf8');
    const exports = this.extractExports(code);
    
    let testContent = '';
    let testFilePath = '';
    
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    switch (testType) {
      case 'unit':
      case 'integration':
        testFilePath = path.join(dir, `${fileName}.test.ts`);
        if (framework === 'jest') {
          testContent = this.generateJestUnitTest(filePath, exports);
        }
        break;
      
      case 'e2e':
        testFilePath = path.join(dir, `${fileName}.e2e.spec.ts`);
        if (framework === 'playwright') {
          testContent = this.generatePlaywrightE2ETest(filePath, exports);
        }
        break;
    }
    
    const allExports = [...exports.functions, ...exports.classes, ...exports.components];
    
    return {
      testFilePath,
      testContent,
      framework,
      coverage: {
        functions: exports.functions,
        classes: exports.classes,
        exports: allExports,
      },
      dependencies: allExports,
      setup: includeSetup ? 'beforeEach setup included' : undefined,
      teardown: includeTeardown ? 'afterEach teardown included' : undefined,
    };
  }
}

// Server implementation
const server = new Server(
  {
    name: 'test-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const testGenerator = new SimpleTestGenerator();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_tests',
        description: 'Generate tests for a given file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to generate tests for',
            },
            testType: {
              type: 'string',
              enum: ['unit', 'integration', 'e2e'],
              description: 'Type of tests to generate',
            },
            framework: {
              type: 'string',
              enum: ['jest', 'vitest', 'mocha', 'playwright'],
              description: 'Testing framework to use',
            },
            includeSetup: {
              type: 'boolean',
              description: 'Include setup/teardown code',
              default: true,
            },
            includeTeardown: {
              type: 'boolean',
              description: 'Include teardown code',
              default: true,
            },
            mockDependencies: {
              type: 'boolean',
              description: 'Generate mocks for dependencies',
              default: true,
            },
          },
          required: ['filePath', 'testType', 'framework'],
        },
      },
      {
        name: 'analyze_testability',
        description: 'Analyze a file for testability and suggest improvements',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to analyze',
            },
          },
          required: ['filePath'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_tests': {
        const options = TestGenerationSchema.parse(args);
        const result = await testGenerator.generateTests(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'analyze_testability': {
        const { filePath } = args as { filePath: string };
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }
        
        const code = fs.readFileSync(filePath, 'utf8');
        const exports = testGenerator['extractExports'](code);
        
        const analysis = {
          testability: exports.functions.length + exports.classes.length + exports.components.length > 0 ? 'good' : 'poor',
          suggestions: [
            'Consider adding more exported functions for better testability',
            'Add data-testid attributes to React components',
            'Keep functions pure when possible for easier testing',
            'Consider splitting large components into smaller, testable units'
          ],
          exportedFunctions: exports.functions.length,
          exportedClasses: exports.classes.length,
          exportedComponents: exports.components.length,
          totalTestableItems: exports.functions.length + exports.classes.length + exports.components.length,
          items: exports,
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Error: ${error}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});