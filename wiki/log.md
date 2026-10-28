# Project Log

## [2026-10-28] feat | Vercel Go Serverless Integration & Submodule Fix (v1.3.6)
- Implemented Vercel Go Serverless Function handler in `api/index.go` and rewrites in `vercel.json`.
- Removed dangling gitlink `.agent/skills` (mode 160000) from git index to resolve submodule fetch warning in Vercel CI.
- Added test suite `api/index_test.go` verifying root, version, and static SVG serving.
- Bumped authoritative version to 1.3.6 (PATCH).
- Validation: `go vet ./...` passed, `go test -v ./...` passed, `go build ./...` passed.


## [2026-10-28] fix | Table Header X/Y Alignment in PDF Report (v1.3.5)
- Fixed missing `pdf.SetXY(curX, tableY)` in table header loop causing column titles ("วันที่", "เวลาเข้า-ออก") to overlap KPI card.
- Table header row now renders all column labels centered in their designated slots at `y = 128`.
- Added bilingual Thai/English label handling for KPI summary cards.
- Bumped authoritative version to 1.3.5 (PATCH).
- Validation: `go test -v ./...` passed, `go build` passed, verified generated PDF.


## [2026-10-28] feature | Corporate Logo Header in PDF Report (v1.3.4)
- Embedded FORTH corporate logo (`public/images/logo.png`) into Go standalone PDF generator via `internal/exporter/images/logo.png`.
- Added image header holder (`gopdf.ImageByHolder`) displaying official logo next to company name.
- Bumped authoritative version to 1.3.4 (PATCH).
- Validation: `go test -v ./...` passed, `go build` passed.


## [2026-10-28] cleanup | Purge Leftover Node.js, Next.js, and Legacy Artifacts (v1.3.3)
- Deleted all obsolete Node.js and Next.js dependencies, configs, and source files (`node_modules/`, `.next/`, `src/`, `package.json`, `package-lock.json`, `tsconfig*`, `next.config*`, `postcss*`, `tailwind*`, `.eslintrc*`).
- Removed ad-hoc root scripts (`scratch*`, `test*.js`, `_legacy/`, redundant PDF fixtures).
- Retained all vector SVG assets in `internal/server/static/icons/*.svg`, `web/static/icons/*.svg`, and `public/`.
- Replaced Node CI with pure Go GitHub Actions workflow (`go vet`, `go test -v ./...`, `go build`).
- Overhauled `README.md` to document the Go Standalone application.
- Bumped authoritative version to 1.3.3 (PATCH).
- Validation: `go vet ./...` passed, `go test -v ./...` passed, `go build` passed.


