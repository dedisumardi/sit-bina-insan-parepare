const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('registration cards and dynamic states use the website blue palette', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/spmb.css', 'utf8');
  const js = fs.readFileSync('js/spmb.js', 'utf8');
  const portal = html.slice(html.indexOf('<div id="spmb-parent-portal"'), html.indexOf('<div class="spmb-modal-overlay"'));
  for (const source of [portal, css, js]) {
    assert.doesNotMatch(source, /#(?:059669|10b981|15803d|166534|14532d|dcfce7|f0fdf4|ecfdf5|86efac)\b/i);
    assert.doesNotMatch(source, /(?:bg|text|border|ring)-emerald-/);
  }
  assert.match(portal, /id="portal-spmb-completed-card"[^>]*background:var\(--primary-50\)/);
  assert.match(html, /600: '#002f9b'/);
  assert.match(css, /\.portal-flow-steps \.portal-flow-step\.done \.step-circle\s*\{\s*background: var\(--primary-600\)/);
  assert.match(js, /statusPill\.style\.color = 'var\(--primary-700\)'/);
});
