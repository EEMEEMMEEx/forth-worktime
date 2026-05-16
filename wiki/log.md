# Project Log

## [2026-05-16] fix | Parser Smoke Test Fixture Guard
- Updated `src/lib/parser.smoke.test.ts` to skip the smoke test when `TIMESTATEMENT_20260502.pdf` is not present in the workspace.
- This prevents CI failures caused by missing local-only fixture files while preserving real-PDF smoke validation in environments where the file exists.
- Root cause observed in CI: `ENOENT` reading `/home/runner/work/forth-worktime/forth-worktime/TIMESTATEMENT_20260502.pdf`.

## [2026-05-16] feature | CI Baseline + Parser Smoke Test
- Added GitHub Actions workflow at `.github/workflows/ci.yml` to run `npm ci`, `npm run lint`, `npm test`, and `npm run build` on push/PR.
- Added parser smoke test `src/lib/parser.smoke.test.ts` using real sample file `TIMESTATEMENT_20260502.pdf` to validate the main parse path returns usable monthly output.
- Normalized type compatibility for dash status variants in `src/lib/types.ts` to keep build/typecheck stable with existing encoded data.
- Validation: local `npm test`, `npm run lint`, and `npm run build` all passed.

## [2026-05-16] feature | UX Guardrails for Upload + Data Trust Snapshot
- Improved upload validation in `FileUploader` to explicitly reject non-PDF files and show a user-visible error message.
- Added upload guidance and known limitations block below uploader for faster self-diagnosis (supported format and scanned PDF limitation).
- Added parsed-data trust snapshot card in `page.tsx` showing detected month, holiday count, weekend count, and OT-day count.
- Extended dictionary keys for new validation/trust UI labels.
- Validation: `npm run lint` and `npm test` both passed.

## [2026-05-16] feature | Sync Correctness + Error Surfacing
- Refactored auth/sync flow so OT loading is handled in `SyncHandler` with an active `{uid}_{year}_{month}` key guard to prevent stale async merges when context changes.
- Added timestamp-based merge strategy (last-write-wins on overlap) using remote `updatedAt` metadata from Firestore.
- Extended state model in `src/lib/store.ts` with `syncError`, `otUpdatedAt`, and `remoteUpdatedAt`, plus `applyRemoteOT` for deterministic merge behavior.
- Updated `Header` sync badge to show explicit `Sync Error` state and display error text when sync/auth operations fail.
- Validation: `npm test` and `npm run lint` both passed.

## [2026-05-16] refactor | Parser OT Logic Isolation + Unit Tests
- Refactored OT business rules out of `src/lib/parser.ts` into `src/lib/ot.ts` as pure functions (`calculateOTWithShift`, `calculateOTWithoutShift`, time normalization and overlap helpers).
- Improved parser keyword robustness by supporting both proper Thai keywords and legacy garbled text variants for summary/holiday/earn-label matching.
- Added first unit test suite `src/lib/ot.test.ts` and introduced `vitest` with `npm test` script for regression safety.
- Validation: `npm test` passed (6/6 tests).

## [2026-05-16] docs | Improvement Roadmap Added
- Added `wiki/improvement_roadmap.md` with a prioritized plan focused on parser reliability, sync correctness, UX guardrails, and engineering baseline.
- Updated `wiki/index.md` to include the new roadmap page and refreshed last-updated date.
- Recommendations were derived from current implementation in `src/lib/parser.ts`, `src/components/AuthHandler.tsx`, `src/components/SyncHandler.tsx`, and `src/components/FileUploader.tsx`.

## [2026-05-02] deployment | GitHub Release & Code Cleanup
- **Deployment**: Successfully pushed the current state to [GitHub](https://github.com/bearnannan/forth-worktime).
- **Cleanup**: Updated `.gitignore` to exclude scratch files, temporary PDFs, and local test logs.
- **Documentation**: Finalized the initial version of the Wiki (7 core pages) documenting the architecture, state, and logic.
- **Git Hygiene**: Staged and committed 33 files covering the entire feature set from OT parsing to Firestore sync and UI polish.

## [2026-05-02] UI | Advanced Data Visualization & Final Polish
- **Enhanced Chart Interactivity**: Added metric switching (Net Hours vs OT Hours) with stacked bars for OT breakdown.
- **PWA Polish**: Updated layout metadata with `appleWebApp` tags and dynamic `themeColor` viewport settings for mobile.
- **Theme Integration**: Finalized Chart.js dark/light mode dynamic styling.
- **Documentation**: Overhauled `README.md` with premium branding and project-specific technical details.

## [2026-05-02] UI | Mobile Responsiveness & Polish
- Refined **Dark Mode** support for `Header`, `Summary`, and `Chart` components.
- Implemented **Sticky Columns** in `WorkTable` for improved mobile navigation.
- Optimized `StatsGrid` for small screens (adaptive column count).
- Added safety checks for Firestore data merging in `AuthHandler.tsx`.
- Enhanced `Chart.tsx` with theme-aware colors and high-contrast labels.

## [2026-05-02] UI | Dark Mode & Premium Refinement
- Implemented **Dark Mode** support using `next-themes`.
- Added `ThemeProvider` and `ThemeToggle` components.
- Updated `globals.css` with adaptive glassmorphism and mesh gradients.
- Refined all core components (`StatsGrid`, `WorkTable`, `Primitive`) for dark mode compatibility.
- Added smooth state transitions in `page.tsx` using `AnimatePresence`.

## [2026-05-02] feature | Analytics Dashboard
- Created `StatsGrid.tsx` for high-level KPI visualization (Total Days, Avg Hours, Max Day).
- Integrated Dashboard into the main `page.tsx`.
- Added "Total Summary" row to `WorkTable.tsx` footer for better data integrity.
- Added localization labels for metrics in `dictionaries.ts`.

## [2026-05-01] feature | Firestore Persistence & Auth Sync
- Implemented **Anonymous Authentication** in `AuthHandler.tsx`.
- Created **Firestore Sync Utility** in `sync.ts` for persisting OT inputs.
- Added `SyncHandler.tsx` with debounced auto-save logic to minimize write costs.
- Updated `useStore` (Zustand) to manage `uid` and `syncing` states.
- Integrated sync status indicator in `Header.tsx`.
