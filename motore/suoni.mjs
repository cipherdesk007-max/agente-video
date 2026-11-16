// FMLAB Reel Kit — I SUONI: piccoli effetti (pop, ding, whoosh…) agganciati alle parole del copione.
//
//   nel copione:   Il dolore [suono:pop][due]scende di due punti.     → il "pop" parte su "scende"
//   i file:        suoni/<nome>.wav (o .mp3, .m4a, .aac) nella cartella del kit, oppure reels/<reel>/suoni/
//
//   npm run suoni            elenco dei suoni disponibili
//   npm run suoni crea       ricrea quelli di serie (li genera il kit: nessun file scaricato, nessun diritto da chiedere)
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, RADICE, rel} from './percorsi.mjs';
import {esegui, trovaFfmpeg} from './ffmpeg.mjs';

export const CARTELLA_SUONI = path.join(RADICE, 'suoni');
const ESTENSIONI = ['wav', 'mp3', 'm4a', 'aac'];

/** I suoni di serie: formule semplici, generate con ffmpeg. [nome, a cosa serve, sorgente, filtro in più] */
export const DI_SERIE = [
  ['pop', 'una cosa che compare', "aevalsrc='0.8*sin(2*PI*(900*t-2600*t*t))*exp(-38*t)':d=0.16:s=48000", ''],
  ['clic', 'un passo di una lista, un tocco', "aevalsrc='0.7*sin(2*PI*2200*t)*exp(-160*t)':d=0.06:s=48000", ''],
  ['ding', 'un numero importante, una risposta giusta', "aevalsrc='(0.5*sin(2*PI*1320*t)+0.25*sin(2*PI*2640*t)+0.12*sin(2*PI*3960*t))*exp(-5*t)':d=0.9:s=48000", ''],
  ['whoosh', 'un cambio di scena, una cosa che passa', 'anoisesrc=d=0.5:c=pink:a=0.9:r=48000', 'highpass=f=500,lowpass=f=5200,afade=t=in:d=0.24,afade=t=out:st=0.26:d=0.24,volume=1.6'],
  ['tonfo', 'una cosa pesante che arriva, un numero che cade', "aevalsrc='0.9*sin(2*PI*(110*t-150*t*t))*exp(-14*t)':d=0.32:s=48000", ''],
  ['sale', 'un conto che cresce, una barra che si riempie', "aevalsrc='0.5*sin(2*PI*(400*t+900*t*t))*exp(-2*t)':d=0.45:s=48000", 'afade=t=out:st=0.3:d=0.15'],
  ['successo', 'il risultato, la spunta', "aevalsrc='0.45*(sin(2*PI*880*t)*exp(-9*t)+gte(t,0.13)*sin(2*PI*1318.5*(t-0.13))*exp(-7*(t-0.13)))':d=0.7:s=48000", ''],
  ['errore', 'un rischio, un "attenzione"', "aevalsrc='0.4*(sin(2*PI*196*t)+0.5*sin(2*PI*185*t))*exp(-6*t)':d=0.45:s=48000", ''],
];

/** Tutti i suoni che si possono usare in un reel: {nome: file}. Quelli nella cartella del reel vincono. */
export function elencoSuoni(cartellaReel = null) {
  const trovati = {};
  for (const dir of [CARTELLA_SUONI, cartellaReel ? path.join(cartellaReel, 'suoni') : null]) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      const m = /^([a-z0-9][a-z0-9_-]*)\.([a-z0-9]+)$/i.exec(f);
      if (m && ESTENSIONI.includes(m[2].toLowerCase())) trovati[m[1].toLowerCase()] = path.join(dir, f);
    }
  }
  return trovati;
}

/** Controlla che ogni [suono:nome] del copione abbia il suo file; restituisce [{file, t, nome}]. */
export function suoniDelReel(dati, cartellaReel) {
  const disponibili = elencoSuoni(cartellaReel);
  return (dati.suoni ?? []).map((s) => {
    const file = disponibili[s.nome];
    if (!file) throw new ErroreFmlab(`Il copione chiede il suono [suono:${s.nome}], ma il file non c'è.\nSuoni disponibili: ${Object.keys(disponibili).join(', ') || '(nessuno: npm run suoni crea)'}\nMetti ${s.nome}.wav (o .mp3) nella cartella suoni/ del kit o in ${rel(path.join(cartellaReel, 'suoni'))}/.`);
    return {nome: s.nome, t: s.t, file};
  });
}

/** Una traccia lunga quanto il video con ogni suono al suo istante (un filo prima: l'attacco deve cadere sulla parola). */
export async function tracciaSuoni(ff, eventi, durata, uscita) {
  const D = Math.max(0.5, durata).toFixed(3);
  const ingressi = eventi.flatMap((e) => ['-i', e.file]);
  const rami = eventi.map((e, i) => `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${Math.max(0, Math.round((e.t - 0.03) * 1000))}:all=1[s${i}]`);
  const grafo = [...rami, `${eventi.map((_, i) => `[s${i}]`).join('')}amix=inputs=${eventi.length}:normalize=0:duration=longest,apad,atrim=0:${D}[a]`].join(';');
  await esegui(ff, [...ingressi, '-filter_complex', grafo, '-map', '[a]', '-ar', '48000', '-ac', '2', '-y', uscita]);
  return uscita;
}

/** Scrive i suoni di serie in suoni/ (non tocca i file che hai messo tu con un altro nome). */
export async function creaSuoniDiSerie(ff, cartella = CARTELLA_SUONI) {
  fs.mkdirSync(cartella, {recursive: true});
  for (const [nome, , sorgente, filtro] of DI_SERIE) {
    await esegui(ff, ['-f', 'lavfi', '-i', sorgente, '-af', `${filtro ? filtro + ',' : ''}afade=t=in:d=0.004,aformat=channel_layouts=stereo`, '-ar', '48000', '-c:a', 'pcm_s16le', '-y', path.join(cartella, `${nome}.wav`)]);
  }
  return DI_SERIE.map(([nome]) => nome);
}

export async function comandoSuoni(argomenti = []) {
  if (argomenti[0] === 'crea') {
    const fatti = await creaSuoniDiSerie(await trovaFfmpeg());
    console.log(`Creati ${fatti.length} suoni in ${rel(CARTELLA_SUONI)}/: ${fatti.join(', ')}`);
    return;
  }
  const tutti = elencoSuoni();
  const perche = Object.fromEntries(DI_SERIE.map(([nome, cosa]) => [nome, cosa]));
  console.log(`\nSuoni disponibili (${rel(CARTELLA_SUONI)}/):\n`);
  for (const [nome, file] of Object.entries(tutti)) console.log(`  ${nome.padEnd(12)} ${(perche[nome] ?? 'messo da te').padEnd(46)} ${path.basename(file)}`);
  if (!Object.keys(tutti).length) console.log('  (nessuno)  →  npm run suoni crea');
  console.log(`\nNel copione:  [suono:pop] davanti alla parola su cui deve partire. Per aggiungerne uno tuo: metti il file
(wav, mp3, m4a) in suoni/ con un nome semplice, tutto minuscolo. Volume di tutti i suoni: FMLAB_VOLUME_SUONI=60 nel file .env.\n`);
}
