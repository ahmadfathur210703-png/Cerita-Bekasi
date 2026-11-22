// The world + its light. Every scene of the film renders this same world; a `Mood` picks the time of day.

import React from "react";
import { Stage, type Look, type ShadowBox, type Shot } from "../../kits/worldforge/Stage.tsx";
import { SkyDome, useSkyEnvironment, type SkyColors } from "../../kits/worldforge/Sky.tsx";
import type { V3 } from "./prim.tsx";
import { Mall } from "./Mall.tsx";
import { Street } from "./Street.tsx";
import { setNight } from "./kit.ts";
import { Interior, type InteriorState, type Era } from "./Interior.tsx";

export const SUN: V3 = [-0.45, 0.72, 0.53];
const SHADOW: ShadowBox = { min: [-130, -1, -62], max: [180, 30, 48], mapWidth: 4096, sun: SUN };

export type MoodName = "day" | "covid" | "dusk";
export const SKIES: Record<MoodName, SkyColors> = {
  day: { zenith: "#4f86c9", horizon: "#d6e2ea", glow: "#fff2d6", halo: "#ffffff", ground: "#77766c", sunDisk: 14 },
  covid: { zenith: "#6d7e8c", horizon: "#b9c3c9", glow: "#d9dee2", halo: "#eef2f4", ground: "#5d625f", sunDisk: 0 },
  dusk: { zenith: "#1b2d5c", horizon: "#c99a8c", glow: "#ffb27a", halo: "#ffe2bb", ground: "#2e3038", sunDisk: 8 },
};

export const lookFor = (mood: MoodName, env: Look["environment"]): Look => {
  const s = SKIES[mood];
  if (mood === "covid")
    return { sun: SUN, sunColor: "#dfe7ee", sunI: 1.2, exposure: 0.88, fog: { color: s.horizon, density: 0.0016 }, background: s.horizon, environment: env, envIntensity: 0.8, ao: 0.8, bloom: 0.06, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.26 };
  if (mood === "dusk")
    return { sun: [-0.7, 0.12, 0.7], sunColor: "#ffb27a", sunI: 0.8, exposure: 1.1, fog: { color: "#56607f", density: 0.0010 }, background: s.horizon, environment: env, envIntensity: 0.6, ao: 0.7, bloom: 0.3, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.24 };
  return { sun: SUN, sunColor: "#fff3df", sunI: 3.4, exposure: 1.0, fog: { color: s.horizon, density: 0.0011 }, background: s.horizon, environment: env, envIntensity: 1.0, ao: 0.75, bloom: 0.1, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", vignette: 0.16 };
};

const INDOOR: SkyColors = { zenith: "#fff4e3", horizon: "#e9e1d3", glow: "#fff2dc", halo: "#ffffff", ground: "#b9ab95", sunDisk: 0 };
const INDOOR_COOL: SkyColors = { zenith: "#cdd8e2", horizon: "#aab6bf", glow: "#d6e0e8", halo: "#eef2f4", ground: "#6f7478", sunDisk: 0 };

const lookInside = (era: Era, env: Look["environment"]): Look => {
  const base = { sun: [0.25, 1, 0.35] as V3, haze: 0, hazeFlow: 0, hazeColor: "#ffffff", environment: env };
  if (era === "covid") return { ...base, sunColor: "#c9d6e6", sunI: 0.6, exposure: 0.8, fog: { color: "#2b3138", density: 0.012 }, background: "#2b3138", envIntensity: 0.45, ao: 0.9, bloom: 0.12, vignette: 0.34 };
  if (era === "y2026") return { ...base, sunColor: "#f2ecdf", sunI: 0.7, exposure: 0.85, fog: { color: "#3a3833", density: 0.008 }, background: "#3a3833", envIntensity: 0.6, ao: 0.85, bloom: 0.2, vignette: 0.26 };
  return { ...base, sunColor: "#fff4e2", sunI: 1.0, exposure: 0.94, fog: { color: "#e9dfcd", density: 0.0016 }, background: "#efe6d6", envIntensity: 0.95, ao: 0.8, bloom: 0.22, vignette: 0.18 };
};

const Envs: React.FC<{ mood: MoodName | "inWarm" | "inCool"; children: (env: Look["environment"]) => React.ReactNode }> = ({ mood, children }) => {
  const day = useSkyEnvironment(SUN, SKIES.day, 0.85);
  const covid = useSkyEnvironment(SUN, SKIES.covid, 0.7);
  const dusk = useSkyEnvironment([-0.7, 0.12, 0.7], SKIES.dusk, 0.6);
  const inWarm = useSkyEnvironment(SUN, INDOOR, 0.9);
  const inCool = useSkyEnvironment(SUN, INDOOR_COOL, 0.8);
  const pick = mood === "day" ? day : mood === "covid" ? covid : mood === "dusk" ? dusk : mood === "inCool" ? inCool : inWarm;
  return <>{children(pick)}</>;
};

export const World: React.FC<{
  shot: Shot;
  mood: MoodName;
  night?: number;
  /** 0 = Ramayana / LOTTE Mart signs dark (2026), 1 = lit at night */
  tenants?: number;
  frame: number;
  inside?: InteriorState;
  /** extra things in the street world (new malls, towers) */
  extras?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ shot, mood, night = 0, tenants = 1, frame, inside, extras, children }) => {
  setNight(night, { tenant: tenants });
  if (inside) {
    return (
      <Envs mood={inside.era === "covid" ? "inCool" : "inWarm"}>
        {(env) => (
          <Stage shot={shot} look={lookInside(inside.era, env)} shadowBox={SHADOW} frame={frame}>
            <Interior state={inside}>{children}</Interior>
          </Stage>
        )}
      </Envs>
    );
  }
  return (
    <Envs mood={mood}>
      {(env) => (
        <Stage shot={shot} look={lookFor(mood, env)} shadowBox={SHADOW} frame={frame}>
          <SkyDome key={mood} sun={mood === "dusk" ? [-0.7, 0.12, 0.7] : SUN} colors={SKIES[mood]} />
          <Mall />
          <Street />
          {extras}
          {children}
        </Stage>
      )}
    </Envs>
  );
};
