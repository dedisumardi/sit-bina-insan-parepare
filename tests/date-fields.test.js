const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { daysInMonth, isoDate } = require('../js/date-fields.js');

test('date fields handle leap years and differing month lengths', () => {
  assert.equal(daysInMonth('2024', '2'), 29);
  assert.equal(daysInMonth('2023', '2'), 28);
  assert.equal(daysInMonth('1900', '2'), 28);
  assert.equal(daysInMonth('2000', '2'), 29);
  assert.equal(daysInMonth('2026', '4'), 30);
  assert.equal(daysInMonth('2026', '1'), 31);
});
test('date values retain the ISO format expected by existing forms', () => {
  assert.equal(isoDate('2024', '2', '29'), '2024-02-29');
  assert.equal(isoDate('2023', '2', '29'), '');
  assert.equal(isoDate('', '2', '20'), '');
  assert.equal(isoDate('2015', '9', '1'), '2015-09-01');
});
test('both pages load the shared date enhancement before their form logic', () => {
  for (const [file, script] of [['index.html', 'js/spmb.js'], ['admin.html', 'js/admin.js']]) {
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.indexOf('<script src="js/date-fields.js') < html.indexOf(`<script src="${script}`));
    assert.match(html, /forms.css\?v=20260930_date1/);
  }
});
