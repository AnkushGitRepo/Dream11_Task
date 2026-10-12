import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STRINGS } from '@shared/i18n/strings';
import { mockTimeline } from '@/mocks/match.mock';
import { MomentsTab } from './MomentsTab';
import type { MomentFilter } from './types';

afterEach(cleanup);

const filters: MomentFilter[] = [
  { id: 'all', label: 'All', tones: ['major', 'big', 'good', 'minor', 'none'] },
  { id: 'key', label: 'Wickets', tones: ['major'] },
  { id: 'bnd', label: 'Boundaries', tones: ['big', 'good'] },
];
const n = mockTimeline.events.length;

function renderTab(position: number, onRecapFrom = vi.fn()) {
  render(
    <MomentsTab timeline={mockTimeline} position={position} filters={filters} onRecapFrom={onRecapFrom} />,
  );
  return onRecapFrom;
}

// Default language is Hinglish.
describe('MomentsTab', () => {
  it('shows the empty state before anything is played', () => {
    renderTab(0);
    expect(screen.getByText(STRINGS.hinglish.momentsEmpty)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists only played events, newest first', () => {
    renderTab(5);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    const expected = mockTimeline.events
      .slice(0, 5)
      .map((e) => e.clock)
      .reverse();
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual(expected);
  });

  it('filters by tone through the chips', () => {
    renderTab(n);
    fireEvent.click(screen.getByRole('button', { name: 'Wickets' }));
    const majors = mockTimeline.events.filter((e) => e.tone === 'major').length;
    expect(screen.getByRole('button', { name: 'Wickets' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(majors);
    fireEvent.click(screen.getByRole('button', { name: 'Boundaries' }));
    const bound = mockTimeline.events.filter((e) => e.tone === 'big' || e.tone === 'good').length;
    expect(screen.getAllByRole('listitem')).toHaveLength(bound);
  });

  it('calls onRecapFrom with the event seq', () => {
    const onRecap = renderTab(3);
    const first = screen.getAllByRole('listitem')[0];
    if (!first) throw new Error('no rows');
    fireEvent.click(within(first).getByRole('button'));
    expect(onRecap).toHaveBeenCalledWith(2);
  });
});
