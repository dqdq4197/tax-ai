import { randomBytes } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 32바이트 테스트용 키
const VALID_KEY = randomBytes(32).toString("base64");

describe("AES256GCM", () => {
  describe("encrypt / decrypt", () => {
    let encryption: { encrypt: (s: string) => string; decrypt: (s: string) => string };

    beforeEach(async () => {
      vi.stubEnv("ENCRYPTION_KEY", VALID_KEY);
      vi.resetModules();
      const mod = await import("./aes256gcm");
      encryption = mod.encryption;
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("평문을 암호화 후 복호화하면 원문이 반환된다", () => {
      const plainText = "종합소득세 상담 내용입니다";
      expect(encryption.decrypt(encryption.encrypt(plainText))).toBe(plainText);
    });

    it("빈 문자열도 암호화/복호화된다", () => {
      expect(encryption.decrypt(encryption.encrypt(""))).toBe("");
    });

    it("같은 평문을 두 번 암호화하면 다른 결과가 나온다 (IV 랜덤)", () => {
      const plainText = "동일한 텍스트";
      expect(encryption.encrypt(plainText)).not.toBe(encryption.encrypt(plainText));
    });

    it("암호화 결과는 base64 인코딩된 문자열이다", () => {
      const cipherText = encryption.encrypt("테스트");
      const decoded = Buffer.from(cipherText, "base64");
      expect(decoded.toString("base64")).toBe(cipherText.replace(/\n/g, ""));
    });

    it("tag가 변조된 cipherText를 복호화하면 에러가 발생한다", () => {
      const cipherText = encryption.encrypt("원본 메시지");
      const buf = Buffer.from(cipherText, "base64");
      buf[15] ^= 0xff; // tag 영역(bytes 12-27) 변조
      expect(() => encryption.decrypt(buf.toString("base64"))).toThrow();
    });
  });

  describe("생성자 에러", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("ENCRYPTION_KEY가 없으면 에러가 발생한다", async () => {
      vi.stubEnv("ENCRYPTION_KEY", "");
      vi.resetModules();
      await expect(import("./aes256gcm")).rejects.toThrow("ENCRYPTION_KEY is not set");
    });

    it("ENCRYPTION_KEY가 32바이트가 아니면 에러가 발생한다", async () => {
      vi.stubEnv("ENCRYPTION_KEY", randomBytes(16).toString("base64")); // 16바이트
      vi.resetModules();
      await expect(import("./aes256gcm")).rejects.toThrow("ENCRYPTION_KEY must be 32 bytes");
    });
  });
});
