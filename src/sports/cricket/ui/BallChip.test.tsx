import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';
import type { BallView } from '@shared/sports/cricket/state';
import { updateSettings } from '@/features/settings/settingsStore';
import { BallChip } from './BallChip';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

const ball = (over: Partial<BallView>): BallView => ({
  seq: 1,
  clock: '18.1',
  over: 18,
  label: '•',
  tone: 'none',
  freeHit: false,
  a11y: 'Over 18.1: dot ball',
  ...over,
});

describe('BallChip', () => {
  it('always shows the text label', () => {
    render(
      <>
        <BallChip ball={ball({ label: 'W', tone: 'major', clock: '18.2' })} />
        <BallChip ball={ball({ label: 'nb', tone: 'minor', clock: '18.3' })} />
        <BallChip ball={ball({})} />
      </>,
    );
    expect(screen.getByText('W')).toBeVisible();
    expect(screen.getByText('nb')).toBeVisible();
    expect(screen.getByText('•')).toBeVisible();
    expect(screen.getByLabelText('Over 18.2: wicket')).toHaveTextContent('W');
  });

  it('describes the ball in the selected language', () => {
    updateSettings({ lang: 'hi' });
    render(<BallChip ball={ball({ label: '6', tone: 'big', clock: '18.4', freeHit: true })} />);
    expect(screen.getByLabelText('ओवर 18.4, फ्री हिट: छक्का')).toHaveTextContent('6');
    expect(screen.getByText('फ्री')).toBeInTheDocument();
  });

  it('marks a free hit with a text tag, not colour only', () => {
    render(<BallChip ball={ball({ label: '4', tone: 'good', freeHit: true, clock: '18.4' })} />);
    expect(screen.getByText('FH')).toBeInTheDocument();
    expect(screen.getByLabelText(/free hit/)).toBeInTheDocument();
  });

  it('has no free-hit tag by default', () => {
    render(<BallChip ball={ball({})} />);
    expect(screen.queryByText('FH')).toBeNull();
  });
});
