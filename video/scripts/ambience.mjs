// Synthesised city ambience (no samples): traffic rumble + soft crowd murmur + a few passing vehicles.
//   node scripts/ambience.mjs <out.wav> <durationSec> <plan.json>
// plan.json: [{ "t": seconds, "traffic": 0..1, "crowd": 0..1 }, ...] — levels are linearly interpolated.
// Everything is seeded/deterministic; levels sit well under the voice-over (final mix is done by deliver).

import fs from "node:fs";

const [out, durArg, planPath] = process.argv.slice(2);
const SR = 48000;
const dur = Number(durArg);
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const N = Math.round(dur * SR);

let seed = 12345;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const level = (t, key) => {
  if (t <= plan[0].t) return plan[0][key];
  for (let i = 0; i < plan.length - 1; i++) {
    const a = plan[i], b = plan[i + 1];
    if (t < b.t) return a[key] + ((b[key] - a[key]) * (t - a.t)) / (b.t - a.t);
  }
  return plan[plan.length - 1][key];
};

// one-pole filters
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };
const hp = (a) => { let y = 0, px = 0; return (x) => { y = a * (y + x - px); px = x; return y; }; };

const L = new Float32Array(N), R = new Float32Array(N);
// traffic: brown noise, low passed
let brownL = 0, brownR = 0;
const tlpL = lp(0.02), tlpR = lp(0.02);
// crowd: band-passed noise with slow syllable-like modulation from several voices
const cl1 = lp(0.18), cl2 = lp(0.18), ch1 = hp(0.97), ch2 = hp(0.97);
const voices = Array.from({ length: 9 }, () => ({ f: 2.5 + rnd() * 3, p: rnd() * 6.28, pan: rnd() }));
// passing vehicles: filtered noise bursts panning across
const passes = [];
for (let t = 0.8; t < dur; t += 2.2 + rnd() * 3.5) passes.push({ t, len: 2.5 + rnd() * 2, dir: rnd() < 0.5 ? -1 : 1, moto: rnd() < 0.45, g: 0.5 + rnd() * 0.5 });
const plp = lp(0.06), plp2 = lp(0.12);

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const tr = level(t, "traffic"), cr = level(t, "crowd");
  brownL = (brownL + (rnd() * 2 - 1) * 0.02) * 0.998;
  brownR = (brownR + (rnd() * 2 - 1) * 0.02) * 0.998;
  const rumble = 0.55 + 0.25 * Math.sin(t * 0.37) + 0.2 * Math.sin(t * 0.13 + 1);
  let l = tlpL(brownL) * 1.8 * rumble * tr, r = tlpR(brownR) * 1.8 * rumble * tr;
  // crowd murmur
  let m = 0, mr = 0;
  for (const v of voices) {
    const env = Math.max(0, Math.sin(t * v.f + v.p) * Math.sin(t * v.f * 0.31 + v.p * 2));
    m += env * (1 - v.pan);
    mr += env * v.pan;
  }
  const n1 = ch1(cl1(rnd() * 2 - 1)), n2 = ch2(cl2(rnd() * 2 - 1));
  l += n1 * m * 0.09 * cr;
  r += n2 * mr * 0.09 * cr;
  // passing vehicles
  let pv = 0, pan = 0.5;
  for (const p of passes) {
    const u = (t - p.t) / p.len;
    if (u < 0 || u > 1) continue;
    const e = Math.pow(Math.sin(Math.PI * u), 2) * p.g;
    pv += e;
    pan = p.dir > 0 ? u : 1 - u;
  }
  const pn = (rnd() * 2 - 1);
  const pass = (plp(pn) * 0.7 + plp2(pn) * 0.3) * pv * 0.5 * tr;
  l += pass * (1.2 - pan);
  r += pass * (0.2 + pan);
  L[i] = l;
  R[i] = r;
}
// gentle fades at both ends
const F = Math.round(0.4 * SR);
for (let i = 0; i < F; i++) {
  const g = i / F;
  L[i] *= g; R[i] *= g; L[N - 1 - i] *= g; R[N - 1 - i] *= g;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = peak > 0 ? 0.5 / peak : 1;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log(`ambience: ${out} (${dur}s)`);
