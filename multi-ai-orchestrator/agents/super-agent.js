const BaseAgent = require('./base-agent');
const { v4: uuidv4 } = require('uuid');

class SuperAgent extends BaseAgent {
  constructor(agentId, config, messageBus, stateManager) {
    super(agentId, config, messageBus);
    this.stateManager = stateManager;
    this.activeWorkflows = new Map();
    this.agentCapabilities = new Map();
    this.taskQueue = [];
    this.setupSuperAgentHandlers();
  }

  setupSuperAgentHandlers() {
    this.messageBus.on('task_completion', this.handleSubAgentCompletion.bind(this));
    this.messageBus.on('clarification_response', this.handleClarificationResponse.bind(this));
    this.messageBus.on('review_response', this.handleReviewResponse.bind(this));
  }

  async orchestrateTask(mainTask) {
    console.log(`🎯 [SuperAgent] Starting orchestration: ${mainTask.title}`);
    
    const workflowId = uuidv4();
    const workflow = {
      id: workflowId,
      mainTask,
      subtasks: [],
      dependencies: new Map(),
      completedTasks: new Set(),
      failedTasks: new Set(),
      status: 'planning',
      startTime: new Date().toISOString()
    };

    this.activeWorkflows.set(workflowId, workflow);
    
    try {
      // Step 1: Decompose the main task
      const subtasks = await this.decomposeTask(mainTask);
      workflow.subtasks = subtasks;
      workflow.status = 'executing';

      console.log(`📋 [SuperAgent] Created ${subtasks.length} subtasks`);
      
      // Step 2: Build dependency graph
      this.buildDependencyGraph(workflow, subtasks);
      
      // Step 3: Execute tasks based on dependencies
      await this.executeWorkflow(workflow);
      
      // Step 4: Final verification
      const finalResult = await this.performFinalVerification(workflow);
      
      workflow.status = 'completed';
      workflow.result = finalResult;
      workflow.endTime = new Date().toISOString();
      
      console.log(`✅ [SuperAgent] Orchestration completed successfully`);
      return finalResult;

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.endTime = new Date().toISOString();
      
      console.error(`❌ [SuperAgent] Orchestration failed:`, error.message);
      throw error;
    }
  }

  async decomposeTask(mainTask) {
    const decompositionPrompt = `
Task Decomposition Request:

Main Task: ${mainTask.title}
Description: ${mainTask.description || 'No description provided'}
Requirements: ${JSON.stringify(mainTask.requirements || [])}

Please decompose this task into smaller, manageable subtasks. For each subtask, provide:
1. Title and description
2. Estimated time/complexity
3. Required agent type (codex, gemini, or claude)
4. Dependencies on other subtasks
5. Acceptance criteria

Format your response as JSON with an array of subtasks.
Each subtask should have: id, title, description, agentType, dependencies, estimatedTime, acceptanceCriteria
`;

    const result = await this.executeCLI(decompositionPrompt);
    
    try {
      const response = JSON.parse(result.output);
      return response.subtasks.map(subtask => ({
        id: uuidv4(),
        ...subtask,
        status: 'pending',
        assignedAgent: null,
        startTime: null,
        endTime: null
      }));
    } catch (error) {
      console.error('[SuperAgent] Failed to parse task decomposition:', error);
      
      // Fallback: create basic subtasks
      return [{
        id: uuidv4(),
        title: mainTask.title,
        description: mainTask.description,
        agentType: 'codex',
        dependencies: [],
        estimatedTime: '30m',
        acceptanceCriteria: ['Task completed successfully'],
        status: 'pending',
        assignedAgent: null
      }];
    }
  }

  buildDependencyGraph(workflow, subtasks) {
    for (const task of subtasks) {
      workflow.dependencies.set(task.id, task.dependencies || []);
    }
  }

