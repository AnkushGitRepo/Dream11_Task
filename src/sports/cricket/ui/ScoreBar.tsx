import { useStrings } from '@/i18n/useStrings';
import { LiveDot } from '@/components/LiveDot';
import type { SportScoreProps } from '../../types';
import { isCricketBaseline, scoreText, statusLine, useCricketState } from './baseline';
import type { CricketBaseline } from '@shared/sports/cricket/state';
import { useCricketText } from './useLabels';
import styles from './ScoreBar.module.scss';

function BarInner({
  timeline,
  position,
  baseline,
}: Omit<SportScoreProps, 'baseline'> & { readonly baseline: CricketBaseline }) {
  const s = useCricketState(timeline, position, baseline);
  const { text } = useCricketText();
  const { t } = useStrings();
  return (
    <div className={styles.bar}>
      <p className={styles.text}>
        <span className={styles.team}>{s.battingTeam}</span>{' '}
        <span className={styles.score}>{scoreText(s)}</span>
        <span className={styles.meta}>
          {' · '}
          {s.overs}
          {' · '}
          {statusLine(s, text)}
        </span>
      </p>
      <LiveDot label={t.replayLabel} />
    </div>
  );
}

/** 56px content of the collapsed sticky bar; the parent positions it. */
export function ScoreBar({ baseline, ...rest }: SportScoreProps) {
  if (!isCricketBaseline(baseline)) return null;
  return <BarInner {...rest} baseline={baseline} />;
}
