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
import {leggiImpostazioni} from './impostazioni.mjs';
import {apriReel, estraiVariante} from './reel.mjs';
import {componiDati, leggiCopione, pausaDopo, pesoParola, stimaTempi, tempiDaCaratteri} from './copione.mjs';
import {leggiWav, scriviWav, silenzio, taglia, trattiDiVoce} from './wav.mjs';
import {creaSrt} from './comune/pagine.mjs';
import {trovaFfmpeg} from './ffmpeg.mjs';

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

async function voceElevenLabs(copione, reel, scelte = {}, {nuova = false} = {}) {
  const chiave = process.env.ELEVENLABS_API_KEY;
  // la voce: quella scelta per questo reel e questa lingua, altrimenti quella del file .env
  // (una diversa per lingua, se indicata: ELEVENLABS_VOICE_ID_EN, ELEVENLABS_VOICE_ID_ES…)
  const voce = scelte.elevenlabs?.[reel.lingua] || process.env[`ELEVENLABS_VOICE_ID_${reel.lingua.toUpperCase().replace('-', '_')}`] || process.env.ELEVENLABS_VOICE_ID;
  if (!chiave || !voce) {
    throw new ErroreFmlab(
      'Per usare ElevenLabs servono due righe nel file .env (copia .env.esempio in .env):\n' +
        '  ELEVENLABS_API_KEY=la-tua-chiave\n  ELEVENLABS_VOICE_ID=id-della-voce'
    );
  }
  const base = baseElevenLabs();
  const corpo = {
    text: copione.testoParlato,
    model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  };
  const impostazioni = {
    stability: numeroEnv('ELEVENLABS_STABILITY'),
    similarity_boost: numeroEnv('ELEVENLABS_SIMILARITY'),
    style: numeroEnv('ELEVENLABS_STYLE'),
    speed: numeroEnv('ELEVENLABS_SPEED'),
  };
  const regolazioni = Object.fromEntries(Object.entries(impostazioni).filter(([, v]) => v !== undefined));
  if (Object.keys(regolazioni).length) corpo.voice_settings = regolazioni;
  if (process.env.ELEVENLABS_LANGUAGE) corpo.language_code = process.env.ELEVENLABS_LANGUAGE;

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
    throw new ErroreFmlab(`ElevenLabs ha risposto ${risposta.status}: ${motivi[risposta.status] ?? 'errore'}.\n${testo}`);
  }
  const dati = await risposta.json();
  if (!dati.audio_base64) throw new ErroreFmlab('La risposta di ElevenLabs non contiene l\'audio.');
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
    const wav = leggiWav(sintetizza(testi.join(' ')));
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
    const locali = distribuisciFrase(
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
  try {
    scelte = leggiImpostazioni(slug).voce ?? scelte;
  } catch {
    // impostazioni non leggibili: si va con quelle di serie (l'errore lo segnalano foto, render e verifica)
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

  let esito;
  if (motore === 'elevenlabs') esito = await voceElevenLabs(copione, reel, scelte, {nuova});
  else if (motore === 'mac') esito = await voceMac(copione, reel, scelte);
  else if (motore === 'comando') esito = await voceComando(copione, reel, scelte, {nuova});
  else esito = {tempi: stimaTempi(copione.parole, {ritmo: numeroEnv('FMLAB_RITMO_STIMA') ?? 1}), voce: null, precisione: 'stimata'};

  // un solo file voce per versione: via quello dell'altro formato, se c'era
  if (esito.voce) {
    for (const est of ['mp3', 'wav']) {
      const altro = path.join(reel.dir, `${reel.nomeVoce}.${est}`);
      if (path.basename(altro) !== esito.voce && fs.existsSync(altro)) fs.rmSync(altro);
    }
  }

  const dati = componiDati(copione, esito.tempi, {
    motore,
    precisione: esito.precisione,
    voce: esito.voce,
    durataAudio: esito.durataAudio ?? null,
    coda: numeroEnv('FMLAB_CODA') ?? 1.4,
    lingua: reel.lingua,
  });
  scriviJson(reel.parole, dati);
  fs.writeFileSync(reel.srt, creaSrt(dati.parole));

  console.log(`\nVoce pronta per "${reel.nome}"  ·  lingua: ${reel.lingua}  ·  motore: ${motore}${esito.nomeVoce ? ` (${esito.nomeVoce})` : ''}  ·  precisione: ${esito.precisione}`);
  console.log(`  parole: ${dati.parole.length}   durata video: ${sec(dati.durata)}   audio: ${esito.voce ? rel(path.join(reel.dir, esito.voce)) : '(nessuno, tempi stimati)'}`);
  // quanto è costata: così si vede subito se si stanno spendendo crediti
  if (esito.riusata) console.log(`  crediti: 0 — testo, voce e impostazioni non sono cambiati, ho riusato la voce già generata.  (Per rifarla comunque: npm run voce ${slug}${reel.variante ? ' ' + reel.variante : ''} nuova)`);
  else if (motore === 'elevenlabs') console.log(`  crediti: ${esito.caratteri} caratteri inviati a ElevenLabs. Finché non cambi il testo, rilanciare questo comando non ne consuma altri.`);
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
