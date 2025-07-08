const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simulate the planning logic
function analyzeCodebaseState() {
  function getLintIssueCount() {
    try {
      const result = execSync('npm run lint', { encoding: 'utf8' });
      const warnings = (result.match(/warning/gi) || []).length;
      const errors = (result.match(/error/gi) || []).length;
      return errors + warnings;
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : '';
      const errorOutput = error.stderr ? error.stderr.toString() : '';
      const combined = output + errorOutput;
      
      const warnings = (combined.match(/warning/gi) || []).length;
      const errors = (combined.match(/error/gi) || []).length;
      return errors + warnings;
    }
  }
  
  return {
    lintIssues: getLintIssueCount()
  };
}

function prioritizeTasks(analysis) {
  const tasks = [];
  
  if (analysis.lintIssues > 100) {
    tasks.push({
      type: 'code-quality',
      priority: 'high', 
      reason: `${analysis.lintIssues} lint issues (high volume)`,
      created: new Date(),
      id: Date.now()
    });
  }
  
  return tasks;
}

// Run analysis
console.log('Analyzing codebase...');
const analysis = analyzeCodebaseState();
console.log('Analysis:', analysis);

const tasks = prioritizeTasks(analysis);
console.log('Generated tasks:', tasks);

if (tasks.length > 0) {
  // Create task queue file
  const queueFile = path.join(process.cwd(), '.autonomous', 'task-queue.json');
  const queueDir = path.dirname(queueFile);
  
  if (!fs.existsSync(queueDir)) {
    fs.mkdirSync(queueDir, { recursive: true });
  }
  
  fs.writeFileSync(queueFile, JSON.stringify(tasks, null, 2));
  console.log('Task queue created with', tasks.length, 'tasks');
}