# Project Overview

`forth-worktime` (Forth WorkTime Analyzer) is a specialized tool for analyzing and summarizing monthly work reports from PDF exports.

## Core Goals
- Automate the extraction of work hours from corporate PDF reports.
- Provide a clear, tabular summary of daily work status (Work, Weekend, Holiday).
- Visualize monthly trends and OT calculations.
- Support exporting results to Excel (`.xlsx`).

## Technology Stack
- **Framework**: Next.js 14.2 (App Router)
- **State Management**: Zustand (Centralized store for work data and settings)
- **Styling**: Tailwind CSS (with Framer Motion for animations)
- **Data Visualization**: Chart.js & react-chartjs-2 (Work hours breakdown)
- **Backend/Services**: 
    - Firebase Auth & Firestore (Persistent user data)
    - pdfjs-dist (Client-side PDF parsing)
    - xlsx (Excel report generation)
- **PWA**: Configured via `@ducanh2912/next-pwa`.

## Key Files
- `src/lib/parser.ts`: The "brain" of the application; handles PDF processing.
- `src/lib/store.ts`: Global state for language, parsed data, and UI status.
- `src/components/Summary.tsx`: OT Summary and Pay calculation.
- `src/components/StatsGrid.tsx`: High-level analytics cards.
- `src/components/WorkTable.tsx`: The main data grid.

## Design Philosophy
- **Responsive**: Mobile-first design for checking reports on the go.
- **Print-Friendly**: Optimized CSS for printing the summary directly from the browser.
- **Multilingual**: Supports Thai (TH) and English (EN).
