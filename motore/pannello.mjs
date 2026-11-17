// FMLAB Reel Kit — il pannello: una pagina nel browser (anche dal telefono) per
//   · scrivere la richiesta di un nuovo reel e scegliere narratore, grandezza, lato, stile 2D/3D
//   · cambiare le stesse scelte ai reel che esistono già
//   · lanciare voce, provini, video e verifica, e guardare l'anteprima con l'audio
//
//   npm run pannello          solo su questo computer
//   npm run pannello rete     anche dal telefono, sulla stessa rete Wi-Fi
//
// Si entra con un codice che compare nel Terminale: chi non lo ha non vede niente e non può lanciare niente.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {CARTELLA_REELS, ErroreFmlab, RADICE, elencoReel, leggiJson, rel, slugValido} from './percorsi.mjs';
import {altreLingue, linguaDelCopione} from './reel.mjs';
import {avviaServer} from './server.mjs';
import {rotteAnteprima} from './anteprima.mjs';
import {leggiPersonaggi} from './personaggio.mjs';
import {GRANDEZZA, MANO2, STILI, impostazioniKit, leggiImpostazioni, scriviImpostazioni, sistema} from './impostazioni.mjs';
import {trovaMusica} from './render.mjs';
import {creaReel, elencoModelli, nomeDaTitolo, nomeLibero} from './nuovo.mjs';
import {DESCRIZIONI_STILE, suggerisciStile} from './comune/stile.mjs';
import {assaggioVoceMac, elencoVociElevenLabs, elencoVociMac} from './voce.mjs';
import {leggiCopione} from './copione.mjs';
import {DURATA, PAROLE_AL_SECONDO, TOLLERANZA, durataMinima, paroleMassime} from './durata.mjs';
import {comandoVoce} from './voce.mjs';
import {CACHE} from './percorsi.mjs';

const BISCOTTO = 'fmlab_chiave';
const LINGUE = {it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese', de: 'tedesco', pt: 'portoghese', nl: 'olandese', pl: 'polacco', tr: 'turco', ru: 'russo', ja: 'giapponese', zh: 'cinese', ko: 'coreano'};

function nuovaChiave() {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(8), (b) => alfabeto[b % alfabeto.length]).join('');
}

function uguali(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function json(res, codice, dati) {
  const corpo = JSON.stringify(dati);
  res.writeHead(codice, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(corpo)});
  res.end(corpo);
}

function leggiCorpo(req, limite = 200_000) {
  return new Promise((ok, ko) => {
    const pezzi = [];
    let peso = 0;
    req.on('data', (p) => {
      peso += p.length;
      if (peso > limite) {
        ko(new ErroreFmlab('Richiesta troppo lunga.'));
        req.destroy();
      } else pezzi.push(p);
    });
    req.on('end', () => {
      try {
        ok(pezzi.length ? JSON.parse(Buffer.concat(pezzi).toString('utf8')) : {});
      } catch {
        ko(new ErroreFmlab('Richiesta non leggibile.'));
      }
    });
    req.on('error', ko);
  });
}

const locale = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');

// ───────────────────────── stato dei reel ─────────────────────────

function statoFile(file) {
  try {
    const s = fs.statSync(file);
    return {indirizzo: '/' + rel(file), quando: s.mtimeMs, peso: s.size};
  } catch {
    return null;
  }
}

function statoReel(slug, personaggi) {
  const dir = path.join(CARTELLA_REELS, slug);
  const copione = fs.readFileSync(path.join(dir, 'copione.md'), 'utf8');
  const base = linguaDelCopione(copione);
  const titolo = /^#\s+(.+)$/m.exec(copione)?.[1]?.trim() ?? slug;
  const versioni = [base, ...altreLingue(slug)].map((lingua) => {
    const suffisso = lingua === base ? '' : `.${lingua}`;
    let dati = null;
    try {
      dati = leggiJson(path.join(dir, `parole${suffisso}.json`));
    } catch {
      // voce non ancora generata per questa lingua
    }
    let verifica = null;
    try {
      const testo = fs.readFileSync(path.join(dir, `verifica${suffisso}.md`), 'utf8');
      verifica = {esito: /\*\*Esito: (.+?)\*\*/.exec(testo)?.[1] ?? '?', ...statoFile(path.join(dir, `verifica${suffisso}.md`))};
    } catch {
      // mai verificato
    }
    return {
      lingua,
      nomeLingua: LINGUE[lingua] ?? lingua,
      parole: dati?.parole?.length ?? 0,
      durata: dati?.durata ?? 0,
      motore: dati?.motore ?? null,
      conAudio: Boolean(dati?.voce && fs.existsSync(path.join(dir, dati.voce))),
      video: statoFile(path.join(dir, `${slug}${suffisso}.mp4`)),
      bozza: statoFile(path.join(dir, `${slug}${suffisso}.bozza.mp4`)),
      provini: statoFile(path.join(dir, `provini${suffisso}.jpg`)),
      verifica,
      anteprima: `/r/${slug}${suffisso}`,
    };
  });
  let impostazioni = null;
  let erroreImpostazioni = null;
  try {
    impostazioni = leggiImpostazioni(slug, personaggi);
  } catch (e) {
    erroreImpostazioni = e.message;
  }
  const musica = trovaMusica(dir);
  return {slug, titolo, versioni, impostazioni, erroreImpostazioni, testoDato: fs.existsSync(path.join(dir, 'testo.txt')), musica: musica ? rel(musica) : null, richiesta: statoFile(path.join(dir, 'richiesta.md')), modificato: fs.statSync(path.join(dir, 'copione.md')).mtimeMs};
}

