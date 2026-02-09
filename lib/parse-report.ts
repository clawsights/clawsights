export interface ParsedReport {
  totalMessages: number | null;
  totalSessions: number | null;
  linesAdded: number | null;
  linesRemoved: number | null;
  filesTouched: number | null;
  daysActive: number | null;
  msgsPerDay: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  languages: Record<string, number>;
  multiclaudeEvents: number | null;
  multiclaudeSessions: number | null;
  multiclaudePct: number | null;
  hourCounts: Record<string, number>;
}

function parseNum(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Parse the Claude Code /insights report.html and extract quantitative data.
 *
 * The HTML structure is known and stable — we use regex to extract values
 * from the stats row, subtitle, chart sections, and JS variables.
 */
export function parseReport(html: string): ParsedReport {
  const result: ParsedReport = {
    totalMessages: null,
    totalSessions: null,
    linesAdded: null,
    linesRemoved: null,
    filesTouched: null,
    daysActive: null,
    msgsPerDay: null,
    dateFrom: null,
    dateTo: null,
    languages: {},
    multiclaudeEvents: null,
    multiclaudeSessions: null,
    multiclaudePct: null,
    hourCounts: {},
  };

  // Parse subtitle: "38,539 messages across 4769 sessions | 2025-12-19 to 2026-02-09"
  const subtitleMatch = html.match(
    /class="subtitle">([^<]+)/
  );
  if (subtitleMatch) {
    const subtitle = subtitleMatch[1];
    const msgMatch = subtitle.match(/([\d,]+)\s+messages/);
    const sessMatch = subtitle.match(/([\d,]+)\s+sessions/);
    const dateMatch = subtitle.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/);
    if (msgMatch) result.totalMessages = parseNum(msgMatch[1]);
    if (sessMatch) result.totalSessions = parseNum(sessMatch[1]);
    if (dateMatch) {
      result.dateFrom = dateMatch[1];
      result.dateTo = dateMatch[2];
    }
  }

  // Parse stats row: individual stat divs
  // <div class="stat"><div class="stat-value">38,539</div><div class="stat-label">Messages</div></div>
  const statPattern = /<div class="stat-value">([^<]+)<\/div>\s*<div class="stat-label">([^<]+)<\/div>/g;
  let statMatch;
  while ((statMatch = statPattern.exec(html)) !== null) {
    const value = statMatch[1].trim();
    const label = statMatch[2].trim().toLowerCase();

    if (label === "messages") {
      result.totalMessages = parseNum(value);
    } else if (label === "lines") {
      // Format: "+1,065,231/-658,574"
      const linesMatch = value.match(/\+([\d,]+)\/([-]?[\d,]+)/);
      if (linesMatch) {
        result.linesAdded = parseNum(linesMatch[1]);
        result.linesRemoved = parseNum(linesMatch[2].replace("-", ""));
      }
    } else if (label === "files") {
      result.filesTouched = parseNum(value);
    } else if (label === "days") {
      result.daysActive = parseNum(value);
    } else if (label === "msgs/day") {
      result.msgsPerDay = parseNum(value);
    }
  }

  // Parse languages chart
  // <div class="chart-title">Languages</div> followed by bar rows
  const langSection = html.match(
    /<div class="chart-title">Languages<\/div>([\s\S]*?)(?:<\/div>\s*<div class="chart-card">|<\/div>\s*<\/div>\s*<\/div>)/
  );
  if (langSection) {
    const langBarPattern =
      /<div class="bar-label">([^<]+)<\/div>[\s\S]*?<div class="bar-value">([^<]+)<\/div>/g;
    let langMatch;
    while ((langMatch = langBarPattern.exec(langSection[1])) !== null) {
      const lang = langMatch[1].trim();
      const count = parseNum(langMatch[2]);
      if (count !== null) {
        result.languages[lang] = count;
      }
    }
  }

  // Parse multi-clauding section
  // Look for the "Multi-Clauding" section with its stat values
  const multiSection = html.match(
    /Multi-Clauding[\s\S]*?<\/div>\s*<\/div>\s*(?:<p|<\/div>)/
  );
  if (multiSection) {
    const multiStatPattern =
      /<div style="font-size: 24px[^"]*">([^<]+)<\/div>\s*<div style="font-size: 11px[^"]*">([^<]+)<\/div>/g;
    let multiMatch;
    while ((multiMatch = multiStatPattern.exec(multiSection[0])) !== null) {
      const val = multiMatch[1].trim();
      const label = multiMatch[2].trim().toLowerCase();
      if (label.includes("overlap events")) {
        result.multiclaudeEvents = parseNum(val);
      } else if (label.includes("sessions involved")) {
        result.multiclaudeSessions = parseNum(val);
      } else if (label.includes("of messages")) {
        result.multiclaudePct = parseNum(val.replace("%", ""));
      }
    }
  }

  // Parse hour counts from the rawHourCounts JS variable
  const hourMatch = html.match(/const rawHourCounts\s*=\s*(\{[^}]+\})/);
  if (hourMatch) {
    try {
      result.hourCounts = JSON.parse(hourMatch[1]);
    } catch {
      // ignore parse errors
    }
  }

  return result;
}
