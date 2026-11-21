// Bekasi Junction — the building, from the reference photos. Same geometry in every scene; only light,
// mood and crowds change. Front faces +z (toward Jl. raya), x runs along the street.
//
//   x: -61 rotunda | -38…-15 left wing | -14…12 glass entrance box | 13…60 canopy wing | 64 tower
//   Floors: 0 · 5.5 · 10.3 · 15.1 · 19.9 (parapet to 21.4)

import React, { useMemo } from "react";
import { BoxGeometry, type BufferGeometry, Matrix4, MeshStandardMaterial, SphereGeometry } from "three";
import { M, mat, mergeAll, type SignSpec } from "./kit.ts";
import { B, BB, Cy, Sign, type V3 } from "./prim.tsx";
import { cached } from "../../kits/worldforge/geo.ts";

export const FLOORS = [0, 5.5, 10.3, 15.1, 19.9];
export const ROTUNDA = { x: -50, z: -5, r: 11, h: 15 };
export const TOWER = { x: 64, z: -4, r: 4.6, h: 26 };
export const ENTRANCE = { x0: -14, x1: 12, zf: 6, h: 22 };
export const RIGHT = { x0: 13, x1: 60 };
export const LEFT = { x0: -38.5, x1: -14.5 };

// ── Signs (plain lettering in the photo colours; no logos) ───────────────────
const RED_BOX = "#d42a22";
export const SIGNS = {
  ramayanaBig: { w: 24, h: 6.2, bg: RED_BOX, lines: [{ text: "Ramayana", color: "#ffffff", size: 3.4, weight: 600 }], ppm: 48, group: "tenant", lit: 1.3 } as SignSpec,
  bjRoof: { w: 30, h: 4.4, bg: null, lines: [{ text: "Bekasi Junction", color: "#2c4aa6", size: 3.3, weight: 600, italic: false }], ppm: 48, lit: 3.2 } as SignSpec,
  entRamayanaTop: { w: 20, h: 3.6, bg: null, lines: [{ text: "Ramayana", color: "#d42a22", size: 3.0, weight: 600 }], ppm: 48, group: "tenant", lit: 1.6 } as SignSpec,
  entLotte: { w: 22, h: 3.4, bg: null, lines: [{ text: "LOTTE Mart", color: "#d42a22", size: 3.0, weight: 600 }], ppm: 48, group: "tenant", lit: 1.6 } as SignSpec,
  entRamayanaMid: { w: 16, h: 2.0, bg: null, lines: [{ text: "Ramayana", color: "#d42a22", size: 1.75, weight: 600 }], ppm: 48, group: "tenant", lit: 1.6 } as SignSpec,
  lotteMasuk: {
    w: 10,
    h: 1.9,
    bg: "#a8201d",
    lines: [
      { text: "↓  LOTTE Mart   MASUK", color: "#ffffff", size: 0.9, weight: 600, y: 0.5 },
    ],
    ppm: 72,
    lit: 1.2,
    group: "tenant",
  } as SignSpec,
  lotteLeft: { w: 9, h: 1.6, bg: "#c4261d", lines: [{ text: "LOTTE Mart", color: "#ffffff", size: 1.05, weight: 600 }], ppm: 72, group: "tenant", lit: 1.2 } as SignSpec,
};

// ── Merged detail geometry ───────────────────────────────────────────────────

const boxAt = (w: number, h: number, d: number, x: number, y: number, z: number) => new BoxGeometry(w, h, d).applyMatrix4(new Matrix4().makeTranslation(x, y, z));

/** Curtain-wall mullion grid in a rectangle on the plane z (facing +z). */
const mullions = (key: string, x0: number, x1: number, y0: number, y1: number, z: number, nx: number, ny: number, t = 0.16, d = 0.25) =>
  mergeAll(key, () => {
    const g: BufferGeometry[] = [];
    for (let i = 0; i <= nx; i++) g.push(boxAt(t, y1 - y0, d, x0 + ((x1 - x0) * i) / nx, (y0 + y1) / 2, z));
    for (let j = 0; j <= ny; j++) g.push(boxAt(x1 - x0, t, d, (x0 + x1) / 2, y0 + ((y1 - y0) * j) / ny, z));
    return g;
  });

