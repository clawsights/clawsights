import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";
import { parseReport } from "@/lib/parse-report";
import { computePercentiles } from "@/lib/percentiles";

export async function POST(request: NextRequest) {
  let body: {
    github_token?: string;
    report_html?: string;
    include_narratives?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { github_token, report_html, include_narratives } = body;

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
        filesTouched: parsed.filesTouched,
        daysActive: parsed.daysActive,
        msgsPerDay: parsed.msgsPerDay,
        dateFrom: parsed.dateFrom,
        dateTo: parsed.dateTo,
        languages: JSON.stringify(parsed.languages),
        multiclaudeEvents: parsed.multiclaudeEvents,
        multiclaudeSessions: parsed.multiclaudeSessions,
        multiclaudePct: parsed.multiclaudePct,
        hourCounts: JSON.stringify(parsed.hourCounts),
        usageNarrative: include_narratives && parsed.usageNarrative
          ? JSON.stringify(parsed.usageNarrative)
          : null,
        impressiveThings: include_narratives && parsed.impressiveThings
          ? JSON.stringify(parsed.impressiveThings)
          : null,
      })
      .onConflictDoUpdate({
        target: stats.userId,
        set: {
          reportHtml: report_html,
          totalMessages: parsed.totalMessages,
          totalSessions: parsed.totalSessions,
          linesAdded: parsed.linesAdded,
          linesRemoved: parsed.linesRemoved,
          filesTouched: parsed.filesTouched,
          daysActive: parsed.daysActive,
          msgsPerDay: parsed.msgsPerDay,
          dateFrom: parsed.dateFrom,
          dateTo: parsed.dateTo,
          languages: JSON.stringify(parsed.languages),
          multiclaudeEvents: parsed.multiclaudeEvents,
          multiclaudeSessions: parsed.multiclaudeSessions,
          multiclaudePct: parsed.multiclaudePct,
          hourCounts: JSON.stringify(parsed.hourCounts),
          usageNarrative: include_narratives && parsed.usageNarrative
            ? JSON.stringify(parsed.usageNarrative)
            : null,
          impressiveThings: include_narratives && parsed.impressiveThings
            ? JSON.stringify(parsed.impressiveThings)
            : null,
          uploadedAt: new Date().toISOString(),
        },
      });

    // Fetch all stats for percentile computation
    const allStats = await db.select().from(stats).all();
    const userStats = allStats.find((s) => s.userId === userId)!;
    const percentiles = computePercentiles(userStats, allStats);

    return NextResponse.json({
      profile_url: `/${login}`,
      percentiles: {
        messages: percentiles.messages,
        sessions: percentiles.sessions,
        velocity: percentiles.velocity,
        scale: percentiles.scale,
        multiclaude: percentiles.multiclaude,
      },
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
