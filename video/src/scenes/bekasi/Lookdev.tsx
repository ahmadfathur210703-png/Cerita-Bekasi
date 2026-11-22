// Look development: fixed cameras that match the reference photos (one per second of the composition).

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Stage3D } from "../../core/film/Stage3D.tsx";
import type { Shot } from "../../kits/worldforge/Stage.tsx";
import { World } from "./World.tsx";

const SHOTS: Shot[] = [
  // 0 front, across the road (photo: Ramayana / LOTTE Mart entrance box)
  { pos: [-2, 1.7, 33.5], target: [-2, 12, 0], fov: 66, near: 0.3, far: 3000 },
  // 1 canopy wing from below-left (photo: Ramayana sign + canopy + Bekasi Junction)
  { pos: [12, 2.0, 22], target: [34, 15, 0], fov: 58, near: 0.3, far: 3000 },
  // 2 rotunda from the road (photo: dome, angkot)
  { pos: [-28, 1.8, 30], target: [-46, 10, -2], fov: 60, near: 0.3, far: 3000 },
  // 3 drone, high
  { pos: [-40, 140, 260], target: [5, 5, 0], fov: 38, near: 1, far: 4000 },
  // 4 drone, medium, three-quarter
  { pos: [70, 45, 95], target: [5, 10, 0], fov: 44, near: 0.5, far: 4000 },
];

export const BekasiLookdev: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.min(SHOTS.length - 1, Math.floor(frame / fps));
  return (
    <Stage3D background="#d6e2ea">
      <World shot={SHOTS[i]} mood="day" frame={frame} />
    </Stage3D>
  );
};
