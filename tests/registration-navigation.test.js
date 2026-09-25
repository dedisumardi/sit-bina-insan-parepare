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
      return nodes[id] ||= { style: { display: 'none' }, dataset: {}, disabled: false, reportValidity() { return true; }, scrollIntoView() {}, requestSubmit() { submitted.push(id); } };
    } },
    sessionStorage: { getItem: () => view, setItem: (key, value) => { view = value; saved.push(value); } },
    renderParentPortal() {}, refreshParentFromDatabase() {}, alert: message => alerts.push(message)
  };
  vm.createContext(context); vm.runInContext(code, context);
  return { context, nodes, submitted, saved, alerts, setView(value) { view = value; } };
}

test('navigation moves exactly one step without saving forms', () => {
  const { context, saved, submitted } = setup();
  const go = (step, direction) => {
    vm.runInContext("registrationNavigation = { step: " + step + ", regNumber: 'REG', approved: true, proof: true, studentSaved: true, parentsSaved: true }", context);
    context.window.navigateRegistration(direction);
  };
  for (const [step, suffix] of [[2, ':start'], [3, ':payment'], [4, ''], [5, ':schedule'], [6, ':results']]) {
    go(step, -1); assert.equal(saved.at(-1), 'REG' + suffix);
  }
  for (const [step, suffix] of [[1, ':payment'], [2, ''], [3, ':schedule'], [4, ':results'], [5, ':reregistration']]) {
    go(step, 1); assert.equal(saved.at(-1), 'REG' + suffix);
  }
  assert.deepEqual(submitted, []);
  const count = saved.length;
  go(1, -1); go(6, 1);
  assert.equal(saved.length, count);
});

test('next blocks missing saves and unsaved edits for both forms', () => {
  const { context, saved, alerts, submitted } = setup();
  
  // 1. Missing student save
  vm.runInContext("registrationNavigation = { step: 3, regNumber: 'REG', approved: true, studentSaved: false, parentsSaved: true }", context);
  context.window.navigateRegistration(1);

  // 2. Unsaved student edits
  vm.runInContext("registrationNavigation = { step: 3, regNumber: 'REG', approved: true, studentSaved: true, parentsSaved: true }", context);
  context.document.getElementById('portal-student-bio-form').dataset.dirty = '1';
  context.window.navigateRegistration(1);
  context.document.getElementById('portal-student-bio-form').dataset.dirty = '0';

  // 3. Missing parent save
  vm.runInContext("registrationNavigation = { step: 3, regNumber: 'REG', approved: true, studentSaved: true, parentsSaved: false }", context);
  context.window.navigateRegistration(1);

  // 4. Unsaved parent edits
  vm.runInContext("registrationNavigation = { step: 3, regNumber: 'REG', approved: true, studentSaved: true, parentsSaved: true }", context);
  context.window.ParentBiodata = { hasUnsavedChanges: () => true };
  context.window.navigateRegistration(1);

  assert.equal(alerts.length, 4);
  assert.equal(saved.length, 0);
  assert.equal(submitted.length, 0);
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
