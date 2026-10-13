import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSpeech, peekSpeech, prefetchSpeech, revokeAll, SPEAK_TIMEOUT_MS } from './speakService';

const audio = (status = 200, type = 'audio/wav') =>
  new Response(status === 200 ? new Blob(['RIFF'], { type }) : JSON.stringify({ code: 'X', message: 'm' }), {
    status,
    headers: { 'Content-Type': status === 200 ? type : 'application/json' },
  });

let n = 0;
const src = () => ({ kind: 'recap' as const, id: `id-test-${(n += 1)}` });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  URL.createObjectURL = vi.fn(() => `blob:fake/${(n += 1)}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  revokeAll();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchSpeech', () => {
  it('posts exactly {kind,id} and caches the blob url', async () => {
    fetchMock.mockResolvedValue(audio());
    const s = src();
    const url = await fetchSpeech(s);
    expect(url).toMatch(/^blob:/);
    const [path, init] = fetchMock.mock.calls[0] ?? [];
    expect(path).toBe('/api/speak');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ kind: s.kind, id: s.id });
    expect(await fetchSpeech(s)).toBe(url);
    expect(peekSpeech(s)).toBe(url);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dedupes in-flight requests', async () => {
    fetchMock.mockResolvedValue(audio());
    const s = src();
    const [a, b] = await Promise.all([fetchSpeech(s), fetchSpeech(s)]);
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [404, 'NOT_FOUND'],
    [429, 'RATE_LIMITED'],
    [502, 'UNAVAILABLE'],
    [503, 'UNAVAILABLE'],
  ])('maps HTTP %i to %s', async (status, code) => {
    fetchMock.mockResolvedValue(audio(status));
    await expect(fetchSpeech(src())).rejects.toMatchObject({ code });
  });

  it('treats a non-audio 200 (SPA fallback) as unavailable', async () => {
    fetchMock.mockResolvedValue(audio(200, 'text/html'));
    await expect(fetchSpeech(src())).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('maps network failure to NETWORK', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    await expect(fetchSpeech(src())).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('does not ask again after NOT_FOUND', async () => {
    fetchMock.mockResolvedValue(audio(404));
    const s = src();
    await expect(fetchSpeech(s)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(fetchSpeech(s)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts the request after the client timeout', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const result = expect(fetchSpeech(src())).rejects.toMatchObject({ code: 'NETWORK' });
    await vi.advanceTimersByTimeAsync(SPEAK_TIMEOUT_MS + 1);
    await result;
  });

  it('prefetchSpeech swallows errors; revokeAll frees urls', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('x'));
    expect(() => prefetchSpeech(src())).not.toThrow();
    await Promise.resolve();
    fetchMock.mockResolvedValue(audio());
    const s = src();
    const url = await fetchSpeech(s);
    revokeAll();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
    expect(peekSpeech(s)).toBeUndefined();
  });
});