/** Vertical mullions around a cylinder. */
const ringMullions = (key: string, r: number, y0: number, y1: number, n: number) =>
  mergeAll(key, () => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return new BoxGeometry(0.18, y1 - y0, 0.25).applyMatrix4(new Matrix4().makeRotationY(-a).premultiply(new Matrix4().makeTranslation(Math.sin(a) * r, (y0 + y1) / 2, Math.cos(a) * r)));
  }));

/** Ribs over a dome (meridians as thin boxes along a quarter circle). */
const domeRibs = (key: string, r: number, k: number, n: number) =>
  mergeAll(key, () => {
    const out: BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      for (let s = 0; s < 8; s++) {
        const t0 = (s / 8) * (Math.PI / 2), t1 = ((s + 1) / 8) * (Math.PI / 2);
        const p0 = [Math.cos(t0) * r, Math.sin(t0) * r * k], p1 = [Math.cos(t1) * r, Math.sin(t1) * r * k];
        const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const g = new BoxGeometry(len, 0.18, 0.2);
        g.applyMatrix4(new Matrix4().makeRotationZ(ang));
        g.applyMatrix4(new Matrix4().makeTranslation((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0));
        g.applyMatrix4(new Matrix4().makeRotationY(a));
        out.push(g);
      }
    }
    return out;
  });

const domeGeo = (r: number, k: number) => cached(`dome${r},${k}`, () => new SphereGeometry(r, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2).applyMatrix4(new Matrix4().makeScale(1, k, 1)));

/** Railing: posts + top rail + glass panes along x at (y, z). */
const Railing: React.FC<{ x0: number; x1: number; y: number; z: number; h?: number }> = ({ x0, x1, y, z, h = 1.1 }) => {
  const geo = useMemo(
    () =>
      mergeAll(`rail${x0},${x1},${y},${z}`, () => {
        const g: BufferGeometry[] = [boxAt(x1 - x0, 0.08, 0.12, (x0 + x1) / 2, y + h, z)];
        for (let x = x0; x <= x1 + 0.01; x += 1.6) g.push(boxAt(0.07, h, 0.07, x, y + h / 2, z));
        return g;
      }),
    [x0, x1, y, z, h],
  );
  return (
    <>
      <mesh geometry={geo} material={M.rail} castShadow />
      <B p={[(x0 + x1) / 2, y + h * 0.47, z]} s={[x1 - x0, h * 0.85, 0.03]} m={M.glassLight} cast={false} recv={false} />
    </>
  );
};

/** Floor-strip windows between pilasters on a facade plane. */
const WindowBand: React.FC<{ x0: number; x1: number; y0: number; y1: number; z: number }> = ({ x0, x1, y0, y1, z }) => (
  <>
    <BB a={[x0, y0, z - 0.2]} b={[x1, y1, z + 0.02]} m={M.glassWin} />
    <mesh geometry={mullions(`wb${x0},${x1},${y0},${z}`, x0, x1, y0, y1, z + 0.06, Math.max(1, Math.round((x1 - x0) / 1.8)), 1, 0.1, 0.12)} material={M.frame} />
  </>
);

// ── Parts ────────────────────────────────────────────────────────────────────

const Rotunda: React.FC = () => {
  const { x, z, r, h } = ROTUNDA;
  return (
    <group position={[x, 0, z]}>
      <Cy p={[0, 0.5, 0]} r={r + 0.4} h={1} m={M.bodyDark} seg={64} />
      <Cy p={[0, h / 2, 0]} r={r} h={h} m={M.glass} seg={64} />
      <mesh geometry={ringMullions("rotM", r + 0.05, 1, h, 40)} material={M.frame} castShadow />
      {/* orange bands */}
      <Cy p={[0, 5.5, 0]} r={r + 0.35} h={1.1} m={M.orange} seg={64} />
      <Cy p={[0, 10.3, 0]} r={r + 0.35} h={1.0} m={M.orange} seg={64} />
      <Cy p={[0, h + 0.4, 0]} r={r + 0.6} h={2.0} m={M.orange} seg={64} />
      <Cy p={[0, h + 1.55, 0]} r={r + 0.2} h={0.3} m={M.bodyLight} seg={64} />
      {/* dome */}
      <mesh geometry={domeGeo(r - 0.2, 0.42)} material={M.glassLight} position={[0, h + 1.7, 0]} />
      <mesh geometry={domeRibs("rotRibs", r - 0.15, 0.42, 20)} material={M.steel} position={[0, h + 1.7, 0]} castShadow />
      <Cy p={[0, h + 1.7 + (r - 0.2) * 0.42, 0]} r={1.0} h={0.4} m={M.steel} />
    </group>
  );
};

