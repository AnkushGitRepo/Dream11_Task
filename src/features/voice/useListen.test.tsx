import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_LISTEN_MS, NO_RESULT_MS } from './listenEngines';
import { useListen } from './useListen';

// ---- fakes -----------------------------------------------------------------------------------

class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    FakeRecognition.last = this;
  }
  say(text: string) {
    this.onresult?.({
      resultIndex: 0,
      results: { length: 1, 0: { isFinal: false, length: 1, 0: { transcript: text } } },
    });
  }
}

const trackStop = vi.fn();
let recorders: FakeMediaRecorder[] = [];

class FakeMediaRecorder {
  static isTypeSupported = (t: string) => t === 'audio/webm;codecs=opus';
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    recorders.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([new Uint8Array(2000)], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const getUserMedia = vi.fn();
const fetchMock = vi.fn<typeof fetch>();
const transcript = (text: string, status = 200) =>
  new Response(JSON.stringify(status === 200 ? { text, source: 'ai' } : { code: 'X' }), { status });

const flush = () => act(async () => void (await vi.advanceTimersByTimeAsync(0)));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv('VITE_USE_MOCK_API', 'false');
  recorders = [];
  trackStop.mockReset();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(transcript('what is the score'));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
  FakeRecognition.last = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'SpeechRecognition');
  Reflect.deleteProperty(navigator, 'brave');
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

const withRecognition = () =>
  Object.defineProperty(window, 'SpeechRecognition', { value: FakeRecognition, configurable: true });

// ---- SpeechRecognition fast path --------------------------------------------------------------

describe('useListen: SpeechRecognition fast path', () => {
  it('stop() turns listening off immediately, calls stop AND abort, and delivers the text once', () => {
    withRecognition();
    const onFinal = vi.fn();
    const { result } = renderHook(() => useListen('en', onFinal));
    act(() => result.current.start());
    expect(result.current.listening).toBe(true);
    act(() => FakeRecognition.last?.say('who is batting'));
    expect(result.current.transcript).toBe('who is batting');

    act(() => result.current.stop());
    expect(result.current.listening).toBe(false);
    expect(FakeRecognition.last?.stop).toHaveBeenCalled();
    expect(FakeRecognition.last?.abort).toHaveBeenCalled();
    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledWith('who is batting');
    expect(result.current.error).toBeNull();
  });

  it('stop() with nothing heard reports no-speech instead of sticking', () => {
    withRecognition();
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.listening).toBe(false);
    expect(result.current.error).toBe('no-speech');
  });

  it('ends itself after the max duration', () => {
    withRecognition();
    const onFinal = vi.fn();
    const { result } = renderHook(() => useListen('en', onFinal));
    act(() => result.current.start());
    act(() => FakeRecognition.last?.say('how many runs'));
    act(() => void vi.advanceTimersByTime(MAX_LISTEN_MS));
    expect(result.current.listening).toBe(false);
    expect(onFinal).toHaveBeenCalledWith('how many runs');
  });

  it('a permission error is reported as denied and never falls back', () => {
    withRecognition();
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    act(() => FakeRecognition.last?.onerror?.({ error: 'not-allowed' }));
    expect(result.current.error).toBe('denied');
    expect(result.current.listening).toBe(false);
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('falls back to recording when no result arrives within the watchdog window', async () => {
    withRecognition();
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    act(() => void vi.advanceTimersByTime(NO_RESULT_MS));
    await flush();
    expect(FakeRecognition.last?.abort).toHaveBeenCalled();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.listening).toBe(true);
  });

  it('falls back to recording when recognition fails with a network error', async () => {
    withRecognition();
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    act(() => FakeRecognition.last?.onerror?.({ error: 'network' }));
    await flush();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(result.current.listening).toBe(true);
  });
});

// ---- recorder + /api/transcribe path ----------------------------------------------------------

describe('useListen: recorder + server transcription', () => {
  it('skips SpeechRecognition in Brave and transcribes the recording', async () => {
    withRecognition();
    Object.defineProperty(navigator, 'brave', { value: { isBrave: async () => true }, configurable: true });
    const onFinal = vi.fn();
    const { result } = renderHook(() => useListen('hinglish', onFinal));
    expect(result.current.supported).toBe(true);
    act(() => result.current.start());
    await flush();
    expect(FakeRecognition.last).toBeNull();
    expect(result.current.listening).toBe(true);

    act(() => void vi.advanceTimersByTime(1500));
    act(() => result.current.stop());
    expect(result.current.listening).toBe(false);
    expect(result.current.transcribing).toBe(true);
    await flush();

    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe('/api/transcribe');
    const sent = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(sent).toMatchObject({ lang: 'hinglish', mimeType: 'audio/webm;codecs=opus' });
    expect(typeof sent.audio).toBe('string');
    expect(onFinal).toHaveBeenCalledWith('what is the score');
    expect(result.current.transcribing).toBe(false);
    expect(trackStop).toHaveBeenCalled();
  });

  it('auto-stops and sends after the max duration', async () => {
    const onFinal = vi.fn();
    const { result } = renderHook(() => useListen('en', onFinal));
    act(() => result.current.start());
    await flush();
    act(() => void vi.advanceTimersByTime(MAX_LISTEN_MS));
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(result.current.listening).toBe(false);
    expect(result.current.transcribing).toBe(false);
  });

  it('shows an error, never a stuck state, when the server fails or rate-limits', async () => {
    const { result } = renderHook(() => useListen('en'));
    for (const [status, expected] of [
      [502, 'unavailable'],
      [429, 'rate-limited'],
    ] as const) {
      fetchMock.mockResolvedValueOnce(transcript('', status));
      act(() => result.current.start());
      await flush();
      act(() => void vi.advanceTimersByTime(1000));
      act(() => result.current.stop());
      await flush();
      expect(result.current.error).toBe(expected);
      expect(result.current.listening).toBe(false);
      expect(result.current.transcribing).toBe(false);
    }
  });

  it('empty transcript becomes no-speech; a mis-tap sends nothing', async () => {
    const { result } = renderHook(() => useListen('en'));
    fetchMock.mockResolvedValueOnce(transcript(''));
    act(() => result.current.start());
    await flush();
    act(() => void vi.advanceTimersByTime(1000));
    act(() => result.current.stop());
    await flush();
    expect(result.current.error).toBe('no-speech');

    fetchMock.mockClear();
    act(() => result.current.start());
    await flush();
    act(() => result.current.stop()); // 0 ms of audio
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.error).toBe('no-speech');
  });

  it('reports denied when the microphone permission is refused', async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException('no', 'NotAllowedError'));
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    await flush();
    expect(result.current.error).toBe('denied');
    expect(result.current.listening).toBe(false);
  });

  it('tapping stop while the permission prompt is open cancels cleanly', async () => {
    let grant: (stream: unknown) => void = () => undefined;
    getUserMedia.mockReturnValueOnce(new Promise((resolve) => (grant = resolve)));
    const { result } = renderHook(() => useListen('en'));
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.listening).toBe(false);
    expect(result.current.error).toBeNull();
    grant({ getTracks: () => [{ stop: trackStop }] });
    await flush();
    expect(trackStop).toHaveBeenCalled(); // the late stream is released, not left open
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => result.current.start()); // and the hook is usable again
    expect(result.current.listening).toBe(true);
  });

  it('releases the microphone and ignores late results on unmount', async () => {
    const onFinal = vi.fn();
    const { result, unmount } = renderHook(() => useListen('en', onFinal));
    act(() => result.current.start());
    await flush();
    unmount();
    expect(trackStop).toHaveBeenCalled();
    await flush();
    expect(onFinal).not.toHaveBeenCalled();
  });

  it('is unsupported when neither path exists', () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
    vi.stubGlobal('MediaRecorder', undefined);
    const { result } = renderHook(() => useListen('en'));
    expect(result.current.supported).toBe(false);
  });
});
