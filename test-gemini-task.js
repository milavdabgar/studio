#!/usr/bin/env node

/**
 * Simple test for Gemini autonomous development
 * Creates a single autonomous task and executes it
 */

const AutonomousDaemon = require('./scripts/autonomous-daemon.js');

async function testGeminiTask() {
  console.log('🔮 Testing Gemini Autonomous Development...');
  console.log('═══════════════════════════════════════════');
  
  const daemon = new AutonomousDaemon();
  
  // Create a simple test task
  const testTask = {
    type: 'code-quality',
    priority: 'medium',
    reason: 'Testing Gemini with lint fixes',
    created: new Date()
  };
  
  console.log('📝 Test task:', JSON.stringify(testTask, null, 2));
  
  try {
    // Execute the task with Gemini
    console.log('\n🚀 Executing autonomous task with Gemini...');
    await daemon.executeAutonomousTask(testTask);
    
    console.log('✅ Gemini autonomous task completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testGeminiTask().catch(console.error);
}

module.exports = { testGeminiTask };