const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('reregistration stage elements are present in index.html and admin.html', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.ok(indexHtml.includes('id="flow-step-7"'), 'index.html must have flow-step-7');
  assert.ok(indexHtml.includes('portal-flow-seven'), 'index.html must have portal-flow-seven class');
  assert.ok(indexHtml.includes('id="portal-results-reregister-action"'), 'index.html must have reregister action in results stage');
  assert.ok(indexHtml.includes('id="portal-state-reregistration"'), 'index.html must have portal-state-reregistration section');
  assert.ok(indexHtml.includes('id="portal-rereg-kk-file"'), 'index.html must have KK file input');
  assert.ok(indexHtml.includes('id="portal-rereg-akta-file"'), 'index.html must have Akta file input');
  assert.ok(indexHtml.includes('window.openReRegistrationStage()'), 'index.html must call openReRegistrationStage');
  assert.ok(indexHtml.includes('window.submitReRegistration()'), 'index.html must call submitReRegistration');

  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  assert.ok(adminHtml.includes('id="modal-app-rereg-box"'), 'admin.html must have modal-app-rereg-box');
  assert.ok(adminHtml.includes('id="modal-app-kk-container"'), 'admin.html must have modal-app-kk-container');
  assert.ok(adminHtml.includes('id="modal-app-akta-container"'), 'admin.html must have modal-app-akta-container');
});

test('openReRegistrationStage writes reregistration view and refreshes parent portal', () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const start = source.indexOf('  window.openReRegistrationStage =');
  assert.ok(start !== -1, 'openReRegistrationStage must be defined in js/spmb.js');
  const end = source.indexOf('  // Render Parent Portal', start);
  const writes = [];
  let refreshes = 0;
  const context = {
    window: {},
    PARENT_BIODATA_VIEW_KEY: 'view',
    document: {
      getElementById: (id) => ({
        textContent: 'SPMB-2026-000001',
        scrollIntoView() {}
      })
    },
    sessionStorage: { setItem: (...args) => writes.push(args) },
    renderParentPortal() {},
    refreshParentFromDatabase() { refreshes++; },
    requestAnimationFrame: (fn) => fn()
  };
  vm.runInNewContext(source.slice(start, end), context);
  context.window.openReRegistrationStage();
  assert.deepEqual(writes, [['view', 'SPMB-2026-000001:reregistration']]);
  assert.equal(refreshes, 1);
});

test('step 7 sets navigation title, description and step 7 text', () => {
  const source = fs.readFileSync('js/spmb.js', 'utf8');
  const code = source.slice(source.indexOf('  const registrationSteps ='), source.indexOf('  window.openResultsStage ='));
  const nodes = {};
  const context = {
    window: {},
    PARENT_BIODATA_VIEW_KEY: 'view',
    document: {
      getElementById(id) {
        return nodes[id] ||= {
          style: { display: id === 'portal-state-reregistration' ? 'block' : 'none' },
          dataset: {},
          disabled: false,
          setAttribute() {},
          removeAttribute() {}
        };
      }
    },
    sessionStorage: { getItem: () => 'SPMB-1:reregistration', setItem: () => {} },
    renderParentPortal() {},
    refreshParentFromDatabase() {}
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  context.updateRegistrationNavigation({ regNumber: 'SPMB-1' }, true, true);
  assert.equal(nodes['portal-current-step'].textContent, 'LANGKAH 7 DARI 7');
  assert.equal(nodes['portal-current-title'].textContent, 'Pendaftaran Ulang Siswa Baru');
});
