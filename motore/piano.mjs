// FMLAB Reel Kit — IL PIANO DI REGIA. Un file solo, reels/<reel>/piano.json, dice tutto quello che il regista
// decide: dove comincia ogni scena nel testo, cosa si vede, su quale parola compare ogni cosa, luogo, protagonista,
// suoni. Da lì il kit scrive da solo `copione.md` (il testo dato, parola per parola, con i segni al loro posto) e
// `scene.tsx` (le scene pronte già riempite). Nessuno scrive codice: chi fa la regia scrive il piano.
//
//   npm run piano <reel>      controlla il piano e dice cosa non va, scena per scena (non scrive niente)
//   npm run monta <reel>      piano → copione.md + scene.tsx + tempi stimati
//
// Il piano:
//   {
//     "titolo": "Reta e dolore al ginocchio",
//     "protagonista": {"tipo": "peptide", "colore": "#5CF2C8"},          (oppure false)
//     "scene": [
//       {
//         "nome": "aggancio",
//         "da": "Nei nuovi studi",                    le prime parole della scena, come sono nel testo
//         "blocco": "domanda",                        una scena pronta (npm run piano: elenco) oppure "mano"
//         "dati": {"domanda": "Quanto è merito del farmaco?", "segno": "merito"},
//         "segni": {"placebo": "placebo", "merito": "merito della"},     nome → parola del testo su cui cade
//         "enfasi": ["Reta", "placebo"],              parole nel riquadro dei sottotitoli
//         "suoni": [{"suono": "pop", "su": "placebo"}],
//         "luogo": "corpo", "entra": "avanti", "tinta": "#E8455A",
//         "campo": "stretto", "camera": "spinta",     l'inquadratura (largo, medio, stretto) e come si muove la camera
//         "perche": "far vedere che anche il placebo fa calare il dolore",     cosa deve far capire la scena
//         "protagonista": {"onda": 0.3},              stato del protagonista (o elenco di stati, o false)
//         "narratore": {"posa": "alto"}
//       }
//     ]
//   }
// Una parola del testo si indica scrivendola ("placebo"); se compare più volte nella scena: {"su": "placebo", "volta": 2}.
import {NOMI_TRAME} from './musiche.mjs';
import {NOMI_ATMOSFERE, valoriAtmosfera} from './comune/atmosfere.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, RADICE, cartellaReel, leggiJson, rel} from './percorsi.mjs';
import {leggiCopione, confrontaTesto, proteggi, spezzaSenzaSpazi, testoDaDire} from './copione.mjs';
import {elencoSuoni} from './suoni.mjs';
import {RACCOLTE, cartellaIcone, nomiRaccolta} from './icone.mjs';
import {numeriSenzaFonte} from './fonti.mjs';
import {PAROLE_AL_SECONDO} from './durata.mjs';

export const VERSIONE_PIANO = 1;
export const LUOGHI = ['vuoto', 'corpo', 'vaso', 'membrana', 'laboratorio', 'stadio', 'palco', 'bilancia', 'studio'];
export const VERSI = ['avanti', 'sinistra', 'destra', 'alto', 'basso'];
export const PROTAGONISTI = ['peptide', 'goccia', 'cellula'];
export const CAMPI = ['largo', 'medio', 'stretto'];
export const CAMERE = ['ferma', 'spinta', 'indietro', 'destra', 'sinistra', 'sale', 'scende', 'gira'];
export const POSE = ['dito', 'alto', 'lato', 'aperto', 'pensa', 'presenta', 'conserte'];
/** Ogni quanti secondi, al più tardi, sul palco deve comparire qualcosa di nuovo. */
export const PAUSA_MASSIMA = 3.5;
/** Parole al secondo per i conti fatti prima di avere i tempi: una voce lenta, così chi rispetta la pausa qui la rispetta anche dopo. */
export const RITMO_PRUDENTE = 2.6;

const NOME = /^[a-z][a-z0-9_-]*$/;
const COLORE = /^#[0-9a-f]{6}$/i;

// ───────────────────────── le scene pronte, come le vede il piano ─────────────────────────
// T testo a schermo · N numero · S segno (nome di un segno della scena, o secondi dall'inizio) · X scritta breve
// C colore #RRGGBB · I icona · [tipo, 1] = obbligatorio · {elenco}/{oggetto} = voci con i loro campi
// F un'immagine (png, jpg, webp) che sta nella cartella del reel
const T = 'testo', N = 'numero', S = 'segno', X = 'scritta', C = 'colore', I = 'icona', B = 'si-no', F = 'file';
const elenco = (campi, min = 1) => ({elenco: campi, min});
const oggetto = (campi) => ({oggetto: campi});
const LATO = oggetto({titolo: [T, 1], valore: [N, 1], decimali: [N], unita: [T], segno: [S], colore: [C]});

export const BLOCCHI = {
  titolo: {fn: 'bloccoTitolo', cosa: 'una frase grande al centro', campi: {titolo: [T, 1], sopra: [T], sotto: [T], segno: [S], colore: [C]}},
  domanda: {fn: 'bloccoDomanda', cosa: 'una domanda grande: l\'aggancio', campi: {domanda: [T, 1], sopra: [T], sotto: [T], segno: [S], colore: [C]}},
  parole: {fn: 'bloccoParole', cosa: 'le parole che contano, una alla volta, ognuna sulla sua parola', campi: {parole: [elenco({testo: [T, 1], segno: [S], colore: [C]}), 1], titolo: [T], colore: [C]}},
  numero: {fn: 'bloccoNumero', cosa: 'un numero grande che sale, con unità e fonte', campi: {valore: [N, 1], unita: [T], decimali: [N], prefisso: [X], suffisso: [X], segno: [S], colore: [C], nota: [T], sottoNota: [T], segnoNota: [S], fonte: [T]}},
  confronto: {fn: 'bloccoConfronto', cosa: 'due valori a confronto', campi: {sinistra: [LATO, 1], destra: [LATO, 1], titolo: [T], fonte: [T]}},
  barre: {fn: 'bloccoBarre', cosa: 'colonne (fino a 12)', campi: {dati: [elenco({etichetta: [T, 1], valore: [N, 1], segno: [S]}), 1], titolo: [T], unita: [T], decimali: [N], colori: [{colori: 1}], fonte: [T]}},
  anello: {fn: 'bloccoAnello', cosa: 'una percentuale ad anello', campi: {valore: [N, 1], etichetta: [T], segno: [S], colore: [C], fonte: [T]}},
  lista: {fn: 'bloccoLista', cosa: 'un elenco che compare voce per voce', campi: {voci: [elenco({testo: [T, 1], segno: [S]}), 1], titolo: [T], colore: [C]}},
  passi: {fn: 'bloccoPassi', cosa: 'passi numerati in fila', campi: {passi: [elenco({testo: [T, 1], segno: [S]}), 1], titolo: [T], colore: [C]}},
  mito: {fn: 'bloccoMito', cosa: 'mito e realtà', campi: {mito: [T, 1], verita: [T, 1], segnoMito: [S], segnoVerita: [S], fonte: [T]}},
  linea: {fn: 'bloccoLinea', cosa: 'un andamento nel tempo', campi: {punti: [elenco({etichetta: [T], valore: [N, 1]}, 2), 1], titolo: [T], unita: [T], decimali: [N], prefisso: [X], suffisso: [X], segno: [S], durata: [N], colore: [C], evidenzia: [N], fonte: [T]}},
  torta: {fn: 'bloccoTorta', cosa: 'le parti di un totale', campi: {fette: [elenco({etichetta: [T, 1], valore: [N, 1], colore: [C]}, 2), 1], titolo: [T], segno: [S], evidenzia: [N], segnoEvidenzia: [S], fonte: [T]}},
  classifica: {fn: 'bloccoClassifica', cosa: 'una classifica a barre orizzontali', campi: {voci: [elenco({etichetta: [T, 1], valore: [N, 1], colore: [C]}, 2), 1], titolo: [T], unita: [T], decimali: [N], prefisso: [X], suffisso: [X], segno: [S], evidenzia: [N], segnoEvidenzia: [S], colore: [C], fonte: [T]}},
  icone: {fn: 'bloccoIcone', cosa: 'da 2 a 6 icone con la loro scritta (npm run icone <parola>)', campi: {voci: [elenco({icona: [I, 1], testo: [T, 1], segno: [S], colore: [C]}, 2), 1], titolo: [T], colore: [C]}},
  scala: {fn: 'bloccoScala', cosa: 'cursori su una scala (es. dolore da 0 a 10)', campi: {cursori: [elenco({etichetta: [T, 1], valore: [N, 1], da: [N], segno: [S], colore: [C]}), 1], titolo: [T], minimo: [N], massimo: [N], estremi: [{coppia: T}], verso: [{uno: ['male', 'bene']}], decimali: [N], fonte: [T]}},
  schede: {fn: 'bloccoSchede', cosa: '2 o 3 schede con un valore, e un totale', campi: {schede: [elenco({sopra: [T], valore: [{oppure: [N, X]}, 1], unita: [T], sotto: [T], colore: [C], segno: [S]}, 2), 1], totale: [oggetto({valore: [N, 1], etichetta: [T], segno: [S], decimali: [N]})], titolo: [T], fonte: [T]}},
  avviso: {fn: 'bloccoAvviso', cosa: 'un "attenzione": titolo e fino a 3 punti', campi: {titolo: [T, 1], sotto: [T], punti: [elenco({testo: [T, 1], segno: [S]})], segno: [S], colore: [C], fonte: [T]}},
  schermo: {fn: 'bloccoSchermo', cosa: 'uno screenshot dentro il telefono, per mostrare un\'app, un sito o un prodotto: l\'immagine sta nella cartella del reel', campi: {file: [F, 1], titolo: [T], segno: [S], note: [elenco({testo: [T, 1], segno: [S]})], colore: [C]}},
  citazione: {fn: 'bloccoCitazione', cosa: 'una frase tra virgolette', campi: {testo: [T, 1], autore: [T], segno: [S], colore: [C]}},
  studio: {fn: 'bloccoStudio', cosa: 'la pagina di uno studio: rivista, titolo, dati', campi: {rivista: [T, 1], titolo: [T, 1], dati: [elenco({testo: [T, 1], segno: [S]})], pagato: [T], segno: [S], segnoPagato: [S], colore: [C], fonte: [T]}},
  persone: {fn: 'bloccoPersone', cosa: '"2 su 10": omini accesi e spenti', campi: {accese: [N, 1], quante: [N], etichetta: [T], titolo: [T], segno: [S], colore: [C], fonte: [T]}},
  tempo: {fn: 'bloccoTempo', cosa: 'tappe su una linea del tempo', campi: {tappe: [elenco({quando: [T, 1], testo: [T], segno: [S], colore: [C]}), 1], titolo: [T], colore: [C], fonte: [T]}},
  sigla: {fn: 'bloccoSigla', cosa: 'il logo della pagina con il nome', campi: {nome: [T], sotto: [T], segno: [S]}},
  chiusura: {fn: 'bloccoChiusura', cosa: 'il cartello finale "Commenta PAROLA"', campi: {parola: [X, 1], sopra: [T], sotto: [T], segno: [S], colore: [C], logo: [B]}},
  ebook: {fn: 'bloccoEbook', cosa: 'il regalo sul tablet 3D (npm run regalo: elenco)', campi: {regalo: [{regalo: 1}], invito: [T], sopra: [T], sotto: [T], segno: [S], segnoSopra: [S], segnoSotto: [S], segnoGiro: [S], gira: [N]}},
  soggetti: {fn: 'bloccoSoggetti', cosa: 'da 1 a 3 soggetti GRANDI e illustrati che non si fermano mai e cambiano stato su una parola: la scena di base', speciale: true},
  oggetto: {fn: 'bloccoOggetto', cosa: 'un oggetto 3D che gira e cambia stato, con etichette', speciale: true},
  mano: {fn: null, cosa: 'una scena scritta a mano in mano.tsx: {"componente": "Nome"}', speciale: true},
};

