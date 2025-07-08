#!/usr/bin/env node

/**
 * Real-time Parallel Provider Monitor
 * Shows what Claude and Gemini are doing simultaneously
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ParallelMonitor {
  constructor() {
    this.lastLogPosition = 0;
    this.activeTasks = new Map();
  }

  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  getColoredText(text, color) {
    const colors = {
      green: '\x1b[32m',
      blue: '\x1b[34m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m',
      white: '\x1b[37m',
      reset: '\x1b[0m'
    };
    return `${colors[color] || colors.white}${text}${colors.reset}`;
  }

  getCurrentBranches() {
    try {
      const branches = execSync('git branch', { encoding: 'utf8' });
      return branches.split('\n')
        .filter(branch => branch.includes('autonomous'))
        .map(branch => branch.replace('*', '').trim());
    } catch {
      return [];
    }
  }

  getTaskQueue() {
    try {
      const queueFile = path.join(process.cwd(), '.autonomous', 'task-queue.json');
      if (fs.existsSync(queueFile)) {
        return JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      }
    } catch {
    }
    return [];
  }

  getRecentLogs() {
    try {
      const logFile = path.join(process.cwd(), '.autonomous', 'logs', 'daemon.log');
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');
        return lines.slice(-20).filter(line => line.trim());
      }
    } catch {
    }
    return [];
  }

  parseActiveTasks(logs) {
    const tasks = new Map();
    
    for (const log of logs) {
      if (log.includes('🎯 Starting parallel task:')) {
        const match = log.match(/Starting parallel task: (.+) with (.+)/);
        if (match) {
          const [, taskType, provider] = match;
          tasks.set(provider, { taskType, status: 'starting', timestamp: new Date() });
        }
      }
      if (log.includes('🌿 Creating parallel branch:')) {
        const match = log.match(/Creating parallel branch: (.+) for (.+)/);
        if (match) {
          const [, branchName, provider] = match;
          if (tasks.has(provider)) {
            tasks.get(provider).branchName = branchName;
            tasks.get(provider).status = 'working';
          }
        }
      }
      if (log.includes('🔧 Executing') && log.includes('command:')) {
        const match = log.match(/Executing (.+) command:/);
        if (match) {
          const provider = match[1];
          if (tasks.has(provider)) {
            tasks.get(provider).status = 'executing';
          }
        }
      }
      if (log.includes('✅ Parallel task completed:')) {
        const match = log.match(/completed: (.+) by (.+)/);
        if (match) {
          const [, taskType, provider] = match;
          if (tasks.has(provider)) {
            tasks.get(provider).status = 'completed';
          }
        }
      }
      if (log.includes('❌ Parallel task failed:')) {
        const match = log.match(/failed: (.+) by (.+)/);
        if (match) {
          const [, taskType, provider] = match;
          if (tasks.has(provider)) {
            tasks.get(provider).status = 'failed';
          }
        }
      }
    }
    
    return tasks;
  }

  getGitChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.split('\n').filter(line => line.trim()).length;
    } catch {
      return 0;
    }
  }

  render() {
    this.clearScreen();
    
    const now = new Date().toLocaleTimeString();
    const branches = this.getCurrentBranches();
    const queue = this.getTaskQueue();
    const logs = this.getRecentLogs();
    const activeTasks = this.parseActiveTasks(logs);
    const changes = this.getGitChanges();

    console.log(this.getColoredText('🤖 PARALLEL PROVIDER MONITOR', 'cyan'));
    console.log(this.getColoredText('═'.repeat(60), 'blue'));
    console.log(this.getColoredText(`⏰ ${now} | 🔄 Auto-refresh: 3s`, 'white'));
    console.log();

    // Provider Status
    console.log(this.getColoredText('👥 PROVIDER STATUS', 'yellow'));
    console.log(this.getColoredText('─'.repeat(30), 'blue'));
    
    const providers = ['claude', 'gemini'];
    for (const provider of providers) {
      const task = activeTasks.get(provider);
      const icon = provider === 'claude' ? '🧠' : '⚡';
      const name = provider.toUpperCase();
      
      if (task) {
        const statusColor = {
          'starting': 'yellow',
          'working': 'blue', 
          'executing': 'green',
          'completed': 'green',
          'failed': 'red'
        }[task.status] || 'white';
        
        console.log(`${icon} ${this.getColoredText(name, 'white')}: ${this.getColoredText(task.status.toUpperCase(), statusColor)} - ${task.taskType}`);
        if (task.branchName) {
          console.log(`   📂 Branch: ${this.getColoredText(task.branchName, 'cyan')}`);
        }
      } else {
        console.log(`${icon} ${this.getColoredText(name, 'white')}: ${this.getColoredText('IDLE', 'white')}`);
      }
    }
    console.log();

    // Active Branches
    console.log(this.getColoredText('🌿 AUTONOMOUS BRANCHES', 'yellow'));
    console.log(this.getColoredText('─'.repeat(30), 'blue'));
    if (branches.length > 0) {
      for (const branch of branches) {
        const provider = branch.includes('claude') ? '🧠' : branch.includes('gemini') ? '⚡' : '🤖';
        console.log(`${provider} ${this.getColoredText(branch, 'cyan')}`);
      }
    } else {
      console.log(this.getColoredText('No autonomous branches active', 'white'));
    }
    console.log();

    // Task Queue
    console.log(this.getColoredText('📋 TASK QUEUE', 'yellow'));
    console.log(this.getColoredText('─'.repeat(30), 'blue'));
    if (queue.length > 0) {
      for (const task of queue) {
        const priorityColor = task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'white';
        const typeIcon = task.type === 'code-quality' ? '⚡' : task.type === 'feature-planning' ? '🧠' : '🔧';
        console.log(`${typeIcon} ${this.getColoredText(task.type, 'white')} (${this.getColoredText(task.priority, priorityColor)}) - ${task.reason}`);
      }
    } else {
      console.log(this.getColoredText('No pending tasks', 'white'));
    }
    console.log();

    // File Changes
    console.log(this.getColoredText('📝 CURRENT CHANGES', 'yellow'));
    console.log(this.getColoredText('─'.repeat(30), 'blue'));
    console.log(`${this.getColoredText(changes.toString(), changes > 0 ? 'green' : 'white')} files modified`);
    console.log();

    // Recent Activity
    console.log(this.getColoredText('📊 RECENT ACTIVITY', 'yellow'));
    console.log(this.getColoredText('─'.repeat(30), 'blue'));
    const recentLogs = logs.slice(-5);
    if (recentLogs.length > 0) {
      for (const log of recentLogs) {
        let color = 'white';
        if (log.includes('✅')) color = 'green';
        else if (log.includes('❌')) color = 'red';
        else if (log.includes('🎯') || log.includes('🌿')) color = 'blue';
        else if (log.includes('🔧')) color = 'yellow';
        
        console.log(this.getColoredText(log.slice(-80), color));
      }
    } else {
      console.log(this.getColoredText('No recent activity', 'white'));
    }
    console.log();

    console.log(this.getColoredText('Press Ctrl+C to exit', 'white'));
  }

  start() {
    console.log(this.getColoredText('🚀 Starting Parallel Provider Monitor...', 'green'));
    
    this.render();
    const interval = setInterval(() => {
      this.render();
    }, 3000);

    process.on('SIGINT', () => {
      clearInterval(interval);
      this.clearScreen();
      console.log(this.getColoredText('👋 Monitor stopped', 'yellow'));
      process.exit(0);
    });
  }
}

const monitor = new ParallelMonitor();
monitor.start();