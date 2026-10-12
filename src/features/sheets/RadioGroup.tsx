import { useId } from 'react';
import styles from './RadioGroup.module.scss';

export interface RadioOption<T extends string> {
  readonly value: T;
  readonly label: string;
  /** Smaller line under the label (rows layout). */
  readonly sub?: string;
  /** Extra note under the row, e.g. "Voice not available". */
  readonly note?: string;
  /** `lang` of the label text, so own-script names render with the right font. */
  readonly lang?: string;
}

interface RadioGroupProps<T extends string> {
  readonly label: string;
  readonly options: readonly RadioOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** `rows`: large stacked rows. `segments`: compact equal-width pills. */
  readonly layout?: 'rows' | 'segments';
}

/** Native radios (arrow keys, grouping and focus come from the platform), styled via SCSS. */
export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = 'rows',
}: RadioGroupProps<T>) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={`${styles.group} ${styles[layout]}`}>
      {options.map((opt) => (
        <div key={opt.value} className={styles.item}>
          <label className={styles.option}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={opt.value}
              checked={opt.value === value}
              onChange={() => onChange(opt.value)}
            />
            <span className={styles.face}>
              <span lang={opt.lang} className={styles.label}>
                {opt.label}
              </span>
              {opt.sub ? <span className={styles.sub}>{opt.sub}</span> : null}
            </span>
          </label>
          {opt.note ? <p className={styles.note}>{opt.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
