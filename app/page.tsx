import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";
import { Leaderboard } from "@/components/Leaderboard";
import { CopyCommand } from "@/components/CopyCommand";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allUsers = await db.select().from(users);
  const allStats = await db
    .select({
      userId: stats.userId,
      linesAdded: stats.linesAdded,
      linesRemoved: stats.linesRemoved,
    })
    .from(stats);

  const totalUsers = allUsers.length;
  const totalAdded = allStats.reduce(
    (sum, s) => sum + (s.linesAdded ?? 0),
    0
  );
  const totalRemoved = allStats.reduce(
    (sum, s) => sum + (s.linesRemoved ?? 0),
    0
  );

  return (
    <div className="max-w-5xl w-full mx-auto py-12 overflow-hidden">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="text-5xl sm:text-6xl mb-2">🦞</div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Clawsights
        </h1>
        <p className="text-slate-500 text-lg mb-6 max-w-xl mx-auto px-2">
          See where you rank among Claude Code users. Upload your stats and
          compare your usage across messages, sessions, velocity, and more.
        </p>

        <div className="max-w-full sm:max-w-fit mx-auto mb-6 mt-8 px-2">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">
            Install &amp; run the skill
          </p>
          <CopyCommand command={'npx skills add clawsights/clawsights --agent claude-code && claude "/clawsights"'} />
        </div>

        {totalUsers > 0 && (
          <div className="inline-flex items-center gap-3 sm:gap-6 rounded-full border border-slate-200 bg-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-mono">
            <span className="text-slate-900">{totalUsers.toLocaleString()} <span className="text-slate-500 text-xs font-sans">users</span></span>
            <span className="w-px h-4 bg-slate-300" />
            <span>
              <span className="text-green-600">+{totalAdded.toLocaleString()}</span>
              {" "}
              <span className="text-slate-500 text-xs font-sans">added</span>
            </span>
            <span>
              <span className="text-red-600">-{totalRemoved.toLocaleString()}</span>
              {" "}
              <span className="text-slate-500 text-xs font-sans">removed</span>
            </span>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <Leaderboard users={allUsers} allStats={allStats} />
    </div>
  );
}
