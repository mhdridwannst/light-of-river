import { UPGRADES, upgradeCost } from "../config.js";
import { Storage } from "../core/Storage.js";

export class Progression {
  data = Storage.load();

  get stats() {
    const l = this.data.levels;
    return {
      decayMul: 1 - 0.08 * l.wick,
      magnet: 1 + 0.25 * l.magnet,
      dashCd: 1.6 - 0.2 * l.oar,
    };
  }
  cost(id) {
    return upgradeCost(this.data.levels[id]);
  }
  canBuy(id) {
    const u = UPGRADES.find((x) => x.id === id);
    return this.data.levels[id] < u.max && this.data.embers >= this.cost(id);
  }
  buy(id) {
    if (!this.canBuy(id)) return;
    this.data.embers -= this.cost(id);
    this.data.levels[id]++;
    Storage.save(this.data);
  }
  finish(run, extra = 0) {
    const d = this.data,
      embers = Math.floor(run.score / 20) + run.candles + extra,
      record = run.score > d.best;
    if (record) d.best = run.score;
    d.embers += embers;
    Storage.save(d);
    return { embers, record };
  }
}