/** Gli oggetti 3D pronti e i parametri che si possono dare (e far cambiare su un segno). */
const POSTO = ['pos', 'ruota', 'scala'];
export const OGGETTI = {
  ginocchio: ['dolore', 'piega', 'coloreDolore'],
  fiala: ['liquido', 'livello', 'tappo'],
  siringa: ['liquido', 'livello'],
  provetta: ['liquido', 'livello'],
  flacone: ['colore', 'tappo', 'etichetta'],
  pillola: ['colori'],
  molecola: ['colori', 'legame'],
  dna: ['colori', 'gradini', 'giro'],
  cuore: ['colore', 'spessore'],
  bilancia: ['pende', 'colore', 'piatti'],
  scudo: ['colore', 'spessore'],
  lente: ['colore', 'vetro'],
  moneta: ['colore', 'bordo'],
  stella: ['colore', 'spessore'],
  freccia: ['lunghezza', 'colore', 'spessore'],
  telefono: ['schermo', 'scocca'],
  satellite: ['corpo', 'pannello', 'acceso'],
  barre: ['valori', 'colori', 'cresci', 'larghezza', 'passo', 'altezzaMax'],
};

/** I soggetti grandi (libreria/Soggetti.tsx) e i numeri del loro stato. */
export const SOGGETTI = {
  ginocchio: ['dolore'],
  quadrante: ['valore', 'massimo'],
  batteria: ['livello', 'accesa'],
  icona: ['acceso'],
  stomaco: ['irritato'],
  riflettori: ['luci'],
  foglio: ['evidenzia'],
  scale: ['passo'],
  immagine: ['acceso'],
};

const CAMPI_SCENA = ['nome', 'da', 'blocco', 'dati', 'segni', 'enfasi', 'suoni', 'luogo', 'entra', 'campo', 'camera', 'tinta', 'protagonista', 'narratore', 'perche', 'nota'];
const CAMPI_PIANO = ['versione', 'titolo', 'protagonista', 'atmosfera', 'musica', 'scene', 'nota', 'regista'];
const CAMPI_STATO = ['x', 'y', 'grandezza', 'acceso', 'carica', 'colore', 'onda', 'presenza', 'segno'];

// ───────────────────────── il testo, parola per parola ─────────────────────────

