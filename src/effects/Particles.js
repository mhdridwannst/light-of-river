import * as THREE from "three";
import { rnd } from "../gfx.js";

const GEO = new THREE.SphereGeometry(0.13, 6, 6);
const MAX = 400;

/** Partikel memakai pool: mesh dan material dipakai ulang, tidak dibuat/dibuang tiap efek. */
export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.pool = [];
  }

  #spawn(color, life, decay, grav) {
    if (this.list.length >= MAX) return null;
    const m =
      this.pool.pop() ??
      new THREE.Mesh(GEO, new THREE.MeshBasicMaterial({ transparent: true }));
    m.material.color.setHex(color);
    m.material.opacity = 1;
    m.userData.v ??= new THREE.Vector3();
    Object.assign(m.userData, { life, decay, grav });
    this.scene.add(m);
    this.list.push(m);
    return m;
  }

  burst(pos, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const m = this.#spawn(color, 1, 1.8, 14);
      if (!m) return;
      m.scale.setScalar(1);
      m.position.set(pos.x, 0.3, pos.z);
      m.userData.v.set(rnd(-4, 4), rnd(3, 7), rnd(-3, 3));
    }
  }

  /** Buih kecil di belakang perahu; air mengalir ke arah kamera (+z). */
  wake(x, speed) {
    const m = this.#spawn(0xbfe8e4, 1, 1.7, 1.5);
    if (!m) return;
    m.scale.setScalar(rnd(0.5, 0.9));
    m.position.set(x + rnd(-0.4, 0.4), 0.14, 0.9);
    m.userData.v.set(rnd(-0.7, 0.7), rnd(0.3, 0.9), speed * 0.6);
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i],
        d = m.userData;
      d.v.y -= d.grav * dt;
      m.position.addScaledVector(d.v, dt);
      d.life -= dt * d.decay;
      m.material.opacity = Math.max(d.life, 0);
      if (d.life <= 0 || m.position.y < 0) {
        this.scene.remove(m);
        this.pool.push(m);
        this.list.splice(i, 1);
      }
    }
  }
}
