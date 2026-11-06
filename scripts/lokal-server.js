// Lokal utviklingsserver: serverer public/ og kjører api/*.js som på Vercel.
// Uten DATABASE_URL brukes en lokal database i ./.lokaldata, og uten GOOGLE_CLIENT_ID
// er innlogging slått av.
const http = require('http');
const fs = require('fs');
const path = require('path');

const rot = path.join(__dirname, '..');
const port = process.env.PORT || 3000;
const typer = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname.startsWith('/api/')) {
    const fil = path.join(rot, 'api', path.basename(pathname) + '.js');
    if (!fs.existsSync(fil)) { res.statusCode = 404; return res.end('{}'); }
    return require(fil)(req, res);
  }
  let fil = path.join(rot, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!fil.startsWith(path.join(rot, 'public')) || !fs.existsSync(fil) || fs.statSync(fil).isDirectory()) {
    fil = path.join(rot, 'public', 'index.html');
  }
  res.setHeader('Content-Type', typer[path.extname(fil)] || 'application/octet-stream');
  fs.createReadStream(fil).pipe(res);
}).listen(port, () => console.log(`Bingeboka kjører på http://localhost:${port}`));
