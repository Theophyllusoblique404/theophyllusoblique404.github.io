// Servidor local de teste — serve os arquivos e gera /noticias.json na hora
// (em produção quem gera o noticias.json é o GitHub Actions).
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.js': 'text/javascript' };

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/noticias.json') {
    https.get('https://g1.globo.com/rss/g1/', { headers: { 'User-Agent': 'Mozilla/5.0 (OnScreenPlayer)' } }, (r) => {
      let xml = '';
      r.on('data', (c) => (xml += c));
      r.on('end', () => {
        const noticias = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
          const t = m[1].match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
          const img = m[1].match(/<media:content[^>]*url="([^"]+)"/);
          return t ? { titulo: t[1].trim(), imagem: img ? img[1] : null } : null;
        }).filter(Boolean).slice(0, 12);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ noticias }));
      });
    }).on('error', () => {
      // sem internet: usa o último noticias.json salvo no disco
      fs.readFile(path.join(dir, 'noticias.json'), (err, data) => {
        if (err) { res.writeHead(502); res.end('{"erro":true}'); return; }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(data);
      });
    });
    return;
  }
  const file = path.join(dir, url === '/' ? 'index.html' : decodeURIComponent(url));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8735, () => console.log('onscreen-player em http://localhost:8735'));
