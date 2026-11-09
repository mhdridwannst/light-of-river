const KEY = "lumen-save-v2";
const DEFAULT = { best: 0, embers: 0, levels: { wick: 0, magnet: 0, oar: 0 } };

export const Storage = {
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY)) ?? {};
      return { ...DEFAULT, ...s, levels: { ...DEFAULT.levels, ...s.levels } };
    } catch {
      return structuredClone(DEFAULT);
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* abaikan */
    }
  },
};