const LeftWing: React.FC = () => {
  const { x0, x1 } = LEFT;
  const pil = [x0 + 0.6, x0 + 6.6, x0 + 12.6, x0 + 18.6, x1 - 0.6];
  return (
    <group>
      <BB a={[x0 - 1, 0, -14]} b={[x1, 21.2, 0]} m={M.body} />
      {/* ground storefront */}
      <BB a={[x0, 0, 0]} b={[x1, 4.6, 0.25]} m={M.glassWin} />
      <mesh geometry={mullions("lwGround", x0, x1, 0.2, 4.6, 0.32, 12, 2, 0.12, 0.12)} material={M.frame} />
      <Sign p={[x0 + 6, 5.0, 0.6]} spec={SIGNS.lotteLeft} back={M.red} depth={0.4} />
      {[1, 2, 3].map((f) => (
        <WindowBand key={f} x0={x0} x1={x1} y0={FLOORS[f] + 1.3} y1={FLOORS[f] + 3.7} z={0.05} />
      ))}
      {pil.map((px, i) => (
        <BB key={i} a={[px - 0.7, 5.2, 0]} b={[px + 0.7, 21.6, 0.6]} m={M.red} />
      ))}
      {[5.5, 10.3, 15.1].map((y, i) => (
        <BB key={i} a={[x0 - 0.4, y - 0.5, 0]} b={[x1, y + 0.45, 0.9]} m={M.orange} />
      ))}
      <BB a={[x0 - 0.4, 19.9, 0]} b={[x1, 21.4, 0.9]} m={M.orangeDeep} />
    </group>
  );
};

/** Entrance platform + stairs as a height field (people walking in follow it). */
export const STAIRS = { z0: 9.5, z1: 11.75, steps: 5, rise: 0.15, top: 0.75 };
export const entranceGround = (x: number, z: number) => {
  const { x0, x1, zf } = ENTRANCE;
  if (x < x0 - 2 || x > x1 + 2 || z < zf - 2) return 0;
  if (z < STAIRS.z0) return STAIRS.top;
  if (z > STAIRS.z1 || x < x0 + 1 || x > x1 - 1) return 0;
  const k = Math.ceil((STAIRS.z1 - z) / ((STAIRS.z1 - STAIRS.z0) / STAIRS.steps));
  return Math.min(STAIRS.steps, Math.max(0, k)) * STAIRS.rise;
};
export const ENTRANCE_COLUMNS = [-12.5, -4.5, 3.5, 10.5];

const SILVER_GLASS = new MeshStandardMaterial({ color: "#c9d2d6", roughness: 0.1, metalness: 0.55, envMapIntensity: 1.3 });
const LIGHT_FRAME = new MeshStandardMaterial({ color: "#c3c7ca", roughness: 0.45, metalness: 0.35 });
const WHITE = new MeshStandardMaterial({ color: "#efefeb", roughness: 0.6 });
const BJ_BOX: SignSpec = { w: 26, h: 3.6, bg: null, lines: [{ text: "Bekasi Junction", color: "#2c4aa6", size: 2.9, weight: 600 }], ppm: 48, lit: 3.2 };

/** The glass entrance box as it looks today (reference: the frontal photo): silver glass, light frame,
 *  "Bekasi Junction" lettering on top, a heavy black canopy on white columns, red-white bunting, wide stairs. */
