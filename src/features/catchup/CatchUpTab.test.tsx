import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fact, MatchTimeline } from '@shared/sports/types';
import { ToastProvider } from '@/components/Toast';
import { updateSettings } from '@/features/settings/settingsStore';
import { useStrings } from '@/i18n/useStrings';
import type { SportUi } from '@/sports/types';
import { CatchUpTab } from './CatchUpTab';
import { useCatchUp } from './useCatchUp';

const fact = (key: string, value: number, text: string): Fact => ({
  key,
  value,
  label: { en: text, hinglish: text, hi: text, gu: text },
});
const FACTS = [fact('runs', 12, '+12 runs'), fact('wkts', 1, '1 wkt')];

vi.mock('@/services/mockApi', () => ({
  mockRecap: vi.fn(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve({ lead: 'Lead line', body: 'Body line', facts: FACTS, source: 'ai', window: {} }),
          800,
        ),
      ),
  ),
}));

const timeline = { meta: { id: 'm' }, events: [{ clock: '1.1' }] } as unknown as MatchTimeline;
const sportUi = {
  gap: () => ({ count: 6, label: '6 balls' }),
  startClock: () => '0.0',
  facts: () => FACTS,
} as unknown as SportUi;

function Harness() {
  const { lang } = useStrings();
  const api = useCatchUp(timeline, null, sportUi, lang);
  return (
    <ToastProvider>
      <button type="button" onClick={() => api.request(0, 6)}>
        go
      </button>
      <CatchUpTab
        entries={api.entries}
        lang={lang}
        caughtUp={false}
        onRetry={api.retry}
        onSimulate={() => undefined}
        onAsk={() => undefined}
      />
    </ToastProvider>
  );
}

beforeEach(() => {
  updateSettings({ lang: 'en', autoRead: false });
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('CatchUpTab', () => {
  it('shows the empty state first', () => {
    render(<Harness />);
    expect(screen.getByText('Stepped away?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate stepping away' })).toBeInTheDocument();
  });

  it('shows a skeleton, then the recap card with computed facts', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('go'));
    expect(screen.getByRole('status', { name: 'Writing your recap' })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.getByText('Lead line')).toBeInTheDocument();
    expect(screen.getByText(/Since 0\.0 · 6 balls/)).toBeInTheDocument();
    expect(screen.getByText('+12 runs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verified stats/ })).toBeInTheDocument();
  });

  it('localises chrome and marks the recap text with its language', async () => {
    updateSettings({ lang: 'hi' });
    render(<Harness />);
    expect(screen.getByText('बाहर गए थे?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('go'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.getByText('Lead line')).toHaveAttribute('lang', 'hi');
    expect(screen.getByRole('button', { name: 'शेयर करें' })).toBeInTheDocument();
  });
});
