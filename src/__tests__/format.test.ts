import { describe, it, expect } from "vitest";
import { formatNumber } from "@/utils/format";

describe("formatNumber", () => {
  it("formats a number using ja-JP locale", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats a negative number", () => {
    expect(formatNumber(-1234)).toBe("-1,234");
  });
});
