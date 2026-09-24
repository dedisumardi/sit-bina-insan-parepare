const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('portal schedule uses current database settings, not old applicant dates', async () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const code = source.slice(source.indexOf('  let scheduleSettings = null;'), source.indexOf('  function cacheSetItem'));
  let database = { sdit_jadwalTes: 'Jadwal baru', sdit_lokasiTes: 'Ruang baru', sdit_catatanJadwal: 'Catatan baru' };
  let failed = false;
  const rendered = [];
  const context = {
    PARENT_SESSION_KEY: 'session',
    document: { hidden: false },
    localStorage: { getItem: () => '{"wa":"test"}' },
    fetch: async (url, options) => {
      assert.equal(url, 'api/settings.php');
      assert.equal(options.cache, 'no-store');
      if (failed) throw new Error('offline');
      return { ok: true, json: async () => ({ success: true, data: database }) };
    },
    renderParentPortal: () => rendered.push(true)
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  const record = { jenjang: 'SDIT', jadwalTes: 'Jadwal lama', jadwalWawancara: 'Wawancara lama' };
  context.record = record;
  await context.refreshScheduleSettings();
  assert.equal(vm.runInContext('getSharedSchedule(record, scheduleSettings).time', context), 'Jadwal baru');
  database = { sdit_jadwalTes: 'Jadwal diperbarui' };
  await context.refreshScheduleSettings();
  assert.equal(vm.runInContext('getSharedSchedule(record, scheduleSettings).time', context), 'Jadwal diperbarui');
  database = { sdit_jadwalTes: '' };
  await context.refreshScheduleSettings();
  assert.equal(vm.runInContext('getSharedSchedule(record, scheduleSettings).time', context), '');
  assert.equal(context.getSharedSchedule({ jenjang: 'tkit' }, database).time, '');
  failed = true;
  await context.refreshScheduleSettings();
  assert.equal(vm.runInContext('scheduleLoadError', context), true);
  failed = false;
  await context.refreshScheduleSettings();
  assert.equal(vm.runInContext('scheduleLoadError', context), false);
  assert.equal(rendered.length, 5);
  const html = fs.readFileSync('index.html', 'utf8');
  assert.equal((html.match(/id="portal-sched-val-test-date"/g) || []).length, 1);
  assert.ok(!html.includes('id="portal-sched-val-interview-date"'));
});
