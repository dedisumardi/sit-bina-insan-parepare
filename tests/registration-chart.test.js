const { test } = require('node:test');
const assert = require('node:assert/strict');
const chart = require('../js/registration-chart');

test('aggregates actual registration years across levels and fills missing years', () => {
  const result = chart.aggregate([
    { jenjang: 'tkit', tanggalDaftar: '28/9/2024, 12.42.15 WITA' },
    { jenjang: 'SDIT', tanggalDaftar: '28 September 2026, 12.00 WITA' },
    { jenjang: 'sd', createdAt: '2026-09-28T00:00:00Z' },
    { jenjang: 'smpit', createdAt: '2025-12-31T18:00:00Z' },
    { jenjang: 'tkit', tanggalDaftar: 'invalid' }
  ]);
  assert.deepEqual(result, { rows: [
    { year: 2024, tkit: 1, sdit: 0, smpit: 0 },
    { year: 2025, tkit: 0, sdit: 0, smpit: 0 },
    { year: 2026, tkit: 0, sdit: 2, smpit: 1 }
  ], skipped: 1 });
  assert.equal(chart.dateYear('31/2/2026'), null);
  assert.equal(chart.dateYear(''), null);
});

test('renders requested colors, counts, empty state and replaces old chart', () => {
  const container = { innerHTML: '' };
  chart.render(container, [{ jenjang: 'tkit', tanggalDaftar: '1/1/2026' }]);
  for (const color of ['#9333ea', '#16a34a', '#2563eb']) assert.ok(container.innerHTML.includes(color));
  assert.match(container.innerHTML, /TK, 2026: 1 pendaftar/);
  assert.match(container.innerHTML, /<table/);
  assert.doesNotMatch(container.innerHTML, /NaN|Infinity/);
  chart.render(container, []);
  assert.match(container.innerHTML, /Belum ada data/);
  assert.doesNotMatch(container.innerHTML, /<svg/);
});
