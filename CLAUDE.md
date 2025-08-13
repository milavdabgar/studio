# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Building
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint codebase
npm run lint

# Type checking
npm run typecheck
```

### Testing
```bash
# Run all Jest unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run Jest with coverage
npm run test:coverage

# Run specific test suites
npm run test:integration  # Integration tests
npm run test:e2e          # All Playwright e2e tests
npm run test:e2e:report   # View Playwright test results

# Run specific API test suites
npm run test:critical-apis     # Core API endpoints
npm run test:students-api      # Student management APIs
npm run test:faculty-api       # Faculty management APIs
npm run test:assessments-api   # Assessment APIs

# Run specific app test suites
npm run test:app-complete      # Complete app coverage
npm run test:app-student       # Student portal tests
npm run test:app-faculty       # Faculty portal tests
npm run test:app-admin         # Admin dashboard tests
```

### Single Test Execution
```bash
# Run a specific test file
npx jest path/to/test.test.ts

# Run a specific e2e test
npx playwright test e2e/specific-test.spec.ts

# Run Jest tests matching a pattern
npx jest --testNamePattern="pattern"

# Run Playwright with specific options
npx playwright test --reporter=line --workers=1
```

### Database & Seeding
```bash
# Seed development database
npm run seed:dev

# Seed production database  
npm run seed:database
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Jest (unit) + Playwright (e2e)
- **Content**: Markdown with frontmatter, multilingual support (English/Gujarati)

### Application Structure

#### Multi-Stakeholder System
The application serves multiple user types with role-based access:
- **Students**: Course management, timetables, results, project submissions
- **Faculty**: Teaching assignments, assessments, attendance, preferences
- **HOD**: Department management, approvals, analytics
- **Admin**: System-wide management, user administration, reporting
- **Committee Members**: Specialized dashboard access

#### Key Domain Areas

**Academic Management**
- `src/app/admin/`: Administrative interfaces for all academic entities
- `src/lib/models/`: MongoDB schemas for academic data
- `src/lib/api/`: Service layer for CRUD operations
- Core entities: Students, Faculty, Courses, Batches, Departments, Programs

**Timetable & Scheduling System**
- `src/lib/algorithms/`: Advanced scheduling algorithms with constraint solving
- `src/app/admin/timetables/`: Timetable management interfaces
- Auto-generation with workload balancing and conflict resolution
- Real-time updates with WebSocket integration

**Assessment & Results**
- `src/app/admin/assessments/`: Assessment creation and management
- `src/app/admin/results/`: Result processing and analytics
- Integration with GTU (Gujarat Technological University) systems
- Automated result import and validation

**Project Fair Management**
- `src/app/admin/project-fair/`: Complete project event management
- `src/app/project-fair/`: Student and jury interfaces
- Team formation, evaluation workflows, and result processing

**Content Management System**
- `content/blog/`: Multilingual markdown content (650+ study materials)
- `src/lib/content-converter-v2.ts`: Advanced content processing
- Blog system with 30+ technical articles in English and Gujarati

#### Frontend Architecture

**Component Organization**
- `src/components/ui/`: Reusable Radix UI-based components
- `src/components/profile/`: Profile management components
- `src/components/blog/`: Blog and content display components
- `src/components/analytics/`: Dashboard and analytics components

**State Management**
- React Context for authentication (`src/contexts/auth-context.tsx`)
- Custom hooks for data fetching and form handling (`src/hooks/`)
- Real-time state management for timetables and notifications

**Route Structure**
- `/admin/*`: Administrative functions with role-based access
- `/student/*`: Student portal and academic tools
- `/faculty/*`: Faculty dashboard and teaching tools
- `/hod/*`: Department head management interface
- `/api/*`: RESTful API endpoints for all operations

#### Backend Architecture

**API Layer**
- `src/app/api/`: Next.js API routes with comprehensive CRUD operations
- Middleware for authentication, rate limiting, and validation
- Error handling and logging throughout the stack

**Data Services**
- `src/lib/services/`: Business logic and service implementations
- Caching with Redis, email services, notification systems
- PDF generation for reports and certificates

**Database Design**
- MongoDB collections for all academic entities
- Optimized indexes and aggregation pipelines
- Data validation with Mongoose schemas

## Development Guidelines

### Code Organization
- Follow the existing component and service patterns
- Use TypeScript interfaces defined in `src/types/` and `src/lib/types.ts`
- Implement comprehensive error handling with the error utilities in `src/lib/errors.ts`
- Add tests for new features using the established patterns in `__tests__/` directories

### Testing Strategy
- **Unit Tests**: Jest tests for utilities, services, and components
- **Integration Tests**: API route testing with comprehensive data validation
- **E2E Tests**: Playwright tests covering complete user workflows
- Target: Maintain high test coverage (currently 86.84%, targeting 100%)

### Content Management
- Blog posts and study materials are in `content/blog/`
- Support for English (`.md`) and Gujarati (`.gu.md`) files
- Use frontmatter for metadata, KaTeX for mathematical expressions
- Content processing handles images, shortcodes, and cross-references

### Real-time Features
- WebSocket integration for live timetable updates
- Real-time notifications for assessments and results
- Live collaboration features for project management

### Performance Considerations
- Next.js optimization with standalone output and image optimization
- Redis caching for frequently accessed data
- Optimized database queries with proper indexing
- Docker deployment with multi-stage builds

## Important Notes

### Branch Strategy
- `master`: Production branch (protected)
- `dev`: Main development branch
- Feature branches should be created from and merged back to `dev`

### Autonomous Development System
- The repository includes an autonomous development system (`autonomous-dev-system/`)
- Can be used for automated code improvements and feature development
- See `autonomous-dev-system/CLAUDE.md` for detailed usage

### Configuration
- Environment variables documented in various config files
- MongoDB URI, Redis settings, and external service credentials required
- Docker Compose setup available for local development

### Multilingual Support
- Full internationalization support for English and Gujarati
- Language switching mechanism throughout the application
- Content and UI translation capabilities