const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

function copyRecursive(src, dest) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name);
      const d = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
}

// Copy asset directories
['css', 'js', 'assets'].forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(dist, dir);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  }
});

// Copy root static files
['index.html', 'admin.html', 'robots.txt', 'sitemap.xml'].forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(dist, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

console.log('Build completed: all static files ready in dist/');
