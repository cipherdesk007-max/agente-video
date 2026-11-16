// FMLAB Reel Kit — legge copione.md e ne ricava parole, segni, scene e tempi.
//
// Sintassi del copione:
//   [scena:nome]   apre una scena: vale dalla parola che segue
//   [nome]         segno: marca l'istante in cui viene pronunciata la parola che segue
//                  (scritto dentro una parola, come dell'[nome]azienda, vale per quella parola)
//   *parole*       enfasi: nei sottotitoli finiscono nel riquadro
//   Le righe che iniziano con # o > e i commenti <!-- … --> non vengono pronunciati.
//   \[ \] \* \# \> \< \\   una barra rovesciata davanti a uno di questi caratteri lo fa leggere come testo
import crypto from 'node:crypto';
import {ErroreFmlab} from './percorsi.mjs';

const NOME = /^[a-z0-9][a-z0-9_-]*$/i;

// I caratteri che nel copione sono comandi. Con una barra rovesciata davanti restano testo: durante la lettura
// vengono messi da parte (in caratteri che nessuno scrive) e rimessi al loro posto nelle parole.
const COMANDI = '[]*#><\\';
const DA_PARTE = (c) => String.fromCharCode(0xe000 + COMANDI.indexOf(c));
const RIMETTI = (t) => t.replace(/[\ue000-\ue006]/g, (c) => COMANDI[c.charCodeAt(0) - 0xe000]);

