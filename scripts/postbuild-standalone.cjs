const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standalone = path.join(root, '.next', 'standalone');
const serverJs = path.join(standalone, 'server.js');

if (!fs.existsSync(serverJs)) {
  process.exit(0);
}

const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(standalone, 'public'), { recursive: true });
}

const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(standalone, '.next', 'static');
fs.mkdirSync(path.join(standalone, '.next'), { recursive: true });
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}
