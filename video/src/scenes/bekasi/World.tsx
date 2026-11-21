// The world + its light. Every scene of the film renders this same world; a `Mood` picks the time of day.

import React from "react";
import { Stage, type Look, type ShadowBox, type Shot } from "../../kits/worldforge/Stage.tsx";
import { SkyDome, useSkyEnvironment, type SkyColors } from "../../kits/worldforge/Sky.tsx";
import type { V3 } from "./prim.tsx";
import { Mall } from "./Mall.tsx";
import { Street } from "./Street.tsx";
import { setNight } from "./kit.ts";

export const SUN: V3 = [-0.45, 0.72, 0.53];
const SHADOW: ShadowBox = { min: [-130, -1, -62], max: [180, 30, 48], mapWidth: 4096, sun: SUN };

export type MoodName = "day" | "covid" | "dusk";
export const SKIES: Record<MoodName, SkyColors> = {
  day: { zenith: "#4f86c9", horizon: "#d6e2ea", glow: "#fff2d6", halo: "#ffffff", ground: "#77766c", sunDisk: 14 },
  covid: { zenith: "#6d7e8c", horizon: "#b9c3c9", glow: "#d9dee2", halo: "#eef2f4", ground: "#5d625f", sunDisk: 0 },
  dusk: { zenith: "#2c3f6e", horizon: "#f0a874", glow: "#ffb070", halo: "#ffe2bb", ground: "#3e3a3a", sunDisk: 10 },
};

export const lookFor = (mood: MoodName, env: Look["environment"]): Look => {
  const s = SKIES[mood];
  if (mood === "covid")
    return { sun: SUN, sunColor: "#dfe7ee", sunI: 1.2, exposure: 0.88, fog: { color: s.horizon, density: 0.0016 }, background: s.horizon, environment: env, envIntensity: 0.8, ao: 0.8, bloom: 0.06, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.26 };
  if (mood === "dusk")
    return { sun: [-0.7, 0.12, 0.7], sunColor: "#ff9b5a", sunI: 1.6, exposure: 0.95, fog: { color: "#c98e6e", density: 0.0012 }, background: s.horizon, environment: env, envIntensity: 0.55, ao: 0.7, bloom: 0.35, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.24 };
  return { sun: SUN, sunColor: "#fff3df", sunI: 3.4, exposure: 1.0, fog: { color: s.horizon, density: 0.0011 }, background: s.horizon, environment: env, envIntensity: 1.0, ao: 0.75, bloom: 0.1, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.16 };
};

const Envs: React.FC<{ mood: MoodName; children: (env: Look["environment"]) => React.ReactNode }> = ({ mood, children }) => {
  const day = useSkyEnvironment(SUN, SKIES.day, 0.85);
  const covid = useSkyEnvironment(SUN, SKIES.covid, 0.7);
  const dusk = useSkyEnvironment([-0.7, 0.12, 0.7], SKIES.dusk, 0.6);
  return <>{children(mood === "day" ? day : mood === "covid" ? covid : dusk)}</>;
};

export const World: React.FC<{ shot: Shot; mood: MoodName; night?: number; frame: number; children?: React.ReactNode }> = ({ shot, mood, night = 0, frame, children }) => {
  setNight(night);
  return (
    <Envs mood={mood}>
      {(env) => (
        <Stage shot={shot} look={lookFor(mood, env)} shadowBox={SHADOW} frame={frame}>
          <SkyDome key={mood} sun={mood === "dusk" ? [-0.7, 0.12, 0.7] : SUN} colors={SKIES[mood]} />
          <Mall />
          <Street />
          {children}
        </Stage>
      )}
    </Envs>
  );
};
