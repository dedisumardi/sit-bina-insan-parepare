<?php
/**
 * SIT BINA INSAN PAREPARE - ARTICLES & NEWS CMS API
 * Endpoint untuk memuat, menambah, menyunting, dan menghapus berita sekolah
 */

require_once __DIR__ . '/config.php';

$pdo = getDbConnection();
if (!$pdo) {
    sendJsonResponse(false, null, 'Tidak dapat terhubung ke database MySQL. Pastikan kredensial di api/config.php sudah benar.', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // =========================================================================
    // 1. GET: Ambil Daftar Berita / Artikel
    // =========================================================================
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int)$_GET['id'];
            $stmt = $pdo->prepare("SELECT * FROM `articles` WHERE `id` = ? LIMIT 1");
            $stmt->execute([$id]);
            $article = $stmt->fetch();
            if ($article) {
                sendJsonResponse(true, formatArticleOutput($article), 'Detail artikel ditemukan.');
            } else {
                sendJsonResponse(false, null, 'Artikel tidak ditemukan.', 404);
            }
        }

        $category = trim($_GET['category'] ?? 'Semua');
        $sql = "SELECT * FROM `articles` WHERE 1=1";
        $params = [];

        if ($category !== 'Semua' && !empty($category)) {
            $sql .= " AND `category` = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY `id` DESC";

        if (isset($_GET['limit'])) {
            $limit = (int)$_GET['limit'];
            if ($limit > 0) {
                $sql .= " LIMIT " . $limit;
            }
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $formatted = array_map('formatArticleOutput', $rows);
        sendJsonResponse(true, $formatted, 'Daftar berita berhasil dimuat.');
        break;

    // =========================================================================
    // 2. POST: Tambah Berita / Artikel Baru
    // =========================================================================
    case 'POST':
        $input = getJsonInput();

        $title = trim($input['title'] ?? '');
        if (empty($title)) {
            sendJsonResponse(false, null, 'Judul berita tidak boleh kosong.', 400);
        }

        $category      = trim($input['category'] ?? 'Kegiatan Sekolah');
        $categoryClass = trim($input['categoryClass'] ?? $input['category_class'] ?? 'badge-kegiatan');
        $author        = trim($input['author'] ?? 'Humas SIT Bina Insan');
        $publishDate   = trim($input['date'] ?? $input['publish_date'] ?? date('d F Y'));
        $readTime      = trim($input['readTime'] ?? $input['read_time'] ?? '3 menit baca');
        $image         = trim($input['image'] ?? 'assets/images/hero_school.jpg');
        $excerpt       = trim($input['excerpt'] ?? '');
        $content       = trim($input['content'] ?? '');

        $stmt = $pdo->prepare("
            INSERT INTO `articles` (
                `title`, `category`, `category_class`, `author`, `publish_date`,
                `read_time`, `image`, `excerpt`, `content`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        try {
            $stmt->execute([
                $title, $category, $categoryClass, $author, $publishDate,
                $readTime, $image, $excerpt, $content
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmtNew = $pdo->prepare("SELECT * FROM `articles` WHERE `id` = ?");
            $stmtNew->execute([$newId]);
            $newRow = $stmtNew->fetch();

            sendJsonResponse(true, formatArticleOutput($newRow), 'Berita baru berhasil diterbitkan!', 201);
        } catch (PDOException $e) {
            sendJsonResponse(false, null, 'Gagal menerbitkan artikel: ' . $e->getMessage(), 500);
        }
        break;

    // =========================================================================
    // 3. PUT: Sunting Berita / Artikel
    // =========================================================================
    case 'PUT':
        $input = getJsonInput();
        $id = (int)($input['id'] ?? $_GET['id'] ?? 0);

        if ($id <= 0) {
            sendJsonResponse(false, null, 'ID artikel tidak valid.', 400);
        }

        $title = trim($input['title'] ?? '');
        if (empty($title)) {
            sendJsonResponse(false, null, 'Judul berita tidak boleh kosong.', 400);
        }

        $category      = trim($input['category'] ?? 'Kegiatan Sekolah');
        $categoryClass = trim($input['categoryClass'] ?? $input['category_class'] ?? 'badge-kegiatan');
        $author        = trim($input['author'] ?? 'Humas SIT Bina Insan');
        $publishDate   = trim($input['date'] ?? $input['publish_date'] ?? date('d F Y'));
        $readTime      = trim($input['readTime'] ?? $input['read_time'] ?? '3 menit baca');
        $image         = trim($input['image'] ?? 'assets/images/hero_school.jpg');
        $excerpt       = trim($input['excerpt'] ?? '');
        $content       = trim($input['content'] ?? '');

        $stmt = $pdo->prepare("
            UPDATE `articles` SET
                `title` = ?, `category` = ?, `category_class` = ?, `author` = ?,
                `publish_date` = ?, `read_time` = ?, `image` = ?, `excerpt` = ?, `content` = ?
            WHERE `id` = ?
        ");

        try {
            $stmt->execute([
                $title, $category, $categoryClass, $author, $publishDate,
                $readTime, $image, $excerpt, $content, $id
            ]);

            $stmtUpdated = $pdo->prepare("SELECT * FROM `articles` WHERE `id` = ?");
            $stmtUpdated->execute([$id]);
            $updatedRow = $stmtUpdated->fetch();

            sendJsonResponse(true, formatArticleOutput($updatedRow), 'Artikel berhasil diperbarui.');
        } catch (PDOException $e) {
            sendJsonResponse(false, null, 'Gagal memperbarui artikel: ' . $e->getMessage(), 500);
        }
        break;

    // =========================================================================
    // 4. DELETE: Hapus Berita
    // =========================================================================
    case 'DELETE':
        $input = getJsonInput();
        $id = (int)($_GET['id'] ?? $input['id'] ?? 0);

        if ($id <= 0) {
            sendJsonResponse(false, null, 'ID artikel tidak valid.', 400);
        }

        $stmt = $pdo->prepare("DELETE FROM `articles` WHERE `id` = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, ['id' => $id], 'Artikel berhasil dihapus dari website.');
        } else {
            sendJsonResponse(false, null, 'Artikel tidak ditemukan.', 404);
        }
        break;

    default:
        sendJsonResponse(false, null, 'Metode HTTP tidak didukung.', 405);
        break;
}

function formatArticleOutput($row) {
    if (!$row) return null;
    return [
        'id'            => (int)$row['id'],
        'title'         => $row['title'],
        'category'      => $row['category'],
        'categoryClass' => $row['category_class'],
        'author'        => $row['author'],
        'date'          => $row['publish_date'],
        'readTime'      => $row['read_time'],
        'image'         => $row['image'],
        'excerpt'       => $row['excerpt'],
        'content'       => $row['content'],
        'createdAt'     => $row['created_at']
    ];
}
