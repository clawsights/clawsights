# Clawdsights

Leaderboard website where Claude Code users upload their `/insights` stats and see where they rank in percentiles.

## How It Works

1. Users install a Claude Code skill (`/clawsights`)
2. The skill runs `/insights`, reads the generated `report.html`, and uploads it
3. The server parses the HTML, extracts quantitative stats, and stores them
4. Users get a public profile page showing their stats + percentile rankings
5. A global leaderboard ranks all users across dimensions

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Turso (hosted SQLite) + Drizzle ORM
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Auth**: GitHub token verification (no passwords, no sessions)

## Repo Structure

```
clawsights/
├── skills/clawsights/SKILL.md   # The installable Claude Code skill
├── app/                           # Next.js app
│   ├── page.tsx                   # Leaderboard homepage
│   ├── [handle]/page.tsx          # User profile page
│   └── api/upload/route.ts        # Upload endpoint
├── components/                    # React components
├── lib/
│   ├── db.ts                      # Drizzle + Turso client
│   ├── schema.ts                  # Database schema
│   ├── parse-report.ts            # Server-side HTML parser
│   └── percentiles.ts             # Percentile computation
└── drizzle/                       # Migration files
```

## Key Design Decisions

- **All parsing is server-side.** The skill uploads raw `report.html`; the server extracts stats. This keeps the skill simple and lets us fix parsing bugs without users reinstalling.
- **GitHub token for auth.** Users already have `gh` installed. We verify the token against `api.github.com/user` to confirm identity. No signup flow needed.
- **Percentiles computed on read.** The dataset is small enough that we compute percentiles at query time rather than maintaining a materialized view.
- **One row per user in `stats`.** Each upload upserts, replacing the previous stats. No historical tracking (yet).

## Development

```bash
npm install
npm run dev          # Start Next.js dev server (localhost:3000)
npm run db:push      # Push schema changes to Turso
npm run db:studio    # Open Drizzle Studio
```

### Environment Variables

```
TURSO_DATABASE_URL=   # libsql://...
TURSO_AUTH_TOKEN=     # Turso auth token
```

## API

### `POST /api/upload`

**Body**: `{ github_token: string, report_html: string }`

1. Verifies `github_token` against GitHub API
2. Parses `report_html` to extract stats
3. Upserts user + stats
4. Returns `{ profile_url, percentiles }`

## Pages

- `/` — Leaderboard with tabs: Messages, Sessions, Velocity, Scale, Multi-clauding
- `/[handle]` — Profile page with stats grid, language breakdown, activity heatmap, percentile badges

## Sentry Error Monitoring

These guidelines should be used when configuring Sentry functionality within this project.

### Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected.

### Tracing Examples

Spans should be created for meaningful actions like button clicks, API calls, and function calls.
Use `Sentry.startSpan` to create a span. Child spans can exist within a parent span.

#### Custom Span instrumentation in component actions

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request.

```javascript
Sentry.startSpan(
  { op: "ui.click", name: "Test Button Click" },
  (span) => {
    span.setAttribute("config", value);
    span.setAttribute("metric", metric);
    doSomething();
  },
);
```

#### Custom span instrumentation in API calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    { op: "http.client", name: `GET /api/users/${userId}` },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return await response.json();
    },
  );
}
```

### Logs

Import Sentry using `import * as Sentry from "@sentry/nextjs"`.
Enable logging with `Sentry.init({ enableLogs: true })`.
Reference the logger using `const { logger } = Sentry`.

Sentry offers `consoleLoggingIntegration` that logs specific console error types automatically.

#### Configuration

In Next.js:
- Client-side init: `instrumentation-client.ts`
- Server init: `sentry.server.config.ts`
- Edge init: `sentry.edge.config.ts`

Initialization only happens in those files. Other files just `import * as Sentry from "@sentry/nextjs"`.

#### Logger Examples

Use `logger.fmt` as a template literal function for structured logs:

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached", { endpoint: "/api/results/" });
logger.error("Failed to process payment", { orderId: "order_123" });
logger.fatal("Database connection pool exhausted", { database: "users" });
```
