(function () {
  'use strict';
  const form = document.getElementById('portal-parent-data-form');
  if (!form) return;
  const schema = window.ParentFields;
  const container = document.getElementById('portal-parent-fields');
  const status = document.getElementById('portal-parent-data-status');
  let currentRecord;
  let dirty = false;
  let lastVersion;
  const required = '<span class="required">*</span>';
  function section(role) {
    const section = document.createElement('fieldset');
    section.id = 'parent-section-' + role;
    section.style.cssText = 'border:0; padding:0; margin:0 0 2rem; min-width:0;';
    section.innerHTML = `<legend class="form-label" style="font-size:1.2rem; margin-bottom:1rem;">Data ${role}</legend><div class="portal-bio-grid"></div>`;
    const grid = section.querySelector('div');
    for (const field of schema.fields) {
      const name = field.key + role;
      const wrapper = document.createElement(field.type === 'radio' ? 'fieldset' : 'div');
      wrapper.className = 'form-group';
      if (field.type === 'radio') {
        wrapper.style.cssText = 'border:0; padding:0;';
        wrapper.innerHTML = `<legend class="form-label">${field.label} ${role} ${required}</legend><div style="display:flex; gap:1.5rem;">${field.options.map(value => `<label><input type="radio" name="${name}" value="${value}" required> ${value}</label>`).join('')}</div>`;
      } else {
        wrapper.innerHTML = `<label class="form-label" for="parent-${name}">${field.label} ${role} ${required}</label>`;
        const input = document.createElement(field.type === 'select' ? 'select' : 'input');
        input.id = 'parent-' + name;
        input.name = name;
        input.required = true;
        input.className = 'form-control';
        if (field.options) input.replaceChildren(new Option('Pilih ' + field.label.toLowerCase(), ''), ...field.options.map(value => new Option(value, value)));
        else {
          input.type = field.type;
          if (field.maxLength) input.maxLength = field.maxLength;
          if (field.pattern) input.pattern = field.pattern;
          if (field.key === 'nik') input.inputMode = 'numeric';
          if (field.key === 'tahunLahir') { input.min = '1900'; input.max = String(new Date().getFullYear()); input.step = '1'; }
        }
        wrapper.append(input);
      }
      grid.append(wrapper);
    }
    container.append(section);
  }
  section('Ayah'); section('Ibu');
  const choice = document.createElement('fieldset');
  choice.className = 'form-group';
  choice.style.cssText = 'border:0; padding:0;';
  choice.innerHTML = `<legend class="form-label">Memiliki wali? ${required}</legend><div style="display:flex; gap:1.5rem;"><label><input type="radio" name="memilikiWali" value="Ya" required> Ya</label><label><input type="radio" name="memilikiWali" value="Tidak" required> Tidak</label></div>`;
  container.append(choice);
  section('Wali');
  function toggleGuardian() {
    const visible = form.querySelector('[name="memilikiWali"]:checked')?.value === 'Ya';
    const guardian = document.getElementById('parent-section-Wali');
    guardian.hidden = !visible;
    guardian.disabled = !visible;
    guardian.querySelectorAll('input, select').forEach(input => { input.required = visible; });
  }
  toggleGuardian();
  form.addEventListener('input', () => { dirty = true; status.textContent = 'Perubahan belum disimpan.'; status.className = 'portal-bio-status'; });
  form.addEventListener('change', () => { dirty = true; toggleGuardian(); });
  window.ParentBiodata = {
    populate(record) {
      if (currentRecord?.regNumber === record.regNumber && dirty) return;
      const version = JSON.stringify([record.regNumber, record.parentDataUpdatedAt]);
      currentRecord = record;
      if (version === lastVersion) return;
      lastVersion = version;
      form.reset();
      for (const key of schema.keys) {
        form.querySelectorAll(`[name="${key}"]`).forEach(input => {
          if (input.type === 'radio') input.checked = input.value === record[key];
          else input.value = record.parentDataUpdatedAt ? record[key] || '' : '';
        });
      }
      dirty = false;
      toggleGuardian();
      status.textContent = record.parentDataUpdatedAt ? 'Data orang tua dan wali sudah tersimpan.' : 'Semua isian wajib dilengkapi.';
      status.className = 'portal-bio-status' + (record.parentDataUpdatedAt ? ' is-success' : '');
      const gotoScheduleBtn = document.getElementById('portal-parent-goto-schedule');
      if (gotoScheduleBtn) {
        gotoScheduleBtn.style.display = record.parentDataUpdatedAt ? 'inline-flex' : 'none';
      }
    }
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const error = schema.validate(data);
    if (error) { status.textContent = error; status.className = 'portal-bio-status is-error'; return; }
    const button = document.getElementById('portal-parent-data-submit');
    button.disabled = true;
    status.textContent = 'Menyimpan data orang tua dan wali...';
    try {
      const session = JSON.parse(localStorage.getItem('sit_active_parent_session') || 'null');
      if (!session?.wa || !currentRecord?.regNumber) throw new Error('Silakan masuk kembali ke portal.');
      const response = await fetch('api/spmb.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, action: 'save_parents', regNumber: currentRecord.regNumber, accountWa: session.wa }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Data gagal disimpan.');
      try { localStorage.setItem('sit_bina_insan_spmb_data', JSON.stringify([result.data])); } catch (_) {}
      dirty = false;
      window.ParentBiodata.populate(result.data);
      status.textContent = '✓ Data orang tua dan wali berhasil disimpan! Menuju tahap Jadwal...';
      status.className = 'portal-bio-status is-success';
      const gotoScheduleBtn = document.getElementById('portal-parent-goto-schedule');
      if (gotoScheduleBtn) gotoScheduleBtn.style.display = 'inline-flex';
      setTimeout(() => {
        if (typeof window.openScheduleStage === 'function') {
          window.openScheduleStage();
        }
      }, 700);
    } catch (error) {
      status.textContent = error.message || 'Data gagal disimpan. Silakan coba kembali.';
      status.className = 'portal-bio-status is-error';
    } finally { button.disabled = false; }
  });
})();
