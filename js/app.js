// Antara muka kalkulator — menyambung borang HTML dengan enjin pcb.js.
import { kiraPCB, anggarTerkumpul } from './pcb.js';
import { PELEPASAN_ANAK, PELEPASAN_TP1, TAHUN_TAKSIRAN } from './tax-rules-2026.js';

const $ = (id) => document.getElementById(id);
const KUNCI_SIMPAN = `kalkulator-cukai-${TAHUN_TAKSIRAN}`;
const BULAN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

const fmt = new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 });
const rm = (v) => fmt.format(v || 0).replace('MYR', 'RM').replace(/^RM(?=\d)/, 'RM ');
const rm0 = (v) => 'RM ' + new Intl.NumberFormat('ms-MY', { maximumFractionDigits: 0 }).format(v || 0);
const parse = (el) => {
  const v = parseFloat(String(el.value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(v) ? v : 0;
};
const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
const setRadio = (name, value) => { const el = document.querySelector(`input[name="${name}"][value="${value}"]`); if (el) el.checked = true; };

// ---------- Bina elemen dinamik ----------
function binaBulan() {
  const sel = $('bulan');
  BULAN.forEach((b, i) => sel.add(new Option(`${b} ${TAHUN_TAKSIRAN}`, i + 1)));
  sel.value = new Date().getMonth() + 1;
}

function binaAnak() {
  const wrap = $('anakList');
  for (const [id, k] of Object.entries(PELEPASAN_ANAK)) {
    const row = document.createElement('div');
    row.className = 'counter';
    row.innerHTML = `
      <div class="counter__text">${k.label}<small>${rm0(k.amaun)} seorang</small></div>
      <div class="counter__ctl">
        <button type="button" data-anak="${id}" data-delta="-1" aria-label="Kurang">−</button>
        <output id="anak-${id}">0</output>
        <button type="button" data-anak="${id}" data-delta="1" aria-label="Tambah">+</button>
      </div>`;
    wrap.appendChild(row);
  }
  wrap.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-anak]');
    if (!b) return;
    const out = $(`anak-${b.dataset.anak}`);
    out.value = Math.max(0, Math.min(20, Number(out.value) + Number(b.dataset.delta)));
    kemaskini();
  });
}

function binaTP1() {
  const wrap = $('tp1List');
  for (const item of PELEPASAN_TP1) {
    const row = document.createElement('label');
    row.className = 'tp1';
    row.innerHTML = `
      <div class="tp1__text">${item.label}<small>Had ${rm0(item.had)}</small></div>
      <input type="text" inputmode="decimal" placeholder="0" id="tp1-${item.id}" data-tp1="${item.id}" data-had="${item.had}">`;
    wrap.appendChild(row);
  }
}

// ---------- Baca borang ----------
function bacaBorang() {
  const kategori = Number(radio('kategori'));
  const gaji = parse($('gaji'));
  const kwspMod = radio('kwspMod');
  const kadarKwsp = kwspMod === 'manual' ? null : Number(kwspMod) / 100;
  const kwsp = kadarKwsp == null ? parse($('kwsp')) : Math.round(gaji * kadarKwsp * 100) / 100;
  const bonus = parse($('bonus'));
  const kwspBonusRaw = $('kwspBonus').value.trim();
  const kwspBonus = kwspBonusRaw === '' ? (kadarKwsp == null ? 0 : Math.round(bonus * kadarKwsp * 100) / 100) : parse($('kwspBonus'));

  const anak = {};
  for (const id of Object.keys(PELEPASAN_ANAK)) anak[id] = Number($(`anak-${id}`).value);
  const tp1 = {};
  for (const item of PELEPASAN_TP1) tp1[item.id] = parse($(`tp1-${item.id}`));

  const asas = {
    kategori,
    oku: $('oku').checked,
    pasanganOKU: $('pasanganOKU').checked,
    bulan: Number($('bulan').value),
    gajiBulanIni: gaji,
    kwspBulanIni: kwsp,
    zakatBulanIni: parse($('zakat')),
    anak,
    peratusAnak: Number(radio('peratusAnak')),
  };

  let terkumpul;
  if ($('autoTerkumpul').checked) {
    terkumpul = anggarTerkumpul(asas);
  } else {
    terkumpul = {
      gajiTerkumpul: parse($('gajiTerkumpul')),
      kwspTerkumpul: parse($('kwspTerkumpul')),
      pcbTerkumpul: parse($('pcbTerkumpul')),
      zakatTerkumpul: parse($('zakatTerkumpul')),
    };
  }

  return { ...asas, ...terkumpul, tp1Terkumpul: $('autoTerkumpul').checked ? 0 : parse($('tp1Terkumpul')), bonus, kwspBonus, tp1, kwspMod, kwspManual: parse($('kwsp')) };
}