## [2026-10-28] fix | Dark Mode SVG Color Inheritance (v1.3.2)
- Replaced all isolated `<img src="/static/icons/*.svg">` references with inline vector SVGs in `internal/server/templates/index.html`.
- Root cause: browser isolates external SVGs in `<img>` tags, defaulting `stroke="currentColor"` to black (#000) and ignoring Tailwind text colors in dark mode.
- Inlined SVGs now directly inherit Tailwind color classes (`text-amber-400`, `text-slate-300`, `text-white`, `text-rose-400`, `text-indigo-400`), rendering clearly in dark mode.
- Bumped authoritative version to 1.3.2 (PATCH).
- Validation: `go test ./...` passed, `go build` passed, `npm test` passed.


## [2026-10-28] cleanup | Remove Print Button in Favor of Direct PDF (v1.3.1)
- Removed legacy browser `window.print()` button from header actions across Go Standalone template and Next.js Header.
- Streamlined header action bar to focus on Preview PDF and Export Excel.
- Bumped authoritative version to 1.3.1 (PATCH).
- Validation: `go test ./...` passed, `go build` passed, `npm test` passed.


## [2026-10-28] feature | Pure Go Standalone PDF Engine & In-App Preview Modal (v1.3.0)
- Implemented pure Go A4 Monthly WorkTime & OT Report generator in `internal/exporter/pdf.go` using `github.com/signintech/gopdf`.
- Embedded official Thai fonts `THSarabunNew.ttf` and `THSarabunNew-Bold.ttf` via `//go:embed` inside single binary.
- Added HTTP endpoint `POST /api/export-pdf` serving inline PDF streams for in-browser rendering.
- Added Preview PDF button and Glassmorphism Preview Modal with iframe in `internal/server/templates/index.html`.
- Added CLI flag `-export-pdf <filename.pdf>` to enable direct terminal-based PDF export without running web server.
- Bumped authoritative version to 1.3.0 (MINOR).
- Validation: `go test -v ./...` passed, `npm test` passed, real sample CLI PDF generation verified (103 KB output).


## [2026-10-28] style | Theme Toggle Orange Border Accent (v1.2.1)
- Updated dark/light mode toggle button border to warm orange (`border-orange-400 dark:border-orange-500`) with hover states.
- Applied across both Go standalone embedded template (`internal/server/templates/index.html`) and Next.js component (`ThemeToggle.tsx`).
- Bumped authoritative version to 1.2.1 (PATCH).
- Validation: `go test ./...` passed, `npm test` passed.


## [2026-10-28] feature | Client-Side PDF Generator with @react-pdf/renderer (v1.2.0)
- Integrated `@react-pdf/renderer` for 100% client-side A4 report generation.
- Registered official Thai font family `THSarabunNew` (Regular, Bold, Italic, BoldItalic) from `public/fonts/`.
- Designed official A4 monthly WorkTime and OT payout report template in `src/lib/pdf-template.tsx`.
- Implemented `PdfPreviewModal` with iframe rendering, download action, backdrop blur, and ESC key listener.
- Implemented lazy-loaded `ExportPdfButton` in `Header.tsx` to optimize initial bundle size.
- Validation: `npm run build` passed, `npm test` passed (7/7 tests), `go test ./...` passed.


## [2026-10-28] feature | Comprehensive UX/UI Overhaul & Standalone SVG Migration (v1.1.0)
- Fixed Work Logs first column blank/bleed defect with opaque background and sticky shadow on table date cells.
- Resolved empty Chart.js rendering issue with delayed initialization and resize listener.
- Replaced all emojis and icon fonts with 11 standalone vector SVG assets in `web/static/icons/*.svg` served via embedded static router.
- Added actionable empty-state guidance for OT Summary and Pay Calculator when salary is zero or OT inputs are unpopulated.
- Implemented compact rows for weekends, holidays, and no-data days, reducing table height and visual clutter.
- Added visual anomaly detection for unusually short work hours (< 4 hrs) with warning tooltip.
- Upgraded small labels from 10px slate-400 to WCAG AA-compliant 12px text-slate-600/slate-300.
- Implemented compact upload toolbar once a file is loaded, saving 200px+ vertical space.
- Reorganized dashboard metrics, replacing duplicate Total Work Hours with Total OT Hours.
- Optimized print layout for A4: hidden navbar, expanded table overflow, and flattened sticky columns.


## [2026-10-28] refactor | Full Codebase Migration to Go Standalone Binary (v1.0.0)
- Migrated core PDF extraction and normalization from `pdfjs-dist` to pure Go using `github.com/ledongthuc/pdf`.
- Ported overtime calculation engine (`calculateOTWithShift`, `calculateOTWithoutShift`, rounding, and overlap logic) to `pkg/worktime/ot.go`.
- Implemented Excel report generator using `github.com/xuri/excelize/v2` in `internal/exporter/excel.go`.
- Replaced remote Firestore cloud sync with local zero-cgo SQLite persistence using `modernc.org/sqlite` in `internal/repository/sqlite.go`.
- Implemented embedded fullstack web server (`net/http` + Alpine.js + Tailwind) with single binary distribution (`cmd/worktime/main.go`).
- Added CLI parsing mode (`worktime -parse <pdf> -export <xlsx>`).
- Validation: all Go unit and smoke tests passed in <0.05s (`go test ./pkg/... ./internal/...`).


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
