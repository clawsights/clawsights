import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../lib/schema";
import { parseReport } from "../lib/parse-report";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

const FAKE_USERS = [
  { githubHandle: "alice-dev", githubId: 100001, displayName: "Alice Developer", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { githubHandle: "bob-codes", githubId: 100002, displayName: "Bob Coder", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { githubHandle: "charlie-eng", githubId: 100003, displayName: "Charlie Engineer", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { githubHandle: "dana-hacks", githubId: 100004, displayName: "Dana Hacker", avatarUrl: "https://i.pravatar.cc/150?u=dana" },
  { githubHandle: "eve-ships", githubId: 100005, displayName: "Eve Shipper", avatarUrl: "https://i.pravatar.cc/150?u=eve" },
  { githubHandle: "frank-types", githubId: 100006, displayName: "Frank Typer", avatarUrl: "https://i.pravatar.cc/150?u=frank" },
  { githubHandle: "grace-builds", githubId: 100007, displayName: "Grace Builder", avatarUrl: "https://i.pravatar.cc/150?u=grace" },
  { githubHandle: "hank-debugs", githubId: 100008, displayName: "Hank Debugger", avatarUrl: "https://i.pravatar.cc/150?u=hank" },
  { githubHandle: "iris-tests", githubId: 100009, displayName: "Iris Tester", avatarUrl: "https://i.pravatar.cc/150?u=iris" },
  { githubHandle: "jake-deploys", githubId: 100010, displayName: "Jake Deployer", avatarUrl: "https://i.pravatar.cc/150?u=jake" },
  { githubHandle: "kate-refactors", githubId: 100011, displayName: "Kate Refactorer", avatarUrl: "https://i.pravatar.cc/150?u=kate" },
  { githubHandle: "leo-reviews", githubId: 100012, displayName: "Leo Reviewer", avatarUrl: "https://i.pravatar.cc/150?u=leo" },
  { githubHandle: "maya-architects", githubId: 100013, displayName: "Maya Architect", avatarUrl: "https://i.pravatar.cc/150?u=maya" },
  { githubHandle: "noah-scripts", githubId: 100014, displayName: "Noah Scripter", avatarUrl: "https://i.pravatar.cc/150?u=noah" },
  { githubHandle: "olivia-ops", githubId: 100015, displayName: "Olivia Ops", avatarUrl: "https://i.pravatar.cc/150?u=olivia" },
];

/** Generate a synthetic GitHub contribution weeks array for seeding. */
function generateFakeContributions(dateFrom: string, dateTo: string) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const weeks: { contributionDays: { contributionCount: number; date: string }[] }[] = [];

  const current = new Date(start);
  // Align to start of week (Sunday)
  current.setDate(current.getDate() - current.getDay());

  while (current <= end) {
    const days: { contributionCount: number; date: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(current);
      date.setDate(date.getDate() + d);
      if (date >= start && date <= end) {
        days.push({
          contributionCount: Math.floor(Math.random() * 15),
          date: date.toISOString().split("T")[0],
        });
      }
    }
    if (days.length > 0) {
      weeks.push({ contributionDays: days });
    }
    current.setDate(current.getDate() + 7);
  }

  const totalContributions = weeks.reduce(
    (sum, w) => sum + w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
    0,
  );
  const activeDays = weeks.reduce(
    (sum, w) => sum + w.contributionDays.filter((d) => d.contributionCount > 0).length,
    0,
  );

  return { weeks, totalContributions, activeDays, totalCommits: Math.floor(totalContributions * 0.7) };
}

async function seed() {
  const reportPath = resolve(homedir(), ".claude/usage-data/report.html");
  let reportHtml: string;
  try {
    reportHtml = readFileSync(reportPath, "utf-8");
  } catch {
    console.error(`Could not read report at ${reportPath}`);
    console.error("Run /insights first to generate your report.html");
    process.exit(1);
  }

  const parsed = parseReport(reportHtml);
  console.log("Seeding database with report from", reportPath);

  const dateFrom = parsed.dateFrom ?? "2025-12-19";
  const dateTo = parsed.dateTo ?? "2026-02-09";

  for (const user of FAKE_USERS) {
    const [inserted] = await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.githubHandle,
        set: { displayName: user.displayName, avatarUrl: user.avatarUrl },
      })
      .returning();

    const gh = generateFakeContributions(dateFrom, dateTo);

    await db
      .insert(schema.stats)
      .values({
        userId: inserted.id,
        reportHtml: reportHtml,
        linesAdded: parsed.linesAdded,
        linesRemoved: parsed.linesRemoved,
        dateFrom,
        dateTo,
        ghTotalCommits: gh.totalCommits,
        ghActiveDays: gh.activeDays,
        ghTotalContributions: gh.totalContributions,
        ghContributions: JSON.stringify(gh.weeks),
      })
      .onConflictDoUpdate({
        target: schema.stats.userId,
        set: {
          reportHtml: reportHtml,
          linesAdded: parsed.linesAdded,
          linesRemoved: parsed.linesRemoved,
          dateFrom,
          dateTo,
          ghTotalCommits: gh.totalCommits,
          ghActiveDays: gh.activeDays,
          ghTotalContributions: gh.totalContributions,
          ghContributions: JSON.stringify(gh.weeks),
          uploadedAt: new Date().toISOString(),
        },
      });

    console.log(`  Seeded ${user.githubHandle}`);
  }

  console.log(`Done! Seeded ${FAKE_USERS.length} users.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
