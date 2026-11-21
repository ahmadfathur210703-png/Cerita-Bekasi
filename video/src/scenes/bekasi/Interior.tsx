// Inside Bekasi Junction: one concourse (x −66…126, corridor z −5…5) with an atrium + escalators, the big tenants
// (Ramayana, LOTTE Mart, XXI, A&W, Ruang Aktivitas / Studio Area), service-elektronik kiosks and a long lane of
// clothing kiosks. The layout never changes; the era changes light, open/closed shutters and crowds.
//   glory  — bright, warm, everything open
//   covid  — dim, cool, half the lights off, few masked visitors
//   y2026  — most kiosks shuttered, Ramayana / LOTTE Mart / XXI dark; A&W and Ruang Aktivitas still alive
// The interior is built far from the street (IN_X) so the street's sun-shadow map never darkens it.

import React, { useMemo } from "react";
import { CanvasTexture, Color, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { mat, type SignSpec } from "./kit.ts";
import { B, BB, Cy, Sign, boxGeo, type V3 } from "./prim.tsx";
import { Person, randomLook, type Look } from "./People.tsx";

export const IN_X = 6000; // world offset of the interior
export type Era = "glory" | "covid" | "y2026";

export const CORR = { x0: -66, x1: 126, z: 5, h: 4.2 };
export const ATRIUM = { x0: 0, x1: 20 };

// ── Materials whose light follows the era ────────────────────────────────────

const em = (color: string, emissive: string, roughness = 0.6) => new MeshStandardMaterial({ color, roughness, emissive: new Color(emissive), emissiveIntensity: 1 });
export const IM = {
  ceilA: em("#f4f1ea", "#fff6e6", 0.4),
  ceilB: em("#f4f1ea", "#fff6e6", 0.4),
  shopGlow: em("#efe9df", "#fff3df", 0.7),
  shopGlowDim: em("#d9d6cf", "#e8f0ff", 0.7),
  skylight: em("#e9f1f6", "#eaf4ff", 0.3),
  ramayanaIn: em("#f1ece4", "#fff1dc", 0.6),
  lotteIn: em("#f1efe8", "#f4fbff", 0.6),
  xxiIn: em("#2c2622", "#ffcf8c", 0.6),
  awIn: em("#f2e3cc", "#ffd9a6", 0.6),
  studioIn: em("#efe7da", "#fff2de", 0.6),
  screen: em("#1a2a3a", "#8ec5ff", 0.3),
  poster: em("#202020", "#ffffff", 0.4),
  exit: em("#1f8a4c", "#4dff9a", 0.4),
};

const ERA_LIGHT: Record<Era, Record<keyof typeof IM, number>> = {
  glory: { ceilA: 0.95, ceilB: 0.95, shopGlow: 0.42, shopGlowDim: 0.42, skylight: 1.0, ramayanaIn: 0.42, lotteIn: 0.42, xxiIn: 0.6, awIn: 0.55, studioIn: 0.5, screen: 1.4, poster: 0.9, exit: 1.2 },
  covid: { ceilA: 0.55, ceilB: 0.0, shopGlow: 0.25, shopGlowDim: 0.35, skylight: 0.6, ramayanaIn: 0.35, lotteIn: 0.4, xxiIn: 0.1, awIn: 0.45, studioIn: 0.1, screen: 0.4, poster: 0.25, exit: 1.2 },
  y2026: { ceilA: 0.75, ceilB: 0.0, shopGlow: 0.45, shopGlowDim: 0.0, skylight: 0.9, ramayanaIn: 0.0, lotteIn: 0.0, xxiIn: 0.0, awIn: 0.75, studioIn: 0.6, screen: 0.0, poster: 0.0, exit: 1.2 },
};
export const applyEra = (era: Era) => {
  for (const k of Object.keys(IM) as (keyof typeof IM)[]) IM[k].emissiveIntensity = ERA_LIGHT[era][k];
};

// ── Textures ────────────────────────────────────────────────────────────────

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};

let floorMat: MeshStandardMaterial | null = null;
const floorMaterial = () =>
  (floorMat ??= new MeshStandardMaterial({
    roughness: 0.22,
    metalness: 0.0,
    map: canvasTex(256, 256, (g) => {
      g.fillStyle = "#e9e4da";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#dcd6ca";
      g.fillRect(128, 0, 128, 128);
      g.fillRect(0, 128, 128, 128);
      g.strokeStyle = "#c9c2b5";
      g.lineWidth = 3;
      for (let i = 0; i <= 256; i += 128) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
      }
    }, [96, 14]),
  }));

