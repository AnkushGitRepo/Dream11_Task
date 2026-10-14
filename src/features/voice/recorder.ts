// Microphone capture with MediaRecorder: the one voice-input path that behaves the same in Chrome,
// Safari, Firefox and Brave. Everything is released on stop/cancel; nothing is stored.

export type RecorderErrorCode = 'denied' | 'unavailable';

export class RecorderError extends Error {
  readonly code: RecorderErrorCode;
  constructor(code: RecorderErrorCode) {
    super(`Recorder ${code}`);
    this.name = 'RecorderError';
    this.code = code;
  }
}

export interface Recording {
  /** Ends the capture and resolves with the audio. Releases the microphone. */
  stop(): Promise<{ readonly blob: Blob; readonly durationMs: number }>;
  /** Ends the capture and discards the audio. Releases the microphone. */
  cancel(): void;
}

/** Preference order: Chrome/Firefox/Edge -> webm, Safari -> mp4. */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

export function recorderSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

const releaseTracks = (stream: MediaStream): void => stream.getTracks().forEach((track) => track.stop());

export async function startRecording(): Promise<Recording> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    throw new RecorderError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
  }

  let recorder: MediaRecorder;
  try {
    const mimeType = pickMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch {
    releaseTracks(stream);
    throw new RecorderError('unavailable');
  }

  const chunks: Blob[] = [];
  const startedAt = Date.now();
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  try {
    recorder.start();
  } catch {
    releaseTracks(stream);
    throw new RecorderError('unavailable');
  }

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        const finish = () => {
          releaseTracks(stream);
          const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
          resolve({ blob: new Blob(chunks, { type }), durationMs: Date.now() - startedAt });
        };
        if (recorder.state === 'inactive') return finish();
        recorder.onstop = finish;
        recorder.onerror = () => {
          releaseTracks(stream);
          reject(new RecorderError('unavailable'));
        };
        try {
          recorder.stop();
        } catch {
          releaseTracks(stream);
          reject(new RecorderError('unavailable'));
        }
      }),
    cancel: () => {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        // already stopped
      }
      releaseTracks(stream);
    },
  };
}
