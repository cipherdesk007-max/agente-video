// FMLAB Reel Kit — le scelte di un reel: narratore (chi, grandezza, lato) e stile (2d / 3d / auto).
//
//   stile/impostazioni.json            le scelte di partenza, valide per tutti i reel
//   reels/<reel>/impostazioni.json     quelle di un reel: basta scrivere solo ciò che cambia
//
// Si modificano a mano, dal pannello (npm run pannello) oppure con:
//   npm run imposta <reel> narratore=nessuno grandezza=80 lato=sinistra stile=3d
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, RADICE, cartellaReel, leggiJson, rel, scriviJson} from './percorsi.mjs';
import {leggiPersonaggi} from './personaggio.mjs';

export const STILI = ['auto', '2d', '3d'];
export const MOTORI_VOCE = ['auto', 'elevenlabs', 'mac', 'comando', 'stima'];
export const GRANDEZZA = {min: 40, max: 160};
/** La seconda mano del narratore: cambia da sola a ogni posa, oppure resta sempre in uno stato. */
export const MANO2 = ['auto', 'aperta', 'alza', 'giu'];
const DI_FABBRICA = {narratore: {chi: 'nessuno', grandezza: 100, lato: 'destra', alza: 0, specchia: false, mano2: 'auto'}, stile: 'auto', musica: 30, voce: {motore: 'auto', elevenlabs: {}, mac: {}, comando: {}}};

/** Le voci scelte, per motore e per lingua: {motore, elevenlabs: {it: 'id'}, mac: {it: 'Alice'}, comando: {it: 'nome'}}. */
function sistemaVoce(grezza, dove) {
  const motore = String(grezza?.motore ?? 'auto').toLowerCase();
  if (!MOTORI_VOCE.includes(motore)) throw new ErroreFmlab(`${dove}: il motore della voce "${motore}" non esiste. Puoi scegliere: ${MOTORI_VOCE.join(', ')}.`);
  const mappa = (v) => {
    const esito = {};
    for (const [lingua, nome] of Object.entries(v && typeof v === 'object' ? v : {})) {
      if (/^[a-z]{2}(-[a-z]{2})?$/i.test(lingua) && typeof nome === 'string' && nome.trim()) esito[lingua.toLowerCase()] = nome.trim().slice(0, 120);
    }
    return esito;
  };
  return {motore, elevenlabs: mappa(grezza?.elevenlabs), mac: mappa(grezza?.mac), comando: mappa(grezza?.comando)};
}
const FILE_KIT = path.join(RADICE, 'stile', 'impostazioni.json');

function leggiSeCe(file) {
  if (!fs.existsSync(file)) return {};
  try {
    return leggiJson(file);
  } catch (e) {
    throw new ErroreFmlab(`${rel(file)} non è un JSON valido: ${e.message}`);
  }
}

/** Controlla e completa le impostazioni; segnala con chiarezza i valori sbagliati. */
export function sistema(grezze, personaggi = leggiPersonaggi(), dove = 'impostazioni') {
  const n = {...DI_FABBRICA.narratore, ...(grezze?.narratore ?? {})};
  const stile = String(grezze?.stile ?? DI_FABBRICA.stile).toLowerCase();
  const chi = String(n.chi ?? 'nessuno');
  // una "figura" è un altro disegno dello stesso personaggio (una sua posa): non si sceglie come narratore
  const nomi = Object.keys(personaggi).filter((k) => !personaggi[k].figuraDi);
  if (chi !== 'nessuno' && !personaggi[chi]) {
    throw new ErroreFmlab(`${dove}: il narratore "${chi}" non esiste. Puoi scegliere: ${[...nomi, 'nessuno'].join(', ')}.`);
  }
  if (chi !== 'nessuno' && personaggi[chi].figuraDi) {
    throw new ErroreFmlab(`${dove}: "${chi}" è una posa di "${personaggi[chi].figuraDi}", non un narratore. Puoi scegliere: ${[...nomi, 'nessuno'].join(', ')}.`);
  }
  if (!STILI.includes(stile)) throw new ErroreFmlab(`${dove}: lo stile "${stile}" non esiste. Puoi scegliere: ${STILI.join(', ')}.`);
  const grandezza = Number(n.grandezza);
  if (!Number.isFinite(grandezza) || grandezza < GRANDEZZA.min || grandezza > GRANDEZZA.max) {
    throw new ErroreFmlab(`${dove}: la grandezza del narratore va da ${GRANDEZZA.min} a ${GRANDEZZA.max} (100 = misura normale). Trovato: ${n.grandezza}`);
  }
  const lato = String(n.lato);
  if (lato !== 'destra' && lato !== 'sinistra') throw new ErroreFmlab(`${dove}: il lato del narratore è "destra" oppure "sinistra". Trovato: ${n.lato}`);
  const alza = Number(n.alza ?? 0);
  if (!Number.isFinite(alza) || Math.abs(alza) > 800) throw new ErroreFmlab(`${dove}: "alza" è un numero di pixel tra -800 e 800. Trovato: ${n.alza}`);
  const mano2 = String(n.mano2 ?? 'auto').toLowerCase().replace('giù', 'giu');
  if (!MANO2.includes(mano2)) throw new ErroreFmlab(`${dove}: la seconda mano del narratore può essere: ${MANO2.join(', ')}. Trovato: ${n.mano2}`);
  const musica = Number(grezze?.musica ?? DI_FABBRICA.musica);
  if (!Number.isFinite(musica) || musica < 0 || musica > 100) throw new ErroreFmlab(`${dove}: il volume della musica va da 0 (niente) a 100. Trovato: ${grezze?.musica}`);
  return {narratore: {chi, grandezza: Math.round(grandezza), lato, alza: Math.round(alza), specchia: n.specchia === true || n.specchia === 'si' || n.specchia === 'true', mano2}, stile, musica: Math.round(musica), voce: sistemaVoce(grezze?.voce, dove)};
}

