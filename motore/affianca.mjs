// FMLAB Reel Kit — IL FOGLIO AFFIANCATO. Dodici fotogrammi del reel accanto a dodici del video di riferimento,
// negli stessi momenti. È il giudice: prima si guarda questo foglio, poi i numeri del metro. Se un numero migliora
// e il foglio no, il reel non è migliorato.
//
//   npm run affianca <reel>                    contro rif3 (di serie), dodici momenti
//   npm run affianca <reel> rif1               contro un altro riferimento (rif1, rif2, rif3 o un file .mp4)
//   npm run affianca <reel> momenti=8          quanti momenti (da 4 a 24)
//   npm run affianca <reel> video              usa il video già fatto del reel invece di ridisegnare i fotogrammi
//
// "Stessi momenti" = stessa frazione della durata: il momento 1 è a 1/24 di ciascun video, il 12 a 23/24.
// I fotogrammi del reel si disegnano al momento (non serve il render): il foglio è sempre quello di adesso.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ErroreFmlab, RADICE, cartellaReel, leggiJson, rel} from './percorsi.mjs';
import {infoMedia, trovaFfmpeg} from './ffmpeg.mjs';

const L = 270;
const A = 480;

/** Gli istanti da guardare: il centro di ognuna delle `quanti` parti uguali della durata. */
export function momenti(durata, quanti = 12) {
  return Array.from({length: quanti}, (_, i) => ((i + 0.5) / quanti) * durata);
}

/** Dove sta un video di riferimento: un nome (rif3) o un percorso. */
export function trovaRiferimento(nome = 'rif3') {
  const candidati = [nome, path.join(RADICE, 'riferimenti', nome), ...['.mp4', '.MP4', '.mov'].map((e) => path.join(RADICE, 'riferimenti', nome + e))];
  const file = candidati.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) {
    const presenti = fs.existsSync(path.join(RADICE, 'riferimenti')) ? fs.readdirSync(path.join(RADICE, 'riferimenti')).filter((f) => /\.(mp4|mov)$/i.test(f)) : [];
    throw new ErroreFmlab(`Non trovo il video di riferimento "${nome}". ${presenti.length ? `In riferimenti/ ci sono: ${presenti.join(', ')}.` : 'In riferimenti/ non ci sono video: vanno copiati lì (restano fuori da Git).'}`);
  }
  return file;
}

