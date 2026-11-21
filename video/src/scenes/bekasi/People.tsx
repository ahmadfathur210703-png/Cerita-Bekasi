// Stylised people (not photoreal): rounded bodies, ball heads, simple hair / hijab / helmet.
// A figure faces +z; poses are pure functions of `phase` (walk cycle, dance beat).
// Crowds: deterministic walkers on straight paths + standing groups, all from a seed and a clock.

import React, { useMemo } from "react";
import { CapsuleGeometry, SphereGeometry } from "three";
import { cached } from "../../kits/worldforge/geo.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { Solid } from "../../core/qa/scene-qa.tsx";
import { mat } from "./kit.ts";
import type { V3 } from "./prim.tsx";

export type Look = {
  kind: "man" | "woman" | "hijab" | "kid" | "teen";
  shirt: string;
  pants: string;
  skin?: string;
  hair?: string;
  hijab?: string;
  helmet?: boolean;
};
export type Pose = "walk" | "stand" | "ride" | "sit" | "dance";

const cap = (r: number, l: number) => cached(`cap${r},${l}`, () => new CapsuleGeometry(r, l, 4, 10));
const ball = (r: number) => cached(`ball${r}`, () => new SphereGeometry(r, 16, 12));
const halfBall = (r: number) => cached(`hball${r}`, () => new SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55));

const SKINS = ["#e2b48f", "#c9966f", "#b07a55", "#d8a77f"];

export const Person: React.FC<{ look: Look; pose: Pose; phase: number; scale?: number }> = ({ look, pose, phase, scale }) => {
  const kid = look.kind === "kid";
  const s = scale ?? (kid ? 0.62 : look.kind === "teen" ? 0.92 : 1);
  const skin = mat(look.skin ?? SKINS[0], 0.75);
  const shirt = mat(look.shirt, 0.85);
  const pants = mat(look.pants, 0.85);
  const w = Math.sin(phase * Math.PI * 2);
  let leg = 0, arm = 0, bob = 0, armLift = 0, hip = 0.95;
  if (pose === "walk") {
    leg = w * 0.45;
    arm = -w * 0.4;
    bob = Math.abs(Math.cos(phase * Math.PI * 2)) * 0.035;
  } else if (pose === "dance") {
    leg = w * 0.25;
    armLift = 1.9 + Math.sin(phase * Math.PI * 4) * 0.5;
    bob = Math.abs(w) * 0.06;
  } else if (pose === "stand") {
    arm = Math.sin(phase * Math.PI * 2) * 0.04;
  }
  const seated = pose === "ride" || pose === "sit";
  const skirt = look.kind === "hijab" || look.kind === "woman";
  const legRot = seated ? -1.45 : 0;
  return (
    <group scale={s}>
      <group position={[0, (seated ? 0.05 : 0) + bob, 0]}>
        {/* legs (pivot at hip) */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.1, seated ? 0.05 : hip, 0]} rotation={[legRot + side * leg, 0, 0]}>
            <mesh geometry={cap(0.075, 0.68)} material={pants} position={[0, -0.42, 0]} castShadow />
            {seated ? <mesh geometry={cap(0.075, 0.38)} material={pants} position={[0, -0.82, 0.2]} rotation={[1.45, 0, 0]} castShadow /> : null}
            <mesh geometry={ball(0.085)} material={mat("#2a2a2a", 0.7)} position={[0, seated ? -0.86 : -0.86, seated ? 0.45 : 0.05]} castShadow />
          </group>
        ))}
        <group position={[0, seated ? 0.1 : hip, 0]}>
          {/* skirt / long dress for women */}
          {skirt && !seated ? <mesh geometry={cap(0.2, 0.55)} material={pants} position={[0, -0.25, 0]} castShadow /> : null}
          {/* torso */}
          <mesh geometry={cap(0.19, 0.42)} material={shirt} position={[0, 0.38, 0]} castShadow />
          {/* arms (pivot at shoulder) */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.25, 0.65, 0]} rotation={[pose === "ride" ? -1.2 : side * arm + 0, 0, side * (0.08 + armLift * 0.9)]}>
              <mesh geometry={cap(0.06, 0.5)} material={shirt} position={[0, -0.3, 0]} castShadow />
              <mesh geometry={ball(0.065)} material={skin} position={[0, -0.62, 0]} />
            </group>
          ))}
          {/* head */}
          <group position={[0, 0.98, 0]}>
            <mesh geometry={ball(0.17)} material={skin} castShadow />
            {look.helmet ? (
              <mesh geometry={halfBall(0.205)} material={mat(look.shirt === "#3a3a3a" ? "#b0262a" : "#2b2b2b", 0.3, 0.2)} position={[0, 0.0, -0.01]} castShadow />
            ) : look.kind === "hijab" ? (
              <>
                <mesh geometry={ball(0.19)} material={mat(look.hijab ?? "#6b8fb5", 0.85)} position={[0, 0.02, -0.03]} castShadow />
                <mesh geometry={cap(0.22, 0.12)} material={mat(look.hijab ?? "#6b8fb5", 0.85)} position={[0, -0.22, -0.02]} castShadow />
                {/* face opening */}
                <mesh geometry={ball(0.135)} material={skin} position={[0, -0.01, 0.075]} />
              </>
            ) : (
              <mesh geometry={halfBall(0.18)} material={mat(look.hair ?? "#1d1a18", 0.8)} position={[0, 0.03, -0.02]} rotation={[-0.25, 0, 0]} castShadow />
            )}
            {/* eyes: two dark dots, the only face detail */}
            {[-1, 1].map((side) => (
              <mesh key={side} geometry={ball(0.022)} material={mat("#1a1a1a", 0.5)} position={[side * 0.055, 0.02, look.kind === "hijab" ? 0.2 : 0.155]} />
            ))}
          </group>
        </group>
      </group>
    </group>
  );
};

