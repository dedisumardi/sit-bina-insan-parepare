const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const exporter = require('../js/student-export');
const parents = require('../js/parent-fields');

function parseCsv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if (char === '\r' && text[i + 1] === '\n' && !quoted) {
      row.push(value); rows.push(row); row = []; value = ''; i++;
    } else value += char;
  }
  row.push(value); rows.push(row); return rows;
}

test('export includes every student payload and parent field in separate columns', () => {
  const keys = exporter.columns.map(([key]) => key);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of parents.keys) assert.ok(keys.includes(key), key);
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const payload = source.slice(source.indexOf("action: 'save_biodata'"), source.indexOf('if (submit) submit.disabled = true;', source.indexOf("action: 'save_biodata'")));
  for (const match of payload.matchAll(/(\w+): value\(/g)) assert.ok(keys.includes(match[1]), match[1]);
  const extraKeys = JSON.parse(payload.match(/for \(const field of (\[[^\]]+\])/)[1]);
  for (const key of extraKeys) assert.ok(keys.includes(key), key);
});

test('CSV keeps columns aligned, quotes/newlines intact, zero values and identifiers safe', () => {
  const record = { namaSiswa: 'Nama, "Contoh"\nBaris Dua', nik: '0012345678901234', teleponAyah: '081234567890',
    jumlahSaudaraKandung: 0, hobi: '=1+1', citaCita: 'Dokter #1', memilikiWali: 'Tidak', namaWali: 'Old value' };
  const csv = exporter.csv([record]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  const [header, row] = parseCsv(csv);
  assert.equal(header.length, exporter.columns.length);
  assert.equal(row.length, header.length);
  const data = Object.fromEntries(exporter.columns.map(([key], index) => [key, row[index]]));
  assert.equal(data.namaSiswa, record.namaSiswa);
  assert.equal(data.nik, "'0012345678901234");
  assert.equal(data.teleponAyah, "'081234567890");
  assert.equal(data.jumlahSaudaraKandung, '0');
  assert.equal(data.hobi, "'=1+1");
  assert.equal(data.citaCita, 'Dokter #1');
  assert.equal(data.namaWali, '');
  assert.equal(data.agama, '');
});
