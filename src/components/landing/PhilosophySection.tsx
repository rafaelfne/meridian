"use client";

import { Globe, Share2 } from "lucide-react";
import styles from "./PhilosophySection.module.css";

export function PhilosophySection() {
  return (
    <section id="philosophy" className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.content}>
          <h2 className={styles.heading}>The Meridian Philosophy</h2>
          <p className={styles.text}>
            In geography, a meridian is a great circle of the earth passing
            through the poles. It connects the extreme North to the extreme South.
          </p>
          <p className={styles.textHighlight}>
            In engineering, we are that circle. We connect{" "}
            <span className={styles.accentIndigo}>Business Ambition</span> to{" "}
            <span className={styles.accentBlue}>Technical Reality</span>.
          </p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Globe size={20} />
              </div>
              <div>
                <h4 className={styles.featureTitle}>Universal Visibility</h4>
                <p className={styles.featureText}>
                  From low-level HTTP calls to high-level product uptime.
                </p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon} data-color="blue">
                <Share2 size={20} />
              </div>
              <div>
                <h4 className={styles.featureTitle}>Dynamic Context</h4>
                <p className={styles.featureText}>
                  Every database and message topic mapped to a business feature.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.ring1} />
          <div className={styles.ring2} />
          <div className={styles.poleText}>POLE</div>
          <div className={styles.poleLineVertical} />
        </div>
      </div>
    </section>
  );
}
