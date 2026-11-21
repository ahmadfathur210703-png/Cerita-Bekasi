// Shared building blocks for the Bekasi Junction world: materials (with a mood hook for time of day),
// sign textures drawn as plain lettering (no brand logos copied) and small geometry helpers.

import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LinearMipmapLinearFilter,
  Material,
  MeshStandardMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FONT } from "../../core/type/fonts.ts";
import { cached } from "../../kits/worldforge/geo.ts";

// ── Materials ────────────────────────────────────────────────────────────────

const std = (color: string, roughness = 0.8, metalness = 0, extra: Partial<MeshStandardMaterial> = {}) =>
  Object.assign(new MeshStandardMaterial({ color, roughness, metalness }), extra);

/** Lamp-like materials whose glow follows the time of day (0 day … 1 night). */
const glowing: { m: MeshStandardMaterial; day: number; night: number }[] = [];
const glow = (m: MeshStandardMaterial, day: number, night: number) => {
  glowing.push({ m, day, night });
  return m;
};

export const M = {
  body: std("#4a4d52", 0.72, 0.1),
  bodyDark: std("#36393d", 0.75, 0.1),
  bodyLight: std("#7b7f84", 0.7, 0.1),
  orange: std("#d9541f", 0.55, 0.05),
  orangeDeep: std("#b8401c", 0.6, 0.05),
  red: std("#c4261d", 0.55, 0.05),
  frame: std("#8e9296", 0.45, 0.5),
  steel: std("#c9ccd0", 0.35, 0.8),
  glass: std("#5f7a8c", 0.08, 0.6, { envMapIntensity: 1.3 }),
  glassLight: std("#9fb6c4", 0.06, 0.5, { transparent: true, opacity: 0.55, envMapIntensity: 1.4, depthWrite: false }),
  glassWin: glow(std("#41545f", 0.12, 0.55, { emissive: new Color("#ffd9a0") }), 0, 0.9),
  rail: std("#d7dadc", 0.4, 0.6),
  concrete: std("#b9b4aa", 0.92),
  sidewalk: std("#a9a49a", 0.9),
  curb: std("#d8d4cc", 0.85),
  asphalt: std("#4b4c4e", 0.95),
  asphaltOld: std("#5a5a59", 0.95),
  lane: std("#e8e4d8", 0.7),
  barrier: std("#d7321f", 0.6),
  pole: std("#9c9a94", 0.85),
  poleDark: std("#3a3b3d", 0.6, 0.4),
  cable: std("#161718", 0.7),
  trunk: std("#8a7a62", 0.95),
  frond: std("#4f7a33", 0.8, 0, { side: DoubleSide }),
  frondDry: std("#7d8a3e", 0.85, 0, { side: DoubleSide }),
  grass: std("#5e7f3b", 0.95),
  rollerDoor: std("#b3a98e", 0.6, 0.35),
  rollerDoorGrey: std("#9aa0a3", 0.55, 0.45),
  tyre: std("#1c1c1d", 0.9),
  lampHead: glow(std("#d9dcd8", 0.4, 0.2, { emissive: new Color("#ffcf8a") }), 0, 2.4),
};

/** Set the mood: 0 = day, 1 = night (windows, lamps, signs glow). */
export const setNight = (n: number) => {
  for (const g of glowing) g.m.emissiveIntensity = g.day + (g.night - g.day) * n;
};

const matCache = new Map<string, Material>();
export const mat = (color: string, roughness = 0.8, metalness = 0) => {
  const k = `${color}|${roughness}|${metalness}`;
  let m = matCache.get(k);
  if (!m) matCache.set(k, (m = std(color, roughness, metalness)));
  return m as MeshStandardMaterial;
};

// ── Sign textures ────────────────────────────────────────────────────────────

