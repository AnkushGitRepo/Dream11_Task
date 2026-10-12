import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('renders label and forwards native props', () => {
    render(<Button data-testid="b">Catch me up</Button>);
    expect(screen.getByRole('button', { name: 'Catch me up' })).toBeEnabled();
    expect(screen.getByTestId('b')).toHaveAttribute('type', 'button');
  });

  it('is disabled and busy while loading, keeping the label for width', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent('Save');
  });
});
