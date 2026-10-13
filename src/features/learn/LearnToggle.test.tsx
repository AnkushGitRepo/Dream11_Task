import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastContext } from '@/components/Toast/ToastContext';
import { updateSettings } from '@/features/settings/settingsStore';
import { LearnToggle } from './LearnToggle';
import { getLearnState, resetLearnState } from './learnStore';

const show = vi.fn();
const renderToggle = () =>
  render(
    <ToastContext.Provider value={{ show }}>
      <LearnToggle />
    </ToastContext.Provider>,
  );

beforeEach(() => {
  updateSettings({ lang: 'en' });
  resetLearnState();
  show.mockClear();
});
afterEach(cleanup);

describe('LearnToggle', () => {
  it('is an off-by-default toggle button that flips the store', () => {
    renderToggle();
    const btn = screen.getByRole('button', { name: 'Learn mode' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(getLearnState().on).toBe(true);
    fireEvent.click(btn);
    expect(getLearnState().on).toBe(false);
  });

  it('explains Learn mode with a toast only the first time it is switched on', () => {
    renderToggle();
    const btn = screen.getByRole('button', { name: 'Learn mode' });
    fireEvent.click(btn); // on
    fireEvent.click(btn); // off
    fireEvent.click(btn); // on again
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith("Learn mode on — I'll explain rules as they happen.");
  });

  it('speaks the fan language', () => {
    updateSettings({ lang: 'hi' });
    renderToggle();
    expect(screen.getByRole('button', { name: 'लर्न मोड' })).toHaveTextContent('सीखें');
  });
});