let shutterMat: MeshStandardMaterial | null = null;
const shutterMaterial = () =>
  (shutterMat ??= new MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.45,
    map: canvasTex(64, 256, (g) => {
      for (let y = 0; y < 256; y += 8) {
        g.fillStyle = "#b9ae92";
        g.fillRect(0, y, 64, 6);
        g.fillStyle = "#8e856f";
        g.fillRect(0, y + 6, 64, 2);
      }
    }, [1, 5]),
  }));

const posterMats = (() => {
  const cache: MeshStandardMaterial[] = [];
  return (i: number) => {
    if (cache[i]) return cache[i];
    const pal = [["#1b2a4a", "#e8b04a"], ["#3a1420", "#ff7a59"], ["#0f3b3a", "#9be7c4"], ["#2a1a40", "#c49bff"], ["#402a10", "#ffd36b"], ["#13202c", "#7fd1ff"]][i % 6];
    const t = canvasTex(128, 192, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 192);
      gr.addColorStop(0, pal[0]);
      gr.addColorStop(1, "#050505");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 192);
      g.fillStyle = pal[1];
      g.beginPath();
      g.arc(64, 78, 30 + (i % 3) * 6, 0, Math.PI * 2);
      g.fill();
      g.fillRect(18, 140, 92, 8);
      g.fillRect(30, 154, 68, 5);
    });
    const m = new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new Color("#ffffff"), roughness: 0.3 });
    cache[i] = m;
    return m;
  };
})();

// ── Shell: floor, ceiling, walls, columns, atrium, escalators ────────────────

const Shell: React.FC = () => {
  const ceil = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = CORR.x0 + 3; x < CORR.x1 - 2; x += 3.2) {
      if (x > ATRIUM.x0 - 0.5 && x < ATRIUM.x1 + 0.5) continue;
      pts.push([x, -1.8], [x, 1.8]);
    }
    const mk = (m: MeshStandardMaterial, pick: (i: number) => boolean) => {
      const list = pts.filter((_, i) => pick(i));
      const im = new InstancedMesh(boxGeo(1.8, 0.05, 0.6), m, list.length);
      const o = new Object3D();
      list.forEach(([x, z], i) => {
        o.position.set(x, CORR.h - 0.03, z);
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
      });
      return im;
    };
    return [mk(IM.ceilA, (i) => i % 4 < 2), mk(IM.ceilB, (i) => i % 4 >= 2)];
  }, []);
  const wall = mat("#e7e2d8", 0.85);
  const fascia = mat("#f3f0ea", 0.6);
  const dark = mat("#2a2b2d", 0.6);
  const cols: number[] = [];
  for (let x = -60; x < 124; x += 12) if (x < ATRIUM.x0 - 1 || x > ATRIUM.x1 + 1) cols.push(x);
  return (
    <group>
      {/* floor with dark border lines along the shop fronts */}
      <BB a={[CORR.x0, -0.2, -14]} b={[CORR.x1, 0, 14]} m={floorMaterial()} cast={false} />
      {[-4.4, 4.4].map((z, i) => (
        <BB key={i} a={[CORR.x0, 0, z - 0.12]} b={[CORR.x1, 0.004, z + 0.12]} m={dark} cast={false} />
      ))}
      {/* ceiling (with the atrium opening) */}
      <BB a={[CORR.x0, CORR.h, -14]} b={[ATRIUM.x0, CORR.h + 0.4, 14]} m={fascia} cast={false} />
      <BB a={[ATRIUM.x1, CORR.h, -14]} b={[CORR.x1, CORR.h + 0.4, 14]} m={fascia} cast={false} />
      <BB a={[ATRIUM.x0, CORR.h, -14]} b={[ATRIUM.x1, CORR.h + 0.4, -6]} m={fascia} cast={false} />
      <BB a={[ATRIUM.x0, CORR.h, 6]} b={[ATRIUM.x1, CORR.h + 0.4, 14]} m={fascia} cast={false} />
      {ceil.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      {/* end walls + exit sign */}
      <BB a={[CORR.x0 - 0.4, 0, -14]} b={[CORR.x0, 14, 14]} m={wall} />
      <BB a={[CORR.x1, 0, -14]} b={[CORR.x1 + 0.4, 14, 14]} m={wall} />
      <Sign p={[CORR.x1 - 0.05, 3.55, 0]} rot={[0, -Math.PI / 2, 0]} spec={EXIT} back={IM.exit} depth={0.05} />
      <BB a={[CORR.x1 - 0.3, 0, -1.4]} b={[CORR.x1 - 0.05, 2.6, 1.4]} m={mat("#c9c5bd", 0.5, 0.3)} />
      {/* columns along the fronts */}
      {cols.map((x) =>
        [-5.1, 5.1].map((z) => <B key={`${x},${z}`} p={[x, CORR.h / 2, z]} s={[0.7, CORR.h, 0.7]} m={fascia} />),
      )}
      <Atrium />
      {/* blank walls between the units */}
      <BB a={[-40, 0, -5.3]} b={[-36, CORR.h, -5.0]} m={wall} />
      <BB a={[-40, 0, 5.0]} b={[-36, CORR.h, 5.3]} m={wall} />
    </group>
  );
};

