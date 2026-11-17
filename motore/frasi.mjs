// FMLAB Reel Kit — LA BANCA DELLE FRASI: frasi già dette dalla voce dei reel, da riusare senza spendere.
//
//   npm run frasi                              cosa c'è in banca
//   npm run frasi <audio> <testo.txt> [lingua]  taglia l'audio frase per frase e lo mette in banca
//
// L'audio è una registrazione sola (mp3, wav, m4a) in cui la voce dei reel legge il testo dall'inizio alla fine.
// Il kit trova le pause, fa corrispondere ogni frase al suo pezzo e salva i pezzi in voci/frasi/. Da quel momento,
// quando in un reel c'è una di quelle frasi scritta uguale, la voce non viene rigenerata: si usa il pezzo.
// Dalla stessa registrazione si misura il passo della voce: i tempi stimati diventano quelli veri.
//
// Una banca di frasi non fa dire parole nuove: per quelle serve la voce (ElevenLabs, frase per frase).
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {leggiCopione, stimaTempi} from './copione.mjs';
import {trovaFfmpeg} from './ffmpeg.mjs';
import {ErroreFmlab, RADICE, leggiJson, scriviJson} from './percorsi.mjs';
import {leggiWav, scriviWav, taglia, trattiDiVoce} from './wav.mjs';

/** La cartella della banca (FMLAB_FRASI la sposta: serve alle prove, per non toccare quella vera). */
export const CARTELLA_FRASI = process.env.FMLAB_FRASI ? path.resolve(process.env.FMLAB_FRASI) : path.join(RADICE, 'voci', 'frasi');
const INDICE = path.join(CARTELLA_FRASI, 'indice.json');

/** Due frasi sono la stessa se hanno le stesse parole e lo stesso tono (domanda, esclamazione, o né l'una né l'altra). */
export function chiaveFrase(testo) {
  const parole = String(testo).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const fine = String(testo).replace(/[^\p{L}\p{N}.?!…]+$/u, '').slice(-1);
  return parole + (fine === '?' || fine === '!' ? fine : '');
}

export function leggiBanca() {
  try {
    const dati = leggiJson(INDICE);
    return {ritmo: dati.ritmo ?? {}, frasi: Array.isArray(dati.frasi) ? dati.frasi : []};
  } catch {
    return {ritmo: {}, frasi: []};
  }
}

/** La frase in banca, se c'è e il suo file esiste: {testo, chiave, lingua, file, secondi}. */
export function cercaFrase(testo, lingua = 'it', banca = leggiBanca()) {
  const chiave = chiaveFrase(testo);
  const voce = banca.frasi.find((f) => f.chiave === chiave && f.lingua === lingua);
  return voce && fs.existsSync(path.join(RADICE, voce.file)) ? voce : null;
}

/** Di quanto la voce vera è più svelta della stima del kit (1 = uguale). Null se non è mai stata misurata. */
export function ritmoMisurato(lingua = 'it') {
  const r = leggiBanca().ritmo?.[lingua];
  return typeof r === 'number' && r > 0.4 && r < 2.5 ? r : null;
}

