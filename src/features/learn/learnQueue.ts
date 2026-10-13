// Pure queue logic for Learn cards: which new events teach something, and what joins the queue.

export interface LearnItem {
  readonly seq: number;
  readonly ruleId: string;
}

/**
 * When the fan scrubs far ahead only the newest events can raise a card, so what appears is about
 * what is on screen now rather than something several balls old.
 */
export const MAX_LOOKBACK = 2;

/**
 * Rule ids raised by the events that became "played" between two replay positions.
 * Backwards moves and no-ops raise nothing. Oldest first.
 */
export function collectNew(
  prevPosition: number,
  position: number,
  teachablesAt: (seq: number) => readonly string[],
): LearnItem[] {
  if (position <= prevPosition) return [];
  const from = Math.max(prevPosition, position - MAX_LOOKBACK);
  const out: LearnItem[] = [];
  for (let seq = from; seq < position; seq += 1) {
    for (const ruleId of teachablesAt(seq)) out.push({ seq, ruleId });
  }
  return out;
}

/** Adds items unless that rule is already queued or the caller says to skip it. Never mutates. */
export function enqueue(
  queue: readonly LearnItem[],
  items: readonly LearnItem[],
  skip: (ruleId: string) => boolean,
): LearnItem[] {
  const next = [...queue];
  for (const item of items) {
    if (skip(item.ruleId) || next.some((q) => q.ruleId === item.ruleId)) continue;
    next.push(item);
  }
  return next;
}

/** Puts a tapped item first (replacing the same rule if queued) so it shows immediately. */
export function promote(queue: readonly LearnItem[], item: LearnItem): LearnItem[] {
  return [item, ...queue.filter((q) => q.ruleId !== item.ruleId)];
}