const soloLettere = (t) => t.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** Le parole del testo dato, nell'ordine: [{testo, chiave, capoverso, enfasi}] (enfasi = era in **grassetto**). */
export function paroleDelTesto(testo) {
  const {testo: pulito, enfasi} = testoDaDire(testo, {conEnfasi: true});
  const parole = [];
  let capoverso = 0;
  let k = 0;
  let daAprire = '';
  for (const blocco of pulito.split(/\n\s*\n/)) {
    for (const intero of blocco.split(/\s+/).filter(Boolean)) {
     // un pezzo scritto senza spazi (giapponese, cinese…) vale più parole: dalla seconda in poi sono "unite" alla prima
     for (const [n, p] of spezzaSenzaSpazi(intero).entries()) {
      // la punteggiatura isolata (un trattino tra due spazi) fa parte della parola prima, come nel copione
      if (!/[\p{L}\p{N}]/u.test(p) && /^[(\[«“‘¿¡]+$/u.test(p)) daAprire += p; // un segno che apre, da solo: va con la parola dopo
      else if (!/[\p{L}\p{N}]/u.test(p) && parole.length) parole[parole.length - 1].testo += ' ' + p;
      else {
        parole.push({testo: daAprire + p, chiave: soloLettere(p), capoverso, enfasi: enfasi.has(k), ...(n > 0 ? {unita: true} : {})});
        daAprire = '';
      }
     }
      k++;
    }
    capoverso++;
  }
  return parole;
}

/**
 * Cerca una parola (o poche parole di fila) tra `da` e `a`. Restituisce {indice, dentro} oppure null.
 * "azienda" trova anche "dell'azienda": allora `dentro` dice dopo quale carattere mettere il segno.
 */
export function trova(parole, cosa, da, a, volta = 1) {
  const cerca = String(cosa).split(/\s+/).map(soloLettere).filter(Boolean);
  if (!cerca.length) return null;
  let viste = 0;
  for (let i = da; i + cerca.length <= a; i++) {
    let dentro = 0;
    const prima = parole[i].chiave;
    if (prima !== cerca[0]) {
      const taglio = Math.max(prima.lastIndexOf("'"), prima.lastIndexOf('’'));
      if (taglio < 0 || prima.slice(taglio + 1) !== cerca[0]) continue;
      dentro = parole[i].testo.search(/['’](?=[^'’]*$)/) + 1;
    }
    if (cerca.slice(1).every((c, j) => parole[i + 1 + j].chiave === c)) {
      viste++;
      if (viste === volta) return {indice: i, dentro, quante: cerca.length};
    }
  }
  return null;
}

// ───────────────────────── controllo del piano ─────────────────────────

function tipoDi(v) {
  return v === null ? 'niente' : Array.isArray(v) ? 'un elenco' : typeof v === 'object' ? 'un oggetto' : typeof v === 'string' ? 'una scritta' : typeof v === 'number' ? 'un numero' : typeof v;
}

/** Controlla `dati` contro i campi di un blocco. Riempie `errori` e raccoglie segni usati, scritte e icone. */
function controllaCampi(dati, campi, dove, esito) {
  if (!dati || typeof dati !== 'object' || Array.isArray(dati)) {
    esito.errori.push(`${dove}: servono i dati della scena, come oggetto {…}. Trovato: ${tipoDi(dati)}.`);
    return;
  }
  for (const chiave of Object.keys(dati)) {
    if (!campi[chiave]) esito.errori.push(`${dove}: il campo "${chiave}" non esiste. Campi: ${Object.keys(campi).join(', ')}.`);
  }
  for (const [chiave, [tipo, obbligatorio]] of Object.entries(campi)) {
    const v = dati[chiave];
    const qui = `${dove} · ${chiave}`;
    if (v === undefined) {
      if (obbligatorio) esito.errori.push(`${dove}: manca "${chiave}".`);
      continue;
    }
    controllaValore(v, tipo, qui, esito);
  }
}

function controllaValore(v, tipo, qui, esito) {
  if (tipo === T) {
    const testi = typeof v === 'string' ? [v] : v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v) : null;
    if (!testi || !testi.length || testi.some((t) => typeof t !== 'string')) esito.errori.push(`${qui}: serve una scritta ("…") oppure una per lingua ({"it": "…", "en": "…"}). Trovato: ${tipoDi(v)}.`);
    else esito.scritte.push(...testi);
  } else if (tipo === X) {
    if (typeof v !== 'string') esito.errori.push(`${qui}: serve una scritta. Trovato: ${tipoDi(v)}.`);
    else esito.scritte.push(v);
  } else if (tipo === N) {
    if (typeof v !== 'number' || !Number.isFinite(v)) esito.errori.push(`${qui}: serve un numero (senza virgolette, con il punto per i decimali). Trovato: ${JSON.stringify(v)}.`);
    else esito.numeri.push(v);
  } else if (tipo === B) {
    if (typeof v !== 'boolean') esito.errori.push(`${qui}: serve true oppure false.`);
  } else if (tipo === C) {
    if (typeof v !== 'string' || !COLORE.test(v)) esito.errori.push(`${qui}: serve un colore come "#5CF2C8". Trovato: ${JSON.stringify(v)}.`);
  } else if (tipo === S) {
    if (typeof v === 'string') esito.segniUsati.push({nome: v, dove: qui});
    else if (typeof v !== 'number' || v < 0) esito.errori.push(`${qui}: serve il nome di un segno della scena, oppure i secondi dall'inizio della scena.`);
  } else if (tipo === F) {
    if (typeof v !== 'string' || !/^[\w.-]+\.(png|jpe?g|webp)$/i.test(v)) esito.errori.push(`${qui}: serve il nome di un'immagine nella cartella del reel, es. "schermata.png" (png, jpg o webp, senza cartelle davanti). Trovato: ${JSON.stringify(v)}.`);
    else esito.file.push({nome: v, dove: qui});
  } else if (tipo === I) {
    if (typeof v !== 'string' || !/^[A-Z][A-Za-z0-9]+$/.test(v)) esito.errori.push(`${qui}: serve il nome di un'icona, es. "FaHeartPulse" (npm run icone cuore).`);
    else esito.icone.push({nome: v, dove: qui});
  } else if (tipo.elenco) {
    if (!Array.isArray(v) || v.length < tipo.min) esito.errori.push(`${qui}: serve un elenco [ … ] con almeno ${tipo.min === 1 ? 'una voce' : tipo.min + ' voci'}.`);
    else v.forEach((voce, i) => controllaCampi(voce, tipo.elenco, `${qui} ${i + 1}`, esito));
  } else if (tipo.oggetto) {
    controllaCampi(v, tipo.oggetto, qui, esito);
  } else if (tipo.coppia) {
    if (!Array.isArray(v) || v.length !== 2) esito.errori.push(`${qui}: servono due scritte, ["a sinistra", "a destra"].`);
    else v.forEach((x) => controllaValore(x, tipo.coppia, qui, esito));
  } else if (tipo.uno) {
    if (!tipo.uno.includes(v)) esito.errori.push(`${qui}: può essere ${tipo.uno.map((x) => `"${x}"`).join(' oppure ')}.`);
  } else if (tipo.oppure) {
    if (typeof v === 'number') esito.numeri.push(v);
    else if (typeof v === 'string') esito.scritte.push(v);
    else esito.errori.push(`${qui}: serve un numero oppure una scritta.`);
  } else if (tipo.colori) {
    if (!Array.isArray(v) || v.some((c) => typeof c !== 'string' || !COLORE.test(c))) esito.errori.push(`${qui}: serve un elenco di colori, uno per colonna: ["#5AA8FF", "#5CF2C8"].`);
  } else if (tipo.regalo) {
    if (typeof v !== 'string' || (v !== 'auto' && !esito.regali[v.toLowerCase()])) esito.errori.push(`${qui}: il regalo ${JSON.stringify(v)} non esiste. Ci sono: ${Object.keys(esito.regali).join(', ') || '(nessuno)'} (npm run regalo).`);
  }
}

function controllaOggetto(dati, dove, esito) {
  const campi = ['oggetto', 'parametri', 'cambia', 'etichette', 'titolo', 'zoom', 'fonte'];
  if (!dati || typeof dati !== 'object') return void esito.errori.push(`${dove}: servono i dati {"oggetto": "ginocchio", …}.`);
  for (const k of Object.keys(dati)) if (!campi.includes(k)) esito.errori.push(`${dove}: il campo "${k}" non esiste. Campi: ${campi.join(', ')}.`);
  const ammessi = OGGETTI[dati.oggetto];
  if (!ammessi) return void esito.errori.push(`${dove}: l'oggetto ${JSON.stringify(dati.oggetto)} non esiste. Oggetti 3D pronti: ${Object.keys(OGGETTI).join(', ')}.`);
  const controllaParametri = (p, qui) => {
    if (p === undefined) return;
    if (!p || typeof p !== 'object' || Array.isArray(p)) return void esito.errori.push(`${qui}: servono i parametri come oggetto {…}.`);
    for (const k of Object.keys(p)) if (![...ammessi, ...POSTO].includes(k)) esito.errori.push(`${qui}: "${dati.oggetto}" non ha il parametro "${k}". Parametri: ${[...ammessi, ...POSTO].join(', ')}.`);
  };
  controllaParametri(dati.parametri, `${dove} · parametri`);
  if (dati.cambia !== undefined) {
    if (!Array.isArray(dati.cambia)) esito.errori.push(`${dove} · cambia: serve un elenco [{"segno": "…", "parametri": {…}}].`);
    else
      dati.cambia.forEach((c, i) => {
        const qui = `${dove} · cambia ${i + 1}`;
        if (typeof c?.segno !== 'string') esito.errori.push(`${qui}: manca il "segno" su cui l'oggetto cambia.`);
        else esito.segniUsati.push({nome: c.segno, dove: qui});
        controllaParametri(c?.parametri, qui);
        for (const [k, v] of Object.entries(c?.parametri ?? {})) {
          const prima = dati.parametri?.[k];
          if (typeof v !== 'number' || typeof prima !== 'number') esito.errori.push(`${qui}: "${k}" può cambiare solo se è un numero, e se il suo valore di partenza è scritto in "parametri".`);
        }
        if (c?.durata !== undefined && (typeof c.durata !== 'number' || c.durata < 0)) esito.errori.push(`${qui}: "durata" è in secondi.`);
      });
  }
  controllaCampi(
    {etichette: dati.etichette, titolo: dati.titolo, zoom: dati.zoom, fonte: dati.fonte},
    {etichette: [elenco({testo: [T, 1], punto: [{punto: 1}, 1], segno: [S], colore: [C]})], titolo: [T], zoom: [N], fonte: [T]},
    dove,
    esito
  );
  for (const [i, e] of (Array.isArray(dati.etichette) ? dati.etichette : []).entries()) {
    if (!Array.isArray(e?.punto) || e.punto.length !== 3 || e.punto.some((n) => typeof n !== 'number')) esito.errori.push(`${dove} · etichette ${i + 1}: "punto" sono tre numeri [x, y, z] (x destra, y alto, z verso chi guarda).`);
  }
}

