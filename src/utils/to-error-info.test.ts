import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ky", () => ({
  SchemaValidationError: class SchemaValidationError extends Error {},
  isTimeoutError: vi.fn(),
  isNetworkError: vi.fn(),
  isHTTPError: vi.fn(),
  isKyError: vi.fn(),
}));

import {
  isHTTPError,
  isKyError,
  isNetworkError,
  isTimeoutError,
  SchemaValidationError,
} from "ky";
import { toErrorInfo } from "./to-error-info";

beforeEach(() => {
  vi.mocked(isTimeoutError).mockReturnValue(false);
  vi.mocked(isNetworkError).mockReturnValue(false);
  vi.mocked(isHTTPError).mockReturnValue(false);
  vi.mocked(isKyError).mockReturnValue(false);
});

function makeHttpError(status: number, message = `HTTP ${status}`) {
  vi.mocked(isHTTPError).mockReturnValue(true);
  return Object.assign(new Error(message), { response: { status } });
}

describe("toErrorInfo", () => {
  describe("SchemaValidationError", () => {
    it("INVALID_RESPONSE를 반환한다", () => {
      expect(
        toErrorInfo(
          Object.assign(Object.create(SchemaValidationError.prototype), {
            message: "schema mismatch",
          }),
        ),
      ).toMatchObject({
        code: "INVALID_RESPONSE",
        recoveryAction: "contact-support",
        detail: "schema mismatch",
      });
    });
  });

  describe("Timeout", () => {
    it("TIMEOUT을 반환한다", () => {
      vi.mocked(isTimeoutError).mockReturnValue(true);
      expect(toErrorInfo(new Error("timeout"))).toMatchObject({
        code: "TIMEOUT",
        recoveryAction: "retry",
        detail: "timeout",
      });
    });
  });

  describe("Network", () => {
    it("NETWORK를 반환한다", () => {
      vi.mocked(isNetworkError).mockReturnValue(true);
      expect(toErrorInfo(new Error("network error"))).toMatchObject({
        code: "NETWORK",
        recoveryAction: "retry",
        detail: "network error",
      });
    });
  });

  describe("HTTP 에러", () => {
    it("401 → AUTH_EXPIRED", () => {
      expect(toErrorInfo(makeHttpError(401))).toMatchObject({
        code: "AUTH_EXPIRED",
        recoveryAction: "refresh-auth",
        detail: "HTTP 401",
      });
    });

    it("403 → FORBIDDEN", () => {
      expect(toErrorInfo(makeHttpError(403))).toMatchObject({
        code: "FORBIDDEN",
        recoveryAction: "none",
      });
    });

    it("404 → NOT_FOUND", () => {
      expect(toErrorInfo(makeHttpError(404))).toMatchObject({
        code: "NOT_FOUND",
        recoveryAction: "none",
      });
    });

    it("429 → RATE_LIMITED", () => {
      expect(toErrorInfo(makeHttpError(429))).toMatchObject({
        code: "RATE_LIMITED",
        recoveryAction: "retry",
      });
    });

    it("500 → SERVER", () => {
      expect(toErrorInfo(makeHttpError(500))).toMatchObject({
        code: "SERVER",
        recoveryAction: "retry",
      });
    });

    it("503도 → SERVER", () => {
      expect(toErrorInfo(makeHttpError(503))).toMatchObject({
        code: "SERVER",
        recoveryAction: "retry",
      });
    });
  });

  describe("Ky 에러 (기타)", () => {
    it("UNKNOWN을 반환하고 retry한다", () => {
      vi.mocked(isKyError).mockReturnValue(true);
      expect(toErrorInfo(new Error("ky error"))).toMatchObject({
        code: "UNKNOWN",
        recoveryAction: "retry",
        detail: "ky error",
      });
    });
  });

  describe("알 수 없는 에러", () => {
    it("UNKNOWN, recoveryAction none을 반환한다", () => {
      expect(toErrorInfo(new Error("oops"))).toMatchObject({
        code: "UNKNOWN",
        recoveryAction: "none",
      });
    });

    it("Error가 아니면 detail이 없다", () => {
      const result = toErrorInfo("string error");
      expect(result.code).toBe("UNKNOWN");
      expect(result.detail).toBeUndefined();
    });
  });
});
