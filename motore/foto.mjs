// FMLAB Reel Kit — fotogrammi singoli e foglio dei provini.
// Regola del kit: prima di ogni render completo si guardano i fotogrammi chiave a piena risoluzione.
import fs from 'node:fs';
import path from 'node:path';
import {CACHE, ErroreFmlab, RADICE, leggiJson, rel} from './percorsi.mjs';
import {estraiVariante} from './reel.mjs';
import {costruisci, impacchetta, paginaBase} from './impacchetta.mjs';
import {leggiPersonaggi} from './personaggio.mjs';
import {avviaServer} from './server.mjs';
import {apriPagina, avviaBrowser} from './browser.mjs';
import {impagina} from './comune/pagine.mjs';

/** Apre il reel nel browser, pronto a disegnare qualsiasi fotogramma. */
export async function apriReelNelBrowser(slug, variante, {scala = 1} = {}) {
  const pacchetto = await impacchetta(slug, variante);
  const server = await avviaServer();
  let browser;
  try {
    browser = await avviaBrowser();
    const pagina = await apriPagina(browser, `${server.url}${pacchetto.percorsoWeb}?modo=render`, {scala});
    return {
      reel: pacchetto.reel,
      pagina,
      browser,
      server,
      async chiudi() {
        await browser.close().catch(() => {});
        await server.chiudi();
      },
    };
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    await server.chiudi();
    throw e;
  }
}

/**
 * Trasforma una richiesta in secondi:
 *   "12.5" o "12,5"   → quel secondo
 *   "km"              → il segno [km] + 0,5 s (quando l'animazione è arrivata)
 *   "km+1.2"          → il segno più 1,2 s
 *   "orbita"          → a due terzi della scena "orbita"
 *   "fine"            → ultimo fotogramma
 */
export function risolviIstante(richiesta, dati) {
  const r = String(richiesta).trim();
  if (/^\d+([.,]\d+)?$/.test(r)) return {t: Number(r.replace(',', '.')), etichetta: r.replace('.', ',') + 's'};
  if (r === 'fine') return {t: dati.durata - 1 / dati.fps, etichetta: 'fine'};
  const m = /^([a-z0-9][a-z0-9_-]*)(?:\+(\d+(?:[.,]\d+)?))?$/i.exec(r);
  if (m) {
    const nome = m[1];
    const piu = m[2] !== undefined ? Number(m[2].replace(',', '.')) : null;
    if (typeof dati.segni[nome] === 'number') return {t: dati.segni[nome] + (piu ?? 0.5), etichetta: nome};
    const scena = dati.scene.find((s) => s.nome === nome);
    if (scena) return {t: piu !== null ? scena.inizio + piu : scena.inizio + (scena.fine - scena.inizio) * 0.66, etichetta: `scena-${nome}`};
  }
  throw new ErroreFmlab(
    `Non so dove andare con "${richiesta}". Puoi indicare:\n` +
      `  secondi (es. 12.5), un segno (${Object.keys(dati.segni).slice(0, 6).join(', ')}…), una scena (${dati.scene.map((s) => s.nome).join(', ')}) oppure "fine".`
  );
}

function fotogramma(t, dati) {
  const totale = Math.max(1, Math.round(dati.durata * dati.fps));
  return Math.min(totale - 1, Math.max(0, Math.round(t * dati.fps)));
}

/** npm run foto <reel> [lingua] <istante>… [guide] */
export async function comandoFoto(slug, argomenti = []) {
  const {variante, resto} = estraiVariante(slug, argomenti);
  const guide = resto.includes('guide');
  const richieste = resto.filter((a) => a !== 'guide');
  const sessione = await apriReelNelBrowser(slug, variante);
  try {
    const dati = leggiJson(sessione.reel.parole);
    const istanti = (richieste.length ? richieste : dati.scene.map((s) => s.nome)).map((r) => risolviIstante(r, dati));
    fs.mkdirSync(sessione.reel.provini, {recursive: true});
    const fatti = [];
    for (const {t, etichetta} of istanti) {
      const n = fotogramma(t, dati);
      await sessione.pagina.pagina.evaluate(([f, g]) => window.__fmlab.vai(f, g), [n, guide]).then((esito) => {
        if (esito && esito.errore) throw new ErroreFmlab(`Errore nella scena${esito.scena ? ` "${esito.scena}"` : ''} al secondo ${(n / dati.fps).toFixed(2)}:\n  ${esito.errore}`);
      });
      const file = path.join(sessione.reel.provini, `${sessione.reel.nome}-${String(n).padStart(5, '0')}-${etichetta}${guide ? '-guide' : ''}.png`);
      fs.writeFileSync(file, await sessione.pagina.png());
      fatti.push(file);
      console.log(`  ${(n / dati.fps).toFixed(2).padStart(6)} s  →  ${rel(file)}`);
    }
    if (sessione.pagina.errori.length) console.log('\nAvvisi dal browser:\n  ' + [...new Set(sessione.pagina.errori)].slice(0, 8).join('\n  '));
    return fatti;
  } finally {
    await sessione.chiudi();
  }
}

