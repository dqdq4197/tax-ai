import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

class AES256GCM {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 16;

  private readonly key: Buffer;

  constructor(secret = process.env.ENCRYPTION_KEY) {
    if (!secret) {
      throw new Error("ENCRYPTION_KEY is not set");
    }

    this.key = Buffer.from(secret, "base64");

    if (this.key.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be 32 bytes");
    }
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(AES256GCM.IV_LENGTH);
    const cipher = createCipheriv(AES256GCM.ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  }

  decrypt(cipherText: string): string {
    const buf = Buffer.from(cipherText, "base64");
    const iv = buf.subarray(0, AES256GCM.IV_LENGTH);
    const tag = buf.subarray(
      AES256GCM.IV_LENGTH,
      AES256GCM.IV_LENGTH + AES256GCM.TAG_LENGTH,
    );
    const encrypted = buf.subarray(AES256GCM.IV_LENGTH + AES256GCM.TAG_LENGTH);

    const decipher = createDecipheriv(AES256GCM.ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }
}

export const encryption = new AES256GCM();
