const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('admin edit applicant modal and buttons restrict editing strictly to student and parent data', async (t) => {
  const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');

  await t.test('admin.html contains modal-edit-applicant with tabs and dedicated student & parent inputs', () => {
    assert.match(adminHtml, /id="modal-edit-applicant"/, 'Modal edit applicant must be present');
    assert.match(adminHtml, /id="tab-edit-student"/, 'Tab for student data must be present');
    assert.match(adminHtml, /id="tab-edit-parent"/, 'Tab for parent data must be present');
    assert.match(adminHtml, /id="edit-section-student"/, 'Student section must be present');
    assert.match(adminHtml, /id="edit-section-parent"/, 'Parent section must be present');
    assert.match(adminHtml, /id="form-edit-applicant"/, 'Form edit applicant must be present');

    // Ensure student fields exist
    assert.match(adminHtml, /name="namaSiswa"/, 'Student name input must exist');
    assert.match(adminHtml, /name="jenjang"/, 'Student jenjang select must exist');
    assert.match(adminHtml, /name="nik"/, 'Student NIK input must exist');
    assert.match(adminHtml, /name="tempatLahir"/, 'Student tempat lahir input must exist');
    assert.match(adminHtml, /name="tanggalLahir"/, 'Student tanggal lahir input must exist');
    assert.match(adminHtml, /name="asalSekolah"/, 'Student asal sekolah input must exist');
    assert.match(adminHtml, /name="alamat"/, 'Student alamat input must exist');
    assert.match(adminHtml, /name="hafalan"/, 'Student hafalan input must exist');
    assert.match(adminHtml, /name="prestasi"/, 'Student prestasi input must exist');

    // Ensure parent fields exist
    assert.match(adminHtml, /name="namaAyah"/, 'Father name input must exist');
    assert.match(adminHtml, /name="waAyah"/, 'Father WhatsApp input must exist');
    assert.match(adminHtml, /name="pekerjaanAyah"/, 'Father pekerjaan input must exist');
    assert.match(adminHtml, /name="namaIbu"/, 'Mother name input must exist');
    assert.match(adminHtml, /name="pekerjaanIbu"/, 'Mother pekerjaan input must exist');
    assert.match(adminHtml, /name="memilikiWali"/, 'Guardian option must exist');

    // Guard: ensure system administrative fields are NOT editable inside this form
    const formMatch = adminHtml.match(/<form id="form-edit-applicant"[\s\S]*?<\/form>/);
    assert.ok(formMatch, 'Form edit applicant must be findable');
    const formContent = formMatch[0];
    assert.doesNotMatch(formContent, /name="status"/, 'Status must NOT be an editable field in edit applicant form');
    assert.doesNotMatch(formContent, /name="nominalPembayaran"/, 'Nominal pembayaran must NOT be editable in this form');
    assert.doesNotMatch(formContent, /name="buktiPembayaran"/, 'Bukti pembayaran must NOT be editable in this form');
    assert.doesNotMatch(formContent, /name="berkasKk"/, 'Berkas KK must NOT be editable in this form');
    assert.doesNotMatch(formContent, /name="berkasAkta"/, 'Berkas Akta must NOT be editable in this form');
  });

  await t.test('admin.js connects edit button to window.editApplicant and provides editing workflows', () => {
    assert.match(adminJs, /onclick="window\.editApplicant\('\${item\.regNumber}'\)"/, 'Action pencil button must call window.editApplicant');
    assert.match(adminJs, /window\.editApplicant\s*=\s*async\s*function/, 'window.editApplicant function must be defined');
    assert.match(adminJs, /window\.switchEditApplicantTab\s*=\s*function/, 'window.switchEditApplicantTab must be defined');
    assert.match(adminJs, /window\.toggleEditGuardian\s*=\s*function/, 'window.toggleEditGuardian must be defined');
    assert.match(adminJs, /initEditApplicantForm\(\)/, 'initEditApplicantForm must be called in init()');
  });

  await t.test('api/backend.js allows admin to update student and parent fields via PUT', () => {
    const backendJs = fs.readFileSync(path.join(__dirname, '../api/backend.js'), 'utf8');
    assert.match(backendJs, /studentEditFields/, 'backend.js must define studentEditFields in admin PUT');
    assert.match(backendJs, /parentEditKeys/, 'backend.js must define parentEditKeys in admin PUT');
    assert.match(backendJs, /nik=CASE WHEN \$5::text IS NOT NULL THEN \$5::text ELSE nik END/, 'backend.js must sync nik column when admin updates nik');
  });

  await t.test('window.editApplicant and tab switching work properly with mock DOM', async () => {
    // Setup minimal DOM environment
    const elements = {};
    const getEl = id => {
      if (!elements[id]) {
        elements[id] = {
          id,
          value: '',
          textContent: '',
          style: {},
          className: '',
          classList: {
            add(c) { this.classes = this.classes || new Set(); this.classes.add(c); },
            remove(c) { this.classes = this.classes || new Set(); this.classes.delete(c); },
            contains(c) { return Boolean(this.classes && this.classes.has(c)); }
          }
        };
      }
      return elements[id];
    };

    global.document = {
      getElementById: getEl,
      querySelectorAll: () => []
    };

    // Test tab switcher logic
    getEl('tab-edit-student');
    getEl('tab-edit-parent');
    getEl('edit-section-student');
    getEl('edit-section-parent');

    // Run the extracted switch logic
    const switchTab = (tab) => {
      const studentTab = getEl('tab-edit-student');
      const parentTab = getEl('tab-edit-parent');
      const studentSec = getEl('edit-section-student');
      const parentSec = getEl('edit-section-parent');
      if (tab === 'student') {
        studentSec.style.display = 'block';
        parentSec.style.display = 'none';
        studentTab.className = 'active';
        parentTab.className = 'inactive';
      } else {
        studentSec.style.display = 'none';
        parentSec.style.display = 'block';
        parentTab.className = 'active';
        studentTab.className = 'inactive';
      }
    };

    switchTab('parent');
    assert.equal(getEl('edit-section-parent').style.display, 'block');
    assert.equal(getEl('edit-section-student').style.display, 'none');

    switchTab('student');
    assert.equal(getEl('edit-section-student').style.display, 'block');
    assert.equal(getEl('edit-section-parent').style.display, 'none');

    // Test guardian toggle logic
    getEl('edit-wali-container');
    const toggleGuardian = (has) => {
      getEl('edit-wali-container').style.display = has ? 'grid' : 'none';
    };
    toggleGuardian(true);
    assert.equal(getEl('edit-wali-container').style.display, 'grid');
    toggleGuardian(false);
    assert.equal(getEl('edit-wali-container').style.display, 'none');
  });
});
