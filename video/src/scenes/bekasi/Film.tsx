// Director: maps film time T (seconds) to a shot — camera, mood and the life in the world.
// Cuts sit inside the VO's sentence pauses. The preview is the first 20.6 s of the same film.

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Stage3D } from "../../core/film/Stage3D.tsx";
import { Voiceover } from "../../core/film/Voiceover.tsx";
import { sample, type Key } from "../../core/motion/track.ts";
import type { Shot } from "../../kits/worldforge/Stage.tsx";
import { World, type MoodName } from "./World.tsx";
import { Traffic } from "./Traffic.tsx";
import { Crowd, Standers, makeWalkers, randomLook, type Stander, type Walker } from "./People.tsx";
import { EndCards, Subtitles, TitleCard } from "./Overlay.tsx";
import { OFFSET, VO_FILE } from "./script.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";

/** Camera keys in seconds: [t, px,py,pz, tx,ty,tz, fov]. */
const cam = (rows: number[][]): Key[] => rows.map((r) => ({ f: r[0], v: r.slice(1) }));
const shotFrom = (k: Key[], t: number, near = 0.3): Shot => {
  const v = sample(k, t);
  return { pos: [v[0], v[1], v[2]], target: [v[3], v[4], v[5]], fov: v[6], near, far: 4000 };
};

const vo = (s: number) => s + OFFSET;

type ShotDef = {
  a: number; // film seconds
  mood: MoodName;
  night?: number;
  camera: (t: number) => Shot;
  life: (t: number) => React.ReactNode;
};

// ── Crowds used by the opening (built once) ──────────────────────────────────

const sidewalk: Walker[] = makeWalkers(21, 46, { x0: -70, x1: 75, z0: 12.3, z1: 14.9, gap: 0.85, families: true });
const farSidewalk: Walker[] = makeWalkers(22, 24, { x0: -60, x1: 60, z0: 31.6, z1: 34.8, gap: 1.0 });
const forecourt: Walker[] = makeWalkers(23, 34, { x0: -60, x1: 58, z0: 1.4, z1: 9.6, gap: 0.95, families: true });
/** Families heading into the glass entrance (walk −z toward the doors). */
const toDoors: Walker[] = (() => {
  const r = mulberry32(24);
  const out: Walker[] = [];
  const xs = [-9.6, -8.4, -6.0, -4.8, -2.2, -1.0, 1.6, 2.8, 5.4, 6.6];
  xs.forEach((x, i) => {
    out.push({ id: `door${i}`, look: randomLook(r, i % 3 === 2 ? "kid" : undefined), from: [x, 0.13, 11.7 - (i % 3) * 0.55], dir: -1, v: 0.85, phase0: r() });
  });
  return out;
})();
const terrace: Stander[] = (() => {
  const r = mulberry32(25);
  return Array.from({ length: 16 }, (_, i) => ({
    id: `ter${i}`,
    look: randomLook(r),
    at: [16 + i * 2.7 + r() * 0.6, 5.5, 3.6 - r() * 1.6] as [number, number, number],
    yaw: (r() - 0.5) * 1.4,
    pose: "stand" as const,
    phase0: r(),
  }));
})();

/** Drop walkers whose path enters [x0, x1] (along x) during the clock window [t0, t1]. */
const avoid = (ws: Walker[], t0: number, t1: number, x0: number, x1: number) =>
  ws.filter((w) => {
    const a = w.from[0] + w.dir * w.v * t0, b = w.from[0] + w.dir * w.v * t1;
    return Math.max(a, b) < x0 || Math.min(a, b) > x1;
  });
const S2 = { sidewalk: avoid(forecourt, 9, 16, -13, 9) };
const S2walk = sidewalk;
const S2far = avoid(farSidewalk, 9, 16, -27, -4);

// ── Shot list ────────────────────────────────────────────────────────────────

export const SHOTS: ShotDef[] = [
  // 1. Drone over Pasar Proyek, closing in on the mall — "Di Bekasi … Namanya Bekasi Junction."
  {
    a: 0,
    mood: "day",
    camera: (t) =>
      shotFrom(
        cam([
          [0, -120, 175, 360, 20, 0, -30, 40],
          [4.5, -40, 95, 190, 10, 6, -10, 40],
          [8.45, 6, 30, 82, 2, 13, 0, 42],
        ]),
        t,
        1,
      ),
    life: (t) => (
      <>
        <Traffic seed={1} density={1} t={t} />
        <Crowd walkers={sidewalk} t={t} tag={false} />
        <Crowd walkers={forecourt} t={t} tag={false} />
        <Crowd walkers={farSidewalk} t={t} tag={false} />
      </>
    ),
  },
  // 2. Street level across Jl. raya, angkot passing, families walking in — "Dulu, tempat ini …"
  {
    a: vo(7.85),
    mood: "day",
    camera: (t) =>
      shotFrom(
        cam([
          [0, -18, 3.4, 32.4, -3, 9.5, 3, 64],
          [6.65, -10, 3.5, 32.2, -1, 10, 3, 60],
        ]),
        t,
      ),
    life: (t) => (
      <>
        <Traffic seed={2} density={1} t={t + 6} />
        <Crowd walkers={S2walk} t={t + 9} />
        <Crowd walkers={S2.sidewalk} t={t + 9} />
        <Crowd walkers={S2far} t={t + 9} />
        <Crowd walkers={toDoors} t={t} along="z" />
      </>
    ),
  },
  // 3. Crane up the canopy wing: terrace, Ramayana, the roof lettering — "Bermain, berbelanja …"
  {
    a: vo(14.5),
    mood: "day",
    camera: (t) =>
      shotFrom(
        cam([
          [0, 20, 6.2, 24, 31, 8.5, 2, 52],
          [2.6, 24, 12, 32, 33, 13.5, 0, 50],
          [5.5, 28, 19, 46, 33, 17.5, -1, 46],
        ]),
        t,
      ),
    life: (t) => (
      <>
        <Traffic seed={3} density={1} t={t + 3} />
        <Standers list={terrace} t={t} />
        <Crowd walkers={sidewalk} t={t + 16} />
        <Crowd walkers={forecourt} t={t + 16} />
      </>
    ),
  },
];

export const PREVIEW_END = vo(20.0);
export const PREVIEW_CUTS = SHOTS.slice(1).map((s) => s.a).filter((a) => a < PREVIEW_END);

const shotAt = (T: number) => {
  let i = 0;
  while (i < SHOTS.length - 1 && T >= SHOTS[i + 1].a) i++;
  return SHOTS[i];
};

export const BekasiFilm: React.FC<{ withVo?: boolean }> = ({ withVo = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const s = shotAt(T);
  const t = T - s.a;
  return (
    <>
      <Stage3D
        background="#d6e2ea"
        overlay={() => (
          <>
            <TitleCard T={T} a={vo(5.75)} b={vo(7.75)} />
            <Subtitles T={T} />
            <EndCards T={T} a={vo(109.4)} q={vo(120.3)} end={vo(124.04) + 3} />
          </>
        )}
      >
        <World shot={s.camera(t)} mood={s.mood} night={s.night ?? 0} frame={frame}>
          {s.life(t)}
        </World>
      </Stage3D>
      {withVo ? <Voiceover src={VO_FILE} offset={OFFSET} /> : null}
    </>
  );
};
