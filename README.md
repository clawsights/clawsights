# Clawsights


Leaderboard for Claude Code users. Run `/clawsights` in Claude Code to upload your `/insights` stats and see where you rank.

## How it works

1. Install the skill: `npx skills add clawsights/clawsights`
2. Run `/clawsights` in Claude Code
3. It runs `/insights`, uploads your report, and gives you a profile URL
4. Re-run anytime to update your stats

## Stack

Next.js 15, Drizzle ORM, Turso (SQLite), Tailwind CSS

## Local dev

```bash
npm install
echo "TURSO_DATABASE_URL=file:local.db" > .env.local
npm run db:push
npm run dev
```

To test the skill against your local server, launch Claude Code with `CLAWSIGHTS_URL` set:

```bash
CLAWSIGHTS_URL=http://localhost:3000 claude
```

Then run `/clawsights` as normal — uploads will go to localhost instead of production.

## Tests

```bash
npm test
```

To regenerate the test fixture from a fresh `/insights` report:

```bash
./scripts/update-sample-report.sh
```