function controllaSoggetti(dati, dove, esito) {
  if (!dati || typeof dati !== 'object' || !Array.isArray(dati.soggetti) || dati.soggetti.length < 1 || dati.soggetti.length > 3) {
    return void esito.errori.push(`${dove}: servono da 1 a 3 soggetti: {"soggetti": [{"tipo": "ginocchio", "etichetta": "Reta", "stato": {"dolore": 1}}]}. Tipi: ${Object.keys(SOGGETTI).join(', ')}.`);
  }
  for (const k of Object.keys(dati)) if (!['soggetti', 'titolo', 'fonte'].includes(k)) esito.errori.push(`${dove}: il campo "${k}" non esiste. Campi: soggetti, titolo, fonte.`);
  controllaCampi({titolo: dati.titolo, fonte: dati.fonte}, {titolo: [T], fonte: [T]}, dove, esito);
  dati.soggetti.forEach((sg, i) => {
    const qui = `${dove} · soggetto ${i + 1}`;
    const numeri = SOGGETTI[sg?.tipo];
    if (!numeri) return void esito.errori.push(`${qui}: il tipo ${JSON.stringify(sg?.tipo)} non esiste. Tipi: ${Object.keys(SOGGETTI).join(', ')}.`);
    const {tipo: _t, stato: _s, cambia: _c, icona: _i, file: _f, ...semplici} = sg;
    controllaCampi(semplici, {etichetta: [T], nota: [T], colore: [C], segno: [S]}, qui, esito);
    if (sg.tipo === 'immagine') {
      if (typeof sg.file !== 'string' || !/\.(png|webp)$/i.test(sg.file)) esito.errori.push(`${qui}: un soggetto "immagine" vuole "file", l'illustrazione su fondo trasparente (es. "libreria/immagini/ginocchio-1a2b3c4d5e6f.png": lo dice npm run immagine).`);
      else if (!fs.existsSync(path.join(RADICE, sg.file))) esito.errori.push(`${qui}: il file ${sg.file} non c'è. Generalo con: npm run immagine <reel> "soggetto" (e copia qui il percorso che stampa).`);
    } else if (sg.file !== undefined) esito.errori.push(`${qui}: "file" serve solo con il tipo "immagine".`);
    if (sg.tipo === 'icona') controllaValore(sg.icona, I, `${qui} · icona`, esito);
    else if (sg.icona !== undefined) esito.errori.push(`${qui}: "icona" serve solo con il tipo "icona".`);
    const controllaNumeri = (st, q) => {
      if (st === undefined) return;
      if (!st || typeof st !== 'object' || Array.isArray(st)) return void esito.errori.push(`${q}: lo stato è un oggetto di numeri, es. {"${numeri[0]}": 1}.`);
      for (const [k, v] of Object.entries(st)) {
        if (!numeri.includes(k)) esito.errori.push(`${q}: "${sg.tipo}" non ha "${k}". Il suo stato: ${numeri.join(', ')}.`);
        else if (typeof v !== 'number') esito.errori.push(`${q}: "${k}" è un numero.`);
      }
    };
    controllaNumeri(sg.stato, `${qui} · stato`);
    if (sg.cambia !== undefined && !Array.isArray(sg.cambia)) esito.errori.push(`${qui} · cambia: è un elenco [{"segno": "…", "stato": {…}}].`);
    for (const [k, c] of (Array.isArray(sg.cambia) ? sg.cambia : []).entries()) {
      const q = `${qui} · cambia ${k + 1}`;
      if (typeof c?.segno !== 'string') esito.errori.push(`${q}: manca il "segno" su cui il soggetto cambia.`);
      else esito.segniUsati.push({nome: c.segno, dove: q});
      if (c?.stato === undefined) esito.errori.push(`${q}: manca lo "stato" verso cui cambia.`);
      controllaNumeri(c?.stato, q);
      if (c?.durata !== undefined && (typeof c.durata !== 'number' || c.durata < 0)) esito.errori.push(`${q}: "durata" è in secondi.`);
    }
  });
}

function controllaStato(stato, dove, esito, conSegno) {
  if (!stato || typeof stato !== 'object' || Array.isArray(stato)) return void esito.errori.push(`${dove}: lo stato del protagonista è un oggetto, es. {"acceso": 0.2, "onda": 1.5}.`);
  for (const [k, v] of Object.entries(stato)) {
    if (!CAMPI_STATO.includes(k)) esito.errori.push(`${dove}: "${k}" non esiste. Si può dire: ${CAMPI_STATO.join(', ')}.`);
    else if (k === 'colore') COLORE.test(v) || esito.errori.push(`${dove}: "colore" è come "#FF4D5E".`);
    else if (k === 'segno') typeof v === 'string' ? esito.segniUsati.push({nome: v, dove}) : esito.errori.push(`${dove}: "segno" è il nome di un segno della scena.`);
    else if (typeof v !== 'number') esito.errori.push(`${dove}: "${k}" è un numero.`);
  }
  if (conSegno && typeof stato.segno !== 'string') esito.errori.push(`${dove}: dal secondo stato in poi serve il "segno" su cui il protagonista cambia.`);
}

let iconeNote = null;
function raccoltaDi(icona) {
  if (!iconeNote) {
    iconeNote = new Map();
    const cartella = cartellaIcone();
    if (cartella) for (const r of Object.keys(RACCOLTE).reverse()) for (const n of nomiRaccolta(cartella, r)) iconeNote.set(n, r);
  }
  return iconeNote.get(icona) ?? null;
}

export function leggiRegali() {
  const file = path.join(RADICE, 'stile', 'regali.json');
  return fs.existsSync(file) ? leggiJson(file) : {};
}

/**
 * Controlla il piano contro il testo e lo risolve: per ogni scena, a quale parola comincia e su quale parola
 * cade ogni segno, enfasi e suono.
 * @returns {{errori: string[], avvisi: string[], parole: object[], scene: object[], scritte: string[]}}
 */
