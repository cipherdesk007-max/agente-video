// FMLAB Reel Kit — IMMAGINI GENERATE, usate come materiale: un soggetto disegnato su fondo trasparente, che poi è
// il kit ad animare (livelli, camera, luce). Mai video finiti: il render resta in casa.
//
//   npm run immagine <reel> "un ginocchio in sezione, cartilagine azzurra"     genera (o ritrova) un'immagine
//   npm run immagine <reel> "…" nuova                                          la rifà anche se c'è già (costa)
//   npm run immagini                                                           elenca la biblioteca
//
// Un'unica interfaccia, più fornitori scelti in .env con FMLAB_IMMAGINI:
//   nessuno      (di serie) usa solo la biblioteca libreria/immagini/: non genera e non spende mai
//   higgsfield   HF_API_KEY_ID + HF_API_KEY_SECRET            (modello: FMLAB_HIGGSFIELD_MODELLO)
//   stability    STABILITY_API_KEY
//   comando      FMLAB_IMMAGINI_COMANDO="mio-programma {prompt} {uscita}"   qualsiasi programma che scrive un PNG
//
// Ogni immagine ha un'IMPRONTA fatta da soggetto + foglio di stile + formato. Se in biblioteca c'è già un'immagine
// con quell'impronta la si riusa: la seconda volta costa zero, con qualunque fornitore sia stata fatta.
// Accanto a ogni PNG c'è un file .json con soggetto, stile, prompt completo, fornitore e data.
//
// Il fondo trasparente lo fa il kit: al fornitore si chiede il soggetto su un fondo verde pieno, e ffmpeg toglie
// il verde. Così funziona con tutti i fornitori, anche con quelli che non sanno fare la trasparenza.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {CARTELLA_REELS, ErroreFmlab, RADICE, leggiJson, rel, scriviJson} from './percorsi.mjs';
import {trovaFfmpeg} from './ffmpeg.mjs';

export const CARTELLA_IMMAGINI = path.join(RADICE, 'libreria', 'immagini');
export const FORNITORI = ['nessuno', 'higgsfield', 'stability', 'comando'];
const FORMATI = {'1:1': [1024, 1024], '9:16': [864, 1536], '16:9': [1536, 864], '4:5': [896, 1120], '3:4': [896, 1152]};
const VERDE = '00FF00';

/** Il foglio di stile di serie: come devono essere disegnati tutti i soggetti del kit. */
export const STILE_DI_SERIE = {
  stile: 'illustrazione 3D morbida da explainer scientifico, forme pulite e arrotondate, materiali opachi con riflessi delicati, luce da studio dall\'alto a sinistra, colori saturi su toni scuri, nessuna scritta, nessun logo',
  formato: '1:1',
};

/** Il foglio di stile di un reel: reels/<reel>/immagini.json (campi "stile" e "formato"); senza, quello del kit in stile/immagini.json. */
export function foglioDiStile(slug) {
  const candidati = [slug ? path.join(CARTELLA_REELS, slug, 'immagini.json') : null, path.join(RADICE, 'stile', 'immagini.json')].filter(Boolean);
  for (const file of candidati) {
    if (!fs.existsSync(file)) continue;
    const dati = leggiJson(file);
    if (typeof dati.stile !== 'string' || !dati.stile.trim()) throw new ErroreFmlab(`${rel(file)}: manca il campo "stile" (una frase che descrive come sono disegnate le immagini del reel).`);
    if (dati.formato && !FORMATI[dati.formato]) throw new ErroreFmlab(`${rel(file)}: formato "${dati.formato}" non valido. Scegli tra: ${Object.keys(FORMATI).join(', ')}.`);
    return {stile: dati.stile.trim(), formato: dati.formato ?? STILE_DI_SERIE.formato, file};
  }
  return {...STILE_DI_SERIE, file: null};
}

const pulito = (t) => String(t).toLowerCase().replace(/\s+/g, ' ').trim();
/** L'impronta di un'immagine: stesso soggetto, stesso stile e stesso formato → stessa impronta (spazi e maiuscole non contano). */
export function improntaImmagine({soggetto, stile, formato}) {
  return crypto.createHash('sha256').update(`${pulito(soggetto)}\n${pulito(stile)}\n${formato}`).digest('hex').slice(0, 12);
}

/** Il prompt completo mandato al fornitore. Il fondo verde serve a ritagliare il soggetto. */
export function componiPrompt({soggetto, stile}) {
  return `${soggetto.trim()}. Stile: ${stile}. Un solo soggetto, intero e centrato, isolato su uno sfondo verde pieno uniforme (#${VERDE}), senza ombre a terra, senza sfumature nello sfondo, niente verde nel soggetto.`;
}

