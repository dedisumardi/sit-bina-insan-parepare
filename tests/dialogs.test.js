const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const opened = [];
  function element() {
    return {
      events: {}, children: {},
      setAttribute() {}, focus() {}, select() {}, before() {}, remove() {},
      addEventListener(type, handler) { this.events[type] = handler; },
      querySelector(selector) { return this.children[selector] ||= element(); },
      showModal() { opened.push(this); },
      close(value) { this.returnValue = value; this.events.close(); }
    };
  }
  const window = {};
  const document = { activeElement: null, createElement: element, body: { append() {} } };
  vm.runInNewContext(fs.readFileSync('js/dialogs.js', 'utf8'), { window, document });
  return { api: window.SiteDialog, opened };
}

test('confirmation waits for explicit approval; cancel and Escape deny actions', async () => {
  const { api, opened } = setup();
  for (const action of ['cancel', 'escape', 'ok']) {
    const result = api.confirm('Hapus data?');
    await new Promise(setImmediate);
    const dialog = opened.at(-1);
    if (action === 'escape') dialog.events.cancel({ preventDefault() {} });
    else dialog.querySelector(`.site-dialog-${action}`).events.click();
    assert.equal(await result, action === 'ok');
  }
});

test('messages are plain text and queued without overwriting each other', async () => {
  const { api, opened } = setup();
  const first = api.alert('<img src=x onerror=alert(1)>');
  const second = api.copy('Salin nomor rekening:', '1234567890');
  await new Promise(setImmediate);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].querySelector('#site-dialog-message').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(opened[0].querySelector('.site-dialog-cancel').hidden, true);
  opened[0].close('yes');
  await first;
  await new Promise(setImmediate);
  assert.equal(opened.length, 2);
  opened[1].close('yes');
  await second;
});

test('both pages load shared dialogs before application scripts; no native popup calls remain', () => {
  for (const page of ['index.html', 'admin.html']) {
    const html = fs.readFileSync(page, 'utf8');
    assert.ok(html.includes('css/dialogs.css'));
    assert.ok(html.indexOf('js/dialogs.js') < html.indexOf('js/data.js'));
  }
  for (const file of fs.readdirSync('js').filter(file => file.endsWith('.js'))) {
    assert.doesNotMatch(fs.readFileSync(`js/${file}`, 'utf8'), /(?<![\w.])(?:alert|confirm|prompt)\s*\(/);
  }
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  assert.equal((admin.match(/await SiteDialog.confirm\(/g) || []).length, 9);
});

test('all message dialog variants use the favicon only in the heading with text-only actions', async () => {
  const { api, opened } = setup();
  for (const kind of ['alert', 'confirm', 'copy']) {
    const result = api[kind]('Pesan pengujian', '123');
    await new Promise(setImmediate);
    const dialog = opened.at(-1);
    assert.equal((dialog.innerHTML.match(/src="\/assets\/icons\/favicon.png\?v=3"/g) || []).length, 1);
    assert.doesNotMatch(dialog.innerHTML.split('class="site-dialog-actions"')[1], /<img|<svg|<i\b/);
    assert.doesNotMatch(dialog.innerHTML, />[?i✓✕]</);
    dialog.close('no');
    await result;
  }
});

test('shared button decoration uses text instead of injecting icons', () => {
  const source = fs.readFileSync('js/site-theme.js', 'utf8');
  assert.doesNotMatch(source, /createElement\('i'\)|control\.prepend\(icon\)/);
  assert.match(source, /button-text-fallback/);
  assert.match(source, /characterData: true/);
  assert.match(source, /control\.closest\('\.building-controls'\)/);
  assert.match(source, /control\.matches\('\.mobile-toggle-btn'\)/);
});
