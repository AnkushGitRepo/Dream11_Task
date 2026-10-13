// SERVER-ONLY. Pulls the first JSON object out of a model reply (plain, fenced, or with a stray
// sentence around it) and reads string fields with a length cap. Anything else is a parse failure
// and the caller falls back to its template.

export function extractJsonObject(reply: string): Record<string, unknown> | null {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const value: unknown = JSON.parse(reply.slice(start, end + 1));
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** A trimmed non-empty string no longer than `max`, or null. */
export function readText(obj: Record<string, unknown>, key: string, max: number): string | null {
  const v = obj[key];
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t !== '' && t.length <= max ? t : null;
}
