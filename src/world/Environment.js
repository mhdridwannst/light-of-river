import * as THREE from "three";
import { haloTexture, rnd } from "../gfx.js";

const FOG = 0x5a3d5c;
const lit = (color, extra) =>
  new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 1,
    ...extra,
  });

const BIOMES = [
  { fog: new THREE.Color(0x5a3d5c), sky: new THREE.Color(0xffffff) }, // senja
  { fog: new THREE.Color(0x1d2a4a), sky: new THREE.Color(0x7d88c8) }, // malam
  { fog: new THREE.Color(0x7a5a6e), sky: new THREE.Color(0xffe0cc) }, // fajar
];

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.scroll = 0;
    scene.background = new THREE.Color(FOG);
    scene.fog = new THREE.Fog(FOG, 25, 95);
    this.skyTint = new THREE.Color(1, 1, 1);
    this.fogCol = new THREE.Color(FOG);
    this.#sky();
    this.#lights();
    this.#river();
    this.#forest();
    this.#fireflies();
  }

  #sky() {
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 520;
    const g = c.getContext("2d"),
      hz = 322;
    const gr = g.createLinearGradient(0, 0, 0, hz);
    [
      [0, "#1f1a3a"],
      [0.55, "#5b3a68"],
      [0.85, "#c4627a"],
      [1, "#f4a860"],
    ].forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr;
    g.fillRect(0, 0, 1000, hz);
    g.fillStyle = "#5a3d5c";
    g.fillRect(0, hz, 1000, 520 - hz);
    const rg = g.createRadialGradient(500, hz, 0, 500, hz, 300);
    rg.addColorStop(0, "rgba(255,214,150,.9)");
    rg.addColorStop(1, "rgba(255,170,90,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 1000, hz);
    g.fillStyle = "#fff0c8";
    g.beginPath();
    g.arc(500, hz - 26, 44, 0, 7);
    g.fill();
    ["#3b2748", "#2a1c38"].forEach((col, j) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, hz);
      for (let x = 0; x <= 1000; x += 20)
        g.lineTo(
          x,
          hz -
            16 -
            j * 10 -
            Math.abs(Math.sin(x * 0.012 + j * 2)) * (42 - j * 14) -
            Math.sin(x * 0.05 + j) * 6,
        );
      g.lineTo(1000, hz);
      g.fill();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.skyMat = new THREE.MeshBasicMaterial({
      map: tex,
      fog: false,
      toneMapped: false,
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(500, 260), this.skyMat);
    sky.position.set(0, 32, -140);
    this.scene.add(sky);
  }

  #lights() {
    this.hemi = new THREE.HemisphereLight(0xc99ab8, 0x3a4a50, 1);
    this.sun = new THREE.DirectionalLight(0xffb978, 1.2);
    this.sun.position.set(-20, 12, -30);
    this.fill = new THREE.DirectionalLight(0xffd7b0, 0.6);
    this.fill.position.set(6, 10, 12);
    this.amb = new THREE.AmbientLight(0x8a6a8a, 0.5);
    this.scene.add(this.hemi, this.sun, this.fill, this.amb);
  }

  #river() {
    const geo = (this.wGeo = new THREE.PlaneGeometry(14, 200, 24, 80));
    geo.rotateX(-Math.PI / 2);
    this.wBase = geo.attributes.position.array.slice();
    const water = new THREE.Mesh(
      geo,
      lit(0x2f8a8f, { roughness: 0.3, metalness: 0.1, emissive: 0x0d3a40 }),
    );
    water.position.z = -70;
    this.scene.add(water);
    const bank = lit(0x4d7a47),
      mud = lit(0x8a7448);
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 240), bank);
      b.position.set(s * 26.2, -0.2, -70);
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 240), mud);
      m.position.set(s * 6.9, 0.1, -70);
      this.scene.add(b, m);
    }
  }

  #forest() {
    const leaf = [0x3d6b52, 0x4f8a55, 0xd8813f, 0x7a9a3a].map((c) => lit(c)),
      trunk = lit(0x5a4030);
    const gTrunk = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6);
    const gLow = new THREE.ConeGeometry(1.5, 2.6, 7),
      gTop = new THREE.ConeGeometry(1.1, 2.2, 7);
    this.trees = Array.from({ length: 46 }, () => {
      const t = new THREE.Group(),
        l = leaf[Math.floor(Math.random() * leaf.length)];
      [
        [gTrunk, trunk, 0.7],
        [gLow, l, 2.4],
        [gTop, l, 3.8],
      ].forEach(([g, m, y]) => {
        const mesh = new THREE.Mesh(g, m);
        mesh.position.y = y;
        t.add(mesh);
      });
      t.scale.setScalar(rnd(0.8, 1.8));
      this.#place(t, rnd(-110, 10));
      this.scene.add(t);
      return t;
    });
  }
  #place(t, z) {
    t.position.set((Math.random() < 0.5 ? -1 : 1) * rnd(8.5, 30), 1.3, z);
    t.rotation.y = rnd(0, 6);
  }

  #fireflies() {
    const n = 90;
    this.fp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) this.#fly(i, rnd(-70, 8));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.fp, 3));
    this.flies = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xf3e58a,
        size: 0.35,
        map: haloTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.flies);
  }
  #fly(i, z) {
    this.fp.set([rnd(-24, 24), rnd(0.8, 6), z], i * 3);
  }

  update(dt, speed, t) {
    this.scroll += speed * dt;
    const p = this.wGeo.attributes.position.array,
      b = this.wBase;
    for (let i = 0; i < p.length; i += 3)
      p[i + 1] =
        Math.sin(b[i] * 0.5 + t * 1.2) * 0.1 +
        Math.sin((b[i + 2] - this.scroll) * 0.35 + t) * 0.14;
    this.wGeo.attributes.position.needsUpdate = true;
    for (const tr of this.trees) {
      tr.position.z += speed * dt;
      if (tr.position.z > 12) this.#place(tr, tr.position.z - 130);
    }
    const f = this.fp;
    for (let i = 0; i < f.length / 3; i++) {
      f[i * 3 + 2] += speed * dt * 0.6;
      f[i * 3 + 1] += Math.sin(t * 1.5 + i) * 0.01;
      if (f[i * 3 + 2] > 8) this.#fly(i, -70);
    }
    this.flies.geometry.attributes.position.needsUpdate = true;
  }

  /** f = 0..1, makin kecil api makin gelap dan kabut makin rapat. */
  setLight(f) {
    this.hemi.intensity = 0.55 + 0.6 * f;
    this.sun.intensity = 0.5 + 0.8 * f;
    this.amb.intensity = 0.25 + 0.3 * f;
    this.scene.fog.near = 14 + 14 * f;
    this.scene.fog.far = 55 + 45 * f;
    this.skyMat.color.copy(this.skyTint).multiplyScalar(0.55 + 0.45 * f);
  }

  setBiome(dist) {
    const k = dist / 350,
      n = BIOMES.length,
      i = Math.floor(k) % n,
      j = (i + 1) % n,
      f = Math.min(1, Math.max(0, ((k % 1) - 0.6) / 0.4));
    this.fogCol.copy(BIOMES[i].fog).lerp(BIOMES[j].fog, f);
    this.skyTint.copy(BIOMES[i].sky).lerp(BIOMES[j].sky, f);
    this.scene.background.copy(this.fogCol);
    this.scene.fog.color.copy(this.fogCol);
  }
}
