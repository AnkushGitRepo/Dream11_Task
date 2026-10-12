import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MATCHES_INDEX, type MatchIndexEntry } from '@/mocks/matches.mock';

export type MatchesIndexState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly matches: readonly MatchIndexEntry[] };

const LATENCY_MS = 350;

/**
 * Resolves the mock index after a short async tick so loading/error are real states.
 * `?matches=error` forces the error state (for demoing); retry re-runs the load.
 */
export function useMatchesIndex(): { state: MatchesIndexState; retry: () => void } {
  const [params] = useSearchParams();
  const forceError = params.get('matches') === 'error';
  const [state, setState] = useState<MatchesIndexState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(forceError ? { status: 'error' } : { status: 'ready', matches: MATCHES_INDEX });
    }, LATENCY_MS);
    return () => window.clearTimeout(timer);
  }, [attempt, forceError]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
