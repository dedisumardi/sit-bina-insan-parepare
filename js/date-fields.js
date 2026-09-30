/* Progressive enhancement: keep the original ISO date field for existing forms. */
(function () {
  'use strict';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const pad = value => String(value).padStart(2, '0');
  function daysInMonth(year, month) {
    if (!month) return 31;
    return new Date(Number(year) || 2000, Number(month), 0).getDate();
  }
  function isoDate(year, month, day) {
    if (!year || !month || !day || Number(day) > daysInMonth(year, month)) return '';
    return `${year}-${pad(month)}-${pad(day)}`;
  }
  if (typeof module !== 'undefined') module.exports = { daysInMonth, isoDate };
  if (typeof document === 'undefined') return;

  function enhance(input) {
    const group = document.createElement('div');
    group.className = 'date-field-parts';
    group.setAttribute('role', 'group');
    const label = input.labels?.[0];
    const name = label?.textContent.trim().replace(/\s*\*$/, '') || 'Tanggal';
    group.setAttribute('aria-label', name);
    const makeSelect = (title, key) => {
      const select = document.createElement('select');
      select.className = `date-field-${key}`;
      select.setAttribute('aria-label', `${title} — ${name}`);
      select.append(new Option(title, ''));
      group.append(select);
      return select;
    };
    const day = makeSelect('Tanggal', 'day');
    const month = makeSelect('Bulan', 'month');
    const year = makeSelect('Tahun', 'year');
    months.forEach((title, index) => month.append(new Option(title, String(index + 1))));
    const parts = [day, month, year];
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    function refreshDays() {
      const previous = day.value;
      day.length = 1;
      for (let n = 1; n <= daysInMonth(year.value, month.value); n++) day.append(new Option(String(n), String(n)));
      day.value = previous;
    }
    function sync() {
      const [y, m, d] = input.value.split('-');
      const currentYear = new Date().getFullYear();
      const first = Number(input.min.slice(0, 4)) || 1900;
      const last = Number(input.max.slice(0, 4)) || currentYear + 10;
      year.length = 1;
      for (let n = Math.max(last, Number(y) || last); n >= Math.min(first, Number(y) || first); n--) year.append(new Option(String(n), String(n)));
      year.value = y || '';
      month.value = m ? String(Number(m)) : '';
      refreshDays();
      day.value = d ? String(Number(d)) : '';
      parts.forEach(select => {
        select.disabled = input.disabled || input.readOnly;
        select.required = input.required;
        select.setCustomValidity('');
      });
    }
    parts.forEach(select => select.addEventListener('change', () => {
      if (select !== day) refreshDays();
      const value = isoDate(year.value, month.value, day.value);
      descriptor.set.call(input, value);
      parts.forEach(part => part.setCustomValidity(''));
      if (value && ((input.min && value < input.min) || (input.max && value > input.max))) {
        day.setCustomValidity('Tanggal di luar rentang yang diperbolehkan. Silakan pilih tanggal lain.');
      } else if (!value && parts.some(part => part.value)) {
        parts.find(part => !part.value)?.setCustomValidity('Lengkapi tanggal, bulan, dan tahun.');
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }));
    // Existing portal/admin code assigns .value when loading a saved record.
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() { return descriptor.get.call(this); },
      set(value) { descriptor.set.call(this, value); sync(); }
    });
    input.insertAdjacentElement('afterend', group);
    input.classList.add('date-field-original');
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.addEventListener('invalid', event => {
      event.preventDefault();
      const target = parts.find(part => !part.value) || day;
      target.focus();
      target.setCustomValidity(input.validationMessage);
      target.reportValidity();
    });
    input.addEventListener('focus', () => day.focus());
    input.form?.addEventListener('reset', () => setTimeout(sync, 0));
    new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ['value', 'min', 'max', 'required', 'disabled', 'readonly'] });
    sync();
  }
  document.querySelectorAll('input[type="date"]').forEach(enhance);
})();
