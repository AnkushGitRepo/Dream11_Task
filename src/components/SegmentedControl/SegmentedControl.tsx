import { useRef } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import styles from './SegmentedControl.module.scss';

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const select = (index: number) => {
    const next = options[(index + options.length) % options.length];
    if (!next) return;
    onChange(next.value);
    refs.current[(index + options.length) % options.length]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: activeIndex + 1,
      ArrowDown: activeIndex + 1,
      ArrowLeft: activeIndex - 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: options.length - 1,
    };
    const target = keys[e.key];
    if (target === undefined) return;
    e.preventDefault();
    select(target);
  };

  const vars = {
    '--count': options.length,
    '--index': activeIndex,
  } as CSSProperties;

  return (
    <div className={styles.track} role="tablist" aria-label={label} style={vars}>
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((opt, i) => {
        const selected = i === activeIndex;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.selected : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={onKeyDown}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
