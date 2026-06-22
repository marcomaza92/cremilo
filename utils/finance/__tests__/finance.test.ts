import { describe, it, expect } from "vitest";
import { calculateImpuestoSellos } from "../calculateImpuestoSellos";
import { calculateROI } from "../calculateROI";
import { calculateRemainingDebt } from "../calculateRemainingDebt";
import { convertCurrency } from "../convertCurrency";

describe("calculateImpuestoSellos", () => {
  it("returns 1.49% of the given amount", () => {
    expect(calculateImpuestoSellos(1000)).toBeCloseTo(14.9);
  });

  it("returns 0 for a zero amount", () => {
    expect(calculateImpuestoSellos(0)).toBe(0);
  });

  it("handles negative amounts", () => {
    expect(calculateImpuestoSellos(-1000)).toBeCloseTo(-14.9);
  });

  it("handles fractional amounts", () => {
    expect(calculateImpuestoSellos(100.5)).toBeCloseTo(1.49745);
  });
});

describe("calculateROI", () => {
  it("returns the correct ROI percentage", () => {
    expect(calculateROI(1000, 150)).toBe(15);
  });

  it("returns 0 when interest is 0", () => {
    expect(calculateROI(1000, 0)).toBe(0);
  });

  it("handles negative interest (loss)", () => {
    expect(calculateROI(1000, -200)).toBe(-20);
  });

  it("returns Infinity when capital is 0", () => {
    expect(calculateROI(0, 100)).toBe(Infinity);
  });

  it("handles fractional values", () => {
    expect(calculateROI(200, 30)).toBe(15);
  });
});

describe("calculateRemainingDebt", () => {
  it("returns remaining balance after N installments", () => {
    expect(calculateRemainingDebt(12000, 1000, 4)).toBe(8000);
  });

  it("returns total when no installments paid", () => {
    expect(calculateRemainingDebt(5000, 500, 0)).toBe(5000);
  });

  it("returns 0 when fully paid", () => {
    expect(calculateRemainingDebt(6000, 1000, 6)).toBe(0);
  });

  it("returns negative when overpaid", () => {
    expect(calculateRemainingDebt(6000, 1000, 7)).toBe(-1000);
  });

  it("handles zero installment amount", () => {
    expect(calculateRemainingDebt(5000, 0, 10)).toBe(5000);
  });
});

describe("convertCurrency", () => {
  it("converts amount using the given rate", () => {
    expect(convertCurrency(100, 1200)).toBe(120000);
  });

  it("returns 0 when amount is 0", () => {
    expect(convertCurrency(0, 1200)).toBe(0);
  });

  it("returns 0 when rate is 0", () => {
    expect(convertCurrency(100, 0)).toBe(0);
  });

  it("handles fractional rates", () => {
    expect(convertCurrency(200, 0.5)).toBe(100);
  });

  it("handles negative amounts", () => {
    expect(convertCurrency(-50, 2)).toBe(-100);
  });
});
