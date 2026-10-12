import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fact } from '@shared/sports/types';
import { updateSettings } from '@/features/settings/settingsStore';
import { AskTab } from './AskTab';

const FACTS: Fact[] = [
  { key: 'need', value: 16, label: { en: 'Need 16 off 6 balls', hinglish: '', hi: '', gu: '' } },
];
const ctx = () => ({ seq: 13, facts: FACTS });

beforeEach(() => {
  updateSettings({ lang: 'en' });
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

describe('AskTab', () => {
  it('shows suggestions; tapping one asks and renders a computed answer', async () => {
    render(<AskTab matchId="m" getContext={ctx} />);
    expect(screen.getByText('Ask the match.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'How many runs are needed?' }));
    expect(screen.getByRole('status', { name: 'Thinking…' })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByText('Need 16 off 6 balls')).toBeInTheDocument();
  });

  it('recovers from an error via Retry', async () => {
    window.history.replaceState(null, '', '/?ask=error');
    render(<AskTab matchId="m" getContext={ctx} />);
    fireEvent.click(screen.getByRole('button', { name: 'How many runs are needed?' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't reach the AI.");
    window.history.replaceState(null, '', '/');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByText('Need 16 off 6 balls')).toBeInTheDocument();
  });
});
