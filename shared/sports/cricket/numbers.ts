import { clockToLegalBalls } from './format.ts';

/**
 * Collects every number a writer may legitimately use. Add STRUCTURED values only (never scrape
 * text): the unit tests scrape the rendered facts and require each token to be in this set.
 */
export class NumberBag {
  private readonly set = new Set<number>();

  add(...values: readonly (number | null | undefined)[]): this {
    for (const v of values) if (typeof v === 'number' && Number.isFinite(v)) this.set.add(v);
    return this;
  }

  /** '16.3' -> 16.3 plus its parts 16 and 3 (so "16 overs" and "3 balls" are allowed). */
  addOvers(clock: string | null | undefined): this {
    if (!clock) return this;
    const n = Number(clock);
    if (Number.isFinite(n)) this.add(n);
    const balls = clockToLegalBalls(clock);
    if (balls !== null) this.add(Math.floor(balls / 6), balls % 6, balls);
    return this;
  }

  /** A rate: two decimals as shown, plus the one-decimal and whole-number readings of it. */
  addRate(rate: number | null | undefined): this {
    if (rate === null || rate === undefined) return this;
    return this.add(rate, Math.round(rate * 10) / 10, Math.round(rate));
  }

  /** Every integer inside a free text such as a result line ('India won by 7 runs'). */
  addFromText(text: string): this {
    for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) this.add(Number(m[0]));
    return this;
  }

  toSorted(): number[] {
    return [...this.set].sort((a, b) => a - b);
  }
}

/** Numbers appearing in any rendered text, as parsed by a reader (used by tests and guard). */
export function numbersInText(text: string): number[] {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}
