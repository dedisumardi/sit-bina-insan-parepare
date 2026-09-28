(function (root) {
  'use strict';
  const series = [
    { key: 'tkit', label: 'TK', color: '#9333ea' },
    { key: 'sdit', label: 'SD', color: '#16a34a' },
    { key: 'smpit', label: 'SMP', color: '#2563eb' }
  ];
  const months = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  function dateYear(value) {
    const text = String(value || '').trim();
    let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\b|,)/);
    if (!match) {
      const named = text.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/);
      if (named && months.includes(named[2])) match = [named[0], named[1], months.indexOf(named[2]) + 1, named[3]];
    }
    if (match) {
      const [, day, month, year] = match.map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      return year >= 1900 && year <= 9999 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? year : null;
    }
    // ISO timestamps use the school's WITA timezone, including year boundaries.
    if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) return Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Makassar' }).format(date));
    }
    return null;
  }
  function aggregate(records) {
    const counts = new Map();
    let skipped = 0;
    for (const record of records) {
      const rawLevel = String(record.jenjang || '').trim().toLowerCase();
      const level = ({ tk: 'tkit', sd: 'sdit', smp: 'smpit' })[rawLevel] || rawLevel;
      const year = dateYear(record.tanggalDaftar) || dateYear(record.createdAt);
      if (!year || !series.some(s => s.key === level)) { skipped++; continue; }
      if (!counts.has(year)) counts.set(year, { year, tkit: 0, sdit: 0, smpit: 0 });
      counts.get(year)[level]++;
    }
    const years = [...counts.keys()].sort((a, b) => a - b);
    const rows = [];
    if (years.length) {
      for (let year = years[0]; year <= years[years.length - 1]; year++) {
        rows.push(counts.get(year) || { year, tkit: 0, sdit: 0, smpit: 0 });
      }
    }
    return { rows, skipped };
  }
  function render(container, records) {
    if (!container) return;
    const { rows, skipped } = aggregate(records);
    const note = skipped ? `<p style="color:#64748b;font-size:12px;margin-top:12px">${skipped} data tidak ditampilkan karena tanggal atau jenjang belum valid.</p>` : '';
    if (!rows.length) {
      container.innerHTML = '<p style="padding:40px 16px;text-align:center;color:#64748b">Belum ada data pendaftar per tahun untuk ditampilkan.</p>' + note;
      return;
    }
    const width = Math.max(640, rows.length * 130 + 80), height = 220;
    const left = 55, top = 25, bottom = 165, plotHeight = bottom - top;
    const max = Math.max(1, ...rows.flatMap(row => series.map(s => row[s.key])));
    const interval = Math.max(1, Math.ceil(max / 5));
    const ceiling = Math.ceil(max / interval) * interval;
    const groupWidth = (width - left - 20) / rows.length;
    const barWidth = Math.min(24, groupWidth / 5);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:100%;height:${height}px;min-width:${width}px;display:block;font-family:inherit" role="img" aria-label="Grafik batang jumlah pendaftar per tahun: TK ungu, SD hijau, SMP biru. Rincian tersedia di tabel di bawah.">`;
    for (let tick = 0; tick <= ceiling; tick += interval) {
      const y = bottom - tick / ceiling * plotHeight;
      svg += `<line x1="${left}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#e2e8f0"/><text x="${left - 12}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="12">${tick}</text>`;
    }
    rows.forEach((row, index) => {
      const center = left + groupWidth * (index + 0.5);
      series.forEach((s, offset) => {
        const value = row[s.key], barHeight = value / ceiling * plotHeight;
        const x = center + (offset - 1) * (barWidth + 8) - barWidth / 2;
        svg += `<rect x="${x}" y="${bottom - barHeight}" width="${barWidth}" height="${barHeight}" rx="4" fill="${s.color}"><title>${s.label}, ${row.year}: ${value} pendaftar</title></rect><text x="${x + barWidth / 2}" y="${bottom - barHeight - 8}" text-anchor="middle" fill="${s.color}" font-size="12" font-weight="700">${value}</text>`;
      });
      svg += `<text x="${center}" y="${bottom + 25}" text-anchor="middle" fill="#334155" font-size="13" font-weight="600">${row.year}</text>`;
    });
    svg += `<text x="${width / 2}" y="210" text-anchor="middle" fill="#64748b" font-size="12">Tahun Pendaftaran</text></svg>`;
    container.innerHTML = `<div style="overflow-x:auto" tabindex="0" aria-label="Grafik pendaftar, geser untuk melihat semua tahun">${svg}</div>${note}<details style="margin-top:12px;color:#475569;font-size:13px"><summary style="cursor:pointer">Lihat rincian angka per tahun</summary><div style="overflow-x:auto"><table style="width:100%;text-align:left;margin-top:12px;border-collapse:collapse"><caption style="text-align:left;margin-bottom:8px">Jumlah pendaftar siswa berdasarkan tanggal pendaftaran</caption><thead><tr>${['Tahun', 'TK', 'SD', 'SMP', 'Total'].map(label => `<th scope="col" style="padding:8px;border-bottom:1px solid #e2e8f0">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><th scope="row" style="padding:8px">${row.year}</th>${[row.tkit, row.sdit, row.smpit, row.tkit + row.sdit + row.smpit].map(value => `<td style="padding:8px">${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  }
  const chart = { aggregate, dateYear, series, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = chart;
  else root.RegistrationChart = chart;
})(globalThis);
