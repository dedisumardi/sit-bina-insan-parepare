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

  // State
  let spmbList = [];
  let articleList = [];
  let settings = {};
  let currentEditingArticleId = null;

  function cacheSetItem(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* Database remains authoritative when browser storage is full. */ }
  }

  // Real-Time Cross-Tab / Cross-Window Synchronization
  let realtimeChannel = null;
  try {
    realtimeChannel = new BroadcastChannel('sit_spmb_realtime');
    realtimeChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === 'spmb_new_registration') {
        syncFromDatabase(true);
        showToast('Pendaftar SPMB baru masuk secara real-time!');
      } else if (msg.type === 'spmb_proof_uploaded') {
        syncFromDatabase(true);
        showToast('💳 Bukti pembayaran baru diunggah oleh calon wali siswa!');
      }
    };
  } catch (e) {
    console.log('BroadcastChannel fallback');
  }

  function broadcastRealtime(type, data) {
    if (realtimeChannel) {
      try {
        realtimeChannel.postMessage({ type, data, timestamp: Date.now() });
      } catch (e) {}
    }
  }

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
  async function apiRequest(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    let result = null;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error('Respons server tidak valid.');
    }
    if (!response.ok || !result || !result.success) {
      throw new Error(result?.message || `Permintaan database gagal (${response.status}).`);
    }
    return result;
  }

  function initData() {
    // Nilai bawaan hanya dipakai selama proses memuat. Database adalah sumber data utama.
    spmbList = [];
    articleList = [];
    settings = getDefaultSettings();
  }

  async function syncFromDatabase(showFailure = false) {
    try {
      const [spmbResult, articleResult, settingsResult] = await Promise.all([
        apiRequest('api/spmb.php'),
        apiRequest('api/articles.php'),
        apiRequest('api/settings.php')
      ]);

      spmbList = Array.isArray(spmbResult.data) ? spmbResult.data : [];
      articleList = Array.isArray(articleResult.data) ? articleResult.data : [];
      settings = Object.assign({}, getDefaultSettings(), settingsResult.data || {});

      // Cache ini hanya untuk memperbarui halaman publik pada tab yang sama; bukan sumber utama admin.
      cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));
      cacheSetItem(STORAGE_ARTICLES, JSON.stringify(articleList));
      cacheSetItem(STORAGE_SETTINGS, JSON.stringify(settings));
      refreshAllViews();
    } catch (error) {
      console.error('Gagal memuat database:', error);
      if (showFailure) showToast(`Gagal memuat database: ${error.message}`, true);
    }
  }

  const WAVE_PRESETS = {
    "Gelombang 1 (Early Bird)": {
      name: "Gelombang 1 (Early Bird)",
      dates: "1 Nov 2024 s/d 31 Jan 2025",
      status: "open",
      notice: "Pendaftaran Gelombang 1 (Early Bird) Sedang Berlangsung!"
    },
    "Gelombang 2 (Reguler)": {
      name: "Gelombang 2 (Reguler)",
      dates: "1 Feb 2025 s/d 30 Apr 2025",
      status: "open",
      notice: "Pendaftaran Gelombang 2 (Reguler) Sedang Berlangsung!"
    },
    "Gelombang 3": {
      name: "Gelombang 3",
      dates: "1 Mei 2025 s/d Kuota Terpenuhi",
      status: "open",
      notice: "Pendaftaran Gelombang 3 Resmi Dibuka! Segera daftarkan ananda."
    },
    "Pendaftaran Ditutup": {
      name: "Pendaftaran Ditutup Sementara",
      dates: "Sampai pembukaan gelombang berikutnya",
      status: "closed",
      notice: "Pendaftaran SPMB Ditutup Sementara. Pantau pengumuman gelombang berikutnya."
    }
  };

  function getDefaultSettings() {
    return {
      academicYear: "2026/2027",
      activeWave: "wave1",
      waveName: "Gelombang 1",
      waveDates: "1 Januari 2027 s/d 31 Maret 2027",
      waveStatus: "open",
      waveNotice: "Pendaftaran Gelombang 1 Sedang Berlangsung! Dapatkan Diskon Infaq Rp 500.000",
      wave1Name: "Gelombang 1",
      wave1Promo: "Diskon Rp500.000",
      wave1Dates: "1 Januari 2027 s/d 31 Maret 2027",
      wave2Name: "Gelombang 2",
      wave2Promo: "Reguler",
      wave2Dates: "1 April 2027 s/d 31 Mei 2027",
      wave3Name: "Gelombang 3",
      wave3Promo: "S/d Kuota Terpenuhi",
      wave3Dates: "1 Juni 2027 s/d Kuota Terpenuhi",
      waveDates: "1 Januari 2027 s/d 31 Maret 2027",
      wavePoint1: "Potongan Infaq Pembangunan hingga Rp 500.000",
      wavePoint2: "Prioritas Kuota Kelas & Seleksi Observasi Dini",
      wavePoint3: "Tersedia Jalur Prestasi Tahfizh & Beasiswa Yatim",
      statTk: "180+",
      statSd: "650+",
      statSmp: "420+",
      statGuru: "85+",
      tkitFee: "Rp 200.000",
      sditFee: "Rp 250.000",
      smpitFee: "Rp 300.000",
      whatsappHelpdesk: "6285190610569",
      bankAccount: "Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare"
    };
  }

  // =========================================================================
  // Authentication
  // =========================================================================
  async function checkAuth() {
    loginOverlay.classList.remove('hidden');
    try {
      await apiRequest('api/auth.php');
      loginOverlay.classList.add('hidden');
      await syncFromDatabase(true);
    } catch (error) {
      localStorage.removeItem(STORAGE_SESSION);
      loginOverlay.classList.remove('hidden');
    }
  }

  function initAuthEvents() {
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();

      apiRequest('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      })
      .then(resData => {
        localStorage.setItem(STORAGE_SESSION, 'authenticated');
        loginOverlay.classList.add('hidden');
        loginError.style.display = 'none';
        showToast(resData.message || 'Berhasil masuk ke Dashboard Admin SIT Bina Insan!');
        syncFromDatabase(true);
      })
      .catch((error) => {
        loginError.textContent = error.message || 'Username atau password salah.';
        loginError.style.display = 'block';
      });
    });

    logoutBtn?.addEventListener('click', async () => {
      if (confirm('Apakah Anda yakin ingin keluar dari sistem admin?')) {
        try {
          await apiRequest('api/auth.php', { method: 'DELETE' });
        } catch (error) {
          showToast(`Gagal keluar: ${error.message}`, true);
          return;
        }
        localStorage.removeItem(STORAGE_SESSION);
        loginOverlay.classList.remove('hidden');
        loginForm.reset();
      }
    });
  }

  // =========================================================================
  // Responsive Sidebar Navigation & Hamburger Drawer
  // =========================================================================
  const sidebarEl = document.getElementById('admin-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');

  function isMobileView() {
    return window.innerWidth < 1024;
  }

  function openMobileSidebar() {
    if (!sidebarEl) return;
    sidebarEl.classList.remove('-translate-x-full');
    sidebarEl.classList.add('translate-x-0');
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('hidden');
      requestAnimationFrame(() => {
        sidebarBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        sidebarBackdrop.classList.add('opacity-100', 'pointer-events-auto');
      });
    }
    document.body.classList.add('mobile-sidebar-open');
  }

  function closeMobileSidebar() {
    if (!sidebarEl) return;
    sidebarEl.classList.add('-translate-x-full');
    sidebarEl.classList.remove('translate-x-0');
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
      sidebarBackdrop.classList.add('opacity-0', 'pointer-events-none');
      setTimeout(() => {
        if (!document.body.classList.contains('mobile-sidebar-open')) {
          sidebarBackdrop.classList.add('hidden');
        }
      }, 300);
    }
    document.body.classList.remove('mobile-sidebar-open');
  }

  function toggleSidebar() {
    if (isMobileView()) {
      if (sidebarEl && sidebarEl.classList.contains('translate-x-0')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    } else {
      // Desktop: collapse / expand
      document.body.classList.toggle('sidebar-collapsed');
      const isCollapsed = document.body.classList.contains('sidebar-collapsed');
      localStorage.setItem('sit_admin_sidebar_collapsed', isCollapsed ? '1' : '0');
    }
  }

  function initSidebar() {
    // Restore desktop collapsed state
    if (!isMobileView()) {
      const savedCollapsed = localStorage.getItem('sit_admin_sidebar_collapsed');
      if (savedCollapsed === '1') {
        document.body.classList.add('sidebar-collapsed');
      }
    }

    btnToggleSidebar?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    btnCloseSidebar?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileSidebar();
    });

    sidebarBackdrop?.addEventListener('click', () => {
      closeMobileSidebar();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileSidebar();
      }
    });

    // Handle screen resize
    window.addEventListener('resize', () => {
      if (!isMobileView()) {
        closeMobileSidebar();
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
      desc: "Konfigurasi gelombang pendaftaran, kontak WA, dan rekening BSI."
    }
  };  function switchPanel(panelName) {
    let activeTarget = panelName;
    if (panelName === 'spmb-wali') {
      activeTarget = 'spmb';
      if (window.switchSpmbSubTab) window.switchSpmbSubTab('wali');
    } else if (panelName === 'spmb') {
      if (window.switchSpmbSubTab && currentSpmbSubTab !== 'wali') window.switchSpmbSubTab('siswa');
    }

    adminPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${activeTarget}`);
    });

    navItemBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panelName);
    });

    if (panelMeta[activeTarget]) {
      topbarTitle.textContent = panelMeta[activeTarget].title;
      topbarDesc.textContent = panelMeta[activeTarget].desc;
    }

    if (activeTarget === 'dashboard') renderDashboard();
    if (activeTarget === 'spmb') renderSpmbTable();
    if (activeTarget === 'berita') renderArticlesTable();
    if (activeTarget === 'settings') renderSettingsForm();
  }
  window.switchPanel = switchPanel;

  function initNavEvents() {
    navItemBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        switchPanel(panel);
        if (isMobileView()) {
          closeMobileSidebar();
        }
      });
    });
  }

  // =========================================================================
  // View 1: Dashboard Panel
  // =========================================================================
  function renderDashboard() {
    const studentList = spmbList.filter(isStudentApplicant);
    const parentList = spmbList;
    const totalCount = studentList.length;
    const tkitCount = studentList.filter(s => s.jenjang === 'tkit').length;
    const sditCount = studentList.filter(s => s.jenjang === 'sdit').length;
    const smpitCount = studentList.filter(s => s.jenjang === 'smpit').length;
    const articleCount = articleList.length;

    // Badges & Counters
    const statTotalEl = document.getElementById('stat-total-spmb');
    if (statTotalEl) statTotalEl.textContent = totalCount;
    const statTkitEl = document.getElementById('stat-tkit');
    if (statTkitEl) statTkitEl.textContent = tkitCount;
    const statSditEl = document.getElementById('stat-sdit');
    if (statSditEl) statSditEl.textContent = sditCount;
    const statSmpitEl = document.getElementById('stat-smpit');
    if (statSmpitEl) statSmpitEl.textContent = smpitCount;
    const statArticlesEl = document.getElementById('stat-articles');
    if (statArticlesEl) statArticlesEl.textContent = articleCount;

    // Sidebar counter
    const sideSpmb = document.getElementById('sidebar-spmb-count');
    if (sideSpmb) sideSpmb.textContent = totalCount;
    const sideWali = document.getElementById('sidebar-wali-count');
    if (sideWali) sideWali.textContent = parentList.length;
    const sideNews = document.getElementById('sidebar-news-count');
    if (sideNews) sideNews.textContent = articleCount;

    // Recent 5 Applicants Table
    const recentWrap = document.getElementById('dashboard-recent-table');
    if (!recentWrap) return;

    const recent = studentList.length > 0 ? studentList.slice(0, 5) : spmbList.slice(0, 5);
    if (recent.length === 0) {
      recentWrap.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:2rem;">Belum ada calon siswa yang mendaftar.</td></tr>`;
      return;
    }

    recentWrap.innerHTML = recent.map(item => `
      <tr class="hover:bg-slate-50/80 transition duration-150">
        <td class="py-4 px-6 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
          ${escapeHtml(item.regNumber)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="font-bold text-slate-900">${escapeHtml(item.namaSiswa || item.namaAyah || '-')}</div>
          <span class="text-xs text-slate-400">Jalur ${escapeHtml(item.jalur ? item.jalur.toUpperCase() : 'Reguler')}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderJenjangBadge(item.jenjang)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          <span class="font-medium text-slate-800">${escapeHtml(item.tanggalDaftar || '-')}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${renderStatusBadge(item.status)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-center">
          <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Detail Siswa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // View 2: SPMB Management Panel (Pemisahan Calon Siswa & Akun Orang Tua)
  // =========================================================================
  let currentSpmbSubTab = 'siswa'; // 'siswa' or 'wali'
  let spmbFilterJenjang = 'all';
  let spmbFilterGelombang = 'all';
  let spmbFilterStatus = 'all';
  let spmbSearchQuery = '';
  const spmbSelectedRows = new Set();
  let spmbCurrentPage = 1;
  let spmbPageSize = 25;

  let waliFilterStatus = 'all';
  let waliSearchQuery = '';

  function formatDaftarDate(str) {
    if (!str || str === '-') return '-';
    if (str.includes(',')) return str.split(',')[0].trim();
    return str;
  }

  function formatDaftarTime(str) {
    if (!str || str === '-' || !str.includes(',')) return '';
    return str.split(',').slice(1).join(',').trim();
  }

  function getStudentWave(s) {
    if (!s) return 'wave1';
    const val = (s.gelombang || s.wave || s.waveKey || '').toLowerCase();
    if (val.includes('3') || val === 'wave3') return 'wave3';
    if (val.includes('2') || val === 'wave2') return 'wave2';
    if (val.includes('1') || val === 'wave1') return 'wave1';

    const dateStr = s.createdAt || s.tanggalDaftar || '';
    if (dateStr) {
      const lower = dateStr.toLowerCase();
      if (lower.includes('april') || lower.includes('mei') || lower.includes('/4/') || lower.includes('/5/')) {
        return 'wave2';
      }
      if (lower.includes('juni') || lower.includes('juli') || lower.includes('agustus') || lower.includes('/6/') || lower.includes('/7/') || lower.includes('/8/')) {
        return 'wave3';
      }
    }
    return 'wave1';
  }

  function getStudentWaveName(s) {
    const waveKey = getStudentWave(s);
    if (waveKey === 'wave2') return settings.wave2Name || 'Gelombang 2';
    if (waveKey === 'wave3') return settings.wave3Name || 'Gelombang 3';
    return settings.wave1Name || 'Gelombang 1';
  }

  function isPaymentApproved(item) {
    if (!item) return false;
    const s = (item.status || '').toLowerCase();
    if (s.includes('lulus') || s.includes('diterima')) return true;
    if (s.includes('cadangan')) return true;
    if (s.includes('terverifikasi')) return true;
    if (s.includes('disetujui')) return true;
    if (s.includes('jadwal') || s.includes('biodata')) return true;
    if (item.regNumber && !String(item.regNumber).startsWith('PENDING-') && String(item.regNumber).startsWith('SPMB-')) return true;
    if (item.statusPembayaran && String(item.statusPembayaran).toLowerCase() === 'lunas') return true;
    return false;
  }

  function isApplicantPassed(item) {
    if (!item) return false;
    const s = (item.status || '').toLowerCase();
    return s.includes('lulus') || s.includes('diterima');
  }

  function getFilteredStudents() {
    let students = spmbList.filter(isStudentApplicant);

    // Filter Jenjang
    if (spmbFilterJenjang !== 'all') {
      students = students.filter(s => s.jenjang === spmbFilterJenjang);
    }

    // Filter Gelombang
    if (spmbFilterGelombang !== 'all') {
      students = students.filter(s => getStudentWave(s) === spmbFilterGelombang);
    }

    // Filter Status
    if (spmbFilterStatus !== 'all') {
      if (spmbFilterStatus === 'menunggu_jadwal') {
        students = students.filter(s => {
          const hasData = Boolean(s.biodataUpdatedAt && s.parentDataUpdatedAt);
          const hasSched = Boolean(s.jadwalTes || (s.jadwalObservasi && !s.jadwalObservasi.toLowerCase().includes('menunggu') && s.jadwalObservasi !== '-'));
          return hasData && !hasSched;
        });
      } else if (spmbFilterStatus === 'jadwal_ditetapkan') {
        students = students.filter(s => {
          return Boolean(s.jadwalTes || (s.jadwalObservasi && !s.jadwalObservasi.toLowerCase().includes('menunggu') && s.jadwalObservasi !== '-'));
        });
      } else {
        students = students.filter(s => (s.status || '').toLowerCase().includes(spmbFilterStatus.toLowerCase()));
      }
    }

    // Filter Search
    if (spmbSearchQuery.trim() !== '') {
      const q = spmbSearchQuery.toLowerCase();
      students = students.filter(s =>
        (s.regNumber || '').toLowerCase().includes(q) ||
        (s.namaSiswa || '').toLowerCase().includes(q) ||
        (s.nik || '').includes(q) ||
        (s.namaAyah && s.namaAyah.toLowerCase().includes(q))
      );
    }

    return students;
  }

  function updateSelectAllCheckbox(visibleStudents) {
    const selectAll = document.getElementById('spmb-select-all');
    if (!selectAll) return;
    if (!visibleStudents || visibleStudents.length === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
      return;
    }
    const visibleRegs = visibleStudents.map(s => s.regNumber);
    const selectedCount = visibleRegs.filter(reg => spmbSelectedRows.has(reg)).length;
    if (selectedCount === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (selectedCount === visibleRegs.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  function updateBulkActionBar() {
    const bar = document.getElementById('spmb-bulk-actions');
    const countEl = document.getElementById('spmb-selected-count');
    if (!bar) return;
    const count = spmbSelectedRows.size;
    if (count > 0) {
      bar.style.display = 'flex';
      if (countEl) countEl.textContent = count;
    } else {
      bar.style.display = 'none';
      if (countEl) countEl.textContent = '0';
    }
  }

  function isStudentApplicant(s) {
    if (!s) return false;
    const isPending = (s.regNumber || '').startsWith('PENDING-');
    const isPlaceholderName = !s.namaSiswa || s.namaSiswa === '-' || s.namaSiswa.toLowerCase().startsWith('calon siswa (');
    const isPlaceholderNik = !s.nik || s.nik === '-' || s.nik.startsWith('wa-') || s.nik.startsWith('WA-');
    
    // An entry is an actual student record if:
    // It is an approved/official registration number (SPMB-...)
    // OR it has real student name and real NIK
    if (!isPending) return true;
    return (!isPlaceholderName && !isPlaceholderNik);
  }

  window.switchSpmbSubTab = function (subTab) {
    currentSpmbSubTab = subTab;
    const tabBtnSiswa = document.getElementById('tab-btn-siswa');
    const tabBtnWali = document.getElementById('tab-btn-wali');
    const viewSiswa = document.getElementById('spmb-view-siswa');
    const viewWali = document.getElementById('spmb-view-wali');
    const activeDesc = document.getElementById('spmb-active-tab-desc');

    if (subTab === 'siswa') {
      tabBtnSiswa?.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');
      tabBtnSiswa?.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
      tabBtnWali?.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
      tabBtnWali?.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');

      if (viewSiswa) viewSiswa.style.display = 'block';
      if (viewWali) viewWali.style.display = 'none';
      if (activeDesc) activeDesc.innerHTML = '<span>🎓 Menampilkan berkas calon siswa terverifikasi</span>';
    } else {
      tabBtnWali?.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');
      tabBtnWali?.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
      tabBtnSiswa?.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
      tabBtnSiswa?.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-slate-100');

      if (viewSiswa) viewSiswa.style.display = 'none';
      if (viewWali) viewWali.style.display = 'block';
      if (activeDesc) activeDesc.innerHTML = '<span>👥 Menampilkan akun pendaftar orang tua &amp; verifikasi transfer Rp 150.000</span>';
    }

    renderSpmbTable();
  };

  function updateSpmbCounts() {
    const studentList = spmbList.filter(isStudentApplicant);
    const parentList = spmbList;
    const pendingProofs = spmbList.filter(s => s.buktiPembayaran && !isPaymentApproved(s)).length;
    const verifiedCount = studentList.filter(s => isPaymentApproved(s)).length;
    const passedCount = studentList.filter(s => isApplicantPassed(s)).length;
    const pendingActionCount = pendingProofs > 0 ? pendingProofs : studentList.filter(s => !isPaymentApproved(s) && !isApplicantPassed(s)).length;

    const badgeSiswa = document.getElementById('badge-tab-siswa-count');
    if (badgeSiswa) badgeSiswa.textContent = studentList.length;

    const badgeWali = document.getElementById('badge-tab-wali-count');
    if (badgeWali) {
      badgeWali.textContent = pendingProofs > 0 ? `${pendingProofs} baru` : parentList.length;
    }

    const kpiTotal = document.getElementById('spmb-kpi-total');
    if (kpiTotal) kpiTotal.textContent = studentList.length;

    const kpiVerified = document.getElementById('spmb-kpi-verified');
    if (kpiVerified) kpiVerified.textContent = verifiedCount;

    const kpiPassed = document.getElementById('spmb-kpi-passed');
    if (kpiPassed) kpiPassed.textContent = passedCount;

    const kpiPending = document.getElementById('spmb-kpi-pending');
    if (kpiPending) kpiPending.textContent = pendingActionCount;

    const sideSiswa = document.getElementById('sidebar-spmb-count');
    if (sideSiswa) sideSiswa.textContent = studentList.length;

    const sideWali = document.getElementById('sidebar-wali-count');
    if (sideWali) sideWali.textContent = parentList.length;
  }

  function renderSpmbTable() {
    updateSpmbCounts();
    renderStudentsTable();
    renderWaliTable();
  }

  function renderPaginationControls(totalItems, currentPage, pageSize) {
    const nav = document.getElementById('spmb-pagination-nav');
    if (!nav) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems === 0 || totalPages <= 1) {
      nav.innerHTML = `
        <button type="button" class="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5" disabled>
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
          <span>Sebelumnya</span>
        </button>
        <button type="button" class="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 rounded-lg shadow-2xs">1</button>
        <button type="button" class="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5" disabled>
          <span>Selanjutnya</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      `;
      return;
    }

    let buttonsHtml = '';
    // Tombol Sebelumnya
    if (currentPage > 1) {
      buttonsHtml += `
        <button type="button" onclick="window.changeSpmbPage(${currentPage - 1})" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5">
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
          <span>Sebelumnya</span>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button type="button" class="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5" disabled>
          <i class="fa-solid fa-chevron-left text-[10px]"></i>
          <span>Sebelumnya</span>
        </button>
      `;
    }

    // Nomor Halaman
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
        if (p === currentPage) {
          buttonsHtml += `<button type="button" class="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 rounded-lg shadow-2xs">${p}</button>`;
        } else {
          buttonsHtml += `<button type="button" onclick="window.changeSpmbPage(${p})" class="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">${p}</button>`;
        }
      } else if (p === currentPage - 2 || p === currentPage + 2) {
        buttonsHtml += `<span class="px-1 text-slate-400">...</span>`;
      }
    }

    // Tombol Selanjutnya
    if (currentPage < totalPages) {
      buttonsHtml += `
        <button type="button" onclick="window.changeSpmbPage(${currentPage + 1})" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5">
          <span>Selanjutnya</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      `;
    } else {
      buttonsHtml += `
        <button type="button" class="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed inline-flex items-center gap-1.5" disabled>
          <span>Selanjutnya</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      `;
    }

    nav.innerHTML = buttonsHtml;
  }

  window.changeSpmbPage = function(p) {
    spmbCurrentPage = p;
    renderStudentsTable();
  };

  function renderStudentJalurColumn(item) {
    const isPrestasi = (item.jalur || '').toLowerCase().includes('prestasi') || Boolean(item.riwayatTahfidz) || Boolean(item.riwayatPrestasi);
    const jalurLabel = isPrestasi ? 'PRESTASI' : (item.jalur ? item.jalur.toUpperCase() : 'REGULER');
    let subBadge = '';
    if (isPrestasi) {
      const prestasiText = item.riwayatTahfidz || item.riwayatPrestasi || 'Tahfidz 3 Juz';
      subBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100/70 text-emerald-800 border border-emerald-200">${escapeHtml(prestasiText)}</span>`;
    } else {
      subBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100/70 text-brand-800 border border-blue-200">${escapeHtml(getStudentWaveName(item))}</span>`;
    }
    return `
      <div class="font-bold text-slate-800 text-[11px] uppercase tracking-wide">${jalurLabel}</div>
      <div class="mt-1">${subBadge}</div>
    `;
  }

  function renderStudentStatusColumn(item) {
    const s = (item.status || '').toLowerCase();
    const hasData = Boolean(item.biodataUpdatedAt && item.parentDataUpdatedAt);
    const hasSched = Boolean(item.jadwalTes || (item.jadwalObservasi && !item.jadwalObservasi.toLowerCase().includes('menunggu') && item.jadwalObservasi !== '-'));
    const isPassed = s.includes('lulus') || s.includes('diterima');
    const isApproved = s.includes('terverifikasi') || s.includes('lengkap');

    // 1. Lulus Seleksi Observasi & Diterima (Row 1)
    if (isPassed) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
          <i class="fa-regular fa-circle-check text-blue-600"></i>
          <span>Lulus Seleksi Observasi &amp; Diterima</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
          <i class="fa-regular fa-calendar-check text-sky-600"></i>
          <span>Jadwal Ditetapkan</span>
        </span>
      `;
    }

    // 2. Berkas Lengkap & Terverifikasi (Row 2)
    if (isApproved) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <i class="fa-regular fa-circle-check text-emerald-600"></i>
          <span>Berkas Lengkap &amp; Terverifikasi</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
          <i class="fa-solid fa-clock-rotate-left text-purple-600"></i>
          <span>Menunggu Tes Wawancara</span>
        </span>
      `;
    }

    // 3. Menunggu Verifikasi Berkas (Row 3)
    if (s.includes('menunggu') || (!hasData && !hasSched)) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <i class="fa-solid fa-hourglass-half text-amber-600"></i>
          <span>Menunggu Verifikasi Berkas</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <i class="fa-solid fa-paperclip text-slate-400"></i>
          <span>Bukti Transfer Diunggah</span>
        </span>
      `;
    }

    // 4. Jadwal Observasi Ditetapkan & Biaya Lunas (Row 4)
    if (hasSched || s.includes('jadwal') || s.includes('observasi')) {
      let schedLabel = item.jadwalObservasi || item.jadwalTes || 'Jadwal Observasi: 30 Sep';
      if (!schedLabel.toLowerCase().includes('jadwal') && !schedLabel.toLowerCase().includes('observasi')) {
        schedLabel = 'Jadwal Observasi: ' + schedLabel;
      }
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
          <i class="fa-regular fa-calendar-days text-sky-600"></i>
          <span>${escapeHtml(schedLabel)}</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <i class="fa-solid fa-check text-emerald-600"></i>
          <span>Biaya Pendaftaran Lunas</span>
        </span>
      `;
    }

    // 5. Belum Lulus / Ditolak
    if (s.includes('tidak') || s.includes('tolak') || s.includes('belum')) {
      return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <i class="fa-regular fa-circle-xmark text-rose-500"></i>
          <span>Belum Lulus</span>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <i class="fa-solid fa-circle-info text-slate-400"></i>
          <span>Seleksi Selesai</span>
        </span>
      `;
    }

    // Fallback default
    return `
      ${renderStatusBadge(item.status)}
      ${hasSched ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-800 border border-sky-200"><i class="fa-regular fa-calendar-check text-sky-600"></i><span>Jadwal Ditetapkan</span></span>` : ''}
    `;
  }

  function renderStudentActionButtons(item) {
    const s = (item.status || '').toLowerCase();
    const hasData = Boolean(item.biodataUpdatedAt && item.parentDataUpdatedAt);
    const hasPassed = s.includes('lulus') || s.includes('diterima');
    const isApproved = s.includes('terverifikasi') || s.includes('lengkap');
    const hasSched = Boolean(item.jadwalTes || (item.jadwalObservasi && !item.jadwalObservasi.toLowerCase().includes('menunggu') && item.jadwalObservasi !== '-'));

    let primaryBtn = '';

    // Row 1: Green "Lulus"
    if (hasPassed) {
      primaryBtn = `
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Siswa Lulus Seleksi">
          <i class="ph ph-check-circle text-sm"></i>
          <span>Lulus</span>
        </button>
      `;
    } else if (hasSched && hasData && isApproved) {
      // Ready to graduate
      primaryBtn = `
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs" data-reg-number="${escapeHtml(item.regNumber)}" onclick="window.passApplicant(this.dataset.regNumber, this)" title="Luluskan Calon Siswa">
          <i class="ph ph-check-circle text-sm"></i>
          <span>Lulus</span>
        </button>
      `;
    } else if (isApproved) {
      // Row 2: Blue "Verifikasi"
      primaryBtn = `
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Verifikasi Berkas">
          <i class="ph ph-check text-sm"></i>
          <span>Verifikasi</span>
        </button>
      `;
    } else if (hasSched || s.includes('jadwal') || s.includes('observasi')) {
      // Row 4: Indigo "Atur Jadwal"
      primaryBtn = `
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Atur Jadwal Observasi">
          <i class="ph ph-calendar-plus text-sm"></i>
          <span>Atur Jadwal</span>
        </button>
      `;
    } else {
      // Row 3: Amber "Cek Berkas"
      primaryBtn = `
        <button type="button" class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Periksa Berkas Pendaftaran">
          <i class="ph ph-file-search text-sm"></i>
          <span>Cek Berkas</span>
        </button>
      `;
    }

    return `
      <div class="inline-flex items-center justify-center gap-1.5">
        ${primaryBtn}
        <button type="button" class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Lihat Detail">
          <i class="ph ph-eye text-base"></i>
        </button>
        <button type="button" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200" onclick="window.viewApplicantDetail('${item.regNumber}')" title="Ubah Data">
          <i class="ph ph-pencil-simple text-base"></i>
        </button>
        <button type="button" class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" onclick="window.printApplicantCard('${item.regNumber}')" title="Cetak Kartu Tanda Peserta">
          <i class="fa-solid fa-print text-sm"></i>
        </button>
        <button type="button" class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200" onclick="window.deleteApplicant('${item.regNumber}')" title="Hapus">
          <i class="ph ph-trash text-base"></i>
        </button>
      </div>
    `;
  }

  // 1. Render Tabel Data Calon Siswa
  function renderStudentsTable() {
    const tableBody = document.getElementById('spmb-table-body');
    if (!tableBody) return;

    const students = getFilteredStudents();
    const countEl = document.getElementById('spmb-filter-count');
    const totalEl = document.getElementById('spmb-pagination-total');
    if (totalEl) totalEl.textContent = students.length;

    if (students.length === 0) {
      if (countEl) countEl.textContent = 'Menampilkan 0 calon siswa';
      tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:#64748b; padding:2.5rem;">Tidak ada data calon siswa yang cocok dengan filter.</td></tr>`;
      updateSelectAllCheckbox([]);
      updateBulkActionBar();
      renderPaginationControls(0, 1, spmbPageSize);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(students.length / spmbPageSize));
    if (spmbCurrentPage > totalPages) spmbCurrentPage = totalPages;
    if (spmbCurrentPage < 1) spmbCurrentPage = 1;

    const startIndex = (spmbCurrentPage - 1) * spmbPageSize;
    const paginatedStudents = students.slice(startIndex, startIndex + spmbPageSize);

    if (countEl) {
      countEl.textContent = `Menampilkan ${startIndex + 1}-${Math.min(startIndex + spmbPageSize, students.length)} dari ${students.length} calon siswa terdaftar di sistem`;
    }

    tableBody.innerHTML = paginatedStudents.map((item, index) => {
      const isSelected = spmbSelectedRows.has(item.regNumber);
      const rowNum = startIndex + index + 1;
      const dateVal = formatDaftarDate(item.tanggalDaftar || item.createdAt);
      const timeVal = formatDaftarTime(item.tanggalDaftar || item.createdAt);

      return `
      <tr class="hover:bg-slate-50/90 transition-colors ${isSelected ? 'bg-blue-50/60' : ''}" data-reg="${escapeHtml(item.regNumber)}">
        <td class="py-4 pl-6 pr-3 text-center">
          <input type="checkbox" class="spmb-row-checkbox rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer" data-reg="${escapeHtml(item.regNumber)}" ${isSelected ? 'checked' : ''}>
        </td>
        <td class="py-4 px-3 text-center font-medium text-slate-600">
          ${rowNum}
        </td>
        <td class="py-4 px-3">
          <span class="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block text-[11px]">${escapeHtml(item.regNumber)}</span>
        </td>
        <td class="py-4 px-4">
          <div class="font-bold text-slate-900 text-sm">${escapeHtml(item.namaSiswa || '-')}</div>
          <div class="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
            <i class="fa-regular fa-id-card text-slate-400"></i>
            <span>NIK: ${escapeHtml(item.nik || '-')}</span>
          </div>
        </td>
        <td class="py-4 px-3 text-center">
          ${renderJenjangBadge(item.jenjang)}
        </td>
        <td class="py-4 px-3">
          ${renderStudentJalurColumn(item)}
        </td>
        <td class="py-4 px-3">
          <div class="font-semibold text-slate-800 text-xs">${escapeHtml(item.namaAyah || '-')}</div>
          <a class="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-medium text-xs mt-1 group" href="https://wa.me/${formatWa(item.waAyah)}?text=${encodeURIComponent('Assalamu\'alaikum Bapak/Ibu wali dari ' + item.namaSiswa + ', kami dari Panitia SPMB SIT Bina Insan Parepare ingin mengonfirmasi pendaftaran ' + item.regNumber + '.')}" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-whatsapp text-emerald-600 text-sm group-hover:scale-110 transition-transform"></i>
            <span class="font-mono">${escapeHtml(item.waAyah || '-')}</span>
          </a>
        </td>
        <td class="py-4 px-3 text-slate-600">
          <div class="font-medium text-slate-800 text-xs">${escapeHtml(dateVal)}</div>
          ${timeVal ? `<div class="text-[11px] text-slate-500 font-mono">${escapeHtml(timeVal)}</div>` : ''}
        </td>
        <td class="py-4 px-4">
          <div class="flex flex-col items-start gap-1">
            ${renderStudentStatusColumn(item)}
          </div>
        </td>
        <td class="py-4 px-5 text-center whitespace-nowrap">
          ${renderStudentActionButtons(item)}
        </td>
      </tr>
      `;
    }).join('');

    updateSelectAllCheckbox(paginatedStudents);
    updateBulkActionBar();
    renderPaginationControls(students.length, spmbCurrentPage, spmbPageSize);
  }

  // 2. Render Tabel Akun Orang Tua & Pembayaran
  function renderWaliTable() {
    const tableBody = document.getElementById('wali-table-body');
    if (!tableBody) return;

    let parents = [...spmbList];

    // Filter Wali Status
    if (waliFilterStatus !== 'all') {
      if (waliFilterStatus === 'pending_proof') {
        parents = parents.filter(s => s.buktiPembayaran && !isPaymentApproved(s));
      } else if (waliFilterStatus === 'unpaid') {
        parents = parents.filter(s => !s.buktiPembayaran && !isPaymentApproved(s));
      } else if (waliFilterStatus === 'approved') {
        parents = parents.filter(s => isPaymentApproved(s));
      }
    }

    // Filter Search
    if (waliSearchQuery.trim() !== '') {
      const q = waliSearchQuery.toLowerCase();
      parents = parents.filter(s =>
        (s.regNumber || '').toLowerCase().includes(q) ||
        (s.namaAyah && s.namaAyah.toLowerCase().includes(q)) ||
        (s.waAyah && s.waAyah.includes(q))
      );
    }

    const countEl = document.getElementById('wali-filter-count');
    if (countEl) countEl.textContent = `Menampilkan ${parents.length} dari ${spmbList.length} akun orang tua/wali`;

    if (parents.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding:2.5rem;">Tidak ada akun orang tua yang cocok dengan filter.</td></tr>`;
      return;
    }

    tableBody.innerHTML = parents.map(item => {
      const isApproved = isPaymentApproved(item);
      const isPassed = isApplicantPassed(item);
      const hasProof = !!item.buktiPembayaran;

      let statusBadge = '';
      if (isPassed) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">🎓 Lulus &amp; Lunas</span>`;
      } else if (isApproved) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Lunas &amp; Disetujui</span>`;
      } else if (hasProof) {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">💳 Bukti Diupload</span>`;
      } else {
        statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">🔴 Menunggu Bayar</span>`;
      }

      let proofThumb = '';
      if (hasProof) {
        proofThumb = `
          <button type="button" onclick="window.viewPaymentProof('${item.regNumber}')" class="group relative inline-flex items-center gap-1.5 p-1 rounded-lg border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 transition cursor-pointer" title="Klik untuk lihat bukti transfer">
            <img src="${item.buktiPembayaran}" alt="Bukti" class="w-8 h-8 rounded object-cover border border-amber-200">
            <span class="text-[11px] font-bold text-amber-800 pr-1">Lihat Foto</span>
          </button>
        `;
      } else {
        proofThumb = `<span class="text-xs text-slate-400 italic">Belum Upload</span>`;
      }

      return `
      <tr class="hover:bg-slate-50/80 transition duration-150">
        <td class="py-4 px-6 whitespace-nowrap font-mono text-xs font-bold ${isApproved ? 'text-emerald-700' : 'text-slate-700'}">
          ${escapeHtml(item.regNumber)}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <div class="font-bold text-slate-900">${escapeHtml(item.namaAyah || item.namaSiswa || 'Orang Tua / Wali')}</div>
          <span class="text-xs text-slate-400">Pendaftar Akun SPMB</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          <a href="https://wa.me/${formatWa(item.waAyah)}?text=${encodeURIComponent(`Assalamu'alaikum Bapak/Ibu ${item.namaAyah || ''}, kami dari Panitia SPMB SIT Bina Insan Parepare terkait akun pendaftaran ${item.regNumber}.`)}" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200" title="Chat WhatsApp Orang Tua">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.761.854 2.806.854 3.18 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.769-5.768-5.769zm10.024 5.828c0 5.549-4.512 10.063-10.063 10.063-1.745 0-3.385-.45-4.821-1.242l-5.171 1.357 1.381-5.042c-.878-1.488-1.389-3.23-1.389-5.136 0-5.551 4.514-10.063 10.063-10.063 5.551 0 10.063 4.512 10.063 10.063z"/></svg>
            <span class="font-mono">${escapeHtml(item.waAyah || '-')}</span>
          </a>
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs font-bold text-slate-800">
          Rp 150.000
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${proofThumb}
        </td>
        <td class="py-4 px-6 whitespace-nowrap">
          ${statusBadge}
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-xs text-slate-600">
          <span class="font-medium text-slate-800">${escapeHtml(item.tanggalDaftar || '-')}</span>
        </td>
        <td class="py-4 px-6 whitespace-nowrap text-center">
          <div class="flex items-center justify-center gap-1.5">
            ${!isApproved ? `
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm flex items-center gap-1" onclick="window.approvePayment('${item.regNumber}')" title="Setujui Pembayaran &amp; Terbitkan Kode Siswa Resmi">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Approve</span>
              </button>
            ` : `
              <span class="text-xs text-emerald-600 font-bold flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                ${isPassed ? 'Lulus' : 'Disetujui'}
              </span>
            `}
            <button type="button" class="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors" onclick="window.deleteApplicant('${item.regNumber}')" title="Hapus Akun Pendaftar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
  }

  function initSpmbControls() {
    const filterJenjang = document.getElementById('spmb-filter-jenjang');
    const filterGelombang = document.getElementById('spmb-filter-gelombang');
    const filterStatus = document.getElementById('spmb-filter-status');
    const searchInput = document.getElementById('spmb-search-input');
    const exportBtn = document.getElementById('spmb-export-btn');

    filterJenjang?.addEventListener('change', (e) => {
      spmbFilterJenjang = e.target.value;
      spmbCurrentPage = 1;
      renderStudentsTable();
    });

    filterGelombang?.addEventListener('change', (e) => {
      spmbFilterGelombang = e.target.value;
      spmbCurrentPage = 1;
      renderStudentsTable();
    });

    filterStatus?.addEventListener('change', (e) => {
      spmbFilterStatus = e.target.value;
      spmbCurrentPage = 1;
      renderStudentsTable();
    });

    searchInput?.addEventListener('input', (e) => {
      spmbSearchQuery = e.target.value;
      spmbCurrentPage = 1;
      renderStudentsTable();
    });

    const pageSizeSelect = document.getElementById('spmb-page-size');
    pageSizeSelect?.addEventListener('change', (e) => {
      spmbPageSize = parseInt(e.target.value, 10) || 25;
      spmbCurrentPage = 1;
      renderStudentsTable();
    });

    const refreshBtn = document.getElementById('spmb-refresh-btn');
    refreshBtn?.addEventListener('click', async () => {
      showToast('Memuat ulang data SPMB...');
      if (typeof loadAdminData === 'function') {
        await loadAdminData();
      }
      showToast('Data SPMB berhasil diperbarui.');
    });

    exportBtn?.addEventListener('click', exportSpmbToCsv);

    // Checkbox Pilih Semua
    const selectAll = document.getElementById('spmb-select-all');
    selectAll?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const visible = getFilteredStudents();
      for (const s of visible) {
        if (isChecked) spmbSelectedRows.add(s.regNumber);
        else spmbSelectedRows.delete(s.regNumber);
      }
      document.querySelectorAll('.spmb-row-checkbox').forEach(cb => {
        cb.checked = isChecked;
        cb.closest('tr')?.classList.toggle('bg-emerald-50/60', isChecked);
      });
      selectAll.indeterminate = false;
      updateBulkActionBar();
    });

    // Checkbox Baris
    const tableBody = document.getElementById('spmb-table-body');
    tableBody?.addEventListener('change', (e) => {
      const cb = e.target.closest('.spmb-row-checkbox');
      if (!cb) return;
      const reg = cb.dataset.reg;
      if (cb.checked) spmbSelectedRows.add(reg);
      else spmbSelectedRows.delete(reg);
      cb.closest('tr')?.classList.toggle('bg-emerald-50/60', cb.checked);
      updateSelectAllCheckbox(getFilteredStudents());
      updateBulkActionBar();
    });

    // Bulk Action Buttons
    document.getElementById('spmb-bulk-clear-btn')?.addEventListener('click', () => {
      spmbSelectedRows.clear();
      document.querySelectorAll('.spmb-row-checkbox').forEach(cb => {
        cb.checked = false;
        cb.closest('tr')?.classList.remove('bg-emerald-50/60');
      });
      const selectAll = document.getElementById('spmb-select-all');
      if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
      updateBulkActionBar();
    });

    document.getElementById('spmb-bulk-pass-btn')?.addEventListener('click', async () => {
      if (spmbSelectedRows.size === 0) return;
      const selected = spmbList.filter(s => spmbSelectedRows.has(s.regNumber));
      const eligible = selected.filter(s => s.status !== 'Lulus Seleksi Observasi & Diterima' && s.biodataUpdatedAt && s.parentDataUpdatedAt && s.regNumber.startsWith('SPMB-'));
      if (eligible.length === 0) {
        showToast('Tidak ada calon siswa terpilih yang siap diluluskan (pastikan data lengkap dan belum lulus).', true);
        return;
      }
      if (!confirm(`Luluskan ${eligible.length} calon siswa yang dipilih? Hasil kelulusan akan langsung diperbarui di portal pengumuman.`)) return;

      let successCount = 0;
      for (const item of eligible) {
        try {
          const result = await apiRequest('api/spmb.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reg_number: item.regNumber, status: 'Lulus Seleksi Observasi & Diterima' })
          });
          Object.assign(item, result.data);
          successCount++;
        } catch (err) {
          console.error('Gagal meluluskan siswa', item.regNumber, err);
        }
      }
      cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));
      renderSpmbTable();
      renderDashboard();
      broadcastRealtime('spmb_updated', spmbList);
      showToast(`Berhasil meluluskan ${successCount} calon siswa terpilih.`);
    });

    document.getElementById('spmb-bulk-delete-btn')?.addEventListener('click', async () => {
      if (spmbSelectedRows.size === 0) return;
      const count = spmbSelectedRows.size;
      if (!confirm(`Apakah Anda yakin ingin menghapus ${count} data calon siswa yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) return;

      const regs = Array.from(spmbSelectedRows);
      let successCount = 0;
      for (const reg of regs) {
        try {
          await apiRequest(`api/spmb.php?reg_number=${encodeURIComponent(reg)}`, { method: 'DELETE' });
          spmbList = spmbList.filter(s => s.regNumber !== reg);
          spmbSelectedRows.delete(reg);
          successCount++;
        } catch (err) {
          console.error('Gagal menghapus siswa', reg, err);
        }
      }
      cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));
      renderSpmbTable();
      renderDashboard();
      broadcastRealtime('spmb_updated', spmbList);
      showToast(`Berhasil menghapus ${successCount} data calon siswa terpilih.`);
    });

    // Wali Controls
    const waliFilter = document.getElementById('wali-filter-status');
    const waliSearch = document.getElementById('wali-search-input');
    const waliExport = document.getElementById('wali-export-btn');

    waliFilter?.addEventListener('change', (e) => {
      waliFilterStatus = e.target.value;
      renderWaliTable();
    });

    waliSearch?.addEventListener('input', (e) => {
      waliSearchQuery = e.target.value;
      renderWaliTable();
    });

    waliExport?.addEventListener('click', exportWaliToCsv);
  }

  // Export CSV Siswa
  async function exportSpmbToCsv() {
    const button = document.getElementById('spmb-export-btn');
    if (button) button.disabled = true;
    try {
      const response = await fetch('api/export-students', { cache: 'no-store' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengunduh file Excel.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DATA_SISWA_LENGKAP_SPMB_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast('File Excel data siswa lengkap berhasil diunduh!');
    } catch (error) {
      alert('Unduhan gagal: ' + (error.message || 'Silakan coba kembali.'));
    } finally {
      if (button) button.disabled = false;
    }
  }

  // Export CSV Akun Wali
  function exportWaliToCsv() {
    if (spmbList.length === 0) {
      alert('Tidak ada data akun orang tua untuk diekspor.');
      return;
    }

    const headers = [
      'ID/No. Registrasi', 'Nama Orang Tua / Wali', 'No WhatsApp', 'Nominal Pembayaran', 'Status Pembayaran', 'Ada Bukti Transfer', 'Tanggal Registrasi'
    ];

    const rows = spmbList.map(s => {
      const isApproved = isPaymentApproved(s);
      return [
        s.regNumber,
        `"${(s.namaAyah || s.namaSiswa || '').replace(/"/g, '""')}"`,
        `'${s.waAyah || ''}'`,
        s.nominalPembayaran || 150000,
        `"${(s.status || '').replace(/"/g, '""')}"`,
        s.buktiPembayaran ? 'Ya' : 'Belum',
        `"${(s.tanggalDaftar || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_AKUN_WALI_SPMB_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV Akun Orang Tua berhasil diunduh!');
  }

  // Modal Detail & Verifikasi Siswa
  window.viewApplicantDetail = async function (regNumber) {
    const item = spmbList.find(s => s.regNumber === regNumber);
    if (!item) return;
    try {
      const result = await apiRequest(`api/spmb.php?reg_number=${encodeURIComponent(regNumber)}`);
      Object.assign(item, result.data);
    } catch (error) { showToast(error.message, true); return; }

    document.getElementById('modal-app-reg').textContent = item.regNumber;
    document.getElementById('modal-app-name').textContent = item.namaSiswa || 'Calon Siswa';
    document.getElementById('modal-app-jenjang').textContent = `${(item.jenjang || 'SDIT').toUpperCase()} (${(item.jalur || 'Reguler').toUpperCase()})`;
    document.getElementById('modal-app-nik').textContent = item.nik || '-';
    document.getElementById('modal-app-ttl').textContent = item.ttl || '-';
    document.getElementById('modal-app-jk').textContent = item.jk || '-';
    document.getElementById('modal-app-sekolah').textContent = item.asalSekolah || '-';
    document.getElementById('modal-app-alamat-sekolah').textContent = item.alamatAsalSekolah || '-';
    document.getElementById('modal-app-agama').textContent = item.agama || '-';
    document.getElementById('modal-app-kewarganegaraan').textContent = item.kewarganegaraan || '-';
    document.getElementById('modal-app-alamat').textContent = item.alamat || '-';
    document.getElementById('modal-app-wilayah').textContent = [item.desaKelurahan, item.kecamatan, item.kabupatenKota, item.provinsi].filter(Boolean).join(', ') || '-';
    const extraContainer = document.getElementById('modal-app-extra');
    const parentContainer = document.getElementById('modal-app-parents');
    parentContainer.replaceChildren();
    const parentRows = [['memilikiWali', 'Memiliki Wali'], ...window.ParentFields.roles
      .filter(role => role !== 'Wali' || item.memilikiWali === 'Ya')
      .flatMap(role => window.ParentFields.fields.map(field => [field.key + role, field.label + ' ' + role]))];
    for (const [key, label] of parentRows) {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-50 rounded-xl border border-slate-100';
      const title = document.createElement('span');
      title.className = 'text-slate-400 block text-[10px] font-bold uppercase';
      title.textContent = label;
      const value = document.createElement('span');
      value.className = 'font-bold text-slate-800';
      value.textContent = item[key] || '-';
      card.append(title, value);
      parentContainer.append(card);
    }
    extraContainer.replaceChildren();
    for (const [key, label] of [["tempatTinggal","Tempat Tinggal"],["modaTransportasi","Moda Transportasi"],["anakKe","Anak ke Berapa"],["tinggiBadan","Tinggi Badan (cm)"],["beratBadan","Berat Badan (kg)"],["hobi","Hobi"],["citaCita","Cita-cita"],["jumlahSaudaraKandung","Jumlah Saudara Kandung"],["jarakRumahSekolah","Jarak Rumah ke Sekolah"],["saudaraDiSekolah","Apakah memiliki saudara kandung yang bersekolah di SIT Bina Insan Parepare?"]]) {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-50 rounded-xl border border-slate-100';
      const title = document.createElement('span');
      title.className = 'text-slate-400 block text-[10px] font-bold uppercase';
      title.textContent = label;
      const value = document.createElement('span');
      value.className = 'font-bold text-slate-800';
      value.textContent = item[key] === undefined || item[key] === '' ? '-' : String(item[key]);
      card.append(title, value);
      extraContainer.append(card);
    }
    document.getElementById('modal-app-ayah').textContent = `${item.namaAyah || '-'} (${item.pekerjaanAyah || '-'})`;
    document.getElementById('modal-app-ibu').textContent = `${item.namaIbu || '-'}`;
    document.getElementById('modal-app-wa').textContent = item.waAyah || '-';
    document.getElementById('modal-app-hafalan').textContent = item.hafalan || 'Belum ada';
    document.getElementById('modal-app-prestasi').textContent = item.prestasi || '-';

    const certBox = document.getElementById('modal-app-sertifikat-container');
    const certBtn = document.getElementById('modal-app-sertifikat-btn');
    if (certBox && certBtn) {
      if (item.sertifikatPrestasi) {
        certBox.style.display = 'block';
        certBtn.onclick = () => window.viewCertificateProof(item.regNumber);
      } else {
        certBox.style.display = 'none';
        certBtn.onclick = null;
      }
    }

    // Status Pembayaran & Preview Bukti Transfer (Rp 150.000)
    const proofStatusEl = document.getElementById('modal-app-bayar-status');
    const proofContainer = document.getElementById('modal-app-proof-container');
    const approveDirectBox = document.getElementById('modal-app-approve-direct-box');
    const approveDirectBtn = document.getElementById('modal-app-approve-btn');

    const isApproved = isPaymentApproved(item);
    const hasProof = !!item.buktiPembayaran;

    if (proofStatusEl) {
      if (isApproved) {
        proofStatusEl.textContent = '✓ Lunas (Rp 150.000)';
        proofStatusEl.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
      } else if (hasProof) {
        proofStatusEl.textContent = '💳 Bukti Diupload';
        proofStatusEl.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800';
      } else {
        proofStatusEl.textContent = 'Menunggu Bukti Transfer';
        proofStatusEl.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700';
      }
    }

    if (proofContainer) {
      if (hasProof) {
        proofContainer.innerHTML = `
          <div class="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200">
            <div class="flex items-center gap-2.5">
              <img src="${item.buktiPembayaran}" alt="Bukti Transfer" class="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-sm" onclick="window.viewPaymentProof('${item.regNumber}')">
              <div class="text-left">
                <span class="text-xs font-bold text-slate-800 block">Bukti Pembayaran Diunggah</span>
                <span class="text-[11px] text-slate-500">Biaya: <strong class="text-emerald-700">Rp 150.000</strong></span>
              </div>
            </div>
            <button type="button" class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition" onclick="window.viewPaymentProof('${item.regNumber}')">
              Lihat Bukti
            </button>
          </div>
        `;
      } else {
        proofContainer.innerHTML = `<span class="text-slate-400 italic text-xs">Belum ada bukti pembayaran yang diunggah.</span>`;
      }
    }

    if (approveDirectBox) {
      if (!isApproved && hasProof) {
        approveDirectBox.style.display = 'flex';
        if (approveDirectBtn) {
          approveDirectBtn.onclick = function () {
            window.approvePayment(item.regNumber);
            applicantModal.classList.remove('open');
          };
        }
      } else {
        approveDirectBox.style.display = 'none';
      }
    }

    document.getElementById('modal-app-status-display').textContent = getApplicantProgressStatus(item, settings);

    // Completeness badges
    const bioStatusBadge = document.getElementById('modal-app-bio-status-badge');
    const hasData = Boolean(item.biodataUpdatedAt && item.parentDataUpdatedAt);

    if (bioStatusBadge) {
      if (hasData) {
        bioStatusBadge.textContent = '✓ Data Siswa & Ortu Lengkap';
        bioStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
      } else if (item.biodataUpdatedAt) {
        bioStatusBadge.textContent = 'Data Siswa Saja (Ortu Belum)';
        bioStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
      } else {
        bioStatusBadge.textContent = 'Biodata Belum Lengkap';
        bioStatusBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700';
      }
    }

    // Direct WhatsApp Button in modal
    const waModalBtn = document.getElementById('modal-app-wa-btn');
    if (waModalBtn) {
      waModalBtn.href = `https://wa.me/${formatWa(item.waAyah)}?text=${encodeURIComponent('Assalamu\'alaikum Bapak/Ibu wali dari ' + (item.namaSiswa || item.namaAyah) + ', kami dari Panitia SPMB SIT Bina Insan Parepare ingin mengonfirmasi status pendaftaran: ' + item.regNumber + '.')}`;
    }

    applicantModal.classList.add('open');
  };

  // Modal Lihat Bukti Transfer
  window.viewPaymentProof = function (regNumber) {
    const item = spmbList.find(s => s.regNumber === regNumber || s.waAyah === regNumber);
    if (!item) return;

    const modal = document.getElementById('modal-payment-proof');
    if (!modal) return;

    const nameEl = document.getElementById('proof-parent-name');
    const waEl = document.getElementById('proof-parent-wa');
    const regEl = document.getElementById('proof-reg-number');
    const statusEl = document.getElementById('proof-status-badge');
    const imgEl = document.getElementById('proof-modal-img');
    const approveBtn = document.getElementById('proof-modal-approve-btn');

    if (nameEl) nameEl.textContent = item.namaAyah || item.namaSiswa || '-';
    if (waEl) waEl.textContent = item.waAyah || '-';
    if (regEl) regEl.textContent = item.regNumber;
    if (statusEl) statusEl.textContent = item.status;
    if (imgEl) {
      imgEl.src = item.buktiPembayaran || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12">Belum ada foto bukti</text></svg>';
    }

    const isApproved = isPaymentApproved(item);
    if (approveBtn) {
      if (isApproved) {
        approveBtn.style.display = 'none';
      } else {
        approveBtn.style.display = 'inline-flex';
        approveBtn.onclick = function () {
          window.approvePayment(item.regNumber);
          modal.classList.remove('open');
        };
      }
    }

    modal.classList.add('open');
  };

  // Buka Sertifikat / Piagam Prestasi Siswa
  window.viewCertificateProof = function (regNumber) {
    const item = spmbList.find(s => s.regNumber === regNumber || s.waAyah === regNumber);
    if (!item || !item.sertifikatPrestasi) return;
    const cert = item.sertifikatPrestasi;
    if (cert.startsWith('data:')) {
      try {
        const parts = cert.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const blob = new Blob([array], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (_) {
        window.open(cert, '_blank');
      }
    } else {
      window.open(cert, '_blank');
    }
  };

  // Setujui (Approve) Pembayaran Rp 150.000 & Generate Kode Pendaftaran Siswa Resmi
  window.approvePayment = async function (regNumber) {
    const item = spmbList.find(s => s.regNumber === regNumber || s.waAyah === regNumber);
    if (!item) {
      alert('Data pendaftar tidak ditemukan.');
      return;
    }

    if (isApplicantPassed(item)) {
      alert(`Calon siswa ${item.namaSiswa || item.namaAyah} (${item.regNumber}) sudah lulus seleksi dan status pembayarannya telah lunas.\nPersetujuan pembayaran tidak perlu diulang kembali agar status kelulusan tidak berubah.`);
      return;
    }

    if (isPaymentApproved(item) && item.regNumber && item.regNumber.startsWith('SPMB-')) {
      alert(`Pembayaran pendaftaran untuk ${item.namaAyah || item.namaSiswa} (${item.regNumber}) sudah berstatus Lunas / Disetujui.`);
      return;
    }

    if (!confirm(`Konfirmasi setujui pembayaran Rp 150.000 untuk ${item.namaAyah || item.namaSiswa}?\n\nSistem akan otomatis menerbitkan Nomor Registrasi Resmi Siswa Baru.`)) {
      return;
    }

    const currentYear = new Date().getFullYear();
    const oldReg = item.regNumber;
    let newReg = oldReg;

    // Jika nomor registrasi masih sementara (PENDING-...) atau belum berformat resmi SPMB-YYYY-XXX
    if (!newReg || newReg.startsWith('PENDING-') || !newReg.startsWith('SPMB-')) {
      let maxSeq = 0;
      spmbList.forEach(s => {
        const m = (s.regNumber || '').match(/SPMB-\d{4}-(?:[A-Z]{2})?(\d+)/i) || (s.regNumber || '').match(/SPMB-(\d{4})-(\d+)/i);
        if (m) {
          const num = parseInt(m[m.length - 1], 10);
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        }
      });
      const nextSeq = String(maxSeq + 1).padStart(3, '0');
      newReg = `SPMB-${currentYear}-${nextSeq}`;
    }

    const jadwalObservasi = (!item.jadwalObservasi || item.jadwalObservasi.includes('Menunggu') || item.jadwalObservasi === '-')
      ? 'Jadwal Observasi & Wawancara akan dihubungi oleh Panitia'
      : item.jadwalObservasi;

    try {
      const result = await apiRequest('api/spmb.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_number: oldReg,
          new_reg_number: newReg,
          wa_ayah: item.waAyah,
          status: 'Pembayaran Terverifikasi (Rp 150.000)',
          nominal_pembayaran: 150000,
          jadwal_observasi: jadwalObservasi
        })
      });
      Object.assign(item, result.data);
      cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));

      renderSpmbTable();
      renderDashboard();

    // Broadcast update agar tab portal orang tua langsung otomatis terupdate
    broadcastRealtime('spmb_payment_approved', {
      oldRegNumber: oldReg,
      regNumber: item.regNumber,
      waAyah: item.waAyah,
      namaAyah: item.namaAyah,
      status: item.status
    });
      broadcastRealtime('spmb_updated', spmbList);

    showToast(`✓ Pembayaran diterima! Nomor Registrasi Resmi diterbitkan: ${item.regNumber}`);
    } catch (error) {
      showToast(`Gagal menyetujui pembayaran: ${error.message}`, true);
    }
  };

  window.printApplicantCard = function (regNumber) {
    // Open main page and trigger print ticket
    window.open(`index.html#spmb`, '_blank');
    alert(`Untuk mencetak kartu ${regNumber}, silakan buka menu 'Cek Status Pendaftaran' di tab website yang terbuka dan masukkan nomor registrasi tersebut.`);
  };

  function getApplicantProgressStatus(item, schoolSettings) {
    if (item.status === 'Lulus Seleksi Observasi & Diterima' || item.status === 'Cadangan') return item.status;
    if (!String(item.regNumber || '').startsWith('SPMB-')) {
      return item.buktiPembayaran ? 'Menunggu Verifikasi Pembayaran oleh Admin' : 'Menunggu Pembayaran Uang Pendaftaran';
    }
    if (!item.biodataUpdatedAt) return 'Pembayaran Disetujui (Menunggu Biodata Siswa)';
    if (!item.parentDataUpdatedAt) return 'Biodata Siswa Tersimpan (Menunggu Data Orang Tua/Wali)';
    const level = String(item.jenjang || '').trim().toLowerCase();
    return schoolSettings[level + '_jadwalTes']
      ? 'Jadwal Tes & Wawancara Ditetapkan'
      : 'Biodata Lengkap (Menunggu Jadwal Tes & Wawancara)';
  }

  const passingApplicants = new Set();
  window.passApplicant = async function (regNumber, button) {
    const item = spmbList.find(student => student.regNumber === regNumber);
    const passedStatus = 'Lulus Seleksi Observasi & Diterima';
    if (!item || item.status === passedStatus || passingApplicants.has(regNumber)) return;
    if (!item.biodataUpdatedAt || !item.parentDataUpdatedAt || !regNumber.startsWith('SPMB-')) {
      showToast('Pastikan pembayaran disetujui serta biodata siswa dan orang tua/wali lengkap.', true);
      return;
    }
    if (!confirm('Luluskan ' + (item.namaSiswa || regNumber) + ' (' + regNumber + ')? Hasil lulus dan diterima akan tampil di halaman pengumuman orang tua.')) return;
    passingApplicants.add(regNumber);
    if (button) button.disabled = true;
    try {
      const result = await apiRequest('api/spmb.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_number: regNumber, status: passedStatus })
      });
      Object.assign(item, result.data);
      cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));
      renderSpmbTable();
      renderDashboard();
      broadcastRealtime('spmb_updated', spmbList);
      showToast('Kelulusan ' + regNumber + ' berhasil disimpan. Hasil tersedia di halaman pengumuman.');
    } catch (error) {
      showToast('Gagal menyimpan kelulusan: ' + error.message, true);
    } finally {
      passingApplicants.delete(regNumber);
      if (button) button.disabled = item.status === passedStatus;
    }
  };

  window.deleteApplicant = async function (regNumber) {
    if (confirm(`Apakah Anda yakin ingin menghapus data pendaftar ${regNumber}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await apiRequest(`api/spmb.php?reg_number=${encodeURIComponent(regNumber)}`, {
          method: 'DELETE'
        });
        spmbList = spmbList.filter(s => s.regNumber !== regNumber);
        cacheSetItem(STORAGE_SPMB, JSON.stringify(spmbList));
        renderSpmbTable();
        renderDashboard();
        broadcastRealtime('spmb_updated', spmbList);
        showToast(`Data pendaftar ${regNumber} dihapus dari database.`);
      } catch (error) {
        showToast(`Gagal menghapus pendaftar: ${error.message}`, true);
      }
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

    editorForm?.addEventListener('submit', async (e) => {
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

      const submitButton = editorForm.querySelector('[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        if (currentEditingArticleId) {
          const result = await apiRequest('api/articles.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentEditingArticleId, ...payload })
          });
          const idx = articleList.findIndex(a => a.id === currentEditingArticleId);
          if (idx !== -1) articleList[idx] = result.data;
          showToast('Artikel berhasil diperbarui di database.');
        } else {
          const result = await apiRequest('api/articles.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          articleList.unshift(result.data);
          showToast('Berita baru berhasil diterbitkan dan disimpan ke database.');
        }
        cacheSetItem(STORAGE_ARTICLES, JSON.stringify(articleList));
        articleModal.classList.remove('open');
        renderArticlesTable();
        renderDashboard();
        broadcastRealtime('articles_updated', articleList);
      } catch (error) {
        showToast(`Gagal menyimpan artikel: ${error.message}`, true);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
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

  window.deleteArticle = async function (id) {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini dari website?')) {
      try {
        await apiRequest(`api/articles.php?id=${id}`, {
          method: 'DELETE'
        });
        articleList = articleList.filter(a => a.id !== id);
        cacheSetItem(STORAGE_ARTICLES, JSON.stringify(articleList));
        renderArticlesTable();
        renderDashboard();
        broadcastRealtime('articles_updated', articleList);
        showToast('Artikel berhasil dihapus dari database.');
      } catch (error) {
        showToast(`Gagal menghapus artikel: ${error.message}`, true);
      }
    }
  };

  // =========================================================================
  // View 4: Settings Management (Pengaturan SPMB & Kontak)
  // =========================================================================
  function updateWavePreview(name, status, academicYear) {
    const previewBadge = document.getElementById('badge-wave-preview');
    const previewLabel = document.getElementById('preview-wave-label');
    if (!previewBadge || !previewLabel) return;
    const yearSuffix = academicYear ? ` (TP ${academicYear})` : '';

    if (status === 'closed') {
      previewBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm';
      previewLabel.textContent = `${name || 'Pendaftaran'} • Ditutup${yearSuffix}`;
    } else if (status === 'upcoming') {
      previewBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm';
      previewLabel.textContent = `${name || 'SPMB'} • Segera Dibuka${yearSuffix}`;
    } else {
      previewBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm';
      previewLabel.textContent = `${name || 'Gelombang 1'} • Buka${yearSuffix}`;
    }
  }

  function updateNavbarWaveBadge(name, status, academicYear) {
    const navbarText = document.getElementById('admin-navbar-wave-text');
    const navbarDot = document.getElementById('admin-navbar-wave-dot');
    const navbarBadge = document.getElementById('admin-navbar-wave-badge');
    if (!navbarText) return;
    const yearSuffix = academicYear ? ` • TP ${academicYear}` : '';

    if (status === 'closed') {
      navbarText.textContent = `Pendaftaran Ditutup${yearSuffix}`;
      if (navbarDot) navbarDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
      if (navbarBadge) navbarBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200';
    } else if (status === 'upcoming') {
      navbarText.textContent = `${name || 'SPMB'} Segera${yearSuffix}`;
      if (navbarDot) navbarDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
      if (navbarBadge) navbarBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200';
    } else {
      navbarText.textContent = `${name || 'Gelombang 1'} Aktif${yearSuffix}`;
      if (navbarDot) navbarDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
      if (navbarBadge) navbarBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  }

  function updateWaveCardsUI(activeWave) {
    const card1 = document.getElementById('card-wave-1');
    const card2 = document.getElementById('card-wave-2');
    const card3 = document.getElementById('card-wave-3');
    const badge1 = document.getElementById('badge-wave1-status');
    const badge2 = document.getElementById('badge-wave2-status');
    const badge3 = document.getElementById('badge-wave3-status');
    const btn1 = document.getElementById('btn-toggle-wave-1');
    const btn2 = document.getElementById('btn-toggle-wave-2');
    const btn3 = document.getElementById('btn-toggle-wave-3');

    [
      { card: card1, badge: badge1, btn: btn1, isAct: activeWave === 'wave1', label: 'Gelombang 1' },
      { card: card2, badge: badge2, btn: btn2, isAct: activeWave === 'wave2', label: 'Gelombang 2' },
      { card: card3, badge: badge3, btn: btn3, isAct: activeWave === 'wave3', label: 'Gelombang 3' }
    ].forEach(({ card, badge, btn, isAct, label }) => {
      if (!card || !badge) return;
      if (isAct) {
        card.className = 'p-3.5 bg-white rounded-xl border-2 border-emerald-500 shadow-sm space-y-3 transition-all ring-2 ring-emerald-500/20';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
        badge.textContent = 'Sedang Aktif';
        if (btn) {
          btn.className = 'w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm flex items-center justify-center gap-1.5 cursor-default';
          btn.innerHTML = '✓ Sedang Aktif (Buka)';
        }
      } else {
        card.className = 'p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 transition-all opacity-85 hover:opacity-100';
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600';
        badge.textContent = 'Standby';
        if (btn) {
          btn.className = 'w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer';
          btn.innerHTML = `▶ Aktifkan ${label}`;
        }
      }
    });
  }

  function renderScheduleEditors() {
    const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    document.querySelectorAll('[data-schedule-editor]').forEach(editor => {
      const stored = editor.querySelector('[data-schedule-setting]');
      const date = editor.querySelector('[data-schedule-part="date"]');
      const start = editor.querySelector('[data-schedule-part="start"]');
      const end = editor.querySelector('[data-schedule-part="end"]');
      const legacy = editor.querySelector('[data-schedule-legacy]');
      const match = stored.value.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4}).*?(\d{2})[.:](\d{2})\s*[-–]\s*(\d{2})[.:](\d{2})/i);
      date.value = start.value = end.value = '';
      if (match && months.includes(match[2].toLowerCase())) {
        date.value = match[3] + '-' + String(months.indexOf(match[2].toLowerCase()) + 1).padStart(2, '0') + '-' + match[1].padStart(2, '0');
        start.value = match[4] + ':' + match[5];
        end.value = match[6] + ':' + match[7];
      }
      legacy.hidden = !stored.value || Boolean(date.value);
      legacy.textContent = legacy.hidden ? '' : 'Jadwal tersimpan: ' + stored.value + '. Pilih tanggal dan jam untuk menggantinya.';
      [date, start, end].forEach(input => {
        input.required = false;
        input.setCustomValidity('');
        input.oninput = () => {
          const any = Boolean(date.value || start.value || end.value);
          [date, start, end].forEach(part => { part.required = any; });
          end.setCustomValidity(start.value && end.value && end.value <= start.value ? 'Jam selesai harus setelah jam mulai.' : '');
          if (!any) stored.value = '';
          else if (date.value && start.value && end.value) {
            const formatted = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' }).format(new Date(date.value + 'T00:00:00+08:00'));
            stored.value = formatted + ' | Pukul ' + start.value.replace(':', '.') + ' - ' + end.value.replace(':', '.') + ' WITA';
          }
          legacy.hidden = true;
        };
      });
    });
  }

  function renderSettingsForm() {
    document.querySelectorAll('[data-schedule-setting]').forEach(input => {
      const key = input.dataset.scheduleSetting;
      input.value = settings[key] || (key.endsWith('_jadwalTes') ? settings[key.replace('_jadwalTes', '_jadwalWawancara')] : '') || '';
    });
    renderScheduleEditors();
    const academicYear = settings.academicYear || '2026/2027';
    const targetYear = academicYear.split('/')[1]?.trim() || academicYear.split('/')[0]?.trim() || '2027';

    // Parse active wave
    let activeWave = settings.activeWave || 'wave1';
    if (typeof activeWave === 'string') {
      const low = activeWave.toLowerCase();
      if (low.includes('gelombang 2')) activeWave = 'wave2';
      else if (low.includes('gelombang 3')) activeWave = 'wave3';
      else if (low.includes('tutup') || settings.waveStatus === 'closed') activeWave = 'closed';
      else if (!['wave1', 'wave2', 'wave3', 'closed'].includes(activeWave)) activeWave = 'wave1';
    }

    const waveStatus = settings.waveStatus || (activeWave === 'closed' ? 'closed' : 'open');

    // Wave 1 data
    let w1Name = settings.wave1Name || 'Gelombang 1';
    let w1Promo = settings.wave1Promo !== undefined ? settings.wave1Promo : '';
    if (!w1Promo && settings.waveName && settings.waveName.toLowerCase().includes('diskon')) {
      const match = settings.waveName.match(/diskon[^\)\:\,]+/i);
      if (match) w1Promo = match[0].trim();
    }
    if (!w1Promo && !settings.wave1Promo && !settings.waveName) {
      w1Promo = 'Diskon Rp500.000';
    }
    let w1Dates = settings.wave1Dates || settings.waveDates || `1 Januari ${targetYear} s/d 31 Maret ${targetYear}`;

    // Wave 2 data
    let w2Name = settings.wave2Name || 'Gelombang 2';
    let w2Promo = settings.wave2Promo !== undefined ? settings.wave2Promo : 'Reguler';
    let w2Dates = settings.wave2Dates || `1 April ${targetYear} s/d 31 Mei ${targetYear}`;

    // Wave 3 data
    let w3Name = settings.wave3Name || 'Gelombang 3';
    let w3Promo = settings.wave3Promo !== undefined ? settings.wave3Promo : 'S/d Kuota Terpenuhi';
    let w3Dates = settings.wave3Dates || `1 Juni ${targetYear} s/d Kuota Terpenuhi`;

    // Active wave display name & dates
    let activeDisplayName = w1Name;
    let activeDates = w1Dates;
    if (activeWave === 'wave2') {
      activeDisplayName = w2Name;
      activeDates = w2Dates;
    } else if (activeWave === 'wave3') {
      activeDisplayName = w3Name;
      activeDates = w3Dates;
    } else if (activeWave === 'closed') {
      activeDisplayName = 'Pendaftaran Ditutup';
    }

    const waveNotice = settings.waveNotice || `Pendaftaran ${activeDisplayName} Sedang Berlangsung!`;

    // Populate inputs
    const acYearInput = document.getElementById('set-academic-year');
    if (acYearInput) acYearInput.value = academicYear;

    const activeWaveSelect = document.getElementById('set-active-wave-select');
    if (activeWaveSelect) activeWaveSelect.value = activeWave;

    const statusSelect = document.getElementById('set-wave-status');
    if (statusSelect) statusSelect.value = waveStatus;

    // Wave 1 inputs
    const w1NameInput = document.getElementById('set-wave1-name');
    if (w1NameInput) w1NameInput.value = w1Name;
    const w1PromoInput = document.getElementById('set-wave1-promo');
    if (w1PromoInput) w1PromoInput.value = w1Promo;
    const w1DatesInput = document.getElementById('set-wave1-dates');
    if (w1DatesInput) w1DatesInput.value = w1Dates;

    // Wave 2 inputs
    const w2NameInput = document.getElementById('set-wave2-name');
    if (w2NameInput) w2NameInput.value = w2Name;
    const w2PromoInput = document.getElementById('set-wave2-promo');
    if (w2PromoInput) w2PromoInput.value = w2Promo;
    const w2DatesInput = document.getElementById('set-wave2-dates');
    if (w2DatesInput) w2DatesInput.value = w2Dates;

    // Wave 3 inputs
    const w3NameInput = document.getElementById('set-wave3-name');
    if (w3NameInput) w3NameInput.value = w3Name;
    const w3PromoInput = document.getElementById('set-wave3-promo');
    if (w3PromoInput) w3PromoInput.value = w3Promo;
    const w3DatesInput = document.getElementById('set-wave3-dates');
    if (w3DatesInput) w3DatesInput.value = w3Dates;

    // Hidden inputs for legacy scripts
    const nameInput = document.getElementById('set-wave-name');
    if (nameInput) nameInput.value = activeDisplayName;
    const datesInput = document.getElementById('set-wave-dates');
    if (datesInput) datesInput.value = activeDates;

    const noticeInput = document.getElementById('set-wave-notice');
    if (noticeInput) noticeInput.value = waveNotice;

    // 3 benefit points
    const pt1Input = document.getElementById('set-wave-point-1');
    if (pt1Input) pt1Input.value = settings.wavePoint1 || 'Potongan Infaq Pembangunan hingga Rp 500.000';
    const pt2Input = document.getElementById('set-wave-point-2');
    if (pt2Input) pt2Input.value = settings.wavePoint2 || 'Prioritas Kuota Kelas & Seleksi Observasi Dini';
    const pt3Input = document.getElementById('set-wave-point-3');
    if (pt3Input) pt3Input.value = settings.wavePoint3 || 'Tersedia Jalur Prestasi Tahfizh & Beasiswa Yatim';

    // Stats
    const statTkInput = document.getElementById('set-stat-tk');
    if (statTkInput) statTkInput.value = settings.statTk || '180+';
    const statSdInput = document.getElementById('set-stat-sd');
    if (statSdInput) statSdInput.value = settings.statSd || '650+';
    const statSmpInput = document.getElementById('set-stat-smp');
    if (statSmpInput) statSmpInput.value = settings.statSmp || '420+';
    const statGuruInput = document.getElementById('set-stat-guru');
    if (statGuruInput) statGuruInput.value = settings.statGuru || '85+';

    updateWaveCardsUI(activeWave);
    updateWavePreview(activeDisplayName, waveStatus, academicYear);
    updateNavbarWaveBadge(activeDisplayName, waveStatus, academicYear);

    const filterGelombang = document.getElementById('spmb-filter-gelombang');
    if (filterGelombang) {
      const optW1 = filterGelombang.querySelector('option[value="wave1"]');
      if (optW1) optW1.textContent = w1Name;
      const optW2 = filterGelombang.querySelector('option[value="wave2"]');
      if (optW2) optW2.textContent = w2Name;
      const optW3 = filterGelombang.querySelector('option[value="wave3"]');
      if (optW3) optW3.textContent = w3Name;
    }

    const dbTpText = document.getElementById('admin-dashboard-tp-text');
    if (dbTpText) dbTpText.textContent = `Tahun Pelajaran ${academicYear}`;


    const waEl = document.getElementById('set-wa');
    if (waEl) waEl.value = settings.whatsappHelpdesk || '6285190610569';
    const bankEl = document.getElementById('set-bank');
    if (bankEl) bankEl.value = settings.bankAccount || 'Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare';
  }

  function initSettingsForm() {
    const form = document.getElementById('form-school-settings');
    const resetBtn = document.getElementById('btn-reset-sample-data');
    const acYearInput = document.getElementById('set-academic-year');
    const activeWaveSelect = document.getElementById('set-active-wave-select');
    const statusSelect = document.getElementById('set-wave-status');
    const noticeInput = document.getElementById('set-wave-notice');

    const w1NameInput = document.getElementById('set-wave1-name');
    const w1PromoInput = document.getElementById('set-wave1-promo');
    const w1DatesInput = document.getElementById('set-wave1-dates');

    const w2NameInput = document.getElementById('set-wave2-name');
    const w2PromoInput = document.getElementById('set-wave2-promo');
    const w2DatesInput = document.getElementById('set-wave2-dates');

    const w3NameInput = document.getElementById('set-wave3-name');
    const w3PromoInput = document.getElementById('set-wave3-promo');
    const w3DatesInput = document.getElementById('set-wave3-dates');

    const pt1Input = document.getElementById('set-wave-point-1');
    const pt2Input = document.getElementById('set-wave-point-2');
    const pt3Input = document.getElementById('set-wave-point-3');

    function syncWaveFieldsAndPreview() {
      const yearVal = acYearInput ? acYearInput.value.trim() : '2026/2027';
      const actWave = activeWaveSelect ? activeWaveSelect.value : 'wave1';
      let statusVal = statusSelect ? statusSelect.value : 'open';

      if (actWave === 'closed') {
        statusVal = 'closed';
        if (statusSelect) statusSelect.value = 'closed';
      } else if (statusVal === 'closed' && actWave !== 'closed') {
        statusVal = 'open';
        if (statusSelect) statusSelect.value = 'open';
      }

      updateWaveCardsUI(actWave);

      let activeName = 'Gelombang 1';
      let activeDates = '';
      if (actWave === 'wave1') {
        activeName = w1NameInput ? w1NameInput.value.trim() : 'Gelombang 1';
        activeDates = w1DatesInput ? w1DatesInput.value.trim() : '';
      } else if (actWave === 'wave2') {
        activeName = w2NameInput ? w2NameInput.value.trim() : 'Gelombang 2';
        activeDates = w2DatesInput ? w2DatesInput.value.trim() : '';
      } else if (actWave === 'wave3') {
        activeName = w3NameInput ? w3NameInput.value.trim() : 'Gelombang 3';
        activeDates = w3DatesInput ? w3DatesInput.value.trim() : '';
      } else {
        activeName = 'Pendaftaran SPMB Ditutup';
      }

      const legacyName = document.getElementById('set-wave-name');
      if (legacyName) legacyName.value = activeName;
      const legacyDates = document.getElementById('set-wave-dates');
      if (legacyDates) legacyDates.value = activeDates;

      updateWavePreview(activeName, statusVal, yearVal);
      updateNavbarWaveBadge(activeName, statusVal, yearVal);
    }

    async function saveCurrentSettings(isQuick = false) {
      if (!document.getElementById('form-school-settings').reportValidity()) return;
      const academicYear = acYearInput ? acYearInput.value.trim() : '2026/2027';
      const activeWave = activeWaveSelect ? activeWaveSelect.value : 'wave1';
      const waveStatus = statusSelect ? statusSelect.value : (activeWave === 'closed' ? 'closed' : 'open');

      const wave1Name = w1NameInput ? w1NameInput.value.trim() : 'Gelombang 1';
      const wave1Promo = w1PromoInput ? w1PromoInput.value.trim() : '';
      const wave1Dates = w1DatesInput ? w1DatesInput.value.trim() : '';

      const wave2Name = w2NameInput ? w2NameInput.value.trim() : 'Gelombang 2';
      const wave2Promo = w2PromoInput ? w2PromoInput.value.trim() : '';
      const wave2Dates = w2DatesInput ? w2DatesInput.value.trim() : '';

      const wave3Name = w3NameInput ? w3NameInput.value.trim() : 'Gelombang 3';
      const wave3Promo = w3PromoInput ? w3PromoInput.value.trim() : '';
      const wave3Dates = w3DatesInput ? w3DatesInput.value.trim() : '';

      let activeDisplayName = wave1Name;
      let activeDates = wave1Dates;
      if (activeWave === 'wave2') {
        activeDisplayName = wave2Name;
        activeDates = wave2Dates;
      } else if (activeWave === 'wave3') {
        activeDisplayName = wave3Name;
        activeDates = wave3Dates;
      } else if (activeWave === 'closed') {
        activeDisplayName = 'Pendaftaran Ditutup';
      }

      const waveNotice = noticeInput ? noticeInput.value.trim() : `Pendaftaran ${activeDisplayName} Sedang Berlangsung!`;
      const wavePoint1 = pt1Input ? pt1Input.value.trim() : 'Potongan Infaq Pembangunan hingga Rp 500.000';
      const wavePoint2 = pt2Input ? pt2Input.value.trim() : 'Prioritas Kuota Kelas & Seleksi Observasi Dini';
      const wavePoint3 = pt3Input ? pt3Input.value.trim() : 'Tersedia Jalur Prestasi Tahfizh & Beasiswa Yatim';

      const nextSettings = {
        academicYear,
        activeWave,
        waveStatus,
        wave1Name,
        wave1Promo,
        wave1Dates,
        wave2Name,
        wave2Promo,
        wave2Dates,
        wave3Name,
        wave3Promo,
        wave3Dates,
        waveName: activeDisplayName,
        waveDates: activeDates,
        waveNotice,
        wavePoint1,
        wavePoint2,
        wavePoint3,
        statTk: document.getElementById('set-stat-tk') ? document.getElementById('set-stat-tk').value.trim() : '180+',
        statSd: document.getElementById('set-stat-sd') ? document.getElementById('set-stat-sd').value.trim() : '650+',
        statSmp: document.getElementById('set-stat-smp') ? document.getElementById('set-stat-smp').value.trim() : '420+',
        statGuru: document.getElementById('set-stat-guru') ? document.getElementById('set-stat-guru').value.trim() : '85+',

        whatsappHelpdesk: document.getElementById('set-wa') ? document.getElementById('set-wa').value.trim() : '6285190610569',
        bankAccount: document.getElementById('set-bank') ? document.getElementById('set-bank').value.trim() : ''
      };

      try {
        document.querySelectorAll('[data-schedule-setting]').forEach(input => {
          nextSettings[input.dataset.scheduleSetting] = input.value.trim();
        });
        for (const level of ['tkit', 'sdit', 'smpit']) {
          nextSettings[level + '_jadwalWawancara'] = nextSettings[level + '_jadwalTes'];
        }
        const result = await apiRequest('api/settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextSettings)
        });
        settings = Object.assign({}, nextSettings, result.data || {});
        cacheSetItem(STORAGE_SETTINGS, JSON.stringify(settings));
        broadcastRealtime('settings_updated', settings);

      } catch (error) {
        showToast(`Gagal menyimpan pengaturan: ${error.message}`, true);
        return;
      }

      updateNavbarWaveBadge(activeDisplayName, waveStatus, academicYear);
      updateWavePreview(activeDisplayName, waveStatus, academicYear);
      updateWaveCardsUI(activeWave);
      const dbTpText = document.getElementById('admin-dashboard-tp-text');
      if (dbTpText) dbTpText.textContent = `Tahun Pelajaran ${academicYear}`;

      if (isQuick) {
        showToast(`✅ ${activeDisplayName} berhasil diaktifkan & tersimpan di Database!`);
      } else {
        showToast('✅ Seluruh data pengaturan SPMB & sekolah berhasil disimpan ke Database!');
      }
    }

    // Expose activateWaveQuick globally so card buttons can call it directly
    window.activateWaveQuick = function(waveKey) {
      if (activeWaveSelect) activeWaveSelect.value = waveKey;
      if (statusSelect) statusSelect.value = 'open';

      if (waveKey === 'wave1') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w1NameInput?.value || 'Gelombang 1'} Sedang Berlangsung! Dapatkan Diskon Infaq Rp 500.000`;
      } else if (waveKey === 'wave2') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w2NameInput?.value || 'Gelombang 2'} Resmi Dibuka! Segera daftarkan putra-putri tercinta.`;
      } else if (waveKey === 'wave3') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w3NameInput?.value || 'Gelombang 3'} (Kuota Terbatas) Sedang Berlangsung!`;
      }

      syncWaveFieldsAndPreview();
      saveCurrentSettings(true);
    };

    // Active wave select change handler (auto-saves immediately)
    activeWaveSelect?.addEventListener('change', () => {
      const actWave = activeWaveSelect.value;
      if (actWave === 'wave1') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w1NameInput?.value || 'Gelombang 1'} Sedang Berlangsung! Dapatkan Diskon Infaq Rp 500.000`;
      } else if (actWave === 'wave2') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w2NameInput?.value || 'Gelombang 2'} Resmi Dibuka! Segera daftarkan putra-putri tercinta.`;
      } else if (actWave === 'wave3') {
        if (noticeInput) noticeInput.value = `Pendaftaran ${w3NameInput?.value || 'Gelombang 3'} (Kuota Terbatas) Sedang Berlangsung!`;
      } else if (actWave === 'closed') {
        if (noticeInput) noticeInput.value = 'Pendaftaran SPMB Ditutup Sementara. Pantau pengumuman gelombang berikutnya.';
      }
      syncWaveFieldsAndPreview();
      saveCurrentSettings(true);
    });

    [acYearInput, statusSelect, w1NameInput, w1PromoInput, w1DatesInput, w2NameInput, w2PromoInput, w2DatesInput, w3NameInput, w3PromoInput, w3DatesInput].forEach(el => {
      el?.addEventListener('input', syncWaveFieldsAndPreview);
      el?.addEventListener('change', syncWaveFieldsAndPreview);
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCurrentSettings(false);
    });

    resetBtn?.addEventListener('click', async () => {
      if (confirm('Atur ulang seluruh pengaturan SPMB dan sekolah ke nilai bawaan? Data pendaftar dan artikel tidak akan dihapus.')) {
        try {
          const defaults = getDefaultSettings();
          const result = await apiRequest('api/settings.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaults)
          });
          settings = Object.assign({}, defaults, result.data || {});
          cacheSetItem(STORAGE_SETTINGS, JSON.stringify(settings));
          renderSettingsForm();
          broadcastRealtime('settings_updated', settings);
          showToast('Pengaturan bawaan berhasil disimpan ke database.');
        } catch (error) {
          showToast(`Gagal mereset pengaturan: ${error.message}`, true);
        }
      }
    });
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function renderJenjangBadge(jenjang) {
    const j = (jenjang || '').toLowerCase();
    if (j === 'tkit') {
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">TKIT</span>`;
    }
    if (j === 'smpit') {
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">SMPIT</span>`;
    }
    if (j === 'smait') {
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">SMAIT</span>`;
    }
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">SDIT</span>`;
  }

  function renderStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('lulus') || s.includes('diterima')) {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80"><i class="fa-regular fa-circle-check text-blue-600"></i><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('terverifikasi') || s.includes('lengkap')) {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"><i class="fa-regular fa-circle-check text-emerald-600"></i><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('menunggu') || s.includes('pembayaran') || s.includes('jadwal')) {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"><i class="fa-solid fa-hourglass-half text-amber-600"></i><span>${escapeHtml(status)}</span></span>`;
    }
    if (s.includes('tidak') || s.includes('tolak') || s.includes('belum')) {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-regular fa-circle-xmark text-rose-500"></i><span>${escapeHtml(status)}</span></span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"><span>${escapeHtml(status)}</span></span>`;
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

  function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.remove('success', 'error');
    toastEl.classList.add('show', isError ? 'error' : 'success');
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
    initSidebar();
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
