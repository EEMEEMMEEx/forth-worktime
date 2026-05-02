# State Management (Zustand)

The application uses **Zustand** for lightweight, centralized state management. This ensures a single source of truth for processed PDF data, user overrides (OT), and application settings.

## Store Definition (`src/lib/store.ts`)

The `useStore` hook provides access to the following state:

### State Properties
- `uid`: The Firebase user ID (Anonymous by default) used for cloud syncing.
- `lang`: Current language (`'th'` or `'en'`).
- `busy`: Boolean flag for background processing (e.g., parsing PDFs).
- `data`: Array of `WorkDay` objects extracted from the PDF.
- `otInputs`: A map (`Record<number, OTValues>`) storing user-defined OT hours for specific days.
- `pay`: Configuration for `monthlySalary` and `baseHours` (default 208).
- `monthIdx` / `year`: The temporal context of the currently loaded data.
- `syncing`: Boolean flag indicating active Firestore write operations.

### Actions
- `setUid(uid)`: Sets the current user ID.
- `setData(data, monthIdx, year)`: Populates the store with parsed results.
- `setOT(day, rate, value)`: Updates specific OT rates (`o10`, `o15`, `o20`, `o30`) for a given day.
- `setPay(settings)`: Updates payroll calculation constants.
- `resetOT()`: Clears all manual OT overrides.
- `setSyncing(bool)`: Updates the sync status flag.

## Integration Patterns

1. **Selective Selectors**: Components should use selectors to minimize re-renders.
   ```typescript
   const lang = useStore(state => state.lang);
   ```
2. **Persistence**: Manual OT inputs are persisted to **Firestore** under `users/{uid}/worktime/{year_month}`. 
   - **Auth**: Handled by `AuthHandler.tsx` using Firebase Anonymous login.
   - **Sync**: Handled by `SyncHandler.tsx` which debounces state changes to `otInputs` and saves them to the cloud.
   - **Loading**: When a PDF is parsed (setting `monthIdx`/`year`), the `AuthHandler` attempts to fetch existing overrides from Firestore to restore user progress.

## Related Pages
- [Parsing Logic](./parsing_logic.md)
- [Project Overview](./project_overview.md)
