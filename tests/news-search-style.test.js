const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('news search input uses SPMB quick check form model', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/components.css', 'utf8');

  // Check index.html markup
  assert.ok(html.includes('id="news-search-input"'), 'index.html must contain #news-search-input');
  assert.ok(html.includes('placeholder="KETIK JUDUL BERITA ATAU ARTIKEL..."'), 'placeholder must be formatted in uppercase matching SPMB model');
  assert.ok(html.includes('fa-magnifying-glass'), 'search input must contain Font Awesome magnifying glass icon');
  assert.ok(html.includes('rounded-xl'), 'search input must use rounded-xl style');

  // Check components.css overrides
  assert.ok(css.includes('.news-search-box input'), 'css/components.css must style .news-search-box input');
  assert.ok(!css.includes('.news-search-box {\n  display: flex;\n  align-items: center;\n  background: var(--neutral-100);'), 'old pill background should be removed from .news-search-box');
});
