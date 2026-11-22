// "Kota Bekasi semakin berkembang" / "Banyak mall baru bermunculan": new towers and new (generic, unbranded) malls
// that rise out of the city around Bekasi Junction. Progress values drive the rise; once risen they stay.

import React, { useMemo } from "react";
import { MeshStandardMaterial, Color } from "three";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { glow, mat } from "./kit.ts";
import { B } from "./prim.tsx";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const towerGlass = mat("#6f8ea6", 0.15, 0.6);
const towerGlass2 = mat("#9fb1bd", 0.2, 0.5);
const towerBand = mat("#e9edf0", 0.5);
const ledA = glow(new MeshStandardMaterial({ color: "#ff7a3d", emissive: new Color("#ff7a3d"), roughness: 0.4 }), 0.6, 2.6, "newmall");
const ledB = glow(new MeshStandardMaterial({ color: "#3dc7ff", emissive: new Color("#3dc7ff"), roughness: 0.4 }), 0.6, 2.6, "newmall");
const ledC = glow(new MeshStandardMaterial({ color: "#c46bff", emissive: new Color("#c46bff"), roughness: 0.4 }), 0.6, 2.6, "newmall");
const mallGlass = glow(new MeshStandardMaterial({ color: "#5d7d93", roughness: 0.1, metalness: 0.6, emissive: new Color("#ffe2b0") }), 0, 0.9, "newmall");

export const TOWERS = (() => {
  const r = mulberry32(404);
  const out: { x: number; z: number; w: number; d: number; h: number; m: number; at: number }[] = [];
  const spots: [number, number][] = [[-210, -260], [-140, -330], [-60, -420], [60, -300], [150, -380], [240, -260], [320, -420], [-300, -180], [-260, -520], [120, -560], [420, -300], [-420, -350], [10, -650], [280, -600]];
  spots.forEach(([x, z], i) => out.push({ x, z, w: 22 + r() * 14, d: 22 + r() * 14, h: 70 + r() * 80, m: i % 2, at: i / spots.length }));
  return out;
})();

export const NEW_MALLS = [
  { x: 360, z: -230, w: 150, d: 90, h: 34, led: ledA, at: 0.0 },
  { x: -330, z: -360, w: 130, d: 100, h: 30, led: ledB, at: 0.3 },
  { x: 170, z: -520, w: 170, d: 100, h: 38, led: ledC, at: 0.55 },
];

/** towers / malls: 0 = not built, 1 = all built (each rises in its own slice of the range). */
export const Growth: React.FC<{ towers: number; malls: number }> = ({ towers, malls }) => {
  const tw = useMemo(() => TOWERS, []);
  return (
    <group>
      {tw.map((t, i) => {
        const k = ease((towers - t.at * 0.7) / 0.3);
        if (k <= 0.001) return null;
        const h = t.h * k;
        return (
          <group key={i} position={[t.x, 0, t.z]}>
            <B p={[0, h / 2, 0]} s={[t.w, h, t.d]} m={t.m ? towerGlass : towerGlass2} />
            {Array.from({ length: Math.floor(h / 12) }, (_, j) => (
              <B key={j} p={[0, 6 + j * 12, 0]} s={[t.w + 0.4, 0.8, t.d + 0.4]} m={towerBand} />
            ))}
          </group>
        );
      })}
      {NEW_MALLS.map((m, i) => {
        const k = ease((malls - m.at) / 0.45);
        if (k <= 0.001) return null;
        const h = m.h * k;
        return (
          <group key={i} position={[m.x, 0, m.z]}>
            <B p={[0, h / 2, 0]} s={[m.w, h, m.d]} m={mallGlass} />
            {[0.25, 0.55, 0.85].map((f) => (f * m.h < h ? <B key={f} p={[0, f * m.h, 0]} s={[m.w + 1.2, 1.6, m.d + 1.2]} m={m.led} /> : null))}
            <B p={[0, h + 1.2, 0]} s={[m.w * 0.6, 2.4 * k, m.d * 0.6]} m={mat("#d9dde0", 0.6)} />
          </group>
        );
      })}
    </group>
  );
};
