(function () {
  'use strict';
  let pending = Promise.resolve();

  function show(message, options = {}) {
    const task = pending.then(() => new Promise(resolve => {
      const previousFocus = document.activeElement;
      const dialog = document.createElement('dialog');
      dialog.className = 'site-dialog';
      dialog.setAttribute('aria-labelledby', 'site-dialog-title');
      dialog.setAttribute('aria-describedby', 'site-dialog-message');
      dialog.innerHTML = `<div class="site-dialog-heading"><span class="site-dialog-icon" aria-hidden="true">${options.confirm ? '?' : 'i'}</span><div><span class="site-dialog-brand">SIT BINA INSAN PAREPARE</span><h2 id="site-dialog-title">${options.confirm ? 'Konfirmasi Tindakan' : 'Informasi'}</h2></div></div><p id="site-dialog-message"></p><div class="site-dialog-actions"><button type="button" class="site-dialog-cancel">Batal</button><button type="button" class="site-dialog-ok">${options.confirm ? 'Ya, Lanjutkan' : 'Mengerti'}</button></div>`;
      dialog.querySelector('#site-dialog-message').textContent = String(message);
      const cancel = dialog.querySelector('.site-dialog-cancel');
      const ok = dialog.querySelector('.site-dialog-ok');
      cancel.hidden = !options.confirm;
      if (options.value !== undefined) {
        const input = document.createElement('input');
        input.className = 'site-dialog-value';
        input.readOnly = true;
        input.value = String(options.value);
        input.setAttribute('aria-label', 'Nomor rekening untuk disalin');
        input.addEventListener('focus', () => input.select());
        dialog.querySelector('.site-dialog-actions').before(input);
      }
      ok.addEventListener('click', () => dialog.close('yes'));
      cancel.addEventListener('click', () => dialog.close('no'));
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        dialog.close('no');
      });
      dialog.addEventListener('close', () => {
        const accepted = dialog.returnValue === 'yes';
        dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        resolve(accepted);
      }, { once: true });
      document.body.append(dialog);
      dialog.showModal();
      (options.confirm ? cancel : ok).focus();
    }));
    pending = task.catch(() => {});
    return task;
  }

  window.SiteDialog = {
    alert: message => show(message),
    confirm: message => show(message, { confirm: true }),
    copy: (message, value) => show(message, { value })
  };
})();
