const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class MessageBus extends EventEmitter {
  constructor() {
    super();
    this.messages = new Map();
    this.conversations = new Map();
    this.messageQueue = new Map();
    this.config = this.loadConfig();
    this.setupEventHandlers();
  }

  loadConfig() {
    const configPath = path.join(__dirname, '../config/agents.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  setupEventHandlers() {
    this.on('message', this.handleMessage.bind(this));
    this.on('task_assignment', this.handleTaskAssignment.bind(this));
    this.on('task_completion', this.handleTaskCompletion.bind(this));
    this.on('clarification_request', this.handleClarificationRequest.bind(this));
    this.on('review_request', this.handleReviewRequest.bind(this));
  }

  sendMessage(from, to, type, payload) {
    const message = {
      id: uuidv4(),
      from,
      to,
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.messages.set(message.id, message);
    this.addToQueue(to, message);
    this.emit('message', message);
    
    this.logMessage(message);
    return message.id;
  }

  addToQueue(agentId, message) {
    if (!this.messageQueue.has(agentId)) {
      this.messageQueue.set(agentId, []);
    }
    this.messageQueue.get(agentId).push(message);
  }

  getMessages(agentId) {
    const queue = this.messageQueue.get(agentId) || [];
    this.messageQueue.set(agentId, []);
    return queue;
  }

  markMessageProcessed(messageId, response) {
    const message = this.messages.get(messageId);
    if (message) {
      message.status = 'processed';
      message.response = response;
      message.processedAt = new Date().toISOString();
      this.emit('message_processed', message);
    }
  }

  startConversation(participants, topic, context = {}) {
    const conversationId = uuidv4();
    const conversation = {
      id: conversationId,
      participants,
      topic,
      context,
      startTime: new Date().toISOString(),
      messages: [],
      status: 'active'
    };

    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  addToConversation(conversationId, messageId) {
    const conversation = this.conversations.get(conversationId);
    const message = this.messages.get(messageId);
    
    if (conversation && message) {
      conversation.messages.push(messageId);
    }
  }

  getConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const messages = conversation.messages
      .map(id => this.messages.get(id))
      .filter(msg => msg !== undefined);

    return {
      ...conversation,
      messages
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'task_assignment':
        this.emit('task_assignment', message);
        break;
      case 'task_completion':
        this.emit('task_completion', message);
        break;
      case 'clarification_request':
        this.emit('clarification_request', message);
        break;
      case 'review_request':
        this.emit('review_request', message);
        break;
      case 'status_update':
        this.emit('status_update', message);
        break;
    }
  }

  handleTaskAssignment(message) {
    console.log(`📋 Task assigned: ${message.from} → ${message.to}`);
    console.log(`   Task: ${message.payload.task?.title || 'Unnamed task'}`);
  }

  handleTaskCompletion(message) {
    console.log(`✅ Task completed: ${message.from} → ${message.to}`);
    console.log(`   Result: ${message.payload.status || 'Unknown'}`);
  }

  handleClarificationRequest(message) {
    console.log(`❓ Clarification requested: ${message.from} → ${message.to}`);
    console.log(`   Question: ${message.payload.question}`);
  }

  handleReviewRequest(message) {
    console.log(`🔍 Review requested: ${message.from} → ${message.to}`);
    console.log(`   Subject: ${message.payload.subject || 'Code review'}`);
  }

  broadcast(from, type, payload, excludeAgents = []) {
    const agents = Object.keys(this.config.agents).filter(agent => 
      agent !== from && !excludeAgents.includes(agent)
    );

    const messageIds = agents.map(agent => 
      this.sendMessage(from, agent, type, payload)
    );

    return messageIds;
  }

  requestClarification(from, to, question, context = {}) {
    return this.sendMessage(from, to, 'clarification_request', {
      question,
      context,
      requiresResponse: true
    });
  }

  requestReview(from, to, subject, content, criteria = []) {
    return this.sendMessage(from, to, 'review_request', {
      subject,
      content,
      criteria,
      requiresResponse: true
    });
  }

  sendTaskAssignment(from, to, task) {
    return this.sendMessage(from, to, 'task_assignment', {
      task,
      assignedAt: new Date().toISOString()
    });
  }

  sendTaskCompletion(from, to, taskId, result, artifacts = []) {
    return this.sendMessage(from, to, 'task_completion', {
      taskId,
      result,
      artifacts,
      completedAt: new Date().toISOString()
    });
  }

  logMessage(message) {
    const logEntry = {
      timestamp: message.timestamp,
      from: message.from,
      to: message.to,
      type: message.type,
      messageId: message.id
    };

    const logPath = path.join(__dirname, '../logs/messages.log');
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logPath, logLine, 'utf8');
  }

  getStats() {
    const totalMessages = this.messages.size;
    const activeConversations = Array.from(this.conversations.values())
      .filter(conv => conv.status === 'active').length;
    
    const messagesByType = {};
    for (const message of this.messages.values()) {
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;
    }

    return {
      totalMessages,
      activeConversations,
      messagesByType,
      queueSizes: Object.fromEntries(
        Array.from(this.messageQueue.entries()).map(([agent, queue]) => [agent, queue.length])
      )
    };
  }

  cleanup() {
    const cutoff = new Date(Date.now() - this.config.communication.message_retention * 60000);
    
    for (const [id, message] of this.messages.entries()) {
      if (new Date(message.timestamp) < cutoff) {
        this.messages.delete(id);
      }
    }

    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.status === 'completed' && new Date(conversation.startTime) < cutoff) {
        this.conversations.delete(id);
      }
    }
  }
}

module.exports = MessageBus;