// ── Crowds ───────────────────────────────────────────────────────────────────

const SHIRTS = ["#d9534f", "#3c6fb6", "#f2c14e", "#4caf7a", "#ffffff", "#e07b39", "#7d5ba6", "#2f3b52", "#e88fb0", "#5bc0de", "#8bc34a", "#c0392b"];
const PANTS = ["#2f3640", "#3d4f73", "#4a3f35", "#1f2a36", "#6b6b6b", "#2d3436"];
const HIJABS = ["#c55a7a", "#6b8fb5", "#e9c46a", "#2a9d8f", "#8e6c8a", "#f4a261", "#3d405b", "#b5838d"];

export const randomLook = (r: () => number, kind?: Look["kind"]): Look => {
  const roll = r();
  const k: Look["kind"] = kind ?? (roll < 0.28 ? "man" : roll < 0.48 ? "hijab" : roll < 0.6 ? "woman" : roll < 0.8 ? "teen" : "kid");
  return {
    kind: k,
    shirt: SHIRTS[Math.floor(r() * SHIRTS.length)],
    pants: k === "hijab" || k === "woman" ? HIJABS[Math.floor(r() * HIJABS.length)] : PANTS[Math.floor(r() * PANTS.length)],
    skin: SKINS[Math.floor(r() * SKINS.length)],
    hair: r() < 0.85 ? "#1b1816" : "#4a3426",
    hijab: HIJABS[Math.floor(r() * HIJABS.length)],
  };
};

export type Walker = { id: string; look: Look; from: V3; dir: number; v: number; phase0: number; group?: number };
export type Stander = { id: string; look: Look; at: V3; yaw: number; pose: Pose; phase0: number };

/** Walkers on parallel lanes (no two lanes closer than `gap`), so nobody passes through anybody. */
export const makeWalkers = (seed: number, n: number, opts: { x0: number; x1: number; z0: number; z1: number; gap?: number; along?: "x" | "z"; families?: boolean }): Walker[] => {
  const r = mulberry32(seed);
  const gap = opts.gap ?? 0.9;
  const out: Walker[] = [];
  const nl = Math.max(1, Math.floor((opts.z1 - opts.z0) / gap));
  for (let i = 0; i < n; i++) {
    const lane = i % nl;
    const z = opts.z0 + (lane + 0.5) * gap;
    const dir = lane % 2 === 0 ? 1 : -1;
    const v = 1.15 + r() * 0.15;
    const x = opts.x0 + ((Math.floor(i / nl) + r() * 0.6) / Math.ceil(n / nl)) * (opts.x1 - opts.x0);
    const head = randomLook(r);
    out.push({ id: `w${seed}_${i}`, look: head, from: [x, 0.13, z], dir, v, phase0: r() });
    // families: a kid walking next to an adult (same lane speed, offset sideways stays within the lane)
    if (opts.families && head.kind !== "kid" && r() < 0.35) {
      out.push({ id: `w${seed}_${i}k`, look: randomLook(r, "kid"), from: [x - dir * 0.9, 0.13, z], dir, v, phase0: r() });
    }
  }
  return out;
};

const WalkerFig: React.FC<{ w: Walker; t: number; along: "x" | "z"; tag: boolean }> = ({ w, t, along, tag }) => {
  const d = w.v * t * w.dir;
  const pos: V3 = along === "x" ? [w.from[0] + d, w.from[1], w.from[2]] : [w.from[0], w.from[1], w.from[2] + d];
  const yaw = along === "x" ? (w.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : w.dir > 0 ? 0 : Math.PI;
  const stride = w.look.kind === "kid" ? 0.9 : 1.35;
  const fig = <Person look={w.look} pose="walk" phase={w.phase0 + (w.v * t) / stride} />;
  return tag ? (
    <Solid id={w.id} kind="body" position={pos} rotation={[0, yaw, 0]}>
      {fig}
    </Solid>
  ) : (
    <group position={pos} rotation={[0, yaw, 0]}>
      {fig}
    </group>
  );
};

export const Crowd: React.FC<{ walkers: Walker[]; t: number; along?: "x" | "z"; tag?: boolean }> = ({ walkers, t, along = "x", tag = true }) => (
  <group>
    {walkers.map((w) => (
      <WalkerFig key={w.id} w={w} t={t} along={along} tag={tag} />
    ))}
  </group>
);

export const Standers: React.FC<{ list: Stander[]; t: number; tag?: boolean }> = ({ list, t, tag = true }) => (
  <group>
    {list.map((s) => {
      const fig = <Person look={s.look} pose={s.pose} phase={s.phase0 + t * (s.pose === "dance" ? 0.55 : 0.2)} />;
      return tag ? (
        <Solid key={s.id} id={s.id} kind="body" position={s.at} rotation={[0, s.yaw, 0]}>
          {fig}
        </Solid>
      ) : (
        <group key={s.id} position={s.at} rotation={[0, s.yaw, 0]}>
          {fig}
        </group>
      );
    })}
  </group>
);

export const useWalkers = (seed: number, n: number, opts: Parameters<typeof makeWalkers>[2]) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => makeWalkers(seed, n, opts), [seed, n]);
