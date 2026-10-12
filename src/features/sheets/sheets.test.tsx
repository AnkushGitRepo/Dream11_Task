import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from '@/features/settings/settingsStore';
import { LanguageSheet, ScrubberSheet, SettingsSheet, VerifiedInfoSheet } from './index';

afterEach(cleanup);
beforeEach(() => updateSettings({ lang: 'en' }));

describe('LanguageSheet', () => {
  it('shows four radio rows, notes missing voices and applies the choice', () => {
    const onClose = vi.fn();
    render(<LanguageSheet open onClose={onClose} hasVoice={(l) => l !== 'gu'} />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(screen.getByRole('radio', { name: /^English/ })).toBeChecked();
    expect(screen.getAllByText('Voice not available on this device — text only.')).toHaveLength(1);
    fireEvent.click(screen.getByRole('radio', { name: /हिंदी/ }));
    expect(getSettings().lang).toBe('hi');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('SettingsSheet', () => {
  it('updates settings, replay speed and restarts the replay', () => {
    const setSpeed = vi.fn();
    const onRestart = vi.fn();
    const onClose = vi.fn();
    render(<SettingsSheet open onClose={onClose} replay={{ speed: 1, setSpeed }} onRestart={onRestart} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(getSettings().theme).toBe('light');
    fireEvent.click(screen.getByRole('switch', { name: /Auto-read recaps/ }));
    expect(getSettings().autoRead).toBe(true);
    const voice = screen.getByRole('radiogroup', { name: 'Voice speed' });
    fireEvent.click(voice.querySelectorAll('input')[2] as HTMLInputElement);
    expect(getSettings().voiceRate).toBe(1.2);
    const replay = screen.getByRole('radiogroup', { name: 'Replay speed' });
    fireEvent.click(replay.querySelectorAll('input')[2] as HTMLInputElement);
    expect(setSpeed).toHaveBeenCalledWith(20);
    fireEvent.click(screen.getByRole('button', { name: 'Restart replay' }));
    expect(onRestart).toHaveBeenCalled();
    expect(screen.getByText(/Cricsheet \(ODC-BY\)/)).toBeInTheDocument();
    expect(screen.getByText(/may send audio to Google/)).toBeInTheDocument();
    updateSettings({ theme: 'system', autoRead: false, voiceRate: 1 });
  });
});

describe('VerifiedInfoSheet', () => {
  it('renders the four steps as an ordered list', () => {
    render(<VerifiedInfoSheet open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Numbers by code. Words by AI.' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[2]).toHaveTextContent('AI writes the sentence');
  });

  it('localises into Hindi', () => {
    updateSettings({ lang: 'hi' });
    render(<VerifiedInfoSheet open onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'संख्याएँ कोड से। शब्द AI से।' })).toBeInTheDocument();
  });
});

describe('ScrubberSheet', () => {
  it('jumps to the chosen position using the clock label', () => {
    const onJump = vi.fn();
    render(
      <ScrubberSheet
        open
        onClose={() => {}}
        total={10}
        position={3}
        markers={[{ position: 5, tone: 'major' }]}
        labelAt={(p) => `0.${p}`}
        onJump={onJump}
      />,
    );
    const slider = screen.getByRole('slider', { name: 'Replay position' });
    expect(slider).toHaveAttribute('aria-valuetext', '0.3');
    fireEvent.change(slider, { target: { value: '7' } });
    expect(slider).toHaveAttribute('aria-valuetext', '0.7');
    fireEvent.click(screen.getByRole('button', { name: 'Jump' }));
    expect(onJump).toHaveBeenCalledWith(7);
  });
});
