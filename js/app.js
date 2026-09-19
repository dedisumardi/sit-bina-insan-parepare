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
  }

  function updateDocumentTitle(viewName) {
    const base = "SIT Bina Insan Parepare";
    const titles = {
      beranda: "Beranda | Sekolah Islam Terpadu Bina Insan Parepare",
      tkit: "TKIT Bina Insan Parepare | PAUD Islam Terpadu Ramah Anak",
      sdit: "SDIT Bina Insan Parepare | Sekolah Dasar Islam Terpadu Unggulan",
      smpit: "SMPIT Bina Insan Parepare | Menengah Pertama & Pesantren Tahfizh",
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
          if (resData && resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
            window.SchoolData.articles = resData.data;
            localStorage.setItem('sit_bina_insan_articles_data', JSON.stringify(resData.data));
            renderHomeNews();
            renderNewsPortal();
          }
        })
        .catch(e => console.log('Public Articles sync: offline fallback'));

      // Sinkronisasi Pengaturan Sekolah (WA helpdesk, Gelombang, Infaq)
      fetch('api/settings.php')
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.success && resData.data) {
            localStorage.setItem('sit_bina_insan_settings', JSON.stringify(resData.data));
            applySchoolSettings(resData.data);
          }
        })
        .catch(e => console.log('Public Settings sync: offline fallback'));
    }
  }

  function applySchoolSettings(settings) {
    if (!settings) {
      try {
        const raw = localStorage.getItem('sit_bina_insan_settings');
        if (raw) settings = JSON.parse(raw);
      } catch (e) {}
    }
    if (!settings) return;

    // 1. WhatsApp Helpdesk
    if (settings.whatsappHelpdesk) {
      if (window.SchoolData && window.SchoolData.profile) {
        window.SchoolData.profile.whatsappHelpdesk = settings.whatsappHelpdesk;
        window.SchoolData.profile.whatsapp = '+' + settings.whatsappHelpdesk;
      }
      const waTexts = document.querySelectorAll('.topbar-socials strong');
      waTexts.forEach(el => {
        el.textContent = '+' + settings.whatsappHelpdesk;
      });
    }

    // 2. Active Wave Notice in Topbar
    const topbarWave = document.getElementById('home-topbar-wave');
    if (topbarWave) {
      if (settings.waveStatus === 'closed') {
        topbarWave.textContent = settings.waveNotice || 'Pendaftaran SPMB Ditutup Sementara';
      } else if (settings.waveNotice) {
        topbarWave.textContent = settings.waveNotice;
      } else if (settings.waveName || settings.activeWave) {
        const name = settings.waveName || settings.activeWave;
        topbarWave.textContent = `Pendaftaran ${name} Sedang Berlangsung!`;
      }
    }

    // 3. Hero Card Title in Beranda
    const heroWaveTitle = document.getElementById('home-hero-wave-title');
    if (heroWaveTitle) {
      const activeName = settings.waveName || settings.activeWave || 'Gelombang 1 (Early Bird)';
      if (settings.waveStatus === 'closed') {
        heroWaveTitle.textContent = `Pendaftaran SPMB (${activeName}) Ditutup Sementara`;
      } else {
        heroWaveTitle.textContent = `Penerimaan Santri Baru ${activeName}`;
      }
    }

    // 3b. Hero Card 3 Benefit Points in Beranda (Editable by Admin)
    const p1 = document.getElementById('home-hero-point-1');
    const p2 = document.getElementById('home-hero-point-2');
    const p3 = document.getElementById('home-hero-point-3');
    if (p1 && settings.wavePoint1) p1.innerHTML = settings.wavePoint1;
    if (p2 && settings.wavePoint2) p2.innerHTML = settings.wavePoint2;
    if (p3 && settings.wavePoint3) p3.innerHTML = settings.wavePoint3;

    // 4. SPMB Timeline Waves Highlighting & Dates
    const timelineWrap = document.getElementById('home-waves-timeline');
    if (timelineWrap) {
      const activeName = (settings.waveName || settings.activeWave || '').toLowerCase();
      const wavePills = timelineWrap.querySelectorAll('.wave-pill');
      
      wavePills.forEach((pill, idx) => {
        let isCurrent = false;
        if (settings.waveStatus === 'closed') {
          isCurrent = false;
        } else if (activeName.includes('gelombang 1') && idx === 0) {
          isCurrent = true;
        } else if (activeName.includes('gelombang 2') && idx === 1) {
          isCurrent = true;
        } else if (activeName.includes('gelombang 3') && idx === 2) {
          isCurrent = true;
        } else if (idx === 0 && !activeName.includes('gelombang 2') && !activeName.includes('gelombang 3')) {
          isCurrent = settings.waveStatus !== 'closed';
        }

        pill.classList.toggle('active', isCurrent);
        const dot = pill.querySelector('.wave-dot');
        if (dot) {
          if (isCurrent) {
            dot.style.backgroundColor = '';
            dot.style.boxShadow = '';
          } else {
            dot.style.backgroundColor = 'var(--neutral-400)';
            dot.style.boxShadow = 'none';
          }
        }

        // Update date text if current and waveDates is specified
        if (isCurrent && settings.waveDates) {
          const span = pill.querySelector('span');
          if (span) {
            const waveLabel = idx === 0 ? 'Gelombang 1' : (idx === 1 ? 'Gelombang 2' : 'Gelombang 3');
            span.innerHTML = `<strong>${settings.waveName || waveLabel}:</strong> ${settings.waveDates} (Sedang Buka)`;
          }
        }
      });
    }

    // 5. Infaq Fee Dynamic Updates
    if (settings.tkitFee) {
      const tkitPrice = document.getElementById('spmb-price-tkit');
      if (tkitPrice) tkitPrice.textContent = 'Infaq: ' + settings.tkitFee;
      const tkitInfoFee = document.getElementById('tkit-info-fee');
      if (tkitInfoFee) tkitInfoFee.textContent = settings.tkitFee;
    }
    if (settings.sditFee) {
      const sditPrice = document.getElementById('spmb-price-sdit');
      if (sditPrice) sditPrice.textContent = 'Infaq: ' + settings.sditFee;
    }
    if (settings.smpitFee) {
      const smpitPrice = document.getElementById('spmb-price-smpit');
      if (smpitPrice) smpitPrice.textContent = 'Infaq: ' + settings.smpitFee;
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
      toast.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; background:#047857; color:#fff; padding:12px 20px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); display:flex; align-items:center; gap:8px; transition:opacity 0.3s ease, transform 0.3s ease; opacity:0; transform:translateY(20px); pointer-events:none; font-family:"Plus Jakarta Sans", sans-serif;';
      toast.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#34d399;"></span><span id="realtime-sync-toast-text"></span>`;
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
      }
    } catch (e) {}
  }
  setInterval(checkLiveSettings, 2500);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkLiveSettings();
      syncPublicData();
    }
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
