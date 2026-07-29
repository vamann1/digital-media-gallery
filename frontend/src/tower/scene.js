// =============================================================================
// The Tower scene — framework-agnostic three.js, config-driven.
//
// Renders N hexagonal towers (one per medium) on a ring (config.towerLayout()).
// Each face is either a SHELF (media), a PATHWAY (doorway + bridge to a
// neighbour) or the RESERVED face (courtyard-facing). Non-media faces carry a
// bright frame and a tessellated wireframe panel. Towers are joined by bent
// walkway decks that meet each doorway perpendicularly.
//
// It owns the canvas, input, and animation. The HUD is React's; the scene talks
// to it through `callbacks`.
//
//   createTowerScene({ container, catalog, reduced, callbacks })
//     -> { dispose, enter, goLevel, setTower, selectRandom, deselect }
// =============================================================================

import * as THREE from 'three';
import { GEOMETRY, PER_ROW, FACE_ROLE, towerLayout } from './config.js';

export function createTowerScene({ container, catalog, reduced = false, callbacks = {} }) {
  const cb = {
    onReady() {}, onTower() {}, onLevel() {}, onAim() {},
    onSelect() {}, onDeselect() {}, onLock() {},
    ...callbacks,
  };

  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  };
  const disposables = [];

  const {
    WALLS, UNIT_W, ROWS, BOARD, UNIT_H, DEPTH, APOTHEM, LEVEL_H, EYE,
  } = GEOMETRY;
  const ROW_H = (UNIT_H - BOARD * (ROWS + 1)) / ROWS;
  const CIRCUM = APOTHEM / Math.cos(Math.PI / WALLS);
  const EDGE = 2 * APOTHEM * Math.tan(Math.PI / WALLS);                     // outer face chord (vertex to vertex)
  const INNER_EDGE = 2 * (APOTHEM - DEPTH / 2) * Math.tan(Math.PI / WALLS); // inner (viewer-facing) chord
  const RIN = 3.6;           // how far from a tower centre you can walk (just inside the faces)
  const BRIDGE_HALF = 0.7;   // half-width of the walkable bridge corridor
  const DECK_HALF = 0.7;     // half-width of the visible deck
  const BR_INSET = 3.3;      // bridge corridor endpoints sit this far from centre (inside the disk)
  const DOOR_W = 1.7, DOOR_H = 2.4;

  const TWO_PI = Math.PI * 2;
  const normAng = (a) => ((a % TWO_PI) + TWO_PI) % TWO_PI;
  const angDelta = (a, b) => { const d = normAng(a - b); return d > Math.PI ? TWO_PI - d : d; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  let W = container.clientWidth || window.innerWidth;
  let H = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(64, W / H, 0.04, 400);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  const lockSupported = 'requestPointerLock' in canvas;

  // ---------------------------------------------------------------- starfield
  function starLayer(count, radius, size, opacity, bandBias) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let u = Math.random() * 2 - 1;
      if (bandBias) u = (u * u * u) * 0.55;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = radius * (0.75 + Math.random() * 0.25);
      pos[i * 3]     = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size, sizeAttenuation: true,
      transparent: true, opacity, depthWrite: false,
    });
    const p = new THREE.Points(g, mat);
    scene.add(p);
    disposables.push(g, mat);
    return p;
  }

  starLayer(4200, 190, 0.30, 0.55, false);
  starLayer(1500, 150, 0.55, 0.80, false);
  starLayer(3000, 170, 0.38, 0.42, true);
  const brightStars = starLayer(180, 130, 1.15, 1.0, false);

  // ------------------------------------------------------------------ textures
  const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;

  function tex(c) {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    disposables.push(t);
    return t;
  }

  function fitText(ctx, text, max, base) {
    let s = base;
    ctx.font = `500 ${s}px Fraunces, Georgia, serif`;
    while (ctx.measureText(text).width > max && s > 11) {
      s -= 1;
      ctx.font = `500 ${s}px Fraunces, Georgia, serif`;
    }
    return s;
  }

  function spineTex(d) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 900;
    const x = c.getContext('2d');
    const L = 32 + (d.rating - 3) * 4;
    x.fillStyle = hsl(d.hue, 52, L);
    x.fillRect(0, 0, 128, 900);
    for (let i = 0; i < 900; i += 3) {
      x.fillStyle = `rgba(255,255,255,${0.014 + Math.random() * 0.022})`;
      x.fillRect(0, i, 128, 1);
    }
    x.fillStyle = hsl(d.hue, 60, 82);
    x.fillRect(14, 54, 100, 2);
    x.fillRect(14, 846, 100, 2);
    x.save();
    x.translate(64, 450);
    x.rotate(-Math.PI / 2);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = hsl(d.hue, 34, 95);
    fitText(x, d.title, 700, 42);
    x.fillText(d.title, 0, -12);
    x.font = '300 22px "IBM Plex Mono", monospace';
    x.fillStyle = hsl(d.hue, 26, 78);
    x.fillText(d.creator.toUpperCase(), 0, 24);
    x.restore();
    return tex(c);
  }

  function coverTex(d, ratio) {
    const w = 512, h = Math.round(512 * ratio);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, hsl(d.hue, 58, 34));
    g.addColorStop(1, hsl((d.hue + 34) % 360, 62, 15));
    x.fillStyle = g; x.fillRect(0, 0, w, h);

    let seed = 0;
    for (let i = 0; i < d.title.length; i++) seed += d.title.charCodeAt(i) * (i + 1);
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    const kind = Math.floor(rnd() * 3);
    x.globalAlpha = 0.55;
    if (kind === 0) {
      for (let a = 0; a < 5; a++) {
        x.fillStyle = hsl((d.hue + a * 22) % 360, 70, 34 + a * 9);
        x.beginPath(); x.arc(w * rnd(), h * rnd(), 40 + rnd() * 130, 0, Math.PI * 2); x.fill();
      }
    } else if (kind === 1) {
      for (let b = 0; b < 9; b++) {
        x.fillStyle = hsl((d.hue + b * 9) % 360, 64, 24 + b * 5);
        x.fillRect(0, h * rnd(), w, 8 + rnd() * 34);
      }
    } else {
      for (let k = 0; k < 4; k++) {
        x.fillStyle = hsl((d.hue + k * 30) % 360, 66, 30 + k * 10);
        x.beginPath();
        x.moveTo(w * rnd(), h * rnd()); x.lineTo(w * rnd(), h * rnd()); x.lineTo(w * rnd(), h * rnd());
        x.closePath(); x.fill();
      }
    }
    x.globalAlpha = 1;

    const s = x.createLinearGradient(0, h * 0.42, 0, h);
    s.addColorStop(0, 'rgba(0,0,0,0)');
    s.addColorStop(1, 'rgba(0,0,0,0.92)');
    x.fillStyle = s; x.fillRect(0, h * 0.42, w, h * 0.58);

    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    fitText(x, d.title, w - 64, 46);
    x.fillStyle = '#ffffff';
    x.fillText(d.title, 32, h - 62);
    x.font = '300 24px "IBM Plex Mono", monospace';
    x.fillStyle = hsl(d.hue, 40, 76);
    x.fillText(d.creator.toUpperCase(), 32, h - 30);
    return tex(c);
  }

  // ---------------------------------------------------------- shared materials
  const lineMat    = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 });
  const lineFaint  = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 });
  const lineBright = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.62 });
  const lineMesh   = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13 });
  const itemLine   = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const darkMat    = new THREE.MeshBasicMaterial({ color: 0x07070b });
  disposables.push(lineMat, lineFaint, lineBright, lineMesh, itemLine, darkMat);

  const boxEdgeCache = {};
  function edgesFor(w, h, d) {
    const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    if (!boxEdgeCache[k]) {
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
      boxEdgeCache[k] = geo;
      disposables.push(geo);
    }
    return boxEdgeCache[k];
  }

  function wireBox(parent, w, h, d, x, y, z, mat) {
    const l = new THREE.LineSegments(edgesFor(w, h, d), mat || lineMat);
    l.position.set(x, y, z);
    parent.add(l);
    return l;
  }

  function segments(parent, pairs, mat) {   // pairs: array of Vector3, drawn 2-by-2
    const g = new THREE.BufferGeometry().setFromPoints(pairs);
    parent.add(new THREE.LineSegments(g, mat));
    disposables.push(g);
  }

  function hexRing(parent, y, mat) {
    const pts = [];
    for (let i = 0; i <= WALLS; i++) {
      const a = (i / WALLS) * Math.PI * 2 + Math.PI / WALLS;
      pts.push(new THREE.Vector3(Math.sin(a) * CIRCUM, y, Math.cos(a) * CIRCUM));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    parent.add(new THREE.Line(g, mat));
    disposables.push(g);
  }

  function chunk(arr, n) {
    const out = [], per = Math.ceil(arr.length / n);
    for (let i = 0; i < n; i++) out.push(arr.slice(i * per, (i + 1) * per));
    return out;
  }

  // ---------------------------------------------------------------- face parts
  // a wall Group sitting on face `faceIndex`, local +z pointing at tower centre
  function makeWall(tg, faceIndex, baseY) {
    const a = (faceIndex / WALLS) * Math.PI * 2;
    const wall = new THREE.Group();
    wall.position.set(Math.sin(a) * APOTHEM, baseY, Math.cos(a) * APOTHEM);
    wall.rotation.y = a + Math.PI;
    tg.add(wall);
    return wall;
  }

  // pronounced rectangular frame around a non-media face
  function faceFrame(wall) {
    const hw = EDGE / 2, z = 0.006, top = UNIT_H;
    segments(wall, [
      V(-hw, 0, z), V(hw, 0, z),
      V(hw, 0, z), V(hw, top, z),
      V(hw, top, z), V(-hw, top, z),
      V(-hw, top, z), V(-hw, 0, z),
    ], lineBright);
  }

  // tessellated wireframe panel filling a rect (centred x, spanning y0..y0+h)
  function mosaicPanel(wall, w, y0, h, cols, rows, z) {
    const x0 = -w / 2, dx = w / cols, dy = h / rows;
    const p = [];
    for (let i = 0; i <= cols; i++) { const x = x0 + i * dx; p.push(V(x, y0, z), V(x, y0 + h, z)); }
    for (let j = 0; j <= rows; j++) { const y = y0 + j * dy; p.push(V(x0, y, z), V(x0 + w, y, z)); }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = x0 + i * dx, y = y0 + j * dy;
        if ((i + j) % 2 === 0) p.push(V(x, y, z), V(x + dx, y + dy, z));
        else p.push(V(x + dx, y, z), V(x, y + dy, z));
      }
    }
    segments(wall, p, lineMesh);
  }

  // bright double-line doorway portal at floor level
  function doorway(wall) {
    const z = 0.012;
    const portal = (inset) => {
      const w = DOOR_W / 2 - inset, b = inset, t = DOOR_H - inset;
      segments(wall, [
        V(-w, b, z), V(w, b, z),
        V(w, b, z), V(w, t, z),
        V(w, t, z), V(-w, t, z),
        V(-w, t, z), V(-w, b, z),
      ], lineBright);
    };
    portal(0); portal(0.12);
  }

  // one media face: carcass + rows of items
  function fillShelfFace(wall, faceItems, towerIdx, floorIdx, faceIndex) {
    const rowBaseY = [];
    for (let r = 0; r <= ROWS; r++) {
      const by = BOARD / 2 + r * (ROW_H + BOARD);
      wireBox(wall, INNER_EDGE, BOARD, DEPTH, 0, by, 0);
      if (r < ROWS) rowBaseY.push(by + BOARD / 2);
    }

    const byRow = chunk(faceItems, ROWS);
    byRow.forEach((rowList, rI) => {
      if (!rowList.length) return;
      const y0 = rowBaseY[rI];

      const widths = rowList.map((d) => {
        if (d.medium === 'book') return 0.09 + (d.title.length % 5) * 0.015;
        if (d.medium === 'film') return 0.05;
        return 0.045;
      });
      const faceW = rowList.map((d, i) => {
        if (d.medium === 'book') return widths[i];
        return d.medium === 'film' ? 0.72 * (2 / 3) : 0.62;
      });
      const total = faceW.reduce((p, q) => p + q, 0);
      const gap = Math.min(0.1, Math.max(0.025, (UNIT_W - total) / (rowList.length + 1)));
      let cursor = -UNIT_W / 2 + Math.max(gap, (UNIT_W - total - gap * (rowList.length - 1)) / 2);

      rowList.forEach((d, i) => {
        let mesh;
        const fw = faceW[i];

        if (d.medium === 'book') {
          const bh = 0.6 + ((d.title.length * 7) % 19) / 100;
          const bd = 0.36 + ((d.year % 7) / 100);
          const spine = new THREE.MeshBasicMaterial({ map: spineTex(d) });
          disposables.push(spine);
          const geo = new THREE.BoxGeometry(fw, bh, bd);
          disposables.push(geo);
          mesh = new THREE.Mesh(geo, [darkMat, darkMat, darkMat, darkMat, spine, darkMat]);
          mesh.position.set(cursor + fw / 2, y0 + bh / 2, DEPTH / 2 - bd / 2 - 0.03);
          mesh.rotation.z = (Math.random() - 0.5) * 0.03;
          mesh.userData.dims = [fw, bh, bd];
        } else {
          const isFilm = d.medium === 'film';
          const ch = isFilm ? 0.72 : 0.62;
          const th = widths[i];
          const face = new THREE.MeshBasicMaterial({ map: coverTex(d, isFilm ? 1.5 : 1) });
          disposables.push(face);
          const geo = new THREE.BoxGeometry(fw, ch, th);
          disposables.push(geo);
          mesh = new THREE.Mesh(geo, [darkMat, darkMat, darkMat, darkMat, face, darkMat]);
          mesh.position.set(cursor + fw / 2, y0 + ch / 2, DEPTH / 2 - 0.12);
          mesh.rotation.y = -0.05 - Math.random() * 0.04;
          mesh.userData.dims = [fw, ch, th];
        }

        const out = new THREE.LineSegments(edgesFor(...mesh.userData.dims), itemLine.clone());
        disposables.push(out.material);
        mesh.add(out);

        mesh.userData.data = d;
        mesh.userData.tower = towerIdx;
        mesh.userData.floor = floorIdx;
        mesh.userData.face = faceIndex;
        mesh.userData.edge = out;
        mesh.userData.home = mesh.position.clone();
        mesh.userData.homeRot = mesh.rotation.clone();
        mesh.userData.out = 0;
        mesh.userData.glow = 0;
        wall.add(mesh);
        items.push(mesh);

        cursor += fw + gap;
      });
    });
  }

  // a non-media face: frame + doorway (pathway) or full mosaic (reserved)
  function fillOpenFace(wall, role) {
    faceFrame(wall);
    if (role === FACE_ROLE.PATHWAY) {
      doorway(wall);
      const y0 = DOOR_H + 0.15;
      mosaicPanel(wall, EDGE * 0.9, y0, UNIT_H - y0 - 0.12, 8, 3, 0.006);
    } else {
      mosaicPanel(wall, EDGE * 0.92, 0.12, UNIT_H - 0.24, 9, 7, 0.006);
    }
  }

  // ------------------------------------------------------------- build towers
  const world = new THREE.Group();
  scene.add(world);

  const layout = towerLayout();
  const items = [];
  const towers = [];

  layout.forEach((L) => {
    const tg = new THREE.Group();
    tg.position.set(L.centre.x, 0, L.centre.z);
    tg.rotation.y = L.rotationOffset;
    world.add(tg);

    const list = catalog.filter((d) => d.medium === L.medium);
    const perFloor = L.shelfFaces.length * ROWS * (PER_ROW[L.medium] || 8);
    const floorCount = Math.max(1, Math.ceil(list.length / perFloor));

    for (let f = 0; f < floorCount; f++) {
      const baseY = f * LEVEL_H;
      hexRing(tg, baseY, lineFaint);
      hexRing(tg, baseY + UNIT_H, lineFaint);

      const floorItems = list.slice(f * perFloor, (f + 1) * perFloor);
      const byFace = chunk(floorItems, L.shelfFaces.length);
      const shelfMap = {};
      L.shelfFaces.forEach((fi, si) => { shelfMap[fi] = byFace[si] || []; });

      for (let fi = 0; fi < WALLS; fi++) {
        const wall = makeWall(tg, fi, baseY);
        const role = L.faces[fi].role;
        if (role === FACE_ROLE.SHELF) fillShelfFace(wall, shelfMap[fi], L.index, f, fi);
        else fillOpenFace(wall, role);
      }
    }

    const topY = (floorCount - 1) * LEVEL_H + UNIT_H;
    for (let ci = 0; ci < WALLS; ci++) {
      const ca = (ci / WALLS) * Math.PI * 2 + Math.PI / WALLS;
      const cg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.sin(ca) * CIRCUM, -0.6, Math.cos(ca) * CIRCUM),
        new THREE.Vector3(Math.sin(ca) * CIRCUM, topY + 0.6, Math.cos(ca) * CIRCUM),
      ]);
      tg.add(new THREE.Line(cg, lineFaint));
      disposables.push(cg);
    }

    towers.push({
      id: L.id, medium: L.medium, label: L.label, source: L.source,
      centre: L.centre, count: list.length, floorCount,
    });
  });

  // ---------------------------------------------------- bridges between towers
  function pickPathwayFace(T, dir) {
    let best = T.pathwayFaces[0], bd = Infinity;
    for (const fi of T.pathwayFaces) {
      const d = angDelta(T.faces[fi].angle, dir);
      if (d < bd) { bd = d; best = fi; }
    }
    return best;
  }
  const along = (c, dir, rad) => ({ x: c.x + rad * dir.x, z: c.z + rad * dir.z });

  const bridges = [];
  layout.forEach((A) => {
    A.neighbours.forEach((nj) => {
      if (A.index >= nj) return;
      const B = layout[nj];
      const dAB = Math.atan2(B.centre.x - A.centre.x, B.centre.z - A.centre.z);
      const angA = A.faces[pickPathwayFace(A, dAB)].angle;
      const angB = B.faces[pickPathwayFace(B, dAB + Math.PI)].angle;
      const dirA = { x: Math.sin(angA), z: Math.cos(angA) };
      const dirB = { x: Math.sin(angB), z: Math.cos(angB) };
      const PA = along(A.centre, dirA, APOTHEM);
      const PB = along(B.centre, dirB, APOTHEM);
      // Two straight portions: each leaves its doorway perpendicular and they
      // meet at the single point where the two exits intersect. On the triangle
      // ring the halves are equal length and the joint angle is 120 degrees.
      const Dx = PB.x - PA.x, Dz = PB.z - PA.z;
      const det = dirB.x * dirA.z - dirA.x * dirB.z;
      const M = Math.abs(det) > 1e-4
        ? (() => { const tt = (dirB.x * Dz - Dx * dirB.z) / det; return { x: PA.x + tt * dirA.x, z: PA.z + tt * dirA.z }; })()
        : { x: (PA.x + PB.x) / 2, z: (PA.z + PB.z) / 2 };
      bridges.push({
        a: A.index, b: B.index,
        deckPath: [PA, M, PB],
        movePath: [along(A.centre, dirA, BR_INSET), M, along(B.centre, dirB, BR_INSET)],
      });
    });
  });

  // mitred wireframe deck following a bent path
  function drawDeck(points, y) {
    const n = points.length;
    const seg = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x, dz = points[i + 1].z - points[i].z;
      const l = Math.hypot(dx, dz) || 1;
      seg.push({ nx: -dz / l, nz: dx / l });   // left normal
    }
    const rail = (sign) => {
      const verts = [];
      for (let i = 0; i < n; i++) {
        let nx, nz;
        if (i === 0) { nx = seg[0].nx; nz = seg[0].nz; }
        else if (i === n - 1) { nx = seg[n - 2].nx; nz = seg[n - 2].nz; }
        else {
          let mx = seg[i - 1].nx + seg[i].nx, mz = seg[i - 1].nz + seg[i].nz;
          const ml = Math.hypot(mx, mz) || 1; mx /= ml; mz /= ml;
          const cos = Math.max(0.4, mx * seg[i].nx + mz * seg[i].nz);
          nx = mx / cos; nz = mz / cos;
        }
        verts.push(V(points[i].x + sign * DECK_HALF * nx, y, points[i].z + sign * DECK_HALF * nz));
      }
      const g = new THREE.BufferGeometry().setFromPoints(verts);
      world.add(new THREE.Line(g, lineMat));
      disposables.push(g);
      return verts;
    };
    const L = rail(1), R = rail(-1);
    const tie = (a, b, mat) => { const g = new THREE.BufferGeometry().setFromPoints([a, b]); world.add(new THREE.Line(g, mat || lineMat)); disposables.push(g); };
    tie(L[0], R[0]); tie(L[n - 1], R[n - 1]);
    for (let i = 1; i < n - 1; i++) tie(L[i], R[i], lineBright);   // bright seam where the two portions meet
    for (let i = 0; i < n - 1; i++) {
      for (let s = 1; s <= 2; s++) {
        const t = s / 3;
        tie(
          V(L[i].x + (L[i + 1].x - L[i].x) * t, y, L[i].z + (L[i + 1].z - L[i].z) * t),
          V(R[i].x + (R[i + 1].x - R[i].x) * t, y, R[i].z + (R[i + 1].z - R[i].z) * t),
        );
      }
    }
  }
  bridges.forEach((br) => {
    const shared = Math.min(towers[br.a].floorCount, towers[br.b].floorCount);
    for (let k = 0; k < shared; k++) drawDeck(br.deckPath, k * LEVEL_H);
  });

  cb.onReady({ towers: towers.map((t) => ({ ...t })), active: 0 });

  // --------------------------------------------------------------------- player
  const player = { x: 0, z: 0, yaw: 0, pitch: -0.04, vx: 0, vz: 0, floor: 0, y: EYE, targetY: EYE };
  let active = 0;
  let insideTower = 0;
  const keys = {};
  let locked = false;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const centreOf = (i) => towers[i].centre;

  function placeInTower(i, snap) {
    const c = centreOf(i);
    player.x = c.x; player.z = c.z;
    player.yaw = Math.atan2(c.x, c.z) + Math.PI;   // look outward, toward the shelves
    player.floor = 0;
    player.targetY = EYE;
    if (snap) player.y = EYE;
  }
  placeInTower(0, true);

  function setTower(i) {
    i = clamp(i, 0, towers.length - 1);
    if (i === active && player.floor === 0) { deselect(); return; }
    active = i;
    insideTower = i;
    deselect();
    placeInTower(i, true);
    cb.onTower(active, towers[active]);
    cb.onLevel(player.floor, towers[active]);
  }

  function handoff(i) {
    active = i;
    deselect();
    cb.onTower(active, towers[active]);
  }

  function goLevel(n) {
    if (insideTower === null) return;
    n = clamp(n, 0, towers[active].floorCount - 1);
    if (n === player.floor) return;
    player.floor = n;
    player.targetY = n * LEVEL_H + EYE;
    deselect();
    cb.onLevel(n, towers[active]);
  }

  on(window, 'keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['w', 'a', 's', 'd', ' ', 'q', 'e', 'f'].indexOf(k) >= 0) e.preventDefault();
    if (k === 'q') goLevel(player.floor - 1);
    if (k === 'e') goLevel(player.floor + 1);
    if (k === 'f') { if (aimed) select(aimed); else deselect(); }
    if (k === 'escape') deselect();
  });
  on(window, 'keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // ---- mouse look ----
  let dragging = false, lx = 0, ly = 0, moved = false;

  function enter() {
    if (canvas.requestPointerLock) canvas.requestPointerLock();
  }

  on(document, 'pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
    cb.onLock(locked);
  });

  on(document, 'mousemove', (e) => {
    if (!locked) return;
    player.yaw  -= e.movementX * 0.0022;
    player.pitch = clamp(player.pitch - e.movementY * 0.0020, -1.1, 1.1);
  });

  on(canvas, 'pointerdown', (e) => {
    if (locked) return;
    dragging = true; moved = false; lx = e.clientX; ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  on(canvas, 'pointermove', (e) => {
    if (!dragging || locked) return;
    player.yaw  -= (e.clientX - lx) * 0.005;
    player.pitch = clamp(player.pitch - (e.clientY - ly) * 0.004, -1.1, 1.1);
    lx = e.clientX; ly = e.clientY;
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) moved = true;
  });
  on(canvas, 'pointerup', (e) => {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  });
  on(canvas, 'click', () => {
    if (moved) return;
    if (lockSupported && !locked) { enter(); return; }
    if (aimed) select(aimed); else deselect();
  });

  // ------------------------------------------------------------- aim + select
  const ray = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);
  let aimed = null, selected = null;

  function updateAim() {
    ray.setFromCamera(centre, camera);
    const reach = items.filter((m) => m.userData.tower === active && m.userData.floor === player.floor);
    const hits = ray.intersectObjects(reach, false);
    const m = (hits.length && hits[0].distance < 6.5) ? hits[0].object : null;
    if (m === aimed) return;
    aimed = m;
    cb.onAim(m ? m.userData.data : null);
  }

  function select(m) {
    if (selected && selected !== m) selected.userData.out = 0;
    selected = m;
    m.userData.out = 1;
    cb.onSelect(m.userData.data);
  }

  function deselect() {
    if (selected) selected.userData.out = 0;
    selected = null;
    cb.onDeselect();
  }

  function selectRandom() {
    const pool = items.filter((m) => m.userData.tower === active && m.userData.floor === player.floor);
    if (!pool.length) return;
    const m = pool[Math.floor(Math.random() * pool.length)];
    const wp = new THREE.Vector3();
    m.getWorldPosition(wp);
    player.yaw = Math.atan2(wp.x - player.x, wp.z - player.z);
    player.pitch = clamp(
      Math.atan2(wp.y - (player.floor * LEVEL_H + EYE), Math.hypot(wp.x - player.x, wp.z - player.z)),
      -1.1, 1.1,
    );
    select(m);
  }

  cb.onTower(active, towers[active]);
  cb.onLevel(player.floor, towers[active]);

  // ---- walkable region: tower disks joined by bent bridge corridors ----
  function nearestOnSeg(px, pz, ax, az, bx, bz) {
    const abx = bx - ax, abz = bz - az, ab2 = abx * abx + abz * abz;
    let t = ab2 ? ((px - ax) * abx + (pz - az) * abz) / ab2 : 0;
    t = clamp(t, 0, 1);
    return { x: ax + abx * t, z: az + abz * t };
  }
  function whichZone(px, pz, k) {
    for (let i = 0; i < towers.length; i++) {
      if (towers[i].floorCount <= k) continue;
      const c = towers[i].centre;
      if (Math.hypot(px - c.x, pz - c.z) <= RIN) return { ok: true, tower: i };
    }
    for (const br of bridges) {
      if (Math.min(towers[br.a].floorCount, towers[br.b].floorCount) <= k) continue;
      const path = br.movePath;
      for (let s = 0; s < path.length - 1; s++) {
        const q = nearestOnSeg(px, pz, path[s].x, path[s].z, path[s + 1].x, path[s + 1].z);
        if (Math.hypot(px - q.x, pz - q.z) <= BRIDGE_HALF) return { ok: true, tower: null };
      }
    }
    return { ok: false };
  }
  function projectWalkable(px, pz, k) {
    let best = { x: px, z: pz }, bd = Infinity;
    const consider = (x, z) => { const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = { x, z }; } };
    for (let i = 0; i < towers.length; i++) {
      if (towers[i].floorCount <= k) continue;
      const c = towers[i].centre, d = Math.hypot(px - c.x, pz - c.z) || 1;
      consider(c.x + (px - c.x) / d * RIN, c.z + (pz - c.z) / d * RIN);
    }
    for (const br of bridges) {
      if (Math.min(towers[br.a].floorCount, towers[br.b].floorCount) <= k) continue;
      const path = br.movePath;
      for (let s = 0; s < path.length - 1; s++) {
        const q = nearestOnSeg(px, pz, path[s].x, path[s].z, path[s + 1].x, path[s + 1].z);
        const d = Math.hypot(px - q.x, pz - q.z) || 1;
        consider(q.x + (px - q.x) / d * BRIDGE_HALF, q.z + (pz - q.z) / d * BRIDGE_HALF);
      }
    }
    return best;
  }

  // ----------------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  const fwd = new THREE.Vector3(), right = new THREE.Vector3();
  let rafId = 0, disposed = false;

  function tick() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    const mf = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    const mr = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    if (mf || mr) {
      const len = Math.hypot(mf, mr);
      fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));   // camera forward: W walks toward the look direction
      right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      const sp = 6.0;
      player.vx += (fwd.x * mf + right.x * mr) / len * sp * dt * 6;
      player.vz += (fwd.z * mf + right.z * mr) / len * sp * dt * 6;
    }
    player.vx *= 0.86; player.vz *= 0.86;
    const nx = player.x + player.vx * dt;
    const nz = player.z + player.vz * dt;

    // constrain to the walkable region (tower disks + bridge corridors)
    const zone = whichZone(nx, nz, player.floor);
    if (zone.ok) {
      player.x = nx; player.z = nz;
      if (zone.tower !== null) {
        insideTower = zone.tower;
        if (zone.tower !== active) handoff(zone.tower);
      } else {
        insideTower = null;
      }
    } else {
      const p = projectWalkable(nx, nz, player.floor);
      player.x = p.x; player.z = p.z;
      player.vx *= 0.4; player.vz *= 0.4;
    }

    player.y += (player.targetY - player.y) * (reduced ? 1 : 0.055);

    const bob = (mf || mr) && !reduced ? Math.sin(t * 9) * 0.014 : 0;
    camera.position.set(player.x, player.y + bob, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    updateAim();

    for (let i = 0; i < items.length; i++) {
      const m = items[i], u = m.userData;
      const near = u.tower === active && u.floor === player.floor;
      const isAim = m === aimed, isSel = m === selected;

      const wantGlow = isSel ? 1 : (isAim ? 0.62 : 0);
      u.glow += (wantGlow - u.glow) * 0.16;
      u.edge.material.opacity = (near ? 0.5 : 0.1) + u.glow * 0.5;

      const faceMat = m.material[4];
      const o = near ? 1 : 0.2;
      if (faceMat.opacity !== o) { faceMat.transparent = o < 0.99; faceMat.opacity = o; }

      const tz = u.home.z + u.out * 0.55 + (isAim && !isSel ? 0.045 : 0);
      const ty = u.home.y + u.out * 0.09;
      m.position.z += (tz - m.position.z) * 0.14;
      m.position.y += (ty - m.position.y) * 0.14;

      const ry = u.homeRot.y + (u.out ? (u.data.medium === 'book' ? -1.4 : -0.3) : 0);
      m.rotation.y += (ry - m.rotation.y) * 0.12;
      if (u.out && !reduced) m.position.y += Math.sin(t * 1.4) * 0.0014;
    }

    if (!reduced) brightStars.rotation.y = t * 0.004;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  on(window, 'resize', () => {
    W = container.clientWidth || window.innerWidth;
    H = container.clientHeight || window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  function regenTextures() {
    items.forEach((m) => {
      const d = m.userData.data;
      m.material[4].map = d.medium === 'book'
        ? spineTex(d)
        : coverTex(d, d.medium === 'film' ? 1.5 : 1);
      m.material[4].needsUpdate = true;
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (!disposed) regenTextures(); });
  }
  tick();

  // ------------------------------------------------------------------- dispose
  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    if (locked && document.exitPointerLock) document.exitPointerLock();
    listeners.forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
    disposables.forEach((r) => { try { r.dispose(); } catch { /* noop */ } });
    renderer.dispose();
    if (canvas.parentNode === container) container.removeChild(canvas);
  }

  return { dispose, enter, goLevel, setTower, selectRandom, deselect };
}
