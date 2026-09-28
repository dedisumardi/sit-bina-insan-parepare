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

test('export includes student biodata and parent fields in separate columns, excluding uploaded documents', () => {
  const keys = exporter.columns.map(([key]) => key);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of parents.keys) assert.ok(keys.includes(key), key);
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const payload = source.slice(source.indexOf("action: 'save_biodata'"), source.indexOf('if (submit) submit.disabled = true;', source.indexOf("action: 'save_biodata'")));
  for (const match of payload.matchAll(/(\w+): value\(/g)) {
    if (match[1] === 'sertifikatPrestasi') continue; // Document metadata is not biodata.
    assert.ok(keys.includes(match[1]), match[1]);
  }
  const extraKeys = JSON.parse(payload.match(/for \(const field of (\[[^\]]+\])/)[1]);
  for (const key of extraKeys) assert.ok(keys.includes(key), key);
  assert.equal(keys.includes('email'), false);
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

test('download contains only student and parent/guardian data, not administrative fields', async () => {
  const ExcelJS = require('exceljs');
  const { studentWorkbook } = require('../lib/student-workbook');
  const excluded = ['regNumber', 'waAyah', 'ttl', 'tanggalDaftar', 'status', 'nominalPembayaran',
    'buktiPembayaran', 'jadwalObservasi', 'biodataUpdatedAt', 'parentDataUpdatedAt', 'sertifikatPrestasi'];
  const keys = exporter.columns.map(([key]) => key);
  for (const key of excluded) assert.ok(!keys.includes(key), key);
  for (const key of ['namaSiswa', 'alamatAsalSekolah', 'hafalan', 'prestasi', ...parents.keys]) {
    assert.ok(keys.includes(key), key);
  }
  const record = { namaSiswa: 'Siswa Contoh', nik: '0012345678901234', memilikiWali: 'Ya', namaWali: 'Wali Contoh', teleponAyah: '081234567890' };
  for (const key of excluded) record[key] = 'ADMIN_ONLY';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await studentWorkbook([record]));
  const sheet = workbook.getWorksheet('Data Siswa');
  assert.equal(sheet.columnCount, keys.length);
  assert.deepEqual(sheet.getRow(1).values.slice(1), exporter.columns.map(([, label]) => label));
  assert.ok(!sheet.getRow(2).values.includes('ADMIN_ONLY'));
  for (const key of ['nik', 'teleponAyah', 'namaWali']) {
    assert.equal(sheet.getRow(2).getCell(keys.indexOf(key) + 1).value, record[key]);
  }
});
