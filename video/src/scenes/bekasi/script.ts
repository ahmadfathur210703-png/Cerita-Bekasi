// Narration lines with their VO times (seconds in the voice-over file, measured from silences),
// used for subtitles and cut planning. Film time = VO time + OFFSET.

export const OFFSET = 0.6;
export const VO_FILE = "vo/Bekasi_Junction.wav";
export const VO_DURATION = 124.04;

export type Line = { a: number; b: number; text: string; /** phrases drawn in gold */ hl?: string[] };

export const LINES: Line[] = [
  { a: 0.28, b: 5.21, text: "Di Bekasi, ada satu mall di kawasan Proyek yang punya banyak kenangan bagi warganya.", hl: ["kenangan"] },
  { a: 6.09, b: 7.46, text: "Namanya Bekasi Junction.", hl: ["Bekasi Junction"] },
  { a: 8.16, b: 14.13, text: "Dulu, tempat ini pernah menjadi salah satu tujuan warga Bekasi untuk menghabiskan waktu bersama keluarga.", hl: ["keluarga"] },
  { a: 14.86, b: 19.51, text: "Bermain, berbelanja, service elektronik, hingga menonton film di bioskop.", hl: ["bioskop"] },
  { a: 20.53, b: 24.1, text: "Buat sebagian orang, mungkin mall ini bukan sekadar tempat belanja,", hl: ["tempat belanja"] },
  { a: 24.85, b: 27.2, text: "tapi juga menjadi tempat menyimpan banyak cerita.", hl: ["cerita"] },
  { a: 27.93, b: 33.51, text: "Mulai dari kenangan masa kecil, jalan-jalan bareng teman, sampai momen kebersamaan bersama keluarga.", hl: ["masa kecil"] },
  { a: 34.67, b: 38.63, text: "Namun, seiring berjalannya waktu, Kota Bekasi semakin berkembang.", hl: ["berkembang"] },
  { a: 39.45, b: 43.33, text: "Banyak mall baru bermunculan dengan berbagai pilihan hiburan dan tempat berbelanja.", hl: ["mall baru"] },
  { a: 44.29, b: 49.75, text: "Hingga akhirnya, pandemi Covid datang dan menjadi salah satu pukulan besar bagi Bekasi Junction.", hl: ["pandemi Covid"] },
  { a: 50.81, b: 52.33, text: "Jumlah pengunjung menurun drastis.", hl: ["drastis"] },
  { a: 53.07, b: 55.86, text: "Suasana yang dulu ramai, perlahan berubah menjadi sepi.", hl: ["sepi"] },
  { a: 56.92, b: 58.87, text: "Mall ini pun mengalami masa mati suri,", hl: ["mati suri"] },
  { a: 59.33, b: 65.09, text: "yang semakin diperparah oleh persaingan dengan pusat perbelanjaan baru dan perubahan tren belanja masyarakat.", hl: ["persaingan"] },
  { a: 65.91, b: 71.84, text: "Memasuki tahun 2026, sejumlah tenant yang dulu menjadi daya tarik mall ini sudah tidak lagi beroperasi.", hl: ["2026"] },
  { a: 72.52, b: 76.4, text: "Mulai dari Lotte Mart, Ramayana, hingga Cinema XXI.", hl: ["Lotte Mart", "Ramayana", "Cinema XXI"] },
  { a: 77.31, b: 81.57, text: "Sebagian besar kios di dalamnya kini terlihat kosong dan tak lagi seramai dahulu.", hl: ["kosong"] },
  { a: 82.54, b: 86.13, text: "Meski begitu, Bekasi Junction belum sepenuhnya kehilangan aktivitasnya.", hl: ["aktivitasnya"] },
  { a: 86.95, b: 88.3, text: "Masih ada A&W yang bertahan,", hl: ["A&W"] },
  { a: 88.62, b: 94.56, text: "serta Ruang Aktivitas dan Studio Area yang digunakan untuk berbagai kegiatan komunitas,", hl: ["Ruang Aktivitas", "Studio Area"] },
  { a: 94.82, b: 98.79, text: "olahraga, zumba, line dance, bazar, hingga aktivitas kreatif.", hl: ["zumba", "line dance"] },
  { a: 99.61, b: 103.03, text: "Kini, Bekasi Junction mungkin tak lagi seramai masa kejayaannya.", hl: ["kejayaannya"] },
  { a: 103.86, b: 108.84, text: "Tapi bagi warga yang pernah menghabiskan waktu di sini, tentu ada banyak cerita yang sulit dilupakan.", hl: ["cerita"] },
  { a: 109.57, b: 115.39, text: "Karena pada akhirnya, sebuah tempat bukan hanya tentang bangunan, toko, atau fasilitas di dalamnya,", hl: ["bangunan"] },
  { a: 116.15, b: 119.79, text: "tetapi tentang kenangan dan momen yang pernah tercipta di sana.", hl: ["kenangan"] },
  { a: 120.49, b: 123.79, text: "Kalau kamu sebagai warga Bekasi, punya kenangan apa sama Bekasi Junction?", hl: ["Bekasi Junction"] },
];

/** Closing cards, exactly as in the brief. */
export const END_TITLE = "BEKASI JUNCTION";
export const END_LINE = "Dulu menjadi tempat berkumpul, kini menjadi bagian dari kenangan.";
export const END_QUESTION = "Kalau kamu sebagai warga Bekasi, punya kenangan apa sama Bekasi Junction?";
