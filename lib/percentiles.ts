import type { Stat } from "./schema";

export interface Percentiles {
  messages: number;
  sessions: number;
  velocity: number;
  scale: number;
  multiclaude: number;
}

/**
 * Compute percentile rank for a value within a sorted array of values.
 * Returns a number 0-100 where 100 means the value is the highest.
 * Uses the "percentage of values below" method.
 */
function percentileRank(value: number, allValues: number[]): number {
  if (allValues.length <= 1) return 100;
  const below = allValues.filter((v) => v < value).length;
  return Math.round((below / (allValues.length - 1)) * 100);
}

/**
 * Compute percentiles for a user given all stats rows.
 */
export function computePercentiles(
  userStats: Stat,
  allStats: Stat[]
): Percentiles {
  const messages = allStats
    .map((s) => s.totalMessages ?? 0)
    .sort((a, b) => a - b);
  const sessions = allStats
    .map((s) => s.totalSessions ?? 0)
    .sort((a, b) => a - b);
  const velocity = allStats
    .map((s) => s.msgsPerDay ?? 0)
    .sort((a, b) => a - b);
  const scale = allStats
    .map((s) => (s.linesAdded ?? 0) + (s.linesRemoved ?? 0))
    .sort((a, b) => a - b);
  const multiclaude = allStats
    .map((s) => s.multiclaudeEvents ?? 0)
    .sort((a, b) => a - b);

  return {
    messages: percentileRank(userStats.totalMessages ?? 0, messages),
    sessions: percentileRank(userStats.totalSessions ?? 0, sessions),
    velocity: percentileRank(userStats.msgsPerDay ?? 0, velocity),
    scale: percentileRank(
      (userStats.linesAdded ?? 0) + (userStats.linesRemoved ?? 0),
      scale
    ),
    multiclaude: percentileRank(
      userStats.multiclaudeEvents ?? 0,
      multiclaude
    ),
  };
}

/**
 * Format a percentile as "top X%" string.
 * e.g. percentile 88 → "top 12%"
 */
export function formatPercentile(percentile: number): string {
  const top = 100 - percentile;
  return `top ${Math.max(1, top)}%`;
}

/**
 * Get color class for a percentile badge.
 */
export function percentileColor(percentile: number): string {
  if (percentile >= 90) return "text-emerald-400";
  if (percentile >= 75) return "text-green-400";
  if (percentile >= 50) return "text-yellow-400";
  if (percentile >= 25) return "text-orange-400";
  return "text-red-400";
}

export function percentileBgColor(percentile: number): string {
  if (percentile >= 90) return "bg-emerald-400/10 border-emerald-400/20";
  if (percentile >= 75) return "bg-green-400/10 border-green-400/20";
  if (percentile >= 50) return "bg-yellow-400/10 border-yellow-400/20";
  if (percentile >= 25) return "bg-orange-400/10 border-orange-400/20";
  return "bg-red-400/10 border-red-400/20";
}
