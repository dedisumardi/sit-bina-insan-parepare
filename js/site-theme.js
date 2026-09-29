(function () {
  'use strict';
  // Add matching Font Awesome icons only where the action has no icon already.
  // Never replace labels/children: listeners, loading labels and accessible names survive.
  const rules = [
    [/hapus|delete/i, 'trash-can'], [/batal|tutup/i, 'xmark'],
    [/kembali/i, 'arrow-left'], [/unduh|download|ekspor|export/i, 'download'],
    [/cetak/i, 'print'], [/simpan|kirim/i, 'floppy-disk'],
    [/unggah|upload/i, 'arrow-up-from-bracket'], [/whatsapp|konsultasi|hubungi/i, 'comment-dots'],
    [/daftar|pendaftaran/i, 'rocket'], [/masuk|login/i, 'arrow-right-to-bracket'],
    [/keluar|logout/i, 'arrow-right-from-bracket'], [/cari/i, 'magnifying-glass'],
    [/lanjut|lihat|buka|jelajahi/i, 'arrow-right'], [/ubah|edit/i, 'pen-to-square'],
    [/setujui|lulus|selesai/i, 'circle-check']
  ];
  function decorate(root) {
    const controls = root.querySelectorAll('button, a.btn');
    controls.forEach(control => {
      if (control.closest('.site-dialog, .building-controls, .spmb-reference-page, #admin-sidebar') || control.matches('[role="tab"],.spmb-modal-tab-btn,.faq-question,.mobile-toggle-btn')) return;
      const text = control.textContent.trim();
      if (!text || text.length > 110) return;
      const match = rules.find(([pattern]) => pattern.test(text));
      if (!match) return;
      control.classList.add('theme-action');
      if (/\bbg-(blue|emerald|indigo)-(600|700)\b/.test(control.className) && !/hapus|delete/i.test(text)) control.classList.add('theme-primary');
      if (control.querySelector('svg,i,img') || /[←→›✕]/.test(text)) return;
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-' + match[1] + ' theme-action-icon';
      icon.setAttribute('aria-hidden', 'true');
      control.prepend(icon);
    });
  }
  document.body.classList.toggle('theme-admin', !!document.getElementById('admin-sidebar'));
  decorate(document);
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; decorate(document); });
  }).observe(document.body, { childList:true, subtree:true });
})();
