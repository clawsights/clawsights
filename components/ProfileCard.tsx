import type { User, Stat } from "@/lib/schema";
import type { Percentiles } from "@/lib/percentiles";
import { PercentileBadge } from "./PercentileBadge";

interface ProfileCardProps {
  user: User;
  userStats: Stat;
  percentiles: Percentiles;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ProfileCard({ user, userStats, percentiles }: ProfileCardProps) {
  const linesChanged =
    (userStats.linesAdded ?? 0) + (userStats.linesRemoved ?? 0);

  const languages: Record<string, number> | null = userStats.languages
    ? JSON.parse(userStats.languages)
    : null;

  const hourCounts: Record<string, number> | null = userStats.hourCounts
    ? JSON.parse(userStats.hourCounts)
    : null;

  const usageNarrative: {
    paragraphs: string[];
    keyInsight: string | null;
  } | null = userStats.usageNarrative
    ? JSON.parse(userStats.usageNarrative)
    : null;

  const impressiveThings: {
    intro: string | null;
    wins: { title: string; description: string }[];
  } | null = userStats.impressiveThings
    ? JSON.parse(userStats.impressiveThings)
    : null;

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex items-center gap-5">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.githubHandle}
            width={80}
            height={80}
            className="rounded-full ring-2 ring-zinc-700"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">@{user.githubHandle}</h1>
          {user.displayName && (
            <p className="text-zinc-400 text-lg">{user.displayName}</p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Messages"
          value={formatNumber(userStats.totalMessages ?? 0)}
          percentile={percentiles.messages}
        />
        <StatCard
          label="Sessions"
          value={formatNumber(userStats.totalSessions ?? 0)}
          percentile={percentiles.sessions}
        />
        <StatCard
          label="Lines Changed"
          value={formatNumber(linesChanged)}
          percentile={percentiles.scale}
        />
        <StatCard
          label="Days Active"
          value={formatNumber(userStats.daysActive ?? 0)}
        />
        <StatCard
          label="Msgs/Day"
          value={(userStats.msgsPerDay ?? 0).toFixed(1)}
          percentile={percentiles.velocity}
        />
        <StatCard
          label="Files Touched"
          value={formatNumber(userStats.filesTouched ?? 0)}
        />
      </div>

      {/* Language Breakdown */}
      {languages && Object.keys(languages).length > 0 && (
        <LanguageBreakdown languages={languages} />
      )}

      {/* Activity Heatmap */}
      {hourCounts && Object.keys(hourCounts).length > 0 && (
        <ActivityHeatmap hourCounts={hourCounts} />
      )}

      {/* Multi-clauding Stats */}
      {(userStats.multiclaudeEvents ?? 0) > 0 && (
        <MultiClaudeStats
          events={userStats.multiclaudeEvents ?? 0}
          sessions={userStats.multiclaudeSessions ?? 0}
          pct={userStats.multiclaudePct ?? 0}
          percentile={percentiles.multiclaude}
        />
      )}

      {/* How You Use Claude Code */}
      {usageNarrative && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            How They Use Claude Code
          </h2>
          <div className="space-y-3">
            {usageNarrative.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-zinc-300 leading-relaxed">
                {p}
              </p>
            ))}
            {usageNarrative.keyInsight && (
              <div className="mt-4 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3">
                <p className="text-sm text-zinc-200">{usageNarrative.keyInsight}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Impressive Things */}
      {impressiveThings && impressiveThings.wins.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Impressive Things
          </h2>
          {impressiveThings.intro && (
            <p className="text-sm text-zinc-400 mb-4">{impressiveThings.intro}</p>
          )}
          <div className="space-y-4">
            {impressiveThings.wins.map((win, i) => (
              <div
                key={i}
                className="rounded-lg bg-zinc-800 border border-zinc-700 p-4"
              >
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  {win.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {win.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  percentile,
}: {
  label: string;
  value: string;
  percentile?: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {percentile !== undefined && (
        <PercentileBadge percentile={percentile} className="mt-2" />
      )}
    </div>
  );
}

function LanguageBreakdown({
  languages,
}: {
  languages: Record<string, number>;
}) {
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Languages
      </h2>
      <div className="space-y-2.5">
        {sorted.map(([lang, count]) => (
          <div key={lang} className="flex items-center gap-3">
            <span className="text-sm text-zinc-300 w-28 shrink-0 truncate">
              {lang}
            </span>
            <div className="flex-1 h-5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 w-16 text-right font-mono">
              {formatNumber(count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityHeatmap({
  hourCounts,
}: {
  hourCounts: Record<string, number>;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const counts = hours.map((h) => hourCounts[String(h)] ?? 0);
  const max = Math.max(...counts, 1);

  const intensityClass = (count: number): string => {
    if (count === 0) return "bg-zinc-800";
    const ratio = count / max;
    if (ratio >= 0.75) return "bg-violet-400";
    if (ratio >= 0.5) return "bg-violet-500";
    if (ratio >= 0.25) return "bg-violet-600";
    return "bg-violet-800";
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Activity by Hour
      </h2>
      <div className="flex gap-1">
        {hours.map((h) => (
          <div key={h} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full aspect-square rounded-sm ${intensityClass(counts[h])}`}
              title={`${h}:00 - ${counts[h]} messages`}
            />
            {(h === 0 || h === 6 || h === 12 || h === 18) && (
              <span className="text-[10px] text-zinc-500">{h}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiClaudeStats({
  events,
  sessions,
  pct,
  percentile,
}: {
  events: number;
  sessions: number;
  pct: number;
  percentile: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Multi-clauding
      </h2>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-zinc-500">Events</p>
          <p className="text-lg font-bold">{formatNumber(events)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Sessions</p>
          <p className="text-lg font-bold">{formatNumber(sessions)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">% of Sessions</p>
          <p className="text-lg font-bold">{pct.toFixed(1)}%</p>
        </div>
        <PercentileBadge percentile={percentile} />
      </div>
    </div>
  );
}
