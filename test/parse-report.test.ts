import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseReport, type ParsedReport } from "@/lib/parse-report";

const FIXTURE_PATH = join(__dirname, "fixtures", "sample-report.html");

describe("parseReport", () => {
  let html: string;
  let result: ParsedReport;

  beforeAll(() => {
    html = readFileSync(FIXTURE_PATH, "utf-8");
    result = parseReport(html);
  });

  describe("subtitle parsing", () => {
    it("extracts total messages from subtitle", () => {
      expect(result.totalMessages).toBe(38539);
    });

    it("extracts total sessions from subtitle", () => {
      expect(result.totalSessions).toBe(4769);
    });

    it("extracts date range", () => {
      expect(result.dateFrom).toBe("2025-12-19");
      expect(result.dateTo).toBe("2026-02-09");
    });
  });

  describe("stats row parsing", () => {
    it("extracts lines added", () => {
      expect(result.linesAdded).toBe(1065231);
    });

    it("extracts lines removed", () => {
      expect(result.linesRemoved).toBe(658574);
    });

    it("extracts files touched", () => {
      expect(result.filesTouched).toBe(12382);
    });

    it("extracts days active", () => {
      expect(result.daysActive).toBe(29);
    });

    it("extracts msgs per day", () => {
      expect(result.msgsPerDay).toBe(1328.9);
    });
  });

  describe("languages parsing", () => {
    it("extracts languages as a record", () => {
      expect(result.languages).toBeDefined();
      expect(Object.keys(result.languages).length).toBeGreaterThan(0);
    });

    it("extracts TypeScript as top language", () => {
      expect(result.languages["TypeScript"]).toBe(96431);
    });

    it("extracts CSS", () => {
      expect(result.languages["CSS"]).toBe(1984);
    });

    it("extracts Markdown", () => {
      expect(result.languages["Markdown"]).toBe(981);
    });

    it("extracts JavaScript", () => {
      expect(result.languages["JavaScript"]).toBe(858);
    });

    it("extracts YAML", () => {
      expect(result.languages["YAML"]).toBe(56);
    });

    it("extracts Go", () => {
      expect(result.languages["Go"]).toBe(49);
    });
  });

  describe("multi-clauding parsing", () => {
    it("extracts overlap events", () => {
      expect(result.multiclaudeEvents).toBe(245);
    });

    it("extracts sessions involved", () => {
      expect(result.multiclaudeSessions).toBe(243);
    });

    it("extracts percentage", () => {
      expect(result.multiclaudePct).toBe(5);
    });
  });

  describe("hour counts parsing", () => {
    it("extracts hour counts from JS variable", () => {
      expect(result.hourCounts).toBeDefined();
      expect(Object.keys(result.hourCounts).length).toBeGreaterThan(0);
    });

    it("has correct values for specific hours", () => {
      expect(result.hourCounts["3"]).toBe(16);
      expect(result.hourCounts["7"]).toBe(40);
      expect(result.hourCounts["14"]).toBe(5438);
      expect(result.hourCounts["18"]).toBe(9020);
    });

    it("has no values for hours without activity", () => {
      expect(result.hourCounts["0"]).toBeUndefined();
      expect(result.hourCounts["1"]).toBeUndefined();
    });
  });

  describe("usage narrative parsing", () => {
    it("extracts paragraphs from narrative section", () => {
      expect(result.usageNarrative).not.toBeNull();
      expect(result.usageNarrative!.paragraphs.length).toBe(3);
    });

    it("strips HTML tags from paragraphs", () => {
      const first = result.usageNarrative!.paragraphs[0];
      expect(first).not.toContain("<strong>");
      expect(first).toContain("extremely high-volume, fast-paced user");
    });

    it("extracts key insight", () => {
      expect(result.usageNarrative!.keyInsight).not.toBeNull();
      expect(result.usageNarrative!.keyInsight).toContain("Key pattern:");
      expect(result.usageNarrative!.keyInsight).toContain("ultra-high-volume power user");
    });
  });

  describe("impressive things parsing", () => {
    it("extracts intro text", () => {
      expect(result.impressiveThings).not.toBeNull();
      expect(result.impressiveThings!.intro).toContain("power user running nearly 4,800 sessions");
    });

    it("extracts all wins", () => {
      expect(result.impressiveThings!.wins.length).toBe(3);
    });

    it("extracts win titles", () => {
      const titles = result.impressiveThings!.wins.map((w) => w.title);
      expect(titles).toContain("Parallel Agent Merge Conflict Resolution");
      expect(titles).toContain("Full-Stack Metrics Implementation");
      expect(titles).toContain("Visual UI Verification With Screenshots");
    });

    it("extracts win descriptions", () => {
      const first = result.impressiveThings!.wins[0];
      expect(first.description).toContain("parallel agents to resolve merge conflicts");
    });

    it("strips HTML tags from wins", () => {
      for (const win of result.impressiveThings!.wins) {
        expect(win.title).not.toContain("<");
        expect(win.description).not.toContain("<");
      }
    });
  });

  describe("edge cases", () => {
    it("returns nulls for empty HTML", () => {
      const empty = parseReport("");
      expect(empty.totalMessages).toBeNull();
      expect(empty.totalSessions).toBeNull();
      expect(empty.linesAdded).toBeNull();
      expect(empty.linesRemoved).toBeNull();
      expect(empty.filesTouched).toBeNull();
      expect(empty.daysActive).toBeNull();
      expect(empty.msgsPerDay).toBeNull();
      expect(empty.dateFrom).toBeNull();
      expect(empty.dateTo).toBeNull();
      expect(empty.languages).toEqual({});
      expect(empty.multiclaudeEvents).toBeNull();
      expect(empty.hourCounts).toEqual({});
      expect(empty.usageNarrative).toBeNull();
      expect(empty.impressiveThings).toBeNull();
    });

    it("handles HTML with only a subtitle", () => {
      const partial = `<p class="subtitle">100 messages across 10 sessions | 2025-01-01 to 2025-01-31</p>`;
      const r = parseReport(partial);
      expect(r.totalMessages).toBe(100);
      expect(r.totalSessions).toBe(10);
      expect(r.dateFrom).toBe("2025-01-01");
      expect(r.dateTo).toBe("2025-01-31");
    });

    it("handles HTML with only stats row", () => {
      const partial = `
        <div class="stat"><div class="stat-value">500</div><div class="stat-label">Messages</div></div>
        <div class="stat"><div class="stat-value">+10,000/-5,000</div><div class="stat-label">Lines</div></div>
        <div class="stat"><div class="stat-value">200</div><div class="stat-label">Files</div></div>
        <div class="stat"><div class="stat-value">7</div><div class="stat-label">Days</div></div>
        <div class="stat"><div class="stat-value">71.4</div><div class="stat-label">Msgs/Day</div></div>
      `;
      const r = parseReport(partial);
      expect(r.totalMessages).toBe(500);
      expect(r.linesAdded).toBe(10000);
      expect(r.linesRemoved).toBe(5000);
      expect(r.filesTouched).toBe(200);
      expect(r.daysActive).toBe(7);
      expect(r.msgsPerDay).toBe(71.4);
    });

    it("handles malformed hour counts gracefully", () => {
      const bad = `const rawHourCounts = {not valid json`;
      const r = parseReport(bad);
      expect(r.hourCounts).toEqual({});
    });
  });
});
