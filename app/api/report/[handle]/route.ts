import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";

type ContribWeek = { contributionDays: { contributionCount: number; date: string }[] };

function getContribColor(count: number, max: number): string {
  if (count === 0) return "#ebedf0";
  const ratio = count / max;
  if (ratio <= 0.25) return "#9be9a8";
  if (ratio <= 0.5) return "#40c463";
  if (ratio <= 0.75) return "#30a14e";
  return "#216e39";
}

function buildContribGraph(weeks: ContribWeek[]): string {
  const cellSize = 10;
  const gap = 2;
  const step = cellSize + gap;
  const width = weeks.length * step + 2;
  const height = 7 * step + 2;

  let maxCount = 1;
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > maxCount) maxCount = day.contributionCount;
    }
  }

  let rects = "";
  for (let w = 0; w < weeks.length; w++) {
    for (let d = 0; d < weeks[w].contributionDays.length; d++) {
      const day = weeks[w].contributionDays[d];
      const x = w * step + 1;
      const y = d * step + 1;
      const fill = getContribColor(day.contributionCount, maxCount);
      rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}"><title>${day.contributionCount} contributions on ${day.date}</title></rect>`;
    }
  }

  return `<div style="overflow-x:auto;"><svg width="${width}" height="${height}" style="display:block;">${rects}</svg></div>`;
}

function buildUserHeader(
  user: { githubHandle: string; avatarUrl: string | null; displayName: string | null },
  dateFrom: string | null,
  dateTo: string | null,
  gh: { totalCommits: number | null; activeDays: number | null; totalContributions: number | null; contributions: string | null },
): string {
  const avatarHtml = user.avatarUrl
    ? `<img src="${user.avatarUrl}" alt="${user.githubHandle}" width="64" height="64" style="width:64px;height:64px;border-radius:50%;border:2px solid #e2e8f0;" />`
    : "";

  let graphSvg = "";
  if (gh.contributions) {
    try {
      const weeks: ContribWeek[] = JSON.parse(gh.contributions);
      graphSvg = buildContribGraph(weeks);
    } catch { /* skip graph if data is bad */ }
  }

  const captionParts: string[] = [];
  if (gh.totalCommits != null) captionParts.push(`${gh.totalCommits.toLocaleString()} commits`);
  if (dateFrom && dateTo) captionParts.push(`${dateFrom} to ${dateTo}`);
  const graphCaption = captionParts.join(" &middot; ");

  const graphSection = graphSvg ? `
    <div class="cs-graph-section">
      ${graphSvg}
      ${graphCaption ? `<div class="cs-graph-caption">${graphCaption}</div>` : ""}
    </div>` : "";

  return `<style>
  .cs-header{max-width:800px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid #e2e8f0;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;}
  .cs-user{display:flex;align-items:center;gap:14px;}
  .cs-user-name{text-align:left;}
  .cs-graph-section{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;}
  .cs-graph-caption{font-size:11px;color:#94a3b8;margin-top:6px;text-align:right;}
  @media(max-width:640px){
    .cs-header{flex-direction:column;align-items:center;gap:32px;justify-content:center;}
    .cs-user{flex-direction:column;align-items:center;gap:8px;}
    .cs-user-name{text-align:center;}
    .cs-graph-section{display:flex;flex-direction:column;align-items:center;}
    .cs-graph-caption{text-align:center;}
  }
</style>
<div class="cs-header">
  <div class="cs-user">
    ${avatarHtml}
    <div class="cs-user-name">
      <div style="font-size:18px;font-weight:700;color:#0f172a;">@${user.githubHandle}</div>
      ${user.displayName ? `<div style="font-size:14px;color:#64748b;">${user.displayName}</div>` : ""}
    </div>
  </div>
  ${graphSection}
</div>`;
}

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
      return new NextResponse("Not found", { status: 404 });
    }

    const [userStats] = await db
      .select({
        reportHtml: stats.reportHtml,
        dateFrom: stats.dateFrom,
        dateTo: stats.dateTo,
        ghTotalCommits: stats.ghTotalCommits,
        ghActiveDays: stats.ghActiveDays,
        ghTotalContributions: stats.ghTotalContributions,
        ghContributions: stats.ghContributions,
      })
      .from(stats)
      .where(eq(stats.userId, user.id));

    if (!userStats?.reportHtml) {
      return new NextResponse("Not found", { status: 404 });
    }

    const header = buildUserHeader(user, userStats.dateFrom, userStats.dateTo, {
      totalCommits: userStats.ghTotalCommits,
      activeDays: userStats.ghActiveDays,
      totalContributions: userStats.ghTotalContributions,
      contributions: userStats.ghContributions,
    });
    const html = userStats.reportHtml.replace(/(<body[^>]*>)/i, `$1${header}`);

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    Sentry.captureException(err);
    console.error("Report error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
