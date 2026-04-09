import crypto from "crypto";

/**
 * Generate a cryptographically secure URL-safe random ID.
 * Used for admin_link_id and trust_link_id tokens.
 */
export function generateSecureLinkId(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString("base64url");
}
