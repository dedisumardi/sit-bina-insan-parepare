/**
 * SIT BINA INSAN PAREPARE - SPMB ENGINE
 * Multi-Step Wizard, LocalStorage Persistence, Kartu Tanda Peserta & Cek Status
 */

(function () {
  'use strict';

  // State
  let currentStep = 1;
  const totalSteps = 5;
  const STORAGE_KEY = 'sit_bina_insan_spmb_data';
  let scheduleSettings = null;
  let scheduleLoadError = false;
  let scheduleRequest = null;

  function getSharedSchedule(record, settings) {
    const level = String(record.jenjang || '').trim().toLowerCase();
    if (!settings || !['tkit', 'sdit', 'smpit'].includes(level)) return { time: '', location: '', notes: '' };
    return {
      time: settings[level + '_jadwalTes'] || '',
      location: settings[level + '_lokasiTes'] || '',
      notes: settings[level + '_catatanJadwal'] || ''
    };
  }

  async function refreshScheduleSettings() {
    if (document.hidden || !localStorage.getItem(PARENT_SESSION_KEY)) return;
    if (scheduleRequest) return scheduleRequest;
    scheduleRequest = (async () => {
      try {
        const response = await fetch('api/settings.php', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success || !result.data) throw new Error('Jadwal tidak tersedia');
        scheduleSettings = result.data;
        scheduleLoadError = false;
      } catch (_) {
        scheduleLoadError = true;
      } finally {
        scheduleRequest = null;
        renderParentPortal();
      }
    })();
    return scheduleRequest;
  }

  function cacheSetItem(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* A cache failure must not report a successful database write as failed. */ }
  }

  // DOM Elements
  const stepTracker = document.getElementById('spmb-step-tracker');
  const formCard = document.getElementById('spmb-form-card');
  const prevBtn = document.getElementById('spmb-prev-btn');
  const nextBtn = document.getElementById('spmb-next-btn');
  const submitBtn = document.getElementById('spmb-submit-btn');
  const successView = document.getElementById('spmb-success-view');
  const regForm = document.getElementById('spmb-registration-form');

  // SPMB Tabs
  const spmbTabBtns = document.querySelectorAll('.spmb-tab-btn');
  const spmbPanels = document.querySelectorAll('.spmb-tab-panel');

  function initSpmbTabs() {
    spmbTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        spmbTabBtns.forEach(b => b.classList.remove('active'));
        spmbPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPanel = document.getElementById(`spmb-panel-${target}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  // Update Wizard Steps Visual
  function updateStepUI() {
    // Step indicators
    const stepItems = stepTracker.querySelectorAll('.step-item');
    stepItems.forEach((item, idx) => {
      const stepNum = idx + 1;
      item.classList.remove('active', 'done');
      if (stepNum === currentStep) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'step');
      } else if (stepNum < currentStep) {
        item.classList.add('done');
        item.removeAttribute('aria-current');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    // Step contents
    for (let i = 1; i <= totalSteps; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        stepEl.classList.toggle('active', i === currentStep);
      }
    }

    // Button visibility
    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

    // If on Step 5 (Review), populate summary
    if (currentStep === 5) {
      populateReviewSummary();
    }

    // Scroll to form top smoothly
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Validate fields for current step
  function validateStep(step) {
    const currentStepEl = document.getElementById(`step-${step}`);
    if (!currentStepEl) return true;

    const inputs = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    let firstInvalid = null;

    inputs.forEach(input => {
      if (!input.checkValidity()) {
        isValid = false;
        input.classList.add('is-invalid');
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.classList.remove('is-invalid');
      }
    });

    // Special checks
    if (step === 1) {
      const jenjangChecked = document.querySelector('input[name="jenjang"]:checked');
      if (!jenjangChecked) {
        alert('Silakan pilih salah satu jenjang pendidikan (TKIT, SDIT, atau SMPIT).');
        return false;
      }
    }

    if (step === 2) {
      const nik = document.getElementById('siswa_nik').value.trim();
      if (nik.length < 16) {
        alert('Nomor Induk Kependudukan (NIK) siswa harus 16 digit angka.');
        document.getElementById('siswa_nik').focus();
        return false;
      }
    }

    if (step === 3) {
      const wa = document.getElementById('ortu_wa').value.trim();
      if (wa.length < 10) {
        alert('Nomor WhatsApp Ayah/Wali harus valid (minimal 10 digit).');
        document.getElementById('ortu_wa').focus();
        return false;
      }
    }

    if (!isValid && firstInvalid) {
      firstInvalid.focus();
      firstInvalid.reportValidity();
    }

    return isValid;
  }

  // Populate Review Table in Step 5
  function populateReviewSummary() {
    const jenjangVal = document.querySelector('input[name="jenjang"]:checked')?.value || '-';
    const jalurVal = document.querySelector('input[name="jalur"]:checked')?.value || 'Reguler';
    
    const namaSiswa = document.getElementById('siswa_nama')?.value || '-';
    const nik = document.getElementById('siswa_nik')?.value || '-';
    const ttl = `${document.getElementById('siswa_tempat_lahir')?.value || ''}, ${document.getElementById('siswa_tgl_lahir')?.value || ''}`;
    const jk = document.querySelector('input[name="siswa_jk"]:checked')?.value || '-';
    const asalSekolah = document.getElementById('siswa_asal_sekolah')?.value || '-';
    const alamat = document.getElementById('siswa_alamat')?.value || '-';

    const namaAyah = document.getElementById('ortu_nama_ayah')?.value || '-';
    const pekWaAyah = `${document.getElementById('ortu_pek_ayah')?.value || '-'} (WA: ${document.getElementById('ortu_wa')?.value || '-'})`;
    const namaIbu = document.getElementById('ortu_nama_ibu')?.value || '-';
    const email = document.getElementById('ortu_email')?.value || '-';

    const hafalan = document.getElementById('siswa_hafalan')?.value || 'Belum ada';
    const prestasi = document.getElementById('siswa_prestasi')?.value || 'Belum ada';

    let jenjangText = 'TKIT Bina Insan';
    if (jenjangVal === 'sdit') {
      jenjangText = 'SDIT Bina Insan';
    } else if (jenjangVal === 'smpit') {
      jenjangText = 'SMPIT Bina Insan';
    }

    const container = document.getElementById('review-summary-container');
    if (!container) return;

    container.innerHTML = `
      <div class="review-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        1. Pilihan Pendidikan & Jalur
      </div>
      <table class="review-table">
        <tr><td>Jenjang Dipilih:</td><td><strong>${jenjangText}</strong></td></tr>
        <tr><td>Jalur Pendaftaran:</td><td><span class="badge-tag">${jalurVal.toUpperCase()}</span></td></tr>
      </table>

      <div class="review-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
        2. Identitas Calon Siswa
      </div>
      <table class="review-table">
        <tr><td>Nama Lengkap:</td><td><strong>${escapeHtml(namaSiswa)}</strong></td></tr>
        <tr><td>NIK / No. KK:</td><td>${escapeHtml(nik)}</td></tr>
        <tr><td>Tempat, Tgl Lahir:</td><td>${escapeHtml(ttl)}</td></tr>
        <tr><td>Jenis Kelamin:</td><td>${escapeHtml(jk)}</td></tr>
        <tr><td>Asal Sekolah:</td><td>${escapeHtml(asalSekolah)}</td></tr>
        <tr><td>Alamat Domisili:</td><td>${escapeHtml(alamat)}</td></tr>
      </table>

      <div class="review-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        3. Data Orang Tua / Wali
      </div>
      <table class="review-table">
        <tr><td>Nama Ayah:</td><td>${escapeHtml(namaAyah)}</td></tr>
        <tr><td>Pekerjaan & WA:</td><td>${escapeHtml(pekWaAyah)}</td></tr>
        <tr><td>Nama Ibu:</td><td>${escapeHtml(namaIbu)}</td></tr>
        <tr><td>Email Kontak:</td><td>${escapeHtml(email)}</td></tr>
      </table>

      <div class="review-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
        4. Keagamaan & Prestasi
      </div>
      <table class="review-table">
        <tr><td>Hafalan Qur'an:</td><td>${escapeHtml(hafalan)}</td></tr>
        <tr><td>Prestasi Siswa:</td><td>${escapeHtml(prestasi)}</td></tr>
      </table>
    `;
  }

  // Generate Digital Ticket / Bukti Pendaftaran
  function generateTicket(record) {
    let jenjangTitle = 'TKIT Bina Insan Parepare';
    if (record.jenjang === 'sdit') jenjangTitle = 'SDIT Bina Insan Parepare';
    if (record.jenjang === 'smpit') jenjangTitle = 'SMPIT Bina Insan Parepare';

    const ticketContainer = document.getElementById('spmb-ticket-content');
    if (!ticketContainer) return;

    let currentSettings = {};
    try {
      const raw = localStorage.getItem('sit_bina_insan_settings');
      if (raw) currentSettings = JSON.parse(raw);
    } catch (e) {}
    const acYear = currentSettings.academicYear || '2025/2026';

    ticketContainer.innerHTML = `
      <div class="spmb-ticket-card">
        <!-- Ticket Header -->
        <div class="ticket-header">
          <div class="ticket-brand">
            <img src="assets/images/logo.png" alt="Logo SIT Bina Insan" class="ticket-logo" style="background:#fff; border-radius:8px; padding:4px; height:50px; width:auto; object-fit:contain;">
            <div>
              <div class="ticket-header-title">KARTU TANDA PESERTA SPMB</div>
              <div class="ticket-header-sub">SEKOLAH ISLAM TERPADU BINA INSAN PAREPARE • TP ${acYear}</div>
            </div>
          </div>
          <div class="ticket-reg-badge">
            <div class="ticket-reg-label">NOMOR REGISTRASI</div>
            <div class="ticket-reg-number">${record.regNumber}</div>
          </div>
        </div>

        <div class="ticket-body">
          <!-- Status Ribbon -->
          <div class="ticket-status-ribbon">
            <div>
              <span style="font-size:0.8rem; color:var(--neutral-500); text-transform:uppercase; font-weight:700;">Status Berkas:</span>
              <div style="font-size:1.05rem; font-weight:800; color:var(--primary-800);">${record.status}</div>
            </div>
            <span class="ticket-status-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              TERDAFTAR RESMI
            </span>
          </div>

          <!-- Info Grid -->
          <div class="ticket-info-grid">
            <table class="ticket-details-table">
              <tr>
                <td>Jenjang Pilihan:</td>
                <td><strong>${jenjangTitle}</strong></td>
              </tr>
              <tr>
                <td>Jalur Pendaftaran:</td>
                <td><span class="badge-tag">${record.jalur.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td>Nama Calon Siswa:</td>
                <td><strong style="font-size:1.05rem; color:var(--primary-900);">${escapeHtml(record.namaSiswa)}</strong></td>
              </tr>
              <tr>
                <td>NIK / No. KK:</td>
                <td>${escapeHtml(record.nik)}</td>
              </tr>
              <tr>
                <td>Tempat, Tgl Lahir:</td>
                <td>${escapeHtml(record.ttl)}</td>
              </tr>
              <tr>
                <td>Jenis Kelamin:</td>
                <td>${escapeHtml(record.jk)}</td>
              </tr>
              <tr>
                <td>Nama Orang Tua:</td>
                <td>${escapeHtml(record.namaAyah)} / ${escapeHtml(record.namaIbu)}</td>
              </tr>
              <tr>
                <td>No. WhatsApp Wali:</td>
                <td>${escapeHtml(record.waAyah)}</td>
              </tr>
              <tr>
                <td>Jadwal Observasi & Tes:</td>
                <td><strong style="color:var(--accent-700);">${record.jadwalObservasi}</strong></td>
              </tr>
            </table>

            <div class="ticket-qr-box">
              <svg class="ticket-qr-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- QR Code Pattern Mockup -->
                <rect width="120" height="120" rx="8" fill="#ffffff"/>
                <!-- Corner 1 -->
                <rect x="8" y="8" width="34" height="34" rx="4" fill="#002f9b"/>
                <rect x="14" y="14" width="22" height="22" rx="2" fill="#ffffff"/>
                <rect x="19" y="19" width="12" height="12" fill="#002f9b"/>
                <!-- Corner 2 -->
                <rect x="78" y="8" width="34" height="34" rx="4" fill="#002f9b"/>
                <rect x="84" y="14" width="22" height="22" rx="2" fill="#ffffff"/>
                <rect x="89" y="19" width="12" height="12" fill="#002f9b"/>
                <!-- Corner 3 -->
                <rect x="8" y="78" width="34" height="34" rx="4" fill="#002f9b"/>
                <rect x="14" y="84" width="22" height="22" rx="2" fill="#ffffff"/>
                <rect x="19" y="89" width="12" height="12" fill="#002f9b"/>
                <!-- Data Blocks -->
                <rect x="48" y="14" width="8" height="8" fill="#0f172a"/>
                <rect x="60" y="24" width="10" height="8" fill="#0f172a"/>
                <rect x="48" y="38" width="14" height="6" fill="#0f172a"/>
                <rect x="68" y="48" width="8" height="16" fill="#0f172a"/>
                <rect x="14" y="48" width="16" height="8" fill="#0f172a"/>
                <rect x="36" y="58" width="8" height="8" fill="#0f172a"/>
                <rect x="52" y="60" width="10" height="10" fill="#0f172a"/>
                <rect x="48" y="84" width="12" height="8" fill="#0f172a"/>
                <rect x="68" y="78" width="8" height="14" fill="#0f172a"/>
                <rect x="84" y="68" width="10" height="10" fill="#0f172a"/>
                <rect x="100" y="84" width="10" height="8" fill="#0f172a"/>
                <rect x="84" y="98" width="16" height="10" fill="#0f172a"/>
                <rect x="52" y="100" width="12" height="8" fill="#0f172a"/>
              </svg>
              <div style="font-weight:700; font-size:0.8rem; color:var(--neutral-800); margin-bottom:4px;">VERIFIKASI PANITIA</div>
              <div class="ticket-qr-note">Scan untuk validasi data peserta di posko SPMB Parepare.</div>
            </div>
          </div>

          <!-- Petunjuk -->
          <div class="ticket-instructions">
            <div class="ticket-inst-title">Petunjuk Langkah Selanjutnya:</div>
            <ol class="ticket-inst-list">
              <li>Silakan simpan atau cetak kartu ini sebagai bukti pendaftaran resmi saat hadir observasi/wawancara.</li>
              <li>Konfirmasi pembayaran biaya pendaftaran via WhatsApp Panitia SPMB di <strong>${SchoolData.profile.whatsapp}</strong> dengan mengirimkan foto bukti transfer dan nomor registrasi <strong>${record.regNumber}</strong>.</li>
              <li>Hadir di sekolah SIT Bina Insan Parepare tepat waktu sesuai jadwal observasi yang tertera di atas.</li>
              <li>Membawa fotokopi Akta Kelahiran, Kartu Keluarga (KK), dan pas foto 3x4 (2 lembar).</li>
            </ol>
          </div>

          <!-- Action Buttons -->
          <div class="ticket-actions-bar">
            <button type="button" class="btn btn-primary btn-lg" onclick="window.print()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Cetak Kartu Tanda Peserta (PDF)
            </button>
            <a href="https://wa.me/${SchoolData.profile.whatsappHelpdesk}?text=${encodeURIComponent('Assalamu\'alaikum Panitia SPMB SIT Bina Insan Parepare, saya telah mendaftar dengan Nomor Registrasi: ' + record.regNumber + ' atas nama ananda: ' + record.namaSiswa + '. Mohon petunjuk konfirmasi selanjutnya.')}" target="_blank" rel="noopener noreferrer" class="btn btn-accent btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>
              Konfirmasi WhatsApp Panitia
            </a>
            <button type="button" class="btn btn-outline-primary" id="btn-register-again">
              Daftarkan Siswa Lainnya
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook 'Daftarkan Siswa Lainnya'
    document.getElementById('btn-register-again')?.addEventListener('click', () => {
      resetRegistrationForm();
    });
  }

  // Handle Form Submission
  async function submitRegistration() {
    const jenjangVal = document.querySelector('input[name="jenjang"]:checked').value;
    const jalurVal = document.querySelector('input[name="jalur"]:checked').value;
    
    const namaSiswa = document.getElementById('siswa_nama').value.trim();
    const nik = document.getElementById('siswa_nik').value.trim();
    const tempatLahir = document.getElementById('siswa_tempat_lahir').value.trim();
    const tglLahir = document.getElementById('siswa_tgl_lahir').value;
    const jk = document.querySelector('input[name="siswa_jk"]:checked').value;
    const asalSekolah = document.getElementById('siswa_asal_sekolah').value.trim();
    const alamat = document.getElementById('siswa_alamat').value.trim();

    const namaAyah = document.getElementById('ortu_nama_ayah').value.trim();
    const pekAyah = document.getElementById('ortu_pek_ayah').value.trim();
    const waAyah = document.getElementById('ortu_wa').value.trim();
    const namaIbu = document.getElementById('ortu_nama_ibu').value.trim();
    const email = document.getElementById('ortu_email').value.trim();

    const hafalan = document.getElementById('siswa_hafalan').value.trim() || 'Belum ada hafalan';
    const prestasi = document.getElementById('siswa_prestasi').value.trim() || '-';

    // Generate unique registration number
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const count = existing.length + 1;
    const padCount = String(count).padStart(3, '0');
    const prefix = jenjangVal.toUpperCase().substring(0, 2);

    let yearPrefix = '2025';
    let currentWave = 'Gelombang 1';
    try {
      const raw = localStorage.getItem('sit_bina_insan_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.academicYear) yearPrefix = s.academicYear.split('/')[0].trim();
        const act = (s.activeWave || 'wave1').toLowerCase();
        if (act === 'wave2' || act.includes('gelombang 2')) currentWave = s.wave2Name || 'Gelombang 2';
        else if (act === 'wave3' || act.includes('gelombang 3')) currentWave = s.wave3Name || 'Gelombang 3';
        else if (s.wave1Name) currentWave = s.wave1Name;
      }
    } catch (e) {}

    const regNumber = `SPMB-${yearPrefix}-${prefix}${padCount}`;

    // Assign observation schedule based on jenjang
    let jadwalObservasi = 'Sabtu, 15 Maret 2025 | Pukul 08.30 WITA | Gedung Sekolah SIT Bina Insan';
    if (jenjangVal === 'tkit') {
      jadwalObservasi = 'Sabtu, 8 Maret 2025 | Pukul 09.00 WITA | Sentra PAUD TKIT Bina Insan';
    } else if (jenjangVal === 'smpit') {
      jadwalObservasi = 'Sabtu, 22 Maret 2025 | Pukul 08.00 WITA | Aula Utama SMPIT Bina Insan';
    }

    const newRecord = {
      regNumber,
      jenjang: jenjangVal,
      jalur: jalurVal,
      namaSiswa,
      nik,
      ttl: `${tempatLahir}, ${tglLahir}`,
      jk,
      asalSekolah,
      alamat,
      namaAyah,
      pekerjaanAyah: pekAyah,
      waAyah,
      namaIbu,
      email,
      hafalan,
      prestasi,
      gelombang: currentWave,
      tanggalDaftar: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WITA',
      status: 'Menunggu Konfirmasi Pembayaran',
      jadwalObservasi
    };

    let savedRecord;
    try {
      const response = await fetch('api/spmb.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      const result = await response.json();
      if (!response.ok || !result || !result.success || !result.data) {
        throw new Error(result?.message || 'Pendaftaran gagal disimpan ke database.');
      }
      savedRecord = result.data;
    } catch (error) {
      alert(`Pendaftaran belum tersimpan. ${error.message}\n\nSilakan periksa koneksi lalu coba kembali.`);
      return;
    }

    const existingIndex = existing.findIndex(r => r.nik === savedRecord.nik || r.regNumber === savedRecord.regNumber);
    if (existingIndex !== -1) existing[existingIndex] = savedRecord;
    else existing.unshift(savedRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    try {
      const ch = new BroadcastChannel('sit_spmb_realtime');
      ch.postMessage({ type: 'spmb_new_registration', data: savedRecord, timestamp: Date.now() });
      ch.close();
    } catch (e) {}

    generateTicket(savedRecord);

    // Switch view
    formCard.style.display = 'none';
    stepTracker.style.display = 'none';
    successView.classList.add('active');
    successView.scrollIntoView({ behavior: 'smooth' });
  }

  function resetRegistrationForm() {
    if (regForm) regForm.reset();
    currentStep = 1;
    updateStepUI();
    formCard.style.display = 'block';
    stepTracker.style.display = 'flex';
    successView.classList.remove('active');
  }

  // Cek Status Logic
  function initCheckStatus() {
    const searchForm = document.getElementById('form-check-status');
    const searchInput = document.getElementById('check-status-input');
    const resultWrap = document.getElementById('check-result-container');

    if (!searchForm || !searchInput || !resultWrap) return;

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim().toUpperCase();
      if (!query) return;

      resultWrap.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--neutral-600);">
          <div style="font-weight:700; margin-bottom:0.5rem;">Sedang menelusuri database sekolah...</div>
          <div style="font-size:0.85rem;">Mencari data untuk <strong>${escapeHtml(query)}</strong></div>
        </div>
      `;

      // 1. Coba cari di API MySQL terlebih dahulu
      fetch(`api/spmb.php?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(apiData => {
          if (apiData && apiData.success && apiData.data) {
            renderSearchResult(apiData.data);
          } else {
            // Cek di LocalStorage jika di database MySQL tidak ada
            checkLocalStorageFallback(query);
          }
        })
        .catch(() => {
          // Fallback ke LocalStorage jika API offline / hosting statis
          checkLocalStorageFallback(query);
        });
    });

    function checkLocalStorageFallback(query) {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const found = records.find(r => r.regNumber.toUpperCase() === query || r.nik === query);
      if (found) {
        renderSearchResult(found);
      } else {
        resultWrap.innerHTML = `
          <div class="check-not-found">
            <div style="font-size:2.5rem; margin-bottom:0.5rem; color:var(--neutral-400);"><i class="fa-solid fa-magnifying-glass"></i></div>
            <h4 style="font-weight:800; color:var(--neutral-900); margin-bottom:0.4rem;">Data Tidak Ditemukan</h4>
            <p style="color:var(--neutral-600); font-size:0.9rem; max-width:480px; margin-inline:auto;">
              Nomor Registrasi atau NIK <strong>"${escapeHtml(query)}"</strong> belum terdaftar dalam sistem SPMB SIT Bina Insan Parepare.
            </p>
            <div style="margin-top:1.25rem;">
              <a href="https://wa.me/${SchoolData.profile.whatsappHelpdesk}?text=${encodeURIComponent('Assalamu\'alaikum Panitia SPMB, saya ingin mengecek status pendaftaran dengan nomor/NIK: ' + query)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">
                Tanyakan ke Helpdesk WhatsApp
              </a>
            </div>
          </div>
        `;
      }
    }

    function renderSearchResult(found) {
      let jenjangTitle = 'TKIT Bina Insan';
      if (found.jenjang === 'sdit') jenjangTitle = 'SDIT Bina Insan';
      if (found.jenjang === 'smpit') jenjangTitle = 'SMPIT Bina Insan';

      resultWrap.innerHTML = `
        <div style="background:#ffffff; border-radius:var(--radius-lg); border:2px solid var(--primary-600); padding:2rem; box-shadow:var(--shadow-lg);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--neutral-200);">
            <div>
              <span class="badge-tag" style="margin-bottom:0.25rem;">HASIL PENELUSURAN DITEMUKAN</span>
              <h3 style="font-size:1.35rem; font-weight:800; color:var(--neutral-900);">${escapeHtml(found.namaSiswa)}</h3>
              <div style="font-size:0.9rem; color:var(--neutral-600);">No. Registrasi: <strong style="color:var(--primary-700);">${found.regNumber}</strong></div>
            </div>
            <div style="text-align:right;">
              <span class="ticket-status-pill" style="font-size:0.9rem;">
                ${found.status}
              </span>
            </div>
          </div>

          <table class="review-table">
            <tr><td>Jenjang Pendidikan:</td><td><strong>${jenjangTitle} (${(found.jalur || 'reguler').toUpperCase()})</strong></td></tr>
            <tr><td>NIK / No. KK:</td><td>${escapeHtml(found.nik)}</td></tr>
            <tr><td>Tempat, Tgl Lahir:</td><td>${escapeHtml(found.ttl)}</td></tr>
            <tr><td>Asal Sekolah:</td><td>${escapeHtml(found.asalSekolah)}</td></tr>
            <tr><td>Nama Orang Tua/Wali:</td><td>${escapeHtml(found.namaAyah)} / ${escapeHtml(found.namaIbu)}</td></tr>
            <tr><td>No. WhatsApp:</td><td>${escapeHtml(found.waAyah)}</td></tr>
            <tr><td>Tanggal Mendaftar:</td><td>${found.tanggalDaftar}</td></tr>
            <tr><td>Jadwal Observasi:</td><td><strong style="color:var(--accent-700);">${found.jadwalObservasi}</strong></td></tr>
          </table>

          <div style="margin-top:1.5rem; display:flex; gap:1rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" id="btn-show-ticket-from-check">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Lihat & Cetak Kartu Tanda Peserta
            </button>
            <a href="https://wa.me/${SchoolData.profile.whatsappHelpdesk}?text=${encodeURIComponent('Assalamu\'alaikum Admin SPMB, saya mengecek status registrasi ' + found.regNumber + ' an. ' + found.namaSiswa + '. Mohon informasi selanjutnya.')}" target="_blank" rel="noopener noreferrer" class="btn btn-accent">
              Hubungi Panitia SPMB
            </a>
          </div>
        </div>
      `;

      document.getElementById('btn-show-ticket-from-check')?.addEventListener('click', () => {
        generateTicket(found);
        const pendaftaranTabBtn = document.querySelector('.spmb-tab-btn[data-tab="form"]');
        if (pendaftaranTabBtn) pendaftaranTabBtn.click();
        formCard.style.display = 'none';
        stepTracker.style.display = 'none';
        successView.classList.add('active');
        successView.scrollIntoView({ behavior: 'smooth' });
      });
      resultWrap.classList.add('active');
    }
  }

  // Pre-select jenjang when navigating from jenjang page CTA
  window.selectJenjangSpmb = function (jenjangId) {
    // Open SPMB view
    window.location.hash = '#spmb';
    
    // Simpan pilihan jenjang
    window.spmbSelectedJenjang = jenjangId || 'sdit';

    // Langsung buka modal popup pendaftaran
    setTimeout(() => {
      if (typeof window.openSpmbModal === 'function') {
        window.openSpmbModal('register');
      }
    }, 60);
  };

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialization
  function init() {
    initSpmbTabs();
    initCheckStatus();

    // Navigation buttons
    nextBtn?.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++;
          updateStepUI();
        }
      }
    });

    prevBtn?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    });

    submitBtn?.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        submitRegistration();
      }
    });

    // Step tracker click
    stepTracker?.querySelectorAll('.step-item').forEach((item, idx) => {
      item.addEventListener('click', () => {
        const targetStep = idx + 1;
        // Only allow clicking to past steps or current step
        if (targetStep < currentStep) {
          currentStep = targetStep;
          updateStepUI();
        } else if (targetStep > currentStep) {
          // Validate current before jumping
          if (validateStep(currentStep)) {
            currentStep = targetStep;
            updateStepUI();
          }
        }
      });
    });

    // Update Initial UI
    updateStepUI();

    // Initialize Parent Portal & Real-time engine
    initParentPortalEngine();
  }

  // =========================================================================
  // PARENT PORTAL & POPUP MODAL ENGINE (NEW SPMB WORKFLOW)
  // =========================================================================
  const PARENT_SESSION_KEY = 'sit_active_parent_session';
  const PARENT_BIODATA_VIEW_KEY = 'sit_parent_biodata_view';
  let tempProofBase64 = null;
  let spmbModalMode = 'register';
  let realtimeChannel = null;

  try {
    realtimeChannel = new BroadcastChannel('sit_spmb_realtime');
    realtimeChannel.onmessage = function (event) {
      const msg = event.data;
      if (!msg) return;

      // When admin approves payment or updates SPMB data
      if (msg.type === 'spmb_payment_approved' || msg.type === 'spmb_updated') {
        const rawSession = localStorage.getItem(PARENT_SESSION_KEY);
        if (rawSession) {
          try {
            const session = JSON.parse(rawSession);
            // Refresh parent portal
            renderParentPortal();

            // Check if this approval was for the current active parent
            if (msg.data && (msg.data.waAyah === session.wa || msg.data.wa_ayah === session.wa || msg.data.targetWa === session.wa)) {
              alert(`Alhamdulillah! Pembayaran pendaftaran Anda telah DISETUJUI oleh Admin.\n\nKode Pendaftaran Siswa Resmi Anda: ${msg.data.regNumber || msg.data.newRegNumber || 'Telah Terbit'}`);
            }
          } catch (e) {}
        }
      }
    };
  } catch (e) {
    console.log('BroadcastChannel fallback for SPMB parent portal');
  }

  // Also listen to storage events for cross-tab sync
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY || e.key === PARENT_SESSION_KEY) {
      renderParentPortal();
    }
  });

  // Re-render portal when navigating to #spmb
  window.addEventListener('hashchange', function () {
    if (window.location.hash === '#spmb') {
      renderParentPortal();
    }
  });

  function initParentPortalEngine() {
    renderParentPortal();
    refreshParentFromDatabase();
    setInterval(refreshParentFromDatabase, 30000);
    setInterval(refreshScheduleSettings, 10000);
    window.addEventListener('focus', refreshParentFromDatabase);
    const bioForm = document.getElementById('portal-student-bio-form');
    bioForm?.addEventListener('input', () => {
      bioForm.dataset.dirty = '1';
      const status = document.getElementById('portal-bio-status');
      if (status) {
        status.textContent = 'Perubahan belum disimpan.';
        status.className = 'portal-bio-status';
      }
    });
    const birthDate = document.getElementById('bio-tanggal-lahir');
    if (birthDate) birthDate.max = new Date().toISOString().slice(0, 10);

    // Dropzone drag and drop setup
    const dropzone = document.getElementById('portal-upload-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
          processProofFile(files[0]);
        }
      }, false);
    }

    const prestasiInput = document.getElementById('bio-prestasi');
    if (prestasiInput) {
      prestasiInput.addEventListener('input', updateSertifikatVisibility);
    }
    const sertifikatInput = document.getElementById('bio-sertifikat');
    if (sertifikatInput) {
      sertifikatInput.addEventListener('change', handleSertifikatFile);
    }
    const sertifikatRemoveBtn = document.getElementById('bio-sertifikat-remove');
    if (sertifikatRemoveBtn) {
      sertifikatRemoveBtn.addEventListener('click', removeSertifikatFile);
    }
    const sertifikatLink = document.getElementById('bio-sertifikat-link');
    if (sertifikatLink) {
      sertifikatLink.addEventListener('click', (e) => {
        e.preventDefault();
        const data = document.getElementById('bio-sertifikat-data')?.value;
        if (!data) return;
        if (data.startsWith('data:')) {
          const parts = data.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const binary = atob(parts[1]);
          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
          const blob = new Blob([array], { type: mime });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          window.open(data, '_blank');
        }
      });
    }
  }

  function handleSertifikatFile(e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Mohon pilih file gambar (JPG, PNG, WEBP) atau PDF.');
      e.target.value = '';
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file sertifikat terlalu besar (maksimal 2,5 MB).');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function (evt) {
      const dataUrl = evt.target.result;
      const dataInput = document.getElementById('bio-sertifikat-data');
      if (dataInput) dataInput.value = dataUrl;
      const previewBox = document.getElementById('bio-sertifikat-preview-box');
      const previewLink = document.getElementById('bio-sertifikat-link');
      const nameEl = document.getElementById('bio-sertifikat-name');
      if (previewBox) previewBox.style.display = 'block';
      if (previewLink) previewLink.href = dataUrl;
      if (nameEl) nameEl.textContent = file.name;
      const bioForm = document.getElementById('portal-student-bio-form');
      if (bioForm) {
        bioForm.dataset.dirty = '1';
        const status = document.getElementById('portal-bio-status');
        if (status) {
          status.textContent = 'Perubahan belum disimpan.';
          status.className = 'portal-bio-status';
        }
      }
    };
    reader.readAsDataURL(file);
  }

  function removeSertifikatFile() {
    const fileInput = document.getElementById('bio-sertifikat');
    const dataInput = document.getElementById('bio-sertifikat-data');
    const previewBox = document.getElementById('bio-sertifikat-preview-box');
    const previewLink = document.getElementById('bio-sertifikat-link');
    if (fileInput) fileInput.value = '';
    if (dataInput) dataInput.value = '';
    if (previewBox) previewBox.style.display = 'none';
    if (previewLink) previewLink.href = '#';
    const bioForm = document.getElementById('portal-student-bio-form');
    if (bioForm) {
      bioForm.dataset.dirty = '1';
      const status = document.getElementById('portal-bio-status');
      if (status) {
        status.textContent = 'Perubahan belum disimpan.';
        status.className = 'portal-bio-status';
      }
    }
    updateSertifikatVisibility();
  }

  function updateSertifikatVisibility() {
    const val = (document.getElementById('bio-prestasi')?.value || '').trim().toLowerCase();
    const hasCert = Boolean(document.getElementById('bio-sertifikat-data')?.value.trim());
    const isNoPrestasi = !val || ['-', 'tidak ada', 'belum ada', 'tidak', 'belum', 'none', 'nihil'].includes(val);
    const group = document.getElementById('group-bio-sertifikat');
    if (group) {
      group.style.display = (!isNoPrestasi || hasCert) ? 'block' : 'none';
    }
  }

  // Open Modal Popup
  window.openSpmbModal = function (mode = 'register') {
    const modal = document.getElementById('modal-spmb-register');
    if (!modal) return;

    window.setSpmbModalMode(mode);

    // If parent is already logged in, navigate straight to portal
    const rawSession = localStorage.getItem(PARENT_SESSION_KEY);
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session && session.wa) {
          renderParentPortal();
          window.location.hash = '#spmb';
          return;
        }
      } catch (e) {}
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus input
    setTimeout(() => {
      if (mode === 'register') {
        document.getElementById('spmb-input-nama')?.focus();
      } else {
        document.getElementById('spmb-input-wa')?.focus();
      }
    }, 150);
  };

  // Close Modal Popup
  window.closeSpmbModal = function () {
    const modal = document.getElementById('modal-spmb-register');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
    const errEl = document.getElementById('spmb-modal-error');
    if (errEl) errEl.style.display = 'none';
  };

  // Set Modal Mode (Register vs Login)
  window.setSpmbModalMode = function (mode) {
    spmbModalMode = mode;
    const tabReg = document.getElementById('tab-modal-register');
    const tabLog = document.getElementById('tab-modal-login');
    const groupNama = document.getElementById('group-modal-nama');
    const inputNama = document.getElementById('spmb-input-nama');
    const titleEl = document.getElementById('spmb-modal-title');
    const subtitleEl = document.getElementById('spmb-modal-subtitle');
    const btnText = document.getElementById('btn-auth-text');
    const errEl = document.getElementById('spmb-modal-error');

    if (errEl) errEl.style.display = 'none';

    if (mode === 'register') {
      tabReg?.classList.add('active');
      tabLog?.classList.remove('active');
      if (groupNama) groupNama.style.display = 'block';
      if (inputNama) inputNama.required = true;
      if (titleEl) titleEl.textContent = 'Pendaftaran SPMB Online';
      if (subtitleEl) subtitleEl.textContent = 'Masukkan Nama dan WhatsApp untuk memulai pendaftaran';
      if (btnText) btnText.textContent = 'Lanjutkan ke Portal SPMB ›';
    } else {
      tabReg?.classList.remove('active');
      tabLog?.classList.add('active');
      if (groupNama) groupNama.style.display = 'none';
      if (inputNama) inputNama.required = false;
      if (titleEl) titleEl.textContent = 'Masuk ke Portal SPMB';
      if (subtitleEl) subtitleEl.textContent = 'Masukkan Nomor WhatsApp yang telah Anda daftarkan';
      if (btnText) btnText.textContent = 'Masuk ke Portal Saya ›';
    }
  };

  // Handle Form Submit for Parent Registration / Login
  window.handleParentAuthSubmit = async function (e) {
    e.preventDefault();
    const errEl = document.getElementById('spmb-modal-error');
    const nama = document.getElementById('spmb-input-nama')?.value.trim() || '';
    const rawWa = document.getElementById('spmb-input-wa')?.value.trim() || '';
    const cleanWa = rawWa.replace(/[^0-9]/g, '');

    if (cleanWa.length < 9) {
      if (errEl) {
        errEl.textContent = 'Nomor WhatsApp tidak valid. Masukkan minimal 10 digit angka.';
        errEl.style.display = 'block';
      }
      return;
    }

    if (spmbModalMode === 'register' && nama.length < 2) {
      if (errEl) {
        errEl.textContent = 'Nama lengkap orang tua / wali wajib diisi.';
        errEl.style.display = 'block';
      }
      return;
    }

    // Get existing records
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (err) {
      records = [];
    }

    // Look for matching record by WhatsApp
    let existing = records.find(r => {
      const rw = (r.waAyah || '').replace(/[^0-9]/g, '');
      return rw === cleanWa || (cleanWa.length >= 9 && rw.endsWith(cleanWa.slice(-9)));
    });

    if (spmbModalMode === 'login') {
      // Try checking database API
      if (window.fetch) {
        fetch(`api/spmb.php?wa=${encodeURIComponent(rawWa)}`)
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.success && resData.data) {
              const row = resData.data;
              records.unshift(row);
              cacheSetItem(STORAGE_KEY, JSON.stringify(records));
              const parentData = { nama: row.namaAyah || 'Orang Tua Siswa', wa: row.waAyah || rawWa };
              localStorage.setItem(PARENT_SESSION_KEY, JSON.stringify(parentData));
              window.closeSpmbModal();
              window.location.hash = '#spmb';
              renderParentPortal();
            } else {
              if (errEl) {
                errEl.innerHTML = `Nomor WhatsApp <strong>${rawWa}</strong> belum terdaftar. Silakan klik tab <strong>Daftar Baru</strong> untuk memulai pendaftaran.`;
                errEl.style.display = 'block';
              }
            }
          })
          .catch(() => {
            if (errEl) {
              errEl.innerHTML = `Nomor WhatsApp <strong>${rawWa}</strong> belum terdaftar. Silakan pilih tab <strong>Daftar Baru</strong>.`;
              errEl.style.display = 'block';
            }
          });
        return;
      }
    }

    // REGISTER MODE: Create or update parent record
    if (!existing) {
      const tempReg = 'PENDING-' + cleanWa.slice(-4) + '-' + Math.floor(100 + Math.random() * 900);
      existing = {
        regNumber: tempReg,
        jenjang: window.spmbSelectedJenjang || 'sdit',
        jalur: 'reguler',
        namaSiswa: 'Calon Siswa (' + nama + ')',
        nik: 'WA-' + cleanWa,
        ttl: '',
        jk: '',
        asalSekolah: '',
        alamat: '',
        namaAyah: nama,
        pekerjaanAyah: '-',
        waAyah: rawWa,
        namaIbu: '',
        pekerjaanIbu: '-',
        email: '-',
        hafalan: '-',
        prestasi: '-',
        tanggalDaftar: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
        status: 'Menunggu Pembayaran Uang Pendaftaran (Rp 150.000)',
        nominalPembayaran: 150000,
        buktiPembayaran: null,
        jadwalObservasi: 'Menunggu verifikasi pembayaran'
      };
      records.unshift(existing);
    } else {
      // Update name if changed
      if (nama) existing.namaAyah = nama;
    }

    try {
      const response = await fetch('api/spmb.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing)
      });
      const result = await response.json();
      if (!response.ok || !result || !result.success || !result.data) {
        throw new Error(result?.message || 'Pendaftaran gagal disimpan ke database.');
      }
      const recordIndex = records.indexOf(existing);
      if (recordIndex !== -1) records[recordIndex] = result.data;
      existing = result.data;
      cacheSetItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      if (errEl) {
        errEl.textContent = `Pendaftaran belum tersimpan: ${error.message}`;
        errEl.style.display = 'block';
      }
      return;
    }

    const parentData = { nama: existing.namaAyah || nama, wa: existing.waAyah || rawWa };
    localStorage.setItem(PARENT_SESSION_KEY, JSON.stringify(parentData));

    // Broadcast realtime event to admin dashboard
    if (realtimeChannel) {
      try {
        realtimeChannel.postMessage({ type: 'spmb_new_registration', data: existing, timestamp: Date.now() });
      } catch (e) {}
    }

    window.closeSpmbModal();
    window.location.hash = '#spmb';
    renderParentPortal();
    setTimeout(() => {
      const portal = document.getElementById('spmb-parent-portal');
      if (portal) {
        portal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 80);
  };

  async function refreshParentFromDatabase() {
    if (document.hidden) return;
    refreshScheduleSettings();
    try {
      const session = JSON.parse(localStorage.getItem(PARENT_SESSION_KEY) || 'null');
      if (!session?.wa) return;
      const response = await fetch(`api/spmb.php?wa=${encodeURIComponent(session.wa)}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) return;
      cacheSetItem(STORAGE_KEY, JSON.stringify([result.data]));
      renderParentPortal();
    } catch (_) { /* Keep the last confirmed view during a temporary outage. */ }
  }

  function populateStudentBioForm(record) {
    const form = document.getElementById('portal-student-bio-form');
    const key = String(record.id || record.regNumber || '');
    if (!form || (form.dataset.recordKey === key && form.dataset.dirty === '1')) return;
    const saved = Boolean(record.biodataUpdatedAt || (/^\d{16}$/.test(record.nik || '') && record.tanggalLahir));
    const student = saved ? record : {};
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };
    set('bio-jenjang', student.jenjang);
    set('bio-jalur', 'reguler');
    set('bio-nama', student.namaSiswa);
    set('bio-jk', student.jk);
    set('bio-nik', student.nik);
    set('bio-tempat-lahir', student.tempatLahir);
    set('bio-tanggal-lahir', student.tanggalLahir);
    set('bio-asal-sekolah', student.asalSekolah === '-' ? '' : student.asalSekolah);
    set('bio-alamat-asal-sekolah', student.alamatAsalSekolah);
    set('bio-agama', student.agama);
    set('bio-kewarganegaraan', student.kewarganegaraan);
    set('bio-alamat', student.alamat);
    set('bio-hafalan', student.hafalan === '-' ? '' : student.hafalan);
    set('bio-prestasi', student.prestasi === '-' ? '' : student.prestasi);
    set('bio-sertifikat-data', student.sertifikatPrestasi || '');
    const certInput = document.getElementById('bio-sertifikat');
    if (certInput) certInput.value = '';
    const previewBox = document.getElementById('bio-sertifikat-preview-box');
    const previewLink = document.getElementById('bio-sertifikat-link');
    const nameEl = document.getElementById('bio-sertifikat-name');
    if (student.sertifikatPrestasi) {
      if (previewBox) previewBox.style.display = 'block';
      if (previewLink) previewLink.href = student.sertifikatPrestasi;
      if (nameEl) nameEl.textContent = 'Sertifikat Prestasi Terunggah';
    } else {
      if (previewBox) previewBox.style.display = 'none';
      if (previewLink) previewLink.href = '#';
    }
    updateSertifikatVisibility();
    for (const field of ["tempatTinggal","modaTransportasi","anakKe","tinggiBadan","beratBadan","hobi","citaCita","jumlahSaudaraKandung","jarakRumahSekolah","saudaraDiSekolah"]) {
      const input = document.getElementById('bio-' + field);
      if (input) input.value = student[field] ?? '';
      else form.querySelectorAll('input[name="bio-' + field + '"]').forEach(radio => {
        radio.checked = radio.value === student[field];
      });
    }
    window.StudentRegions?.populate(student, key);
    form.dataset.recordKey = key;
    form.dataset.dirty = '0';
    const complete = /^\d{16}$/.test(record.nik || '') && Boolean(record.namaSiswa && record.tanggalLahir);
    const status = document.getElementById('portal-bio-status');
    const submit = document.getElementById('portal-bio-submit');
    if (status) {
      status.textContent = complete ? '✓ Biodata siswa sudah tersimpan di database.' : 'Pastikan seluruh data wajib sudah benar.';
      status.className = `portal-bio-status${complete ? ' is-success' : ''}`;
    }
    if (submit) submit.innerHTML = 'Isi Data Selanjutnya <span aria-hidden="true">→</span>';
  }

  window.switchBiodataSubstep = function (target) {
    const studentSec = document.getElementById('portal-section-student-bio');
    const parentSec = document.getElementById('portal-state-parents');
    const tabStudent = document.getElementById('tab-substep-student');
    const tabParent = document.getElementById('tab-substep-parent');
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim() ||
      document.getElementById('portal-sched-reg')?.textContent?.trim();

    if (target === 'parent') {
      if (studentSec) studentSec.style.display = 'none';
      if (parentSec) parentSec.style.display = 'block';
      if (tabStudent) {
        tabStudent.classList.remove('active');
        tabStudent.setAttribute('aria-selected', 'false');
      }
      if (tabParent) {
        tabParent.classList.add('active');
        tabParent.setAttribute('aria-selected', 'true');
      }
      if (regNumber) {
        try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':parents'); } catch (_) {}
      }
    } else {
      if (studentSec) studentSec.style.display = 'block';
      if (parentSec) parentSec.style.display = 'none';
      if (tabStudent) {
        tabStudent.classList.add('active');
        tabStudent.setAttribute('aria-selected', 'true');
      }
      if (tabParent) {
        tabParent.classList.remove('active');
        tabParent.setAttribute('aria-selected', 'false');
      }
      if (regNumber) {
        try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber); } catch (_) {}
      }
    }
    requestAnimationFrame(() => {
      document.getElementById('portal-state-biodata')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.submitStudentBiodata = async function (event) {
    if (event?.preventDefault) event.preventDefault();
    const form = event?.currentTarget || document.getElementById('portal-student-bio-form');
    if (form && !form.reportValidity()) return false;
    const status = document.getElementById('portal-bio-status');
    const submit = document.getElementById('portal-bio-submit');
    let session;
    if (!window.StudentRegions?.isComplete()) {
      if (status) {
        status.textContent = 'Pilih provinsi, kabupaten/kota, kecamatan, dan desa/kelurahan terlebih dahulu.';
        status.className = 'portal-bio-status is-error';
      }
      return false;
    }
    let records;
    try {
      session = JSON.parse(localStorage.getItem(PARENT_SESSION_KEY) || 'null');
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {}
    const cleanWa = String(session?.wa || '').replace(/\D/g, '');
    const record = Array.isArray(records) ? records.find(item => {
      const itemWa = String(item.waAyah || '').replace(/\D/g, '');
      return itemWa === cleanWa || (cleanWa.length >= 9 && itemWa.endsWith(cleanWa.slice(-9)));
    }) : null;
    if (!record?.regNumber || record.regNumber.startsWith('PENDING-')) {
      if (status) {
        status.textContent = 'Kode pendaftaran resmi belum tersedia. Tunggu persetujuan admin.';
        status.className = 'portal-bio-status is-error';
      }
      return false;
    }
    const value = id => document.getElementById(id)?.value.trim() || '';
    const payload = {
      action: 'save_biodata', regNumber: record.regNumber,
      waAyah: session.wa, namaAyah: record.namaAyah || session.nama || '',
      jenjang: value('bio-jenjang'), jalur: value('bio-jalur'), namaSiswa: value('bio-nama'),
      jk: value('bio-jk'), nik: value('bio-nik'), tempatLahir: value('bio-tempat-lahir'),
      tanggalLahir: value('bio-tanggal-lahir'),
      asalSekolah: value('bio-asal-sekolah'), agama: value('bio-agama'),
      alamatAsalSekolah: value('bio-alamat-asal-sekolah'),
      kewarganegaraan: value('bio-kewarganegaraan'), alamat: value('bio-alamat'),
      desaKelurahan: value('bio-desa'), kecamatan: value('bio-kecamatan'),
      kabupatenKota: value('bio-kabupaten'), provinsi: value('bio-provinsi'),
      hafalan: value('bio-hafalan') || 'Belum ada',
      prestasi: value('bio-prestasi') || '-',
      sertifikatPrestasi: value('bio-sertifikat-data')
    };
    for (const field of ["tempatTinggal","modaTransportasi","anakKe","tinggiBadan","beratBadan","hobi","citaCita","jumlahSaudaraKandung","jarakRumahSekolah","saudaraDiSekolah"]) {
      payload[field] = document.getElementById('bio-' + field)?.value.trim()
        ?? form?.querySelector('input[name="bio-' + field + '"]:checked')?.value ?? '';
    }
    if (submit) submit.disabled = true;
    if (status) {
      status.textContent = 'Menyimpan biodata ke database...';
      status.className = 'portal-bio-status';
    }
    try {
      const response = await fetch('api/spmb.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) throw new Error(result.message || 'Biodata gagal disimpan.');
      const index = records.findIndex(item => item.id === result.data.id || item.regNumber === result.data.regNumber);
      if (index === -1) records.unshift(result.data); else records[index] = result.data;
      cacheSetItem(STORAGE_KEY, JSON.stringify(records));
      if (form) form.dataset.dirty = '0';
      populateStudentBioForm(result.data);
      if (status) {
        status.textContent = '✓ Biodata siswa berhasil disimpan ke database.';
        status.className = 'portal-bio-status is-success';
      }
      renderParentPortal();
      window.switchBiodataSubstep('parent');
      return true;
    } catch (error) {
      if (status) {
        status.textContent = error.message || 'Biodata gagal disimpan. Silakan coba kembali.';
        status.className = 'portal-bio-status is-error';
      }
      return false;
    } finally {
      if (submit) submit.disabled = false;
    }
  };

  window.nextToParentData = window.submitStudentBiodata;

  window.openStudentBiodata = function () {
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim() ||
      document.getElementById('portal-sched-reg')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber); } catch (_) {}
    renderParentPortal();
    window.switchBiodataSubstep('student');
  };

  window.openParentBiodata = function () {
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim() ||
      document.getElementById('portal-sched-reg')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':parents'); } catch (_) {}
    renderParentPortal();
    window.switchBiodataSubstep('parent');
  };

  window.openScheduleStage = function (passedReg) {
    const regNumber = passedReg ||
      document.getElementById('portal-approved-code')?.textContent?.trim() ||
      document.getElementById('portal-sched-reg')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':schedule'); } catch (_) {}
    refreshScheduleSettings();
    renderParentPortal();
    requestAnimationFrame(() => {
      document.getElementById('portal-state-schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.backToPaymentApproval = function () {
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':payment'); } catch (_) {}
    renderParentPortal();
    requestAnimationFrame(() => {
      document.getElementById('portal-state-approved')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  function getTestAnnouncement(status) {
    if (status && status.includes('Lulus')) {
      return { title: 'Lulus Tes & Wawancara — Diterima', message: 'Alhamdulillah, calon siswa dinyatakan lulus tes dan wawancara serta diterima. Silakan mengikuti arahan panitia untuk proses selanjutnya.' };
    }
    if (status === 'Cadangan') {
      return { title: 'Status Cadangan', message: 'Calon siswa ditetapkan sebagai cadangan. Silakan menunggu informasi lanjutan dari panitia.' };
    }
    return { title: 'Menunggu Pengumuman', message: 'Hasil tes dan wawancara belum diumumkan oleh panitia. Halaman ini akan diperbarui setelah hasil ditetapkan.' };
  }

  const registrationSteps = [
    ['Pembayaran Pendaftaran', 'Bayar biaya pendaftaran dan unggah bukti pembayaran.'],
    ['Verifikasi Pembayaran', 'Tunggu persetujuan panitia dan penerbitan kode pendaftaran sebelum melanjutkan.'],
    ['Biodata Siswa dan Orang Tua/Wali', 'Lengkapi biodata calon siswa serta data orang tua dan wali, lalu simpan data sebelum melanjutkan.'],
    ['Jadwal Tes & Wawancara', 'Periksa jadwal terbaru dan cetak kartu peserta sebelum hadir.'],
    ['Pengumuman Hasil Tes & Wawancara', 'Lihat hasil resmi yang ditetapkan panitia.'],
    ['Pendaftaran Ulang Siswa Baru', 'Unggah berkas resmi Kartu Keluarga (KK) dan Akta Kelahiran Calon Siswa untuk menyelesaikan proses pendaftaran.']
  ];
  let registrationNavigation = { step: 1, regNumber: '', approved: false, proof: false };

  window.navigateRegistration = function (direction) {
    const { step, regNumber, approved, proof } = registrationNavigation;
    if (![1, -1].includes(direction) || (step === 1 && direction < 0) || (step === 6 && direction > 0)) return;
    if (document.getElementById('portal-bio-submit')?.disabled || document.getElementById('portal-parent-data-submit')?.disabled) return;
    if (direction > 0 && step === 1 && !approved && !proof) {
      alert('Unggah dan kirim bukti pembayaran terlebih dahulu.'); return;
    }
    if (direction > 0 && step === 2 && !approved) {
      alert('Silakan tunggu pembayaran disetujui oleh panitia.'); return;
    }
    if (direction > 0 && step === 3) {
      const studentForm = document.getElementById('portal-student-bio-form');
      const parentForm = document.getElementById('portal-parent-data-form');
      if (studentForm && !studentForm.reportValidity()) return;
      if (parentForm && !parentForm.reportValidity()) return;
      const studentSaved = registrationNavigation.studentSaved;
      const studentDirty = studentForm?.dataset.dirty === '1';
      if (!studentSaved || studentDirty) {
        alert('Simpan data terlebih dahulu menggunakan tombol Simpan Data sebelum melanjutkan.');
        return;
      }
      const parentsSaved = registrationNavigation.parentsSaved;
      const parentsDirty = window.ParentBiodata?.hasUnsavedChanges();
      if (!parentsSaved || parentsDirty) {
        alert('Simpan data terlebih dahulu menggunakan tombol Simpan Data sebelum melanjutkan.');
        return;
      }
    }
    const target = step + direction;
    const suffix = [':start', ':payment', '', ':schedule', ':results', ':reregistration'][target - 1];
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + suffix); } catch (_) {}
    renderParentPortal();
    if (target === 4 || target === 5 || target === 6) refreshParentFromDatabase();
    document.getElementById('portal-step-navigation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function updateRegistrationNavigation(record, approved, proof) {
    let view = '';
    try { view = sessionStorage.getItem(PARENT_BIODATA_VIEW_KEY) || ''; } catch (_) {}
    const summary = document.getElementById('portal-state-payment-summary');
    if (summary) summary.style.display = 'none';
    let step = approved ? 2 : proof ? 2 : 1;
    for (const [id, number] of [['biodata', 3], ['parents', 3], ['schedule', 4], ['results', 5], ['reregistration', 6]]) {
      if (document.getElementById('portal-state-' + id)?.style.display === 'block') step = number;
    }
    if (view === record.regNumber + ':start') {
      step = 1;
      ['pending', 'approved', 'biodata', 'parents', 'schedule', 'results', 'reregistration'].forEach(id => {
        const el = document.getElementById('portal-state-' + id);
        if (el) el.style.display = 'none';
      });
      const unpaidEl = document.getElementById('portal-state-unpaid');
      if (unpaidEl) unpaidEl.style.display = approved || proof ? 'none' : 'block';
      if (approved || proof) {
        if (summary) summary.style.display = 'block';
        const statusEl = document.getElementById('portal-payment-summary-status');
        if (statusEl) statusEl.textContent = approved ? 'Pembayaran telah disetujui.' : 'Bukti pembayaran sudah dikirim dan menunggu verifikasi.';
        const image = document.getElementById('portal-payment-summary-proof');
        if (image) {
          image.src = record.buktiPembayaran || '';
          image.style.display = proof ? 'block' : 'none';
          if (proof) {
            image.style.marginLeft = 'auto';
            image.style.marginRight = 'auto';
          }
        }
      }
    }
    registrationNavigation = { step, regNumber: record.regNumber, approved, proof, studentSaved: Boolean(record.biodataUpdatedAt), parentsSaved: Boolean(record.parentDataUpdatedAt) };
    const stepEl = document.getElementById('portal-current-step');
    if (stepEl) stepEl.textContent = 'LANGKAH ' + step + ' DARI 6';
    for (let number = 1; number <= 6; number++) {
      const indicator = document.getElementById('flow-step-' + number);
      if (number === step) indicator?.setAttribute?.('aria-current', 'step');
      else indicator?.removeAttribute?.('aria-current');
    }
    const progressLine = document.getElementById('stepper-progress-line');
    if (progressLine && progressLine.style) {
      const widths = ['8%', '26%', '46%', '66%', '84%', '100%'];
      progressLine.style.width = widths[Math.min(Math.max(step - 1, 0), 5)];
    }
    if (typeof document.querySelector === 'function') {
      const badge1 = document.querySelector('#flow-step-1 .step-label-badge');
      if (badge1) badge1.textContent = approved ? 'Lunas' : proof ? 'Dibayar' : 'Perlu Bayar';
      const badge2 = document.querySelector('#flow-step-2 .step-label-badge');
      if (badge2) badge2.textContent = approved ? 'Terverifikasi' : proof ? 'Verifikasi' : 'Menunggu';
      const badge3 = document.querySelector('#flow-step-3 .step-label-badge');
      if (badge3) badge3.textContent = (record?.biodataUpdatedAt && record?.parentDataUpdatedAt) ? 'Lengkap' : (step === 3 ? 'Sedang Diisi' : 'Menunggu');
      const badge4 = document.querySelector('#flow-step-4 .step-label-badge');
      if (badge4) badge4.textContent = step > 4 ? 'Selesai' : (step === 4 ? 'Jadwal Ditentukan' : 'Tahap 4');
      const badge5 = document.querySelector('#flow-step-5 .step-label-badge');
      if (badge5) badge5.textContent = step > 5 || (record?.status && record.status.includes('Lulus')) ? 'Lulus' : (step === 5 ? 'Pengumuman' : 'Jadwal Ditentukan');
      const badge6 = document.querySelector('#flow-step-6 .step-label-badge');
      if (badge6) badge6.textContent = (record?.status && record.status.includes('Selesai')) ? 'Selesai' : ((record?.berkasKk && record?.berkasAkta) ? 'Berkas Lengkap' : (step === 6 ? 'Daftar Ulang' : 'Tahap Akhir'));
    }
    const titleEl = document.getElementById('portal-current-title');
    if (titleEl) titleEl.textContent = registrationSteps[step - 1][0];
    const descEl = document.getElementById('portal-current-description');
    if (descEl) descEl.textContent = registrationSteps[step - 1][1];
    const backBtn = document.getElementById('portal-step-back');
    if (backBtn) backBtn.disabled = step === 1;
    const nextBtn = document.getElementById('portal-step-next');
    if (nextBtn) nextBtn.disabled = step >= 6 || (step === 1 && !approved && !proof) || (step === 2 && !approved);
  }

  // Navigasi langsung dengan klik tahapan pada Stepper
  window.jumpToRegistrationStep = function (targetStep) {
    if (!registrationNavigation || !registrationNavigation.regNumber) return;
    const current = registrationNavigation.step;
    if (targetStep === current) return;
    if (current === 3) {
      const studentForm = document.getElementById('portal-student-bio-form');
      const studentSaved = registrationNavigation.studentSaved;
      const studentDirty = studentForm?.dataset.dirty === '1';
      const parentsSaved = registrationNavigation.parentsSaved;
      const parentsDirty = window.ParentBiodata?.hasUnsavedChanges();
      if (!studentSaved || studentDirty || !parentsSaved || parentsDirty) {
        alert('Simpan data terlebih dahulu menggunakan tombol Simpan Data sebelum berpindah langkah.');
        return;
      }
    }
    const approved = registrationNavigation.approved;
    if (targetStep >= 3 && !approved) {
      alert('Langkah ini dapat diakses setelah pembayaran Anda diverifikasi oleh Admin.');
      return;
    }
    if (targetStep >= 4 && (!registrationNavigation.studentSaved || !registrationNavigation.parentsSaved)) {
      alert('Lengkapi dan simpan Biodata Siswa dan Orang Tua/Wali terlebih dahulu.');
      return;
    }
    const suffix = [':start', ':payment', '', ':schedule', ':results', ':reregistration'][targetStep - 1];
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, registrationNavigation.regNumber + suffix); } catch (_) {}
    renderParentPortal();
    if (targetStep === 4 || targetStep === 5 || targetStep === 6) refreshParentFromDatabase();
    document.getElementById('portal-step-navigation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.openResultsStage = function () {
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':results'); } catch (_) {}
    renderParentPortal();
    refreshParentFromDatabase();
    requestAnimationFrame(() => {
      document.getElementById('portal-state-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.openReRegistrationStage = function () {
    const regNumber = document.getElementById('portal-approved-code')?.textContent?.trim() ||
                      document.getElementById('portal-results-reg')?.textContent?.trim() ||
                      document.getElementById('portal-sched-reg')?.textContent?.trim();
    if (!regNumber) return;
    try { sessionStorage.setItem(PARENT_BIODATA_VIEW_KEY, regNumber + ':reregistration'); } catch (_) {}
    renderParentPortal();
    refreshParentFromDatabase();
    requestAnimationFrame(() => {
      document.getElementById('portal-state-reregistration')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Render Parent Portal based on session and record status
  function renderParentPortal() {
    const landingView = document.getElementById('spmb-landing-view');
    const portalView = document.getElementById('spmb-parent-portal');
    if (!landingView || !portalView) return;

    const rawSession = localStorage.getItem(PARENT_SESSION_KEY);
    if (!rawSession) {
      // No active parent session: show public landing
      landingView.style.display = 'block';
      portalView.style.display = 'none';
      return;
    }

    let session = null;
    try {
      session = JSON.parse(rawSession);
    } catch (e) {
      landingView.style.display = 'block';
      portalView.style.display = 'none';
      return;
    }

    // Session exists: show dedicated portal
    landingView.style.display = 'none';
    portalView.style.display = 'block';

    document.getElementById('portal-parent-name').textContent = session.nama || 'Orang Tua / Wali Siswa';
    document.getElementById('portal-parent-wa').textContent = session.wa || '-';
    document.getElementById('portal-parent-initials').textContent = (session.nama || 'Orang Tua').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    const accountWa = String(session.wa || '').replace(/\D/g, '').replace(/^0/, '62');
    document.getElementById('portal-parent-wa-link').href = `https://wa.me/${accountWa}`;

    // Find record in storage
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      records = [];
    }

    const cleanWa = (session.wa || '').replace(/[^0-9]/g, '');
    let record = records.find(r => {
      const rw = (r.waAyah || '').replace(/[^0-9]/g, '');
      return rw === cleanWa || (cleanWa.length >= 9 && rw.endsWith(cleanWa.slice(-9)));
    });

    if (!record) {
      record = {
        regNumber: 'PENDING-' + cleanWa.slice(-4),
        namaAyah: session.nama,
        waAyah: session.wa,
        status: 'Menunggu Pembayaran Uang Pendaftaran (Rp 150.000)',
        nominalPembayaran: 150000,
        buktiPembayaran: null
      };
    }

    const stateUnpaid = document.getElementById('portal-state-unpaid');
    const statePending = document.getElementById('portal-state-pending');
    const stateApproved = document.getElementById('portal-state-approved');
    const stateBiodata = document.getElementById('portal-state-biodata');
    const stateParents = document.getElementById('portal-state-parents');
    const stateSchedule = document.getElementById('portal-state-schedule');
    const stateResults = document.getElementById('portal-state-results');
    const stateReregistration = document.getElementById('portal-state-reregistration');
    if (stateReregistration) stateReregistration.style.display = 'none';
    if (stateResults) stateResults.style.display = 'none';
    if (stateParents) stateParents.style.display = 'none';
    if (stateSchedule) stateSchedule.style.display = 'none';
    const badgeStatus = document.getElementById('portal-badge-status');

    const step1 = document.getElementById('flow-step-1');
    const step2 = document.getElementById('flow-step-2');
    const step3 = document.getElementById('flow-step-3');
    const step4 = document.getElementById('flow-step-4');
    const flowLine1 = document.getElementById('flow-line-1');
    const flowLine2 = document.getElementById('flow-line-2');
    const flowLine3 = document.getElementById('flow-line-3');

    // Check approval status
    const isApproved = record.status && (
      record.status.toLowerCase().includes('terverifikasi') ||
      record.status.toLowerCase().includes('disetujui') ||
      record.status.toLowerCase().includes('lulus') ||
      record.status.toLowerCase().includes('diterima') ||
      record.status.toLowerCase().includes('jadwal') ||
      (record.regNumber && !record.regNumber.startsWith('PENDING-'))
    );

    const hasProof = !!record.buktiPembayaran;
    document.querySelector('.portal-header-bar').dataset.paymentState = isApproved ? 'approved' : hasProof ? 'pending' : 'unpaid';
    document.getElementById('portal-account-reference').textContent = record.regNumber?.startsWith('SPMB-') ? record.regNumber : 'Pendaftaran SPMB';

    if (isApproved) {
      // STATE 2 APPROVED / STATE 3 BIODATA / STATE 4 PARENTS / STATE 5 SCHEDULE
      const biodataComplete = Boolean(record.biodataUpdatedAt) || (/^\d{16}$/.test(record.nik || '') && Boolean(record.namaSiswa && record.tanggalLahir));
      const parentsComplete = Boolean(record.parentDataUpdatedAt);

      let biodataViewOpen = false;
      let parentsViewOpen = false;
      let scheduleViewOpen = false;
      let resultsViewOpen = false;
      let reregistrationViewOpen = false;
      try {
        const view = sessionStorage.getItem(PARENT_BIODATA_VIEW_KEY);
        if (view === record.regNumber + ':payment') {
          // Show the saved payment summary without restarting registration or charging again.
        } else if (view === record.regNumber + ':reregistration' && biodataComplete && parentsComplete) {
          reregistrationViewOpen = true;
        } else if (view === record.regNumber + ':results' && biodataComplete && parentsComplete) {
          resultsViewOpen = true;
        } else if (view === record.regNumber + ':schedule') {
          scheduleViewOpen = true;
        } else if (view === record.regNumber + ':parents' || view === record.regNumber) {
          biodataViewOpen = true;
          if (view === record.regNumber + ':parents') parentsViewOpen = true;
        } else if (biodataComplete && parentsComplete) {
          scheduleViewOpen = true;
        }
      } catch (_) {}

      stateUnpaid.style.display = 'none';
      statePending.style.display = 'none';
      stateApproved.style.display = (biodataViewOpen || scheduleViewOpen || resultsViewOpen || reregistrationViewOpen) ? 'none' : 'block';
      if (stateBiodata) stateBiodata.style.display = biodataViewOpen ? 'block' : 'none';
      const studentSec = document.getElementById('portal-section-student-bio');
      const tabStudent = document.getElementById('tab-substep-student');
      const tabParent = document.getElementById('tab-substep-parent');
      if (biodataViewOpen) {
        if (parentsViewOpen) {
          if (studentSec) studentSec.style.display = 'none';
          if (stateParents) stateParents.style.display = 'block';
          tabStudent?.classList.remove('active');
          tabStudent?.setAttribute('aria-selected', 'false');
          tabParent?.classList.add('active');
          tabParent?.setAttribute('aria-selected', 'true');
        } else {
          if (studentSec) studentSec.style.display = 'block';
          if (stateParents) stateParents.style.display = 'none';
          tabStudent?.classList.add('active');
          tabStudent?.setAttribute('aria-selected', 'true');
          tabParent?.classList.remove('active');
          tabParent?.setAttribute('aria-selected', 'false');
        }
        tabStudent?.classList.toggle('is-complete', Boolean(record.biodataUpdatedAt));
        tabParent?.classList.toggle('is-complete', Boolean(record.parentDataUpdatedAt));
      }
      if (stateSchedule) stateSchedule.style.display = scheduleViewOpen ? 'block' : 'none';
      if (stateResults) {
        stateResults.style.display = resultsViewOpen ? 'block' : 'none';
        const announcement = getTestAnnouncement(record.status);
        const hasPassed = Boolean(record.status && record.status.includes('Lulus'));
        document.getElementById('portal-results-card').classList.toggle('is-passed', hasPassed);
        document.getElementById('portal-results-success').hidden = !hasPassed;
        document.getElementById('portal-results-reg').textContent = record.regNumber || '-';
        document.getElementById('portal-results-name').textContent = record.namaSiswa || '-';
        document.getElementById('portal-results-level').textContent = (record.jenjang || '-').toUpperCase();
        document.getElementById('portal-results-title').textContent = announcement.title;
        document.getElementById('portal-results-message').textContent = announcement.message;
        const reregAction = document.getElementById('portal-results-reregister-action');
        if (reregAction) {
          reregAction.style.display = hasPassed ? 'block' : 'none';
        }
      }
      if (stateReregistration) {
        stateReregistration.style.display = reregistrationViewOpen ? 'block' : 'none';
        if (reregistrationViewOpen) {
          populateReRegistrationForm(record);
        }
      }

      window.ParentBiodata?.populate(record);

      document.getElementById('portal-approved-code').textContent = record.regNumber || 'SPMB-2026-001';
      populateStudentBioForm(record);

      const sharedSchedule = getSharedSchedule(record, scheduleSettings);
      const hasSchedule = Boolean(sharedSchedule.time) && !scheduleLoadError;

      // Populate Schedule Stage UI
      if (stateSchedule) {
        const regEl = document.getElementById('portal-sched-reg');
        const nameEl = document.getElementById('portal-sched-nama');
        const jenjangEl = document.getElementById('portal-sched-jenjang');
        const statusPill = document.getElementById('portal-sched-status-pill');
        const badgeEl = document.getElementById('portal-schedule-badge');
        const titleEl = document.getElementById('portal-schedule-title');
        const subtitleEl = document.getElementById('portal-schedule-subtitle');
        const waitingView = document.getElementById('portal-sched-waiting-view');
        const confirmedView = document.getElementById('portal-sched-confirmed-view');

        if (regEl) regEl.textContent = record.regNumber || '-';
        if (nameEl) nameEl.textContent = record.namaSiswa || 'Calon Siswa';
        if (jenjangEl) jenjangEl.textContent = (record.jenjang || 'SDIT').toUpperCase();

        if (hasSchedule) {
          if (badgeEl) {
            badgeEl.textContent = 'JADWAL RESMI TELAH DITETAPKAN';
            badgeEl.style.background = '#dcfce7';
            badgeEl.style.color = '#15803d';
          }
          if (titleEl) titleEl.textContent = 'Jadwal Tes Calon Murid Baru & Wawancara Ditetapkan';
          if (subtitleEl) subtitleEl.textContent = `Alhamdulillah, Panitia SPMB SIT Bina Insan Parepare telah menetapkan jadwal seleksi calon murid baru dan wawancara orang tua untuk ananda ${record.namaSiswa || ''}.`;
          if (statusPill) {
            statusPill.textContent = '✓ Jadwal Ditetapkan';
            statusPill.style.color = '#15803d';
          }
          if (waitingView) waitingView.style.display = 'none';
          if (confirmedView) confirmedView.style.display = 'block';

          const valTestDate = document.getElementById('portal-sched-val-test-date');
          const valTestLoc = document.getElementById('portal-sched-val-test-loc');
          const valNotes = document.getElementById('portal-sched-val-notes');

          if (valTestDate) valTestDate.textContent = sharedSchedule.time;
          if (valTestLoc) valTestLoc.textContent = sharedSchedule.location || '-';
          if (valNotes) valNotes.textContent = sharedSchedule.notes || '-';

          const confirmWaBtn = document.getElementById('portal-sched-wa-confirm-btn');
          if (confirmWaBtn) {
            confirmWaBtn.href = `https://wa.me/6285190610569?text=${encodeURIComponent(`Assalamu'alaikum Admin SPMB SIT Bina Insan Parepare, saya ${session.nama || record.namaAyah} orang tua dari ${record.namaSiswa || ''} (${record.regNumber}), mengonfirmasi siap hadir sesuai jadwal tes & wawancara yang telah ditetapkan. Terima kasih.`)}`;
          }
        } else {
          if (badgeEl) {
            badgeEl.textContent = 'LANGKAH 5: MENUNGGU JADWAL TES & WAWANCARA';
            badgeEl.style.background = '#fef3c7';
            badgeEl.style.color = '#92400e';
          }
          if (titleEl) titleEl.textContent = 'Pengisian Biodata Selesai! Menunggu Jadwal Tes & Wawancara';
          if (subtitleEl) subtitleEl.textContent = 'Alhamdulillah, data calon siswa dan data orang tua/wali telah berhasil disimpan lengkap di database resmi SIT Bina Insan Parepare. Tahap berikutnya adalah menunggu admin menetapkan tanggal jadwal tes calon murid baru & wawancara.';
          if (statusPill) {
            statusPill.innerHTML = '<i class="fa-solid fa-clock mr-1"></i> Menunggu Input Admin';
            statusPill.style.color = '#b45309';
          }
          if (waitingView) waitingView.style.display = 'block';
          if (confirmedView) confirmedView.style.display = 'none';
          if (scheduleLoadError || !scheduleSettings) {
            if (titleEl) titleEl.textContent = scheduleLoadError ? 'Jadwal belum dapat dimuat' : 'Memuat jadwal terbaru...';
            if (subtitleEl) subtitleEl.textContent = scheduleLoadError ? 'Koneksi ke database terganggu. Jadwal akan dimuat ulang secara otomatis.' : 'Mengambil jadwal resmi dari database sekolah.';
            if (statusPill) statusPill.textContent = scheduleLoadError ? 'Gagal memuat jadwal' : 'Memuat jadwal';
            if (badgeEl) badgeEl.textContent = 'JADWAL TES & WAWANCARA';
            if (waitingView) waitingView.style.display = 'none';
          }

          const waInquireBtn = document.getElementById('portal-sched-wa-inquire-btn');
          if (waInquireBtn) {
            waInquireBtn.href = `https://wa.me/6285190610569?text=${encodeURIComponent(`Assalamu'alaikum Admin SPMB SIT Bina Insan Parepare, saya ${session.nama || record.namaAyah} orang tua dari ${record.namaSiswa || ''} (${record.regNumber}), telah melengkapi seluruh biodata siswa & orang tua. Mohon informasi penetapan jadwal tes & wawancara. Terima kasih.`)}`;
          }
        }
      }

      const isPassed = Boolean(record.status && record.status.includes('Lulus'));
      const hasRereg = Boolean(record.berkasKk && record.berkasAkta);
      const isFinished = Boolean(record.status && record.status.includes('Selesai'));
      if (isFinished) {
        badgeStatus.textContent = 'Alur Pendaftaran Selesai (Resmi Diterima)';
      } else if (hasRereg) {
        badgeStatus.textContent = 'Pendaftaran Ulang Selesai (Berkas Terkirim)';
      } else if (isPassed) {
        badgeStatus.textContent = 'Lulus Seleksi — Menunggu Pendaftaran Ulang';
      } else {
        badgeStatus.textContent = hasSchedule ? 'Jadwal Tes & Wawancara Ditetapkan' : (biodataComplete && parentsComplete) ? 'Biodata Lengkap (Menunggu Jadwal)' : 'Pembayaran Terverifikasi & Diterima';
      }

      step1?.classList.add('done');
      step1?.classList.remove('active');
      step2?.classList.add('done');
      step2?.classList.remove('active');

      step3?.classList.remove('active', 'done', 'current-success');
      if (biodataComplete && parentsComplete) {
        step3?.classList.add('done');
      } else if (biodataViewOpen || parentsViewOpen) {
        step3?.classList.add('current-success');
      } else {
        step3?.classList.add('active');
      }

      step4?.classList.remove('active', 'done', 'current-success');
      if (hasSchedule || isPassed || resultsViewOpen || reregistrationViewOpen) {
        step4?.classList.add('done');
      } else if (scheduleViewOpen) {
        step4?.classList.add('current-success');
      } else if (biodataComplete && parentsComplete) {
        step4?.classList.add('active');
      }

      const step5 = document.getElementById('flow-step-5');
      const step6 = document.getElementById('flow-step-6');
      step5?.classList.remove('active', 'done', 'current-success');
      step6?.classList.remove('active', 'done', 'current-success');

      if (isPassed || hasRereg || reregistrationViewOpen) {
        step5?.classList.add('done');
      } else if (resultsViewOpen) {
        step5?.classList.add('current-success');
      } else if (hasSchedule) {
        step5?.classList.add('active');
      }

      if (hasRereg) {
        step6?.classList.add('done');
      } else if (reregistrationViewOpen) {
        step6?.classList.add('current-success');
      } else if (isPassed) {
        step6?.classList.add('active');
      }

      if (flowLine1) flowLine1.style.background = '#22c55e';
      if (flowLine2) flowLine2.style.background = '#22c55e';
      if (flowLine3) flowLine3.style.background = (biodataComplete && parentsComplete) ? '#22c55e' : 'var(--neutral-200)';
    } else if (hasProof) {
      // STATE 2: PENDING APPROVAL
      stateUnpaid.style.display = 'none';
      statePending.style.display = 'block';
      stateApproved.style.display = 'none';
      if (stateBiodata) stateBiodata.style.display = 'none';
      if (stateParents) stateParents.style.display = 'none';
      if (stateSchedule) stateSchedule.style.display = 'none';
      if (stateResults) stateResults.style.display = 'none';
      if (stateReregistration) stateReregistration.style.display = 'none';

      const proofImg = document.getElementById('portal-pending-proof-img');
      if (proofImg) proofImg.src = record.buktiPembayaran;

      badgeStatus.textContent = 'Menunggu Verifikasi Admin';

      const waBtn = document.getElementById('portal-wa-confirm-btn');
      if (waBtn) {
        waBtn.href = `https://wa.me/6285190610569?text=${encodeURIComponent(`Assalamu'alaikum Admin SPMB SIT Bina Insan Parepare, saya ${session.nama} (${session.wa}), telah mengunggah bukti pembayaran pendaftaran Rp 150.000. Mohon diverifikasi.`)}`;
      }

      step1?.classList.add('done');
      step1?.classList.remove('active');
      step2?.classList.add('active');
      step3?.classList.remove('active', 'done', 'current-success');
      step4?.classList.remove('active', 'done', 'current-success');
      document.getElementById('flow-step-5')?.classList.remove('active', 'done', 'current-success');
      document.getElementById('flow-step-6')?.classList.remove('active', 'done', 'current-success');
      if (flowLine1) flowLine1.style.background = '#22c55e';
      if (flowLine2) flowLine2.style.background = 'var(--neutral-200)';
      if (flowLine3) flowLine3.style.background = 'var(--neutral-200)';
    } else {
      // STATE 1: UNPAID
      stateUnpaid.style.display = 'block';
      statePending.style.display = 'none';
      stateApproved.style.display = 'none';
      if (stateBiodata) stateBiodata.style.display = 'none';
      if (stateParents) stateParents.style.display = 'none';
      if (stateSchedule) stateSchedule.style.display = 'none';
      if (stateResults) stateResults.style.display = 'none';
      if (stateReregistration) stateReregistration.style.display = 'none';

      badgeStatus.textContent = 'Menunggu Pembayaran (Rp 150.000)';

      step1?.classList.add('active');
      step1?.classList.remove('done');
      step2?.classList.remove('active', 'done');
      step3?.classList.remove('active', 'done', 'current-success');
      step4?.classList.remove('active', 'done', 'current-success');
      document.getElementById('flow-step-5')?.classList.remove('active', 'done', 'current-success');
      document.getElementById('flow-step-6')?.classList.remove('active', 'done', 'current-success');
      if (flowLine1) flowLine1.style.background = 'var(--neutral-200)';
      if (flowLine2) flowLine2.style.background = 'var(--neutral-200)';
      if (flowLine3) flowLine3.style.background = 'var(--neutral-200)';
    }
    updateRegistrationNavigation(record, isApproved, hasProof);
  }

  // Handle Proof File Input Selection
  window.handleProofFileSelect = function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      processProofFile(file);
    }
  };

  function processProofFile(file) {
    if (!file.type.match('image.*')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (maksimal 2,5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
      tempProofBase64 = evt.target.result;
      const previewBox = document.getElementById('portal-preview-box');
      const previewImg = document.getElementById('portal-preview-image');
      if (previewBox && previewImg) {
        previewImg.src = tempProofBase64;
        previewBox.style.display = 'block';
        previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    reader.readAsDataURL(file);
  }

  // Submit Payment Proof to Database
  window.submitPaymentProof = async function () {
    if (!tempProofBase64) {
      alert('Silakan pilih foto bukti pembayaran terlebih dahulu.');
      return;
    }

    const rawSession = localStorage.getItem(PARENT_SESSION_KEY);
    if (!rawSession) {
      alert('Sesi pendaftaran tidak ditemukan. Silakan login kembali.');
      return;
    }

    const session = JSON.parse(rawSession);
    const cleanWa = (session.wa || '').replace(/[^0-9]/g, '');

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      records = [];
    }

    let record = records.find(r => {
      const rw = (r.waAyah || '').replace(/[^0-9]/g, '');
      return rw === cleanWa || (cleanWa.length >= 9 && rw.endsWith(cleanWa.slice(-9)));
    });

    if (!record) {
      record = {
        regNumber: 'PENDING-' + cleanWa.slice(-4),
        namaAyah: session.nama,
        waAyah: session.wa,
        nominalPembayaran: 150000
      };
      records.unshift(record);
    }

    record.buktiPembayaran = tempProofBase64;
    record.nominalPembayaran = 150000;
    record.status = 'Menunggu Verifikasi Pembayaran oleh Admin';

    try {
      const response = await fetch('api/spmb.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_number: record.id ? record.regNumber : '',
          wa_ayah: session.wa,
          bukti_pembayaran: tempProofBase64,
          nominal_pembayaran: 150000,
          status: 'Menunggu Verifikasi Pembayaran oleh Admin'
        })
      });
      const result = await response.json();
      if (!response.ok || !result || !result.success || !result.data) {
        throw new Error(result?.message || 'Bukti pembayaran gagal disimpan ke database.');
      }
      Object.assign(record, result.data);
      cacheSetItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      alert(`Bukti pembayaran belum tersimpan. ${error.message}\n\nSilakan coba kembali.`);
      return;
    }

    // Broadcast to admin dashboard
    if (realtimeChannel) {
      try {
        realtimeChannel.postMessage({
          type: 'spmb_proof_uploaded',
          data: record,
          timestamp: Date.now()
        });
      } catch (e) {}
    }

    alert('Bukti pembayaran berhasil diunggah!\n\nSeluruh data Anda telah tersimpan di sistem dan dapat dikelola oleh admin. Mohon menunggu sampai admin memverifikasi pembayaran Anda.');
    renderParentPortal();
  };

  // Re-upload another proof
  window.reuploadProof = function () {
    const stateUnpaid = document.getElementById('portal-state-unpaid');
    const statePending = document.getElementById('portal-state-pending');
    if (stateUnpaid && statePending) {
      stateUnpaid.style.display = 'block';
      statePending.style.display = 'none';
      stateUnpaid.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Re-registration State (Upload Kartu Keluarga & Akta Kelahiran Siswa)
  let currentKkBase64 = null;
  let currentAktaBase64 = null;

  window.handleKkFileSelect = function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Mohon pilih file gambar (JPG, PNG, WEBP) atau PDF untuk Kartu Keluarga.');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file Kartu Keluarga terlalu besar (maksimal 2,5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
      currentKkBase64 = event.target.result;
      const previewBox = document.getElementById('portal-rereg-kk-preview-box');
      const content = document.getElementById('portal-rereg-kk-preview-content');
      const viewBtn = document.getElementById('portal-rereg-kk-view-btn');
      if (previewBox && content) {
        if (file.type === 'application/pdf') {
          content.innerHTML = `<div style="font-weight:700; color:#1e40af; font-size:0.85rem;"><i class="fa-solid fa-file-pdf" style="color:#dc2626; margin-right:0.35rem;"></i>Dokumen PDF: ${file.name}</div><div style="font-size:0.75rem; color:#64748b;">(${(file.size / 1024).toFixed(1)} KB)</div>`;
        } else {
          content.innerHTML = `<img src="${currentKkBase64}" alt="Pratinjau KK" style="max-height:120px; max-width:100%; border-radius:8px; border:1px solid #cbd5e1; margin:0 auto; display:block;">`;
        }
        previewBox.style.display = 'block';
        if (viewBtn) viewBtn.style.display = 'inline-block';
      }
    };
    reader.readAsDataURL(file);
  };

  window.handleAktaFileSelect = function (e) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Mohon pilih file gambar (JPG, PNG, WEBP) atau PDF untuk Akta Kelahiran.');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran file Akta Kelahiran terlalu besar (maksimal 2,5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
      currentAktaBase64 = event.target.result;
      const previewBox = document.getElementById('portal-rereg-akta-preview-box');
      const content = document.getElementById('portal-rereg-akta-preview-content');
      const viewBtn = document.getElementById('portal-rereg-akta-view-btn');
      if (previewBox && content) {
        if (file.type === 'application/pdf') {
          content.innerHTML = `<div style="font-weight:700; color:#1e40af; font-size:0.85rem;"><i class="fa-solid fa-file-pdf" style="color:#dc2626; margin-right:0.35rem;"></i>Dokumen PDF: ${file.name}</div><div style="font-size:0.75rem; color:#64748b;">(${(file.size / 1024).toFixed(1)} KB)</div>`;
        } else {
          content.innerHTML = `<img src="${currentAktaBase64}" alt="Pratinjau Akta" style="max-height:120px; max-width:100%; border-radius:8px; border:1px solid #cbd5e1; margin:0 auto; display:block;">`;
        }
        previewBox.style.display = 'block';
        if (viewBtn) viewBtn.style.display = 'inline-block';
      }
    };
    reader.readAsDataURL(file);
  };

  function openDataInWindow(dataUri, title) {
    if (!dataUri) return;
    if (dataUri.startsWith('data:')) {
      try {
        const parts = dataUri.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (_) {
        window.open(dataUri, '_blank');
      }
    } else {
      window.open(dataUri, '_blank');
    }
  }

  window.viewCurrentKk = function () {
    openDataInWindow(currentKkBase64, 'Kartu Keluarga');
  };

  window.viewCurrentAkta = function () {
    openDataInWindow(currentAktaBase64, 'Akta Kelahiran');
  };

  function populateReRegistrationForm(record) {
    const regEl = document.getElementById('portal-rereg-reg');
    const nameEl = document.getElementById('portal-rereg-name');
    const levelEl = document.getElementById('portal-rereg-level');
    const statusPill = document.getElementById('portal-rereg-status-pill');
    const savedCard = document.getElementById('portal-rereg-saved-card');
    const savedTime = document.getElementById('portal-rereg-saved-time');
    const statusText = document.getElementById('portal-rereg-status');
    const waBtn = document.getElementById('portal-rereg-wa-btn');

    if (regEl) regEl.textContent = record.regNumber || '-';
    if (nameEl) nameEl.textContent = record.namaSiswa || 'Calon Siswa';
    if (levelEl) levelEl.textContent = (record.jenjang || 'SDIT').toUpperCase();

    if (record.berkasKk) {
      currentKkBase64 = record.berkasKk;
      const previewBox = document.getElementById('portal-rereg-kk-preview-box');
      const content = document.getElementById('portal-rereg-kk-preview-content');
      const viewBtn = document.getElementById('portal-rereg-kk-view-btn');
      if (previewBox && content) {
        if (record.berkasKk.startsWith('data:application/pdf')) {
          content.innerHTML = `<div style="font-weight:700; color:#1e40af; font-size:0.85rem;"><i class="fa-solid fa-file-pdf" style="color:#dc2626; margin-right:0.35rem;"></i>Dokumen PDF Kartu Keluarga Tersimpan</div>`;
        } else {
          content.innerHTML = `<img src="${record.berkasKk}" alt="Kartu Keluarga" style="max-height:120px; max-width:100%; border-radius:8px; border:1px solid #cbd5e1; margin:0 auto; display:block;">`;
        }
        previewBox.style.display = 'block';
        if (viewBtn) viewBtn.style.display = 'inline-block';
      }
    }

    if (record.berkasAkta) {
      currentAktaBase64 = record.berkasAkta;
      const previewBox = document.getElementById('portal-rereg-akta-preview-box');
      const content = document.getElementById('portal-rereg-akta-preview-content');
      const viewBtn = document.getElementById('portal-rereg-akta-view-btn');
      if (previewBox && content) {
        if (record.berkasAkta.startsWith('data:application/pdf')) {
          content.innerHTML = `<div style="font-weight:700; color:#1e40af; font-size:0.85rem;"><i class="fa-solid fa-file-pdf" style="color:#dc2626; margin-right:0.35rem;"></i>Dokumen PDF Akta Kelahiran Tersimpan</div>`;
        } else {
          content.innerHTML = `<img src="${record.berkasAkta}" alt="Akta Kelahiran" style="max-height:120px; max-width:100%; border-radius:8px; border:1px solid #cbd5e1; margin:0 auto; display:block;">`;
        }
        previewBox.style.display = 'block';
        if (viewBtn) viewBtn.style.display = 'inline-block';
      }
    }

    const hasBoth = Boolean(record.berkasKk && record.berkasAkta);
    const isFinished = Boolean(record.status && record.status.toLowerCase().includes('selesai'));
    const completedCard = document.getElementById('portal-spmb-completed-card');
    if (completedCard) {
      completedCard.style.display = isFinished ? 'block' : 'none';
    }

    if (isFinished) {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> Pendaftaran Selesai';
        statusPill.style.color = '#15803d';
      }
      if (savedCard) savedCard.style.display = 'none';
      if (statusText) {
        statusText.innerHTML = '<strong style="color:#15803d;">✓ Seluruh alur pendaftaran SPMB telah selesai.</strong> Selamat &amp; terima kasih telah memilih sekolah kami untuk pendidikan anak anda, jazakallahu khairan.';
        statusText.style.color = '#15803d';
      }
    } else if (hasBoth) {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> Berkas Lengkap';
        statusPill.style.color = '#15803d';
      }
      if (savedCard) savedCard.style.display = 'block';
      if (savedTime && record.daftarUlangAt) {
        try {
          savedTime.textContent = `Waktu Pengunggahan Berkas: ${new Date(record.daftarUlangAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        } catch (_) {
          savedTime.textContent = 'Berkas tersimpan di database';
        }
      }
      if (statusText) {
        statusText.textContent = '✓ Berkas Kartu Keluarga & Akta Kelahiran sudah lengkap dan tersimpan. Anda dapat memperbarui jika ada perbaikan.';
        statusText.style.color = '#15803d';
      }
    } else {
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-clock mr-1 text-amber-600"></i> Menunggu Berkas';
        statusPill.style.color = '#b45309';
      }
      if (savedCard) savedCard.style.display = 'none';
      if (statusText) {
        statusText.textContent = 'Kedua berkas (Kartu Keluarga dan Akta Kelahiran) wajib diunggah untuk menyelesaikan pendaftaran ulang.';
        statusText.style.color = 'var(--neutral-600)';
      }
    }

    if (waBtn) {
      waBtn.href = `https://wa.me/6285190610569?text=${encodeURIComponent(`Assalamu'alaikum Admin SPMB SIT Bina Insan Parepare, saya orang tua dari ananda ${record.namaSiswa || ''} (${record.regNumber || ''}), mengonfirmasi pendaftaran ulang dan pengunggahan berkas KK serta Akta Kelahiran. Mohon dicek. Terima kasih.`)}`;
    }
  }

  window.submitReRegistration = async function () {
    if (!currentKkBase64) {
      alert('Silakan pilih dan unggah berkas Kartu Keluarga (KK) terlebih dahulu.');
      return;
    }
    if (!currentAktaBase64) {
      alert('Silakan pilih dan unggah berkas Akta Kelahiran Calon Siswa terlebih dahulu.');
      return;
    }

    const rawSession = localStorage.getItem(PARENT_SESSION_KEY);
    if (!rawSession) {
      alert('Sesi pendaftaran tidak ditemukan. Silakan login kembali.');
      return;
    }
    const session = JSON.parse(rawSession);
    const cleanWa = (session.wa || '').replace(/[^0-9]/g, '');

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {
      records = [];
    }

    let record = records.find(r => {
      const rw = (r.waAyah || '').replace(/[^0-9]/g, '');
      return rw === cleanWa || (cleanWa.length >= 9 && rw.endsWith(cleanWa.slice(-9)));
    });

    if (!record) {
      alert('Data pendaftaran tidak ditemukan. Silakan muat ulang halaman.');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-reregistration');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan Berkas...';
    }

    const nowIso = new Date().toISOString();
    record.berkasKk = currentKkBase64;
    record.berkasAkta = currentAktaBase64;
    record.daftarUlangAt = nowIso;

    try {
      const response = await fetch('api/spmb.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_number: record.regNumber,
          wa_ayah: session.wa,
          berkas_kk: currentKkBase64,
          berkas_akta: currentAktaBase64,
          daftar_ulang_at: nowIso
        })
      });
      const result = await response.json();
      if (!response.ok || !result || !result.success || !result.data) {
        throw new Error(result?.message || 'Gagal menyimpan berkas pendaftaran ulang.');
      }
      Object.assign(record, result.data);
      cacheSetItem(STORAGE_KEY, JSON.stringify(records));
      alert('Alhamdulillah! Berkas pendaftaran ulang (Kartu Keluarga dan Akta Kelahiran) berhasil dikirim dan tersimpan di database resmi.');
      renderParentPortal();
    } catch (error) {
      cacheSetItem(STORAGE_KEY, JSON.stringify(records));
      alert(`Berkas tersimpan di sesi lokal. Catatan sinkronisasi server: ${error.message}`);
      renderParentPortal();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  };

  // Logout Parent Portal
  window.logoutParentPortal = function () {
    if (confirm('Apakah Anda ingin keluar dari Portal SPMB Anda?')) {
      localStorage.removeItem(PARENT_SESSION_KEY);
      try { sessionStorage.removeItem(PARENT_BIODATA_VIEW_KEY); } catch (_) {}
      renderParentPortal();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Copy Bank Number
  window.copyBankNumber = function (num) {
    if (!num || num === '7112345678') {
      const settings = window.SchoolData?.settings || {};
      const bankStr = settings.bankAccount || '';
      const match = bankStr.match(/\d[\d\-]{5,}\d/);
      if (match) num = match[0].replace(/\D/g, '');
      else num = '7112345678';
    }
    const cleanNum = String(num).replace(/\D/g, '') || '7112345678';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanNum).then(() => {
        alert('Nomor Rekening (' + cleanNum + ') atas nama Yayasan Bina Insan Parepare berhasil disalin!');
      });
    } else {
      prompt('Salin nomor rekening:', cleanNum);
    }
  };

  // Copy Registration Code
  window.copyRegCode = function () {
    const code = document.getElementById('portal-approved-code')?.textContent || '';
    if (code && navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        alert('Kode pendaftaran ' + code + ' berhasil disalin!');
      });
    }
  };

  // Print Approved Registration Card
  window.printApprovedCard = function () {
    window.print();
  };

  window.printScheduleCard = async function () {
    await refreshScheduleSettings();
    const confirmed = document.getElementById('portal-sched-confirmed-view');
    const metadata = document.querySelector('#portal-state-schedule .portal-sched-meta-strip');
    if (scheduleLoadError || !confirmed || confirmed.style.display === 'none' || !metadata) {
      alert('Jadwal belum tersedia. Pastikan koneksi internet aktif dan jadwal telah ditetapkan.');
      return;
    }
    document.getElementById('schedule-print-sheet')?.remove();
    const sheet = document.createElement('section');
    sheet.id = 'schedule-print-sheet';
    sheet.setAttribute('aria-hidden', 'true');
    const content = document.createElement('div');
    content.className = 'schedule-print-content';
    const details = confirmed.firstElementChild.cloneNode(true);
    details.querySelector('button')?.parentElement.remove();
    content.append(metadata.cloneNode(true), details);
    content.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    sheet.append(content);
    document.body.append(sheet);
    document.body.classList.add('printing-schedule');
    const cleanup = () => {
      sheet.remove();
      document.body.classList.remove('printing-schedule');
    };
    try {
      await document.fonts?.ready;
      // Fit the complete card, including long notes, inside the A4 printable area.
      const maxHeight = 270 * 96 / 25.4;
      const scale = Math.min(1, maxHeight / content.getBoundingClientRect().height);
      content.style.zoom = String(scale);
      window.addEventListener('afterprint', cleanup, { once: true });
      window.print();
    } catch (error) {
      cleanup();
      alert('Tidak dapat membuka cetakan. Silakan coba lagi.');
    }
  };

  // Quick Status Check in Landing
  window.handleQuickStatusCheck = async function (e) {
    e.preventDefault();
    const query = document.getElementById('quick-check-input')?.value.trim();
    const resBox = document.getElementById('quick-check-result');
    if (!query || !resBox) return;

    resBox.innerHTML = '<div style="color:#ffffff; font-weight:700; padding:0.75rem;">Mencari data pendaftaran...</div>';
    let found = null;
    try {
      const response = await fetch(`api/spmb.php?query=${encodeURIComponent(query)}`, { cache: 'no-store' });
      const result = await response.json();
      if (response.ok && result.success) found = result.data;
    } catch (_) { /* The error state below covers temporary connectivity problems. */ }

    if (found) {
      resBox.innerHTML = `
        <div style="background:#ffffff; border:1.5px solid var(--primary-300); border-radius:var(--radius-lg); padding:1.25rem; text-align:left; box-shadow:var(--shadow-sm); max-width:480px; margin:0 auto;">
          <div style="font-size:0.75rem; color:var(--neutral-400); text-transform:uppercase; font-weight:700;">Data Ditemukan</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--primary-800); margin:0.25rem 0;">${escapeHtml(found.regNumber)}</div>
          <div style="font-size:0.875rem; color:var(--neutral-700);">Orang Tua: <strong>${escapeHtml(found.namaAyah || '-')}</strong></div>
          <div style="font-size:0.875rem; color:var(--neutral-700); margin-top:0.25rem;">Status: <span class="badge-tag" style="background:#eff6ff; color:#1d4ed8; font-weight:700;">${escapeHtml(found.status || '-')}</span></div>
          <button type="button" id="quick-open-parent-portal" class="btn btn-primary btn-sm" style="width:100%; margin-top:0.75rem;">
            Buka Portal Pendaftar Ini ›
          </button>
        </div>
      `;
      document.getElementById('quick-open-parent-portal')?.addEventListener('click', () => {
        cacheSetItem(PARENT_SESSION_KEY, JSON.stringify({ nama: found.namaAyah || '', wa: found.waAyah || '' }));
        renderParentPortal();
        refreshParentFromDatabase();
      });
    } else {
      resBox.innerHTML = `
        <div style="background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; border-radius:var(--radius-md); padding:0.75rem; font-size:0.85rem; max-width:480px; margin:0 auto;">
          Data pendaftar dengan nomor <strong>${escapeHtml(query)}</strong> tidak ditemukan. Silakan cek kembali atau lakukan pendaftaran baru.
        </div>
      `;
    }
  };

  // Expose renderParentPortal to window
  window.renderParentPortal = renderParentPortal;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
