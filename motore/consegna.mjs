// FMLAB Reel Kit — la consegna: quello che deve esserci nella cartella di un reel finito, fatto dal kit.
//
// Un reel non è solo l'mp4: per pubblicarlo servono la copertina e il testo del post, e per fidarsi servono la
// pagella e il foglio affiancato ai riferimenti. `npm run fai` chiama questa chiusura da solo; `npm run consegna
// <reel>` la rifà e dice cosa manca. Non spende niente e non rifà il video.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ErroreFmlab, cartellaReel, leggiJson, rel} from './percorsi.mjs';

/** Il momento della copertina: la fine della prima scena, quando tutto quello che l'aggancio mostra è già sul palco. */
export function istanteCopertina(dati) {
  const prima = dati.scene?.[0];
  if (!prima) return 0;
  return Math.round(Math.max(prima.inizio, Math.min(prima.fine, dati.durata) - 0.25) * 100) / 100;
}

/** La didascalia è ancora il modello vuoto? (le istruzioni tra parentesi sono ancora lì, o sotto "Didascalia" non c'è niente) */
export function didascaliaVuota(testo) {
  const righe = testo.split('\n');
  const da = righe.findIndex((r) => /^\*\*Didascalia\*\*/.test(r.trim()));
  const sue = da < 0 ? righe.filter((r) => !r.startsWith('#')) : righe.slice(da + 1, ((n) => (n < 0 ? righe.length : da + 1 + n))(righe.slice(da + 1).findIndex((r) => r.trim().startsWith('**'))));
  const corpo = sue.join('\n').trim();
  return !corpo || /^\(.*\)$/s.test(corpo);
}

/** Fa la copertina dal video finito: un fotogramma intero, in jpg. */
export async function faCopertina(slug, {istante = null} = {}) {
  const dir = cartellaReel(slug);
  const video = path.join(dir, `${slug}.mp4`);
  if (!fs.existsSync(video)) throw new ErroreFmlab(`Il video di "${slug}" non c'è ancora: prima npm run fai ${slug}.`);
  const {trovaFfmpeg} = await import('./ffmpeg.mjs');
  const ff = await trovaFfmpeg();
  const t = istante ?? istanteCopertina(leggiJson(path.join(dir, 'parole.json')));
  const uscita = path.join(dir, 'copertina.jpg');
  const r = spawnSync(ff.percorso, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', t.toFixed(3), '-i', video, '-frames:v', '1', '-q:v', '2', uscita], {encoding: 'utf8'});
  if (r.status !== 0 || !fs.existsSync(uscita)) throw new ErroreFmlab(`ffmpeg non riesce a prendere la copertina al secondo ${t.toFixed(1)}:\n${(r.stderr ?? '').split('\n').slice(-3).join('\n')}`);
  return {file: uscita, istante: t};
}

/**
 * Chiude un reel: copertina, pagella scritta, foglio affiancato (se i video di riferimento ci sono). Torna l'elenco
 * di quello che c'è e di quello che resta da fare a chi lavora; non lancia errori per le cose facoltative.
 */
export async function consegna(slug, {istante = null, affiancato = true} = {}) {
  const dir = cartellaReel(slug);
  const fatte = [];
  const mancano = [];
  // 1 · la copertina
  const copertina = await faCopertina(slug, {istante});
  fatte.push(`copertina.jpg (il fotogramma al secondo ${String(copertina.istante).replace('.', ',')})`);
  // 2 · la pagella, scritta nella cartella
  let pagellaReel = null;
  if (fs.existsSync(path.join(dir, 'piano.json'))) {
    const {pagella, schermata} = await import('./giudica.mjs');
    pagellaReel = await pagella(slug);
    fs.writeFileSync(path.join(dir, 'pagella.md'), `# Pagella · ${slug}\n\n\`\`\`\n${schermata(pagellaReel).trim()}\n\`\`\`\n`);
    fatte.push('pagella.md');
    for (const r of pagellaReel.righe.filter((x) => x.esito === 'no')) mancano.push(`pagella, riga ${r.n}: ${r.cosa} → ${r.valore}`);
  }
  // 3 · il foglio affiancato a un riferimento, se sul computer ci sono
  if (affiancato) {
    try {
      const {affianca} = await import('./affianca.mjs');
      const esito = await affianca(slug, {video: true});
      fatte.push(`${path.basename(esito.file)} (${esito.coppie} fotogrammi accanto al riferimento: va guardato)`);
    } catch (e) {
      if (!(e instanceof ErroreFmlab)) throw e;
      fatte.push('foglio affiancato: non fatto (in riferimenti/ non ci sono i video)');
    }
  }
  // 4 · il testo del post
  const fileDidascalia = path.join(dir, 'didascalia.md');
  if (!fs.existsSync(fileDidascalia) || didascaliaVuota(fs.readFileSync(fileDidascalia, 'utf8'))) mancano.push('didascalia.md è ancora vuota: scrivi le 2-3 righe del post (aggancio, un dettaglio in più, l\'invito)');
  else fatte.push('didascalia.md');
  return {slug, dir, fatte, mancano, pagella: pagellaReel};
}

/** Le righe da stampare alla fine. */
export function riassuntoConsegna(c) {
  const righe = [`Consegna di "${c.slug}" (${rel(c.dir)}):`, `  ✓ ${c.slug}.mp4`, ...c.fatte.map((f) => `  ✓ ${f}`)];
  if (c.mancano.length) righe.push('', `  Da sistemare prima di consegnare (${c.mancano.length}):`, ...c.mancano.map((m) => `  ✖ ${m}`), '  Quello che viene dal testo della persona non si tocca: si dichiara nella consegna.');
  else righe.push('', '  Niente da sistemare.');
  return righe.join('\n');
}

/** npm run consegna <reel> [copertina=<secondi>] */
export async function comandoConsegna(slug, argomenti = []) {
  if (!slug) throw new ErroreFmlab('Quale reel? Così: npm run consegna <reel>   (copertina=12 per scegliere il secondo della copertina)');
  const scelta = argomenti.find((a) => a.startsWith('copertina='))?.slice('copertina='.length).replace(',', '.');
  if (scelta !== undefined && !(Number(scelta) >= 0)) throw new ErroreFmlab(`copertina=${scelta}: servono i secondi, es. copertina=12`);
  console.log('\n' + riassuntoConsegna(await consegna(slug, {istante: scelta === undefined ? null : Number(scelta)})) + '\n');
}
