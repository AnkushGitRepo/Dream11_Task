import { useCricketText } from './useLabels';
import styles from './PlayerLine.module.scss';

export interface PlayerLineProps {
  readonly name: string;
  /** Pre-formatted stat, e.g. "74 (50)" or "3-0-29-0". */
  readonly stat: string;
  readonly onStrike?: boolean;
  /** Small role prefix, e.g. "Bowler". */
  readonly role?: string;
}

export function PlayerLine({ name, stat, onStrike = false, role }: PlayerLineProps) {
  const { text } = useCricketText();
  return (
    <li className={styles.line}>
      {role ? (
        <span className={styles.role}>
          {role} <span aria-hidden="true">·</span>
        </span>
      ) : null}{' '}
      <span className={styles.name}>{name}</span> <span className={styles.stat}>{stat}</span>
      {onStrike ? <span className={styles.dot} role="img" aria-label={text('onStrike')} /> : null}
    </li>
  );
}
