import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import Matches from './Matches';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Matches />
    </MemoryRouter>,
  );
}

describe('Matches', () => {
  it('shows a loading state, then both featured cards', async () => {
    renderAt('/matches');
    expect(screen.getByRole('status', { name: 'Loading matches' })).toBeInTheDocument();
    const playable = await screen.findByRole('link', { name: /PAK v IND/ });
    expect(playable).toHaveAttribute('href', '/match/pak-ind-2022-t20wc-mcg');
    expect(screen.getByText('159/8')).toBeInTheDocument();
    expect(screen.getByText('176/7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Pick a match.' })).toBeInTheDocument();
  });

  it('renders Coming soon cards and rows as non-links', async () => {
    renderAt('/matches');
    await screen.findByRole('link', { name: /PAK v IND/ });
    expect(screen.queryByRole('link', { name: /IND v SA/ })).toBeNull();
    const soon = screen.getAllByRole('group', { name: /Coming soon/ });
    expect(soon).toHaveLength(2);
    soon.forEach((el) => expect(el).toHaveAttribute('aria-disabled', 'true'));
  });

  it('keeps Football and Kabaddi visible but disabled', async () => {
    renderAt('/matches');
    for (const name of [/Football/, /Kabaddi/]) {
      expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-disabled', 'true');
    }
    await screen.findByRole('link', { name: /PAK v IND/ });
  });

  it('shows an error state and retries', async () => {
    renderAt('/matches?matches=error');
    const retry = await screen.findByRole('button', { name: 'Try again' });
    fireEvent.click(retry);
    expect(screen.getByRole('status', { name: 'Loading matches' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load matches');
  });
});