const nomeFile = (soggetto, impronta) => `${pulito(soggetto).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'immagine'}-${impronta}`;

/** Cerca in biblioteca un'immagine con questa impronta. */
export function cercaInBiblioteca(impronta, cartella = CARTELLA_IMMAGINI) {
  if (!fs.existsSync(cartella)) return null;
  const file = fs.readdirSync(cartella).find((f) => f.endsWith(`-${impronta}.png`));
  return file ? path.join(cartella, file) : null;
}

export function elencoBiblioteca(cartella = CARTELLA_IMMAGINI) {
  if (!fs.existsSync(cartella)) return [];
  return fs
    .readdirSync(cartella)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({...leggiJson(path.join(cartella, f)), file: f.replace(/\.json$/, '.png')}))
    .filter((v) => fs.existsSync(path.join(cartella, v.file)));
}

// ───────────────────────── i fornitori ─────────────────────────

async function scarica(indirizzo, uscita) {
  const r = await fetch(indirizzo);
  if (!r.ok) throw new ErroreFmlab(`Non riesco a scaricare l'immagine generata (${r.status}).`);
  fs.writeFileSync(uscita, Buffer.from(await r.arrayBuffer()));
}

/** Cerca l'indirizzo dell'immagine in una risposta di cui non si conosce a memoria la forma. */
function trovaIndirizzo(dati) {
  if (!dati || typeof dati !== 'object') return null;
  if (Array.isArray(dati.images) && dati.images[0]?.url) return dati.images[0].url;
  for (const valore of Object.values(dati)) {
    if (typeof valore === 'string' && /^https?:\/\/\S+\.(png|jpe?g|webp)(\?\S*)?$/i.test(valore)) return valore;
    if (valore && typeof valore === 'object') {
      const dentro = trovaIndirizzo(valore);
      if (dentro) return dentro;
    }
  }
  return null;
}

