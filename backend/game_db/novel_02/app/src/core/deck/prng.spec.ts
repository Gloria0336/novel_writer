import { describe, expect, it } from "vitest";
import { nextRng, rngInt, rngPick, rngShuffle } from "./prng";

describe("PRNG (mulberry32)", () => {
  it("以相同 seed 開始的序列必定相同", () => {
    const a = [nextRng(1234)];
    const b = [nextRng(1234)];
    for (let i = 0; i < 20; i++) {
      a.push(nextRng(a[a.length - 1]!.state));
      b.push(nextRng(b[b.length - 1]!.state));
    }
    expect(a).toEqual(b);
  });

  it("產生的值落在 [0, 1)", () => {
    let s = 42;
    for (let i = 0; i < 100; i++) {
      const r = nextRng(s);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      s = r.state;
    }
  });

  it("rngInt 落在 [min, max)", () => {
    let s = 99;
    for (let i = 0; i < 50; i++) {
      const r = rngInt(s, 5, 10);
      expect(r.value).toBeGreaterThanOrEqual(5);
      expect(r.value).toBeLessThan(10);
      s = r.state;
    }
  });

  it("rngPick 從陣列中選一個元素", () => {
    const r = rngPick(123, ["a", "b", "c", "d"]);
    expect(["a", "b", "c", "d"]).toContain(r.value);
  });

  it("rngShuffle 不改變元素集合，順序為決定性", () => {
    const arr = [1, 2, 3, 4, 5];
    const r1 = rngShuffle(7, arr);
    const r2 = rngShuffle(7, arr);
    expect(r1.value).toEqual(r2.value);
    expect([...r1.value].sort()).toEqual(arr);
  });

  it("不同 seed 產生不同 shuffle", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const r1 = rngShuffle(7, arr);
    const r2 = rngShuffle(8, arr);
    expect(r1.value).not.toEqual(r2.value);
  });
});
