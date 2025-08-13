import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'

// Mock MongoDB connection
jest.mock('./src/lib/mongodb', () => ({
  connectMongoose: jest.fn().mockResolvedValue(undefined),
}))

// Mock Radix UI Dialog for testing
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react');
  return {
    Root: ({ children, open, onOpenChange }) => {
      const MockRoot = ({ children }) => {
        return React.createElement(
          'div',
          { 'data-testid': 'dialog-root' },
          open ? children : null
        );
      };
      return React.createElement(MockRoot, { children });
    },
    Portal: ({ children }) => React.createElement('div', { 'data-testid': 'dialog-portal' }, children),
    Overlay: ({ children, ...props }) => React.createElement('div', { ...props, 'data-testid': 'dialog-overlay' }, children),
    Content: ({ children, ...props }) => React.createElement('div', { role: 'dialog', 'data-testid': 'dialog-content', ...props }, children),
    Trigger: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'dialog-trigger' }, children),
    Close: ({ children, ...props }) => React.createElement('button', { ...props, 'data-testid': 'dialog-close' }, children),
    Title: ({ children, ...props }) => React.createElement('h2', { ...props, 'data-testid': 'dialog-title' }, children),
    Description: ({ children, ...props }) => React.createElement('p', { ...props, 'data-testid': 'dialog-description' }, children),
  };
})

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}