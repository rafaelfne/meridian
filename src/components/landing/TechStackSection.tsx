import styles from "./TechStackSection.module.css";

const techs = [
  "Next.js 15",
  "React Flow",
  "Prisma",
  "PostgreSQL",
  "TypeScript",
  "Multi-broker messaging",
];

export function TechStackSection() {
  return (
    <section className={styles.section}>
      <div className={styles.badges}>
        {techs.map((tech) => (
          <span key={tech} className={styles.badge}>
            {tech}
          </span>
        ))}
      </div>
    </section>
  );
}
