// 2D layer (laid out at 1080 × 1920): sentence subtitles in the lower third, the opening title and the
// closing cards. Everything fades from the film clock.

import React from "react";
import { LINES, OFFSET, type Line } from "./script.ts";
import { POPPINS } from "./poppins.ts";

const fade = (t: number, a: number, b: number, d = 0.25) => Math.max(0, Math.min(1, (t - a) / d, (b - t) / d));

const SHADOW = "0 2px 12px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)";

// ── Subtitles: short phrases in Poppins Bold, white with a soft shadow, key words in gold ──────────

export const GOLD = "#e3b55c";
const SUB_SHADOW = "0 3px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.7), 0 0 26px rgba(0,0,0,0.25)";
const MAX_CHARS = 24;

type Chunk = { a: number; b: number; words: { w: string; gold: boolean }[] };

/** Split a sentence into phrases of ≤ MAX_CHARS (breaking after punctuation when possible); each phrase
 *  gets a share of the sentence time proportional to its length. */
const chunksOf = (l: Line): Chunk[] => {
  const words = l.text.split(/\s+/);
  const gold = new Array(words.length).fill(false);
  const bare = (w: string) => w.replace(/[.,?!]/g, "").toLowerCase();
  for (const ph of l.hl ?? []) {
    const p = ph.split(/\s+/).map(bare);
    for (let i = 0; i + p.length <= words.length; i++) if (p.every((x, k) => bare(words[i + k]) === x)) for (let k = 0; k < p.length; k++) gold[i + k] = true;
  }
  // balanced phrases: as many as the length needs, each close to the same size, breaking after
  // punctuation when one is near (no one-word tails that would only flash)
  const totalChars = l.text.length;
  const n = Math.max(1, Math.ceil(totalChars / MAX_CHARS));
  const target = totalChars / n;
  const groups: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  words.forEach((w, i) => {
    cur.push(i);
    len += (cur.length > 1 ? 1 : 0) + w.length;
    const left = words.length - 1 - i;
    const nextLen = i < words.length - 1 ? words[i + 1].length + 1 : 0;
    const punct = /[,.]$/.test(w);
    const breakHere = left > 0 && groups.length < n - 1 && ((punct && len >= target * 0.6) || len + nextLen > target * 1.12);
    if (breakHere) {
      groups.push(cur);
      cur = [];
      len = 0;
    }
  });
  if (cur.length) groups.push(cur);
  const total = groups.reduce((s, g) => s + g.reduce((x, i) => x + words[i].length + 1, 0), 0);
  let t = l.a;
  return groups.map((g) => {
    const share = g.reduce((x, i) => x + words[i].length + 1, 0) / total;
    const a = t;
    t += share * (l.b - l.a);
    return { a, b: t, words: g.map((i) => ({ w: words[i], gold: gold[i] })) };
  });
};

export const CHUNKS: Chunk[] = LINES.flatMap(chunksOf);

export const Subtitles: React.FC<{ T: number; hideAfter?: number }> = ({ T, hideAfter = Infinity }) => {
  if (T >= hideAfter) return null;
  const v = T - OFFSET;
  const i = CHUNKS.findIndex((c, k) => v >= c.a - 0.08 && (v < c.b || (v < c.b + 0.45 && !(CHUNKS[k + 1] && v >= CHUNKS[k + 1].a - 0.08))));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const next = CHUNKS[i + 1];
  const joined = next && next.a - c.b < 0.05; // phrase hands straight over to the next: no fade-out gap
  const inT = Math.min(1, (v - (c.a - 0.08)) / 0.12);
  const outT = joined ? 1 : Math.min(1, (c.b + 0.45 - v) / 0.2);
  const o = Math.max(0, Math.min(inT, outT));
  const pop = 0.94 + 0.06 * Math.min(1, inT);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1450, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          fontFamily: `${POPPINS}, sans-serif`,
          fontWeight: 700,
          fontSize: 66,
          lineHeight: 1.18,
          letterSpacing: -0.5,
          color: "#ffffff",
          textAlign: "center",
          textShadow: SUB_SHADOW,
          transform: `scale(${pop})`,
        }}
      >
        {c.words.map((w, k) => (
          <React.Fragment key={k}>
            {k ? " " : ""}
            <span style={{ color: w.gold ? GOLD : "#ffffff" }}>{w.w}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const TitleCard: React.FC<{ T: number; a: number; b: number }> = ({ T, a, b }) => {
  const o = fade(T, a, b, 0.5);
  if (o <= 0) return null;
  const rise = (1 - Math.min(1, (T - a) / 0.8)) * 26;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 360 + rise, textAlign: "center", opacity: o, fontFamily: `${POPPINS}, sans-serif`, color: "#fff", textShadow: SHADOW }}>
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 6, color: "#ffffff" }}>KAWASAN PASAR PROYEK · KOTA BEKASI</div>
      <div style={{ fontSize: 118, fontWeight: 700, letterSpacing: -2, marginTop: 10 }}>Bekasi Junction</div>
      <div style={{ width: 120 * Math.min(1, (T - a) / 1.0), height: 4, background: GOLD, margin: "22px auto 0", borderRadius: 2 }} />
    </div>
  );
};

export const EndCards: React.FC<{ T: number; a: number; q: number; end: number }> = ({ T, a, q, end }) => {
  const o1 = fade(T, a, end, 0.9);
  const o2 = fade(T, q, end, 0.7);
  if (o1 <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: `${POPPINS}, sans-serif`, color: "#fff", textAlign: "center", textShadow: SHADOW }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 430, opacity: o1 }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: 4, color: GOLD }}>BEKASI JUNCTION</div>
        <div style={{ width: 140, height: 4, background: "#ffffff", margin: "26px auto 30px", borderRadius: 2 }} />
        <div style={{ fontSize: 50, fontWeight: 600, lineHeight: 1.3 }}>Dulu menjadi tempat berkumpul, kini menjadi bagian dari kenangan.</div>
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 1300, opacity: o2 }}>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.25 }}>
          Kalau kamu sebagai warga Bekasi, punya kenangan apa sama mall ini?
        </div>
      </div>
    </div>
  );
};

/** A big year marker at the top of the frame (2020, 2026). */
export const YearBadge: React.FC<{ T: number; a: number; b: number; year: string }> = ({ T, a, b, year }) => {
  const o = fade(T, a, b, 0.45);
  if (o <= 0) return null;
  const k = Math.min(1, (T - a) / 0.6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", opacity: o, fontFamily: `${POPPINS}, sans-serif`, textShadow: SUB_SHADOW }}>
      <div style={{ fontSize: 150, fontWeight: 700, color: GOLD, letterSpacing: 4, transform: `translateY(${(1 - k) * 18}px)` }}>{year}</div>
    </div>
  );
};
