import { randomBytes, createHash } from "crypto";

export function generateResetToken() {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey() {
  const random = randomBytes(32).toString("hex");
  const raw = `mrdn_live_${random.slice(0, 32)}`;
  const prefix = `mrdn_live_${random.slice(0, 8)}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}
