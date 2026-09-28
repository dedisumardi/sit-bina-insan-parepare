const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../js/registration-policy');
test('registration requires explicit open status and an active wave', () => {
  for (const activeWave of ['wave1', 'wave2', 'wave3']) {
    assert.equal(policy.isOpen({ waveStatus: 'open', activeWave }), true);
    for (const waveStatus of ['upcoming', 'closed', '', undefined]) assert.equal(policy.isOpen({ waveStatus, activeWave }), false);
  }
  for (const settings of [undefined, {}, { waveStatus: 'open' }, { waveStatus: 'open', activeWave: 'closed' }]) assert.equal(policy.isOpen(settings), false);
});

test('API checks database status before writes, rejects closed/upcoming and allows open', async () => {
  let status = 'closed', writes = 0, rollbacks = 0;
  require('../lib/session').isAdmin = async () => false;
  require('../lib/database').database = () => ({ connect: async () => ({
    async query(sql) {
      if (sql.includes('sipintu_settings')) return { rows: [{ data: { waveStatus: status, activeWave: 'wave1' } }] };
      if (sql === 'ROLLBACK') rollbacks++;
      if (/INSERT|UPDATE/.test(sql)) { writes++; return { rowCount: 1, rows: [{ data: {}, reg_number: 'PENDING-TEST' }] }; }
      return { rows: [], rowCount: 0 };
    }, release() {}
  }) });
  const handler = require('../api/backend');
  for (status of ['closed', 'upcoming', 'open']) {
    let code = 200;
    await handler({ method: 'POST', url: '/api/backend', query: { resource: 'spmb' }, headers: {}, body: { namaAyah: 'Test', waAyah: '081234567890' } }, {
      setHeader() {}, status(value) { code = value; return this; }, json() {}
    });
    assert.equal(code, status === 'open' ? 201 : 403);
  }
  assert.equal(writes, 1);
  assert.equal(rollbacks, 2);
});
