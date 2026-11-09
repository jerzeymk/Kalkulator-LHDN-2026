// Peraturan cukai individu pemastautin Malaysia — Tahun Taksiran (TT) 2026.
// Sumber: Jadual kadar cukai LHDN (tidak berubah sejak TT 2024) dan
// Spesifikasi Kaedah Pengiraan Berkomputer PCB 2026 (formula tidak berubah).
// Semua nilai dalam RM. Ubah fail ini sahaja apabila tahun taksiran berubah.

export const TAHUN_TAKSIRAN = 2026;

// Jadual P-M-R-B untuk formula PCB:
//   Cukai = (P - M) * R + B
// B sudah mengambil kira rebat RM400 individu (dan RM400 pasangan untuk
// Kategori 2) apabila P <= RM35,000.
// Kategori 1 = bujang; 2 = berkahwin, pasangan tidak bekerja;
// 3 = berkahwin, pasangan bekerja (B sama seperti Kategori 1).
export const JADUAL_PCB = [
  { min: 5001,    max: 20000,    M: 5000,    R: 0.01, B: { 1: -400,   2: -800,   3: -400 } },
  { min: 20001,   max: 35000,    M: 20000,   R: 0.03, B: { 1: -250,   2: -650,   3: -250 } },
  { min: 35001,   max: 50000,    M: 35000,   R: 0.06, B: { 1: 600,    2: 600,    3: 600 } },
  { min: 50001,   max: 70000,    M: 50000,   R: 0.11, B: { 1: 1500,   2: 1500,   3: 1500 } },
  { min: 70001,   max: 100000,   M: 70000,   R: 0.19, B: { 1: 3700,   2: 3700,   3: 3700 } },
  { min: 100001,  max: 400000,   M: 100000,  R: 0.25, B: { 1: 9400,   2: 9400,   3: 9400 } },
  { min: 400001,  max: 600000,   M: 400000,  R: 0.26, B: { 1: 84400,  2: 84400,  3: 84400 } },
  { min: 600001,  max: 2000000,  M: 600000,  R: 0.28, B: { 1: 136400, 2: 136400, 3: 136400 } },
  { min: 2000001, max: Infinity, M: 2000000, R: 0.30, B: { 1: 528400, 2: 528400, 3: 528400 } },
];

// Jadual kadar bertingkat (untuk paparan anggaran cukai tahunan).
export const KADAR_CUKAI = [
  { hingga: 5000,     kadar: 0.00 },
  { hingga: 20000,    kadar: 0.01 },
  { hingga: 35000,    kadar: 0.03 },
  { hingga: 50000,    kadar: 0.06 },
  { hingga: 70000,    kadar: 0.11 },
  { hingga: 100000,   kadar: 0.19 },
  { hingga: 400000,   kadar: 0.25 },
  { hingga: 600000,   kadar: 0.26 },
  { hingga: 2000000,  kadar: 0.28 },
  { hingga: Infinity, kadar: 0.30 },
];

export const REBAT = {
  hadPendapatanBercukai: 35000,
  individu: 400,
  pasangan: 400, // hanya Kategori 2
};

// Potongan automatik dalam formula PCB.
export const POTONGAN = {
  individu: 9000,          // D
  pasangan: 4000,          // S  (Kategori 2 sahaja)
  individuOKU: 7000,       // DU
  pasanganOKU: 6000,       // SU (Kategori 2 sahaja)
  hadKWSP: 4000,           // Had K (KWSP / skim diluluskan) setahun
};

// Pelepasan anak (Q) mengikut kategori anak.
export const PELEPASAN_ANAK = {
  bawah18:        { label: 'Anak bawah 18 tahun', amaun: 2000 },
  atas18PraU:     { label: 'Anak 18+ belajar sepenuh masa (A-Level, matrikulasi, pra-U)', amaun: 2000 },
  atas18IPT:      { label: 'Anak 18+ di IPT (diploma ke atas dalam negara / ijazah ke atas luar negara)', amaun: 8000 },
  oku:            { label: 'Anak OKU', amaun: 8000 },
  okuIPT:         { label: 'Anak OKU di IPT (diploma / ijazah ke atas)', amaun: 16000 },
};

// Pelepasan lain yang boleh dituntut melalui Borang TP1 (LP dalam formula).
// `had` = had maksimum setahun. `kumpulan` = berkongsi had dengan item lain.
export const PELEPASAN_TP1 = [
  { id: 'perubatanIbuBapa', label: 'Rawatan perubatan, keperluan khas & penjagaan ibu bapa', had: 8000 },
  { id: 'peralatanOKU', label: 'Peralatan sokongan asas untuk diri / pasangan / anak / ibu bapa OKU', had: 6000 },
  { id: 'yuranPendidikan', label: 'Yuran pendidikan sendiri (termasuk kursus peningkatan kemahiran, had RM2,000)', had: 7000 },
  { id: 'perubatanSendiri', label: 'Perubatan penyakit serius, kesuburan, vaksinasi, pemeriksaan kesihatan (had RM1,000), pergigian (had RM1,000), kecacatan pembelajaran anak (had RM10,000)', had: 10000 },
  { id: 'gayaHidup', label: 'Gaya hidup: buku, komputer/telefon, internet, kursus kemahiran', had: 2500 },
  { id: 'gayaHidupSukan', label: 'Gaya hidup tambahan: peralatan & aktiviti sukan, yuran gim, pertandingan', had: 1000 },
  { id: 'penyusuan', label: 'Peralatan penyusuan ibu (anak bawah 2 tahun, sekali setiap 2 tahun)', had: 1000 },
  { id: 'taska', label: 'Yuran taska / tadika / pusat transit berdaftar (anak sehingga 12 tahun)', had: 3000 },
  { id: 'sspn', label: 'Simpanan bersih SSPN', had: 8000 },
  { id: 'insuransHayat', label: 'Premium insurans hayat / takaful (diri, pasangan, anak)', had: 3000 },
  { id: 'insuransPendidikan', label: 'Insurans pendidikan & perubatan (diri, pasangan, anak)', had: 4000 },
  { id: 'prs', label: 'Skim Persaraan Swasta (PRS) & anuiti tertangguh', had: 3000 },
  { id: 'perkeso', label: 'Caruman PERKESO & SIP', had: 350 },
  { id: 'ev', label: 'Pemasangan / sewa / langganan pengecas kenderaan elektrik (EV)', had: 2500 },
  { id: 'faedahRumahPertama', label: 'Faedah pinjaman rumah pertama (harga ≤ RM500k: had RM7,000; RM500k–750k: had RM5,000)', had: 7000 },
  { id: 'pelancongan', label: 'Pelancongan domestik: tiket masuk tarikan pelancongan & persembahan budaya (TT 2026 sahaja)', had: 1000 },
];

// Peraturan operasi PCB.
export const PERATURAN_PCB = {
  minimumPotongan: 10,   // PCB < RM10 (sebelum tolak zakat) tidak perlu dipotong
  pembundaran: 0.05,     // dibundarkan ke atas kepada 5 sen terdekat
};
