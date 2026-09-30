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
    hasUnsavedChanges() { return dirty; },
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
    }
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!form.reportValidity()) {
      status.textContent = 'Lengkapi data yang belum terisi.';
      status.className = 'portal-bio-status is-error';
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const error = schema.validate(data);
    if (error) {
      status.textContent = error || 'Lengkapi data yang belum terisi.';
      status.className = 'portal-bio-status is-error';
      return;
    }

    // Pastikan data siswa (Bagian 1) sudah lengkap dan tersimpan
    const studentForm = document.getElementById('portal-student-bio-form');
    let record = currentRecord;
    if (!record || !record.biodataUpdatedAt) {
      try {
        const records = JSON.parse(localStorage.getItem('sit_bina_insan_spmb_data') || '[]');
        const session = JSON.parse(localStorage.getItem('sit_active_parent_session') || 'null');
        const cleanWa = String(session?.wa || '').replace(/\D/g, '');
        const found = records.find(item => {
          const itemWa = String(item.waAyah || '').replace(/\D/g, '');
          return itemWa === cleanWa || (cleanWa.length >= 9 && itemWa.endsWith(cleanWa.slice(-9)));
        });
        if (found) {
          record = found;
          currentRecord = found;
        }
      } catch (_) {}
    }

    const isStudentSaved = Boolean(record?.biodataUpdatedAt);
    const isStudentDirty = studentForm?.dataset.dirty === '1';

    if (!isStudentSaved || isStudentDirty) {
      const studentValid = studentForm ? studentForm.checkValidity() : false;
      const regionsComplete = window.StudentRegions ? window.StudentRegions.isComplete() : true;

      if (!studentValid || !regionsComplete) {
        status.textContent = 'Lengkapi data yang belum terisi pada biodata siswa.';
        status.className = 'portal-bio-status is-error';
        const studentStatus = document.getElementById('portal-bio-status');
        if (studentStatus) {
          studentStatus.textContent = 'Lengkapi data yang belum terisi.';
          studentStatus.className = 'portal-bio-status is-error';
        }
        window.switchBiodataSubstep?.('student');
        studentForm?.reportValidity();
        return;
      }

      // Jika data siswa valid tapi belum tersimpan, simpan terlebih dahulu
      status.textContent = 'Menyimpan biodata siswa...';
      status.className = 'portal-bio-status';
      const studentSaved = await window.submitStudentBiodata?.();
      if (!studentSaved) {
        status.textContent = 'Lengkapi data yang belum terisi pada biodata siswa.';
        status.className = 'portal-bio-status is-error';
        window.switchBiodataSubstep?.('student');
        return;
      }

      try {
        const records = JSON.parse(localStorage.getItem('sit_bina_insan_spmb_data') || '[]');
        const session = JSON.parse(localStorage.getItem('sit_active_parent_session') || 'null');
        const cleanWa = String(session?.wa || '').replace(/\D/g, '');
        const updated = records.find(item => {
          const itemWa = String(item.waAyah || '').replace(/\D/g, '');
          return itemWa === cleanWa || (cleanWa.length >= 9 && itemWa.endsWith(cleanWa.slice(-9)));
        });
        if (updated) currentRecord = updated;
      } catch (_) {}
    }

    const button = document.getElementById('portal-parent-data-submit');
    button.disabled = true;
    status.textContent = 'Menyimpan data orang tua dan wali...';
    status.className = 'portal-bio-status';
    try {
      const session = JSON.parse(localStorage.getItem('sit_active_parent_session') || 'null');
      if (!session?.wa || !currentRecord?.regNumber) throw new Error('Silakan masuk kembali ke portal.');
      const response = await fetch('api/spmb.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'save_parents', regNumber: currentRecord.regNumber, accountWa: session.wa })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Data gagal disimpan.');
      try {
        let records = JSON.parse(localStorage.getItem('sit_bina_insan_spmb_data') || '[]');
        if (Array.isArray(records)) {
          const idx = records.findIndex(item => item.regNumber === result.data.regNumber || item.id === result.data.id);
          if (idx >= 0) records[idx] = result.data;
          else records.unshift(result.data);
        } else {
          records = [result.data];
        }
        localStorage.setItem('sit_bina_insan_spmb_data', JSON.stringify(records));
      } catch (_) {}
      dirty = false;
      window.ParentBiodata.populate(result.data);

      // Setelah berhasil disimpan dan lengkap, langsung berpindah ke halaman selanjutnya (Langkah 4: Tahap Jadwal)
      if (typeof window.openScheduleStage === 'function') {
        window.openScheduleStage(result.data.regNumber);
      } else {
        try { sessionStorage.setItem('sit_parent_biodata_view', result.data.regNumber + ':schedule'); } catch (_) {}
        window.renderParentPortal?.();
      }
    } catch (error) {
      status.textContent = error.message || 'Data gagal disimpan. Silakan coba kembali.';
      status.className = 'portal-bio-status is-error';
    } finally {
      button.disabled = false;
    }
  });
})();
