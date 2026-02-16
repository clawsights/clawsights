import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
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

  return (
    <div className="py-4 sm:py-6 flex-1 flex flex-col min-h-0">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <ProfileCard user={user} />
      </div>
    </div>
  );
}
