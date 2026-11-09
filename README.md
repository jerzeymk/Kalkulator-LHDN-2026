# Kalkulator Cukai 2026 (PCB & cukai individu Malaysia)

Kalkulator PCB (Potongan Cukai Bulanan) dan anggaran cukai pendapatan individu untuk
Tahun Taksiran 2026, direka khusus untuk skrin telefon. Alternatif yang lebih mesra pengguna
kepada [e-PCB Plus LHDN](https://calcpcbplus.hasil.gov.my/).

## Ciri-ciri

- Formula rasmi **Kaedah Pengiraan Berkomputer PCB** LHDN (P-M-R-B), termasuk bonus/saraan tambahan,
  zakat, had KWSP RM4,000, pembundaran 5 sen dan peraturan minimum RM10.
- Kadar cukai dan senarai pelepasan **TT 2026** (pelancongan domestik RM1,000, kecacatan pembelajaran
  RM10,000, insurans anak, dll.).
- Kategori bujang / berkahwin (pasangan bekerja atau tidak), OKU, anak mengikut kategori, pembahagian 50%.
- Anggaran automatik nilai terkumpul (YTD) atau masukkan sendiri dari slip gaji.
- Keputusan serta-merta: PCB bulan ini, gaji bersih, pendapatan bercukai, cukai setahun, kadar efektif,
  dan amaran sama ada perlu bayar baki atau dapat bayaran balik semasa e-Filing.
- Pecahan pengiraan penuh dan tangga cukai yang dikenakan.
- Mod gelap automatik, input disimpan dalam telefon (localStorage), boleh "Add to Home Screen" (PWA manifest).

## Struktur

```
index.html             Antara muka (satu halaman, mobile-first)
css/style.css          Gaya
js/tax-rules-2026.js   Semua kadar, had dan pelepasan — ubah di sini bila tahun berubah
js/pcb.js              Enjin pengiraan tulen (tiada DOM) — boleh diguna semula oleh apl lain
js/app.js              Sambungan borang ↔ enjin
tests/pcb.test.js      Ujian unit (node --test)
```

Enjin `js/pcb.js` sengaja diasingkan daripada UI supaya projek seterusnya (sync dengan perbelanjaan harian)
boleh import `kiraPCB()` terus tanpa mengubah logik cukai.

## Jalankan

Tiada build step. Buka `index.html` melalui mana-mana pelayan statik:

```bash
npm start          # http://localhost:3000
npm test           # ujian unit enjin
```

Boleh terus dihoskan di GitHub Pages (Settings → Pages → branch utama, folder `/`).

## Nota

Pengiraan ini anggaran. Untuk pengiraan rasmi rujuk e-PCB Plus LHDN atau Jadual PCB.
Kadar Belanjawan 2027 (pelepasan individu RM12,000, kadar 18%/24%) **tidak** terpakai untuk TT 2026.
