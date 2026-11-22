// Bloom Clash — a tiny static server for local play-testing only.
// `node serve.ts` serves game/ on http://localhost:8080 (or --port <n>).
// Nothing here is part of the graded entry; the grader serves game/ itself.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
]);

function pickPort() {
  const at = process.argv.indexOf('--port');
  const wanted = at === -1 ? 8080 : Number(process.argv[at + 1]);
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}

function resolveTarget(requestUrl) {
  const url = new URL(requestUrl ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  const file = join(root, rel);
  if (!file.startsWith(root + sep) && file !== root) return null;
  try {
    return statSync(file).isDirectory() ? join(file, 'index.html') : file;
  } catch {
    return null;
  }
}

const port = pickPort();
createServer((request, response) => {
  const target = resolveTarget(request.url);
  if (!target) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': TYPES.get(extname(target)) ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, () => {
  console.log(`Bloom Clash at http://localhost:${port}`);
});
