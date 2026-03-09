import { randomBytes, createHash } from "crypto";

export function generateResetToken() {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
