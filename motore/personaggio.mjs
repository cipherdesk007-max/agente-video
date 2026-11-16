// FMLAB Reel Kit — prepara un narratore partendo da UNA immagine.
//
//   npm run personaggio nuovo <id> <immagine> ["Nome"]
//       toglie lo sfondo a tinta unita e crea personaggi/<id>/ con base.png e personaggio.json
//   npm run personaggio bocca <id> <x1,y1> <x2,y2> <apertura>
//       crea le bocche "mezza" e "chiusa" (l'immagine di partenza deve avere la bocca aperta)
//   npm run personaggio occhi <id> <x1,y1> <x2,y2> <su> <giu> [<x1,y1> <x2,y2> <su> <giu>]
//       crea gli occhi socchiusi e chiusi, per farlo sbattere le palpebre (uno o due occhi)
//   npm run personaggio scritta <id> <x1,y1> <x2,y2> [sposta <dx,dy>]
//       se ha una scritta o un logo addosso: prepara il pezzo che li tiene leggibili quando lo specchi
//   npm run personaggio pulisci <id>
//       toglie i puntini rimasti attorno alla figura (lo fa già "nuovo": serve per i personaggi creati prima)
//   npm run personaggio livello <id>
//       ritaglia le parti descritte alla voce "livelli" di personaggio.json (un braccio che passa davanti al
//       corpo…): crea un'immagine per ogni parte e il corpo senza quelle parti
//   npm run personaggio griglia <id> [<x1,y1> <x2,y2>]
//       l'immagine con sopra una griglia numerata, per leggere le coordinate (tutta, o un ritaglio ingrandito)
//   npm run personaggio prova <id> [mosse.json]
//       disegna il personaggio in tutte le pose e i gesti, per controllare che testa, braccia e mani si muovano
//       bene; con un file di mosse scritte a mano ([{"titolo": "…", "mosse": {"braccio": {"ruota": 20}}}])
//       disegna quelle: serve per mettere a punto pose e limiti
//   npm run personaggio elenco
//
// Le coordinate sono in pixel dell'immagine. Per la bocca: i due angoli, da sinistra a destra, sulla
// linea del labbro di sopra; apertura = altezza in pixel tra le labbra al centro.
// Per ogni occhio: i due angoli (da sinistra a destra); su = di quanti pixel l'occhio sale sopra la linea
// tra i due angoli, ciglia comprese; giu = di quanti pixel scende sotto.
// Tutto il lavoro sulle immagini viene fatto dentro Chrome: non servono altri programmi.
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, RADICE, leggiJson, rel, scriviJson, slugValido} from './percorsi.mjs';
import {avviaBrowser} from './browser.mjs';

export const CARTELLA_PERSONAGGI = path.join(RADICE, 'personaggi');

/** Tutti i personaggi disponibili: {id: configurazione}. */
export function leggiPersonaggi() {
  const mappa = {};
  if (!fs.existsSync(CARTELLA_PERSONAGGI)) return mappa;
  for (const voce of fs.readdirSync(CARTELLA_PERSONAGGI, {withFileTypes: true})) {
    const file = path.join(CARTELLA_PERSONAGGI, voce.name, 'personaggio.json');
    if (!voce.isDirectory() || !fs.existsSync(file)) continue;
    try {
      mappa[voce.name] = {id: voce.name, ...leggiJson(file)};
    } catch (e) {
      throw new ErroreFmlab(`${rel(file)} non è un JSON valido: ${e.message}`);
    }
  }
  return mappa;
}

function apri(id) {
  if (!slugValido(id ?? '')) throw new ErroreFmlab('Indica il nome del personaggio (lettere minuscole, numeri, trattini). Elenco: npm run personaggio elenco');
  const dir = path.join(CARTELLA_PERSONAGGI, id);
  const file = path.join(dir, 'personaggio.json');
  if (!fs.existsSync(file)) throw new ErroreFmlab(`Il personaggio "${id}" non esiste. Crealo con: npm run personaggio nuovo ${id} <immagine>`);
  return {dir, file, config: leggiJson(file)};
}

