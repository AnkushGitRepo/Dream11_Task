import { DEMO_PATH, MATCHES_PATH } from './content';
import { LinkButton } from './LinkButton';
import { PhoneDemo } from './PhoneDemo';
import styles from './Hero.module.scss';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.overline}>Second-screen AI for live sports</p>
          <h1 id="hero-title" className={styles.title}>
            Missed two overs?
            <span className={styles.accent}>Kya hua? Just ask.</span>
          </h1>
          <p className={styles.sub}>
            An AI match buddy that catches you up in 10 seconds — in English, Hinglish,{' '}
            <span lang="hi">हिंदी</span> or <span lang="gu">ગુજરાતી</span>. Every number verified.
          </p>
          <div className={styles.ctas}>
            <LinkButton to={DEMO_PATH}>Open live demo →</LinkButton>
            <LinkButton to={MATCHES_PATH} variant="ghost">
              Pick a match
            </LinkButton>
          </div>
        </div>
        <div className={styles.visual}>
          <PhoneDemo />
        </div>
      </div>
    </section>
  );
}
