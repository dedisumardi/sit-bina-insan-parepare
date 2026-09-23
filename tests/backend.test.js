const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Client } = require('pg');

test('API persistence and authorization in an isolated temporary schema', { skip: !process.env.DATABASE_URL_UNPOOLED }, async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  const schema = 'sipintu_test_' + randomBytes(8).toString('hex');
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET search_path TO ${schema}`);
    await client.query(fs.readFileSync('migrations/001-postgres.sql', 'utf8'));
    require('../lib/database').database = () => ({
      query: (...args) => client.query(...args),
      connect: async () => ({ query: (...args) => client.query(...args), release() {} })
    });
    const { hashPassword } = require('../lib/session');
    const password = randomBytes(24).toString('hex');
    await client.query('INSERT INTO sipintu_admins VALUES($1,$2)', ['test-admin', hashPassword(password)]);
    await client.query('INSERT INTO sipintu_settings(id,data) VALUES(1,$1)', [require('../data_settings.json')]);
    const handler = require('../api/backend');
    let cookie = '';
    async function request(resource, method = 'GET', body = {}, query = {}, authenticated = false) {
      const headers = {};
      let code = 200, response;
      await handler({ method, url: '/api/backend', query: { resource, ...query }, body,
        headers: { host: 'test.local', origin: 'https://test.local', cookie: authenticated ? cookie : '' } }, {
        setHeader(k,v) { headers[k] = v; }, status(v) { code = v; return this; }, json(v) { response = v; }
      });
      return { code, body: response, headers };
    }
    assert.equal((await request('settings', 'PUT', { activeWave: 'wave3' })).code, 401);
    assert.equal((await request('spmb')).code, 401);
    assert.equal((await request('auth', 'POST', { username: 'test-admin', password: 'wrong' })).code, 401);
    const login = await request('auth', 'POST', { username: 'test-admin', password });
    assert.equal(login.code, 200);
    cookie = login.headers['Set-Cookie'].split(';')[0];
    assert.equal((await request('auth', 'GET', {}, {}, true)).code, 200);
    assert.equal((await request('settings', 'PUT', { activeWave: 'wave3', statTk: '199+' }, {}, true)).code, 200);
    assert.equal((await request('settings')).body.data.statTk, '199+');
    const article = await request('articles', 'POST', { title: 'Integration test', content: 'Test content' }, {}, true);
    assert.equal(article.code, 201);
    const id = article.body.data.id;
    assert.equal((await request('articles', 'PUT', { id, title: 'Updated test' }, {}, true)).code, 200);
    assert.equal((await request('articles', 'GET', {}, { id })).body.data.title, 'Updated test');
    assert.equal((await request('articles', 'DELETE', { id }, {}, true)).code, 200);
    const waAyah = '081234567890';
    const parent = await request('spmb', 'POST', { namaAyah: 'Test Parent', waAyah });
    assert.equal(parent.code, 201);
    const reg = parent.body.data.regNumber;
    assert.equal((await request('spmb', 'POST', { action: 'save_biodata', regNumber: reg, namaAyah: 'Test Parent',
      namaSiswa: 'Too Early', waAyah, nik: '1234567890123456', jenjang: 'sdit', jk: 'Laki-laki',
      tempatLahir: 'Parepare', tanggalLahir: '2018-05-12', namaIbu: 'Test Mother', alamat: 'Jl. Test',
      agama: 'Islam', kewarganegaraan: 'Indonesia', desaKelurahan: 'Bumi Harapan', kecamatan: 'Bacukiki Barat',
      kabupatenKota: 'Kota Parepare', provinsi: 'Sulawesi Selatan' })).code, 403);
    assert.equal((await request('spmb', 'PUT', { reg_number: reg, status: 'Lulus' })).code, 401);
    const proof = 'data:image/png;base64,aGVsbG8=';
    assert.equal((await request('spmb', 'PUT', { reg_number: reg, waAyah, buktiPembayaran: proof })).code, 200);
    const approved = await request('spmb', 'PUT', { reg_number: reg, new_reg_number: 'generate', status: 'Pembayaran Terverifikasi' }, {}, true);
    assert.equal(approved.code, 200);
    const full = await request('spmb', 'POST', { action: 'save_biodata', regNumber: approved.body.data.regNumber,
      namaAyah: 'Test Parent', namaIbu: 'Test Mother', namaSiswa: 'Test Student', waAyah, nik: '1234567890123456', jenjang: 'sdit',
      jk: 'Laki-laki', tempatLahir: 'Parepare', tanggalLahir: '2018-05-12', alamat: 'Jl. Test',
      agama: 'Islam', kewarganegaraan: 'Indonesia', desaKelurahan: 'Bumi Harapan', kecamatan: 'Bacukiki Barat',
      kabupatenKota: 'Kota Parepare', provinsi: 'Sulawesi Selatan' });
    assert.equal(full.code, 200);
    assert.equal(full.body.data.id, parent.body.data.id);
    assert.equal(full.body.data.status, 'Pembayaran Terverifikasi');
    assert.equal(full.body.data.buktiPembayaran, proof);
    assert.equal(full.body.data.regNumber, approved.body.data.regNumber);
    assert.equal(full.body.data.kecamatan, 'Bacukiki Barat');
    assert.equal((await request('spmb', 'GET', {}, { query: '1234567890123456' })).code, 200);
    assert.equal((await request('spmb', 'GET', {}, {}, true)).body.data.length, 1);
    assert.equal((await request('spmb', 'DELETE', { reg_number: full.body.data.regNumber }, {}, true)).code, 200);
    await request('auth', 'DELETE', {}, {}, true);
    assert.equal((await request('auth', 'GET', {}, {}, true)).code, 401);
  } finally {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await client.end();
  }
});
