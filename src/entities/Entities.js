import * as THREE from "three";
import { halo, rnd } from "../gfx.js";

const std = (color, extra) =>
  new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.9,
    ...extra,
  });
const G = {
  rock: new THREE.DodecahedronGeometry(1, 0),
  log: new THREE.CylinderGeometry(0.32, 0.32, 2.6, 8),
  wax: new THREE.CylinderGeometry(0.13, 0.15, 0.55, 8),
  flame: new THREE.SphereGeometry(0.14, 8, 8),
  rings: [1.2, 2.2, 3.1].map((r) => new THREE.TorusGeometry(r, 0.06, 6, 40)),
  eye: new THREE.CircleGeometry(0.8, 20),
  post: new THREE.BoxGeometry(0.5, 4.4, 0.5),
  beam: new THREE.BoxGeometry(13.6, 0.4, 0.4),
};
const M = {
  rock: std(0x7a8794),
  log: std(0x8a5e3e),
  gate: std(0xa8432f),
  wax: std(0xf3e2c0),
  flame: new THREE.MeshBasicMaterial({ color: 0xffd080 }),
  ring: new THREE.MeshBasicMaterial({
    color: 0x8fd3d0,
    transparent: true,
    opacity: 0.55,
  }),
  eye: new THREE.MeshBasicMaterial({ color: 0x061418 }),
};

/** Tiap builder mengembalikan [mesh, radius tabrakan]. */
const BUILD = {
  rock() {
    const m = new THREE.Mesh(G.rock, M.rock),
      s = rnd(0.8, 1.2);
    m.scale.set(s, s * 0.8, s);
    return [m, s * 0.95];
  },
  log() {
    const inner = new THREE.Mesh(G.log, M.log);
    inner.rotation.z = Math.PI / 2;
    const g = new THREE.Group();
    g.add(inner);
    g.rotation.y = rnd(-0.8, 0.8);
    return [g, 1.05];
  },
  whirl() {
    const g = new THREE.Group();
    G.rings.forEach((r) => {
      const m = new THREE.Mesh(r, M.ring);
      m.rotation.x = Math.PI / 2;
      g.add(m);
    });
    const eye = new THREE.Mesh(G.eye, M.eye);
    eye.rotation.x = -Math.PI / 2;
    g.add(eye);
    return [g, 0.8];
  },
  candle() {
    const g = new THREE.Group(),
      f = new THREE.Mesh(G.flame, M.flame);
    f.scale.set(0.7, 1.4, 0.7);
    f.position.y = 0.42;
    const h = halo(0xffb454, 1.8);
    h.position.y = 0.45;
    g.add(new THREE.Mesh(G.wax, M.wax), f, h);
    return [g, 0.4];
  },
  gate() {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(G.post, M.gate);
      post.position.set(s * 6.3, 2.2, 0);
      const lamp = new THREE.Mesh(G.flame, M.flame);
      lamp.scale.setScalar(3);
      lamp.position.set(s * 6.3, 4.8, 0);
      const h = halo(0xffb454, 7);
      h.position.set(s * 6.3, 4.8, 0);
      g.add(post, lamp, h);
    }
    const beam = new THREE.Mesh(G.beam, M.gate);
    beam.position.y = 4.4;
    g.add(beam);
    return [g, 0];
  },
};
const BASE_Y = { candle: 0.35, whirl: 0.3, gate: 0 };

export function createEntity(type, x, z) {
  const [mesh, r] = BUILD[type]();
  mesh.position.set(x, BASE_Y[type] ?? 0.05, z);
  return {
    type,
    mesh,
    r,
    pull: type === "whirl" ? 3.2 : 0,
    ph: Math.random() * 6,
    passed: false,
  };
}

export function animate(e, t) {
  if (e.type === "whirl")
    e.mesh.children.forEach((c, i) =>
      c.scale.setScalar(1 + 0.07 * Math.sin(t * 3 + i * 1.5)),
    );
  else if (e.type !== "gate")
    e.mesh.position.y =
      (BASE_Y[e.type] ?? 0.05) + Math.sin(t * 2.5 + e.ph) * 0.06;
}
