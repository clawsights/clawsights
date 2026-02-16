import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.githubHandle, handle));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [stat] = await db
      .select()
      .from(stats)
      .where(eq(stats.userId, user.id));

    // Build comparison body
    const lines: string[] = [
      `## Reported Profile: @${handle}`,
      "",
      "### Self-Reported Stats (from /insights)",
    ];

    if (stat) {
      if (stat.totalMessages != null)
        lines.push(`- Messages: ${stat.totalMessages.toLocaleString()}`);
      if (stat.totalSessions != null)
        lines.push(`- Sessions: ${stat.totalSessions.toLocaleString()}`);
      if (stat.linesAdded != null)
        lines.push(`- Lines Added: ${stat.linesAdded.toLocaleString()}`);
      if (stat.linesRemoved != null)
        lines.push(`- Lines Removed: ${stat.linesRemoved.toLocaleString()}`);
      if (stat.dateFrom && stat.dateTo)
        lines.push(`- Date Range: ${stat.dateFrom} to ${stat.dateTo}`);
    } else {
      lines.push("_No stats uploaded_");
    }

    lines.push(
      "",
      "### Why is this suspicious?",
      "_Please describe why you believe these stats are inaccurate._",
      "",
      "---",
      `Profile: https://clawsights.com/${handle}`,
    );

    const title = `[Report] @${handle}`;
    const body = lines.join("\n");

    // Search for existing open issue
    const searchQuery = `repo:clawsights/clawsights is:issue is:open in:title "[Report] @${handle}"`;
    const searchRes = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.total_count > 0) {
        return NextResponse.json({
          existing: true,
          url: searchData.items[0].html_url,
        });
      }
    }

    // No existing issue — return a pre-filled issue URL
    const issueUrl = `https://github.com/clawsights/clawsights/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

    return NextResponse.json({
      existing: false,
      url: issueUrl,
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("Report user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
