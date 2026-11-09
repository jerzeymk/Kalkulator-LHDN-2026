// Enjin pengiraan PCB (Potongan Cukai Bulanan) — Kaedah Pengiraan Berkomputer LHDN.
// Modul tulen: tiada DOM, boleh diguna semula (contoh: apl penjejak perbelanjaan).
//
// Formula rasmi:
//   P   = [Σ(Y−K) + (Y1−K1) + (Y2−K2)×n + (Yt−Kt)] − [D + S + DU + SU + QC + (ΣLP + LP1)]
//   PCB = [((P − M) × R + B) − (Z + X)] ÷ (n + 1)
//   PCB bersih bulan semasa = PCB − zakat bulan semasa

import {
  JADUAL_PCB, KADAR_CUKAI, REBAT, POTONGAN, PELEPASAN_ANAK, PELEPASAN_TP1, PERATURAN_PCB,
} from './tax-rules-2026.js';

const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
const r2 = (v) => Math.round(v * 100) / 100;

/** Bundarkan ke atas kepada 5 sen terdekat (peraturan LHDN). */
export function bundar5Sen(v) {
  if (v <= 0) return 0;
  const sen = Math.round(v * 100); // elak ralat titik terapung
  return Math.ceil(sen / 5) * 5 / 100;
}

/** Cukai tahunan ke atas pendapatan bercukai P menggunakan jadual P-M-R-B PCB. */
export function cukaiJadualPCB(P, kategori) {
  if (P <= 5000) return 0;
  const baris = JADUAL_PCB.find((b) => P >= b.min && P <= b.max);
  const cukai = (P - baris.M) * baris.R + baris.B[kategori];
  return Math.max(0, r2(cukai));
}

/** Cukai tahunan mengikut jadual bertingkat (untuk paparan & semakan). */
export function cukaiBertingkat(P, kategori) {
  let baki = Math.max(0, P);
  let bawah = 0;
  let cukai = 0;
  const pecahan = [];
  for (const { hingga, kadar } of KADAR_CUKAI) {
    if (baki <= 0) break;
    const lebar = Math.min(baki, hingga - bawah);
    const amaun = lebar * kadar;
    if (lebar > 0) pecahan.push({ dari: bawah, hingga: bawah + lebar, kadar, amaun: r2(amaun) });
    cukai += amaun;
    baki -= lebar;
    bawah = hingga;
  }
  let rebat = 0;
  if (P <= REBAT.hadPendapatanBercukai && P > 0) {
    rebat += REBAT.individu;
    if (kategori === 2) rebat += REBAT.pasangan;
  }
  rebat = Math.min(rebat, cukai);
  return { kasar: r2(cukai), rebat: r2(rebat), bersih: r2(cukai - rebat), pecahan };
}

/** Jumlah pelepasan anak (QC). `anak` = { bawah18: n, atas18IPT: n, ... }. */
export function kiraPelepasanAnak(anak = {}, peratusTuntutan = 100) {
  let jumlah = 0;
  for (const [k, n] of Object.entries(anak)) {
    const kat = PELEPASAN_ANAK[k];
    if (kat) jumlah += kat.amaun * num(n);
  }
  return jumlah * (peratusTuntutan / 100);
}

/** Jumlah pelepasan TP1 dengan had setiap item. `tp1` = { id: amaun }. */
export function kiraPelepasanTP1(tp1 = {}) {
  let jumlah = 0;
  const butiran = [];
  for (const item of PELEPASAN_TP1) {
    const dituntut = num(tp1[item.id]);
    if (dituntut <= 0) continue;
    const diluluskan = Math.min(dituntut, item.had);
    butiran.push({ id: item.id, label: item.label, dituntut, diluluskan, had: item.had });
    jumlah += diluluskan;
  }
  return { jumlah, butiran };
}

/**
 * Agihkan had KWSP RM4,000 mengikut urutan: terkumpul (K), bulan semasa (K1),
 * tambahan (Kt), kemudian anggaran bulan berikutnya (K2 × n).
 */
function hadkanKWSP({ K, K1, Kt = 0, K2n }) {
  let baki = POTONGAN.hadKWSP;
  const ambil = (v) => { const a = Math.min(v, baki); baki -= a; return a; };
  const k = ambil(K);
  const k1 = ambil(K1);
  const kt = ambil(Kt);
  const k2n = ambil(K2n);
  return { K: k, K1: k1, Kt: kt, K2n: k2n, jumlah: k + k1 + kt + k2n };
}

