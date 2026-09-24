const { isAdmin } = require('../lib/session');
const { database } = require('../lib/database');
const { studentWorkbook } = require('../lib/student-workbook');
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Metode tidak didukung.' });
    if (!await isAdmin(req)) return res.status(401).json({ message: 'Silakan masuk sebagai admin.' });
    const result = await database().query('SELECT reg_number, data FROM sipintu_applicants ORDER BY created_at DESC');
    const students = result.rows.map(row => ({ ...row.data, regNumber: row.reg_number })).filter(s => {
      if (!(s.regNumber || '').startsWith('PENDING-')) return true;
      return s.namaSiswa && s.namaSiswa !== '-' && !s.namaSiswa.toLowerCase().startsWith('calon siswa (') && s.nik && s.nik !== '-' && !/^wa-/i.test(s.nik);
    });
    if (!students.length) return res.status(404).json({ message: 'Tidak ada data siswa untuk diunduh.' });
    const buffer = await studentWorkbook(students);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DATA_SISWA_LENGKAP_SPMB.xlsx"');
    return res.status(200).send(Buffer.from(buffer));
  } catch (_) {
    return res.status(500).json({ message: 'Gagal membuat file Excel. Silakan coba kembali.' });
  }
};
