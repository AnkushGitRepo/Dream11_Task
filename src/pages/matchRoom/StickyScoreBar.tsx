import type { SportScoreProps, SportUi } from '@/sports/types';
import styles from './StickyScoreBar.module.scss';

interface StickyScoreBarProps extends Omit<SportScoreProps, 'replay'> {
  readonly sportUi: SportUi;
  readonly visible: boolean;
}

/** Collapsed 56px score bar under the AppBar; hidden at >=900px where the hero never collapses. */
export function StickyScoreBar({ sportUi, visible, ...score }: StickyScoreBarProps) {
  const { ScoreBar } = sportUi;
  return (
    <div className={styles.anchor}>
      <div className={`${styles.bar} ${visible ? styles.visible : ''}`.trim()} aria-hidden={!visible}>
        <div className={styles.inner}>
          <ScoreBar {...score} />
        </div>
      </div>
    </div>
  );
}
