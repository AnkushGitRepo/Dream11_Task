import { useStrings } from '@/i18n/useStrings';
import { LiveDot } from '@/components/LiveDot';
import { bowlerFigures, shortName, type CricketState } from '@shared/sports/cricket/state';
import type { SportScoreProps } from '../../types';
import { isCricketBaseline, scoreText, statusLine, useCricketState } from './baseline';
import { ChaseBar } from './ChaseBar';
import { LiveAnnouncer } from './LiveAnnouncer';
import { OverStrip } from './OverStrip';
import { useCricketText } from './useLabels';
import { PlayerLine } from './PlayerLine';
import { ScoreRoll } from './ScoreRoll';
import { TeamMonogram } from './TeamMonogram';
import type { CricketBaseline } from '@shared/sports/cricket/state';
import styles from './ScoreHero.module.scss';

const fmt2 = (n: number) => n.toFixed(2);

function Players({ s }: { readonly s: CricketState }) {
  const { text } = useCricketText();
  const stat = (b: CricketState['striker']) => `${b.runs} (${b.balls})`;
  return (
    <div className={styles.players}>
      <ul className={styles.col} aria-label={text('batters')}>
        <PlayerLine name={shortName(s.striker.name)} stat={stat(s.striker)} onStrike />
        <PlayerLine name={shortName(s.nonStriker.name)} stat={stat(s.nonStriker)} />
      </ul>
      <ul className={styles.col} aria-label={text('bowler')}>
        <PlayerLine role={text('bowler')} name={shortName(s.bowler.name)} stat={bowlerFigures(s.bowler)} />
      </ul>
    </div>
  );
}

function Pills({ s }: { readonly s: CricketState }) {
  const { text } = useCricketText();
  return (
    <ul className={styles.pills} aria-label={text('matchRates')}>
      {s.crr !== null ? <li className={styles.pill}>{text('crr', { n: fmt2(s.crr) })}</li> : null}
      {s.rrr !== null ? <li className={styles.pill}>{text('rrr', { n: fmt2(s.rrr) })}</li> : null}
      <li className={styles.pill}>{text('partnership', { n: s.partnership.runs })}</li>
    </ul>
  );
}

function HeroInner({
  timeline,
  position,
  baseline,
  replay,
}: Omit<SportScoreProps, 'baseline'> & { readonly baseline: CricketBaseline }) {
  const s = useCricketState(timeline, position, baseline);
  const { text } = useCricketText();
  const { t } = useStrings();
  const team = timeline.meta.teams.find((t) => t.code === s.battingTeam);
  return (
    <section className={styles.hero} aria-label={text('scoreboard')}>
      <div className={styles.top}>
        <LiveDot label={t.replayLabel} />
        {replay}
      </div>
      <div className={styles.team}>
        <TeamMonogram code={s.battingTeam} />
        <div>
          <p className={styles.teamName}>{team?.name ?? s.battingTeam}</p>
          {s.target !== null ? <p className={styles.chasing}>{text('chasing', { n: s.target })}</p> : null}
        </div>
      </div>
      <div className={styles.scoreRow}>
        <ScoreRoll value={scoreText(s)} wicketSeq={s.lastWicketSeq} />
        <span className={styles.overs}>{text('overs', { n: s.overs })}</span>
      </div>
      <div className={styles.statusRow}>
        <p className={styles.status}>{statusLine(s, text)}</p>
        {s.freeHitNext ? <span className={styles.freeHit}>{text('freeHit')}</span> : null}
      </div>
      {s.target !== null ? <ChaseBar score={s.score} target={s.target} /> : null}
      <Pills s={s} />
      <OverStrip balls={s.recent} />
      <Players s={s} />
      <LiveAnnouncer state={s} />
    </section>
  );
}

export function ScoreHero({ baseline, ...rest }: SportScoreProps) {
  if (!isCricketBaseline(baseline)) return null;
  return <HeroInner {...rest} baseline={baseline} />;
}