export function controllaPiano(piano, testo, {cartella = null, fonti = null, tempi = null} = {}) {
  const errori = [];
  const avvisi = [];
  const parole = paroleDelTesto(testo);
  const esitoVuoto = {errori, avvisi, parole, scene: [], scritte: [], numeri: []};
  if (!piano || typeof piano !== 'object' || Array.isArray(piano)) return {...esitoVuoto, errori: ['Il piano è un oggetto {"titolo": …, "scene": [ … ]}.']};
  for (const k of Object.keys(piano)) if (!CAMPI_PIANO.includes(k)) errori.push(`Piano: il campo "${k}" non esiste. Campi: ${CAMPI_PIANO.join(', ')}.`);
  if (!Array.isArray(piano.scene) || !piano.scene.length) return {...esitoVuoto, errori: [...errori, 'Piano: manca "scene", l\'elenco delle scene.']};
  if (piano.titolo !== undefined && typeof piano.titolo !== 'string') errori.push('Piano: "titolo" è una scritta.');
  if (piano.atmosfera !== undefined && !NOMI_ATMOSFERE.includes(piano.atmosfera)) errori.push(`Piano: l'atmosfera "${piano.atmosfera}" non esiste. Puoi scegliere: ${NOMI_ATMOSFERE.join(', ')}.`);
  if (piano.musica !== undefined && !NOMI_TRAME.includes(piano.musica)) errori.push(`Piano: la musica "${piano.musica}" non esiste. Trame del kit: ${NOMI_TRAME.join(', ')}.`);
  if (piano.protagonista !== undefined && piano.protagonista !== false) {
    const p = piano.protagonista;
    if (!p || !PROTAGONISTI.includes(p.tipo)) errori.push(`Piano · protagonista: "tipo" può essere ${PROTAGONISTI.join(', ')} (oppure "protagonista": false per non averlo).`);
    if (p?.colore !== undefined && !COLORE.test(p.colore)) errori.push('Piano · protagonista: "colore" è come "#5CF2C8".');
  }

  const suoni = elencoSuoni(cartella);
  const regali = leggiRegali();
  const nomiScene = new Set();
  const nomiSegni = new Map();
  const scene = [];
  const scritte = [];
  const numeri = [];
  let cursore = 0;

  piano.scene.forEach((sc, n) => {
    const dove = `Scena ${n + 1}${typeof sc?.nome === 'string' ? ` "${sc.nome}"` : ''}`;
    if (!sc || typeof sc !== 'object' || Array.isArray(sc)) return void errori.push(`${dove}: è un oggetto {"nome": …, "da": …, "blocco": …}.`);
    for (const k of Object.keys(sc)) if (!CAMPI_SCENA.includes(k)) errori.push(`${dove}: il campo "${k}" non esiste. Campi: ${CAMPI_SCENA.join(', ')}.`);
    if (typeof sc.nome !== 'string' || !NOME.test(sc.nome)) errori.push(`${dove}: "nome" è una parola minuscola senza spazi, es. "aggancio".`);
    else if (nomiScene.has(sc.nome)) errori.push(`${dove}: c'è già una scena con questo nome.`);
    nomiScene.add(sc.nome);

    // dove comincia
    let inizio = n === 0 ? 0 : -1;
    if (n > 0 || sc.da !== undefined) {
      if (typeof sc.da !== 'string' || !sc.da.trim()) errori.push(`${dove}: manca "da", le prime parole della scena così come sono nel testo.`);
      else {
        const t = trova(parole, sc.da, n === 0 ? 0 : cursore + 1, parole.length);
        if (!t || t.dentro) errori.push(`${dove}: non trovo "${sc.da}" nel testo dopo l'inizio della scena prima. Copia le prime 3-4 parole della scena così come sono scritte.`);
        else if (n === 0 && t.indice !== 0) errori.push(`${dove}: la prima scena comincia dalla prima parola del testo ("${parole.slice(0, 3).map((p) => p.testo).join(' ')}…"), non da "${sc.da}".`);
        else inizio = t.indice;
      }
    }
    if (inizio >= 0) cursore = inizio;
    scene.push({nome: sc.nome, inizio, fine: parole.length, segni: [], enfasi: [], suoni: [], definizione: sc, dove});
  });
  for (let i = 0; i < scene.length - 1; i++) if (scene[i + 1].inizio >= 0) scene[i].fine = scene[i + 1].inizio;
  if (errori.length) return {errori, avvisi, parole, scene, scritte, numeri};

  for (const s of scene) {
    const sc = s.definizione;
    const dove = s.dove;
    const cerca = (ancora, cosa) => {
      const su = typeof ancora === 'string' ? ancora : ancora?.su;
      const volta = typeof ancora === 'object' && ancora ? ancora.volta ?? 1 : 1;
      if (typeof su !== 'string' || !su.trim() || !Number.isInteger(volta) || volta < 1) return void errori.push(`${dove} · ${cosa}: indica la parola del testo ("placebo") oppure {"su": "placebo", "volta": 2}.`);
      const t = trova(parole, su, s.inizio, s.fine, volta);
      if (!t) {
        const altrove = trova(parole, su, 0, parole.length);
        const qui = parole.slice(s.inizio, Math.min(s.fine, s.inizio + 6)).map((p) => p.testo).join(' ');
        errori.push(`${dove} · ${cosa}: "${su}"${volta > 1 ? ` (volta ${volta})` : ''} non è in questa scena ("${qui}…")${altrove ? `: nel testo c'è, ma in un'altra scena` : ''}.`);
      }
      return t;
    };
    // segni
    if (sc.segni !== undefined && (typeof sc.segni !== 'object' || Array.isArray(sc.segni) || !sc.segni)) errori.push(`${dove} · segni: è un oggetto {"nome": "parola del testo", …}.`);
    for (const [nome, ancora] of Object.entries(sc.segni && typeof sc.segni === 'object' && !Array.isArray(sc.segni) ? sc.segni : {})) {
      if (!NOME.test(nome) || nome.startsWith('scena') || nome.startsWith('suono')) errori.push(`${dove} · segni: "${nome}" non va bene come nome. Una parola minuscola, senza spazi né accenti.`);
      else if (nomiSegni.has(nome)) errori.push(`${dove} · segni: il segno "${nome}" c'è già nella scena "${nomiSegni.get(nome)}". Ogni segno ha un nome diverso in tutto il reel.`);
      nomiSegni.set(nome, sc.nome);
      const t = cerca(ancora, `segno "${nome}"`);
      if (t) s.segni.push({nome, indice: t.indice, dentro: t.dentro});
    }
    // enfasi
    if (sc.enfasi !== undefined && !Array.isArray(sc.enfasi)) errori.push(`${dove} · enfasi: è un elenco di parole del testo, ["Reta", "placebo"].`);
    for (const ancora of Array.isArray(sc.enfasi) ? sc.enfasi : []) {
      const t = cerca(ancora, 'enfasi');
      if (t) for (let k = 0; k < t.quante; k++) s.enfasi.push(t.indice + k);
    }
    // suoni
    if (sc.suoni !== undefined && !Array.isArray(sc.suoni)) errori.push(`${dove} · suoni: è un elenco [{"suono": "pop", "su": "parola del testo"}].`);
    for (const voce of Array.isArray(sc.suoni) ? sc.suoni : []) {
      const nome = String(voce?.suono ?? '').toLowerCase();
      if (!suoni[nome]) errori.push(`${dove} · suoni: il suono "${voce?.suono}" non c'è. Suoni: ${Object.keys(suoni).join(', ')}.`);
      const t = cerca({su: voce?.su, volta: voce?.volta ?? 1}, `suono "${nome}"`);
      if (t) s.suoni.push({nome, indice: t.indice, dentro: t.dentro});
    }
    // blocco e dati
    const esito = {errori, scritte: [], numeri: [], segniUsati: [], icone: [], file: [], regali};
    const blocco = BLOCCHI[sc.blocco];
    if (!blocco) errori.push(`${dove}: il blocco ${JSON.stringify(sc.blocco)} non esiste. Blocchi: ${Object.keys(BLOCCHI).join(', ')}.`);
    else if (sc.blocco === 'oggetto') controllaOggetto(sc.dati, dove, esito);
    else if (sc.blocco === 'soggetti') controllaSoggetti(sc.dati, dove, esito);
    else if (sc.blocco === 'mano') {
      const nome = sc.dati?.componente;
      const file = cartella ? path.join(cartella, 'mano.tsx') : null;
      if (typeof nome !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(nome)) errori.push(`${dove}: una scena a mano si chiama con {"componente": "Nome"} (iniziale maiuscola).`);
      else if (file && (!fs.existsSync(file) || !new RegExp(`export\\s+(function|const)\\s+${nome}\\b`).test(fs.readFileSync(file, 'utf8')))) {
        errori.push(`${dove}: in ${rel(file)} non c'è "export function ${nome}()". Scrivila lì (esempio di scena a mano: reels/gps/scene.tsx).`);
      }
    } else controllaCampi(sc.dati ?? {}, blocco.campi, dove, esito);
    // luogo, ingresso, tinta, protagonista, narratore
    if (sc.luogo !== undefined && !LUOGHI.includes(sc.luogo)) errori.push(`${dove}: il luogo "${sc.luogo}" non esiste. Luoghi: ${LUOGHI.join(', ')}.`);
    if (sc.entra !== undefined && !VERSI.includes(sc.entra)) errori.push(`${dove}: "entra" può essere ${VERSI.join(', ')}.`);
    if (sc.perche !== undefined && typeof sc.perche !== 'string') errori.push(`${dove}: "perche" è una frase: cosa deve far capire questa scena.`);
    if (sc.campo !== undefined && !CAMPI.includes(sc.campo)) errori.push(`${dove}: "campo" (quanto è larga l'inquadratura) può essere ${CAMPI.join(', ')}.`);
    if (sc.camera !== undefined && !CAMERE.includes(sc.camera)) errori.push(`${dove}: "camera" (come si muove durante la scena) può essere ${CAMERE.join(', ')}.`);
    if (sc.tinta !== undefined && !COLORE.test(sc.tinta)) errori.push(`${dove}: "tinta" è un colore come "#E8455A".`);
    if (sc.protagonista !== undefined && sc.protagonista !== false) {
      if (Array.isArray(sc.protagonista)) sc.protagonista.forEach((st, i) => controllaStato(st, `${dove} · protagonista ${i + 1}`, esito, i > 0));
      else controllaStato(sc.protagonista, `${dove} · protagonista`, esito, false);
    }
    if (sc.narratore !== undefined) {
      const r = sc.narratore;
      if (!r || typeof r !== 'object' || Array.isArray(r)) errori.push(`${dove} · narratore: è un oggetto, es. {"posa": "conserte"} oppure {"mostra": false}.`);
      else {
        for (const k of Object.keys(r)) if (!['posa', 'seconda', 'mostra', 'gesti'].includes(k)) errori.push(`${dove} · narratore: "${k}" non esiste. Si può dire: posa, seconda, mostra, gesti.`);
        if (r.posa !== undefined && !POSE.includes(r.posa)) errori.push(`${dove} · narratore: la posa "${r.posa}" non esiste. Pose: ${POSE.join(', ')}.`);
        if (r.seconda !== undefined && !['aperta', 'alza', 'giu'].includes(r.seconda)) errori.push(`${dove} · narratore: "seconda" (la seconda mano) può essere aperta, alza, giu.`);
        if (r.mostra !== undefined && typeof r.mostra !== 'boolean') errori.push(`${dove} · narratore: "mostra" è true oppure false.`);
        if (r.gesti !== undefined && r.gesti !== false) errori.push(`${dove} · narratore: "gesti" si può solo spegnere (false).`);
      }
    }
    for (const u of esito.segniUsati) {
      if (!s.segni.some((x) => x.nome === u.nome)) errori.push(`${u.dove}: il segno "${u.nome}" non è tra i segni di questa scena (${s.segni.map((x) => x.nome).join(', ') || 'nessuno'}). Aggiungilo in "segni" con la parola del testo su cui cade.`);
    }
    for (const i of esito.icone) if (!raccoltaDi(i.nome)) errori.push(`${i.dove}: l'icona "${i.nome}" non esiste. Cercala con: npm run icone <parola>.`);
    s.icone = esito.icone.map((i) => i.nome);
    for (const f of esito.file) if (cartella && !fs.existsSync(path.join(cartella, f.nome))) errori.push(`${f.dove}: l'immagine "${f.nome}" non c'è nella cartella del reel. Mettila lì (uno screenshot dell'app o del sito) e rilancia.`);
    s.usati = new Set(esito.segniUsati.map((u) => u.nome));
    scritte.push(...esito.scritte);
    numeri.push(...esito.numeri);
    s.segni.sort((a, b) => a.indice - b.indice);
  }
  if (errori.length) return {errori, avvisi, parole, scene, scritte, numeri};

  // ── consigli: non fermano il montaggio, ma dicono dove il reel è debole ──
  const secondiDi = tempi ?? ((i) => i / RITMO_PRUDENTE);
  let quantiSuoni = 0;
  for (const s of scene) {
    quantiSuoni += s.suoni.length;
    const inutili = s.segni.filter((x) => !s.usati.has(x.nome) && s.definizione.blocco !== 'mano');
    const novita = [s.inizio, ...s.segni.filter((x) => s.usati.has(x.nome) || s.definizione.blocco === 'mano').map((x) => x.indice), s.fine].sort((a, b) => a - b);
    for (let k = 0; k < novita.length - 1; k++) {
      const pausa = secondiDi(novita[k + 1]) - secondiDi(novita[k]);
      if (pausa > PAUSA_MASSIMA) {
        const tra = parole.slice(novita[k], Math.min(novita[k + 1], novita[k] + 3)).map((p) => p.testo).join(' ');
        avvisi.push(`${s.dove}: ${pausa.toFixed(1)} secondi senza niente di nuovo da "${tra}…". Aggiungi una cosa che compare lì in mezzo (un segno usato dai dati), o dividi la scena.`);
      }
    }
    if (inutili.length) avvisi.push(`${s.dove}: ${inutili.length === 1 ? 'il segno' : 'i segni'} ${inutili.map((x) => `"${x.nome}"`).join(', ')} non ${inutili.length === 1 ? 'fa' : 'fanno'} comparire niente: usal${inutili.length === 1 ? 'o' : 'i'} nei dati o togli${inutili.length === 1 ? 'lo' : 'li'}.`);
    if (secondiDi(s.fine) - secondiDi(s.inizio) < 1.5) avvisi.push(`${s.dove}: dura meno di un secondo e mezzo. Uniscila a quella prima o a quella dopo.`);
  }
  scene.forEach((s, i) => {
    const d = s.definizione;
    if (!d.camera || d.camera === 'ferma') avvisi.push(`${s.dove}: la camera è ferma. Dalle un movimento ("camera": ${CAMERE.filter((c) => c !== 'ferma').join(', ')}): una scena è una ripresa, non un cartello.`);
    if (i > 0 && (d.campo ?? 'medio') === (scene[i - 1].definizione.campo ?? 'medio') && (d.camera ?? 'ferma') === (scene[i - 1].definizione.camera ?? 'ferma')) avvisi.push(`${s.dove}: stessa inquadratura e stesso movimento della scena prima. Cambia "campo" (largo, medio, stretto) o "camera".`);
  });
  // ── rischio cartelli: quanto il reel somiglia a una fila di scritte ferme (0 = per niente, 100 = del tutto) ──
  const SOLO_SCRITTE = ['titolo', 'domanda', 'parole', 'lista', 'passi', 'citazione', 'avviso', 'chiusura'];
  const quota = (conta) => scene.filter(conta).length / scene.length;
  const buchi = new Set(avvisi.filter((a) => a.includes('senza niente di nuovo')).map((a) => a.split(':')[0])).size / scene.length;
  // il "tipo" di una scena, per la varietà: il blocco; per i soggetti, quali soggetti (due ginocchia non sono un quadrante)
  const genere = (s) => (s.definizione.blocco === 'soggetti' ? `soggetti:${(s.definizione.dati?.soggetti ?? []).map((x) => x.tipo).join('+')}` : s.definizione.blocco);
  const diversi = new Set(scene.map(genere)).size;
  // Qualcosa deve restare da una scena all'altra e cambiare stato. Può essere il protagonista (la figura piccola in
  // basso), oppure i soggetti grandi: se in più di metà delle scene un soggetto cambia stato su una parola, il filo
  // c'è già, e nei reel di riferimento il protagonista in un angolo non c'è.
  const soggettiVivi = scene.filter((s) => (s.definizione.dati?.soggetti ?? []).some((x) => (x.cambia ?? []).length)).length;
  const cambia = piano.protagonista ? scene.some((s) => s.definizione.protagonista !== undefined) : soggettiVivi > scene.length / 2;
  const conta = (cosa) => {
    const quante = new Map();
    for (const s of scene) quante.set(cosa(s), (quante.get(cosa(s)) ?? 0) + 1);
    return Math.max(...quante.values()) / scene.length;
  };
  const unTipo = scene.length >= 3 ? conta(genere) : 0;
  const unCampo = scene.length >= 3 ? conta((s) => s.definizione.campo ?? 'medio') : 0;
  // le sei voci ricalcano il controllo "slideshow risk" di OpenMontage (ripetizione, scritte, movimento, intenzione)
  const voci = [
    ['scene di sole scritte', 25, quota((s) => SOLO_SCRITTE.includes(s.definizione.blocco)), 'metti un numero, un grafico, un oggetto 3D o delle icone dove il testo parla di una cosa che si può mostrare'],
    ['un solo tipo di scena', 15, unTipo > 0.7 ? 1 : unTipo > 0.5 ? 0.5 : 0, `usa blocchi diversi (oggi sono ${diversi}): almeno tre, e mai più di tre scene uguali di fila`],
    ['camera ferma', 15, quota((s) => !s.definizione.camera || s.definizione.camera === 'ferma'), 'dai un movimento di camera a ogni scena'],
    ['scene con pause lunghe', 15, buchi, 'fai comparire qualcosa almeno ogni tre secondi'],
    ['stessa inquadratura', 10, unCampo > 0.6 ? 1 : 0, 'alterna largo, medio e stretto'],
    ['scene senza un perché', 10, quota((s) => !s.definizione.perche), 'scrivi in "perche" cosa deve far capire ogni scena: se non lo sai dire, la scena decora e basta'],
    ['niente che resta e cambia', 10, cambia ? 0 : 1, 'fai cambiare stato a un soggetto su una parola in più di metà delle scene, oppure dai al protagonista uno stato diverso nelle scene che contano'],
  ];
  const punti = Math.round(voci.reduce((t, [, peso, q]) => t + peso * q, 0));
  const rischio = {punti, livello: punti >= 60 ? 'alto' : punti >= 35 ? 'medio' : 'basso', voci: voci.filter(([, peso, q]) => peso * q >= 5).map(([nome, peso, q, cura]) => ({nome, punti: Math.round(peso * q), cura}))};
  for (let i = 3; i < scene.length; i++) {
    if ([1, 2, 3].every((k) => genere(scene[i - k]) === genere(scene[i]))) avvisi.push(`${scene[i].dove}: è la quarta scena "${scene[i].definizione.blocco}" di fila. Mai più di tre scene dello stesso tipo una dopo l'altra.`);
  }
  if (scene.length >= 4 && diversi < 3) avvisi.push(`Il reel usa solo ${diversi === 1 ? 'un tipo' : 'due tipi'} di scena: ne servono almeno tre diversi.`);
  if (!scene.some((s) => s.enfasi.length) && !parole.some((p) => p.enfasi)) avvisi.push('Nessuna enfasi: metti nel riquadro dei sottotitoli le 4-8 parole che contano ("enfasi").');
  if (quantiSuoni < 4 || quantiSuoni > 6) avvisi.push(`Effetti sonori: ${quantiSuoni}. Ne servono da 4 a 6 in tutto il reel, sempre lo stesso suono per lo stesso tipo di cosa.`);
  const invito = parole.findIndex((p) => /^(commenta|comment|comenta|commente|kommentiere)$/.test(p.chiave));
  const ultima = scene[scene.length - 1];
  if (invito >= 0 && !['ebook', 'chiusura', 'mano'].includes(ultima.definizione.blocco)) avvisi.push(`Il testo finisce con "${parole.slice(invito, invito + 2).map((p) => p.testo).join(' ')}": l'ultima scena dovrebbe essere "ebook" (il regalo sul tablet) oppure "chiusura".`);
  if (fonti !== null) {
    const senza = numeriSenzaFonte([...scritte, ...numeri.filter((n) => Math.abs(n) > 10 || !Number.isInteger(n)).map((n) => String(n).replace('.', ','))], fonti);
    for (const x of senza) avvisi.push(`Il numero ${x.numero} va a schermo ("${String(x.testo).slice(0, 40)}") ma non ha una riga in fonti.md: la verifica darà errore.`);
  }
  return {errori, avvisi, parole, scene, scritte, numeri, rischio};
}

