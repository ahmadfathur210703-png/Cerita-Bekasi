// Re-render one frame range of a composition (muted, same encoder settings as render-final), e.g. to patch the
// tail of a finished film after a text change. Splice it back at a keyframe with ffmpeg concat + stream copy.
//   node scripts/render-range.mjs --comp=<id> --from=<frame> --to=<frame> --out=<file.mp4> [--concurrency=2] [--crf=17]

import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { glMode, tolerateClosedTargets } from "./gl.mjs";

tolerateClosedTargets();
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `=${d ?? ""}`).split("=").slice(1).join("=");
const comp = arg("comp"), out = arg("out"), from = Number(arg("from")), to = Number(arg("to"));
const concurrency = Number(arg("concurrency", "2")), crf = Number(arg("crf", "17"));
fs.mkdirSync(path.dirname(out), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
process.on("exit", () => fs.rmSync(serveUrl, { recursive: true, force: true }));
const composition = await selectComposition({ serveUrl, id: comp });
let shown = 0;
await renderMedia({
  composition, serveUrl, codec: "h264", crf, pixelFormat: "yuv420p", muted: true, frameRange: [from, to], outputLocation: out,
  concurrency, imageFormat: "jpeg", jpegQuality: 95, chromiumOptions: { gl: glMode() }, timeoutInMilliseconds: 300000,
  onProgress: ({ progress }) => { const q = Math.floor(progress * 4); if (q > shown) { shown = q; process.stdout.write(`  ${q * 25}%`); } },
});
console.log(`\nrange ${from}-${to} → ${out}`);
