/**
 * SIT BINA INSAN PAREPARE - ADMIN DASHBOARD SCRIPT
 * Authentication, SPMB Student Management, News CMS, Settings & Data Export
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_SPMB = 'sit_bina_insan_spmb_data';
  const STORAGE_ARTICLES = 'sit_bina_insan_articles_data';
  const STORAGE_SETTINGS = 'sit_bina_insan_settings';
  const STORAGE_SESSION = 'sit_admin_session';

  // Default Credentials for Admin
  const DEFAULT_USER = 'admin';
  const DEFAULT_PASS = 'adminbina2025';

  // State
  let spmbList = [];
  let articleList = [];
  let settings = {};
  let currentEditingArticleId = null;

  // Solid SVG Icon Templates (Professional UI)
  const ICONS = {
    eye: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" /></svg>`,
    pencil: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.414.336-.75.75-.75H10a.75.75 0 0 1 0 1.5H4.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V11a.75.75 0 0 1 1.5 0v3.25a1.75 1.75 0 0 1-1.75 1.75H4.25A1.75 1.75 0 0 1 2.5 14.25V5.75Z" /></svg>`,
    printer: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.5A1.75 1.75 0 0 1 13.25 8H6.75A1.75 1.75 0 0 1 5 6.25v-3.5Zm1.5 0v3.5c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25v-3.5a.25.25 0 0 0-.25-.25h-6.5a.25.25 0 0 0-.25.25Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M2.5 7A2.5 2.5 0 0 0 0 9.5v5A2.5 2.5 0 0 0 2.5 17h1.75v-3.25a.75.75 0 0 1 .75-.75h10a.75.75 0 0 1 .75.75V17h1.75a2.5 2.5 0 0 0 2.5-2.5v-5A2.5 2.5 0 0 0 17.5 7H2.5ZM5.75 14.5v3.75c0 .414.336.75.75.75h7a.75.75 0 0 0 .75-.75V14.5H5.75ZM15.5 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>`,
    trash: `<svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" /></svg>`,
    whatsapp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.761.854 2.806.854 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.769-5.768-5.769zm10.024 5.828c0 5.549-4.512 10.063-10.063 10.063-1.745 0-3.385-.45-4.821-1.242l-5.171 1.357 1.381-5.042c-.878-1.488-1.389-3.23-1.389-5.136 0-5.551 4.514-10.063 10.063-10.063 5.551 0 10.063 4.512 10.063 10.063zm-5.077 3.563c-.22-.11-1.3-.641-1.501-.715-.201-.073-.347-.11-.494.11-.146.22-.567.715-.695.861-.128.147-.256.165-.476.055-.22-.11-.931-.343-1.774-1.094-.656-.585-1.099-1.308-1.227-1.528-.128-.22-.014-.339.096-.449.099-.098.22-.256.33-.385.11-.128.146-.22.22-.366.073-.147.037-.275-.018-.385-.055-.11-.494-1.191-.677-1.631-.178-.429-.359-.371-.494-.378l-.421-.007c-.146 0-.384.055-.585.275-.202.22-.769.751-.769 1.831s.787 2.124.897 2.271c.11.147 1.549 2.366 3.753 3.318.524.227.933.362 1.252.464.526.167 1.005.144 1.383.087.422-.063 1.3-.532 1.483-1.044.183-.513.183-.952.128-1.044-.055-.092-.201-.147-.421-.257z"/></svg>`,
    checkCircle: `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>`,
    clock: `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd"/></svg>`,
    hourglass: `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>`,
    xCircle: `<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd"/></svg>`
  };

  // DOM Elements
  const loginOverlay = document.getElementById('admin-login-overlay');
  const loginForm = document.getElementById('admin-login-form');
  const loginError = document.getElementById('admin-login-error');
  const logoutBtn = document.getElementById('admin-logout-btn');

  const navItemBtns = document.querySelectorAll('.sidebar-item-btn');
  const adminPanels = document.querySelectorAll('.admin-panel');
  const topbarTitle = document.getElementById('admin-page-title');
  const topbarDesc = document.getElementById('admin-page-desc');

  // Modals
  const applicantModal = document.getElementById('modal-applicant-detail');
  const articleModal = document.getElementById('modal-article-editor');
  const toastEl = document.getElementById('admin-toast');

  // =========================================================================
  // Initialization & Data Loading
  // =========================================================================
  function initData() {
    // 1. Load SPMB Data
    const rawSpmb = localStorage.getItem(STORAGE_SPMB);
    if (rawSpmb) {
      try {
        spmbList = JSON.parse(rawSpmb);
      } catch (e) {
        spmbList = [];
      }
    } else {
      // Seed fallback
      spmbList = [
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
          email: 'fadli.rahman@gmail.com',
          hafalan: 'Surat Al-Fatihah, Al-Ikhlas, An-Nas, Al-Falaq',
          prestasi: '-',
          tanggalDaftar: '14 Januari 2025, 14:15 WITA',
          status: 'Menunggu Konfirmasi Pembayaran',
          jadwalObservasi: 'Sabtu, 15 Maret 2025 | Pukul 09.00 WITA | Gedung TKIT'
        }
      ];
      localStorage.setItem(STORAGE_SPMB, JSON.stringify(spmbList));
    }

    // 2. Load Articles
    const rawArticles = localStorage.getItem(STORAGE_ARTICLES);
    if (rawArticles) {
      try {
        articleList = JSON.parse(rawArticles);
      } catch (e) {
        articleList = (window.SchoolData && window.SchoolData.articles) || [];
      }
    } else if (window.SchoolData && window.SchoolData.articles) {
      articleList = [...window.SchoolData.articles];
      localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(articleList));
    }

    // 3. Load Settings
    const rawSettings = localStorage.getItem(STORAGE_SETTINGS);
    if (rawSettings) {
      try {
        settings = JSON.parse(rawSettings);
      } catch (e) {
        settings = getDefaultSettings();
      }
    } else {
      settings = getDefaultSettings();
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    }

    // 4. Sinkronisasi Data dari MySQL Database jika online di cPanel
    syncFromDatabase();
  }

  function syncFromDatabase() {
    if (!window.fetch) return;

    // Load SPMB Applicants from MySQL
    fetch('api/spmb.php')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          spmbList = resData.data;
          localStorage.setItem(STORAGE_SPMB, JSON.stringify(spmbList));
          renderDashboard();
          renderSpmbTable();
        }
      })
      .catch(e => console.log('SPMB MySQL sync: offline / fallback aktif'));

    // Load Articles from MySQL
    fetch('api/articles.php')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          articleList = resData.data;
          localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(articleList));
          renderDashboard();
          renderArticlesTable();
        }
      })
      .catch(e => console.log('Articles MySQL sync: offline / fallback aktif'));

    // Load Settings from MySQL
    fetch('api/settings.php')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && resData.data) {
          settings = resData.data;
          localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
          renderSettingsForm();
        }
      })
      .catch(e => console.log('Settings MySQL sync: offline / fallback aktif'));
  }

  function getDefaultSettings() {
    return {
      activeWave: "Gelombang 1 (Early Bird)",
      tkitFee: "Rp 200.000",
      sditFee: "Rp 250.000",
      smpitFee: "Rp 300.000",
      whatsappHelpdesk: "6281234567890",
      bankAccount: "Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare"
    };
  }

  // =========================================================================
  // Authentication
  // =========================================================================
  function checkAuth() {
    const session = localStorage.getItem(STORAGE_SESSION);
    if (session === 'authenticated') {
      loginOverlay.classList.add('hidden');
    } else {
      loginOverlay.classList.remove('hidden');
    }
  }

  function initAuthEvents() {
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();

      // 1. Verifikasi kredensial default admin terlebih dahulu (kompatibel penuh di Vercel & offline)
      if (user === DEFAULT_USER && pass === DEFAULT_PASS) {
        localStorage.setItem(STORAGE_SESSION, 'authenticated');
        loginOverlay.classList.add('hidden');
        loginError.style.display = 'none';
        showToast('Berhasil masuk ke Dashboard Admin SIT Bina Insan!');
        syncFromDatabase();
        refreshAllViews();
        return;
      }

      // 2. Jika bukan kredensial default, cek ke MySQL API cPanel jika backend tersedia
      fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      })
      .then(res => {
        if (!res.ok) throw new Error('API status ' + res.status);
        return res.json();
      })
      .then(resData => {
        if (resData && resData.success) {
          localStorage.setItem(STORAGE_SESSION, 'authenticated');
          loginOverlay.classList.add('hidden');
          loginError.style.display = 'none';
          showToast(resData.message || 'Berhasil masuk ke Dashboard Admin SIT Bina Insan!');
          syncFromDatabase();
          refreshAllViews();
        } else {
          loginError.textContent = resData.message || 'Username atau Password salah!';
          loginError.style.display = 'block';
        }
      })
      .catch(() => {
        loginError.textContent = 'Username atau Password salah! Gunakan admin / adminbina2025.';
        loginError.style.display = 'block';
      });
    });

    logoutBtn?.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari sistem admin?')) {
        localStorage.removeItem(STORAGE_SESSION);
        loginOverlay.classList.remove('hidden');
        loginForm.reset();
      }
    });
  }

  // =========================================================================
  // Navigation & Panel Switching
  // =========================================================================
  const panelMeta = {
    dashboard: {
      title: "Dashboard & Ringkasan",
      desc: "Ringkasan statistik SPMB, pendaftar terbaru, dan status sekolah."
    },
    spmb: {
      title: "Kelola Data Siswa Baru (SPMB)",
      desc: "Verifikasi formulir, ubah status seleksi, dan cetak kartu pendaftar."
    },
    berita: {
      title: "Kelola Berita & Artikel",
      desc: "Tambah, sunting, dan publikasikan informasi kegiatan serta opini sekolah."
    },
    settings: {
      title: "Pengaturan SPMB & Sekolah",
      desc: "Konfigurasi gelombang pendaftaran, biaya infaq, kontak WA, dan rekening BSI."
    }
  };

  function switchPanel(panelName) {
    adminPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${panelName}`);
    });

    navItemBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panelName);
    });

    if (panelMeta[panelName]) {
      topbarTitle.textContent = panelMeta[panelName].title;
      topbarDesc.textContent = panelMeta[panelName].desc;
    }

    if (panelName === 'dashboard') renderDashboard();
    if (panelName === 'spmb') renderSpmbTable();
    if (panelName === 'berita') renderArticlesTable();
    if (panelName === 'settings') renderSettingsForm();
  }

  function initNavEvents() {
    navItemBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        switchPanel(panel);
      });
    });
  }

  // =========================================================================
  // View 1: Dashboard Panel
  // =========================================================================
  function renderDashboard() {
    const totalCount = spmbList.length;
    const tkitCount = spmbList.filter(s => s.jenjang === 'tkit').length;
    const sditCount = spmbList.filter(s => s.jenjang === 'sdit').length;
    const smpitCount = spmbList.filter(s => s.jenjang === 'smpit').length;
    const articleCount = articleList.length;

    // Badges & Counters
    document.getElementById('stat-total-spmb').textContent = totalCount;
    document.getElementById('stat-tkit').textContent = tkitCount;
    document.getElementById('stat-sdit').textContent = sditCount;
    document.getElementById('stat-smpit').textContent = smpitCount;
    document.getElementById('stat-articles').textContent = articleCount;

    // Sidebar counter
    document.getElementById('sidebar-spmb-count').textContent = totalCount;
    document.getElementById('sidebar-news-count').textContent = articleCount;

    // Calculate Estimated Infaq
    let totalInfaq = 0;
    spmbList.forEach(s => {
      if (s.jenjang === 'tkit') totalInfaq += 200000;
      else if (s.jenjang === 'sdit') totalInfaq += 250000;
      else if (s.jenjang === 'smpit') totalInfaq += 300000;
    });
    const formattedInfaq = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalInfaq);
    document.getElementById('stat-infaq-est').textContent = formattedInfaq;

    // Recent 5 Applicants Table
    const recentWrap = document.getElementById('dashboard-recent-table');
    if (!recentWrap) return;

    const recent = spmbList.slice(0, 5);
    if (recent.length === 0) {
      recentWrap.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:2rem;">Belum ada calon santri yang mendaftar.</td></tr>`;
      return;
    }

    recentWrap.innerHTML = recent.map(item => `
      <tr class="hover:bg-slate-50/80 transition duration-150">
        <td class="py-4 px-6 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
          ${item.regNumber}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="font-bold text-slate-900">${escapeHtml(item.namaSiswa)}</div>
          <span class="text-xs text-slate-400">Jalur ${escapeHtml(item.jalur ? item.jalur.toUpperCase() : 'Reguler')}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderJenjangBadge(item.jenjang)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          <span class="font-medium text-slate-800">${item.tanggalDaftar}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderStatusBadge(item.status)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-center">
          <button class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors" title="Lihat Detail Pendaftar" type="button" onclick="window.viewApplicantDetail('${item.regNumber}')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // View 2: SPMB Management Panel (Kelola Siswa Baru)
  // =========================================================================
  let spmbFilterJenjang = 'all';
  let spmbFilterStatus = 'all';
  let spmbSearchQuery = '';

  function renderSpmbTable() {
    const tableBody = document.getElementById('spmb-table-body');
    if (!tableBody) return;

    let filtered = [...spmbList];

    // Filter Jenjang
    if (spmbFilterJenjang !== 'all') {
      filtered = filtered.filter(s => s.jenjang === spmbFilterJenjang);
    }

    // Filter Status
    if (spmbFilterStatus !== 'all') {
      filtered = filtered.filter(s => s.status.toLowerCase().includes(spmbFilterStatus.toLowerCase()));
    }

    // Filter Search
    if (spmbSearchQuery.trim() !== '') {
      const q = spmbSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.regNumber.toLowerCase().includes(q) ||
        s.namaSiswa.toLowerCase().includes(q) ||
        s.nik.includes(q) ||
        (s.namaAyah && s.namaAyah.toLowerCase().includes(q))
      );
    }

    document.getElementById('spmb-filter-count').textContent = `Menampilkan ${filtered.length} dari ${spmbList.length} pendaftar`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2.5rem;">Tidak ada data pendaftar yang cocok dengan filter.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(item => `
      <tr class="hover:bg-slate-50/80 transition duration-150">
        <td class="py-4 px-6 whitespace-nowrap font-mono text-xs font-bold text-emerald-700">
          ${item.regNumber}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="font-bold text-slate-900">${escapeHtml(item.namaSiswa)}</div>
          <span class="text-xs text-slate-400 font-mono">NIK: ${item.nik}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderJenjangBadge(item.jenjang)}
          <span class="text-[11px] text-slate-400 block mt-1 uppercase font-medium tracking-wider">${item.jalur ? item.jalur.toUpperCase() : 'REGULER'}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="font-medium text-slate-800 text-xs">${escapeHtml(item.namaAyah || '-')}</div>
          <a href="https://wa.me/${formatWa(item.waAyah)}?text=${encodeURIComponent('Assalamu\'alaikum Bapak/Ibu wali dari ' + item.namaSiswa + ', kami dari Panitia SPMB SIT Bina Insan Parepare ingin mengonfirmasi pendaftaran ' + item.regNumber + '.')}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-1" title="Kirim WhatsApp ke Orang Tua">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.761.854 2.806.854 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.769-5.768-5.769zm10.024 5.828c0 5.549-4.512 10.063-10.063 10.063-1.745 0-3.385-.45-4.821-1.242l-5.171 1.357 1.381-5.042c-.878-1.488-1.389-3.23-1.389-5.136 0-5.551 4.514-10.063 10.063-10.063 5.551 0 10.063 4.512 10.063 10.063z"/></svg>
            <span>${item.waAyah}</span>
          </a>
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          <span class="font-medium text-slate-800">${item.tanggalDaftar}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderStatusBadge(item.status)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Detail & Verifikasi Berkas">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </button>
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors" onclick="window.printApplicantCard('${item.regNumber}')" title="Cetak Kartu Tanda Peserta">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24-1.047-.37-2.14-.37-3.26 0-5.523 4.477-10 10-10 1.12 0 2.213.13 3.26.37m-3.26 19.63c-1.047.24-2.14.37-3.26.37-5.523 0-10-4.477-10-10 0-1.12.13-2.213.37-3.26M6.75 6.75h10.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-7.5a2.25 2.25 0 012.25-2.25z" /></svg>
            </button>
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors" onclick="window.deleteApplicant('${item.regNumber}')" title="Hapus Data Siswa">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function initSpmbControls() {
    const filterJenjang = document.getElementById('spmb-filter-jenjang');
    const filterStatus = document.getElementById('spmb-filter-status');
    const searchInput = document.getElementById('spmb-search-input');
    const exportBtn = document.getElementById('spmb-export-btn');

    filterJenjang?.addEventListener('change', (e) => {
      spmbFilterJenjang = e.target.value;
      renderSpmbTable();
    });

    filterStatus?.addEventListener('change', (e) => {
      spmbFilterStatus = e.target.value;
      renderSpmbTable();
    });

    searchInput?.addEventListener('input', (e) => {
      spmbSearchQuery = e.target.value;
      renderSpmbTable();
    });

    exportBtn?.addEventListener('click', exportSpmbToCsv);
  }

  // Export CSV
  function exportSpmbToCsv() {
    if (spmbList.length === 0) {
      alert('Tidak ada data pendaftar untuk diekspor.');
      return;
    }

    const headers = [
      'No. Registrasi', 'Jenjang', 'Jalur', 'Nama Lengkap Siswa', 'NIK', 'TTL', 'Jenis Kelamin',
      'Asal Sekolah', 'Alamat', 'Nama Ayah', 'Pekerjaan Ayah', 'No WA Ayah', 'Nama Ibu', 'Email',
      'Hafalan Quran', 'Prestasi', 'Tanggal Daftar', 'Status', 'Jadwal Observasi'
    ];

    const rows = spmbList.map(s => [
      s.regNumber,
      s.jenjang.toUpperCase(),
      s.jalur.toUpperCase(),
      `"${(s.namaSiswa || '').replace(/"/g, '""')}"`,
      `'${s.nik}'`,
      `"${(s.ttl || '').replace(/"/g, '""')}"`,
      s.jk,
      `"${(s.asalSekolah || '').replace(/"/g, '""')}"`,
      `"${(s.alamat || '').replace(/"/g, '""')}"`,
      `"${(s.namaAyah || '').replace(/"/g, '""')}"`,
      `"${(s.pekerjaanAyah || '').replace(/"/g, '""')}"`,
      `'${s.waAyah}'`,
      `"${(s.namaIbu || '').replace(/"/g, '""')}"`,
      s.email || '',
      `"${(s.hafalan || '').replace(/"/g, '""')}"`,
      `"${(s.prestasi || '').replace(/"/g, '""')}"`,
      s.tanggalDaftar,
      `"${(s.status || '').replace(/"/g, '""')}"`,
      `"${(s.jadwalObservasi || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_SPMB_SIT_BINA_INSAN_PAREPARE_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV pendaftar berhasil diunduh!');
  }

  // Modal Detail & Verifikasi Siswa
  window.viewApplicantDetail = function (regNumber) {
    const item = spmbList.find(s => s.regNumber === regNumber);
    if (!item) return;

    document.getElementById('modal-app-reg').textContent = item.regNumber;
    document.getElementById('modal-app-name').textContent = item.namaSiswa;
    document.getElementById('modal-app-jenjang').textContent = `${item.jenjang.toUpperCase()} (${item.jalur.toUpperCase()})`;
    document.getElementById('modal-app-nik').textContent = item.nik;
    document.getElementById('modal-app-ttl').textContent = item.ttl;
    document.getElementById('modal-app-jk').textContent = item.jk;
    document.getElementById('modal-app-sekolah').textContent = item.asalSekolah;
    document.getElementById('modal-app-alamat').textContent = item.alamat;
    document.getElementById('modal-app-ayah').textContent = `${item.namaAyah} (${item.pekerjaanAyah || '-'})`;
    document.getElementById('modal-app-ibu').textContent = `${item.namaIbu}`;
    document.getElementById('modal-app-wa').textContent = item.waAyah;
    document.getElementById('modal-app-email').textContent = item.email || '-';
    document.getElementById('modal-app-hafalan').textContent = item.hafalan || 'Belum ada';
    document.getElementById('modal-app-prestasi').textContent = item.prestasi || '-';

    // Status Select & Jadwal input
    const statusSelect = document.getElementById('modal-app-status-select');
    statusSelect.value = item.status;
    document.getElementById('modal-app-jadwal').value = item.jadwalObservasi || '';

    // Direct WhatsApp Button in modal
    const waModalBtn = document.getElementById('modal-app-wa-btn');
    if (waModalBtn) {
      waModalBtn.href = `https://wa.me/${formatWa(item.waAyah)}?text=${encodeURIComponent('Assalamu\'alaikum Bapak/Ibu wali dari ' + item.namaSiswa + ', kami dari Panitia SPMB SIT Bina Insan Parepare ingin mengonfirmasi status pendaftaran: ' + item.regNumber + '.')}`;
    }

    // Save changes handler
    const saveBtn = document.getElementById('modal-app-save-btn');
    saveBtn.onclick = function () {
      const newStatus = statusSelect.value;
      const newJadwal = document.getElementById('modal-app-jadwal').value.trim();
      item.status = newStatus;
      item.jadwalObservasi = newJadwal;
      localStorage.setItem(STORAGE_SPMB, JSON.stringify(spmbList));

      // Kirim pembaruan status ke MySQL di cPanel
      if (window.fetch) {
        fetch('api/spmb.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reg_number: item.regNumber,
            status: newStatus,
            jadwal_observasi: newJadwal
          })
        })
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success) {
            console.log('SPMB updated in MySQL:', resData.message);
          }
        })
        .catch(e => console.log('Update MySQL fallback to localStorage'));
      }

      applicantModal.classList.remove('open');
      renderSpmbTable();
      renderDashboard();
      showToast(`Status ${item.regNumber} berhasil diperbarui!`);
    };

    applicantModal.classList.add('open');
  };

  window.printApplicantCard = function (regNumber) {
    // Open main page and trigger print ticket
    window.open(`index.html#spmb`, '_blank');
    alert(`Untuk mencetak kartu ${regNumber}, silakan buka menu 'Cek Status Pendaftaran' di tab website yang terbuka dan masukkan nomor registrasi tersebut.`);
  };

  window.deleteApplicant = function (regNumber) {
    if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar ${regNumber}? Tindakan ini tidak dapat dibatalkan.`)) {
      spmbList = spmbList.filter(s => s.regNumber !== regNumber);
      localStorage.setItem(STORAGE_SPMB, JSON.stringify(spmbList));

      // Hapus dari MySQL database di cPanel
      if (window.fetch) {
        fetch(`api/spmb.php?reg_number=${encodeURIComponent(regNumber)}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success) {
            console.log('SPMB deleted from MySQL:', resData.message);
          }
        })
        .catch(e => console.log('Delete MySQL fallback to localStorage'));
      }

      renderSpmbTable();
      renderDashboard();
      showToast(`Data pendaftar ${regNumber} telah dihapus.`);
    }
  };

  // =========================================================================
  // View 3: News & Articles CMS (Kelola Berita & Artikel)
  // =========================================================================
  function renderArticlesTable() {
    const tableBody = document.getElementById('articles-table-body');
    if (!tableBody) return;

    if (articleList.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:2rem;">Belum ada artikel yang diterbitkan.</td></tr>`;
      return;
    }

    tableBody.innerHTML = articleList.map(item => `
      <tr class="hover:bg-slate-50/80 transition duration-150">
        <td class="py-4 px-6 whitespace-nowrap">
          <img src="${item.image}" alt="" class="w-14 h-10 object-cover rounded-lg border border-slate-200 shadow-sm">
        </td>
        <td class="py-4 px-6">
          <div class="font-bold text-slate-900 text-sm">${escapeHtml(item.title)}</div>
          <div class="text-xs text-slate-400 line-clamp-1 mt-0.5">${escapeHtml((item.excerpt || '').slice(0, 75))}...</div>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">${item.category}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          <span class="font-medium text-slate-800">${item.date}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          ${escapeHtml(item.author)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors" onclick="window.editArticle(${item.id})" title="Sunting Berita">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </button>
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors" onclick="window.deleteArticle(${item.id})" title="Hapus Berita">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function initArticleEditor() {
    const addBtn = document.getElementById('btn-add-article');
    const editorForm = document.getElementById('form-article-editor');

    addBtn?.addEventListener('click', () => {
      currentEditingArticleId = null;
      document.getElementById('editor-modal-title').textContent = 'Tulis Berita / Artikel Baru';
      editorForm.reset();
      document.getElementById('article-date').value = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('article-image').value = '/assets/images/hero_school.jpg?v=2';
      articleModal.classList.add('open');
    });

    editorForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('article-title').value.trim();
      const category = document.getElementById('article-category').value;
      const author = document.getElementById('article-author').value.trim();
      const date = document.getElementById('article-date').value.trim();
      const readTime = document.getElementById('article-readtime').value.trim() || '3 menit baca';
      const image = document.getElementById('article-image').value.trim();
      const excerpt = document.getElementById('article-excerpt').value.trim();
      const content = document.getElementById('article-content').value.trim();

      let categoryClass = 'badge-kegiatan';
      if (category === 'Info SPMB') categoryClass = 'badge-spmb';
      else if (category === 'Prestasi') categoryClass = 'badge-prestasi';
      else if (category === 'Opini Islami') categoryClass = 'badge-opini';

      const payload = {
        title, category, categoryClass, author, date, readTime, image, excerpt, content
      };

      if (currentEditingArticleId) {
        // Update Local
        const idx = articleList.findIndex(a => a.id === currentEditingArticleId);
        if (idx !== -1) {
          articleList[idx] = {
            ...articleList[idx],
            ...payload
          };
          showToast('Artikel berhasil diperbarui!');
        }

        // Update MySQL cPanel
        if (window.fetch) {
          fetch('api/articles.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentEditingArticleId, ...payload })
          })
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.success) {
              console.log('Article updated in MySQL:', resData.message);
            }
          })
          .catch(e => console.log('Update article MySQL fallback'));
        }
      } else {
        // Create new
        const newId = articleList.length > 0 ? Math.max(...articleList.map(a => a.id)) + 1 : 1;
        const newArticle = {
          id: newId,
          ...payload
        };
        articleList.unshift(newArticle);
        showToast('Berita baru berhasil diterbitkan ke website!');

        // Create MySQL cPanel
        if (window.fetch) {
          fetch('api/articles.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(res => res.json())
          .then(resData => {
            if (resData && resData.success && resData.data) {
              newArticle.id = resData.data.id;
              localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(articleList));
              renderArticlesTable();
            }
          })
          .catch(e => console.log('Create article MySQL fallback'));
        }
      }

      localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(articleList));
      articleModal.classList.remove('open');
      renderArticlesTable();
      renderDashboard();
    });
  }

  window.editArticle = function (id) {
    const item = articleList.find(a => a.id === id);
    if (!item) return;

    currentEditingArticleId = id;
    document.getElementById('editor-modal-title').textContent = 'Sunting Berita / Artikel';
    document.getElementById('article-title').value = item.title;
    document.getElementById('article-category').value = item.category;
    document.getElementById('article-author').value = item.author;
    document.getElementById('article-date').value = item.date;
    document.getElementById('article-readtime').value = item.readTime;
    document.getElementById('article-image').value = item.image;
    document.getElementById('article-excerpt').value = item.excerpt;
    document.getElementById('article-content').value = item.content;

    articleModal.classList.add('open');
  };

  window.deleteArticle = function (id) {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini dari website?')) {
      articleList = articleList.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_ARTICLES, JSON.stringify(articleList));

      // Hapus dari MySQL cPanel
      if (window.fetch) {
        fetch(`api/articles.php?id=${id}`, {
          method: 'DELETE'
        })
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success) {
            console.log('Article deleted from MySQL:', resData.message);
          }
        })
        .catch(e => console.log('Delete article MySQL fallback'));
      }

      renderArticlesTable();
      renderDashboard();
      showToast('Artikel berhasil dihapus.');
    }
  };

  // =========================================================================
  // View 4: Settings Management (Pengaturan SPMB & Kontak)
  // =========================================================================
  function renderSettingsForm() {
    document.getElementById('set-wave').value = settings.activeWave || 'Gelombang 1 (Early Bird)';
    document.getElementById('set-tkit-fee').value = settings.tkitFee || 'Rp 200.000';
    document.getElementById('set-sdit-fee').value = settings.sditFee || 'Rp 250.000';
    document.getElementById('set-smpit-fee').value = settings.smpitFee || 'Rp 300.000';
    document.getElementById('set-wa').value = settings.whatsappHelpdesk || '6281234567890';
    document.getElementById('set-bank').value = settings.bankAccount || '';
  }

  function initSettingsForm() {
    const form = document.getElementById('form-school-settings');
    const resetBtn = document.getElementById('btn-reset-sample-data');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      settings = {
        activeWave: document.getElementById('set-wave').value,
        tkitFee: document.getElementById('set-tkit-fee').value.trim(),
        sditFee: document.getElementById('set-sdit-fee').value.trim(),
        smpitFee: document.getElementById('set-smpit-fee').value.trim(),
        whatsappHelpdesk: document.getElementById('set-wa').value.trim(),
        bankAccount: document.getElementById('set-bank').value.trim()
      };

      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));

      // Simpan ke MySQL cPanel
      if (window.fetch) {
        fetch('api/settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        })
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success) {
            console.log('Settings saved to MySQL:', resData.message);
          }
        })
        .catch(e => console.log('Save settings MySQL fallback'));
      }

      showToast('Pengaturan sekolah & SPMB berhasil disimpan!');
    });

    resetBtn?.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin mengatur ulang data contoh (reset)? Semua data pendaftaran uji coba akan dikembalikan ke data awal.')) {
        localStorage.removeItem(STORAGE_SPMB);
        localStorage.removeItem(STORAGE_ARTICLES);
        localStorage.removeItem(STORAGE_SETTINGS);
        initData();
        refreshAllViews();
        showToast('Data berhasil di-reset ke nilai default.');
      }
    });
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function renderJenjangBadge(jenjang) {
    const j = (jenjang || '').toLowerCase();
    if (j === 'tkit') {
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">TKIT</span>`;
    }
    if (j === 'smpit') {
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">SMPIT</span>`;
    }
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">SDIT</span>`;
  }

  function renderStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('lulus') || s.includes('diterima')) {
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('terverifikasi') || s.includes('jadwal')) {
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('menunggu') || s.includes('pembayaran')) {
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('tidak') || s.includes('tolak')) {
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>${escapeHtml(status)}</span></span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><span>${escapeHtml(status)}</span></span>`;
  }

  function formatWa(num) {
    if (!num) return '6281234567890';
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show', 'success');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3500);
  }

  function refreshAllViews() {
    renderDashboard();
    renderSpmbTable();
    renderArticlesTable();
    renderSettingsForm();
  }

  // Close Modals
  function initModals() {
    document.querySelectorAll('.adm-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        applicantModal?.classList.remove('open');
        articleModal?.classList.remove('open');
      });
    });

    [applicantModal, articleModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });
  }

  // =========================================================================
  // App Boot
  // =========================================================================
  function init() {
    initData();
    checkAuth();
    initAuthEvents();
    initNavEvents();
    initSpmbControls();
    initArticleEditor();
    initSettingsForm();
    initModals();
    refreshAllViews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
