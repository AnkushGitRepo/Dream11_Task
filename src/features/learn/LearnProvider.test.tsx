import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { createReplayStore } from '@/features/replay';
import { useTeachable } from './LearnContext';
import { LearnProvider } from './LearnProvider';
import { getLearnState, isLearned, resetLearnState, setLearnOn } from './learnStore';
import { MOMENT, PAK_IND, stubFetch } from './testUtils';

const NO_BALL_SEQ = 245;
const FREE_HIT_BYE_SEQ = 247;

function Probe({ seq }: { seq: number }) {
  const teach = useTeachable(seq);
  return teach ? (
    <button type="button" onClick={teach.onLearn}>
      {`teach:${teach.term}`}
    </button>
  ) : (
    <span>no-teach</span>
  );
}

/** Starts one ball before the no-ball, so the next step plays it. Seeks happen with Learn state as set. */
const setup = (onAskMore = vi.fn()) => {
  const store = createReplayStore(PAK_IND.events.length);
  store.seekTo(NO_BALL_SEQ);
  render(
    <LearnProvider timeline={PAK_IND} store={store} onAskMore={onAskMore}>
      <Probe seq={FREE_HIT_BYE_SEQ} />
    </LearnProvider>,
  );
  return { store, onAskMore };
};

const flush = () =>
  act(async () => {
    await Promise.resolve();
  });

beforeEach(() => {
  updateSettings({ lang: 'en', autoRead: false });
  resetLearnState();
  stubFetch(MOMENT);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('LearnProvider', () => {
  it('shows nothing while Learn mode is off, even for a teachable ball', async () => {
    const { store } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    await flush();
    expect(screen.queryByRole('heading', { name: 'No-ball' })).toBeNull();
    expect(screen.getByText('no-teach')).toBeInTheDocument();
  });

  it('raises a card when a teachable ball is played, one at a time', async () => {
    setLearnOn(true);
    const { store } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    await flush();
    expect(await screen.findByRole('heading', { name: 'No-ball' })).toBeInTheDocument();
    expect(await screen.findByText(MOMENT.moment)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
  });

  it('"Got it" remembers the rule and it is not raised again', async () => {
    setLearnOn(true);
    const { store } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    fireEvent.click(await screen.findByRole('button', { name: 'Got it' }));
    expect(isLearned('cricket', 'no-ball')).toBe(true);
    expect(getLearnState().learned).toContain('cricket:no-ball');
    act(() => store.seekTo(NO_BALL_SEQ + 2));
    act(() => store.seekTo(NO_BALL_SEQ + 1)); // back to the no-ball...
    act(() => store.seekTo(NO_BALL_SEQ + 2)); // ...and forward again
    await flush();
    expect(screen.queryByRole('heading', { name: 'No-ball' })).toBeNull();
  });

  it('closing a card hides it for the session without marking it learned', async () => {
    setLearnOn(true);
    const { store } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    await screen.findByRole('heading', { name: 'No-ball' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('heading', { name: 'No-ball' })).toBeNull();
    expect(isLearned('cricket', 'no-ball')).toBe(false);
  });

  it('a tapped teachable ball explains the rule immediately, most specific first', async () => {
    setLearnOn(true);
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'teach:Bowled on a free hit' }));
    expect(await screen.findByRole('heading', { name: 'Bowled on a free hit' })).toBeInTheDocument();
  });

  it('"More" hands the localised term to Ask and closes the card', async () => {
    setLearnOn(true);
    const { store, onAskMore } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    fireEvent.click(await screen.findByRole('button', { name: 'More' }));
    expect(onAskMore).toHaveBeenCalledWith('No-ball');
    expect(screen.queryByRole('heading', { name: 'No-ball' })).toBeNull();
  });

  it('does not flood the screen after a big jump forward', async () => {
    setLearnOn(true);
    const { store } = setup();
    act(() => store.seekTo(PAK_IND.events.length));
    await flush();
    expect(screen.queryAllByRole('heading', { level: 2 }).length).toBeLessThanOrEqual(1);
  });

  it('turning Learn off clears the card', async () => {
    setLearnOn(true);
    const { store } = setup();
    act(() => store.seekTo(NO_BALL_SEQ + 1));
    await screen.findByRole('heading', { name: 'No-ball' });
    act(() => setLearnOn(false));
    expect(screen.queryByRole('heading', { name: 'No-ball' })).toBeNull();
  });
});
