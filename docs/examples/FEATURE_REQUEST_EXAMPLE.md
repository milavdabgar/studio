Title: feat: student course feedback module

## Summary
Add a lightweight course feedback module for students to submit term-end feedback.

## Problem
Currently feedback is collected offline, delaying insights and analysis.

## Proposal
- UI: `src/app/student/feedback` page with per-course form (Likert + free-text).
- API: `POST /api/feedback` (auth required), `GET /api/feedback/summary` (admin/HOD only).
- Data: Store in MongoDB `feedback` collection with anonymized student IDs.

## Alternatives Considered
- External survey tools (privacy concerns, fragmented data).
- Embedding Google Forms (limited access control and analytics).

## Scope
In: student UI, admin summary dashboard, API/storage, basic analytics.
Out: email campaigns, advanced ML sentiment analysis.

## Acceptance Criteria
- [ ] Students can submit one feedback per course per term.
- [ ] Admin/HOD can view aggregated results by course and term.
- [ ] Access controls enforced; no PII exposed.

## Affected Areas
`src/app/student/**`, `src/app/api/feedback/**`, `src/components/admin/**` (summary widget).

## Risks / Dependencies
Requires auth checks; ensure rate-limiting and CSRF protections on API routes.

## Additional Context
Wireframes linked (placeholder). Aligns with existing analytics components in `src/components/analytics/`.
