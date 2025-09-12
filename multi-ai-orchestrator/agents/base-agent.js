const { spawn } = require('child_process');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class BaseAgent extends EventEmitter {
  constructor(agentId, config, messageBus) {
    super();
    this.agentId = agentId;
    this.config = config;
    this.messageBus = messageBus;
    this.status = 'idle';
    this.currentTask = null;
    this.conversationHistory = [];
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    setInterval(() => {
      this.processMessages();
    }, 1000);
  }

  async processMessages() {
    const messages = this.messageBus.getMessages(this.agentId);
    for (const message of messages) {
      await this.handleMessage(message);
    }
  }

  async handleMessage(message) {
    console.log(`[${this.agentId}] Received ${message.type} from ${message.from}`);
    
    try {
      let response;
      
      switch (message.type) {
        case 'task_assignment':
          response = await this.handleTaskAssignment(message);
          break;
        case 'clarification_request':
          response = await this.handleClarificationRequest(message);
          break;
        case 'review_request':
          response = await this.handleReviewRequest(message);
          break;
        default:
          response = await this.handleCustomMessage(message);
      }

      this.messageBus.markMessageProcessed(message.id, response);
    } catch (error) {
      console.error(`[${this.agentId}] Error handling message:`, error);
      this.messageBus.markMessageProcessed(message.id, { 
        error: error.message, 
        status: 'failed' 
      });
    }
  }

  async handleTaskAssignment(message) {
    const task = message.payload.task;
    this.currentTask = task;
    this.status = 'working';

    console.log(`[${this.agentId}] Starting task: ${task.title}`);
    
    const result = await this.executeTask(task);
    
    this.status = 'idle';
    this.currentTask = null;

    this.messageBus.sendTaskCompletion(
      this.agentId, 
      message.from, 
      task.id, 
      result
    );

    return result;
  }

  async handleClarificationRequest(message) {
    const question = message.payload.question;
    const context = message.payload.context;
    
    const answer = await this.provideClarification(question, context);
    
    this.messageBus.sendMessage(
      this.agentId,
      message.from,
      'clarification_response',
      { 
        originalQuestion: question,
        answer 
      }
    );

    return { answer };
  }

  async handleReviewRequest(message) {
    const subject = message.payload.subject;
    const content = message.payload.content;
    const criteria = message.payload.criteria;

    const review = await this.performReview(subject, content, criteria);

    this.messageBus.sendMessage(
      this.agentId,
      message.from,
      'review_response',
      {
        subject,
        review,
        approved: review.approved || false
      }
    );

    return review;
  }

  async handleCustomMessage(message) {
    return { status: 'acknowledged' };
  }

  async executeTask(task) {
    throw new Error('executeTask must be implemented by subclass');
  }

  async provideClarification(question, context) {
    throw new Error('provideClarification must be implemented by subclass');
  }

  async performReview(subject, content, criteria) {
    throw new Error('performReview must be implemented by subclass');
  }

  async executeCLI(prompt, additionalArgs = []) {
    const command = this.config.command;
    const args = [...this.config.args, ...additionalArgs];
    
    console.log(`[${this.agentId}] Executing: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`CLI execution timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.stdin.write(prompt);
      child.stdin.end();

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: stderr
          });
        } else {
          reject(new Error(`CLI exited with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  requestClarification(targetAgent, question, context = {}) {
    return this.messageBus.requestClarification(
      this.agentId,
      targetAgent,
      question,
      context
    );
  }

  requestReview(targetAgent, subject, content, criteria = []) {
    return this.messageBus.requestReview(
      this.agentId,
      targetAgent,
      subject,
      content,
      criteria
    );
  }

  updateStatus(status, details = {}) {
    this.status = status;
    this.messageBus.broadcast(
      this.agentId,
      'status_update',
      {
        status,
        details,
        timestamp: new Date().toISOString()
      }
    );
  }

  logActivity(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      action,
      details
    };

    const logPath = path.join(__dirname, '../logs/agent-activity.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
  }

  getStatus() {
    return {
      agentId: this.agentId,
      status: this.status,
      currentTask: this.currentTask,
      capabilities: this.config.capabilities,
      specialties: this.config.specialties
    };
  }
}

module.exports = BaseAgent;