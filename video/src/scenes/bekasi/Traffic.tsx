// Traffic on Jl. raya: angkot, cars, pick-ups and motorbikes. Positions are a pure function of time:
// x = x0 + dir · v · t (no wrapping, so nothing ever pops in view). Each scene passes its own local clock.

import React, { useMemo } from "react";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { M, mat } from "./kit.ts";
import { B, Cy } from "./prim.tsx";
import { LANES } from "./Street.tsx";
import { Person, type Look as PLook } from "./People.tsx";

type Kind = "angkot" | "car" | "pickup" | "moto" | "bus";
type Veh = { kind: Kind; lane: number; dir: 1 | -1; v: number; x0: number; color: string; seed: number };

const CAR_COLORS = ["#e9e9e6", "#b9bcbf", "#2b2d31", "#8d9196", "#7a1f1f", "#d8d6cf", "#3b4d6b", "#f2f1ec"];
const ANGKOT = ["#c8231f", "#d9481c", "#b81d1d", "#e0601e"];

const Wheel: React.FC<{ x: number; z: number; r?: number }> = ({ x, z, r = 0.32 }) => (
  <Cy p={[x, r, z]} r={r} h={0.22} m={M.tyre} rot={[Math.PI / 2, 0, 0]} seg={14} cast={false} />
);

const Body: React.FC<{ v: Veh }> = ({ v }) => {
  const paint = mat(v.color, 0.35, 0.3);
  const glass = mat("#1d2730", 0.15, 0.6);
  if (v.kind === "angkot")
    return (
      <group>
        <B p={[0, 1.15, 0]} s={[4.0, 1.5, 1.68]} m={paint} />
        <B p={[1.75, 0.82, 0]} s={[0.6, 0.85, 1.6]} m={paint} />
        <B p={[0.15, 1.45, 0]} s={[3.2, 0.55, 1.7]} m={glass} />
        <B p={[1.9, 1.45, 0]} s={[0.25, 0.55, 1.5]} m={glass} />
        <B p={[0, 1.95, 0]} s={[3.9, 0.12, 1.6]} m={mat("#e9e7e1", 0.5)} />
        <B p={[0, 0.5, 0]} s={[4.05, 0.18, 1.7]} m={mat("#e8e6de", 0.5)} />
        <Wheel x={1.35} z={0.78} /><Wheel x={1.35} z={-0.78} /><Wheel x={-1.25} z={0.78} /><Wheel x={-1.25} z={-0.78} />
      </group>
    );
  if (v.kind === "bus")
    return (
      <group>
        <B p={[0, 1.7, 0]} s={[9, 2.6, 2.4]} m={paint} />
        <B p={[0, 2.25, 0]} s={[8.8, 0.9, 2.44]} m={glass} />
        <B p={[4.45, 1.9, 0]} s={[0.15, 1.6, 2.1]} m={glass} />
        <Wheel x={3} z={1.1} r={0.48} /><Wheel x={3} z={-1.1} r={0.48} /><Wheel x={-3} z={1.1} r={0.48} /><Wheel x={-3} z={-1.1} r={0.48} />
      </group>
    );
  if (v.kind === "pickup")
    return (
      <group>
        <B p={[1.1, 1.15, 0]} s={[1.9, 1.3, 1.65]} m={paint} />
        <B p={[1.45, 1.42, 0]} s={[1.0, 0.55, 1.68]} m={glass} />
        <B p={[-0.95, 0.85, 0]} s={[2.4, 0.5, 1.65]} m={paint} />
        <B p={[-0.95, 0.62, 0]} s={[2.4, 0.1, 1.6]} m={mat("#2b2b2b", 0.8)} />
        <B p={[-1.0, 1.25, 0]} s={[1.4, 0.5, 1.2]} m={mat("#c7b48a", 0.9)} />
        <Wheel x={1.25} z={0.75} /><Wheel x={1.25} z={-0.75} /><Wheel x={-1.3} z={0.75} /><Wheel x={-1.3} z={-0.75} />
      </group>
    );
  if (v.kind === "moto") {
    const rng = mulberry32(v.seed);
    const look: PLook = { kind: rng() < 0.3 ? "hijab" : "man", shirt: ["#2d4f8a", "#3a3a3a", "#8a2d2d", "#5a6b3a", "#d9d4c8"][Math.floor(rng() * 5)], pants: "#2a2c33", helmet: rng() < 0.85 };
    return (
      <group>
        <B p={[0, 0.62, 0]} s={[1.5, 0.35, 0.36]} m={paint} />
        <B p={[0.55, 0.95, 0]} s={[0.25, 0.5, 0.3]} m={paint} />
        <B p={[0.6, 1.2, 0]} s={[0.08, 0.08, 0.7]} m={M.poleDark} />
        <Wheel x={0.62} z={0} r={0.3} /><Wheel x={-0.6} z={0} r={0.3} />
        <group position={[-0.2, 0.65, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <Person look={look} pose="ride" phase={0} />
        </group>
      </group>
    );
  }
  return (
    <group>
      <B p={[0, 0.72, 0]} s={[4.3, 0.72, 1.76]} m={paint} />
      <B p={[-0.25, 1.32, 0]} s={[2.3, 0.56, 1.6]} m={glass} />
      <B p={[-0.25, 1.62, 0]} s={[2.1, 0.08, 1.5]} m={paint} />
      <Wheel x={1.35} z={0.8} /><Wheel x={1.35} z={-0.8} /><Wheel x={-1.35} z={0.8} /><Wheel x={-1.35} z={-0.8} />
    </group>
  );
};

/** A deterministic set of vehicles. density 0..1 scales the count (busy 2000s vs quiet 2020). */
export const makeTraffic = (seed: number, density: number): Veh[] => {
  const r = mulberry32(seed);
  const out: Veh[] = [];
  const lanes: [number, 1 | -1][] = [
    [LANES.east[0], 1], [LANES.east[1], 1], [LANES.west[0], -1], [LANES.west[1], -1],
  ];
  for (const [z, dir] of lanes) {
    let x = -320 + r() * 20;
    while (x < 320) {
      const roll = r();
      const kind: Kind = roll < 0.3 ? "angkot" : roll < 0.62 ? "car" : roll < 0.76 ? "pickup" : roll < 0.97 ? "moto" : "bus";
      const color = kind === "angkot" ? ANGKOT[Math.floor(r() * 4)] : kind === "pickup" ? (r() < 0.6 ? "#2b4c9a" : "#d8d8d2") : kind === "bus" ? "#2b5aa0" : CAR_COLORS[Math.floor(r() * CAR_COLORS.length)];
      const motoLane = kind === "moto" ? (r() - 0.5) * 1.6 : 0;
      out.push({ kind, lane: z + motoLane, dir, v: kind === "moto" ? 9 + r() * 3 : 7 + r() * 3, x0: x, color, seed: Math.floor(r() * 1e6) });
      x += (kind === "moto" ? 5 : 9) + (r() * 18) / Math.max(0.15, density);
    }
  }
  return out;
};

export const Traffic: React.FC<{ seed: number; density: number; t: number; speed?: number }> = ({ seed, density, t, speed = 1 }) => {
  const list = useMemo(() => makeTraffic(seed, density), [seed, density]);
  return (
    <group>
      {list.map((v, i) => {
        const x = v.x0 + v.dir * v.v * speed * t;
        return (
          <group key={i} position={[x, 0.05, v.lane]} rotation={[0, v.dir === 1 ? 0 : Math.PI, 0]}>
            <Body v={v} />
          </group>
        );
      })}
    </group>
  );
};
