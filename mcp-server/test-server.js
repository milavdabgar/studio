#!/usr/bin/env node

// Simple test script to verify MCP server functionality
import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('Testing Playwright MCP Server...');
console.log('Server path:', serverPath);

// Test the server by sending a simple request
const testServer = () => {
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Send a test request to list tools
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  };

  server.stdin.write(JSON.stringify(request) + '\n');
  server.stdin.end();

  let output = '';
  server.stdout.on('data', (data) => {
    output += data.toString();
  });

  server.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  server.on('close', (code) => {
    console.log('Server response:', output);
    console.log('Server exit code:', code);
    
    if (output.includes('run_playwright_test')) {
      console.log('✅ MCP Server is working correctly!');
    } else {
      console.log('❌ MCP Server test failed');
    }
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    server.kill();
    console.log('Server test timed out');
  }, 5000);
};

testServer();