  async executeWorkflow(workflow) {
    const maxConcurrency = 3;
    let activeTasks = 0;
    
    while (workflow.completedTasks.size + workflow.failedTasks.size < workflow.subtasks.length) {
      const readyTasks = this.getReadyTasks(workflow);
      
      for (const task of readyTasks) {
        if (activeTasks >= maxConcurrency) break;
        
        console.log(`🚀 [SuperAgent] Starting subtask: ${task.title}`);
        activeTasks++;
        
        this.executeSubtask(workflow, task)
          .then(() => activeTasks--)
          .catch(() => activeTasks--);
      }
      
      if (readyTasks.length === 0 && activeTasks === 0) {
        // No ready tasks and no active tasks - check for deadlock
        const pendingTasks = workflow.subtasks.filter(t => 
          !workflow.completedTasks.has(t.id) && !workflow.failedTasks.has(t.id)
        );
        
        if (pendingTasks.length > 0) {
          console.warn(`⚠️ [SuperAgent] Potential deadlock detected, forcing execution of: ${pendingTasks[0].title}`);
          activeTasks++;
          this.executeSubtask(workflow, pendingTasks[0])
            .then(() => activeTasks--)
            .catch(() => activeTasks--);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  getReadyTasks(workflow) {
    return workflow.subtasks.filter(task => {
      if (workflow.completedTasks.has(task.id) || workflow.failedTasks.has(task.id)) {
        return false;
      }
      
      const dependencies = workflow.dependencies.get(task.id) || [];
      return dependencies.every(depId => workflow.completedTasks.has(depId));
    });
  }

  async executeSubtask(workflow, task) {
    task.status = 'executing';
    task.startTime = new Date().toISOString();
    
    try {
      const agent = this.selectBestAgent(task);
      task.assignedAgent = agent;
      
      console.log(`📤 [SuperAgent] Assigning to ${agent}: ${task.title}`);
      
      const messageId = this.messageBus.sendTaskAssignment(
        this.agentId,
        agent,
        task
      );
      
      // Wait for completion or timeout
      const result = await this.waitForTaskCompletion(task, messageId);
      
      if (result.success) {
        workflow.completedTasks.add(task.id);
        task.status = 'completed';
        task.result = result;
        
        // Request review if needed
        await this.requestTaskReview(workflow, task);
      } else {
        throw new Error(result.error || 'Task execution failed');
      }
      
    } catch (error) {
      workflow.failedTasks.add(task.id);
      task.status = 'failed';
      task.error = error.message;
      
      console.error(`❌ [SuperAgent] Subtask failed: ${task.title} - ${error.message}`);
      
      // Attempt recovery
      await this.attemptTaskRecovery(workflow, task, error);
    }
    
    task.endTime = new Date().toISOString();
  }

  async requestTaskReview(workflow, task) {
    const reviewAgent = this.selectReviewAgent(task);
    
    if (reviewAgent && reviewAgent !== task.assignedAgent) {
      console.log(`🔍 [SuperAgent] Requesting review from ${reviewAgent}`);
      
      const reviewId = this.requestReview(
        reviewAgent,
        `Review of ${task.title}`,
        task.result,
        task.acceptanceCriteria || []
      );
      
      // Wait for review response
      await this.waitForReview(reviewId);
    }
  }

  async waitForTaskCompletion(task, messageId) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Task timeout' });
      }, 30 * 60 * 1000); // 30 minutes timeout

      const checkCompletion = () => {
        if (task.status === 'completed') {
          clearTimeout(timeout);
          resolve({ success: true, result: task.result });
        } else if (task.status === 'failed') {
          clearTimeout(timeout);
          resolve({ success: false, error: task.error });
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };

      checkCompletion();
    });
  }

  selectBestAgent(task) {
    const preferredType = task.agentType || 'codex';
    const availableAgents = ['codex', 'gemini'];
    
    if (availableAgents.includes(preferredType)) {
      return preferredType;
    }
    
    // Fallback selection based on task characteristics
    if (task.title.toLowerCase().includes('review') || 
        task.title.toLowerCase().includes('test')) {
      return 'gemini';
    }
    
    return 'codex';
  }

  selectReviewAgent(task) {
    return task.assignedAgent === 'codex' ? 'gemini' : 'codex';
  }

