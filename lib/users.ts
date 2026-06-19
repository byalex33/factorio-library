import type { User } from "@clerk/backend";
import { formatUsername } from "@/lib/blueprints";

export function getDisplayUsername(user: User | null | undefined) {
  if (!user) return null;

  return formatUsername(
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    user.firstName ||
    "factory-builder",
  );
}

export function getUserHandle(user: User | null | undefined) {
  return getDisplayUsername(user);
}
