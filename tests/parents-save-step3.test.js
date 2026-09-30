const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('parents form submission blocks incomplete data and navigates to next stage when complete', async () => {
  const schema = require('../js/parent-fields.js');
  const code = fs.readFileSync('js/parents.js', 'utf8');

  // Helper to build context
  function createContext({
    formValid = true,
    formData = {},
    studentComplete = true,
    studentValid = true,
    studentRegionsComplete = true
  }) {
    let statusText = '';
    let statusClass = '';
    let scheduleStageOpened = null;
    let switchBiodataTarget = null;
    let fetchCalled = false;

    const listeners = {};
    const elements = {
      'portal-parent-data-form': {
        addEventListener(type, fn) { listeners[type] = fn; },
        reportValidity() { return formValid; },
        reset() {},
        querySelector() { return null; },
        querySelectorAll() { return []; }
      },
      'parent-section-Wali': {
        hidden: true,
        disabled: true,
        querySelectorAll() { return []; }
      },
      'portal-parent-fields': { append() {} },
      'portal-parent-data-status': {
        get textContent() { return statusText; },
        set textContent(v) { statusText = v; },
        get className() { return statusClass; },
        set className(v) { statusClass = v; }
      },
      'portal-parent-data-submit': { disabled: false },
      'portal-student-bio-form': {
        dataset: { dirty: '0' },
        checkValidity() { return studentValid; },
        reportValidity() { return studentValid; }
      },
      'portal-bio-status': { textContent: '', className: '' }
    };

    const storage = {
      'sit_active_parent_session': JSON.stringify({ wa: '081234567890', nama: 'Budi' }),
      'sit_bina_insan_spmb_data': JSON.stringify([{
        regNumber: 'SPMB-2026-001',
        waAyah: '081234567890',
        biodataUpdatedAt: studentComplete ? '2026-09-30T00:00:00.000Z' : null
      }])
    };

    const context = {
      window: {
        ParentFields: schema,
        StudentRegions: { isComplete() { return studentRegionsComplete; } },
        openScheduleStage(reg) { scheduleStageOpened = reg; },
        switchBiodataSubstep(target) { switchBiodataTarget = target; }
      },
      document: {
        getElementById(id) { return elements[id] || null; },
        createElement(tag) {
          return {
            id: '', className: '', style: {}, append() {}, replaceChildren() {},
            querySelector() { return { append() {}, replaceChildren() {} }; },
            querySelectorAll() { return []; }
          };
        }
      },
      FormData: function () {
        return {
          [Symbol.iterator]: function* () {
            for (const [k, v] of Object.entries(formData)) {
              yield [k, v];
            }
          }
        };
      },
      localStorage: {
        getItem(k) { return storage[k] || null; },
        setItem(k, v) { storage[k] = v; }
      },
      sessionStorage: {
        getItem() { return null; },
        setItem() {}
      },
      fetch: async (url, opts) => {
        fetchCalled = true;
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              regNumber: 'SPMB-2026-001',
              biodataUpdatedAt: '2026-09-30T00:00:00.000Z',
              parentDataUpdatedAt: '2026-09-30T01:00:00.000Z'
            }
          })
        };
      },
      Option: function (text, val) { return { text, value: val }; }
    };

    vm.createContext(context);
    vm.runInContext(code, context);

    return {
      submit: listeners['submit'],
      getStatusText: () => statusText,
      getStatusClass: () => statusClass,
      getScheduleStageOpened: () => scheduleStageOpened,
      getSwitchBiodataTarget: () => switchBiodataTarget,
      isFetchCalled: () => fetchCalled,
      populate: (rec) => context.window.ParentBiodata.populate(rec)
    };
  }

  // Case 1: Incomplete parent form (!reportValidity)
  {
    const ctx = createContext({ formValid: false });
    await ctx.submit({ preventDefault() {} });
    assert.equal(ctx.getStatusText(), 'Lengkapi data yang belum terisi.');
    assert.equal(ctx.getStatusClass(), 'portal-bio-status is-error');
    assert.equal(ctx.getScheduleStageOpened(), null);
    assert.equal(ctx.isFetchCalled(), false);
  }

  // Case 2: Parent form has validation error from schema (missing required parent field)
  {
    const ctx = createContext({
      formValid: true,
      formData: { memilikiWali: 'Tidak', namaAyah: '' }
    });
    await ctx.submit({ preventDefault() {} });
    assert.ok(ctx.getStatusText().includes('wajib diisi') || ctx.getStatusText() === 'Lengkapi data yang belum terisi.');
    assert.equal(ctx.getStatusClass(), 'portal-bio-status is-error');
    assert.equal(ctx.getScheduleStageOpened(), null);
    assert.equal(ctx.isFetchCalled(), false);
  }

  // Case 3: Student data incomplete
  {
    // Build valid parent form data
    const validParent = { memilikiWali: 'Tidak' };
    for (const role of ['Ayah', 'Ibu']) {
      validParent['statusHidup' + role] = 'Hidup';
      validParent['nama' + role] = 'Orang Tua ' + role;
      validParent['nik' + role] = '7372012345670001';
      validParent['tahunLahir' + role] = '1985';
      validParent['pendidikan' + role] = 'Sarjana (S1)';
      validParent['pekerjaan' + role] = 'Karyawan swasta';
      validParent['penghasilan' + role] = 'Rp2.000.000 - Rp5.000.000';
      validParent['telepon' + role] = '081234567890';
    }

    const ctx = createContext({
      formValid: true,
      formData: validParent,
      studentComplete: false,
      studentValid: false
    });
    await ctx.submit({ preventDefault() {} });
    assert.equal(ctx.getStatusText(), 'Lengkapi data yang belum terisi pada biodata siswa.');
    assert.equal(ctx.getStatusClass(), 'portal-bio-status is-error');
    assert.equal(ctx.getSwitchBiodataTarget(), 'student');
    assert.equal(ctx.getScheduleStageOpened(), null);
    assert.equal(ctx.isFetchCalled(), false);
  }

  // Case 4: Both student data and parent data complete -> saves and moves to next page
  {
    const validParent = { memilikiWali: 'Tidak' };
    for (const role of ['Ayah', 'Ibu']) {
      validParent['statusHidup' + role] = 'Hidup';
      validParent['nama' + role] = 'Orang Tua ' + role;
      validParent['nik' + role] = '7372012345670001';
      validParent['tahunLahir' + role] = '1985';
      validParent['pendidikan' + role] = 'Sarjana (S1)';
      validParent['pekerjaan' + role] = 'Karyawan swasta';
      validParent['penghasilan' + role] = 'Rp2.000.000 - Rp5.000.000';
      validParent['telepon' + role] = '081234567890';
    }

    const ctx = createContext({
      formValid: true,
      formData: validParent,
      studentComplete: true,
      studentValid: true
    });
    ctx.populate({
      regNumber: 'SPMB-2026-001',
      biodataUpdatedAt: '2026-09-30T00:00:00.000Z'
    });

    await ctx.submit({ preventDefault() {} });
    assert.equal(ctx.isFetchCalled(), true);
    assert.equal(ctx.getScheduleStageOpened(), 'SPMB-2026-001');
  }

  // Case 5: Verify layout alignment and checkmark removal from student status label
  {
    const html = fs.readFileSync('index.html', 'utf8');
    assert.ok(!html.includes('Kembali ke Data Siswa'), 'Kembali ke Data Siswa button should be removed');
    const studentBioSection = html.slice(html.indexOf('id="portal-section-student-bio"'), html.indexOf('id="portal-state-parents"'));
    assert.ok(studentBioSection.includes('justify-content: space-between;'), 'Student bio actions should be aligned with justify-content: space-between');

    const spmbJs = fs.readFileSync('js/spmb.js', 'utf8');
    assert.ok(!spmbJs.includes('✓ Biodata siswa'), 'Student bio status should not include checkmark');
    assert.ok(spmbJs.includes("'Biodata siswa sudah tersimpan di database.'"));
  }
});
