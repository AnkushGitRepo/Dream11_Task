import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import NotFound from './NotFound';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

describe('NotFound', () => {
  it('shows OUT! and links back to /matches', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'OUT!' })).toBeInTheDocument();
    expect(screen.getByText('This page was caught at slip.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to matches' })).toHaveAttribute('href', '/matches');
  });
});
