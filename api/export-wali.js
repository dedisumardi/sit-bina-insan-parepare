const ExcelJS = require('exceljs');
const { isAdmin } = require('../lib/session');
const { database } = require('../lib/database');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Metode tidak didukung.' });
    if (!await isAdmin(req)) return res.status(401).json({ message: 'Silakan masuk sebagai admin.' });

    const result = await database().query('SELECT reg_number, data, created_at FROM sipintu_applicants ORDER BY created_at DESC');
    const parents = result.rows.map(row => ({
      ...row.data,
      regNumber: row.reg_number,
      createdAt: row.created_at
    }));

    if (!parents.length) return res.status(404).json({ message: 'Tidak ada data akun orang tua untuk diunduh.' });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Akun Orang Tua & Pembayaran', {
      views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
    });

    const columns = [
      { key: 'no', header: 'No.', width: 8 },
      { key: 'regNumber', header: 'ID / No. Registrasi', width: 22 },
      { key: 'namaWali', header: 'Nama Orang Tua / Wali', width: 28 },
      { key: 'waAyah', header: 'Nomor WhatsApp', width: 20 },
      { key: 'biaya', header: 'Biaya Formulir', width: 18 },
      { key: 'statusBayar', header: 'Status Pembayaran', width: 26 },
      { key: 'bukti', header: 'Bukti Transfer', width: 18 },
      { key: 'waktuDaftar', header: 'Waktu Daftar', width: 24 }
    ];

    sheet.columns = columns;

    parents.forEach((item, index) => {
      const isApproved = Boolean(
        item.statusBayar === 'approved' ||
        item.statusPembayaran === 'approved' ||
        (item.status && (item.status.includes('Lulus') || item.status.includes('Terverifikasi') || item.status.includes('Jadwal Ditetapkan') || item.status.includes('Lunas')))
      );
      const isPassed = Boolean(item.status && item.status.includes('Lulus'));
      const hasProof = Boolean(item.buktiPembayaran);

      let statusText = 'Menunggu Bayar';
      if (isPassed) statusText = 'Lulus & Lunas';
      else if (isApproved) statusText = 'Lunas & Disetujui';
      else if (hasProof) statusText = 'Bukti Diupload (Menunggu Approval)';

      let dateStr = item.tanggalDaftar;
      if (!dateStr && item.createdAt) {
        try {
          dateStr = new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        } catch (_) {
          dateStr = item.createdAt;
        }
      }

      const row = sheet.addRow({
        no: index + 1,
        regNumber: String(item.regNumber || '-'),
        namaWali: String(item.namaAyah || item.namaSiswa || 'Orang Tua / Wali'),
        waAyah: String(item.waAyah || '-'),
        biaya: 'Rp 150.000',
        statusBayar: statusText,
        bukti: hasProof ? 'Sudah Upload' : 'Belum Upload',
        waktuDaftar: String(dateStr || '-')
      });

      row.alignment = { vertical: 'middle' };
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    sheet.getRow(1).height = 36;
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123B76' } };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: columns.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="DATA_AKUN_WALI_SPMB_${new Date().toISOString().slice(0, 10)}.xlsx"`);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membuat file Excel Akun Wali.' });
  }
};