const EXIT: SignSpec = { w: 1.2, h: 0.4, bg: "#1f8a4c", lines: [{ text: "EXIT", color: "#ffffff", size: 0.28, weight: 600 }], ppm: 200 };

/** The atrium: void through two upper levels, balconies with glass rails, a skylight, two escalators. */
const Atrium: React.FC = () => {
  const { x0, x1 } = ATRIUM;
  const L2 = 4.8, L3 = 9.6;
  const fascia = mat("#f3f0ea", 0.6);
  const rail = mat("#9fb6c4", 0.06, 0.4);
  rail.transparent = true;
  rail.opacity = 0.45;
  rail.depthWrite = false;
  return (
    <group>
      {[L2, L3].map((y, i) => (
        <group key={i}>
          {/* balcony slabs on both sides of the void */}
          <BB a={[x0 - 1, y - 0.4, -14]} b={[x1 + 1, y, -6]} m={fascia} />
          <BB a={[x0 - 1, y - 0.4, 6]} b={[x1 + 1, y, 14]} m={fascia} />
          <BB a={[x0 - 1, y, -6.05]} b={[x1 + 1, y + 1.05, -5.95]} m={rail} cast={false} recv={false} />
          <BB a={[x0 - 1, y, 5.95]} b={[x1 + 1, y + 1.05, 6.05]} m={rail} cast={false} recv={false} />
          <BB a={[x0 - 1, y + 1.05, -6.1]} b={[x1 + 1, y + 1.12, -5.9]} m={mat("#c9ccd0", 0.35, 0.8)} />
          <BB a={[x0 - 1, y + 1.05, 5.9]} b={[x1 + 1, y + 1.12, 6.1]} m={mat("#c9ccd0", 0.35, 0.8)} />
          {/* upper shop fronts glowing behind the balconies */}
          {[-1, 1].map((s) => (
            <BB key={s} a={[x0 - 1, y, s * 13.6 - 0.1]} b={[x1 + 1, y + 3.6, s * 13.6 + 0.1]} m={IM.shopGlow} />
          ))}
        </group>
      ))}
      {/* walls up to the skylight and the skylight itself */}
      <BB a={[x0 - 1, CORR.h, -14.2]} b={[x1 + 1, 14.2, -14]} m={mat("#e7e2d8", 0.85)} />
      <BB a={[x0 - 1, CORR.h, 14]} b={[x1 + 1, 14.2, 14.2]} m={mat("#e7e2d8", 0.85)} />
      <BB a={[x0 - 1, 14.2, -14]} b={[x1 + 1, 14.6, 14]} m={IM.skylight} cast={false} />
      {[x0 + 4, x0 + 8, x0 + 12, x0 + 16].map((x) => (
        <B key={x} p={[x, 14.1, 0]} s={[0.15, 0.2, 28]} m={mat("#c9ccd0", 0.35, 0.8)} />
      ))}
      {/* walkway bridges where the escalators land */}
      <BB a={[x1 - 3.5, L2 - 0.4, -6]} b={[x1, L2, 6]} m={fascia} />
      <BB a={[x0, L2 - 0.4, -6]} b={[x0 + 3.5, L2, 6]} m={fascia} />
      {/* ground-floor fronts under the balconies */}
      <BB a={[x0, 0, -5.2]} b={[x1, 3.1, -5.0]} m={IM.shopGlow} />
      <BB a={[x0, 0, 5.0]} b={[x1, 3.1, 5.2]} m={IM.shopGlow} />
      <Escalator from={[x0 + 2, 0, -1.6]} to={[x1 - 4, L2, -1.6]} />
      <Escalator from={[x1 - 2, 0, 1.6]} to={[x0 + 4, L2, 1.6]} />
    </group>
  );
};

export const escalatorPoint = (from: V3, to: V3, u: number): V3 => [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2]];

const Escalator: React.FC<{ from: V3; to: V3 }> = ({ from, to }) => {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, from[2]];
  const glass = mat("#a9c0cc", 0.05, 0.4);
  glass.transparent = true;
  glass.opacity = 0.4;
  glass.depthWrite = false;
  return (
    <group position={mid} rotation={[0, 0, ang]}>
      <B p={[0, -0.45, 0]} s={[len, 0.9, 1.5]} m={mat("#cfd2d5", 0.35, 0.7)} />
      <B p={[0, 0.02, 0]} s={[len, 0.04, 1.1]} m={mat("#3a3c3f", 0.5, 0.5)} />
      {[-0.68, 0.68].map((z) => (
        <React.Fragment key={z}>
          <B p={[0, 0.5, z]} s={[len, 0.95, 0.04]} m={glass} cast={false} recv={false} />
          <B p={[0, 1.0, z]} s={[len, 0.08, 0.1]} m={mat("#1b1b1c", 0.5)} />
        </React.Fragment>
      ))}
    </group>
  );
};

