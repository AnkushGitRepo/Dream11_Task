import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRulebook } from '@shared/sports/rules';
import { updateSettings } from '@/features/settings/settingsStore';
import { GlossarySheet } from './GlossarySheet';
import { markLearned, resetLearnState } from './learnStore';

beforeEach(() => {
  updateSettings({ lang: 'en' });
  resetLearnState();
});
afterEach(cleanup);

describe('GlossarySheet', () => {
  it('lists every rule of the sport, none learned at first', () => {
    render(<GlossarySheet open onClose={vi.fn()} sport="football" />);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(getRulebook('football').length);
    expect(within(dialog).getByText('Not learned yet')).toBeInTheDocument();
    expect(within(dialog).queryByText('Learned')).toBeNull();
  });

  it('works for a sport with no match data (kabaddi)', () => {
    render(<GlossarySheet open onClose={vi.fn()} sport="kabaddi" />);
    expect(screen.getByText('Super tackle')).toBeInTheDocument();
    expect(screen.getByText('Do-or-die raid')).toBeInTheDocument();
  });

  it('puts learned rules first under their own heading', () => {
    markLearned('cricket', 'free-hit');
    render(<GlossarySheet open onClose={vi.fn()} sport="cricket" />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Learned', 'Not learned yet']);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Free hit');
  });

  it('expands one rule at a time to show its detail', () => {
    render(<GlossarySheet open onClose={vi.fn()} sport="cricket" />);
    expect(screen.queryByText(/Only a run out, hitting the ball twice/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show details for Free hit' }));
    expect(screen.getByText(/Only a run out, hitting the ball twice/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show details for Wide' }));
    expect(screen.queryByText(/Only a run out, hitting the ball twice/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Hide details for Wide' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('shows the rule text in the chosen language', () => {
    updateSettings({ lang: 'hi' });
    render(<GlossarySheet open onClose={vi.fn()} sport="kabaddi" />);
    expect(screen.getByText('सुपर टैकल')).toBeInTheDocument();
  });
});
