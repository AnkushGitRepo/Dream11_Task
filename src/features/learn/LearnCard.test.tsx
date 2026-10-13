import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { LearnCard, type LearnCardProps } from './LearnCard';
import { MOMENT, stubFetch } from './testUtils';

const base: LearnCardProps = {
  item: { seq: 245, ruleId: 'no-ball' },
  sport: 'cricket',
  matchId: 'pak-ind-2022-t20wc-mcg',
  queued: 0,
  learnedCount: 0,
  autoRead: false,
  onGotIt: vi.fn(),
  onClose: vi.fn(),
  onMore: vi.fn(),
  onOpenGlossary: vi.fn(),
};

beforeEach(() => updateSettings({ lang: 'en' }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('LearnCard', () => {
  it('shows the rulebook title and rule at once, then the moment line', async () => {
    stubFetch(MOMENT);
    render(<LearnCard {...base} />);
    expect(screen.getByRole('heading', { name: 'No-ball' })).toBeInTheDocument();
    expect(screen.getByText(/An illegal delivery, usually from overstepping/)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Connecting this to the match…' })).toBeInTheDocument();
    expect(await screen.findByText(MOMENT.moment)).toBeInTheDocument();
    expect(screen.getByText('In this match')).toBeInTheDocument();
    expect(screen.getByText('LEARN · No-ball')).toBeInTheDocument();
  });

  it('works offline: rulebook text only, no moment line, no stuck skeleton', async () => {
    stubFetch(null);
    render(<LearnCard {...base} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'No-ball' })).toBeInTheDocument();
    expect(screen.queryByText('In this match')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders in the fan language', async () => {
    updateSettings({ lang: 'gu' });
    stubFetch(null);
    render(<LearnCard {...base} />);
    expect(screen.getByRole('heading', { name: 'નો-બોલ' })).toBeInTheDocument();
    expect(screen.getByText('શીખો · નો-બોલ')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('wires Got it, Close and More (with the localised term)', async () => {
    stubFetch(null);
    render(<LearnCard {...base} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(base.onGotIt).toHaveBeenCalledTimes(1);
    expect(base.onClose).toHaveBeenCalledTimes(1);
    expect(base.onMore).toHaveBeenCalledWith('No-ball');
  });

  it('shows the queue chip and the learned-rules link only when there is something to show', async () => {
    stubFetch(null);
    const { rerender } = render(<LearnCard {...base} />);
    expect(screen.queryByText(/more to learn/)).toBeNull();
    rerender(<LearnCard {...base} queued={2} learnedCount={4} />);
    expect(screen.getByText('+2 more to learn')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Learned 4 rules' }));
    expect(base.onOpenGlossary).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
  });

  it('renders nothing for a rule id the rulebook does not have', () => {
    stubFetch(null);
    const { container } = render(<LearnCard {...base} item={{ seq: 1, ruleId: 'nope' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