function comeDataUrl(file) {
  const est = path.extname(file).toLowerCase();
  const tipo = est === '.png' ? 'image/png' : est === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${tipo};base64,${fs.readFileSync(file).toString('base64')}`;
}

function salvaPng(file, dataUrl) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

async function nelBrowser(funzione, argomento) {
  const browser = await avviaBrowser();
  try {
    const pagina = await browser.newPage();
    return await pagina.evaluate(funzione, argomento);
  } finally {
    await browser.close().catch(() => {});
  }
}

// ───────── funzioni che girano dentro la pagina ─────────

async function scontornaInPagina({sorgente, tolleranza}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(img, 0, 0);
  const dati = ctx.getImageData(0, 0, L, A);
  const d = dati.data;

  // se l'immagine ha già la trasparenza, non c'è niente da togliere
  let trasparenti = 0;
  for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) trasparenti++;
  if (trasparenti > d.length / (4 * 97) / 20) return {png: tela.toDataURL('image/png'), larghezza: L, altezza: A, sfondo: 'già trasparente', tolti: 0};

  // colore dello sfondo: mediana dei pixel lungo i bordi alto, sinistro e destro
  const campioni = [[], [], []];
  const prendi = (x, y) => {
    const i = (y * L + x) * 4;
    campioni[0].push(d[i]);
    campioni[1].push(d[i + 1]);
    campioni[2].push(d[i + 2]);
  };
  for (let x = 0; x < L; x += 3) prendi(x, 0);
  for (let y = 0; y < A; y += 3) {
    prendi(0, y);
    prendi(L - 1, y);
  }
  const mediana = (v) => v.sort((a, b) => a - b)[v.length >> 1];
  const sfondo = campioni.map(mediana);
  const simile = (i) => Math.abs(d[i] - sfondo[0]) + Math.abs(d[i + 1] - sfondo[1]) + Math.abs(d[i + 2] - sfondo[2]) <= tolleranza * 3;

  // riempimento a macchia d'olio dai bordi: toglie solo lo sfondo collegato all'esterno,
  // così il nero di una maglietta o di un paio di occhiali resta al suo posto
  const fuori = new Uint8Array(L * A);
  const coda = new Int32Array(L * A);
  let testa = 0;
  let fine = 0;
  const semina = (x, y) => {
    const p = y * L + x;
    if (!fuori[p] && simile(p * 4)) {
      fuori[p] = 1;
      coda[fine++] = p;
    }
  };
  for (let x = 0; x < L; x++) {
    semina(x, 0);
    semina(x, A - 1);
  }
  for (let y = 0; y < A; y++) {
    semina(0, y);
    semina(L - 1, y);
  }
  while (testa < fine) {
    const p = coda[testa++];
    const x = p % L;
    const y = (p - x) / L;
    if (x > 0) semina(x - 1, y);
    if (x < L - 1) semina(x + 1, y);
    if (y > 0) semina(x, y - 1);
    if (y < A - 1) semina(x, y + 1);
  }

  // bordo morbido: i pixel di confine prendono una trasparenza in base a quanti vicini sono sfondo
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      const p = y * L + x;
      const i = p * 4;
      if (fuori[p]) {
        d[i + 3] = 0;
        continue;
      }
      let vicini = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= L || yy >= A || fuori[yy * L + xx]) vicini++;
        }
      }
      if (vicini > 0) {
        const alfa = 1 - vicini / 12;
        // toglie la "sbavatura" del colore di sfondo dai pixel di confine
        for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, (d[i + k] - sfondo[k] * (1 - alfa)) / alfa));
        d[i + 3] = Math.round(alfa * 255);
      }
    }
  }
  ctx.putImageData(dati, 0, 0);
  return {png: tela.toDataURL('image/png'), larghezza: L, altezza: A, sfondo: `rgb(${sfondo.join(',')})`, tolti: Math.round((fine / (L * A)) * 100)};
}

/**
 * "Chiude" una o più aperture (bocca, occhi) schiacciandole verso la linea tra i due angoli, e restituisce
 * solo il ritaglio modificato, con la sua posizione: un pezzo piccolo da sovrapporre all'immagine base.
 */
async function chiudiInPagina({sorgente, tagli, chiusura}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(img, 0, 0);
  const origine = ctx.getImageData(0, 0, L, A);
  const s = origine.data;
  const esito = ctx.createImageData(L, A);
  const e = esito.data;
  e.set(s);
  const liscio = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const campiona = (x, y, c) => {
    const x0 = Math.max(0, Math.min(L - 2, Math.floor(x)));
    const y0 = Math.max(0, Math.min(A - 2, Math.floor(y)));
    const fx = Math.max(0, Math.min(1, x - x0));
    const fy = Math.max(0, Math.min(1, y - y0));
    const i = (y0 * L + x0) * 4 + c;
    return s[i] * (1 - fx) * (1 - fy) + s[i + 4] * fx * (1 - fy) + s[i + L * 4] * (1 - fx) * fy + s[i + L * 4 + 4] * fx * fy;
  };
  const riquadro = {x0: L, y0: A, x1: 0, y1: 0};

  for (const taglio of tagli) {
    const {x1, y1, x2, y2, apertura} = taglio;
    // sistema di riferimento: u lungo la linea tra i due angoli, v perpendicolare (verso dove si apre)
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const mezza = Math.hypot(x2 - x1, y2 - y1) / 2;
    const ux = (x2 - x1) / (2 * mezza);
    const uy = (y2 - y1) / (2 * mezza);
    const vx = -uy;
    const vy = ux;
    const sfuma = taglio.sfuma ?? Math.max(40, apertura * 2.6);
    const margine = mezza + apertura + sfuma + 12;
    const xMin = Math.max(0, Math.floor(cx - margine));
    const xMax = Math.min(L - 1, Math.ceil(cx + margine));
    const yMin = Math.max(0, Math.floor(cy - margine));
    const yMax = Math.min(A - 1, Math.ceil(cy + margine));
    riquadro.x0 = Math.min(riquadro.x0, xMin);
    riquadro.y0 = Math.min(riquadro.y0, yMin);
    riquadro.x1 = Math.max(riquadro.x1, xMax);
    riquadro.y1 = Math.max(riquadro.y1, yMax);
    const profilo = (u) => Math.pow(1 - u * u, 0.75);
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const u = (dx * ux + dy * uy) / mezza;
        const v = dx * vx + dy * vy;
        if (Math.abs(u) >= 1 || v <= 0) continue;
        const aperta = apertura * profilo(u);
        if (aperta < 0.5) continue;
        const chiusa = aperta * (1 - chiusura * 0.95);
        let vSorgente;
        if (v <= chiusa) vSorgente = (v * aperta) / chiusa;
        else {
          const t = (v - chiusa) / sfuma;
          if (t >= 1) continue;
          vSorgente = v + (aperta - chiusa) * (1 - liscio(t));
        }
        const sx = cx + u * mezza * ux + vSorgente * vx;
        const sy = cy + u * mezza * uy + vSorgente * vy;
        const i = (y * L + x) * 4;
        for (let c = 0; c < 4; c++) e[i + c] = campiona(sx, sy, c);
      }
    }
    if (chiusura >= 0.95) {
      // del tutto chiusa: quello che restava dentro diventerebbe una riga seghettata, quindi sopra ci
      // passa una linea morbida del colore più scuro trovato nell'apertura (la fessura tra le labbra, le ciglia)
      let scuro = [60, 30, 30];
      let minimo = Infinity;
      for (let k = -8; k <= 8; k++) {
        for (let q = 0.2; q <= 0.8; q += 0.1) {
          const px = cx + (k / 10) * mezza * ux + apertura * q * vx;
          const py = cy + (k / 10) * mezza * uy + apertura * q * vy;
          const somma = campiona(px, py, 0) + campiona(px, py, 1) + campiona(px, py, 2);
          if (somma < minimo) {
            minimo = somma;
            scuro = [campiona(px, py, 0), campiona(px, py, 1), campiona(px, py, 2)];
          }
        }
      }
      const spessore = taglio.linea ?? 3.1;
      for (let y = yMin; y <= yMax; y++) {
        for (let x = xMin; x <= xMax; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const u = (dx * ux + dy * uy) / mezza;
          if (Math.abs(u) >= 1) continue;
          const v = dx * vx + dy * vy;
          const centro = (apertura * profilo(u) * (1 - chiusura * 0.95)) / 2;
          const forza = Math.max(0, 1 - Math.abs(v - centro) / spessore) * Math.min(1, (1 - Math.abs(u)) * 7);
          if (forza <= 0) continue;
          const i = (y * L + x) * 4;
          for (let c = 0; c < 3; c++) e[i + c] = e[i + c] * (1 - forza) + scuro[c] * forza;
        }
      }
    }
  }
  ctx.putImageData(esito, 0, 0);
  // il pezzo da salvare è solo la parte che è cambiata davvero (più un filo di margine)
  const stretto = {x0: L, y0: A, x1: 0, y1: 0};
  for (let y = riquadro.y0; y <= riquadro.y1; y++) {
    for (let x = riquadro.x0; x <= riquadro.x1; x++) {
      const i = (y * L + x) * 4;
      if (Math.abs(e[i] - s[i]) + Math.abs(e[i + 1] - s[i + 1]) + Math.abs(e[i + 2] - s[i + 2]) + Math.abs(e[i + 3] - s[i + 3]) > 2) {
        if (x < stretto.x0) stretto.x0 = x;
        if (x > stretto.x1) stretto.x1 = x;
        if (y < stretto.y0) stretto.y0 = y;
        if (y > stretto.y1) stretto.y1 = y;
      }
    }
  }
  if (stretto.x1 < stretto.x0) throw new Error('Con queste coordinate non cambia niente: controlla angoli e apertura.');
  const x0 = Math.max(0, stretto.x0 - 3);
  const y0 = Math.max(0, stretto.y0 - 3);
  const w = Math.min(L - 1, stretto.x1 + 3) - x0 + 1;
  const h = Math.min(A - 1, stretto.y1 + 3) - y0 + 1;
  const pezzo = document.createElement('canvas');
  pezzo.width = w;
  pezzo.height = h;
  pezzo.getContext('2d').drawImage(tela, x0, y0, w, h, 0, 0, w, h);
  return {png: pezzo.toDataURL('image/png'), x: x0, y: y0};
}

/**
 * Occhi chiusi o socchiusi: sopra l'occhio viene dipinta la palpebra (con il colore della pelle preso
 * appena sotto l'occhio) e, lungo il bordo della palpebra, la riga scura delle ciglia.
 * Non deforma niente attorno: occhiali e sopracciglia restano fermi.
 */
async function occhiInPagina({sorgente, occhi, chiusura}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(img, 0, 0);
  const origine = ctx.getImageData(0, 0, L, A);
  const s = origine.data;
  const esito = ctx.createImageData(L, A);
  const e = esito.data;
  e.set(s);
  const limita = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const pixel = (x, y) => {
    const i = (Math.max(0, Math.min(A - 1, Math.round(y))) * L + Math.max(0, Math.min(L - 1, Math.round(x)))) * 4;
    return [s[i], s[i + 1], s[i + 2]];
  };
  const riquadro = {x0: L, y0: A, x1: 0, y1: 0};

  for (const occhio of occhi) {
    const {x1, y1, x2, y2, su, giu} = occhio;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const mezza = Math.hypot(x2 - x1, y2 - y1) / 2;
    const ux = (x2 - x1) / (2 * mezza);
    const uy = (y2 - y1) / (2 * mezza);
    // "in alto" rispetto alla linea tra i due angoli
    const nx = uy;
    const ny = -ux;
    const punto = (lungo, alto) => [cx + lungo * mezza * ux + alto * nx, cy + lungo * mezza * uy + alto * ny];

    // colore della pelle: mediana di una striscia appena sotto l'occhio
    const campioni = [[], [], []];
    for (let k = -5; k <= 5; k++) {
      for (let q = giu + 4; q <= giu + 9; q++) {
        const c = pixel(...punto(k / 10, -q));
        for (let j = 0; j < 3; j++) campioni[j].push(c[j]);
      }
    }
    const pelle = campioni.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
    // colore delle ciglia: il più scuro che c'è nell'occhio
    let scuro = [40, 20, 15];
    let minimo = Infinity;
    for (let k = -8; k <= 8; k++) {
      for (let q = 0; q <= su; q += 2) {
        const c = pixel(...punto(k / 10, q));
        const somma = c[0] + c[1] + c[2];
        if (somma < minimo) {
          minimo = somma;
          scuro = c;
        }
      }
    }

    const margine = mezza + su + giu + 6;
    const xMin = Math.max(0, Math.floor(cx - margine));
    const xMax = Math.min(L - 1, Math.ceil(cx + margine));
    const yMin = Math.max(0, Math.floor(cy - margine));
    const yMax = Math.min(A - 1, Math.ceil(cy + margine));
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const lungo = (dx * ux + dy * uy) / mezza;
        const alto = dx * nx + dy * ny;
        const assoluto = Math.abs(lungo);
        if (assoluto >= 1.05) continue;
        const f = Math.max(0, 1 - lungo * lungo);
        const sopra = su * Math.pow(f, 0.55) + 1.5;
        const sotto = -giu * Math.pow(f, 0.8);
        const bordo = sopra - 3 + (sotto - (sopra - 3)) * chiusura;
        const versoAngoli = limita((1 - assoluto) * 9);
        // palpebra
        const copertura = limita((sopra - alto) / 1.4) * limita((alto - bordo) / 1.0 + 0.5) * versoAngoli;
        const i = (y * L + x) * 4;
        if (copertura > 0) {
          const ombra = 1 - 0.1 * limita((alto - sotto) / Math.max(1, sopra - sotto));
          for (let c = 0; c < 3; c++) e[i + c] = e[i + c] * (1 - copertura) + pelle[c] * ombra * copertura;
        }
        // ciglia lungo il bordo della palpebra
        const spessore = 0.9 + 2.1 * Math.sqrt(f);
        const riga = limita((spessore / 2 + 0.6 - Math.abs(alto - bordo)) / 1.2) * limita((1.03 - assoluto) * 12);
        if (riga > 0) {
          for (let c = 0; c < 3; c++) e[i + c] = e[i + c] * (1 - riga) + scuro[c] * riga;
        }
        if (copertura > 0 || riga > 0) {
          riquadro.x0 = Math.min(riquadro.x0, x - 2);
          riquadro.y0 = Math.min(riquadro.y0, y - 2);
          riquadro.x1 = Math.max(riquadro.x1, x + 2);
          riquadro.y1 = Math.max(riquadro.y1, y + 2);
        }
      }
    }
  }
  ctx.putImageData(esito, 0, 0);
  riquadro.x0 = Math.max(0, riquadro.x0);
  riquadro.y0 = Math.max(0, riquadro.y0);
  riquadro.x1 = Math.min(L - 1, riquadro.x1);
  riquadro.y1 = Math.min(A - 1, riquadro.y1);
  const w = riquadro.x1 - riquadro.x0 + 1;
  const h = riquadro.y1 - riquadro.y0 + 1;
  const pezzo = document.createElement('canvas');
  pezzo.width = w;
  pezzo.height = h;
  pezzo.getContext('2d').drawImage(tela, riquadro.x0, riquadro.y0, w, h, 0, 0, w, h);
  return {png: pezzo.toDataURL('image/png'), x: riquadro.x0, y: riquadro.y0};
}

/** L'immagine (o un suo ritaglio ingrandito) con una griglia numerata e, se ci sono, le ossa disegnate sopra. */
/**
 * Pulisce il bordo di un'immagine scontornata. Attorno alla figura restano spesso dei puntini (l'alone del
 * vecchio sfondo): su un fondo scuro non si notano, ma si vedono appena una parte passa davanti a un'altra.
 * Toglie le macchie staccate dalla figura e i pixel mezzi trasparenti che non toccano la figura.
 */
async function pulisciInPagina({sorgente}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext('2d', {willReadFrequently: true});
  ctx.drawImage(img, 0, 0);
  const dati = ctx.getImageData(0, 0, L, A);
  const d = dati.data;
  const n = L * A;
  const PIENO = 200;
  // 1) le parti piene della figura: gruppi di pixel pieni che si toccano; i gruppi minuscoli sono puntini
  const gruppo = new Int32Array(n).fill(-1);
  const aree = [];
  const pila = [];
  for (let inizio = 0; inizio < n; inizio++) {
    if (d[inizio * 4 + 3] < PIENO || gruppo[inizio] !== -1) continue;
    const numero = aree.length;
    let area = 0;
    gruppo[inizio] = numero;
    pila.push(inizio);
    while (pila.length) {
      const i = pila.pop();
      area++;
      const x = i % L;
      if (x > 0 && d[(i - 1) * 4 + 3] >= PIENO && gruppo[i - 1] === -1) (gruppo[i - 1] = numero), pila.push(i - 1);
      if (x < L - 1 && d[(i + 1) * 4 + 3] >= PIENO && gruppo[i + 1] === -1) (gruppo[i + 1] = numero), pila.push(i + 1);
      if (i >= L && d[(i - L) * 4 + 3] >= PIENO && gruppo[i - L] === -1) (gruppo[i - L] = numero), pila.push(i - L);
      if (i < n - L && d[(i + L) * 4 + 3] >= PIENO && gruppo[i + L] === -1) (gruppo[i + L] = numero), pila.push(i + L);
    }
    aree.push(area);
  }
  const soglia = Math.max(80, Math.max(0, ...aree) * 0.001);
  const figura = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (gruppo[i] !== -1 && aree[gruppo[i]] >= soglia) figura[i] = 1;
  // 2) resta solo la figura, più i pixel mezzi trasparenti che la toccano (il suo bordo morbido)
  let tolti = 0;
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      const i = y * L + x;
      if (figura[i] || d[i * 4 + 3] === 0) continue;
      let tocca = false;
      for (let oy = -1; oy <= 1 && !tocca; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const xx = x + ox;
          const yy = y + oy;
          if (xx >= 0 && yy >= 0 && xx < L && yy < A && figura[yy * L + xx]) {
            tocca = true;
            break;
          }
        }
      }
      if (!tocca || d[i * 4 + 3] >= PIENO) {
        d[i * 4 + 3] = 0;
        tolti++;
      }
    }
  }
  ctx.putImageData(dati, 0, 0);
  return {png: tela.toDataURL('image/png'), tolti};
}

/**
 * Scritte e loghi sui vestiti: quando il personaggio viene specchiato si leggerebbero al contrario.
 * Qui si prepara un pezzo in cui la scritta è già ribaltata sul posto: specchiando tutta la figura torna dritta.
 * Come: si trova l'inchiostro dentro il riquadro (quello che stacca dal colore del tessuto), si ricostruisce
 * il tessuto sotto, poi si riporta l'inchiostro ribaltato. Le linee del disegno che attraversano il riquadro
 * (un risvolto, una tasca) non vengono toccate.
 */
async function scrittaInPagina({sorgente, rett, sposta}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const LW = img.naturalWidth;
  const LH = img.naturalHeight;
  const tela = document.createElement('canvas');
  tela.width = LW;
  tela.height = LH;
  const g = tela.getContext('2d', {willReadFrequently: true});
  g.drawImage(img, 0, 0);
  const dx = Math.round(sposta[0]);
  const dy = Math.round(sposta[1]);
  const bordo = 6 + Math.max(Math.abs(dx), Math.abs(dy));
  const ex1 = Math.max(0, Math.floor(rett[0] - bordo));
  const ey1 = Math.max(0, Math.floor(rett[1] - bordo));
  const ex2 = Math.min(LW, Math.ceil(rett[2] + bordo));
  const ey2 = Math.min(LH, Math.ceil(rett[3] + bordo));
  const W = ex2 - ex1;
  const H = ey2 - ey1;
  const dati = g.getImageData(ex1, ey1, W, H);
  const p = dati.data;
  const n = W * H;
  const rx1 = rett[0] - ex1;
  const ry1 = rett[1] - ey1;
  const rx2 = rett[2] - ex1;
  const ry2 = rett[3] - ey1;
  const dentro = (x, y) => x >= rx1 && x < rx2 && y >= ry1 && y < ry2;

  // 1) il colore del tessuto: la mediana di una cornice larga 4 pixel, appena dentro il riquadro
  const cornice = [[], [], []];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!dentro(x, y) || (x >= rx1 + 4 && x < rx2 - 4 && y >= ry1 + 4 && y < ry2 - 4)) continue;
      const i = (y * W + x) * 4;
      if (p[i + 3] < 250) continue;
      for (let c = 0; c < 3; c++) cornice[c].push(p[i + c]);
    }
  }
  if (cornice[0].length < 40) return {errore: 'il riquadro esce dalla figura: deve stare tutto sul vestito'};
  const fondo = cornice.map((v) => v.sort((a, b) => a - b)[v.length >> 1]);
  const stacco = new Float32Array(n);
  for (let i = 0; i < n; i++) stacco[i] = Math.hypot(p[i * 4] - fondo[0], p[i * 4 + 1] - fondo[1], p[i * 4 + 2] - fondo[2]);

  // 2) l'inchiostro: macchie che staccano nettamente dal tessuto; quelle che escono dal riquadro sono linee
  //    del disegno (un risvolto, una tasca) e restano dove sono
  const FORTE = 90;
  const macchia = new Int32Array(n).fill(-1);
  const inchiostro = new Uint8Array(n);
  const estraneo = new Uint8Array(n);
  let tenute = 0;
  let lasciate = 0;
  const pila = [];
  for (let inizio = 0; inizio < n; inizio++) {
    if (stacco[inizio] < FORTE || macchia[inizio] !== -1) continue;
    const pixel = [];
    let fuori = false;
    macchia[inizio] = 1;
    pila.push(inizio);
    while (pila.length) {
      const i = pila.pop();
      pixel.push(i);
      const x = i % W;
      const y = (i - x) / W;
      if (!dentro(x, y)) fuori = true;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const xx = x + ox;
          const yy = y + oy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx;
          if (stacco[j] >= FORTE && macchia[j] === -1) {
            macchia[j] = 1;
            pila.push(j);
          }
        }
      }
    }
    if (fuori) lasciate++;
    else tenute++;
    for (const i of pixel) (fuori ? estraneo : inchiostro)[i] = 1;
  }
  if (!tenute) return {errore: 'nel riquadro non trovo nessuna scritta staccata dal tessuto: controlla le coordinate con la griglia'};
  /** Allarga una macchia di `passi` pixel in tutte le direzioni. */
  const allarga = (da, passi) => {
    let ora = da;
    for (let giro = 0; giro < passi; giro++) {
      const dopo = Uint8Array.from(ora);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          if (ora[i]) continue;
          for (let oy = -1; oy <= 1 && !dopo[i]; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              const xx = x + ox;
              const yy = y + oy;
              if (xx >= 0 && yy >= 0 && xx < W && yy < H && ora[yy * W + xx]) {
                dopo[i] = 1;
                break;
              }
            }
          }
        }
      }
      ora = dopo;
    }
    return ora;
  };
  // attorno all'inchiostro si prende anche l'alone (8 pixel), ma senza toccare le linee del disegno (3 pixel di rispetto)
  const alone = allarga(inchiostro, 8);
  const rispetto = allarga(estraneo, 3);
  const maschera = new Uint8Array(n);
  for (let i = 0; i < n; i++) maschera[i] = inchiostro[i] || (alone[i] && !rispetto[i]) ? 1 : 0;

  // 3) il tessuto sotto la scritta, ricostruito dai bordi verso il centro
  const strato = [0, 1, 2].map((c) => {
    const v = new Float32Array(n);
    for (let i = 0; i < n; i++) v[i] = maschera[i] ? fondo[c] : p[i * 4 + c];
    return v;
  });
  const daRiempire = [];
  for (let i = 0; i < n; i++) if (maschera[i]) daRiempire.push(i);
  for (let giro = 0; giro < 700; giro++) {
    for (const v of strato) {
      for (const i of daRiempire) {
        const x = i % W;
        let somma = 0;
        let quanti = 0;
        if (x > 0) (somma += v[i - 1]), quanti++;
        if (x < W - 1) (somma += v[i + 1]), quanti++;
        if (i >= W) (somma += v[i - W]), quanti++;
        if (i < n - W) (somma += v[i + W]), quanti++;
        v[i] = v[i] + 1.6 * (somma / quanti - v[i]);
      }
    }
  }

  // 4) l'inchiostro torna sopra, ribaltato attorno al proprio centro (e spostato, se richiesto)
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let i = 0; i < n; i++) {
    if (!inchiostro[i]) continue;
    const x = i % W;
    const y = (i - x) / W;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const uscita = [0, 1, 2].map((c) => Float32Array.from(strato[c]));
  let persi = 0;
  for (const i of daRiempire) {
    const x = i % W;
    const y = (i - x) / W;
    const xx = minX + maxX - x + dx;
    const yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= W || yy >= H) {
      persi++;
      continue;
    }
    const j = yy * W + xx;
    for (let c = 0; c < 3; c++) uscita[c][j] += p[i * 4 + c] - strato[c][i];
  }
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) p[i * 4 + c] = Math.max(0, Math.min(255, Math.round(uscita[c][i])));
  const pezzo = document.createElement('canvas');
  pezzo.width = W;
  pezzo.height = H;
  pezzo.getContext('2d').putImageData(dati, 0, 0);
  return {
    png: pezzo.toDataURL('image/png'),
    x: ex1,
    y: ey1,
    macchie: tenute,
    lasciate,
    persi,
    ingombro: [ex1 + minX, ey1 + minY, ex1 + maxX + 1, ey1 + maxY + 1],
  };
}

/**
 * I livelli: una parte del personaggio (di solito un avambraccio con la mano) ritagliata su un'immagine sua,
 * così può ruotare tanto e passare DAVANTI al corpo senza tirarselo dietro.
 * Per ogni livello la ricetta dice:
 *   giro   il contorno esterno della parte: dal perno (il gomito) gira nello sfondo fino all'incavo
 *   bordo  il lato interno, dall'incavo di nuovo al perno, lungo una linea già disegnata (la piega della manica)
 *   sfuma  [da, a, larghezza]: i tratti di `bordo` dove non c'è nessuna linea disegnata e il taglio va sfumato
 *   sotto  dove finisce il corpo sotto la parte, dall'incavo al perno: lì viene disegnato il suo contorno
 * A riposo il risultato è identico all'immagine di partenza: la parte copre esattamente il punto da cui è stata tolta.
 */
async function livelliInPagina({sorgente, livelli}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const tela = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  const poligono = (g, punti) => {
    g.beginPath();
    punti.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  };
  const liscio = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const distanza = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };
  const corpo = tela(W, H);
  const gc = corpo.getContext('2d', {willReadFrequently: true});
  gc.drawImage(img, 0, 0);
  const base = gc.getImageData(0, 0, W, H).data;
  const esiti = [];
  const carica = async (url) => {
    const im = new Image();
    im.src = url;
    await im.decode();
    if (im.naturalWidth !== W || im.naturalHeight !== H) return null;
    const c = tela(W, H);
    const g = c.getContext('2d', {willReadFrequently: true});
    g.drawImage(im, 0, 0);
    return g.getImageData(0, 0, W, H).data;
  };
  for (const L of livelli) {
    const t = L.taglio;
    // Parte che sta DAVANTI al corpo (un avambraccio sul petto): il ritaglio e il corpo rifatto sotto arrivano da
    // due immagini già pronte, grandi quanto quella di partenza (le prepara personaggi/strumenti/stacca_parte.py).
    //   maschera: rosso = quanto è piena la parte, verde = zona del corpo da sostituire
    //   sotto:    il corpo come appare quando la parte non c'è
    if (t.maschera) {
      const m = await carica(t.maschera);
      const s = await carica(t.sotto);
      if (!m || !s) return {errore: `livello "${L.nome}": maschera e sotto devono essere grandi quanto l'immagine (${W}x${H})`};
      const parte = tela(W, H);
      const gp = parte.getContext('2d', {willReadFrequently: true});
      gp.drawImage(img, 0, 0);
      const dati = gp.getImageData(0, 0, W, H);
      const p = dati.data;
      let minX = W;
      let minY = H;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          p[i + 3] = Math.round((p[i + 3] * m[i]) / 255);
          if (p[i + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return {errore: `il livello "${L.nome}" è vuoto: la sua maschera non copre niente`};
      gp.putImageData(dati, 0, 0);
      const lw = maxX - minX + 1;
      const lh = maxY - minY + 1;
      const ritaglio = tela(lw, lh);
      ritaglio.getContext('2d').drawImage(parte, minX, minY, lw, lh, 0, 0, lw, lh);
      const cd = gc.getImageData(0, 0, W, H);
      for (let i = 0; i < W * H * 4; i += 4) {
        if (m[i + 1] > 127) {
          cd.data[i] = s[i];
          cd.data[i + 1] = s[i + 1];
          cd.data[i + 2] = s[i + 2];
          cd.data[i + 3] = s[i + 3];
        }
      }
      gc.putImageData(cd, 0, 0);
      esiti.push({nome: L.nome, png: ritaglio.toDataURL('image/png'), x: minX, y: minY, larghezza: lw, altezza: lh});
      continue;
    }
    // Il lato netto del bordo si aggancia da solo alla linea disegnata: per ogni punto si cerca, lì attorno,
    // il tratto più scuro, e il taglio passa appena oltre. Così bastano punti presi a occhio sulla griglia.
    if (t.aderisci !== false) {
      const fine = t.sfuma ? t.sfuma[0] : t.bordo.length - 1;
      const netti = t.bordo.slice(0, fine + 1);
      const luce = (x, y) => {
        const xi = Math.max(0, Math.min(W - 1, Math.round(x)));
        const yi = Math.max(0, Math.min(H - 1, Math.round(y)));
        const i = (yi * W + xi) * 4;
        return base[i + 3] < 128 ? 255 : base[i] * 0.299 + base[i + 1] * 0.587 + base[i + 2] * 0.114;
      };
      // punti fitti lungo il bordo, ognuno con la sua direzione "verso fuori"
      const fitti = [];
      for (let k = 0; k + 1 < netti.length; k++) {
        const [ax, ay] = netti[k];
        const [bx, by] = netti[k + 1];
        const lung = Math.hypot(bx - ax, by - ay);
        const passi = Math.max(1, Math.round(lung / 2));
        for (let j = 0; j < passi; j++) fitti.push([ax + ((bx - ax) * j) / passi, ay + ((by - ay) * j) / passi, (by - ay) / lung, -(bx - ax) / lung]);
      }
      const ultimo = netti[netti.length - 1];
      fitti.push([ultimo[0], ultimo[1], fitti[fitti.length - 1][2], fitti[fitti.length - 1][3]]);
      // "fuori" è il lato opposto al resto della parte: si prova con un punto del giro
      const interno = (x, y) => {
        const pol = [...t.giro, ...t.bordo];
        let dentro = false;
        for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
          const [xi, yi] = pol[i];
          const [xj, yj] = pol[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
        }
        return dentro;
      };
      const meta = fitti[fitti.length >> 1];
      const verso = interno(meta[0] + meta[2] * 8, meta[1] + meta[3] * 8) ? -1 : 1;
      const scarti = fitti.map(([x, y, nx, ny]) => {
        let migliore = null;
        let minima = 150;
        for (let o = -5; o <= 5; o += 0.5) {
          const v = (luce(x + nx * verso * (o - 0.5), y + ny * verso * (o - 0.5)) + 2 * luce(x + nx * verso * o, y + ny * verso * o) + luce(x + nx * verso * (o + 0.5), y + ny * verso * (o + 0.5))) / 4;
          if (v < minima) {
            minima = v;
            migliore = o;
          }
        }
        return migliore;
      });
      // dove non c'è linea vale lo scarto dei vicini; poi una media, perché il taglio non zigzaghi
      let noto = scarti.find((v) => v !== null) ?? 0;
      const pieni = scarti.map((v) => (v === null ? noto : (noto = v)));
      const lisci = pieni.map((_, i) => {
        let somma = 0;
        let quanti = 0;
        for (let j = Math.max(0, i - 3); j <= Math.min(pieni.length - 1, i + 3); j++) {
          somma += pieni[j];
          quanti++;
        }
        return somma / quanti;
      });
      const OLTRE = 1.9;
      const agganciati = fitti.map(([x, y, nx, ny], i) => [x + nx * verso * (lisci[i] + OLTRE), y + ny * verso * (lisci[i] + OLTRE)]);
      t.bordo = [...agganciati, ...t.bordo.slice(fine + 1)];
      if (t.sfuma) t.sfuma = [agganciati.length - 1, agganciati.length - 1 + (t.sfuma[1] - t.sfuma[0]), t.sfuma[2]];
    }
    // 1) la parte: l'immagine dentro il poligono giro + bordo
    const parte = tela(W, H);
    const gp = parte.getContext('2d', {willReadFrequently: true});
    gp.save();
    poligono(gp, [...t.giro, ...t.bordo]);
    gp.clip();
    gp.drawImage(img, 0, 0);
    gp.restore();
    const dati = gp.getImageData(0, 0, W, H);
    const p = dati.data;
    // lungo la linea disegnata il taglio deve finire SULLA linea: la striscia chiara rimasta oltre la linea
    // (stoffa della parte che sta sotto) viene tolta, uno strato alla volta, finché si arriva al tratto scuro
    if (t.aderisci !== false) {
      const fine = t.sfuma ? t.sfuma[0] : t.bordo.length - 1;
      const tratti = t.bordo.slice(0, fine + 1);
      const R = 6;
      const xs = tratti.map((q) => q[0]);
      const ys = tratti.map((q) => q[1]);
      const x1 = Math.max(1, Math.floor(Math.min(...xs) - R));
      const x2 = Math.min(W - 1, Math.ceil(Math.max(...xs) + R));
      const y1 = Math.max(1, Math.floor(Math.min(...ys) - R));
      const y2 = Math.min(H - 1, Math.ceil(Math.max(...ys) + R));
      const fascia = [];
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const i = (y * W + x) * 4;
          if (!p[i + 3]) continue;
          let d = Infinity;
          for (let k = 0; k + 1 < tratti.length; k++) d = Math.min(d, distanza(x + 0.5, y + 0.5, tratti[k][0], tratti[k][1], tratti[k + 1][0], tratti[k + 1][1]));
          if (d < R) fascia.push(i);
        }
      }
      const chiaro = (i) => p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114 > 188;
      const vuoto = (i) => p[i + 3] < 30;
      for (let giro = 0; giro < 5; giro++) {
        const via = [];
        for (const i of fascia) {
          if (vuoto(i) || !chiaro(i)) continue;
          if (vuoto(i - 4) || vuoto(i + 4) || vuoto(i - W * 4) || vuoto(i + W * 4) || vuoto(i - W * 4 - 4) || vuoto(i - W * 4 + 4) || vuoto(i + W * 4 - 4) || vuoto(i + W * 4 + 4)) via.push(i);
        }
        if (!via.length) break;
        for (const i of via) p[i + 3] = 0;
      }
      // il bordo che resta viene ammorbidito di un pixel, così non fa i gradini
      const nuove = [];
      for (const i of fascia) {
        if (!p[i + 3]) continue;
        const trasparenti = [i - 4, i + 4, i - W * 4, i + W * 4].filter((j) => vuoto(j)).length;
        if (trasparenti) nuove.push([i, Math.round(p[i + 3] * (1 - 0.22 * trasparenti))]);
      }
      for (const [i, alfa] of nuove) p[i + 3] = alfa;
    }
    if (t.sfuma) {
      const [da, a, larghezza] = t.sfuma;
      const tratti = t.bordo.slice(da, a + 1);
      const xs = tratti.map((q) => q[0]);
      const ys = tratti.map((q) => q[1]);
      const x1 = Math.max(0, Math.floor(Math.min(...xs) - larghezza));
      const x2 = Math.min(W, Math.ceil(Math.max(...xs) + larghezza));
      const y1 = Math.max(0, Math.floor(Math.min(...ys) - larghezza));
      const y2 = Math.min(H, Math.ceil(Math.max(...ys) + larghezza));
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const i = (y * W + x) * 4 + 3;
          if (!p[i]) continue;
          let d = Infinity;
          for (let k = 0; k + 1 < tratti.length; k++) d = Math.min(d, distanza(x + 0.5, y + 0.5, tratti[k][0], tratti[k][1], tratti[k + 1][0], tratti[k + 1][1]));
          if (d < larghezza) p[i] = Math.round(p[i] * liscio(d / larghezza));
        }
      }
    }
    let minX = W;
    let minY = H;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (p[(y * W + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return {errore: `il livello "${L.nome}" è vuoto: il suo giro non racchiude niente`};
    gp.putImageData(dati, 0, 0);
    const lw = maxX - minX + 1;
    const lh = maxY - minY + 1;
    const ritaglio = tela(lw, lh);
    ritaglio.getContext('2d').drawImage(parte, minX, minY, lw, lh, 0, 0, lw, lh);

    // 2) il corpo: via la parte fino alla linea `sotto`, che diventa il suo contorno
    gc.save();
    gc.globalCompositeOperation = 'destination-out';
    poligono(gc, [...t.sotto, ...t.giro.slice(1, -1)]);
    gc.fill();
    gc.restore();
    // il colore del contorno: il pixel più scuro vicino all'inizio della linea (lì c'è già un contorno disegnato)
    let colore = t.colore;
    if (!colore) {
      const [cx, cy] = t.sotto[0];
      let scuro = 766;
      let scelto = [40, 44, 58];
      for (let y = Math.round(cy) - 7; y <= Math.round(cy) + 7; y++) {
        for (let x = Math.round(cx) - 7; x <= Math.round(cx) + 7; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const i = (y * W + x) * 4;
          if (base[i + 3] < 250) continue;
          const somma = base[i] + base[i + 1] + base[i + 2];
          if (somma < scuro) {
            scuro = somma;
            scelto = [base[i], base[i + 1], base[i + 2]];
          }
        }
      }
      colore = `rgb(${scelto.join(',')})`;
    }
    gc.save();
    gc.lineWidth = t.spessore ?? 4;
    gc.lineCap = 'round';
    gc.lineJoin = 'round';
    gc.strokeStyle = colore;
    gc.beginPath();
    t.sotto.forEach(([x, y], i) => (i ? gc.lineTo(x, y) : gc.moveTo(x, y)));
    gc.stroke();
    gc.restore();
    esiti.push({nome: L.nome, png: ritaglio.toDataURL('image/png'), x: minX, y: minY, larghezza: lw, altezza: lh, colore});
  }
  return {corpo: corpo.toDataURL('image/png'), livelli: esiti};
}

async function grigliaInPagina({sorgente, ritaglio, ossa}) {
  const img = new Image();
  img.src = sorgente;
  await img.decode();
  const L = img.naturalWidth;
  const A = img.naturalHeight;
  const x0 = ritaglio ? Math.max(0, ritaglio[0]) : 0;
  const y0 = ritaglio ? Math.max(0, ritaglio[1]) : 0;
  const x1 = ritaglio ? Math.min(L, ritaglio[2]) : L;
  const y1 = ritaglio ? Math.min(A, ritaglio[3]) : A;
  const largo = x1 - x0;
  const alto = y1 - y0;
  const k = Math.max(1, Math.min(14, Math.floor(1500 / Math.max(largo, alto))));
  const passo = [1, 2, 5, 10, 20, 50, 100].find((p) => p * k >= 46) ?? 100;
  const tela = document.createElement('canvas');
  tela.width = largo * k;
  tela.height = alto * k;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#28463c';
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.imageSmoothingEnabled = k < 4;
  ctx.drawImage(img, x0, y0, largo, alto, 0, 0, largo * k, alto * k);
  ctx.font = `700 ${Math.max(13, Math.min(22, passo * k * 0.3))}px system-ui, sans-serif`;
  ctx.lineWidth = 1;
  for (let x = Math.ceil(x0 / passo) * passo; x < x1; x += passo) {
    const X = (x - x0) * k + 0.5;
    ctx.strokeStyle = 'rgba(255,255,0,0.45)';
    ctx.beginPath();
    ctx.moveTo(X, 0);
    ctx.lineTo(X, tela.height);
    ctx.stroke();
    ctx.fillStyle = '#ffee00';
    ctx.fillText(String(x), X + 3, 18);
  }
  for (let y = Math.ceil(y0 / passo) * passo; y < y1; y += passo) {
    const Y = (y - y0) * k + 0.5;
    ctx.strokeStyle = 'rgba(0,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, Y);
    ctx.lineTo(tela.width, Y);
    ctx.stroke();
    ctx.fillStyle = '#00f6ff';
    ctx.fillText(String(y), 3, Y + 18);
  }
  // le ossa già scritte in personaggio.json: zona colorata e perno
  const colori = ['#ff4d5e', '#5aa8ff', '#ffd23f', '#ff5cf0', '#7cf26b', '#ffffff'];
  Object.entries(ossa ?? {}).forEach(([nome, osso], n) => {
    const c = colori[n % colori.length];
    const px = (x) => (x - x0) * k;
    const py = (y) => (y - y0) * k;
    ctx.strokeStyle = c;
    ctx.fillStyle = c + '33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // un osso che muove un livello intero (zona "tutto") non ha una zona da disegnare: resta solo il perno
    if (osso.zona?.tipo === 'ellisse') ctx.ellipse(px(osso.zona.centro[0]), py(osso.zona.centro[1]), osso.zona.raggi[0] * k, osso.zona.raggi[1] * k, 0, 0, Math.PI * 2);
    else if (Array.isArray(osso.zona?.punti)) {
      osso.zona.punti.forEach(([x, y], i) => (i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y))));
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(px(osso.perno[0]), py(osso.perno[1]), 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.fillText(nome, px(osso.perno[0]) + 14, py(osso.perno[1]) + 6);
  });
  return {jpeg: tela.toDataURL('image/jpeg', 0.9), ingrandimento: k, passo};
}

// ───────── comandi ─────────

function numeri(testo, quanti, cosa) {
  const v = String(testo ?? '').split(/[,;x]/).map((n) => Number(n.trim()));
  if (v.length !== quanti || v.some((n) => !Number.isFinite(n))) throw new ErroreFmlab(`${cosa}: mi aspetto ${quanti === 2 ? 'due numeri separati da virgola, es. 610,332' : 'un numero'}.`);
  return v;
}

function taglio(a, b, h, cosa) {
  const [x1, y1] = numeri(a, 2, `${cosa}, primo angolo`);
  const [x2, y2] = numeri(b, 2, `${cosa}, secondo angolo`);
  const [apertura] = numeri(h, 1, `${cosa}, apertura`);
  return {x1, y1, x2, y2, apertura};
}

async function creaPezzo(dir, config, nome, tagli, chiusura, pittore = chiudiInPagina) {
  const sorgente = path.join(dir, config.immagine ?? 'base.png');
  const esito = await nelBrowser(pittore, pittore === occhiInPagina ? {sorgente: comeDataUrl(sorgente), occhi: tagli, chiusura} : {sorgente: comeDataUrl(sorgente), tagli, chiusura});
  const file = `${nome}.png`;
  salvaPng(path.join(dir, file), esito.png);
  config.pezzi = {...(config.pezzi ?? {}), [nome]: {file, x: esito.x, y: esito.y}};
}

export async function comandoPersonaggio(argomenti = []) {
  const [azione, ...resto] = argomenti;

  if (azione === 'elenco' || !azione) {
    const tutti = leggiPersonaggi();
    console.log('\nPersonaggi disponibili:');
    for (const [id, c] of Object.entries(tutti)) {
      const pezzi = Object.keys(c.pezzi ?? {});
      const ossa = Object.keys(c.ossa ?? {});
      console.log(`  ${id.padEnd(18)} ${c.nome ?? ''}  ·  ${c.figuraDi ? `posa di ${c.figuraDi}` : c.tipo}${pezzi.length ? `  ·  pezzi: ${pezzi.join(', ')}` : ''}${ossa.length ? `  ·  ossa: ${ossa.join(', ')}` : ''}`);
    }
    console.log('  nessuno            (reel senza narratore)\n');
    if (!azione) console.log('Comandi: nuovo · figura · bocca · occhi · scritta · livello · pulisci · griglia · prova · elenco   (dettagli in personaggi/COME-FARE.md)\n');
    return;
  }

  // una posa nuova da un altro disegno dello stesso personaggio (le braccia conserte, seduto, con un oggetto in mano)
  if (azione === 'figura') {
    const [principale, posa, file] = resto;
    if (!principale || !slugValido(posa ?? '') || !file) throw new ErroreFmlab('Uso: npm run personaggio figura <personaggio> <nome della posa> <immagine>   (es. figura dottore conserte braccia.png)');
    const {file: fileConfig, config} = apri(principale);
    if (config.tipo !== 'pupazzo') throw new ErroreFmlab('Serve solo ai personaggi fatti da un\'immagine.');
    const id = `${principale}-${posa}`;
    await comandoPersonaggio(['nuovo', id, file, `${config.nome ?? principale} (${posa})`]);
    // la figura eredita la grandezza nel video e sa di chi è una posa
    const fileFigura = path.join(CARTELLA_PERSONAGGI, id, 'personaggio.json');
    const figura = leggiJson(fileFigura);
    scriviJson(fileFigura, {...figura, video: config.video ?? figura.video, figuraDi: principale});
    if (figura.misure[0] !== config.misure[0] || figura.misure[1] !== config.misure[1]) {
      console.log(`Attenzione: l'immagine è ${figura.misure.join('x')}, quella di "${principale}" è ${config.misure.join('x')}. Meglio la stessa grandezza: la figura occupa lo stesso riquadro.`);
    }
    // il personaggio principale la usa come posa
    config.disegni = {...(config.disegni ?? {}), [posa]: {personaggio: id, dx: config.disegni?.[posa]?.dx ?? 0, dy: config.disegni?.[posa]?.dy ?? 0}};
    config.pose = {...(config.pose ?? {}), [posa]: {...(config.pose?.[posa] ?? {}), disegno: posa}};
    scriviJson(fileConfig, config);
    console.log(`\nLa posa "${posa}" di "${principale}" ora è la figura "${id}". Mancano, in ordine:`);
    console.log(`  npm run personaggio griglia ${id}                       per leggere le coordinate di bocca e occhi`);
    console.log(`  npm run personaggio bocca ${id} <x1,y1> <x2,y2> <apertura>`);
    console.log(`  npm run personaggio occhi ${id} <x1,y1> <x2,y2> <su> <giu> <x1,y1> <x2,y2> <su> <giu>`);
    console.log(`  (se sul camice c'è una scritta)  npm run personaggio scritta ${id} <x1,y1> <x2,y2>`);
    console.log(`  in ${rel(fileConfig)}, alla voce "disegni": "dx" e "dy" per far combaciare le due teste`);
    console.log(`  npm run personaggio prova ${principale}                  la posa nuova è nel foglio`);
    console.log('Le ossa della testa (per i cenni) si copiano da un\'altra figura: vedi personaggi/COME-FARE.md, "Pose disegnate".');
    return;
  }

  if (azione === 'nuovo') {
    const [id, file, ...nome] = resto;
    if (!slugValido(id ?? '')) throw new ErroreFmlab('Uso: npm run personaggio nuovo <id> <immagine> ["Nome"]   (id: lettere minuscole, numeri, trattini)');
    if (!file || !fs.existsSync(file)) throw new ErroreFmlab(`Non trovo l'immagine "${file ?? ''}".`);
    const dir = path.join(CARTELLA_PERSONAGGI, id);
    const tolleranza = Number(process.env.FMLAB_TOLLERANZA_SFONDO ?? 22);
    const esito = await nelBrowser(scontornaInPagina, {sorgente: comeDataUrl(file), tolleranza});
    // via i puntini rimasti attorno alla figura
    const pulita = await nelBrowser(pulisciInPagina, {sorgente: esito.png});
    salvaPng(path.join(dir, 'base.png'), pulita.png);
    const fileConfig = path.join(dir, 'personaggio.json');
    const vecchia = fs.existsSync(fileConfig) ? leggiJson(fileConfig) : {};
    // se l'immagine cambia, bocche e occhi vanno rifatti; ossa e misure nel video restano (di solito servono solo ritocchi)
    const {pezzi: _pezzi, bocche: _bocche, occhi: _occhi, bocca: _bocca, occhiDove: _occhiDove, specchio: _specchio, scritta: _scritta, corpo: _corpo, ...daTenere} = vecchia;
    scriviJson(fileConfig, {
      ...daTenere,
      nome: nome.join(' ') || vecchia.nome || id,
      tipo: 'pupazzo',
      immagine: 'base.png',
      misure: [esito.larghezza, esito.altezza],
      video: vecchia.video ?? {larghezza: 580, sborda: 0.05, rientro: 20},
      pezzi: {},
      ossa: vecchia.ossa ?? {},
    });
    console.log(`Creato il personaggio "${id}" in ${rel(dir)}  (${esito.larghezza}x${esito.altezza}, sfondo ${esito.sfondo}, tolto il ${esito.tolti}% dell'immagine)`);
    console.log('Prossimi passi: griglia (per leggere le coordinate), bocca, occhi, poi le "ossa" in personaggio.json');
    console.log('(tutto spiegato in personaggi/COME-FARE.md) e infine:');
    console.log(`  npm run personaggio prova ${id}`);
    return;
  }

  if (azione === 'bocca') {
    const [id, a, b, h] = resto;
    const {dir, file, config} = apri(id);
    const t = taglio(a, b, h, 'Bocca');
    // dalla più chiusa alla più aperta; la bocca del tutto aperta è quella dell'immagine di partenza
    const gradi = [['bocca-chiusa', 1], ['bocca-3', 0.74], ['bocca-2', 0.5], ['bocca-1', 0.26]];
    for (const [nome, chiusura] of gradi) await creaPezzo(dir, config, nome, [t], chiusura);
    config.bocche = gradi.map(([nome]) => nome);
    config.bocca = t;
    scriviJson(file, config);
    console.log(`Create ${gradi.length} bocche (${config.bocche.join(', ')}) in ${rel(dir)}.`);
    console.log(`Controlla: npm run personaggio prova ${id}   (se la bocca non si chiude bene, ritocca angoli e apertura)`);
    return;
  }

  if (azione === 'occhi') {
    const [id, ...valori] = resto;
    const {dir, file, config} = apri(id);
    if (valori.length !== 4 && valori.length !== 8) throw new ErroreFmlab('Uso: npm run personaggio occhi <id> <x1,y1> <x2,y2> <su> <giu> [<x1,y1> <x2,y2> <su> <giu>]');
    const occhi = [];
    for (let i = 0; i < valori.length; i += 4) {
      const [x1, y1] = numeri(valori[i], 2, 'Occhio, primo angolo');
      const [x2, y2] = numeri(valori[i + 1], 2, 'Occhio, secondo angolo');
      const [su] = numeri(valori[i + 2], 1, 'Occhio, su');
      const [giu] = numeri(valori[i + 3], 1, 'Occhio, giu');
      occhi.push({x1, y1, x2, y2, su, giu});
    }
    await creaPezzo(dir, config, 'occhi-mezzi', occhi, 0.55, occhiInPagina);
    await creaPezzo(dir, config, 'occhi-chiusi', occhi, 1, occhiInPagina);
    config.occhi = ['occhi-mezzi', 'occhi-chiusi'];
    config.occhiDove = occhi;
    scriviJson(file, config);
    console.log(`Creati occhi-mezzi.png e occhi-chiusi.png in ${rel(dir)}.  Controlla: npm run personaggio prova ${id}`);
    return;
  }

  if (azione === 'pulisci') {
    const [id] = resto;
    const {dir, config} = apri(id);
    if (config.tipo !== 'pupazzo') throw new ErroreFmlab('Serve solo ai personaggi fatti da un\'immagine.');
    const fileBase = path.join(dir, config.immagine ?? 'base.png');
    const esito = await nelBrowser(pulisciInPagina, {sorgente: comeDataUrl(fileBase)});
    salvaPng(fileBase, esito.png);
    console.log(`Bordo pulito: tolti ${esito.tolti} pixel sparsi attorno alla figura (${rel(fileBase)}).`);
    if (config.livelli?.length) console.log(`Ora rifai i livelli:  npm run personaggio livello ${id}`);
    return;
  }

  if (azione === 'scritta') {
    const [id, a, b, parola, quanto] = resto;
    const {dir, file, config} = apri(id);
    if (config.tipo !== 'pupazzo') throw new ErroreFmlab('Serve solo ai personaggi fatti da un\'immagine.');
    if (!a || !b) throw new ErroreFmlab('Uso: npm run personaggio scritta <id> <x1,y1> <x2,y2> [sposta <dx,dy>]   (il riquadro attorno alla scritta, in pixel dell\'immagine)');
    const [x1, y1] = numeri(a, 2, 'Scritta, primo angolo');
    const [x2, y2] = numeri(b, 2, 'Scritta, secondo angolo');
    if (parola && parola !== 'sposta') throw new ErroreFmlab('Dopo il riquadro puoi scrivere solo:  sposta <dx,dy>');
    const sposta = parola ? numeri(quanto, 2, 'Sposta') : [0, 0];
    const rett = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    const esito = await nelBrowser(scrittaInPagina, {sorgente: comeDataUrl(path.join(dir, config.immagine ?? 'base.png')), rett, sposta});
    if (esito.errore) throw new ErroreFmlab(`Scritta: ${esito.errore}.`);
    salvaPng(path.join(dir, 'scritta-specchio.png'), esito.png);
    config.pezzi = {...(config.pezzi ?? {}), 'scritta-specchio': {file: 'scritta-specchio.png', x: esito.x, y: esito.y}};
    config.specchio = 'scritta-specchio';
    config.scritta = {riquadro: rett, sposta};
    delete config.specchiabile;
    scriviJson(file, config);
    console.log(`Creato scritta-specchio.png in ${rel(dir)}: ${esito.macchie} parti di scritta ribaltate sul posto (ingombro ${esito.ingombro.join(', ')}).`);
    if (esito.lasciate) console.log(`  ${esito.lasciate} linee del disegno attraversano il riquadro: lasciate dove sono.`);
    if (esito.persi) console.log(`  Attenzione: ${esito.persi} pixel della scritta finiscono fuori dal pezzo. Riduci lo spostamento.`);
    console.log(`Ora, specchiato, la scritta si legge dritta. Controlla: npm run personaggio prova ${id}   (ultimo riquadro)`);
    return;
  }

  if (azione === 'livello') {
    const [id] = resto;
    const {dir, file, config} = apri(id);
    if (config.tipo !== 'pupazzo') throw new ErroreFmlab('Serve solo ai personaggi fatti da un\'immagine.');
    const ricette = (config.livelli ?? []).filter((l) => l.taglio);
    if (!ricette.length) throw new ErroreFmlab(`In personaggi/${id}/personaggio.json manca la voce "livelli" con il "taglio" di ogni parte (vedi personaggi/COME-FARE.md).`);
    const perIlBrowser = ricette.map((l) => {
      if (l.taglio.maschera) {
        // parte davanti al corpo: servono le due immagini preparate
        for (const voce of ['maschera', 'sotto']) {
          const f = path.join(dir, String(l.taglio[voce] ?? ''));
          if (typeof l.taglio[voce] !== 'string' || !fs.existsSync(f)) {
            throw new ErroreFmlab(`Livello "${l.nome}": manca l'immagine "${voce}" (${l.taglio[voce] ?? 'non indicata'}). La prepara personaggi/strumenti/stacca_parte.py: vedi personaggi/COME-FARE.md.`);
          }
        }
        return {...l, taglio: {maschera: comeDataUrl(path.join(dir, l.taglio.maschera)), sotto: comeDataUrl(path.join(dir, l.taglio.sotto))}};
      }
      for (const voce of ['giro', 'bordo', 'sotto']) {
        if (!Array.isArray(l.taglio[voce]) || l.taglio[voce].length < 2) throw new ErroreFmlab(`Livello "${l.nome}": nel taglio manca "${voce}" (una lista di punti [x, y]).`);
      }
      return l;
    });
    const esito = await nelBrowser(livelliInPagina, {sorgente: comeDataUrl(path.join(dir, config.immagine ?? 'base.png')), livelli: perIlBrowser});
    if (esito.errore) throw new ErroreFmlab(`Livelli: ${esito.errore}.`);
    salvaPng(path.join(dir, 'corpo.png'), esito.corpo);
    config.corpo = 'corpo.png';
    for (const fatto of esito.livelli) {
      const l = config.livelli.find((x) => x.nome === fatto.nome);
      l.file = `livello-${fatto.nome}.png`;
      l.x = fatto.x;
      l.y = fatto.y;
      l.misure = [fatto.larghezza, fatto.altezza];
      salvaPng(path.join(dir, l.file), fatto.png);
      console.log(`Livello "${fatto.nome}": ${l.file}  (${fatto.larghezza}x${fatto.altezza} a ${fatto.x},${fatto.y})`);
    }
    scriviJson(file, config);
    console.log(`Corpo senza le parti: corpo.png   ·   Controlla: npm run personaggio prova ${id}`);
    console.log('A riposo il personaggio deve essere identico all\'immagine di partenza: lo controlla anche  npm run collaudo');
    return;
  }

  if (azione === 'griglia') {
    const [id, a, b] = resto;
    const {dir, config} = apri(id);
    let ritaglio = null;
    if (a || b) {
      const [x1, y1] = numeri(a, 2, 'Ritaglio, primo angolo');
      const [x2, y2] = numeri(b, 2, 'Ritaglio, secondo angolo');
      ritaglio = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }
    const esito = await nelBrowser(grigliaInPagina, {sorgente: comeDataUrl(path.join(dir, config.immagine ?? 'base.png')), ritaglio, ossa: config.ossa});
    const file = path.join(dir, ritaglio ? 'griglia-ritaglio.jpg' : 'griglia.jpg');
    fs.writeFileSync(file, Buffer.from(esito.jpeg.split(',')[1], 'base64'));
    console.log(`Griglia: ${rel(file)}  (una riga ogni ${esito.passo} pixel${esito.ingrandimento > 1 ? `, ingrandita ${esito.ingrandimento} volte` : ''})`);
    console.log('I numeri gialli sono le x, quelli azzurri le y. Le zone colorate sono le ossa già scritte in personaggio.json, il pallino è il perno.');
    return;
  }

  if (azione === 'prova') {
    const [id, fileMosse] = resto;
    const {dir} = apri(id);
    const {provaPersonaggio} = await import('./foto.mjs');
    if (fileMosse) {
      // un foglio con mosse scritte a mano: serve per mettere a punto pose, limiti e livelli
      if (!fs.existsSync(fileMosse)) throw new ErroreFmlab(`Non trovo "${fileMosse}".`);
      const dati = leggiJson(fileMosse);
      const libere = Array.isArray(dati) ? dati : dati.celle;
      if (!Array.isArray(libere) || !libere.length) throw new ErroreFmlab('Il file deve contenere una lista di celle: [{"titolo": "…", "mosse": {"braccio": {"ruota": 20}}}]');
      const uscita = path.resolve(fileMosse.replace(/\.json$/i, '') + (dati.png ? '.png' : '.jpg'));
      const fatto = await provaPersonaggio(id, uscita, {libere, ingrandimento: dati.ingrandimento ?? 1, colonne: dati.colonne ?? 4});
      console.log(`Foglio con le mosse richieste: ${fatto}`);
      return;
    }
    const file = await provaPersonaggio(id, path.join(dir, 'prova.jpg'));
    console.log(`Foglio di prova: ${rel(file)}\nGuardalo: in ogni riquadro il personaggio deve restare "intero", senza strappi né parti doppie.`);
    return;
  }

  throw new ErroreFmlab('Uso: npm run personaggio nuovo | bocca | occhi | scritta | livello | pulisci | griglia | prova | elenco   (dettagli in personaggi/COME-FARE.md)');
}
