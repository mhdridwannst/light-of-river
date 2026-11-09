export const CFG = {
  halfWidth: 4.8,
  gate: { every: 250, heal: 0.35 },
  boatR: 0.55,
  spawnZ: -95,
  nearMissMargin: 0.9,
  speed: { base: 14, max: 32, ramp: 0.18, dashMul: 2.2 },
  flame: {
    decay: 0.04,
    ramp: 0.0004,
    candle: 0.2,
    hit: 0.22,
    dash: 0.12,
    nearMiss: 0.03,
  },
  dash: { time: 0.35 },
  combo: { window: 2.2, max: 8 },
};

export const UPGRADES = [
  { id: "wick", name: "Sumbu panjang", desc: "Api padam lebih lambat", max: 5 },
  {
    id: "magnet",
    name: "Magnet lilin",
    desc: "Jangkauan ambil lilin lebih lebar",
    max: 5,
  },
  { id: "oar", name: "Dayung ringan", desc: "Dash lebih cepat siap", max: 5 },
];

export const upgradeCost = (lvl) => 25 * (lvl + 1);
