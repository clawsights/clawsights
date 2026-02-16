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

    it("extracts msgs per day", () => {
      expect(result.msgsPerDay).toBe(1328.9);
    });
  });

  describe("edge cases", () => {
    it("returns nulls for empty HTML", () => {
      const empty = parseReport("");
      expect(empty.totalMessages).toBeNull();
      expect(empty.totalSessions).toBeNull();
      expect(empty.linesAdded).toBeNull();
      expect(empty.linesRemoved).toBeNull();
      expect(empty.msgsPerDay).toBeNull();
      expect(empty.dateFrom).toBeNull();
      expect(empty.dateTo).toBeNull();
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
        <div class="stat"><div class="stat-value">71.4</div><div class="stat-label">Msgs/Day</div></div>
      `;
      const r = parseReport(partial);
      expect(r.totalMessages).toBe(500);
      expect(r.linesAdded).toBe(10000);
      expect(r.linesRemoved).toBe(5000);
      expect(r.msgsPerDay).toBe(71.4);
    });
  });
});
