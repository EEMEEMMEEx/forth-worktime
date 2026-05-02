# Project Log

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
