// FMLAB Reel Kit — DAL TESTO AL VIDEO CON UN COMANDO, a tappe.
//
//   npm run fai <reel>                                   riprende dalla prima tappa non fatta
//   npm run fai <reel> testo=<file.txt> "Titolo" durata=60 narratore=nessuno regalo=mappa      parte da un testo
//   npm run fai <reel> bozza            video di prova (più veloce)        da=<tappa>   rifà da quella tappa
//   npm run fai <reel> voce=si          autorizza la voce a pagamento (senza, ci si ferma e si dice quanto costa)
//
// Due tempi, come si fa con le cose costose: prima si fissa la composizione spendendo niente (piano, copione,
// scene, tempi stimati, provini), poi si paga il dettaglio (voce vera, video). Ogni tappa riuscita è salvata:
// se una fallisce si corregge e si rilancia, e le altre non si rifanno. Se cambia il testo, il piano o una
// scelta, si riparte dal montaggio. Il video è "fatto" solo se la verifica passa.
import {adesso, annota} from './registro.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {CACHE, CARTELLA_REELS, ErroreFmlab, leggiJson, rel, scriviJson} from './percorsi.mjs';

export const TAPPE = ['regia', 'monta', 'tempi', 'provini', 'voce', 'render', 'verifica', 'confronta'];

function impronta(dir, bozza) {
  const h = crypto.createHash('sha1');
  for (const f of ['testo.txt', 'piano.json', 'mano.tsx', 'impostazioni.json']) {
    const file = path.join(dir, f);
    h.update(f).update(fs.existsSync(file) ? fs.readFileSync(file) : '-');
  }
  return h.update(bozza ? 'bozza' : 'finale').digest('hex').slice(0, 12);
}

/** Che voce userebbe il reel, e se costa: {motore, caratteri, paga}. */
async function preventivoVoce(slug, dir) {
  const {leggiImpostazioni} = await import('./impostazioni.mjs');
  const {leggiCopione} = await import('./copione.mjs');
  const scelte = leggiImpostazioni(slug).voce;
  let motore = scelte.motore;
  if (motore === 'auto') {
    if (process.env.ELEVENLABS_API_KEY && (scelte.elevenlabs?.it || process.env.ELEVENLABS_VOICE_ID)) motore = 'elevenlabs';
    else if (process.env.FMLAB_VOCE_COMANDO) motore = 'comando';
    else if (process.platform === 'darwin') motore = 'mac';
    else motore = 'stima';
  }
  const copione = leggiCopione(fs.readFileSync(path.join(dir, 'copione.md'), 'utf8'));
  let giaFatta = false;
  try {
    const dati = leggiJson(path.join(dir, 'parole.json'));
    giaFatta = dati.motore === motore && dati.impronta === copione.impronta;
  } catch {
    // nessuna voce ancora
  }
  if (motore !== 'elevenlabs') return {motore, caratteri: copione.testoParlato.length, paga: false};
  // frase per frase: si pagano solo le frasi che non sono né in banca né già generate
  const {preventivoElevenLabs} = await import('./voce.mjs');
  const conto = preventivoElevenLabs(copione, 'it', scelte);
  return {motore, caratteri: conto.caratteri, pronte: conto.pronte, paga: !giaFatta && conto.caratteri > 0};
}

