// FMLAB Reel Kit — ricerca e uso di ffmpeg (codifica mp4, audio, analisi dei file).
import {spawn, spawnSync} from 'node:child_process';
import {ErroreFmlab} from './percorsi.mjs';

let trovato = null;

function funziona(cmd) {
  try {
    return spawnSync(cmd, ['-hide_banner', '-version'], {encoding: 'utf8'}).status === 0;
  } catch {
    return false;
  }
}

/**
 * Cerca ffmpeg in quest'ordine: variabile FMLAB_FFMPEG, comando `ffmpeg` di sistema,
 * pacchetto npm `ffmpeg-static` (installato da `npm install`).
 */
export async function trovaFfmpeg() {
  if (trovato) return trovato;
  const candidati = [];
  if (process.env.FMLAB_FFMPEG) candidati.push(process.env.FMLAB_FFMPEG);
  candidati.push('ffmpeg');
  try {
    const m = await import('ffmpeg-static');
    if (m.default) candidati.push(m.default);
  } catch {
    // pacchetto non installato: si prosegue con gli altri candidati
  }
  for (const c of candidati) {
    if (!funziona(c)) continue;
    const enc = spawnSync(c, ['-hide_banner', '-encoders'], {encoding: 'utf8'}).stdout || '';
    trovato = {
      percorso: c,
      x264: /\blibx264\b/.test(enc),
      videotoolbox: /\bh264_videotoolbox\b/.test(enc),
    };
    if (!trovato.x264 && !trovato.videotoolbox) {
      trovato = null;
      continue;
    }
    return trovato;
  }
  throw new ErroreFmlab(
    [
      'Non trovo ffmpeg (serve per creare il file mp4).',
      'Soluzioni, dalla più semplice:',
      '  1. esegui di nuovo `npm install` nella cartella del kit (scarica ffmpeg-static);',
      '  2. oppure installa ffmpeg e riprova;',
      '  3. oppure indica il percorso nel file .env:  FMLAB_FFMPEG=/percorso/di/ffmpeg',
    ].join('\n')
  );
}

