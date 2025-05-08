
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle CSS imports (if you're using them in your components)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Use ts-jest for ts and tsx files
    '^.+\\.(ts|tsx)?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Ignore Next.js specific files if not needed for unit tests
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
