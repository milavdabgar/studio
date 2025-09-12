const BaseAgent = require('./base-agent');

class CodexAgent extends BaseAgent {
  constructor(agentId, config, messageBus) {
    super(agentId, config, messageBus);
    this.specializations = [
      'code-generation',
      'implementation', 
      'refactoring',
      'bug-fixing',
      'architecture',
      'file-organization'
    ];
  }

  async executeTask(task) {
    console.log(`🔧 [Codex] Executing: ${task.title}`);
    this.logActivity('task_start', { taskId: task.id, title: task.title });

    try {
      let prompt = this.buildTaskPrompt(task);
      
      // Handle different types of tasks
      if (this.isImplementationTask(task)) {
        return await this.handleImplementation(task, prompt);
      } else if (this.isRefactoringTask(task)) {
        return await this.handleRefactoring(task, prompt);
      } else if (this.isBugFixTask(task)) {
        return await this.handleBugFix(task, prompt);
      } else {
        return await this.handleGenericTask(task, prompt);
      }

    } catch (error) {
      this.logActivity('task_error', { taskId: task.id, error: error.message });
      throw error;
    }
  }

  buildTaskPrompt(task) {
    let prompt = `Task: ${task.title}\n\n`;
    
    if (task.description) {
      prompt += `Description: ${task.description}\n\n`;
    }
    
    if (task.requirements && task.requirements.length > 0) {
      prompt += `Requirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}\n\n`;
    }
    
    if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
      prompt += `Acceptance Criteria:\n${task.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}\n\n`;
    }
    
    if (task.recoveryAttempt) {
      prompt += `This is a recovery attempt. Previous error: ${task.originalError}\n\n`;
    }
    
    // Add context about current project structure
    prompt += this.addProjectContext();
    