// ---------- Papar keputusan ----------
function kemaskini() {
  const input = bacaBorang();
  const r = kiraPCB(input);

  // Keadaan UI bersyarat
  $('rowPasanganOKU').hidden = input.kategori !== 2;
  $('rowPeratusAnak').hidden = input.kategori !== 3;
  $('kwsp').hidden = input.kwspMod !== 'manual';
  $('kwspHint').textContent = input.kwspMod === 'manual' ? 'Masukkan jumlah caruman pekerja bulan ini.' : `KWSP bulan ini: ${rm(input.kwspBulanIni)} (had pelepasan ${rm0(r.kwsp.had)} setahun)`;
  $('terkumpulFields').hidden = $('autoTerkumpul').checked;
  $('terkumpulBadge').textContent = $('autoTerkumpul').checked ? 'auto' : 'manual';
  if ($('autoTerkumpul').checked) {
    $('gajiTerkumpul').value = input.gajiTerkumpul || '';
    $('kwspTerkumpul').value = input.kwspTerkumpul || '';
    $('pcbTerkumpul').value = input.pcbTerkumpul || '';
    $('zakatTerkumpul').value = input.zakatTerkumpul || '';
  }

  const jumlahAnak = Object.values(input.anak).reduce((a, b) => a + b, 0);
  $('anakBadge').textContent = jumlahAnak ? `${jumlahAnak} · ${rm0(r.potongan.QC)}` : '0';
  $('tp1Badge').textContent = rm0(r.potongan.tp1BulanIni);
  for (const item of PELEPASAN_TP1) {
    $(`tp1-${item.id}`).closest('.tp1').classList.toggle('tp1--over', input.tp1[item.id] > item.had);
  }

  // Hero
  $('outPCB').textContent = rm(r.pcbBersih);
  $('stickyPCB').textContent = rm(r.pcbBersih);
  let nota = '';
  if (!input.gajiBulanIni) nota = 'Masukkan gaji untuk mula mengira.';
  else if (!r.perluPotong && r.pcbSebelumZakat > 0) nota = `PCB ${rm(r.pcbSebelumZakat)} kurang daripada RM 10, tidak perlu dipotong.`;
  else if (!r.perluPotong) nota = 'Pendapatan anda tidak dikenakan PCB.';
  else if (r.pcbBonus > 0) nota = `Gaji ${rm(r.pcbBiasa)} + bonus ${rm(r.pcbBonus)}${input.zakatBulanIni ? ` − zakat ${rm(input.zakatBulanIni)}` : ''}`;
  else if (input.zakatBulanIni) nota = `${rm(r.pcbSebelumZakat)} − zakat ${rm(input.zakatBulanIni)}`;
  $('outPCBNote').textContent = nota;

  const gajiBersih = input.gajiBulanIni + input.bonus - input.kwspBulanIni - input.kwspBonus - r.pcbBersih - input.zakatBulanIni;
  $('outBersih').textContent = input.gajiBulanIni ? rm(Math.max(0, gajiBersih)) : '—';
  $('stickyBersih').textContent = input.gajiBulanIni ? rm(Math.max(0, gajiBersih)) : '—';
  $('outP').textContent = rm0(r.pendapatanBercukai);
  $('outCukai').textContent = rm(r.cukaiTahunan);
  $('outKadar').textContent = `${r.kadarEfektif.toFixed(1)} %`;

  // Nota baki cukai
  const baki = $('outBaki');
  baki.className = 'notice';
  if (!input.gajiBulanIni) baki.textContent = '';
  else if (Math.abs(r.bakiCukai) < 1) baki.textContent = `Jika gaji kekal sama hingga Disember, jumlah PCB (${rm(r.anggaranJumlahPCB)}) menampung cukai tahunan anda. Tiada baki perlu dibayar.`;
  else if (r.bakiCukai > 0) { baki.classList.add('notice--warn'); baki.textContent = `Anggaran PCB setahun ${rm(r.anggaranJumlahPCB)} kurang daripada cukai ${rm(r.cukaiTahunan)}. Mungkin perlu bayar baki ${rm(r.bakiCukai)} semasa e-Filing.`; }
  else { baki.classList.add('notice--ok'); baki.textContent = `Anggaran PCB + zakat setahun melebihi cukai sebenar. Mungkin dapat bayaran balik ${rm(-r.bakiCukai)} semasa e-Filing.`; }

  // Jadual pecahan
  const baris = [];
  const tr = (a, b, cls = '') => `<tr class="${cls}"><td>${a}</td><td>${b}</td></tr>`;
  baris.push(tr('Pendapatan', '', 'head'));
  if (r.saraan.Y) baris.push(tr('Gaji terkumpul bulan sebelum', rm(r.saraan.Y)));
  baris.push(tr('Gaji bulan ini', rm(r.saraan.Y1)));
  if (r.n > 0) baris.push(tr(`Anggaran ${r.n} bulan berikutnya`, rm(r.saraan.Y2 * r.n)));
  if (r.saraan.Yt) baris.push(tr('Bonus / tambahan', rm(r.saraan.Yt)));
  baris.push(tr('Jumlah pendapatan setahun', rm(r.saraan.jumlahTahunan), 'total'));
  baris.push(tr('Potongan & pelepasan', '', 'head'));
  baris.push(tr('KWSP (had RM 4,000)', '− ' + rm(r.kwsp.diambilKira), 'neg'));
  baris.push(tr('Individu', '− ' + rm(r.potongan.D), 'neg'));
  if (r.potongan.S) baris.push(tr('Pasangan', '− ' + rm(r.potongan.S), 'neg'));
  if (r.potongan.DU) baris.push(tr('Individu OKU', '− ' + rm(r.potongan.DU), 'neg'));
  if (r.potongan.SU) baris.push(tr('Pasangan OKU', '− ' + rm(r.potongan.SU), 'neg'));
  if (r.potongan.QC) baris.push(tr(`Anak${r.potongan.peratusAnak === 50 ? ' (50%)' : ''}`, '− ' + rm(r.potongan.QC), 'neg'));
  for (const b of r.potongan.tp1Butiran) baris.push(tr(b.label.split(':')[0].split(' (')[0], '− ' + rm(b.diluluskan), 'neg'));
  if (r.potongan.tp1Terkumpul) baris.push(tr('TP1 terkumpul bulan sebelum', '− ' + rm(r.potongan.tp1Terkumpul), 'neg'));
  baris.push(tr('Pendapatan bercukai (P)', rm(r.pendapatanBercukai), 'total'));
  baris.push(tr('Cukai', '', 'head'));
  baris.push(tr('Cukai setahun', rm(r.cukaiTahunan)));
  if (r.anggaranZakat) baris.push(tr('Zakat (terkumpul + bulan ini)', '− ' + rm(r.anggaranZakat), 'neg'));
  if (input.pcbTerkumpul) baris.push(tr('PCB telah dibayar (X)', '− ' + rm(input.pcbTerkumpul), 'neg'));
  baris.push(tr(`Dibahagi ${r.n + 1} bulan berbaki`, rm(r.pcbBiasa)));
  if (r.pcbBonus) baris.push(tr('PCB ke atas bonus', rm(r.pcbBonus)));
  if (input.zakatBulanIni) baris.push(tr('Zakat bulan ini', '− ' + rm(input.zakatBulanIni), 'neg'));
  baris.push(tr('PCB bulan ini', rm(r.pcbBersih), 'total'));
  $('tblPecahan').innerHTML = baris.join('');

  // Jadual tangga
  const tangga = r.bertingkat.pecahan.map((p) => tr(`${rm0(p.dari)} – ${rm0(p.hingga)} @ ${(p.kadar * 100).toFixed(0)}%`, rm(p.amaun)));
  if (r.bertingkat.rebat) tangga.push(tr('Rebat cukai', '− ' + rm(r.bertingkat.rebat), 'neg'));
  tangga.push(tr('Cukai setahun', rm(r.bertingkat.bersih), 'total'));
  $('tblTangga').innerHTML = tangga.join('');

  simpan(input);
}

