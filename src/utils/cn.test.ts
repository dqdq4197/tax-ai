import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  describe("기본 클래스 병합", () => {
    it("단일 문자열을 그대로 반환한다", () => {
      expect(cn("px-4")).toBe("px-4");
    });

    it("여러 클래스를 공백으로 연결한다", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });
  });

  describe("Tailwind 충돌 해결", () => {
    it("동일 속성의 클래스가 충돌하면 마지막 값으로 override된다", () => {
      expect(cn("px-4", "px-8")).toBe("px-8");
    });

    it("text-color 충돌 시 마지막 값이 남는다", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("bg-color 충돌 시 마지막 값이 남는다", () => {
      expect(cn("bg-white", "bg-black")).toBe("bg-black");
    });

    it("typo 충돌 시 마지막 값이 남는다", () => {
      expect(cn("typo-body1", "typo-body2")).toBe("typo-body2");
    });
  });

  describe("조건부 클래스", () => {
    it("false 조건은 클래스에서 제외된다", () => {
      expect(cn("px-4", false && "py-2")).toBe("px-4");
    });

    it("true 조건은 클래스에 포함된다", () => {
      expect(cn("px-4", true && "py-2")).toBe("px-4 py-2");
    });

    it("객체 형태로 조건부 클래스를 전달할 수 있다", () => {
      expect(cn({ "px-4": true, "py-2": false })).toBe("px-4");
    });
  });

  describe("경계값", () => {
    it("인자 없이 호출하면 빈 문자열을 반환한다", () => {
      expect(cn()).toBe("");
    });

    it("undefined를 전달하면 무시된다", () => {
      expect(cn(undefined, "px-4")).toBe("px-4");
    });

    it("null을 전달하면 무시된다", () => {
      expect(cn(null, "px-4")).toBe("px-4");
    });

    it("빈 문자열을 전달하면 무시된다", () => {
      expect(cn("", "px-4")).toBe("px-4");
    });

    it("배열 형태로 클래스를 전달할 수 있다", () => {
      expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
    });
  });
});
