const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin') reqPath = '/admin.html';

  // API handler for settings.php
  if (reqPath === '/api/settings.php') {
    const settingsFile = path.join(__dirname, 'data_settings.json');
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          fs.writeFileSync(settingsFile, JSON.stringify(parsed, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, data: parsed, message: 'Settings saved successfully.' }));
        } catch(e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, message: 'Invalid JSON: ' + e.message }));
        }
      });
      return;
    } else {
      // GET
      if (fs.existsSync(settingsFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, data: data }));
          return;
        } catch(e) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        data: {
          academicYear: "2026/2027",
          activeWave: "wave1",
          waveStatus: "open",
          wave1Name: "Gelombang 1",
          wave1Promo: "Diskon Rp500.000",
          wave1Dates: "1 Januari 2027 s/d 31 Maret 2027",
          wave2Name: "Gelombang 2",
          wave2Promo: "Reguler",
          wave2Dates: "1 April 2027 s/d 31 Mei 2027",
          wave3Name: "Gelombang 3",
          wave3Promo: "S/d Kuota Terpenuhi",
          wave3Dates: "1 Juni 2027 s/d Kuota Terpenuhi",
          waveName: "Gelombang 1",
          waveDates: "1 Januari 2027 s/d 31 Maret 2027",
          waveNotice: "Pendaftaran Gelombang 1 Sedang Berlangsung! Dapatkan Diskon Infaq Rp 500.000"
        }
      }));
      return;
    }
  }

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server SIT Bina Insan running at http://localhost:${PORT}`);
});
