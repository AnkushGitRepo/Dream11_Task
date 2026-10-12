import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { updateSettings } from '@/features/settings/settingsStore';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { AwayBanner } from './AwayBanner';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

describe('AwayBanner', () => {
  it('announces what was missed and wires both actions', () => {
    const onCatchUp = vi.fn();
    const onDismiss = vi.fn();
    render(<AwayBanner label="12 balls · 2 overs" onCatchUp={onCatchUp} onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toHaveTextContent('You missed 12 balls · 2 overs');
    fireEvent.click(screen.getByRole('button', { name: 'Catch me up' }));
    expect(onCatchUp).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
