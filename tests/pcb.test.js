import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kiraPCB, bundar5Sen, cukaiJadualPCB, cukaiBertingkat, anggarTerkumpul } from '../js/pcb.js';

test('pembundaran 5 sen ke atas', () => {
  assert.equal(bundar5Sen(10.01), 10.05);
  assert.equal(bundar5Sen(10.05), 10.05);
  assert.equal(bundar5Sen(110), 110);
  assert.equal(bundar5Sen(0), 0);
});

test('jadual PCB selari dengan kadar bertingkat + rebat', () => {
  for (const P of [0, 5000, 12000, 20000, 34999, 35000, 35001, 47000, 70000, 99999, 250000, 500000, 1000000, 3000000]) {
    for (const kat of [1, 2, 3]) {
      assert.equal(cukaiJadualPCB(P, kat), cukaiBertingkat(P, kat).bersih, `P=${P} kat=${kat}`);
    }
  }
});

test('bujang RM5,000, KWSP 11%, Januari → PCB RM110.00', () => {
  const r = kiraPCB({ kategori: 1, bulan: 1, gajiBulanIni: 5000, kwspBulanIni: 550 });
  // P = 60,000 − 4,000 (had KWSP) − 9,000 = 47,000 → cukai 1,320 → /12 = 110
  assert.equal(r.pendapatanBercukai, 47000);
  assert.equal(r.cukaiTahunan, 1320);
  assert.equal(r.pcbBersih, 110);
});

test('bawah RM10 tidak dipotong', () => {
  const r = kiraPCB({ kategori: 1, bulan: 1, gajiBulanIni: 3100, kwspBulanIni: 341 });
  // P = 37,200 − 4,000 − 9,000 = 24,200 → (24,200−20,000)×3% − 250 = −124 → 0
  assert.equal(r.pcbBersih, 0);
  assert.equal(r.perluPotong, false);
});

test('kategori 2 dapat potongan pasangan RM4,000', () => {
  const a = kiraPCB({ kategori: 1, bulan: 1, gajiBulanIni: 6000, kwspBulanIni: 660 });
  const b = kiraPCB({ kategori: 2, bulan: 1, gajiBulanIni: 6000, kwspBulanIni: 660 });
  assert.equal(a.pendapatanBercukai - b.pendapatanBercukai, 4000);
});

test('bonus dikira berasingan dan ditambah pada PCB bulan ini', () => {
  const tanpa = kiraPCB({ kategori: 1, bulan: 6, gajiBulanIni: 5000, kwspBulanIni: 550, gajiTerkumpul: 25000, kwspTerkumpul: 2750, pcbTerkumpul: 550 });
  const dengan = kiraPCB({ kategori: 1, bulan: 6, gajiBulanIni: 5000, kwspBulanIni: 550, gajiTerkumpul: 25000, kwspTerkumpul: 2750, pcbTerkumpul: 550, bonus: 10000, kwspBonus: 1100 });
  assert.equal(dengan.pcbBiasa, tanpa.pcbBiasa);
  // P 47,000 → 57,000 (KWSP sudah capai had 4,000): cukai 1,320 → 2,270, beza 950
  assert.equal(dengan.pendapatanBercukai, 57000);
  assert.equal(dengan.pcbBonus, 950);
  assert.equal(dengan.pcbBersih, tanpa.pcbBersih + 950);
});

test('zakat bulan ini mengurangkan PCB bersih', () => {
  const r = kiraPCB({ kategori: 1, bulan: 1, gajiBulanIni: 5000, kwspBulanIni: 550, zakatBulanIni: 50 });
  assert.equal(r.pcbSebelumZakat, 110);
  assert.equal(r.pcbBersih, 60);
});

test('pelepasan TP1 dihadkan', () => {
  const r = kiraPCB({ kategori: 1, bulan: 1, gajiBulanIni: 5000, kwspBulanIni: 550, tp1: { gayaHidup: 9999, perkeso: 100 } });
  assert.equal(r.potongan.tp1BulanIni, 2600);
});

test('anak: kategori 3 boleh tuntut 50%', () => {
  const penuh = kiraPCB({ kategori: 3, bulan: 1, gajiBulanIni: 8000, kwspBulanIni: 880, anak: { bawah18: 2 } });
  const separuh = kiraPCB({ kategori: 3, bulan: 1, gajiBulanIni: 8000, kwspBulanIni: 880, anak: { bawah18: 2 }, peratusAnak: 50 });
  assert.equal(penuh.potongan.QC, 4000);
  assert.equal(separuh.potongan.QC, 2000);
});

test('anggaran terkumpul konsisten: PCB sama setiap bulan jika gaji tetap', () => {
  const asas = { kategori: 1, gajiBulanIni: 5000, kwspBulanIni: 550 };
  const t = anggarTerkumpul({ ...asas, bulan: 7 });
  assert.equal(t.gajiTerkumpul, 30000);
  assert.equal(t.pcbTerkumpul, 660);
  const r = kiraPCB({ ...asas, bulan: 7, ...t });
  assert.equal(r.pcbBersih, 110);
});
