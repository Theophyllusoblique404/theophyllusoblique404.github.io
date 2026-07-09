// Roda no GitHub Actions a cada 15 min: busca o RSS do G1 e grava noticias.json
// (título + foto de cada matéria). O player só lê o arquivo estático.
const fs = require('fs');
const path = require('path');
const destino = path.join(__dirname, '..', 'noticias.json');

async function main() {
  const r = await fetch('https://g1.globo.com/rss/g1/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (OnScreenPlayer)' },
  });
  if (!r.ok) throw new Error('RSS respondeu ' + r.status);
  const xml = await r.text();

  const noticias = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map((m) => {
      const bloco = m[1];
      const t = bloco.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/);
      const img = bloco.match(/<media:content[^>]*url="([^"]+)"/);
      return t ? { titulo: t[1].trim(), imagem: img ? img[1] : null } : null;
    })
    .filter(Boolean)
    .slice(0, 12);

  if (!noticias.length) throw new Error('nenhuma noticia extraida');

  fs.writeFileSync(destino, JSON.stringify({
    noticias,
    atualizadoEm: new Date().toISOString(),
  }, null, 2));
  console.log(noticias.length + ' noticias gravadas');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
