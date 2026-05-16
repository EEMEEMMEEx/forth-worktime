# Improvement Roadmap

tags: [roadmap, reliability, parser, qa]
updated_at: 2026-05-16
sources:
  - ../src/lib/parser.ts
  - ../src/components/AuthHandler.tsx
  - ../src/components/SyncHandler.tsx
  - ../src/components/FileUploader.tsx
  - ./project_overview.md
  - ./parsing_logic.md

## Priority 1: Parser Reliability (Highest ROI)
- Replace garbled Thai literals in parser checks with Unicode-safe constants or normalized keywords.
- Add golden test cases for real PDF text outputs (weekday, weekend, holiday, overnight, multi-segment).
- Isolate OT calculation rules into pure functions and test each rule independently.

Why:
- `src/lib/parser.ts` currently mixes extraction + business rules in one large function, making regression risk high when rules change.

## Priority 2: Data Sync Correctness
- Prevent stale OT merge in auth flow by loading Firestore data only for the active `monthIdx/year` after PDF parse is done.
- Add conflict strategy for local edit vs remote data (last-write-wins + timestamp compare is enough for now).
- Surface sync errors in UI, not only console logs.

Why:
- `AuthHandler` and `SyncHandler` perform async updates that can silently fail or merge stale data.

## Priority 3: UX Guardrails
- In uploader, show explicit validation for non-PDF files instead of silent return.
- Add empty-state hints (example PDF format + known limitations).
- Add "data source summary" block (parsed month, detected holidays, OT rows) so user can trust results quickly.

Why:
- Faster confidence loop reduces manual verification effort.

## Priority 4: Engineering Baseline
- Add `npm run test` with Vitest/Jest for parser + OT rule units.
- Add one E2E smoke test (upload sample PDF -> table row count -> summary value).
- Add lightweight CI for `lint + test + build`.

Why:
- Current scripts only include `dev/build/start/lint`; reliability relies on manual checks.

## Suggested Execution Order
1. Parser unit tests and extraction refactor.
2. Sync conflict and error-surface improvements.
3. Uploader and trust/validation UX.
4. CI + E2E smoke gate.
