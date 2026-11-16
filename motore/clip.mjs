// FMLAB Reel Kit — CLIP: divide un video (una registrazione dello schermo, una clip) in fotogrammi.
// Nelle scene il componente <Filmato> mostra poi quello giusto per ogni istante: preciso al fotogramma.
//
//   npm run clip <reel> <file video> [nome] [larghezza=720] [da=0] [durata=…]
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, FORMATO, cartellaReel, rel, scriviJson, sec} from './percorsi.mjs';
import {esegui, infoMedia, trovaFfmpeg} from './ffmpeg.mjs';

/** Oltre questa durata non è più una clip dentro un reel: quasi sempre è un errore (manca da= / durata=). */
export const LIMITE_CLIP = 90;

const FOTOGRAMMA = /^\d{5}\.jpg$/;

/** "Registrazione Schermo 12.mov" → "registrazione-schermo-12" */
export function nomeClip(testo) {
  const pulito = String(testo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return pulito || 'clip';
}

/** Nome da usare nel codice della scena: "demo-app" → demoApp */
export function variabileClip(nome) {
  const v = nome.replace(/-+([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
  return /^[a-zA-Z]/.test(v) ? v : `clip${v}`;
}

function trovaFile(file, cartella) {
  const candidati = [path.isAbsolute(file) ? file : null, path.resolve(process.cwd(), file), path.join(cartella, file)].filter(Boolean);
  for (const c of candidati) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  throw new ErroreFmlab(`Non trovo il video "${file}".\nMettilo nella cartella del reel (${rel(cartella)}/) oppure scrivi il percorso completo.`);
}

function numero(testo, nome, {min = 0, max = Infinity} = {}) {
  const n = Number(String(testo).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max) throw new ErroreFmlab(`${nome}=${testo} non va bene: serve un numero${max === Infinity ? ` da ${min} in su` : ` tra ${min} e ${max}`}.`);
  return n;
}

/**
 * Divide un video in fotogrammi dentro reels/<reel>/clip/<nome>/ e scrive clip.json.
 * Rifarlo con lo stesso nome sostituisce i fotogrammi di prima.
 */
export async function creaClip({slug, file, nome = null, larghezza = 720, da = 0, durata = null, cartella: altrove = null}) {
  const cartella = altrove ?? cartellaReel(slug);
  const origine = trovaFile(file, cartella);
  const ff = await trovaFfmpeg();
  const info = infoMedia(ff, origine);
  if (!info.video) throw new ErroreFmlab(`"${path.basename(origine)}" non è un video che ffmpeg sa leggere.`);
  const scelto = nomeClip(nome ?? path.basename(origine));
  const totale = info.durata ?? 0;
  if (totale && da >= totale) throw new ErroreFmlab(`da=${da}: il video dura solo ${sec(totale)}.`);
  const quanto = durata ?? (totale ? totale - da : null);
  if (quanto !== null && quanto > LIMITE_CLIP) {
    throw new ErroreFmlab(
      `Il pezzo scelto dura ${sec(quanto)}: troppo per stare dentro un reel (massimo ${LIMITE_CLIP} s).\nPrendi solo la parte che serve, per esempio:  npm run clip ${slug} "${file}" ${scelto} da=12 durata=8`
    );
  }
  const dir = path.join(cartella, 'clip', scelto);
  fs.mkdirSync(dir, {recursive: true});
  // via i fotogrammi di una divisione precedente (solo quelli: nient'altro viene toccato)
  for (const f of fs.readdirSync(dir)) {
    if (FOTOGRAMMA.test(f) || f === 'clip.json') fs.rmSync(path.join(dir, f), {force: true});
  }
  const larga = Math.max(120, Math.round(larghezza / 2) * 2);
  await esegui(ff, [
    ...(da > 0 ? ['-ss', String(da)] : []),
    '-i',
    origine,
    ...(durata ? ['-t', String(durata)] : []),
    '-an',
    '-vf',
    `fps=${FORMATO.fps},scale='min(${larga},iw)':-2:flags=lanczos`,
    '-q:v',
    '3',
    '-start_number',
    '1',
    path.join(dir, '%05d.jpg'),
  ]);
  const fotogrammi = fs.readdirSync(dir).filter((f) => FOTOGRAMMA.test(f)).sort();
  if (!fotogrammi.length) throw new ErroreFmlab(`Da "${path.basename(origine)}" non è uscito nessun fotogramma: controlla da= e durata=.`);
  const primo = infoMedia(ff, path.join(dir, fotogrammi[0]));
  const peso = fotogrammi.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
  const clip = {
    nome: scelto,
    fotogrammi: fotogrammi.length,
    fps: FORMATO.fps,
    larghezza: primo.video?.larghezza ?? larga,
    altezza: primo.video?.altezza ?? 0,
    durata: Number((fotogrammi.length / FORMATO.fps).toFixed(3)),
    origine: path.basename(origine),
  };
  scriviJson(path.join(dir, 'clip.json'), clip);
  return {clip, cartella: dir, peso};
}

const USO = `Divide un video in fotogrammi, per usarlo in una scena con <Filmato>.

  npm run clip <reel> <file video> [nome] [larghezza=720] [da=0] [durata=…]

  file video   nella cartella del reel, oppure il percorso completo (mp4, mov, m4v, webm…)
  nome         come lo chiamerai nella scena (se manca, viene dal nome del file)
  larghezza    larghezza dei fotogrammi in pixel (720 basta quasi sempre; 1080 se riempie tutto il video)
  da, durata   per prendere solo un pezzo, in secondi:  da=12 durata=8

Esempio:  npm run clip mio-reel registrazione.mp4 demo da=3 durata=10`;

export async function comandoClip(argomenti) {
  const [slug, file, ...resto] = argomenti;
  if (!slug || !file) {
    console.log(USO);
    if (slug && !file) process.exitCode = 1;
    return;
  }
  const opzioni = {slug, file};
  for (const a of resto) {
    const m = /^([a-z]+)=(.*)$/.exec(a);
    if (!m) {
      opzioni.nome = a;
    } else if (m[1] === 'larghezza') {
      opzioni.larghezza = numero(m[2], 'larghezza', {min: 120, max: 2160});
    } else if (m[1] === 'da') {
      opzioni.da = numero(m[2], 'da');
    } else if (m[1] === 'durata') {
      opzioni.durata = numero(m[2], 'durata', {min: 0.1, max: LIMITE_CLIP});
    } else {
      throw new ErroreFmlab(`Non conosco "${m[1]}=". Si può scrivere: larghezza=, da=, durata=.`);
    }
  }
  const {clip, cartella, peso} = await creaClip(opzioni);
  const v = variabileClip(clip.nome);
  console.log(`Clip "${clip.nome}": ${clip.fotogrammi} fotogrammi (${sec(clip.durata)}), ${clip.larghezza}x${clip.altezza}, ${(peso / 1048576).toFixed(1).replace('.', ',')} MB  →  ${rel(cartella)}/`);
  console.log(`\nNella scena (scene.tsx):\n  import ${v} from './clip/${clip.nome}/clip.json';\n  <Filmato clip={${v}} x={540} y={880} larghezza={420} da={s.dopo('segno')} />`);
  console.log(`\nDentro un telefono:\n  <Telefono x={540} y={900} larghezza={420}>\n    <Filmato clip={${v}} schermo da={s.dopo('segno')} />\n  </Telefono>`);
  console.log(`\nL'audio della clip non viene usato. Controlla con:  npm run foto ${slug} <secondi>`);
  return clip;
}
