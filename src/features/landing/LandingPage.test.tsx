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

  it('hero sub line names the three things and the four languages', () => {
    renderPage();
    const sub = screen.getByText(/Catch up in 10 seconds, ask anything, and learn the rules as they happen/);
    expect(sub).toHaveTextContent('English, Hinglish, हिंदी or ગુજરાતી.');
  });

  it('has the Learn showcase right after How it works, with the real free-hit moment', () => {
    const { container } = renderPage();
    const headings = [...container.querySelectorAll('main h2')].map((h) => h.textContent);
    const how = headings.indexOf('How it works');
    expect(how).toBeGreaterThan(-1);
    expect(headings.indexOf('New to a sport? Turn on Learn.')).toBe(how + 1);
    const card = screen.getByRole('article', { name: /Learn card: Bowled on a free hit/ });
    expect(card).toHaveTextContent('LEARN · Bowled on a free hit');
    expect(card).toHaveTextContent('Kohli bowled on a free hit — NOT out');
    expect(screen.getByRole('button', { name: /Listen/ })).toBeInTheDocument();
  });

  it('sport chips show two example rules each and open that sport glossary', () => {
    renderPage();
    const football = screen.getByRole('button', { name: 'Open the Football rules glossary' });
    expect(football).toHaveTextContent('Offside');
    expect(football).toHaveTextContent('VAR');
    const kabaddi = screen.getByRole('button', { name: 'Open the Kabaddi rules glossary' });
    expect(kabaddi).toHaveTextContent('Raid');
    expect(kabaddi).toHaveTextContent('Super tackle');
    expect(screen.getByRole('button', { name: 'Open the Cricket rules glossary' })).toHaveTextContent('LBW');
    fireEvent.click(kabaddi);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('is honest about live: a note, no live button', () => {
    renderPage();
    expect(
      screen.getByText('Live feed: next — same event engine, replay and live use one adapter interface.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go live|watch live/i })).toBeNull();
    expect(screen.getByText('Replay demo')).toBeInTheDocument();
  });
});
