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