/** Istanti da controllare: uno per ogni segno (a cose arrivate) e la chiusura di ogni scena. */
export function istantiChiave(dati) {
  const istanti = [];
  for (const [nome, t] of Object.entries(dati.segni)) istanti.push({t: t + 0.55, etichetta: `[${nome}]`});
  for (const s of dati.scene) {
    istanti.push({t: s.inizio + 0.45, etichetta: `▶ ${s.nome}`});
    istanti.push({t: Math.max(s.inizio, s.fine - 0.2), etichetta: `■ ${s.nome}`});
  }
  istanti.sort((a, b) => a.t - b.t);
  // toglie i doppioni troppo vicini
  const scelti = [];
  for (const i of istanti) {
    if (!scelti.length || i.t - scelti[scelti.length - 1].t > 0.3) scelti.push(i);
  }
  return scelti.map((i) => ({...i, t: Math.min(dati.durata - 1 / dati.fps, Math.max(0, i.t))}));
}

/** npm run provini <reel> [lingua] [guide] → un'unica immagine con tutti i momenti chiave. */
export async function comandoProvini(slug, argomenti = []) {
  const {variante, resto} = estraiVariante(slug, argomenti);
  const guide = resto.includes('guide');
  const sessione = await apriReelNelBrowser(slug, variante, {scala: 0.25});
  try {
    const dati = leggiJson(sessione.reel.parole);
    const pagine = impagina(dati.parole);
    const istanti = istantiChiave(dati);
    const celle = [];
    for (const {t, etichetta} of istanti) {
      const n = fotogramma(t, dati);
      const esito = await sessione.pagina.pagina.evaluate(([f, g]) => window.__fmlab.vai(f, g), [n, guide]);
      if (esito && esito.errore) throw new ErroreFmlab(`Errore nella scena${esito.scena ? ` "${esito.scena}"` : ''} al secondo ${(n / dati.fps).toFixed(2)}:\n  ${esito.errore}`);
      const jpeg = await sessione.pagina.jpeg(88);
      const ora = n / dati.fps;
      const pagina = pagine.find((p) => ora >= p.mostraDa && ora < p.mostraA);
      celle.push({
        src: `data:image/jpeg;base64,${jpeg.toString('base64')}`,
        tempo: ora.toFixed(2).replace('.', ','),
        etichetta,
        parole: pagina ? pagina.parole.map((p) => p.testo).join(' ') : '—',
      });
    }
    const colonne = Math.min(7, Math.max(4, Math.ceil(Math.sqrt(celle.length * 1.9))));
    const html = `<!doctype html><meta charset="utf-8"><style>
      body{margin:0;background:#0b0d14;color:#fff;font:600 15px/1.25 system-ui,sans-serif;padding:18px}
      h1{font-size:20px;margin:0 0 14px}
      .g{display:grid;grid-template-columns:repeat(${colonne},270px);gap:14px}
      .c img{display:block;width:270px;height:480px;border-radius:8px}
      .t{margin-top:6px;color:#ffd23f}.p{color:#aab3d6;font-weight:500;font-size:13px}
    </style><h1>Provini · ${sessione.reel.nome} · ${dati.motore} · ${dati.durata.toFixed(1).replace('.', ',')} s</h1>
    <div class="g">${celle.map((c) => `<div class="c"><img src="${c.src}"><div class="t">${c.tempo} s · ${c.etichetta}</div><div class="p">${c.parole}</div></div>`).join('')}</div>`;
    const foglio = await sessione.browser.newPage({viewport: {width: colonne * 284 + 36, height: 600}});
    await foglio.setContent(html, {waitUntil: 'load'});
    const file = path.join(sessione.reel.dir, `provini${sessione.reel.suffisso}.jpg`);
    await foglio.screenshot({path: file, fullPage: true, type: 'jpeg', quality: 88});
    await foglio.close();
    console.log(`Provini (${celle.length} momenti chiave): ${rel(file)}\nAprilo e controlla che in ogni riquadro ci sia l'immagine giusta per le parole scritte sotto.`);
    return file;
  } finally {
    await sessione.chiudi();
  }
}

