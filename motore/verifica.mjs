// FMLAB Reel Kit — verifica: controlli automatici che chiunque può rifare e rileggere.
// Scrive il risultato in reels/<reel>/verifica.md. Esce con errore se c'è almeno un ✖.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ErroreFmlab, leggiJson, rel, sec} from './percorsi.mjs';
import {estraiVariante} from './reel.mjs';
import {confrontaTesto, leggiCopione, testoDaDire} from './copione.mjs';
import {giudicaDurata} from './durata.mjs';
import {numeriSenzaFonte} from './fonti.mjs';
import {avvisiNarratore, leggiImpostazioni} from './impostazioni.mjs';
import {impagina} from './comune/pagine.mjs';
import {apriReelNelBrowser} from './foto.mjs';
import {infoMedia, misuraTraccia, trovaFfmpeg} from './ffmpeg.mjs';
import {trovaMusica} from './render.mjs';

const OK = '✓';
const AVVISO = '⚠';
const ERRORE = '✖';

function creaRapporto() {
  const righe = [];
  return {
    righe,
    ok: (titolo, dettaglio = '') => righe.push({esito: OK, titolo, dettaglio}),
    avviso: (titolo, dettaglio = '') => righe.push({esito: AVVISO, titolo, dettaglio}),
    errore: (titolo, dettaglio = '') => righe.push({esito: ERRORE, titolo, dettaglio}),
    sezione: (nome) => righe.push({sezione: nome}),
  };
}

