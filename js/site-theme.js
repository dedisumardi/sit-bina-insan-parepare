(function () {
  'use strict';
  const icons = 'svg, i, img, .theme-action-icon, .faq-icon-toggle';
  const symbols = /[\u2190-\u21ff\u2600-\u27bf\u{1f000}-\u{1faff}\uFE0F\u200D\uE000-\uF8FF›«»×]/gu;
  function decorate(root) {
    const controls = root.querySelectorAll('button, a[class*="btn"], a[class*="rounded"], .floating-whatsapp, [role="button"]');
    controls.forEach(control => {
      // Slider dots retain their compact visual navigation and accessible labels.
      if (control.closest('.building-controls')) return;
      // Preserve nodes and listeners used by controls that update their icons later.
      control.querySelectorAll(icons).forEach(icon => {
        icon.classList.add('button-icon-hidden');
        icon.setAttribute('aria-hidden', 'true');
      });
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement.closest(icons)) continue;
        const clean = node.nodeValue.replace(symbols, '');
        if (clean !== node.nodeValue) node.nodeValue = clean;
      }
      const visibleText = Array.from(control.childNodes).some(function hasText(child) {
        if (child.nodeType === Node.TEXT_NODE) return !!child.nodeValue.trim();
        if (child.nodeType !== Node.ELEMENT_NODE || child.matches(icons)) return false;
        return Array.from(child.childNodes).some(hasText);
      });
      if (!visibleText) {
        const label = document.createElement('span');
        label.className = 'button-text-fallback';
        const hint = control.getAttribute('aria-label') || control.getAttribute('title');
        label.textContent = /close|tutup/i.test(hint || '') || control.matches('[class*="close"]') ? 'Tutup'
          : /menu|sidebar/i.test(hint || '') || control.matches('.mobile-toggle-btn') ? 'Menu'
          : hint || 'Buka';
        control.append(label);
        control.classList.add('button-text-only');
      }
      if (/\bbg-(blue|emerald|indigo)-(600|700)\b/.test(control.className) && !/hapus|delete/i.test(control.textContent)) control.classList.add('theme-primary');
    });
  }
  document.body.classList.toggle('theme-admin', !!document.getElementById('admin-sidebar'));
  decorate(document);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; decorate(document); });
  }).observe(document.body, { childList:true, characterData: true, subtree:true });
})();
