const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('ATM-style transfer card displays configured bank details and copies the same account', () => {
  const source = fs.readFileSync('js/app.js', 'utf8');
  const start = source.indexOf('    if (settings.bankAccount) {');
  const end = source.indexOf('\n  }', start);
  const elements = {};
  const document = { getElementById(id) {
    return elements[id] ||= { setAttribute(name, value) { this[name] = value; } };
  } };
  vm.runInNewContext(source.slice(start, end), {
    document,
    settings: { bankAccount: 'Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare' }
  });
  assert.equal(elements['spmb-bank-name'].textContent, 'Bank Syariah Indonesia (BSI)');
  assert.equal(elements['spmb-bank-display'].textContent, '711-234-5678');
  assert.equal(elements['spmb-bank-holder'].textContent, 'Yayasan Bina Insan Parepare');
  assert.equal(elements['spmb-btn-copy-bank'].onclick, "window.copyBankNumber('7112345678')");
});
