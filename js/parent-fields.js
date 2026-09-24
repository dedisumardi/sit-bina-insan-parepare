(function (root) {
  'use strict';
  const fields = [
    { key: 'statusHidup', label: 'Status Hidup', type: 'radio', options: ['Hidup', 'Wafat'] },
    { key: 'nama', label: 'Nama', type: 'text', maxLength: 150 },
    { key: 'nik', label: 'NIK', type: 'text', pattern: '[0-9]{16}', maxLength: 16 },
    { key: 'tahunLahir', label: 'Tahun Lahir', type: 'number', min: 1900 },
    { key: 'pendidikan', label: 'Pendidikan Terakhir', type: 'select', options: ['SD/MI/sederajat', 'SMP/MTs/sederajat', 'SMA/MA/SMK/sederajat', 'Diploma I (D1)', 'Diploma II (D2)', 'Diploma III (D3)', 'Diploma IV (D4)/Sarjana Terapan', 'Sarjana (S1)', 'Profesi', 'Magister (S2)', 'Spesialis', 'Doktor (S3)/PhD', 'Subspesialis'] },
    { key: 'pekerjaan', label: 'Pekerjaan', type: 'select', options: ['Tidak bekerja', 'Ibu rumah tangga', 'PNS/ASN', 'TNI', 'Polri', 'Karyawan BUMN/BUMD', 'Karyawan swasta', 'Wiraswasta', 'Pedagang', 'Petani/Pekebun', 'Peternak', 'Nelayan', 'Buruh', 'Guru/Dosen', 'Tenaga kesehatan', 'Pengemudi/Ojek', 'Pekerja lepas', 'Pensiunan', 'Lainnya'] },
    { key: 'penghasilan', label: 'Penghasilan per Bulan', type: 'select', options: ['Rp500.000 - Rp2.000.000', 'Rp2.000.000 - Rp5.000.000', '>Rp5.000.000'] },
    { key: 'telepon', label: 'Nomor WhatsApp/Telepon', type: 'tel', pattern: '[+]?[0-9 ()-]{8,25}', maxLength: 25 }
  ];
  const roles = ['Ayah', 'Ibu', 'Wali'];
  const keys = ['memilikiWali', ...roles.flatMap(role => fields.map(field => field.key + role))];
  function validate(data) {
    if (!['Ya', 'Tidak'].includes(data.memilikiWali)) return 'Pilih apakah memiliki wali: Ya atau Tidak.';
    for (const role of roles.filter(role => role !== 'Wali' || data.memilikiWali === 'Ya')) {
      for (const field of fields) {
        const value = data[field.key + role];
        if (typeof value !== 'string' || !value.trim() || value.trim() === '-') return `${field.label} ${role} wajib diisi.`;
        if (field.options && !field.options.includes(value)) return `${field.label} ${role} tidak valid.`;
        if (field.maxLength && value.length > field.maxLength) return `${field.label} ${role} terlalu panjang.`;
        if (field.key === 'nik' && !/^\d{16}$/.test(value)) return `NIK ${role} harus 16 digit.`;
        if (field.key === 'tahunLahir' && (!/^\d{4}$/.test(value) || Number(value) < 1900 || Number(value) > new Date().getFullYear())) return `Tahun lahir ${role} tidak valid.`;
        if (field.key === 'telepon' && (!/^[+\d ()-]+$/.test(value) || !/^\d{8,15}$/.test(value.replace(/\D/g, '')))) return `Nomor WhatsApp/telepon ${role} tidak valid.`;
      }
    }
    return '';
  }
  const schema = { fields, roles, keys, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = schema;
  else root.ParentFields = schema;
})(globalThis);
