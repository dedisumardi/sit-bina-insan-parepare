<?php
/**
 * SIT BINA INSAN PAREPARE - SPMB API ENDPOINT
 * Mengelola pendaftaran calon murid baru, cek status pendaftaran, dan verifikasi admin
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
if (!$pdo) {
    sendJsonResponse(false, null, 'Tidak dapat terhubung ke database MySQL. Pastikan kredensial di api/config.php sudah benar.', 500);
}

// Migrasi otomatis kolom bukti pembayaran jika belum ada
try {
    $pdo->exec("ALTER TABLE `spmb_applicants` ADD COLUMN `bukti_pembayaran` LONGTEXT NULL AFTER `status`");
} catch (Exception $e) {}
try {
    $pdo->exec("ALTER TABLE `spmb_applicants` ADD COLUMN `nominal_pembayaran` INT NULL DEFAULT 150000 AFTER `status`");
} catch (Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // =========================================================================
    // 1. GET: Ambil Data Pendaftar (Semua / Filter / Cek Status Spesifik / No. WA)
    // =========================================================================
    case 'GET':
        // Cek pencarian via Nomor WhatsApp (untuk login orang tua ke portal)
        if (isset($_GET['wa'])) {
            $wa = trim($_GET['wa']);
            $cleanWa = preg_replace('/[^0-9]/', '', $wa);
            $stmt = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `wa_ayah` = ? OR `wa_ayah` = ? OR `wa_ayah` LIKE ? ORDER BY `id` DESC LIMIT 1");
            $stmt->execute([$wa, $cleanWa, '%' . substr($cleanWa, -9) . '%']);
            $applicant = $stmt->fetch();
            if ($applicant) {
                sendJsonResponse(true, formatApplicantOutput($applicant), 'Data pendaftaran ditemukan.');
            } else {
                sendJsonResponse(false, null, 'Nomor WhatsApp belum terdaftar.', 404);
            }
        }

        // Cek apakah ini permintaan "Cek Status Pendaftaran" dari calon wali murid
        if (isset($_GET['check']) || isset($_GET['query'])) {
            $q = trim($_GET['check'] ?? $_GET['query'] ?? '');
            if (empty($q)) {
                sendJsonResponse(false, null, 'Nomor Registrasi atau NIK tidak boleh kosong.', 400);
            }

            $stmt = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `reg_number` = ? OR `nik` = ? OR `wa_ayah` = ? LIMIT 1");
            $stmt->execute([$q, $q, $q]);
            $applicant = $stmt->fetch();

            if ($applicant) {
                sendJsonResponse(true, formatApplicantOutput($applicant), 'Data pendaftaran ditemukan.');
            } else {
                sendJsonResponse(false, null, 'Data pendaftaran tidak ditemukan.', 404);
            }
        }

        // Ambil data satu siswa berdasarkan No. Registrasi
        if (isset($_GET['reg_number'])) {
            $reg = trim($_GET['reg_number']);
            $stmt = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `reg_number` = ? LIMIT 1");
            $stmt->execute([$reg]);
            $applicant = $stmt->fetch();
            if ($applicant) {
                sendJsonResponse(true, formatApplicantOutput($applicant), 'Detail pendaftar ditemukan.');
            } else {
                sendJsonResponse(false, null, 'Pendaftar tidak ditemukan.', 404);
            }
        }

        // Ambil semua data (untuk portal Admin) dengan filter opsional
        $jenjang = trim($_GET['jenjang'] ?? 'all');
        $status  = trim($_GET['status'] ?? 'all');
        $search  = trim($_GET['search'] ?? '');

        $sql = "SELECT * FROM `spmb_applicants` WHERE 1=1";
        $params = [];

        if ($jenjang !== 'all' && in_array($jenjang, ['tkit', 'sdit', 'smpit'])) {
            $sql .= " AND `jenjang` = ?";
            $params[] = $jenjang;
        }

        if ($status !== 'all' && !empty($status)) {
            $sql .= " AND `status` LIKE ?";
            $params[] = '%' . $status . '%';
        }

        if (!empty($search)) {
            $sql .= " AND (`reg_number` LIKE ? OR `nama_siswa` LIKE ? OR `nik` LIKE ? OR `nama_ayah` LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql .= " ORDER BY `id` DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $formattedList = array_map('formatApplicantOutput', $rows);
        sendJsonResponse(true, $formattedList, 'Daftar pendaftar SPMB berhasil dimuat.');
        break;

    // =========================================================================
    // 2. POST: Pendaftaran Awal Orang Tua / Calon Murid Baru
    // =========================================================================
    case 'POST':
        $input = getJsonInput();

        $namaAyah  = trim($input['namaAyah'] ?? $input['nama_ayah'] ?? $input['namaOrangTua'] ?? '');
        $waAyah    = trim($input['waAyah'] ?? $input['wa_ayah'] ?? $input['noWhatsapp'] ?? '');
        $namaSiswa = trim($input['namaSiswa'] ?? $input['nama_siswa'] ?? '');
        $nik       = trim($input['nik'] ?? '');
        $jenjang   = strtolower(trim($input['jenjang'] ?? 'sdit'));

        if (empty($namaAyah) && empty($namaSiswa)) {
            sendJsonResponse(false, null, 'Nama orang tua / wali atau nama siswa wajib diisi.', 400);
        }
        if (empty($waAyah)) {
            sendJsonResponse(false, null, 'Nomor WhatsApp wajib diisi.', 400);
        }

        // Jika pendaftaran awal hanya menyertakan nama orang tua & No WA
        if (empty($namaSiswa)) {
            $namaSiswa = 'Calon Siswa (' . $namaAyah . ')';
        }
        if (empty($nik)) {
            $nik = 'WA-' . preg_replace('/[^0-9]/', '', $waAyah);
        }

        $hasStudentData = !empty(trim($input['namaSiswa'] ?? $input['nama_siswa'] ?? ''));
        $jalur         = trim($input['jalur'] ?? 'reguler');
        $ttl           = trim($input['ttl'] ?? '-');
        $jk            = trim($input['jk'] ?? 'Laki-laki');
        $asalSekolah   = trim($input['asalSekolah'] ?? $input['asal_sekolah'] ?? '-');
        $alamat        = trim($input['alamat'] ?? '-');
        $pekerjaanAyah = trim($input['pekerjaanAyah'] ?? $input['pekerjaan_ayah'] ?? '-');
        $namaIbu       = trim($input['namaIbu'] ?? $input['nama_ibu'] ?? '-');
        $email         = trim($input['email'] ?? '-');
        $hafalan       = trim($input['hafalan'] ?? '-');
        $prestasi      = trim($input['prestasi'] ?? '-');
        $jadwalObs     = trim($input['jadwalObservasi'] ?? $input['jadwal_observasi'] ?? 'Menunggu konfirmasi pembayaran');

        // Cek jika nomor WA ini sudah pernah terdaftar, lakukan update bukan duplicate error
        $stmtCheck = $pdo->prepare("SELECT `id`, `reg_number` FROM `spmb_applicants` WHERE `wa_ayah` = ? OR `nik` = ? ORDER BY `id` DESC LIMIT 1");
        $stmtCheck->execute([$waAyah, $nik]);
        $existing = $stmtCheck->fetch();

        $buktiBayar = $input['buktiPembayaran'] ?? $input['bukti_pembayaran'] ?? null;
        $nominal    = (int)($input['nominalPembayaran'] ?? $input['nominal_pembayaran'] ?? 150000);
        $status     = trim($input['status'] ?? (!empty($buktiBayar) ? 'Menunggu Verifikasi Pembayaran oleh Admin' : 'Menunggu Pembayaran Uang Pendaftaran (Rp 150.000)'));
        $tanggalDaftar = trim($input['tanggalDaftar'] ?? $input['tanggal_daftar'] ?? date('d F Y, H:i') . ' WITA');

        if ($existing) {
            if ($hasStudentData) {
                $sqlUpdate = "UPDATE `spmb_applicants` SET
                    `jenjang` = ?, `jalur` = ?, `nama_siswa` = ?, `nik` = ?, `ttl` = ?, `jk` = ?,
                    `asal_sekolah` = ?, `alamat` = ?, `nama_ayah` = ?, `pekerjaan_ayah` = ?,
                    `wa_ayah` = ?, `nama_ibu` = ?, `email` = ?, `hafalan` = ?, `prestasi` = ?";
                $updateParams = [
                    $jenjang, $jalur, $namaSiswa, $nik, $ttl, $jk, $asalSekolah, $alamat,
                    $namaAyah, $pekerjaanAyah, $waAyah, $namaIbu, $email, $hafalan,
                    $prestasi
                ];
            } else {
                // Login/pendaftaran singkat tidak boleh menimpa biodata atau status yang sudah lengkap.
                $sqlUpdate = "UPDATE `spmb_applicants` SET `nama_ayah` = ?, `wa_ayah` = ?";
                $updateParams = [$namaAyah, $waAyah];
            }
            if (!empty($buktiBayar)) {
                $sqlUpdate .= ", `bukti_pembayaran` = ?, `nominal_pembayaran` = ?";
                $updateParams[] = $buktiBayar;
                $updateParams[] = $nominal;
                if (!$hasStudentData) {
                    $sqlUpdate .= ", `status` = ?";
                    $updateParams[] = $status;
                }
            }
            $sqlUpdate .= " WHERE `id` = ?";
            $updateParams[] = $existing['id'];

            $stmtUp = $pdo->prepare($sqlUpdate);
            $stmtUp->execute($updateParams);

            $stmtFetch = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `id` = ?");
            $stmtFetch->execute([$existing['id']]);
            $updatedRow = $stmtFetch->fetch();

            sendJsonResponse(true, formatApplicantOutput($updatedRow), 'Data pendaftaran berhasil diperbarui.');
        }

        // Nomor registrasi awal (sementara sebelum diapprove admin)
        $regNumber = trim($input['regNumber'] ?? $input['reg_number'] ?? '');
        if (empty($regNumber)) {
            $regNumber = 'PENDING-' . substr(preg_replace('/[^0-9]/', '', $waAyah), -4) . '-' . rand(100, 999);
        }

        $stmtInsert = $pdo->prepare("
            INSERT INTO `spmb_applicants` (
                `reg_number`, `jenjang`, `jalur`, `nama_siswa`, `nik`, `ttl`, `jk`,
                `asal_sekolah`, `alamat`, `nama_ayah`, `pekerjaan_ayah`, `wa_ayah`,
                `nama_ibu`, `email`, `hafalan`, `prestasi`, `tanggal_daftar`, `status`, `bukti_pembayaran`, `nominal_pembayaran`, `jadwal_observasi`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        try {
            $stmtInsert->execute([
                $regNumber, $jenjang, $jalur, $namaSiswa, $nik, $ttl, $jk,
                $asalSekolah, $alamat, $namaAyah, $pekerjaanAyah, $waAyah,
                $namaIbu, $email, $hafalan, $prestasi, $tanggalDaftar, $status, $buktiBayar, $nominal, $jadwalObs
            ]);

            $id = $pdo->lastInsertId();
            $stmtNew = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `id` = ?");
            $stmtNew->execute([$id]);
            $newRow = $stmtNew->fetch();

            sendJsonResponse(true, formatApplicantOutput($newRow), 'Pendaftaran berhasil dikirim!', 201);
        } catch (PDOException $e) {
            sendJsonResponse(false, null, 'Gagal menyimpan pendaftaran: ' . $e->getMessage(), 500);
        }
        break;

    // =========================================================================
    // 3. PUT: Perbarui Status Verifikasi & Approval Pembayaran (Oleh Admin / Portal)
    // =========================================================================
    case 'PUT':
        $input = getJsonInput();
        $targetWa = trim($input['waAyah'] ?? $input['wa_ayah'] ?? '');
        $regNumber = trim($input['regNumber'] ?? $input['reg_number'] ?? '');
        $newRegNumber = trim($input['newRegNumber'] ?? $input['new_reg_number'] ?? '');

        if (empty($regNumber) && empty($targetWa)) {
            sendJsonResponse(false, null, 'Nomor Registrasi atau Nomor WhatsApp wajib disertakan.', 400);
        }

        $fields = [];
        $params = [];

        if (!empty($newRegNumber)) {
            $fields[] = "`reg_number` = ?";
            $params[] = $newRegNumber;
        }

        if (isset($input['status']) && !empty($input['status'])) {
            $fields[] = "`status` = ?";
            $params[] = trim($input['status']);
        }

        if (isset($input['buktiPembayaran']) || isset($input['bukti_pembayaran'])) {
            $fields[] = "`bukti_pembayaran` = ?";
            $params[] = $input['buktiPembayaran'] ?? $input['bukti_pembayaran'];
        }

        if (isset($input['nominalPembayaran']) || isset($input['nominal_pembayaran'])) {
            $nominalPembayaran = (int)($input['nominalPembayaran'] ?? $input['nominal_pembayaran']);
            if ($nominalPembayaran < 0) {
                sendJsonResponse(false, null, 'Nominal pembayaran tidak valid.', 400);
            }
            $fields[] = "`nominal_pembayaran` = ?";
            $params[] = $nominalPembayaran;
        }

        $jadwalTes = trim($input['jadwalTes'] ?? $input['jadwal_tes'] ?? '');
        $jadwalWawancara = trim($input['jadwalWawancara'] ?? $input['jadwal_wawancara'] ?? '');
        $lokasiTes = trim($input['lokasiTes'] ?? $input['lokasi_tes'] ?? '');
        if (!empty($jadwalTes) || !empty($jadwalWawancara)) {
            $composite = 'Tes: ' . ($jadwalTes ?: '-') . ' | Wawancara: ' . ($jadwalWawancara ?: '-') . ($lokasiTes ? ' | Lokasi: ' . $lokasiTes : '');
            $fields[] = "`jadwal_observasi` = ?";
            $params[] = $composite;
        } elseif (isset($input['jadwalObservasi']) || isset($input['jadwal_observasi'])) {
            $fields[] = "`jadwal_observasi` = ?";
            $params[] = trim($input['jadwalObservasi'] ?? $input['jadwal_observasi']);
        }

        if (empty($fields)) {
            sendJsonResponse(false, null, 'Tidak ada data perubahan yang dikirim.', 400);
        }

        if (!empty($regNumber)) {
            $whereClause = "WHERE `reg_number` = ?";
            $params[] = $regNumber;
        } else {
            $whereClause = "WHERE `wa_ayah` = ?";
            $params[] = $targetWa;
        }

        $sql = "UPDATE `spmb_applicants` SET " . implode(', ', $fields) . " " . $whereClause;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $checkSql = !empty($regNumber)
                ? "SELECT `id` FROM `spmb_applicants` WHERE `reg_number` = ? LIMIT 1"
                : "SELECT `id` FROM `spmb_applicants` WHERE `wa_ayah` = ? LIMIT 1";
            $stmtCheck = $pdo->prepare($checkSql);
            $stmtCheck->execute([!empty($regNumber) ? $regNumber : $targetWa]);
            if (!$stmtCheck->fetch()) {
                sendJsonResponse(false, null, 'Data pendaftar tidak ditemukan.', 404);
            }
        }

        $lookupKey = !empty($newRegNumber) ? $newRegNumber : (!empty($regNumber) ? $regNumber : $targetWa);
        $stmtUpdated = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `reg_number` = ? OR `wa_ayah` = ? ORDER BY `id` DESC LIMIT 1");
        $stmtUpdated->execute([$lookupKey, $lookupKey]);
        $updatedRow = $stmtUpdated->fetch();

        sendJsonResponse(true, formatApplicantOutput($updatedRow), "Data pendaftar berhasil diperbarui.");
        break;

    // =========================================================================
    // 4. DELETE: Hapus Data Pendaftar (Oleh Admin)
    // =========================================================================
    case 'DELETE':
        $input = getJsonInput();
        $regNumber = trim($_GET['reg_number'] ?? $input['regNumber'] ?? $input['reg_number'] ?? '');

        if (empty($regNumber)) {
            sendJsonResponse(false, null, 'Nomor Registrasi wajib disertakan untuk penghapusan.', 400);
        }

        $stmt = $pdo->prepare("DELETE FROM `spmb_applicants` WHERE `reg_number` = ?");
        $stmt->execute([$regNumber]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, ['regNumber' => $regNumber], "Data pendaftar {$regNumber} berhasil dihapus.");
        } else {
            sendJsonResponse(false, null, "Data pendaftar {$regNumber} tidak ditemukan.", 404);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Metode HTTP tidak didukung.', 405);
        break;
}

/**
 * Format kolom database MySQL ke nama properti JavaScript (camelCase)
 */