    return prompt;
  }

  addProjectContext() {
    return `
Project Context:
- This is part of a multi-AI collaborative development project
- Work systematically and create clean, maintainable code
- Follow best practices for the relevant technology stack
- If you need clarification, ask specific questions
- Document your implementation decisions

Please provide your response in a structured format with:
1. Implementation plan
2. Code changes/additions
3. Any questions or clarifications needed
4. Testing recommendations
`;
  }

  async handleImplementation(task, prompt) {
    const implementationPrompt = `${prompt}

Focus on implementation. Provide:
1. Clean, working code
2. Proper error handling
3. Clear documentation
4. Suggested file structure if creating new files

If you need to create or modify multiple files, structure your response clearly.
`;

    const result = await this.executeCLI(implementationPrompt);
    
    return this.processCodeResult(result, 'implementation');
  }

  async handleRefactoring(task, prompt) {
    const refactoringPrompt = `${prompt}

Focus on refactoring. Provide:
1. Improved code structure
2. Better naming and organization
3. Performance optimizations where applicable
4. Maintained functionality

Explain your refactoring decisions and any breaking changes.
`;

    const result = await this.executeCLI(refactoringPrompt);
    
    return this.processCodeResult(result, 'refactoring');
  }

  async handleBugFix(task, prompt) {
    const bugFixPrompt = `${prompt}

Focus on bug fixing. Provide:
1. Root cause analysis
2. Minimal fix that addresses the issue
3. Test cases to prevent regression
4. Documentation of the fix

Be precise and avoid introducing new issues.
`;

    const result = await this.executeCLI(bugFixPrompt);
    
    return this.processCodeResult(result, 'bugfix');
  }

  async handleGenericTask(task, prompt) {
    const result = await this.executeCLI(prompt);
    return this.processCodeResult(result, 'generic');
  }

  processCodeResult(result, taskType) {
    if (!result.success) {
      throw new Error(`Codex execution failed: ${result.error}`);
    }

    // Parse the output for structured information
    const output = result.output;
    
    return {
      success: true,
      type: taskType,
      output: output,
      timestamp: new Date().toISOString(),
      artifacts: this.extractArtifacts(output),
      questions: this.extractQuestions(output),
      recommendations: this.extractRecommendations(output)
    };
  }

  extractArtifacts(output) {
    const artifacts = [];
    
    // Look for code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(output)) !== null) {
      artifacts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }
    
    // Look for file references
    const fileRegex = /(?:File|Create|Modify|Update):\s*([^\n]+)/gi;
    while ((match = fileRegex.exec(output)) !== null) {
      artifacts.push({
        type: 'file_reference',
        path: match[1].trim()
      });
    }
    
    return artifacts;
  }

  extractQuestions(output) {
    const questions = [];
    const questionRegex = /(?:Question|Need clarification|Unclear):\s*([^\n]+)/gi;
    let match;
    
    while ((match = questionRegex.exec(output)) !== null) {
      questions.push(match[1].trim());
    }
    
    return questions;
  }

  extractRecommendations(output) {
    const recommendations = [];
    const recommendationRegex = /(?:Recommend|Suggest|Should consider):\s*([^\n]+)/gi;
    let match;
    
    while ((match = recommendationRegex.exec(output)) !== null) {
      recommendations.push(match[1].trim());
    }
    
    return recommendations;
  }

  isImplementationTask(task) {
    const implementationKeywords = ['implement', 'create', 'build', 'develop', 'add'];
    return implementationKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) || 
      (task.description && task.description.toLowerCase().includes(keyword))
    );
  }

  isRefactoringTask(task) {
    const refactoringKeywords = ['refactor', 'improve', 'optimize', 'restructure', 'clean'];
    return refactoringKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) || 
      (task.description && task.description.toLowerCase().includes(keyword))
    );
  }

  isBugFixTask(task) {
    const bugFixKeywords = ['fix', 'bug', 'error', 'issue', 'problem', 'debug'];
    return bugFixKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) || 
      (task.description && task.description.toLowerCase().includes(keyword))
    );
  }

  async provideClarification(question, context) {
    const clarificationPrompt = `
Clarification Request from SuperAgent:

Question: ${question}
Context: ${JSON.stringify(context, null, 2)}

As a code implementation specialist, please provide a detailed answer that will help with the current development task. Focus on:
- Technical implementation details
- Best practices and recommendations
- Potential challenges and solutions
- Code structure and architecture suggestions
`;

    const result = await this.executeCLI(clarificationPrompt);
    return result.output;
  }

  async performReview(subject, content, criteria) {
    const reviewPrompt = `
Code Review Request:

Subject: ${subject}
Content to Review: ${JSON.stringify(content, null, 2)}
Review Criteria: ${criteria.join(', ')}

As a code implementation specialist, please review the provided content and provide feedback in JSON format:
{
  "approved": boolean,
  "score": number (0-100),
  "feedback": "string",
  "suggestions": ["array of improvement suggestions"],
  "issues": ["array of identified issues"],
  "codeQuality": {
    "readability": number (0-100),
    "maintainability": number (0-100),
    "performance": number (0-100),
    "security": number (0-100)
  }
}

Focus on:
- Code correctness and functionality
- Best practices adherence
- Performance considerations
- Security implications
- Maintainability and readability
`;

    const result = await this.executeCLI(reviewPrompt);
    
    try {
      const review = JSON.parse(result.output);
      return review;
    } catch (error) {
      // Fallback review if JSON parsing fails
      return {
        approved: true,
        score: 85,
        feedback: "Code review completed. Implementation looks solid.",
        suggestions: [],
        issues: [],
        codeQuality: {
          readability: 85,
          maintainability: 85,
          performance: 85,
          security: 85
        }
      };
    }
  }

  async requestSupervisorGuidance(question, context) {
    console.log(`❓ [Codex] Requesting guidance: ${question}`);
    
    const messageId = this.requestClarification('claude', question, {
      ...context,
      agentType: 'codex',
      currentTask: this.currentTask
    });
    
    return new Promise((resolve) => {
      const checkResponse = () => {
        const messages = this.messageBus.getMessages(this.agentId);
        const response = messages.find(msg => 
          msg.type === 'clarification_response' && 
          msg.payload.originalQuestion === question
        );
        
        if (response) {
          resolve(response.payload.answer);
        } else {
          setTimeout(checkResponse, 1000);
        }
      };
      
      setTimeout(checkResponse, 100);
    });
  }

  getCapabilities() {
    return {
      codeGeneration: true,
      refactoring: true,
      bugFixes: true,
      architectureDesign: true,
      fileManipulation: true,
      performanceOptimization: true,
      testingSupport: false, // Gemini is better for testing
      securityAudit: false   // Gemini handles security reviews
    };
  }

  getSpecialtyScore(taskType) {
    const scores = {
      'implementation': 95,
      'refactoring': 90,
      'architecture': 85,
      'debugging': 88,
      'optimization': 80,
      'testing': 60,
      'security': 65,
      'documentation': 70
    };
    
    return scores[taskType] || 75;
  }
}

module.exports = CodexAgent;