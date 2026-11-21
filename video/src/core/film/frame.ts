// Frame size and the render presets every VOYNANN 3D film ships with.

export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Preview for approval, and the final deliverable (both 9:16). This is the default format. */
export const PRESETS = {
  preview: { width: WIDTH / 2, height: HEIGHT / 2, fps: 30 },
  final: { width: WIDTH, height: HEIGHT, fps: 60 },
} as const;

/** Landscape 16:9 — only when the user asks for it ("landscape", "16:9", "versi YouTube"). Register the film a
 *  second time with these sizes and the ids `<Name>PreviewWide` / `<Name>FinalWide`; the portrait pair stays. */
export const PRESETS_WIDE = {
  preview: { width: HEIGHT / 2, height: WIDTH / 2, fps: 30 },
  final: { width: HEIGHT, height: WIDTH, fps: 60 },
} as const;

/** The 2D layout canvas of a render size: 1080 × 1920 (portrait) or 1920 × 1080 (landscape); `k` scales it to the render. */
export const layoutOf = (width: number, height: number) =>
  width > height ? { w: HEIGHT, h: WIDTH, k: width / HEIGHT, wide: true } : { w: WIDTH, h: HEIGHT, k: width / WIDTH, wide: false };
export type Layout = ReturnType<typeof layoutOf>;

/** A vertical fov keyed for the narrow 9:16 frame shows three times the width in 16:9. This narrows it (in tan
 *  space) so a landscape frame shows about twice the portrait width: subjects stay readable, sets stay dressed to
 *  their edges. Use it on the fov of every landscape shot, then re-check the framing. */
export const wideFov = (fov: number, keep = 0.84) => (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * keep) * 180) / Math.PI;
