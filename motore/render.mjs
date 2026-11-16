// FMLAB Reel Kit — render: disegna ogni fotogramma in Chrome e lo codifica in un mp4 con la voce.
// Il video viene diviso in pezzi fatti in parallelo; i pezzi si uniscono senza ricodificare.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {CACHE, ErroreFmlab, FORMATO, RADICE, leggiJson, rel, sec} from './percorsi.mjs';
import {estraiVariante} from './reel.mjs';
import {impacchetta} from './impacchetta.mjs';
import {avviaServer} from './server.mjs';
import {apriPagina, avviaBrowser} from './browser.mjs';
import {suoniDelReel, tracciaSuoni} from './suoni.mjs';
import {FILTRO_COLORE, apriCodifica, argomentiAudio, argomentiVideo, esegui, trovaFfmpeg} from './ffmpeg.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';

function quantiLavoratori(totale) {
  const richiesti = Number(process.env.FMLAB_LAVORATORI);
  if (Number.isFinite(richiesti) && richiesti >= 1) return Math.min(8, Math.floor(richiesti));
  const nuclei = os.cpus().length || 2;
  return Math.max(1, Math.min(4, Math.ceil(nuclei / 2), Math.ceil(totale / 60)));
}

/** La musica di sottofondo di un reel: musica.mp3 (o .m4a, .wav, .aac) nella sua cartella, altrimenti quella in stile/. */
export function trovaMusica(cartellaReel) {
  for (const cartella of [cartellaReel, path.join(RADICE, 'stile')]) {
    for (const est of ['mp3', 'm4a', 'wav', 'aac']) {
      const file = path.join(cartella, `musica.${est}`);
      if (fs.existsSync(file)) return file;
    }
  }
  return null;
}

