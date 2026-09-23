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
    let biayaPendaftaran = 'Rp 200.000';
    if (jenjangVal === 'sdit') {
      jenjangText = 'SDIT Bina Insan';
      biayaPendaftaran = 'Rp 250.000';
    } else if (jenjangVal === 'smpit') {
      jenjangText = 'SMPIT Bina Insan';
      biayaPendaftaran = 'Rp 300.000';
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
        <tr><td>Infaq Pendaftaran:</td><td><strong>${biayaPendaftaran}</strong></td></tr>
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
    try {
      const raw = localStorage.getItem('sit_bina_insan_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.academicYear) yearPrefix = s.academicYear.split('/')[0].trim();
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
            <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
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
    window.addEventListener('focus', refreshParentFromDatabase);

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
        ttl: 'Parepare, ' + new Date().toLocaleDateString('id-ID'),
        jk: 'Laki-laki',
        asalSekolah: '-',
        alamat: 'Parepare',
        namaAyah: nama,
        pekerjaanAyah: '-',
        waAyah: rawWa,
        namaIbu: '-',
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
    const badgeStatus = document.getElementById('portal-badge-status');

    const step1 = document.getElementById('flow-step-1');
    const step2 = document.getElementById('flow-step-2');
    const step3 = document.getElementById('flow-step-3');

    // Check approval status
    const isApproved = record.status && (
      record.status.toLowerCase().includes('terverifikasi') ||
      record.status.toLowerCase().includes('disetujui') ||
      record.status.toLowerCase().includes('lulus') ||
      record.status.toLowerCase().includes('diterima') ||
      (record.regNumber && !record.regNumber.startsWith('PENDING-'))
    );

    const hasProof = !!record.buktiPembayaran;

    if (isApproved) {
      // STATE 3: APPROVED!
      stateUnpaid.style.display = 'none';
      statePending.style.display = 'none';
      stateApproved.style.display = 'block';

      document.getElementById('portal-approved-code').textContent = record.regNumber || 'SPMB-2026-001';
      badgeStatus.textContent = 'Pembayaran Terverifikasi & Diterima';
      badgeStatus.style.background = '#dcfce7';
      badgeStatus.style.color = '#15803d';

      step1?.classList.add('done');
      step1?.classList.remove('active');
      step2?.classList.add('done');
      step2?.classList.remove('active');
      step3?.classList.add('active');
    } else if (hasProof) {
      // STATE 2: PENDING APPROVAL
      stateUnpaid.style.display = 'none';
      statePending.style.display = 'block';
      stateApproved.style.display = 'none';

      const proofImg = document.getElementById('portal-pending-proof-img');
      if (proofImg) proofImg.src = record.buktiPembayaran;

      badgeStatus.textContent = 'Menunggu Verifikasi Admin';
      badgeStatus.style.background = '#fef3c7';
      badgeStatus.style.color = '#b45309';

      const waBtn = document.getElementById('portal-wa-confirm-btn');
      if (waBtn) {
        waBtn.href = `https://wa.me/6285190610569?text=${encodeURIComponent(`Assalamu'alaikum Admin SPMB SIT Bina Insan Parepare, saya ${session.nama} (${session.wa}), telah mengunggah bukti pembayaran pendaftaran Rp 150.000. Mohon diverifikasi.`)}`;
      }

      step1?.classList.add('done');
      step1?.classList.remove('active');
      step2?.classList.add('active');
      step3?.classList.remove('active', 'done');
    } else {
      // STATE 1: UNPAID
      stateUnpaid.style.display = 'block';
      statePending.style.display = 'none';
      stateApproved.style.display = 'none';

      badgeStatus.textContent = 'Menunggu Pembayaran (Rp 150.000)';
      badgeStatus.style.background = '#fee2e2';
      badgeStatus.style.color = '#991b1b';

      step1?.classList.add('active');
      step1?.classList.remove('done');
      step2?.classList.remove('active', 'done');
      step3?.classList.remove('active', 'done');
    }
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

  // Logout Parent Portal
  window.logoutParentPortal = function () {
    if (confirm('Apakah Anda ingin keluar dari Portal SPMB Anda?')) {
      localStorage.removeItem(PARENT_SESSION_KEY);
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

  // Quick Status Check in Landing
  window.handleQuickStatusCheck = function (e) {
    e.preventDefault();
    const query = document.getElementById('quick-check-input')?.value.trim();
    const resBox = document.getElementById('quick-check-result');
    if (!query || !resBox) return;

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (err) {
      records = [];
    }

    const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = records.find(r => {
      const reg = (r.regNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const wa = (r.waAyah || '').replace(/[^0-9]/g, '');
      return reg.includes(cleanQ) || wa.includes(cleanQ);
    });

    if (found) {
      resBox.innerHTML = `
        <div style="background:#ffffff; border:1.5px solid var(--primary-300); border-radius:var(--radius-lg); padding:1.25rem; text-align:left; box-shadow:var(--shadow-sm); max-width:480px; margin:0 auto;">
          <div style="font-size:0.75rem; color:var(--neutral-400); text-transform:uppercase; font-weight:700;">Data Ditemukan</div>
          <div style="font-size:1.15rem; font-weight:800; color:var(--primary-800); margin:0.25rem 0;">${found.regNumber}</div>
          <div style="font-size:0.875rem; color:var(--neutral-700);">Orang Tua: <strong>${escapeHtml(found.namaAyah || '-')}</strong></div>
          <div style="font-size:0.875rem; color:var(--neutral-700); margin-top:0.25rem;">Status: <span class="badge-tag" style="background:#eff6ff; color:#1d4ed8; font-weight:700;">${escapeHtml(found.status || '-')}</span></div>
          <button type="button" class="btn btn-primary btn-sm" style="width:100%; margin-top:0.75rem;" onclick="localStorage.setItem('${PARENT_SESSION_KEY}', JSON.stringify({nama: '${escapeHtml(found.namaAyah || '')}', wa: '${escapeHtml(found.waAyah || '')}'})); window.renderParentPortal();">
            Buka Portal Pendaftar Ini ›
          </button>
        </div>
      `;
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