/** Un fotogramma di un video, rimpicciolito a L×A (con bande se le proporzioni sono diverse), come immagine da pagina. */
function fotogrammaVideo(ff, file, t, cartella, n) {
  const uscita = path.join(cartella, `f${n}.jpg`);
  const r = spawnSync(ff.percorso, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', t.toFixed(3), '-i', file, '-frames:v', '1', '-vf', `scale=${L}:${A}:force_original_aspect_ratio=decrease,pad=${L}:${A}:(ow-iw)/2:(oh-ih)/2:color=0x0b0d14`, '-q:v', '3', uscita], {encoding: 'utf8'});
  if (r.status !== 0 || !fs.existsSync(uscita)) throw new ErroreFmlab(`ffmpeg non riesce a prendere il fotogramma a ${t.toFixed(1)} s da ${file}:\n${(r.stderr ?? '').split('\n').slice(-3).join('\n')}`);
  return `data:image/jpeg;base64,${fs.readFileSync(uscita).toString('base64')}`;
}

const virgola = (n, c = 1) => n.toFixed(c).replace('.', ',');

/** La pagina del foglio: coppie KIT | RIFERIMENTO, tre per riga (si legge anche dal telefono). */
export function paginaAffianca({titolo, sotto, coppie, colonne = 3}) {
  return `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#0b0d14;color:#fff;font:600 15px/1.25 system-ui,sans-serif;padding:18px}
    h1{font-size:21px;margin:0 0 4px} h2{font-size:14px;font-weight:500;color:#aab3d6;margin:0 0 14px}
    .g{display:grid;grid-template-columns:repeat(${colonne},${L * 2 + 6}px);gap:16px 18px}
    .c{display:grid;grid-template-columns:${L}px ${L}px;gap:6px}
    .c img{display:block;width:${L}px;height:${A}px;border-radius:6px}
    .k{border-top:5px solid #ffd23f}.r{border-top:5px solid #fff}
    .t{grid-column:1/3;display:flex;justify-content:space-between;font-size:13px}
    .t b{color:#ffd23f}.t i{font-style:normal;color:#fff}.t span{color:#7f89b0;font-weight:500}
  </style><h1>${titolo}</h1><h2>${sotto}</h2>
  <div class="g">${coppie.map((c, i) => `<div class="c"><img class="k" src="${c.kit}"><img class="r" src="${c.rif}"><div class="t"><b>KIT ${virgola(c.tKit)} s</b><span>${i + 1}/${coppie.length}</span><i>RIF ${virgola(c.tRif)} s</i></div></div>`).join('')}</div>`;
}

/**
 * Costruisce il foglio. `reel` è il nome di un reel; i suoi fotogrammi si disegnano dal vivo, o si prendono dal
 * video già fatto con {video: true}.
 * @returns {Promise<{file: string, coppie: number, durataKit: number, durataRif: number}>}
 */
export async function affianca(slug, {riferimento = 'rif3', quanti = 12, video = false, uscita = null} = {}) {
  if (!Number.isInteger(quanti) || quanti < 4 || quanti > 24) throw new ErroreFmlab('I momenti vanno da 4 a 24.');
  const dir = cartellaReel(slug);
  const fileRif = trovaRiferimento(riferimento);
  const ff = await trovaFfmpeg();
  const durataRif = infoMedia(ff, fileRif).durata;
  if (!durataRif) throw new ErroreFmlab(`Non riesco a leggere la durata di ${rel(fileRif)}.`);
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-affianca-'));
  const {apriReelNelBrowser} = await import('./foto.mjs');
  let sessione = null;
  try {
    const dati = leggiJson(path.join(dir, 'parole.json'));
    const durataKit = dati.durata;
    const tKit = momenti(durataKit, quanti);
    const tRif = momenti(durataRif, quanti);
    const fileVideo = path.join(dir, `${slug}.mp4`);
    if (video && !fs.existsSync(fileVideo)) throw new ErroreFmlab(`Il video ${rel(fileVideo)} non c'è: togli "video" (i fotogrammi si disegnano al momento) o fai il render.`);
    sessione = await apriReelNelBrowser(slug, null, {scala: L / 1080});
    const coppie = [];
    for (let i = 0; i < quanti; i++) {
      let kit;
      if (video) kit = fotogrammaVideo(ff, fileVideo, tKit[i], cartella, `k${i}`);
      else {
        const n = Math.min(Math.round(tKit[i] * dati.fps), Math.max(0, Math.round(durataKit * dati.fps) - 1));
        const esito = await sessione.pagina.pagina.evaluate(([f]) => window.__fmlab.vai(f, false), [n]);
        if (esito && esito.errore) throw new ErroreFmlab(`Errore nella scena${esito.scena ? ` "${esito.scena}"` : ''} al secondo ${tKit[i].toFixed(2)}:\n  ${esito.errore}`);
        kit = `data:image/jpeg;base64,${(await sessione.pagina.jpeg(88)).toString('base64')}`;
      }
      coppie.push({kit, rif: fotogrammaVideo(ff, fileRif, tRif[i], cartella, `r${i}`), tKit: tKit[i], tRif: tRif[i]});
    }
    const html = paginaAffianca({
      titolo: `Affiancato · ${slug} (giallo) accanto a ${path.basename(fileRif)} (bianco)`,
      sotto: `${slug}: ${virgola(durataKit)} s, tempi ${dati.motore === 'stima' ? 'stimati, senza voce' : `della voce (${dati.motore})`} · ${path.basename(fileRif)}: ${virgola(durataRif)} s · stessi momenti = stessa frazione della durata`,
      coppie,
    });
    const foglio = await sessione.browser.newPage({viewport: {width: 3 * (L * 2 + 6) + 2 * 18 + 36, height: 600}});
    await foglio.setContent(html, {waitUntil: 'load'});
    const file = uscita ?? path.join(dir, 'affianca.jpg');
    await foglio.screenshot({path: file, fullPage: true, type: 'jpeg', quality: 86});
    await foglio.close();
    return {file, coppie: coppie.length, durataKit, durataRif};
  } finally {
    if (sessione) await sessione.chiudi();
    fs.rmSync(cartella, {recursive: true, force: true});
  }
}

/** npm run affianca <reel> [riferimento] [momenti=12] [video] */
export async function comandoAffianca(argomenti = []) {
  const [slug, ...resto] = argomenti;
  if (!slug) throw new ErroreFmlab('Quale reel? Esempio: npm run affianca reta-testo        (contro rif3; un altro: npm run affianca reta-testo rif1)');
  const quanti = Number(resto.find((a) => a.startsWith('momenti='))?.slice(8) ?? 12);
  const riferimento = resto.find((a) => a !== 'video' && !a.includes('=')) ?? 'rif3';
  const esito = await affianca(slug, {riferimento, quanti, video: resto.includes('video')});
  console.log(`Foglio affiancato (${esito.coppie} momenti): ${rel(esito.file)}\nGuardalo coppia per coppia: a sinistra (giallo) il kit, a destra (bianco) il riferimento. Cosa c'è di là che di qua manca?`);
}
