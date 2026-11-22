// Kawasan Pasar Proyek around the mall: forecourt, Jl. raya with red median barriers, sidewalks,
// palms, power poles with sagging cables, pole signs, generic ruko rows and a low-rise city beyond.
//
//   z: 0…12 forecourt / drop-off · 12…15 sidewalk · 15…31 road (median 22.4…23.6) · 31…35 sidewalk · 35… ruko

import React, { useMemo } from "react";
import { BoxGeometry, type BufferGeometry, Color, InstancedMesh, Matrix4, Object3D, Vector3 } from "three";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { M, cableGeo, frondGeo, mat, mergeAll, type SignSpec } from "./kit.ts";
import { B, BB, Cy, Sign, boxGeo, type V3 } from "./prim.tsx";

export const ROAD = { z0: 15, z1: 31, median: [22.4, 23.6] as [number, number], x0: -420, x1: 420 };
export const LANES = { east: [17, 20.5], west: [25.5, 29] }; // east = +x direction near the mall
export const SIDE_ROAD = { x0: 80, x1: 92 };

// ── Ground, roads ────────────────────────────────────────────────────────────

const Ground: React.FC = () => {
  const dashes = useMemo(
    () =>
      mergeAll("laneDashes", () => {
        const g: BufferGeometry[] = [];
        for (let x = ROAD.x0; x < ROAD.x1; x += 9) {
          g.push(new BoxGeometry(4, 0.02, 0.16).applyMatrix4(new Matrix4().makeTranslation(x, 0.07, 18.75)));
          g.push(new BoxGeometry(4, 0.02, 0.16).applyMatrix4(new Matrix4().makeTranslation(x + 3, 0.07, 27.25)));
        }
        return g;
      }),
    [],
  );
  return (
    <group>
      <B p={[0, -0.6, 0]} s={[2400, 1.0, 2400]} m={mat("#8b8a7f", 0.97)} cast={false} />
      {/* main road + side road */}
      <BB a={[ROAD.x0, -0.1, ROAD.z0]} b={[ROAD.x1, 0.05, ROAD.z1]} m={M.asphalt} cast={false} />
      <BB a={[SIDE_ROAD.x0, -0.1, -260]} b={[SIDE_ROAD.x1, 0.05, ROAD.z0]} m={M.asphalt} cast={false} />
      <BB a={[SIDE_ROAD.x0, -0.1, ROAD.z1]} b={[SIDE_ROAD.x1, 0.05, 260]} m={M.asphalt} cast={false} />
      <mesh geometry={dashes} material={M.lane} receiveShadow />
      {/* median with red barriers */}
      <BB a={[ROAD.x0, 0, ROAD.median[0]]} b={[SIDE_ROAD.x0 - 6, 0.25, ROAD.median[1]]} m={M.curb} cast={false} />
      <BB a={[SIDE_ROAD.x1 + 6, 0, ROAD.median[0]]} b={[ROAD.x1, 0.25, ROAD.median[1]]} m={M.curb} cast={false} />
      <Barriers />
      {/* forecourt + sidewalks */}
      <BB a={[-120, 0, 0]} b={[SIDE_ROAD.x0, 0.12, 12]} m={M.concrete} cast={false} />
      <BB a={[ROAD.x0, 0, 12]} b={[ROAD.x1, 0.22, ROAD.z0 - 0.03]} m={M.sidewalk} cast={false} />
      <BB a={[ROAD.x0, 0, ROAD.z0 - 0.25]} b={[ROAD.x1, 0.26, ROAD.z0]} m={M.curb} cast={false} />
      <BB a={[ROAD.x0, 0, ROAD.z1 + 0.03]} b={[ROAD.x1, 0.22, 35]} m={M.sidewalk} cast={false} />
      <BB a={[ROAD.x0, 0, ROAD.z1]} b={[ROAD.x1, 0.26, ROAD.z1 + 0.25]} m={M.curb} cast={false} />
      {/* planters along the forecourt edge */}
      {[-58, -40, 20, 36, 52].map((x, i) => (
        <group key={i}>
          <BB a={[x - 2.2, 0, 10.2]} b={[x + 2.2, 0.6, 11.8]} m={M.curb} />
          <BB a={[x - 2.0, 0.6, 10.4]} b={[x + 2.0, 0.75, 11.6]} m={M.grass} cast={false} />
        </group>
      ))}
    </group>
  );
};

