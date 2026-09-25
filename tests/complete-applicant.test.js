const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('portal completion elements and thank you messages are present in index.html and admin.html', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.ok(indexHtml.includes('id="portal-spmb-completed-card"'), 'index.html must have portal-spmb-completed-card');
  assert.ok(indexHtml.includes('Selamat &amp; terima kasih telah memilih sekolah kami untuk pendidikan anak anda, jazakallahu khairan'), 'index.html must contain thank you message');

  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  assert.ok(adminHtml.includes('id="modal-app-complete-box"'), 'admin.html must have modal-app-complete-box');
  assert.ok(adminHtml.includes('value="selesai"'), 'admin.html must have selesai filter option');
});

test('admin action button turns to Selesai only when student is graduated and re-registered', () => {
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');
  
  // Extract renderStudentActionButtons
  const start = adminJs.indexOf('  function renderStudentActionButtons(');
  const end = adminJs.indexOf('  // Kolom Berkas KK & Akta', start);
  const fnCode = adminJs.slice(start, end);
  const fn = new Function('escapeHtml', `${fnCode}; return renderStudentActionButtons;`)(s => s);

  const studentGraduatedOnly = {
    regNumber: 'SPMB-001',
    status: 'Lulus Seleksi Observasi & Diterima',
    biodataUpdatedAt: '2026-09-01',
    parentDataUpdatedAt: '2026-09-01'
  };

  const studentGraduatedAndRereg = {
    regNumber: 'SPMB-002',
    status: 'Lulus Seleksi Observasi & Diterima',
    biodataUpdatedAt: '2026-09-01',
    parentDataUpdatedAt: '2026-09-01',
    berkasKk: 'data:image/png;base64,kk',
    berkasAkta: 'data:image/png;base64,akta'
  };

  const studentCompleted = {
    regNumber: 'SPMB-003',
    status: 'Lulus Seleksi Observasi & Diterima (Pendaftaran Selesai)',
    biodataUpdatedAt: '2026-09-01',
    parentDataUpdatedAt: '2026-09-01',
    berkasKk: 'data:image/png;base64,kk',
    berkasAkta: 'data:image/png;base64,akta'
  };

  const btnGradOnly = fn(studentGraduatedOnly);
  assert.ok(btnGradOnly.includes('<span>Lulus</span>'), 'Graduated only must have Lulus button');
  assert.ok(!btnGradOnly.includes('<span>Selesai</span>'), 'Graduated only must not have Selesai button');

  const btnGradRereg = fn(studentGraduatedAndRereg);
  assert.ok(btnGradRereg.includes('<span>Selesai</span>'), 'Graduated & reregistered must have Selesai button');
  assert.ok(btnGradRereg.includes('window.completeApplicant'), 'Button must call completeApplicant');

  const btnCompleted = fn(studentCompleted);
  assert.ok(btnCompleted.includes('<span>Selesai</span>'), 'Completed student must have Selesai button');
});

test('window.completeApplicant confirms, updates status and shows thank you message', async () => {
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');
  const code = adminJs.slice(adminJs.indexOf('  const completingApplicants ='), adminJs.indexOf('  window.deleteApplicant ='));

  const student = {
    regNumber: 'SPMB-123',
    namaSiswa: 'Ahmad Faiz',
    status: 'Lulus Seleksi Observasi & Diterima',
    berkasKk: 'kk',
    berkasAkta: 'akta'
  };

  let calls = 0;
  const alerts = [];
  const toasts = [];
  let confirmed = false;

  const context = {
    window: {},
    spmbList: [student],
    confirm: () => confirmed,
    alert: (msg) => alerts.push(msg),
    showToast: (msg) => toasts.push(msg),
    apiRequest: async (url, options) => {
      calls++;
      const payload = JSON.parse(options.body);
      return { data: { ...student, status: payload.status } };
    },
    cacheSetItem() {},
    STORAGE_SPMB: 'students',
    renderSpmbTable() {},
    renderDashboard() {},
    broadcastRealtime() {}
  };

  vm.runInNewContext(code, context);

  // 1. Rejected confirm
  confirmed = false;
  await context.window.completeApplicant('SPMB-123', {});
  assert.equal(calls, 0);

  // 2. Accepted confirm
  confirmed = true;
  await context.window.completeApplicant('SPMB-123', {});
  assert.equal(calls, 1);
  assert.ok(student.status.includes('Selesai'));
  assert.ok(alerts.some(msg => msg.includes('Selamat & terima kasih telah memilih sekolah kami untuk pendidikan anak anda, jazakallahu khairan')));

  // 3. Already finished -> direct message without re-request
  await context.window.completeApplicant('SPMB-123', {});
  assert.equal(calls, 1);
});

test('renderParentPortal shows only completed card and hides stepper and forms when applicant is selesai', () => {
  const spmbJs = fs.readFileSync('js/spmb.js', 'utf8');
  const start = spmbJs.indexOf('  function renderParentPortal() {');
  const end = spmbJs.indexOf('  // Handle Proof File Input Selection', start);
  const fnCode = spmbJs.slice(start, end);

  const elements = {};
  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        style: { display: 'none' },
        dataset: {},
        textContent: '',
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {},
        removeAttribute() {}
      };
    }
    return elements[id];
  }

  const queryElements = {};
  function querySel(sel) {
    if (!queryElements[sel]) {
      queryElements[sel] = {
        style: { display: 'none' },
        dataset: {}
      };
    }
    return queryElements[sel];
  }

  const session = { nama: 'Ayah Fulan', wa: '08123456789' };
  const finishedStudent = {
    regNumber: 'SPMB-2026-999',
    namaAyah: 'Ayah Fulan',
    waAyah: '08123456789',
    namaSiswa: 'Fulan bin Fulan',
    status: 'Lulus Seleksi Observasi & Diterima (Pendaftaran Selesai)',
    berkasKk: 'kk.png',
    berkasAkta: 'akta.png'
  };

  const context = {
    PARENT_SESSION_KEY: 'session',
    STORAGE_KEY: 'students',
    localStorage: {
      getItem(key) {
        if (key === 'session') return JSON.stringify(session);
        if (key === 'students') return JSON.stringify([finishedStudent]);
        return null;
      }
    },
    document: {
      getElementById: getEl,
      querySelector: querySel
    }
  };

  vm.runInNewContext(`${fnCode}\nrenderParentPortal();`, context);

  assert.equal(getEl('portal-spmb-completed-card').style.display, 'block', 'completed card must be displayed');
  assert.equal(querySel('[data-purpose="registration-stepper"]').style.display, 'none', 'stepper must be hidden');
  assert.equal(getEl('portal-step-navigation').style.display, 'none', 'step navigation must be hidden');
  assert.equal(getEl('portal-state-reregistration').style.display, 'none', 'reregistration form must be hidden');
  assert.equal(getEl('portal-state-results').style.display, 'none', 'results state must be hidden');
  assert.equal(getEl('portal-state-biodata').style.display, 'none', 'biodata state must be hidden');
});

