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
import { AW_TABLES, IN_X, KIOSKS, TENANT, Trolley, type InteriorState } from "./Interior.tsx";
import { Growth } from "./Growth.tsx";
import { Person, type Look } from "./People.tsx";
import { Solid } from "../../core/qa/scene-qa.tsx";
import { YearBadge } from "./Overlay.tsx";
import type { V3 } from "./prim.tsx";

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
  night?: number | ((t: number) => number);
  tenants?: number;
  inside?: (t: number) => InteriorState;
  extras?: (t: number) => React.ReactNode;
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


// ── Interior helpers (interior coordinates are local; the interior sits at x + IN_X) ─────────────

const icam = (rows: number[][]): Key[] => rows.map((r) => ({ f: r[0], v: [r[1] + IN_X, r[2], r[3], r[4] + IN_X, r[5], r[6], r[7]] }));
/** Drop walkers on lanes within `rz` of the camera's z whose path enters [x0, x1] during [t0, t1]. */
const avoidNear = (ws: Walker[], t0: number, t1: number, x0: number, x1: number, zc: number, rz = 1.2) =>
  ws.filter((w) => Math.abs(w.from[2] - zc) > rz || avoid([w], t0, t1, x0, x1).length > 0);
const masked = (ws: Walker[]): Walker[] => ws.map((w) => ({ ...w, look: { ...w.look, mask: true } }));
const away = (ws: Walker[]): Walker[] => ws.map((w) => ({ ...w, dir: -1 }));

const corrGlory = makeWalkers(31, 64, { x0: -46, x1: 30, z0: -3.8, z1: 3.8, gap: 0.95, families: true });
const corrCovid = masked(makeWalkers(41, 7, { x0: -40, x1: 10, z0: -3.6, z1: 3.6, gap: 1.2 }));
const laneCovid = away(masked(makeWalkers(42, 6, { x0: 96, x1: 112, z0: -2.4, z1: 2.4, gap: 1.2 })));
const corr2026 = makeWalkers(51, 12, { x0: -48, x1: 10, z0: -3.6, z1: 3.6, gap: 1.2, families: true });

/** People standing inside a tenant (local frame of the tenant: front at z 0, inside toward −z). */
const browsers = (seed: number, n: number, x0: number, x1: number, z0: number, z1: number, idp: string, era: "glory" | "covid" = "glory"): Stander[] => {
  const r = mulberry32(seed);
  const out: Stander[] = [];
  const cols = Math.ceil(Math.sqrt(n * ((x1 - x0) / (z1 - z0))));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols, ro = Math.floor(i / cols);
    out.push({
      id: `${idp}${i}`,
      look: { ...randomLook(r), mask: era === "covid" },
      at: [x0 + ((c + 0.5) / cols) * (x1 - x0) + (r() - 0.5) * 0.5, 0.02, z0 + ((ro + 0.5) / rows) * (z1 - z0) + (r() - 0.5) * 0.4],
      yaw: (r() - 0.5) * 2.4,
      pose: "stand",
      phase0: r(),
    });
  }
  return out;
};

const InTenant: React.FC<{ t: { x: number; side: -1 | 1 }; children: React.ReactNode }> = ({ t, children }) => (
  <group position={[t.x, 0, t.side * 5]} rotation={[0, t.side === -1 ? 0 : Math.PI, 0]}>
    {children}
  </group>
);