/** Le frasi di un testo qualsiasi, divise come le divide il kit quando genera la voce. */
export function frasiDelTesto(testo) {
  const pulito = String(testo).replace(/\*\*/g, '').replace(/^\s*#.*$/gm, '');
  const copione = leggiCopione(`[scena:banca]\n${pulito}`);
  const gruppi = [];
  copione.parole.forEach((p) => (gruppi[p.frase] ??= []).push(p));
  return gruppi.filter(Boolean).map((parole) => {
    const tempi = stimaTempi(parole);
    return {testo: parole.map((p) => p.testo).join(' '), parole: parole.length, stimata: tempi[tempi.length - 1].fine - tempi[0].inizio};
  });
}

/**
 * Fa corrispondere le frasi ai tratti di voce: sceglie tra le pause quelle che chiudono una frase, così che ogni
 * frase duri quanto ci si aspetta dalle sue parole e i tagli cadano sulle pause più lunghe.
 * @param {[number, number][]} tratti  i tratti di voce, in secondi
 * @param {number[]} attese  la durata stimata di ogni frase (conta la proporzione, non il valore)
 * @returns {[number, number][]} inizio e fine di ogni frase
 */
export function allineaFrasi(tratti, attese) {
  const N = attese.length;
  const T = tratti.length;
  if (T < N) throw new ErroreFmlab(`Nell'audio trovo ${T} tratti di voce, ma il testo ha ${N} frasi: l'audio non è la lettura di questo testo, oppure le frasi sono dette senza pause.`);
  const voce = tratti[T - 1][1] - tratti[0][0];
  const scala = voce / (attese.reduce((a, b) => a + b, 0) + (N - 1) * 0.45);
  const costo = (i, da, a) => {
    const durata = tratti[a][1] - tratti[da][0];
    const attesa = attese[i] * scala;
    return ((durata - attesa) / attesa) ** 2;
  };
  const premio = (k) => 0.6 * Math.min(1, tratti[k + 1][0] - tratti[k][1]);
  const dp = Array.from({length: N}, () => new Array(T).fill(Infinity));
  const da = Array.from({length: N}, () => new Array(T).fill(-1));
  for (let j = 0; j <= T - N; j++) dp[0][j] = costo(0, 0, j);
  for (let i = 1; i < N; i++) {
    for (let j = i; j <= T - N + i; j++) {
      for (let k = i - 1; k < j; k++) {
        if (dp[i - 1][k] === Infinity) continue;
        const c = dp[i - 1][k] + costo(i, k + 1, j) - premio(k);
        if (c < dp[i][j]) {
          dp[i][j] = c;
          da[i][j] = k;
        }
      }
    }
  }
  const fini = new Array(N);
  let j = T - 1;
  for (let i = N - 1; i >= 0; i--) {
    fini[i] = j;
    j = da[i][j];
  }
  return fini.map((fine, i) => [tratti[i === 0 ? 0 : fini[i - 1] + 1][0], tratti[fine][1]]);
}

const nomeFile = (testo) =>
  `${testo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${crypto.createHash('sha256').update(chiaveFrase(testo)).digest('hex').slice(0, 6)}`;

/** Taglia una registrazione nelle sue frasi e le mette in banca. */
export async function mettiInBanca(fileAudio, testo, {lingua = 'it'} = {}) {
  const ff = await trovaFfmpeg();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-frasi-'));
  try {
    const intero = path.join(tmp, 'intero.wav');
    const c = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', '-i', fileAudio, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', '-f', 'wav', '-y', intero], {encoding: 'utf8'});
    if (c.status !== 0 || !fs.existsSync(intero)) throw new ErroreFmlab(`Non riesco a leggere l'audio ${fileAudio}: ${(c.stderr || '').trim().slice(0, 300)}`);
    const wav = leggiWav(fs.readFileSync(intero));
    const tratti = trattiDiVoce(wav, {pausaMinima: 0.14});
    const frasi = frasiDelTesto(testo);
    if (!frasi.length) throw new ErroreFmlab('Il testo è vuoto.');
    const posti = allineaFrasi(tratti, frasi.map((f) => f.stimata));
    const cartella = path.join(CARTELLA_FRASI, lingua);
    fs.mkdirSync(cartella, {recursive: true});
    const banca = leggiBanca();
    const scala = posti.reduce((s, [a, b]) => s + (b - a), 0) / frasi.reduce((s, f) => s + f.stimata, 0);
    const fatte = frasi.map((f, i) => {
      const [inizio, fine] = posti[i];
      const pezzo = path.join(tmp, `f${i}.wav`);
      fs.writeFileSync(pezzo, scriviWav(taglia(wav, Math.max(0, inizio - 0.04), Math.min(wav.durata, fine + 0.09)), wav.frequenza, wav.canali));
      const file = path.join(cartella, `${nomeFile(f.testo)}.mp3`);
      const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', '-i', pezzo, '-c:a', 'libmp3lame', '-b:a', '128k', '-y', file], {encoding: 'utf8'});
      if (r.status !== 0) throw new ErroreFmlab(`Non riesco a salvare la frase "${f.testo.slice(0, 40)}…": ${(r.stderr || '').trim().slice(0, 200)}`);
      const secondi = Math.round((fine - inizio) * 100) / 100;
      // una frase molto più lunga o più corta del previsto è il segno di un taglio caduto nel posto sbagliato
      const scarto = (fine - inizio) / (f.stimata * scala) - 1;
      return {testo: f.testo, chiave: chiaveFrase(f.testo), lingua, file: path.relative(RADICE, file), secondi, parole: f.parole, daAscoltare: Math.abs(scarto) > 0.35 && Math.abs(fine - inizio - f.stimata * scala) > 0.5};
    });
    const chiavi = new Set(fatte.map((f) => `${f.lingua}|${f.chiave}`));
    const parlato = fatte.reduce((s, f) => s + f.secondi, 0);
    const ritmo = Math.round((frasi.reduce((s, f) => s + f.stimata, 0) / parlato) * 1000) / 1000;
    scriviJson(INDICE, {
      cosa: 'Frasi già dette dalla voce dei reel: quando un reel ne contiene una scritta uguale, si usa questo audio e non si spende. Si riempie con: npm run frasi <audio> <testo.txt>',
      ritmo: {...banca.ritmo, [lingua]: ritmo},
      frasi: [...banca.frasi.filter((f) => !chiavi.has(`${f.lingua}|${f.chiave}`)), ...fatte.map(({daAscoltare, ...f}) => f)],
    });
    const parole = fatte.reduce((s, f) => s + f.parole, 0);
    return {frasi: fatte, ritmo, paroleAlMinuto: Math.round((parole / (tratti[tratti.length - 1][1] - tratti[0][0])) * 60), durata: wav.durata};
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

export async function comandoFrasi(argomenti = []) {
  const lingua = argomenti.find((a) => /^lingua=/.test(a))?.split('=')[1] ?? argomenti.find((a) => /^[a-z]{2}$/.test(a)) ?? 'it';
  const file = argomenti.filter((a) => !/^lingua=|^[a-z]{2}$/.test(a));
  if (file.length < 2) {
    const banca = leggiBanca();
    if (!banca.frasi.length) {
      console.log('\nLa banca delle frasi è vuota.\n\n  npm run frasi <audio.mp3> <testo.txt>\n\nL\'audio è la voce dei reel che legge il testo dall\'inizio alla fine, una frase per riga, in una registrazione sola.');
      return;
    }
    console.log(`\nIn banca ci sono ${banca.frasi.length} frasi (voci/frasi/): in un reel, scritte uguali, non costano.\n`);
    for (const f of banca.frasi) console.log(`  ${f.lingua}  ${String(f.secondi).padStart(5)} s  ${f.testo}`);
    for (const [l, r] of Object.entries(banca.ritmo)) console.log(`\n  Passo della voce (${l}): ${r} volte la stima del kit. I tempi stimati lo usano già.`);
    return;
  }
  const [audio, fileTesto] = file.map((f) => path.resolve(f));
  if (!fs.existsSync(audio)) throw new ErroreFmlab(`Non trovo l'audio ${audio}.`);
  if (!fs.existsSync(fileTesto)) throw new ErroreFmlab(`Non trovo il testo ${fileTesto}.`);
  const esito = await mettiInBanca(audio, fs.readFileSync(fileTesto, 'utf8'), {lingua});
  console.log(`\nIn banca: ${esito.frasi.length} frasi da ${Math.round(esito.durata)} secondi di audio (voci/frasi/${lingua}/).\n`);
  for (const f of esito.frasi) console.log(`  ${f.daAscoltare ? '?' : '✓'} ${String(f.secondi).padStart(5)} s  ${f.testo}`);
  const dubbie = esito.frasi.filter((f) => f.daAscoltare);
  if (dubbie.length) console.log(`\n  ${dubbie.length} con il "?": durano molto più o molto meno del previsto. Ascoltale (i file sono in voci/frasi/${lingua}/): se il taglio è sbagliato, rigenera l'audio con una riga vuota tra una frase e l'altra.`);
  console.log(`\n  Passo della voce: ${esito.paroleAlMinuto} parole al minuto, ${esito.ritmo} volte la stima del kit. Da adesso i tempi stimati usano questo passo.`);
  console.log('  Ascolta due o tre frasi prima di fidarti: un taglio a metà parola si sente subito.');
}
