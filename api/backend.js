const { randomBytes, createHash } = require('node:crypto');
const { database } = require('../lib/database');
const { isAdmin, verifyPassword, createSession, logout } = require('../lib/session');
const parentFields = require('../js/parent-fields');

function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function phone(value) {
  let number = String(value || '').replace(/\D/g, '');
  if (number.startsWith('0')) number = '62' + number.slice(1);
  if (!/^\d{10,15}$/.test(number)) fail(400, 'Nomor WhatsApp tidak valid.');
  return number;
}
function pick(input, keys) {
  return Object.fromEntries(keys.filter(k => input[k] !== undefined).map(k => {
    if (typeof input[k] !== 'string') fail(400, `Data ${k} tidak valid.`);
    if (k === 'sertifikatPrestasi') {
      if (input[k] && (!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(input[k]) && !/^https?:\/\//.test(input[k]) && !/^\/?assets\//.test(input[k]) || input[k].length > 4000000)) {
        fail(400, 'Sertifikat harus berupa file gambar atau PDF maksimal 2,5 MB.');
      }
    } else if (input[k].length > 50000) {
      fail(400, `Data ${k} tidak valid.`);
    }
    return [k, input[k].trim()];
  }));
}
function row(record) {
  return { ...record.data, id: record.id, ...(record.reg_number ? { regNumber: record.reg_number } : {}), createdAt: record.created_at };
}
function requireAdmin(admin) { if (!admin) fail(401, 'Silakan masuk sebagai admin.'); }
const biodata = ['jenjang','jalur','namaSiswa','nik','ttl','tempatLahir','tanggalLahir','jk','asalSekolah','alamat','desaKelurahan','kecamatan','kabupatenKota','provinsi','agama','kewarganegaraan','namaAyah','pekerjaanAyah','waAyah','namaIbu','pekerjaanIbu','email','hafalan','prestasi','sertifikatPrestasi','gelombang','berkasKk','berkasAkta','daftarUlangAt'];
const articleFields = ['title','category','categoryClass','author','date','readTime','image','excerpt','content'];
const studentExtraFields = ["tempatTinggal","modaTransportasi","anakKe","tinggiBadan","beratBadan","hobi","citaCita","jumlahSaudaraKandung","jarakRumahSekolah","saudaraDiSekolah"];
biodata.push(...studentExtraFields);
biodata.push('alamatAsalSekolah');
function validateStudentExtras(data) {
  const choices = {"tempatTinggal":["Bersama orang tua","Wali","Lainnya"],"modaTransportasi":["Jalan kaki","Angkutan umum","Ojek","Sepeda","Motor pribadi","Mobil pribadi","Lainnya"],"jarakRumahSekolah":["Kurang dari 1 km","Lebih dari 1 km"],"saudaraDiSekolah":["Ya","Tidak"]};
  for (const [field, allowed] of Object.entries(choices)) {
    if (data[field] && !allowed.includes(data[field])) fail(400, 'Pilihan ' + field + ' tidak valid.');
  }
  for (const [field, min, integer] of [['anakKe', 1, true], ['jumlahSaudaraKandung', 0, true], ['tinggiBadan', 1, false], ['beratBadan', 1, false]]) {
    if (data[field] === undefined || data[field] === '') continue;
    const value = Number(data[field]);
    if (!/^\d+(\.\d+)?$/.test(data[field]) || !Number.isFinite(value) || value < min || (integer && !Number.isInteger(value))) {
      fail(400, 'Nilai ' + field + ' tidak valid.');
    }
  }
  for (const field of ['hobi', 'citaCita', 'hafalan', 'prestasi']) {
    if (data[field]?.length > 500) fail(400, 'Isian ' + field + ' maksimal 500 karakter.');
  }
}
const settingFields = Object.keys(require('../data_settings.json'));
for (const level of ['tkit', 'sdit', 'smpit']) {
  for (const field of ['jadwalTes', 'jadwalWawancara', 'lokasiTes', 'catatanJadwal']) settingFields.push(level + '_' + field);
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (data, message = '', status = 200) => res.status(status).json({ success: true, data, message, time: new Date().toISOString() });
  try {
    const url = new URL(req.url, 'https://localhost');
    const resource = req.query?.resource || url.searchParams.get('resource');
    const method = req.method;
    if (!['GET','POST','PUT','DELETE'].includes(method)) fail(405, 'Metode tidak didukung.');
    if (req.headers.origin && !['GET'].includes(method)) {
      if (new URL(req.headers.origin).host !== req.headers.host) fail(403, 'Asal permintaan tidak diizinkan.');
    }
    let input = req.body || {};
    if (typeof input === 'string') {
      try { input = JSON.parse(input); } catch { fail(400, 'JSON tidak valid.'); }
    }
    if (!input || Array.isArray(input) || typeof input !== 'object') fail(400, 'Data tidak valid.');
    const q = key => req.query?.[key] || url.searchParams.get(key);
    const admin = await isAdmin(req);
    if (resource === 'auth') {
      if (method === 'GET') { requireAdmin(admin); return send({ username: 'admin' }); }
      if (method === 'DELETE') { await logout(req, res); return send(null, 'Berhasil keluar.'); }
      if (method !== 'POST') fail(405, 'Metode tidak didukung.');
      if (typeof input.username !== 'string' || typeof input.password !== 'string' || input.password.length > 256) fail(400, 'Username dan password wajib diisi.');
      const db = database();
      const key = createHash('sha256').update(String(req.headers['x-forwarded-for'] || 'unknown') + ':' + input.username).digest('hex');
      const limit = await db.query(`INSERT INTO sipintu_login_attempts(key) VALUES($1)
        ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN sipintu_login_attempts.started_at<now()-interval '15 minutes' THEN 1 ELSE sipintu_login_attempts.attempts+1 END,
        started_at=CASE WHEN sipintu_login_attempts.started_at<now()-interval '15 minutes' THEN now() ELSE sipintu_login_attempts.started_at END RETURNING attempts`, [key]);
      if (limit.rows[0].attempts > 10) fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
      const result = await db.query('SELECT password_hash FROM sipintu_admins WHERE username=$1', [input.username.trim()]);
      if (!result.rowCount || !verifyPassword(input.password, result.rows[0].password_hash)) fail(401, 'Username atau password salah.');
      await createSession(res);
      await db.query('DELETE FROM sipintu_login_attempts WHERE key=$1', [key]);
      return send({ username: input.username, nama: 'Panitia SPMB' }, 'Login berhasil.');
    }
    if (resource === 'settings') {
      if (method !== 'GET') requireAdmin(admin);
      const db = database();
      if (method === 'POST' || method === 'PUT') {
        const data = pick(input, settingFields);
        if (!Object.keys(data).length) fail(400, 'Pengaturan kosong.');
        if (data.activeWave && !['wave1','wave2','wave3','closed'].includes(data.activeWave)) fail(400, 'Gelombang tidak valid.');
        await db.query('UPDATE sipintu_settings SET data=data || $1::jsonb, updated_at=now() WHERE id=1', [JSON.stringify(data)]);
      } else if (method !== 'GET') fail(405, 'Metode tidak didukung.');
      const result = await db.query('SELECT data FROM sipintu_settings WHERE id=1');
      if (!result.rowCount) fail(503, 'Database belum diinisialisasi.');
      const { articlesInitialized, ...data } = result.rows[0].data;
      return send(data, 'Pengaturan tersimpan.');
    }
    if (resource === 'articles') {
      if (method !== 'GET') requireAdmin(admin);
      const db = database();
      const id = Number(q('id') || input.id);
      if (method === 'GET') {
        if (q('id')) {
          const result = await db.query('SELECT * FROM sipintu_articles WHERE id=$1', [id]);
          if (!result.rowCount) fail(404, 'Artikel tidak ditemukan.');
          return send(row(result.rows[0]));
        }
        const result = await db.query("SELECT * FROM sipintu_articles WHERE ($1::text IS NULL OR data->>'category'=$1) ORDER BY id DESC LIMIT $2", [q('category') && q('category') !== 'Semua' ? q('category') : null, Math.min(Math.max(Number(q('limit')) || 1000, 1), 1000)]);
        return send(result.rows.map(row));
      }
      if (method === 'DELETE') {
        const result = await db.query('DELETE FROM sipintu_articles WHERE id=$1 RETURNING id', [id]);
        if (!result.rowCount) fail(404, 'Artikel tidak ditemukan.');
        return send({ id });
      }
      const data = pick(input, articleFields);
      if (!data.title) fail(400, 'Judul wajib diisi.');
      const result = method === 'POST'
        ? await db.query('INSERT INTO sipintu_articles(data) VALUES($1) RETURNING *', [data])
        : await db.query('UPDATE sipintu_articles SET data=data || $1::jsonb WHERE id=$2 RETURNING *', [JSON.stringify(data), id]);
      if (!result.rowCount) fail(404, 'Artikel tidak ditemukan.');
      return send(row(result.rows[0]), 'Artikel tersimpan.', method === 'POST' ? 201 : 200);
    }
    if (resource === 'spmb') {
      if (method === 'GET') {
        // Preserve the existing parent lookup workflow; bulk access is admin-only.
        const search = q('wa') || q('query') || q('check') || q('reg_number');
        if (!search) requireAdmin(admin);
        const db = database();
        if (search) {
          const digits = String(search).replace(/\D/g, '');
          const normalized = /^\+?[\d\s-]+$/.test(search) && digits.length >= 10 && digits.length <= 15 ? phone(search) : search;
          const result = await db.query('SELECT * FROM sipintu_applicants WHERE reg_number=$1 OR nik=$1 OR wa=$2 ORDER BY id DESC LIMIT 1', [search, normalized]);
          if (!result.rowCount) fail(404, 'Pendaftaran tidak ditemukan.');
          return send(row(result.rows[0]));
        }
        const result = await db.query('SELECT * FROM sipintu_applicants ORDER BY id DESC');
        return send(result.rows.map(row));
      }
      if (method === 'DELETE') {
        requireAdmin(admin);
        const reg = q('reg_number') || input.regNumber || input.reg_number;
        const result = await database().query('DELETE FROM sipintu_applicants WHERE reg_number=$1 RETURNING id', [reg]);
        if (!result.rowCount) fail(404, 'Pendaftaran tidak ditemukan.');
        return send({ regNumber: reg });
      }
      if (method === 'POST') {
        if (input.action === 'save_parents') {
          const reg = String(input.regNumber || '').trim();
          if (!reg || reg.startsWith('PENDING-')) fail(403, 'Lengkapi biodata siswa setelah pembayaran disetujui.');
          const accountWa = phone(input.accountWa);
          const parents = pick(input, parentFields.keys);
          const error = parentFields.validate(parents);
          if (error) fail(400, error);
          if (parents.memilikiWali === 'Tidak') {
            for (const field of parentFields.fields) parents[field.key + 'Wali'] = '';
          }
          parents.parentDataUpdatedAt = new Date().toISOString();
          const result = await database().query(`UPDATE sipintu_applicants SET data=data || $1::jsonb
            WHERE reg_number=$2 AND wa=$3 AND reg_number NOT LIKE 'PENDING-%'
            AND data->>'biodataUpdatedAt' IS NOT NULL RETURNING *`, [JSON.stringify(parents), reg, accountWa]);
          if (!result.rowCount) fail(403, 'Simpan biodata siswa terlebih dahulu atau periksa akun pendaftaran.');
          return send(row(result.rows[0]), 'Data orang tua dan wali tersimpan.');
        }
        const data = pick(input, biodata);
        validateStudentExtras(data);
        const wa = phone(data.waAyah || input.wa_ayah || input.noWhatsapp);
        data.waAyah = wa;
        data.namaAyah ||= String(input.namaOrangTua || '').trim();
        if (!data.namaAyah && !data.namaSiswa) fail(400, 'Nama wajib diisi.');
        if (!['tkit','sdit','smpit'].includes(data.jenjang || 'sdit')) fail(400, 'Jenjang tidak valid.');
        if (input.action === 'save_biodata') {
          const reg = String(input.regNumber || input.reg_number || '').trim();
          if (!reg || reg.startsWith('PENDING-')) fail(403, 'Biodata dapat diisi setelah pembayaran disetujui admin.');
          if (!/^\d{16}$/.test(data.nik || '')) fail(400, 'NIK siswa harus terdiri dari 16 digit angka.');
          if (!data.asalSekolah || data.asalSekolah === '-') fail(400, 'Asal sekolah wajib diisi.');
          if (!data.alamatAsalSekolah || data.alamatAsalSekolah === '-' || data.alamatAsalSekolah.length > 1000) fail(400, 'Alamat asal sekolah wajib diisi, maksimal 1000 karakter.');
          if (!data.jenjang || data.jalur !== 'reguler' || studentExtraFields.some(field => !data[field])) {
            fail(400, 'Seluruh isian biodata wajib dilengkapi.');
          }
          if (!data.namaSiswa || !data.tempatLahir || !/^\d{4}-\d{2}-\d{2}$/.test(data.tanggalLahir || '') ||
              !data.agama || !data.kewarganegaraan || !data.alamat || !data.desaKelurahan ||
              !data.kecamatan || !data.kabupatenKota || !data.provinsi) fail(400, 'Lengkapi seluruh data wajib siswa.');
          if (!['Laki-laki','Perempuan'].includes(data.jk || '')) fail(400, 'Jenis kelamin tidak valid.');
          data.ttl = `${data.tempatLahir}, ${data.tanggalLahir}`;
          data.biodataUpdatedAt = new Date().toISOString();
          const result = await database().query(`UPDATE sipintu_applicants SET nik=$1, data=data || $2::jsonb
            WHERE reg_number=$3 AND wa=$4 AND reg_number NOT LIKE 'PENDING-%' RETURNING *`, [data.nik, JSON.stringify(data), reg, wa]);
          if (!result.rowCount) fail(404, 'Pendaftaran resmi tidak ditemukan.');
          return send(row(result.rows[0]), 'Biodata siswa tersimpan.');
        }
        const complete = /^\d{16}$/.test(data.nik || '');
        const nik = complete ? data.nik : `WA-${wa}`;
        const initial = { ...data, nik, jenjang: data.jenjang || 'sdit', namaSiswa: data.namaSiswa || `Calon Siswa (${data.namaAyah})`, status: 'Menunggu Pembayaran Uang Pendaftaran (Rp 150.000)', nominalPembayaran: 150000, jadwalObservasi: 'Menunggu verifikasi pembayaran', tanggalDaftar: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }) + ' WITA' };
        const reg = 'PENDING-' + randomBytes(8).toString('hex').toUpperCase();
        const db = database();
        const client = await db.connect();
        let result;
        try {
          await client.query('BEGIN');
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [wa]);
          // Promote the parent's preliminary row, keeping its payment and admin decisions.
          if (complete) {
            result = await client.query(`UPDATE sipintu_applicants SET nik=$1, data=data || $2::jsonb
              WHERE wa=$3 AND nik=$4 RETURNING *`, [nik, JSON.stringify(data), wa, `WA-${wa}`]);
          }
          if (!result?.rowCount) result = await client.query(`INSERT INTO sipintu_applicants(reg_number,wa,nik,data) VALUES($1,$2,$3,$4)
          ON CONFLICT(nik) DO UPDATE SET data=sipintu_applicants.data || $5::jsonb
          WHERE sipintu_applicants.wa=EXCLUDED.wa RETURNING *`, [reg, wa, nik, initial, JSON.stringify(complete ? data : { namaAyah: data.namaAyah })]);
          await client.query('COMMIT');
        } catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
        if (!result.rowCount) fail(409, 'NIK sudah terdaftar dengan nomor WhatsApp lain.');
        return send(row(result.rows[0]), 'Pendaftaran tersimpan.', 201);
      }
      if (method === 'PUT') {
        const proof = input.buktiPembayaran ?? input.bukti_pembayaran;
        const berkasKk = input.berkasKk ?? input.berkas_kk;
        const berkasAkta = input.berkasAkta ?? input.berkas_akta;
        if (!admin && proof === undefined && berkasKk === undefined && berkasAkta === undefined) requireAdmin(admin);
        if (proof !== undefined && (typeof proof !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(proof) || proof.length > 3500000)) fail(400, 'Bukti harus JPG, PNG, atau WebP maksimal 2,5 MB.');
        if (berkasKk !== undefined && (typeof berkasKk !== 'string' || (!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(berkasKk) && !/^https?:\/\//.test(berkasKk)) || berkasKk.length > 4000000)) fail(400, 'Berkas Kartu Keluarga (KK) harus berupa gambar atau PDF maksimal 2,5 MB.');
        if (berkasAkta !== undefined && (typeof berkasAkta !== 'string' || (!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(berkasAkta) && !/^https?:\/\//.test(berkasAkta)) || berkasAkta.length > 4000000)) fail(400, 'Berkas Akta Kelahiran harus berupa gambar atau PDF maksimal 2,5 MB.');
        const reg = input.regNumber || input.reg_number;
        const wa = input.waAyah || input.wa_ayah;
        if (!reg && !wa) fail(400, 'Nomor pendaftaran wajib diisi.');
        if (!admin && !wa) fail(401, 'Nomor WhatsApp pendaftar wajib diisi.');
        const db = database();
        const patch = {};
        if (proof !== undefined) Object.assign(patch, { buktiPembayaran: proof, status: 'Menunggu Verifikasi Pembayaran oleh Admin' });
        if (berkasKk !== undefined) patch.berkasKk = berkasKk;
        if (berkasAkta !== undefined) patch.berkasAkta = berkasAkta;
        if (input.daftarUlangAt !== undefined || input.daftar_ulang_at !== undefined) {
          patch.daftarUlangAt = input.daftarUlangAt || input.daftar_ulang_at;
        } else if (berkasKk !== undefined || berkasAkta !== undefined) {
          patch.daftarUlangAt = new Date().toISOString();
        }
        if (admin) {
          Object.assign(patch, pick(input, ['status']));
          for (const key of ['jadwalObservasi', 'jadwalTes', 'jadwalWawancara', 'lokasiTes', 'catatanJadwal']) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            const val = input[key] ?? input[snakeKey];
            if (val !== undefined) patch[key] = String(val).slice(0, 1000);
          }
          if (input.nominalPembayaran !== undefined || input.nominal_pembayaran !== undefined) {
            const amount = Number(input.nominalPembayaran ?? input.nominal_pembayaran);
            if (!Number.isSafeInteger(amount) || amount < 0) fail(400, 'Nominal tidak valid.');
            patch.nominalPembayaran = amount;
          }

          // Admin can edit student & parent/guardian data
          const studentEditFields = [
            'jenjang', 'jalur', 'namaSiswa', 'nik', 'tempatLahir', 'tanggalLahir', 'ttl', 'jk',
            'asalSekolah', 'alamatAsalSekolah', 'agama', 'kewarganegaraan', 'alamat',
            'desaKelurahan', 'kecamatan', 'kabupatenKota', 'provinsi',
            'tempatTinggal', 'modaTransportasi', 'anakKe', 'tinggiBadan', 'beratBadan',
            'hobi', 'citaCita', 'jumlahSaudaraKandung', 'jarakRumahSekolah', 'saudaraDiSekolah',
            'hafalan', 'prestasi'
          ];
          for (const key of studentEditFields) {
            if (input[key] !== undefined) {
              patch[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
            }
          }
          if (patch.tempatLahir && patch.tanggalLahir) {
            patch.ttl = `${patch.tempatLahir}, ${patch.tanggalLahir}`;
          }

          const parentEditKeys = [
            'memilikiWali',
            ...parentFields.keys,
            'namaAyah', 'nikAyah', 'statusHidupAyah', 'tahunLahirAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah', 'teleponAyah', 'waAyah',
            'namaIbu', 'nikIbu', 'statusHidupIbu', 'tahunLahirIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu', 'teleponIbu',
            'namaWali', 'nikWali', 'statusHidupWali', 'tahunLahirWali', 'pendidikanWali', 'pekerjaanWali', 'penghasilanWali', 'teleponWali'
          ];
          for (const key of parentEditKeys) {
            if (input[key] !== undefined) {
              patch[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
            }
          }
          if (patch.namaAyah && !patch.teleponAyah && patch.waAyah) patch.teleponAyah = patch.waAyah;
          if (patch.teleponAyah && !patch.waAyah) patch.waAyah = patch.teleponAyah;
        }
        const approval = admin && (input.newRegNumber || input.new_reg_number);
        const result = await db.query(`UPDATE sipintu_applicants SET data=
          CASE 
            WHEN (data->>'status' ILIKE '%lulus%' OR data->>'status' ILIKE '%diterima%') 
                 AND ($1::jsonb->>'status' ILIKE '%terverifikasi%')
            THEN (data || ($1::jsonb - 'status'))
            ELSE (data || $1::jsonb)
          END,
          nik=CASE WHEN $5::text IS NOT NULL THEN $5::text ELSE nik END,
          reg_number=CASE WHEN $2::boolean AND reg_number LIKE 'PENDING-%' THEN 'SPMB-' || to_char(now(),'YYYY') || '-' || lpad(id::text,6,'0') ELSE reg_number END
          WHERE id=(SELECT id FROM sipintu_applicants WHERE ($3::text IS NULL OR reg_number=$3) AND ($4::text IS NULL OR wa=$4) ORDER BY id DESC LIMIT 1) RETURNING *`, [JSON.stringify(patch), Boolean(approval), reg || null, wa ? phone(wa) : null, (admin && patch.nik && /^\d{16}$/.test(patch.nik)) ? patch.nik : null]);
        if (!result.rowCount) fail(404, 'Pendaftaran tidak ditemukan.');
        return send(row(result.rows[0]), 'Data tersimpan.');
      }
    }
    fail(404, 'Endpoint tidak ditemukan.');
  } catch (error) {
    const status = error.status || (error.code === '23505' ? 409 : 500);
    if (status === 500) console.error('API failure:', error.code || error.name);
    return res.status(status).json({ success: false, data: null, message: error.status ? error.message : 'Permintaan gagal diproses. Silakan coba kembali.' });
  }
}
module.exports = handler;
module.exports.phone = phone;
