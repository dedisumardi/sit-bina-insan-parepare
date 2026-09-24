const ExcelJS = require('exceljs');
const { columns, value } = require('../js/student-export');
async function studentWorkbook(records) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data Siswa', { views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }] });
  sheet.columns = columns.map(([key, header]) => ({ key, header, width: /nama|alamat|pendidikan|pekerjaan/i.test(key) ? 30 : 24 }));
  for (const record of records) sheet.addRow(columns.map(([key]) => String(value(record, key))));
  sheet.getRow(1).height = 45;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123B76' } };
  sheet.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, sheet.rowCount), column: columns.length } };
  return workbook.xlsx.writeBuffer();
}
module.exports = { studentWorkbook };
