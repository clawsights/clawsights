---
name: Report Rendering Safety
description: Ensure user report HTML cannot inject unsafe content when rendered through /api/report/[handle].
---

# Report Rendering Safety

## Context
`app/api/report/[handle]/route.ts` injects stored `reportHtml` back into a browser response. This is an obvious place for stored XSS if report HTML is not sanitized.

## What to Check

### 1) Sanitize untrusted HTML
- `userStats.reportHtml` comes from user uploads and should be sanitized before insertion into the response.
- Add/confirm sanitization for user-inserted fields (`displayName`, `avatarUrl`, header captions) as well.
- Reject or strip dangerous attributes and tags (`script`, event handlers, `javascript:` URLs).

Bad:

```ts
const html = userStats.reportHtml.replace(/(<body[^>]*>)/i, `$1${header}`);
return new NextResponse(html, {...});
```

Good:

```ts
const safeReportHtml = sanitizeHtml(userStats.reportHtml);
const html = safeReportHtml.replace(/(<body[^>]*>)/i, `$1${safeHeader}`);
```

### 2) Defense-in-depth response headers
- Add `Content-Security-Policy` (and `X-Content-Type-Options`) on report responses.
- Keep HTML responses from accepting inline script execution.

### 3) Failure-safe rendering behavior
- If sanitize or user header injection fails, return a non-500 fallback that still serves a useful message.

## Key Files
- `app/api/report/[handle]/route.ts`
- `app/api/report-user/[handle]/route.ts`

## Exclusions
- Changes limited to JSON API routes that never return HTML documents.
- Cosmetic CSS/spacing changes in the generated report shell.