/**
 * Foglio di prova di un personaggio (tutti i gesti, o le pose, in un'unica immagine) e la sua miniatura
 * per il pannello (personaggi/<id>/anteprima.png).
 */
export async function provaPersonaggio(id, uscita, {libere, ingrandimento = 1, colonne = 4} = {}) {
  const tutti = leggiPersonaggi();
  const config = tutti[id];
  if (!config) throw new ErroreFmlab(`Il personaggio "${id}" non esiste.`);
  // le pose che sono un altro disegno intero (le braccia conserte): servono anche quelle figure
  const figure = Object.fromEntries(
    Object.values(config.disegni ?? {})
      .filter((d) => d.personaggio && tutti[d.personaggio])
      .map((d) => [d.personaggio, tutti[d.personaggio]])
  );
  const cartella = path.join(CACHE, `prova-${id}`);
  fs.mkdirSync(cartella, {recursive: true});
  const q = (p) => JSON.stringify(p.split(path.sep).join('/'));
  const modulo = q(path.join(RADICE, 'motore', 'web', 'prova.tsx'));
  const scelte = JSON.stringify({libere, ingrandimento, colonne, figure});
  const ingresso = `import {avviaProva} from ${modulo};\navviaProva(${JSON.stringify(config)}, {...${scelte}, solo: new URLSearchParams(location.search).has('solo')});`;
  await costruisci(ingresso, path.join(cartella, 'pacchetto.js'), 'Errore nel foglio di prova');
  fs.writeFileSync(path.join(cartella, 'index.html'), paginaBase(`prova-${id}`, Date.now().toString(36)).replace('background: #000;', 'background: transparent;'));
  const server = await avviaServer();
  const browser = await avviaBrowser();
  try {
    const pagina = await browser.newPage({viewport: {width: Math.max(600, colonne * 520 * ingrandimento + (colonne - 1) * 16 + 40), height: 900}});
    const errori = [];
    pagina.on('pageerror', (e) => errori.push(String(e.message ?? e)));
    const apri = async (coda) => {
      await pagina.goto(`${server.url}/.fmlab/prova-${id}/index.html${coda}`, {waitUntil: 'load'});
      await pagina.evaluate(() => window.__prova);
      if (errori.length) throw new ErroreFmlab(`Errore nel disegnare il personaggio "${id}":\n  ${errori.join('\n  ')}`);
    };
    // miniatura su fondo trasparente (non quando si provano mosse scritte a mano)
    if (!libere) {
      await apri('?solo=1');
      await pagina.locator('#figura').screenshot({path: path.join(RADICE, 'personaggi', id, 'anteprima.png'), omitBackground: true, type: 'png'});
    }
    // foglio con tutti i gesti
    await apri('');
    await pagina.addStyleTag({content: 'html,body{overflow:visible!important;background:#05070a!important} #radice{position:static!important}'});
    await pagina.screenshot(uscita.toLowerCase().endsWith('.png') ? {path: uscita, fullPage: true, type: 'png'} : {path: uscita, fullPage: true, type: 'jpeg', quality: 90});
    return uscita;
  } finally {
    await browser.close().catch(() => {});
    await server.chiudi();
  }
}

/**
 * Un personaggio con i livelli, a riposo, deve essere identico alla sua immagine di partenza: le parti ritagliate
 * devono coprire esattamente il punto da cui sono state tolte. Disegna il personaggio due volte (con i livelli e
 * dall'immagine intera) e misura la differenza. Restituisce null se il personaggio non ha livelli.
 */
