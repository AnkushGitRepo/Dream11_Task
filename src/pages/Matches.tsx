import { useState } from 'react';
import { LANGS } from '@shared/i18n/strings';
import { AppBar } from '@/components/AppBar';
import { ErrorState } from '@/components/ErrorState';
import { LangChip } from '@/components/LangChip';
import { SportTabs, type SportTab } from '@/components/SportTabs';
import { AllReplays, Featured, LiveNow, MatchesSkeleton, useMatchesIndex } from '@/features/matches';
import { updateSettings, useSettings } from '@/features/settings/settingsStore';
import { useLangEffects } from '@/i18n/useLangEffects';
import { useStrings } from '@/i18n/useStrings';
import styles from './Matches.module.scss';

const PANEL_ID = 'matches-panel';

export default function Matches() {
  useLangEffects();
  const { t, langAttr } = useStrings();
  const { lang } = useSettings();
  const { state, retry } = useMatchesIndex();
  const [sport, setSport] = useState('cricket');

  const tabs: readonly SportTab[] = [
    { id: 'cricket', label: t.sportCricket },
    { id: 'football', label: t.sportFootball, disabled: true },
    { id: 'kabaddi', label: t.sportKabaddi, disabled: true },
  ];
  // No settings sheet on this page yet: the chip cycles through the languages.
  const cycleLang = () => updateSettings({ lang: LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length] ?? lang });

  return (
    <>
      <AppBar right={<LangChip onClick={cycleLang} />} />
      <main className={styles.page}>
        <header className={styles.head} lang={langAttr}>
          <h1 className={styles.h1}>{t.matchesTitle}</h1>
          <p className={styles.sub}>{t.matchesSub}</p>
        </header>
        <SportTabs
          tabs={tabs}
          value={sport}
          onChange={setSport}
          ariaLabel={t.sportTabsLabel}
          soonLabel={t.soonLabel}
          panelId={PANEL_ID}
        />
        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-labelledby={`sport-tab-${sport}`}
          aria-busy={state.status === 'loading'}
          className={styles.panel}
        >
          <LiveNow />
          {state.status === 'loading' ? <MatchesSkeleton /> : null}
          {state.status === 'error' ? (
            <ErrorState
              title={t.matchesErrorTitle}
              text={t.matchesErrorText}
              actionLabel={t.matchesRetry}
              onAction={retry}
            />
          ) : null}
          {state.status === 'ready' ? (
            <>
              <Featured matches={state.matches} />
              <AllReplays matches={state.matches} />
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
