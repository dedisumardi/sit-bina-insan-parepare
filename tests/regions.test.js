import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('region selectors start empty, restore saved hierarchy, reset children and handle failures', async () => {
  class Element {
    dataset = {}; listeners = {}; options = []; value = ''; disabled = false;
    replaceChildren(...options) { this.options = options; this.value = options[0]?.value || ''; }
    get selectedOptions() { return this.options.filter(option => option.value === this.value); }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const lists = {
    'provinces.json': [{ id: '73', name: 'Sulawesi Selatan' }, { id: '11', name: 'Aceh' }],
    'regencies/73.json': [{ id: '73.72', name: 'Kota Parepare' }],
    'districts/73.72.json': [{ id: '73.72.04', name: 'Bacukiki Barat' }],
    'villages/73.72.04.json': [{ id: '73.72.04.1001', name: 'Bumi Harapan' }],
    'regencies/11.json': [{ id: '11.01', name: 'Kabupaten Simeulue' }]
  };
  let fail = false;
  const window = {};
  vm.runInNewContext(readFileSync(new URL('../js/regions.js', import.meta.url), 'utf8'), {
    window, document: { getElementById: get }, AbortSignal,
    Option: class { constructor(text, value) { this.text = text; this.value = value; this.dataset = {}; } },
    fetch: async url => {
      if (fail) throw new Error('offline');
      return { ok: true, json: async () => ({ data: lists[url.split('/v2/')[1]] }) };
    }
  });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  window.StudentRegions.populate({}, 'new');
  await settle();
  assert.equal(get('bio-provinsi').value, '');
  assert.equal(get('bio-kabupaten').disabled, true);
  assert.equal(window.StudentRegions.isComplete(), false);
  window.StudentRegions.populate({ provinsi: 'Sulawesi Selatan', kabupatenKota: 'Kota Parepare', kecamatan: 'Bacukiki Barat', desaKelurahan: 'Bumi Harapan' }, 'saved');
  await settle();
  assert.equal(window.StudentRegions.isComplete(), true);
  fail = true;
  get('bio-provinsi').value = 'Aceh';
  get('bio-provinsi').listeners.change();
  await settle();
  assert.equal(get('bio-desa').value, '');
  assert.equal(get('bio-kecamatan').disabled, true);
  assert.equal(window.StudentRegions.isComplete(), false);
  assert.equal(get('bio-region-feedback').hidden, false);
  fail = false;
  get('bio-provinsi').listeners.change();
  await settle();
  assert.equal(get('bio-kabupaten').disabled, false);
  assert.equal(get('bio-kabupaten').options[1].value, 'Kabupaten Simeulue');
  assert.equal(get('bio-kabupaten').value, '');
});
