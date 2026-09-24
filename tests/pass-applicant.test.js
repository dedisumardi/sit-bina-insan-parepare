const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('admin graduation confirms, persists exact announcement status and handles failure', async () => {
  const source = fs.readFileSync('js/admin.js', 'utf8');
  const code = source.slice(source.indexOf('  const passingApplicants ='), source.indexOf('  window.deleteApplicant ='));
  const student = { regNumber: 'SPMB-TEST', namaSiswa: 'Siswa Uji', biodataUpdatedAt: 'saved', parentDataUpdatedAt: 'saved', status: 'Biodata Lengkap' };
  let confirm = false, fail = false, calls = 0;
  const messages = [];
  const context = {
    window: {}, spmbList: [student], confirm: () => confirm,
    apiRequest: async (url, options) => {
      calls++;
      assert.equal(url, 'api/spmb.php');
      assert.equal(options.method, 'PUT');
      const payload = JSON.parse(options.body);
      assert.deepEqual(payload, { reg_number: 'SPMB-TEST', status: 'Lulus Seleksi Observasi & Diterima' });
      if (fail) throw new Error('offline');
      return { data: { ...student, status: payload.status } };
    },
    showToast: (...args) => messages.push(args),
    cacheSetItem() {}, STORAGE_SPMB: 'students',
    renderSpmbTable() {}, renderDashboard() {}, broadcastRealtime() {}
  };
  vm.runInNewContext(code, context);
  const button = { disabled: false };
  await context.window.passApplicant('SPMB-TEST', button);
  assert.equal(calls, 0);
  confirm = true; fail = true;
  await context.window.passApplicant('SPMB-TEST', button);
  assert.equal(student.status, 'Biodata Lengkap');
  assert.equal(button.disabled, false);
  assert.equal(messages.at(-1)[1], true);
  fail = false;
  await context.window.passApplicant('SPMB-TEST', button);
  assert.equal(student.status, 'Lulus Seleksi Observasi & Diterima');
  assert.equal(button.disabled, true);
  await context.window.passApplicant('SPMB-TEST', button);
  assert.equal(calls, 2);
  student.status = 'Biodata Lengkap'; student.parentDataUpdatedAt = '';
  await context.window.passApplicant('SPMB-TEST', button);
  assert.equal(calls, 2);
});
