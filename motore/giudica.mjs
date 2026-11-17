// FMLAB Reel Kit — npm run giudica <reel>: la pagella di un piano in una schermata.
//
// Usa quello che il kit sa già (il controllo del piano, la regola della durata, la scaletta delle pose del
// narratore) e lo mette in otto righe: quelle di docs/OCCHIO.md. Non fa render e non genera voce.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ErroreFmlab, RADICE, leggiJson, rel} from './percorsi.mjs';
import {PAUSA_MASSIMA, RITMO_PRUDENTE, leggiPiano} from './piano.mjs';
import {PAROLE_AL_SECONDO, TOLLERANZA, giudicaDurata} from './durata.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';
import {leggiPersonaggi} from './personaggio.mjs';

/** I numeri della pagella: gli stessi di docs/OCCHIO.md. */
export const PAGELLA = {aggancio: 12, novitaMedia: 3, novitaMassima: 4, posa: 4};

const virgola = (n, cifre = 1) => Number(n).toFixed(cifre).replace('.', ',');
const pulita = (testo) => testo.toLowerCase().replace(/[^\p{L}]/gu, '');

// ───────────────────────── i numeri detti in lettere ─────────────────────────
const UNITA = ['due', 'tre', 'tré', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
const SOLE = new Set(['zero', 'uno', ...UNITA, 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove', 'cento', 'mille', 'mila', 'milione', 'milioni', 'miliardo', 'miliardi', 'metà', 'doppio', 'triplo']);
const DECINE = ['vent', 'trent', 'quarant', 'cinquant', 'sessant', 'settant', 'ottant', 'novant'];
// venti, trenta… · ventidue, trentatré… · ventuno, ventotto (la decina perde la vocale) · duecento, duemila, centoventi…
const DECINA = `(?:(?:venti|(?:${DECINE.slice(1).join('|')})a)(?:${UNITA.filter((u) => u !== 'otto').join('|')})?|(?:${DECINE.join('|')})(?:uno|otto))`;
const COMPOSTA = new RegExp(`^(?:(?:${UNITA.join('|')})?cento)?${DECINA}(?:mila)?$|^(?:${UNITA.join('|')})?cento(?:uno|${UNITA.join('|')}|dieci)?$|^(?:${UNITA.join('|')}|dieci|cento)mila$`);
/** "quattro", "ventidue", "duemila": una parola che dice un numero. */
export const numeroInLettere = (parola) => {
  const p = pulita(parola);
  return SOLE.has(p) || COMPOSTA.test(p);
};

/** Le scritte che una scena mette a schermo (non la fonte, non i colori, non i nomi delle icone). */
function scritteDi(dati, esce = []) {
  if (typeof dati === 'string') esce.push(dati);
  else if (Array.isArray(dati)) for (const v of dati) scritteDi(v, esce);
  else if (dati && typeof dati === 'object') for (const [k, v] of Object.entries(dati)) if (!['fonte', 'colore', 'colori', 'icona', 'tipo', 'regalo'].includes(k) && !/^segno/.test(k)) scritteDi(v, esce);
  return esce;
}
const VALORI = ['numero', 'confronto', 'barre', 'anello', 'linea', 'torta', 'classifica', 'scala', 'schede', 'persone'];

// ───────────────────────── la scaletta delle pose, senza render ─────────────────────────
let libreriaGesti = null;
async function caricaGesti() {
  if (libreriaGesti) return libreriaGesti;
  const esbuild = await import('esbuild');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-giudica-'));
  const ingresso = path.join(dir, 'ingresso.ts');
  const uscita = path.join(dir, 'gesti.mjs');
  const da = (file) => JSON.stringify(path.join(RADICE, 'libreria', file));
  fs.writeFileSync(ingresso, `export {scalettaAssetti, poseVicine} from ${da('gesti.ts')};\nexport {poseDi, secondeDi} from ${da('Pupazzo.tsx')};\n`);
  try {
    await esbuild.build({entryPoints: [ingresso], bundle: true, format: 'esm', platform: 'node', outfile: uscita, logLevel: 'silent', jsx: 'automatic', nodePaths: [path.join(RADICE, 'node_modules')], loader: {'.png': 'empty', '.jpg': 'empty', '.svg': 'empty', '.css': 'empty'}});
    libreriaGesti = await import(pathToFileURL(uscita).href);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
  return libreriaGesti;
}

/** La posa che il narratore tiene più a lungo, in secondi, dalla scaletta che userà il video. null se non c'è narratore. */
export async function posaPiuLunga(dati, piano, impostazioni, personaggi) {
  const narratore = impostazioni.narratore ?? {};
  const config = narratore.chi === 'nessuno' ? null : personaggi[narratore.chi];
  if (!config || config.tipo !== 'pupazzo') return null;
  const {scalettaAssetti, poseVicine, poseDi, secondeDi} = await caricaGesti();
  const seconde = Object.keys(secondeDi(config) ?? {});
  const fissa = narratore.mano2 && narratore.mano2 !== 'auto' && seconde.includes(narratore.mano2) ? narratore.mano2 : undefined;
  const regiaScena = (nome) => {
    const r = piano.scene.find((s) => s.nome === nome)?.narratore;
    return r && typeof r === 'object' ? r : undefined;
  };
  const regia = fissa ? (nome) => ({...(regiaScena(nome) ?? {}), seconda: regiaScena(nome)?.seconda ?? fissa}) : regiaScena;
  const cambi = [...scalettaAssetti(dati, regia, poseDi(config, personaggi), seconde)].sort((a, b) => a.t - b.t);
  if (!cambi.length) return {secondi: dati.durata, da: 0, cambi: 0};
  let lunga = {secondi: 0, da: 0};
  let inizio = Math.min(0, cambi[0].t);
  let posa = cambi[0].posa;
  for (const c of cambi.slice(1)) {
    if (poseVicine(posa, c.posa)) continue; // due pose che si somigliano, per chi guarda sono la stessa
    if (c.t - inizio > lunga.secondi) lunga = {secondi: c.t - inizio, da: inizio};
    inizio = c.t;
    posa = c.posa;
  }
  if (dati.durata - inizio > lunga.secondi) lunga = {secondi: dati.durata - inizio, da: inizio};
  return {...lunga, cambi: cambi.length};
}

// ───────────────────────── la pagella ─────────────────────────
const INVITI = /^(commenta|scrivi|scrivimi|segui|seguimi|seguici|iscriviti|salva|condividi|manda|invia|clicca|lascia|tagga)$/;

/** Le tre domande di docs/OCCHIO.md: stanno scritte lì e basta. */
export function treDomande() {
  const file = path.join(RADICE, 'docs', 'OCCHIO.md');
  if (!fs.existsSync(file)) return [];
  const testo = fs.readFileSync(file, 'utf8');
  return testo.slice(testo.indexOf('## Tre domande')).split('\n').filter((r) => /^\d\. /.test(r)).map((r) => r.replace(/^\d\. /, ''));
}

/**
 * Le otto righe di docs/OCCHIO.md per un reel. Ogni riga: {n, cosa, esito, valore}; esito è "ok", "no" oppure
 * "nd" (non si può dire senza quello che manca: il valore dice cosa).
 */
export async function pagella(slug) {
  const {dir, piano, testo, esito, tempiVeri} = leggiPiano(slug);
  if (esito.errori.length) throw new ErroreFmlab(`Il piano di "${slug}" ha ${esito.errori.length === 1 ? 'un errore' : `${esito.errori.length} errori`}: prima npm run piano ${slug}.`);
  const parole = esito.parole;
  const fileParole = path.join(dir, 'parole.json');
  const dati = tempiVeri ? leggiJson(fileParole) : null;
  // come npm run piano: dopo l'ultima parola il tempo è la fine della voce, non la coda del video
  const secondiDi = dati ? (i) => (i >= parole.length ? dati.parole[parole.length - 1].fine : dati.parole[i].inizio) : (i) => i / RITMO_PRUDENTE;
  const durata = dati ? dati.durata : parole.length / PAROLE_AL_SECONDO;
  const righe = [];
  const riga = (cosa, stato, valore) => righe.push({n: righe.length + 1, cosa, esito: stato === null ? 'nd' : stato ? 'ok' : 'no', valore});

  // 1 · aggancio
  let fine = parole.findIndex((p) => /[.!?…]["'”»)]*$/.test(p.testo));
  if (fine < 0) fine = parole.length - 1;
  riga(`Aggancio: prima frase sotto le ${PAGELLA.aggancio} parole`, fine + 1 < PAGELLA.aggancio, `${fine + 1} parole`);

  // 2 · il ritmo delle novità (le stesse che conta npm run piano: inizio scena e segni che fanno comparire qualcosa)
  const novita = [...new Set(esito.scene.flatMap((s) => [s.inizio, ...s.segni.filter((x) => s.usati.has(x.nome) || s.definizione.blocco === 'mano').map((x) => x.indice)]))].sort((a, b) => a - b);
  let attesa = {secondi: 0, da: 0};
  [...novita, parole.length].forEach((indice, k, tutti) => {
    if (k && secondiDi(indice) - secondiDi(tutti[k - 1]) > attesa.secondi) attesa = {secondi: secondiDi(indice) - secondiDi(tutti[k - 1]), da: tutti[k - 1]};
  });
  const media = secondiDi(parole.length) / novita.length;
  riga(`Una novità ogni 2-${PAGELLA.novitaMedia} secondi, mai più di ${PAGELLA.novitaMassima} senza un cambio`, media <= PAGELLA.novitaMedia && attesa.secondi <= PAGELLA.novitaMassima, `una ogni ${virgola(media)} s · attesa più lunga ${virgola(attesa.secondi)} s${attesa.secondi > PAUSA_MASSIMA ? ` da "${parole.slice(attesa.da, attesa.da + 3).map((p) => p.testo).join(' ')}…"` : ''}`);

  // 3 · il numero arriva quando la voce lo dice
  const conNumero = esito.scene.filter((s) => {
    const aSchermo = scritteDi(s.definizione.dati).some((t) => /\d/.test(t) && !/^#[0-9a-f]{6}$/i.test(t)) || VALORI.includes(s.definizione.blocco);
    return aSchermo && parole.slice(s.inizio, s.fine).some((p) => pulita(p.testo) !== 'uno' && numeroInLettere(p.testo));
  });
  const senzaSegno = conNumero.filter((s) => !s.segni.some((x) => numeroInLettere(parole[x.indice].testo)));
  riga('Il numero arriva quando la voce lo dice', conNumero.length ? !senzaSegno.length : null, conNumero.length ? `${conNumero.length - senzaSegno.length} scene su ${conNumero.length} con un segno sulla cifra${senzaSegno.length ? ` (manca in: ${senzaSegno.map((s) => s.nome).join(', ')})` : ''}` : 'nessun numero a schermo detto dalla voce');

  // 4 · la posa del narratore
  const impostazioni = leggiImpostazioni(slug);
  const posa = dati ? await posaPiuLunga(dati, piano, impostazioni, leggiPersonaggi()) : undefined;
  riga(`Nessuna posa del narratore oltre ${PAGELLA.posa} secondi`, posa ? posa.secondi <= PAGELLA.posa : null, posa === undefined ? `servono i tempi: npm run voce ${slug} stima` : posa === null ? 'il reel non ha il narratore' : `la più lunga ${virgola(posa.secondi)} s, dal secondo ${virgola(posa.da)}`);

  // 5 · rischio cartelli
  riga('Rischio cartelli basso', esito.rischio.livello === 'basso', `${esito.rischio.punti} su 100 (${esito.rischio.livello})`);

  // 6 · durata
  const chiesta = impostazioni.durata;
  const giudizio = giudicaDurata(durata, chiesta);
  const comeSo = dati ? (dati.precisione === 'stimata' ? 'stimati' : 'con la voce') : 'stimati dalle parole';
  riga(`Durata entro ${TOLLERANZA} secondi da quella chiesta`, chiesta ? giudizio.ok : null, chiesta ? `${virgola(durata)} s ${comeSo}, chiesti ${chiesta} (scarto ${virgola(giudizio.scarto)} s)` : `nessuna durata chiesta (${virgola(durata)} s ${comeSo})`);

  // 7 · numeri in lettere e fonti
  const cifre = parole.filter((p) => /\d/.test(p.testo)).length;
  const senzaFonte = esito.avvisi.filter((a) => a.includes('non ha una riga in fonti.md')).length;
  riga('Numeri in lettere nel testo, ogni numero a schermo con la sua fonte', !cifre && !senzaFonte, `${cifre} ${cifre === 1 ? 'cifra' : 'cifre'} nel testo · ${senzaFonte} ${senzaFonte === 1 ? 'numero' : 'numeri'} senza riga in fonti.md`);

  // 8 · un invito solo, alla fine
  const inizi = parole.map((p, i) => i).filter((i) => i === 0 || /[.!?…:]["'”»)]*$/.test(parole[i - 1].testo) || parole[i].capoverso !== parole[i - 1].capoverso);
  const inviti = inizi.filter((i) => INVITI.test(pulita(parole[i].testo)));
  const ultima = inizi[inizi.length - 1];
  riga('Un invito solo, per esteso, alla fine', inviti.length === 1 && inviti[0] === ultima, inviti.length === 0 ? 'nessun invito' : inviti.length === 1 ? (inviti[0] === ultima ? `"${parole[ultima].testo.replace(/[^\p{L}]/gu, '')}…" nell'ultima frase` : 'un invito, ma non nell\'ultima frase') : `${inviti.length} inviti: ${inviti.map((i) => `"${parole[i].testo.replace(/[^\p{L}]/gu, '')}…"`).join(', ')}`);

  const provini = path.join(dir, 'provini.jpg');
  const vecchi = fs.existsSync(provini) && fs.statSync(provini).mtimeMs < fs.statSync(path.join(dir, 'piano.json')).mtimeMs;
  return {
    slug,
    righe,
    scene: esito.scene.length,
    parole: parole.length,
    tempi: dati ? (dati.precisione === 'stimata' ? 'tempi stimati' : 'tempi della voce') : 'senza tempi',
    consigli: esito.avvisi.length,
    provini: !fs.existsSync(provini) ? `non ci sono: npm run provini ${slug}` : vecchi ? `${rel(provini)} è più vecchio del piano: npm run provini ${slug}` : rel(provini),
    domande: treDomande(),
  };
}

const SEGNO = {ok: '✓', no: '✖', nd: '·'};

/** La schermata: otto righe, il conto, i provini, le tre domande. */
export function schermata(p) {
  const larga = Math.max(...p.righe.map((r) => r.cosa.length));
  const conto = (e) => p.righe.filter((r) => r.esito === e).length;
  const esce = [`\nPagella di "${p.slug}"  ·  ${p.scene} scene, ${p.parole} parole, ${p.tempi}\n`];
  for (const r of p.righe) esce.push(`  ${SEGNO[r.esito]}  ${r.n} ${r.cosa.padEnd(larga)}   ${r.valore}`);
  esce.push(`\n  ${conto('ok')} a posto, ${conto('no')} da sistemare${conto('nd') ? `, ${conto('nd')} che qui non si ${conto('nd') === 1 ? 'può' : 'possono'} dire` : ''}.${p.consigli ? ` Il piano ha ${p.consigli} ${p.consigli === 1 ? 'consiglio' : 'consigli'}: npm run piano ${p.slug}` : ''}`);
  esce.push(`  Provini: ${p.provini}`);
  if (p.domande.length) {
    esce.push('\n  Prima di consegnare, ad alta voce (docs/OCCHIO.md):');
    p.domande.forEach((d, i) => esce.push(`   ${i + 1}. ${d}`));
  }
  return esce.join('\n') + '\n';
}

/** npm run giudica <reel> */
export async function comandoGiudica(slug) {
  if (!slug) throw new ErroreFmlab('Quale reel? Così: npm run giudica <reel>');
  console.log(schermata(await pagella(slug)));
}