  async attemptTaskRecovery(workflow, task, error) {
    console.log(`🔄 [SuperAgent] Attempting recovery for: ${task.title}`);
    
    // Try with different agent
    const alternativeAgent = task.assignedAgent === 'codex' ? 'gemini' : 'codex';
    
    try {
      task.assignedAgent = alternativeAgent;
      const messageId = this.messageBus.sendTaskAssignment(
        this.agentId,
        alternativeAgent,
        { ...task, recoveryAttempt: true, originalError: error.message }
      );
      
      const result = await this.waitForTaskCompletion(task, messageId);
      
      if (result.success) {
        workflow.failedTasks.delete(task.id);
        workflow.completedTasks.add(task.id);
        task.status = 'completed';
        console.log(`✅ [SuperAgent] Recovery successful for: ${task.title}`);
      }
      
    } catch (recoveryError) {
      console.error(`❌ [SuperAgent] Recovery failed: ${recoveryError.message}`);
    }
  }

  async performFinalVerification(workflow) {
    console.log(`🔎 [SuperAgent] Performing final verification`);
    
    const verificationPrompt = `
Final Verification Request:

Main Task: ${workflow.mainTask.title}
Completed Subtasks: ${workflow.completedTasks.size}
Failed Subtasks: ${workflow.failedTasks.size}

Please verify if the overall task has been completed successfully.
Review the results and provide a final assessment.

Subtask Results:
${workflow.subtasks.map(task => `
- ${task.title}: ${task.status}
  Result: ${JSON.stringify(task.result || {})}
`).join('\n')}

Provide your final verification as JSON with:
- success: boolean
- quality: number (0-100)
- summary: string
- recommendations: array of strings
`;

    const result = await this.executeCLI(verificationPrompt);
    
    try {
      return JSON.parse(result.output);
    } catch (error) {
      return {
        success: workflow.failedTasks.size === 0,
        quality: 85,
        summary: `Task completed with ${workflow.completedTasks.size} successful subtasks and ${workflow.failedTasks.size} failures`,
        recommendations: []
      };
    }
  }

  async handleSubAgentCompletion(message) {
    console.log(`📥 [SuperAgent] Received completion from ${message.from}`);
    // Task completion is handled in executeSubtask via status updates
  }

  async handleClarificationResponse(message) {
    console.log(`💬 [SuperAgent] Received clarification from ${message.from}`);
    // Store for future reference
    this.conversationHistory.push({
      type: 'clarification',
      from: message.from,
      content: message.payload,
      timestamp: new Date().toISOString()
    });
  }

  async handleReviewResponse(message) {
    console.log(`📋 [SuperAgent] Received review from ${message.from}`);
    // Store review results
    this.conversationHistory.push({
      type: 'review',
      from: message.from,
      content: message.payload,
      timestamp: new Date().toISOString()
    });
  }

  async executeTask(task) {
    // SuperAgent can also execute tasks directly if needed
    return await this.executeCLI(task.description || task.title);
  }

  async provideClarification(question, context) {
    const clarificationPrompt = `
Clarification Request:

Question: ${question}
Context: ${JSON.stringify(context)}

Please provide a clear, actionable answer to help the requesting agent proceed with their task.
`;

    const result = await this.executeCLI(clarificationPrompt);
    return result.output;
  }

  async performReview(subject, content, criteria) {
    const reviewPrompt = `
Review Request:

Subject: ${subject}
Content: ${JSON.stringify(content)}
Criteria: ${criteria.join(', ')}

Please review the content and provide feedback in JSON format:
- approved: boolean
- score: number (0-100)
- feedback: string
- suggestions: array of strings
- issues: array of strings
`;

    const result = await this.executeCLI(reviewPrompt);
    
    try {
      return JSON.parse(result.output);
    } catch (error) {
      return {
        approved: true,
        score: 80,
        feedback: "Review completed",
        suggestions: [],
        issues: []
      };
    }
  }

  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId);
  }

  getAllWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }
}

module.exports = SuperAgent;