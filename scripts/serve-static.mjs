import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || 4173);
const relaxCompatCsp = process.env.KANJI5_COMPAT_HTTP === '1';

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

function handleRequest(req, res) {
  try {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const filePath = path.resolve(root, relative);

    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      res.writeHead(404).end('Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mime.get(path.extname(filePath)) || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (relaxCompatCsp && path.basename(filePath) === 'index.html') {
      let html = fs.readFileSync(filePath, 'utf8');
      html = html.replace(/;\s*upgrade-insecure-requests\b/g, '');
      res.end(html);
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404).end('Not Found');
  }
}

const server = http.createServer(handleRequest);

server.listen(port, '127.0.0.1', () => {
  console.log(`Kanji 5 test server listening on http://127.0.0.1:${port}/`);
});
