import type { User } from "@/lib/schema";
import { BrowserWindow } from "./BrowserWindow";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BrowserWindow handle={user.githubHandle} />
    </div>
  );
}
