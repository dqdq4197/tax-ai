import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeDate } from "./format-relative-date";

const NOW = new Date("2026-05-18T12:00:00Z");

function ago(ms: number) {
  return new Date(NOW.getTime() - ms);
}

const SEC = 1_000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1분 미만 (< 45초)", () => {
    it("30초 전은 '1분 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(30 * SEC))).toBe("1분 전");
    });

    it("44초 전도 '1분 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(44 * SEC))).toBe("1분 전");
    });
  });

  describe("분 단위 (45초 ~ 44분 30초)", () => {
    it("45초 전은 '1분 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(45 * SEC))).toBe("1분 전");
    });

    it("5분 전은 '5분 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(5 * MIN))).toBe("5분 전");
    });

    it("44분 전은 '44분 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(44 * MIN))).toBe("44분 전");
    });
  });

  describe("시간 단위 (45분 ~ 23시간 30분)", () => {
    it("45분 전은 '약 1시간 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(45 * MIN))).toBe("약 1시간 전");
    });

    it("3시간 전은 '약 3시간 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(3 * HOUR))).toBe("약 3시간 전");
    });

    it("23시간 전은 '약 23시간 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(23 * HOUR))).toBe("약 23시간 전");
    });
  });

  describe("일 단위 (23.5시간 ~ 25.5일)", () => {
    it("하루 전은 '1일 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(1 * DAY))).toBe("1일 전");
    });

    it("7일 전은 '7일 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(7 * DAY))).toBe("7일 전");
    });

    it("25일 전은 '25일 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(25 * DAY))).toBe("25일 전");
    });
  });

  describe("달 단위 (26일 이상)", () => {
    it("30일 전은 '약 1개월 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(30 * DAY))).toBe("약 1개월 전");
    });

    it("60일 전은 '2개월 전'을 반환한다", () => {
      expect(formatRelativeDate(ago(60 * DAY))).toBe("2개월 전");
    });
  });
});
