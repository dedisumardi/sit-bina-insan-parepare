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
            'academicYear'     => '2025/2026',
            'activeWave'       => 'Gelombang 1 (Early Bird)',
            'waveName'         => 'Gelombang 1 (Early Bird)',
            'waveDates'        => '1 Nov 2024 s/d 31 Jan 2025',
            'waveStatus'       => 'open',
            'waveNotice'       => 'Pendaftaran Gelombang 1 (Early Bird) Sedang Berlangsung!',
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

        sendJsonResponse(true, $input, 'Pengaturan sekolah & SPMB berhasil disimpan ke database.');
        break;

    default:
        sendJsonResponse(false, null, 'Metode HTTP tidak didukung.', 405);
        break;
}
