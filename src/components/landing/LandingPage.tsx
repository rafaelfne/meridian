import { HeroGraph } from "./HeroGraph";
import { GitHubSignInButton } from "./GitHubSignInButton";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { TechStackSection } from "./TechStackSection";
import { FooterCTA } from "./FooterCTA";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <HeroGraph />
        <div className={styles.heroContent}>
          <h1 className={styles.title}>MERIDIAN</h1>
          <p className={styles.subtitle}>
            Map your system dependencies.
            <br />
            See what connects to what.
          </p>
          <div className={styles.heroCta}>
            <GitHubSignInButton size="large" />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <FooterCTA />
    </div>
  );
}
