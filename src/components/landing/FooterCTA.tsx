import { GitHubSignInButton } from "./GitHubSignInButton";
import styles from "./FooterCTA.module.css";

export function FooterCTA() {
  return (
    <>
      <section className={styles.cta}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <div className={styles.ctaContent}>
          <h2 className={styles.heading}>
            Ready to map your
            <br />
            architecture?
          </h2>
          <p className={styles.tagline}>
            Built for engineering teams that need to see the full picture.
          </p>
          <div className={styles.ctaButton}>
            <GitHubSignInButton size="large" />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={styles.logoMark}>
              <span>M</span>
            </div>
            <span className={styles.copyright}>MERIDIAN &copy; 2025</span>
          </div>
          <div className={styles.footerLinks}>
            <a
              href="https://github.com/rafaelfne/tech-radar"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              GitHub
            </a>
            <a href="/docs" className={styles.footerLink}>
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
