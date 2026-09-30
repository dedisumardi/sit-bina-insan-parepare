const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/spmb.js', 'utf8');
const backend = fs.readFileSync('api/backend.js', 'utf8');

test('duplicate number prompts before switching to login, preserves number, and stops submission', async () => {
  const start = source.indexOf('      if (response.status === 409');
  const end = source.indexOf('      if (!response.ok', start);
  const events = [];
  const input = { value: '', focus() { events.push('focus'); } };
  const context = vm.createContext({
    response: { status: 409 },
    result: { message: 'Nomor WhatsApp sudah terdaftar. Silakan masuk ke portal.' },
    rawWa: '081234567890',
    SiteDialog: { async alert(message) { events.push(message); } },
    window: { setSpmbModalMode(mode) { events.push(mode); } },
    document: { getElementById() { return input; } }
  });
  const result = await vm.runInContext(`(async () => { ${source.slice(start, end)} return 'continued'; })()`, context);
  assert.equal(result, undefined);
  assert.deepEqual(events, ['Nomor WhatsApp sudah terdaftar. Silakan masuk ke portal.', 'login', 'focus']);
  assert.equal(input.value, '081234567890');
});

test('server duplicate check rejects without writes, permits unused number, and preserves biodata path', async () => {
  const start = backend.indexOf('          if (!complete) {');
  const end = backend.indexOf('// Promote', start);
  for (const [complete, count, rejected] of [[false, 1, true], [false, 0, false], [true, 1, false]]) {
    const queries = [];
    const context = vm.createContext({
      complete, wa: '6281234567890',
      client: { async query(sql, values) { queries.push({ sql, values }); return { rowCount: count }; } },
      fail(status, message) { const error = new Error(message); error.status = status; throw error; }
    });
    const run = vm.runInContext(`(async () => { ${backend.slice(start, end)} })()`, context);
    if (rejected) await assert.rejects(run, { status: 409 });
    else await run;
    assert.equal(queries.length, complete ? 0 : 1);
    if (queries.length) {
      assert.match(queries[0].sql, /^SELECT id/);
      assert.equal(queries[0].values[0], '6281234567890');
    }
  }
  assert.ok(backend.indexOf('pg_advisory_xact_lock') < start);
});