const fornitori = {
  /** Higgsfield: si manda la richiesta, poi si chiede lo stato finché l'immagine è pronta. */
  async higgsfield({prompt, formato, uscita}) {
    const chiave = process.env.HF_API_KEY_ID ?? process.env.HF_API_KEY;
    const segreto = process.env.HF_API_KEY_SECRET ?? process.env.HF_API_SECRET;
    if (!chiave || !segreto) throw new ErroreFmlab('Per Higgsfield servono HF_API_KEY_ID e HF_API_KEY_SECRET nel file .env (si creano su cloud.higgsfield.ai).');
    const base = (process.env.FMLAB_HIGGSFIELD_URL ?? 'https://api.higgsfield.ai').replace(/\/+$/, '');
    const modello = process.env.FMLAB_HIGGSFIELD_MODELLO ?? 'higgsfield-ai/soul/standard';
    const testate = {Authorization: `Key ${chiave}:${segreto}`, 'Content-Type': 'application/json', Accept: 'application/json'};
    const invio = await fetch(`${base}/${modello}`, {method: 'POST', headers: testate, body: JSON.stringify({prompt, aspect_ratio: formato})});
    const primo = await invio.json().catch(() => ({}));
    if (!invio.ok) throw new ErroreFmlab(`Higgsfield ha rifiutato la richiesta (${invio.status}): ${JSON.stringify(primo).slice(0, 300)}`);
    let stato = primo;
    const controlla = primo.status_url ?? (primo.request_id ? `${base}/requests/${primo.request_id}/status` : null);
    const attesa = Number(process.env.FMLAB_IMMAGINI_ATTESA ?? 2500);
    for (let giro = 0; giro < 120 && !['completed', 'failed', 'nsfw', 'canceled'].includes(stato.status); giro++) {
      if (!controlla) break;
      await new Promise((r) => setTimeout(r, attesa));
      const r = await fetch(controlla, {headers: testate});
      stato = await r.json().catch(() => ({}));
      if (!r.ok) throw new ErroreFmlab(`Higgsfield non risponde sullo stato della richiesta (${r.status}).`);
    }
    if (stato.status !== 'completed') throw new ErroreFmlab(`Higgsfield non ha finito l'immagine (stato: ${stato.status ?? 'sconosciuto'}).${stato.status === 'nsfw' ? ' Il prompt è stato bloccato dal loro filtro.' : ''}`);
    const indirizzo = trovaIndirizzo(stato);
    if (!indirizzo) throw new ErroreFmlab(`Higgsfield ha finito ma nella risposta non trovo l'immagine: ${JSON.stringify(stato).slice(0, 300)}`);
    await scarica(indirizzo, uscita);
    return {modello};
  },

  /** Stability: una chiamata sola, la risposta è già l'immagine. */
  async stability({prompt, formato, uscita}) {
    const chiave = process.env.STABILITY_API_KEY;
    if (!chiave) throw new ErroreFmlab('Per Stability serve STABILITY_API_KEY nel file .env.');
    const base = (process.env.FMLAB_STABILITY_URL ?? 'https://api.stability.ai').replace(/\/+$/, '');
    const modulo = new FormData();
    modulo.append('prompt', prompt);
    modulo.append('aspect_ratio', formato);
    modulo.append('output_format', 'png');
    const r = await fetch(`${base}/v2beta/stable-image/generate/core`, {method: 'POST', headers: {Authorization: `Bearer ${chiave}`, Accept: 'image/*'}, body: modulo});
    if (!r.ok) throw new ErroreFmlab(`Stability ha rifiutato la richiesta (${r.status}): ${(await r.text()).slice(0, 300)}`);
    fs.writeFileSync(uscita, Buffer.from(await r.arrayBuffer()));
    return {modello: 'stable-image-core'};
  },

  /** Un programma qualsiasi: riceve il prompt e il file dove scrivere l'immagine. */
  async comando({prompt, formato, uscita}) {
    const modello = process.env.FMLAB_IMMAGINI_COMANDO;
    if (!modello) throw new ErroreFmlab('Per il fornitore "comando" serve FMLAB_IMMAGINI_COMANDO nel file .env, per esempio:\n  FMLAB_IMMAGINI_COMANDO="mio-programma {prompt} {uscita}"');
    const [largo, alto] = FORMATI[formato];
    const pezzi = modello.match(/"[^"]*"|'[^']*'|\S+/g).map((p) => p.replace(/^["']|["']$/g, ''));
    const argomenti = pezzi.map((p) => p.replaceAll('{prompt}', prompt).replaceAll('{uscita}', uscita).replaceAll('{larghezza}', String(largo)).replaceAll('{altezza}', String(alto)));
    const r = spawnSync(argomenti[0], argomenti.slice(1), {encoding: 'utf8', timeout: 600000});
    if (r.error || r.status !== 0) throw new ErroreFmlab(`Il programma delle immagini è fallito: ${r.error?.message ?? (r.stderr || '').trim().split('\n').slice(-3).join(' ')}`);
    return {modello: pezzi[0]};
  },
};

/** Toglie il fondo verde e ritaglia: resta il soggetto su trasparente. Restituisce quanta parte dell'immagine è trasparente (0…1). */
async function ritaglia(grezzo, uscita) {
  const ff = await trovaFfmpeg();
  const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', grezzo, '-vf', `format=rgba,colorkey=0x${VERDE}:0.34:0.12,despill=type=green`, '-frames:v', '1', uscita], {encoding: 'utf8'});
  if (r.status !== 0) throw new ErroreFmlab(`Non riesco a togliere il fondo dall'immagine:\n${(r.stderr || '').trim().split('\n').slice(-3).join('\n')}`);
  // quanta trasparenza c'è: se è quasi zero il fornitore non ha rispettato il fondo verde
  const m = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-loglevel', 'error', '-i', uscita, '-vf', 'alphaextract,scale=64:64,format=gray', '-f', 'rawvideo', '-'], {maxBuffer: 1 << 20});
  const alfa = m.stdout?.length ? [...m.stdout] : [];
  return alfa.length ? alfa.filter((v) => v < 40).length / alfa.length : 0;
}

/**
 * Un'immagine per un soggetto: dalla biblioteca se c'è, altrimenti generata dal fornitore scelto.
 * @param {{soggetto: string, reel?: string, fornitore?: string, nuova?: boolean, cartella?: string}} richiesta
 * @returns {Promise<{file: string, impronta: string, daBiblioteca: boolean, fornitore: string, prompt: string, trasparente?: number}>}
 */