// ── Shop fronts ──────────────────────────────────────────────────────────────

/** Front frame of a unit of width w, facing +z at local z=0, with its depth going to −d. */
const Unit: React.FC<{ w: number; d?: number; sign?: SignSpec; signBack?: MeshStandardMaterial; inner: MeshStandardMaterial; shutter: number; children?: React.ReactNode; signY?: number }> = ({
  w,
  d = 8,
  sign,
  signBack,
  inner,
  shutter,
  children,
  signY = 3.55,
}) => {
  const fascia = mat("#f3f0ea", 0.6);
  const H = 3.1; // opening height
  const drop = Math.max(0, Math.min(1, shutter));
  return (
    <group>
      {/* interior box: back wall lit, side walls, floor */}
      <BB a={[-w / 2, 0, -d]} b={[w / 2, CORR.h, -d + 0.1]} m={inner} />
      <BB a={[-w / 2, 0, -d]} b={[-w / 2 + 0.1, CORR.h, 0]} m={mat("#e2ddd3", 0.85)} />
      <BB a={[w / 2 - 0.1, 0, -d]} b={[w / 2, CORR.h, 0]} m={mat("#e2ddd3", 0.85)} />
      <BB a={[-w / 2, CORR.h - 0.6, -d]} b={[w / 2, CORR.h - 0.5, -0.25]} m={inner} cast={false} />
      {/* fascia + sign */}
      <BB a={[-w / 2, H, -0.2]} b={[w / 2, CORR.h + 0.2, 0]} m={fascia} />
      {sign ? <Sign p={[0, signY, 0.03]} spec={sign} back={signBack} depth={signBack ? 0.08 : 0} /> : null}
      {children}
      {/* the rolling shutter: rolled up inside the box above the opening when open */}
      {drop > 0.001 ? (
        <B p={[0, H - (H * drop) / 2, 0.06]} s={[w - 0.2, H * drop, 0.06]} m={shutterMaterial()} />
      ) : null}
      <B p={[0, H + 0.12, 0.08]} s={[w - 0.1, 0.24, 0.16]} m={mat("#9a9284", 0.5, 0.4)} />
    </group>
  );
};

const KIOSK_NAMES = ["TOKO BAJU", "FASHION ANAK", "BUSANA MUSLIM", "SERAGAM SEKOLAH", "TAS & DOMPET", "SEPATU", "JAM TANGAN", "KACAMATA", "AKSESORIS HP", "MAINAN ANAK", "KOSMETIK", "BATIK", "JEANS", "KAOS & JAKET", "PERLENGKAPAN BAYI", "TOKO EMAS"];
const SERVICE_NAMES = ["SERVICE ELEKTRONIK", "SERVICE HP", "SERVIS TV & AUDIO", "SPAREPART ELEKTRONIK"];
const SIGN_COLS = ["#1f4f8f", "#a8262a", "#2b6b45", "#f2f0ea", "#5b3a91", "#d9861f", "#1d1d1d", "#0f6c7a"];

const kioskSign = (name: string, i: number): SignSpec => {
  const bg = SIGN_COLS[i % SIGN_COLS.length];
  return { w: 3.6, h: 0.6, bg, lines: [{ text: name, color: bg === "#f2f0ea" ? "#1d1d1d" : "#ffffff", size: 0.3, weight: 600 }], ppm: 120, lit: 0 };
};

// clothing: instanced garments for every clothing kiosk, built once
type Garment = { p: V3; c: string; s: V3 };
const GARMENT_COLS = ["#c0392b", "#2e5fa3", "#f2c14e", "#ffffff", "#1d1d1d", "#7d5ba6", "#e88fb0", "#3a8f5a", "#d9d4c8", "#5bc0de", "#8a5a2b", "#f08a24"];

export type KioskState = { id: number; x: number; side: 1 | -1; kind: "clothes" | "service"; name: string };

