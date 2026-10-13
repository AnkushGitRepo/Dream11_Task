import type { Lang } from '../../shared/sports/types';
import { LruCache } from './cache';

// The seam between text generation and voicing. /api/recap and /api/ask (Phase 3) call
// registerSpeakable() with the exact text THEY produced (the `speak` field: for Hinglish the
// Devanagari rendering). /api/speak can only voice what is registered here, so it cannot be used
// as a free TTS proxy.

export type SpeakKind = 'recap' | 'answer' | 'learn';

export interface Speakable {
  readonly text: string;
  readonly lang: Lang;
}

const MAX_ENTRIES = 500;
const registry = new LruCache<Speakable>(MAX_ENTRIES);

const keyOf = (kind: SpeakKind, id: string) => `${kind}:${id}`;

export function registerSpeakable(kind: SpeakKind, id: string, speakable: Speakable): void {
  registry.set(keyOf(kind, id), speakable);
}

export function lookupSpeakable(kind: SpeakKind, id: string): Speakable | undefined {
  return registry.get(keyOf(kind, id));
}