// ───────────────────────── piano → copione.md ─────────────────────────

/** Il copione: il testo dato, parola per parola, con scene, segni, enfasi e suoni al loro posto. */
export function montaCopione(piano, esito, {lingua = 'it'} = {}) {
  const {parole, scene} = esito;
  const davanti = parole.map(() => ({prima: '', dentro: null, enfasi: false}));
  for (const s of scene) {
    for (const x of s.suoni) aggiungi(davanti[x.indice], `[suono:${x.nome}]`, x.dentro);
    for (const x of s.segni) aggiungi(davanti[x.indice], `[${x.nome}]`, x.dentro);
    for (const i of s.enfasi) davanti[i].enfasi = true;
  }
  parole.forEach((p, i) => {
    if (p.enfasi) davanti[i].enfasi = true;
  });
  const righe = [`<!-- lingua: ${lingua} -->`, `# ${String(piano.titolo ?? '').replace(/\s+/g, ' ').trim()}`, '', '> Scritto da `npm run monta` a partire da piano.json e testo.txt: per cambiarlo si cambia il piano.', ''];
  for (const s of scene) {
    righe.push(`[scena:${s.nome}]`);
    let riga = [];
    for (let i = s.inizio; i < s.fine; i++) {
      const p = parole[i];
      if (i > s.inizio && p.capoverso !== parole[i - 1].capoverso) {
        righe.push(riga.join(' '));
        riga = [];
      }
      const d = davanti[i];
      // l'enfasi va attorno alla parola, la punteggiatura in coda resta fuori dal riquadro
      const m = /^(.*?[\p{L}\p{N}])([^\p{L}\p{N}]*)$/su.exec(p.testo) ?? [null, p.testo, ''];
      const apre = d.enfasi && !(i > s.inizio && davanti[i - 1].enfasi && !/[^\p{L}\p{N}]$/u.test(parole[i - 1].testo) && p.capoverso === parole[i - 1].capoverso);
      const chiude = d.enfasi && !(i + 1 < s.fine && davanti[i + 1].enfasi && m[2] === '' && parole[i + 1].capoverso === p.capoverso);
      let corpo = m[1];
      let segni = d.prima;
      if (d.dentro) {
        // un segno dentro la parola (dell'[azienda]azienda): vale per quella parola
        corpo = proteggi(m[1].slice(0, d.dentro.dove)) + d.dentro.cosa + proteggi(m[1].slice(d.dentro.dove));
      } else corpo = proteggi(corpo);
      const scritta = `${segni}${apre ? '*' : ''}${corpo}${chiude ? '*' : ''}${proteggi(m[2])}`;
      // una parola "unita" (lingue senza spazi) torna attaccata a quella prima, com'era nel testo dato
      if (p.unita && riga.length) riga[riga.length - 1] += scritta;
      else riga.push(scritta);
    }
    righe.push(riga.join(' '), '');
  }
  const copione = righe.join('\n');
  // la regola che non si discute: il copione dice il testo dato, parola per parola
  const diverso = confrontaTesto(parole.map((p) => p.testo).join(' '), leggiCopione(copione).testoParlato);
  if (diverso) throw new ErroreFmlab(`Montaggio: il copione non dice più il testo dato alla parola ${diverso.parola} ("${diverso.atteso}" → "${diverso.trovato}"). È un difetto del kit: segnalalo.`);
  return copione;
}

