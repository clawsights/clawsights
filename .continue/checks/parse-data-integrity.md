---
name: Parse and Persisted Data Integrity
description: Keep /insights data parsing predictable and avoid persisting malformed or contradictory stats.
---

# Parse and Persisted Data Integrity

## Context
`lib/parse-report.ts` is regex-driven, and its output is directly persisted by `app/api/upload/route.ts`. This check protects against silent data drift and partial/wrong stats.

## What to Check

### 1) Parse contract should stay explicit
- If both `dateFrom` and `dateTo` parse, enforce chronological order.
- Treat out-of-range or contradictory dates as invalid before writing to DB.
- Keep negative/invalid numeric metrics out of persisted rows.

Good:

```ts
if (parsed.dateFrom && parsed.dateTo && parsed.dateFrom > parsed.dateTo) {
  return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
}
```

Bad:

```ts
const parsed = parseReport(report_html);
// persists as-is even if date order is inverted
```

### 2) Persisted data quality
- Ensure at least one primary metric is present before saving a row (don’t allow all-null core fields).
- Keep line values non-negative and bounded by safe numbers.

### 3) Tests must accompany parser-sensitive changes
- If regex selectors change, update `test/parse-report.test.ts` with fixtures showing old/new expected behavior.
- Avoid adding parsing behavior without coverage for partial or malformed HTML cases.

## Key Files
- `lib/parse-report.ts`
- `app/api/upload/route.ts`
- `test/parse-report.test.ts`
- `test/fixtures/sample-report.html`

## Exclusions
- Changes to CI files only.
- Pure refactors with no parser or schema contract change.