const EntranceBox: React.FC = () => {
  const { x0, x1, zf } = ENTRANCE;
  const cx = (x0 + x1) / 2;
  const F = 1.2; // frame thickness
  const top = 20.2;
  const { z0, z1, steps, rise } = STAIRS;
  const run = (z1 - z0) / steps;
  return (
    <group>
      {/* silver glass volume with a recessed inner frame and a light grid */}
      <BB a={[x0 + F, 7.6, -1]} b={[x1 - F, top - 1.2, zf - 0.7]} m={SILVER_GLASS} />
      <mesh geometry={mullions("entGrid2", x0 + F, x1 - F, 7.6, top - 1.2, zf - 0.6, 8, 6, 0.12, 0.16)} material={LIGHT_FRAME} castShadow />
      <BB a={[x0 + F + 1.4, 15.0, zf - 0.75]} b={[x1 - F - 1.4, 15.5, zf - 0.2]} m={LIGHT_FRAME} />
      <BB a={[x0 + F + 1.4, 7.6, zf - 0.75]} b={[x0 + F + 1.9, 15.5, zf - 0.2]} m={LIGHT_FRAME} />
      <BB a={[x1 - F - 1.9, 7.6, zf - 0.75]} b={[x1 - F - 1.4, 15.5, zf - 0.2]} m={LIGHT_FRAME} />
      {/* outer frame */}
      <BB a={[x0, 0, -1]} b={[x0 + F, top, zf]} m={LIGHT_FRAME} />
      <BB a={[x1 - F, 0, -1]} b={[x1, top, zf]} m={LIGHT_FRAME} />
      <BB a={[x0, top - 1.2, -1]} b={[x1, top, zf]} m={LIGHT_FRAME} />
      {/* lettering on top */}
      <Sign p={[cx, top + 2.0, zf - 1.6]} spec={BJ_BOX} />
      <B p={[cx, top + 0.12, zf - 1.7]} s={[24, 0.25, 0.5]} m={M.poleDark} />
      {/* heavy black canopy, white fascia, red-white bunting */}
      <BB a={[x0 - 2.5, 6.6, -1]} b={[x1 + 2.5, 7.6, zf + 4]} m={new MeshStandardMaterial({ color: "#1c1d1f", roughness: 0.6 })} />
      <BB a={[x0 + F, 5.8, zf - 1.6]} b={[x1 - F, 6.6, zf - 1.3]} m={WHITE} />
      <BB a={[x0 - 1.5, 6.25, zf + 3.85]} b={[x1 + 1.5, 6.6, zf + 3.95]} m={new MeshStandardMaterial({ color: "#c8221c", roughness: 0.8 })} cast={false} />
      <BB a={[x0 - 1.5, 5.85, zf + 3.85]} b={[x1 + 1.5, 6.25, zf + 3.95]} m={WHITE} cast={false} />
      {ENTRANCE_COLUMNS.map((px) => (
        <BB key={px} a={[px - 0.4, STAIRS.top, zf + 3.0]} b={[px + 0.4, 6.6, zf + 3.8]} m={WHITE} />
      ))}
      {/* doors */}
      <BB a={[x0 + F, STAIRS.top, zf - 1.8]} b={[x1 - F, 5.8, zf - 1.5]} m={M.glassWin} />
      <mesh geometry={mullions("entDoors2", x0 + F, x1 - F, STAIRS.top, 5.8, zf - 1.4, 10, 2, 0.12, 0.12)} material={M.frame} />
      {/* raised lobby platform + stairs + planters at the sides */}
      <BB a={[x0 - 2, 0, zf - 2]} b={[x1 + 2, STAIRS.top, z0]} m={mat("#4d4f52", 0.7)} />
      {Array.from({ length: steps }, (_, i) => (
        <BB key={i} a={[x0 + 1, 0, z0]} b={[x1 - 1, (steps - i) * rise, z0 + (i + 1) * run]} m={i % 2 ? mat("#55585b", 0.7) : mat("#4a4c4f", 0.7)} />
      ))}
      {[x0 - 1, x1 + 1].map((px) => (
        <group key={px}>
          <BB a={[px - 1, 0, z0]} b={[px + 1, 0.9, z1]} m={mat("#7a7d80", 0.8)} />
          <B p={[px, 1.3, (z0 + z1) / 2]} s={[1.8, 0.9, 1.8]} m={M.frondDry} />
          <B p={[px, 1.5, (z0 + z1) / 2]} s={[1.3, 0.9, 1.3]} m={M.frond} />
        </group>
      ))}
    </group>
  );
};

