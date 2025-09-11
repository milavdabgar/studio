Title: feat: add faculty API pagination

## Description
Implements cursor-based pagination for `GET /api/faculty` to improve performance and UX on large datasets.

## Linked Issues
Closes #123

## Type of Change
- [x] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Tests
- [ ] Docs
- [ ] Chore

## Test Plan
- Ran `npm test` → 214 passed; updated unit tests for pagination utils.
- Ran `npm run test:e2e` → API suites green (faculty API: 12/12).
- Manual: Verified `?cursor=` and `?limit=` query params in local dev.

## Screenshots
N/A (API change).

## Checklist
- [x] Lint and types pass locally (`npm run lint`, `npm run typecheck`).
- [x] Unit/integration tests updated; E2E as applicable.
- [x] Coverage steady (`npm run test:coverage`).
- [x] Docs updated (`AGENTS.md` API note added).
- [x] No secrets or large binaries committed.
- [x] CI checks are green.

## Breaking Changes
None. Maintains backward compatibility with default pagination.

## Security / Config Impact
None.

## Notes for Reviewers
Focus on `src/app/api/faculty/route.ts` and `src/lib/pagination.ts`. Naming aligns with existing API patterns.
