import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '@shared/sports/types';
import { mockAsk } from '@/services/mockApi';
import type { AskContext, AskTurn } from './types';

export interface AskApi {
  /** Oldest first. */
  readonly turns: readonly AskTurn[];
  readonly send: (question: string) => void;
  readonly retry: (id: number) => void;
}

const isRateLimited = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 'RATE_LIMITED';

/**
 * Ask state machine: pending -> done | error. Immutable updates; a response is applied only if its
 * attempt number is still current, so retries and unmounts never resurrect stale answers.
 */
export function useAsk(matchId: string, lang: Lang, getContext: () => AskContext): AskApi {
  const [turns, setTurns] = useState<readonly AskTurn[]>([]);
  const nextId = useRef(0);
  const alive = useRef(true);
  const contextRef = useRef(getContext);
  useEffect(() => {
    contextRef.current = getContext;
  });
  const turnsRef = useRef(turns);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const patch = useCallback((id: number, attempt: number, change: Partial<AskTurn>) => {
    if (!alive.current) return;
    setTurns((prev) => prev.map((t) => (t.id === id && t.attempt === attempt ? { ...t, ...change } : t)));
  }, []);

  const run = useCallback(
    (turn: AskTurn) => {
      const { seq, facts } = contextRef.current();
      mockAsk({ matchId, seq, question: turn.question, lang: turn.lang, facts: [...facts] }).then(
        (res) =>
          patch(turn.id, turn.attempt, {
            status: 'done',
            answer: res.answer,
            answerId: res.id,
            source: res.source,
          }),
        (err: unknown) =>
          patch(turn.id, turn.attempt, {
            status: 'error',
            failure: isRateLimited(err) ? 'rateLimited' : 'failed',
          }),
      );
    },
    [matchId, patch],
  );

  const send = useCallback(
    (question: string) => {
      const text = question.trim();
      if (text === '') return;
      const turn: AskTurn = { id: nextId.current++, question: text, lang, status: 'pending', attempt: 0 };
      setTurns((prev) => [...prev, turn]);
      run(turn);
    },
    [lang, run],
  );

  const retry = useCallback(
    (id: number) => {
      const old = turnsRef.current.find((t) => t.id === id);
      if (!old || old.status !== 'error') return;
      const turn: AskTurn = {
        id: old.id,
        question: old.question,
        lang: old.lang,
        status: 'pending',
        attempt: old.attempt + 1,
      };
      setTurns((prev) => prev.map((t) => (t.id === id ? turn : t)));
      run(turn);
    },
    [run],
  );

  return { turns, send, retry };
}