function aggiungi(posto, cosa, dentro) {
  if (dentro) posto.dentro = {dove: dentro, cosa: (posto.dentro?.cosa ?? '') + cosa};
  else posto.prima += cosa;
}

// ───────────────────────── piano → scene.tsx ─────────────────────────

const scrivi = (v) => JSON.stringify(v);

/** Scrive un valore come codice, lasciando le icone come nomi (non come scritte). */
function codice(v, rientro, chiave = '') {
  const spazi = '  '.repeat(rientro);
  if (chiave === 'icona' && typeof v === 'string') return v;
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x !== 'object' || x === null)) return `[${v.map((x) => scrivi(x)).join(', ')}]`;
    return `[\n${v.map((x) => `${spazi}  ${codice(x, rientro + 1)},`).join('\n')}\n${spazi}]`;
  }
  if (v && typeof v === 'object') {
    const voci = Object.entries(v).filter(([, x]) => x !== undefined);
    const corto = `{${voci.map(([k, x]) => `${k}: ${codice(x, rientro + 1, k)}`).join(', ')}}`;
    return corto.length <= 110 && !corto.includes('\n') ? corto : `{\n${voci.map(([k, x]) => `${spazi}  ${k}: ${codice(x, rientro + 1, k)},`).join('\n')}\n${spazi}}`;
  }
  return scrivi(v);
}

function codiceOggetto(dati, usa) {
  const fn = `${dati.oggetto}3d`;
  usa.add(fn);
  const parametri = {...(dati.parametri ?? {})};
  const pezzi = Object.entries(parametri).map(([k, v]) => {
    let espressione = scrivi(v);
    for (const c of dati.cambia ?? []) {
      if (c.parametri?.[k] === undefined) continue;
      usa.add('mix').add('rampa');
      espressione = `mix(${espressione}, ${scrivi(c.parametri[k])}, rampa(s.dopo(${scrivi(c.segno)}), ${scrivi(c.durata ?? 0.8)}))`;
    }
    return `${k}: ${espressione}`;
  });
  const resto = {etichette: dati.etichette, titolo: dati.titolo, zoom: dati.zoom, fonte: dati.fonte};
  const coda = Object.entries(resto).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${codice(v, 3, k)}`);
  return `bloccoOggetto({oggetti: (s) => ${fn}({${pezzi.join(', ')}})${coda.length ? ', ' + coda.join(', ') : ''}})`;
}

/** Il file delle scene, scritto dal piano: una scena pronta per ogni scena, già riempita. */
export function scriviScene(piano, esito) {
  const usa = new Set(['definisciReel']);
  const icone = new Map();
  const mano = new Set();
  const voci = [];
  for (const s of esito.scene) {
    const sc = s.definizione;
    let componente;
    if (sc.blocco === 'mano') {
      mano.add(sc.dati.componente);
      componente = sc.dati.componente;
    } else if (sc.blocco === 'oggetto') {
      usa.add('bloccoOggetto');
      componente = codiceOggetto(sc.dati, usa);
    } else {
      const fn = BLOCCHI[sc.blocco].fn;
      usa.add(fn);
      for (const i of s.icone ?? []) icone.set(i, raccoltaDi(i));
      componente = `${fn}(${codice(sc.dati ?? {}, 3)})`;
    }
    const atmosfera = {luogo: sc.luogo, tinta: sc.tinta};
    const extra = [];
    if (sc.luogo || sc.tinta) extra.push(`atmosfera: ${codice(atmosfera, 3)}`);
    if (sc.entra) extra.push(`entra: ${scrivi(sc.entra)}`);
    if (sc.campo) extra.push(`campo: ${scrivi(sc.campo)}`);
    if (sc.camera) extra.push(`camera: ${scrivi(sc.camera)}`);
    if (sc.protagonista !== undefined) extra.push(`protagonista: ${codice(sc.protagonista, 3)}`);
    if (sc.narratore) extra.push(`dottore: ${codice(sc.narratore, 3)}`);
    voci.push(extra.length ? `    ${sc.nome}: {\n      componente: ${componente},\n${extra.map((e) => `      ${e},`).join('\n')}\n    },` : `    ${sc.nome}: ${componente},`);
  }
  const perRaccolta = new Map();
  for (const [nome, raccolta] of icone) perRaccolta.set(raccolta, [...(perRaccolta.get(raccolta) ?? []), nome]);
  return [
    '// Scritto da `npm run monta` a partire da piano.json: non modificarlo a mano, cambia il piano e rimonta.',
    '// Una scena su misura si scrive in mano.tsx e nel piano si chiama con {"blocco": "mano", "dati": {"componente": "Nome"}}.',
    `import {${[...usa].sort().join(', ')}} from '../../libreria';`,
    ...[...perRaccolta].map(([raccolta, nomi]) => `import {${nomi.sort().join(', ')}} from 'react-icons/${raccolta}';`),
    ...(mano.size ? [`import {${[...mano].sort().join(', ')}} from './mano';`] : []),
    '',
    'export default definisciReel({',
    ...(piano.titolo ? [`  titolo: ${scrivi(piano.titolo)},`] : []),
    ...(piano.atmosfera && valoriAtmosfera(piano.atmosfera) ? [`  // atmosfera "${piano.atmosfera}" (motore/comune/atmosfere.mjs)`, `  atmosfera: ${codice(valoriAtmosfera(piano.atmosfera), 1)},`] : []),
    ...(piano.protagonista ? [`  protagonista: ${codice(piano.protagonista, 1)},`] : []),
    '  scene: {',
    ...voci,
    '  },',
    '});',
    '',
  ].join('\n');
}