/** Red water-filled barriers on the median (as in the street photo). */
const Barriers: React.FC = () => {
  const mesh = useMemo(() => {
    const g = mergeAll("barrierShape", () => [
      new BoxGeometry(1.9, 0.4, 0.62).applyMatrix4(new Matrix4().makeTranslation(0, 0.2, 0)),
      new BoxGeometry(1.8, 0.4, 0.42).applyMatrix4(new Matrix4().makeTranslation(0, 0.6, 0)),
      new BoxGeometry(1.7, 0.2, 0.3).applyMatrix4(new Matrix4().makeTranslation(0, 0.9, 0)),
    ]);
    const xs: number[] = [];
    for (let x = -260; x < 260; x += 2.05) if (x < SIDE_ROAD.x0 - 8 || x > SIDE_ROAD.x1 + 8) xs.push(x);
    const im = new InstancedMesh(g, M.barrier, xs.length);
    const o = new Object3D();
    xs.forEach((x, i) => {
      o.position.set(x, 0.25, 23);
      o.rotation.y = (((i * 7919) % 13) - 6) * 0.004;
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    return im;
  }, []);
  return <primitive object={mesh} />;
};

// ── Palms ────────────────────────────────────────────────────────────────────

export const Palm: React.FC<{ p: V3; h?: number; seed?: number }> = ({ p, h = 9, seed = 1 }) => {
  const r = mulberry32(seed);
  const fronds = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => ({
        yaw: (i / 13) * Math.PI * 2 + r() * 0.3,
        pitch: -0.15 + r() * 0.5,
        len: 3.4 + r() * 1.2,
        dry: r() < 0.18,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const lean = (r() - 0.5) * 0.08;
  return (
    <group position={p} rotation={[lean, 0, lean * 0.7]}>
      <Cy p={[0, h / 2, 0]} r={0.2} r2={0.3} h={h} m={M.trunk} seg={10} />
      <Cy p={[0, h - 0.3, 0]} r={0.34} r2={0.24} h={0.9} m={mat("#6f7a3a", 0.9)} seg={10} />
      {fronds.map((f, i) => (
        <group key={i} position={[0, h, 0]} rotation={[0, f.yaw, f.pitch]}>
          <mesh geometry={frondGeo(f.len, 0.55, 0.9)} material={f.dry ? M.frondDry : M.frond} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
};

// ── Power poles + cables ────────────────────────────────────────────────────

const POLE_Z = 33.6;
const POLE_XS = [-190, -158, -126, -94, -62, -30, 2, 34, 66, 98, 130, 162];
const POLE_H = 10.5;

const Poles: React.FC = () => {
  const cables = useMemo(
    () =>
      mergeAll("cables", () => {
        const g: BufferGeometry[] = [];
        for (let i = 0; i < POLE_XS.length - 1; i++) {
          const x0 = POLE_XS[i], x1 = POLE_XS[i + 1];
          const tiers: [number, number, number][] = [
            [POLE_H - 0.3, -0.5, 0.9],
            [POLE_H - 0.3, 0.5, 0.9],
            [POLE_H - 1.4, -0.45, 1.3],
            [POLE_H - 1.4, 0.45, 1.25],
            [POLE_H - 2.6, 0, 1.8],
            [POLE_H - 3.2, 0.15, 2.4],
          ];
          for (const [y, dz, sag] of tiers) g.push(cableGeo(new Vector3(x0, y, POLE_Z + dz), new Vector3(x1, y, POLE_Z + dz), sag + ((i * 3) % 4) * 0.15, 0.03));
        }
        // drops across the road toward the mall side
        for (const x of [-62, 2, 66]) {
          g.push(cableGeo(new Vector3(x, POLE_H - 1.4, POLE_Z), new Vector3(x + 6, 7.5, 13.2), 1.4, 0.025));
          g.push(cableGeo(new Vector3(x, POLE_H - 2.6, POLE_Z), new Vector3(x - 4, 7.2, 13.2), 1.7, 0.025));
        }
        // the messy coil bundles near each pole
        for (const x of POLE_XS) {
          for (let k = 0; k < 3; k++) g.push(cableGeo(new Vector3(x - 0.3, POLE_H - 3.5 - k * 0.3, POLE_Z + 0.2), new Vector3(x + 0.3, POLE_H - 3.4 - k * 0.3, POLE_Z + 0.2), 0.6 + k * 0.2, 0.03));
        }
        return g;
      }),
    [],
  );
  return (
    <group>
      {POLE_XS.map((x, i) => (
        <group key={i} position={[x, 0, POLE_Z]}>
          <Cy p={[0, POLE_H / 2, 0]} r={0.13} r2={0.2} h={POLE_H} m={M.pole} seg={10} />
          <B p={[0, POLE_H - 0.3, 0]} s={[0.12, 0.12, 1.4]} m={M.pole} />
          <B p={[0, POLE_H - 1.4, 0]} s={[0.12, 0.12, 1.2]} m={M.pole} />
          <Cy p={[0.3, POLE_H - 2.2, 0]} r={0.32} h={0.9} m={mat("#7d8285", 0.6, 0.3)} seg={12} />
        </group>
      ))}
      {/* the light poles on the mall side */}
      {[-90, -30, 26, 70].map((x, i) => (
        <group key={i} position={[x, 0, 13.4]}>
          <Cy p={[0, 5, 0]} r={0.09} r2={0.14} h={10} m={M.poleDark} seg={10} />
          <B p={[0, 9.9, 1.0]} s={[0.1, 0.1, 2.0]} m={M.poleDark} />
          <B p={[0, 9.8, 2.0]} s={[0.4, 0.15, 0.8]} m={M.lampHead} />
        </group>
      ))}
      <mesh geometry={cables} material={M.cable} castShadow />
    </group>
  );
};

// ── Pole signs + traffic light ───────────────────────────────────────────────

const POLE_SIGNS = {
  ramayana: { w: 5.2, h: 5.2, bg: "#d42a22", lines: [{ text: "Ramayana", color: "#ffffff", size: 0.95, weight: 600 }], ppm: 80, border: "#ffffff", group: "tenant", lit: 1.3 } as SignSpec,
  lotte: {
    w: 4.4,
    h: 5.4,
    bg: "#c9241c",
    lines: [
      { text: "LOTTE", color: "#ffffff", size: 1.25, weight: 600, y: 0.36 },
      { text: "Mart", color: "#ffffff", size: 1.25, weight: 500, y: 0.64 },
    ],
    ppm: 80,
    lit: 1.3,
    group: "tenant",
  } as SignSpec,
};

const PoleSigns: React.FC = () => (
  <group>
    {/* Ramayana: on the corner by the side road */}
    <group position={[76, 0, 13.4]}>
      <Cy p={[0, 6.5, 0]} r={0.3} h={13} m={M.poleDark} seg={12} />
      <Sign p={[0, 14.6, 0.05]} spec={POLE_SIGNS.ramayana} back={mat("#c42a22", 0.5)} depth={0.5} />
      <Sign p={[0, 14.6, -0.5]} spec={POLE_SIGNS.ramayana} rot={[0, Math.PI, 0]} />
    </group>
    {/* Lotte Mart: by the rotunda */}
    <group position={[-70, 0, 13.4]}>
      <Cy p={[0, 6, 0]} r={0.32} h={12} m={M.poleDark} seg={12} />
      <Sign p={[0, 14.2, 0.05]} spec={POLE_SIGNS.lotte} back={mat("#c42a22", 0.5)} depth={0.5} />
      <Sign p={[0, 14.2, -0.5]} spec={POLE_SIGNS.lotte} rot={[0, Math.PI, 0]} />
    </group>
    {/* traffic light at the side-road junction */}
    <group position={[78.5, 0, 14.2]}>
      <Cy p={[0, 3.2, 0]} r={0.1} h={6.4} m={M.poleDark} seg={10} />
      <B p={[0, 5.6, 0.25]} s={[0.4, 1.2, 0.35]} m={mat("#222426", 0.5)} />
      <B p={[0, 6.0, 0.44]} s={[0.22, 0.22, 0.02]} m={mat("#3a1512", 0.5)} cast={false} />
      <B p={[0, 5.2, 0.44]} s={[0.22, 0.22, 0.02]} m={mat("#2fd06a", 0.4)} cast={false} />
    </group>
  </group>
);

// ── Ruko rows (generic shophouses, generic signs) ────────────────────────────

const RUKO_COLORS = ["#e9e1cf", "#d9dccb", "#efe4c4", "#cfd8d2", "#e7d3c0", "#d8d2c8", "#f0ecdf", "#cdd5c2"];
const RUKO_SIGNS = ["TOKO BANGUNAN", "SERVICE ELEKTRONIK", "KONTER PULSA", "WARUNG MAKAN", "FOTOKOPI", "TOKO KUE", "APOTEK", "BENGKEL MOTOR", "TOKO EMAS", "LAUNDRY", "PERCETAKAN", "TOKO SEPATU", "SALON", "TOKO OBAT", "GROSIR SEMBAKO", "RUMAH MAKAN PADANG"];
const SIGN_BG = ["#1f5fa8", "#c7302a", "#f1c232", "#2e8a4e", "#ffffff", "#e06a1b", "#5b3a91", "#123c6e"];

/** One row of ruko along x, facing `face` (+1 = +z, −1 = −z). */
export const RukoRow: React.FC<{ x0: number; n: number; z: number; face: 1 | -1; seed: number; w?: number }> = ({ x0, n, z, face, seed, w = 5 }) => {
  const units = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: n }, (_, i) => {
      const floors = r() < 0.45 ? 3 : 2;
      const bg = SIGN_BG[Math.floor(r() * SIGN_BG.length)];
      const fg = bg === "#ffffff" || bg === "#f1c232" ? "#1d1d1d" : "#ffffff";
      return {
        x: x0 + i * w + w / 2,
        floors,
        color: RUKO_COLORS[Math.floor(r() * RUKO_COLORS.length)],
        sign: { w: w - 0.4, h: 1.1, bg, lines: [{ text: RUKO_SIGNS[Math.floor(r() * RUKO_SIGNS.length)], color: fg, size: 0.48, weight: 600 }], ppm: 64 } as SignSpec,
        door: r() < 0.5 ? M.rollerDoor : M.rollerDoorGrey,
        open: r() < 0.6,
        awning: r() < 0.5,
        roofTile: r() < 0.35,
        tank: r() < 0.6,
        tankColor: r() < 0.5 ? "#2f69b3" : "#e8e6df",
      };
    });
  }, [x0, n, seed, w]);
  const d = 12;
  return (
    <group position={[0, 0, z]} rotation={[0, face === 1 ? 0 : Math.PI, 0]}>
      {units.map((u, i) => {
        const x = face === 1 ? u.x : -u.x;
        const H = u.floors * 3.6 + 0.8;
        return (
          <group key={i} position={[x, 0, 0]}>
            <BB a={[-w / 2 + 0.05, 0, -d]} b={[w / 2 - 0.05, H, 0]} m={mat(u.color, 0.9)} />
            <BB a={[-w / 2, H - 0.3, -d]} b={[w / 2, H + 0.4, 0.3]} m={mat(u.color, 0.85)} />
            <BB a={[-w / 2 + 0.2, H + 0.4, -d + 0.2]} b={[w / 2 - 0.2, H + 0.5, -0.2]} m={u.roofTile ? mat("#9a5a3e", 0.85) : mat("#8d8a84", 0.95)} cast={false} />
            {u.tank ? <Cy p={[w / 4 - 0.5, H + 1.3, -d + 2.5]} r={0.6} h={1.6} m={mat(u.tankColor, 0.5)} seg={14} /> : null}
            <BB a={[-w / 2 + 0.6, H + 0.4, -d + 1]} b={[-w / 2 + 2.4, H + 2.6, -d + 3.5]} m={mat(u.color, 0.9)} />
            {/* ground: roller door (open = dark shop interior) */}
            <BB a={[-w / 2 + 0.4, 0.15, -0.3]} b={[w / 2 - 0.4, 3.0, 0.02]} m={u.open ? mat("#2c2a27", 0.9) : u.door} />
            <Sign p={[0, 3.55, 0.12]} spec={u.sign} />
            {u.awning ? <B p={[0, 3.0, 0.9]} s={[w - 0.2, 0.12, 1.8]} m={mat("#9aa3a6", 0.5, 0.4)} /> : null}
            {/* upper windows */}
            {Array.from({ length: u.floors - 1 }, (_, f) => (
              <React.Fragment key={f}>
                <BB a={[-w / 2 + 0.7, 4.6 + f * 3.6, -0.15]} b={[w / 2 - 0.7, 6.6 + f * 3.6, 0.04]} m={M.glassWin} />
                <B p={[0, 5.6 + f * 3.6, 0.06]} s={[0.08, 2.0, 0.08]} m={mat("#f2f2ee", 0.6)} />
              </React.Fragment>
            ))}
          </group>
        );
      })}
    </group>
  );
};

// ── Low-rise city out to the horizon ─────────────────────────────────────────

const CITY_COLORS = ["#d9d2c3", "#c9c4b8", "#e3dccb", "#b8b6ad", "#d6c9b5", "#c2c9c4", "#e6e1d6", "#a9a79f", "#cdb9a2"];
const ROOF_COLORS = ["#9b5a3c", "#a8644a", "#7e756a", "#8b4a35", "#b07a5a"];

const City: React.FC = () => {
  const meshes = useMemo(() => {
    const r = mulberry32(911);
    const blocks: { x: number; z: number; w: number; d: number; h: number; c: string; roof: boolean }[] = [];
    const clear = (x: number, z: number) =>
      (x > -125 && x < 175 && z > -75 && z < 50) || (z > 12 && z < 36) || (x > 74 && x < 98);
    for (let i = 0; i < 6500; i++) {
      const a = r() * Math.PI * 2;
      const dist = 70 + Math.pow(r(), 1.3) * 900;
      const x = Math.cos(a) * dist + 20, z = Math.sin(a) * dist - 10;
      if (clear(x, z)) continue;
      const tall = r() < 0.035 && dist > 250;
      const w = tall ? 18 + r() * 14 : 7 + r() * 9;
      const d = tall ? 18 + r() * 14 : 6 + r() * 14;
      const h = tall ? 40 + r() * 60 : 3.5 + Math.floor(r() * 3) * 3.2;
      blocks.push({ x, z, w, d, h, c: CITY_COLORS[Math.floor(r() * CITY_COLORS.length)], roof: !tall && r() < 0.6 });
    }
    const geo = boxGeo(1, 1, 1);
    const walls = new InstancedMesh(geo, mat("#ffffff", 0.92), blocks.length);
    const roofs = new InstancedMesh(geo, mat("#ffffff", 0.85), blocks.length);
    const o = new Object3D();
    let nr = 0;
    blocks.forEach((b, i) => {
      o.position.set(b.x, b.h / 2, b.z);
      o.scale.set(b.w, b.h, b.d);
      o.rotation.set(0, 0, 0);
      o.updateMatrix();
      walls.setMatrixAt(i, o.matrix);
      walls.setColorAt(i, new Color(b.c));
      if (b.roof) {
        o.position.set(b.x, b.h + 0.6, b.z);
        o.scale.set(b.w * 1.04, 1.2, b.d * 1.04);
        o.updateMatrix();
        roofs.setMatrixAt(nr, o.matrix);
        roofs.setColorAt(nr, new Color(ROOF_COLORS[nr % ROOF_COLORS.length]));
        nr++;
      }
    });
    roofs.count = nr;
    for (const m of [walls, roofs]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    return [walls, roofs];
  }, []);
  // street trees scattered through the city
  const trees = useMemo(() => {
    const r = mulberry32(5);
    const pts: V3[] = [];
    for (let i = 0; i < 500; i++) {
      const a = r() * Math.PI * 2, dist = 80 + r() * 600;
      const x = Math.cos(a) * dist + 20, z = Math.sin(a) * dist;
      if ((x > -125 && x < 175 && z > -75 && z < 50) || (z > 12 && z < 36)) continue;
      pts.push([x, 0, z]);
    }
    const crown = new InstancedMesh(boxGeo(1, 1, 1), mat("#58783a", 0.95), pts.length);
    const o = new Object3D();
    pts.forEach((p, i) => {
      const s = 4 + (i % 5);
      o.position.set(p[0], s * 0.7, p[2]);
      o.scale.set(s, s * 0.8, s);
      o.rotation.set(0, i, 0);
      o.updateMatrix();
      crown.setMatrixAt(i, o.matrix);
    });
    crown.castShadow = true;
    return crown;
  }, []);
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      <primitive object={trees} />
    </>
  );
};

export const Street: React.FC = React.memo(() => (
  <group>
    <Ground />
    <Poles />
    <PoleSigns />
    {[-58, -40, 20, 36, 52].map((x, i) => (
      <Palm key={i} p={[x, 0.7, 11]} h={8.5 + (i % 3)} seed={i + 3} />
    ))}
    {[-150, -110, -20, 110, 150].map((x, i) => (
      <Palm key={`f${i}`} p={[x, 0.2, 32.5]} h={7.5 + (i % 2) * 2} seed={i + 30} />
    ))}
    {/* ruko across the road */}
    <RukoRow x0={-200} n={22} z={35.5} face={-1} seed={11} />
    <RukoRow x0={-80} n={30} z={35.5} face={-1} seed={12} />
    <RukoRow x0={92.5} n={26} z={35.5} face={-1} seed={13} />
    {/* ruko on the mall side, left of the rotunda and past the side road */}
    <RukoRow x0={-122} n={10} z={12} face={1} seed={14} />
    <RukoRow x0={96} n={16} z={12} face={1} seed={15} />
    <City />
  </group>
));