// ---------- Simpan / muat ----------
function simpan(input) {
  try {
    const data = {
      kategori: input.kategori, oku: input.oku, pasanganOKU: input.pasanganOKU, bulan: input.bulan,
      gaji: $('gaji').value, kwspMod: input.kwspMod, kwsp: $('kwsp').value, zakat: $('zakat').value,
      bonus: $('bonus').value, kwspBonus: $('kwspBonus').value, autoTerkumpul: $('autoTerkumpul').checked,
      gajiTerkumpul: $('gajiTerkumpul').value, kwspTerkumpul: $('kwspTerkumpul').value, pcbTerkumpul: $('pcbTerkumpul').value,
      zakatTerkumpul: $('zakatTerkumpul').value, tp1Terkumpul: $('tp1Terkumpul').value,
      anak: input.anak, peratusAnak: input.peratusAnak,
      tp1: Object.fromEntries(PELEPASAN_TP1.map((i) => [i.id, $(`tp1-${i.id}`).value])),
    };
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(data));
  } catch { /* storan tidak tersedia */ }
}

function muat() {
  let d;
  try { d = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || 'null'); } catch { d = null; }
  if (!d) return;
  setRadio('kategori', d.kategori); $('oku').checked = !!d.oku; $('pasanganOKU').checked = !!d.pasanganOKU;
  if (d.bulan) $('bulan').value = d.bulan;
  $('gaji').value = d.gaji || ''; setRadio('kwspMod', d.kwspMod || '11'); $('kwsp').value = d.kwsp || ''; $('zakat').value = d.zakat || '';
  $('bonus').value = d.bonus || ''; $('kwspBonus').value = d.kwspBonus || '';
  $('autoTerkumpul').checked = d.autoTerkumpul !== false;
  for (const k of ['gajiTerkumpul', 'kwspTerkumpul', 'pcbTerkumpul', 'zakatTerkumpul', 'tp1Terkumpul']) $(k).value = d[k] || '';
  for (const [id, n] of Object.entries(d.anak || {})) { const o = $(`anak-${id}`); if (o) o.value = n; }
  setRadio('peratusAnak', d.peratusAnak || 100);
  for (const [id, v] of Object.entries(d.tp1 || {})) { const el = $(`tp1-${id}`); if (el) el.value = v; }
}

function setSemula() {
  if (!confirm('Padam semua input?')) return;
  try { localStorage.removeItem(KUNCI_SIMPAN); } catch { /* abaikan */ }
  location.reload();
}

// ---------- Mula ----------
binaBulan();
binaAnak();
binaTP1();
muat();
document.body.addEventListener('input', kemaskini);
document.body.addEventListener('change', kemaskini);
$('btnReset').addEventListener('click', setSemula);
kemaskini();
