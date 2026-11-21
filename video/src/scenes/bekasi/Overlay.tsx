// 2D layer (laid out at 1080 × 1920): sentence subtitles in the lower third, the opening title and the
// closing cards. Everything fades from the film clock.

import React from "react";
import { FONT } from "../../core/type/fonts.ts";
import { LINES, OFFSET } from "./script.ts";

const fade = (t: number, a: number, b: number, d = 0.25) => Math.max(0, Math.min(1, (t - a) / d, (b - t) / d));

const SHADOW = "0 2px 12px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6)";

export const Subtitles: React.FC<{ T: number; hideAfter?: number }> = ({ T, hideAfter = Infinity }) => {
  const line = LINES.find((l) => T >= l.a + OFFSET - 0.1 && T < l.b + OFFSET + 0.35);
  if (!line || T >= hideAfter) return null;
  const o = fade(T, line.a + OFFSET - 0.1, line.b + OFFSET + 0.35, 0.18);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 1440, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.26,
          color: "#ffffff",
          textAlign: "center",
          padding: "16px 30px 18px",
          borderRadius: 22,
          background: "rgba(14,16,20,0.46)",
          textShadow: "0 1px 6px rgba(0,0,0,0.5)",
        }}
      >
        {line.text}
      </div>
    </div>
  );
};

export const TitleCard: React.FC<{ T: number; a: number; b: number }> = ({ T, a, b }) => {
  const o = fade(T, a, b, 0.5);
  if (o <= 0) return null;
  const rise = (1 - Math.min(1, (T - a) / 0.8)) * 26;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 360 + rise, textAlign: "center", opacity: o, fontFamily: FONT, color: "#fff", textShadow: SHADOW }}>
      <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: 10, opacity: 0.95 }}>KAWASAN PASAR PROYEK · KOTA BEKASI</div>
      <div style={{ fontSize: 132, fontWeight: 600, letterSpacing: -2, marginTop: 14 }}>Bekasi Junction</div>
      <div style={{ width: 120 * Math.min(1, (T - a) / 1.0), height: 4, background: "#e0592a", margin: "22px auto 0", borderRadius: 2 }} />
    </div>
  );
};

export const EndCards: React.FC<{ T: number; a: number; q: number; end: number }> = ({ T, a, q, end }) => {
  const o1 = fade(T, a, end, 0.9);
  const o2 = fade(T, q, end, 0.7);
  if (o1 <= 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, color: "#fff", textAlign: "center", textShadow: SHADOW }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 430, opacity: o1 }}>
        <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: 6 }}>BEKASI JUNCTION</div>
        <div style={{ width: 140, height: 4, background: "#e0592a", margin: "26px auto 30px", borderRadius: 2 }} />
        <div style={{ fontSize: 46, fontWeight: 500, lineHeight: 1.35 }}>Dulu menjadi tempat berkumpul, kini menjadi bagian dari kenangan.</div>
      </div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 1300, opacity: o2 }}>
        <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.32, padding: "22px 30px", borderRadius: 24, background: "rgba(14,16,20,0.42)" }}>
          Kalau kamu sebagai warga Bekasi, punya kenangan apa sama mall ini?
        </div>
      </div>
    </div>
  );
};