export const KIOSKS: KioskState[] = (() => {
  const out: KioskState[] = [];
  let n = 0;
  // service kiosks (north, −36…−12), small kiosks around the atrium, the long clothing lane (50…126)
  for (let x = -33; x < -12; x += 6) out.push({ id: n++, x, side: -1, kind: "service", name: SERVICE_NAMES[out.length % 4] });
  for (const x of [-15, -9, -3, 23]) out.push({ id: n++, x, side: 1, kind: "clothes", name: KIOSK_NAMES[n % KIOSK_NAMES.length] });
  for (const x of [-9, -3, 23]) out.push({ id: n++, x, side: -1, kind: "clothes", name: KIOSK_NAMES[(n * 3) % KIOSK_NAMES.length] });
  for (let x = 52; x < 125; x += 4) {
    out.push({ id: n++, x, side: -1, kind: "clothes", name: KIOSK_NAMES[(n * 5) % KIOSK_NAMES.length] });
    out.push({ id: n++, x, side: 1, kind: "clothes", name: KIOSK_NAMES[(n * 7) % KIOSK_NAMES.length] });
  }
  return out;
})();
const kioskW = (k: KioskState) => (k.x >= 50 ? 4 : 6);

const Garments: React.FC = () => {
  const meshes = useMemo(() => {
    const r = mulberry32(77);
    const items: Garment[] = [];
    for (const k of KIOSKS) {
      if (k.kind !== "clothes") continue;
      const w = kioskW(k);
      // two racks inside, plus a rack spilling into the corridor
      for (const [dz, n] of [[-6.5, 9], [-3.5, 7], [-1.2, 6]] as [number, number][]) {
        for (let i = 0; i < n; i++) {
          const lx = -w / 2 + 0.5 + ((w - 1) * (i + 0.5)) / n;
          const c = GARMENT_COLS[Math.floor(r() * GARMENT_COLS.length)];
          const z = k.side === -1 ? -CORR.z + dz : CORR.z - dz;
          items.push({ p: [k.x + lx, 1.25, z], c, s: [0.08, 0.95 + r() * 0.2, 0.55] });
        }
      }
      // hanging display on the back wall
      for (let i = 0; i < 5; i++) {
        const c = GARMENT_COLS[Math.floor(r() * GARMENT_COLS.length)];
        const z = k.side === -1 ? -CORR.z - 7.75 : CORR.z + 7.75;
        items.push({ p: [k.x - w / 2 + 0.6 + (i * (w - 1.2)) / 4, 2.2, z], c, s: [0.55, 0.75, 0.05] });
      }
    }
    const im = new InstancedMesh(boxGeo(1, 1, 1), mat("#ffffff", 0.9), items.length);
    const o = new Object3D();
    items.forEach((g, i) => {
      o.position.set(...g.p);
      o.scale.set(...g.s);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, new Color(g.c));
    });
    im.castShadow = false;
    im.receiveShadow = true;
    return im;
  }, []);
  return <primitive object={meshes} />;
};

const ServiceGoods: React.FC<{ w: number }> = ({ w }) => (
  <group>
    <B p={[0, 0.5, -1.4]} s={[w - 1.2, 1.0, 0.6]} m={mat("#f2f0ea", 0.5)} />
    <B p={[0, 1.02, -1.4]} s={[w - 1.1, 0.05, 0.7]} m={mat("#a9c0cc", 0.1, 0.4)} />
    {[-1.6, 0, 1.6].map((x) => (
      <group key={x} position={[x, 2.4, -7.6]}>
        <B p={[0, 0, 0]} s={[1.3, 0.8, 0.08]} m={mat("#111", 0.4)} />
        <B p={[0, 0, 0.05]} s={[1.2, 0.7, 0.02]} m={IM.screen} cast={false} />
      </group>
    ))}
    {[-2, -0.7, 0.7, 2].map((x) => (
      <B key={x} p={[x, 1.2, -6.8]} s={[0.9, 0.5, 0.5]} m={mat("#3a3c40", 0.5, 0.3)} />
    ))}
    <B p={[0, 0.9, -6.8]} s={[w - 0.6, 0.06, 1.0]} m={mat("#cfc8bb", 0.7)} />
  </group>
);

const Kiosk: React.FC<{ k: KioskState; shutter: number; lit: boolean }> = ({ k, shutter, lit }) => {
  const w = kioskW(k);
  return (
    <group position={[k.x, 0, k.side * CORR.z]} rotation={[0, k.side === -1 ? 0 : Math.PI, 0]}>
      <Unit w={w} sign={kioskSign(k.name, k.id)} inner={lit ? IM.shopGlow : IM.shopGlowDim} shutter={shutter}>
        {k.kind === "service" ? <ServiceGoods w={w} /> : null}
        {k.kind === "clothes" ? (
          <>
            {[-6.5, -3.5, -1.2].map((z) => (
              <B key={z} p={[0, 1.8, z]} s={[w - 0.8, 0.04, 0.04]} m={mat("#b9bcbf", 0.3, 0.8)} />
            ))}
          </>
        ) : null}
      </Unit>
    </group>
  );
};

// ── Big tenants ──────────────────────────────────────────────────────────────

