(function (root) {
  'use strict';
  function build(school = {}, settings = {}) {
    const status = settings.waveStatus === 'open' && ['wave1', 'wave2', 'wave3'].includes(settings.activeWave)
      ? 'Pendaftaran dibuka. Anda dapat mendaftar pada gelombang yang aktif.'
      : settings.waveStatus === 'upcoming' ? 'Pendaftaran segera dibuka; pendaftaran baru belum tersedia.'
      : 'Pendaftaran ditutup sementara atau belum dibuka; pendaftaran baru belum tersedia.';
    const periods = [1, 2, 3].map(n => `${settings['wave' + n + 'Name'] || 'Gelombang ' + n}: ${settings['wave' + n + 'Dates'] || 'jadwal belum ditetapkan'}.`).join(' ');
    const faqs = [{
      q: 'Kapan periode pendaftaran SPMB SIT Bina Insan dibuka?',
      a: `${status} ${settings.academicYear ? 'Tahun pelajaran ' + settings.academicYear + '. ' : ''}${periods} Akun yang sudah terdaftar tetap dapat masuk ke portal untuk melihat progres pendaftaran.`
    }];
    faqs.push({ q: 'Bagaimana tahapan pendaftaran TKIT, SDIT, dan SMPIT?',
      a: 'Pendaftaran terdiri dari enam tahap: (1) pendaftaran akun dan pembayaran, (2) verifikasi pembayaran dan penerbitan nomor registrasi oleh admin, (3) pengisian biodata siswa serta orang tua/wali, (4) jadwal tes observasi dan wawancara, (5) pengumuman hasil seleksi, dan (6) daftar ulang dengan unggah Kartu Keluarga dan Akta Kelahiran. Daftar ulang hanya dapat dibuka setelah admin menyatakan siswa lulus dan diterima.' },
    { q: 'Jalur pendaftaran apa yang tersedia?',
      a: 'Formulir pendaftaran saat ini menggunakan jalur Reguler untuk TKIT, SDIT, dan SMPIT. Informasi beasiswa atau potongan biaya harus dikonfirmasi kepada panitia; jangan menganggapnya sebagai jalur pendaftaran tambahan.' },
    { q: 'Bagaimana melihat jadwal dan mencetak kartu peserta?',
      a: 'Masuk ke portal menggunakan nomor WhatsApp terdaftar. Setelah pembayaran disetujui, lengkapi dan simpan biodata siswa serta orang tua/wali. Buka langkah Jadwal Tes Observasi & Wawancara untuk melihat jadwal sesuai jenjang yang ditetapkan admin. Gunakan tombol cetak kartu peserta dan jadwal tes untuk mencetak satu lembar A4 atau menyimpannya sebagai PDF.' },
    { q: 'Bagaimana menghubungi panitia SPMB?',
      a: settings.whatsappHelpdesk ? `Hubungi helpdesk panitia melalui WhatsApp ${settings.whatsappHelpdesk} untuk memastikan persyaratan, jadwal, dan informasi pendaftaran terbaru.` : 'Nomor helpdesk belum ditetapkan. Pantau informasi kontak panitia pada halaman Info SPMB.' });
    return faqs;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { build };
  else root.SchoolFaqs = { build };
})(globalThis);
