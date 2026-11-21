import React from "react";
import { Composition } from "remotion";
import { PRESETS, PRESETS_WIDE } from "./core/film/frame.ts";
import { Showcase } from "./scenes/showcase/Showcase.tsx";

// Register each film twice: a preview (540 × 960 @ 30, for approval) and a final (1080 × 1920 @ 60).
// The 3D renders natively at each size, so the preview is cheap and the final is sharp.
// Portrait 9:16 is the default. Only when the user asks for landscape 16:9, register the film again with
// PRESETS_WIDE as `<Name>PreviewWide` / `<Name>FinalWide` (960 × 540 @ 30, 1920 × 1080 @ 60) and direct it for the
// wide frame: Stage3D hands the overlay a 1920 × 1080 layout, wideFov() keeps the lens feel (see core/film/frame.ts).
const { preview, final } = PRESETS;
const wide = PRESETS_WIDE;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="ShowcasePreview" component={Showcase} durationInFrames={6 * preview.fps} fps={preview.fps} width={preview.width} height={preview.height} />
    <Composition id="ShowcaseFinal" component={Showcase} durationInFrames={6 * final.fps} fps={final.fps} width={final.width} height={final.height} />
    <Composition id="ShowcasePreviewWide" component={Showcase} durationInFrames={6 * wide.preview.fps} fps={wide.preview.fps} width={wide.preview.width} height={wide.preview.height} />
    <Composition id="ShowcaseFinalWide" component={Showcase} durationInFrames={6 * wide.final.fps} fps={wide.final.fps} width={wide.final.width} height={wide.final.height} />
  </>
);
