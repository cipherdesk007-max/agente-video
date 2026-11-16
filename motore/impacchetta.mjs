// FMLAB Reel Kit — prepara il "pacchetto" di un reel: scene + tempi + motore in un'unica pagina web.
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {RADICE, CACHE, ErroreFmlab, leggiJson, rel, scriviJson} from './percorsi.mjs';
import {apriReel} from './reel.mjs';
import {leggiCopione, riallinea} from './copione.mjs';
import {leggiPersonaggi} from './personaggio.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';

function pagina(slug, versione) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FMLAB · ${slug}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/stile/font/font.css?v=${versione}">
<style>
  html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
  #radice { position: absolute; left: 0; top: 0; }
</style>
</head>
<body>
<div id="radice"></div>
<script src="./pacchetto.js?v=${versione}"></script>
</body>
</html>
`;
}

/** Mette insieme una pagina del kit (codice + libreria) in un solo file per il browser. */
export async function costruisci(ingresso, fileUscita, titoloErrore = 'Errore nel codice') {
  try {
    await esbuild.build({
      stdin: {contents: ingresso, resolveDir: RADICE, sourcefile: 'ingresso.tsx', loader: 'tsx'},
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: ['chrome100', 'safari15'],
      jsx: 'automatic',
      outfile: fileUscita,
      define: {'process.env.NODE_ENV': '"production"'},
      loader: {'.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.webp': 'dataurl', '.svg': 'dataurl'},
      sourcemap: 'linked',
      keepNames: true,
      logLevel: 'silent',
    });
  } catch (e) {
    if (e && e.errors && e.errors.length) {
      const righe = await esbuild.formatMessages(e.errors, {kind: 'error', color: false, terminalWidth: 100});
      throw new ErroreFmlab(`${titoloErrore}:\n${righe.join('\n')}`);
    }
    throw e;
  }
}

export {pagina as paginaBase};

/**
 * Impacchetta il reel `slug`. Restituisce l'indirizzo della pagina (relativo al server del kit).
 * Gli errori di sintassi nelle scene vengono riportati con file e riga.
 */
export async function impacchetta(slug, variante = null, opzioni = {}) {
  const reel = apriReel(slug, variante);
  const scene = reel.scene;
  const parole = reel.parole;
  if (!fs.existsSync(scene)) throw new ErroreFmlab(`Manca ${rel(scene)} (le scene del reel).`);
  if (!fs.existsSync(parole)) {
    throw new ErroreFmlab(`Manca ${rel(parole)}: prima genera voce e tempi con\n  npm run voce ${slug}${reel.variante ? ' ' + reel.variante : ''}`);
  }
  // segni, scene o enfasi spostati nel copione senza toccare il testo: si rifanno gli agganci, la voce resta quella
  if (fs.existsSync(reel.copione)) {
    const aggiornati = riallinea(leggiCopione(fs.readFileSync(reel.copione, 'utf8')), leggiJson(parole));
    if (aggiornati) {
      scriviJson(parole, aggiornati);
      console.log(`Segni del copione cambiati: ho riallineato ${rel(parole)} senza rigenerare la voce.`);
    }
  }
  const uscita = path.join(CACHE, reel.nome);
  fs.mkdirSync(uscita, {recursive: true});
  // narratore e stile scelti per questo reel, e i personaggi tra cui si può scegliere
  const personaggi = leggiPersonaggi();
  const impostazioni = opzioni.impostazioni ?? leggiImpostazioni(slug, personaggi);
  const q = (p) => JSON.stringify(p.split(path.sep).join('/'));
  const ingresso = [
    `import * as modulo from ${q(scene)};`,
    `import dati from ${q(parole)};`,
    `import {avvia} from ${q(path.join(RADICE, 'motore', 'web', 'avvio.tsx'))};`,
    `avvia({modulo, dati, slug: ${JSON.stringify(slug)}, impostazioni: ${JSON.stringify(impostazioni)}, personaggi: ${JSON.stringify(personaggi)}});`,
  ].join('\n');
  await costruisci(ingresso, path.join(uscita, 'pacchetto.js'), `Errore nel codice delle scene (${rel(scene)})`);
  const versione = Date.now().toString(36);
  fs.writeFileSync(path.join(uscita, 'index.html'), pagina(reel.nome, versione));
  return {reel, impostazioni, personaggi, cartella: uscita, percorsoWeb: `/.fmlab/${reel.nome}/index.html`};
}