/** Opzioni del codificatore video: uguali per tutti i pezzi, così si possono unire senza ricodificare. */
export function argomentiVideo(ff, {bozza = false} = {}) {
  const colore = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
  if (ff.x264) {
    return ['-c:v', 'libx264', '-preset', bozza ? 'veryfast' : 'medium', '-crf', bozza ? '24' : '17', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...colore];
  }
  return ['-c:v', 'h264_videotoolbox', '-b:v', bozza ? '4M' : '12M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...colore];
}

/**
 * I fotogrammi arrivano come JPEG (BT.601, gamma piena): li portiamo a BT.709 gamma video.
 * accurate_rnd + full_chroma_int: senza, la conversione arrotonda sempre per difetto e il video esce un filo più
 * scuro e verdino (il bianco 255 diventava 252, 255, 252). Così il bianco resta bianco e i colori del marchio
 * arrivano nel video entro un livello su 255. Costa pochi millisecondi a fotogramma.
 */
export const FILTRO_COLORE = 'scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=limited:flags=accurate_rnd+full_chroma_int+bicubic,format=yuv420p';

/** Esegue ffmpeg e aspetta la fine. Rifiuta con le ultime righe di errore se esce con codice diverso da 0. */
export function esegui(ff, args, {tollera = false} = {}) {
  return new Promise((risolvi, rifiuta) => {
    const p = spawn(ff.percorso, ['-hide_banner', '-nostdin', ...args], {stdio: ['ignore', 'ignore', 'pipe']});
    let err = '';
    p.stderr.on('data', (d) => {
      err = (err + d).slice(-20000);
    });
    p.on('error', (e) => rifiuta(new ErroreFmlab(`Non riesco ad avviare ffmpeg: ${e.message}`)));
    p.on('close', (codice) => {
      if (codice === 0 || tollera) risolvi({codice, stderr: err});
      else rifiuta(new ErroreFmlab(`ffmpeg ha dato errore (codice ${codice}):\n${err.split('\n').slice(-12).join('\n')}`));
    });
  });
}

/** Apre ffmpeg in ascolto su stdin (per ricevere i fotogrammi uno dopo l'altro). */
export function apriCodifica(ff, args) {
  const p = spawn(ff.percorso, ['-hide_banner', ...args], {stdio: ['pipe', 'ignore', 'pipe']});
  let err = '';
  p.stderr.on('data', (d) => {
    err = (err + d).slice(-20000);
  });
  let erroreStdin = null;
  p.stdin.on('error', (e) => {
    erroreStdin = e;
  });
  const fine = new Promise((risolvi, rifiuta) => {
    p.on('error', (e) => rifiuta(new ErroreFmlab(`Non riesco ad avviare ffmpeg: ${e.message}`)));
    p.on('close', (codice) => {
      if (codice === 0) risolvi();
      else rifiuta(new ErroreFmlab(`ffmpeg ha dato errore (codice ${codice}):\n${err.split('\n').slice(-12).join('\n')}`));
    });
  });
  fine.catch(() => {});
  return {
    async scrivi(buffer) {
      if (erroreStdin) throw new ErroreFmlab(`ffmpeg si è chiuso prima del tempo:\n${err.split('\n').slice(-8).join('\n')}`);
      if (!p.stdin.write(buffer)) {
        await new Promise((r) => p.stdin.once('drain', r));
      }
    },
    async chiudi() {
      p.stdin.end();
      await fine;
    },
    interrompi() {
      try {
        p.kill('SIGKILL');
      } catch {
        // già terminato
      }
    },
  };
}

function inSecondi(h, m, s) {
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/** Legge le caratteristiche di un file audio/video usando solo ffmpeg (ffprobe non serve). */
export function infoMedia(ff, file) {
  const r = spawnSync(ff.percorso, ['-hide_banner', '-i', file], {encoding: 'utf8'});
  const t = r.stderr || '';
  if (/No such file|Invalid data|could not find codec/i.test(t) && !/Stream #/.test(t)) {
    throw new ErroreFmlab(`ffmpeg non riesce a leggere ${file}:\n${t.split('\n').slice(-4).join('\n')}`);
  }
  const info = {durata: null, video: null, audio: null, grezzo: t};
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(t);
  if (d) info.durata = inSecondi(d[1], d[2], d[3]);
  const rigaVideo = t.split('\n').find((l) => /Stream #.*Video:/.test(l));
  if (rigaVideo) {
    const codec = /Video:\s*([a-z0-9_]+)/i.exec(rigaVideo);
    const dim = /,\s*(\d{2,5})x(\d{2,5})[\s,[]/.exec(rigaVideo + ' ');
    const fps = /([\d.]+)\s*fps/.exec(rigaVideo);
    const pix = /Video:\s*[^,]+,\s*([a-z0-9]+)/i.exec(rigaVideo);
    info.video = {
      codec: codec ? codec[1] : null,
      larghezza: dim ? Number(dim[1]) : null,
      altezza: dim ? Number(dim[2]) : null,
      fps: fps ? Number(fps[1]) : null,
      pixel: pix ? pix[1] : null,
      riga: rigaVideo.trim(),
    };
  }
  const rigaAudio = t.split('\n').find((l) => /Stream #.*Audio:/.test(l));
  if (rigaAudio) {
    const codec = /Audio:\s*([a-z0-9_]+)/i.exec(rigaAudio);
    const hz = /(\d+)\s*Hz/.exec(rigaAudio);
    info.audio = {codec: codec ? codec[1] : null, hz: hz ? Number(hz[1]) : null, riga: rigaAudio.trim()};
  }
  return info;
}

/**
 * Conta i fotogrammi (v = video, decodificandolo) o misura la durata (a = audio) di una traccia.
 */
export function misuraTraccia(ff, file, tipo = 'v') {
  const copia = tipo === 'v' ? [] : ['-c', 'copy'];
  const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-i', file, '-map', `0:${tipo}:0`, ...copia, '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024});
  const t = r.stderr || '';
  if (r.status !== 0) return null;
  const fotogrammi = [...t.matchAll(/frame=\s*(\d+)/g)].pop();
  const tempo = [...t.matchAll(/time=\s*(\d+):(\d+):(\d+(?:\.\d+)?)/g)].pop();
  return {
    fotogrammi: fotogrammi ? Number(fotogrammi[1]) : null,
    durata: tempo ? inSecondi(tempo[1], tempo[2], tempo[3]) : null,
  };
}

// ───────────────────────── audio: voce e musica ─────────────────────────

/** Volume della musica (0…100) → quanto è forte, in LUFS. La voce sta a -14: a 30 la musica è circa 19 sotto. */
export function lufsMusica(volume) {
  return -38 + Math.max(0, Math.min(100, volume)) * 0.16;
}

/**
 * Gli argomenti di ffmpeg per mettere l'audio su un video muto (che deve essere l'ingresso 0).
 *   voce:    portata al volume standard dei social (-14 LUFS);
 *   musica:  ripetuta fino alla fine del video, tenuta bassa, e abbassata ancora mentre la voce parla
 *            (si rialza nelle pause); entra ed esce sfumando.
 * Senza voce e senza musica mette una traccia di silenzio: alcuni social rifiutano i video senza audio.
 */
export function argomentiAudio({voce = null, musica = null, volume = 30, durata, effetti = null, volumeEffetti = 60, velocita = 1}) {
  const D = Math.max(0.5, durata).toFixed(3);
  const conMusica = Boolean(musica) && volume > 0;
  const conEffetti = Boolean(effetti) && volumeEffetti > 0;
  const codifica = ['-c:v', 'copy', '-c:a', 'aac', '-b:a', conMusica || voce || conEffetti ? '192k' : '128k', '-ac', '2', '-ar', '48000', '-t', D];
  if (!voce && !conMusica && !conEffetti) return ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a', ...codifica];
  const sfuma = `afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, Number(D) - 1.6).toFixed(3)}:d=1.6`;
  // (loudnorm lavora a 192 kHz e lascia l'audio così: va riportato a 48)
  const bassa = `aresample=48000,atrim=0:${D},loudnorm=I=${lufsMusica(volume).toFixed(1)}:TP=-3:LRA=11,aresample=48000,${sfuma}`;
  const ingressi = [];
  const grafo = [];
  const pezzi = [];
  let n = 1; // l'ingresso 0 è il video muto
  if (voce) {
    ingressi.push('-i', voce);
    // voce velocizzata per stare nella durata chiesta: stessa misura dei tempi, senza cambiare l'altezza della voce
    const svelta = velocita && Math.abs(velocita - 1) > 0.001 ? `atempo=${Number(velocita).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')},` : '';
    grafo.push(`[${n}:a]${svelta}loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,apad,atrim=0:${D}${conMusica ? ',asplit=2[v][chiave]' : '[v]'}`);
    pezzi.push('[v]');
    n++;
  }
  if (conMusica) {
    ingressi.push('-stream_loop', '-1', '-i', musica);
    if (voce) grafo.push(`[${n}:a]${bassa}[m0]`, '[m0][chiave]sidechaincompress=threshold=0.03:ratio=5:attack=30:release=500[m]');
    else grafo.push(`[${n}:a]${bassa}[m]`);
    pezzi.push('[m]');
    n++;
  }
  if (conEffetti) {
    // gli effetti: già al loro posto nel tempo, sotto la voce ma ben udibili
    ingressi.push('-i', effetti);
    grafo.push(`[${n}:a]aresample=48000,apad,atrim=0:${D},volume=${Math.pow(Math.min(100, volumeEffetti) / 100, 1.5).toFixed(3)}[e]`);
    pezzi.push('[e]');
    n++;
  }
  grafo.push(pezzi.length > 1 ? `${pezzi.join('')}amix=inputs=${pezzi.length}:normalize=0:duration=longest[a]` : `${pezzi[0]}anull[a]`);
  return [...ingressi, '-filter_complex', grafo.join(';'), '-map', '0:v', '-map', '[a]', ...codifica];
}

/** Volume medio (in dB) di un tratto dell'audio di un file: serve alle prove e alla verifica. */
export function volumeMedio(ff, file, da = 0, durata = null, filtro = '') {
  const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-ss', String(da), ...(durata ? ['-t', String(durata)] : []), '-i', file, '-map', '0:a:0', '-af', `${filtro ? filtro + ',' : ''}volumedetect`, '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  const m = /mean_volume:\s*(-?[\d.]+|-inf) dB/.exec(r.stderr || '');
  return m ? (m[1] === '-inf' ? -120 : Number(m[1])) : null;
}

