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

  it('answers "what is X" from the rulebook, in the chosen language', async () => {
    render(<AskTab matchId="m" getContext={ctx} sport="cricket" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'what is a free hit?' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.getByText(/The ball after a no-ball/)).toBeInTheDocument();
    expect(screen.getByText(/Free hit:/)).toBeInTheDocument();
  });

  it('leaves match questions alone', async () => {
    render(<AskTab matchId="m" getContext={ctx} sport="cricket" />);
    fireEvent.click(screen.getByRole('button', { name: 'How many runs are needed?' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(screen.queryByText(/The ball after a no-ball/)).toBeNull();
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
