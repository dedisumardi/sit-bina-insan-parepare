const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('schedule pickers restore, format WITA, validate and preserve legacy schedules', () => {
  const source = fs.readFileSync('js/admin.js', 'utf8');
  const code = source.slice(source.indexOf('  function renderScheduleEditors()'), source.indexOf('  function renderSettingsForm()'));
  const field = () => ({ value: '', setCustomValidity(message) { this.error = message; } });
  const stored = field(), date = field(), start = field(), end = field(), legacy = {};
  const fields = { '[data-schedule-setting]': stored, '[data-schedule-part="date"]': date,
    '[data-schedule-part="start"]': start, '[data-schedule-part="end"]': end, '[data-schedule-legacy]': legacy };
  const context = { document: { querySelectorAll: () => [{ querySelector: key => fields[key] }] }, Intl, Date };
  vm.createContext(context);
  vm.runInContext(code, context);
  stored.value = 'Sabtu, 28 Maret 2026 | Pukul 08.00 - 10.00 WITA';
  context.renderScheduleEditors();
  assert.equal(date.value, '2026-03-28');
  assert.equal(start.value, '08:00');
  assert.equal(end.value, '10:00');
  date.value = '2026-09-25';
  date.oninput();
  assert.equal(stored.value, 'Jumat, 25 September 2026 | Pukul 08.00 - 10.00 WITA');
  end.value = '07:00'; end.oninput();
  assert.ok(end.error);
  end.value = ''; end.oninput();
  assert.equal(end.required, true);
  date.value = start.value = end.value = ''; date.oninput();
  assert.equal(stored.value, '');
  assert.equal(date.required, false);
  stored.value = 'Jadwal lama yang belum terstruktur';
  context.renderScheduleEditors();
  assert.equal(stored.value, 'Jadwal lama yang belum terstruktur');
  assert.equal(legacy.hidden, false);
});
