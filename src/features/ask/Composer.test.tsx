import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSettings } from '@/features/settings/settingsStore';
import { Composer } from './Composer';

beforeEach(() => updateSettings({ lang: 'en' }));
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'SpeechRecognition');
});

const input = () => screen.getByPlaceholderText('Ask anything…') as HTMLInputElement;

describe('Composer', () => {
  it('disables send until there is text, then sends on button and on Enter', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    const send = screen.getByRole('button', { name: 'Send question' });
    expect(send).toBeDisabled();
    fireEvent.change(input(), { target: { value: '  score?  ' } });
    expect(send).toBeEnabled();
    fireEvent.submit(input().closest('form') as HTMLFormElement); // what Enter triggers
    expect(onSend).toHaveBeenCalledWith('score?');
    expect(input().value).toBe('');
  });

  it('caps at 200 chars and shows the counter from 160', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(input()).toHaveAttribute('maxlength', '200');
    expect(screen.queryByText(/\/200/)).toBeNull();
    fireEvent.change(input(), { target: { value: 'a'.repeat(159) } });
    expect(screen.queryByText(/\/200/)).toBeNull();
    fireEvent.change(input(), { target: { value: 'a'.repeat(160) } });
    expect(screen.getByText('160/200')).toBeInTheDocument();
    fireEvent.change(input(), { target: { value: 'a'.repeat(250) } });
    expect(input().value).toHaveLength(200);
    expect(screen.getByText('Character limit reached')).toBeInTheDocument();
  });

  it('renders the mic only when speech recognition exists', () => {
    const first = render(<Composer onSend={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Ask by voice' })).toBeNull();
    first.unmount();
    Object.defineProperty(window, 'SpeechRecognition', { value: class {}, configurable: true });
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Ask by voice' })).toBeInTheDocument();
  });

  it('uses the localised placeholder', () => {
    updateSettings({ lang: 'hinglish' });
    render(<Composer onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Kuch bhi poochho…')).toBeInTheDocument();
  });
});
