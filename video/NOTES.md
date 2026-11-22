# Catatan proyek — Bekasi Junction (WORLDFORGE)

## Lingkungan cloud
- Unduhan Chrome Headless Shell dari remotion.media diblokir jaringan. Pakai Chromium headless shell bawaan mesin:
  ```
  D=node_modules/.remotion/chrome-headless-shell
  mkdir -p $D/linux64
  ln -sfn /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64 $D/linux64/chrome-headless-shell-linux64
  echo "157.0.8080.0-remotion-v3" > $D/VERSION
  ```
  Jalankan ulang setelah `npm ci`.
- Tidak ada GPU: render memakai jalur perangkat lunak, jadi lambat.
- `npm run smoke` lulus (2026-11-21).

## Bahan yang dibutuhkan (belum ada)
- `assets/naskah.txt`, `assets/Bekasi_Junction.wav`, `assets/foto/*` (12 foto).
