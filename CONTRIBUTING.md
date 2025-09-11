## Contributing

Thank you for helping improve this project! This guide outlines the essentials for contributing effectively.

## Getting Started
- Read `AGENTS.md` for structure, commands, and standards.
- Requirements: Node 18+, npm 9+.
- Environment: `cp .env.example .env.local` and fill values. Do not commit secrets.

## Workflow
- Create a feature branch: `feat/<scope>` or `fix/<scope>`.
- Keep changes focused and incremental. Include tests for new behavior.
- Run locally and verify before pushing.

## Development Commands
- Start: `npm run dev`
- Lint/Types: `npm run lint` and `npm run typecheck`
- Unit/Integration: `npm test` (coverage: `npm run test:coverage`)
- E2E (optional): `npm run test:e2e` (ensure app is running)

## Commit Messages
- Use imperative, present tense and be specific.
- Examples: `add faculty API pagination`, `fix timetable overlap validation`

## Pull Request Checklist
- Scope: One topic per PR; minimal unrelated changes.
- Description: What/why/how + linked issues (e.g., `Closes #123`).
- Tests: Added/updated unit tests; E2E when behavior spans flows.
- Quality: `npm run lint` and `npm run typecheck` pass locally.
- Coverage: `npm run test:coverage` shows no significant drop.
- UI changes: Include before/after screenshots.
- Docs: Updated relevant files (e.g., `docs/`, `AGENTS.md`).
- Security/Config: No secrets committed; `.env*` excluded.
- CI: Ensure GitHub Actions are green.

## Reporting Issues
- Include steps to reproduce, expected vs actual, logs, and environment details.
- For security-related concerns, avoid posting secrets or private data in issues.

## Questions
If unsure about direction or scope, open a draft PR or start a discussion in the issue for early feedback.
