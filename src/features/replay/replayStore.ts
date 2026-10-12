// Time-based replay store (docs/ARCHITECTURE.md §5).
// `position` counts events already played: 0 = before the first event (e.g. 17.0), total = finished.
// The latest played event is therefore seq = position - 1 (-1 before the start).

export const BALL_MS = 3000;
export const SPEEDS = [1, 5, 20] as const;
export type ReplaySpeed = (typeof SPEEDS)[number];

export interface ReplaySnapshot {
  readonly position: number;
  readonly total: number;
  readonly playing: boolean;
  readonly speed: ReplaySpeed;
  readonly finished: boolean;
}

export interface ReplayStore {
  getSnapshot(): ReplaySnapshot;
  subscribe(listener: () => void): () => void;
  /** Recompute position from the clock; call from rAF / visibilitychange. */
  tick(): void;
  play(): void;
  pause(): void;
  toggle(): void;
  setSpeed(speed: ReplaySpeed): void;
  cycleSpeed(): void;
  seekTo(position: number): void;
  restart(): void;
}

interface Anchor {
  readonly basePosition: number;
  readonly startedAt: number;
  readonly speed: ReplaySpeed;
  readonly playing: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Pure: where the replay is at time `now`, given where it was anchored. */
export function computePosition(anchor: Anchor, total: number, now: number): number {
  if (!anchor.playing) return clamp(anchor.basePosition, 0, total);
  const elapsed = Math.max(0, now - anchor.startedAt);
  const advanced = Math.floor((elapsed * anchor.speed) / BALL_MS);
  return clamp(anchor.basePosition + advanced, 0, total);
}

export function nextSpeed(speed: ReplaySpeed): ReplaySpeed {
  const index = SPEEDS.indexOf(speed);
  return SPEEDS[(index + 1) % SPEEDS.length] ?? SPEEDS[0];
}

export function createReplayStore(total: number, now: () => number = () => performance.now()): ReplayStore {
  const listeners = new Set<() => void>();
  let anchor: Anchor = { basePosition: 0, startedAt: now(), speed: 1, playing: false };
  let snapshot: ReplaySnapshot = build(0);

  function build(position: number): ReplaySnapshot {
    return {
      position,
      total,
      playing: anchor.playing && position < total,
      speed: anchor.speed,
      finished: position >= total,
    };
  }

  function publish(next: ReplaySnapshot) {
    const same =
      next.position === snapshot.position &&
      next.playing === snapshot.playing &&
      next.speed === snapshot.speed;
    if (same) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  // Re-anchor at the current position so speed/play changes never jump the replay.
  function reanchor(patch: Partial<Anchor>, position = computePosition(anchor, total, now())) {
    anchor = {
      basePosition: position,
      startedAt: now(),
      speed: anchor.speed,
      playing: anchor.playing,
      ...patch,
    };
    if (position >= total) anchor = { ...anchor, playing: false };
    publish(build(position));
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    tick() {
      const position = computePosition(anchor, total, now());
      if (position >= total && anchor.playing) {
        reanchor({ playing: false }, total);
        return;
      }
      publish(build(position));
    },
    play() {
      const position = computePosition(anchor, total, now());
      if (position >= total) return;
      reanchor({ playing: true }, position);
    },
    pause() {
      reanchor({ playing: false });
    },
    toggle() {
      if (snapshot.playing) this.pause();
      else this.play();
    },
    setSpeed(speed) {
      reanchor({ speed });
    },
    cycleSpeed() {
      reanchor({ speed: nextSpeed(anchor.speed) });
    },
    seekTo(position) {
      reanchor({}, clamp(Math.floor(position), 0, total));
    },
    restart() {
      reanchor({ playing: true }, 0);
    },
  };
}
