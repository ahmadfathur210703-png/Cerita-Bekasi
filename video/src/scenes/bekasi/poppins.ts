// Poppins (SIL OFL, public/fonts/OFL-poppins.txt), supplied by the client, for subtitles and titles.
import { continueRender, delayRender, staticFile } from "remotion";

export const POPPINS = "Poppins";
let ready: Promise<void> | null = null;
export const poppinsReady = (): Promise<void> => {
  if (ready) return ready;
  if (typeof document === "undefined") return (ready = Promise.resolve());
  const handle = delayRender("Loading Poppins");
  ready = Promise.all(
    [["600", "poppins-semibold"], ["700", "poppins-bold"]].map(async ([w, f]) => {
      const face = new FontFace(POPPINS, `url(${staticFile(`fonts/${f}.woff2`)}) format("woff2")`, { weight: w, style: "normal" });
      await face.load();
      (document.fonts as unknown as { add(f: FontFace): void }).add(face);
    }),
  ).then(
    () => continueRender(handle),
    (e) => {
      continueRender(handle);
      throw e;
    },
  );
  return ready;
};
poppinsReady();
