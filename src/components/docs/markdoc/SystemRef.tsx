import Link from "next/link";
import styles from "./SystemRef.module.css";
import { Network } from "lucide-react";

export function SystemRef({
    slug,
    label,
    workspaceSlug,
}: {
    slug: string;
    label?: string;
    workspaceSlug: string;
}) {
    return (
        <Link
            href={`/w/${workspaceSlug}/systems/${slug}`}
            className={styles.ref}
        >
            <Network size={14} className={styles.icon} />
            <span>{label ?? slug}</span>
        </Link>
    );
}
