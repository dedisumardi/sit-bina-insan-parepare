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

  // Seed default dummy records for testing Cek Status if storage empty
  function initStorage() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const initialRecords = [
        {
          regNumber: 'SPMB-2025-SD001',
          jenjang: 'sdit',
          jalur: 'reguler',
          namaSiswa: 'Ahmad Rayhan Al-Fatih',
          nik: '7372011205180001',
          ttl: 'Parepare, 12 Mei 2018',
          jk: 'Laki-laki',
          asalSekolah: 'TKIT Bina Insan Parepare',
          alamat: 'Jl. Bau Massepe No. 45, Bacukiki Barat, Parepare',
          namaAyah: 'dr. H. Hendra Saputra, Sp.A',
          pekerjaanAyah: 'Dokter Spesialis Anak',
          waAyah: '081234567891',
          namaIbu: 'dr. Hj. Salmawati, Sp.Rad',
          pekerjaanIbu: 'Dokter',
          email: 'hendra.saputra@gmail.com',
          hafalan: 'Juz 30 (Lancar/Mutqin) dan An-Naba s/d Al-Infitar',
          prestasi: 'Juara 1 Lomba Tahfizh Cilik Tingkat Kecamatan 2024',
          tanggalDaftar: '12 Januari 2025, 09:30 WITA',
          status: 'Terverifikasi (Jadwal Observasi: 22 Feb 2025)',
          jadwalObservasi: 'Sabtu, 22 Februari 2025 | Pukul 08.30 WITA | Gedung Utama SDIT'
        },
        {
          regNumber: 'SPMB-2025-TK002',
          jenjang: 'tkit',
          jalur: 'reguler',
          namaSiswa: 'Khansa Naura Az-Zahra',
          nik: '7372016508200002',
          ttl: 'Parepare, 15 Agustus 2020',
          jk: 'Perempuan',
          asalSekolah: 'PAUD Melati Parepare',
          alamat: 'Jl. Jenderal Sudirman No. 12, Soreang, Parepare',
          namaAyah: 'Fadli Rahman, S.T',
          pekerjaanAyah: 'PNS',
          waAyah: '081342112233',
          namaIbu: 'St. Aisyah, S.Pd',
          pekerjaanIbu: 'Guru',
          email: 'fadli.rahman@gmail.com',
          hafalan: 'Surat Al-Fatihah, Al-Ikhlas, An-Nas, Al-Falaq',
          prestasi: '-',
          tanggalDaftar: '14 Januari 2025, 14:15 WITA',
          status: 'Berkas Lengkap (Menunggu Jadwal Observasi)',
          jadwalObservasi: 'Sabtu, 15 Maret 2025 | Pukul 09.00 WITA | Gedung TKIT'
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRecords));
    }
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
              <li>Hadir di kampus SIT Bina Insan Parepare tepat waktu sesuai jadwal observasi yang tertera di atas.</li>
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
              Daftarkan Santri Lainnya
            </button>
          </div>
        </div>
      </div>
    `;

    // Hook 'Daftarkan Santri Lainnya'
    document.getElementById('btn-register-again')?.addEventListener('click', () => {
      resetRegistrationForm();
    });
  }

  // Handle Form Submission
  function submitRegistration() {
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
    let jadwalObservasi = 'Sabtu, 15 Maret 2025 | Pukul 08.30 WITA | Kampus SIT Bina Insan';
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

    existing.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    // Broadcast real-time ke Dashboard Admin jika terbuka di tab/jendela lain
    try {
      const ch = new BroadcastChannel('sit_spmb_realtime');
      ch.postMessage({ type: 'spmb_new_registration', data: newRecord, timestamp: Date.now() });
      ch.close();
    } catch (e) {}

    // Kirim data ke API MySQL di cPanel secara asinkron
    if (window.fetch) {
      fetch('api/spmb.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      })
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && resData.data) {
          // Sinkronisasi data pendaftar resmi dari database MySQL
          const savedReg = resData.data.regNumber || newRecord.regNumber;
          newRecord.regNumber = savedReg;
          // Perbarui di LocalStorage lokal
          const idx = existing.findIndex(r => r.nik === newRecord.nik);
          if (idx !== -1) {
            existing[idx] = resData.data;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
          }
          // Re-render tiket resmi
          generateTicket(resData.data);
        }
      })
      .catch(err => {
        // Fallback: server statis tanpa PHP / offline
        console.log('Mode offline / LocalStorage aktif:', err.message);
      });
    }

    // Render Ticket langsung agar calon murid tidak menunggu
    generateTicket(newRecord);

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
    
    // Switch to registration form tab
    const pendaftaranTabBtn = document.querySelector('.spmb-tab-btn[data-tab="form"]');
    if (pendaftaranTabBtn) pendaftaranTabBtn.click();

    // Reset to step 1
    currentStep = 1;
    updateStepUI();

    // Check radio
    const radio = document.querySelector(`input[name="jenjang"][value="${jenjangId}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }
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
    initStorage();
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
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
