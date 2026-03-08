"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Activity, ShieldCheck } from "lucide-react";
import styles from "./FeaturesSection.module.css";

const features = [
  {
    icon: Layers,
    title: "Inventory Resolution",
    body: "Automatically resolve dependencies between services, databases, and message brokers from simple JSON uploads.",
    color: "indigo" as const,
  },
  {
    icon: Activity,
    title: "Product Hierarchy",
    body: "Map technical systems to business products and features. Establish the link between code and revenue.",
    color: "blue" as const,
  },
  {
    icon: ShieldCheck,
    title: "Trust Communication",
    body: "Generate white-labeled status pages with automated health data flowing directly from your Datadog monitors.",
    color: "emerald" as const,
  },
];

export function FeaturesSection() {
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
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="features" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Everything connects.</h2>
        <p className={styles.subheading}>
          One platform to map, translate, and communicate your architecture.
        </p>
      </div>

      <div className={styles.grid}>
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={styles.card}
              data-visible={visible}
              data-color={feature.color}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className={styles.iconWrapper}>
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardBody}>{feature.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