/**
 * Kira PCB bulan semasa.
 *
 * @param {object} i
 * @param {1|2|3} i.kategori        1 bujang, 2 kahwin pasangan tak bekerja, 3 kahwin pasangan bekerja
 * @param {boolean} i.oku            Individu OKU
 * @param {boolean} i.pasanganOKU    Pasangan OKU (Kategori 2 sahaja)
 * @param {number}  i.bulan          Bulan semasa 1–12
 * @param {number}  i.gajiBulanIni   Y1 — saraan kasar bulan semasa
 * @param {number}  i.kwspBulanIni   K1 — caruman KWSP pekerja bulan semasa
 * @param {number}  i.bonus          Yt — saraan tambahan bulan ini (bonus dsb.)
 * @param {number}  i.kwspBonus      Kt — caruman KWSP ke atas saraan tambahan
 * @param {number}  i.gajiTerkumpul  ΣY — saraan kasar terkumpul bulan-bulan sebelum
 * @param {number}  i.kwspTerkumpul  ΣK — KWSP terkumpul bulan-bulan sebelum
 * @param {number}  i.pcbTerkumpul   X  — PCB terkumpul telah dibayar
 * @param {number}  i.zakatTerkumpul Z  — zakat terkumpul bulan-bulan sebelum
 * @param {number}  i.zakatBulanIni  zakat bulan semasa (melalui majikan)
 * @param {number}  i.tp1Terkumpul   ΣLP — pelepasan TP1 terkumpul bulan sebelum
 * @param {object}  i.tp1            LP1 — pelepasan TP1 bulan ini { id: amaun }
 * @param {object}  i.anak           { bawah18: n, ... }
 * @param {number}  i.peratusAnak    100 atau 50 (Kategori 3 berkongsi tuntutan)
 * @param {number}  [i.gajiBulanSeterusnya] Y2 — lalai = Y1
 * @param {number}  [i.kwspBulanSeterusnya] K2 — lalai = K1
 */
