import { useContext } from 'react';
import { GraduationCap } from 'lucide-react';
import { ToastContext } from '@/components/Toast/ToastContext';
import { useStrings } from '@/i18n/useStrings';
import { markIntroSeen, setLearnOn, useLearnState } from './learnStore';
import styles from './LearnToggle.module.scss';

/** AppBar pill: Learn mode on/off. The first time it is switched on a one-line toast explains it. */
export function LearnToggle() {
  const { t } = useStrings();
  const { on, introSeen } = useLearnState();
  const toast = useContext(ToastContext);

  const toggle = () => {
    const next = !on;
    setLearnOn(next);
    if (next && !introSeen) {
      markIntroSeen();
      toast?.show(t.learnOnToast);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.toggle} ${on ? styles.on : ''}`.trim()}
      aria-pressed={on}
      aria-label={t.learnToggleLabel}
      onClick={toggle}
    >
      <GraduationCap size={18} strokeWidth={on ? 2.25 : 1.75} aria-hidden="true" />
      <span>{t.learnToggle}</span>
    </button>
  );
}
