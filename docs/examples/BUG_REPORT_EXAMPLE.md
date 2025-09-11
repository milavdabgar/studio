Title: bug: timetable overlap detection flags valid schedules

## Description
Valid, non-overlapping timetable entries are incorrectly flagged as overlapping in the admin UI.

## Steps To Reproduce
1. Go to Admin → Timetables.
2. Add Class A (09:00–10:00, Room 101) and Class B (10:00–11:00, Room 101).
3. Save and observe error banner: "Overlap detected".

## Expected Behavior
No error for adjacent, non-overlapping time slots.

## Actual Behavior
Error banner appears and blocks save.

## Logs
Console shows `overlap=true` for end==start boundary. No server errors.

## Screenshots
Attached banner screenshot (omitted in example).

## Environment
- Browser: Chrome 126, macOS 14.5
- Node: 20.16.0
- App commit: b11b88e4

## Affected Areas
`src/components/admin/TimetableForm.tsx`, `src/lib/time.ts` boundary checks.

## Reproducibility
- [x] Always
- [ ] Intermittent

## Checklist
- [x] Searched existing issues and PRs.
- [x] Minimal repro provided.
- [x] Tested on fresh branch (`npm ci`).
- [x] No secrets included.