export function kiraPCB(i) {
  const kategori = [1, 2, 3].includes(Number(i.kategori)) ? Number(i.kategori) : 1;
  const bulan = Math.min(12, Math.max(1, Math.round(num(i.bulan) || 1)));
  const n = 12 - bulan;

  const Y = num(i.gajiTerkumpul);
  const K = num(i.kwspTerkumpul);
  const Y1 = num(i.gajiBulanIni);
  const K1 = num(i.kwspBulanIni);
  const Y2 = i.gajiBulanSeterusnya == null ? Y1 : num(i.gajiBulanSeterusnya);
  const K2 = i.kwspBulanSeterusnya == null ? K1 : num(i.kwspBulanSeterusnya);
  const Yt = num(i.bonus);
  const Kt = num(i.kwspBonus);
  const X = num(i.pcbTerkumpul);
  const Z = num(i.zakatTerkumpul);
  const zakatBulanIni = num(i.zakatBulanIni);

  // Potongan
  const D = POTONGAN.individu;
  const S = kategori === 2 ? POTONGAN.pasangan : 0;
  const DU = i.oku ? POTONGAN.individuOKU : 0;
  const SU = kategori === 2 && i.pasanganOKU ? POTONGAN.pasanganOKU : 0;
  const peratusAnak = kategori === 3 && Number(i.peratusAnak) === 50 ? 50 : 100;
  const QC = kiraPelepasanAnak(i.anak, peratusAnak);
  const tp1 = kiraPelepasanTP1(i.tp1);
  const LP = num(i.tp1Terkumpul) + tp1.jumlah;
  const potongan = D + S + DU + SU + QC + LP;

  // ---- Langkah 1: saraan biasa sahaja ----
  const kwsp1 = hadkanKWSP({ K, K1, K2n: K2 * n });
  const saraanBersih1 = (Y - kwsp1.K) + (Y1 - kwsp1.K1) + (Y2 * n - kwsp1.K2n);
  const P1 = Math.max(0, saraanBersih1 - potongan);
  const cukaiTahunan1 = cukaiJadualPCB(P1, kategori);
  const pcbKasar1 = Math.max(0, (cukaiTahunan1 - (Z + X)) / (n + 1));
  const pcbBiasa = bundar5Sen(pcbKasar1);

  // ---- Langkah 2: termasuk saraan tambahan (bonus) ----
  let pcbBonus = 0;
  let P2 = P1;
  let cukaiTahunan2 = cukaiTahunan1;
  if (Yt > 0) {
    const kwsp2 = hadkanKWSP({ K, K1, Kt, K2n: K2 * n });
    const saraanBersih2 = (Y - kwsp2.K) + (Y1 - kwsp2.K1) + (Y2 * n - kwsp2.K2n) + (Yt - kwsp2.Kt);
    P2 = Math.max(0, saraanBersih2 - potongan);
    cukaiTahunan2 = cukaiJadualPCB(P2, kategori);
    const cukaiBonus = cukaiTahunan2 - (Z + X) - pcbBiasa * (n + 1);
    pcbBonus = bundar5Sen(Math.max(0, cukaiBonus));
  }

  const pcbSebelumZakat = r2(pcbBiasa + pcbBonus);
  const perluPotong = pcbSebelumZakat >= PERATURAN_PCB.minimumPotongan;
  const pcbBersih = perluPotong ? r2(Math.max(0, pcbSebelumZakat - zakatBulanIni)) : 0;

  // Anggaran tahunan untuk paparan.
  const bertingkat = cukaiBertingkat(P2, kategori);
  const anggaranJumlahPCB = r2(X + pcbSebelumZakat + pcbBiasa * n);
  const anggaranZakat = r2(Z + zakatBulanIni);
  const bakiCukai = r2(cukaiTahunan2 - anggaranJumlahPCB - anggaranZakat);

  return {
    kategori, bulan, n,
    saraan: { Y, Y1, Y2, Yt, jumlahTahunan: r2(Y + Y1 + Y2 * n + Yt) },
    kwsp: { K, K1, K2, Kt, diambilKira: r2(Yt > 0 ? hadkanKWSP({ K, K1, Kt, K2n: K2 * n }).jumlah : kwsp1.jumlah), had: POTONGAN.hadKWSP },
    potongan: { D, S, DU, SU, QC, LP, tp1Terkumpul: num(i.tp1Terkumpul), tp1BulanIni: tp1.jumlah, tp1Butiran: tp1.butiran, jumlah: potongan, peratusAnak },
    pendapatanBercukai: r2(P2),
    pendapatanBercukaiTanpaBonus: r2(P1),
    cukaiTahunan: r2(cukaiTahunan2),
    cukaiTahunanTanpaBonus: r2(cukaiTahunan1),
    bertingkat,
    pcbBiasa, pcbBonus, pcbSebelumZakat, zakatBulanIni, pcbBersih, perluPotong,
    anggaranJumlahPCB, anggaranZakat, bakiCukai,
    kadarEfektif: P2 > 0 ? r2((cukaiTahunan2 / (Y + Y1 + Y2 * n + Yt)) * 100) : 0,
  };
}

/** Anggar nilai terkumpul jika gaji & KWSP sama setiap bulan sebelum bulan semasa. */
export function anggarTerkumpul({ bulan, gajiBulanIni, kwspBulanIni, zakatBulanIni = 0, kategori = 1, oku = false, pasanganOKU = false, anak = {}, peratusAnak = 100 }) {
  const m = Math.min(12, Math.max(1, Math.round(num(bulan) || 1)));
  let gajiTerkumpul = 0, kwspTerkumpul = 0, pcbTerkumpul = 0, zakatTerkumpul = 0;
  for (let b = 1; b < m; b++) {
    const r = kiraPCB({
      kategori, oku, pasanganOKU, anak, peratusAnak, bulan: b,
      gajiBulanIni, kwspBulanIni, zakatBulanIni,
      gajiTerkumpul, kwspTerkumpul, pcbTerkumpul, zakatTerkumpul,
    });
    gajiTerkumpul += num(gajiBulanIni);
    kwspTerkumpul += num(kwspBulanIni);
    pcbTerkumpul = r2(pcbTerkumpul + r.pcbBersih);
    zakatTerkumpul += num(zakatBulanIni);
  }
  return { gajiTerkumpul: r2(gajiTerkumpul), kwspTerkumpul: r2(kwspTerkumpul), pcbTerkumpul, zakatTerkumpul: r2(zakatTerkumpul) };
}
