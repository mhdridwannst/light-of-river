import * as THREE from "three";
import { CFG } from "../config.js";
import { halo, clamp } from "../gfx.js";

export class Boat {
  constructor(scene) {
    const g = (this.group = new THREE.Group());
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.55, 0.38, 6),
      new THREE.MeshStandardMaterial({
        color: 0x8a5a3a,
        flatShading: true,
        roughness: 0.8,
      }),
    );
    hull.scale.z = 1.8;
    this.lanternMat = new THREE.MeshStandardMaterial({
      color: 0xffd9a0,
      emissive: 0xffa84a,
      transparent: true,
      opacity: 0.92,
    });
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.34, 0.62, 8),
      this.lanternMat,
    );
    lantern.position.y = 0.5;
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.24, 8),
      new THREE.MeshStandardMaterial({ color: 0x5a2f2a, flatShading: true }),
    );
    cap.position.y = 0.93;
    this.halo = halo(0xffa447, 4);
    this.halo.position.y = 0.55;
    this.light = new THREE.PointLight(0xffa447, 50, 0, 2);
    this.light.position.y = 1.1;
    g.add(hull, lantern, cap, this.halo, this.light);
    scene.add(g);
  }

  get x() {
    return this.group.position.x;
  }
  reset() {
    this.group.position.x = 0;
  }

  update(dt, targetX, drift, t, dashing) {
    const g = this.group,
      px = g.position.x;
    g.position.x = clamp(
      px + (targetX - px) * Math.min(1, dt * 6) + drift * dt,
      -CFG.halfWidth,
      CFG.halfWidth,
    );
    const vx = (g.position.x - px) / Math.max(dt, 0.001);
    g.position.y = Math.sin(t * 2) * 0.05 + 0.1;
    g.rotation.z = -vx * 0.03 + Math.sin(t * 1.6) * 0.03;
    g.rotation.y = -vx * 0.02;
    g.scale.z += ((dashing ? 1.3 : 1) - g.scale.z) * Math.min(1, dt * 10);
  }

  setLight(f, t, dashing) {
    const flick = 0.92 + Math.sin(t * 14) * 0.08,
      k = dashing ? 1.5 : 1;
    this.light.intensity = (14 + 40 * f) * flick * k;
    this.lanternMat.emissiveIntensity = (0.3 + 1.4 * f) * flick * k;
    this.halo.material.opacity = 0.3 + 0.55 * f;
    this.halo.scale.setScalar((1.8 + 2.4 * f) * k);
  }
}