/** Impostazioni di partenza del kit. */
export function impostazioniKit(personaggi = leggiPersonaggi()) {
  return sistema(leggiSeCe(FILE_KIT), personaggi, rel(FILE_KIT));
}

function fileDelReel(slug) {
  return path.join(cartellaReel(slug), 'impostazioni.json');
}

/** Impostazioni complete di un reel: quelle del kit più ciò che il reel cambia. */
export function leggiImpostazioni(slug, personaggi = leggiPersonaggi()) {
  const kit = leggiSeCe(FILE_KIT);
  const file = fileDelReel(slug);
  const sue = leggiSeCe(file);
  const voce = {
    motore: sue.voce?.motore ?? kit.voce?.motore,
    elevenlabs: {...(kit.voce?.elevenlabs ?? {}), ...(sue.voce?.elevenlabs ?? {})},
    mac: {...(kit.voce?.mac ?? {}), ...(sue.voce?.mac ?? {})},
    comando: {...(kit.voce?.comando ?? {}), ...(sue.voce?.comando ?? {})},
  };
  return sistema({narratore: {...(kit.narratore ?? {}), ...(sue.narratore ?? {})}, stile: sue.stile ?? kit.stile, musica: sue.musica ?? kit.musica, voce}, personaggi, rel(file));
}

/** Salva le impostazioni di un reel (complete, già controllate). */
export function scriviImpostazioni(slug, impostazioni, personaggi = leggiPersonaggi()) {
  const file = fileDelReel(slug);
  const altro = leggiSeCe(file);
  // chi salva solo una parte (per esempio il pannello: solo narratore e stile) non cancella il resto
  const complete = {narratore: impostazioni.narratore ? {...(altro.narratore ?? {}), ...impostazioni.narratore} : altro.narratore, stile: impostazioni.stile ?? altro.stile, musica: impostazioni.musica ?? altro.musica, voce: impostazioni.voce ?? altro.voce};
  const pulite = sistema(complete, personaggi, rel(file));
  scriviJson(file, {...altro, ...pulite});
  return pulite;
}

const CHIAVI = {narratore: 'chi', chi: 'chi', personaggio: 'chi', grandezza: 'grandezza', lato: 'lato', alza: 'alza', specchia: 'specchia', mano: 'mano2', mano2: 'mano2'};

/** npm run imposta <reel> [chiave=valore…]  — senza coppie mostra le impostazioni attuali. */
export async function comandoImposta(slug, argomenti = []) {
  const personaggi = leggiPersonaggi();
  const attuali = leggiImpostazioni(slug, personaggi);
  const nuove = {narratore: {...attuali.narratore}, stile: attuali.stile, musica: attuali.musica, voce: attuali.voce};
  for (const a of argomenti) {
    const m = /^([a-zà]+)=(.*)$/i.exec(a);
    if (!m) throw new ErroreFmlab(`Non capisco "${a}". Scrivi coppie chiave=valore, per esempio: narratore=nessuno grandezza=80 lato=sinistra stile=3d`);
    const chiave = m[1].toLowerCase();
    const valore = m[2].trim();
    if (chiave === 'stile') nuove.stile = valore.toLowerCase();
    else if (chiave === 'voce' || chiave === 'motore') nuove.voce = {...nuove.voce, motore: valore.toLowerCase()};
    else if (chiave === 'musica') nuove.musica = /^(no|niente|spenta)$/i.test(valore) ? 0 : Number(valore.replace(',', '.'));
    else if (CHIAVI[chiave]) nuove.narratore[CHIAVI[chiave]] = ['chi', 'lato', 'mano2'].includes(CHIAVI[chiave]) ? valore.toLowerCase() : CHIAVI[chiave] === 'specchia' ? /^(si|sì|true|1)$/i.test(valore) : Number(valore.replace(',', '.'));
    else throw new ErroreFmlab(`"${chiave}" non è un'impostazione. Puoi cambiare: narratore, grandezza, lato, alza, specchia, mano, stile, musica, voce.`);
  }
  const esito = argomenti.length ? scriviImpostazioni(slug, nuove, personaggi) : attuali;
  const n = esito.narratore;
  console.log(`\nImpostazioni di "${slug}"${argomenti.length ? ' (salvate)' : ''}:`);
  console.log(`  narratore   ${n.chi}${n.chi !== 'nessuno' ? `  ·  grandezza ${n.grandezza}%  ·  lato ${n.lato}${n.alza ? `  ·  alzato di ${n.alza} px` : ''}${n.specchia ? '  ·  specchiato' : ''}${n.mano2 !== 'auto' ? `  ·  seconda mano: ${n.mano2}` : ''}` : '  (reel senza narratore)'}`);
  console.log(`  stile       ${esito.stile}`);
  console.log(`  musica      ${esito.musica ? `volume ${esito.musica} su 100 (solo se nella cartella del reel c'è musica.mp3)` : 'spenta'}`);
  const scelte = ['elevenlabs', 'mac', 'comando'].flatMap((m) => Object.entries(esito.voce[m]).map(([l, n]) => `${m}/${l}: ${n}`));
  console.log(`  voce        ${esito.voce.motore}${scelte.length ? `  ·  ${scelte.join('  ·  ')}` : ''}`);
  console.log(`\nPersonaggi disponibili: ${[...Object.keys(personaggi).filter((k) => !personaggi[k].figuraDi), 'nessuno'].join(', ')}\n`);
  return esito;
}