export async function comandoFai(slug, argomenti = []) {
  if (!slug) throw new ErroreFmlab('Quale reel? Esempi:\n  npm run fai reta-ginocchio\n  npm run fai nuovo-reel testo=testo.txt "Titolo" durata=60 regalo=mappa');
  const dir = path.join(CARTELLA_REELS, slug);
  const bozza = argomenti.includes('bozza');
  const comunque = argomenti.includes('comunque');
  const voceSi = argomenti.some((a) => /^voce=(si|sì)$/i.test(a));
  const da = argomenti.find((a) => a.startsWith('da='))?.slice(3);
  if (da && !TAPPE.includes(da)) throw new ErroreFmlab(`La tappa "${da}" non esiste. Tappe: ${TAPPE.join(', ')}.`);
  const perNuovo = argomenti.filter((a) => !['bozza', 'comunque'].includes(a) && !/^(voce=(si|sì)|da=.*)$/i.test(a));

  // tappa zero: il reel non c'è ancora e arriva un testo
  if (!fs.existsSync(dir)) {
    if (!perNuovo.some((a) => a.toLowerCase().startsWith('testo='))) throw new ErroreFmlab(`Il reel "${slug}" non esiste. Per crearlo da un testo: npm run fai ${slug} testo=<file.txt> "Titolo"`);
    const {comandoNuovo} = await import('./nuovo.mjs');
    await comandoNuovo(slug, perNuovo);
  }

  const fileStato = path.join(CACHE, slug, 'fai.json');
  let stato = {impronta: '', fatte: []};
  try {
    stato = leggiJson(fileStato);
  } catch {
    // prima volta
  }
  const salva = () => {
    fs.mkdirSync(path.dirname(fileStato), {recursive: true});
    scriviJson(fileStato, stato);
  };
  const tappe = {
    regia: async () => {
      if (fs.existsSync(path.join(dir, 'piano.json'))) return 'piano.json c\'è già: uso quello';
      const {comandoRegia} = await import('./regista.mjs');
      await comandoRegia(slug, []);
    },
    monta: async () => {
      const {monta} = await import('./piano.mjs');
      const esito = monta(slug);
      if (esito.rischio.livello === 'alto' && !comunque) {
        throw new ErroreFmlab(`Rischio cartelli ${esito.rischio.punti} su 100: il reel sarebbe una fila di scritte ferme. Migliora piano.json (le voci sono qui sopra) e rilancia.\nPer andare avanti lo stesso: npm run fai ${slug} comunque`);
      }
    },
    tempi: async () => {
      const {comandoVoce} = await import('./voce.mjs');
      const fileParole = path.join(dir, 'parole.json');
      const vera = fs.existsSync(fileParole) && leggiJson(fileParole).motore !== 'stima';
      // con una voce vera già fatta sullo stesso testo i tempi si riallineano da soli al momento del video
      if (vera) return 'c\'è già una voce vera: i tempi sono i suoi';
      await comandoVoce(slug, ['stima']);
    },
    provini: async () => {
      const {comandoProvini} = await import('./foto.mjs');
      await comandoProvini(slug, []);
    },
    voce: async () => {
      const p = await preventivoVoce(slug, dir);
      if (p.motore === 'stima') return 'nessuna voce disponibile su questo computer: il video esce con i tempi stimati e senza voce';
      if (p.paga) annota('preventivo', {reel: slug, caratteri: p.caratteri, pronte: p.pronte ?? 0});
      if (p.paga && !voceSi) {
        throw new ErroreFmlab(`La voce ElevenLabs di questo testo costa circa ${p.caratteri} crediti (uno per carattere${p.pronte ? `; ${p.pronte} frasi sono già pronte e non si pagano` : ''}). Composizione e provini sono già fatti e controllati.\nPer generarla: npm run fai ${slug} voce=si`);
      }
      const {comandoVoce} = await import('./voce.mjs');
      await comandoVoce(slug, []);
    },
    render: async () => {
      const {rendi} = await import('./render.mjs');
      await rendi(slug, null, {bozza});
    },
    verifica: async () => {
      const {comandoVerifica} = await import('./verifica.mjs');
      const prima = process.exitCode;
      process.exitCode = 0;
      await comandoVerifica(slug, []);
      const fallita = process.exitCode === 1;
      process.exitCode = prima;
      if (fallita) throw new ErroreFmlab(`La verifica ha trovato errori (sono in ${rel(path.join(dir, 'verifica.md'))}): il video c'è ma NON è da consegnare. Correggi e rilancia: le tappe già riuscite non si rifanno.`);
    },
    confronta: async () => {
      const {comandoConfronta} = await import('./confronta.mjs');
      // la bozza ha il suo file: si misura quella (il metro lavora su fotogrammi rimpiccioliti, la risoluzione non conta)
      await comandoConfronta([bozza ? path.join(dir, `${slug}.bozza.mp4`) : slug]);
    },
  };

  let attuale = impronta(dir, bozza);
  if (stato.impronta !== attuale) stato = {impronta: attuale, fatte: stato.fatte.filter((t) => t === 'regia')};
  if (da) stato.fatte = stato.fatte.filter((t) => TAPPE.indexOf(t) < TAPPE.indexOf(da));
  for (const [n, tappa] of TAPPE.entries()) {
    if (stato.fatte.includes(tappa)) {
      console.log(`\n── ${n + 1}/${TAPPE.length} · ${tappa}: già fatta`);
      continue;
    }
    console.log(`\n── ${n + 1}/${TAPPE.length} · ${tappa}${tappa === 'voce' ? '  (da qui in poi si spende: tempo, ed eventualmente crediti)' : ''}`);
    const inizio = Date.now();
    const fatto = {reel: slug, tappa, n: n + 1, di: TAPPE.length};
    adesso({comando: 'fai', ...fatto, percento: null});
    annota('tappa', {...fatto, stato: 'parte'});
    let nota;
    try {
      nota = await tappe[tappa]();
    } catch (e) {
      salva();
      annota('tappa', {...fatto, stato: 'ferma', motivo: String(e?.message ?? e).split('\n')[0].slice(0, 400)});
      if (e instanceof ErroreFmlab) throw new ErroreFmlab(`${e.message}\n\nFermo alla tappa "${tappa}" (${n + 1} di ${TAPPE.length}). Dopo la correzione: npm run fai ${slug}${bozza ? ' bozza' : ''}`);
      throw e;
    }
    if (nota) console.log(`   ${nota}`);
    console.log(`   fatta in ${((Date.now() - inizio) / 1000).toFixed(0)} s`);
    annota('tappa', {...fatto, stato: 'fatta', secondi: Math.round((Date.now() - inizio) / 1000), ...(nota ? {nota: String(nota).slice(0, 300)} : {})});
    // la regia scrive il piano: l'impronta cambia per forza, ma non è una modifica di chi lavora
    if (tappa === 'regia') {
      attuale = impronta(dir, bozza);
      stato.impronta = attuale;
    }
    stato.fatte.push(tappa);
    salva();
  }
  console.log(`\nFatto: tutte le ${TAPPE.length} tappe riuscite. Il video è in ${rel(dir)}.${bozza ? ' È una bozza: per il video finale rilancia senza "bozza".' : ''}\nResta la chiusura del reel: npm run riuso ${slug}`);
}
