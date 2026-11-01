import { createHash, randomBytes } from "node:crypto";

// Opaque, high-entropy tokens (refresh / email-verification / password-reset).
// Only the SHA-256 hash is ever persisted — the raw token exists only in the
// response/email sent to the user, so a database read alone can never be
// used to impersonate a session or reset a password.
export function generateOpaqueToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
