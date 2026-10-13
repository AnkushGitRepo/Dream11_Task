import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { LearnSports } from './LearnSports';

beforeEach(() => updateSettings({ lang: 'en' }));
afterEach(cleanup);

describe('LearnSports', () => {
  it('shows Football and Kabaddi as coming soon, each with a Learn the rules action', () => {
    render(<LearnSports />);
    expect(screen.getByRole('heading', { name: 'More sports, coming soon' })).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Learn the rules of Football' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn the rules of Kabaddi' })).toBeInTheDocument();
  });

  it('opens the glossary for the chosen sport, with no match data needed', () => {
    render(<LearnSports />);
    fireEvent.click(screen.getByRole('button', { name: 'Learn the rules of Football' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Offside')).toBeInTheDocument();
    expect(within(dialog).queryByText('Raid')).toBeNull();
  });
});