function minuti(s) {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/**
 * Crea il video di un reel.
 * @param {{bozza?: boolean, da?: number, a?: number, uscita?: string, silenzioso?: boolean}} opzioni
 *        da/a = fotogrammi (per rendere solo un pezzo, usato dal collaudo)
 */
export async function rendi(slug, variante = null, opzioni = {}) {
  const {bozza = false, silenzioso = false} = opzioni;
  const ff = await trovaFfmpeg();
  const pacchetto = await impacchetta(slug, variante);
  const reel = pacchetto.reel;
  const dati = leggiJson(reel.parole);
  const fps = dati.fps || FORMATO.fps;
  const totaleReel = Math.max(1, Math.round(dati.durata * fps));
  const primo = Math.max(0, opzioni.da ?? 0);
  const ultimo = Math.min(totaleReel, opzioni.a ?? totaleReel);
  const totale = ultimo - primo;
  if (totale <= 0) throw new ErroreFmlab('Niente da rendere: intervallo di fotogrammi vuoto.');
  const intero = primo === 0 && ultimo === totaleReel;
  const uscita = opzioni.uscita ?? (bozza ? reel.video.replace(/\.mp4$/, '.bozza.mp4') : reel.video);

  const cartella = path.join(CACHE, reel.nome, 'render');
  fs.mkdirSync(cartella, {recursive: true});
  const n = quantiLavoratori(totale);
  const pezzi = Array.from({length: n}, (_, k) => {
    const da = primo + Math.floor((totale * k) / n);
    const a = primo + Math.floor((totale * (k + 1)) / n);
    return {k, da, a, provvisorio: path.join(cartella, `pezzo-${k}.tmp.mp4`), file: path.join(cartella, `pezzo-${k}.mp4`)};
  }).filter((p) => p.a > p.da);

  const server = await avviaServer();
  let browser;
  const codifiche = [];
  const inizio = Date.now();
  let fatti = 0;
  let ultimoAvviso = 0;
  const avanza = () => {
    fatti++;
    const ora = Date.now();
    if (silenzioso || (ora - ultimoAvviso < 2500 && fatti < totale)) return;
    ultimoAvviso = ora;
    const trascorsi = (ora - inizio) / 1000;
    const velocita = fatti / Math.max(0.001, trascorsi);
    console.log(`  ${String(Math.round((fatti / totale) * 100)).padStart(3)}%  ·  ${fatti}/${totale} fotogrammi  ·  ${velocita.toFixed(1)} al secondo  ·  mancano ${minuti((totale - fatti) / velocita)}`);
  };

  try {
    browser = await avviaBrowser();
    if (!silenzioso) {
      console.log(`Render di "${reel.nome}"${bozza ? ' (bozza a metà risoluzione)' : ''}: ${totale} fotogrammi, ${pezzi.length} ${pezzi.length === 1 ? 'pezzo' : 'pezzi in parallelo'}`);
    }
    const scala = bozza ? 0.5 : 1;
    const url = `${server.url}${pacchetto.percorsoWeb}?modo=render`;
    await Promise.all(
      pezzi.map(async (pezzo) => {
        const pagina = await apriPagina(browser, url, {scala});
        const codifica = apriCodifica(ff, [
          '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
          '-vf', FILTRO_COLORE,
          ...argomentiVideo(ff, {bozza}),
          '-r', String(fps), '-an', '-y', pezzo.provvisorio,
        ]);
        codifiche.push(codifica);
        for (let f = pezzo.da; f < pezzo.a; f++) {
          await pagina.vai(f);
          await codifica.scrivi(await pagina.jpeg(92));
          avanza();
        }
        await codifica.chiudi();
        fs.renameSync(pezzo.provvisorio, pezzo.file);
        await pagina.chiudi();
      })
    );

    // unione dei pezzi senza ricodificare
    const muto = path.join(cartella, 'muto.mp4');
    if (pezzi.length === 1) {
      fs.copyFileSync(pezzi[0].file, muto);
    } else {
      const lista = path.join(cartella, 'lista.txt');
      fs.writeFileSync(lista, pezzi.map((p) => `file '${p.file.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
      await esegui(ff, ['-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-y', muto]);
    }

    // audio: la voce (portata a volume standard) oppure una traccia di silenzio
    const provvisorio = uscita.replace(/\.mp4$/, '.tmp.mp4');
    const fileVoce = dati.voce ? path.join(reel.dir, dati.voce) : null;
    const conVoce = intero && fileVoce && fs.existsSync(fileVoce);
    if (dati.voce && intero && !conVoce) {
      console.log(`  Attenzione: manca il file audio ${dati.voce}: il video esce muto. Rigenera la voce con  npm run voce ${slug}`);
    }
    // musica di sottofondo: il file musica.* del reel (o quello di stile/, che vale per tutti), se il volume non è a zero
    let volume = 30;
    try {
      volume = leggiImpostazioni(slug).musica ?? 30;
    } catch {
      // impostazioni non leggibili: l'errore lo segnalano gli altri comandi
    }
    const fileMusica = intero ? trovaMusica(reel.dir) : null;
    // effetti sonori: i [suono:nome] del copione, ognuno sulla sua parola
    let effetti = null;
    const eventi = intero ? suoniDelReel(dati, reel.dir) : [];
    const volumeEffetti = Number(process.env.FMLAB_VOLUME_SUONI ?? 60);
    if (eventi.length && volumeEffetti > 0) effetti = await tracciaSuoni(ff, eventi, totale / fps, uscita.replace(/\.mp4$/, '.suoni.tmp.wav'));
    const audio = argomentiAudio({voce: conVoce ? fileVoce : null, musica: fileMusica, volume, durata: totale / fps, effetti, volumeEffetti, velocita: dati.velocita ?? 1});
    await esegui(ff, ['-i', muto, ...audio, '-movflags', '+faststart', '-y', provvisorio]);
    if (effetti) fs.rmSync(effetti, {force: true});
    fs.renameSync(provvisorio, uscita);
    const conMusica = Boolean(fileMusica) && volume > 0;

    const secondi = (Date.now() - inizio) / 1000;
    if (!silenzioso) {
      const peso = fs.statSync(uscita).size / (1024 * 1024);
      console.log(`\nFatto in ${minuti(secondi)}: ${rel(uscita)}  (${sec(totale / fps, 1)}, ${peso.toFixed(1).replace('.', ',')} MB${conVoce ? '' : ', senza voce'}${conMusica ? `, con la musica di ${rel(fileMusica)} a volume ${volume}` : ''}${effetti ? `, ${eventi.length} effetti sonori` : ''})`);
      if (dati.motore === 'stima') console.log('  I tempi sono stimati e non c\'è voce: per la versione finale lancia  npm run voce  e poi di nuovo il render.');
      if (!bozza && intero) console.log(`  Ora controllalo:  npm run verifica ${slug}${reel.variante ? ' ' + reel.variante : ''}`);
    }
    return {uscita, secondi, fotogrammi: totale, conVoce: Boolean(conVoce), conMusica};
  } catch (e) {
    for (const c of codifiche) c.interrompi();
    throw e;
  } finally {
    if (browser) await browser.close().catch(() => {});
    await server.chiudi();
  }
}

/** npm run render <reel> [lingua] [bozza] */
export async function comandoRender(slug, argomenti = []) {
  const {variante, resto} = estraiVariante(slug, argomenti);
  const sconosciuti = resto.filter((a) => a !== 'bozza');
  if (sconosciuti.length) throw new ErroreFmlab(`Non capisco "${sconosciuti.join(' ')}". Uso: npm run render ${slug} [lingua] [bozza]`);
  return rendi(slug, variante, {bozza: resto.includes('bozza')});
}
