const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('step colors follow current page and clear stale schedule-driven highlights', () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const code = source.slice(source.indexOf('  function updateRegistrationNavigation('), source.indexOf('  // Navigasi langsung'));
  const nodes = {}, badges = {};
  const node = id => nodes[id] ||= {
    style: { display: 'none' }, classes: new Set(['active', 'done', 'current-success']),
    attrs: { 'aria-current': 'step' },
    classList: { remove(...values) { values.forEach(value => nodes[id].classes.delete(value)); }, add(value) { nodes[id].classes.add(value); } },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; }
  };
  const context = {
    document: { getElementById: node, querySelector: selector => badges[selector] ||= {} },
    sessionStorage: { getItem: () => 'SPMB-TEST:payment' }, PARENT_BIODATA_VIEW_KEY: 'view',
    registrationSteps: Array.from({ length: 6 }, () => ['Title', 'Description'])
  };
  vm.createContext(context); vm.runInContext(code, context);
  context.updateRegistrationNavigation({ regNumber: 'SPMB-TEST', jadwalTes: 'Jadwal ditentukan', biodataUpdatedAt: 'saved', parentDataUpdatedAt: 'saved' }, true, true);
  assert.deepEqual([...nodes['flow-step-1'].classes], ['done']);
  assert.deepEqual([...nodes['flow-step-2'].classes], ['active']);
  for (let i = 3; i <= 6; i++) {
    assert.equal(nodes['flow-step-' + i].classes.size, 0);
    assert.equal(nodes['flow-step-' + i].attrs['aria-current'], undefined);
    assert.equal(badges['#flow-step-' + i + ' .step-label-badge'].textContent, 'Belum');
  }
  node('portal-state-schedule').style.display = 'block';
  context.updateRegistrationNavigation({ regNumber: 'SPMB-TEST' }, true, true);
  assert.deepEqual([...nodes['flow-step-4'].classes], ['active']);
  assert.equal(nodes['flow-step-5'].classes.size, 0);
});
