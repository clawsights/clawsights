---
name: Upload Endpoint Security & Contract
description: Ensure the /api/upload endpoint validates request shape, handles token verification failures safely, and protects write-time behavior.
---

# Upload Endpoint Security & Contract

## Context
`app/api/upload/route.ts` accepts user-submitted GitHub credentials and report HTML from external clients and writes parsed data to the database. This endpoint should remain strict and fail-safe.

## What to Check

### 1) Request contract and guardrails
- Verify `github_token` and `report_html` are both present and strings.
- Reject malformed payloads with a clear 400 instead of proceeding with partial validation.
- Add a payload-size guard for `report_html` (for example ~500 KB max) before parsing.

Good:

```ts
if (typeof github_token !== "string" || typeof report_html !== "string") {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}
if (report_html.length > 500_000) {
  return NextResponse.json({ error: "Payload too large" }, { status: 413 });
}
```

Bad:

```ts
const { github_token, report_html } = body;
// no type/size checks; parse and parse and parse again
```

### 2) External API interaction is explicit
- Keep the token from being logged anywhere (directly or concatenated).
- Handle non-OK responses from GitHub distinctly (401, 403, 429) so callers understand cause.
- Set explicit request headers like `User-Agent` and avoid trusting ambiguous API payloads.

### 3) Error boundaries and response semantics
- Preserve error context for observability (`Sentry`) but avoid leaking token or raw third-party body to clients.
- Use 4xx for client-originated contract issues and 5xx only for internal failures.
- If parse or contribution fetch fails, ensure the final response still communicates an actionable outcome.

## Key Files
- `app/api/upload/route.ts`
- `lib/github-contributions.ts`
- `lib/db.ts`

## Exclusions
- Changes limited to static UI pages.
- Changes to test fixtures that only update expected values with no control-flow change.
