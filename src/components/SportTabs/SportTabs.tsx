import { useRef, type KeyboardEvent } from 'react';
import { Chip } from '@/components/Chip';
import styles from './SportTabs.module.scss';

export interface SportTab {
  readonly id: string;
  readonly label: string;
  /** Visible but not selectable (e.g. a sport that is not supported yet). */
  readonly disabled?: boolean;
}

export interface SportTabsProps {
  readonly tabs: readonly SportTab[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly ariaLabel: string;
  /** Text of the chip shown on disabled tabs (e.g. "SOON"). Text, never colour alone. */
  readonly soonLabel: string;
  /** id of the tabpanel this tablist controls. */
  readonly panelId?: string;
  /** Prefix for tab element ids (so a panel can reference its tab). */
  readonly idPrefix?: string;
}

export function SportTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  soonLabel,
  panelId,
  idPrefix = 'sport',
}: SportTabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move focus across all tabs (disabled ones stay reachable); only enabled tabs activate.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
  };

  return (
    <div className={styles.list} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={tab.disabled || undefined}
            aria-controls={selected ? panelId : undefined}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.selected : ''} ${tab.disabled ? styles.disabled : ''}`.trim()}
            onClick={() => {
              if (!tab.disabled) onChange(tab.id);
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.disabled ? <Chip className={styles.soon}>{soonLabel}</Chip> : null}
          </button>
        );
      })}
    </div>
  );
}