export const TENANT = {
  ramayana: { x: 38, side: -1 as const, w: 24 },
  lotte: { x: 38, side: 1 as const, w: 24 },
  xxi: { x: -53, side: -1 as const, w: 26 },
  aw: { x: -27, side: 1 as const, w: 18 },
  studio: { x: -53, side: 1 as const, w: 26 },
};

const SIGN_RAM: SignSpec = { w: 9, h: 1.0, bg: "#d42a22", lines: [{ text: "Ramayana", color: "#ffffff", size: 0.62, weight: 600 }], ppm: 100, lit: 0 };
const SIGN_LOTTE: SignSpec = { w: 9, h: 1.0, bg: "#c9241c", lines: [{ text: "LOTTE Mart", color: "#ffffff", size: 0.62, weight: 600 }], ppm: 100, lit: 0 };
const SIGN_XXI: SignSpec = { w: 5, h: 2.2, bg: null, lines: [{ text: "XXI", color: "#e6b340", size: 1.9, weight: 600 }], ppm: 100, lit: 0 };
const SIGN_AW: SignSpec = { w: 4.4, h: 1.3, bg: "#ea6a1f", lines: [{ text: "A&W", color: "#203c8c", size: 0.95, weight: 600 }], ppm: 110, border: "#ffffff", lit: 0 };
const SIGN_RA: SignSpec = { w: 9, h: 0.9, bg: "#20383f", lines: [{ text: "RUANG AKTIVITAS", color: "#ffffff", size: 0.5, weight: 600 }], ppm: 100, lit: 0 };
const SIGN_SA: SignSpec = { w: 7, h: 0.9, bg: "#20383f", lines: [{ text: "STUDIO AREA", color: "#ffffff", size: 0.5, weight: 600 }], ppm: 100, lit: 0 };

const place = (t: { x: number; side: -1 | 1 }) => ({ position: [t.x, 0, t.side * CORR.z] as V3, rotation: [0, t.side === -1 ? 0 : Math.PI, 0] as V3 });

const Ramayana: React.FC<{ open: boolean }> = ({ open }) => {
  const r = mulberry32(5);
  return (
    <group {...place(TENANT.ramayana)}>
      <Unit w={TENANT.ramayana.w} d={12} sign={SIGN_RAM} signBack={mat("#c42a22", 0.5)} inner={IM.ramayanaIn} shutter={open ? 0 : 1}>
        {/* racks, mannequins, a cashier counter */}
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i} position={[-10 + (i % 5) * 5, 0, -3 - Math.floor(i / 5) * 4.5]}>
            <B p={[0, 1.6, 0]} s={[3.2, 0.04, 0.04]} m={mat("#b9bcbf", 0.3, 0.8)} />
            {Array.from({ length: 8 }, (_, k) => (
              <B key={k} p={[-1.4 + k * 0.4, 1.15, 0]} s={[0.07, 0.9, 0.5]} m={mat(GARMENT_COLS[Math.floor(r() * GARMENT_COLS.length)], 0.9)} />
            ))}
          </group>
        ))}
        {[-8, 8].map((x) => (
          <group key={x} position={[x, 0.1, -1.0]}>
            <Person look={{ kind: "woman", shirt: x < 0 ? "#2e5fa3" : "#c0392b", pants: "#d9d4c8", skin: "#f2efe9", hair: "#f2efe9" }} pose="stand" phase={0} />
          </group>
        ))}
        <B p={[0, 0.55, -10]} s={[5, 1.1, 0.8]} m={mat("#d42a22", 0.5)} />
      </Unit>
    </group>
  );
};

const LotteMart: React.FC<{ open: boolean }> = ({ open }) => {
  const r = mulberry32(9);
  const cols = ["#e74c3c", "#f1c40f", "#3498db", "#2ecc71", "#ecf0f1", "#e67e22", "#9b59b6"];
  return (
    <group {...place(TENANT.lotte)}>
      <Unit w={TENANT.lotte.w} d={14} sign={SIGN_LOTTE} signBack={mat("#b82018", 0.5)} inner={IM.lotteIn} shutter={open ? 0 : 1}>
        {/* aisles of shelves with packed goods */}
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-9 + i * 3.6, 0, -8]}>
            <B p={[0, 0.9, 0]} s={[0.6, 1.8, 7]} m={mat("#e8e6e1", 0.6)} />
            {[0.45, 0.95, 1.45].map((y) =>
              Array.from({ length: 10 }, (_, k) => (
                <B key={`${y},${k}`} p={[(k % 2 ? 0.31 : -0.31), y, -3.2 + k * 0.7]} s={[0.05, 0.35, 0.6]} m={mat(cols[Math.floor(r() * cols.length)], 0.6)} />
              )),
            )}
          </group>
        ))}
        {/* checkout counters */}
        {[-6, -1, 4].map((x) => (
          <B key={x} p={[x, 0.5, -2.5]} s={[1.0, 1.0, 2.4]} m={mat("#d9d6cf", 0.5)} />
        ))}
      </Unit>
    </group>
  );
};

