import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Lang } from '@shared/sports/types';
import { RecapCard } from './RecapCard';
import type { RecapEntry } from './types';
import styles from './RecapHistory.module.scss';

export interface RecapHistoryProps {
  /** Older recaps, newest first. */
  readonly entries: readonly RecapEntry[];
  readonly lang: Lang;
  readonly onAsk: () => void;
}

export function RecapHistory({ entries, lang, onAsk }: RecapHistoryProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="recap-history">
      <h2 id="recap-history" className={styles.heading}>
        Earlier
      </h2>
      <ul className={styles.list}>
        {entries.map((entry) => {
          const open = openId === entry.id;
          const panelId = `recap-${entry.id}`;
          return (
            <li key={entry.id} className={styles.item}>
              <button
                type="button"
                className={styles.row}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : entry.id)}
              >
                <span>
                  Since {entry.clock} · {entry.label}
                </span>
                <ChevronDown
                  size={20}
                  strokeWidth={1.75}
                  className={open ? styles.flip : ''}
                  aria-hidden="true"
                />
              </button>
              <div id={panelId} className={styles.panel} hidden={!open}>
                {open && entry.status === 'ready' ? (
                  <RecapCard entry={entry} lang={lang} onAsk={onAsk} />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
