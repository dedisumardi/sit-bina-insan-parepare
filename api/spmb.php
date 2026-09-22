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

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // =========================================================================
    // 1. GET: Ambil Data Pendaftar (Semua / Filter / Cek Status Spesifik)
    // =========================================================================
    case 'GET':
        // Cek apakah ini permintaan "Cek Status Pendaftaran" dari calon wali murid
        if (isset($_GET['check']) || isset($_GET['query'])) {
            $q = trim($_GET['check'] ?? $_GET['query'] ?? '');
            if (empty($q)) {
                sendJsonResponse(false, null, 'Nomor Registrasi atau NIK tidak boleh kosong.', 400);
            }

            $stmt = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `reg_number` = ? OR `nik` = ? LIMIT 1");
            $stmt->execute([$q, $q]);
            $applicant = $stmt->fetch();

            if ($applicant) {
                sendJsonResponse(true, formatApplicantOutput($applicant), 'Data pendaftaran ditemukan.');
            } else {
                sendJsonResponse(false, null, 'Data pendaftaran dengan Nomor Registrasi atau NIK tersebut tidak ditemukan.', 404);
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
    // 2. POST: Pendaftaran Calon Murid Baru (Submit Form 5 Langkah)
    // =========================================================================
    case 'POST':
        $input = getJsonInput();

        $namaSiswa = trim($input['namaSiswa'] ?? $input['nama_siswa'] ?? '');
        $jenjang   = strtolower(trim($input['jenjang'] ?? 'sdit'));
        $nik       = trim($input['nik'] ?? '');
        $waAyah    = trim($input['waAyah'] ?? $input['wa_ayah'] ?? '');

        if (empty($namaSiswa) || empty($nik) || empty($waAyah)) {
            sendJsonResponse(false, null, 'Nama lengkap, NIK, dan nomor WhatsApp wajib diisi.', 400);
        }

        if (!in_array($jenjang, ['tkit', 'sdit', 'smpit'])) {
            $jenjang = 'sdit';
        }

        // Generate Nomor Registrasi unik otomatis jika belum ada
        $regNumber = trim($input['regNumber'] ?? $input['reg_number'] ?? '');
        if (empty($regNumber)) {
            $prefix = 'SD';
            if ($jenjang === 'tkit') $prefix = 'TK';
            if ($jenjang === 'smpit') $prefix = 'SM';

            $year = date('Y');
            // Hitung nomor urut
            $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM `spmb_applicants` WHERE `jenjang` = ?");
            $stmtCount->execute([$jenjang]);
            $count = (int)$stmtCount->fetchColumn() + 1;
            $regNumber = sprintf("SPMB-%s-%s%03d", $year, $prefix, $count);
        }

        $jalur         = trim($input['jalur'] ?? 'reguler');
        $ttl           = trim($input['ttl'] ?? '-');
        $jk            = trim($input['jk'] ?? 'Laki-laki');
        $asalSekolah   = trim($input['asalSekolah'] ?? $input['asal_sekolah'] ?? '-');
        $alamat        = trim($input['alamat'] ?? '-');
        $namaAyah      = trim($input['namaAyah'] ?? $input['nama_ayah'] ?? '-');
        $pekerjaanAyah = trim($input['pekerjaanAyah'] ?? $input['pekerjaan_ayah'] ?? '-');
        $namaIbu       = trim($input['namaIbu'] ?? $input['nama_ibu'] ?? '-');
        $email         = trim($input['email'] ?? '-');
        $hafalan       = trim($input['hafalan'] ?? '-');
        $prestasi      = trim($input['prestasi'] ?? '-');
        $tanggalDaftar = trim($input['tanggalDaftar'] ?? $input['tanggal_daftar'] ?? date('d F Y, H:i') . ' WITA');
        $status        = trim($input['status'] ?? 'Menunggu Konfirmasi Pembayaran');
        $jadwalObs     = trim($input['jadwalObservasi'] ?? $input['jadwal_observasi'] ?? 'Menunggu verifikasi panitia');

        $stmtInsert = $pdo->prepare("
            INSERT INTO `spmb_applicants` (
                `reg_number`, `jenjang`, `jalur`, `nama_siswa`, `nik`, `ttl`, `jk`,
                `asal_sekolah`, `alamat`, `nama_ayah`, `pekerjaan_ayah`, `wa_ayah`,
                `nama_ibu`, `email`, `hafalan`, `prestasi`, `tanggal_daftar`, `status`, `jadwal_observasi`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        try {
            $stmtInsert->execute([
                $regNumber, $jenjang, $jalur, $namaSiswa, $nik, $ttl, $jk,
                $asalSekolah, $alamat, $namaAyah, $pekerjaanAyah, $waAyah,
                $namaIbu, $email, $hafalan, $prestasi, $tanggalDaftar, $status, $jadwalObs
            ]);

            $id = $pdo->lastInsertId();
            $stmtNew = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `id` = ?");
            $stmtNew->execute([$id]);
            $newRow = $stmtNew->fetch();

            sendJsonResponse(true, formatApplicantOutput($newRow), 'Pendaftaran berhasil dikirim! Nomor registrasi telah diterbitkan.', 201);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                sendJsonResponse(false, null, 'Nomor Registrasi atau NIK sudah terdaftar dalam sistem.', 409);
            }
            sendJsonResponse(false, null, 'Gagal menyimpan pendaftaran: ' . $e->getMessage(), 500);
        }
        break;

    // =========================================================================
    // 3. PUT: Perbarui Status Verifikasi & Jadwal Tes (Oleh Admin)
    // =========================================================================
    case 'PUT':
        $input = getJsonInput();
        $regNumber = trim($input['regNumber'] ?? $input['reg_number'] ?? '');

        if (empty($regNumber)) {
            sendJsonResponse(false, null, 'Nomor Registrasi wajib disertakan.', 400);
        }

        $newStatus = trim($input['status'] ?? '');
        $newJadwal = trim($input['jadwalObservasi'] ?? $input['jadwal_observasi'] ?? '');

        $fields = [];
        $params = [];

        if (!empty($newStatus)) {
            $fields[] = "`status` = ?";
            $params[] = $newStatus;
        }
        if (isset($input['jadwalObservasi']) || isset($input['jadwal_observasi'])) {
            $fields[] = "`jadwal_observasi` = ?";
            $params[] = $newJadwal;
        }

        if (empty($fields)) {
            sendJsonResponse(false, null, 'Tidak ada data perubahan yang dikirim.', 400);
        }

        $params[] = $regNumber;
        $sql = "UPDATE `spmb_applicants` SET " . implode(', ', $fields) . " WHERE `reg_number` = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmtUpdated = $pdo->prepare("SELECT * FROM `spmb_applicants` WHERE `reg_number` = ?");
        $stmtUpdated->execute([$regNumber]);
        $updatedRow = $stmtUpdated->fetch();

        sendJsonResponse(true, formatApplicantOutput($updatedRow), "Status pendaftar {$regNumber} berhasil diperbarui.");
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
        'id'              => (int)$row['id'],
        'regNumber'       => $row['reg_number'],
        'jenjang'         => $row['jenjang'],
        'jalur'           => $row['jalur'],
        'namaSiswa'       => $row['nama_siswa'],
        'nik'             => $row['nik'],
        'ttl'             => $row['ttl'],
        'jk'              => $row['jk'],
        'asalSekolah'     => $row['asal_sekolah'],
        'alamat'          => $row['alamat'],
        'namaAyah'        => $row['nama_ayah'],
        'pekerjaanAyah'   => $row['pekerjaan_ayah'] ?? '-',
        'waAyah'          => $row['wa_ayah'],
        'namaIbu'         => $row['nama_ibu'],
        'email'           => $row['email'] ?? '-',
        'hafalan'         => $row['hafalan'] ?? '-',
        'prestasi'        => $row['prestasi'] ?? '-',
        'tanggalDaftar'   => $row['tanggal_daftar'],
        'status'          => $row['status'],
        'jadwalObservasi' => $row['jadwal_observasi'] ?? '-',
        'createdAt'       => $row['created_at']
    ];
}
