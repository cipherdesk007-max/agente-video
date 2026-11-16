// FMLAB Reel Kit — i file di un reel e le sue versioni in altre lingue.
//
//   copione.md        versione principale (la lingua è scritta in cima: <!-- lingua: it -->)
//   copione.en.md     stessa storia in un'altra lingua, con gli STESSI [segni] e [scena:…]
//
// Ogni versione ha i suoi file: parole.en.json, voce.en.mp3, sottotitoli.en.srt, <reel>.en.mp4.
// Le scene (scene.tsx) sono una sola: si agganciano ai segni, quindi si risincronizzano in ogni lingua.
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, cartellaReel, rel} from './percorsi.mjs';

const CODICE = /^[a-z]{2}(-[a-z]{2})?$/i;

export function linguaDelCopione(testo, predefinita = 'it') {
  const m = /<!--\s*lingua\s*:\s*([a-z]{2}(?:-[a-z]{2})?)\s*-->/i.exec(testo);
  return (m ? m[1] : predefinita).toLowerCase();
}

function linguaPrincipale(dir) {
  const file = path.join(dir, 'copione.md');
  if (!fs.existsSync(file)) throw new ErroreFmlab(`Manca ${rel(file)} (il testo da pronunciare).`);
  return linguaDelCopione(fs.readFileSync(file, 'utf8'));
}

/** Lingue per cui esiste un copione, oltre alla principale. */
export function altreLingue(slug) {
  const dir = cartellaReel(slug);
  return fs
    .readdirSync(dir)
    .map((f) => /^copione\.([a-z]{2}(?:-[a-z]{2})?)\.md$/i.exec(f))
    .filter(Boolean)
    .map((m) => m[1].toLowerCase())
    .sort();
}

/** Tutti i percorsi di un reel, per la versione principale (variante = null) o per una lingua. */
export function apriReel(slug, variante = null) {
  const dir = cartellaReel(slug);
  const linguaBase = linguaPrincipale(dir);
  let v = variante ? String(variante).toLowerCase() : null;
  if (v === linguaBase) v = null;
  const suffisso = v ? `.${v}` : '';
  const copione = path.join(dir, `copione${suffisso}.md`);
  if (!fs.existsSync(copione)) {
    throw new ErroreFmlab(
      `Manca ${rel(copione)}.\nPer la versione "${v}" traduci copione.md in quel file, tenendo gli stessi [segni] e [scena:…].`
    );
  }
  return {
    slug,
    dir,
    variante: v,
    lingua: v ?? linguaBase,
    linguaBase,
    suffisso,
    nome: `${slug}${suffisso}`,
    copione,
    parole: path.join(dir, `parole${suffisso}.json`),
    srt: path.join(dir, `sottotitoli${suffisso}.srt`),
    video: path.join(dir, `${slug}${suffisso}.mp4`),
    scene: path.join(dir, 'scene.tsx'),
    nomeVoce: `voce${suffisso}`,
    provini: path.join(dir, 'provini'),
  };
}

/**
 * Tra gli argomenti di un comando riconosce la lingua: un codice di due lettere conta come lingua
 * solo se è quella principale o se esiste il copione di quella lingua (così "km" resta un segno).
 */
export function estraiVariante(slug, argomenti) {
  const dir = cartellaReel(slug);
  const linguaBase = linguaPrincipale(dir);
  const resto = [];
  let variante = null;
  for (const a of argomenti) {
    const minuscolo = String(a).toLowerCase();
    if (variante === null && CODICE.test(a) && (minuscolo === linguaBase || fs.existsSync(path.join(dir, `copione.${minuscolo}.md`)))) {
      variante = minuscolo;
    } else {
      resto.push(a);
    }
  }
  return {variante, resto};
}
