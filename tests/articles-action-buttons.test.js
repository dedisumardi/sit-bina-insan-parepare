const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('articles management table action buttons have visible styling and icon overrides', () => {
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  const siteThemeCss = fs.readFileSync('css/site-theme.css', 'utf8');
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');
  const siteThemeJs = fs.readFileSync('js/site-theme.js', 'utf8');

  // Verify CSS overrides in site-theme.css
  assert.ok(siteThemeCss.includes('#articles-table-body svg'), 'site-theme.css must include #articles-table-body svg in visible icon rules');
  assert.ok(siteThemeCss.includes('#panel-berita button svg'), 'site-theme.css must include #panel-berita button svg in visible icon rules');
  assert.ok(siteThemeCss.includes('#articles-table-body .button-text-fallback'), 'site-theme.css must hide fallback text in #articles-table-body');

  // Verify admin.html head styles
  assert.ok(adminHtml.includes('#articles-table-body :is(button, a) :is(svg, i)'), 'admin.html head style must display #articles-table-body button icons');

  // Verify js/site-theme.js exclusions
  assert.ok(siteThemeJs.includes('#articles-table-body'), 'site-theme.js must exclude #articles-table-body from icon stripping');

  // Verify renderArticlesTable in js/admin.js uses spmb-action-btn and data-action-btn
  assert.ok(adminJs.includes('window.editArticle(${item.id})'), 'js/admin.js must have editArticle button trigger');
  assert.ok(adminJs.includes('window.deleteArticle(${item.id})'), 'js/admin.js must have deleteArticle button trigger');
  assert.ok(adminJs.includes('spmb-action-btn w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 text-slate-500 hover:text-amber-600'), 'Edit button must have standardized visible styling');
  assert.ok(adminJs.includes('spmb-action-btn w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 text-slate-500 hover:text-rose-600'), 'Delete button must have standardized visible styling');
});
