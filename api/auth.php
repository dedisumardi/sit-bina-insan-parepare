<?php
/**
 * SIT BINA INSAN PAREPARE - AUTHENTICATION API
 * Verifikasi login administrator dengan database MySQL
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendJsonResponse(false, null, 'Metode HTTP tidak didukung. Gunakan POST.', 405);
}

$input = getJsonInput();
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($username) || empty($password)) {
    sendJsonResponse(false, null, 'Username dan password wajib diisi.', 400);
}

// 1. Coba verifikasi dengan database MySQL jika database terhubung
if ($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM `admin_users` WHERE `username` = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user) {
            // Verifikasi password hash atau fallback plain
            if (password_verify($password, $user['password_hash']) || $password === 'adminbina2025') {
                sendJsonResponse(true, [
                    'username' => $user['username'],
                    'nama'     => $user['nama'],
                    'token'    => bin2hex(random_bytes(16))
                ], 'Login berhasil! Selamat datang di Portal Admin.');
            }
        }
    } catch (PDOException $e) {
        error_log("Auth DB error: " . $e->getMessage());
    }
}

// 2. Fallback kredensial default bawaan
if ($username === 'admin' && $password === 'adminbina2025') {
    sendJsonResponse(true, [
        'username' => 'admin',
        'nama'     => 'Administrator SPMB',
        'token'    => 'session_' . time()
    ], 'Login berhasil!');
}

sendJsonResponse(false, null, 'Username atau password salah.', 401);
