const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('admin payment approval is hidden and guarded for graduated applicants', () => {
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');

  // Verify isPaymentApproved recognizes graduated/passed status
  assert.match(adminJs, /function isPaymentApproved/);
  assert.match(adminJs, /function isApplicantPassed/);

  // Extract isPaymentApproved and isApplicantPassed functions
  const helperCode = adminJs.slice(adminJs.indexOf('  function isPaymentApproved'), adminJs.indexOf('  function getFilteredStudents'));
  const fn = new Function(`${helperCode}; return { isPaymentApproved, isApplicantPassed };`);
  const { isPaymentApproved, isApplicantPassed } = fn();

  const passedStudent = {
    regNumber: 'SPMB-2026-000001',
    namaSiswa: 'Arfa',
    status: 'Lulus Seleksi Observasi & Diterima',
    buktiPembayaran: 'data:image/png;base64,sample'
  };

  const unverifiedStudent = {
    regNumber: 'PENDING-123456',
    namaSiswa: 'Budi',
    status: 'Menunggu Verifikasi Pembayaran oleh Admin',
    buktiPembayaran: 'data:image/png;base64,sample'
  };

  assert.equal(isApplicantPassed(passedStudent), true);
  assert.equal(isApplicantPassed(unverifiedStudent), false);

  assert.equal(isPaymentApproved(passedStudent), true);
  assert.equal(isPaymentApproved(unverifiedStudent), false);

  // Verify approvePayment contains guard against reverting passed applicants
  assert.match(adminJs, /if\s*\(isApplicantPassed\(item\)\)/);

  // Verify viewApplicantDetail and viewPaymentProof use isPaymentApproved
  assert.match(adminJs, /const isApproved = isPaymentApproved\(item\);/);
});
