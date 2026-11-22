// The standard VOYNANN 3D frame: waits for the web font (canvases and overlays use it), mounts a
// Remotion-synchronised ThreeCanvas with the settings every demo used (PCF shadows, dpr 1, MSAA in
// the post chain instead of the canvas), then draws the 2D overlay and an optional fade on top.
// Everything inside must be a pure function of the frame (see SKILL.md › Determinism). The scene-QA probe
// (core/qa/scene-qa.tsx) rides along and only wakes up under scripts/qa-scene.mjs.

import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { PCFShadowMap } from "three";
import { fontReady } from "../type/fonts.ts";
import { layoutOf, type Layout } from "./frame.ts";
import { QaProbe, qaNoOverlay } from "../qa/scene-qa.tsx";

export const Stage3D: React.FC<{
  /** The 3D scene (studio/sky, objects, CameraRig, Post). */
  children: React.ReactNode;
  /** 2D layer laid out at 1080 × 1920 (in a landscape composition: 1920 × 1080) and scaled to the render size. */
  overlay?: (scale: number, layout: Layout) => React.ReactNode;
  /** Page colour behind the canvas (visible only before the first frame paints). */
  background?: string;
  /** 0…1 fade to `fadeColor` over everything. */
  fade?: number;
  fadeColor?: string;
}> = ({ children, overlay, background = "#e9e6e0", fade = 0, fadeColor = "#ece9e3" }) => {
  const { width, height } = useVideoConfig();
  const L = layoutOf(width, height);
  const [handle] = useState(() => delayRender("font"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontReady().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {ready ? (
        <>
          <ThreeCanvas
            width={width}
            height={height}
            shadows={{ type: PCFShadowMap }}
            dpr={1}
            gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
            camera={{ fov: 24, near: 1, far: 900, position: [0, 0, 60] }}
          >
            {children}
            <QaProbe />
          </ThreeCanvas>
          {overlay && !qaNoOverlay() ? (
            <div style={{ position: "absolute", inset: 0, width: L.w, height: L.h, transform: `scale(${L.k})`, transformOrigin: "0 0" }}>
              {overlay(L.k, L)}
            </div>
          ) : null}
        </>
      ) : null}
      {fade > 0 ? <AbsoluteFill style={{ backgroundColor: fadeColor, opacity: fade }} /> : null}
    </AbsoluteFill>
  );
};
