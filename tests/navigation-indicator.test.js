const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('navigation underline follows active menu and resizes to its label', () => {
  const values = {};
  let changed;
  let active = { left: 120, bottom: 60, width: 100 };
  const link = { getBoundingClientRect: () => active };
  const menu = {
    querySelectorAll: () => [link], querySelector: () => link,
    getClientRects: () => [1], getBoundingClientRect: () => ({ left: 100, top: 20 }),
    style: { setProperty: (key, value) => { values[key] = value; } },
    classList: { add() {} }
  };
  vm.runInNewContext(fs.readFileSync('js/navigation-indicator.js', 'utf8'), {
    document: { querySelector: () => menu }, window: { addEventListener() {} },
    getComputedStyle: () => ({ paddingLeft: '14' }),
    MutationObserver: class { constructor(callback) { changed = callback; } observe() {} },
    ResizeObserver: class { observe() {} },
    cancelAnimationFrame() {}, requestAnimationFrame(callback) { callback(); }
  });
  assert.equal(values['--nav-line-x'], '34px');
  assert.equal(values['--nav-line-width'], '72px');
  active = { left: 360, bottom: 60, width: 130 };
  changed();
  assert.equal(values['--nav-line-x'], '274px');
  assert.equal(values['--nav-line-width'], '102px');
  assert.equal(values['--nav-line-y'], '37px');
});
