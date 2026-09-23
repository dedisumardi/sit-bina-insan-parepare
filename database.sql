-- =========================================================================
-- DATABASE SCHEMA: SIT BINA INSAN PAREPARE
-- Sistem Penerimaan Murid Baru (SPMB) & Content Management System (CMS)
-- Website Resmi: sitbinainsanparepare.sch.id
-- =========================================================================

-- Set karakter & zona waktu
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+08:00"; -- WITA (Sulawesi Selatan)

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- -------------------------------------------------------------------------
-- 1. TABEL: spmb_applicants (Data Formulir Pendaftaran Siswa Baru)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `spmb_applicants` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `reg_number` VARCHAR(50) NOT NULL,
  `jenjang` ENUM('tkit','sdit','smpit') NOT NULL,
  `jalur` VARCHAR(50) NOT NULL DEFAULT 'reguler',
  `nama_siswa` VARCHAR(150) NOT NULL,
  `nik` VARCHAR(20) NOT NULL,
  `ttl` VARCHAR(100) NOT NULL,
  `jk` VARCHAR(20) NOT NULL,
  `asal_sekolah` VARCHAR(150) NOT NULL,
  `alamat` TEXT NOT NULL,
  `nama_ayah` VARCHAR(150) NOT NULL,
  `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL,
  `wa_ayah` VARCHAR(30) NOT NULL,
  `nama_ibu` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `hafalan` TEXT DEFAULT NULL,
  `prestasi` TEXT DEFAULT NULL,
  `tanggal_daftar` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(100) NOT NULL DEFAULT 'Menunggu Konfirmasi Pembayaran',
  `nominal_pembayaran` INT NULL DEFAULT 150000,
  `bukti_pembayaran` LONGTEXT NULL,
  `jadwal_observasi` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reg_number` (`reg_number`),
  KEY `idx_nik` (`nik`),
  KEY `idx_jenjang` (`jenjang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. TABEL: articles (Berita & Artikel Sekolah)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `articles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `category_class` VARCHAR(50) NOT NULL DEFAULT 'badge-kegiatan',
  `author` VARCHAR(100) NOT NULL DEFAULT 'Humas SIT Bina Insan',
  `publish_date` VARCHAR(50) NOT NULL,
  `read_time` VARCHAR(30) DEFAULT '3 menit baca',
  `image` VARCHAR(255) NOT NULL DEFAULT 'assets/images/hero_school.jpg',
  `excerpt` TEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. TABEL: school_settings (Konfigurasi Sistem SPMB & Sekolah)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `school_settings` (
  `setting_key` VARCHAR(50) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. TABEL: admin_users (Akun Pengelola Administrator)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama` VARCHAR(100) NOT NULL DEFAULT 'Panitia SPMB',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- DATA AWAL / SEED DATA
-- =========================================================================

-- Data Contoh Pendaftar SPMB
INSERT INTO `spmb_applicants` (`id`, `reg_number`, `jenjang`, `jalur`, `nama_siswa`, `nik`, `ttl`, `jk`, `asal_sekolah`, `alamat`, `nama_ayah`, `pekerjaan_ayah`, `wa_ayah`, `nama_ibu`, `email`, `hafalan`, `prestasi`, `tanggal_daftar`, `status`, `jadwal_observasi`) VALUES
(1, 'SPMB-2025-SD001', 'sdit', 'reguler', 'Ahmad Rayhan Al-Fatih', '7372011205180001', 'Parepare, 12 Mei 2018', 'Laki-laki', 'TKIT Bina Insan Parepare', 'Jl. Bau Massepe No. 45, Bacukiki Barat, Parepare', 'dr. H. Hendra Saputra, Sp.A', 'Dokter Spesialis Anak', '081234567891', 'dr. Hj. Salmawati, Sp.Rad', 'hendra.saputra@gmail.com', 'Juz 30 (Lancar/Mutqin) dan An-Naba s/d Al-Infitar', 'Juara 1 Lomba Tahfizh Cilik Tingkat Kecamatan 2024', '12 Januari 2025, 09:30 WITA', 'Terverifikasi (Jadwal Observasi Ditentukan)', 'Sabtu, 22 Februari 2025 | Pukul 08.30 WITA | Gedung Utama SDIT'),
(2, 'SPMB-2025-TK002', 'tkit', 'reguler', 'Khansa Naura Az-Zahra', '7372016508200002', 'Parepare, 15 Agustus 2020', 'Perempuan', 'PAUD Melati Parepare', 'Jl. Jenderal Sudirman No. 12, Soreang, Parepare', 'Fadli Rahman, S.T', 'PNS', '081342112233', 'St. Aisyah, S.Pd', 'fadli.rahman@gmail.com', 'Surat Al-Fatihah, Al-Ikhlas, An-Nas, Al-Falaq', '-', '14 Januari 2025, 14:15 WITA', 'Menunggu Konfirmasi Pembayaran', 'Sabtu, 15 Maret 2025 | Pukul 09.00 WITA | Gedung TKIT')
ON DUPLICATE KEY UPDATE `reg_number`=VALUES(`reg_number`);

-- Data Berita & Artikel Awal
INSERT INTO `articles` (`id`, `title`, `category`, `category_class`, `author`, `publish_date`, `read_time`, `image`, `excerpt`, `content`) VALUES
(1, 'Penerimaan Murid Baru (SPMB) TP. 2025/2026 Gelombang 1 Resmi Dibuka', 'Info SPMB', 'badge-spmb', 'Panitia SPMB', '15 Januari 2025', '3 menit baca', 'assets/images/hero_school.jpg', 'SIT Bina Insan Parepare membuka kesempatan bagi putra-putri terbaik untuk bergabung di jenjang TKIT, SDIT, dan SMPIT dengan kuota terbatas.', '<p>Alhamdulillah, pendaftaran peserta didik baru (SPMB) SIT Bina Insan Parepare untuk Tahun Pelajaran 2025/2026 resmi dibuka. Kami membuka pendaftaran untuk tiga jenjang pendidikan terpadu: TKIT, SDIT, dan SMPIT.</p><p>Pada Gelombang 1 (Early Bird) ini, calon murid berkesempatan mendapatkan potongan infaq sarana pendidikan khusus serta prioritas pemilihan jadwal observasi dan pemetaan potensi siswa.</p><p>Pendaftaran dapat dilakukan secara mandiri melalui website resmi ini dengan mengisi formulir online 5 langkah, kemudian mengunduh Kartu Tanda Peserta untuk dibawa saat observasi berlangsung.</p>'),
(2, 'Siswa SDIT Bina Insan Raih Juara 1 Olimpiade Sains & Koding Cilik se-Ajatappareng', 'Prestasi', 'badge-prestasi', 'Humas SIT', '10 Januari 2025', '2 menit baca', 'assets/images/sdit_recitation.jpg', 'Prestasi membanggakan kembali diukir oleh ananda Muhammad Ziyad dari kelas 5 SDIT dalam ajang kompetisi sains dan logika koding usia dasar.', '<p>Prestasi membanggakan kembali ditorehkan oleh siswa SDIT Bina Insan Parepare dalam ajang Kompetisi Sains & Algoritma Cilik Tingkat Wilayah Ajatappareng tahun 2025.</p><p>Ananda Muhammad Ziyad berhasil menyabet Juara 1 setelah berhasil menyelesaikan proyek sains terapan dan pemrograman berbasis blok interaktif. Keberhasilan ini membuktikan bahwa pendidikan terpadu di SIT Bina Insan tidak hanya unggul dalam hafalan Al-Qur\'an dan akhlak, namun juga berdaya saing tinggi dalam sains dan teknologi modern.</p>'),
(3, 'Wisuda Tahfizh Al-Qur\'an Angkatan IX: Lahirkan 45 Penghafal Qur\'an Mutqin', 'Kegiatan Sekolah', 'badge-kegiatan', 'Tim Tahfizh', '5 Januari 2025', '4 menit baca', 'assets/images/smpit_students.jpg', 'Yayasan Bina Insan Parepare menggelar Wisuda Tahfizh Akbar dengan kelulusan siswa kategori 3 Juz, 5 Juz, hingga 10 Juz Mutqin.', '<p>Sebanyak 45 siswa dari jenjang SDIT dan SMPIT Bina Insan Parepare mengikuti prosesi Wisuda Tahfizh Akbar Angkatan IX yang diselenggarakan di Aula Utama Sekolah SIT Bina Insan Parepare.</p><p>Prosesi wisuda diawali dengan uji tasmi\' hafalan Al-Qur\'an secara terbuka di hadapan para orang tua murid dan dewan asatidz. Air mata haru dan syukur mewarnai penyematan mahkota kemuliaan oleh para siswa kepada kedua orang tua mereka.</p>')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- Data Konfigurasi Sekolah Awal
INSERT INTO `school_settings` (`setting_key`, `setting_value`) VALUES
('academicYear', '2025/2026'),
('activeWave', 'Gelombang 1 (Early Bird)'),
('tkitFee', 'Rp 200.000'),
('sditFee', 'Rp 250.000'),
('smpitFee', 'Rp 300.000'),
('whatsappHelpdesk', '6285190610569'),
('bankAccount', 'Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

-- Data Admin (Username: admin, Password bawaan: adminbina2025)
-- Hash dibuat dengan password_hash('adminbina2025', PASSWORD_BCRYPT)
INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `nama`) VALUES
(1, 'admin', '$2y$10$tZ9C.kQj7d30o7D066bY9.QZ6l3w4mXU5g54bZ4z7Y3.v9b3w9Bqm', 'Panitia SPMB SIT Bina Insan')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

COMMIT;
