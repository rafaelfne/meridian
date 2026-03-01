import styles from "./Callout.module.css";
import clsx from "clsx";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

const icons = {
    note: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    check: CheckCircle,
};

export function Callout({
    type = "note",
    title,
    children,
}: {
    type?: "note" | "warning" | "error" | "check";
    title?: string;
    children: React.ReactNode;
}) {
    const Icon = icons[type];
    return (
        <div className={clsx(styles.callout, styles[type])}>
            {(title !== undefined || Icon !== undefined) && (
                <div className={styles.header}>
                    {Icon && <Icon size={16} />}
                    {title && <span>{title}</span>}
                </div>
            )}
            <div className={styles.body}>{children}</div>
        </div>
    );
}
