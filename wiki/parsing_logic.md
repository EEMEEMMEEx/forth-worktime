# Parsing Logic

The core logic for extracting work hours from PDF reports is implemented in `src/lib/parser.ts`.

## Extraction Process
1. **PDF Loading**: Uses `pdfjs-dist` with a dynamic import to avoid SSR issues.
2. **Text Normalization**: 
    - Extracts all text from all pages.
    - Slices at the last occurrence of "รวม" or "สรุป" to remove footer summaries.
    - Replaces all whitespace with single spaces.
3. **Date Identification**: Searches for the first `DD.MM.YYYY` pattern to determine the report's month and year.
4. **Initialization**: Creates a record for every day in that month.

## Normalization Rules
- **Break Deduction**: Automatically deducts 60 minutes if the duration between In and Out is greater than 60 minutes.
- **Midnight Handling**: If `Out` time is numerically less than `In` time (e.g., In 22:00, Out 02:00), it adds 1440 minutes (24 hours) to the Out time.
- **Rounding**:
    - `hours = minutes / 60`
    - If `fractionalPart > 0.3`, total is `integerPart + 0.5`.
    - Else, total is `integerPart`.
    - *Example*: 8.2 hours becomes 8.0, 8.4 hours becomes 8.5.

## Edge Cases & Limitations
- **Multiple Segments**: Supported. The parser iterates through all timestamp pairs in a segment and sums their durations.
- **Holiday Detection**: Improved to check for "PH", "Holiday", and "วันหยุด".
- **Thai Language Reliance**: Relies on "รวม" or "สรุป" as markers for the end of relevant data.

## Recommendations
- [x] Add support for multiple clock-in/out segments per day.
- [x] Improve detection of "Holiday" status beyond the "PH" string check.
- [ ] Implement Firestore persistence for OT settings.
