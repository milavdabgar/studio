# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes (`src/app/api/**/route.ts`).
- `src/components`: Reusable React components; `src/lib`: utilities and services; `src/hooks`, `src/types`, `src/utils` for support code.
- `e2e`: Playwright end-to-end tests. Unit/integration tests live in `src/**` (e.g., `*.test.ts(x)`) and top-level `__tests__/`.
- `public`: Static assets (icons, uploads, PWA files). `docs/`: architecture and ops docs. `scripts/`: helper scripts.

## Build, Test, and Development Commands
- `npm run dev`: Start the app locally at `http://localhost:3000`.
- `npm run build` / `npm start`: Production build and server.
- `npm run lint` / `npm run typecheck`: ESLint and TypeScript checks.
- `npm test` / `npm run test:coverage`: Jest unit/integration tests and coverage report.
- `npm run test:e2e` / `npm run test:e2e:report`: Playwright E2E tests and view report. Ensure the dev server is running.

## Coding Style & Naming Conventions
- TypeScript-first. Prefer explicit types; avoid `any` (ESLint warns on `no-explicit-any`, `no-unused-vars`).
- Indentation: 2 spaces; include semicolons; single quotes preferred.
- Files: React components in `PascalCase.tsx`; utilities in `kebab-case.ts`. Export named functions where possible.
- API routes follow Next.js conventions under `src/app/api/<resource>/route.ts`.

## Testing Guidelines
- Frameworks: Jest (+ Testing Library) for unit/component; Playwright for E2E.
- Naming: colocate unit tests as `*.test.ts(x)` near code; E2E tests as `e2e/*.spec.ts`.
- Run: `npm test` for fast feedback; `npm run test:coverage` before PRs. Aim to keep or improve coverage.

## Commit & Pull Request Guidelines
- Commits: concise, imperative present-tense (e.g., "add faculty API pagination"). Group related changes; avoid noisy unrelated edits.
- PRs: include purpose, linked issues, screenshots for UI changes, and a brief test plan (commands run + results). Update docs if behavior changes.
- CI: GitHub Actions validate lint, types, and tests. PRs must be green.

## Security & Configuration
- Environment: copy `cp .env.example .env.local` and configure locally. Never commit secrets; `.env*` are ignored.
- Data and uploads: place public files in `public/` (or project-specific dirs) and avoid committing large binaries unless essential.
