import { describe, it, expect } from "vitest";
import {
  computePercentiles,
  formatPercentile,
  percentileColor,
  percentileBgColor,
} from "@/lib/percentiles";
import type { Stat } from "@/lib/schema";

function makeStat(overrides: Partial<Stat> = {}): Stat {
  return {
    id: 1,
    userId: 1,
    reportHtml: "",
    totalMessages: 0,
    totalSessions: 0,
    linesAdded: 0,
    linesRemoved: 0,
    filesTouched: 0,
    daysActive: 0,
    msgsPerDay: 0,
    dateFrom: null,
    dateTo: null,
    languages: null,
    multiclaudeEvents: 0,
    multiclaudeSessions: 0,
    multiclaudePct: 0,
    hourCounts: null,
    usageNarrative: null,
    impressiveThings: null,
    ghTotalCommits: null,
    ghActiveDays: null,
    ghTotalContributions: null,
    ghContributions: null,
    uploadedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("computePercentiles", () => {
  it("returns 100 for a single user", () => {
    const stat = makeStat({ totalMessages: 500 });
    const result = computePercentiles(stat, [stat]);
    expect(result.messages).toBe(100);
    expect(result.sessions).toBe(100);
    expect(result.velocity).toBe(100);
    expect(result.scale).toBe(100);
    expect(result.multiclaude).toBe(100);
  });

  it("ranks highest user at 100th percentile", () => {
    const low = makeStat({ id: 1, userId: 1, totalMessages: 100 });
    const mid = makeStat({ id: 2, userId: 2, totalMessages: 500 });
    const high = makeStat({ id: 3, userId: 3, totalMessages: 1000 });
    const all = [low, mid, high];

    expect(computePercentiles(high, all).messages).toBe(100);
  });

  it("ranks lowest user at 0th percentile", () => {
    const low = makeStat({ id: 1, userId: 1, totalMessages: 100 });
    const mid = makeStat({ id: 2, userId: 2, totalMessages: 500 });
    const high = makeStat({ id: 3, userId: 3, totalMessages: 1000 });
    const all = [low, mid, high];

    expect(computePercentiles(low, all).messages).toBe(0);
  });

  it("ranks middle user at 50th percentile with 3 users", () => {
    const low = makeStat({ id: 1, userId: 1, totalMessages: 100 });
    const mid = makeStat({ id: 2, userId: 2, totalMessages: 500 });
    const high = makeStat({ id: 3, userId: 3, totalMessages: 1000 });
    const all = [low, mid, high];

    expect(computePercentiles(mid, all).messages).toBe(50);
  });

  it("computes scale as lines added + removed", () => {
    const small = makeStat({
      id: 1,
      userId: 1,
      linesAdded: 100,
      linesRemoved: 50,
    });
    const large = makeStat({
      id: 2,
      userId: 2,
      linesAdded: 10000,
      linesRemoved: 5000,
    });
    const all = [small, large];

    expect(computePercentiles(large, all).scale).toBe(100);
    expect(computePercentiles(small, all).scale).toBe(0);
  });

  it("handles null values as 0", () => {
    const withNulls = makeStat({
      totalMessages: null,
      totalSessions: null,
      msgsPerDay: null,
      linesAdded: null,
      linesRemoved: null,
      multiclaudeEvents: null,
    });
    const normal = makeStat({
      id: 2,
      userId: 2,
      totalMessages: 100,
    });
    const all = [withNulls, normal];

    const result = computePercentiles(withNulls, all);
    expect(result.messages).toBe(0);
  });

  it("handles ties correctly", () => {
    const a = makeStat({ id: 1, userId: 1, totalMessages: 500 });
    const b = makeStat({ id: 2, userId: 2, totalMessages: 500 });
    const c = makeStat({ id: 3, userId: 3, totalMessages: 1000 });
    const all = [a, b, c];

    // Both tied users should get the same percentile
    expect(computePercentiles(a, all).messages).toBe(
      computePercentiles(b, all).messages
    );
  });

  it("works with larger datasets", () => {
    const allStats = Array.from({ length: 100 }, (_, i) =>
      makeStat({ id: i + 1, userId: i + 1, totalMessages: (i + 1) * 10 })
    );

    // User with 1000 messages (highest) should be at 100th percentile
    const highest = allStats[99];
    expect(computePercentiles(highest, allStats).messages).toBe(100);

    // User with 10 messages (lowest) should be at 0th percentile
    const lowest = allStats[0];
    expect(computePercentiles(lowest, allStats).messages).toBe(0);

    // User with 500 messages (50th) should be near 50th percentile
    const middle = allStats[49];
    const pct = computePercentiles(middle, allStats).messages;
    expect(pct).toBeGreaterThanOrEqual(45);
    expect(pct).toBeLessThanOrEqual(55);
  });
});

describe("formatPercentile", () => {
  it("formats high percentile as low top%", () => {
    expect(formatPercentile(88)).toBe("top 12%");
  });

  it("formats 100th percentile as top 1%", () => {
    expect(formatPercentile(100)).toBe("top 1%");
  });

  it("formats 0th percentile as top 100%", () => {
    expect(formatPercentile(0)).toBe("top 100%");
  });

  it("formats 50th percentile as top 50%", () => {
    expect(formatPercentile(50)).toBe("top 50%");
  });
});

describe("percentileColor", () => {
  it("returns emerald for 90+", () => {
    expect(percentileColor(95)).toBe("text-emerald-400");
  });

  it("returns green for 75-89", () => {
    expect(percentileColor(80)).toBe("text-green-400");
  });

  it("returns yellow for 50-74", () => {
    expect(percentileColor(60)).toBe("text-yellow-400");
  });

  it("returns orange for 25-49", () => {
    expect(percentileColor(30)).toBe("text-orange-400");
  });

  it("returns red for below 25", () => {
    expect(percentileColor(10)).toBe("text-red-400");
  });
});

describe("percentileBgColor", () => {
  it("returns emerald bg for 90+", () => {
    expect(percentileBgColor(95)).toContain("emerald");
  });

  it("returns red bg for below 25", () => {
    expect(percentileBgColor(10)).toContain("red");
  });
});
