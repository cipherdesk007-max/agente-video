// FMLAB Reel Kit — I REGALI della chiusura: l'ebook, la mappa, il PDF che si manda a chi commenta.
// Ogni regalo ha un nome, una copertina (in stile/regali/), un titolo e la parola da commentare. La chiusura del
// reel (blocco "ebook") mostra la copertina su un tablet 3D: quale, lo sceglie chi fa il reel.
//
//   npm run regalo                                         elenco
//   npm run regalo guida guida.pdf "La guida ai peptidi" GUIDA      aggiunge (o sostituisce) il regalo "guida"
//
// La copertina può essere un'immagine (jpg, png, webp) oppure un PDF: del PDF si prende la prima pagina.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ErroreFmlab, RADICE, leggiJson, rel, scriviJson} from './percorsi.mjs';
import {esegui, infoMedia, trovaFfmpeg} from './ffmpeg.mjs';

const FILE = path.join(RADICE, 'stile', 'regali.json');
const CARTELLA = path.join(RADICE, 'stile', 'regali');

/** La prima pagina di un PDF come immagine: con pdftoppm se c'è, altrimenti con sips (sul Mac c'è sempre). */
function primaPagina(pdf, uscita) {
  const base = uscita.replace(/\.png$/, '');
  let esito = spawnSync('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', pdf, base]);
  if (esito.status === 0 && fs.existsSync(uscita)) return;
  esito = spawnSync('sips', ['-s', 'format', 'png', pdf, '--out', uscita]);
  if (esito.status === 0 && fs.existsSync(uscita)) return;
  throw new ErroreFmlab(`Non riesco ad aprire il PDF su questo computer (servono pdftoppm oppure, sul Mac, sips).\nApri ${pdf}, salva la prima pagina come immagine e ripeti il comando con quella.`);
}

export async function comandoRegalo(argomenti = []) {
  const regali = fs.existsSync(FILE) ? leggiJson(FILE) : {};
  const [nome, file, titolo, parola] = argomenti;
  if (!nome) {
    console.log('\nRegali della chiusura (blocco "ebook", campo "regalo"; nelle scelte del reel: regalo=<nome>):\n');
    for (const [k, r] of Object.entries(regali)) console.log(`  ${k.padEnd(12)} "${r.titolo}"  ·  copertina stile/${r.file}${r.parola ? `  ·  si regala a chi commenta ${r.parola}` : ''}`);
    console.log('\nPer aggiungerne uno:  npm run regalo <nome> <copertina.jpg|png|pdf> "Titolo" [PAROLA]\n');
    return;
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(nome) || ['auto', 'nessuno'].includes(nome)) throw new ErroreFmlab('Il nome del regalo è una parola minuscola senza spazi (non "auto" né "nessuno"), es. guida.');
  if (!file || !fs.existsSync(file)) throw new ErroreFmlab(`Non trovo la copertina${file ? `: ${file}` : ''}. Uso: npm run regalo ${nome} <copertina.jpg|png|pdf> "Titolo" [PAROLA]`);
  if (!titolo) throw new ErroreFmlab('Manca il titolo del regalo, tra virgolette: è la riga che compare sotto il tablet.');
  fs.mkdirSync(CARTELLA, {recursive: true});
  const ff = await trovaFfmpeg();
  let sorgente = file;
  const provvisorio = path.join(CARTELLA, `${nome}.tmp.png`);
  if (/\.pdf$/i.test(file)) {
    primaPagina(file, provvisorio);
    sorgente = provvisorio;
  }
  const uscita = path.join(CARTELLA, `${nome}.jpg`);
  // larga al più 900 pixel: basta per il tablet e non pesa
  esegui(ff, ['-y', '-i', sorgente, '-vf', "scale='min(900,iw)':-2", '-frames:v', '1', '-q:v', '3', uscita]);
  fs.rmSync(provvisorio, {force: true});
  const info = infoMedia(ff, uscita);
  regali[nome] = {file: `regali/${nome}.jpg`, titolo, misure: [info.video.larghezza, info.video.altezza], ...(parola ? {parola: parola.toUpperCase()} : {})};
  scriviJson(FILE, regali);
  console.log(`Regalo "${nome}" pronto: ${rel(uscita)} (${info.video.larghezza}×${info.video.altezza}), "${titolo}"${parola ? `, per chi commenta ${parola.toUpperCase()}` : ''}.\nNel piano: {"blocco": "ebook", "dati": {"regalo": "${nome}"}}   ·   come scelta del reel: npm run imposta <reel> regalo=${nome}`);
}
