import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.JWT_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD_SECRET?.trim() ||
    "fallback-secret-min-32-chars-here";
  return createHash("sha256").update(secret).digest();
}

/** Mot de passe lisible pour invitation / création admin. */
export function generateReadablePassword(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

/** Chiffre le mot de passe pour affichage admin (format iv:tag:cipher en base64). */
export function encryptAdminPassword(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptAdminPassword(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, dataB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(
      ALGO,
      getEncryptionKey(),
      Buffer.from(ivB64, "base64")
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
