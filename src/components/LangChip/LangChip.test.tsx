import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { LangChip } from './LangChip';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

describe('LangChip', () => {
  it('shows the language in its own script and opens the sheet', () => {
    const onClick = vi.fn();
    render(<LangChip onClick={onClick} />);
    const chip = screen.getByRole('button', { name: 'Language: English. Tap to change' });
    expect(chip).toHaveTextContent('EN');
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['hinglish', 'Hing'],
    ['hi', 'हिं'],
    ['gu', 'ગુ'],
  ] as const)('%s => %s', (lang, short) => {
    updateSettings({ lang });
    render(<LangChip onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveTextContent(short);
  });
});
