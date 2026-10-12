import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { BallView } from '@shared/sports/cricket/state';
import { BallChip } from './BallChip';

afterEach(cleanup);

const ball = (over: Partial<BallView>): BallView => ({
  seq: 1,
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
        <BallChip ball={ball({ label: 'W', tone: 'major', a11y: 'Over 18.2: wicket' })} />
        <BallChip ball={ball({ label: 'nb', tone: 'minor', a11y: 'Over 18.3: no ball' })} />
        <BallChip ball={ball({})} />
      </>,
    );
    expect(screen.getByText('W')).toBeVisible();
    expect(screen.getByText('nb')).toBeVisible();
    expect(screen.getByText('•')).toBeVisible();
    expect(screen.getByLabelText('Over 18.2: wicket')).toHaveTextContent('W');
  });

  it('marks a free hit with a text tag, not colour only', () => {
    render(
      <BallChip
        ball={ball({ label: '4', tone: 'good', freeHit: true, a11y: 'Over 18.4, free hit: four' })}
      />,
    );
    expect(screen.getByText('FH')).toBeInTheDocument();
    expect(screen.getByLabelText(/free hit/)).toBeInTheDocument();
  });

  it('has no free-hit tag by default', () => {
    render(<BallChip ball={ball({})} />);
    expect(screen.queryByText('FH')).toBeNull();
  });
});
