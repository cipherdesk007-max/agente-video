// FMLAB Reel Kit — voce e tempi parola per parola.
//   elevenlabs → voce professionale, tempi esatti carattere per carattere (serve la chiave nel file .env)
//   mac        → voce gratuita del Mac (comando `say`), tempi esatti sulle frasi e sulle pause
//   stima      → nessuna voce: tempi stimati, per lavorare alle scene prima di spendere crediti
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {CACHE, ErroreFmlab, RADICE, leggiEnv, leggiJson, rel, scriviJson, sec} from './percorsi.mjs';
import {cercaFrase, leggiBanca, ritmoMisurato} from './frasi.mjs';
import {annota} from './registro.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';
import {apriReel, estraiVariante} from './reel.mjs';
import {componiDati, confrontaTesto, leggiCopione, testoDaDire, pausaDopo, pesoParola, stimaTempi, tempiDaCaratteri} from './copione.mjs';
import {leggiWav, scriviWav, silenzio, taglia, trattiDiVoce} from './wav.mjs';
import {creaSrt} from './comune/pagine.mjs';
import {trovaFfmpeg} from './ffmpeg.mjs';
import {VELOCITA_MASSIMA, adattaDurata, durataMinima, paroleMassime} from './durata.mjs';

const MOTORI = ['elevenlabs', 'mac', 'comando', 'stima'];

const impronta = (cosa) => crypto.createHash('sha256').update(typeof cosa === 'string' ? cosa : JSON.stringify(cosa)).digest('hex').slice(0, 24);

