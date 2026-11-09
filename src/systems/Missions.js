const POOL = [
  { kind: "candle", text: "Ambil 15 lilin", goal: 15, reward: 30 },
  {
    kind: "near",
    text: "Lewati 6 rintangan dengan nyaris",
    goal: 6,
    reward: 35,
  },
  {
    kind: "smash",
    text: "Hancurkan 4 rintangan dengan dash",
    goal: 4,
    reward: 35,
  },
  { kind: "gate", text: "Lewati 2 Gerbang Lentera", goal: 2, reward: 40 },
  { kind: "combo", text: "Capai kombo x6", goal: 6, reward: 40 },
];

export class Missions {
  list = [];

  constructor(bus) {
    this.bus = bus;
    bus.on("reward", (e) => this.#track(e));
  }

  roll() {
    this.list = [...POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((m) => ({ ...m, progress: 0, done: false }));
    this.bus.emit("missions", this.list);
  }

  get doneCount() {
    return this.list.filter((m) => m.done).length;
  }
  get earned() {
    return this.list.filter((m) => m.done).reduce((s, m) => s + m.reward, 0);
  }

  #track(e) {
    for (const m of this.list) {
      if (m.done) continue;
      if (m.kind === "combo") m.progress = Math.max(m.progress, e.combo);
      else if (m.kind === e.kind) m.progress++;
      if (m.progress >= m.goal) {
        m.done = true;
        this.bus.emit("mission", m);
      }
    }
    this.bus.emit("missions", this.list);
  }
}
