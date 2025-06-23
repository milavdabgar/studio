# Playwright MCP Server

A custom Model Context Protocol (MCP) server for automated testing and debugging with Playwright.

## Features

- **Test Execution**: Run Playwright tests with various configurations
- **Test Generation**: Automatically generate test files based on user actions
- **Debug Support**: Debug tests with breakpoints and step-through capabilities
- **Test Analysis**: Analyze test results and generate detailed reports
- **Coverage Reports**: Get test coverage information
- **Test Management**: List and manage test files

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the server:
```bash
npm run build
```

3. Install the MCP SDK globally (if not already installed):
```bash
npm install -g @modelcontextprotocol/sdk
```

## Usage

### Starting the MCP Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Available Tools

#### 1. run_playwright_test
Run Playwright tests with specified configuration.

**Parameters:**
- `testFile` (optional): Specific test file to run
- `testName` (optional): Specific test name to run
- `browser` (optional): Browser to run tests on ('chromium', 'firefox', 'webkit')
- `headless` (optional): Run tests in headless mode
- `debug` (optional): Run tests in debug mode

**Example:**
```json
{
  "testFile": "e2e/login.spec.ts",
  "browser": "chromium",
  "headless": false
}
```

#### 2. debug_playwright_test
Debug a specific Playwright test with breakpoints.

**Parameters:**
- `testFile`: Test file to debug (required)
- `testName` (optional): Specific test name to debug
- `browser` (optional): Browser to debug on
- `breakpoints` (optional): Line numbers to set breakpoints on

**Example:**
```json
{
  "testFile": "e2e/dashboard.spec.ts",
  "testName": "should load dashboard",
  "breakpoints": [15, 25, 40]
}
```

#### 3. generate_playwright_test
Generate a new Playwright test based on user actions.

**Parameters:**
- `url`: URL to test (required)
- `testName`: Name for the generated test (required)
- `actions`: Array of actions to perform (required)

**Example:**
```json
{
  "url": "http://localhost:3000/login",
  "testName": "User login flow",
  "actions": [
    {
      "type": "fill",
      "selector": "#email",
      "value": "user@example.com"
    },
    {
      "type": "fill",
      "selector": "#password",
      "value": "password123"
    },
    {
      "type": "click",
      "selector": "#login-button"
    },
    {
      "type": "assert",
      "selector": "#dashboard",
      "value": "Welcome"
    }
  ]
}
```

#### 4. analyze_test_results
Analyze and format Playwright test results.

**Parameters:**
- `testRunId` (optional): ID of the test run to analyze
- `format` (optional): Output format ('json', 'html', 'text')

#### 5. get_test_coverage
Get test coverage report for the current test suite.

**Parameters:**
- `format` (optional): Output format ('json', 'html', 'text')

#### 6. list_test_files
List all available Playwright test files.

**Parameters:**
- `pattern` (optional): Pattern to filter test files

## Integration with VS Code

1. Add the MCP server to your VS Code settings:

```json
{
  "mcp.servers": {
    "playwright-testing": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "cwd": "/path/to/your/workspace"
    }
  }
}
```

2. Use the server through MCP-compatible tools or extensions.

## Configuration

The server can be configured through environment variables:

- `PLAYWRIGHT_WORKSPACE_ROOT`: Root directory of your Playwright project
- `PLAYWRIGHT_TEST_BASE_URL`: Base URL for your application (default: http://localhost:3000)
- `NODE_ENV`: Environment mode (development/production)

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts                 # Main MCP server
│   └── playwright/
│       ├── test-runner.ts       # Test execution logic
│       ├── debugger.ts          # Debug session management
│       └── reporter.ts          # Test analysis and reporting
├── dist/                        # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Development Commands

- `npm run dev`: Start development server with auto-reload
- `npm run build`: Build the TypeScript project
- `npm run test`: Run tests
- `npm run lint`: Lint the code
- `npm run clean`: Clean build artifacts

### Testing

Run the test suite:
```bash
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

1. **MCP Server not starting**: Check that all dependencies are installed and the build was successful.
2. **Tests not running**: Ensure Playwright is properly installed and configured in your workspace.
3. **Debug session not working**: Make sure the test file exists and is accessible.

### Debug Mode

To run the server in debug mode:
```bash
NODE_ENV=development npm run dev
```

This will provide additional logging and error information.

## Examples

### Running a specific test
```bash
# Through MCP client
mcp-client call run_playwright_test '{"testFile": "e2e/auth.spec.ts", "browser": "chromium"}'
```

### Generating a new test
```bash
# Through MCP client
mcp-client call generate_playwright_test '{
  "url": "http://localhost:3000",
  "testName": "Homepage test",
  "actions": [
    {"type": "navigate", "value": "http://localhost:3000"},
    {"type": "assert", "selector": "h1", "value": "Welcome"}
  ]
}'
```

### Getting test analysis
```bash
# Through MCP client
mcp-client call analyze_test_results '{"format": "html"}'
```
