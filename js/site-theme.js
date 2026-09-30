(function () {
  'use strict';
  const icons = 'svg, i, img, .theme-action-icon, .faq-icon-toggle';
  const symbols = /[\u2190-\u21ff\u2600-\u27bf\u{1f000}-\u{1faff}\uFE0F\u200D\uE000-\uF8FF›«»×]/gu;
  function actionIcon(control, original) {
    const editorIcons = { bold:'bold', italic:'italic', underline:'underline', strikeThrough:'strikethrough', insertOrderedList:'list-ol', insertUnorderedList:'list-ul', formatBlock:'quote-right', insertHorizontalRule:'minus', removeFormat:'text-slash', undo:'rotate-left', redo:'rotate-right' };
    if (editorIcons[control.dataset.cmd]) return 'fa-solid fa-' + editorIcons[control.dataset.cmd];
    if (control.matches('.faq-question')) return 'fa-solid fa-chevron-down';
    if (control.matches('[class*="close"]')) return 'fa-solid fa-xmark';
    const text = [control.textContent, control.getAttribute('aria-label'), control.title, control.id, control.getAttribute('data-cmd'), control.getAttribute('data-panel')].join(' ').toLowerCase();
    const href = control.getAttribute('href') || '';
    if (/wa\.me\/|whatsapp|hubungi.*panitia|konsultasi/.test(href + ' ' + text)) return 'fa-brands fa-whatsapp';
    for (const brandName of ['facebook', 'instagram', 'youtube', 'tiktok']) {
      if (href.includes(brandName + '.com')) return 'fa-brands fa-' + brandName;
    }
    const brand = original?.className?.match?.(/fa-(facebook(?:-f)?|instagram|youtube|tiktok)\b/);
    if (brand) return 'fa-brands ' + brand[0];
    const rules = [
      [/logout|keluar|ganti akun/, 'right-from-bracket'],
      [/close|tutup|batal|batalkan|clear-btn/, 'xmark'],
      [/sidebar|menu navigasi|toggle.*menu/, 'bars'],
      [/hapus|delete|trash/, 'trash-can'],
      [/salin|copy/, 'copy'],
      [/cetak|print/, 'print'],
      [/export|ekspor|unduh|download/, 'file-arrow-down'],
      [/upload|unggah|kirim.*bukti/, 'cloud-arrow-up'],
      [/refresh|muat ulang|sinkron|perbarui/, 'arrows-rotate'],
      [/reset|ulang|undo/, 'rotate-left'],
      [/kembali|sebelumnya|back|prev/, 'arrow-left'],
      [/lanjut|berikutnya|next/, 'arrow-right'],
      [/masuk|login/, 'right-to-bracket'],
      [/edit|ubah|pencil/, 'pen-to-square'],
      [/simpan|save/, 'floppy-disk'],
      [/setujui|approve|lulus|selesai|mengerti|verifikasi|complete/, 'circle-check'],
      [/tolak|reject/, 'circle-xmark'],
      [/tambah|buat baru|add-article/, 'plus'],
      [/(?:lihat|buka)\s+(?:web|website|situs)/, 'arrow-up-right-from-square'],
      [/lihat|detail|profil/, 'eye'],
      [/daftar|isi.*form|biodata/, 'user-plus'],
      [/cari|search/, 'magnifying-glass'],
      [/bold|tebal/, 'bold'], [/italic|miring/, 'italic'], [/underline|garis bawah/, 'underline'],
      [/strikethrough|coret/, 'strikethrough'], [/insertorderedlist/, 'list-ol'], [/insertunorderedlist/, 'list-ul'],
      [/blockquote|kutipan/, 'quote-right'], [/horizontalrule|pembatas/, 'minus'], [/removeformat/, 'text-slash'], [/redo/, 'rotate-right'],
      [/gambar|foto|galeri|banner/, 'image'],
      [/semua/, 'layer-group'], [/prestasi/, 'trophy'], [/kegiatan/, 'calendar-day'], [/info spmb/, 'circle-info'],
      [/pengaturan|settings/, 'gear'], [/dashboard/, 'chart-pie'],
      [/orang tua|wali/, 'users'], [/siswa|siswa$/, 'graduation-cap'],
      [/berita|artikel/, 'newspaper'], [/faq|pertanyaan/, 'circle-question'],
      [/aktifkan|activate|gelombang/, 'power-off'], [/lihat|detail|profil|buka/, 'eye']
    ];
    for (const [pattern, icon] of rules) if (pattern.test(text)) return 'fa-solid fa-' + icon;
    const existing = original && Array.from(original.classList).find(name => /^fa-/.test(name) && !/^(fa-solid|fa-regular|fa-brands|fa-fw|fa-spin|fa-pulse|fa-[0-9]+x|fa-xs|fa-sm|fa-lg|fa-xl|fa-2xl)$/.test(name));
    return existing ? 'fa-solid ' + existing : 'fa-solid fa-arrow-right';
  }
  function decorate(root) {
    const controls = root.querySelectorAll('button, a[class*="btn"], a[class*="rounded"], a[href*="wa.me/"], .floating-whatsapp, [role="button"]');
    controls.forEach(control => {
      // Slider dots retain their compact visual navigation and accessible labels.
      if (control.closest('.building-controls, .date-picker-grid, .date-picker-header') || control.matches('.footer-social-btn, .date-picker-trigger')) return;
      // Numeric page selectors and calendar dates remain compact navigation controls.
      if (/^\d+$/.test(control.textContent.trim()) && !control.getAttribute('aria-label')) return;
      const originals = Array.from(control.querySelectorAll(icons));
      const topIcons = originals.filter(icon => !originals.some(parent => parent !== icon && parent.contains(icon)));
      const original = topIcons.find(icon => icon.matches('i')) || topIcons[0];
      const iconClass = actionIcon(control, original);
      // Preserve nodes and listeners used by controls that update their icons later.
      originals.forEach(icon => {
        icon.classList.add('button-icon-hidden');
        if (icon.style.getPropertyValue('display') !== 'none') icon.style.setProperty('display', 'none', 'important');
        if (icon.getAttribute('aria-hidden') !== 'true') icon.setAttribute('aria-hidden', 'true');
      });
      control.querySelectorAll('.wa-helpdesk-icon, .button-text-fallback').forEach(icon => icon.remove());
      control.classList.remove('button-text-only');
      let action = control.querySelector('.action-solid-icon');
      if (!action) {
        action = document.createElement('span');
        action.setAttribute('aria-hidden', 'true');
        if (original) original.before(action);
        else control.prepend(action);
      }
      const wantedClass = iconClass + ' action-solid-icon';
      if (action.className !== wantedClass) action.className = wantedClass;
      control.classList.add('action-icon-control');
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.parentElement.closest(icons + ', .action-solid-icon')) continue;
        const clean = node.nodeValue.replace(symbols, '');
        if (clean !== node.nodeValue) node.nodeValue = clean;
      }
      const visibleText = Array.from(control.childNodes).some(function hasText(child) {
        if (child.nodeType === Node.TEXT_NODE) return !!child.nodeValue.trim();
        if (child.nodeType !== Node.ELEMENT_NODE || child.matches(icons + ', .action-solid-icon')) return false;
        return Array.from(child.childNodes).some(hasText);
      });
      if (!visibleText) {
        const hint = control.getAttribute('aria-label') || control.getAttribute('title');
        if (!control.getAttribute('aria-label')) control.setAttribute('aria-label', hint || (/close|tutup/i.test(control.className) ? 'Tutup' : 'Buka'));
        control.classList.add('action-icon-only');
      } else {
        control.classList.remove('action-icon-only');
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
  }).observe(document.body, { childList:true, characterData: true, attributes:true, attributeFilter:['href', 'title', 'disabled'], subtree:true });
})();
