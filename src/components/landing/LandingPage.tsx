import { HeroGraph } from "./HeroGraph";
import { GitHubSignInButton } from "./GitHubSignInButton";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { TechStackSection } from "./TechStackSection";
import { FooterCTA } from "./FooterCTA";
import { Navbar } from "./Navbar";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Background ambient glows */}
      <div className={styles.glowContainer} aria-hidden="true">
        <div className={styles.glowTopLeft} />
        <div className={styles.glowBottomRight} />
      </div>

      <Navbar />

      <section className={styles.hero}>
        <HeroGraph />
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>Multi-broker messaging support</span>
          </div>

          <h1 className={styles.title}>
            Map your system{" "}
            <span className={styles.titleGradient}>dependencies.</span>
          </h1>

          <p className={styles.subtitle}>
            See how everything connects. From HTTP to Kafka, from RabbitMQ to
            PostgreSQL. A panoramic, technical view of your entire architecture.
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
