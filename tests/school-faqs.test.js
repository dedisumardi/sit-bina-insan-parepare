const { test } = require('node:test');
const assert = require('node:assert/strict');
const { build } = require('../js/school-faqs');
test('FAQ follows settings updates and level profiles without stale promises', () => {
  const school = { levels: { smpit: { name: 'SMPIT', description: 'Pendidikan Full Day School.', keyPrograms: [{ title: '01. Tahsin' }] } } };
  const settings = { waveStatus: 'closed', activeWave: 'wave2', academicYear: '2028/2029', wave2Dates: '1 Mei 2028', smpitFee: 'Rp 123.000', whatsappHelpdesk: '6281234567890' };
  const text = JSON.stringify(build(school, settings));
  for (const value of ['ditutup sementara', '2028/2029', '1 Mei 2028', '6281234567890', 'Full Day School', 'Tahsin', 'enam tahap', 'Reguler']) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /infaq formulir|Rp 123\.000/i);
  assert.doesNotMatch(text, /2027|4 langkah|musyrif|minimal 2 Juz/);
  assert.match(build(school, { ...settings, waveStatus: 'upcoming' })[0].a, /segera dibuka/);
  assert.match(build(school, { ...settings, waveStatus: 'open' })[0].a, /Pendaftaran dibuka/);
  assert.doesNotMatch(JSON.stringify(build()), /undefined|null/);
});
