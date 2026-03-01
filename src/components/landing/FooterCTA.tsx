import { GitHubSignInButton } from "./GitHubSignInButton";
import styles from "./FooterCTA.module.css";

export function FooterCTA() {
  return (
    <footer className={styles.footer}>
      <h2 className={styles.heading}>Ready to map your architecture?</h2>
      <div className={styles.cta}>
        <GitHubSignInButton size="large" />
      </div>
      <p className={styles.tagline}>
        Built for engineering teams that need to see the full picture.
      </p>
    </footer>
  );
}
