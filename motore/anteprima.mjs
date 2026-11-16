// FMLAB Reel Kit — anteprima: apre il reel nel browser con play, cursore e audio.
//   npm run anteprima            elenco dei reel
//   npm run anteprima gps        apre direttamente quel reel
//   npm run anteprima gps rete   lo rende visibile anche da telefono sulla stessa rete Wi-Fi
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {RADICE, elencoReel, slugValido} from './percorsi.mjs';
import {altreLingue} from './reel.mjs';
import {impacchetta} from './impacchetta.mjs';
import {avviaServer} from './server.mjs';

function htmlSemplice(titolo, corpo) {
  return `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titolo}</title>
<style>body{margin:0;padding:28px;background:#07090d;color:#e8ecf5;font:500 17px/1.5 system-ui,sans-serif}a{color:#7fb0ff}h1{font-size:22px}pre{white-space:pre-wrap;background:#141925;padding:16px;border-radius:12px;color:#ffb4bd;font-size:14px}li{margin:8px 0}</style>
<h1>${titolo}</h1>${corpo}`;
}

/** Impronta dei file che contano per un reel: se cambia, l'anteprima va ricaricata. */
function versione(slug) {
  let somma = 0;
  const visita = (dir, profondita) => {
    let voci = [];
    try {
      voci = fs.readdirSync(dir, {withFileTypes: true});
    } catch {
      return;
    }
    for (const v of voci) {
      const p = path.join(dir, v.name);
      if (v.isDirectory()) {
        if (profondita < 2 && v.name !== 'provini' && v.name !== 'node_modules') visita(p, profondita + 1);
      } else if (/\.(tsx?|mjs|json|md|css|png|jpe?g|webp|mp3|wav)$/i.test(v.name) && !/^(verifica|provini)/.test(v.name)) {
        somma = (somma + fs.statSync(p).mtimeMs) % 1e15;
      }
    }
  };
  visita(path.join(RADICE, 'reels', slug), 0);
  visita(path.join(RADICE, 'libreria'), 0);
  visita(path.join(RADICE, 'stile'), 0);
  visita(path.join(RADICE, 'personaggi'), 0);
  visita(path.join(RADICE, 'motore', 'web'), 0);
  return String(Math.round(somma));
}

/** Le rotte dell'anteprima (elenco, player di un reel, controllo delle modifiche): le usa anche il pannello. */
export function rotteAnteprima({conElenco = true} = {}) {
  return [
    async (url, req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return false;
      if (conElenco && url.pathname === '/') {
        const voci = elencoReel().map((s) => {
          const lingue = altreLingue(s);
          return `<li><a href="/r/${s}">${s}</a>${lingue.map((l) => ` · <a href="/r/${s}.${l}">${l}</a>`).join('')}</li>`;
        });
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
        res.end(htmlSemplice('FMLAB Reel Kit · anteprima', `<ul>${voci.join('') || '<li>Nessun reel: creane uno con <code>npm run nuovo</code></li>'}</ul>`));
        return true;
      }
      if (url.pathname === '/__fmlab/versione') {
        const slug = url.searchParams.get('reel') ?? '';
        res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
        res.end(slugValido(slug) ? versione(slug) : '0');
        return true;
      }
      const m = /^\/r\/([a-z0-9][a-z0-9-]*)(?:\.([a-z]{2}(?:-[a-z]{2})?))?$/i.exec(url.pathname);
      if (m) {
        const [, slug, lingua] = m;
        try {
          const pacchetto = await impacchetta(slug, lingua ?? null);
          res.writeHead(302, {Location: `${pacchetto.percorsoWeb}?modo=anteprima&ricarica=${encodeURIComponent(url.pathname)}`, 'Cache-Control': 'no-store'});
          res.end();
        } catch (e) {
          // errore nelle scene: lo mostra e riprova da solo quando il file viene corretto
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
          const testo = String(e.message ?? e).replace(/&/g, '&amp;').replace(/</g, '&lt;');
          res.end(htmlSemplice(`Errore in ${slug}`, `<pre>${testo}</pre><p>Correggi il file: questa pagina riprova da sola.</p><script>setTimeout(()=>location.reload(),2000)</script>`));
        }
        return true;
      }
      return false;
    },
  ];
}

export async function comandoAnteprima(argomenti = []) {
  const rete = argomenti.includes('rete');
  const resto = argomenti.filter((a) => a !== 'rete');
  const rotte = rotteAnteprima();

  let server;
  const host = rete ? '0.0.0.0' : '127.0.0.1';
  try {
    server = await avviaServer({porta: Number(process.env.FMLAB_PORTA ?? 4173), host, rotte});
  } catch {
    server = await avviaServer({porta: 0, host, rotte});
  }
  const percorso = resto[0] ? `/r/${resto[0]}${resto[1] ? '.' + resto[1] : ''}` : '/';
  const indirizzo = `http://localhost:${server.porta}${percorso}`;
  console.log(`\nAnteprima pronta:  ${indirizzo}`);
  if (rete) {
    const indirizzi = Object.values(os.networkInterfaces())
      .flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => `http://${i.address}:${server.porta}${percorso}`);
    console.log(`Dal telefono (stessa rete Wi-Fi):  ${indirizzi.join('   ') || '(nessun indirizzo di rete trovato)'}`);
  }
  console.log('Spazio = play/pausa · frecce = avanti/indietro · G = zone sicure · Ctrl+C per chiudere\n');
  if (!process.env.FMLAB_NON_APRIRE) {
    const comando = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', indirizzo] : [indirizzo];
    try {
      spawn(comando, args, {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
    } catch {
      // nessun browser da aprire in automatico: basta copiare l'indirizzo
    }
  }
  await new Promise(() => {}); // resta acceso finché non lo si chiude
}
