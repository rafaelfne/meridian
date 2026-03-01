"use client";

import { useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import styles from "./HowItWorksSection.module.css";

const steps = [
  {
    title: "JSON Inventory",
    desc: "Upload standardized JSON inventories describing your systems, services, and integrations.",
  },
  {
    title: "Resolution Engine",
    desc: "The engine detects dependencies across HTTP APIs, Kafka, RabbitMQ, databases, and shared packages automatically.",
  },
  {
    title: "Visual Rendering",
    desc: "An interactive graph renders your full architecture map with filterable edges and detailed system panels.",
  },
  {
    title: "Isolated Workspaces",
    desc: "Create workspaces, invite your team with role-based access. Each workspace is a separate, isolated map.",
  },
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
    <section ref={sectionRef} id="how-it-works" className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <h2 className={styles.heading}>How it works</h2>
          <p className={styles.description}>
            Meridian abstracts the complexity of your infrastructure and turns it
            into a comprehensible map in four simple steps.
          </p>
          <div className={styles.highlight}>
            <div className={styles.highlightIcon}>
              <Shield size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className={styles.highlightTitle}>Security-first</p>
              <p className={styles.highlightText}>
                Role-based access ensures each team sees only what they need.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.steps}>
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
              <div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
