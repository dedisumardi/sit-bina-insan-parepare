const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('step six requires explicit admin acceptance through every navigation entry', () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const context = { registrationNavigation: {}, alert() {} };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function canAccessReRegistration'), source.indexOf('  window.navigateRegistration')), context);
  for (const status of ['', 'Jadwal Tes & Wawancara Ditetapkan', 'Cadangan', 'Tidak Lulus']) {
    assert.equal(context.canAccessReRegistration({ status }), false);
  }
  assert.equal(context.canAccessReRegistration({ status: 'Lulus Seleksi Observasi & Diterima' }), true);
  assert.equal(context.checkReRegistrationAccess(), false);
  context.registrationNavigation.canReregister = true;
  assert.equal(context.checkReRegistrationAccess(), true);
  assert.ok(source.includes('if (target === 6 && !checkReRegistrationAccess()) return;'));
  assert.ok(source.includes('if (targetStep === 6 && !checkReRegistrationAccess()) return;'));
  assert.match(source, /window.openReRegistrationStage = function \(\) \{\s+if \(!checkReRegistrationAccess\(\)\) return;/);
  assert.ok(source.includes('reregistrationViewOpen = canAccessReRegistration(record);'));
  assert.ok(source.includes('(step === 5 && !registrationNavigation.canReregister)'));
});
