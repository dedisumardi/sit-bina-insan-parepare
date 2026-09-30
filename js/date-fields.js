/* Keep the original ISO date input as the form's source of truth. */
(function () {
  'use strict';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const pad = value => String(value).padStart(2, '0');
  function daysInMonth(year, month) { return month ? new Date(Number(year) || 2000, Number(month), 0).getDate() : 31; }
  function isoDate(year, month, day) {
    if (!year || !month || !day || Number(day) > daysInMonth(year, month)) return '';
    return year + '-' + pad(month) + '-' + pad(day);
  }
  const dateValue = date => isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  if (typeof module !== 'undefined') module.exports = { daysInMonth, isoDate };
  if (typeof document === 'undefined') return;
  let closeActive = null;
  document.querySelectorAll('input[type="date"]').forEach((input, index) => {
    const name = input.labels?.[0]?.textContent.trim().replace(/\s*\*$/, '') || 'Tanggal';
    const button = (text, className) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = className; el.textContent = text;
      return el;
    };
    const trigger = button('', 'date-picker-trigger');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const popup = document.createElement('div');
    popup.className = 'date-picker-popup';
    popup.id = 'date-picker-' + index;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Pilih ' + name);
    popup.setAttribute('popover', 'manual');
    popup.hidden = true;
    trigger.setAttribute('aria-controls', popup.id);
    const header = document.createElement('div');
    header.className = 'date-picker-header';
    const prev = button('Bulan sebelumnya', 'date-picker-prev');
    const next = button('Bulan berikutnya', 'date-picker-next');
    const month = document.createElement('select');
    month.setAttribute('aria-label', 'Bulan');
    months.forEach((text, n) => month.append(new Option(text, String(n))));
    const year = document.createElement('select');
    year.setAttribute('aria-label', 'Tahun');
    header.append(prev, month, year, next);
    const weekdays = document.createElement('div');
    weekdays.className = 'date-picker-weekdays';
    weekdays.setAttribute('aria-hidden', 'true');
    ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].forEach(text => {
      const label = document.createElement('span'); label.textContent = text; weekdays.append(label);
    });
    const grid = document.createElement('div');
    grid.className = 'date-picker-grid';
    const footer = document.createElement('div');
    footer.className = 'date-picker-footer';
    const clear = button('Hapus', 'date-picker-clear');
    const closeButton = button('Tutup', 'date-picker-close');
    footer.append(clear, closeButton);
    popup.append(header, weekdays, grid, footer);
    const error = document.createElement('span');
    error.className = 'date-picker-error'; error.hidden = true;
    error.id = popup.id + '-error'; error.setAttribute('role', 'alert');
    trigger.setAttribute('aria-describedby', error.id);
    input.insertAdjacentElement('afterend', trigger);
    trigger.insertAdjacentElement('afterend', error);
    document.body.append(popup);
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    let view = new Date();
    const allowed = value => (!input.min || value >= input.min) && (!input.max || value <= input.max);
    function position() {
      if (popup.hidden) return;
      const rect = trigger.getBoundingClientRect();
      popup.style.left = Math.max(8, Math.min(rect.left, innerWidth - popup.offsetWidth - 8)) + 'px';
      const below = rect.bottom + 6;
      popup.style.top = Math.max(8, below + popup.offsetHeight <= innerHeight ? below : rect.top - popup.offsetHeight - 6) + 'px';
    }
    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = Number(input.min.slice(0, 4)) || 1900;
      const last = Number(input.max.slice(0, 4)) || new Date().getFullYear() + 10;
      year.replaceChildren();
      for (let n = Math.max(last, y); n >= Math.min(first, y); n--) year.append(new Option(String(n), String(n)));
      year.value = String(y); month.value = String(m);
      prev.disabled = Boolean(input.min && isoDate(y, m + 1, 1) <= input.min);
      next.disabled = Boolean(input.max && isoDate(y, m + 1, daysInMonth(y, m + 1)) >= input.max);
      grid.replaceChildren();
      const offset = new Date(y, m, 1).getDay();
      const total = Math.ceil((offset + daysInMonth(y, m + 1)) / 7) * 7;
      const today = dateValue(new Date());
      for (let n = 0; n < total; n++) {
        const date = new Date(y, m, n - offset + 1), value = dateValue(date);
        const cell = button(String(date.getDate()), 'date-picker-day');
        cell.dataset.date = value;
        cell.setAttribute('aria-label', date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear());
        cell.setAttribute('aria-pressed', String(value === input.value));
        if (date.getMonth() !== m) cell.classList.add('is-outside');
        if (value === today) cell.setAttribute('aria-current', 'date');
        cell.disabled = !allowed(value);
        cell.addEventListener('click', () => choose(value));
        grid.append(cell);
      }
      position();
    }
    function close(focus = false) {
      if (popup.hidden) return;
      if (popup.hidePopover) popup.hidePopover();
      popup.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (closeActive === close) closeActive = null;
      if (focus) trigger.focus();
    }
    function open() {
      if (trigger.disabled) return;
      if (closeActive && closeActive !== close) closeActive();
      view = input.value ? new Date(input.value + 'T12:00:00') : new Date();
      if (input.max && dateValue(view) > input.max) view = new Date(input.max + 'T12:00:00');
      if (input.min && dateValue(view) < input.min) view = new Date(input.min + 'T12:00:00');
      view.setDate(1);
      popup.hidden = false; render();
      if (popup.showPopover) popup.showPopover();
      position(); closeActive = close;
      trigger.setAttribute('aria-expanded', 'true');
      (grid.querySelector('[aria-pressed="true"]:not(:disabled)') || grid.querySelector('[aria-current="date"]:not(:disabled)') || month).focus();
    }
    function sync() {
      const [y, m, d] = input.value.split('-');
      trigger.textContent = input.value ? Number(d) + ' ' + months[Number(m) - 1] + ' ' + y : 'Pilih tanggal';
      trigger.setAttribute('aria-label', name + ': ' + trigger.textContent);
      trigger.disabled = input.disabled || input.readOnly;
      error.hidden = true; trigger.removeAttribute('aria-invalid');
      if (!popup.hidden) { if (trigger.disabled) close(); else render(); }
    }
    function choose(value) {
      descriptor.set.call(input, value);
      sync(); close(true);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    trigger.addEventListener('click', () => popup.hidden ? open() : close());
    prev.addEventListener('click', () => { view.setMonth(view.getMonth() - 1); render(); });
    next.addEventListener('click', () => { view.setMonth(view.getMonth() + 1); render(); });
    month.addEventListener('change', () => { view.setMonth(Number(month.value)); render(); });
    year.addEventListener('change', () => { view.setFullYear(Number(year.value)); render(); });
    clear.addEventListener('click', () => choose(''));
    closeButton.addEventListener('click', () => close(true));
    popup.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (delta && event.target.dataset.date) {
        event.preventDefault();
        const date = new Date(event.target.dataset.date + 'T12:00:00');
        date.setDate(date.getDate() + delta);
        if (!allowed(dateValue(date))) return;
        view = new Date(date.getFullYear(), date.getMonth(), 1); render();
        grid.querySelector('[data-date="' + dateValue(date) + '"]')?.focus();
      }
    });
    document.addEventListener('pointerdown', event => { if (!popup.contains(event.target) && !trigger.contains(event.target)) close(); });
    document.addEventListener('focusin', event => { if (!popup.contains(event.target) && event.target !== trigger) close(); });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() { return descriptor.get.call(this); },
      set(value) { descriptor.set.call(this, value); sync(); }
    });
    input.classList.add('date-field-original'); input.tabIndex = -1; input.setAttribute('aria-hidden', 'true');
    input.addEventListener('invalid', event => {
      event.preventDefault(); error.textContent = input.validationMessage;
      error.hidden = false; trigger.setAttribute('aria-invalid', 'true'); trigger.focus(); open();
    });
    input.addEventListener('focus', () => trigger.focus());
    input.form?.addEventListener('reset', () => { close(); setTimeout(sync, 0); });
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ['value', 'min', 'max', 'required', 'disabled', 'readonly'] });
    sync();
  });
})();
