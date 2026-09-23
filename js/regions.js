/* Cascading Indonesian administrative regions; only region codes go to the public API. */
(function () {
  'use strict';
  const base = 'https://www.emsifa.com/api-wilayah-indonesia/v2';
  const levels = [
    ['bio-provinsi', 'provinsi', 'provinces', 'provinsi'],
    ['bio-kabupaten', 'kabupatenKota', 'regencies', 'kabupaten/kota'],
    ['bio-kecamatan', 'kecamatan', 'districts', 'kecamatan'],
    ['bio-desa', 'desaKelurahan', 'villages', 'desa/kelurahan']
  ];
  const selects = levels.map(([id]) => document.getElementById(id));
  if (selects.some(select => !select)) return;
  const feedback = document.getElementById('bio-region-feedback');
  const message = document.getElementById('bio-region-message');
  const cache = new Map();
  let generation = 0;
  let lastSignature;
  let retry;
  const normalize = value => String(value || '').toLowerCase().replace(/^(provinsi|prov\.|kec\.)\s*/, '').trim();

  function reset(index, loading = false) {
    const label = loading ? 'Memuat...' : index === 0 ? 'Pilih provinsi' : `Pilih ${levels[index - 1][3]} terlebih dahulu`;
    selects[index].replaceChildren(new Option(label, ''));
    selects[index].disabled = true;
  }

  async function load(index, token, saved = '') {
    reset(index, true);
    const parentId = index ? selects[index - 1].selectedOptions[0]?.dataset.id : '';
    if (index && !parentId) { reset(index); return false; }
    const path = index ? `${levels[index][2]}/${encodeURIComponent(parentId)}.json` : 'provinces.json';
    if (!cache.has(path)) {
      const response = await fetch(`${base}/${path}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Wilayah gagal dimuat.');
      const result = await response.json();
      if (!Array.isArray(result.data) || !result.data.length || result.data.some(item => !item.id || !item.name)) throw new Error('Data wilayah belum tersedia.');
      cache.set(path, result.data);
    }
    if (token !== generation) return false;
    const options = cache.get(path).map(item => {
      const option = new Option(item.name, item.name);
      option.dataset.id = String(item.id);
      return option;
    });
    selects[index].replaceChildren(new Option(`Pilih ${levels[index][3]}`, ''), ...options);
    selects[index].disabled = false;
    const match = options.find(option => normalize(option.value) === normalize(saved));
    if (match) selects[index].value = match.value;
    else if (saved) {
      message.textContent = 'Wilayah tersimpan belum cocok dengan daftar terbaru. Silakan pilih kembali wilayah Anda.';
      feedback.hidden = false;
    }
    return Boolean(match);
  }

  async function run(index, record = {}) {
    const token = ++generation;
    feedback.hidden = true;
    for (let i = index; i < selects.length; i++) reset(i);
    retry = () => run(index, record);
    try {
      for (let i = index; i < selects.length; i++) {
        const selected = await load(i, token, record[levels[i][1]]);
        if (token !== generation || !selected) break;
      }
    } catch (_) {
      if (token !== generation) return;
      message.textContent = 'Daftar wilayah gagal dimuat. Periksa koneksi lalu tekan Coba Lagi.';
      feedback.hidden = false;
    }
  }

  selects.forEach((select, index) => select.addEventListener('change', () => {
    document.getElementById('portal-student-bio-form').dataset.dirty = '1';
    if (index < selects.length - 1) run(index + 1);
  }));
  document.getElementById('bio-region-retry').addEventListener('click', () => retry?.());
  window.StudentRegions = {
    populate(record, key) {
      const signature = JSON.stringify([key, ...levels.map(level => record[level[1]] || '')]);
      if (signature === lastSignature) return;
      lastSignature = signature;
      run(0, record);
    },
    isComplete() { return selects.every(select => !select.disabled && Boolean(select.value)); }
  };
})();
