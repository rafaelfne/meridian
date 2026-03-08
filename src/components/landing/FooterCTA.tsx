import { Globe } from "lucide-react";
import { GitHubSignInButton } from "./GitHubSignInButton";
import styles from "./FooterCTA.module.css";

export function FooterCTA() {
  return (
    <>
      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaCard}>
          <div className={styles.ctaDecor} aria-hidden="true">
            <Globe className={styles.ctaGlobe} />
          </div>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaHeading}>Ready to map your world?</h2>
            <p className={styles.ctaText}>
              Join the engineering teams that have found their true north.
              Align your architecture today.
            </p>
            <div className={styles.ctaButtons}>
              <GitHubSignInButton size="pill" label="Get Started for Free" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logoMark}>
              <span>M</span>
            </div>
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
            <a href="#" className={styles.footerLink}>
              Status
            </a>
            <a href="#" className={styles.footerLink}>
              Privacy
            </a>
          </div>
          <p className={styles.copyright}>
            &copy; 2025 The definitive line between Business & Tech.
          </p>
        </div>
      </footer>
    </>
  );
}
