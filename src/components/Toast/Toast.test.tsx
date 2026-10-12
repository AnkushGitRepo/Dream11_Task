import { cleanup, act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Trigger() {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast.show('Copied')}>
      go
    </button>
  );
}

afterEach(cleanup);

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows in a status region and auto-dismisses after 3s', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    act(() => {
      vi.advanceTimersByTime(2900);
    });
    expect(screen.getByText('Copied')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Copied')).toBeNull();
  });

  it('clears pending timers on unmount', () => {
    const { unmount } = render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('go'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
