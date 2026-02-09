import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allUsers = await db.select().from(users);
  const allStats = await db.select().from(stats);

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
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
            Clawsights
          </span>
        </h1>
        <p className="text-zinc-400 text-lg mb-6 max-w-xl mx-auto">
          See where you rank among Claude Code users. Upload your stats and
          compare your usage across messages, sessions, velocity, and more.
        </p>

        {totalUsers > 0 && (
          <div className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-5 py-2 text-sm font-mono">
            <span className="text-green-500">
              +{totalAdded.toLocaleString()}
            </span>
            <span className="text-zinc-500 text-xs font-sans">added</span>
            <span className="text-red-500">
              -{totalRemoved.toLocaleString()}
            </span>
            <span className="text-zinc-500 text-xs font-sans">removed</span>
          </div>
        )}
      </div>

      {/* Leaderboard or empty state */}
      {allUsers.length > 0 ? (
        <Leaderboard users={allUsers} allStats={allStats} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-zinc-400 text-lg mb-2">No users yet</p>
          <p className="text-zinc-500 text-sm">
            Run <code className="text-zinc-300">/clawsights</code> in Claude
            Code to upload your stats and appear on the leaderboard.
          </p>
        </div>
      )}
    </div>
  );
}
