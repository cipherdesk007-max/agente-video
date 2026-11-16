// FMLAB Reel Kit — piccolo server locale: serve i file del kit al browser (render e anteprima).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {RADICE} from './percorsi.mjs';

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.srt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function rispondi(res, codice, testo) {
  res.writeHead(codice, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(testo);
}

/**
 * Avvia il server. `rotte` è una lista di funzioni (url, req, res) => true se hanno risposto.
 * I file nascosti (.env, .git…) e node_modules non vengono mai serviti.
 */
export function avviaServer({porta = 0, host = '127.0.0.1', rotte = []} = {}) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://locale');
      // le rotte decidono da sé quali richieste accettare; i file del kit si possono solo leggere
      for (const rotta of rotte) {
        if (await rotta(url, req, res)) return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return rispondi(res, 405, 'Metodo non permesso');
      let percorso;
      try {
        percorso = decodeURIComponent(url.pathname);
      } catch {
        return rispondi(res, 400, 'Indirizzo non valido');
      }
      const segmenti = percorso.split('/').filter(Boolean);
      const vietato = segmenti.some((s) => s === '..' || s === 'node_modules' || (s.startsWith('.') && s !== '.fmlab'));
      if (vietato) return rispondi(res, 403, 'Non disponibile');
      const file = path.join(RADICE, ...segmenti);
      if (!file.startsWith(RADICE)) return rispondi(res, 403, 'Non disponibile');
      let st;
      try {
        st = fs.statSync(file);
      } catch {
        return rispondi(res, 404, `Non trovato: ${percorso}`);
      }
      if (!st.isFile()) return rispondi(res, 404, `Non trovato: ${percorso}`);
      const tipo = TIPI[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
      const base = {'Content-Type': tipo, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes'};
      const intervallo = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
      if (intervallo && (intervallo[1] !== '' || intervallo[2] !== '')) {
        let inizio = intervallo[1] === '' ? Math.max(0, st.size - Number(intervallo[2])) : Number(intervallo[1]);
        let fine = intervallo[1] !== '' && intervallo[2] !== '' ? Number(intervallo[2]) : st.size - 1;
        fine = Math.min(fine, st.size - 1);
        if (inizio > fine || inizio >= st.size) {
          res.writeHead(416, {'Content-Range': `bytes */${st.size}`});
          return res.end();
        }
        res.writeHead(206, {...base, 'Content-Range': `bytes ${inizio}-${fine}/${st.size}`, 'Content-Length': fine - inizio + 1});
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file, {start: inizio, end: fine}).pipe(res);
      }
      res.writeHead(200, {...base, 'Content-Length': st.size});
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    } catch (e) {
      rispondi(res, 500, `Errore del server: ${e.message}`);
    }
  });
  return new Promise((ok, ko) => {
    server.once('error', ko);
    server.listen(porta, host, () => {
      const p = server.address().port;
      ok({
        porta: p,
        url: `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${p}`,
        chiudi: () =>
          new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          }),
      });
    });
  });
}
