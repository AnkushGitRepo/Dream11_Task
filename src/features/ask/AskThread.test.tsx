import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { AskThread } from './AskThread';
import type { AskTurn } from './types';

const turn = (over: Partial<AskTurn>): AskTurn => ({
  id: 1,
  question: 'Score?',
  lang: 'en',
  status: 'pending',
  attempt: 0,
  ...over,
});

beforeEach(() => updateSettings({ lang: 'en' }));
afterEach(cleanup);

describe('AskThread', () => {
  it('shows the typing indicator while pending', () => {
    render(<AskThread turns={[turn({})]} onRetry={vi.fn()} />);
    expect(screen.getByText('Score?')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Thinking…' })).toBeInTheDocument();
  });

  it('shows a verified answer with its language', () => {
    const t = turn({ status: 'done', answer: 'Score 144/4', source: 'template', lang: 'hinglish' });
    render(<AskThread turns={[t]} onRetry={vi.fn()} />);
    expect(screen.getByText('Score 144/4')).toHaveAttribute('lang', 'en-IN');
    expect(screen.getByRole('button', { name: /Verified stats/ })).toBeInTheDocument();
  });

  it('shows an honest unknown answer without the verified badge', () => {
    const t = turn({ status: 'done', answer: "I don't have that yet", source: 'unknown' });
    render(<AskThread turns={[t]} onRetry={vi.fn()} />);
    expect(screen.getByText("I don't have that yet")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Verified stats/ })).toBeNull();
  });

  it('shows an inline error with retry', () => {
    const onRetry = vi.fn();
    render(<AskThread turns={[turn({ id: 7, status: 'error', failure: 'failed' })]} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't reach the AI.");
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledWith(7);
  });

  it('shows the rate-limited message', () => {
    render(<AskThread turns={[turn({ status: 'error', failure: 'rateLimited' })]} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Easy, captain — try again in a few seconds.');
  });
});
