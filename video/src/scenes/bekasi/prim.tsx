// Tiny JSX primitives so the world reads like a site plan: <B> box by centre + size, <Cy> cylinder,
// <Sign> a lettered board. All geometry is cached; shadows on by default.

import React from "react";
import { BoxGeometry, CylinderGeometry, PlaneGeometry, type Material } from "three";
import { cached } from "../../kits/worldforge/geo.ts";
import { signMaterial, type SignSpec } from "./kit.ts";

export type V3 = [number, number, number];

export const boxGeo = (w: number, h: number, d: number) => cached(`bx${w},${h},${d}`, () => new BoxGeometry(w, h, d));
export const cylGeo = (rt: number, rb: number, h: number, seg = 32, open = false) =>
  cached(`cy${rt},${rb},${h},${seg},${open}`, () => new CylinderGeometry(rt, rb, h, seg, 1, open));
export const planeGeo = (w: number, h: number) => cached(`pl${w},${h}`, () => new PlaneGeometry(w, h));

type Common = { m: Material; rot?: V3; cast?: boolean; recv?: boolean };

/** Box from its centre `p` and size `s`. */
export const B: React.FC<Common & { p: V3; s: V3 }> = ({ p, s, m, rot, cast = true, recv = true }) => (
  <mesh geometry={boxGeo(s[0], s[1], s[2])} material={m} position={p} rotation={rot} castShadow={cast} receiveShadow={recv} />
);

/** Box from its min corner to max corner. */
export const BB: React.FC<Common & { a: V3; b: V3 }> = ({ a, b, ...rest }) => (
  <B p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} s={[Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])]} {...rest} />
);

export const Cy: React.FC<Common & { p: V3; r: number; h: number; r2?: number; seg?: number; open?: boolean }> = ({ p, r, r2, h, seg = 32, open, m, rot, cast = true, recv = true }) => (
  <mesh geometry={cylGeo(r, r2 ?? r, h, seg, open)} material={m} position={p} rotation={rot} castShadow={cast} receiveShadow={recv} />
);

/** A lettered sign (plane facing +z unless rotated) centred at p. */
export const Sign: React.FC<{ p: V3; spec: SignSpec; rot?: V3; back?: Material; depth?: number }> = ({ p, spec, rot, back, depth = 0 }) => (
  <group position={p} rotation={rot}>
    {back && depth > 0 ? <mesh geometry={boxGeo(spec.w, spec.h, depth)} material={back} position={[0, 0, -depth / 2 - 0.025]} castShadow receiveShadow /> : null}
    <mesh geometry={planeGeo(spec.w, spec.h)} material={signMaterial(spec)} castShadow={!spec.bg} receiveShadow />
  </group>
);
