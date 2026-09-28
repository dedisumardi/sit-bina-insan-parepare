const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('homepage and timeline retain the global status for open, upcoming and closed registration', () => {
  const source = fs.readFileSync('js/app.js', 'utf8');
  const code = source.slice(source.indexOf('    // Keep the global registration state'), source.indexOf('    // 6. Bank Account'));
  const nodes = {};
  const context = { document: { getElementById: id => nodes[id] ||= {} }, settings: { waveNotice: 'Pendaftaran sedang berlangsung!' },
    activeWave: 'wave1', academicYear: '2026/2027', activeDisplayName: 'Gelombang 1',
    w1Name: 'Gelombang 1', w2Name: 'Gelombang 2', w3Name: 'Gelombang 3',
    w1Promo: '', w2Promo: '', w3Promo: '', w1Dates: '', w2Dates: '', w3Dates: '', escapeHtml: String };
  for (const [status, label] of [['upcoming', 'Segera Dibuka'], ['closed', 'Pendaftaran Ditutup Sementara'], ['open', 'Pendaftaran Dibuka (Online Aktif)']]) {
    vm.runInNewContext(code, { ...context, waveStatus: status });
    assert.equal(nodes['home-registration-status'].textContent, label);
    assert.ok(nodes['home-waves-timeline'].innerHTML.length > 0);
    if (status !== 'open') {
      assert.ok(nodes['home-waves-timeline'].innerHTML.includes(label));
      assert.doesNotMatch(nodes['home-topbar-wave'].textContent, /sedang berlangsung/i);
      assert.match(nodes['home-hero-wave-title'].textContent, /Segera Dibuka|Ditutup Sementara/);
    }
  }
});
