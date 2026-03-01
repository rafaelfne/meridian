import clsx from "clsx";
import styles from "./TagBadge.module.css";

/* ── Value → CSS class mappings ───────────────────────── */

const SERVICE_TYPE: Record<string, string | undefined> = {
    API: styles.svcApi,
    WORKER: styles.svcWorker,
    CRONJOB: styles.svcCron,
    BACKGROUND_SERVICE: styles.svcBg,
};

const INTEGRATION_TYPE: Record<string, string | undefined> = {
    HTTP_API: styles.intgHttpApi,
    DATABASE_DIRECT: styles.intgDatabase,
    GRPC: styles.intgGrpc,
    GRAPHQL: styles.intgGraphql,
    SOAP: styles.intgSoap,
    FILE_TRANSFER: styles.intgFile,
    OTHER: styles.intgOther,
};

const BROKER: Record<string, string | undefined> = {
    KAFKA: styles.brokerKafka,
    RABBITMQ: styles.brokerRabbitmq,
    SQS: styles.brokerSqs,
    SNS: styles.brokerSns,
    OTHER: styles.brokerOther,
};

const TOPIC_ROLE: Record<string, string | undefined> = {
    CONSUMER: styles.roleConsumer,
    PRODUCER: styles.roleProducer,
    BOTH: styles.roleBoth,
};

const PACKAGE_SCOPE: Record<string, string | undefined> = {
    INTERNAL: styles.scopeInternal,
    OPEN_SOURCE: styles.scopeOpenSource,
    TEST: styles.scopeTest,
};

const SEVERITY: Record<string, string | undefined> = {
    LOW: styles.severityLow,
    MEDIUM: styles.severityMedium,
    HIGH: styles.severityHigh,
    CRITICAL: styles.severityCritical,
};

const HTTP_METHOD: Record<string, string | undefined> = {
    GET: styles.methodGet,
    POST: styles.methodPost,
    PUT: styles.methodPut,
    PATCH: styles.methodPatch,
    DELETE: styles.methodDelete,
};

/* ── Display labels (human-friendly) ──────────────────── */

const LABELS: Record<string, string> = {
    HTTP_API: "HTTP API",
    DATABASE_DIRECT: "Database Direct",
    FILE_TRANSFER: "File Transfer",
    BACKGROUND_SERVICE: "BG Service",
    OPEN_SOURCE: "Open Source",
};

/* ── Unified lookup by category ───────────────────────── */

type TagCategory =
    | "service-type"
    | "integration-type"
    | "broker"
    | "topic-role"
    | "package-scope"
    | "severity"
    | "http-method";

const CATEGORY_MAP: Record<TagCategory, Record<string, string | undefined>> = {
    "service-type": SERVICE_TYPE,
    "integration-type": INTEGRATION_TYPE,
    broker: BROKER,
    "topic-role": TOPIC_ROLE,
    "package-scope": PACKAGE_SCOPE,
    severity: SEVERITY,
    "http-method": HTTP_METHOD,
};

interface TagBadgeProps {
    /** Which category of enum value this represents */
    category: TagCategory;
    /** The raw enum value (e.g. "API", "HTTP_API", "KAFKA") */
    value: string;
    /** Optional class name override */
    className?: string;
}

export function TagBadge({ category, value, className }: TagBadgeProps) {
    const map = CATEGORY_MAP[category];
    const colorClass = map[value];
    const label = LABELS[value] ?? value.replace(/_/g, " ");

    return (
        <span className={clsx(styles.tag, colorClass, className)}>{label}</span>
    );
}
