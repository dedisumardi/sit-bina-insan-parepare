/**
 * SIT BINA INSAN PAREPARE - MASTER APPLICATION SCRIPT
 * Router Single Page App (Beranda, TKIT, SDIT, SMPIT, Berita, SPMB),
 * Mobile Drawer, Dynamic Content Rendering & Modal Article Reader
 */

(function () {
  'use strict';

  // Navigation Views mapping
  const validViews = ['beranda', 'tkit', 'sdit', 'smpit', 'berita', 'spmb'];
  let currentActiveView = 'beranda';

  // DOM Elements
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  const viewPanels = document.querySelectorAll('.view-panel');
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');

  // Modal Article Elements
  const modalOverlay = document.getElementById('article-modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-article-img');
  const modalCategory = document.getElementById('modal-article-category');
  const modalMeta = document.getElementById('modal-article-meta');
  const modalTitle = document.getElementById('modal-article-title');
  const modalProse = document.getElementById('modal-article-prose');

  // =========================================================================
  // Routing & View Management
  // =========================================================================
  function switchView(viewName) {
    if (!validViews.includes(viewName)) {
      viewName = 'beranda';
    }

    currentActiveView = viewName;

    // Update view panels
    viewPanels.forEach(panel => {
      const isTarget = panel.id === `view-${viewName}`;
      panel.classList.toggle('active', isTarget);
    });

    // Update active nav links
    navLinks.forEach(link => {
      const linkTarget = link.getAttribute('data-view');
      const isActive = linkTarget === viewName;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // Close mobile drawer if open
    closeMobileDrawer();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update document title
    updateDocumentTitle(viewName);

    // Refresh dynamic SPMB settings whenever entering SPMB or Beranda
    if (viewName === 'spmb' || viewName === 'beranda') {
      applySchoolSettings();
    }
  }

  function updateDocumentTitle(viewName) {
    const base = "SIT Bina Insan Parepare";
    const titles = {
      beranda: "Beranda | Sekolah Islam Terpadu Bina Insan Parepare",
      tkit: "TKIT Bina Insan Parepare | PAUD Islam Terpadu Ramah Anak",
      sdit: "SDIT Bina Insan Parepare | Sekolah Dasar Islam Terpadu Unggulan",
      smpit: "SMPIT Bina Insan Parepare | Sekolah Menengah Pertama Full Day School",
      berita: "Berita & Artikel Edukasi | SIT Bina Insan Parepare",
      spmb: "Pendaftaran SPMB Online TP 2025/2026 | SIT Bina Insan Parepare"
    };
    document.title = titles[viewName] || base;
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    switchView(hash || 'beranda');
  }

  // =========================================================================
  // Mobile Navigation Drawer
  // =========================================================================
  function openMobileDrawer() {
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function initNav() {
    // Hash change listener
    window.addEventListener('hashchange', handleHashChange);

    // Click handler for data-view elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-view]');
      if (target) {
        e.preventDefault();
        const view = target.getAttribute('data-view');
        window.location.hash = `#${view}`;
      }
    });

    // Mobile drawer toggles
    mobileToggleBtn?.addEventListener('click', openMobileDrawer);
    drawerCloseBtn?.addEventListener('click', closeMobileDrawer);
    mobileDrawer?.addEventListener('click', (e) => {
      if (e.target === mobileDrawer) {
        closeMobileDrawer();
      }
    });
  }

  // =========================================================================
  // Dynamic Content Renderers
  // =========================================================================

  // 1. Render Home Highlights (Berita Terkini)
  function renderHomeNews() {
    const container = document.getElementById('home-news-grid');
    if (!container || !window.SchoolData) return;

    // Take top 3 articles
    const topArticles = window.SchoolData.articles.slice(0, 3);
    container.innerHTML = topArticles.map(article => `
      <article class="news-card" onclick="window.openArticleModal(${article.id})">
        <div class="news-card-thumb">
          <img src="${article.image}" alt="${escapeHtml(article.title)}" loading="lazy">
          <span class="news-badge-cat ${article.categoryClass}">${article.category}</span>
        </div>
        <div class="news-card-body">
          <div class="news-meta">
            <span>📅 ${article.date}</span>
            <span>⏱️ ${article.readTime}</span>
          </div>
          <h3 class="news-card-title">${escapeHtml(article.title)}</h3>
          <p class="news-card-excerpt">${escapeHtml(article.excerpt)}</p>
          <span class="news-card-link">
            Baca Selengkapnya
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      </article>
    `).join('');
  }

  // 2. Render Full News Portal with Filters & Search
  let activeCategory = 'Semua';
  let searchQuery = '';

  function renderNewsPortal() {
    const container = document.getElementById('news-portal-grid');
    if (!container || !window.SchoolData) return;

    let filtered = window.SchoolData.articles;

    // Filter by Category
    if (activeCategory !== 'Semua') {
      filtered = filtered.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: #ffffff; border-radius: var(--radius-xl); border: 1px solid var(--neutral-200);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--neutral-400); margin-bottom: 0.75rem;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h4 style="font-size: 1.25rem; font-weight: 700; color: var(--neutral-800); margin-bottom: 0.35rem;">Artikel Tidak Ditemukan</h4>
          <p style="color: var(--neutral-500); font-size: 0.95rem;">Tidak ada artikel yang cocok dengan kata kunci "${escapeHtml(searchQuery)}". Silakan coba kata kunci lain.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(article => `
      <article class="news-card" onclick="window.openArticleModal(${article.id})">
        <div class="news-card-thumb">
          <img src="${article.image}" alt="${escapeHtml(article.title)}" loading="lazy">
          <span class="news-badge-cat ${article.categoryClass}">${article.category}</span>
        </div>
        <div class="news-card-body">
          <div class="news-meta">
            <span>📅 ${article.date}</span>
            <span>👤 ${article.author}</span>
          </div>
          <h3 class="news-card-title">${escapeHtml(article.title)}</h3>
          <p class="news-card-excerpt">${escapeHtml(article.excerpt)}</p>
          <span class="news-card-link">
            Baca Selengkapnya
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      </article>
    `).join('');
  }

  function initNewsPortalControls() {
    const categoryBtns = document.querySelectorAll('.news-cat-btn');
    const searchInput = document.getElementById('news-search-input');

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category || 'Semua';
        renderNewsPortal();
      });
    });

    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderNewsPortal();
    });
  }

  // 3. Render Testimonials on Home
  function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container || !window.SchoolData) return;

    container.innerHTML = window.SchoolData.testimonials.map(item => `
      <div class="testi-card">
        <div class="testi-stars">
          ★★★★★
        </div>
        <p class="testi-quote">"${escapeHtml(item.quote)}"</p>
        <div class="testi-author">
          <img src="${item.photo}" alt="${escapeHtml(item.name)}" class="testi-avatar" loading="lazy">
          <div>
            <div class="testi-name">${escapeHtml(item.name)}</div>
            <div class="testi-role">${escapeHtml(item.role)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 4. Render FAQ Accordions
  function renderFaqs() {
    const container = document.getElementById('faq-container');
    if (!container || !window.SchoolData) return;

    container.innerHTML = window.SchoolData.spmbFaqs.map((faq, index) => `
      <div class="faq-item ${index === 0 ? 'open' : ''}">
        <button type="button" class="faq-question" aria-expanded="${index === 0 ? 'true' : 'false'}">
          <span>${escapeHtml(faq.q)}</span>
          <div class="faq-icon-toggle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </button>
        <div class="faq-answer">
          <p>${escapeHtml(faq.a)}</p>
        </div>
      </div>
    `).join('');

    // Toggle click
    container.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        // Optional accordion single open behavior:
        container.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // =========================================================================
  // Article Modal Reader
  // =========================================================================
  window.openArticleModal = function (articleId) {
    if (!window.SchoolData) return;
    const article = window.SchoolData.articles.find(a => a.id === articleId);
    if (!article) return;

    modalImg.src = article.image;
    modalImg.alt = article.title;
    modalCategory.className = `badge-tag ${article.categoryClass}`;
    modalCategory.textContent = article.category;
    modalMeta.textContent = `Ditulis oleh ${article.author} • ${article.date} • ${article.readTime}`;
    modalTitle.textContent = article.title;
    modalProse.innerHTML = article.content;

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  function closeArticleModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function initModal() {
    modalCloseBtn?.addEventListener('click', closeArticleModal);
    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeArticleModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        closeArticleModal();
      }
    });
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Sync Public Data (Articles & Settings from MySQL API / LocalStorage)
  // =========================================================================
  function syncPublicData() {
    // 1. Sinkronisasi dari LocalStorage jika ada data artikel terbaru
    try {
      const storedArticles = localStorage.getItem('sit_bina_insan_articles_data');
      if (storedArticles && window.SchoolData) {
        const parsed = JSON.parse(storedArticles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.SchoolData.articles = parsed;
        }
      }
    } catch (e) {}

    // 2. Coba sinkronisasi online dari database MySQL di cPanel
    if (window.fetch && window.SchoolData) {
      fetch('api/articles.php')
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success && Array.isArray(resData.data)) {
            window.SchoolData.articles = resData.data;
            localStorage.setItem('sit_bina_insan_articles_data', JSON.stringify(resData.data));
            renderHomeNews();
            renderNewsPortal();
          }
        })
        .catch(e => console.log('Public Articles sync: offline fallback'));

      // 2. Database adalah sumber utama pengaturan sekolah.

      const handleCloudSettings = (cloudData) => {
        if (cloudData && typeof cloudData === 'object' && cloudData.academicYear) {
          const currentRaw = localStorage.getItem('sit_bina_insan_settings');
          const newRaw = JSON.stringify(cloudData);
          if (currentRaw !== newRaw) {
            localStorage.setItem('sit_bina_insan_settings', newRaw);
            applySchoolSettings(cloudData);
            console.log('✅ Public settings updated from Cloud');
          }
        }
      };

      fetch('api/settings.php', { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error('Cloud HTTP ' + res.status);
          return res.json();
        })
        .then(resData => handleCloudSettings(resData && resData.success ? resData.data : null))
        .catch(() => console.log('Pengaturan belum dapat dimuat dari database.'));
    }
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

  function applySchoolSettings(settings) {
    if (!settings) {
      try {
        const raw = localStorage.getItem('sit_bina_insan_settings');
        if (raw) settings = JSON.parse(raw);
      } catch (e) {}
    }
    // Fallback to SchoolData.settings if localStorage is not populated yet
    if (!settings && window.SchoolData && window.SchoolData.settings) {
      settings = window.SchoolData.settings;
    }
    if (!settings) return;
    if (window.SchoolData) window.SchoolData.settings = settings;

    // 0. Academic Year & Wave Variables
    const academicYear = settings.academicYear || '2026/2027';
    const startYear = academicYear.split('/')[0]?.trim() || '2026';
    const targetYear = academicYear.split('/')[1]?.trim() || startYear;

    // Parse active wave
    let activeWave = settings.activeWave || 'wave1';
    if (typeof activeWave === 'string') {
      const low = activeWave.toLowerCase().trim();
      if (low === 'wave2' || low.includes('gelombang 2') || low.includes('gelombang-2')) activeWave = 'wave2';
      else if (low === 'wave3' || low.includes('gelombang 3') || low.includes('gelombang-3')) activeWave = 'wave3';
      else if (low === 'wave1' || low.includes('gelombang 1') || low.includes('gelombang-1')) activeWave = 'wave1';
      else if (low.includes('tutup') || settings.waveStatus === 'closed') activeWave = 'closed';
      else if (!['wave1', 'wave2', 'wave3', 'closed'].includes(activeWave)) activeWave = 'wave1';
    }
    const waveStatus = settings.waveStatus || (activeWave === 'closed' ? 'closed' : 'open');

    // Extract wave details
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

    let w2Name = settings.wave2Name || 'Gelombang 2';
    let w2Promo = settings.wave2Promo !== undefined ? settings.wave2Promo : 'Reguler';
    let w2Dates = settings.wave2Dates || `1 April ${targetYear} s/d 31 Mei ${targetYear}`;

    let w3Name = settings.wave3Name || 'Gelombang 3';
    let w3Promo = settings.wave3Promo !== undefined ? settings.wave3Promo : 'S/d Kuota Terpenuhi';
    let w3Dates = settings.wave3Dates || `1 Juni ${targetYear} s/d Kuota Terpenuhi`;

    let activeDisplayName = w1Name;
    if (activeWave === 'wave2') activeDisplayName = w2Name;
    else if (activeWave === 'wave3') activeDisplayName = w3Name;
    else if (activeWave === 'closed') activeDisplayName = 'Pendaftaran Ditutup';

    // Global synchronizations across all views in the page
    document.querySelectorAll('.spmb-sync-tp').forEach(el => {
      el.textContent = 'TP ' + academicYear;
    });
    document.querySelectorAll('.spmb-sync-year').forEach(el => {
      el.textContent = academicYear;
    });
    document.querySelectorAll('.spmb-sync-start-year').forEach(el => {
      el.textContent = startYear;
    });
    document.querySelectorAll('.spmb-sync-wave-name').forEach(el => {
      el.textContent = activeDisplayName;
    });
    document.querySelectorAll('.spmb-sync-wave-badge').forEach(el => {
      el.textContent = activeDisplayName;
    });

    // Update SchoolData profile in memory
    if (window.SchoolData && window.SchoolData.profile) {
      window.SchoolData.profile.academicYear = academicYear;
      window.SchoolData.profile.activeWave = activeDisplayName;
      window.SchoolData.profile.waveStatus = waveStatus;
    }

    // Dynamic Title update if SPMB view is currently visible
    if (window.location.hash === '#spmb') {
      document.title = `Pendaftaran SPMB Online TP ${academicYear} | SIT Bina Insan Parepare`;
    }

    // 1. WhatsApp Helpdesk
    if (settings.whatsappHelpdesk) {
      const cleanWa = String(settings.whatsappHelpdesk).replace(/\D/g, '');
      if (window.SchoolData && window.SchoolData.profile) {
        window.SchoolData.profile.whatsappHelpdesk = settings.whatsappHelpdesk;
        window.SchoolData.profile.whatsapp = '+' + settings.whatsappHelpdesk;
      }
      const waTexts = document.querySelectorAll('.topbar-socials strong');
      waTexts.forEach(el => {
        el.textContent = '+' + settings.whatsappHelpdesk;
      });
      if (cleanWa) {
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
          try {
            const currentHref = a.getAttribute('href');
            if (currentHref && currentHref.includes('wa.me/')) {
              const [base, query] = currentHref.split('?');
              a.href = `https://wa.me/${cleanWa}${query ? '?' + query : ''}`;
            }
          } catch (e) {}
        });
      }
    }

    // 2. Active Wave Notice in Topbar
    const topbarWave = document.getElementById('home-topbar-wave');
    if (topbarWave) {
      if (waveStatus === 'closed') {
        topbarWave.textContent = settings.waveNotice || 'Pendaftaran SPMB Ditutup Sementara';
      } else if (settings.waveNotice) {
        topbarWave.textContent = settings.waveNotice;
      } else {
        const curPromo = activeWave === 'wave1' ? w1Promo : (activeWave === 'wave2' ? w2Promo : w3Promo);
        const promoNotice = curPromo ? ` (${curPromo})` : '';
        topbarWave.textContent = `Pendaftaran ${activeDisplayName}${promoNotice} Sedang Berlangsung!`;
      }
    }

    // 3. Hero Card Title in Beranda
    const heroWaveTitle = document.getElementById('home-hero-wave-title');
    if (heroWaveTitle) {
      if (waveStatus === 'closed') {
        heroWaveTitle.textContent = 'Pendaftaran SPMB Ditutup Sementara';
      } else {
        const curPromo = activeWave === 'wave1' ? w1Promo : (activeWave === 'wave2' ? w2Promo : w3Promo);
        const promoSuffix = curPromo ? ` (${curPromo})` : '';
        heroWaveTitle.textContent = `Penerimaan Siswa Baru ${activeDisplayName}${promoSuffix}`;
      }
    }

    // 3b. Hero Card 3 Benefit Points in Beranda (Editable by Admin)
    const p1 = document.getElementById('home-hero-point-1');
    const p2 = document.getElementById('home-hero-point-2');
    const p3 = document.getElementById('home-hero-point-3');
    if (p1 && settings.wavePoint1) p1.innerHTML = settings.wavePoint1;
    if (p2 && settings.wavePoint2) p2.innerHTML = settings.wavePoint2;
    if (p3 && settings.wavePoint3) p3.innerHTML = settings.wavePoint3;

    // 3c. Homepage Hero Stats (Editable by Admin)
    const sTk = document.getElementById('home-stat-tk');
    const sSd = document.getElementById('home-stat-sd');
    const sSmp = document.getElementById('home-stat-smp');
    const sGuru = document.getElementById('home-stat-guru');
    if (sTk && settings.statTk) sTk.textContent = settings.statTk;
    if (sSd && settings.statSd) sSd.textContent = settings.statSd;
    if (sSmp && settings.statSmp) sSmp.textContent = settings.statSmp;
    if (sGuru && settings.statGuru) sGuru.textContent = settings.statGuru;

    // 4. SPMB Timeline Waves Highlighting & Dates (Hanya gelombang yang sedang buka)
    const timelineWrap = document.getElementById('home-waves-timeline');
    if (timelineWrap) {
      const waves = [
        { key: 'wave1', name: w1Name, promo: w1Promo, dates: w1Dates },
        { key: 'wave2', name: w2Name, promo: w2Promo, dates: w2Dates },
        { key: 'wave3', name: w3Name, promo: w3Promo, dates: w3Dates }
      ];

      // Hanya tampilkan gelombang yang statusnya sedang buka
      const openWaves = waves.filter((w) => {
        return (activeWave === w.key && waveStatus === 'open');
      });

      if (openWaves.length > 0) {
        timelineWrap.innerHTML = openWaves.map((w) => {
          const promoHtml = w.promo ? ` <span class="wave-promo-badge">${escapeHtml(w.promo)}</span>` : '';
          return `
            <div class="wave-pill active">
              <div class="wave-dot"></div>
              <span><strong>${escapeHtml(w.name)}${promoHtml}:</strong> ${escapeHtml(w.dates)} <span class="wave-open-label">(Sedang Buka)</span></span>
            </div>
          `;
        }).join('');
      } else {
        timelineWrap.innerHTML = '';
      }
    }


    // 6. Bank Account Transfer Instructions
    if (settings.bankAccount) {
      const bankDisplayEl = document.getElementById('spmb-bank-display');
      if (bankDisplayEl) {
        bankDisplayEl.textContent = settings.bankAccount;
      }
      const copyBankBtn = document.getElementById('spmb-btn-copy-bank');
      if (copyBankBtn) {
        const match = settings.bankAccount.match(/\d[\d\-]{5,}\d/);
        const accNum = match ? match[0].replace(/\D/g, '') : '7112345678';
        copyBankBtn.setAttribute('onclick', `window.copyBankNumber('${accNum}')`);
      }
    }
  }

  // =========================================================================
  // Real-Time Cross-Tab / Cross-Window Synchronization
  // =========================================================================
  function showRealtimeToast(msg) {
    let toast = document.getElementById('realtime-sync-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'realtime-sync-toast';
      toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; background:#002f9b; color:#fff; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); display:flex; align-items:center; gap:8px; transition:opacity 0.3s ease, transform 0.3s ease; opacity:0; transform:translateY(20px); pointer-events:none; font-family:"Plus Jakarta Sans", sans-serif;';
      toast.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#60a5fa;"></span><span id="realtime-sync-toast-text"></span>`;
      document.body.appendChild(toast);
    }
    const textEl = document.getElementById('realtime-sync-toast-text');
    if (textEl) textEl.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 3200);
  }

  // 1. BroadcastChannel API (0ms instant cross-tab sync)
  try {
    const realtimeChannel = new BroadcastChannel('sit_spmb_realtime');
    realtimeChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === 'settings_updated' && msg.data) {
        applySchoolSettings(msg.data);
        showRealtimeToast('Informasi SPMB & Gelombang baru saja diperbarui dari Admin');
      } else if (msg.type === 'articles_updated' && msg.data) {
        window.SchoolData.articles = msg.data;
        renderHomeNews();
        renderNewsPortal();
        showRealtimeToast('Berita & pengumuman baru diterbitkan dari Admin');
      }
    };
  } catch (e) {
    console.log('BroadcastChannel fallback');
  }

  // 2. Storage event listener (Reliable native cross-tab fallback)
  window.addEventListener('storage', (e) => {
    if (e.key === 'sit_bina_insan_settings' && e.newValue) {
      try {
        const newSettings = JSON.parse(e.newValue);
        applySchoolSettings(newSettings);
        showRealtimeToast('Informasi SPMB & Gelombang diperbarui');
      } catch (err) {}
    } else if (e.key === 'sit_bina_insan_articles_data' && e.newValue) {
      try {
        const newArticles = JSON.parse(e.newValue);
        if (Array.isArray(newArticles)) {
          window.SchoolData.articles = newArticles;
          renderHomeNews();
          renderNewsPortal();
        }
      } catch (err) {}
    }
  });

  // 3. Auto-sync polling on tab visibility change
  let lastSettingsHash = '';
  function checkLiveSettings() {
    if (document.hidden) return;
    try {
      const raw = localStorage.getItem('sit_bina_insan_settings');
      if (raw && raw !== lastSettingsHash) {
        lastSettingsHash = raw;
        const data = JSON.parse(raw);
        applySchoolSettings(data);
      } else if (!raw && window.SchoolData && window.SchoolData.settings) {
        applySchoolSettings(window.SchoolData.settings);
      }
    } catch (e) {}
  }
  setInterval(checkLiveSettings, 1000);

  // 4. Polling database agar perubahan admin tampil lintas perangkat.
  let isSyncingCloud = false;
  function pollCloudSync() {
    if (document.hidden || !navigator.onLine || isSyncingCloud) return;
    isSyncingCloud = true;
    fetch('api/settings.php', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Cloud HTTP ' + res.status);
        return res.json();
      })
      .then(resData => {
        isSyncingCloud = false;
        const cloudData = resData && resData.success ? resData.data : null;
        if (cloudData && typeof cloudData === 'object' && cloudData.academicYear) {
          const currentRaw = localStorage.getItem('sit_bina_insan_settings');
          const newRaw = JSON.stringify(cloudData);
          if (currentRaw !== newRaw) {
            localStorage.setItem('sit_bina_insan_settings', newRaw);
            applySchoolSettings(cloudData);
            showRealtimeToast('Informasi SPMB & Gelombang diperbarui secara live');
          }
        }
      })
      .catch(() => {
        isSyncingCloud = false;
      });
  }
  setInterval(pollCloudSync, 4000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkLiveSettings();
      try { syncPublicData(); } catch (err) {}
    }
  });
  window.addEventListener('focus', () => {
    checkLiveSettings();
    try { syncPublicData(); } catch (err) {}
  });

  // =========================================================================
  // Image Error Recovery & Cache Buster Fallback
  // =========================================================================
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
      const img = e.target;
      if (!img.dataset.retry) {
        img.dataset.retry = '1';
        const cleanSrc = img.src.split('?')[0];
        // Retry with fresh timestamp to bypass any stale 404 cache
        img.src = cleanSrc + '?t=' + Date.now();
      }
    }
  }, true);

  // =========================================================================
  // App Initialization
  // =========================================================================
  function init() {
    syncPublicData();
    applySchoolSettings();
    initNav();
    initModal();
    renderHomeNews();
    renderNewsPortal();
    initNewsPortalControls();
    renderTestimonials();
    renderFaqs();

    // Trigger initial route
    handleHashChange();
  }

  // Expose renderers to window for Dynamic Section Engine
  window.renderHomeNews = renderHomeNews;
  window.renderTestimonials = renderTestimonials;
  window.renderFaqs = renderFaqs;
  window.applySchoolSettings = applySchoolSettings;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
