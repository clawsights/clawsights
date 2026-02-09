import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, stats } from "@/lib/schema";
import { computePercentiles } from "@/lib/percentiles";
import { ProfileCard } from "@/components/ProfileCard";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.githubHandle, handle));

  if (!user) {
    notFound();
  }

  const [userStats] = await db
    .select()
    .from(stats)
    .where(eq(stats.userId, user.id));

  if (!userStats) {
    notFound();
  }

  const allStats = await db.select().from(stats);
  const percentiles = computePercentiles(userStats, allStats);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
      >
        &larr; Back to Leaderboard
      </a>
      <ProfileCard
        user={user}
        userStats={userStats}
        percentiles={percentiles}
      />
    </div>
  );
}
