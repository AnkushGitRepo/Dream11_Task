import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SportTabs } from './SportTabs';

afterEach(cleanup);

const tabs = [
  { id: 'cricket', label: 'Cricket' },
  { id: 'football', label: 'Football', disabled: true },
];

describe('SportTabs', () => {
  it('marks disabled tabs with aria-disabled and a text chip', () => {
    render(<SportTabs tabs={tabs} value="cricket" onChange={() => {}} ariaLabel="Sport" soonLabel="SOON" />);
    const football = screen.getByRole('tab', { name: /Football/ });
    expect(football).toHaveAttribute('aria-disabled', 'true');
    expect(football).toHaveTextContent('SOON');
    expect(screen.getByRole('tab', { name: 'Cricket' })).toHaveAttribute('aria-selected', 'true');
  });

  it('does not select a disabled tab', () => {
    const onChange = vi.fn();
    render(<SportTabs tabs={tabs} value="cricket" onChange={onChange} ariaLabel="Sport" soonLabel="SOON" />);
    fireEvent.click(screen.getByRole('tab', { name: /Football/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
