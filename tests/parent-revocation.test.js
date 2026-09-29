const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/spmb.js', 'utf8');
const refreshSource = source.slice(source.indexOf('  function revokeParentSession()'), source.indexOf('  function populateStudentBioForm('));

function setup(fetch) {
  const stored = new Map([['session', JSON.stringify({ wa: '628123456789' })], ['records', '[{}]']]);
  const notices = [];
  const context = vm.createContext({
    PARENT_SESSION_KEY: 'session', STORAGE_KEY: 'records', PARENT_BIODATA_VIEW_KEY: 'view',
    document: { hidden: false }, fetch,
    localStorage: { getItem: key => stored.get(key) || null, removeItem: key => stored.delete(key) },
    sessionStorage: { removeItem() {} }, renderParentPortal() {},
    cacheSetItem: (key, value) => stored.set(key, value), SiteDialog: { alert: text => notices.push(text) }
  });
  vm.runInContext(refreshSource, context);
  return { stored, notices, run: () => vm.runInContext('refreshParentFromDatabase()', context) };
}
test('confirmed deletion clears session and cached account and displays logout notice', async () => {
  const state = setup(async () => ({ status: 404, ok: false, json: async () => ({ success: false }) }));
  await state.run();
  assert.equal(state.stored.has('session'), false);
  assert.equal(state.stored.has('records'), false);
  assert.equal(state.notices.length, 1);
});
test('network and server outages do not incorrectly revoke accounts', async () => {
  for (const fetch of [async () => { throw new Error('offline'); }, async () => ({ status: 500, ok: false, json: async () => ({ success: false }) })]) {
    const state = setup(fetch);
    await state.run();
    assert.equal(state.stored.has('session'), true);
    assert.equal(state.notices.length, 0);
  }
});
test('late response cannot log out a different newly signed in account', async () => {
  let resolve;
  const state = setup(() => new Promise(done => { resolve = done; }));
  const pending = state.run();
  state.stored.set('session', JSON.stringify({ wa: '628999999999' }));
  resolve({ status: 404, ok: false, json: async () => ({ success: false }) });
  await pending;
  assert.equal(state.stored.has('session'), true);
  assert.equal(state.notices.length, 0);
});
test('login does not fall back to local records', () => {
  const login = source.slice(source.indexOf("    if (spmbModalMode === 'login') {", source.indexOf('// Look for matching record by WhatsApp')), source.indexOf('// REGISTER MODE:'));
  assert.ok(login.includes("cache: 'no-store'"));
  assert.doesNotMatch(login, /else if \(existing\)|if \(existing\)/);
});
