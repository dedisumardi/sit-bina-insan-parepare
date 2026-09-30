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

test('article editor supports banner upload, preview, and Word-style visual rich text editing', () => {
  const adminHtml = fs.readFileSync('admin.html', 'utf8');
  const siteThemeCss = fs.readFileSync('css/site-theme.css', 'utf8');
  const componentsCss = fs.readFileSync('css/components.css', 'utf8');
  const adminJs = fs.readFileSync('js/admin.js', 'utf8');

  // Verify Banner Upload & Preview
  assert.ok(adminHtml.includes('id="article-banner-input"'), 'admin.html must contain banner file input');
  assert.ok(adminHtml.includes('id="article-image-preset"'), 'admin.html must contain preset dropdown');
  assert.ok(adminHtml.includes('id="banner-preview-img"'), 'admin.html must contain live banner preview image');
  assert.ok(adminHtml.includes('id="tab-banner-upload"'), 'admin.html must contain upload tab');

  // Verify Word-Style WYSIWYG Editor in admin.html
  assert.ok(adminHtml.includes('id="article-editor-visual"'), 'admin.html must contain visual contenteditable editor');
  assert.ok(adminHtml.includes('data-cmd="insertOrderedList"'), 'Toolbar must have numbered list (1. 2. 3.) command');
  assert.ok(adminHtml.includes('data-cmd="italic"'), 'Toolbar must have italic command');
  assert.ok(adminHtml.includes('data-cmd="bold"'), 'Toolbar must have bold command');

  // Verify CSS typography for Word-style editor
  assert.ok(siteThemeCss.includes('#article-editor-visual'), 'site-theme.css must style visual editor canvas');
  assert.ok(siteThemeCss.includes('#article-editor-visual ol'), 'site-theme.css must support ordered list numbering');
  assert.ok(siteThemeCss.includes('#article-editor-visual em'), 'site-theme.css must support italic rendering');

  // Verify Public Reader CSS supports ordered list and italics
  assert.ok(componentsCss.includes('.modal-article-prose ol'), 'components.css must style ordered lists with decimal numbers');
  assert.ok(componentsCss.includes('.modal-article-prose em'), 'components.css must style italic text');

  // Verify js/admin.js logic
  assert.ok(adminJs.includes('setVisualEditorContent'), 'admin.js must provide visual editor content setter');
  assert.ok(adminJs.includes('syncVisualToRaw'), 'admin.js must provide visual editor syncing to raw form value');
  assert.ok(adminJs.includes('article-banner-input'), 'admin.js must handle banner file upload events');
});