/** Seated guests at A&W tables (local A&W frame). */
const Diners: React.FC<{ tables: number[]; seed: number; t: number }> = ({ tables, seed, t }) => {
  const r = mulberry32(seed);
  return (
    <>
      {tables.map((ti) => {
        const [x, z] = AW_TABLES[ti];
        return [-1, 1].map((side) => {
          const look = randomLook(r, side === 1 && r() < 0.4 ? "kid" : undefined);
          return (
            <Solid key={`${ti},${side}`} id={`din${seed}_${ti}_${side}`} kind="body" position={[x + side * 0.78, 0.46, z]} rotation={[0, side === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
              <Person look={look} pose="sit" phase={r() + t * 0.15} />
            </Solid>
          );
        });
      })}
    </>
  );
};

/** A parent pushing a trolley out of LOTTE Mart with a kid alongside (local LOTTE frame, walking toward +z = the corridor). */
const TrolleyFamily: React.FC<{ t: number }> = ({ t }) => {
  const z = -6.2 + 0.85 * t;
  const parent: Look = { kind: "hijab", shirt: "#e9c46a", pants: "#3d405b", hijab: "#2a9d8f", skin: "#c9966f" };
  const kid: Look = { kind: "kid", shirt: "#e74c3c", pants: "#2f3640", skin: "#c9966f" };
  const dad: Look = { kind: "man", shirt: "#3c6fb6", pants: "#2f3640", skin: "#b07a55" };
  const ph = (0.85 * t) / 1.35;
  return (
    <>
      <Solid id="lotteMom" kind="body" position={[0, 0.02, z]}>
        <Person look={parent} pose="walk" phase={ph} />
      </Solid>
      <Solid id="trolley" kind="prop" touch={["lotteMom"]} position={[0, 0.02, z + 0.95]}>
        <Trolley p={[0, 0, 0]} yaw={0} />
      </Solid>
      <Solid id="lotteKid" kind="body" position={[1.0, 0.02, z + 0.4]}>
        <Person look={kid} pose="walk" phase={ph * 1.4 + 0.3} />
      </Solid>
      <Solid id="lotteDad" kind="body" position={[-1.1, 0.02, z - 0.6]}>
        <Person look={dad} pose="walk" phase={ph + 0.5} />
      </Solid>
    </>
  );
};

const Dancers: React.FC<{ t: number; style: "zumba" | "line"; seed: number }> = ({ t, style, seed }) => {
  const r = mulberry32(seed);
  const out: React.ReactNode[] = [];
  const cols = style === "zumba" ? 4 : 5, rows = 3;
  for (let ro = 0; ro < rows; ro++)
    for (let c = 0; c < cols; c++) {
      const look: Look = { ...randomLook(r, r() < 0.5 ? "hijab" : "woman"), shirt: ["#ff5fa2", "#38c6d9", "#f7d23e", "#7ed957", "#ff8c42"][(ro * cols + c) % 5] };
      const bx = -7 + (c * 14) / (cols - 1), bz = -4 - ro * 2.6;
      if (style === "zumba") {
        const bob = Math.sin((t * 2.2 + c * 0.1) * Math.PI) * 0.05;
        out.push(
          <Solid key={`${ro},${c}`} id={`zb${ro}${c}`} kind="body" position={[bx, 0.06 + Math.max(0, bob), bz]}>
            <Person look={look} pose="dance" phase={t * 1.1 + ro * 0.05} />
          </Solid>,
        );
      } else {
        const step = Math.sin(t * Math.PI * 0.55) * 0.7;
        out.push(
          <Solid key={`${ro},${c}`} id={`ld${ro}${c}`} kind="body" position={[bx + step, 0.06, bz]} rotation={[0, Math.sin(t * Math.PI * 0.55) * 0.35, 0]}>
            <Person look={look} pose="walk" phase={t * 1.1} />
          </Solid>,
        );
      }
    }
  // instructor at the front, facing the class
  out.push(
    <Solid key="ins" id={`ins${style}`} kind="body" position={[0, 0.06, -1.3]} rotation={[0, Math.PI, 0]}>
      <Person look={{ kind: "woman", shirt: "#1d1d1d", pants: "#ff5fa2", skin: "#c9966f" }} pose={style === "zumba" ? "dance" : "walk"} phase={t * 1.1} />
    </Solid>,
  );
  return <>{out}</>;
};

const bazarVisitors: Stander[] = (() => {
  const r = mulberry32(61);
  return [-63.5, -62, -57.5, -56, -51, -45.5].map((x, i) => ({ id: `bz${i}`, look: randomLook(r), at: [x, 0.02, 1.2] as V3, yaw: 0, pose: "stand" as const, phase0: r() }));
})();

const xxiTeens: Stander[] = (() => {
  const r = mulberry32(71);
  const spots: [number, number, number][] = [[-51.2, -1.6, Math.PI * 0.5], [-49.4, -1.3, -Math.PI * 0.5], [-50.3, -0.4, Math.PI], [-50.3, -2.5, 0], [-56, -1.8, 0.4], [-55.2, -2.4, -0.8]];
  return spots.map(([x, z, yaw], i) => ({ id: `xx${i}`, look: randomLook(r, "teen"), at: [x, 0.02, z] as V3, yaw, pose: "stand" as const, phase0: r() }));
})();

const ramayanaIn: Walker[] = (() => {
  const r = mulberry32(81);
  return [33.5, 34.3, 36.6, 37.4, 40.2, 41.0, 42.8].map((x, i) => ({ id: `ri${i}`, look: randomLook(r, i % 3 === 1 ? "kid" : undefined), from: [x, 0.02, 1.1 - (i % 2) * 0.9] as V3, dir: -1, v: 0.9, phase0: r() }));
})();

/** Kiosks in the clothing lane near x 84…100 (north side) that pull their shutters down, one after another. */
const closingIds = KIOSKS.filter((k) => k.x >= 82 && k.x <= 102).map((k) => k.id);

const REST = (): ShotDef[] => [
  // 4. Corridor in its heyday: service-elektronik kiosks, crowds — "Buat sebagian orang …"
  {
    a: vo(20.0),
    mood: "day",
    inside: () => ({ era: "glory" }),
    camera: (t) => shotFrom(icam([[0, 6, 2.1, 1.4, -30, 1.3, -1.2, 58], [4.5, -2, 2.0, 1.2, -36, 1.3, -1.2, 56]]), t),
    life: (t) => (
      <>
        <Crowd walkers={avoidNear(corrGlory, 20, 25, -4, 8, 1.3)} t={t + 20} />
        <Standers list={browsers(91, 6, -2, 2, -4, -2, "sv", "glory").map((b) => ({ ...b, at: [b.at[0] - 24, b.at[1], b.at[2] - 0.8] as V3 }))} t={t} />
      </>
    ),
  },
  // 5. Families walking into Ramayana — "… tapi juga menjadi tempat menyimpan banyak cerita."
  {
    a: vo(24.5),
    mood: "day",
    inside: () => ({ era: "glory" }),
    camera: (t) => shotFrom(icam([[0, 39.5, 1.9, 4.5, 38, 1.8, -9, 62], [3.05, 37.5, 1.9, 4.3, 38, 1.8, -9, 60]]), t),
    life: (t) => (
      <>
        <Crowd walkers={ramayanaIn} t={t} along="z" />
        <Crowd walkers={avoid(corrGlory.filter((w) => w.from[2] > -2.5 ? false : true), 24, 28, 28, 48)} t={t + 24} />
        <InTenant t={TENANT.ramayana}>
          <Standers list={browsers(92, 10, -9, 9, -11, -4, "rb")} t={t} />
        </InTenant>
      </>
    ),
  },
  // 6. LOTTE Mart: a family with a trolley — "Mulai dari kenangan masa kecil,"
  {
    a: vo(27.55),
    mood: "day",
    inside: () => ({ era: "glory" }),
    camera: (t) => shotFrom(icam([[0, 36.6, 1.5, 0.4, 38, 1.0, 10, 58], [2.05, 37.2, 1.5, 0.9, 38, 1.0, 10, 57]]), t),
    life: (t) => (
      <InTenant t={TENANT.lotte}>
        <TrolleyFamily t={t} />
        <Standers list={browsers(93, 9, -9, 9, -12, -8.5, "lb")} t={t} />
      </InTenant>
    ),
  },
  // 7. Friends in front of XXI — "jalan-jalan bareng teman,"
  {
    a: vo(29.6),
    mood: "day",
    inside: () => ({ era: "glory" }),
    camera: (t) => shotFrom(icam([[0, -46.5, 1.6, 3.6, -53, 2.3, -6, 56], [1.7, -47.3, 1.6, 3.5, -53, 2.3, -6, 55]]), t),
    life: (t) => <Standers list={xxiTeens} t={t} />,
  },
  // 8. A&W tables full of families — "sampai momen kebersamaan bersama keluarga."
  {
    a: vo(31.3),
    mood: "day",
    inside: () => ({ era: "glory" }),
    camera: (t) => shotFrom(icam([[0, -24.5, 1.85, -1.2, -27, 1.2, 9, 58], [2.8, -25.6, 1.8, -0.6, -27, 1.2, 9, 56]]), t),
    life: (t) => (
      <InTenant t={TENANT.aw}>
        <Diners tables={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} seed={5} t={t} />
      </InTenant>
    ),
  },
  // 9. The city grows around the mall — "Namun, seiring berjalannya waktu, Kota Bekasi semakin berkembang."
  {
    a: vo(34.1),
    mood: "day",
    extras: (t) => <Growth towers={Math.min(1, t / 4.6)} malls={0} />,
    camera: (t) => shotFrom(cam([[0, 55, 70, 150, 0, 12, -200, 44], [4.9, 25, 92, 195, 0, 18, -260, 44]]), t, 1),
    life: (t) => (
      <>
        <Traffic seed={9} density={1} t={t + 40} speed={2.2} />
      </>
    ),
  },
  // 10. New malls rise — "Banyak mall baru bermunculan …"
  {
    a: vo(39.0),
    mood: "day",
    extras: (t) => <Growth towers={1} malls={Math.min(1, t / 4.4)} />,
    camera: (t) => shotFrom(cam([[0, 120, 70, 110, 40, 8, -120, 46], [4.8, 150, 78, 120, 260, 14, -300, 46]]), t, 1),
    life: (t) => <Traffic seed={10} density={1} t={t + 50} speed={2.2} />,
  },
  // 11. Pandemic: grey sky, an almost empty street — "Hingga akhirnya, pandemi Covid datang …"
  {
    a: vo(43.8),
    mood: "covid",
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, -14, 3.4, 32.2, -2, 10, 3, 62], [6.45, -9, 3.3, 31.8, -1, 10, 3, 58]]), t),
    life: (t) => (
      <>
        <Traffic seed={11} density={0.1} t={t} />
        <Crowd walkers={masked(makeWalkers(111, 3, { x0: -40, x1: 30, z0: 12.4, z1: 14.8, gap: 1.2 }))} t={t} />
      </>
    ),
  },
  // 12. Inside, the same corridor, nearly empty — "Jumlah pengunjung menurun drastis."
  {
    a: vo(50.25),
    mood: "day",
    inside: () => ({ era: "covid" }),
    camera: (t) => shotFrom(icam([[0, 6, 2.1, 1.4, -30, 1.3, -1.2, 58], [2.45, 3, 2.05, 1.3, -33, 1.3, -1.2, 57]]), t),
    life: (t) => <Crowd walkers={avoidNear(corrCovid, 0, 3, -2, 8, 1.3)} t={t} />,
  },
  // 13. The clothing lane, the last visitors walking away — "Suasana yang dulu ramai, perlahan berubah menjadi sepi."
  {
    a: vo(52.7),
    mood: "day",
    inside: () => ({ era: "covid" }),
    camera: (t) => shotFrom(icam([[0, 121, 1.9, 0.4, 60, 1.3, 0, 54], [3.7, 117, 1.9, 0.3, 60, 1.3, 0, 54]]), t),
    life: (t) => <Crowd walkers={laneCovid} t={t} />,
  },
  // 14. Shutters come down — "Mall ini pun mengalami masa mati suri,"
  {
    a: vo(56.4),
    mood: "day",
    inside: (t) => ({
      era: "covid",
      closing: Object.fromEntries(closingIds.map((id, i) => [id, Math.max(0, Math.min(1, (t - 0.2 - i * 0.22) / 1.1))])),
    }),
    camera: (t) => shotFrom(icam([[0, 104, 1.6, 2.6, 88, 1.6, -5, 56], [2.7, 102.5, 1.6, 2.4, 88, 1.6, -5, 55]]), t),
    life: () => null,
  },
  // 15. Dusk: the new malls glow beyond Bekasi Junction — "… persaingan dengan pusat perbelanjaan baru …"
  {
    a: vo(59.1),
    mood: "dusk",
    night: 0.6,
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, -90, 52, 150, 120, 10, -260, 48], [6.4, -70, 56, 160, 150, 12, -280, 46]]), t, 1),
    life: (t) => <Traffic seed={15} density={0.6} t={t} />,
  },
  // 16. 2026, a quiet day — "Memasuki tahun 2026, sejumlah tenant …"
  {
    a: vo(65.5),
    mood: "day",
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, 96, 42, 82, 8, 9, 0, 46], [6.65, 80, 36, 64, 8, 9, 0, 46]]), t, 0.5),
    life: (t) => (
      <>
        <Traffic seed={16} density={0.5} t={t} />
        <Crowd walkers={makeWalkers(161, 6, { x0: -50, x1: 50, z0: 12.4, z1: 14.8, gap: 1.2 })} t={t} tag={false} />
      </>
    ),
  },
  // 17. LOTTE Mart dark — "Mulai dari Lotte Mart,"
  {
    a: vo(72.15),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, 36.5, 1.45, -3.6, 38, 1.6, 10, 56], [1.7, 37.3, 1.5, -3.4, 38, 1.6, 10, 55]]), t),
    life: () => null,
  },
  // 18. Ramayana dark — "Ramayana,"
  {
    a: vo(73.85),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, 39, 1.7, 3.9, 38, 2.0, -9, 60], [1.05, 38.4, 1.7, 3.8, 38, 2.0, -9, 59]]), t),
    life: () => null,
  },
  // 19. XXI dark — "hingga Cinema XXI."
  {
    a: vo(74.9),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, -46.5, 1.6, 3.6, -53, 2.3, -6, 56], [1.95, -47.4, 1.6, 3.5, -53, 2.3, -6, 55]]), t),
    life: () => null,
  },
  // 20. A lane of closed shutters — "Sebagian besar kios di dalamnya kini terlihat kosong …"
  {
    a: vo(76.85),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, 125, 1.7, 0, 60, 1.4, 0, 52], [5.2, 119, 1.7, 0, 60, 1.4, 0, 52]]), t),
    life: (t) => <Crowd walkers={[{ id: "lone", look: { kind: "man", shirt: "#5a6b3a", pants: "#2a2c33", skin: "#c9966f" }, from: [114, 0.02, 0.9], dir: -1, v: 1.05, phase0: 0 }]} t={t} />,
  },
  // 21. Toward the warm light: A&W, the activity hall, people — "Meski begitu, … belum sepenuhnya kehilangan aktivitasnya."
  {
    a: vo(82.05),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, -4, 2.1, 2.4, -50, 1.4, 1.5, 56], [4.5, -18, 2.0, 2.2, -56, 1.3, 2.0, 54]]), t),
    life: (t) => (
      <>
        <Crowd walkers={avoidNear(corr2026, 82, 87, -20, -2, 2.3, 1.2)} t={t + 82} />
        <Standers list={bazarVisitors} t={t} />
      </>
    ),
  },
  // 22. A&W still has guests — "Masih ada A&W yang bertahan,"
  {
    a: vo(86.55),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, -29.5, 1.5, 0.8, -27, 1.4, 9, 58], [1.9, -28.6, 1.5, 1.0, -27, 1.4, 9, 57]]), t),
    life: (t) => (
      <InTenant t={TENANT.aw}>
        <Diners tables={[1, 2, 5, 8]} seed={22} t={t} />
      </InTenant>
    ),
  },
  // 23. Zumba in the Ruang Aktivitas — "serta Ruang Aktivitas dan Studio Area …"
  {
    a: vo(88.45),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, -45.5, 2.5, 6.2, -53, 1.2, 12, 62], [6.25, -46.5, 2.3, 6.6, -53, 1.2, 12, 60]]), t),
    life: (t) => (
      <InTenant t={TENANT.studio}>
        <Dancers t={t} style="zumba" seed={23} />
      </InTenant>
    ),
  },
  // 24. Line dance + bazar stalls — "olahraga, zumba, line dance, bazar, hingga aktivitas kreatif."
  {
    a: vo(94.7),
    mood: "day",
    inside: () => ({ era: "y2026" }),
    camera: (t) => shotFrom(icam([[0, -37.5, 2.3, 0.4, -56, 1.3, 6, 58], [4.5, -39.5, 2.2, 0.2, -58, 1.3, 6, 56]]), t),
    life: (t) => (
      <>
        <Standers list={bazarVisitors} t={t} />
        <InTenant t={TENANT.studio}>
          <Dancers t={t} style="line" seed={24} />
        </InTenant>
      </>
    ),
  },
  // 25. Dusk, the facade from across the road — "Kini, Bekasi Junction mungkin tak lagi seramai masa kejayaannya."
  {
    a: vo(99.2),
    mood: "dusk",
    night: (t) => 0.3 + 0.1 * (t / 4.25),
    tenants: 0,
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, -16, 3.4, 32.4, -2, 10, 3, 62], [4.25, -11, 3.4, 32.2, -1, 10.5, 3, 60]]), t),
    life: (t) => (
      <>
        <Traffic seed={25} density={0.6} t={t} />
        <Crowd walkers={makeWalkers(251, 5, { x0: -40, x1: 30, z0: 12.4, z1: 14.8, gap: 1.2 })} t={t} />
      </>
    ),
  },
  // 26. The canopy wing as the lights come on — "Tapi bagi warga yang pernah menghabiskan waktu di sini, …"
  {
    a: vo(103.45),
    mood: "dusk",
    night: (t) => 0.45 + 0.35 * Math.min(1, t / 5.75),
    tenants: 0,
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, 28, 4.0, 30.6, 33, 11.5, 0, 74], [5.75, 31, 4.2, 30.3, 34, 12, 0, 71]]), t),
    life: (t) => (
      <>
        <Traffic seed={26} density={0.5} t={t} />
        <Crowd walkers={avoidNear(makeWalkers(261, 8, { x0: -10, x1: 60, z0: 12.4, z1: 14.8, gap: 1.2, families: true }), 0, 6, 20, 34, 30.4, 1)} t={t} />
      </>
    ),
  },
  // 27. Closing: the facade at nightfall, the camera rises and pulls away; end cards; fade out.
  {
    a: vo(109.2),
    mood: "dusk",
    night: (t) => 0.8 + 0.2 * Math.min(1, t / 4),
    tenants: 0,
    extras: () => <Growth towers={1} malls={1} />,
    camera: (t) => shotFrom(cam([[0, 4, 20, 62, 0, 12, 0, 50], [8, 0, 36, 125, 0, 11, 0, 46], [18.5, -16, 82, 255, 0, 8, -10, 44]]), t, 0.5),
    life: (t) => (
      <>
        <Traffic seed={27} density={0.6} t={t} />
      </>
    ),
  },
];

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

  ...REST(),
];

