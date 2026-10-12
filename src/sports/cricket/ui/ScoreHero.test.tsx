import { cleanup, render, screen, within } from '@testing-library/react';
import { updateSettings } from '@/features/settings/settingsStore';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
import { MOCK_BASELINE, mockTimeline } from '@/mocks/match.mock';
import { ScoreBar } from './ScoreBar';
import { ScoreHero } from './ScoreHero';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

const props = { timeline: mockTimeline, position: 13, baseline: MOCK_BASELINE };

describe('ScoreHero at 19.0 (position 13)', () => {
  it('shows the golden checkpoint numbers from the engine', () => {
    render(<ScoreHero {...props} />);
    expect(screen.getByText('144/4')).toBeInTheDocument();
    expect(screen.getByText('Need 16 off 6')).toBeInTheDocument();
    expect(screen.getByText('19.0 ov')).toBeInTheDocument();
    expect(screen.getByText('Kohli').closest('li')).toHaveTextContent('Kohli 74 (50)');
    expect(screen.getByText('Pandya').closest('li')).toHaveTextContent('Pandya 40 (36)');
    expect(screen.getByText('Nawaz').closest('li')).toHaveTextContent('Bowler · Nawaz 3-0-29-0');
  });

  it('marks the striker without an asterisk and exposes a polite live region', () => {
    const { container } = render(<ScoreHero {...props} />);
    expect(screen.getAllByRole('img', { name: 'On strike' })).toHaveLength(1);
    expect(container.textContent).not.toContain('*');
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('renders nothing for a foreign baseline', () => {
    const { container } = render(<ScoreHero {...props} baseline={{ nope: true }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the same data in the collapsed bar', () => {
    render(<ScoreBar {...props} />);
    expect(screen.getByText('144/4')).toBeInTheDocument();
    expect(screen.getByText(/Need 16 off 6/)).toBeInTheDocument();
    const text = within(screen.getByText('IND').parentElement as HTMLElement);
    expect(text.getByText('IND')).toBeInTheDocument();
  });
});
