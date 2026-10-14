import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/Toast';
import { updateSettings } from '@/features/settings/settingsStore';
import { SpeakButton } from './SpeakButton';
import { revokeAll } from './speakService';

class FakeAudio extends EventTarget {
  static last: FakeAudio | null = null;
  src = '';
  currentTime = 0;
  playbackRate = 1;
  preservesPitch = false;
  playing = false;
  constructor() {
    super();
    FakeAudio.last = this;
  }
  play(): Promise<void> {
    this.playing = true;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  }
  pause(): void {
    this.playing = false;
    this.dispatchEvent(new Event('pause'));
  }
}

const fetchMock = vi.fn<typeof fetch>();
const speakMock = vi.fn();
const cancelMock = vi.fn();
let voices: { lang: string; name: string }[] = [];

class FakeUtterance {
  voice: unknown = null;
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

let seq = 0;
const ok = () =>
  new Response(new Blob(['RIFF'], { type: 'audio/wav' }), { headers: { 'Content-Type': 'audio/wav' } });
const notFound = () => new Response('{"code":"NOT_FOUND","message":"x"}', { status: 404 });
const source = () => {
  seq += 1;
  return { kind: 'recap' as const, id: `rec-button-${seq}`, token: `tok${seq}.sig${seq}` };
};

function ui(props: Partial<React.ComponentProps<typeof SpeakButton>> = {}) {
  return (
    <ToastProvider>
      <SpeakButton text="Spoken text" lang="en" source={source()} {...props} />
    </ToastProvider>
  );
}

beforeEach(() => {
  FakeAudio.last = null;
  voices = [];
  fetchMock.mockReset();
  speakMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
      speak: speakMock,
      cancel: cancelMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
  URL.createObjectURL = vi.fn(() => `blob:fake/${(seq += 1)}`);
  URL.revokeObjectURL = vi.fn();
  updateSettings({ lang: 'en', voiceRate: 1, autoRead: false });
});
afterEach(() => {
  cleanup();
  revokeAll();
  vi.unstubAllGlobals();
});

describe('SpeakButton natural voice', () => {
  it('prefetches on mount, plays the blob, follows voiceRate and resets on end', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(ok()));
    render(ui());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, string>;
    expect(Object.keys(body).sort()).toEqual(['token']);

    updateSettings({ voiceRate: 1.2 });
    fireEvent.click(screen.getByRole('button', { name: /listen/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument());
    const audio = FakeAudio.last as FakeAudio;
    expect(audio.src).toMatch(/^blob:/);
    expect(audio.playbackRate).toBe(1.2);
    expect(audio.preservesPitch).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => updateSettings({ voiceRate: 0.8 }));
    expect(audio.playbackRate).toBe(0.8);

    act(() => {
      audio.dispatchEvent(new Event('ended'));
    });
    expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument();
  });

  it('falls back to the browser voice and labels it when the server fails', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(notFound()));
    voices = [{ lang: 'en-IN', name: 'Veena' }];
    render(ui());
    await waitFor(() => expect(screen.getByText('Basic voice')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /listen/i }));
    await waitFor(() => expect(speakMock).toHaveBeenCalledTimes(1));
    expect((speakMock.mock.calls[0]?.[0] as FakeUtterance).text).toBe('Spoken text');
    expect(FakeAudio.last).toBeNull();
  });

  it('toasts and hides when the server fails and no browser voice exists', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 503 })));
    render(ui());
    fireEvent.click(screen.getByRole('button', { name: /listen/i }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Voice unavailable'));
    expect(screen.queryByRole('button', { name: /listen/i })).toBeNull();
    expect(speakMock).not.toHaveBeenCalled();
  });

  it('never shows a wrong-language voice', () => {
    voices = [{ lang: 'en-US', name: 'Alex' }];
    render(<SpeakButton text="x" lang="gu" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