export type SignSpec = {
  /** Size in metres; the texture is drawn at `ppm` pixels per metre. */
  w: number;
  h: number;
  bg: string | null;
  lines: { text: string; color: string; size: number; weight?: number; y?: number; italic?: boolean; spacing?: number }[];
  ppm?: number;
  border?: string;
  /** Lit at night (emissive from the same picture). */
  lit?: number;
};

const texCache = new Map<string, CanvasTexture>();
export const signTexture = (s: SignSpec) => {
  const key = JSON.stringify(s);
  const hit = texCache.get(key);
  if (hit) return hit;
  const ppm = s.ppm ?? 64;
  const W = Math.max(16, Math.round(s.w * ppm)), H = Math.max(16, Math.round(s.h * ppm));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  if (s.bg) {
    g.fillStyle = s.bg;
    g.fillRect(0, 0, W, H);
  }
  if (s.border) {
    g.strokeStyle = s.border;
    g.lineWidth = Math.max(2, H * 0.04);
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
  }
  const n = s.lines.length;
  s.lines.forEach((l, i) => {
    const px = l.size * ppm;
    g.font = `${l.italic ? "italic " : ""}${l.weight ?? 600} ${px}px ${FONT}, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = l.color;
    const y = (l.y ?? (i + 0.5) / n) * H;
    let text = l.text;
    if (l.spacing) (g as unknown as { letterSpacing: string }).letterSpacing = `${l.spacing * px}px`;
    // shrink to fit
    let m = g.measureText(text).width;
    const maxW = W * 0.92;
    if (m > maxW) {
      g.font = `${l.italic ? "italic " : ""}${l.weight ?? 600} ${(px * maxW) / m}px ${FONT}, sans-serif`;
      m = maxW;
    }
    g.fillText(text, W / 2, y);
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  texCache.set(key, t);
  return t;
};

const signMatCache = new Map<string, MeshStandardMaterial>();
/** Material for a sign: opaque board, or cut-out letters when bg is null. */
export const signMaterial = (s: SignSpec) => {
  const key = JSON.stringify(s);
  let m = signMatCache.get(key);
  if (m) return m;
  const t = signTexture(s);
  m = new MeshStandardMaterial({
    map: t,
    roughness: 0.5,
    metalness: 0.05,
    transparent: false,
    alphaTest: s.bg ? 0 : 0.5,
    emissive: new Color("#ffffff"),
    emissiveMap: t,
    emissiveIntensity: 0,
  });
  if (s.lit) glow(m, 0, s.lit);
  signMatCache.set(key, m);
  return m;
};

// ── Geometry helpers ─────────────────────────────────────────────────────────

/** A sagging cable between two points (catenary-ish parabola). */
export const cableGeo = (a: Vector3, b: Vector3, sag: number, r = 0.025) => {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const s = i / 10;
    const p = new Vector3().lerpVectors(a, b, s);
    p.y -= sag * 4 * s * (1 - s);
    pts.push(p);
  }
  return new TubeGeometry(new CatmullRomCurve3(pts), 16, r, 4, false);
};

export const mergeAll = (key: string, make: () => BufferGeometry[]) =>
  cached(key, () => {
    const parts = make().map((g) => (g.index ? g.toNonIndexed() : g));
    for (const p of parts) for (const name of Object.keys(p.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") p.deleteAttribute(name);
    return mergeGeometries(parts, false)!;
  });

/** Palm frond: a folded, tapering strip that arches out and droops. */
export const frondGeo = (len: number, width: number, droop: number) =>
  cached(`frond${len},${width},${droop}`, () => {
    const N = 12;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const x = s * len;
      const y = Math.sin(s * Math.PI * 0.55) * len * 0.22 - droop * s * s * len;
      const w = width * Math.sin(Math.PI * Math.min(1, s * 1.1)) * (1 - 0.3 * s);
      // three verts across: left, spine (raised), right
      pos.push(x, y - w * 0.25, -w, x, y + w * 0.08, 0, x, y - w * 0.25, w);
      if (i < N) {
        const a = i * 3;
        idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  });
