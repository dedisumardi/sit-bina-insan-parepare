const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Dashboard styling follows active navigation rather than permanent color utilities', () => {
  const html = fs.readFileSync('admin.html', 'utf8');
  const button = html.match(/<button[^>]*data-panel="dashboard"[^>]*>/)[0];
  const classes = button.match(/class="([^"]+)"/)[1].split(/\s+/);
  assert.ok(!classes.some(name => /^(bg-|shadow-|text-white$)/.test(name)));
  assert.match(html, /\.sidebar-item-btn \.sidebar-active-indicator\s*\{\s*display: none;/);
  assert.match(html, /\.sidebar-item-btn\.active\s*\{\s*background-color: #002f9b/);
  const source = fs.readFileSync('js/admin.js', 'utf8');
  const code = source.slice(source.indexOf('function switchPanel('), source.indexOf('window.switchPanel ='));
  const buttons = ['dashboard', 'spmb', 'berita', 'settings'].map(panel => ({
    dataset: { panel }, active: false,
    classList: { toggle(name, active) { buttons.find(b => b.dataset.panel === panel).active = active; } }
  }));
  const context = { navItemBtns: buttons, adminPanels: [], panelMeta: {}, window: {},
    currentSpmbSubTab: 'siswa', renderDashboard() {}, renderSpmbTable() {}, renderArticlesTable() {}, renderSettingsForm() {} };
  vm.createContext(context);
  vm.runInContext(code, context);
  for (const panel of ['dashboard', 'spmb', 'berita', 'settings', 'dashboard']) {
    context.switchPanel(panel);
    assert.deepEqual(buttons.filter(b => b.active).map(b => b.dataset.panel), [panel]);
  }
});
