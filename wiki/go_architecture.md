# Go Standalone Architecture

tags: [go, architecture, sqlite, pdf, standalone]
updated_at: 2026-10-28
sources:
  - ../cmd/worktime/main.go
  - ../pkg/worktime/ot.go
  - ../pkg/parser/pdf.go
  - ../pkg/repository/sqlite.go
  - ../pkg/server/handlers.go

## Overview
`forth-worktime` is packaged as a high-performance, single standalone Go binary and Vercel Go Serverless deployment. It eliminates external Node.js and network cloud dependencies by running an embedded HTTP web server and local SQLite database.

## Components
1. **`pkg/worktime/`**:
   - `types.go`: Canonical structs (`WorkDay`, `OTData`, `PaySettings`, `Status`).
   - `ot.go`: Pure mathematical overtime calculation functions with 4-decimal rounding and lunch/dinner break deduction.
   - `payroll.go`: Salary and overtime compensation formulas.
   - `version.go`: Single authoritative version constant.

2. **`pkg/parser/`**:
   - `pdf.go`: Pure Go PDF text extraction using `github.com/ledongthuc/pdf`. Slices days using regex indices (replaces JS lookahead assertion) and handles Thai Mojibake encoding fallbacks.

3. **`pkg/exporter/`**:
   - `excel.go`: Excel generation using `github.com/xuri/excelize/v2`, including headers, row values, auto-width, and totals summary row.
   - `pdf.go`: PDF generation using `github.com/signintech/gopdf` with Thai Sarabun font and company logo.

4. **`pkg/repository/`**:
   - `sqlite.go`: Local persistence using `modernc.org/sqlite` (pure Go, zero CGO). Stores monthly OT inputs and pay settings.

5. **`pkg/server/`**:
   - Embedded HTML/CSS/JS frontend powered by Alpine.js and Chart.js for real-time reactivity without page reloads.

6. **`api/`**:
   - `index.go`: Vercel Serverless Function entrypoint exporting `Handler(w, r)`.

## Running the Application
- **Web UI Mode**:
  ```bash
  go run ./cmd/worktime -port 8080 -db worktime.db
  # or execute binary:
  ./worktime.exe -port 8080
  ```
- **Direct CLI Mode**:
  ```bash
  ./worktime.exe -parse TIMESTATEMENT_20260502.pdf -export output.xlsx
  ```
