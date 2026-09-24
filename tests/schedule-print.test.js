const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('schedule print has an isolated A4 sheet and leaves payment print unchanged', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/spmb.css', 'utf8');
  const js = fs.readFileSync('js/spmb.js', 'utf8');
  assert.equal((html.match(/onclick="window.printScheduleCard\(\)"/g) || []).length, 1);
  assert.ok(html.includes('onclick="window.printApprovedCard()"'));
  assert.ok(css.includes('@page { size: A4 portrait; margin: 12mm; }'));
  assert.ok(css.includes('body.printing-schedule > :not(#schedule-print-sheet) { display: none !important; }'));
  assert.ok(js.includes('await refreshScheduleSettings();'));
  assert.ok(js.includes('content.append(metadata.cloneNode(true), details)'));
  assert.ok(js.includes("details.querySelector('button')?.parentElement.remove()"));
  assert.ok(js.includes('Math.min(1, maxHeight / content.getBoundingClientRect().height)'));
  assert.ok(js.includes("window.addEventListener('afterprint', cleanup, { once: true })"));
});
