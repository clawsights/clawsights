import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";
import { parseReport } from "@/lib/parse-report";
import { fetchGitHubContributions } from "@/lib/github-contributions";

export async function POST(request: NextRequest) {
  let body: {
    github_token?: string;
    report_html?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { github_token, report_html } = body;

  if (!github_token || !report_html) {
    return NextResponse.json(
      { error: "Missing required fields: github_token, report_html" },
      { status: 400 },
    );
  }

  // Verify GitHub token
  const ghRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${github_token}` },
  });

  if (!ghRes.ok) {
    return NextResponse.json(
      { error: "Invalid GitHub token" },
      { status: 401 },
    );
  }

  const ghUser = await ghRes.json();
  const { login, id: githubId, avatar_url, name } = ghUser;

  // Parse the report HTML
  let parsed;
  try {
    parsed = parseReport(report_html);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse report HTML" },
      { status: 400 },
    );
  }

  // Fetch GitHub contributions for the date range
  let ghTotalCommits: number | null = null;
  let ghActiveDays: number | null = null;
  let ghTotalContributions: number | null = null;
  let ghContributions: string | null = null;

  if (parsed.dateFrom && parsed.dateTo) {
    const contributions = await fetchGitHubContributions(
      github_token,
      parsed.dateFrom,
      parsed.dateTo,
    );
    if (contributions) {
      ghTotalCommits = contributions.totalCommits;
      ghActiveDays = contributions.activeDays;
      ghTotalContributions = contributions.totalContributions;
      ghContributions = JSON.stringify(contributions.weeks);
    }
  }

  try {
    // Upsert user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.githubId, githubId))
      .get();

    let userId: number;

    if (existingUser) {
      await db
        .update(users)
        .set({
          avatarUrl: avatar_url,
          displayName: name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.githubId, githubId));
      userId = existingUser.id;
    } else {
      const inserted = await db
        .insert(users)
        .values({
          githubHandle: login,
          githubId: githubId,
          avatarUrl: avatar_url,
          displayName: name,
        })
        .returning();
      userId = inserted[0].id;
    }

    // Upsert stats
    await db
      .insert(stats)
      .values({
        userId,
        reportHtml: report_html,
        totalMessages: parsed.totalMessages,
        totalSessions: parsed.totalSessions,
        linesAdded: parsed.linesAdded,
        linesRemoved: parsed.linesRemoved,
        msgsPerDay: parsed.msgsPerDay,
        dateFrom: parsed.dateFrom,
        dateTo: parsed.dateTo,
        ghTotalCommits,
        ghActiveDays,
        ghTotalContributions,
        ghContributions,
      })
      .onConflictDoUpdate({
        target: stats.userId,
        set: {
          reportHtml: report_html,
          totalMessages: parsed.totalMessages,
          totalSessions: parsed.totalSessions,
          linesAdded: parsed.linesAdded,
          linesRemoved: parsed.linesRemoved,
          msgsPerDay: parsed.msgsPerDay,
          dateFrom: parsed.dateFrom,
          dateTo: parsed.dateTo,
          ghTotalCommits,
          ghActiveDays,
          ghTotalContributions,
          ghContributions,
          uploadedAt: new Date().toISOString(),
        },
      });

    // Compute leaderboard rank (sorted by total lines changed)
    const allStats = await db
      .select({ userId: stats.userId, linesAdded: stats.linesAdded, linesRemoved: stats.linesRemoved })
      .from(stats)
      .all();
    const sorted = allStats
      .map((s) => ({ userId: s.userId, total: (s.linesAdded ?? 0) + (s.linesRemoved ?? 0) }))
      .sort((a, b) => b.total - a.total);
    const rank = sorted.findIndex((s) => s.userId === userId) + 1;

    return NextResponse.json({
      profile_url: `/${login}`,
      rank,
      total_users: sorted.length,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
