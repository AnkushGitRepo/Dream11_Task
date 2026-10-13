import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { LandingPage } from './LandingPage';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'hinglish' }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('LandingPage', () => {
  it('has one h1 with the headline and CTAs pointing at the demo and matches', () => {
    renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Missed two overs?');
    expect(h1).toHaveTextContent('Kya hua? Just ask.');
    for (const link of screen.getAllByRole('link', { name: 'Open live demo →' })) {
      expect(link).toHaveAttribute('href', '/match/pak-ind-2022-t20wc-mcg');
    }
    expect(screen.getByRole('link', { name: 'Pick a match' })).toHaveAttribute('href', '/matches');
    expect(screen.getByRole('link', { name: 'Try the demo' })).toHaveAttribute(
      'href',
      '/match/pak-ind-2022-t20wc-mcg',
    );
  });

  it('forces the paper theme and keeps the phone demo out of the tab order', () => {
    const { container } = renderPage();
    expect(container.firstElementChild).toHaveAttribute('data-theme', 'paper');
    const phone = container.querySelector('[data-theme="dark"][aria-hidden="true"]');
    expect(phone).not.toBeNull();
    expect(phone).toHaveAttribute('inert');
  });

  it('only prints sourced figures', () => {
    renderPage();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('+42%')).toBeInTheDocument();
    expect(screen.queryByText(/(^|\s)2 balls/i)).toBeNull();
  });

  it('language toggle swaps the recap text and the lang attribute', () => {
    renderPage();
    const panel = screen.getByTestId('showcase-text');
    expect(panel).toHaveAttribute('lang', 'en');
    const enText = panel.textContent;
    fireEvent.click(screen.getByRole('tab', { name: 'हिं' }));
    expect(panel).toHaveAttribute('lang', 'hi');
    expect(panel.textContent).toMatch(/[\u0900-\u097F]/);
    expect(panel.textContent).toContain('गेंद');
    expect(panel.textContent).not.toBe(enText);
    fireEvent.click(screen.getByRole('tab', { name: 'ગુ' }));
    expect(panel).toHaveAttribute('lang', 'gu');
    fireEvent.click(screen.getByRole('tab', { name: 'Hing' }));
    expect(panel).toHaveAttribute('lang', 'en-IN');
    act(() => undefined);
  });

  it('has the Learn feature row with a mock card read from the rulebook', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'New to a sport? Turn on Learn.' })).toBeInTheDocument();
    const card = screen.getByRole('img', { name: /Example Learn card: Free hit/ });
    expect(card).toHaveTextContent('LEARN · Free hit');
    expect(card).toHaveTextContent('The ball after a no-ball');
    expect(card).toHaveTextContent('bowled on the free hit');
  });
});
