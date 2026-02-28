import { z } from "zod/v4";

const VALID_DEPENDENCY_TYPES = [
  "HTTP_API",
  "KAFKA_TOPIC",
  "SHARED_DATABASE",
  "CROSS_DATABASE_QUERY",
  "SHARED_PACKAGE",
  "GRPC",
  "FILE_DEPENDENCY",
] as const;

export const GraphQuerySchema = z.object({
  domain: z.string().optional(),
  dependencyType: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is (typeof VALID_DEPENDENCY_TYPES)[number] =>
          (VALID_DEPENDENCY_TYPES as readonly string[]).includes(t),
        );
    }),
});

export type GraphQuery = z.infer<typeof GraphQuerySchema>;
