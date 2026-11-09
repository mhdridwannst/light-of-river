import { CFG } from "../config.js";
import { clamp } from "../gfx.js";

export class Input {
  x = 0;
  #dash = false;
  #keys = {};

  constructor() {
    const aim = (e) => {
      this.x = (e.clientX / innerWidth - 0.5) * 14;
    };
    addEventListener("pointermove", aim);
    addEventListener("pointerdown", aim);
    addEventListener("keydown", (e) => {
      this.#keys[e.code] = true;
      if (e.code === "Space" || e.code === "ShiftLeft") {
        this.#dash = true;
        e.preventDefault();
      }
    });
    addEventListener("keyup", (e) => {
      this.#keys[e.code] = false;
    });
    document.querySelector("#dash").addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      this.#dash = true;
    });
  }

  update(dt) {
    const k = this.#keys;
    if (k.KeyA || k.ArrowLeft) this.x -= 12 * dt;
    if (k.KeyD || k.ArrowRight) this.x += 12 * dt;
    this.x = clamp(this.x, -CFG.halfWidth, CFG.halfWidth);
  }

  consumeDash() {
    const d = this.#dash;
    this.#dash = false;
    return d;
  }
}
