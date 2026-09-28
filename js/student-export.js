(function (root) {
  'use strict';
  const parents = typeof module !== 'undefined' && module.exports ? require('./parent-fields') : root.ParentFields;
  const columns = [["regNumber","No. Registrasi"],["jenjang","Jenjang Pendidikan"],["jalur","Jalur Pendaftaran"],["namaSiswa","Nama Lengkap Siswa"],["jk","Jenis Kelamin"],["nik","NIK Siswa"],["tempatLahir","Tempat Lahir"],["tanggalLahir","Tanggal Lahir"],["asalSekolah","Asal Sekolah"],["agama","Agama"],["kewarganegaraan","Kewarganegaraan"],["alamat","Alamat Lengkap"],["provinsi","Provinsi"],["kabupatenKota","Kabupaten/Kota"],["kecamatan","Kecamatan"],["desaKelurahan","Desa/Kelurahan"],["tempatTinggal","Tempat Tinggal"],["modaTransportasi","Moda Transportasi"],["anakKe","Anak ke Berapa"],["tinggiBadan","Tinggi Badan (cm)"],["beratBadan","Berat Badan (kg)"],["hobi","Hobi"],["citaCita","Cita-cita"],["jarakRumahSekolah","Jarak Rumah ke Sekolah"],["jumlahSaudaraKandung","Jumlah Saudara Kandung"],["saudaraDiSekolah","Saudara Kandung di SIT Bina Insan Parepare"]];
  // Export biodata only; registration identifiers belong to administration.
  columns.splice(columns.findIndex(([key]) => key === 'regNumber'), 1);
  columns.splice(columns.findIndex(([key]) => key === 'asalSekolah') + 1, 0, ['alamatAsalSekolah', 'Alamat Asal Sekolah']);
  columns.push(['hafalan', 'Hafalan Quran'], ['prestasi', 'Prestasi']);
  for (const role of parents.roles) {
    if (role === 'Wali') columns.push(['memilikiWali', 'Memiliki Wali']);
    for (const field of parents.fields) columns.push([field.key + role, field.label + ' ' + role]);
  }
  function cell(value, key = '') {
    let text = String(value ?? '');
    // Excel must not round 16-digit NIKs, drop leading phone zeros, or execute formulas.
    if (text && (/^(nik|telepon|waAyah)/.test(key) || /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function value(record, key) {
    if (key.endsWith('Wali') && key !== 'memilikiWali' && record.memilikiWali === 'Tidak') return '';
    return record[key] ?? '';
  }
  function csv(records) {
    return '\uFEFF' + [columns.map(([, label]) => cell(label)).join(','),
      ...records.map(record => columns.map(([key]) => cell(value(record, key), key)).join(','))].join('\r\n');
  }
  const exporter = { columns, csv, value };
  if (typeof module !== 'undefined' && module.exports) module.exports = exporter;
  else root.StudentExport = exporter;
})(globalThis);
