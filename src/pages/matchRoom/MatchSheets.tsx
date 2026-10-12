import type { Lang } from '@shared/sports/types';
import type { ReplaySnapshot, ReplayStore } from '@/features/replay';
import { LanguageSheet, ScrubberSheet, SettingsSheet, VerifiedInfoSheet } from '@/features/sheets';
import type { ScrubberMarker } from '@/features/sheets';
import { useHasVoice } from '@/features/voice';

export type SheetId = 'language' | 'settings' | 'verified' | 'scrubber' | null;

interface MatchSheetsProps {
  readonly open: SheetId;
  readonly onClose: () => void;
  readonly store: ReplayStore;
  readonly snapshot: ReplaySnapshot;
  readonly markers: readonly ScrubberMarker[];
  readonly labelAt: (position: number) => string;
  readonly onRestart: () => void;
}

/** Every Match Room sheet; only the one named by `open` is shown. */
export function MatchSheets({
  open,
  onClose,
  store,
  snapshot,
  markers,
  labelAt,
  onRestart,
}: MatchSheetsProps) {
  const voices: Record<Lang, boolean> = {
    en: useHasVoice('en'),
    hinglish: useHasVoice('hinglish'),
    hi: useHasVoice('hi'),
    gu: useHasVoice('gu'),
  };
  return (
    <>
      <LanguageSheet open={open === 'language'} onClose={onClose} hasVoice={(lang) => voices[lang]} />
      <SettingsSheet
        open={open === 'settings'}
        onClose={onClose}
        replay={{ speed: snapshot.speed, setSpeed: store.setSpeed }}
        onRestart={onRestart}
      />
      <VerifiedInfoSheet open={open === 'verified'} onClose={onClose} />
      <ScrubberSheet
        open={open === 'scrubber'}
        onClose={onClose}
        total={snapshot.total}
        position={snapshot.position}
        markers={markers}
        labelAt={labelAt}
        onJump={store.seekTo}
      />
    </>
  );
}