/** A shopping trolley (open wire basket, drawn as frame + mesh panels). */
export const Trolley: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => {
  const wire = mat("#b8bcc0", 0.3, 0.8);
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <B p={[0, 0.75, 0]} s={[0.55, 0.45, 0.85]} m={wire} />
      <B p={[0, 0.98, -0.47]} s={[0.55, 0.05, 0.05]} m={mat("#c4261d", 0.5)} />
      <B p={[0, 0.35, 0]} s={[0.5, 0.04, 0.8]} m={wire} />
      {[-0.22, 0.22].map((x) => [-0.35, 0.35].map((z) => <Cy key={`${x}${z}`} p={[x, 0.06, z]} r={0.06} h={0.04} m={mat("#222", 0.8)} rot={[0, 0, Math.PI / 2]} seg={10} />))}
    </group>
  );
};

const posterLit = (i: number) => {
  const m = posterMats(i);
  m.emissiveIntensity = IM.poster.emissiveIntensity;
  return m;
};

const XXI: React.FC<{ open: boolean }> = ({ open }) => {
  const beige = mat("#d8cdb8", 0.6);
  return (
    <group {...place(TENANT.xxi)}>
      <Unit w={TENANT.xxi.w} d={12} inner={IM.xxiIn} shutter={0}>
        {/* the beige feature wall with gold lettering, posters, glass entry */}
        <BB a={[-13, 0, -0.4]} b={[-2, CORR.h, -0.2]} m={beige} />
        <Sign p={[-7.5, 3.2, -0.15]} spec={SIGN_XXI} />
        {[0, 1, 2, 3].map((i) => (
          <group key={i} position={[-11.5 + i * 2.6, 1.6, -0.12]}>
            <B p={[0, 0, 0]} s={[1.5, 2.1, 0.06]} m={mat("#2b2b2b", 0.4)} />
            <mesh geometry={boxGeo(1.3, 1.9, 0.02)} material={open ? posterLit(i) : mat("#151515", 0.4)} position={[0, 0, 0.04]} />
          </group>
        ))}
        <BB a={[-1.8, 0, -0.3]} b={[12.8, 3.0, -0.25]} m={mat("#9fb6c4", 0.05, 0.4)} />
        {/* ticket counter + lobby chairs inside */}
        <B p={[5, 0.55, -8]} s={[7, 1.1, 0.9]} m={mat("#3a2f26", 0.5)} />
        {[0, 1, 2, 3, 4].map((i) => (
          <B key={i} p={[0 + i * 2.2, 0.4, -4]} s={[1.6, 0.8, 0.7]} m={mat("#7a1f22", 0.7)} />
        ))}
      </Unit>
    </group>
  );
};

const AW: React.FC = () => {
  const wood = mat("#8a5a34", 0.7);
  return (
    <group {...place(TENANT.aw)}>
      <Unit w={TENANT.aw.w} d={10} inner={IM.awIn} shutter={0} sign={SIGN_AW} signY={3.62}>
        {/* wooden slat posts, counter, tables and chairs */}
        {[-8.6, -7.8, 7.8, 8.6].map((x) => (
          <B key={x} p={[x, 1.55, -0.1]} s={[0.25, 3.1, 0.25]} m={wood} />
        ))}
        <B p={[0, 1.1, -9.2]} s={[10, 2.2, 0.6]} m={mat("#c9a27a", 0.6)} />
        <B p={[0, 2.8, -9.5]} s={[6, 0.8, 0.1]} m={IM.screen} />
        <B p={[-6, 1.3, -9.0]} s={[1.6, 0.5, 0.1]} m={mat("#e8651f", 0.5)} />
        {AW_TABLES.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <B p={[0, 0.74, 0]} s={[1.0, 0.05, 0.75]} m={mat("#efe9df", 0.5)} />
            <Cy p={[0, 0.37, 0]} r={0.05} h={0.74} m={mat("#2a2a2a", 0.4)} seg={8} />
            {[-0.75, 0.75].map((cx) => (
              <group key={cx} position={[cx, 0, 0]}>
                <B p={[0, 0.45, 0]} s={[0.45, 0.06, 0.45]} m={mat("#d9b98e", 0.6)} />
                <B p={[cx > 0 ? 0.22 : -0.22, 0.75, 0]} s={[0.05, 0.6, 0.45]} m={mat("#d9b98e", 0.6)} />
                {[-0.18, 0.18].map((lz) => (
                  <B key={lz} p={[0, 0.22, lz]} s={[0.04, 0.44, 0.04]} m={mat("#2a2a2a", 0.4)} />
                ))}
              </group>
            ))}
          </group>
        ))}
      </Unit>
    </group>
  );
};
/** A&W table centres in the tenant's local frame (front at z = 0, inside toward −z). */
export const AW_TABLES: [number, number][] = [[-5.5, -2.2], [-2, -2.2], [1.5, -2.2], [5, -2.2], [-5.5, -5], [-2, -5], [1.5, -5], [5, -5], [-3.8, -7.3], [3.2, -7.3]];

