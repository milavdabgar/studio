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
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

// Type definitions for Babel parser
declare module '@babel/parser' {
  export function parse(input: string, options?: any): any;
}
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

interface FunctionInfo {
  name: string;
  params: string[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
}

interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: string[];
  isExported: boolean;
}

interface ComponentInfo {
  name: string;
  props: string[];
  hooks: string[];
  isExported: boolean;
}

class TestGenerator {
  private extractFunctions(code: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
      });

      traverse.default(ast, {
        FunctionDeclaration(path) {
          const func = path.node;
          if (func.id) {
            functions.push({
              name: func.id.name,
              params: func.params.map(p => t.isIdentifier(p) ? p.name : 'param'),
              returnType: func.returnType ? 'typed' : 'any',
              isAsync: func.async,
              isExported: this.isExported(path),
            });
          }
        },
        
        FunctionExpression(path) {
          const parent = path.parent;
          if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
            functions.push({
              name: parent.id.name,
              params: path.node.params.map(p => t.isIdentifier(p) ? p.name : 'param'),
              returnType: 'any',
              isAsync: path.node.async,
              isExported: this.isExported(path),
            });
          }
        },
        
        ArrowFunctionExpression(path) {
          const parent = path.parent;
          if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
            functions.push({
              name: parent.id.name,
              params: path.node.params.map(p => t.isIdentifier(p) ? p.name : 'param'),
              returnType: 'any',
              isAsync: path.node.async,
              isExported: this.isExported(path),
            });
          }
        },
      });
    } catch (error) {
      console.error('Error parsing code:', error);
    }

    return functions;
  }

  private extractClasses(code: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
      });

      traverse.default(ast, {
        ClassDeclaration(path) {
          const cls = path.node;
          if (cls.id) {
            const methods: FunctionInfo[] = [];
            const properties: string[] = [];
            
            cls.body.body.forEach(member => {
              if (t.isMethodDefinition(member) && t.isIdentifier(member.key)) {
                methods.push({
                  name: member.key.name,
                  params: member.value.params.map(p => t.isIdentifier(p) ? p.name : 'param'),
                  returnType: 'any',
                  isAsync: member.value.async || false,
                  isExported: false,
                });
              } else if (t.isPropertyDefinition(member) && t.isIdentifier(member.key)) {
                properties.push(member.key.name);
              }
            });
            
            classes.push({
              name: cls.id.name,
              methods,
              properties,
              isExported: this.isExported(path),
            });
          }
        },
      });
    } catch (error) {
      console.error('Error parsing classes:', error);
    }

    return classes;
  }

  private extractComponents(code: string): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    
    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
      });

      traverse.default(ast, {
        FunctionDeclaration(path) {
          const func = path.node;
          if (func.id && this.isReactComponent(path)) {
            const props = this.extractPropsFromFunction(func);
            const hooks = this.extractHooksFromFunction(path);
            
            components.push({
              name: func.id.name,
              props,
              hooks,
              isExported: this.isExported(path),
            });
          }
        },
        
        ArrowFunctionExpression(path) {
          const parent = path.parent;
          if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id) && this.isReactComponent(path)) {
            const props = this.extractPropsFromArrowFunction(path.node);
            const hooks = this.extractHooksFromFunction(path);
            
            components.push({
              name: parent.id.name,
              props,
              hooks,
              isExported: this.isExported(path),
            });
          }
        },
      });
    } catch (error) {
      console.error('Error parsing components:', error);
    }

    return components;
  }

  private isExported(path: any): boolean {
    // Check if function/class is exported
    let current = path;
    while (current) {
      if (current.isExportDefaultDeclaration() || current.isExportNamedDeclaration()) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private isReactComponent(path: any): boolean {
    // Simple heuristic: contains JSX or returns JSX
    let hasJSX = false;
    
    path.traverse({
      JSXElement() {
        hasJSX = true;
      },
      JSXFragment() {
        hasJSX = true;
      },
    });
    
    return hasJSX;
  }

  private extractPropsFromFunction(func: t.FunctionDeclaration): string[] {
    const props: string[] = [];
    
    if (func.params.length > 0) {
      const firstParam = func.params[0];
      if (t.isObjectPattern(firstParam)) {
        firstParam.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push(prop.key.name);
          }
        });
      } else if (t.isIdentifier(firstParam)) {
        props.push(firstParam.name);
      }
    }
    
    return props;
  }

  private extractPropsFromArrowFunction(func: t.ArrowFunctionExpression): string[] {
    const props: string[] = [];
    
    if (func.params.length > 0) {
      const firstParam = func.params[0];
      if (t.isObjectPattern(firstParam)) {
        firstParam.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push(prop.key.name);
          }
        });
      } else if (t.isIdentifier(firstParam)) {
        props.push(firstParam.name);
      }
    }
    
    return props;
  }

  private extractHooksFromFunction(path: any): string[] {
    const hooks: string[] = [];
    
    path.traverse({
      CallExpression(callPath: any) {
        if (t.isIdentifier(callPath.node.callee) && callPath.node.callee.name.startsWith('use')) {
          hooks.push(callPath.node.callee.name);
        }
      },
    });
    
    return [...new Set(hooks)];
  }

  private generateJestUnitTest(
    filePath: string,
    functions: FunctionInfo[],
    classes: ClassInfo[],
    components: ComponentInfo[]
  ): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    const importPath = `./${fileName}`;
    
    let testContent = `import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';\n`;
    
    // Add imports based on what we're testing
    if (functions.length > 0) {
      const exportedFunctions = functions.filter(f => f.isExported).map(f => f.name);
      if (exportedFunctions.length > 0) {
        testContent += `import { ${exportedFunctions.join(', ')} } from '${importPath}';\n`;
      }
    }
    
    if (classes.length > 0) {
      const exportedClasses = classes.filter(c => c.isExported).map(c => c.name);
      if (exportedClasses.length > 0) {
        testContent += `import { ${exportedClasses.join(', ')} } from '${importPath}';\n`;
      }
    }
    
    if (components.length > 0) {
      testContent += `import { render, screen, fireEvent } from '@testing-library/react';\n`;
      testContent += `import { jest } from '@jest/globals';\n`;
      
      const exportedComponents = components.filter(c => c.isExported).map(c => c.name);
      if (exportedComponents.length > 0) {
        testContent += `import { ${exportedComponents.join(', ')} } from '${importPath}';\n`;
      }
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
    functions.forEach(func => {
      if (func.isExported) {
        testContent += `  describe('${func.name}', () => {\n`;
        testContent += `    it('should be defined', () => {\n`;
        testContent += `      expect(${func.name}).toBeDefined();\n`;
        testContent += `    });\n\n`;
        
        if (func.isAsync) {
          testContent += `    it('should handle async execution', async () => {\n`;
          testContent += `      const result = await ${func.name}(${func.params.map(() => 'mockValue').join(', ')});\n`;
          testContent += `      expect(result).toBeDefined();\n`;
          testContent += `    });\n\n`;
        } else {
          testContent += `    it('should return expected result', () => {\n`;
          testContent += `      const result = ${func.name}(${func.params.map(() => 'mockValue').join(', ')});\n`;
          testContent += `      expect(result).toBeDefined();\n`;
          testContent += `    });\n\n`;
        }
        
        testContent += `    it('should handle edge cases', () => {\n`;
        testContent += `      expect(() => ${func.name}(${func.params.map(() => 'null').join(', ')})).not.toThrow();\n`;
        testContent += `    });\n`;
        testContent += `  });\n\n`;
      }
    });
    
    // Generate tests for classes
    classes.forEach(cls => {
      if (cls.isExported) {
        testContent += `  describe('${cls.name}', () => {\n`;
        testContent += `    let instance: ${cls.name};\n\n`;
        
        testContent += `    beforeEach(() => {\n`;
        testContent += `      instance = new ${cls.name}();\n`;
        testContent += `    });\n\n`;
        
        testContent += `    it('should be instantiated', () => {\n`;
        testContent += `      expect(instance).toBeInstanceOf(${cls.name});\n`;
        testContent += `    });\n\n`;
        
        cls.methods.forEach(method => {
          testContent += `    it('should have ${method.name} method', () => {\n`;
          testContent += `      expect(instance.${method.name}).toBeDefined();\n`;
          testContent += `      expect(typeof instance.${method.name}).toBe('function');\n`;
          testContent += `    });\n\n`;
        });
        
        testContent += `  });\n\n`;
      }
    });
    
    // Generate tests for React components
    components.forEach(component => {
      if (component.isExported) {
        testContent += `  describe('${component.name}', () => {\n`;
        testContent += `    it('should render without crashing', () => {\n`;
        testContent += `      render(<${component.name} />);\n`;
        testContent += `    });\n\n`;
        
        if (component.props.length > 0) {
          testContent += `    it('should accept props', () => {\n`;
          testContent += `      const props = { ${component.props.map(p => `${p}: 'test'`).join(', ')} };\n`;
          testContent += `      render(<${component.name} {...props} />);\n`;
          testContent += `    });\n\n`;
        }
        
        if (component.hooks.includes('useState')) {
          testContent += `    it('should handle state changes', () => {\n`;
          testContent += `      render(<${component.name} />);\n`;
          testContent += `      // Add specific state testing logic here\n`;
          testContent += `    });\n\n`;
        }
        
        if (component.hooks.includes('useEffect')) {
          testContent += `    it('should handle side effects', () => {\n`;
          testContent += `      render(<${component.name} />);\n`;
          testContent += `      // Add specific effect testing logic here\n`;
          testContent += `    });\n\n`;
        }
        
        testContent += `  });\n\n`;
      }
    });
    
    testContent += `});\n`;
    
    return testContent;
  }

  private generatePlaywrightE2ETest(filePath: string, components: ComponentInfo[]): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    let testContent = `import { test, expect } from '@playwright/test';\n\n`;
    
    testContent += `test.describe('${fileName} E2E Tests', () => {\n`;
    
    testContent += `  test.beforeEach(async ({ page }) => {\n`;
    testContent += `    await page.goto('/'); // Adjust URL as needed\n`;
    testContent += `  });\n\n`;
    
    components.forEach(component => {
      if (component.isExported) {
        testContent += `  test('${component.name} should be interactive', async ({ page }) => {\n`;
        testContent += `    // Test ${component.name} component interaction\n`;
        testContent += `    await expect(page.locator('[data-testid="${component.name.toLowerCase()}"]')).toBeVisible();\n`;
        
        if (component.props.includes('onClick') || component.hooks.includes('useState')) {
          testContent += `    await page.locator('[data-testid="${component.name.toLowerCase()}"]').click();\n`;
          testContent += `    // Add assertions for click behavior\n`;
        }
        
        testContent += `  });\n\n`;
      }
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
    const functions = this.extractFunctions(code);
    const classes = this.extractClasses(code);
    const components = this.extractComponents(code);
    
    let testContent = '';
    let testFilePath = '';
    
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    switch (testType) {
      case 'unit':
        testFilePath = path.join(dir, `${fileName}.test.ts`);
        if (framework === 'jest') {
          testContent = this.generateJestUnitTest(filePath, functions, classes, components);
        }
        break;
      
      case 'e2e':
        testFilePath = path.join(dir, `${fileName}.e2e.spec.ts`);
        if (framework === 'playwright') {
          testContent = this.generatePlaywrightE2ETest(filePath, components);
        }
        break;
      
      case 'integration':
        testFilePath = path.join(dir, `${fileName}.integration.test.ts`);
        testContent = this.generateJestUnitTest(filePath, functions, classes, components);
        break;
    }
    
    const dependencies = [
      ...functions.map(f => f.name),
      ...classes.map(c => c.name),
      ...components.map(c => c.name),
    ];
    
    return {
      testFilePath,
      testContent,
      framework,
      coverage: {
        functions: functions.filter(f => f.isExported).map(f => f.name),
        classes: classes.filter(c => c.isExported).map(c => c.name),
        exports: [...functions, ...classes, ...components].filter(item => item.isExported).map(item => item.name),
      },
      dependencies,
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

const testGenerator = new TestGenerator();

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
        const functions = testGenerator['extractFunctions'](code);
        const classes = testGenerator['extractClasses'](code);
        const components = testGenerator['extractComponents'](code);
        
        const analysis = {
          testability: 'good',
          suggestions: [],
          functions: functions.length,
          classes: classes.length,
          components: components.length,
          exportedItems: [
            ...functions.filter(f => f.isExported).map(f => f.name),
            ...classes.filter(c => c.isExported).map(c => c.name),
            ...components.filter(c => c.isExported).map(c => c.name),
          ],
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