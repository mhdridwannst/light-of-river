import { UPGRADES } from "../config.js";

const $ = (s) => document.querySelector(s);

export class Menu {
  constructor(bus, prog) {
    this.prog = prog;
    this.el = $("#ov");
    $("#go").onclick = () => bus.emit("start");
  }

  show({ title, lead, stats = "", btn = "Mulai berlayar" }) {
    $("#title").textContent = title;
    $("#lead").textContent = lead;
    $("#stats").textContent = stats;
    $("#go").textContent = btn;
    this.#shop();
    this.el.classList.remove("hide");
  }
  hide() {
    this.el.classList.add("hide");
  }

  #shop() {
    const box = $("#shop"),
      d = this.prog.data;
    box.replaceChildren();
    $("#embers").textContent = "Bara: " + d.embers;
    for (const u of UPGRADES) {
      const lvl = d.levels[u.id],
        maxed = lvl >= u.max,
        b = document.createElement("button");
      b.className = "upg";
      b.disabled = maxed || !this.prog.canBuy(u.id);
      b.innerHTML = `<b>${u.name}</b><span>${u.desc}</span><em>${maxed ? "Maksimal" : this.prog.cost(u.id) + " bara"} (Lv ${lvl}/${u.max})</em>`;
      b.onclick = () => {
        this.prog.buy(u.id);
        this.#shop();
      };
      box.appendChild(b);
    }
  }
}
