// FMLAB Reel Kit — IL REGISTRO: tutto quello che il kit fa, scritto mentre lo fa.
//
// Serve alla dashboard (npm run pannello) per mostrare in diretta cosa sta succedendo, chiunque abbia lanciato il
// comando: una persona, il pannello, un agente nel terminale. E serve a chi deve capire cosa è andato storto.
//
//   .fmlab/registro.jsonl   una riga per fatto: un comando che parte o finisce, una tappa, una spesa, un errore
//   .fmlab/adesso.json      cosa sta girando in questo momento (comando, reel, tappa, percentuale)
//   .fmlab/coda.json        le richieste scritte dalla dashboard, che l'agente legge a ogni  npm run stato
//   diario.md               una voce per ogni reel chiuso: cosa è entrato in catalogo, cosa è rimasto da sistemare
//
// Niente di tutto questo deve mai far fallire un comando: se il registro non si può scrivere, il lavoro va avanti.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {CACHE, RADICE} from './percorsi.mjs';

/** FMLAB_REGISTRO sposta registro e coda (serve alle prove, per non sporcare quelli veri). */
const base = () => (process.env.FMLAB_REGISTRO ? path.resolve(process.env.FMLAB_REGISTRO) : CACHE);
const fileRegistro = () => path.join(base(), 'registro.jsonl');
const fileAdesso = () => path.join(base(), 'adesso.json');
const fileCoda = () => path.join(base(), 'coda.json');
export const fileDiario = () => (process.env.FMLAB_DIARIO ? path.resolve(process.env.FMLAB_DIARIO) : path.join(RADICE, 'diario.md'));
const MASSIMO = 1_500_000;

const leggi = (file, vuoto) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return vuoto;
  }
};
const scrivi = (file, dati) => {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dati, null, 2));
  fs.renameSync(tmp, file);
};

/** Una chiave non deve mai finire nel registro, nemmeno per sbaglio dentro un argomento. */
export const senzaSegreti = (testo) => String(testo).replace(/\b(sk|xi|hf|key)[-_][A-Za-z0-9_-]{12,}\b/g, '…').replace(/(chiave|key|token|secret)=\S+/gi, '$1=…');

/** Scrive un fatto nel registro. tipo: inizio | fine | tappa | spesa | preventivo | errore | nota | richiesta */
export function annota(tipo, dati = {}) {
  try {
    const file = fileRegistro();
    fs.mkdirSync(path.dirname(file), {recursive: true});
    if (fs.existsSync(file) && fs.statSync(file).size > MASSIMO) {
      // si tiene la seconda metà: il registro è per vedere cosa succede adesso, non un archivio
      const righe = fs.readFileSync(file, 'utf8').split('\n');
      fs.writeFileSync(file, righe.slice(Math.floor(righe.length / 2)).join('\n'));
    }
    fs.appendFileSync(file, `${JSON.stringify({t: new Date().toISOString(), tipo, ...dati})}\n`);
  } catch {
    // il registro non è mai un motivo per fermarsi
  }
}

/** Gli ultimi fatti, dal più vecchio al più nuovo. */
export function leggiRegistro({ultimi = 80, dopo = null} = {}) {
  let righe;
  try {
    righe = fs.readFileSync(fileRegistro(), 'utf8').trim().split('\n');
  } catch {
    return [];
  }
  const fatti = [];
  for (const r of righe.slice(-Math.max(ultimi * 3, 400))) {
    try {
      const f = JSON.parse(r);
      if (!dopo || f.t > dopo) fatti.push(f);
    } catch {
      // una riga scritta a metà si salta
    }
  }
  return fatti.slice(-ultimi);
}

let ultimoAdesso = 0;
/** Cosa sta girando adesso. Con {piano: true} si scrive al massimo una volta al secondo (l'avanzamento di un render). */
export function adesso(dati, {piano = false} = {}) {
  const ora = Date.now();
  if (piano && ora - ultimoAdesso < 1000) return;
  ultimoAdesso = ora;
  try {
    scrivi(fileAdesso(), dati ? {...leggi(fileAdesso(), {}), ...dati, pid: process.pid, aggiornato: new Date().toISOString()} : {fermo: true, aggiornato: new Date().toISOString()});
  } catch {
    // come sopra
  }
}

/** Quello che gira adesso, o null se non gira niente (o se chi lo scriveva non c'è più). */
export function leggiAdesso() {
  const a = leggi(fileAdesso(), null);
  if (!a || a.fermo) return null;
  try {
    process.kill(a.pid, 0);
  } catch {
    return null;
  }
  return a;
}

/** I crediti spesi, in tutto e per reel, contati dalle spese scritte nel registro. */
export function creditiSpesi() {
  let righe;
  try {
    righe = fs.readFileSync(fileRegistro(), 'utf8').trim().split('\n');
  } catch {
    return {totale: 0, perReel: {}};
  }
  const perReel = {};
  let totale = 0;
  for (const r of righe) {
    if (!r.includes('"spesa"')) continue;
    try {
      const f = JSON.parse(r);
      if (f.tipo !== 'spesa' || !f.caratteri) continue;
      totale += f.caratteri;
      perReel[f.reel ?? '?'] = (perReel[f.reel ?? '?'] ?? 0) + f.caratteri;
    } catch {
      // riga rovinata
    }
  }
  return {totale, perReel};
}

// ───────────────────────── la coda delle richieste ─────────────────────────

