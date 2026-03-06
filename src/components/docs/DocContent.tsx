import styles from "./DocContent.module.css";

export function DocContent({ children }: { children: React.ReactNode }) {
  return <article className={styles.content}>{children}</article>;
}
