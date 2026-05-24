import { Quadrant } from "@/types";

const TAG_PATTERNS = {
  eisenhower: /\[eisenhower:.+?\]/g,
  category: /\[category:.+?\]/g,
  progress: /\[progress:.+?\]/g,
};

export function stripTags(notes: string): string {
  return notes
    .replace(TAG_PATTERNS.eisenhower, "")
    .replace(TAG_PATTERNS.category, "")
    .replace(TAG_PATTERNS.progress, "")
    .trim();
}

export function parseTag(notes: string, key: string): string | undefined {
  const match = notes.match(new RegExp(`\\[${key}:(.+?)\\]`));
  return match ? match[1] : undefined;
}

export function buildNotes(
  userNotes: string,
  quadrant: Quadrant,
  category?: string,
  progress?: string,
): string {
  const parts = [stripTags(userNotes)];
  if (quadrant !== "unassigned") parts.push(`[eisenhower:${quadrant}]`);
  if (category) parts.push(`[category:${category}]`);
  if (progress) parts.push(`[progress:${progress}]`);
  return parts.filter(Boolean).join("\n");
}
