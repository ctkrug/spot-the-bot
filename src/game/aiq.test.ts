import { describe, expect, it } from "vitest";
import { aiqFor, classify, topPercent } from "./aiq";

describe("aiqFor", () => {
  it("anchors the spec: 5/10 is dead average, 10/10 is 160, 0/10 is 40", () => {
    expect(aiqFor(5, 10)).toBe(100);
    expect(aiqFor(10, 10)).toBe(160);
    expect(aiqFor(0, 10)).toBe(40);
  });

  it("steps 12 points per correct answer on a ten-round", () => {
    expect(aiqFor(6, 10)).toBe(112);
    expect(aiqFor(9, 10)).toBe(148);
  });

  it("scales by proportion for other round sizes", () => {
    expect(aiqFor(1, 2)).toBe(100);
    expect(aiqFor(2, 2)).toBe(160);
    expect(aiqFor(0, 0)).toBe(100);
  });
});

describe("classify", () => {
  it("crowns a perfect round and roasts a perfect miss", () => {
    expect(classify(160).title).toBe("Chief Turing Examiner");
    expect(classify(40).title).toBe("Certified Mark");
  });

  it("calls 100 what it is", () => {
    expect(classify(100).title).toBe("Average Human");
  });

  it("covers every score without gaps", () => {
    for (let s = 0; s <= 10; s++) {
      expect(classify(aiqFor(s, 10)).title).toBeTruthy();
    }
  });
});

describe("topPercent", () => {
  it("is top 50% at exactly average", () => {
    expect(topPercent(100)).toBe("top 50%");
  });

  it("is a small elite slice at 160 (+4 SD)", () => {
    const pct = parseFloat(topPercent(160).replace("top ", ""));
    expect(pct).toBeLessThan(0.1);
  });

  it("is honest at the bottom of the scale", () => {
    const pct = parseFloat(topPercent(40).replace("top ", ""));
    expect(pct).toBeGreaterThan(99);
  });
});
