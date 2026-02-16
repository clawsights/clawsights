"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { User } from "@/lib/schema";

type LeaderboardStat = {
  userId: number;
  linesAdded: number | null;
  linesRemoved: number | null;
};

interface LeaderboardProps {
  users: User[];
  allStats: LeaderboardStat[];
}

export function Leaderboard({ users, allStats }: LeaderboardProps) {
  const [search, setSearch] = useState("");

  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = useMemo(() => {
    return allStats
      .map((stat) => {
        const user = userMap.get(stat.userId);
        if (!user) return null;
        return { user, stat };
      })
      .filter((r): r is { user: User; stat: LeaderboardStat } => r !== null)
      .sort(
        (a, b) =>
          (b.stat.linesAdded ?? 0) +
          (b.stat.linesRemoved ?? 0) -
          ((a.stat.linesAdded ?? 0) + (a.stat.linesRemoved ?? 0))
      );
  }, [allStats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.user.githubHandle.toLowerCase().includes(q) ||
        r.user.displayName?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-b border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
        />
      </div>

      {/* Header */}
      <div className="flex items-center py-3 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
        <span className="w-6">#</span>
        <span className="flex-1 pl-2">User</span>
        <span className="text-right w-28 sm:w-52 pr-4">Lines</span>
      </div>

      {/* Rows */}
      <div>
        {filtered.map((row, i) => (
          <a
            key={row.user.id}
            href={`/${row.user.githubHandle}`}
            className="flex items-center py-4 border-b border-slate-200/50 hover:bg-slate-100/50 transition-colors group"
          >
            <span className="w-6 text-sm text-slate-500 font-mono">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-3 pl-2">
              {row.user.avatarUrl ? (
                <Image
                  src={row.user.avatarUrl}
                  alt={row.user.githubHandle}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                  {row.user.githubHandle[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                {row.user.githubHandle}
              </span>
            </div>
            <span className="text-right pr-4 text-xs sm:text-sm font-mono flex flex-col sm:flex-row sm:gap-2 items-end sm:items-center w-28 sm:w-52 shrink-0">
              <span className="text-green-600">+{(row.stat.linesAdded ?? 0).toLocaleString()}</span>
              <span className="text-red-600">-{(row.stat.linesRemoved ?? 0).toLocaleString()}</span>
            </span>
          </a>
        ))}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            No users
          </div>
        )}
      </div>
    </div>
  );
}