// ───────────────────────── comandi ─────────────────────────

/** Legge piano, testo e fonti del reel e li controlla. I tempi veri della voce, se ci sono, rendono precisi i consigli. */
export function leggiPiano(slug) {
  const dir = cartellaReel(slug);
  const filePiano = path.join(dir, 'piano.json');
  const fileTesto = path.join(dir, 'testo.txt');
  if (!fs.existsSync(fileTesto)) throw new ErroreFmlab(`In ${rel(dir)} manca testo.txt, il testo del reel. Un reel dal testo si crea con: npm run nuovo ${slug} "Titolo" testo=<file.txt>`);
  if (!fs.existsSync(filePiano)) throw new ErroreFmlab(`In ${rel(dir)} manca piano.json. Fallo scrivere al kit (npm run regia ${slug}) e poi miglioralo, oppure scrivilo tu: l'esempio è in SCHEDA.md.`);
  let piano;
  try {
    piano = JSON.parse(fs.readFileSync(filePiano, 'utf8'));
  } catch (e) {
    throw new ErroreFmlab(`${rel(filePiano)} non è un JSON valido: ${e.message}`);
  }
  const testo = fs.readFileSync(fileTesto, 'utf8');
  const fileFonti = path.join(dir, 'fonti.md');
  const fonti = fs.existsSync(fileFonti) ? fs.readFileSync(fileFonti, 'utf8') : '';
  // i tempi veri: valgono solo se la voce è stata fatta su questo stesso testo
  let tempi = null;
  const fileParole = path.join(dir, 'parole.json');
  if (fs.existsSync(fileParole)) {
    try {
      const dati = leggiJson(fileParole);
      const quante = paroleDelTesto(testo).length;
      if (dati.parole?.length === quante) tempi = (i) => (i >= quante ? dati.parole[quante - 1].fine : dati.parole[i].inizio);
    } catch {
      // senza tempi veri si stimano
    }
  }
  return {dir, piano, testo, esito: controllaPiano(piano, testo, {cartella: dir, fonti, tempi}), tempiVeri: tempi !== null};
}

function stampaEsito(slug, esito, tempiVeri) {
  for (const e of esito.errori) console.log(`  ✗ ${e}`);
  for (const a of esito.avvisi) console.log(`  ! ${a}`);
  if (!esito.errori.length) {
    const secondi = (n) => (n / PAROLE_AL_SECONDO).toFixed(0);
    console.log(`\n  ${esito.scene.length} scene · ${esito.parole.length} parole (circa ${secondi(esito.parole.length)} secondi a voce normale) · consigli calcolati sui tempi ${tempiVeri ? 'veri della voce' : 'stimati'}`);
    if (esito.rischio) {
      console.log(`  Rischio cartelli: ${esito.rischio.punti} su 100 (${esito.rischio.livello})${esito.rischio.livello === 'alto' ? ' — così il reel è una fila di scritte: il render non parte' : ''}`);
      for (const v of esito.rischio.voci) console.log(`    +${String(v.punti).padStart(2)}  ${v.nome}: ${v.cura}`);
    }
    for (const s of esito.scene) console.log(`    ${s.nome.padEnd(14)} ${String(s.fine - s.inizio).padStart(3)} parole · ${s.definizione.blocco.padEnd(10)} · ${s.segni.length} segni · ${s.definizione.luogo ?? '-'}`);
  }
}

/** npm run piano <reel>: controlla e basta. Senza reel: l'elenco dei blocchi. */
export async function comandoPiano(slug) {
  if (!slug) {
    console.log('\nBlocchi che il piano può usare ("blocco": nome, "dati": i campi; * = obbligatorio):\n');
    for (const [nome, b] of Object.entries(BLOCCHI)) {
      const campi = b.campi ? Object.entries(b.campi).map(([k, [, obb]]) => (obb ? `${k}*` : k)).join(', ') : nome === 'oggetto' ? 'oggetto*, parametri, cambia, etichette, titolo, zoom, fonte' : nome === 'soggetti' ? 'soggetti* [{tipo*, etichetta, nota, colore, segno, stato, cambia: [{segno*, stato*, durata}], icona}], titolo, fonte' : 'componente*';
      console.log(`  ${nome.padEnd(11)} ${b.cosa}\n  ${''.padEnd(11)} ${campi}`);
    }
    console.log(`\nSoggetti grandi: ${Object.entries(SOGGETTI).map(([k, v]) => `${k} (${v.join(', ')})`).join(' · ')}\nOggetti 3D: ${Object.keys(OGGETTI).join(', ')}\nLuoghi: ${LUOGHI.join(', ')} · entra: ${VERSI.join(', ')}\nInquadratura (campo): ${CAMPI.join(', ')} · movimento (camera): ${CAMERE.join(', ')}\nProtagonista: ${PROTAGONISTI.join(', ')} · stato: ${CAMPI_STATO.join(', ')}\nRegali: ${Object.keys(leggiRegali()).join(', ') || '(nessuno)'}\n`);
    return;
  }
  const {esito, tempiVeri} = leggiPiano(slug);
  console.log(`\nPiano di "${slug}":`);
  stampaEsito(slug, esito, tempiVeri);
  if (esito.errori.length) throw new ErroreFmlab(`\nIl piano ha ${esito.errori.length === 1 ? 'un errore' : esito.errori.length + ' errori'}: correggi piano.json e rilancia.`);
  console.log(esito.avvisi.length ? `\n${esito.avvisi.length} ${esito.avvisi.length === 1 ? 'consiglio' : 'consigli'}: il piano si può montare, ma conviene sistemarli prima.` : '\nIl piano è a posto. Prossimo passo: npm run monta ' + slug);
}

/** Piano → copione.md + scene.tsx. Non tocca voce e video. */
export function monta(slug, {silenzioso = false} = {}) {
  const {dir, piano, esito, tempiVeri} = leggiPiano(slug);
  if (!silenzioso) {
    console.log(`\nPiano di "${slug}":`);
    stampaEsito(slug, esito, tempiVeri);
  }
  if (esito.errori.length) throw new ErroreFmlab(`${silenzioso ? esito.errori.map((e) => `  ✗ ${e}`).join('\n') + '\n' : '\n'}Il piano ha ${esito.errori.length === 1 ? 'un errore' : esito.errori.length + ' errori'}: correggi piano.json e rilancia. Niente è stato scritto.`);
  const vecchio = fs.existsSync(path.join(dir, 'copione.md')) ? fs.readFileSync(path.join(dir, 'copione.md'), 'utf8') : '';
  const lingua = /<!--\s*lingua:\s*([a-z-]+)\s*-->/i.exec(vecchio)?.[1] ?? 'it';
  fs.writeFileSync(path.join(dir, 'copione.md'), montaCopione(piano, esito, {lingua}));
  fs.writeFileSync(path.join(dir, 'scene.tsx'), scriviScene(piano, esito));
  return esito;
}

export async function comandoMonta(slug) {
  if (!slug) throw new ErroreFmlab('Quale reel? Esempio: npm run monta reta-ginocchio');
  const esito = monta(slug);
  // i tempi seguono il copione: con la voce già fatta si riallineano da soli, altrimenti si stimano
  const {comandoVoce} = await import('./voce.mjs');
  const dir = cartellaReel(slug);
  if (!fs.existsSync(path.join(dir, 'parole.json'))) await comandoVoce(slug, ['stima']);
  console.log(`\nMontato: ${rel(path.join(dir, 'copione.md'))} e ${rel(path.join(dir, 'scene.tsx'))}${esito.avvisi.length ? ` (${esito.avvisi.length} consigli sopra)` : ''}.\nProssimo passo: npm run provini ${slug}`);
}
