#!/usr/bin/env node

/**
 * Simple Autonomous Development Monitor
 * Monitors .autonomous directory for task progress
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutonomousMonitor {
  constructor() {
    this.autonomousDir = path.join(process.cwd(), '.autonomous');
    this.tasksDir = path.join(this.autonomousDir, 'tasks');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.autonomousDir)) {
      fs.mkdirSync(this.autonomousDir, { recursive: true });
    }
    if (!fs.existsSync(this.tasksDir)) {
      fs.mkdirSync(this.tasksDir, { recursive: true });
    }
  }

  listTasks() {
    try {
      const tasks = fs.readdirSync(this.tasksDir).filter(dir => 
        fs.statSync(path.join(this.tasksDir, dir)).isDirectory()
      );
      
      return tasks.map(taskId => {
        const taskDir = path.join(this.tasksDir, taskId);
        const scriptPath = path.join(taskDir, 'claude-script.md');
        const commitPath = path.join(taskDir, 'commit-template.txt');
        
        return {
          id: taskId,
          hasScript: fs.existsSync(scriptPath),
          hasCommitTemplate: fs.existsSync(commitPath),
          created: fs.statSync(taskDir).birthtime,
          path: taskDir
        };
      }).sort((a, b) => b.created - a.created);
    } catch (error) {
      return [];
    }
  }

  getTaskStatus(taskId) {
    const taskDir = path.join(this.tasksDir, taskId);
    if (!fs.existsSync(taskDir)) return null;

    try {
      // Check if there are any git changes in autonomous branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const isAutonomousBranch = currentBranch.includes('autonomous') && currentBranch.includes(taskId);
      
      // Check for git commits
      let commits = [];
      if (isAutonomousBranch) {
        try {
          const gitLog = execSync(`git log --oneline -5 --grep="#${taskId}"`, { encoding: 'utf8' });
          commits = gitLog.trim().split('\n').filter(line => line.trim());
        } catch (e) {
          // No commits yet
        }
      }

      // Check for modified files
      let modifiedFiles = [];
      try {
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
        modifiedFiles = gitStatus.trim().split('\n').filter(line => line.trim());
      } catch (e) {
        // No changes
      }

      return {
        id: taskId,
        branch: currentBranch,
        isAutonomousBranch,
        commits: commits.length,
        modifiedFiles: modifiedFiles.length,
        lastActivity: this.getLastActivity(taskDir),
        status: this.determineStatus(commits.length, modifiedFiles.length, isAutonomousBranch)
      };
    } catch (error) {
      return { id: taskId, error: error.message };
    }
  }

  getLastActivity(taskDir) {
    try {
      const files = fs.readdirSync(taskDir);
      let lastModified = 0;
      
      files.forEach(file => {
        const filePath = path.join(taskDir, file);
        const stat = fs.statSync(filePath);
        if (stat.mtime.getTime() > lastModified) {
          lastModified = stat.mtime.getTime();
        }
      });
      
      return new Date(lastModified);
    } catch (error) {
      return new Date(0);
    }
  }

  determineStatus(commits, modifiedFiles, isAutonomousBranch) {
    if (!isAutonomousBranch) return 'not-started';
    if (commits > 0) return 'completed';
    if (modifiedFiles > 0) return 'in-progress';
    return 'ready';
  }

  displayDashboard() {
    console.clear();
    console.log('🤖 Autonomous Development Monitor');
    console.log('================================\n');

    const tasks = this.listTasks();
    
    if (tasks.length === 0) {
      console.log('📭 No autonomous tasks found.');
      console.log('\nTo create a task: ./scripts/autonomous-dev.sh <issue-number>');
      return;
    }

    console.log(`📊 Found ${tasks.length} autonomous task(s):\n`);

    tasks.forEach(task => {
      const status = this.getTaskStatus(task.id);
      const statusEmoji = {
        'not-started': '⏳',
        'ready': '🎯',
        'in-progress': '🔄',
        'completed': '✅',
        'error': '❌'
      };

      console.log(`${statusEmoji[status.status] || '❓'} Task #${task.id}`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Branch: ${status.branch}`);
      console.log(`   Commits: ${status.commits}`);
      console.log(`   Modified files: ${status.modifiedFiles}`);
      console.log(`   Last activity: ${status.lastActivity.toLocaleString()}`);
      
      if (status.status === 'ready') {
        console.log(`   💡 Run: claude code .autonomous/tasks/${task.id}/claude-script.md`);
      }
      
      console.log('');
    });

    console.log('Commands:');
    console.log('  📝 Create task: ./scripts/autonomous-dev.sh <issue-number>');
    console.log('  🔍 Monitor: ./scripts/autonomous-monitor.js');
    console.log('  📊 Git status: git status');
  }

  startWatching() {
    console.log('👀 Watching for autonomous development changes...');
    console.log('Press Ctrl+C to stop\n');

    this.displayDashboard();
    
    setInterval(() => {
      this.displayDashboard();
    }, 5000); // Update every 5 seconds
  }
}

// CLI interface
const monitor = new AutonomousMonitor();

const command = process.argv[2];

switch (command) {
  case 'watch':
    monitor.startWatching();
    break;
  case 'list':
    const tasks = monitor.listTasks();
    console.log(JSON.stringify(tasks, null, 2));
    break;
  case 'status':
    const taskId = process.argv[3];
    if (!taskId) {
      console.log('Usage: autonomous-monitor.js status <task-id>');
      process.exit(1);
    }
    const status = monitor.getTaskStatus(taskId);
    console.log(JSON.stringify(status, null, 2));
    break;
  default:
    monitor.displayDashboard();
}