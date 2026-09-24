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
    const schedule = {};
    for (const level of ['tkit', 'sdit', 'smpit']) {
      Object.assign(schedule, { [level + '_jadwalTes']: 'Sabtu | 08.00 WITA', [level + '_jadwalWawancara']: 'Sabtu | 10.00 WITA',
        [level + '_lokasiTes']: 'Ruang tes ' + level, [level + '_catatanJadwal']: 'Bawa kartu peserta' });
    }
    assert.equal((await request('spmb')).code, 401);
    assert.equal((await request('auth', 'POST', { username: 'test-admin', password: 'wrong' })).code, 401);
    const login = await request('auth', 'POST', { username: 'test-admin', password });
    assert.equal(login.code, 200);
    cookie = login.headers['Set-Cookie'].split(';')[0];
    assert.equal((await request('settings', 'PUT', schedule, {}, true)).code, 200);
    const savedSchedule = (await request('settings')).body.data;
    for (const [key, value] of Object.entries(schedule)) assert.equal(savedSchedule[key], value);
    assert.equal((await request('settings', 'PUT', { tkit_jadwalTes: '', tkit_jadwalWawancara: '' }, {}, true)).code, 200);
    assert.equal((await request('settings')).body.data.tkit_jadwalTes, '');
    assert.equal((await request('settings')).body.data.sdit_jadwalTes, schedule.sdit_jadwalTes);
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
    const extra = { alamatAsalSekolah: 'Jl. Sekolah No. 1', jalur: 'reguler', tempatTinggal: 'Bersama orang tua', modaTransportasi: 'Jalan kaki', anakKe: '1',
      tinggiBadan: '125.5', beratBadan: '25.5', hobi: 'Membaca', citaCita: 'Dokter',
      jarakRumahSekolah: 'Kurang dari 1 km', jumlahSaudaraKandung: '0', saudaraDiSekolah: 'Tidak' };
    const full = await request('spmb', 'POST', { ...extra, action: 'save_biodata', regNumber: approved.body.data.regNumber,
      namaAyah: 'Test Parent', asalSekolah: 'TK Pengujian', namaSiswa: 'Test Student', waAyah, nik: '1234567890123456', jenjang: 'sdit',
      jk: 'Laki-laki', tempatLahir: 'Parepare', tanggalLahir: '2018-05-12', alamat: 'Jl. Test',
      agama: 'Islam', kewarganegaraan: 'Indonesia', desaKelurahan: 'Bumi Harapan', kecamatan: 'Bacukiki Barat',
      kabupatenKota: 'Kota Parepare', provinsi: 'Sulawesi Selatan' });
    assert.equal(full.code, 200);
    for (const field of Object.keys(extra)) {
      for (const empty of ['', '   ', undefined]) {
        const incomplete = { ...full.body.data, action: 'save_biodata', [field]: empty };
        assert.equal((await request('spmb', 'POST', incomplete)).code, 400, field + ' must be required');
      }
    }
    const readBack = await request('spmb', 'GET', {}, { query: '1234567890123456' });
    for (const [key, value] of Object.entries(extra)) assert.equal(readBack.body.data[key], value);
    for (const invalidExtra of [{ anakKe: '0' }, { jumlahSaudaraKandung: '-1' }, { tinggiBadan: 'abc' }, { beratBadan: '-2' }, { modaTransportasi: 'Pesawat' }, { saudaraDiSekolah: 'Mungkin' }]) {
      assert.equal((await request('spmb', 'POST', { ...full.body.data, ...invalidExtra, action: 'save_biodata' })).code, 400);
    }
    assert.equal(full.body.data.asalSekolah, 'TK Pengujian');
    for (const asalSekolah of ['', '   ', '-']) {
      const invalid = await request('spmb', 'POST', { ...full.body.data, action: 'save_biodata', asalSekolah });
      assert.equal(invalid.code, 400);
      assert.equal(invalid.body.message, 'Asal sekolah wajib diisi.');
    }
    assert.equal(full.body.data.id, parent.body.data.id);
    assert.equal(full.body.data.status, 'Pembayaran Terverifikasi');
    assert.equal(full.body.data.buktiPembayaran, proof);
    assert.equal(full.body.data.regNumber, approved.body.data.regNumber);
    assert.equal(full.body.data.kecamatan, 'Bacukiki Barat');
    assert.equal((await request('spmb', 'GET', {}, { query: '1234567890123456' })).code, 200);
    assert.equal((await request('spmb', 'GET', {}, {}, true)).body.data.length, 1);
    const parentData = { action: 'save_parents', regNumber: full.body.data.regNumber, accountWa: waAyah, memilikiWali: 'Tidak' };
    for (const role of ['Ayah', 'Ibu', 'Wali']) {
      Object.assign(parentData, { ['statusHidup' + role]: 'Hidup', ['nama' + role]: 'Test ' + role,
        ['nik' + role]: '1234567890123456', ['tahunLahir' + role]: '1985', ['pendidikan' + role]: 'Sarjana (S1)',
        ['pekerjaan' + role]: 'Tidak bekerja', ['penghasilan' + role]: 'Tidak berpenghasilan', ['telepon' + role]: '081122334455' });
    }
    assert.equal((await request('spmb', 'POST', { ...parentData, regNumber: reg })).code, 403);
    assert.equal((await request('spmb', 'POST', { ...parentData, accountWa: '081999999999' })).code, 403);
    const withoutGuardian = await request('spmb', 'POST', parentData);
    assert.equal(withoutGuardian.code, 200);
    assert.equal(withoutGuardian.body.data.namaWali, '');
    assert.equal(withoutGuardian.body.data.waAyah, full.body.data.waAyah);
    assert.equal(withoutGuardian.body.data.buktiPembayaran, proof);
    assert.equal(withoutGuardian.body.data.nik, full.body.data.nik);
    const withGuardian = await request('spmb', 'POST', { ...parentData, memilikiWali: 'Ya' });
    assert.equal(withGuardian.code, 200);
    const parentsReadBack = await request('spmb', 'GET', {}, { wa: waAyah });
    assert.equal(parentsReadBack.body.data.namaWali, 'Test Wali');
    for (const role of ['Ayah', 'Ibu', 'Wali']) assert.equal(parentsReadBack.body.data['penghasilan' + role], 'Tidak berpenghasilan');
    assert.equal(parentsReadBack.body.data.teleponAyah, '081122334455');
    assert.equal((await request('spmb', 'POST', { ...parentData, memilikiWali: 'Ya', nikWali: '' })).code, 400);
    assert.equal((await request('spmb', 'POST', { ...parentData, nikAyah: '12' })).code, 400);
    assert.equal((await request('spmb', 'POST', { ...parentData, tahunLahirIbu: '2099' })).code, 400);
    assert.equal((await request('spmb', 'POST', { ...parentData, namaIbu: ' ' })).code, 400);
    const clearedGuardian = await request('spmb', 'POST', parentData);
    assert.equal(clearedGuardian.code, 200);
    assert.equal(clearedGuardian.body.data.nikWali, '');
    const scheduled = await request('spmb', 'PUT', {
      reg_number: full.body.data.regNumber,
      jadwalTes: '2026-10-15 08:00',
      jadwalWawancara: '2026-10-15 09:30',
      lokasiTes: 'Gedung SDIT Bina Insan - Ruang Aula Lantai 2',
      catatanJadwal: 'Membawa kartu peserta dan pensil 2B'
    }, {}, true);
    assert.equal(scheduled.code, 200);
    assert.equal(scheduled.body.data.jadwalTes, '2026-10-15 08:00');
    assert.equal(scheduled.body.data.jadwalWawancara, '2026-10-15 09:30');
    assert.equal(scheduled.body.data.lokasiTes, 'Gedung SDIT Bina Insan - Ruang Aula Lantai 2');
    assert.equal(scheduled.body.data.catatanJadwal, 'Membawa kartu peserta dan pensil 2B');
    const scheduleReadBack = await request('spmb', 'GET', {}, { query: full.body.data.regNumber });
    assert.equal(scheduleReadBack.body.data.jadwalTes, '2026-10-15 08:00');
    assert.equal(scheduleReadBack.body.data.jadwalWawancara, '2026-10-15 09:30');
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
