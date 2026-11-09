import { CFG } from "../config.js";
import { Spawner } from "./Spawner.js";
import { createEntity, animate } from "../entities/Entities.js";

/** Semua aturan permainan ada di sini. Tidak ada kode render atau DOM. */
export class Run {
  constructor(scene, bus, stats) {
    this.scene = scene;
    this.bus = bus;
    this.stats = stats;
    this.entities = [];
    this.reset();
  }

  reset() {
    this.entities.forEach((e) => this.scene.remove(e.mesh));
    Object.assign(this, {
      entities: [],
      spawner: new Spawner(),
      t: 0,
      dist: 0,
      bonus: 0,
      flame: 1,
      candles: 0,
      combo: 1,
      comboT: 0,
      dashT: 0,
      dashCd: 0,
      inv: 0,
      drift: 0,
      nextGate: CFG.gate.every,
    });
  }

  get score() {
    return Math.floor(this.dist) + this.bonus;
  }
  get dashing() {
    return this.dashT > 0;
  }
  get speed() {
    const s = CFG.speed,
      v = Math.min(s.max, s.base + this.t * s.ramp);
    return this.dashing ? v * s.dashMul : v;
  }

  update(dt, boatX, wantDash, clock) {
    const F = CFG.flame,
      travel = this.speed * dt;
    this.t += dt;
    this.dist += travel * 0.5;
    this.flame -= (F.decay + this.t * F.ramp) * this.stats.decayMul * dt;
    this.inv = Math.max(0, this.inv - dt);
    this.dashT = Math.max(0, this.dashT - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    if ((this.comboT -= dt) <= 0) this.combo = 1;

    if (wantDash && this.dashCd <= 0 && this.flame > F.dash + 0.02) {
      this.dashT = CFG.dash.time;
      this.dashCd = this.stats.dashCd;
      this.flame -= F.dash;
      this.bus.emit("dash");
    }

    if (this.dist >= this.nextGate) {
      this.nextGate += CFG.gate.every;
      const g = createEntity("gate", 0, CFG.spawnZ);
      this.scene.add(g.mesh);
      this.entities.push(g);
    }

    for (const [type, x, z] of this.spawner.next(travel, this.dist)) {
      const e = createEntity(type, x, z);
      this.scene.add(e.mesh);
      this.entities.push(e);
    }

    this.drift = 0;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i],
        p = e.mesh.position,
        prevZ = p.z;
      p.z += travel;
      animate(e, clock);
      if (this.#interact(e, p.x - boatX, prevZ) || p.z > 10) {
        this.scene.remove(e.mesh);
        this.entities.splice(i, 1);
      }
    }
    this.flame = Math.max(0, this.flame);
  }

  /** Mengembalikan true bila entitas habis dipakai (diambil, hancur, atau menabrak). */
  #interact(e, dx, prevZ) {
    const p = e.mesh.position,
      z = p.z,
      d2 = dx * dx + z * z;

    if (e.type === "gate") {
      if (!e.passed && z >= 0) {
        e.passed = true;
        this.flame = Math.min(1, this.flame + CFG.gate.heal);
        this.#reward("gate", 100, p);
      }
      return false;
    }

    if (e.type === "candle") {
      if (Math.abs(dx) > this.stats.magnet || Math.abs(z) > 0.9) return false;
      this.flame = Math.min(1, this.flame + CFG.flame.candle);
      this.candles++;
      this.#reward("candle", 10, p);
      return true;
    }

    if (e.type === "whirl" && !this.dashing) {
      const d = Math.sqrt(d2);
      if (d < e.pull) this.drift += Math.sign(dx) * 14 * (1 - d / e.pull);
    }

    const hitR = e.r + CFG.boatR;
    if (d2 < hitR * hitR) {
      if (this.dashing) {
        if (e.type === "whirl") return false;
        this.#reward("smash", 20, p);
        return true;
      }
      if (this.inv <= 0) {
        this.#hit(p);
        return true;
      }
      return false;
    }

    if (!e.passed && prevZ < 0 && z >= 0) {
      e.passed = true;
      if (Math.abs(dx) < hitR + CFG.nearMissMargin) {
        this.flame = Math.min(1, this.flame + CFG.flame.nearMiss);
        this.#reward("near", 15, p);
      }
    }
    return false;
  }

  #reward(kind, base, pos) {
    const risk = this.flame < 0.25 ? 1.5 : 1; // api hampir padam = poin x1,5
    const points = Math.round(base * this.combo * risk);
    this.bonus += points;
    this.combo = Math.min(CFG.combo.max, this.combo + 1);
    this.comboT = CFG.combo.window;
    this.bus.emit("reward", { kind, points, combo: this.combo, pos });
  }

  #hit(pos) {
    this.flame -= CFG.flame.hit;
    this.inv = 1.1;
    this.combo = 1;
    this.bus.emit("hit", { pos });
  }
}
