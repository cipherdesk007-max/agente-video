// FMLAB Reel Kit — percorsi e impostazioni comuni a tutti i comandi.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CARTELLA_REELS = path.join(RADICE, 'reels');
export const CACHE = path.join(RADICE, '.fmlab');

/** Formato di uscita: verticale 9:16 per Reels / TikTok / Shorts. */
export const FORMATO = {larghezza: 1080, altezza: 1920, fps: 30};

/** Errore "previsto": il messaggio basta, niente stack. */
export class ErroreFmlab extends Error {}

export function slugValido(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(slug);
}

export function elencoReel() {
  if (!fs.existsSync(CARTELLA_REELS)) return [];
  return fs
    .readdirSync(CARTELLA_REELS, {withFileTypes: true})
    .filter((d) => d.isDirectory() && slugValido(d.name))
    .filter((d) => fs.existsSync(path.join(CARTELLA_REELS, d.name, 'copione.md')))
    .map((d) => d.name)
    .sort();
}

/** Cartella di un reel; se non esiste spiega cosa fare. */
export function cartellaReel(slug) {
  if (!slug) {
    const lista = elencoReel();
    throw new ErroreFmlab(
      `Manca il nome del reel.\nReel presenti: ${lista.length ? lista.join(', ') : '(nessuno)'}\nEsempio: npm run render ${lista[0] ?? 'gps'}`
    );
  }
  if (!slugValido(slug)) {
    throw new ErroreFmlab(`"${slug}" non è un nome valido: usa solo lettere minuscole, numeri e trattini (es. cuore-che-batte).`);
  }
  const dir = path.join(CARTELLA_REELS, slug);
  if (!fs.existsSync(dir)) {
    throw new ErroreFmlab(`Il reel "${slug}" non esiste.\nReel presenti: ${elencoReel().join(', ') || '(nessuno)'}\nPer crearlo: npm run nuovo ${slug} "Titolo del reel"`);
  }
  return dir;
}

/** Legge .env (se c'è) senza sovrascrivere le variabili già impostate. */
export function leggiEnv() {
  const file = path.join(RADICE, '.env');
  if (!fs.existsSync(file)) return;
  for (const riga of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = riga.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let valore = m[2].trim();
    if ((valore.startsWith('"') && valore.endsWith('"')) || (valore.startsWith("'") && valore.endsWith("'"))) {
      valore = valore.slice(1, -1);
    }
    if (process.env[m[1]] === undefined && valore !== '') process.env[m[1]] = valore;
  }
}

export function leggiJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function scriviJson(file, dati) {
  fs.writeFileSync(file, JSON.stringify(dati, null, 2) + '\n');
}

/** Percorso relativo alla radice del kit, per i messaggi. */
export function rel(file) {
  return path.relative(RADICE, file).split(path.sep).join('/');
}

/** Formatta secondi come 12,34 s (virgola italiana). */
export function sec(x, cifre = 2) {
  return `${Number(x).toFixed(cifre).replace('.', ',')} s`;
}