export const PREVIEW_END = vo(20.0);
export const FILM_END = vo(124.04) + 3.0;
export const FILM_CUTS = () => SHOTS.slice(1).map((s) => +s.a.toFixed(3));
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
        fade={Math.max(0, Math.min(1, (T - (FILM_END - 1.6)) / 1.4))}
        fadeColor="#000000"
        overlay={() => (
          <>
            <TitleCard T={T} a={vo(5.75)} b={vo(7.75)} />
            <Subtitles T={T} hideAfter={vo(120.3)} />
            <YearBadge T={T} a={vo(43.9)} b={vo(50.1)} year="2020" />
            <YearBadge T={T} a={vo(65.6)} b={vo(72.0)} year="2026" />
            <EndCards T={T} a={vo(112.5)} q={vo(120.3)} end={FILM_END + 0.5} />
          </>
        )}
      >
        <World
          shot={s.camera(t)}
          mood={s.mood}
          night={typeof s.night === "function" ? s.night(t) : s.night ?? 0}
          tenants={s.tenants ?? 1}
          inside={s.inside?.(t)}
          extras={s.extras?.(t)}
          frame={frame}
        >
          {s.life(t)}
        </World>
      </Stage3D>
      {withVo ? <Voiceover src={VO_FILE} offset={OFFSET} /> : null}
    </>
  );
};
