// mulberry32: 32-bit seedable PRNG, fast + deterministic.
// Returns a new state and a float in [0, 1).

export interface PrngStep {
  state: number;
  value: number;
}

export function nextRng(state: number): PrngStep {
  let s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: s, value };
}

export function rngInt(state: number, min: number, maxExclusive: number): { state: number; value: number } {
  const step = nextRng(state);
  const span = maxExclusive - min;
  return { state: step.state, value: min + Math.floor(step.value * span) };
}

export function rngPick<T>(state: number, arr: readonly T[]): { state: number; value: T } {
  if (arr.length === 0) throw new Error("rngPick: empty array");
  const r = rngInt(state, 0, arr.length);
  return { state: r.state, value: arr[r.value]! };
}

export function rngShuffle<T>(state: number, arr: readonly T[]): { state: number; value: T[] } {
  const out = arr.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const r = rngInt(s, 0, i + 1);
    s = r.state;
    const j = r.value;
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return { state: s, value: out };
}
