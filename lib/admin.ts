import type { User } from "@clerk/backend";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hasAdminRole(metadata: unknown) {
  const record = asRecord(metadata);
  const role = typeof record.role === "string" ? record.role.toLowerCase() : "";
  const roles = Array.isArray(record.roles) ? record.roles : [];

  return role === "admin" || roles.some((item) => typeof item === "string" && item.toLowerCase() === "admin") || record.admin === true;
}

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false;

  if (hasAdminRole(user.publicMetadata) || hasAdminRole(user.privateMetadata)) return true;

  const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return Boolean(primaryEmail && getConfiguredAdminEmails().includes(primaryEmail));
}
