import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { getRule } from '@shared/sports/rules';
import { Button } from '@/components/Button';
import { fetchLearnMoment, type LearnMoment } from '@/features/learn/learnService';
import { SpeakButton } from '@/features/voice';
import { LEARN_DEMO } from './content';
import styles from './LearnDemoCard.module.scss';

const LANG = 'en';

/**
 * The in-app LearnCard for the real 19.4 free-hit moment. Title and rule come from the bundled
 * rulebook; the "in this match" line is fetched from the real /api/learn (the static sentence shows
 * until it arrives, or if the server is unreachable). Listen plays the server's natural voice.
 * Audio is only requested after the visitor taps Listen, so a page view never costs a TTS call.
 */
export function LearnDemoCard() {
  const rule = getRule('cricket', LEARN_DEMO.ruleId);
  const [moment, setMoment] = useState<LearnMoment | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_API === 'true') return undefined;
    const controller = new AbortController();
    fetchLearnMoment({
      matchId: LEARN_DEMO.matchId,
      seq: LEARN_DEMO.seq,
      ruleId: LEARN_DEMO.ruleId,
      lang: LANG,
      signal: controller.signal,
    }).then((m) => {
      if (!controller.signal.aborted) setMoment(m);
    });
    return () => controller.abort();
  }, []);

  if (!rule) return null;
  const term = rule.term[LANG];
  const short = rule.short[LANG];
  const momentText = moment?.moment ?? LEARN_DEMO.moment;
  const spoken = moment?.speak ? `${term}. ${short} ${moment.speak}` : `${term}. ${short} ${momentText}`;

  return (
    <article className={styles.card} aria-label={`Learn card: ${term}`} lang="en">
      <p className={styles.overline}>LEARN · {term}</p>
      <h3 className={styles.title}>{term}</h3>
      <p className={styles.rule}>{short}</p>
      <p className={styles.moment}>
        <span className={styles.label}>In this match</span> {momentText}
      </p>
      <div className={styles.actions}>
        {armed ? (
          <SpeakButton
            text={spoken}
            lang={LANG}
            source={moment?.speakToken ? { kind: 'learn', id: moment.id, token: moment.speakToken } : undefined}
            autoPlay
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setArmed(true)}>
            <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
            Listen
          </Button>
        )}
      </div>
    </article>
  );
}