const Studio: React.FC = () => {
  const floor = mat("#b98a5a", 0.45);
  return (
    <group {...place(TENANT.studio)}>
      <Unit w={TENANT.studio.w} d={14} inner={IM.studioIn} shutter={0}>
        <BB a={[-13, 0, -14]} b={[13, 0.04, -0.2]} m={floor} cast={false} />
        {/* mirror wall at the back */}
        <BB a={[-12, 0.3, -13.85]} b={[12, 3.2, -13.8]} m={mat("#c9d6dd", 0.03, 0.9)} />
        <Sign p={[-6, 3.6, 0.03]} spec={SIGN_RA} back={mat("#20383f", 0.5)} depth={0.06} />
        <Sign p={[7, 3.6, 0.03]} spec={SIGN_SA} back={mat("#20383f", 0.5)} depth={0.06} />
        {/* a small speaker stack and a banner stand */}
        <B p={[-11.5, 0.7, -12.5]} s={[0.7, 1.4, 0.6]} m={mat("#1d1d1d", 0.4)} />
        <B p={[11.5, 0.7, -12.5]} s={[0.7, 1.4, 0.6]} m={mat("#1d1d1d", 0.4)} />
      </Unit>
    </group>
  );
};

/** Bazar stalls in the corridor in front of the activity hall (2026). */
const Bazar: React.FC = () => {
  const r = mulberry32(31);
  const cols = ["#e74c3c", "#f1c40f", "#3498db", "#2ecc71", "#ecf0f1", "#e67e22", "#9b59b6", "#e88fb0"];
  const tops = ["#d94f3d", "#2e6fb5", "#f0b429", "#3a9d5d"];
  return (
    <group>
      {[-63, -57, -51, -45].map((x, i) => (
        <group key={x} position={[x, 0, 2.6]}>
          <B p={[0, 0.75, 0]} s={[2.4, 0.06, 1.0]} m={mat("#f2f0ea", 0.6)} />
          <B p={[0, 0.4, 0]} s={[2.3, 0.7, 0.9]} m={mat(tops[i], 0.8)} />
          {Array.from({ length: 9 }, (_, k) => (
            <B key={k} p={[-1.0 + (k % 5) * 0.5, 0.85 + Math.floor(k / 5) * 0.12, -0.2 + Math.floor(k / 5) * 0.35]} s={[0.3, 0.14, 0.22]} m={mat(cols[Math.floor(r() * cols.length)], 0.6)} />
          ))}
          {/* little umbrella canopy */}
          {[-1.15, 1.15].map((px) => (
            <Cy key={px} p={[px, 1.15, -0.4]} r={0.03} h={2.3} m={mat("#9aa0a3", 0.4, 0.6)} seg={6} />
          ))}
          <B p={[0, 2.3, -0.1]} s={[2.6, 0.06, 1.4]} m={mat(tops[(i + 1) % 4], 0.7)} />
        </group>
      ))}
    </group>
  );
};

// ── The interior ─────────────────────────────────────────────────────────────

export type InteriorState = {
  era: Era;
  /** extra shutters closing now (kiosk id → 0…1) */
  closing?: Record<number, number>;
};

const shutterFor = (k: KioskState, era: Era) => {
  if (era === "glory") return 0;
  const h = (k.id * 2654435761) % 1000 / 1000;
  if (era === "covid") return h < 0.45 ? 1 : 0;
  return h < 0.9 ? 1 : 0; // 2026: almost all closed
};

export const Interior: React.FC<{ state: InteriorState; children?: React.ReactNode }> = React.memo(({ state, children }) => {
  applyEra(state.era);
  const on = state.era !== "y2026";
  return (
    <group position={[IN_X, 0, 0]}>
      <Shell />
      {KIOSKS.map((k) => {
        const base = shutterFor(k, state.era);
        const s = state.closing?.[k.id] ?? base;
        return <Kiosk key={k.id} k={k} shutter={s} lit={state.era !== "covid" && s < 1} />;
      })}
      <Garments />
      <Ramayana open={on} />
      <LotteMart open={on} />
      <XXI open={on} />
      <AW />
      <Studio />
      {state.era === "y2026" ? <Bazar /> : null}
      {children}
    </group>
  );
});

export const randomShopper = (r: () => number, era: Era): Look => ({ ...randomLook(r), mask: era === "covid" });
