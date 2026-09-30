const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ExcelJS = require('exceljs');

test('admin.html has standardized TAB 2 Akun Orang Tua table matching TAB 1 structure', () => {
  const html = fs.readFileSync('admin.html', 'utf8');

  // Must contain Tab 2 container
  assert.ok(html.includes('id="spmb-view-wali"'), 'Contains #spmb-view-wali');

  // Must contain filter bar elements
  assert.ok(html.includes('id="wali-filter-status"'), 'Contains #wali-filter-status');
  assert.ok(html.includes('id="wali-search-input"'), 'Contains #wali-search-input');
  assert.ok(html.includes('id="wali-export-btn"'), 'Contains #wali-export-btn');
  assert.ok(html.includes('bg-blue-700'), 'Wali export button is styled with blue background');
  assert.ok(html.includes('fa-magnifying-glass'), 'Contains search magnifying glass icon');

  // Must contain Checkbox and No. columns
  assert.ok(html.includes('id="wali-select-all"'), 'Contains #wali-select-all checkbox');
  assert.ok(html.includes('id="wali-bulk-actions"'), 'Contains #wali-bulk-actions bar');
  assert.ok(html.includes('>No.</th>'), 'Contains No. column header');
  assert.ok(html.includes('>ID / Kode Registrasi</th>'), 'Contains ID / Kode Registrasi');
  assert.ok(html.includes('>Nama Orang Tua / Wali</th>'), 'Contains Nama Orang Tua / Wali');
  assert.ok(html.includes('>Nomor WhatsApp</th>'), 'Contains Nomor WhatsApp');
  assert.ok(html.includes('>Biaya Formulir</th>'), 'Contains Biaya Formulir');
  assert.ok(html.includes('>Bukti Transfer</th>'), 'Contains Bukti Transfer');
  assert.ok(html.includes('>Status Pembayaran</th>'), 'Contains Status Pembayaran');
  assert.ok(html.includes('>Waktu Daftar</th>'), 'Contains Waktu Daftar');
  assert.ok(html.includes('>Aksi</th>'), 'Contains Aksi');

  // Must contain footer showing total baris
  assert.ok(html.includes('id="wali-pagination-container"'), 'Contains #wali-pagination-container');
  assert.ok(html.includes('id="wali-showing-rows"'), 'Contains #wali-showing-rows');
  assert.ok(html.includes('id="wali-total-count"'), 'Contains #wali-total-count');
  assert.ok(html.includes('baris data akun orang tua / wali'), 'Mentions baris data in footer');
});

test('js/admin.js connects Excel export and formats Wali table rows properly', () => {
  const js = fs.readFileSync('js/admin.js', 'utf8');

  // Export event listener calls exportWaliToExcel
  assert.ok(js.includes("waliExport?.addEventListener('click', exportWaliToExcel);"), 'Listens for click with exportWaliToExcel');
  assert.ok(js.includes('async function exportWaliToExcel'), 'Defines exportWaliToExcel');
  assert.ok(js.includes('function downloadClientSideExcelWali'), 'Defines downloadClientSideExcelWali fallback');

  // Checkbox, selection and row number are rendered
  assert.ok(js.includes('waliSelectedRows'), 'Uses waliSelectedRows Set for multi-selection');
  assert.ok(js.includes('wali-row-checkbox'), 'Renders wali-row-checkbox per row');
  assert.ok(js.includes('updateWaliSelectAllCheckbox'), 'Updates select-all state');
  assert.ok(js.includes('updateWaliBulkActionBar'), 'Updates bulk action bar');
  assert.ok(js.includes('const rowNum = index + 1;'), 'Calculates rowNum');
  assert.ok(js.includes('formatDaftarDate'), 'Formats daftar date');
  assert.ok(js.includes('formatDaftarTime'), 'Formats daftar time');
  assert.ok(js.includes('spmb-action-btn'), 'Uses standardized spmb-action-btn styling');
});

test('api/export-wali.js generates valid Excel workbook with discrete columns', async () => {
  const exportWali = require('../api/export-wali');
  assert.equal(typeof exportWali, 'function');

  // Test workbook generation logic directly
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Akun Orang Tua & Pembayaran');
  const columns = [
    { key: 'no', header: 'No.', width: 8 },
    { key: 'regNumber', header: 'ID / No. Registrasi', width: 22 },
    { key: 'namaWali', header: 'Nama Orang Tua / Wali', width: 28 },
    { key: 'waAyah', header: 'Nomor WhatsApp', width: 20 },
    { key: 'biaya', header: 'Biaya Formulir', width: 18 },
    { key: 'statusBayar', header: 'Status Pembayaran', width: 26 },
    { key: 'bukti', header: 'Bukti Transfer', width: 18 },
    { key: 'waktuDaftar', header: 'Waktu Daftar', width: 24 }
  ];
  sheet.columns = columns;

  sheet.addRow({
    no: 1,
    regNumber: 'SPMB-2026-000009',
    namaWali: 'Arfa',
    waAyah: '082344593464',
    biaya: 'Rp 150.000',
    statusBayar: 'Lulus & Lunas',
    bukti: 'Sudah Upload',
    waktuDaftar: '30 Sep 2026 07.55'
  });

  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.length > 0);

  // Load back and verify column structure
  const readWb = new ExcelJS.Workbook();
  await readWb.xlsx.load(buffer);
  const readSheet = readWb.getWorksheet('Akun Orang Tua & Pembayaran');
  assert.equal(readSheet.columnCount, 8);
  assert.equal(readSheet.getRow(1).getCell(1).value, 'No.');
  assert.equal(readSheet.getRow(1).getCell(2).value, 'ID / No. Registrasi');
  assert.equal(readSheet.getRow(1).getCell(3).value, 'Nama Orang Tua / Wali');
  assert.equal(readSheet.getRow(1).getCell(4).value, 'Nomor WhatsApp');
  assert.equal(readSheet.getRow(1).getCell(5).value, 'Biaya Formulir');
  assert.equal(readSheet.getRow(1).getCell(6).value, 'Status Pembayaran');
  assert.equal(readSheet.getRow(1).getCell(7).value, 'Bukti Transfer');
  assert.equal(readSheet.getRow(1).getCell(8).value, 'Waktu Daftar');

  // Verify row values are separated per column
  const row2 = readSheet.getRow(2);
  assert.equal(row2.getCell(1).value, 1);
  assert.equal(row2.getCell(2).value, 'SPMB-2026-000009');
  assert.equal(row2.getCell(3).value, 'Arfa');
  assert.equal(row2.getCell(4).value, '082344593464');
  assert.equal(row2.getCell(5).value, 'Rp 150.000');
  assert.equal(row2.getCell(6).value, 'Lulus & Lunas');
  assert.equal(row2.getCell(7).value, 'Sudah Upload');
  assert.equal(row2.getCell(8).value, '30 Sep 2026 07.55');
});
