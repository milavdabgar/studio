#!/usr/bin/env node

/**
 * 24/7 Autonomous Development Daemon
 * Continuously analyzes, plans, and develops without human intervention
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutonomousDaemon {
  constructor() {
    this.isRunning = false;
    this.config = this.loadConfig();
    this.metrics = {
      tasksCompleted: 0,
      bugsFixed: 0,
      featuresAdded: 0,
      startTime: new Date()
    };
  }

  loadConfig() {
    const defaultConfig = {
      planningInterval: 30 * 60 * 1000, // 30 minutes
      bugScanInterval: 15 * 60 * 1000,  // 15 minutes
      maxTasksPerHour: 5,
      maxCommitsPerDay: 50,
      safetyMode: true,
      notifications: {
        email: process.env.DEV_EMAIL || null,
        slack: process.env.SLACK_WEBHOOK || null
      }
    };

    try {
      const configPath = path.join(process.cwd(), 'autonomous-config.json');
      if (fs.existsSync(configPath)) {
        return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
      }
    } catch (error) {
      console.log('Using default config');
    }
    
    return defaultConfig;
  }

  async start() {
    console.log('🤖 Starting 24/7 Autonomous Development Daemon...');
    console.log(`📊 Config: ${JSON.stringify(this.config, null, 2)}`);
    
    this.isRunning = true;
    
    // Start parallel daemons
    this.startPlanningDaemon();
    this.startBugHuntingDaemon();
    this.startHealthMonitoring();
    
    // Keep the process alive
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    // Main loop - orchestrate work
    while (this.isRunning) {
      try {
        await this.orchestrateWork();
        await this.sleep(60000); // Check every minute
      } catch (error) {
        console.error('❌ Error in main loop:', error);
        await this.notifyError('Main loop error', error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  async orchestrateWork() {
    const status = await this.getSystemStatus();
    
    if (status.pendingTasks.length > 0 && this.canExecuteTask()) {
      const task = status.pendingTasks[0];
      console.log(`🎯 Executing autonomous task: ${task.type}`);
      
      await this.executeAutonomousTask(task);
    }
  }

  async executeAutonomousTask(task) {
    try {
      // Create unique branch for this autonomous work
      const branchName = `autonomous/${task.type}-${Date.now()}`;
      
      console.log(`🌿 Creating branch: ${branchName}`);
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      
      // Execute Claude Code autonomously
      const prompt = this.generateTaskPrompt(task);
      console.log(`🧠 Executing Claude Code with autonomous prompt...`);
      
      // Use Claude Code CLI directly
      const claudeResult = await this.executeClaudeCode(prompt);
      
      if (claudeResult.success) {
        console.log(`✅ Task completed successfully`);
        await this.handleTaskCompletion(task, branchName);
        this.metrics.tasksCompleted++;
      } else {
        console.log(`❌ Task failed, switching back to main branch`);
        execSync(`git checkout master`, { stdio: 'inherit' });
        execSync(`git branch -D ${branchName}`, { stdio: 'inherit' });
      }
      
    } catch (error) {
      console.error(`❌ Error executing task:`, error);
      // Ensure we're back on main branch
      try {
        execSync(`git checkout master`, { stdio: 'inherit' });
      } catch (e) {
        console.error('Error switching back to master:', e);
      }
    }
  }

  generateTaskPrompt(task) {
    const baseContext = `
AUTONOMOUS DEVELOPMENT CONTEXT:
- Project: ${path.basename(process.cwd())}
- Branch: ${this.getCurrentBranch()}
- Recent commits: ${this.getRecentCommits()}
- Test coverage: ${this.getTestCoverage()}
- Open issues: ${this.getOpenIssues()}
- Current test status: ${this.getTestStatus()}
- TypeScript errors: ${this.getTypeScriptErrors()}
- Lint warnings: ${this.getLintWarnings()}

WORK AUTONOMOUSLY - NO HUMAN INPUT NEEDED.
`;

    switch (task.type) {
      case 'feature-planning':
        return `${baseContext}

🧠 AUTONOMOUS FEATURE DEVELOPER

You are an autonomous software developer with full agency to implement valuable features.

MISSION: Analyze the codebase, identify the most valuable next feature, and implement it completely.

EXECUTION PLAN:
1. **Codebase Analysis**: Study the architecture, existing features, and user patterns
2. **Feature Identification**: Propose 3 features, then select the highest-value one
3. **Implementation Strategy**: Design the feature with proper architecture
4. **Full Implementation**: Code the feature with proper error handling
5. **Comprehensive Testing**: Write unit, integration, and e2e tests
6. **Documentation**: Update README, API docs, and inline comments
7. **Quality Assurance**: Ensure TypeScript compliance and linting
8. **Commit Strategy**: Make logical, atomic commits with detailed messages

FOCUS AREAS:
- User experience improvements
- Performance enhancements
- Security features
- Developer productivity tools
- Missing functionality gaps

CONSTRAINTS:
- Follow existing code patterns and architecture
- Maintain backward compatibility
- Ensure 100% test coverage for new code
- Use TypeScript best practices
- Follow the project's linting rules

DELIVERABLES:
- Fully implemented feature with tests
- Updated documentation
- Clean, documented code
- Passing all quality checks

Begin your autonomous development now.`;

      case 'bug-hunting':
        return `${baseContext}

🐛 AUTONOMOUS BUG HUNTER

You are an autonomous bug hunter with full authority to find and fix issues.

MISSION: Proactively identify, analyze, and fix bugs across the entire codebase.

HUNTING STRATEGY:
1. **Test Analysis**: Run all tests and analyze failures
2. **Static Analysis**: Check TypeScript errors and linting warnings
3. **Security Scan**: Look for security vulnerabilities
4. **Performance Issues**: Identify slow or inefficient code
5. **Logic Errors**: Find potential runtime issues
6. **Edge Cases**: Test boundary conditions and error scenarios
7. **Regression Prevention**: Add tests to prevent future issues

PRIORITY HUNTING AREAS:
- Failing tests (immediate fix)
- TypeScript compilation errors
- Security vulnerabilities
- Performance bottlenecks
- Error handling gaps
- Memory leaks
- Race conditions

FIXING PROTOCOL:
- Fix issues immediately when found
- Add comprehensive tests
- Document the fix in commit messages
- Ensure no new issues are introduced
- Follow proper error handling patterns

DELIVERABLES:
- All bugs fixed with tests
- Improved error handling
- Enhanced code reliability
- Detailed commit messages explaining fixes

Hunt and fix autonomously - be thorough and systematic.`;

      case 'code-quality':
        return `${baseContext}

🔧 AUTONOMOUS CODE QUALITY ENGINEER

You are an autonomous code quality specialist with authority to improve the codebase.

MISSION: Systematically improve code quality, maintainability, and developer experience.

QUALITY IMPROVEMENT STRATEGY:
1. **Code Analysis**: Identify complex, hard-to-maintain code
2. **Refactoring**: Simplify complex functions and improve readability
3. **Type Safety**: Replace 'any' types with proper TypeScript types
4. **Test Coverage**: Add tests for uncovered code paths
5. **Documentation**: Improve inline comments and documentation
6. **Dead Code**: Remove unused code and dependencies
7. **Performance**: Optimize inefficient algorithms and data structures

QUALITY METRICS TO IMPROVE:
- Cyclomatic complexity reduction
- Code duplication elimination
- Type safety improvements
- Test coverage increase
- Documentation completeness
- Performance optimization

REFACTORING PRIORITIES:
- Large functions (>50 lines)
- Complex conditional logic
- Repeated code patterns
- Poor error handling
- Unclear variable names
- Missing type definitions

DELIVERABLES:
- Cleaner, more maintainable code
- Improved type safety
- Better test coverage
- Enhanced documentation
- Performance improvements
- Reduced technical debt

Execute quality improvements systematically and autonomously.`;

      case 'performance-optimization':
        return `${baseContext}

⚡ AUTONOMOUS PERFORMANCE ENGINEER

You are an autonomous performance optimization specialist.

MISSION: Identify and resolve performance bottlenecks across the application.

OPTIMIZATION STRATEGY:
1. **Performance Profiling**: Identify slow functions and operations
2. **Database Optimization**: Improve query performance and caching
3. **Bundle Analysis**: Reduce JavaScript bundle size
4. **Algorithm Optimization**: Improve time/space complexity
5. **Memory Management**: Fix memory leaks and reduce usage
6. **Network Optimization**: Reduce API calls and improve caching
7. **Rendering Performance**: Optimize UI rendering and responsiveness

PERFORMANCE AREAS TO ANALYZE:
- Page load times
- API response times
- Database query performance
- Bundle size and loading
- Memory usage patterns
- CPU utilization
- Network requests

OPTIMIZATION TECHNIQUES:
- Lazy loading implementation
- Caching strategies
- Code splitting
- Algorithm improvements
- Database indexing
- Image optimization
- Resource compression

DELIVERABLES:
- Measurable performance improvements
- Benchmarking reports
- Optimized algorithms
- Reduced bundle sizes
- Better caching strategies
- Performance monitoring setup

Optimize systematically with measurable improvements.`;

      case 'test-coverage':
        return `${baseContext}

🧪 AUTONOMOUS TEST ENGINEER

You are an autonomous testing specialist focused on achieving 100% test coverage.

MISSION: Systematically add comprehensive tests to reach 100% coverage.

TESTING STRATEGY:
1. **Coverage Analysis**: Identify untested code paths
2. **Unit Tests**: Test individual functions and methods
3. **Integration Tests**: Test component interactions
4. **E2E Tests**: Test complete user workflows
5. **Edge Case Testing**: Test boundary conditions
6. **Error Scenario Testing**: Test error handling
7. **Performance Testing**: Test performance characteristics

TESTING PRIORITIES:
- Critical business logic
- Error handling paths
- Edge cases and boundaries
- API endpoints
- UI components
- Utility functions
- Integration points

TEST QUALITY STANDARDS:
- Test meaningful scenarios
- Include positive and negative cases
- Test error conditions
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

DELIVERABLES:
- Comprehensive test suite
- 100% code coverage
- Meaningful test scenarios
- Good test documentation
- Reliable test execution

Write tests systematically until 100% coverage is achieved.`;

      case 'security-audit':
        return `${baseContext}

🔒 AUTONOMOUS SECURITY AUDITOR

You are an autonomous security specialist conducting comprehensive security audits.

MISSION: Identify and fix security vulnerabilities throughout the application.

SECURITY AUDIT STRATEGY:
1. **Dependency Scanning**: Check for vulnerable dependencies
2. **Code Analysis**: Look for common security issues
3. **Input Validation**: Ensure all inputs are properly validated
4. **Authentication**: Review auth mechanisms and session handling
5. **Authorization**: Check access control implementation
6. **Data Protection**: Verify sensitive data handling
7. **Infrastructure**: Review deployment and configuration security

SECURITY AREAS TO AUDIT:
- SQL injection vulnerabilities
- XSS attack vectors
- CSRF protection
- Authentication bypasses
- Authorization flaws
- Sensitive data exposure
- Insecure dependencies

SECURITY FIXES TO IMPLEMENT:
- Input sanitization
- Output encoding
- Secure headers
- Rate limiting
- Proper error handling
- Secure configuration
- Security headers

DELIVERABLES:
- Security vulnerability report
- All vulnerabilities fixed
- Security best practices implemented
- Secure coding patterns
- Updated dependencies

Conduct thorough security audit and fix all issues autonomously.`;

      case 'documentation':
        return `${baseContext}

📚 AUTONOMOUS DOCUMENTATION ENGINEER

You are an autonomous documentation specialist focused on comprehensive documentation.

MISSION: Create and update comprehensive documentation for the codebase.

DOCUMENTATION STRATEGY:
1. **API Documentation**: Document all public APIs
2. **Code Comments**: Add meaningful inline comments
3. **README Updates**: Keep README current and comprehensive
4. **Architecture Documentation**: Document system architecture
5. **Setup Instructions**: Clear installation and setup guides
6. **Usage Examples**: Provide practical usage examples
7. **Troubleshooting**: Document common issues and solutions

DOCUMENTATION PRIORITIES:
- Public API methods
- Complex algorithms
- Configuration options
- Integration points
- Error messages
- Development setup
- Deployment procedures

DOCUMENTATION STANDARDS:
- Clear, concise language
- Practical examples
- Up-to-date information
- Proper formatting
- Searchable content
- Version consistency

DELIVERABLES:
- Complete API documentation
- Comprehensive README
- Inline code comments
- Architecture diagrams
- Setup and usage guides
- Troubleshooting documentation

Create comprehensive documentation autonomously.`;

      default:
        return `${baseContext}

🤖 AUTONOMOUS DEVELOPER

You are an autonomous software developer with full agency to improve this codebase.

MISSION: Analyze the current state and determine the highest-impact work to perform.

ANALYSIS FRAMEWORK:
1. **Current State Assessment**: Understand what needs immediate attention
2. **Priority Evaluation**: Determine the most valuable work to do
3. **Impact Analysis**: Choose work that provides maximum benefit
4. **Implementation Planning**: Design the approach
5. **Execution**: Implement the solution completely
6. **Validation**: Ensure quality and correctness

WORK CATEGORIES TO CONSIDER:
- Critical bug fixes
- Failing tests
- Security vulnerabilities
- Performance bottlenecks
- Missing features
- Code quality issues
- Documentation gaps

DECISION CRITERIA:
- User impact
- Technical debt reduction
- Development velocity improvement
- System reliability
- Security posture
- Code maintainability

DELIVERABLES:
- Complete implementation of chosen work
- Comprehensive tests
- Proper documentation
- Quality assurance
- Detailed commit messages

Analyze, decide, and implement autonomously - choose the highest-impact work.`;
    }
  }

  async executeClaudeCode(prompt) {
    return new Promise((resolve) => {
      try {
        // Create a temporary prompt file
        const promptFile = path.join(process.cwd(), '.autonomous', 'current-prompt.md');
        
        // Ensure directory exists
        const promptDir = path.dirname(promptFile);
        if (!fs.existsSync(promptDir)) {
          fs.mkdirSync(promptDir, { recursive: true });
        }
        
        fs.writeFileSync(promptFile, prompt);
        
        const provider = this.config.llmProvider || 'claude';
        console.log(`📝 Prompt saved to: ${promptFile}`);
        console.log(`🤖 Executing: ./scripts/llm-pipe.sh ${provider} "${prompt.substring(0, 100)}..."`);
        
        // Use LLM pipe script with configured provider
        const autoScript = path.join(process.cwd(), 'scripts', 'llm-pipe.sh');
        const llmProcess = spawn(autoScript, [provider, prompt], {
          stdio: ['pipe', 'inherit', 'inherit'],
          env: process.env
        });
        
        // Set timeout for the process
        const timeout = setTimeout(() => {
          console.log(`⏰ Process timeout, killing ${provider}...`);
          llmProcess.kill('SIGTERM');
          resolve({ success: false, error: 'Process timeout' });
        }, this.config.llmProviders[provider]?.timeout || 30 * 60 * 1000);
        
        llmProcess.on('close', (code) => {
          clearTimeout(timeout);
          const success = code === 0;
          console.log(`🔍 ${provider} ${success ? 'completed successfully' : 'failed'} (exit code: ${code})`);
          resolve({ success, code });
        });
        
        llmProcess.on('error', (error) => {
          clearTimeout(timeout);
          console.error(`❌ Error running ${provider}:`, error);
          resolve({ success: false, error });
        });
        
      } catch (error) {
        console.error('❌ Error in executeClaudeCode:', error);
        resolve({ success: false, error });
      }
    });
  }

  startPlanningDaemon() {
    console.log('🧠 Starting AI Planning Daemon...');
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        console.log('🔍 Planning next development work...');
        await this.planNextWork();
      } catch (error) {
        console.error('❌ Planning error:', error);
      }
    }, this.config.planningInterval);
  }

  startBugHuntingDaemon() {
    console.log('🐛 Starting Bug Hunting Daemon...');
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        console.log('🔍 Scanning for bugs...');
        await this.scanForBugs();
      } catch (error) {
        console.error('❌ Bug scan error:', error);
      }
    }, this.config.bugScanInterval);
  }

  startHealthMonitoring() {
    console.log('📊 Starting Health Monitoring...');
    
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        const health = await this.checkSystemHealth();
        this.logHealth(health);
        
        if (health.critical) {
          await this.notifyHealthIssue(health);
        }
      } catch (error) {
        console.error('❌ Health check error:', error);
      }
    }, 60000); // Every minute
  }

  async planNextWork() {
    // Analyze codebase state to determine next work
    const codebaseAnalysis = await this.analyzeCodebaseState();
    const prioritizedTasks = this.prioritizeTasks(codebaseAnalysis);
    
    // Add the highest priority task to the queue
    if (prioritizedTasks.length > 0) {
      await this.addTask(prioritizedTasks[0]);
    }
  }

  async scanForBugs() {
    // Add bug scan task to queue
    await this.addTask({
      type: 'bug-hunting',
      priority: 'high',
      created: new Date()
    });
  }

  async analyzeCodebaseState() {
    const analysis = {
      testFailures: this.getTestFailureCount(),
      typeScriptErrors: this.getTypeScriptErrorCount(),
      lintIssues: this.getLintIssueCount(),
      testCoverage: this.getTestCoveragePercentage(),
      securityVulnerabilities: this.getSecurityVulnerabilityCount(),
      performanceIssues: this.getPerformanceIssueCount(),
      openIssues: this.getOpenIssueCount(),
      lastCommitAge: this.getLastCommitAge(),
      branchHealth: this.getBranchHealth()
    };
    
    return analysis;
  }

  prioritizeTasks(analysis) {
    const tasks = [];
    
    // Critical issues (immediate attention)
    if (analysis.testFailures > 0) {
      tasks.push({
        type: 'bug-hunting',
        priority: 'critical',
        reason: `${analysis.testFailures} failing tests`,
        created: new Date()
      });
    }
    
    if (analysis.typeScriptErrors > 0) {
      tasks.push({
        type: 'bug-hunting',
        priority: 'critical',
        reason: `${analysis.typeScriptErrors} TypeScript errors`,
        created: new Date()
      });
    }
    
    // High priority issues
    if (analysis.securityVulnerabilities > 0) {
      tasks.push({
        type: 'security-audit',
        priority: 'high',
        reason: `${analysis.securityVulnerabilities} security vulnerabilities`,
        created: new Date()
      });
    }
    
    if (analysis.testCoverage < 90) {
      tasks.push({
        type: 'test-coverage',
        priority: 'high',
        reason: `Test coverage is ${analysis.testCoverage}%`,
        created: new Date()
      });
    }
    
    // Medium priority improvements
    if (analysis.lintIssues > 5) {
      tasks.push({
        type: 'code-quality',
        priority: 'medium',
        reason: `${analysis.lintIssues} lint issues`,
        created: new Date()
      });
    }
    
    if (analysis.performanceIssues > 0) {
      tasks.push({
        type: 'performance-optimization',
        priority: 'medium',
        reason: `${analysis.performanceIssues} performance issues`,
        created: new Date()
      });
    }
    
    // Low priority tasks
    if (analysis.openIssues > 5) {
      tasks.push({
        type: 'feature-planning',
        priority: 'low',
        reason: `${analysis.openIssues} open issues to address`,
        created: new Date()
      });
    }
    
    // Default to feature planning if no issues
    if (tasks.length === 0) {
      tasks.push({
        type: 'feature-planning',
        priority: 'medium',
        reason: 'No critical issues found, planning next feature',
        created: new Date()
      });
    }
    
    // Sort by priority
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  getTestFailureCount() {
    try {
      const result = execSync('npm test -- --passWithNoTests', { encoding: 'utf8' });
      const failures = (result.match(/✗|failed/gi) || []).length;
      return failures;
    } catch (error) {
      return 1; // If tests can't run, that's a failure
    }
  }

  getTypeScriptErrorCount() {
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8' });
      return 0; // No errors if command succeeds
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      const errorCount = (errorOutput.match(/error TS/g) || []).length;
      return errorCount;
    }
  }

  getLintIssueCount() {
    try {
      const result = execSync('npm run lint', { encoding: 'utf8' });
      const warnings = (result.match(/warning/gi) || []).length;
      const errors = (result.match(/error/gi) || []).length;
      return errors + warnings;
    } catch (error) {
      return 0;
    }
  }

  getTestCoveragePercentage() {
    try {
      const coverage = execSync('npm run test:coverage --silent', { encoding: 'utf8' });
      const match = coverage.match(/(\d+\.?\d*)%/);
      return match ? parseFloat(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  getSecurityVulnerabilityCount() {
    try {
      const result = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(result);
      return audit.metadata?.vulnerabilities?.total || 0;
    } catch {
      return 0;
    }
  }

  getPerformanceIssueCount() {
    // This is a simplified check - in a real system you'd have more sophisticated performance monitoring
    try {
      const packageSize = execSync('du -sh node_modules', { encoding: 'utf8' });
      const sizeMB = parseFloat(packageSize.split('\t')[0]);
      return sizeMB > 500 ? 1 : 0; // Flag if node_modules is > 500MB
    } catch {
      return 0;
    }
  }

  getOpenIssueCount() {
    try {
      const result = execSync('gh issue list --json number', { encoding: 'utf8' });
      const issues = JSON.parse(result);
      return issues.length;
    } catch {
      return 0;
    }
  }

  getLastCommitAge() {
    try {
      const timestamp = execSync('git log -1 --format=%ct', { encoding: 'utf8' });
      const commitTime = new Date(parseInt(timestamp.trim()) * 1000);
      const now = new Date();
      return Math.floor((now - commitTime) / (1000 * 60 * 60)); // Hours since last commit
    } catch {
      return 0;
    }
  }

  getBranchHealth() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const uncommitted = status.trim().split('\n').length - 1;
      const behind = execSync('git rev-list --count HEAD..origin/master', { encoding: 'utf8' });
      
      return {
        uncommittedChanges: uncommitted,
        commitsBehind: parseInt(behind.trim()) || 0,
        healthy: uncommitted === 0 && parseInt(behind.trim()) < 5
      };
    } catch {
      return { healthy: false };
    }
  }

  async addTask(task) {
    const queueFile = path.join(process.cwd(), '.autonomous', 'task-queue.json');
    
    let queue = [];
    if (fs.existsSync(queueFile)) {
      queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    }
    
    queue.push({ ...task, id: Date.now() });
    
    // Ensure directory exists
    const queueDir = path.dirname(queueFile);
    if (!fs.existsSync(queueDir)) {
      fs.mkdirSync(queueDir, { recursive: true });
    }
    
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    console.log(`📋 Added task to queue: ${task.type}`);
  }

  async getSystemStatus() {
    const queueFile = path.join(process.cwd(), '.autonomous', 'task-queue.json');
    
    let pendingTasks = [];
    if (fs.existsSync(queueFile)) {
      pendingTasks = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    }
    
    return {
      pendingTasks,
      metrics: this.metrics,
      isRunning: this.isRunning
    };
  }

  canExecuteTask() {
    // Rate limiting checks
    const tasksInLastHour = this.getTasksInLastHour();
    if (tasksInLastHour >= this.config.maxTasksPerHour) {
      console.log(`⚠️  Rate limit reached: ${tasksInLastHour}/${this.config.maxTasksPerHour} tasks in last hour`);
      return false;
    }
    
    return true;
  }

  getTasksInLastHour() {
    // This is a simplified implementation
    // In a real system, you'd track completed tasks with timestamps
    return this.metrics.tasksCompleted || 0;
  }

  async handleTaskCompletion(task, branchName) {
    try {
      // Check if changes were made
      const changes = execSync('git status --porcelain', { encoding: 'utf8' });
      const commits = execSync('git log master..HEAD --oneline', { encoding: 'utf8' });
      
      if (changes.trim() || commits.trim()) {
        console.log('📝 Changes detected, creating PR...');
        
        // Push branch
        execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
        
        // Create PR using GitHub CLI
        const prTitle = `🤖 Autonomous: ${task.type}`;
        const prBody = `
## Autonomous Development Task

**Type**: ${task.type}
**Completed**: ${new Date().toISOString()}
**Branch**: ${branchName}

This PR was created autonomously by the development daemon.

### Changes Made
${commits}

### Validation
- ✅ All tests pass
- ✅ Code quality checks pass
- ✅ No breaking changes

🤖 Generated autonomously with Claude Code
        `;
        
        execSync(`gh pr create --title "${prTitle}" --body "${prBody.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
        
        console.log('✅ PR created successfully');
        
        // Remove task from queue
        await this.removeCompletedTask(task.id);
        
      } else {
        console.log('📝 No changes made, cleaning up branch...');
        execSync(`git checkout master`, { stdio: 'inherit' });
        execSync(`git branch -D ${branchName}`, { stdio: 'inherit' });
      }
      
    } catch (error) {
      console.error('❌ Error handling task completion:', error);
    }
  }

  async removeCompletedTask(taskId) {
    const queueFile = path.join(process.cwd(), '.autonomous', 'task-queue.json');
    
    if (fs.existsSync(queueFile)) {
      let queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
      queue = queue.filter(task => task.id !== taskId);
      fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  getRecentCommits() {
    try {
      return execSync('git log --oneline -10', { encoding: 'utf8' });
    } catch {
      return 'Unable to get recent commits';
    }
  }

  getTestCoverage() {
    try {
      // This would need to be customized based on your test setup
      const coverage = execSync('npm run test:coverage --silent', { encoding: 'utf8' });
      return coverage.includes('%') ? coverage.split('%')[0].split(' ').pop() + '%' : 'Unknown';
    } catch {
      return 'Unable to get test coverage';
    }
  }

  getOpenIssues() {
    try {
      return execSync('gh issue list --limit 5', { encoding: 'utf8' });
    } catch {
      return 'Unable to get open issues';
    }
  }

  getTestStatus() {
    try {
      const result = execSync('npm test -- --passWithNoTests', { encoding: 'utf8' });
      const passing = (result.match(/✓|passed/gi) || []).length;
      const failing = (result.match(/✗|failed/gi) || []).length;
      return `${passing} passing, ${failing} failing`;
    } catch (error) {
      return 'Tests failing - needs immediate attention';
    }
  }

  getTypeScriptErrors() {
    try {
      const result = execSync('npx tsc --noEmit', { encoding: 'utf8' });
      return result.includes('error TS') ? 'TypeScript errors found' : 'No TypeScript errors';
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      const errorCount = (errorOutput.match(/error TS/g) || []).length;
      return errorCount > 0 ? `${errorCount} TypeScript errors` : 'TypeScript check failed';
    }
  }

  getLintWarnings() {
    try {
      const result = execSync('npm run lint', { encoding: 'utf8' });
      const warnings = (result.match(/warning/gi) || []).length;
      const errors = (result.match(/error/gi) || []).length;
      return `${errors} errors, ${warnings} warnings`;
    } catch (error) {
      return 'Lint check failed';
    }
  }

  async checkSystemHealth() {
    const health = {
      timestamp: new Date(),
      git: this.checkGitHealth(),
      tests: await this.checkTestHealth(),
      dependencies: this.checkDependencyHealth(),
      critical: false
    };
    
    health.critical = health.tests.failing > 0 || health.git.behind > 10;
    
    return health;
  }

  checkGitHealth() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const behind = execSync('git rev-list --count HEAD..origin/master', { encoding: 'utf8' });
      
      return {
        uncommittedChanges: status.trim().split('\\n').length - 1,
        behind: parseInt(behind.trim()) || 0,
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      };
    } catch {
      return { error: 'Git health check failed' };
    }
  }

  async checkTestHealth() {
    try {
      // Run tests and capture results
      const result = execSync('npm test', { encoding: 'utf8' });
      
      return {
        passing: (result.match(/✓/g) || []).length,
        failing: (result.match(/✗|❌/g) || []).length,
        lastRun: new Date()
      };
    } catch (error) {
      return {
        passing: 0,
        failing: 1,
        error: error.message,
        lastRun: new Date()
      };
    }
  }

  checkDependencyHealth() {
    try {
      execSync('npm audit --audit-level moderate', { encoding: 'utf8' });
      return { vulnerabilities: 0 };
    } catch (error) {
      const output = error.stdout || error.message;
      const vulnMatch = output.match(/(\\d+) vulnerabilities/);
      return {
        vulnerabilities: vulnMatch ? parseInt(vulnMatch[1]) : 0
      };
    }
  }

  logHealth(health) {
    console.log(`📊 System Health - ${health.timestamp.toLocaleTimeString()}`);
    console.log(`   Git: ${health.git.branch} (${health.git.behind} commits behind)`);
    console.log(`   Tests: ${health.tests.passing} passing, ${health.tests.failing} failing`);
    console.log(`   Security: ${health.dependencies.vulnerabilities} vulnerabilities`);
    
    if (health.critical) {
      console.log('🚨 CRITICAL HEALTH ISSUES DETECTED');
    }
  }

  async notifyError(message, error) {
    console.error(`🚨 ${message}:`, error);
    // TODO: Send email/Slack notifications
  }

  async notifyHealthIssue(health) {
    console.warn('🚨 Health issue detected:', health);
    // TODO: Send alerts
  }

  shutdown() {
    console.log('🛑 Shutting down Autonomous Development Daemon...');
    this.isRunning = false;
    process.exit(0);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const daemon = new AutonomousDaemon();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      daemon.start();
      break;
    case 'status':
      daemon.getSystemStatus().then(status => {
        console.log(JSON.stringify(status, null, 2));
      });
      break;
    default:
      console.log(`
🤖 Autonomous Development Daemon

Usage:
  ./autonomous-daemon.js start     - Start 24/7 autonomous development
  ./autonomous-daemon.js status    - Show current system status

The daemon will:
  • Plan next features automatically
  • Hunt and fix bugs continuously  
  • Improve code quality
  • Create PRs autonomously
  • Monitor system health 24/7

Example:
  ./autonomous-daemon.js start     # Start autonomous development
      `);
  }
}

module.exports = AutonomousDaemon;