export type RandomSource = () => number;

export function hashSeed(value: string): number {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): RandomSource {
  return () => {
    let next = (seed += 0x6d2b79f5);
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFromSeed(seed: string): RandomSource {
  return mulberry32(hashSeed(seed));
}

export function randomRange(rng: RandomSource, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randomInt(rng: RandomSource, min: number, max: number): number {
  return Math.floor(randomRange(rng, min, max + 1));
}

export function weightedPick<T extends string>(rng: RandomSource, weights: Array<[T, number]>): T {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  let value = rng() * total;
  for (const [entry, weight] of weights) {
    if (value <= weight) return entry;
    value -= weight;
  }
  return weights[weights.length - 1][0];
}

export function stableNoise(rng: RandomSource, size = 64): (x: number, y: number) => number {
  const grid = new Float32Array(size * size);
  for (let index = 0; index < grid.length; index += 1) {
    grid[index] = rng();
  }

  const smooth = (t: number) => t * t * (3 - 2 * t);
  const at = (x: number, y: number) => {
    const wrappedX = ((x % size) + size) % size;
    const wrappedY = ((y % size) + size) % size;
    return grid[wrappedY * size + wrappedX];
  };

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const v00 = at(xi, yi);
    const v10 = at(xi + 1, yi);
    const v01 = at(xi, yi + 1);
    const v11 = at(xi + 1, yi + 1);
    const sx = smooth(xf);
    const sy = smooth(yf);
    const top = v00 + sx * (v10 - v00);
    const bottom = v01 + sx * (v11 - v01);
    return top + sy * (bottom - top);
  };
}
