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

// Requirements parsing schemas
const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.enum(['feature', 'bug', 'enhancement', 'refactor', 'test', 'docs']),
  complexity: z.enum(['simple', 'medium', 'complex']),
  estimatedHours: z.number(),
  dependencies: z.array(z.string()),
  files: z.array(z.string()),
  testRequired: z.boolean(),
  breakingChange: z.boolean(),
});

const ParsedRequirementsSchema = z.object({
  requirements: z.array(RequirementSchema),
  summary: z.string(),
  totalEstimatedHours: z.number(),
  suggestedOrder: z.array(z.string()),
});

type Requirement = z.infer<typeof RequirementSchema>;
type ParsedRequirements = z.infer<typeof ParsedRequirementsSchema>;

class RequirementsParser {
  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateComplexity(description: string): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['fix', 'update', 'change', 'add simple', 'remove', 'rename'],
      medium: ['implement', 'create', 'add feature', 'modify', 'enhance'],
      complex: ['architecture', 'refactor', 'migrate', 'integrate', 'optimize', 'redesign']
    };

    const lowerDesc = description.toLowerCase();
    
    if (complexityIndicators.complex.some(indicator => lowerDesc.includes(indicator))) {
      return 'complex';
    }
    if (complexityIndicators.medium.some(indicator => lowerDesc.includes(indicator))) {
      return 'medium';
    }
    return 'simple';
  }

  private estimateHours(complexity: string, type: string): number {
    const baseHours = {
      simple: { feature: 2, bug: 1, enhancement: 1, refactor: 3, test: 1, docs: 1 },
      medium: { feature: 8, bug: 4, enhancement: 4, refactor: 12, test: 2, docs: 2 },
      complex: { feature: 24, bug: 8, enhancement: 16, refactor: 40, test: 4, docs: 4 }
    };

    return baseHours[complexity as keyof typeof baseHours][type as keyof typeof baseHours.simple] || 4;
  }

  private detectType(description: string): Requirement['type'] {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('bug') || lowerDesc.includes('fix') || lowerDesc.includes('error')) {
      return 'bug';
    }
    if (lowerDesc.includes('test') || lowerDesc.includes('spec')) {
      return 'test';
    }
    if (lowerDesc.includes('doc') || lowerDesc.includes('readme')) {
      return 'docs';
    }
    if (lowerDesc.includes('refactor') || lowerDesc.includes('restructure')) {
      return 'refactor';
    }
    if (lowerDesc.includes('enhance') || lowerDesc.includes('improve')) {
      return 'enhancement';
    }
    
    return 'feature';
  }

  private detectPriority(description: string): Requirement['priority'] {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('critical') || lowerDesc.includes('urgent') || lowerDesc.includes('security')) {
      return 'critical';
    }
    if (lowerDesc.includes('important') || lowerDesc.includes('high priority')) {
      return 'high';
    }
    if (lowerDesc.includes('low priority') || lowerDesc.includes('nice to have')) {
      return 'low';
    }
    
    return 'medium';
  }

  private extractFiles(description: string): string[] {
    const filePatterns = [
      /[\w-]+\.tsx?/g,
      /[\w-]+\.jsx?/g,
      /[\w-]+\.py/g,
      /[\w-]+\.java/g,
      /[\w-]+\.cs/g,
      /[\w-]+\.go/g,
      /[\w-]+\.rs/g,
      /[\w-]+\.cpp/g,
      /[\w-]+\.h/g,
      /[\w-]+\.sql/g,
      /[\w-]+\.json/g,
      /[\w-]+\.yml/g,
      /[\w-]+\.yaml/g,
      /[\w-]+\.md/g,
    ];

    const files: string[] = [];
    filePatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        files.push(...matches);
      }
    });

    return [...new Set(files)];
  }

  private needsTests(type: string, description: string): boolean {
    if (type === 'test' || type === 'docs') return false;
    
    const testIndicators = ['api', 'function', 'component', 'service', 'util', 'helper'];
    const lowerDesc = description.toLowerCase();
    
    return testIndicators.some(indicator => lowerDesc.includes(indicator)) || 
           type === 'feature' || type === 'enhancement';
  }

  private isBreakingChange(description: string): boolean {
    const breakingIndicators = [
      'breaking', 'remove', 'delete', 'deprecated', 'rename api', 
      'change interface', 'modify signature', 'restructure'
    ];
    
    const lowerDesc = description.toLowerCase();
    return breakingIndicators.some(indicator => lowerDesc.includes(indicator));
  }

  async parseRequirements(input: string): Promise<ParsedRequirements> {
    // Split input into individual requirements
    const lines = input.split('\n').filter(line => line.trim());
    const requirements: Requirement[] = [];

    for (const line of lines) {
      if (line.trim().length < 10) continue; // Skip very short lines
      
      const type = this.detectType(line);
      const priority = this.detectPriority(line);
      const complexity = this.estimateComplexity(line);
      const estimatedHours = this.estimateHours(complexity, type);
      const files = this.extractFiles(line);
      const testRequired = this.needsTests(type, line);
      const breakingChange = this.isBreakingChange(line);

      const requirement: Requirement = {
        id: this.generateId(),
        title: line.substring(0, 100).trim(),
        description: line.trim(),
        priority,
        type,
        complexity,
        estimatedHours,
        dependencies: [], // TODO: Implement dependency detection
        files,
        testRequired,
        breakingChange,
      };

      requirements.push(requirement);
    }

    // Calculate totals and suggest order
    const totalEstimatedHours = requirements.reduce((sum, req) => sum + req.estimatedHours, 0);
    
    // Sort by priority (critical first) then by complexity (simple first)
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const complexityOrder = { 'simple': 0, 'medium': 1, 'complex': 2 };
    
    const suggestedOrder = requirements
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return complexityOrder[a.complexity] - complexityOrder[b.complexity];
      })
      .map(req => req.id);

    return {
      requirements,
      summary: `Parsed ${requirements.length} requirements with ${totalEstimatedHours} total estimated hours`,
      totalEstimatedHours,
      suggestedOrder,
    };
  }
}

// Server implementation
const server = new Server(
  {
    name: 'requirements-parser',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const parser = new RequirementsParser();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'parse_requirements',
        description: 'Parse natural language requirements into structured development tasks',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Natural language requirements (one per line or paragraph)',
            },
          },
          required: ['input'],
        },
      },
      {
        name: 'analyze_requirement',
        description: 'Analyze a single requirement and provide detailed breakdown',
        inputSchema: {
          type: 'object',
          properties: {
            requirement: {
              type: 'string',
              description: 'Single requirement to analyze',
            },
          },
          required: ['requirement'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'parse_requirements': {
        const { input } = args as { input: string };
        const result = await parser.parseRequirements(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'analyze_requirement': {
        const { requirement } = args as { requirement: string };
        const result = await parser.parseRequirements(requirement);
        const analysis = result.requirements[0];
        
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
  console.error('Requirements Parser MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});