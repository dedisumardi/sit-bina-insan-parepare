const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('results only announce explicit final admin decisions', () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const start = source.indexOf('  function getTestAnnouncement(');
  const end = source.indexOf('  // Render Parent Portal', start);
  const writes = [];
  let refreshes = 0;
  const context = {
    window: {}, PARENT_BIODATA_VIEW_KEY: 'view',
    document: { getElementById: () => ({ textContent: 'SPMB-TEST', scrollIntoView() {} }) },
    sessionStorage: { setItem: (...args) => writes.push(args) },
    renderParentPortal() {}, refreshParentFromDatabase() { refreshes++; },
    requestAnimationFrame: fn => fn()
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  for (const status of ['', 'Pembayaran Disetujui (Menunggu Biodata Lengkap)', 'Jadwal Tes & Wawancara Ditetapkan', 'Pembayaran Terverifikasi & Diterima']) {
    assert.equal(context.getTestAnnouncement(status).title, 'Menunggu Pengumuman');
  }
  assert.equal(context.getTestAnnouncement('Cadangan').title, 'Status Cadangan');
  assert.equal(context.getTestAnnouncement('Lulus Seleksi Observasi & Diterima').title, 'Lulus Tes & Wawancara — Diterima');
  context.window.openResultsStage();
  assert.deepEqual(writes, [['view', 'SPMB-TEST:results']]);
  assert.equal(refreshes, 1);
  const html = fs.readFileSync('index.html', 'utf8');
  const nav = html.slice(html.indexOf('id="portal-state-schedule"'), html.indexOf('<!-- Dynamic Status Tag -->'));
  assert.equal((nav.match(/<button /g) || []).length, 2);
  assert.ok(nav.includes('window.openParentBiodata()'));
  assert.ok(nav.includes('window.openResultsStage()'));
  assert.ok(html.includes('id="portal-state-results"'));
});