/** Le richieste scritte dalla dashboard. stato: 'nuova' (l'agente non l'ha ancora vista) | 'vista' | 'fatta' */
export function leggiCoda() {
  const c = leggi(fileCoda(), []);
  return Array.isArray(c) ? c : [];
}

/** Le scelte dei pulsanti diventano il comando che le applica: l'agente non deve indovinare. */
export function comandoDelleScelte(reel, scelte = {}) {
  const voci = Object.entries(scelte).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!reel || !voci.length) return null;
  const sicuro = (x) => String(x).replace(/[^\p{L}\p{N}:.,_-]/gu, '');
  return `npm run imposta ${reel} ${voci.map(([k, v]) => `${sicuro(k)}=${sicuro(v)}`).join(' ')}`;
}

export function aggiungiRichiesta({reel = null, testo = '', scelte = {}} = {}) {
  const pulito = String(testo).trim().slice(0, 2000);
  const comando = comandoDelleScelte(reel, scelte);
  if (!pulito && !comando) throw new Error('La richiesta è vuota: scrivi cosa vuoi, o scegli almeno una cosa.');
  const richiesta = {id: crypto.randomBytes(3).toString('hex'), quando: new Date().toISOString(), reel: reel || null, testo: pulito, comando, stato: 'nuova'};
  scrivi(fileCoda(), [...leggiCoda(), richiesta].slice(-200));
  annota('richiesta', {id: richiesta.id, reel: richiesta.reel, testo: pulito.slice(0, 200), comando});
  return richiesta;
}

export function segnaRichiesta(id, stato) {
  const coda = leggiCoda();
  const r = coda.find((x) => x.id === id);
  if (!r) return null;
  r.stato = stato;
  r[stato === 'fatta' ? 'fattaIl' : 'vistaIl'] = new Date().toISOString();
  scrivi(fileCoda(), coda);
  annota('richiesta', {id, stato});
  return r;
}

/** `npm run richieste` (elenco) · `npm run richieste fatta <id>` · `npm run richieste "testo" [reel]` (ne aggiunge una) */
export function comandoRichieste(argomenti = []) {
  if (argomenti[0] === 'fatta') {
    const r = segnaRichiesta(argomenti[1], 'fatta');
    return console.log(r ? `\nRichiesta ${r.id} segnata come fatta.\n` : `\nNon trovo la richiesta "${argomenti[1] ?? ''}".  npm run richieste  le elenca.\n`);
  }
  if (argomenti[0]) {
    const r = aggiungiRichiesta({testo: argomenti[0], reel: argomenti[1] ?? null});
    return console.log(`\nRichiesta ${r.id} in coda.\n`);
  }
  const aperte = leggiCoda().filter((r) => r.stato !== 'fatta');
  if (!aperte.length) return console.log('\nNessuna richiesta in coda.\n');
  console.log(`\nRichieste in coda (${aperte.length}):\n`);
  for (const r of aperte) stampaRichiesta(r);
  console.log('\nQuando una è fatta:  npm run richieste fatta <id>\n');
}

export function stampaRichiesta(r) {
  console.log(`  [${r.id}]${r.reel ? ` ${r.reel}:` : ''} ${r.testo || '(solo scelte)'}`);
  if (r.comando) console.log(`         → ${r.comando}`);
}

// ───────────────────────── il diario ─────────────────────────

/** Aggiunge una voce al diario (in cima: la più nuova per prima). righe: frasi brevi, una per riga. */
export function scriviDiario(titolo, righe = [], {chiave = null} = {}) {
  const file = fileDiario();
  const testa = '# Diario del kit\n\nUna voce per ogni reel chiuso: cosa è entrato in catalogo, cosa è rimasto da sistemare. La scrive il kit da solo\n(`npm run fai`, alla fine); chi fa i reel la legge prima di cominciare il prossimo.\n';
  let vecchio = '';
  try {
    vecchio = fs.readFileSync(file, 'utf8');
  } catch {
    vecchio = testa;
  }
  const corpo = vecchio.startsWith('# Diario del kit') ? vecchio.slice(vecchio.indexOf('\n## ') === -1 ? vecchio.length : vecchio.indexOf('\n## ')) : `\n${vecchio}`;
  const oggi = new Date().toISOString().slice(0, 10);
  const voce = `\n## ${oggi} · ${titolo}\n\n${righe.filter(Boolean).map((r) => `- ${r}`).join('\n')}\n`;
  // lo stesso reel rifatto nello stesso giorno ha una voce sola: l'ultima
  const resto = chiave ? corpo.split(/\n(?=## )/).filter((b) => !b.replace(/^\n/, '').startsWith(`## ${oggi} · ${chiave} ·`)).join('\n') : corpo;
  fs.writeFileSync(file, `${testa}${voce}${resto.startsWith('\n') ? '' : '\n'}${resto}`.replace(/\n{3,}/g, '\n\n'));
}

export function leggiDiario() {
  let testo;
  try {
    testo = fs.readFileSync(fileDiario(), 'utf8');
  } catch {
    return [];
  }
  return testo
    .split(/\n(?=## )/)
    .filter((b) => b.startsWith('## '))
    .map((b) => {
      const [prima, ...resto] = b.split('\n');
      return {titolo: prima.replace(/^## /, ''), righe: resto.map((r) => r.replace(/^- /, '').trim()).filter(Boolean)};
    });
}
