import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
] as const;

function Harness() {
  const [v, setV] = useState<'a' | 'b' | 'c'>('a');
  return <SegmentedControl options={OPTIONS} value={v} onChange={setV} />;
}

afterEach(cleanup);

describe('SegmentedControl', () => {
  it('uses roving tabindex and arrow/Home/End navigation', () => {
    render(<Harness />);
    const [a, b, c] = screen.getAllByRole('tab') as HTMLElement[];
    expect(a).toHaveAttribute('tabindex', '0');
    expect(b).toHaveAttribute('tabindex', '-1');

    a?.focus();
    fireEvent.keyDown(a as HTMLElement, { key: 'ArrowRight' });
    expect(b).toHaveAttribute('aria-selected', 'true');
    expect(b).toHaveFocus();

    fireEvent.keyDown(b as HTMLElement, { key: 'End' });
    expect(c).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(c as HTMLElement, { key: 'ArrowRight' });
    expect(a).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(a as HTMLElement, { key: 'ArrowLeft' });
    expect(c).toHaveFocus();
    fireEvent.keyDown(c as HTMLElement, { key: 'Home' });
    expect(a).toHaveFocus();
  });
});
