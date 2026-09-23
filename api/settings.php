<?php
/**
 * SIT BINA INSAN PAREPARE - SCHOOL SETTINGS API
 * Endpoint untuk memuat dan menyimpan pengaturan gelombang SPMB, infaq, WA, dan rekening
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
if (!$pdo) {
    sendJsonResponse(false, null, 'Tidak dapat terhubung ke database MySQL.', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $stmt = $pdo->query("SELECT `setting_key`, `setting_value` FROM `school_settings`");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        // Default fallback jika tabel masih kosong
        $defaults = [
            'academicYear'     => '2026/2027',
            'activeWave'       => 'wave1',
            'waveName'         => 'Gelombang 1',
            'waveDates'        => '1 Januari 2027 s/d 31 Maret 2027',
            'waveStatus'       => 'open',
            'waveNotice'       => 'Pendaftaran Gelombang 1 Sedang Berlangsung! Dapatkan Diskon Infaq Rp 500.000',
            'wave1Name'        => 'Gelombang 1',
            'wave1Promo'       => 'Diskon Rp500.000',
            'wave1Dates'       => '1 Januari 2027 s/d 31 Maret 2027',
            'wave2Name'        => 'Gelombang 2',
            'wave2Promo'       => 'Reguler',
            'wave2Dates'       => '1 April 2027 s/d 31 Mei 2027',
            'wave3Name'        => 'Gelombang 3',
            'wave3Promo'       => 'S/d Kuota Terpenuhi',
            'wave3Dates'       => '1 Juni 2027 s/d Kuota Terpenuhi',
            'wavePoint1'       => 'Potongan Infaq Pembangunan hingga Rp 500.000',
            'wavePoint2'       => 'Prioritas Kuota Kelas & Seleksi Observasi Dini',
            'wavePoint3'       => 'Tersedia Jalur Prestasi Tahfizh & Beasiswa Yatim',
            'statTk'           => '180+',
            'statSd'           => '650+',
            'statSmp'          => '420+',
            'statGuru'         => '85+',
            'tkitFee'          => 'Rp 200.000',
            'sditFee'          => 'Rp 250.000',
            'smpitFee'         => 'Rp 300.000',
            'whatsappHelpdesk' => '6285190610569',
            'bankAccount'      => 'Bank Syariah Indonesia (BSI) No. Rek: 711-234-5678 a.n Yayasan Bina Insan Parepare'
        ];
        $merged = array_merge($defaults, $settings);

        sendJsonResponse(true, $merged, 'Pengaturan sekolah berhasil dimuat.');
        break;

    case 'POST':
    case 'PUT':
        $input = getJsonInput();
        if (empty($input)) {
            sendJsonResponse(false, null, 'Data pengaturan tidak boleh kosong.', 400);
        }

        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                INSERT INTO `school_settings` (`setting_key`, `setting_value`)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`)
            ");

            foreach ($input as $key => $val) {
                if (is_scalar($val)) {
                    $stmt->execute([$key, (string)$val]);
                }
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Settings save error: ' . $e->getMessage());
            sendJsonResponse(false, null, 'Pengaturan gagal disimpan ke database.', 500);
        }

        sendJsonResponse(true, $input, 'Pengaturan sekolah & SPMB berhasil disimpan ke database.');
        break;

    default:
        sendJsonResponse(false, null, 'Metode HTTP tidak didukung.', 405);
        break;
}