function numeroEnv(nome) {
  const v = process.env[nome];
  if (v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

// ───────────────────────────── ElevenLabs ─────────────────────────────

/** Indirizzo dell'API di ElevenLabs (si può cambiare solo per le prove). */
export const baseElevenLabs = () => (process.env.FMLAB_ELEVENLABS_URL || 'https://api.elevenlabs.io').replace(/\/+$/, '');

/** Le voci del proprio account ElevenLabs, con l'indirizzo di un assaggio già pronto (ascoltarlo non costa crediti). */
export async function elencoVociElevenLabs() {
  const chiave = process.env.ELEVENLABS_API_KEY;
  if (!chiave) return [];
  let risposta;
  try {
    risposta = await fetch(`${baseElevenLabs()}/v1/voices`, {headers: {'xi-api-key': chiave, Accept: 'application/json'}});
  } catch (e) {
    throw new ErroreFmlab(`Non riesco a raggiungere ElevenLabs (${e.cause?.code ?? e.message}).`);
  }
  if (!risposta.ok) throw new ErroreFmlab(`ElevenLabs ha risposto ${risposta.status} alla richiesta dell'elenco delle voci.`);
  const dati = await risposta.json();
  return (dati.voices ?? []).map((v) => ({
    id: v.voice_id,
    nome: v.name,
    assaggio: v.preview_url ?? null,
    descrizione: [v.labels?.language, v.labels?.accent, v.labels?.gender, v.labels?.age, v.category].filter(Boolean).join(' · '),
  }));
}

/** La voce ElevenLabs di un reel in una lingua: quella scelta per il reel, poi quella della lingua, poi quella del file .env. */
const voceElevenLabsDi = (scelte, lingua) => scelte.elevenlabs?.[lingua] || process.env[`ELEVENLABS_VOICE_ID_${lingua.toUpperCase().replace('-', '_')}`] || process.env.ELEVENLABS_VOICE_ID;
const voceDiSerie = (lingua) => process.env[`ELEVENLABS_VOICE_ID_${lingua.toUpperCase().replace('-', '_')}`] || process.env.ELEVENLABS_VOICE_ID;
const aFrasi = () => !/^(no|0|false)$/i.test(process.env.ELEVENLABS_FRASI ?? 'si');

/** Modello e regolazioni presi dal file .env: fanno parte di "com'è detta" una frase. */
function regoleElevenLabs() {
  const corpo = {model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'};
  const impostazioni = {
    stability: numeroEnv('ELEVENLABS_STABILITY'),
    similarity_boost: numeroEnv('ELEVENLABS_SIMILARITY'),
    style: numeroEnv('ELEVENLABS_STYLE'),
    speed: numeroEnv('ELEVENLABS_SPEED'),
  };
  const regolazioni = Object.fromEntries(Object.entries(impostazioni).filter(([, v]) => v !== undefined));
  if (Object.keys(regolazioni).length) corpo.voice_settings = regolazioni;
  if (process.env.ELEVENLABS_LANGUAGE) corpo.language_code = process.env.ELEVENLABS_LANGUAGE;
  return corpo;
}

// Le frasi pagate non stanno tra i file di servizio (.fmlab/ si può buttare): stanno in voci/pagate/, che Git ignora.
const DEPOSITO_ELEVENLABS = process.env.FMLAB_FRASI_PAGATE ? path.resolve(process.env.FMLAB_FRASI_PAGATE) : path.join(RADICE, 'voci', 'pagate');
const frasiDi = (copione) => {
  const gruppi = [];
  copione.parole.forEach((p) => (gruppi[p.frase] ??= []).push(p.testo));
  return gruppi.filter(Boolean).map((g) => g.join(' '));
};

/**
 * Da dove viene ogni frase di un copione, senza generare niente: dalla banca (voci/frasi/, solo con la voce di
 * serie), dal deposito delle frasi già pagate, o da ElevenLabs. Serve a dire il costo prima di spendere.
 */
export function pianoFrasiElevenLabs(copione, lingua, voce, {nuova = false} = {}) {
  const regole = regoleElevenLabs();
  const banca = leggiBanca();
  const conBanca = voce && voce === voceDiSerie(lingua);
  return frasiDi(copione).map((testo) => {
    const inBanca = conBanca ? cercaFrase(testo, lingua, banca) : null;
    if (inBanca) return {testo, origine: 'banca', file: path.join(RADICE, inBanca.file)};
    const chiave = impronta({voce, ...regole, text: testo});
    const mp3 = path.join(DEPOSITO_ELEVENLABS, `${chiave}.mp3`);
    const tempi = path.join(DEPOSITO_ELEVENLABS, `${chiave}.json`);
    if (!nuova && fs.existsSync(mp3) && fs.existsSync(tempi)) return {testo, origine: 'deposito', file: mp3, tempi};
    return {testo, origine: 'elevenlabs', file: mp3, tempi};
  });
}

/** Quanti caratteri si pagherebbero adesso per la voce ElevenLabs di questo copione. */
export function preventivoElevenLabs(copione, lingua, scelte = {}) {
  const voce = voceElevenLabsDi(scelte, lingua);
  if (!aFrasi()) return {caratteri: copione.testoParlato.length, daFare: null, pronte: 0};
  const piano = pianoFrasiElevenLabs(copione, lingua, voce);
  const daFare = piano.filter((f) => f.origine === 'elevenlabs');
  return {caratteri: daFare.reduce((s, f) => s + f.testo.length, 0), daFare: daFare.length, pronte: piano.length - daFare.length};
}

async function chiediElevenLabs(base, voce, chiave, corpo) {
  let risposta;
  try {
    risposta = await fetch(`${base}/v1/text-to-speech/${encodeURIComponent(voce)}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': chiave, 'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(corpo),
    });
  } catch (e) {
    throw new ErroreFmlab(`Non riesco a raggiungere ElevenLabs (${e.cause?.code ?? e.message}). Controlla la connessione e riprova.`);
  }
  if (!risposta.ok) {
    const testo = (await risposta.text()).slice(0, 600);
    const motivi = {
      401: 'chiave API non valida o scaduta (ELEVENLABS_API_KEY)',
      402: 'crediti insufficienti o piano che non include questa funzione',
      404: 'voce non trovata: controlla ELEVENLABS_VOICE_ID',
      422: 'richiesta non accettata: controlla modello e impostazioni nel file .env',
      429: 'troppe richieste o crediti finiti: aspetta un momento e riprova',
    };
    const errore = new ErroreFmlab(`ElevenLabs ha risposto ${risposta.status}: ${motivi[risposta.status] ?? 'errore'}.\n${testo}`);
    errore.stato = risposta.status;
    throw errore;
  }
  const dati = await risposta.json();
  if (!dati.audio_base64) throw new ErroreFmlab('La risposta di ElevenLabs non contiene l\'audio.');
  return dati;
}

/**
 * ElevenLabs frase per frase. Ogni frase pagata resta nel deposito (voci/pagate/): se cambi una frase
 * del testo paghi solo quella, e una frase che torna uguale in un altro reel non si paga più. Le frasi della banca
 * (voci/frasi/) non si pagano mai. A ogni richiesta si dice a ElevenLabs cosa viene prima e cosa viene dopo, perché
 * l'intonazione leghi; se il modello non lo accetta, si rifà la richiesta senza.
 */
async function voceElevenLabsAFrasi(copione, reel, voce, chiave, {nuova = false} = {}) {
  const ff = await trovaFfmpeg();
  const base = baseElevenLabs();
  const regole = regoleElevenLabs();
  fs.mkdirSync(DEPOSITO_ELEVENLABS, {recursive: true});
  const piano = pianoFrasiElevenLabs(copione, reel.lingua, voce, {nuova});
  let conContesto = true;
  let caratteri = 0;
  for (const [i, f] of piano.entries()) {
    if (f.origine !== 'elevenlabs') continue;
    const corpo = {text: f.testo, ...regole};
    const contesto = {...(piano[i - 1] ? {previous_text: piano[i - 1].testo} : {}), ...(piano[i + 1] ? {next_text: piano[i + 1].testo} : {})};
    let dati;
    try {
      dati = await chiediElevenLabs(base, voce, chiave, conContesto ? {...corpo, ...contesto} : corpo);
    } catch (e) {
      if (!conContesto || ![400, 422].includes(e.stato) || !Object.keys(contesto).length) throw e;
      conContesto = false; // questo modello non accetta il testo vicino: da qui in poi senza (una richiesta rifiutata non costa)
      dati = await chiediElevenLabs(base, voce, chiave, corpo);
    }
    fs.writeFileSync(f.file, Buffer.from(dati.audio_base64, 'base64'));
    scriviJson(f.tempi, {testo: f.testo, voce, creata: new Date().toISOString(), allineamento: dati.alignment ?? dati.normalized_alignment});
    caratteri += f.testo.length;
  }
  const inWav = (file) => {
    const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', '-i', file, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', '-f', 'wav', '-'], {maxBuffer: 256 * 1024 * 1024});
    if (r.status !== 0 || !r.stdout?.length) throw new ErroreFmlab(`Non riesco a leggere l'audio ${rel(file)}: ${String(r.stderr || '').trim().slice(0, 200)}`);
    return r.stdout;
  };
  const pronte = new Map();
  for (const f of piano) {
    let parole = null;
    if (f.tempi) {
      try {
        parole = tempiDaCaratteri(f.testo, leggiJson(f.tempi).allineamento);
      } catch {
        parole = null; // senza tempi dei caratteri le parole si distribuiscono sui tratti di voce
      }
    }
    pronte.set(f.testo, {wav: inWav(f.file), parole});
  }
  const {audio, tempi, durata} = montaFrasi(copione, (testo) => pronte.get(testo), {pausaTraFrasi: numeroEnv('ELEVENLABS_PAUSA') ?? 0.32});
  const fileAudio = `${reel.nomeVoce}.wav`;
  fs.writeFileSync(path.join(reel.dir, fileAudio), audio);
  const conta = (origine) => piano.filter((f) => f.origine === origine).length;
  return {
    tempi,
    voce: fileAudio,
    precisione: [...pronte.values()].every((f) => f.parole) ? 'carattere' : 'frase',
    durataAudio: durata,
    caratteri,
    nomeVoce: voce,
    riusata: caratteri === 0,
    frasi: {elevenlabs: conta('elevenlabs'), deposito: conta('deposito'), banca: conta('banca'), senzaContesto: !conContesto},
  };
}

async function voceElevenLabs(copione, reel, scelte = {}, {nuova = false} = {}) {
  const chiave = process.env.ELEVENLABS_API_KEY;
  // la voce: quella scelta per questo reel e questa lingua, altrimenti quella del file .env
  // (una diversa per lingua, se indicata: ELEVENLABS_VOICE_ID_EN, ELEVENLABS_VOICE_ID_ES…)
  const voce = voceElevenLabsDi(scelte, reel.lingua);
  if (!chiave || !voce) {
    throw new ErroreFmlab(
      'Per usare ElevenLabs servono due righe nel file .env (copia .env.esempio in .env):\n' +
        '  ELEVENLABS_API_KEY=la-tua-chiave\n  ELEVENLABS_VOICE_ID=id-della-voce'
    );
  }
  if (aFrasi()) return voceElevenLabsAFrasi(copione, reel, voce, chiave, {nuova});
  // ELEVENLABS_FRASI=no: tutto il testo in una richiesta sola, come prima (ogni modifica ripaga tutto il testo)
  const base = baseElevenLabs();
  const corpo = {text: copione.testoParlato, ...regoleElevenLabs()};

  // stesso testo, stessa voce, stesse impostazioni di una voce già generata? Si riusa: nessun credito speso.
  const file = `${reel.nomeVoce}.mp3`;
  const fileTempi = path.join(reel.dir, `${reel.nomeVoce}.tempi.json`);
  const firma = impronta({voce, ...corpo});
  if (!nuova && fs.existsSync(fileTempi) && fs.existsSync(path.join(reel.dir, file))) {
    try {
      const salvati = leggiJson(fileTempi);
      if (salvati.firma === firma && salvati.allineamento) {
        return {tempi: tempiDaCaratteri(copione.testoParlato, salvati.allineamento), voce: file, precisione: 'carattere', riusata: true, caratteri: 0, nomeVoce: voce};
      }
    } catch {
      // file dei tempi rovinato: si rigenera
    }
  }

  const dati = await chiediElevenLabs(base, voce, chiave, corpo);
  const allineamento = dati.alignment ?? dati.normalized_alignment;
  const tempi = tempiDaCaratteri(copione.testoParlato, allineamento);
  fs.writeFileSync(path.join(reel.dir, file), Buffer.from(dati.audio_base64, 'base64'));
  scriviJson(fileTempi, {firma, creata: new Date().toISOString(), caratteri: copione.testoParlato.length, allineamento});
  return {tempi, voce: file, precisione: 'carattere', caratteri: copione.testoParlato.length, nomeVoce: voce};
}

// ───────────────────────────── voce del Mac ─────────────────────────────

/** Voci del Mac che suonano naturali, in ordine di preferenza, e voci "giocattolo" da evitare. */
const VOCI_BUONE = {
  it: ['Federica', 'Luca', 'Emma', 'Alice', 'Paola'],
  en: ['Ava', 'Zoe', 'Evan', 'Nathan', 'Samantha', 'Allison', 'Tom', 'Susan', 'Daniel', 'Karen', 'Moira', 'Tessa'],
  es: ['Mónica', 'Marisol', 'Jorge', 'Paulina', 'Juan', 'Diego'],
  fr: ['Audrey', 'Aurélie', 'Thomas', 'Amélie'],
  de: ['Petra', 'Anna', 'Markus', 'Yannick'],
  pt: ['Luciana', 'Felipe', 'Joana', 'Catarina'],
};
const VOCI_GIOCATTOLO = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Fred|Good News|Jester|Junior|Kathy|Organ|Superstar|Ralph|Trinoids|Whisper|Zarvox)\b/i;

/** Legge l'elenco stampato da `say -v ?`: [{nome, lingua}]. */
export function leggiVociMac(elenco) {
  const voci = [];
  for (const riga of String(elenco).split('\n')) {
    // "Alice               it_IT    # Ciao! Mi chiamo Alice."   ·   "Luca (Enhanced)     it_IT    # …"
    const m = /^(.+?)\s+([a-z]{2,3}[_-][A-Za-z0-9]{2,4})\s+#/.exec(riga) ?? /^(.+?)\s{2,}([a-z]{2}[_-][A-Z]{2})\s/.exec(riga);
    if (m) voci.push({nome: m[1].trim(), lingua: m[2].replace('-', '_')});
  }
  return voci;
}

/** Le voci installate su questo Mac (elenco vuoto sugli altri computer). */
export function elencoVociMac() {
  if (process.platform !== 'darwin') return [];
  const r = spawnSync('say', ['-v', '?'], {encoding: 'utf8'});
  return r.status === 0 ? leggiVociMac(r.stdout) : [];
}

/** Sceglie la voce migliore per la lingua tra quelle installate sul Mac (Premium > Enhanced > normale). */
export function scegliVoceMac(elenco, richiesta, lingua = 'it') {
  const prefisso = lingua.slice(0, 2).toLowerCase();
  const voci = leggiVociMac(elenco);
  if (richiesta) {
    const cercata = richiesta.toLowerCase();
    const trovata = voci.find((v) => v.nome.toLowerCase() === cercata) ?? voci.find((v) => v.nome.toLowerCase().startsWith(cercata + ' ('));
    if (trovata) return trovata.nome;
    throw new ErroreFmlab(`La voce "${richiesta}" non è installata sul Mac. Voci presenti per "${prefisso}": ${voci.filter((v) => v.lingua.toLowerCase().startsWith(prefisso)).map((v) => v.nome).join(', ') || '(nessuna)'}`);
  }
  const adatte = voci.filter((v) => v.lingua.toLowerCase().startsWith(prefisso));
  if (!adatte.length) {
    throw new ErroreFmlab(
      `Sul Mac non è installata nessuna voce per la lingua "${prefisso}".\n` +
        'Impostazioni di Sistema → Accessibilità → Contenuto letto ad alta voce → Voce di sistema → Gestisci voci.'
    );
  }
  const buone = VOCI_BUONE[prefisso] ?? [];
  const punti = (v) => {
    const qualita = /premium/i.test(v.nome) ? 2 : /enhanced|ottimizzata|migliorata/i.test(v.nome) ? 1 : 0;
    const posto = buone.findIndex((n) => v.nome.toLowerCase().startsWith(n.toLowerCase()));
    return qualita + (posto >= 0 ? 0.6 - posto * 0.05 : 0) - (VOCI_GIOCATTOLO.test(v.nome) ? 1.5 : 0);
  };
  return [...adatte].sort((a, b) => punti(b) - punti(a))[0].nome;
}

/**
 * Divide il tempo di una frase tra le sue parole.
 * `tratti` sono i pezzi di voce trovati nell'audio: le pause più lunghe vengono fatte coincidere con la punteggiatura.
 */
export function distribuisciFrase(testi, tratti, durata) {
  if (!tratti.length) tratti = [[0, durata]];
  // pezzi di frase separati da virgole, due punti, punto e virgola
  const pezzi = [];
  let corrente = [];
  testi.forEach((t, i) => {
    corrente.push(i);
    if (i === testi.length - 1 || /[,;:]$/.test(t)) {
      pezzi.push(corrente);
      corrente = [];
    }
  });
  let gruppi;
  if (tratti.length >= pezzi.length && pezzi.length > 1) {
    // tengo come confini le (pezzi-1) pause più lunghe
    const pause = tratti.slice(1).map((t, k) => ({k: k + 1, lunga: t[0] - tratti[k][1]}));
    const confini = pause
      .sort((a, b) => b.lunga - a.lunga)
      .slice(0, pezzi.length - 1)
      .map((p) => p.k)
      .sort((a, b) => a - b);
    gruppi = [];
    let da = 0;
    for (const c of [...confini, tratti.length]) {
      gruppi.push([tratti[da][0], tratti[c - 1][1]]);
      da = c;
    }
  } else {
    gruppi = [[tratti[0][0], tratti[tratti.length - 1][1]]];
    pezzi.splice(0, pezzi.length, testi.map((_, i) => i));
  }
  const tempi = new Array(testi.length);
  pezzi.forEach((indici, g) => {
    const [a, b] = gruppi[g];
    const pesi = indici.map((i, k) => pesoParola(testi[i]) + (k < indici.length - 1 ? pausaDopo(testi[i]) : 0));
    const totale = pesi.reduce((s, p) => s + p, 0);
    let t = a;
    indici.forEach((i, k) => {
      const quota = ((b - a) * pesi[k]) / totale;
      const parlato = ((b - a) * pesoParola(testi[i])) / totale;
      tempi[i] = {inizio: t, fine: t + parlato};
      t += quota;
    });
  });
  return tempi;
}

/** Monta le frasi una dopo l'altra e calcola i tempi di ogni parola. `sintetizza(testo)` restituisce un WAV (Buffer). */
export function montaFrasi(copione, sintetizza, {pausaTraFrasi = 0.3, attesaIniziale = 0.2} = {}) {
  const frasi = [];
  copione.parole.forEach((p, i) => {
    (frasi[p.frase] ??= []).push(i);
  });
  const blocchi = [];
  const tempi = new Array(copione.parole.length);
  let frequenza = null;
  let canali = 1;
  let t = attesaIniziale;
  let primo = true;
  for (const indici of frasi.filter(Boolean)) {
    const testi = indici.map((i) => copione.parole[i].testo);
    // chi sintetizza può dare solo l'audio, oppure {wav, parole}: i tempi esatti di ogni parola dentro la frase
    const reso = sintetizza(testi.join(' '));
    const wav = leggiWav(Buffer.isBuffer(reso) ? reso : reso.wav);
    const esatti = !Buffer.isBuffer(reso) && Array.isArray(reso.parole) && reso.parole.length === testi.length ? reso.parole : null;
    if (frequenza === null) {
      frequenza = wav.frequenza;
      canali = wav.canali;
      blocchi.push(silenzio(attesaIniziale, frequenza, canali));
    } else if (wav.frequenza !== frequenza || wav.canali !== canali) {
      throw new ErroreFmlab('Le frasi sintetizzate hanno formati audio diversi.');
    }
    const tratti = trattiDiVoce(wav);
    const da = tratti.length ? Math.max(0, tratti[0][0] - 0.03) : 0;
    const a = tratti.length ? Math.min(wav.durata, tratti[tratti.length - 1][1] + 0.06) : wav.durata;
    if (!primo) {
      blocchi.push(silenzio(pausaTraFrasi, frequenza, canali));
      t += pausaTraFrasi;
    }
    primo = false;
    const pezzo = taglia(wav, da, a);
    blocchi.push(pezzo);
    const durataPezzo = pezzo.length / (2 * canali) / frequenza;
    const dentro = (x) => Math.min(durataPezzo, Math.max(0, x - da));
    const locali = esatti
      ? esatti.map((p) => ({inizio: dentro(p.inizio), fine: dentro(p.fine)}))
      : distribuisciFrase(
          testi,
          tratti.map(([x, y]) => [x - da, y - da]),
          durataPezzo
        );
    indici.forEach((i, k) => {
      tempi[i] = {inizio: t + locali[k].inizio, fine: t + locali[k].fine};
    });
    t += durataPezzo;
  }
  blocchi.push(silenzio(0.25, frequenza, canali));
  return {audio: scriviWav(Buffer.concat(blocchi), frequenza, canali), tempi, durata: t + 0.25};
}

/** Una frase letta dalla voce del Mac, in un file WAV: serve al pannello per far ascoltare una voce prima di sceglierla. */
export function assaggioVoceMac(testo, voce, fileUscita) {
  if (process.platform !== 'darwin') throw new ErroreFmlab('La voce del Mac si può ascoltare solo su un Mac.');
  const fileTesto = `${fileUscita}.txt`;
  fs.mkdirSync(path.dirname(fileUscita), {recursive: true});
  fs.writeFileSync(fileTesto, testo);
  const r = spawnSync('say', ['-v', voce, '-f', fileTesto, '--file-format=WAVE', '--data-format=LEI16@22050', '-o', fileUscita], {encoding: 'utf8'});
  fs.rmSync(fileTesto, {force: true});
  if (r.status !== 0 || !fs.existsSync(fileUscita)) throw new ErroreFmlab(`La voce "${voce}" non ha risposto: ${(r.stderr || '').trim().slice(0, 200)}`);
  return fileUscita;
}

async function voceMac(copione, reel, scelte = {}) {
  if (process.platform !== 'darwin') {
    throw new ErroreFmlab('La voce "mac" funziona solo su macOS. Qui puoi usare:  npm run voce <reel> stima   oppure   elevenlabs');
  }
  const elenco = spawnSync('say', ['-v', '?'], {encoding: 'utf8'});
  if (elenco.status !== 0) throw new ErroreFmlab('Il comando `say` del Mac non risponde.');
  const richiesta = scelte.mac?.[reel.lingua] || process.env[`FMLAB_VOCE_MAC_${reel.lingua.toUpperCase().replace('-', '_')}`] || (reel.variante ? undefined : process.env.FMLAB_VOCE_MAC);
  const voce = scegliVoceMac(elenco.stdout, richiesta, reel.lingua);
  const velocita = numeroEnv('FMLAB_VELOCITA_MAC');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-voce-'));
  // secondo modo, se il primo non va su questa versione di macOS: audio AIFF convertito con ffmpeg
  let ff = null;
  let viaAiff = false;
  try {
    ff = await trovaFfmpeg();
  } catch {
    ff = null;
  }
  let n = 0;
  try {
    const sintetizza = (testo) => {
      const k = n++;
      const fileTesto = path.join(temp, `frase-${k}.txt`);
      const fileWav = path.join(temp, `frase-${k}.wav`);
      // il testo passa da un file: niente problemi con virgolette, trattini o frasi lunghe
      fs.writeFileSync(fileTesto, testo);
      const base = ['-v', voce, ...(velocita ? ['-r', String(Math.round(velocita))] : []), '-f', fileTesto];
      let errore = '';
      if (!viaAiff) {
        const r = spawnSync('say', [...base, '--file-format=WAVE', '--data-format=LEI16@22050', '-o', fileWav], {encoding: 'utf8'});
        if (r.status === 0 && fs.existsSync(fileWav)) {
          const audio = fs.readFileSync(fileWav);
          try {
            leggiWav(audio);
            return audio;
          } catch (e) {
            errore = e.message;
          }
        } else errore = (r.stderr || '').trim();
        if (!ff) throw new ErroreFmlab(`Il comando \`say\` non è riuscito a creare l'audio: ${errore.slice(0, 300)}`);
        viaAiff = true;
      }
      const fileAiff = path.join(temp, `frase-${k}.aiff`);
      const r = spawnSync('say', [...base, '-o', fileAiff], {encoding: 'utf8'});
      if (r.status !== 0 || !fs.existsSync(fileAiff)) {
        throw new ErroreFmlab(`Il comando \`say\` non è riuscito a creare l'audio: ${((r.stderr || '').trim() || errore).slice(0, 300)}`);
      }
      const c = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', '-i', fileAiff, '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le', '-y', fileWav], {encoding: 'utf8'});
      if (c.status !== 0 || !fs.existsSync(fileWav)) throw new ErroreFmlab(`Non riesco a convertire l'audio del Mac: ${(c.stderr || '').trim().slice(0, 300)}`);
      return fs.readFileSync(fileWav);
    };
    const {audio, tempi, durata} = montaFrasi(copione, sintetizza);
    const fileAudio = `${reel.nomeVoce}.wav`;
    fs.writeFileSync(path.join(reel.dir, fileAudio), audio);
    return {tempi, voce: fileAudio, precisione: 'frase', durataAudio: durata, nomeVoce: voce};
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
}

// ───────────────────────────── qualsiasi altra voce (motore "comando") ─────────────────────────────
//
// Nel file .env:   FMLAB_VOCE_COMANDO=node voci/mia-voce.mjs {testo} {uscita} {lingua} {voce}
// Il kit chiama il comando una volta per frase: deve leggere la frase dal file {testo} e scrivere l'audio nel
// file {uscita} (WAV, MP3, AIFF… qualsiasi formato che ffmpeg sa leggere). {lingua} è "it", "en"…; {voce} è il
// nome scelto per quel reel (può mancare). Le frasi già fatte vengono riusate: se cambi una frase del copione,
// si rigenera solo quella.

export function spezza(riga) {
  const pezzi = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(riga))) pezzi.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : (m[2] ?? m[3]));
  return pezzi;
}

async function voceComando(copione, reel, scelte = {}, {nuova = false} = {}) {
  const riga = process.env.FMLAB_VOCE_COMANDO;
  if (!riga) {
    throw new ErroreFmlab(
      'Per il motore "comando" serve nel file .env la riga FMLAB_VOCE_COMANDO, per esempio:\n' +
        '  FMLAB_VOCE_COMANDO=node voci/mia-voce.mjs {testo} {uscita} {lingua} {voce}\n' +
        'Come scrivere il programma: voci/COME-FARE.md'
    );
  }
  const ff = await trovaFfmpeg();
  const nomeVoce = scelte.comando?.[reel.lingua] ?? '';
  const deposito = path.join(CACHE, 'frasi-voce');
  fs.mkdirSync(deposito, {recursive: true});
  let fatte = 0;
  let riusate = 0;
  let caratteri = 0;
  const sintetizza = (testo) => {
    const chiave = impronta({riga, testo, lingua: reel.lingua, nomeVoce});
    const fileWav = path.join(deposito, `${chiave}.wav`);
    if (!nuova && fs.existsSync(fileWav)) {
      riusate++;
      return fs.readFileSync(fileWav);
    }
    const fileTesto = path.join(deposito, `${chiave}.txt`);
    const grezzo = path.join(deposito, `${chiave}.grezzo`);
    fs.writeFileSync(fileTesto, testo);
    fs.rmSync(grezzo, {force: true});
    const pezzi = spezza(riga).map((p) => p.replaceAll('{testo}', fileTesto).replaceAll('{uscita}', grezzo).replaceAll('{lingua}', reel.lingua).replaceAll('{voce}', nomeVoce));
    const r = spawnSync(pezzi[0], pezzi.slice(1), {cwd: RADICE, encoding: 'utf8', timeout: 180000});
    if (r.error || r.status !== 0 || !fs.existsSync(grezzo) || fs.statSync(grezzo).size < 64) {
      throw new ErroreFmlab(`Il comando della voce non ha prodotto l'audio per la frase "${testo.slice(0, 50)}…":\n  ${(r.error?.message || r.stderr || r.stdout || 'nessun file scritto in {uscita}').trim().slice(0, 400)}`);
    }
    const c = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', '-i', grezzo, '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le', '-f', 'wav', '-y', fileWav], {encoding: 'utf8'});
    fs.rmSync(grezzo, {force: true});
    fs.rmSync(fileTesto, {force: true});
    if (c.status !== 0 || !fs.existsSync(fileWav)) throw new ErroreFmlab(`Non riesco a leggere l'audio prodotto dal comando della voce: ${(c.stderr || '').trim().slice(0, 300)}`);
    fatte++;
    caratteri += testo.length;
    return fs.readFileSync(fileWav);
  };
  const {audio, tempi, durata} = montaFrasi(copione, sintetizza);
  const fileAudio = `${reel.nomeVoce}.wav`;
  fs.writeFileSync(path.join(reel.dir, fileAudio), audio);
  return {tempi, voce: fileAudio, precisione: 'frase', durataAudio: durata, nomeVoce: nomeVoce || 'comando', frasiFatte: fatte, frasiRiusate: riusate, caratteri};
}

// ───────────────────────────── comando ─────────────────────────────

/** npm run voce <reel> [lingua] [elevenlabs|mac|comando|stima] [nuova] */
export async function comandoVoce(slug, argomenti = []) {
  leggiEnv();
  const {variante, resto: tutti} = estraiVariante(slug, argomenti);
  const reel = apriReel(slug, variante);
  const copione = leggiCopione(fs.readFileSync(reel.copione, 'utf8'));
  // "nuova" = rigenera anche se testo e voce non sono cambiati
  const nuova = tutti.includes('nuova');
  const resto = tutti.filter((a) => a !== 'nuova');
  let scelte = {motore: 'auto', elevenlabs: {}, mac: {}, comando: {}};
  let chiesta = null;
  try {
    const impostazioni = leggiImpostazioni(slug);
    scelte = impostazioni.voce ?? scelte;
    chiesta = impostazioni.durata ?? null;
  } catch {
    // impostazioni non leggibili: si va con quelle di serie (l'errore lo segnalano foto, render e verifica)
  }
  // se la persona ha dato il testo del reel (testo.txt), il copione deve pronunciare quello, parola per parola
  const fileTesto = path.join(reel.dir, `testo${reel.suffisso}.txt`);
  if (fs.existsSync(fileTesto)) {
    const diverso = confrontaTesto(testoDaDire(fs.readFileSync(fileTesto, 'utf8')), copione.testoParlato);
    if (diverso) {
      throw new ErroreFmlab(
        `Il copione non dice più il testo dato (${rel(fileTesto)}): alla parola ${diverso.parola} c'è "${diverso.trovato}" al posto di "${diverso.atteso}".\n` +
          'Il testo si pronuncia parola per parola: nel copione si aggiungono solo scene, segni, enfasi e suoni.\n' +
          `Se il testo nuovo è voluto da chi lo ha scritto, aggiorna ${rel(fileTesto)} e riprova.`
      );
    }
  }

  let motore = resto[0];
  if (resto.length > 1 || (motore && !MOTORI.includes(motore))) {
    throw new ErroreFmlab(`Non capisco "${resto.join(' ')}". Uso: npm run voce ${slug} [lingua] [${MOTORI.join('|')}] [nuova]`);
  }
  if (!motore && scelte.motore !== 'auto') motore = scelte.motore;
  if (!motore) {
    const voceEleven = scelte.elevenlabs?.[reel.lingua] || process.env.ELEVENLABS_VOICE_ID || process.env[`ELEVENLABS_VOICE_ID_${reel.lingua.toUpperCase()}`];
    if (process.env.ELEVENLABS_API_KEY && voceEleven) motore = 'elevenlabs';
    else if (process.env.FMLAB_VOCE_COMANDO) motore = 'comando';
    else if (process.platform === 'darwin') motore = 'mac';
    else motore = 'stima';
    console.log(`Motore voce scelto in automatico: ${motore}`);
  }

  // prima di spendere: se il testo non può stare nella durata chiesta nemmeno alla velocità massima, lo si dice adesso
  const coda = numeroEnv('FMLAB_CODA') ?? 1.4;
  if (chiesta && motore !== 'stima' && copione.parole.length > paroleMassime(chiesta, coda)) {
    const troppe = copione.parole.length - paroleMassime(chiesta, coda);
    throw new ErroreFmlab(
      `Il testo ha ${copione.parole.length} parole: in ${chiesta} secondi (più 5 di scarto) ne entrano al massimo ${paroleMassime(chiesta, coda)}, anche con la voce a velocità ${String(VELOCITA_MASSIMA).replace('.', ',')}.\n` +
        `Non ho generato la voce (nessun credito speso). Si può: togliere almeno ${troppe} parole dal testo, oppure chiedere una durata di almeno ${durataMinima(copione.parole.length, coda)} secondi:\n` +
        `  npm run imposta ${slug} durata=${durataMinima(copione.parole.length, coda)}`
    );
  }

  let esito;
  if (motore === 'elevenlabs') esito = await voceElevenLabs(copione, reel, scelte, {nuova});
  else if (motore === 'mac') esito = await voceMac(copione, reel, scelte);
  else if (motore === 'comando') esito = await voceComando(copione, reel, scelte, {nuova});
  else esito = {tempi: stimaTempi(copione.parole, {ritmo: numeroEnv('FMLAB_RITMO_STIMA') ?? ritmoMisurato(reel.lingua) ?? 1}), voce: null, precisione: 'stimata'};
  // ogni spesa finisce nel registro: la dashboard dice quanti crediti sono andati, e per quale reel
  if (motore === 'elevenlabs' && esito.caratteri > 0) annota('spesa', {reel: slug, caratteri: esito.caratteri, motore, frasi: esito.frasi?.elevenlabs ?? null});

  // un solo file voce per versione: via quello dell'altro formato, se c'era
  if (esito.voce) {
    for (const est of ['mp3', 'wav']) {
      const altro = path.join(reel.dir, `${reel.nomeVoce}.${est}`);
      if (path.basename(altro) !== esito.voce && fs.existsSync(altro)) fs.rmSync(altro);
    }
  }

  // la durata chiesta: se la voce è troppo lunga la si velocizza. L'audio resta com'è sul disco (così si riusa senza
  // spendere): la velocità sta scritta in parole.json, e render e anteprima la applicano alla voce mentre suona.
  const fineNaturale = Math.max(...esito.tempi.map((t) => t.fine));
  const misura = adattaDurata({fineVoce: fineNaturale, coda, parole: copione.parole.length, chiesta});
  const v = misura.velocita;
  const dati = componiDati(copione, v === 1 ? esito.tempi : esito.tempi.map((t) => ({inizio: t.inizio / v, fine: t.fine / v})), {
    motore,
    precisione: esito.precisione,
    voce: esito.voce,
    durataAudio: esito.durataAudio ? esito.durataAudio / v : null,
    coda,
    lingua: reel.lingua,
    velocita: v,
  });
  scriviJson(reel.parole, dati);
  fs.writeFileSync(reel.srt, creaSrt(dati.parole));

  console.log(`\nVoce pronta per "${reel.nome}"  ·  lingua: ${reel.lingua}  ·  motore: ${motore}${esito.nomeVoce ? ` (${esito.nomeVoce})` : ''}  ·  precisione: ${esito.precisione}`);
  console.log(`  parole: ${dati.parole.length}   durata video: ${sec(dati.durata)}   audio: ${esito.voce ? rel(path.join(reel.dir, esito.voce)) : '(nessuno, tempi stimati)'}`);
  if (chiesta) {
    const virgola = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
    if (misura.entra && v > 1) console.log(`  durata chiesta: ${chiesta} s — a ritmo naturale erano ${sec(fineNaturale + coda, 1)}: voce a velocità ${virgola(v)}, il testo non è stato toccato.`);
    else if (misura.entra) console.log(`  durata chiesta: ${chiesta} s — ci sta a velocità normale.`);
    else if (misura.paroleDaTogliere) {
      console.log(`  ✖ durata chiesta: ${chiesta} s — anche a velocità ${virgola(VELOCITA_MASSIMA)} il reel dura ${sec(dati.durata, 1)}: è fuori dai 5 secondi di scarto.`);
      console.log(`    Togli circa ${misura.paroleDaTogliere} parole dal testo, oppure chiedi una durata più lunga:  npm run imposta ${slug} durata=${Math.ceil((dati.durata - 5) / 5) * 5}`);
    } else {
      console.log(`  ✖ durata chiesta: ${chiesta} s — il reel dura ${sec(dati.durata, 1)}: è più corto di oltre 5 secondi, e la voce non si rallenta.`);
      console.log(`    Servono circa ${misura.paroleMancanti} parole in più, oppure chiedi una durata più corta:  npm run imposta ${slug} durata=${Math.max(15, Math.round(dati.durata / 5) * 5)}`);
    }
  }
  // quanto è costata: così si vede subito se si stanno spendendo crediti
  if (esito.riusata && esito.frasi) console.log(`  crediti: 0 — tutte le ${esito.frasi.deposito + esito.frasi.banca} frasi erano già pronte (${esito.frasi.banca} dalla banca).`);
  else if (esito.riusata) console.log(`  crediti: 0 — testo, voce e impostazioni non sono cambiati, ho riusato la voce già generata.  (Per rifarla comunque: npm run voce ${slug}${reel.variante ? ' ' + reel.variante : ''} nuova)`);
  else if (motore === 'elevenlabs' && esito.frasi) {
    console.log(`  crediti: ${esito.caratteri} caratteri inviati a ElevenLabs per ${esito.frasi.elevenlabs} frasi; ${esito.frasi.deposito} già pagate e riusate, ${esito.frasi.banca} dalla banca (voci/frasi/). Se cambi una frase, paghi solo quella.`);
    if (esito.frasi.senzaContesto) console.log('  Nota: questo modello non accetta il testo vicino, le frasi sono state generate una per una: ascolta se legano.');
  } else if (motore === 'elevenlabs') console.log(`  crediti: ${esito.caratteri} caratteri inviati a ElevenLabs. Finché non cambi il testo, rilanciare questo comando non ne consuma altri.`);
  else if (motore === 'comando') console.log(`  frasi: ${esito.frasiFatte} generate (${esito.caratteri} caratteri), ${esito.frasiRiusate} riusate senza rigenerarle.`);
  else if (motore === 'mac') console.log('  crediti: 0 — la voce del Mac è gratuita.');
  console.log('  scene:');
  for (const s of dati.scene) console.log(`    ${s.nome.padEnd(14)} ${sec(s.inizio).padStart(8)} → ${sec(s.fine).padStart(8)}`);
  const segni = Object.entries(dati.segni).sort((a, b) => a[1] - b[1]);
  if (segni.length) {
    console.log('  segni:');
    console.log('    ' + segni.map(([n, t]) => `${n} ${t.toFixed(2)}`).join('  ·  '));
  }
  if (motore === 'stima') {
    console.log('\n  Nota: i tempi sono stimati e il video sarà muto. Quando le scene ti convincono, genera la voce vera:');
    console.log(`    npm run voce ${slug}${reel.variante ? ' ' + reel.variante : ''}`);
  }
  return dati;
}
