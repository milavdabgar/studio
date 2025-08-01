# CRUSH Development Guidelines

## Build/Lint/Test Commands

```bash
# Build
npm run build

# Lint
npm run lint
npm run lint:fix  # Auto-fix lint issues

# Type checking
npm run typecheck

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm run test -- path/to/test/file.test.ts

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Open coverage reports
npm run test:coverage:open
```

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` prefix for src directory
- Group imports in order: built-in, external, internal, type-only
- Use specific imports rather than namespace imports when possible

### TypeScript
- Strict mode enabled (tsconfig.json)
- Avoid `any` type - use specific types or generics
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` over `let` when possible

### Naming Conventions
- Components: PascalCase (.tsx)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: PascalCase with I prefix for API entities
- Files: kebab-case or PascalCase for components

### Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries for React components
- Use the custom error classes in `src/lib/errors.ts`
- Log errors with context using `src/lib/logger.ts`

### Testing
- Unit tests colocated with files (`__tests__` directories)
- Use Jest for unit testing
- Use Playwright for E2E testing
- Test files follow naming: `*.test.ts` or `*.test.tsx`
- Mock external dependencies using `__mocks__` directory

### Formatting
- Follow Next.js core-web-vitals ESLint config
- Use Prettier for code formatting
- Line length: 100 characters
- Indentation: 2 spaces