const $ = (s) => document.querySelector(s);
const LABEL = {
  candle: "Lilin",
  near: "Nyaris!",
  smash: "Hancur!",
  gate: "Gerbang Lentera!",
};

export class Hud {
  constructor(bus) {
    this.fill = $("#fill");
    this.score = $("#dist");
    this.cnd = $("#cnd");
    this.combo = $("#combo");
    this.dash = $("#dash");
    this.pop = $("#pop");
    this.ms = $("#missions");
    this.vig = document.createElement("div");
    this.vig.id = "vig";
    document.body.appendChild(this.vig);
    bus.on("reward", (r) => this.#popup(`${LABEL[r.kind]} +${r.points}`));
    bus.on("mission", (m) => this.#popup(`Misi selesai, +${m.reward} bara`));
    bus.on("missions", (list) => {
      this.ms.innerHTML = list
        .map(
          (m) =>
            `<div class="${m.done ? "done" : ""}">${m.done ? "✓" : "○"} ${m.text} (${Math.min(m.progress, m.goal)}/${m.goal})</div>`,
        )
        .join("");
    });
  }

  #popup(text) {
    const el = document.createElement("div");
    el.className = "pop";
    el.textContent = text;
    this.pop.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /** Vignette merah berdenyut saat api di bawah 30%. f = 0..1 */
  setDanger(f) {
    this.vig.style.opacity = Math.max(0, (0.3 - f) / 0.3).toFixed(2);
  }

  render(run) {
    this.fill.style.width = run.flame * 100 + "%";
    this.score.textContent = run.score;
    this.cnd.textContent = "lilin " + run.candles;
    this.combo.textContent = run.combo > 1 ? "kombo x" + run.combo : "";
    this.dash.classList.toggle("ready", run.dashCd <= 0);
  }
}
