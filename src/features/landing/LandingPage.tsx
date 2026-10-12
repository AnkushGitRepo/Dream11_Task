import { useEffect } from 'react';
import { loadIndicFont } from '@/i18n/loadIndicFont';
import { FinalCta } from './FinalCta';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { LanguageShowcase } from './LanguageShowcase';
import { Nav } from './Nav';
import { ProblemStrip } from './ProblemStrip';
import { SportsRow } from './SportsRow';
import { TrustBand } from './TrustBand';
import styles from './LandingPage.module.scss';

/** The landing is always the paper theme, whatever the app theme is. */
export function LandingPage() {
  useEffect(() => {
    // The hero sub line contains Devanagari and Gujarati words.
    loadIndicFont('hi');
    loadIndicFont('gu');
  }, []);

  return (
    <div data-theme="paper" className={styles.page}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className={styles.main}>
        <Hero />
        <ProblemStrip />
        <HowItWorks />
        <TrustBand />
        <LanguageShowcase />
        <SportsRow />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