export function leggiCopione(testo) {
  let pulito = String(testo)
    .replace(/[\ue000-\ue006]/g, '')
    .replace(/\\([[\]*#><\\])/g, (_, c) => DA_PARTE(c))
    .replace(/<!--[\s\S]*?-->/g, ' ');
  pulito = pulito
    .split(/\r?\n/)
    .filter((riga) => !/^\s*(#|>)/.test(riga))
    .join('\n');

  const parole = [];
  const segni = {};
  const scene = [];
  const suoni = [];
  const inAttesa = [];
  let enfasi = false;
  let attaccato = false; // true se l'ultimo pezzo di testo non è stato seguito da spazi

  const pezzi = pulito.matchAll(/\[([^\]\n]*)\]|(\*)|(\s+)|([^\s[*]+)/g);
  for (const m of pezzi) {
    if (m[1] !== undefined) {
      const nome = m[1].trim();
      if (nome.toLowerCase().startsWith('scena:')) {
        const n = nome.slice(6).trim();
        if (!NOME.test(n)) throw new ErroreFmlab(`Copione: nome di scena non valido "[${nome}]". Usa lettere, numeri e trattini, es. [scena:apertura].`);
        if (scene.some((s) => s.nome === n)) throw new ErroreFmlab(`Copione: la scena "${n}" compare due volte.`);
        inAttesa.push({tipo: 'scena', nome: n});
      } else if (nome.toLowerCase().startsWith('suono:')) {
        // un effetto sonoro che parte sulla parola che segue: [suono:pop]
        const n = nome.slice(6).trim().toLowerCase();
        if (!NOME.test(n)) throw new ErroreFmlab(`Copione: nome di suono non valido "[${nome}]". Usa una parola sola, es. [suono:pop].`);
        inAttesa.push({tipo: 'suono', nome: n});
      } else {
        if (!NOME.test(nome)) throw new ErroreFmlab(`Copione: segno non valido "[${nome}]". Usa una parola sola, es. [km].`);
        if (segni[nome] !== undefined || inAttesa.some((a) => a.tipo === 'segno' && a.nome === nome)) {
          throw new ErroreFmlab(`Copione: il segno [${nome}] compare due volte. Ogni segno deve avere un nome diverso.`);
        }
        inAttesa.push({tipo: 'segno', nome});
      }
    } else if (m[2] !== undefined) {
      enfasi = !enfasi;
    } else if (m[3] !== undefined) {
      attaccato = false;
    } else {
      const testoPezzo = m[4];
      if (attaccato && parole.length) {
        // prosegue la parola precedente (es. punteggiatura dopo un asterisco di chiusura)
        const ultima = parole[parole.length - 1];
        const lettere = /[\p{L}\p{N}]/u.test(testoPezzo);
        ultima.testo += testoPezzo;
        if (enfasi && lettere) ultima.enfasi = true;
        // un segno scritto dentro una parola (dell'[azienda]azienda) vale per quella parola, non per la successiva
        if (lettere) {
          for (const a of inAttesa.splice(0)) {
            if (a.tipo === 'scena') scene.push({nome: a.nome, indice: parole.length - 1});
            else if (a.tipo === 'suono') suoni.push({nome: a.nome, indice: parole.length - 1});
            else segni[a.nome] = parole.length - 1;
          }
        }
      } else if (!/[\p{L}\p{N}]/u.test(testoPezzo) && parole.length) {
        // punteggiatura isolata (es. un trattino): si attacca alla parola prima
        parole[parole.length - 1].testo += testoPezzo;
      } else {
        parole.push({testo: testoPezzo, enfasi});
        const indice = parole.length - 1;
        for (const a of inAttesa.splice(0)) {
          if (a.tipo === 'scena') scene.push({nome: a.nome, indice});
          else if (a.tipo === 'suono') suoni.push({nome: a.nome, indice});
          else segni[a.nome] = indice;
        }
      }
      attaccato = true;
    }
  }

  if (!parole.length) throw new ErroreFmlab('Il copione è vuoto: scrivi il testo da pronunciare in copione.md.');
  if (enfasi) throw new ErroreFmlab('Copione: c\'è un asterisco * aperto e mai chiuso.');
  if (inAttesa.length) {
    const a = inAttesa[0];
    throw new ErroreFmlab(`Copione: dopo [${a.tipo === 'scena' ? 'scena:' : a.tipo === 'suono' ? 'suono:' : ''}${a.nome}] non c'è nessuna parola.`);
  }
  if (!scene.length) scene.push({nome: 'unica', indice: 0});
  scene[0].indice = 0;
  for (const p of parole) p.testo = RIMETTI(p.testo);

  let frase = 0;
  for (const p of parole) {
    p.frase = frase;
    if (/[.!?…]["”»)]*$/.test(p.testo)) frase++;
  }

  const testoParlato = parole.map((p) => p.testo).join(' ');
  const impronta = crypto.createHash('sha1').update(testoParlato).digest('hex').slice(0, 12);
  return {parole, segni, scene, suoni, testoParlato, impronta};
}

/** Sillabe (approssimate) di una parola italiana: servono per stimare quanto dura. */
export function sillabe(testo) {
  const t = String(testo).toLowerCase();
  const gruppi = t.match(/[aeiouyàèéìíòóùú]+/g);
  if (gruppi) return gruppi.length;
  const lettere = t.replace(/[^a-z0-9]/g, '').length;
  return Math.max(1, Math.round(lettere * 1.4)); // sigle: si pronunciano lettera per lettera
}

export function pausaDopo(testo) {
  if (/…["”»)]*$/.test(testo)) return 0.45;
  if (/[.!?]["”»)]*$/.test(testo)) return 0.38;
  if (/[;:]$/.test(testo)) return 0.24;
  if (/,$/.test(testo)) return 0.14;
  return 0;
}

/** Durata "a peso" di una parola: usata per stimare e per dividere il tempo di una frase. */
export function pesoParola(testo) {
  return 0.055 + 0.148 * sillabe(testo);
}

/** Tempi stimati senza voce: ~5,5 sillabe al secondo, pause sulla punteggiatura. */
export function stimaTempi(parole, {ritmo = 1, inizio = 0.25} = {}) {
  let t = inizio;
  return parole.map((p) => {
    const d = pesoParola(p.testo) / ritmo;
    const voce = {inizio: t, fine: t + d};
    t += d + pausaDopo(p.testo) / ritmo;
    return voce;
  });
}

const arrotonda = (x) => Math.round(x * 1000) / 1000;

/**
 * Mette insieme tutto quello che serve al render: parole con i tempi, segni in secondi, scene.
 * @param {ReturnType<typeof leggiCopione>} copione
 * @param {{inizio:number, fine:number}[]} tempi  un elemento per parola
 */
export function componiDati(copione, tempi, {motore, precisione, voce = null, durataAudio = null, coda = 1.4, fps = 30, lingua = 'it'} = {}) {
  if (tempi.length !== copione.parole.length) {
    throw new ErroreFmlab(`Tempi e parole non coincidono (${tempi.length} tempi per ${copione.parole.length} parole).`);
  }
  let precedente = 0;
  const parole = copione.parole.map((p, i) => {
    const inizio = Math.max(precedente, tempi[i].inizio);
    const fine = Math.max(inizio + 0.04, tempi[i].fine);
    precedente = inizio;
    return {testo: p.testo, inizio: arrotonda(inizio), fine: arrotonda(fine), frase: p.frase, ...(p.enfasi ? {enfasi: true} : {})};
  });
  // una parola non può finire dopo l'inizio della successiva
  for (let i = 0; i < parole.length - 1; i++) {
    if (parole[i].fine > parole[i + 1].inizio) parole[i].fine = Math.max(parole[i].inizio + 0.02, parole[i + 1].inizio);
  }
  const fineVoce = parole[parole.length - 1].fine;
  const durataVoce = Math.max(fineVoce, durataAudio ?? 0);
  const durata = Math.ceil((fineVoce + coda) * fps) / fps;

  const segni = {};
  for (const [nome, indice] of Object.entries(copione.segni)) segni[nome] = parole[indice].inizio;

  const ANTICIPO = 0.18; // la scena parte un attimo prima della sua prima parola
  const scene = copione.scene.map((s, k) => {
    let inizio = 0;
    if (k > 0) {
      const primaParola = parole[s.indice];
      const parolaPrima = parole[s.indice - 1];
      inizio = Math.max(parolaPrima.fine - 0.02, primaParola.inizio - ANTICIPO);
    }
    return {nome: s.nome, inizio: arrotonda(inizio), fine: 0};
  });
  scene.forEach((s, k) => {
    s.fine = k < scene.length - 1 ? scene[k + 1].inizio : arrotonda(durata);
  });

  return {
    versione: 1,
    lingua,
    motore,
    precisione,
    voce,
    durataVoce: arrotonda(durataVoce),
    coda,
    durata: arrotonda(durata),
    fps,
    impronta: copione.impronta,
    scene,
    segni,
    // gli effetti sonori chiesti nel copione, con l'istante della loro parola (la voce c'è solo se ce ne sono)
    ...((copione.suoni ?? []).length ? {suoni: copione.suoni.map((s) => ({nome: s.nome, t: parole[s.indice].inizio}))} : {}),
    parole,
  };
}

/**
 * Stesso testo, ma nel copione sono cambiati segni, scene o enfasi: i tempi delle parole restano buoni,
 * quindi basta rifare gli agganci. Niente voce da rigenerare, niente crediti.
 * Restituisce i dati aggiornati, oppure null se non c'è niente da cambiare (o se è cambiato il testo:
 * in quel caso serve davvero  npm run voce).
 */
export function riallinea(copione, dati) {
  if (!dati || !Array.isArray(dati.parole) || dati.impronta !== copione.impronta || dati.parole.length !== copione.parole.length) return null;
  const nuovi = componiDati(
    copione,
    dati.parole.map((p) => ({inizio: p.inizio, fine: p.fine})),
    {motore: dati.motore, precisione: dati.precisione, voce: dati.voce ?? null, durataAudio: dati.durataVoce ?? null, coda: dati.coda ?? 1.4, fps: dati.fps ?? 30, lingua: dati.lingua ?? 'it'}
  );
  const parole = dati.parole.map((p, i) => {
    const {enfasi: _prima, ...resto} = p;
    return {...resto, frase: copione.parole[i].frase, ...(copione.parole[i].enfasi ? {enfasi: true} : {})};
  });
  const ordinati = (o) => JSON.stringify(Object.entries(o ?? {}).sort(([x], [y]) => (x < y ? -1 : 1)));
  const uguali =
    ordinati(nuovi.segni) === ordinati(dati.segni) &&
    JSON.stringify(nuovi.scene) === JSON.stringify(dati.scene) &&
    JSON.stringify(nuovi.suoni ?? []) === JSON.stringify(dati.suoni ?? []) &&
    parole.every((p, i) => Boolean(p.enfasi) === Boolean(dati.parole[i].enfasi) && p.frase === dati.parole[i].frase);
  if (uguali) return null;
  // stesso ordine dei campi di componiDati: così il file cambia solo dove cambia davvero
  const {suoni: _vecchi, parole: _prima, scene: _scene, segni: _segni, ...senza} = dati;
  return {...senza, scene: nuovi.scene, segni: nuovi.segni, ...(nuovi.suoni ? {suoni: nuovi.suoni} : {}), parole};
}

/**
 * Dai tempi carattere per carattere (ElevenLabs) ai tempi parola per parola.
 * @param {string} testoParlato  il testo inviato
 * @param {{characters:string[], character_start_times_seconds:number[], character_end_times_seconds:number[]}} allineamento
 */
export function tempiDaCaratteri(testoParlato, allineamento) {
  const c = allineamento?.characters;
  const inizi = allineamento?.character_start_times_seconds;
  const fini = allineamento?.character_end_times_seconds;
  if (!Array.isArray(c) || !Array.isArray(inizi) || !Array.isArray(fini) || c.length !== inizi.length || c.length !== fini.length) {
    throw new ErroreFmlab('La risposta di ElevenLabs non contiene i tempi dei caratteri (campo "alignment").');
  }
  // ricostruisce le parole dai caratteri: ogni gruppo senza spazi è una parola
  const trovate = [];
  let corrente = null;
  for (let i = 0; i < c.length; i++) {
    if (/^\s*$/.test(c[i])) {
      corrente = null;
      continue;
    }
    if (!corrente) {
      corrente = {testo: '', inizio: inizi[i], fine: fini[i]};
      trovate.push(corrente);
    }
    corrente.testo += c[i];
    corrente.fine = fini[i];
  }
  const attese = testoParlato.split(' ');
  if (trovate.length !== attese.length) {
    throw new ErroreFmlab(
      `ElevenLabs ha restituito ${trovate.length} parole, il copione ne ha ${attese.length}. ` +
        'Di solito succede con simboli o numeri in cifre: scrivi i numeri in lettere nel copione e riprova.'
    );
  }
  return trovate.map((p) => ({inizio: p.inizio, fine: p.fine}));
}

// ───────────────────────── il testo dato da una persona ─────────────────────────

/** Scrive un testo qualsiasi in modo che il copione lo legga com'è: nessun carattere diventa un comando. */
export function proteggi(testo) {
  return String(testo)
    .replace(/[-]/g, '')
    .replace(/[\\[\]*]/g, '\\$&')
    .replace(/^(\s*)([#>])/gm, '$1\\$2')
    .replace(/<!--/g, '\\<!--');
}

/**
 * Il copione di partenza per un testo già scritto: una scena sola, nessun segno, il testo parola per parola.
 * Chi lavora al reel aggiunge solo [scena:…], [segni], *enfasi* e [suono:…].
 */
export function copioneDaTesto(testo, {titolo = '', lingua = 'it', scena = 'testo'} = {}) {
  const corpo = proteggi(String(testo).replace(/\r\n?/g, '\n').trim());
  return [
    `<!-- lingua: ${lingua} -->`,
    `# ${String(titolo).replace(/\s+/g, ' ').trim()}`,
    '',
    '> Il testo qui sotto è quello dato: va pronunciato parola per parola (la copia intatta è in testo.txt).',
    '> Si aggiungono solo: [scena:nome] · [segno] davanti a una parola · *parola* per l\'enfasi · [suono:nome].',
    '> Una barra rovesciata davanti a [ ] * # > vuol dire "questo è testo, non un comando": lasciala dov\'è.',
    '',
    `[scena:${scena}]`,
    corpo,
    '',
  ].join('\n');
}

/**
 * Confronta il testo dato con quello che il copione fa pronunciare, senza contare spazi e a capo.
 * Restituisce null se sono uguali, altrimenti la prima differenza: {parola, atteso, trovato} (parola conta da 1).
 */
export function confrontaTesto(dato, parlato) {
  const a = String(dato).split(/\s+/).filter(Boolean);
  const b = String(parlato).split(/\s+/).filter(Boolean);
  if (a.join('') === b.join('')) return null;
  // la punteggiatura isolata si attacca alla parola prima: si confronta carattere per carattere, e si risale alla parola
  const x = a.join('');
  const y = b.join('');
  let k = 0;
  while (k < x.length && k < y.length && x[k] === y[k]) k++;
  const parolaA = (elenco, posizione) => {
    let fatti = 0;
    for (let i = 0; i < elenco.length; i++) {
      fatti += elenco[i].length;
      if (posizione < fatti) return {indice: i, testo: elenco[i]};
    }
    return {indice: elenco.length, testo: ''};
  };
  const pa = parolaA(a, k);
  const pb = parolaA(b, k);
  return {parola: pa.indice + 1, atteso: pa.testo || '(fine del testo)', trovato: pb.testo || '(fine del testo)'};
}
