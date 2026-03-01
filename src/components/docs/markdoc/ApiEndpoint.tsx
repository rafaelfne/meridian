import styles from "./ApiEndpoint.module.css";
import clsx from "clsx";

const methodColors: Record<string, string | undefined> = {
    GET: styles.get,
    POST: styles.post,
    PUT: styles.put,
    DELETE: styles.delete,
    PATCH: styles.patch,
};

export function ApiEndpoint({
    method,
    path,
    description,
}: {
    method: string;
    path: string;
    description?: string;
}) {
    const upper = method.toUpperCase();
    return (
        <div className={styles.endpoint}>
            <span className={clsx(styles.method, methodColors[upper])}>
                {upper}
            </span>
            <span className={styles.path}>{path}</span>
            {description && (
                <span className={styles.description}>{description}</span>
            )}
        </div>
    );
}
