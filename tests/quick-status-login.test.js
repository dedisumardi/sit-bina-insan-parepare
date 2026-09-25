const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('quick search does not automatically set session on logout, but opens login modal', async () => {
  const spmbJs = fs.readFileSync('js/spmb.js', 'utf8');

  // Verify code logic pattern
  assert.ok(spmbJs.includes("window.openSpmbModal('login')"), 'spmb.js must open login modal on quick search button click');
  assert.ok(!spmbJs.includes("cacheSetItem(PARENT_SESSION_KEY, JSON.stringify({ nama: found.namaAyah"), 'spmb.js must not directly auto-login from found quick search data');

  // Simulate quick-open-parent-portal click behavior
  let modalOpenedWith = null;
  let sessionSet = null;
  let portalRendered = false;

  const storage = {};
  const mockFound = {
    regNumber: 'SPMB-2026-000001',
    namaAyah: 'Arfa',
    waAyah: '081234567890',
    status: 'Lulus Seleksi Observasi & Diterima (Pendaftaran Selesai)'
  };

  const context = {
    PARENT_SESSION_KEY: 'sit_active_parent_session',
    localStorage: {
      getItem(key) { return storage[key] || null; },
      setItem(key, val) { storage[key] = val; sessionSet = val; },
      removeItem(key) { delete storage[key]; }
    },
    escapeHtml(str) { return str; },
    window: {
      location: { hash: '' },
      openSpmbModal(mode) { modalOpenedWith = mode; }
    },
    renderParentPortal() { portalRendered = true; },
    refreshParentFromDatabase() {},
    document: {
      getElementById(id) {
        if (id === 'spmb-modal-subtitle') return { innerHTML: '', textContent: '' };
        return null;
      }
    }
  };

  // Test Case 1: User is logged out (storage is empty)
  // When clicking Buka Portal, it must NOT set session, and must open login modal
  const clickHandler = function () {
    const rawSession = context.localStorage.getItem(context.PARENT_SESSION_KEY);
    let session = null;
    try { session = JSON.parse(rawSession); } catch (_) {}

    const cleanSessionWa = (session?.wa || '').replace(/\D/g, '');
    const cleanFoundWa = (mockFound.waAyah || '').replace(/\D/g, '');
    const isCurrentSession = Boolean(cleanSessionWa && cleanFoundWa && (cleanSessionWa === cleanFoundWa || cleanSessionWa.endsWith(cleanFoundWa.slice(-9)) || cleanFoundWa.endsWith(cleanSessionWa.slice(-9))));

    if (isCurrentSession) {
      context.window.location.hash = '#spmb';
      context.renderParentPortal();
    } else {
      context.localStorage.removeItem(context.PARENT_SESSION_KEY);
      context.window.openSpmbModal('login');
      const subtitleEl = context.document.getElementById('spmb-modal-subtitle');
      if (subtitleEl && mockFound.regNumber) {
        subtitleEl.innerHTML = `Masukkan Nomor WhatsApp orang tua untuk mengakses portal ${mockFound.regNumber}`;
      }
    }
  };

  clickHandler();

  assert.equal(sessionSet, null, 'Session must not be set automatically');
  assert.equal(modalOpenedWith, 'login', 'Modal must be opened in login mode');
  assert.equal(portalRendered, false, 'Portal must not be rendered yet without login');

  // Test Case 2: User logs in with WhatsApp
  storage['sit_active_parent_session'] = JSON.stringify({ nama: mockFound.namaAyah, wa: mockFound.waAyah });
  clickHandler();
  assert.equal(portalRendered, true, 'Portal is rendered when session matches');
});