export async function confrontaRiposo(id) {
  const config = leggiPersonaggi()[id];
  if (!config || config.tipo !== 'pupazzo' || !config.corpo || !(config.livelli ?? []).some((l) => l.file)) return null;
  const q = (p) => JSON.stringify(p.split(path.sep).join('/'));
  const modulo = q(path.join(RADICE, 'motore', 'web', 'prova.tsx'));
  const versioni = {livelli: config, intera: {...config, corpo: undefined, livelli: undefined, ossa: {}}};
  const server = await avviaServer();
  const browser = await avviaBrowser();
  try {
    const pagina = await browser.newPage({viewport: {width: 900, height: 900}});
    const errori = [];
    pagina.on('pageerror', (e) => errori.push(String(e.message ?? e)));
    const foto = {};
    for (const [nome, versione] of Object.entries(versioni)) {
      const cartella = path.join(CACHE, `riposo-${id}-${nome}`);
      fs.mkdirSync(cartella, {recursive: true});
      await costruisci(`import {avviaProva} from ${modulo};\navviaProva(${JSON.stringify(versione)}, {solo: true});`, path.join(cartella, 'pacchetto.js'), 'Errore nel disegnare il personaggio');
      fs.writeFileSync(path.join(cartella, 'index.html'), paginaBase(`riposo-${id}-${nome}`, Date.now().toString(36)).replace('background: #000;', 'background: transparent;'));
      await pagina.goto(`${server.url}/.fmlab/riposo-${id}-${nome}/index.html`, {waitUntil: 'load'});
      await pagina.evaluate(() => window.__prova);
      if (errori.length) throw new ErroreFmlab(`Errore nel disegnare il personaggio "${id}":\n  ${errori.join('\n  ')}`);
      foto[nome] = `data:image/png;base64,${(await pagina.locator('#figura').screenshot({omitBackground: true, type: 'png'})).toString('base64')}`;
    }
    return await pagina.evaluate(async ([a, b]) => {
      const carica = async (indirizzo) => {
        const img = new Image();
        img.src = indirizzo;
        await img.decode();
        const tela = document.createElement('canvas');
        tela.width = img.naturalWidth;
        tela.height = img.naturalHeight;
        const g = tela.getContext('2d');
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, tela.width, tela.height);
      };
      const A = await carica(a);
      const B = await carica(b);
      if (A.width !== B.width || A.height !== B.height) return {media: 255, diversi: 1, massima: 255};
      const n = A.width * A.height;
      let somma = 0;
      let diversi = 0;
      let massima = 0;
      for (let i = 0; i < n * 4; i += 4) {
        const alfaA = A.data[i + 3] / 255;
        const alfaB = B.data[i + 3] / 255;
        let d = Math.abs(alfaA - alfaB) * 255;
        for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(A.data[i + c] * alfaA - B.data[i + c] * alfaB));
        somma += d;
        if (d > 32) diversi++;
        if (d > massima) massima = d;
      }
      return {media: somma / n, diversi: diversi / n, massima};
    }, [foto.livelli, foto.intera]);
  } finally {
    await browser.close().catch(() => {});
    await server.chiudi();
  }
}

/**
 * Disegna il catalogo: tutte le scene pronte, gli oggetti 3D, i grafici, le icone e le scritte in un foglio solo.
 * Restituisce i nomi dei pezzi disegnati. Se un pezzo della libreria si rompe, l'errore esce qui.
 */
export async function catalogo(uscita = path.join(RADICE, 'catalogo.jpg')) {
  const cartella = path.join(CACHE, 'catalogo');
  fs.mkdirSync(cartella, {recursive: true});
  const q = (p) => JSON.stringify(p.split(path.sep).join('/'));
  const ingresso = `import {avviaCatalogo} from ${q(path.join(RADICE, 'motore', 'web', 'catalogo.tsx'))};\navviaCatalogo();`;
  await costruisci(ingresso, path.join(cartella, 'pacchetto.js'), 'Errore nel catalogo');
  fs.writeFileSync(path.join(cartella, 'index.html'), paginaBase('catalogo', Date.now().toString(36)));
  const server = await avviaServer();
  const browser = await avviaBrowser();
  try {
    const pagina = await browser.newPage({viewport: {width: 6 * 270 + 5 * 18 + 56, height: 900}});
    const errori = [];
    pagina.on('pageerror', (e) => errori.push(String(e.message ?? e)));
    pagina.on('console', (m) => {
      if (m.type() === 'error') errori.push(m.text());
    });
    await pagina.goto(`${server.url}/.fmlab/catalogo/index.html`, {waitUntil: 'load'});
    const nomi = await pagina.evaluate(() => window.__prova);
    if (errori.length) throw new ErroreFmlab(`Un pezzo della libreria non si disegna:\n  ${[...new Set(errori)].slice(0, 6).join('\n  ')}`);
    await pagina.addStyleTag({content: 'html,body{overflow:visible!important;background:#05070a!important} #radice{position:static!important}'});
    await pagina.screenshot({path: uscita, fullPage: true, type: 'jpeg', quality: 88});
    return {uscita, nomi};
  } finally {
    await browser.close().catch(() => {});
    await server.chiudi();
  }
}

/** npm run catalogo */
export async function comandoCatalogo() {
  const {uscita, nomi} = await catalogo();
  console.log(`Catalogo: ${rel(uscita)}  (${nomi.length} pezzi disegnati)`);
  console.log('Come si usa ogni pezzo: CATALOGO.md');
}

