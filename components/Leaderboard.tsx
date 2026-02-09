"use client";

import { useState } from "react";
import type { User, Stat } from "@/lib/schema";
import { computePercentiles, type Percentiles } from "@/lib/percentiles";
import { PercentileBadge } from "./PercentileBadge";

type Tab = "messages" | "sessions" | "velocity" | "scale" | "multiclaude";

const tabs: { key: Tab; label: string }[] = [
  { key: "messages", label: "Messages" },
  { key: "sessions", label: "Sessions" },
  { key: "velocity", label: "Velocity" },
  { key: "scale", label: "Scale" },
  { key: "multiclaude", label: "Multi-clauding" },
];

function getStatValue(stat: Stat, tab: Tab): number {
  switch (tab) {
    case "messages":
      return stat.totalMessages ?? 0;
    case "sessions":
      return stat.totalSessions ?? 0;
    case "velocity":
      return stat.msgsPerDay ?? 0;
    case "scale":
      return (stat.linesAdded ?? 0) + (stat.linesRemoved ?? 0);
    case "multiclaude":
      return stat.multiclaudeEvents ?? 0;
  }
}

function formatValue(value: number, tab: Tab): string {
  if (tab === "velocity") return value.toFixed(1);
  return value.toLocaleString();
}

function getStatLabel(tab: Tab): string {
  switch (tab) {
    case "messages":
      return "msgs";
    case "sessions":
      return "sessions";
    case "velocity":
      return "msgs/day";
    case "scale":
      return "lines";
    case "multiclaude":
      return "events";
  }
}

interface LeaderboardProps {
  users: User[];
  allStats: Stat[];
}

export function Leaderboard({ users, allStats }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("messages");

  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = allStats
    .map((stat) => {
      const user = userMap.get(stat.userId);
      if (!user) return null;
      const percentiles = computePercentiles(stat, allStats);
      return { user, stat, percentiles };
    })
    .filter(
      (r): r is { user: User; stat: Stat; percentiles: Percentiles } =>
        r !== null
    )
    .sort((a, b) => getStatValue(b.stat, activeTab) - getStatValue(a.stat, activeTab));

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === key
                ? "text-zinc-100 border-b-2 border-zinc-100 bg-zinc-800/50"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">{getStatLabel(activeTab)}</th>
              <th className="px-4 py-3 text-right">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row, i) => (
              <tr
                key={row.user.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-zinc-500 font-mono">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/${row.user.githubHandle}`}
                    className="flex items-center gap-3 group"
                  >
                    {row.user.avatarUrl ? (
                      <img
                        src={row.user.avatarUrl}
                        alt={row.user.githubHandle}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                        {row.user.githubHandle[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                      @{row.user.githubHandle}
                    </span>
                  </a>
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-zinc-200">
                  {formatValue(getStatValue(row.stat, activeTab), activeTab)}
                </td>
                <td className="px-4 py-3 text-right">
                  <PercentileBadge percentile={row.percentiles[activeTab]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
