import { AwayBanner } from '@/components/AwayBanner';
import { ToastProvider } from '@/components/Toast';
import { RecapCard } from '@/features/catchup/RecapCard';
import { useStrings } from '@/i18n/useStrings';
import { MOCK_BASELINE, mockTimeline } from '@/mocks/match.mock';
import { getSportUi } from '@/sports/uiRegistry';
import { demoRecapEntry, getDemoModel } from './demoModel';
import { useDemoLoop } from './useDemoLoop';
import { useFitScale } from './useFitScale';
import styles from './PhoneDemo.module.scss';

const noop = () => undefined;
// The screen is laid out at a real phone width, then scaled to fit the frame so nothing wraps or clips.
const DESIGN_WIDTH = 390;

/** CSS-only phone running the real ScoreHero, AwayBanner and RecapCard on a muted loop. */
export function PhoneDemo() {
  const { lang } = useStrings();
  const model = getDemoModel();
  const durations = model.steps.map((s) => s.ms);
  const { ref, step } = useDemoLoop<HTMLDivElement>(durations);
  const scale = useFitScale(ref, DESIGN_WIDTH);
  const current = model.steps[step] ?? model.steps[0];
  const ScoreHero = getSportUi(mockTimeline.meta.sport)?.ScoreHero;
  if (!current || !ScoreHero) return null;

  return (
    <div className={styles.wrap}>
      <p className={styles.visuallyHidden}>
        Preview of the match screen: the score ticks, a banner says how many balls you missed, then a verified
        recap appears.
      </p>
      <div className={styles.bezel}>
        {/* Decorative demo: hidden from AT and inert so keyboard users never tab into it. */}
        <div ref={ref} className={styles.phone} data-theme="dark" aria-hidden="true" inert>
          <ToastProvider>
            <div className={styles.screen} style={{ transform: `scale(${scale})` }}>
              <ScoreHero timeline={mockTimeline} position={current.position} baseline={MOCK_BASELINE} />
              {current.banner ? (
                <div className={styles.slide}>
                  <AwayBanner label={model.window.label} onCatchUp={noop} onDismiss={noop} />
                </div>
              ) : null}
              {current.recap ? <RecapCard entry={demoRecapEntry(lang)} onAsk={noop} /> : null}
            </div>
          </ToastProvider>
        </div>
      </div>
    </div>
  );
}
