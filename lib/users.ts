import type { User } from "@clerk/backend";

export function getDisplayUsername(user: User | null | undefined) {
  if (!user) return null;

  return (
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    user.firstName ||
    "factory-builder"
  );
}

export function getUserHandle(user: User | null | undefined) {
  const username = getDisplayUsername(user);
  return username ? `@${username}` : null;
}
