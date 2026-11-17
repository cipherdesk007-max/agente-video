// FMLAB Reel Kit — LA BANCA MUSICALE: trame ambientali generate dal kit, una per reel.
//
// Come gli effetti di suoni/, le trame le sintetizza il kit con ffmpeg da una formula: non c'è nessun file di altri
// e nessun diritto da pagare. Ogni trama è un accordo tenuto che respira, lungo 24 secondi e fatto per ripetersi
// senza scalino (ogni nota fa un numero intero di giri in 24 secondi). Si generano la prima volta che servono, in
// .fmlab/musiche/, e da lì si riusano.
//
//   npm run musiche                           l'elenco, e le genera tutte (per ascoltarle)
//   npm run imposta <reel> musica=<nome>      la sceglie a mano · musica=auto: dal nome del reel · musica=no: nessuna
//
// Il file musica.mp3 dentro la cartella del reel, se c'è, vince su tutto. Volume e sfumature sono quelli di sempre.
import fs from 'node:fs';
import path from 'node:path';
import {CACHE, ErroreFmlab, rel} from './percorsi.mjs';

const nota = (hz, forza, giro, fase) => `${forza}*sin(2*PI*${hz}*t)*(0.55+0.45*sin(2*PI*t/${giro}+${fase}))`;
/** nome → [cosa è, la formula (sorgente di ffmpeg), il filtro] */
export const TRAME = {
  quiete: ['un accordo fermo e basso, che respira piano', [nota(110, 0.2, 12, 0), nota(165, 0.15, 8, 1), nota(220, 0.1, 6, 2)], 'lowpass=f=1400'],
  marea: ['più scura e lenta, come un\'onda lunga', [nota(82.5, 0.24, 24, 0), nota(123.75, 0.16, 12, 2), nota(165, 0.08, 8, 4)], 'lowpass=f=900'],
  brina: ['più chiara e sottile, in alto', [nota(220, 0.14, 8, 0), nota(330, 0.11, 6, 1), nota(440, 0.07, 4, 3)], 'highpass=f=160,lowpass=f=2600'],
  orbita: ['un passo lento che torna ogni tre secondi', [nota(98, 0.2, 3, 0), nota(147, 0.14, 6, 1), nota(196, 0.1, 12, 2)], 'lowpass=f=1200'],
};
export const NOMI_TRAME = Object.keys(TRAME);
export const DURATA_TRAMA = 24;

/** Dove sta (o starà) il file di una trama. FMLAB_MUSICHE sposta la cartella (serve alle prove). */
export const cartellaTrame = () => (process.env.FMLAB_MUSICHE ? path.resolve(process.env.FMLAB_MUSICHE) : path.join(CACHE, 'musiche'));
export const fileTrama = (nome) => path.join(cartellaTrame(), `${nome}.wav`);

/** La trama di un reel quando nessuno la sceglie: dal nome, sempre la stessa. */
export function musicaDalNome(nome) {
  let h = 2166136261;
  for (const c of `musica:${nome}`) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return NOMI_TRAME[h % NOMI_TRAME.length];
}

/**
 * Quale musica va sotto un reel. Nell'ordine: il file musica.* nella cartella del reel (vince su tutto); niente, se
 * il volume è 0 (musica=no); la trama scelta a mano; con "auto" quella scritta nel piano dal regista di serie;
 * altrimenti la musica del kit in stile/, se c'è, come è sempre stato.
 * @returns {{tipo: 'file'|'trama', file: string, nome?: string} | null}
 */
export function qualeMusica({nelReel = null, volume = 30, scelta = 'auto', delPiano = null, delKit = null} = {}) {
  if (nelReel) return {tipo: 'file', file: nelReel};
  if (!(volume > 0)) return null;
  const nome = scelta && scelta !== 'auto' ? scelta : delPiano;
  if (nome && TRAME[nome]) return {tipo: 'trama', nome, file: fileTrama(nome)};
  return delKit ? {tipo: 'file', file: delKit} : null;
}

/** Genera il file di una trama, se non c'è già. */
export async function assicuraTrama(nome, ff = null) {
  if (!TRAME[nome]) throw new ErroreFmlab(`La trama "${nome}" non esiste. Trame del kit: ${NOMI_TRAME.join(', ')}.`);
  const file = fileTrama(nome);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) return file;
  const {trovaFfmpeg, esegui} = await import('./ffmpeg.mjs');
  const [, note, filtro] = TRAME[nome];
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const tmp = `${file}.${process.pid}.wav`;
  await esegui(ff ?? (await trovaFfmpeg()), ['-f', 'lavfi', '-i', `aevalsrc='${note.join('+')}':d=${DURATA_TRAMA}:s=44100`, '-af', `${filtro},aformat=channel_layouts=mono`, '-ar', '22050', '-c:a', 'pcm_s16le', '-y', tmp]);
  fs.renameSync(tmp, file);
  return file;
}

export async function comandoMusiche() {
  console.log('\nTrame del kit (generate dal kit: nessun file di altri, nessun diritto da pagare):\n');
  for (const nome of NOMI_TRAME) {
    const file = await assicuraTrama(nome);
    console.log(`  ${nome.padEnd(8)} ${TRAME[nome][0].padEnd(46)} ${rel(file)}`);
  }
  console.log(`\nDurano ${DURATA_TRAMA} secondi e si ripetono sotto il reel. Per sceglierne una:  npm run imposta <reel> musica=<nome>   (auto: dal nome del reel · no: nessuna)`);
  console.log('Un file musica.mp3 nella cartella del reel vince su tutto.\n');
}
