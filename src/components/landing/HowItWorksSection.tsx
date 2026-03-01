"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HowItWorksSection.module.css";

const steps = [
  "Upload standardized JSON inventories describing your systems, services, and integrations.",
  "The resolution engine detects dependencies across HTTP APIs, Kafka, RabbitMQ, databases, and shared packages.",
  "An interactive graph renders your full architecture map with filterable edges and detailed system panels.",
  "Create workspaces, invite your team with role-based access. Each workspace is a separate, isolated map.",
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <h2 className={styles.heading}>How it works</h2>
      <div className={styles.timeline}>
        {steps.map((step, i) => (
          <div
            key={i}
            className={styles.step}
            data-visible={visible}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className={styles.stepNumber}>
              <span>{i + 1}</span>
            </div>
            <p className={styles.stepText}>{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
