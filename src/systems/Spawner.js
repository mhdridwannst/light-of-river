import { CFG } from "../config.js";
import { rnd, clamp } from "../gfx.js";

const W = CFG.halfWidth - 0.3;
const sign = () => (Math.random() < 0.5 ? -1 : 1);
const trail = (x0, n) =>
  Array.from({ length: n }, (_, i) => [
    "candle",
    clamp(x0 + Math.sin(i * 0.9) * 2, -W, W),
    -i * 4.5,
  ]);

// Pola: [tipe, x, offset z]. `len` = kedalaman pola, `tier` = tingkat kesulitan minimum.
const PATTERNS = [
  {
    tier: 0,
    len: 12,
    make: () => [[Math.random() < 0.6 ? "rock" : "log", rnd(-W, W), 0]],
  },
  { tier: 0, len: 24, make: () => trail(rnd(-3, 3), 5) },
  {
    tier: 0,
    len: 10,
    make: () => {
      const x = rnd(-2.4, 2.4);
      return [
        ["rock", x - 2.7, 0],
        ["rock", x + 2.7, 0],
        ["candle", x, -3],
      ];
    },
  },
  {
    tier: 1,
    len: 36,
    make: () => {
      const s = sign();
      return [0, 1, 2, 3].flatMap((i) => [
        ["rock", s * (i % 2 ? -3 : 3), -i * 9],
        ["candle", s * (i % 2 ? 3 : -3), -i * 9 - 4.5],
      ]);
    },
  },
  {
    tier: 1,
    len: 24,
    make: () => {
      const x = rnd(-2.5, 1.5);
      return [
        ["whirl", x, 0],
        ["candle", x + 3.4, -3],
        ["candle", x + 3.4, -8],
      ];
    },
  },
  {
    tier: 2,
    len: 40,
    make: () => [
      ["whirl", -2.5, 0],
      ["log", 2.5, -10],
      ["whirl", 2.5, -22],
      ["candle", -3.5, -26],
      ["rock", -2, -30],
    ],
  },
];

export class Spawner {
  until = 20;

  /** Dipanggil tiap frame dengan jarak yang ditempuh dunia; mengembalikan spesifikasi entitas baru. */
  next(travel, dist) {
    this.until -= travel;
    if (this.until > 0) return [];
    const tier = Math.min(2, Math.floor(dist / 150));
    const pool = PATTERNS.filter((p) => p.tier <= tier);
    const p = pool[Math.floor(Math.random() * pool.length)];
    this.until = p.len + Math.max(12, 34 - dist / 20);
    return p.make().map(([t, x, z]) => [t, x, CFG.spawnZ + z]);
  }
}
