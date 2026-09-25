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