function formatApplicantOutput($row) {
    if (!$row) return null;
    return [
        'id'                => (int)$row['id'],
        'regNumber'         => $row['reg_number'],
        'jenjang'           => $row['jenjang'] ?? 'sdit',
        'jalur'             => $row['jalur'] ?? 'reguler',
        'namaSiswa'         => $row['nama_siswa'] ?? '',
        'nik'               => $row['nik'] ?? '',
        'ttl'               => $row['ttl'] ?? '-',
        'jk'                => $row['jk'] ?? 'Laki-laki',
        'asalSekolah'       => $row['asal_sekolah'] ?? '-',
        'alamat'            => $row['alamat'] ?? '-',
        'namaAyah'          => $row['nama_ayah'] ?? '-',
        'pekerjaanAyah'     => $row['pekerjaan_ayah'] ?? '-',
        'waAyah'            => $row['wa_ayah'] ?? '',
        'namaIbu'           => $row['nama_ibu'] ?? '-',
        'email'             => $row['email'] ?? '-',
        'hafalan'           => $row['hafalan'] ?? '-',
        'prestasi'          => $row['prestasi'] ?? '-',
        'tanggalDaftar'     => $row['tanggal_daftar'] ?? '',
        'status'            => $row['status'] ?? 'Menunggu Pembayaran Uang Pendaftaran (Rp 150.000)',
        'buktiPembayaran'   => $row['bukti_pembayaran'] ?? '',
        'nominalPembayaran' => (int)($row['nominal_pembayaran'] ?? 150000),
        'jadwalObservasi'   => $row['jadwal_observasi'] ?? '-',
        'createdAt'         => $row['created_at'] ?? ''
    ];
}
