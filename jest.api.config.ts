import type { Config } from 'jest';

const config: Config = {
  // Base configuration
  
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/api/**/__tests__/**/*.test.ts',
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  
  // Transform settings
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
      tsconfig: 'tsconfig.test.json',
    }],
  },
  
  // Ignore node_modules except specific packages that need transformation
  transformIgnorePatterns: [
    '/node_modules/(?!(mongodb|bson|@mongodb-js|@aws-sdk|@aws-encryption|@smithy|dns|socks|snappy|kerberos|gcp-metadata|mongodb-connection-string-url|whatwg-url|bson-ext|mongodb-client-encryption)/)',
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.api.setup.ts'],
  
  // Test coverage
  collectCoverage: true,
  coverageDirectory: 'coverage/api',
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    '!src/app/api/**/*.d.ts',
    '!src/app/api/**/*.test.ts',
    '!src/app/api/__tests__/**',
  ],
  
  // Test paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  
  // Coverage reporting
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
