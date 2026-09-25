const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('admin.html contains wave filter, select-all checkbox, and number column header', () => {
  const html = fs.readFileSync('admin.html', 'utf8');
  assert.ok(html.includes('id="spmb-filter-gelombang"'), 'spmb-filter-gelombang exists');
  assert.ok(html.includes('id="spmb-select-all"'), 'spmb-select-all exists');
  assert.ok(html.includes('>No.</th>'), 'No. header exists');
  assert.ok(html.includes('id="spmb-bulk-actions"'), 'Bulk action bar exists');
  assert.ok(html.includes('>Jenjang</th>'), 'Jenjang header exists separately');
  assert.ok(html.includes('>Jalur</th>'), 'Jalur header exists separately');
  assert.ok(html.includes('>Berkas KK &amp; Akta</th>'), 'Berkas KK & Akta header exists');
});

test('admin.js contains wave detection, wave filtering, and select-all handling', () => {
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');
  assert.ok(adminJs.includes('getStudentWave('), 'getStudentWave helper exists');
  assert.ok(adminJs.includes('spmbFilterGelombang'), 'spmbFilterGelombang state exists');
  assert.ok(adminJs.includes('spmbSelectedRows'), 'spmbSelectedRows set exists');
  assert.ok(adminJs.includes('spmb-row-checkbox'), 'row checkbox class rendered');
  assert.ok(adminJs.includes('spmb-select-all'), 'select all checkbox handled');
  assert.ok(adminJs.includes('let waliFilterStatus'), 'waliFilterStatus declared');
  assert.ok(adminJs.includes('let waliSearchQuery'), 'waliSearchQuery declared');
  assert.ok(adminJs.includes('colspan="11"'), 'empty state spans 11 columns');
  assert.ok(adminJs.includes('flex flex-col items-start gap-1'), 'status column stacks vertically');
  assert.ok(adminJs.includes('renderStudentReregDocsColumn'), 'renderStudentReregDocsColumn helper exists');
  assert.ok(adminJs.includes('window.viewApplicantDoc'), 'window.viewApplicantDoc handler exists');
});


