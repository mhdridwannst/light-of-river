import * as THREE from "three";
import { rnd } from "./gfx.js";
import { EventBus } from "./core/EventBus.js";
import { Input } from "./core/Input.js";
import { Sfx } from "./core/Sfx.js";
import { Environment } from "./world/Environment.js";
import { Boat } from "./entities/Boat.js";
import { Particles } from "./effects/Particles.js";
import { Run } from "./systems/Run.js";
import { Progression } from "./systems/Progression.js";
import { Hud } from "./ui/Hud.js";
import { Menu } from "./ui/Menu.js";
import { Missions } from "./systems/Missions.js";

const BASE_FOV = 62;
const buzz = (p) => navigator.vibrate?.(p);

/** Composition root: merakit semua modul, menjalankan loop, dan mengatur state (menu, play, over). */
export class Game {
  constructor() {
    this.bus = new EventBus();
    this.input = new Input();
    this.sfx = new Sfx();
    this.prog = new Progression();
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 400);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.querySelector("#app").appendChild(this.renderer.domElement);
    addEventListener("resize", () => this.#resize());
    this.#resize();

    this.env = new Environment(this.scene);
    this.boat = new Boat(this.scene);
    this.fx = new Particles(this.scene);
    this.run = new Run(this.scene, this.bus, this.prog.stats);
    this.missions = new Missions(this.bus);
    this.hud = new Hud(this.bus);
    this.menu = new Menu(this.bus, this.prog);
    Object.assign(this, {
      state: "menu",
      clock: 0,
      last: 0,
      shake: 0,
      freeze: 0,
      slow: 0,
      beat: 0,
      wakeT: 0,
      paused: false,
    });

    this.#wire();
    this.menu.show({
      title: "Perahu Mandailing",
      lead: "Membawa sebuah cahaya untuk menyusuri sungai senja. Ambil lilin, lewati rintangan dengan baik, dan jaga agar apimu tetap menyala.",
      stats: this.prog.data.best ? "Rekor: " + this.prog.data.best : "",
    });
    requestAnimationFrame((t) => this.#frame(t));
  }

  #resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.cam.aspect = innerWidth / innerHeight;
    this.cam.updateProjectionMatrix();
  }

  #wire() {
    const { bus, sfx, fx } = this;
    bus.on("start", () => this.#start());
    bus.on("reward", (r) => {
      if (r.kind === "near") sfx.near();
      else if (r.kind === "gate") {
        sfx.gate();
        this.slow = 0.35; // slow-mo singkat
        buzz([30, 40, 30]);
      } else sfx.pickup(r.combo);
      fx.burst(
        r.pos,
        r.kind === "smash" ? 0xcfe9f0 : 0xffd080,
        r.kind === "gate" ? 30 : 8,
      );
    });
    bus.on("hit", (h) => {
      sfx.hit();
      fx.burst(h.pos, 0xcfe9f0, 14);
      this.shake = 0.6;
      this.freeze = 0.07;
      buzz(70);
    });
    bus.on("dash", () => {
      sfx.dash();
      this.shake = 0.25;
      buzz(20);
    });

    // Jeda: P / Esc, dan otomatis saat tab disembunyikan
    addEventListener("keydown", (e) => {
      if (e.code === "KeyP" || e.code === "Escape") this.#pause(!this.paused);
      if (e.code === "KeyM") this.sfx.muted = !this.sfx.muted;
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.#pause(true);
    });
  }

  #pause(v) {
    if (v && this.state !== "play") return;
    this.paused = v;
    document.body.classList.toggle("paused", v);
    if (!v) this.input.consumeDash();
  }

  #start() {
    this.sfx.unlock();
    document.querySelector("#go").blur();
    this.input.consumeDash();
    this.input.x = 0;
    this.run.stats = this.prog.stats;
    this.run.reset();
    this.boat.reset();
    this.missions.roll(); // misi baru tiap run
    this.beat = 0;
    this.slow = 0;
    this.state = "play";
    document.body.classList.add("playing");
    this.menu.hide();
  }

  #end() {
    this.state = "over";
    document.body.classList.remove("playing");
    const { run } = this,
      res = this.prog.finish(run, this.missions.earned); // hadiah misi dibayar sekali di sini
    this.sfx.tone(110, "sine", 1.2, 0.15);
    this.menu.show({
      title: "Apimu padam",
      lead: `Skor ${run.score} dengan ${run.candles} lilin. Misi ${this.missions.doneCount}/3. Kamu dapat ${res.embers} bara.${res.record ? " Rekor baru!" : ""}`,
      stats: "Rekor: " + this.prog.data.best,
      btn: "Mulai berlayar lagi",
    });
  }

  #frame(now) {
    requestAnimationFrame((t) => this.#frame(t));
    const real = Math.min((now - this.last) / 1000 || 0, 0.05);
    this.last = now;
    if (this.paused) {
      this.renderer.render(this.scene, this.cam);
      return;
    }

    let dt = real;
    if (this.slow > 0) {
      this.slow -= real;
      dt *= 0.45;
    }
    this.clock += dt;
    if (this.freeze > 0) {
      this.freeze -= real;
      dt = 0;
    } // hit-stop

    const { run, boat, input } = this,
      play = this.state === "play";
    if (this.state === "menu") input.x = Math.sin(this.clock * 0.5) * 3;
    else input.update(dt);
    if (play) {
      run.update(dt, boat.x, input.consumeDash(), this.clock);
      if (run.flame <= 0) this.#end();
    }

    this.env.update(dt, play ? run.speed : 7, this.clock);
    this.env.setBiome(play ? run.dist : 0);
    boat.update(dt, input.x, play ? run.drift : 0, this.clock, run.dashing);
    boat.group.visible = run.inv <= 0 || Math.floor(run.inv * 12) % 2 === 0;
    const f = this.state === "menu" ? 1 : run.flame;
    this.env.setLight(f);
    boat.setLight(f, this.clock, run.dashing);

    if (play) {
      this.hud.render(run);
      // jejak air di belakang perahu
      if ((this.wakeT -= dt) <= 0) {
        this.wakeT = run.dashing ? 0.02 : 0.06;
        this.fx.wake(boat.x, run.speed);
      }
      // detak jantung saat api hampir padam
      if (run.flame < 0.25 && (this.beat -= dt) <= 0) {
        this.sfx.heart();
        this.beat = 0.35 + run.flame * 2.4;
      }
    }
    this.hud.setDanger(play ? run.flame : 1);
    this.fx.update(dt);
    this.#camera(dt);
    this.renderer.render(this.scene, this.cam);
  }

  #camera(dt) {
    const { cam, boat, run } = this;
    this.shake = Math.max(0, this.shake - dt * 1.8);
    const s = this.shake * 0.3;
    cam.position.set(boat.x * 0.45 + rnd(-s, s), 4.2 + rnd(-s, s), 7);
    cam.lookAt(boat.x * 0.25, 0.8, -12);
    cam.fov += ((run.dashing ? 78 : BASE_FOV) - cam.fov) * Math.min(1, dt * 8);
    cam.updateProjectionMatrix();
  }
}
