/** Local-part of email → readable name (e.g. abhinav.kumar → Abhinav Kumar). */
export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() || email;
  return local
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Prefer stored display name; fall back to email local-part for older accounts. */
export function resolveDisplayName(user: {
  name?: string | null;
  email: string;
}): string {
  const trimmed = user.name?.trim();
  if (trimmed) return trimmed;
  return displayNameFromEmail(user.email);
}

/** Time-of-day greeting in the user's local timezone. */
export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function welcomeLine(
  user: { name?: string | null; email: string },
  date = new Date(),
): string {
  return `${timeOfDayGreeting(date)}, ${resolveDisplayName(user)}`;
}
