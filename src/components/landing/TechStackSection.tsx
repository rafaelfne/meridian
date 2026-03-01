import styles from "./TechStackSection.module.css";

const techs = [
  "Next.js 15",
  "React Flow",
  "Prisma",
  "PostgreSQL",
  "TypeScript",
  "Zod",
];

export function TechStackSection() {
  return (
    <section id="tech" className={styles.section}>
      <p className={styles.label}>Built with modern industry standards</p>
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