function elencoPersonaggi(personaggi) {
  return Object.values(personaggi).filter((p) => !p.figuraDi).map((p) => ({
    id: p.id,
    nome: p.nome ?? p.id,
    tipo: p.tipo,
    video: p.video,
    proporzione: p.tipo === 'pupazzo' ? p.misure[0] / p.misure[1] : 560 / 760,
    specchiabile: p.specchiabile !== false || !!p.specchio,
    scritteDritte: !!p.specchio,
    // gli stati della seconda mano, per chi ha anche l'altro avambraccio su un livello suo
    seconde: p.tipo === 'pupazzo' && p.ossa?.braccio2 && p.pose2 && p.corpo ? Object.keys(p.pose2) : [],
    immagine: fs.existsSync(path.join(RADICE, 'personaggi', p.id, 'anteprima.png')) ? `/personaggi/${p.id}/anteprima.png` : p.tipo === 'pupazzo' ? `/personaggi/${p.id}/${p.immagine}` : null,
  }));
}

/** I prompt pronti di PROMPT.md: titolo, una riga di spiegazione, il testo da incollare. */
export function leggiPrompt(file = path.join(RADICE, 'PROMPT.md')) {
  if (!fs.existsSync(file)) return [];
  const esito = [];
  for (const pezzo of fs.readFileSync(file, 'utf8').split(/^## /m).slice(1)) {
    const titolo = pezzo.split('\n')[0].trim();
    const blocco = /```[a-z]*\n([\s\S]*?)```/.exec(pezzo);
    if (!titolo || !blocco) continue;
    const nota = pezzo.slice(titolo.length, blocco.index).trim().split('\n')[0] ?? '';
    esito.push({titolo, nota, testo: blocco[1].trim()});
  }
  return esito;
}

// ───────────────────────── richiesta per l'agente ─────────────────────────

/** Un titolo corto ricavato dalla richiesta: la prima frase, fermandosi al primo segno forte. */
export function titoloDaRichiesta(richiesta) {
  const prima = String(richiesta).trim().split(/[.:;!?\n—–]/)[0].trim();
  if (prima.length <= 64) return prima || 'Nuovo reel';
  const parole = prima.split(/\s+/);
  let titolo = '';
  for (const p of parole) {
    if ((titolo + ' ' + p).length > 60) break;
    titolo = titolo ? `${titolo} ${p}` : p;
  }
  return titolo.replace(/[,]+$/, '');
}

export function fraseAgente(slug) {
  return `Leggi SCHEDA.md e realizza il reel "${slug}" seguendo reels/${slug}/richiesta.md, fino al video finale e alla verifica.`;
}

/**
 * Il testo dato sta nella durata chiesta? Detto prima di generare qualsiasi voce (regola fissa).
 * Conta a 200 parole al minuto; la voce si può velocizzare fino a 1,4.
 */
export function avvisoDurata(parole, durata, coda = 1.4) {
  const naturale = Math.round(parole / PAROLE_AL_SECONDO + coda);
  if (parole > paroleMassime(durata, coda)) {
    return {entra: false, naturale, testo: `Il testo ha ${parole} parole: a voce normale dura circa ${naturale} secondi. In ${durata} secondi ne entrano al massimo ${paroleMassime(durata, coda)}, anche velocizzando la voce. Togli almeno ${parole - paroleMassime(durata, coda)} parole oppure scegli almeno ${durataMinima(parole, coda)} secondi: il kit non taglia il testo.`};
  }
  if (naturale < durata - TOLLERANZA) {
    const mancano = Math.ceil((durata - TOLLERANZA - coda) * PAROLE_AL_SECONDO) - parole;
    return {entra: false, naturale, testo: `Il testo ha ${parole} parole: a voce normale dura circa ${naturale} secondi, più corto dei ${durata} chiesti di oltre 5 secondi. La voce non si rallenta: scegli ${Math.max(DURATA.min, Math.round(naturale / 5) * 5)} secondi, oppure aggiungi circa ${mancano} parole.`};
  }
  return {entra: true, naturale, testo: naturale > durata + TOLLERANZA ? `${parole} parole: a voce normale circa ${naturale} secondi. Per stare in ${durata} la voce verrà velocizzata; il testo resta com'è.` : `${parole} parole: a voce normale circa ${naturale} secondi. Ci sta.`};
}

function testoRichiesta({titolo, richiesta, lingua, durata, impostazioni, personaggi, invito, note, modello, tipo = 'argomento'}) {
  const n = impostazioni.narratore;
  const chi = n.chi === 'nessuno' ? 'nessuno: il reel è senza narratore, il palco può usare tutta l\'altezza utile' : `${personaggi[n.chi]?.nome ?? n.chi} (cartella personaggi/${n.chi}), grandezza ${n.grandezza}%, a ${n.lato}${n.alza ? `, alzato di ${n.alza} px` : ''}`;
  const consiglio = suggerisciStile(richiesta);
  const stile =
    impostazioni.stile === 'auto'
      ? `auto — decidi tu dopo aver scritto il piano. Dalle parole della richiesta il suggerimento è **${consiglio.stile.toUpperCase()}**${consiglio.parole.length ? ` (per: ${consiglio.parole.join(', ')})` : ''}. Scrivi in piano.md quale hai scelto e perché, poi salvalo con \`npm run imposta … stile=2d\` oppure \`stile=3d\`.`
      : `${impostazioni.stile.toUpperCase()} — ${DESCRIZIONI_STILE[impostazioni.stile]}`;
  return [
    `# Richiesta · ${titolo}`,
    '',
    `> Scritta dal pannello il ${new Date().toISOString().slice(0, 10)}. È il punto di partenza: si legge insieme a SCHEDA.md.`,
    '',
    ...(tipo === 'testo'
      ? [
          '## Il testo del reel',
          '',
          'Il testo è già scritto, ed è definitivo: sta in `copione.md` (in una scena sola) e, intatto, in `testo.txt`.',
          '**Va pronunciato parola per parola.** Nel copione si aggiungono solo `[scena:nome]`, `[segni]`, `*enfasi*` e',
          '`[suono:nome]`: nessuna parola tolta, aggiunta o cambiata, nemmeno per correggere un dato. I dubbi sui fatti si',
          'scrivono in `fonti.md` e si dicono alla fine. `npm run voce` e `npm run verifica` si fermano se il copione non',
          'dice più il testo di `testo.txt`.',
        ]
      : ['## Cosa deve spiegare il reel', '', richiesta.trim()]),
    '',
    '## Scelte già fatte',
    '',
    `- **Lingua:** ${LINGUE[lingua] ?? lingua} (\`${lingua}\`)`,
    `- **Durata:** ${durata} secondi, con al massimo 5 di scarto (è salvata in \`impostazioni.json\`). Se la voce è più lunga la velocizza il kit; il testo non si taglia. \`npm run verifica\` dà errore fuori dai 5 secondi.`,
    `- **Narratore:** ${chi}`,
    `- **Stile:** ${stile}`,
    ...(tipo === 'testo'
      ? [`- **Scene:** si fanno con il piano di regia, senza scrivere codice. \`npm run fai <reel>\` scrive il piano di serie e i provini; poi migliora \`piano.json\` scena per scena (primo capitolo di SCHEDA.md) e rilancia \`npm run fai <reel>\`${modello ? ` (tipo di reel indicato: \`${modello.id}\` — ${modello.descrizione})` : ''}.`]
      : [
          `- **Modello di partenza:** ${modello ? `\`${modello.id}\` — ${modello.descrizione} In \`scene.tsx\` le scene pronte sono già montate: cambia testi, numeri e segni; aggiungi o togli scene se il racconto lo chiede.` : 'spiegazione'}`,
          `- **Invito finale:** ${invito ? `"Commenta ${invito.toUpperCase()}" (o l'equivalente nella lingua del reel)` : 'a tua scelta: una parola sola, legata all\'argomento'}`,
        ]),
    ...(note ? [`- **Note:** ${note.trim()}`] : []),
    '',
    'Narratore e stile sono salvati in `impostazioni.json` in questa cartella: il kit li applica da solo, non vanno riscritti nelle scene.',
    '',
    '## Cosa consegnare',
    '',
    tipo === 'testo'
      ? 'I passi del giro di SCHEDA.md, senza riscrivere il testo: fonti (una riga per ogni numero che metti a schermo), piano, scene e segni, provini, voce, video, verifica.'
      : 'Tutti i passi del giro di SCHEDA.md (fonti, piano, copione, tempi, scene, provini, voce, video, verifica), senza saltarne nessuno.',
    'Alla fine: il video, `verifica.md` senza errori, `fonti.md` con una riga per ogni numero pronunciato, `didascalia.md`.',
    '',
  ].join('\n');
}

// ───────────────────────── lavori (un comando alla volta) ─────────────────────────

const lavori = new Map();
let corrente = null;
let contatore = 0;

function avviaLavoro({titolo, slug = null, comando, argomenti}) {
  if (corrente && corrente.stato === 'in corso') throw new ErroreFmlab(`Sto ancora facendo "${corrente.titolo}". Aspetta che finisca, oppure fermalo.`);
  const lavoro = {id: String(++contatore), titolo, slug, stato: 'in corso', righe: [], inizio: Date.now(), fine: null};
  const aggiungi = (testo) => {
    for (const riga of String(testo).replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n|\r/)) {
      if (riga.trim() === '' && lavoro.righe[lavoro.righe.length - 1] === '') continue;
      lavoro.righe.push(riga);
    }
    if (lavoro.righe.length > 3000) lavoro.righe.splice(0, lavoro.righe.length - 3000);
  };
  let figlio;
  try {
    figlio = spawn(comando, argomenti, {cwd: RADICE, env: {...process.env, FMLAB_NON_APRIRE: '1', FORCE_COLOR: '0', NO_COLOR: '1'}, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (e) {
    throw new ErroreFmlab(`Non riesco ad avviare il comando: ${e.message}`);
  }
  lavoro.ferma = () => {
    lavoro.fermato = true;
    figlio.kill('SIGTERM');
  };
  figlio.stdout.on('data', aggiungi);
  figlio.stderr.on('data', aggiungi);
  figlio.on('error', (e) => {
    aggiungi(`Non riesco ad avviare il comando: ${e.message}`);
    lavoro.stato = 'errore';
    lavoro.fine = Date.now();
  });
  figlio.on('close', (codice) => {
    if (lavoro.fine) return;
    lavoro.stato = lavoro.fermato ? 'fermato' : codice === 0 ? 'finito' : 'errore';
    lavoro.fine = Date.now();
  });
  lavori.set(lavoro.id, lavoro);
  if (lavori.size > 30) lavori.delete(lavori.keys().next().value);
  corrente = lavoro;
  return lavoro;
}

function vistaLavoro(lavoro, da = 0) {
  if (!lavoro) return null;
  const percento = [...lavoro.righe].reverse().map((r) => /^\s*(\d{1,3})%/.exec(r)?.[1]).find(Boolean);
  return {
    id: lavoro.id,
    titolo: lavoro.titolo,
    slug: lavoro.slug,
    stato: lavoro.stato,
    secondi: Math.round(((lavoro.fine ?? Date.now()) - lavoro.inizio) / 1000),
    percento: lavoro.stato === 'in corso' && percento ? Number(percento) : null,
    righe: lavoro.righe.slice(da),
    totaleRighe: lavoro.righe.length,
  };
}

/** Spezza una riga di comando rispettando le virgolette:  agente -p "testo con spazi" */
export function spezzaComando(riga) {
  const pezzi = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(riga))) pezzi.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, '$1') : (m[2] ?? m[3]));
  return pezzi;
}

const AZIONI = {
  // il pulsante unico: dal testo al video a tappe (regia, monta, tempi, provini | voce, render, verifica, confronta).
  // Riparte dalla tappa fallita; prima della voce a pagamento si ferma e dice i crediti: si riparte con voceSi.
  fai: {titolo: 'Fai il reel', argomenti: (slug, lingua, o) => ['fai', slug, ...(o.bozza ? ['bozza'] : []), ...(o.voceSi ? ['voce=si'] : []), ...(o.comunque ? ['comunque'] : [])]},
  voce: {titolo: 'Voce', argomenti: (slug, lingua, o) => ['voce', slug, ...lingua, ...(['elevenlabs', 'mac', 'comando', 'stima'].includes(o.motore) ? [o.motore] : []), ...(o.nuova ? ['nuova'] : [])]},
  provini: {titolo: 'Provini', argomenti: (slug, lingua) => ['provini', slug, ...lingua]},
  bozza: {titolo: 'Video di bozza', argomenti: (slug, lingua) => ['render', slug, ...lingua, 'bozza']},
  render: {titolo: 'Video finale', argomenti: (slug, lingua) => ['render', slug, ...lingua]},
  verifica: {titolo: 'Verifica', argomenti: (slug, lingua) => ['verifica', slug, ...lingua]},
};

// ───────────────────────── il comando ─────────────────────────

export async function comandoPannello(argomenti = []) {
  if (argomenti.includes('ferma')) {
    const {fermaDashboard} = await import('./dashboard.mjs');
    return console.log(fermaDashboard() ? '\nDashboard spenta.\n' : '\nNessuna dashboard accesa.\n');
  }
  const rete = argomenti.includes('rete');
  const chiave = (process.env.FMLAB_CHIAVE_PANNELLO || nuovaChiave()).toUpperCase();
  const fallimenti = new Map();
  const paginaPannello = path.join(RADICE, 'motore', 'web', 'pannello.html');

  const ingresso = (url, req, res) => {
    const ip = req.socket.remoteAddress ?? '?';
    const biscotti = Object.fromEntries(
      String(req.headers.cookie ?? '')
        .split(';')
        .map((c) => c.trim().split('='))
        .filter((p) => p.length === 2)
    );
    const tentativi = fallimenti.get(ip) ?? 0;
    const data = url.searchParams.get('chiave');
    if (data !== null && tentativi < 25) {
      if (uguali(data.trim().toUpperCase(), chiave)) {
        fallimenti.delete(ip);
        url.searchParams.delete('chiave');
        res.writeHead(302, {'Set-Cookie': `${BISCOTTO}=${chiave}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1209600`, Location: url.pathname + url.search, 'Cache-Control': 'no-store'});
        res.end();
        return true;
      }
      fallimenti.set(ip, tentativi + 1);
    }
    if (biscotti[BISCOTTO] && uguali(biscotti[BISCOTTO], chiave)) {
      // richieste che cambiano qualcosa: devono partire dalla pagina del pannello, non da un altro sito
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.headers.origin) {
        let stessa = false;
        try {
          stessa = new URL(req.headers.origin).host === req.headers.host;
        } catch {
          stessa = false;
        }
        if (!stessa) {
          json(res, 403, {errore: 'Richiesta rifiutata.'});
          return true;
        }
      }
      return false;
    }
    if (url.pathname.startsWith('/api/')) {
      json(res, 401, {errore: 'Serve il codice del pannello: ricarica la pagina.'});
      return true;
    }
    const bloccato = tentativi >= 25;
    res.writeHead(bloccato ? 429 : 401, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FMLAB · pannello</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#04070a;color:#e8eef5;font:500 17px/1.5 system-ui,sans-serif}form{width:min(88vw,340px)}h1{font-size:22px;margin:0 0 6px}p{color:#9fb0bd;margin:0 0 18px}input{width:100%;box-sizing:border-box;font:700 26px/1.2 ui-monospace,monospace;letter-spacing:.18em;text-align:center;text-transform:uppercase;padding:14px;border-radius:14px;border:1px solid #2a3644;background:#0c1219;color:#fff}button{margin-top:14px;width:100%;padding:14px;border:0;border-radius:14px;background:#5cf2c8;color:#04221b;font:700 17px system-ui}</style>
<form method="get" action="/"><h1>FMLAB Reel Kit</h1><p>${bloccato ? 'Troppi tentativi sbagliati. Chiudi e riapri il pannello dal Terminale.' : 'Scrivi il codice che vedi nel Terminale dove hai lanciato il pannello.'}</p>${bloccato ? '' : '<input name="chiave" autocomplete="off" autocapitalize="characters" maxlength="12" autofocus><button>Entra</button>'}</form></html>`);
    return true;
  };

  const api = async (url, req, res) => {
    if (url.pathname === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(fs.readFileSync(paginaPannello));
      return true;
    }
    if (!url.pathname.startsWith('/api/')) return false;
    try {
      const personaggi = leggiPersonaggi();
      if (url.pathname === '/api/stato' && req.method === 'GET') {
        const agente = Boolean(process.env.FMLAB_AGENTE);
        json(res, 200, {
          kit: {
            mac: process.platform === 'darwin',
            elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
            comando: Boolean(process.env.FMLAB_VOCE_COMANDO),
            agente: agente && (locale(req) || /^(si|sì|true|1)$/i.test(process.env.FMLAB_AGENTE_RETE ?? '')),
            agenteConfigurato: agente,
            rete,
          },
          personaggi: elencoPersonaggi(personaggi),
          predefinite: impostazioniKit(personaggi),
          limiti: {grandezza: GRANDEZZA, stili: STILI, mano2: MANO2, durata: DURATA, paroleAlSecondo: PAROLE_AL_SECONDO},
          catalogo: fs.existsSync(path.join(RADICE, 'catalogo.jpg')) ? `/catalogo.jpg?v=${Math.round(fs.statSync(path.join(RADICE, 'catalogo.jpg')).mtimeMs)}` : null,
          prompt: leggiPrompt(),
          descrizioniStile: DESCRIZIONI_STILE,
          lingue: LINGUE,
          modelli: elencoModelli(),
          reel: elencoReel()
            .map((slug) => statoReel(slug, personaggi))
            .sort((a, b) => b.modificato - a.modificato),
          lavoro: vistaLavoro(corrente, Number(url.searchParams.get('da') ?? 0)),
        });
        return true;
      }
      if (url.pathname === '/api/voci' && req.method === 'GET') {
        // le voci tra cui scegliere: quelle del Mac per la lingua chiesta e quelle dell'account ElevenLabs
        const lingua = String(url.searchParams.get('lingua') ?? 'it').slice(0, 2).toLowerCase();
        const esito = {mac: [], elevenlabs: [], avvisi: []};
        try {
          esito.mac = elencoVociMac().filter((v) => v.lingua.toLowerCase().startsWith(lingua)).map((v) => v.nome);
        } catch (e) {
          esito.avvisi.push(e.message);
        }
        try {
          esito.elevenlabs = await elencoVociElevenLabs();
        } catch (e) {
          esito.avvisi.push(e.message);
        }
        json(res, 200, esito);
        return true;
      }
      if (url.pathname === '/api/lavoro' && req.method === 'GET') {
        const lavoro = lavori.get(url.searchParams.get('id') ?? '') ?? corrente;
        json(res, 200, {lavoro: vistaLavoro(lavoro, Number(url.searchParams.get('da') ?? 0))});
        return true;
      }
      // ───────── la dashboard in diretta: registro, coda, riferimenti, chiavi, pezzi, diario ─────────
      if (url.pathname === '/api/adesso' && req.method === 'GET') {
        const {leggiAdesso, leggiRegistro, leggiCoda, creditiSpesi} = await import('./registro.mjs');
        const {preventivoElevenLabs} = await import('./voce.mjs');
        const {leggiCopione} = await import('./copione.mjs');
        // quanto costerebbe adesso la voce di ogni reel: solo le frasi che non sono né in banca né già pagate
        const daSpendere = {};
        for (const slug of elencoReel()) {
          try {
            const copione = leggiCopione(fs.readFileSync(path.join(CARTELLA_REELS, slug, 'copione.md'), 'utf8'));
            daSpendere[slug] = preventivoElevenLabs(copione, 'it', leggiImpostazioni(slug).voce);
          } catch {
            // un reel senza copione non ha ancora un costo
          }
        }
        const coda = leggiCoda();
        json(res, 200, {
          adesso: leggiAdesso(),
          fatti: leggiRegistro({ultimi: 60}),
          coda: [...coda.filter((r) => r.stato !== 'fatta'), ...coda.filter((r) => r.stato === 'fatta').slice(-4)],
          crediti: {spesi: creditiSpesi(), daSpendere},
          tappe: (await import('./fai.mjs')).TAPPE,
        });
        return true;
      }
      if (url.pathname === '/api/coda' && req.method === 'POST') {
        const {aggiungiRichiesta, segnaRichiesta} = await import('./registro.mjs');
        const corpo = await leggiCorpo(req);
        if (corpo.fatta) {
          json(res, 200, {richiesta: segnaRichiesta(String(corpo.fatta), 'fatta')});
          return true;
        }
        const reel = corpo.reel && elencoReel().includes(corpo.reel) ? corpo.reel : null;
        const permesse = ['narratore', 'formato', 'durata', 'regalo', 'voce', 'stile', 'musica'];
        const scelte = Object.fromEntries(Object.entries(corpo.scelte ?? {}).filter(([k, v]) => permesse.includes(k) && ['string', 'number'].includes(typeof v) && String(v).length < 40));
        let richiesta;
        try {
          richiesta = aggiungiRichiesta({reel, testo: corpo.testo ?? '', scelte});
        } catch (e) {
          throw new ErroreFmlab(e.message);
        }
        json(res, 200, {richiesta});
        return true;
      }
      if (url.pathname === '/api/riferimenti' && req.method === 'GET') {
        const cartella = path.join(RADICE, 'riferimenti');
        const video = fs.existsSync(cartella) ? fs.readdirSync(cartella).filter((f) => /\.(mp4|mov|m4v)$/i.test(f)).sort() : [];
        let misure = {};
        try {
          misure = leggiJson(path.join(cartella, 'misure.json')).riferimenti ?? {};
        } catch {
          misure = {};
        }
        json(res, 200, {
          cartella: rel(cartella),
          video: video.map((f) => ({nome: f, mega: Math.round((fs.statSync(path.join(cartella, f)).size / 1e6) * 10) / 10, indirizzo: `/riferimenti/${encodeURIComponent(f)}`, durata: misure[f.replace(/\.[^.]+$/, '')]?.durata ?? null})),
          misurati: Object.keys(misure).length,
          analisi: fs.existsSync(path.join(cartella, 'ANALISI.md')),
        });
        return true;
      }
      if (url.pathname === '/api/apri' && req.method === 'POST') {
        if (!locale(req)) throw new ErroreFmlab('Le cartelle si aprono solo dal computer su cui gira il kit.');
        const corpo = await leggiCorpo(req);
        const posti = {kit: RADICE, riferimenti: path.join(RADICE, 'riferimenti'), frasi: path.join(RADICE, 'voci', 'frasi'), pagate: path.join(RADICE, 'voci', 'pagate'), immagini: path.join(RADICE, 'libreria', 'immagini'), suoni: path.join(RADICE, 'suoni'), personaggi: path.join(RADICE, 'personaggi'), libreria: path.join(RADICE, 'libreria')};
        const cosa = String(corpo.cosa ?? '');
        const cartella = cosa.startsWith('reel:') && elencoReel().includes(cosa.slice(5)) ? path.join(CARTELLA_REELS, cosa.slice(5)) : posti[cosa];
        if (!cartella) throw new ErroreFmlab('Cartella sconosciuta.');
        fs.mkdirSync(cartella, {recursive: true});
        let aperta = false;
        if (!process.env.FMLAB_NON_APRIRE) {
          const comando = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
          try {
            spawn(comando, [cartella], {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
            aperta = true;
          } catch {
            aperta = false;
          }
        }
        json(res, 200, {aperta, percorso: cartella});
        return true;
      }
      if (url.pathname === '/api/chiavi') {
        const {statoChiavi, scriviChiave} = await import('./chiavi.mjs');
        if (req.method === 'POST') {
          if (!locale(req)) throw new ErroreFmlab('Le chiavi si scrivono solo dal computer su cui gira il kit, non dal telefono.');
          const corpo = await leggiCorpo(req);
          scriviChiave(String(corpo.nome ?? ''), corpo.valore);
        }
        json(res, 200, {chiavi: statoChiavi(), daQui: locale(req)});
        return true;
      }
      if (url.pathname === '/api/pezzi' && req.method === 'GET') {
        const {BLOCCHI, OGGETTI, LUOGHI, SOGGETTI} = await import('./piano.mjs');
        const {leggiBanca} = await import('./frasi.mjs');
        const banca = leggiBanca();
        json(res, 200, {
          blocchi: Object.entries(BLOCCHI).map(([nome, b]) => ({nome, cosa: b.cosa})),
          soggetti: Object.entries(SOGGETTI).map(([nome, stato]) => ({nome, stato})),
          oggetti: Object.keys(OGGETTI),
          luoghi: LUOGHI,
          frasi: banca.frasi.map((f) => ({testo: f.testo, lingua: f.lingua, secondi: f.secondi, indirizzo: `/${f.file.split(path.sep).join('/')}`})),
          ritmo: banca.ritmo,
        });
        return true;
      }
      if (url.pathname === '/api/diario' && req.method === 'GET') {
        const {leggiDiario} = await import('./registro.mjs');
        json(res, 200, {voci: leggiDiario()});
        return true;
      }
      if (req.method !== 'POST') {
        json(res, 405, {errore: 'Metodo non permesso.'});
        return true;
      }
      const corpo = await leggiCorpo(req);

      if (url.pathname === '/api/nuovo') {
        const richiesta = String(corpo.richiesta ?? '').trim();
        // quello che la persona scrive è il testo del reel, parola per parola; "argomento" solo se lo dice lei
        const tipo = String(corpo.tipo ?? 'testo').toLowerCase() === 'argomento' ? 'argomento' : 'testo';
        if (richiesta.length < 8) throw new ErroreFmlab(tipo === 'testo' ? 'Scrivi il testo del reel (almeno una frase).' : 'Scrivi di cosa deve parlare il reel (almeno una frase).');
        if (richiesta.length > 12000) throw new ErroreFmlab('Il testo è troppo lungo: tieniti sotto i 12000 caratteri (un reel di tre minuti ne ha circa 5000).');
        const titolo = String(corpo.titolo ?? '').trim().slice(0, 90) || titoloDaRichiesta(richiesta);
        const lingua = String(corpo.lingua ?? 'it').toLowerCase();
        const durata = Math.round(Number(corpo.durata ?? 45));
        if (!Number.isFinite(durata) || durata < DURATA.min || durata > DURATA.max) throw new ErroreFmlab(`La durata va da ${DURATA.min} a ${DURATA.max} secondi.`);
        const modello = elencoModelli().find((m) => m.id === String(corpo.modello ?? 'spiegazione'));
        if (!modello) throw new ErroreFmlab(`Il modello "${corpo.modello}" non esiste.`);
        // un modello fatto per il 3D (l'oggetto che gira) decide lo stile, se era rimasto su "automatico"
        const stileScelto = String(corpo.stile ?? 'auto').toLowerCase() === 'auto' && modello.stile ? modello.stile : corpo.stile;
        const impostazioni = sistema({narratore: corpo.narratore, stile: stileScelto, musica: corpo.musica, durata}, personaggi, 'Nuovo reel');
        const slug = nomeLibero(nomeDaTitolo(titolo));
        await creaReel(slug, titolo, {lingua, silenzioso: true, modello: modello.id, testo: tipo === 'testo' ? richiesta : undefined});
        scriviImpostazioni(slug, impostazioni, personaggi);
        // tempi stimati di nuovo, adesso che la durata chiesta è salvata: anteprima e provini partono già giusti
        let misura = null;
        if (tipo === 'testo') {
          const registro = console.log;
          console.log = () => {};
          try {
            const dati = await comandoVoce(slug, ['stima']);
            misura = avvisoDurata(dati.parole.length, durata);
          } finally {
            console.log = registro;
          }
        }
        const invito = String(corpo.invito ?? '').trim().replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 24);
        const note = String(corpo.note ?? '').trim().slice(0, 2000);
        fs.writeFileSync(path.join(CARTELLA_REELS, slug, 'richiesta.md'), testoRichiesta({titolo, richiesta, lingua, durata, impostazioni, personaggi, invito, note, modello, tipo}));
        json(res, 200, {slug, titolo, tipo, durata, cartella: `reels/${slug}`, frase: fraseAgente(slug), suggerimento: suggerisciStile(richiesta), misura});
        return true;
      }

      if (url.pathname === '/api/catalogo') {
        const lavoro = avviaLavoro({titolo: 'Catalogo', comando: process.execPath, argomenti: [path.join(RADICE, 'motore', 'cli.mjs'), 'catalogo']});
        json(res, 200, {lavoro: vistaLavoro(lavoro)});
        return true;
      }

      if (url.pathname === '/api/ferma') {
        if (corrente && corrente.stato === 'in corso') corrente.ferma();
        json(res, 200, {lavoro: vistaLavoro(corrente)});
        return true;
      }

      const slug = String(corpo.slug ?? '');
      if (!slugValido(slug) || !elencoReel().includes(slug)) throw new ErroreFmlab(`Il reel "${slug}" non esiste.`);

      if (url.pathname === '/api/assaggio') {
        // una frase del reel letta dalla voce del Mac scelta, per ascoltarla prima di decidere (gratis)
        const voce = String(corpo.voce ?? '').slice(0, 80);
        if (!voce) throw new ErroreFmlab('Scegli prima una voce.');
        const stato = statoReel(slug, personaggi);
        const versione = stato.versioni.find((v) => v.lingua === String(corpo.lingua ?? '')) ?? stato.versioni[0];
        const fileCopione = path.join(CARTELLA_REELS, slug, versione === stato.versioni[0] ? 'copione.md' : `copione.${versione.lingua}.md`);
        const parole = leggiCopione(fs.readFileSync(fileCopione, 'utf8')).parole;
        const frase = parole.filter((p) => p.frase === parole[0].frase).map((p) => p.testo).join(' ').slice(0, 160);
        const nome = crypto.createHash('sha1').update(`${voce}|${frase}`).digest('hex').slice(0, 16);
        const file = path.join(CACHE, 'assaggi', `${nome}.wav`);
        if (!fs.existsSync(file)) assaggioVoceMac(frase, voce, file);
        json(res, 200, {audio: `/.fmlab/assaggi/${nome}.wav`, frase});
        return true;
      }
      if (url.pathname === '/api/impostazioni') {
        const salvate = scriviImpostazioni(slug, {narratore: corpo.narratore, stile: corpo.stile, musica: corpo.musica, voce: corpo.voce, ...(corpo.durata !== undefined ? {durata: corpo.durata} : {}), ...(corpo.formato !== undefined ? {formato: corpo.formato} : {})}, personaggi);
        json(res, 200, {impostazioni: salvate});
        return true;
      }
      if (url.pathname === '/api/esegui') {
        const azione = String(corpo.azione ?? '');
        const stato = statoReel(slug, personaggi);
        const lingua = String(corpo.lingua ?? '').toLowerCase();
        const versione = stato.versioni.find((v) => v.lingua === lingua) ?? stato.versioni[0];
        const argLingua = versione === stato.versioni[0] ? [] : [versione.lingua];
        if (azione === 'agente') {
          if (!process.env.FMLAB_AGENTE) throw new ErroreFmlab('Nessun agente configurato: aggiungi la riga FMLAB_AGENTE=… nel file .env (vedi .env.esempio).');
          if (!locale(req) && !/^(si|sì|true|1)$/i.test(process.env.FMLAB_AGENTE_RETE ?? '')) {
            throw new ErroreFmlab('Da un altro dispositivo l\'agente parte solo se nel file .env c\'è FMLAB_AGENTE_RETE=si.');
          }
          const frase = fraseAgente(slug);
          const pezzi = spezzaComando(process.env.FMLAB_AGENTE);
          if (!pezzi.length) throw new ErroreFmlab('FMLAB_AGENTE è vuoto.');
          const conSegnaposto = pezzi.some((p) => p.includes('{richiesta}'));
          const args = pezzi.slice(1).map((p) => p.replaceAll('{richiesta}', frase));
          if (!conSegnaposto) args.push(frase);
          json(res, 200, {lavoro: vistaLavoro(avviaLavoro({titolo: `Agente · ${slug}`, slug, comando: pezzi[0], argomenti: args}))});
          return true;
        }
        const definizione = AZIONI[azione];
        if (!definizione) throw new ErroreFmlab(`Non conosco l'azione "${azione}".`);
        const args = definizione.argomenti(slug, argLingua, corpo);
        const lavoro = avviaLavoro({titolo: `${definizione.titolo} · ${slug}${argLingua.length ? ' ' + argLingua[0] : ''}`, slug, comando: process.execPath, argomenti: [path.join(RADICE, 'motore', 'cli.mjs'), ...args]});
        json(res, 200, {lavoro: vistaLavoro(lavoro)});
        return true;
      }
      json(res, 404, {errore: 'Non trovato.'});
      return true;
    } catch (e) {
      json(res, e instanceof ErroreFmlab ? 400 : 500, {errore: e.message ?? String(e)});
      return true;
    }
  };

  const rotte = [ingresso, api, ...rotteAnteprima({conElenco: false})];
  const host = rete ? '0.0.0.0' : '127.0.0.1';
  let server;
  try {
    server = await avviaServer({porta: Number(process.env.FMLAB_PORTA_PANNELLO ?? 4180), host, rotte});
  } catch {
    server = await avviaServer({porta: 0, host, rotte});
  }
  // accesa da `npm run stato`: si apre sulla diretta, perché chi guarda vuole vedere cosa fa l'agente
  const vista = /^[a-z]+$/.test(process.env.FMLAB_VISTA ?? '') ? `#${process.env.FMLAB_VISTA}` : '';
  const indirizzo = `http://localhost:${server.porta}/?chiave=${chiave}${vista}`;
  console.log(`\nPannello FMLAB pronto:  ${indirizzo}`);
  console.log(`Codice d'ingresso:      ${chiave}`);
  if (rete) {
    const indirizzi = Object.values(os.networkInterfaces())
      .flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => `http://${i.address}:${server.porta}/?chiave=${chiave}`);
    console.log(`Dal telefono (stessa rete Wi-Fi):  ${indirizzi.join('   ') || '(nessun indirizzo di rete trovato)'}`);
    console.log('Chi ha questo indirizzo può usare il pannello: non condividerlo.');
  } else {
    console.log('Per usarlo anche dal telefono:  npm run pannello rete');
  }
  console.log('Ctrl+C per chiudere.\n');
  if (!process.env.FMLAB_NON_APRIRE) {
    const comando = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', indirizzo] : [indirizzo];
    try {
      spawn(comando, args, {stdio: 'ignore', detached: true}).on('error', () => {}).unref();
    } catch {
      // nessun browser da aprire in automatico: basta copiare l'indirizzo
    }
  }
  if (process.env.FMLAB_PANNELLO_PROVA) return {server, chiave};
  // così `npm run stato` la ritrova invece di accenderne un'altra
  const {scriviInfoPannello} = await import('./dashboard.mjs');
  scriviInfoPannello({porta: server.porta, indirizzo, rete});
  await new Promise(() => {});
}
