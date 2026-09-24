const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const code = source.slice(source.indexOf('  const registrationSteps ='), source.indexOf('  window.openResultsStage ='));
  const nodes = {};
  const submitted = [], saved = [], alerts = [];
  let view = '';
  const context = {
    window: {}, PARENT_BIODATA_VIEW_KEY: 'view',
    document: { getElementById(id) {
      return nodes[id] ||= { style: { display: 'none' }, disabled: false, scrollIntoView() {}, requestSubmit() { submitted.push(id); } };
    } },
    sessionStorage: { getItem: () => view, setItem: (key, value) => { view = value; saved.push(value); } },
    renderParentPortal() {}, refreshParentFromDatabase() {}, alert: message => alerts.push(message)
  };
  vm.createContext(context); vm.runInContext(code, context);
  return { context, nodes, submitted, saved, alerts, setView(value) { view = value; } };
}

test('navigation moves exactly one step and submits forms before advancing', () => {
  const { context, saved, submitted } = setup();
  const go = (step, direction) => {
    vm.runInContext("registrationNavigation = { step: " + step + ", regNumber: 'REG', approved: true, proof: true }", context);
    context.window.navigateRegistration(direction);
  };
  for (const [step, suffix] of [[2, ':start'], [3, ':payment'], [4, ''], [5, ':parents'], [6, ':schedule']]) {
    go(step, -1); assert.equal(saved.at(-1), 'REG' + suffix);
  }
  for (const [step, suffix] of [[1, ':payment'], [2, ''], [5, ':results']]) {
    go(step, 1); assert.equal(saved.at(-1), 'REG' + suffix);
  }
  go(3, 1); go(4, 1);
  assert.deepEqual(submitted, ['portal-student-bio-form', 'portal-parent-data-form']);
  const count = saved.length;
  go(1, -1); go(6, 1);
  assert.equal(saved.length, count);
});

test('first step retains approved payment and both boundary buttons stay present', () => {
  const { context, nodes, setView } = setup();
  setView('REG:start');
  context.updateRegistrationNavigation({ regNumber: 'REG', buktiPembayaran: 'proof.jpg' }, true, true);
  assert.equal(nodes['portal-state-payment-summary'].style.display, 'block');
  assert.equal(nodes['portal-state-unpaid'].style.display, 'none');
  assert.equal(nodes['portal-step-back'].disabled, true);
  assert.equal(nodes['portal-step-next'].disabled, false);
  assert.equal(nodes['portal-current-step'].textContent, 'LANGKAH 1 DARI 6');
  setView('');
  context.updateRegistrationNavigation({ regNumber: 'REG' }, false, true);
  assert.equal(nodes['portal-step-back'].disabled, false);
  assert.equal(nodes['portal-step-next'].disabled, true);
});