const CONFRONTO = {larghezza: 270, altezza: 480};
const GREZZO = ['-vf', `scale=${CONFRONTO.larghezza}:${CONFRONTO.altezza}:flags=area`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'];

/** Fotogramma n del video come pixel grezzi (rimpicciolito), oppure null se non si riesce a estrarlo. */
function pixelDalVideo(ff, video, n, fps) {
  // si posiziona mezzo fotogramma prima: il primo fotogramma decodificato è esattamente il numero n
  const istante = Math.max(0, (n - 0.5) / fps).toFixed(5);
  const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-ss', istante, '-i', video, ...GREZZO], {maxBuffer: 16 * 1024 * 1024});
  return r.status === 0 && r.stdout?.length === CONFRONTO.larghezza * CONFRONTO.altezza * 3 ? r.stdout : null;
}

/** Un'immagine PNG (la scena disegnata ora) come pixel grezzi, alla stessa misura. */
function pixelDaPng(ff, png) {
  const r = spawnSync(ff.percorso, ['-hide_banner', '-f', 'image2pipe', '-c:v', 'png', '-i', '-', ...GREZZO], {input: png, maxBuffer: 16 * 1024 * 1024});
  return r.status === 0 && r.stdout?.length === CONFRONTO.larghezza * CONFRONTO.altezza * 3 ? r.stdout : null;
}

/** Differenza media tra due immagini grezze, da 0 (identiche) a 255. */
function differenza(a, b) {
  let somma = 0;
  for (let i = 0; i < a.length; i++) somma += Math.abs(a[i] - b[i]);
  return somma / a.length;
}

/** Cosa c'è nella traccia audio, detto per quello che è (B16). */
export function fraseAudio({voce = false, effetti = 0, musica = false} = {}) {
  const pezzi = [voce ? 'la voce' : null, musica ? 'la musica' : null, effetti ? `${effetti} ${effetti === 1 ? 'effetto sonoro' : 'effetti sonori'}` : null].filter(Boolean);
  if (!pezzi.length) return 'silenzio: voce non ancora generata';
  return `con ${pezzi.join(', ')}${voce ? '' : ' (senza voce: non ancora generata)'}`;
}

/** npm run verifica <reel> [lingua] */
export async function comandoVerifica(slug, argomenti = []) {
  const {variante, resto} = estraiVariante(slug, argomenti);
  if (resto.length) throw new ErroreFmlab(`Non capisco "${resto.join(' ')}". Uso: npm run verifica ${slug} [lingua]`);
  const R = creaRapporto();
  const sessione = await apriReelNelBrowser(slug, variante);
  const reel = sessione.reel;
  try {
    const dati = leggiJson(reel.parole);
    const info = sessione.pagina.info;
    const fps = dati.fps;
    const totale = Math.max(1, Math.round(dati.durata * fps));

    // ───── copione e tempi ─────
    R.sezione('Copione e tempi');
    const copione = leggiCopione(fs.readFileSync(reel.copione, 'utf8'));
    if (copione.impronta === dati.impronta) R.ok('La voce corrisponde al copione attuale');
    else R.errore('Il copione è stato modificato dopo aver generato la voce', `Rilancia: npm run voce ${slug}${reel.variante ? ' ' + reel.variante : ''}`);

    if (dati.motore === 'stima') R.avviso('Tempi stimati, nessuna voce', 'Va bene per lavorare alle scene. Per il video finale genera la voce vera.');
    else R.ok(`Voce: ${dati.motore}, precisione "${dati.precisione}"`);

    // il testo dato dalla persona (testo.txt): il copione deve pronunciare quello, parola per parola
    const fileTesto = path.join(reel.dir, `testo${reel.suffisso}.txt`);
    if (fs.existsSync(fileTesto)) {
      const diverso = confrontaTesto(testoDaDire(fs.readFileSync(fileTesto, 'utf8')), copione.testoParlato);
      if (diverso) R.errore(`Il copione non dice il testo dato: alla parola ${diverso.parola} c'è "${diverso.trovato}" al posto di "${diverso.atteso}"`, `Il testo di ${rel(fileTesto)} va pronunciato parola per parola: nel copione si aggiungono solo scene, segni, enfasi e suoni.`);
      else R.ok(`Il testo del reel è quello dato, parola per parola (${copione.parole.length} parole, ${rel(fileTesto)})`);
    }

    const parole = dati.parole.length;
    const ritmo = parole / Math.max(0.1, dati.durataVoce);
    const chiesta = leggiImpostazioni(slug).durata;
    const svelta = dati.velocita && dati.velocita !== 1 ? `, voce a velocità ${String(Math.round(dati.velocita * 100) / 100).replace('.', ',')}` : '';
    if (chiesta) {
      // la regola: la durata è quella chiesta, con al massimo 5 secondi di scarto
      const giudizio = giudicaDurata(dati.durata, chiesta);
      if (giudizio.ok) R.ok(`Durata ${sec(dati.durata, 1)}, chiesti ${chiesta} (scarto ${String(giudizio.scarto).replace('.', ',')} s)${svelta}, ${parole} parole`);
      else R.errore(`Durata ${sec(dati.durata, 1)}, chiesti ${chiesta}: ${giudizio.scarto > 0 ? 'più lungo' : 'più corto'} di oltre 5 secondi${svelta}`, giudizio.scarto > 0 ? `La voce è già alla velocità massima. Togli parole dal testo oppure chiedi una durata più lunga: npm run imposta ${slug} durata=…  (npm run voce ${slug} stima  dice quante parole).` : `La voce non si rallenta. Servono più parole, oppure una durata più corta: npm run imposta ${slug} durata=${Math.max(15, Math.round(dati.durata / 5) * 5)}`);
    } else if (dati.durata > 90) R.avviso(`Durata ${sec(dati.durata, 1)}: oltre 90 secondi`, 'I reel più visti stanno tra 30 e 60 secondi.');
    else if (dati.durata < 12) R.avviso(`Durata ${sec(dati.durata, 1)}: molto corto`);
    else R.ok(`Durata ${sec(dati.durata, 1)}, ${parole} parole (${ritmo.toFixed(1).replace('.', ',')} al secondo)`);

    const primaFrase = dati.parole.filter((p) => p.frase === 0);
    if (primaFrase.length > 14) R.avviso(`La prima frase ha ${primaFrase.length} parole`, 'L\'aggancio funziona meglio sotto le 12 parole.');
    else R.ok(`Aggancio: prima frase di ${primaFrase.length} parole, finisce a ${sec(primaFrase[primaFrase.length - 1].fine, 1)}`);

    const mancanti = dati.scene.map((s) => s.nome).filter((n) => !info.sceneCodice.includes(n));
    const inPiu = info.sceneCodice.filter((n) => !dati.scene.some((s) => s.nome === n));
    if (mancanti.length) R.errore(`Scene nel copione ma non in scene.tsx: ${mancanti.join(', ')}`);
    else R.ok(`Tutte le ${dati.scene.length} scene del copione hanno il loro codice`);
    if (inPiu.length) R.avviso(`Scene in scene.tsx che il copione non usa: ${inPiu.join(', ')}`);

    // ritmo visivo: quanto passa tra un aggancio e l'altro (segni e inizi di scena)
    const agganci = [...new Set([...Object.values(dati.segni), ...dati.scene.map((s) => s.inizio), dati.durata])].sort((a, b) => a - b);
    let buco = {lungo: 0, da: 0};
    for (let i = 1; i < agganci.length; i++) {
      if (agganci[i] - agganci[i - 1] > buco.lungo) buco = {lungo: agganci[i] - agganci[i - 1], da: agganci[i - 1]};
    }
    if (buco.lungo > 4.2) R.avviso(`${sec(buco.lungo, 1)} senza nessun segno a partire da ${sec(buco.da, 1)}`, 'Aggiungi un [segno] nel copione e un cambio sul palco: l\'occhio vuole una novità ogni 2-3 secondi.');
    else R.ok(`Ritmo: ${Object.keys(dati.segni).length} segni, mai più di ${sec(buco.lungo, 1)} senza un cambio`);

    const pagine = impagina(dati.parole, {maxParole: info.sottotitoli.maxParole, maxCaratteri: info.sottotitoli.maxCaratteri, maiuscolo: info.sottotitoli.maiuscolo, lingua: dati.lingua});
    const lampo = pagine.filter((p) => p.mostraA - p.mostraDa < 0.22);
    if (lampo.length) R.avviso(`${lampo.length} sottotitoli restano a schermo meno di 0,22 s`, lampo.slice(0, 3).map((p) => p.parole.map((w) => w.testo).join(' ')).join(' · '));
    else R.ok(`Sottotitoli: ${pagine.length} pagine, tutte leggibili`);

    // ───── fonti ─────
    R.sezione('Fonti');
    const fileFonti = path.join(reel.dir, 'fonti.md');
    if (!fs.existsSync(fileFonti)) {
      R.errore('Manca fonti.md', 'Ogni numero e ogni affermazione del copione deve avere una fonte controllabile.');
    } else {
      const testo = fs.readFileSync(fileFonti, 'utf8');
      const collegamenti = testo.match(/https?:\/\/[^\s)|>\]]+/g) ?? [];
      // conta solo le righe della tabella, non le istruzioni in cima al file
      const sospesi = testo.split('\n').filter((riga) => riga.trim().startsWith('|') && /DA VERIFICARE/i.test(riga)).length;
      // un testo dato già scritto: le fonti dei fatti le ha chi l'ha scritto. Senza indirizzi è un avviso, non un errore;
      // i numeri messi a schermo restano obbligati alla loro riga (controllo più sotto).
      if (!collegamenti.length && fs.existsSync(path.join(reel.dir, `testo${reel.suffisso}.txt`))) R.avviso('fonti.md non contiene nessun indirizzo web', 'Il testo è stato dato già scritto: i fatti restano di chi lo ha scritto. Prima di pubblicare, aggiungi in fonti.md da dove vengono.');
      else if (!collegamenti.length) R.errore('fonti.md non contiene nessun indirizzo web');
      else R.ok(`fonti.md: ${new Set(collegamenti).size} fonti con indirizzo`);
      if (sospesi) R.errore(`${sospesi} affermazioni segnate "DA VERIFICARE" in fonti.md`, 'Verificale o toglile dal copione prima di pubblicare.');
    }

    // ───── scene: errori e zone sicure ─────
    R.sezione('Scene');
    const campioni = new Set();
    for (let t = 0; t < dati.durata; t += 0.5) campioni.add(Math.min(totale - 1, Math.round(t * fps)));
    for (const t of Object.values(dati.segni)) campioni.add(Math.min(totale - 1, Math.round((t + 0.5) * fps)));
    const zone = info.zone;
    const fuori = new Map();
    const coperte = new Map();
    const sceneTre = new Set();
    const numeriVisti = new Map();
    // il corpo del narratore: il suo riquadro senza il margine vuoto di lato (a sinistra; a destra se è specchiato)
    const girato = info.impostazioni?.narratore?.specchia === true;
    const corpo = info.narratore
      ? {
          x: info.narratore.x + (girato ? 0 : info.narratore.larghezza * 0.14),
          y: info.narratore.y + info.narratore.altezza * 0.04,
          x2: info.narratore.x + info.narratore.larghezza * (girato ? 0.86 : 1),
          y2: info.narratore.y + info.narratore.altezza,
        }
      : null;
    let erroreScena = null;
    for (const n of [...campioni].sort((a, b) => a - b)) {
      const esito = await sessione.pagina.pagina.evaluate((f) => window.__fmlab.vai(f), n);
      if (esito && esito.errore) {
        erroreScena = {n, ...esito};
        break;
      }
      const {rettangoli, tre, scritte} = await sessione.pagina.pagina.evaluate(() => ({rettangoli: window.__fmlab.misura(), tre: window.__fmlab.tre(), scritte: window.__fmlab.scritte()}));
      // i numeri a schermo: conta una scritta vista ferma in almeno due fotogrammi (un conto che scorre cambia ogni volta)
      for (const sc of new Map(scritte.map((x) => [x.testo, x])).values()) {
        const gia = numeriVisti.get(sc.testo);
        if (gia) gia.volte++;
        else numeriVisti.set(sc.testo, {volte: 1, t: n / fps, scena: sc.scena});
      }
      for (const nome of tre) sceneTre.add(nome);
      // nel passaggio tra due scene quella vecchia viene attraversata dalla camera: per pochi fotogrammi le sue
      // scritte si ingrandiscono e sfilano via. Lì non conta dove finiscono: si controlla la scena che c'è adesso.
      const adesso = dati.scene.find((sc) => n / fps >= sc.inizio && n / fps < sc.fine)?.nome;
      for (const r of rettangoli) {
        if (r.zona !== 'sottotitoli' && r.scena && adesso && r.scena !== adesso) continue;
        if (corpo && r.zona !== 'sottotitoli') {
          const largo = Math.min(r.x + r.larghezza, corpo.x2) - Math.max(r.x, corpo.x);
          const alto = Math.min(r.y + r.altezza, corpo.y2) - Math.max(r.y, corpo.y);
          if (largo > 0 && alto > 0 && (largo * alto) / (r.larghezza * r.altezza) > 0.15) {
            const chiave = `${r.scena ?? ''}|${r.testo}`;
            if (!coperte.has(chiave)) coperte.set(chiave, {t: n / fps, r});
          }
        }
        const problemi = [];
        if (r.x < zone.sinistra - 1) problemi.push('esce a sinistra');
        if (r.x + r.larghezza > zone.destra + 1) problemi.push('esce a destra');
        if (r.y < zone.alto - 1) problemi.push('troppo in alto');
        if (r.y + r.altezza > zone.basso + 1) problemi.push('troppo in basso');
        if (r.x + r.larghezza > zone.icone.x && r.y + r.altezza > zone.icone.y) problemi.push('sotto le icone dell\'app');
        if (!problemi.length) continue;
        const chiave = `${r.zona}|${r.scena ?? ''}|${r.testo}|${problemi.join(', ')}`;
        if (!fuori.has(chiave)) fuori.set(chiave, {t: n / fps, r, problemi});
      }
    }
    if (erroreScena) R.errore(`Errore nella scena${erroreScena.scena ? ` "${erroreScena.scena}"` : ''} a ${sec(erroreScena.n / fps)}`, erroreScena.errore);
    else R.ok(`Nessun errore in ${campioni.size} fotogrammi controllati lungo tutto il reel`);
    if (fuori.size) {
      for (const {t, r, problemi} of [...fuori.values()].slice(0, 8)) {
        R.avviso(`Scritta fuori dalle zone sicure a ${sec(t, 1)}: "${r.testo}"`, `${problemi.join(', ')}${r.scena ? ` · scena ${r.scena}` : ''}. Controlla con: npm run foto ${slug} ${t.toFixed(1)} guide`);
      }
      if (fuori.size > 8) R.avviso(`…e altre ${fuori.size - 8} scritte fuori zona`);
    } else if (!erroreScena) {
      R.ok('Sottotitoli e scritte restano dentro le zone sicure');
    }
    if (coperte.size) {
      for (const {t, r} of [...coperte.values()].slice(0, 6)) {
        R.avviso(`Scritta coperta dal narratore a ${sec(t, 1)}: "${r.testo}"`, `Spostala, oppure rimpicciolisci il narratore: npm run imposta ${slug} grandezza=…${r.scena ? ` · scena ${r.scena}` : ''}`);
      }
    } else if (corpo && !erroreScena) {
      R.ok(`Il narratore (${info.impostazioni.narratore.chi}, ${info.impostazioni.narratore.grandezza}%) non copre nessuna scritta`);
    } else if (!corpo) {
      R.ok('Reel senza narratore');
    }
    // specchiato con una scritta addosso che non è stata preparata: si legge al contrario
    const scelto = info.impostazioni?.narratore;
    for (const avviso of avvisiNarratore(scelto)) R.avviso(avviso.split(':')[0], `${avviso.split(': ').slice(1).join(': ')}:  npm run imposta ${slug} specchia=si`);
    if (corpo && scelto?.specchia) {
      const {leggiPersonaggi} = await import('./personaggio.mjs');
      const chi = leggiPersonaggi()[scelto.chi];
      if (chi?.tipo === 'pupazzo' && chi.specchiabile === false && !chi.specchio) {
        R.avviso(`Il narratore "${scelto.chi}" è specchiato ma ha una scritta addosso: si legge al contrario`, `Prepara il pezzo che la tiene dritta: npm run personaggio scritta ${scelto.chi} <x1,y1> <x2,y2>   (oppure: npm run imposta ${slug} specchia=no)`);
      }
    }
    // lo stile scelto (2D / 3D) è quello che si vede davvero?
    const stileScelto = info.impostazioni?.stile ?? 'auto';
    const conTre = [...sceneTre].filter(Boolean);
    if (stileScelto === '3d') {
      if (conTre.length) R.ok(`Stile 3D: oggetti con volume in ${conTre.length} ${conTre.length === 1 ? 'scena' : 'scene'} su ${dati.scene.length} (${conTre.join(', ')})`);
      else R.avviso('Lo stile scelto è 3D ma nessuna scena usa oggetti 3D', 'Costruisci l\'oggetto protagonista con <Scena3D> (vedi FMLAB_AVVIA.md, capitolo "2D o 3D"), oppure cambia stile: npm run imposta ' + slug + ' stile=2d');
    } else if (stileScelto === '2d') {
      if (conTre.length) R.avviso(`Lo stile scelto è 2D ma ci sono oggetti 3D in: ${conTre.join(', ')}`, `Togli gli oggetti 3D oppure cambia stile: npm run imposta ${slug} stile=3d`);
      else R.ok('Stile 2D: nessun oggetto 3D, come scelto');
    } else {
      R.avviso(`Stile ancora su "auto"${conTre.length ? ` (di fatto 3D: ${conTre.join(', ')})` : ' (di fatto 2D)'}`, `Fissalo, così resta scritto: npm run imposta ${slug} stile=${conTre.length ? '3d' : '2d'}`);
    }
    // ogni numero mostrato ha la sua riga in fonti.md?
    if (fs.existsSync(fileFonti) && !erroreScena) {
      const fermi = [...numeriVisti.entries()].filter(([, v]) => v.volte >= 2);
      const mancanti = numeriSenzaFonte(fermi.map(([testo]) => testo), fs.readFileSync(fileFonti, 'utf8'));
      if (mancanti.length) {
        const dove = (m) => {
          const v = numeriVisti.get(m.testo);
          return `"${m.testo}"${v?.scena ? `, scena ${v.scena}` : ''} a ${sec(v?.t ?? 0, 1)}`;
        };
        R.errore(`${mancanti.length} ${mancanti.length === 1 ? 'numero a schermo' : 'numeri a schermo'} senza riga in fonti.md: ${mancanti.slice(0, 6).map(dove).join(' · ')}${mancanti.length > 6 ? ` · e altri ${mancanti.length - 6}` : ''}`, 'Ogni numero mostrato deve avere la sua riga in fonti.md, scritto come compare a schermo (anche se è arrotondato o calcolato: spiegalo sotto "Calcoli"). Oppure toglilo dalla scena.');
      } else {
        R.ok(`Numeri a schermo: ${fermi.length} scritte con numeri, tutti presenti in fonti.md`);
      }
    }
    const avvisiBrowser = [...new Set(sessione.pagina.errori)];
    if (avvisiBrowser.length) R.avviso('Messaggi dal browser', avvisiBrowser.slice(0, 5).join(' · '));

    // ───── video ─────
    R.sezione('Video');
    if (!fs.existsSync(reel.video)) {
      R.avviso(`Il video ${rel(reel.video)} non esiste ancora`, `Crealo con: npm run render ${slug}${reel.variante ? ' ' + reel.variante : ''}`);
    } else {
      const ff = await trovaFfmpeg();
      const media = infoMedia(ff, reel.video);
      const v = media.video;
      if (!v) R.errore('Il file non contiene una traccia video');
      else {
        if (v.larghezza === 1080 && v.altezza === 1920) R.ok('Formato 1080x1920 (verticale 9:16)');
        else R.errore(`Formato ${v.larghezza}x${v.altezza} invece di 1080x1920`);
        if (v.codec === 'h264' && /yuv420p/.test(v.pixel ?? '')) R.ok(`Codifica H.264 ${v.pixel}, ${v.fps} fotogrammi al secondo`);
        else R.avviso(`Codifica insolita: ${v.codec} ${v.pixel}`);
        const traccia = misuraTraccia(ff, reel.video, 'v');
        if (traccia?.fotogrammi === totale) R.ok(`${totale} fotogrammi: tanti quanti ne prevede il copione (${sec(dati.durata)})`);
        else R.errore(`Il video ha ${traccia?.fotogrammi ?? '?'} fotogrammi, ne servono ${totale}`, 'Rifai il render.');
      }
      if (media.audio) {
        const a = misuraTraccia(ff, reel.video, 'a');
        if (dati.voce && a?.durata !== null && a.durata < dati.durataVoce - 0.15) R.errore(`L'audio dura ${sec(a.durata)}, la voce ${sec(dati.durataVoce)}`);
        else R.ok(`Audio ${media.audio.codec} ${media.audio.hz} Hz, ${fraseAudio({voce: Boolean(dati.voce), effetti: (dati.suoni ?? []).length, musica: Boolean(trovaMusica(reel.dir)) && leggiImpostazioni(slug).musica > 0})}`);
      } else {
        R.avviso('Il video non ha traccia audio');
      }
      const dataVideo = fs.statSync(reel.video).mtimeMs;
      const piuNuovi = [reel.parole, reel.scene, reel.copione, path.join(reel.dir, 'impostazioni.json')].filter((f) => fs.existsSync(f) && fs.statSync(f).mtimeMs > dataVideo + 1000);
      if (piuNuovi.length) R.avviso('Il video è più vecchio delle ultime modifiche', `Cambiati dopo il render: ${piuNuovi.map(rel).join(', ')}`);

      // il video mostra davvero ciò che le scene disegnano in quegli istanti?
      if (v && v.larghezza === 1080 && !erroreScena) {
        const prove = [...new Set([0, Math.floor(totale / 4), Math.floor(totale / 2) - 1, Math.floor(totale / 2), Math.floor((totale * 3) / 4), totale - 1, ...Object.values(dati.segni).slice(0, 4).map((t) => Math.min(totale - 1, Math.round((t + 0.4) * fps)))])];
        let peggiore = {diff: 0, n: 0};
        let saltate = 0;
        for (const n of prove) {
          const dalVideo = pixelDalVideo(ff, reel.video, n, fps);
          await sessione.pagina.vai(n);
          const dallaScena = pixelDaPng(ff, await sessione.pagina.png());
          if (!dalVideo || !dallaScena) {
            saltate++;
            continue;
          }
          const d = differenza(dalVideo, dallaScena);
          if (d > peggiore.diff) peggiore = {diff: d, n};
        }
        const percento = ((peggiore.diff / 255) * 100).toFixed(1).replace('.', ',');
        if (saltate === prove.length) R.avviso('Non sono riuscito a estrarre fotogrammi dal video per il confronto');
        else if (peggiore.diff > 8) R.errore(`Il video non coincide con le scene (differenza ${percento}% al fotogramma ${peggiore.n})`, 'Il video è stato fatto con una versione diversa di scene o tempi: rifai il render.');
        else R.ok(`Sincronia: ${prove.length - saltate} fotogrammi del video confrontati con le scene, differenza massima ${percento}%`);
      }
    }
  } finally {
    await sessione.chiudi();
  }

  // ───── rapporto ─────
  const conta = (e) => R.righe.filter((r) => r.esito === e).length;
  const errori = conta(ERRORE);
  const avvisi = conta(AVVISO);
  const giudizio = errori ? `NON PRONTO: ${errori} ${errori === 1 ? 'errore' : 'errori'} da correggere` : avvisi ? `OK con ${avvisi} ${avvisi === 1 ? 'avviso' : 'avvisi'}` : 'TUTTO OK';
  const console_ = [`\nVerifica di "${reel.nome}" — ${giudizio}\n`];
  const md = [`# Verifica · ${reel.nome}`, '', `Eseguita il ${new Date().toISOString().slice(0, 16).replace('T', ' alle ')} UTC con \`npm run verifica ${slug}${reel.variante ? ' ' + reel.variante : ''}\`.`, '', `**Esito: ${giudizio}**`, ''];
  for (const r of R.righe) {
    if (r.sezione) {
      console_.push(`  ${r.sezione}`);
      md.push(`## ${r.sezione}`, '');
      continue;
    }
    console_.push(`    ${r.esito} ${r.titolo}${r.dettaglio ? `\n        ${r.dettaglio}` : ''}`);
    md.push(`- ${r.esito} ${r.titolo}${r.dettaglio ? `  \n  ${r.dettaglio}` : ''}`);
  }
  md.push('', '---', 'Come rifare il controllo a mano: apri il video, fermalo sulle parole chiave del copione e guarda che sul palco ci sia', 'la cosa di cui si parla; apri `fonti.md` e segui i collegamenti per ogni numero pronunciato.', '');
  const fileRapporto = path.join(reel.dir, `verifica${reel.suffisso}.md`);
  fs.writeFileSync(fileRapporto, md.join('\n'));
  console.log(console_.join('\n'));
  console.log(`\nRapporto salvato in ${rel(fileRapporto)}`);
  if (errori) process.exitCode = 1;
  return {errori, avvisi};
}
