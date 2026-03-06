import { codeToHtml } from "shiki";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  content: string;
  language?: string;
}

export async function CodeBlock({ content, language }: CodeBlockProps) {
  const lang = language?.toLowerCase() || "text";

  let html: string;
  try {
    html = await codeToHtml(content.trim(), {
      lang,
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false,
    });
  } catch {
    html = await codeToHtml(content.trim(), {
      lang: "text",
      themes: {
        light: "github-light",
        dark: "github-dark-dimmed",
      },
      defaultColor: false,
    });
  }

  return (
    <div className={styles.wrapper}>
      {language && language !== "text" && (
        <div className={styles.langBadge}>{language}</div>
      )}
      <div
        className={styles.code}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
