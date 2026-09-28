const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('SMPIT sports and dance have separate cards and data entries', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync('js/data.js', 'utf8') + '\nthis.school = SchoolData;', context);
  const titles = context.school.levels.smpit.extracurriculars.map(item => item.title);
  const html = fs.readFileSync('index.html', 'utf8');
  const section = html.slice(html.indexOf('id="view-smpit"'), html.indexOf('id="view-berita"'));
  for (const name of ['Futsal', 'Bulu Tangkis', 'Basket', 'Renang', 'Tari']) {
    assert.equal(titles.filter(title => title === name).length, 1);
    assert.equal(section.split(`class="ekskul-card-title">${name}</h3>`).length - 1, 1);
  }
  assert.ok(!titles.includes('Olahraga & Seni'));
  assert.doesNotMatch(section, /Olahraga &amp; Seni/);
  assert.equal((section.match(/<div\b/g) || []).length, (section.match(/<\/div>/g) || []).length);
});