export async function immagine({soggetto, reel, fornitore = process.env.FMLAB_IMMAGINI ?? 'nessuno', nuova = false, cartella = CARTELLA_IMMAGINI}) {
  if (!soggetto || soggetto.trim().length < 3) throw new ErroreFmlab('Descrivi il soggetto dell\'immagine (per esempio: "un ginocchio in sezione, cartilagine azzurra").');
  if (!FORNITORI.includes(fornitore)) throw new ErroreFmlab(`FMLAB_IMMAGINI="${fornitore}" non esiste. Scegli tra: ${FORNITORI.join(', ')}.`);
  const foglio = foglioDiStile(reel);
  const impronta = improntaImmagine({soggetto, stile: foglio.stile, formato: foglio.formato});
  const prompt = componiPrompt({soggetto, stile: foglio.stile});
  const pronta = cercaInBiblioteca(impronta, cartella);
  if (pronta && !nuova) return {file: pronta, impronta, daBiblioteca: true, fornitore: leggiJson(pronta.replace(/\.png$/, '.json')).fornitore ?? 'sconosciuto', prompt};
  if (fornitore === 'nessuno') {
    throw new ErroreFmlab(
      `In biblioteca non c'è ancora un'immagine per "${soggetto.trim()}" con lo stile di questo reel (impronta ${impronta}), e il fornitore è "nessuno": non genero niente.\n` +
        `Per generarla scegli un fornitore nel file .env (FMLAB_IMMAGINI=higgsfield | stability | comando), oppure falla altrove con questo prompt e salvala come\n` +
        `  ${rel(path.join(cartella, `${nomeFile(soggetto, impronta)}.png`))}\n\n${prompt}`
    );
  }
  fs.mkdirSync(cartella, {recursive: true});
  const grezzo = path.join(os.tmpdir(), `fmlab-immagine-${process.pid}-${impronta}.png`);
  try {
    const esito = await fornitori[fornitore]({prompt, formato: foglio.formato, uscita: grezzo});
    if (!fs.existsSync(grezzo) || fs.statSync(grezzo).size < 68) throw new ErroreFmlab(`Il fornitore "${fornitore}" non ha prodotto nessuna immagine.`);
    const file = path.join(cartella, `${nomeFile(soggetto, impronta)}.png`);
    const trasparente = await ritaglia(grezzo, file);
    scriviJson(file.replace(/\.png$/, '.json'), {soggetto: soggetto.trim(), stile: foglio.stile, formato: foglio.formato, prompt, impronta, fornitore, modello: esito?.modello ?? null, trasparente: Math.round(trasparente * 100) / 100, creata: new Date().toISOString().slice(0, 10)});
    return {file, impronta, daBiblioteca: false, fornitore, prompt, trasparente};
  } finally {
    fs.rmSync(grezzo, {force: true});
  }
}

/** npm run immagine <reel|-> "soggetto" [nuova]   ·   npm run immagini */
export async function comandoImmagine(argomenti = []) {
  if (!argomenti.length) {
    const voci = elencoBiblioteca();
    const fornitore = process.env.FMLAB_IMMAGINI ?? 'nessuno';
    console.log(`\nBiblioteca delle immagini (${rel(CARTELLA_IMMAGINI)}): ${voci.length} ${voci.length === 1 ? 'immagine' : 'immagini'}  ·  fornitore: ${fornitore}${fornitore === 'nessuno' ? ' (non genera e non spende)' : ''}\n`);
    for (const v of voci) console.log(`  ${v.file.padEnd(56)} ${v.soggetto}  (${v.fornitore}, ${v.creata})`);
    console.log('\n  npm run immagine <reel> "soggetto"     genera un\'immagine nuova, o ritrova quella già fatta\n');
    return voci;
  }
  const nuova = argomenti.includes('nuova');
  const [reel, ...resto] = argomenti.filter((a) => a !== 'nuova');
  const soggetto = resto.join(' ');
  const fornitore = process.env.FMLAB_IMMAGINI ?? 'nessuno';
  if (fornitore !== 'nessuno' && fornitore !== 'comando') console.log(`\nFornitore: ${fornitore}. Generare un'immagine consuma crediti del tuo account.`);
  const esito = await immagine({soggetto, reel: reel === '-' ? undefined : reel, nuova});
  if (esito.daBiblioteca) console.log(`\nC'era già (impronta ${esito.impronta}, fatta con ${esito.fornitore}): nessun costo.\n  ${rel(esito.file)}\n`);
  else {
    console.log(`\nGenerata con ${esito.fornitore} e salvata in biblioteca (impronta ${esito.impronta}):\n  ${rel(esito.file)}`);
    if (esito.trasparente < 0.08) console.log('  ⚠ Il fondo non è venuto trasparente (il fornitore non ha rispettato il fondo verde): guardala prima di usarla.');
    console.log('');
  }
  console.log(`Nelle scene:  <Foto file="${rel(esito.file).replaceAll('\\', '/')}" … />\n`);
  return esito;
}