const RightWing: React.FC = () => {
  const { x0, x1 } = RIGHT;
  const pil = [x0 + 1.2, 18.5, 49.5, 54.5, x1 - 0.8];
  const ribs = Array.from({ length: 12 }, (_, i) => x0 + 2 + (i * (x1 - x0 - 4)) / 11);
  // canopy: from facade (y 12.6, z 0.8) sloping down to (y 11.0, z 8.6)
  const cz0 = 0.8, cz1 = 8.6, cy0 = 12.6, cy1 = 11.0;
  const slope = Math.atan2(cy0 - cy1, cz1 - cz0);
  const clen = Math.hypot(cz1 - cz0, cy0 - cy1);
  return (
    <group>
      <BB a={[x0, 0, -14]} b={[x1, 19.9, -1.5]} m={M.body} />
      {/* ground floor: storefront + Lotte Mart entry */}
      <BB a={[x0, 0, -1.5]} b={[x1, 4.8, 0]} m={M.bodyDark} />
      <BB a={[x0 + 1, 0.2, 0]} b={[x1 - 14, 4.2, 0.1]} m={M.glassWin} />
      <mesh geometry={mullions("rwGround", x0 + 1, x1 - 14, 0.2, 4.2, 0.15, 16, 1, 0.12, 0.12)} material={M.frame} />
      <BB a={[x1 - 12, 0, -1.4]} b={[x1 - 1.5, 2.6, -1.2]} m={M.glassWin} />
      <Sign p={[x1 - 6.8, 3.6, 0.25]} spec={SIGNS.lotteMasuk} back={M.bodyDark} depth={0.3} />
      {[x0 + 0.6, 30, 44, x1 - 13, x1 - 0.6].map((px, i) => (
        <BB key={i} a={[px - 0.5, 0, 0]} b={[px + 0.5, 5, 0.6]} m={M.bodyDark} />
      ))}
      {/* L2 terrace */}
      <BB a={[x0, 4.9, -1.5]} b={[x1, 5.5, 4.6]} m={M.concrete} />
      <BB a={[x0, 4.7, 4.6]} b={[x1, 5.9, 5.0]} m={M.orange} />
      <Railing x0={x0 + 0.3} x1={x1 - 0.3} y={5.9} z={4.75} />
      <BB a={[x0, 5.5, -1.6]} b={[x1, 10.0, -1.5]} m={M.bodyDark} />
      <WindowBand x0={x0 + 2} x1={x1 - 2} y0={6.4} y1={9.4} z={-1.45} />
      {/* thick orange band under the canopy */}
      <BB a={[x0 - 0.3, 10.0, -1.5]} b={[x1 + 0.3, 11.6, 1.0]} m={M.orange} />
      {/* sloped glass canopy */}
      <group position={[(x0 + x1) / 2, (cy0 + cy1) / 2, (cz0 + cz1) / 2]} rotation={[slope, 0, 0]}>
        <B p={[0, 0, 0]} s={[x1 - x0 - 2, 0.05, clen]} m={M.glassLight} cast={false} recv={false} />
        {ribs.map((rx, i) => (
          <B key={i} p={[rx - (x0 + x1) / 2, -0.15, 0]} s={[0.14, 0.3, clen + 0.2]} m={M.steel} />
        ))}
        <B p={[0, -0.12, clen / 2]} s={[x1 - x0 - 1.6, 0.3, 0.25]} m={M.steel} />
        <B p={[0, -0.12, 0]} s={[x1 - x0 - 2, 0.12, 0.12]} m={M.steel} />
      </group>
      {/* tie rods from the facade to the canopy tip */}
      {ribs.filter((_, i) => i % 2 === 0).map((rx, i) => {
        const a: V3 = [rx, 16.2, -1.2], b: V3 = [rx, cy1 + 0.1, cz1 - 0.2];
        const len = Math.hypot(b[1] - a[1], b[2] - a[2]);
        const ang = Math.atan2(b[2] - a[2], -(b[1] - a[1]));
        return <B key={i} p={[rx, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} s={[0.07, len, 0.07]} rot={[ang, 0, 0]} m={M.steel} />;
      })}
      {/* L3–L4 facade */}
      <BB a={[x0, 11.6, -1.5]} b={[x1, 19.9, -0.2]} m={M.body} />
      <WindowBand x0={x0 + 2} x1={20.5} y0={12.6} y1={14.4} z={-0.15} />
      <WindowBand x0={47.5} x1={x1 - 2} y0={12.6} y1={14.4} z={-0.15} />
      <WindowBand x0={x0 + 2} x1={20.5} y0={16.4} y1={18.4} z={-0.15} />
      <WindowBand x0={47.5} x1={x1 - 2} y0={16.4} y1={18.4} z={-0.15} />
      <BB a={[x0 - 0.3, 15.0, -0.2]} b={[x1 + 0.3, 15.7, 0.6]} m={M.orange} />
      {pil.map((px, i) => (
        <BB key={i} a={[px - 0.7, 11.6, -0.2]} b={[px + 0.7, 21.2, 0.5]} m={M.red} />
      ))}
      <BB a={[x0 - 0.3, 19.9, -1.5]} b={[x1 + 0.3, 21.2, 0.6]} m={M.orangeDeep} />
      {/* big Ramayana sign */}
      <Sign p={[34, 15.9, 1.15]} spec={SIGNS.ramayanaBig} back={M.red} depth={0.8} />
      {/* roof lettering on a steel frame */}
      <Sign p={[33, 23.6, -1.2]} spec={SIGNS.bjRoof} />
      {[21, 27, 33, 39, 45].map((px, i) => (
        <B key={i} p={[px, 22.2, -1.5]} s={[0.15, 2.2, 0.15]} m={M.poleDark} />
      ))}
      <B p={[33, 21.6, -1.5]} s={[28, 0.15, 0.15]} m={M.poleDark} />
    </group>
  );
};

const Tower: React.FC = () => {
  const { x, z, r, h } = TOWER;
  return (
    <group position={[x, 0, z]}>
      <Cy p={[0, h / 2, 0]} r={r} h={h} m={M.body} seg={48} />
      {[5.5, 10.3, 15.1].map((y, i) => (
        <Cy key={i} p={[0, y, 0]} r={r + 0.3} h={0.9} m={M.orange} seg={48} />
      ))}
      {[17.2, 19.4, 21.6].map((y, i) => (
        <Cy key={i} p={[0, y, 0]} r={r + 0.35} h={1.1} m={i === 1 ? M.orangeDeep : M.orange} seg={48} />
      ))}
      <Cy p={[0, h - 0.5, 0]} r={r + 0.5} h={1.2} m={M.orange} seg={48} />
      <Cy p={[0, h + 0.4, 0]} r={r - 0.6} h={0.8} m={M.bodyLight} seg={48} />
      {/* slit windows */}
      <B p={[0, 8, r - 0.05]} s={[1.2, 8, 0.2]} m={M.glassWin} />
    </group>
  );
};

const MainBlock: React.FC = () => (
  <group>
    {/* the deep mass behind the front wings */}
    <BB a={[-62, 0, -60]} b={[72, 19.9, -14]} m={M.body} />
    <BB a={[-62, 19.9, -60]} b={[72, 20.6, -14]} m={M.bodyLight} />
    <BB a={[60, 0, -14]} b={[72, 17, -2]} m={M.bodyDark} />
    <BB a={[-61, 0, -14]} b={[-39.5, 17, -8]} m={M.bodyDark} />
    {/* side facades: orange bands + windows */}
    {[5.5, 10.3, 15.1].map((y, i) => (
      <React.Fragment key={i}>
        <BB a={[72, y - 0.45, -60]} b={[72.6, y + 0.45, -2]} m={M.orange} />
        <BB a={[-62.6, y - 0.45, -60]} b={[-62, y + 0.45, -14]} m={M.orange} />
      </React.Fragment>
    ))}
    {/* rooftop plant: AC units, tanks, stair houses */}
    {Array.from({ length: 14 }, (_, i) => (
      <B key={i} p={[-40 + (i % 7) * 12, 21.5, -24 - Math.floor(i / 7) * 14]} s={[3.2, 1.8, 2.2]} m={i % 3 ? M.bodyLight : M.concrete} />
    ))}
    <B p={[-20, 23, -40]} s={[8, 5, 6]} m={M.bodyLight} />
    <B p={[48, 22.5, -36]} s={[6, 4, 6]} m={M.bodyLight} />
    <Cy p={[10, 23, -48]} r={2} h={4.5} m={M.concrete} seg={24} />
    <Cy p={[15, 23, -48]} r={2} h={4.5} m={M.concrete} seg={24} />
  </group>
);

export const Mall: React.FC = React.memo(() => (
  <group>
    <MainBlock />
    <Rotunda />
    <LeftWing />
    <EntranceBox />
    <RightWing />
    <Tower />
  </group>
));
