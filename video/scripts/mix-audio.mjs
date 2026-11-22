// Pre-mix: VO at its offset (untouched speed/pitch) + ambience sitting `under` LU below the voice.
//   node scripts/mix-audio.mjs <vo.wav> <ambience.wav> <out.wav> <offsetSec> <durationSec> [underLU=22]
import { spawnSync } from "node:child_process";

const [vo, amb, out, offArg, durArg, underArg = "22"] = process.argv.slice(2);
const ff = (args) => {
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
const lufs = (f) => {
  const s = ff(["-nostats", "-i", f, "-af", "ebur128", "-f", "null", "-"]);
  return Number(/I:\s+(-?[\d.]+) LUFS/.exec(s.slice(s.lastIndexOf("Summary")))[1]);
};
const lv = lufs(vo), la = lufs(amb);
const gain = lv - Number(underArg) - la;
const ms = Math.round(Number(offArg) * 1000);
ff([
  "-v", "error", "-y", "-i", vo, "-i", amb,
  "-filter_complex",
  `[0]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=${ms}:all=1,apad[v];[1]aresample=48000,volume=${gain.toFixed(2)}dB[a];[v][a]amix=inputs=2:normalize=0:duration=longest`,
  "-t", durArg, "-c:a", "pcm_s16le", out,
]);
console.log(`mix: VO ${lv.toFixed(1)} LUFS, ambience ${la.toFixed(1)} → ${(la + gain).toFixed(1)} LUFS (gain ${gain.toFixed(1)} dB) → ${out}`);
