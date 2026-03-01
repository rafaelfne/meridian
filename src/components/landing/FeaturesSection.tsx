"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, GitBranch, Network } from "lucide-react";
import styles from "./FeaturesSection.module.css";

const features = [
  {
    icon: Upload,
    title: "Upload",
    body: "Drop a JSON inventory. Domains, services, databases, integrations, messaging — all captured in one schema.",
  },
  {
    icon: GitBranch,
    title: "Resolve",
    body: "Dependency engine maps HTTP calls, Kafka topics, RabbitMQ queues, shared databases, and internal packages. Automatically.",
  },
  {
    icon: Network,
    title: "Visualize",
    body: "Interactive dependency graph. Click a node, trace every connection. Filter by domain, protocol, or language.",
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
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.grid}>
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={styles.card}
              data-visible={visible}
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
