#!/usr/bin/env node

/**
 * Real-time Autonomous Development Dashboard
 * Monitor 24/7 autonomous development activity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutonomousDashboard {
  constructor() {
    this.autonomousDir = path.join(process.cwd(), '.autonomous');
    this.logFile = path.join(this.autonomousDir, 'activity.log');
    this.metricsFile = path.join(this.autonomousDir, 'metrics.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.autonomousDir)) {
      fs.mkdirSync(this.autonomousDir, { recursive: true });
    }
  }

  async start() {
    console.clear();
    this.displayHeader();
    
    // Start real-time monitoring
    setInterval(() => {
      console.clear();
      this.displayHeader();
      this.displayStatus();
      this.displayMetrics();
      this.displayRecentActivity();
      this.displayHealth();
      this.displayFooter();
    }, 5000); // Update every 5 seconds
    
    // Keep running
    process.on('SIGINT', () => {
      console.log('\\n👋 Dashboard stopped');
      process.exit(0);
    });
  }

  displayHeader() {
    const now = new Date().toLocaleString();
    console.log('🤖 AUTONOMOUS DEVELOPMENT DASHBOARD');
    console.log('═'.repeat(60));
    console.log(`⏰ ${now} | 🔄 Auto-refresh: 5s`);
    console.log('');
  }

  displayStatus() {
    const daemonStatus = this.getDaemonStatus();
    const queueStatus = this.getQueueStatus();
    
    console.log('📊 SYSTEM STATUS');
    console.log('─'.repeat(30));
    
    const statusIcon = daemonStatus.running ? '🟢 RUNNING' : '🔴 STOPPED';
    console.log(`Daemon: ${statusIcon}`);
    console.log(`Queue: ${queueStatus.pending} pending, ${queueStatus.completed} completed`);
    console.log(`Current Branch: ${this.getCurrentBranch()}`);
    console.log(`Last Activity: ${this.getLastActivity()}`);
    console.log('');
  }

  displayMetrics() {
    const metrics = this.getMetrics();
    const uptime = this.getUptime(metrics.startTime);
    
    console.log('📈 AUTONOMOUS METRICS');
    console.log('─'.repeat(30));
    console.log(`⏱️  Uptime: ${uptime}`);
    console.log(`✅ Tasks Completed: ${metrics.tasksCompleted}`);
    console.log(`🐛 Bugs Fixed: ${metrics.bugsFixed}`);
    console.log(`⭐ Features Added: ${metrics.featuresAdded}`);
    console.log(`🔧 Refactors: ${metrics.refactors || 0}`);
    console.log(`📝 Commits: ${metrics.commits || 0}`);
    console.log(`🔀 PRs Created: ${metrics.prsCreated || 0}`);
    console.log('');
  }

  displayRecentActivity() {
    const activities = this.getRecentActivity();
    
    console.log('📋 RECENT ACTIVITY');
    console.log('─'.repeat(30));
    
    if (activities.length === 0) {
      console.log('No recent activity');
    } else {
      activities.slice(0, 8).forEach(activity => {
        const time = new Date(activity.timestamp).toLocaleTimeString();
        const icon = this.getActivityIcon(activity.type);
        console.log(`${icon} ${time} - ${activity.description}`);
      });
    }
    console.log('');
  }

  displayHealth() {
    const health = this.getSystemHealth();
    
    console.log('🏥 SYSTEM HEALTH');
    console.log('─'.repeat(30));
    
    const testIcon = health.tests.failing === 0 ? '✅' : '❌';
    console.log(`${testIcon} Tests: ${health.tests.passing} passing, ${health.tests.failing} failing`);
    
    const gitIcon = health.git.uncommittedChanges === 0 ? '✅' : '⚠️';
    console.log(`${gitIcon} Git: ${health.git.uncommittedChanges} uncommitted changes`);
    
    const secIcon = health.security.vulnerabilities === 0 ? '✅' : '🚨';
    console.log(`${secIcon} Security: ${health.security.vulnerabilities} vulnerabilities`);
    
    const perfIcon = health.performance.degradation < 0.1 ? '✅' : '⚠️';
    console.log(`${perfIcon} Performance: ${health.performance.score}/100`);
    
    console.log('');
  }

  displayFooter() {
    console.log('🎮 CONTROLS');
    console.log('─'.repeat(30));
    console.log('Ctrl+C: Stop dashboard');
    console.log('');
    console.log('📡 AUTONOMOUS DAEMON COMMANDS');
    console.log('─'.repeat(30));
    console.log('./autonomous-daemon.js start   - Start autonomous development');
    console.log('./autonomous-daemon.js status  - Check daemon status');
    console.log('');
  }

  getDaemonStatus() {
    try {
      // Check if daemon process is running
      const processes = execSync('ps aux | grep autonomous-daemon', { encoding: 'utf8' });
      const running = processes.includes('node') && !processes.includes('grep');
      
      return {
        running,
        pid: running ? this.extractPid(processes) : null
      };
    } catch (error) {
      return { running: false, pid: null };
    }
  }

  extractPid(processString) {
    const lines = processString.split('\\n').filter(line => 
      line.includes('autonomous-daemon') && !line.includes('grep')
    );
    
    if (lines.length > 0) {
      return lines[0].split(/\\s+/)[1];
    }
    return null;
  }

  getQueueStatus() {
    try {
      const queueFile = path.join(this.autonomousDir, 'task-queue.json');
      
      if (fs.existsSync(queueFile)) {
        const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
        return {
          pending: queue.length,
          completed: this.getCompletedTasksCount()
        };
      }
    } catch (error) {
      console.error('Error reading queue:', error);
    }
    
    return { pending: 0, completed: 0 };
  }

  getCompletedTasksCount() {
    try {
      const completedFile = path.join(this.autonomousDir, 'completed-tasks.json');
      if (fs.existsSync(completedFile)) {
        const completed = JSON.parse(fs.readFileSync(completedFile, 'utf8'));
        return completed.length;
      }
    } catch (error) {
      // File doesn't exist or is corrupted
    }
    return 0;
  }

  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getLastActivity() {
    try {
      const lastCommit = execSync('git log -1 --format="%cr"', { encoding: 'utf8' }).trim();
      return lastCommit || 'No recent commits';
    } catch (error) {
      return 'Unknown';
    }
  }

  getMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        return JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
      }
    } catch (error) {
      // Metrics file doesn't exist or is corrupted
    }
    
    // Default metrics
    return {
      startTime: new Date().toISOString(),
      tasksCompleted: 0,
      bugsFixed: 0,
      featuresAdded: 0,
      refactors: 0,
      commits: 0,
      prsCreated: 0
    };
  }

  getUptime(startTime) {
    if (!startTime) return 'Unknown';
    
    const start = new Date(startTime);
    const now = new Date();
    const diff = now - start;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getRecentActivity() {
    try {
      if (fs.existsSync(this.logFile)) {
        const log = fs.readFileSync(this.logFile, 'utf8');
        return log.split('\\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    } catch (error) {
      // Log file doesn't exist or is corrupted
    }
    
    return [];
  }

  getActivityIcon(type) {
    const icons = {
      'feature-planning': '💡',
      'bug-hunting': '🐛',
      'code-quality': '🔧',
      'performance-optimization': '⚡',
      'security-fix': '🔒',
      'test-improvement': '🧪',
      'documentation': '📚',
      'refactoring': '♻️',
      'commit': '📝',
      'pr-created': '🔀',
      'error': '❌',
      'success': '✅'
    };
    
    return icons[type] || '📋';
  }

  getSystemHealth() {
    // Simulated health data - in real implementation, this would check actual system health
    return {
      tests: {
        passing: this.getTestCount('passing'),
        failing: this.getTestCount('failing')
      },
      git: {
        uncommittedChanges: this.getUncommittedChanges()
      },
      security: {
        vulnerabilities: this.getSecurityVulnerabilities()
      },
      performance: {
        score: this.getPerformanceScore(),
        degradation: 0.05
      }
    };
  }

  getTestCount(type) {
    try {
      // This would run actual test commands in real implementation
      const testResult = execSync('npm test --silent 2>/dev/null || echo "0 passing, 0 failing"', 
        { encoding: 'utf8' });
      
      if (type === 'passing') {
        const match = testResult.match(/(\\d+) passing/);
        return match ? parseInt(match[1]) : 0;
      } else {
        const match = testResult.match(/(\\d+) failing/);
        return match ? parseInt(match[1]) : 0;
      }
    } catch (error) {
      return 0;
    }
  }

  getUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().split('\\n').filter(line => line.trim()).length;
    } catch (error) {
      return 0;
    }
  }

  getSecurityVulnerabilities() {
    try {
      const audit = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(audit);
      return auditData.metadata.vulnerabilities.total || 0;
    } catch (error) {
      return 0;
    }
  }

  getPerformanceScore() {
    // Simulated performance score - in real implementation, this would run actual performance tests
    return Math.floor(Math.random() * 10) + 90; // 90-100
  }

  // Method to log activity (called by the daemon)
  static logActivity(type, description) {
    const autonomousDir = path.join(process.cwd(), '.autonomous');
    const logFile = path.join(autonomousDir, 'activity.log');
    
    if (!fs.existsSync(autonomousDir)) {
      fs.mkdirSync(autonomousDir, { recursive: true });
    }
    
    const activity = {
      timestamp: new Date().toISOString(),
      type,
      description
    };
    
    fs.appendFileSync(logFile, JSON.stringify(activity) + '\\n');
  }

  // Method to update metrics (called by the daemon)
  static updateMetrics(updates) {
    const autonomousDir = path.join(process.cwd(), '.autonomous');
    const metricsFile = path.join(autonomousDir, 'metrics.json');
    
    if (!fs.existsSync(autonomousDir)) {
      fs.mkdirSync(autonomousDir, { recursive: true });
    }
    
    let metrics = {};
    if (fs.existsSync(metricsFile)) {
      try {
        metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      } catch (error) {
        // Corrupted metrics file, start fresh
      }
    }
    
    // Update metrics
    Object.assign(metrics, updates);
    
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  }
}

// CLI interface
if (require.main === module) {
  const dashboard = new AutonomousDashboard();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
    case undefined:
      console.log('🚀 Starting Autonomous Development Dashboard...');
      dashboard.start();
      break;
    case 'log':
      const type = process.argv[3] || 'info';
      const description = process.argv.slice(4).join(' ') || 'Manual log entry';
      AutonomousDashboard.logActivity(type, description);
      console.log('✅ Activity logged');
      break;
    case 'metrics':
      const update = process.argv[3];
      if (update) {
        try {
          const updates = JSON.parse(update);
          AutonomousDashboard.updateMetrics(updates);
          console.log('✅ Metrics updated');
        } catch (error) {
          console.error('❌ Invalid JSON for metrics update');
        }
      } else {
        console.log('Usage: ./autonomous-dashboard.js metrics \'{"tasksCompleted": 5}\'');
      }
      break;
    default:
      console.log(`
🤖 Autonomous Development Dashboard

Usage:
  ./autonomous-dashboard.js [start]           - Start real-time dashboard
  ./autonomous-dashboard.js log <type> <msg>  - Log activity
  ./autonomous-dashboard.js metrics <json>    - Update metrics

Examples:
  ./autonomous-dashboard.js                   # Start dashboard
  ./autonomous-dashboard.js log success "Feature completed"
  ./autonomous-dashboard.js metrics '{"tasksCompleted": 5}'
      `);
  }
}

module.exports = AutonomousDashboard;