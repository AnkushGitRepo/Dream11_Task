import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

afterEach(cleanup);

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet open={false} onClose={() => {}} title="Language">
        x
      </BottomSheet>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled modal dialog that closes on Esc and scrim', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title="Language">
        <button type="button">Hindi</button>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Language' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('moves focus in and restores it to the opener', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <BottomSheet open={open} onClose={() => setOpen(false)} title="T">
            <button type="button">Inside</button>
          </BottomSheet>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByText('Open');
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByText('Inside')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
