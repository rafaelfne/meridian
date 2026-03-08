import { Zap, Activity } from "lucide-react";
import { HeroGraph } from "./HeroGraph";
import { GitHubSignInButton } from "./GitHubSignInButton";
import { FeaturesSection } from "./FeaturesSection";
import { PhilosophySection } from "./PhilosophySection";
import { FooterCTA } from "./FooterCTA";
import { Navbar } from "./Navbar";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Background Decor */}
      <div className={styles.bgDecor} aria-hidden="true">
        <div className={styles.glowTopLeft} />
        <div className={styles.glowBottomRight} />
        <div className={styles.glowTopRight} />
        <div className={styles.meridianLine} />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Zap className={styles.badgeIcon} />
            <span>Syncing Business & Tech</span>
          </div>

          <h1 className={styles.title}>
            Align your{" "}
            <span className={styles.titleGradient}>Infrastructure</span>
            {" "}with your impact.
          </h1>

          <p className={styles.subtitle}>
            The definitive line where technical architecture meets business goals.
            Map dependencies, link products, and communicate trust in real-time.
          </p>

          <div className={styles.heroCtas}>
            <GitHubSignInButton size="large" label="Start Mapping" icon="arrow" />
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className={styles.previewContainer}>
          <div className={styles.previewCard}>
            <div className={styles.previewGradient} />
            <div className={styles.previewWindow}>
              <div className={styles.windowChrome}>
                <span className={styles.chromeDot} />
                <span className={styles.chromeDot} />
                <span className={styles.chromeDot} />
              </div>
              <div className={styles.windowBody}>
                <div className={styles.windowSidebar}>
                  <div className={styles.skeletonBar} style={{ width: "6rem" }} />
                  <div className={styles.skeletonBarSmall} style={{ width: "4rem" }} />
                  <div className={styles.skeletonBarSmall} style={{ width: "5rem" }} />
                </div>
                <div className={styles.windowMain}>
                  <HeroGraph />
                  <Activity className={styles.windowIcon} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PhilosophySection />
      <FeaturesSection />
      <FooterCTA />
    </div>
  );
}
