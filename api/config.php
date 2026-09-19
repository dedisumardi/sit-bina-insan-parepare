<?php
/**
 * SIT BINA INSAN PAREPARE - DATABASE CONFIGURATION & API HELPERS
 * Konfigurasi koneksi MySQL PDO dengan prepared statements
 */

// Aktifkan error reporting untuk debugging (nonaktifkan jika di production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Header respons JSON & CORS
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Tangani preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// =========================================================================
// KONFIGURASI DATABASE CPANEL
// Silakan sesuaikan nama database, user, dan password sesuai akun cPanel Anda
// =========================================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'sitbina_spmb');       // Ganti dengan nama database cPanel Anda
define('DB_USER', 'sitbina_user');       // Ganti dengan username database cPanel Anda
define('DB_PASS', 'BinaInsanPare2025!'); // Ganti dengan password database cPanel Anda

/**
 * Mendapatkan koneksi PDO MySQL
 * @return PDO|null
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Jika koneksi gagal, kembalikan null (akan ditangani fallback oleh API)
        error_log("Database connection error: " . $e->getMessage());
        return null;
    }
}

/**
 * Mengirim respons standar JSON
 * @param bool $success
 * @param mixed $data
 * @param string $message
 * @param int $statusCode
 */
function sendJsonResponse($success, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data,
        'time'    => date('c')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Membaca payload input JSON dari request body
 * @return array
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}
