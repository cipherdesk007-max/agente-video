// FMLAB Reel Kit — IL METRO: misura un video qualsiasi (un riferimento, o un reel del kit) e stampa una tabella.
//
//   npm run confronta <file.mp4>          misura il video e lo confronta con le soglie di riferimenti/misure.json
//   npm run confronta <reel>              lo stesso sul video finale di un reel del kit
//   npm run confronta riferimenti         misura tutti gli mp4 di riferimenti/ e scrive riferimenti/misure.json
//   …  json                               stampa i numeri in JSON invece della tabella
//
// Usa solo ffmpeg (già richiesto dal kit): niente riconoscimento di testo o di voce. Le parole si contano dai
// sottotitoli (una parola = un gruppo di lettere), il ritardo tra voce e sottotitoli si ricava allineando gli
// attacchi della voce con la comparsa delle parole. Stesso file → stessi numeri: non c'è niente di casuale.
//
// Le ZONE qui sotto sono lo strumento (dove guardare, in frazioni del fotogramma: valgono per ogni risoluzione 9:16).
// Le SOGLIE no: stanno in riferimenti/misure.json, ricavate dai video di riferimento.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {CARTELLA_REELS, ErroreFmlab, RADICE, elencoReel, leggiJson, rel, scriviJson} from './percorsi.mjs';
import {infoMedia, trovaFfmpeg} from './ffmpeg.mjs';

export const VERSIONE_METRO = 1;
export const FILE_MISURE = path.join(RADICE, 'riferimenti', 'misure.json');

/** Dove guardare: frazioni di larghezza e altezza del fotogramma. */
export const ZONE = {
  sottotitoli: {x0: 0.04, x1: 0.96, y0: 0.15, y1: 0.225},
  palco: {x0: 0.05, x1: 0.95, y0: 0.245, y1: 0.69},
  narratore: {x0: 0.56, x1: 1, y0: 0.7, y1: 1},
};

const arr = (x, cifre = 2) => (x === null || x === undefined || !Number.isFinite(x) ? null : Math.round(x * 10 ** cifre) / 10 ** cifre);
const mediana = (v) => quantile(v, 0.5);
function quantile(valori, q) {
  if (!valori.length) return null;
  const v = [...valori].sort((a, b) => a - b);
  const p = (v.length - 1) * q;
  const a = Math.floor(p);
  return v[a] + (v[Math.min(v.length - 1, a + 1)] - v[a]) * (p - a);
}
const media = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);

/** Fa decodificare a ffmpeg il video (o l'audio) in dati grezzi e chiama `alPezzo` per ogni blocco di `misura` byte. */
function grezzo(ff, argomenti, misura, alPezzo) {
  return new Promise((risolvi, rifiuta) => {
    const p = spawn(ff.percorso, ['-hide_banner', '-nostdin', '-v', 'error', ...argomenti, '-'], {stdio: ['ignore', 'pipe', 'pipe']});
    let resto = Buffer.alloc(0);
    let errore = '';
    let n = 0;
    p.stderr.on('data', (d) => (errore = (errore + d).slice(-2000)));
    p.stdout.on('data', (d) => {
      resto = resto.length ? Buffer.concat([resto, d]) : d;
      let da = 0;
      while (resto.length - da >= misura) {
        alPezzo(resto.subarray(da, da + misura), n++);
        da += misura;
      }
      resto = Buffer.from(resto.subarray(da));
    });
    p.on('error', (e) => rifiuta(new ErroreFmlab(`Non riesco ad avviare ffmpeg: ${e.message}`)));
    p.on('close', (codice) => (codice === 0 ? risolvi(n) : rifiuta(new ErroreFmlab(`ffmpeg non riesce a leggere il video:\n${errore.split('\n').slice(-4).join('\n')}`))));
  });
}

const ritaglio = (z) => `crop=iw*${(z.x1 - z.x0).toFixed(4)}:ih*${(z.y1 - z.y0).toFixed(4)}:iw*${z.x0.toFixed(4)}:ih*${z.y0.toFixed(4)}`;

// ───────────────────────── 1 · scena: tagli, novità, palco, colori ─────────────────────────

const L = 108;
const A = 192;
/** Quanto deve salire l'attività del palco sopra il suo fondo per contare come novità (frazione di luminosità). */
const SOGLIA_NOVITA = 0.006;
const NOMI_TINTA = ['rosso', 'arancio', 'giallo', 'verde chiaro', 'verde', 'verde acqua', 'ciano', 'azzurro', 'blu', 'viola', 'magenta', 'rosa'];

async function misuraScena(ff, file, fps) {
  const dentro = (z) => ({x0: Math.round(z.x0 * L), x1: Math.round(z.x1 * L), y0: Math.round(z.y0 * A), y1: Math.round(z.y1 * A)});
  const palco = dentro(ZONE.palco);
  const sub = dentro(ZONE.sottotitoli);
  const nar = dentro(ZONE.narratore);
  // per i tagli conta tutto il fotogramma tranne sottotitoli e narratore (che cambiano di continuo per conto loro)
  const maschera = new Uint8Array(L * A);
  let quantiScena = 0;
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      const inSub = y >= sub.y0 && y < sub.y1;
      const inNar = x >= nar.x0 && y >= nar.y0;
      if (!inSub && !inNar) {
        maschera[y * L + x] = 1;
        quantiScena++;
      }
    }
  }
  const quantiPalco = (palco.x1 - palco.x0) * (palco.y1 - palco.y0);
  const PASSO = 5; // l'attività si misura contro il fotogramma di 5 prima (un sesto di secondo a 30 al secondo)
  const coda = [];
  const salto = []; // differenza col fotogramma prima, su tutta la scena (0…1)
  const attivita = []; // differenza col fotogramma di PASSO prima, sul palco (0…1)
  const occupato = [];
  const dettaglio = [];
  const buio = [];
  const tinte = []; // per ogni finestra di 2 secondi: istogramma di 12 tinte
  const CELLA = 6;
  await grezzo(ff, ['-i', file, '-map', '0:v:0', '-vf', `scale=${L}:${A}:flags=area`, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24'], L * A * 3, (rgb, n) => {
    const Y = new Uint8Array(L * A);
    let somma = 0;
    const finestra = Math.floor(n / fps / 2);
    const isto = (tinte[finestra] ??= new Float64Array(12));
    for (let i = 0, j = 0; i < L * A; i++, j += 3) {
      const r = rgb[j];
      const g = rgb[j + 1];
      const b = rgb[j + 2];
      const y = (r * 54 + g * 183 + b * 19) >> 8;
      Y[i] = y;
      somma += y;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      if (maschera[i] && mx > 50 && mx - mn > mx * 0.25) {
        let h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
        if (h < 0) h += 6;
        isto[Math.min(11, Math.floor(h * 2))] += ((mx - mn) / 255) * (mx / 255);
      }
    }
    buio.push(somma / (L * A) / 255);
    const prima = coda[coda.length - 1];
    const indietro = coda.length >= PASSO ? coda[coda.length - PASSO] : null;
    if (prima) {
      let d = 0;
      for (let i = 0; i < L * A; i++) if (maschera[i]) d += Math.abs(Y[i] - prima[i]);
      salto.push(d / quantiScena / 255);
    } else salto.push(0);
    if (indietro) {
      let d = 0;
      for (let y = palco.y0; y < palco.y1; y++) for (let x = palco.x0; x < palco.x1; x++) d += Math.abs(Y[y * L + x] - indietro[y * L + x]);
      attivita.push(d / quantiPalco / 255);
    } else attivita.push(0);
    // palco occupato: celle in cui c'è qualcosa di disegnato (dettaglio o colore), non fondo liscio
    let celle = 0;
    let piene = 0;
    let fine = 0; // quanto dettaglio c'è dentro le celle: un disegno ricco ne ha più di una scheda a tinta unita
    for (let cy = palco.y0; cy + CELLA <= palco.y1; cy += CELLA) {
      for (let cx = palco.x0; cx + CELLA <= palco.x1; cx += CELLA) {
        let s = 0;
        let s2 = 0;
        let croma = 0;
        for (let y = cy; y < cy + CELLA; y++) {
          for (let x = cx; x < cx + CELLA; x++) {
            const v = Y[y * L + x];
            s += v;
            s2 += v * v;
            const j = (y * L + x) * 3;
            croma += Math.max(rgb[j], rgb[j + 1], rgb[j + 2]) - Math.min(rgb[j], rgb[j + 1], rgb[j + 2]);
          }
        }
        const q = CELLA * CELLA;
        const dev = Math.sqrt(Math.max(0, s2 / q - (s / q) ** 2));
        celle++;
        fine += dev;
        if (dev > 9 || croma / q > 36) piene++;
      }
    }
    occupato.push(piene / celle);
    dettaglio.push(fine / celle / 255);
    coda.push(Y);
    if (coda.length > PASSO) coda.shift();
  });

  // tagli netti: un salto grande e isolato (un solo fotogramma), non un movimento che dura
  let tagli = 0;
  const istantiTagli = [];
  for (let i = 2; i < salto.length - 2; i++) {
    const intorno = Math.max(salto[i - 2], salto[i - 1], salto[i + 1], salto[i + 2]);
    if (salto[i] > 0.12 && salto[i] > intorno * 3) {
      tagli++;
      istantiTagli.push(arr(i / fps));
    }
  }
  // novità visive: i momenti in cui sul palco succede qualcosa di più del movimento di fondo (la camera che si
  // avvicina, le particelle). Un picco dell'attività che supera di netto il suo livello dei tre secondi attorno.
  const liscia = attivita.map((_, i) => media(attivita.slice(Math.max(0, i - 2), i + 3)));
  const META = Math.round(fps * 1.5);
  const novita = [];
  for (let i = 2; i < liscia.length - 2; i++) {
    if (liscia[i] < liscia[i - 1] || liscia[i] < liscia[i + 1]) continue;
    const fondo = mediana(liscia.slice(Math.max(0, i - META), i + META + 1));
    if (liscia[i] - fondo < Math.max(SOGLIA_NOVITA, fondo * 0.6)) continue;
    if (novita.length && i / fps - novita[novita.length - 1].t < 0.5) {
      // due picchi vicini sono la stessa novità: vale il più alto
      if (liscia[i] > novita[novita.length - 1].forza) novita[novita.length - 1] = {t: i / fps, forza: liscia[i]};
      continue;
    }
    novita.push({t: i / fps, forza: liscia[i]});
  }
  const durata = salto.length / fps;
  const intervalli = [];
  const bordi = [0, ...novita.map((x) => x.t), durata];
  for (let i = 1; i < bordi.length; i++) intervalli.push(bordi[i] - bordi[i - 1]);
  // quanto a lungo il palco resta fermo del tutto
  let fermoMax = 0;
  let fermo = 0;
  let fermi = 0;
  for (const a of liscia) {
    if (a < 0.003) {
      fermo++;
      fermi++;
      fermoMax = Math.max(fermoMax, fermo);
    } else fermo = 0;
  }
  // tinte: quella dominante di ogni finestra di 2 secondi
  const dominanti = tinte.map((isto) => {
    const tot = isto.reduce((s, x) => s + x, 0);
    if (tot < 20) return null;
    let k = 0;
    for (let i = 1; i < 12; i++) if (isto[i] > isto[k]) k = i;
    return k;
  });
  const conta = new Map();
  for (const k of dominanti) if (k !== null) conta.set(k, (conta.get(k) ?? 0) + 1);
  const ordinate = [...conta.entries()].sort((a, b) => b[1] - a[1]);
  return {
    fotogrammi: salto.length,
    durata: arr(durata),
    tagli: {quanti: tagli, istanti: istantiTagli.slice(0, 10), saltoMassimo: arr(Math.max(...salto), 3)},
    novita: {
      quante: novita.length,
      alMinuto: arr((novita.length / durata) * 60, 1),
      intervalloMediano: arr(mediana(intervalli)),
      intervalloP90: arr(quantile(intervalli, 0.9)),
      intervalloMassimo: arr(Math.max(...intervalli)),
      istanti: novita.map((x) => arr(x.t)),
    },
    palco: {
      occupato: arr(media(occupato), 3),
      occupatoMinimo: arr(quantile(occupato, 0.1), 3),
      dettaglio: arr(media(dettaglio) * 100, 2),
      movimento: arr(media(attivita) * 100, 2),
      fermoPercento: arr((fermi / liscia.length) * 100, 1),
      fermoMassimo: arr(fermoMax / fps),
    },
    colori: {
      luminosita: arr(media(buio), 3),
      tinte: ordinate.map(([k, n]) => ({tinta: NOMI_TINTA[k], percento: arr((n / dominanti.length) * 100, 0)})),
      tinteDiverse: ordinate.filter(([, n]) => n / dominanti.length >= 0.08).length,
      senzaColorePercento: arr((dominanti.filter((k) => k === null).length / Math.max(1, dominanti.length)) * 100, 0),
    },
  };
}

// ───────────────────────── 2 · sottotitoli ─────────────────────────

const SL = 480;

async function misuraSottotitoli(ff, file, fps, larghezza, altezza) {
  const z = ZONE.sottotitoli;
  const SA = Math.max(8, Math.round((SL * (z.y1 - z.y0) * altezza) / ((z.x1 - z.x0) * larghezza) / 2) * 2);
  const R = 7; // raggio della sfocatura: le lettere sono tratti sottili più chiari di quello che hanno intorno
  const serie = []; // per fotogramma: {parole, inchiostro, cx, cy, alto, contrasto, colonne}
  await grezzo(ff, ['-i', file, '-map', '0:v:0', '-vf', `${ritaglio(z)},scale=${SL}:${SA}:flags=bicubic`, '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'gray'], SL * SA, (Y) => {
    // media locale con una tabella di somme
    const W = SL + 1;
    const somme = new Float64Array(W * (SA + 1));
    for (let y = 0; y < SA; y++) {
      let riga = 0;
      for (let x = 0; x < SL; x++) {
        riga += Y[y * SL + x];
        somme[(y + 1) * W + x + 1] = somme[y * W + x + 1] + riga;
      }
    }
    const inchiostro = new Uint8Array(SL * SA);
    const perRiga = new Uint16Array(SA);
    let quanti = 0;
    let lumaTesto = 0;
    let lumaFondo = 0;
    for (let y = 0; y < SA; y++) {
      const y0 = Math.max(0, y - R);
      const y1 = Math.min(SA, y + R + 1);
      for (let x = 0; x < SL; x++) {
        const x0 = Math.max(0, x - R);
        const x1 = Math.min(SL, x + R + 1);
        const locale = (somme[y1 * W + x1] - somme[y0 * W + x1] - somme[y1 * W + x0] + somme[y0 * W + x0]) / ((y1 - y0) * (x1 - x0));
        const v = Y[y * SL + x];
        if (v - locale > 26 && v > 70) {
          inchiostro[y * SL + x] = 1;
          perRiga[y]++;
          quanti++;
          lumaTesto += v;
        } else lumaFondo += v;
      }
    }
    if (quanti < 40) {
      serie.push({linee: [], contrasto: null});
      return;
    }
    // righe di testo: gruppi di righe con dell'inchiostro
    const righe = [];
    let inizio = -1;
    for (let y = 0; y <= SA; y++) {
      const piena = y < SA && perRiga[y] >= 3;
      if (piena && inizio < 0) inizio = y;
      if (!piena && inizio >= 0) {
        if (y - inizio >= 6) righe.push([inizio, y]);
        inizio = -1;
      }
    }
    const linee = []; // per ogni riga di testo trovata: {alto, parole, estranei, colonne}
    for (const [ya, yb] of righe) {
      let parole = 0;
      let estranei = 0;
      const colonne = new Uint8Array(SL);
      // il corpo delle lettere: le righe più piene (la fascia delle minuscole). Fuori restano le aste, i puntini,
      // e la cornice con le maniglie attorno alla parola chiave, che altrimenti sembrerebbero parole.
      // (la cornice ha due righe orizzontali pienissime ma sottili: contano solo i tratti di almeno tre righe piene,
      // e il corpo va dal primo all'ultimo di questi)
      const ordinate = Array.from(perRiga.subarray(ya, yb)).sort((a, b) => a - b);
      const pieno = ordinate[Math.floor(ordinate.length * 0.75)] * 0.35;
      let ca = -1;
      let cb = -1;
      let da = -1;
      for (let y = ya; y <= yb; y++) {
        const densa = y < yb && perRiga[y] >= pieno;
        if (densa && da < 0) da = y;
        if (!densa && da >= 0) {
          if (y - da >= 3) {
            if (ca < 0) ca = da;
            cb = y;
          }
          da = -1;
        }
      }
      let totale = 0;
      for (let y = ya; y < yb; y++) totale += perRiga[y];
      if (ca < 0 || ordinate[ordinate.length - 1] > totale * 0.4) {
        // quasi tutto l'inchiostro sta su una riga sola: è una linea sottile (il bordo della cornice attorno alla
        // parola chiave, con la sua maniglia), non testo
        linee.push({alto: yb - ya, y: (ya + yb) / 2, parole: 0, estranei: 0, colonne, cornice: true});
        continue;
      }
      // il corpo misurato non può essere troppo lontano da metà dell'altezza della riga (una riga di sole maiuscole,
      // o con poche lettere, darebbe una misura sballata e quindi parole spezzate o incollate)
      const altoRiga = yb - ya;
      if (cb - ca < altoRiga * 0.3) {
        ca = Math.round(ya + altoRiga * 0.25);
        cb = Math.round(ya + altoRiga * 0.75);
      }
      const corpo = Math.min(Math.max(cb - ca, altoRiga * 0.4), altoRiga * 0.62);
      const col = new Uint8Array(SL);
      for (let y = ca; y < cb; y++) for (let x = 0; x < SL; x++) if (inchiostro[y * SL + x]) col[x] = 1;
      // una parola finisce dove c'è un vuoto largo almeno 0,42 volte il corpo delle lettere: tra due lettere il vuoto è
      // meno di un quarto del corpo, tra due parole più di due terzi
      const vuoto = Math.max(4, Math.round(corpo * 0.42));
      const blocchi = []; // [da, a]: le parole (e tutto quello che ci somiglia) lungo la riga
      let dentro = false;
      let buco = 0;
      let da0 = 0;
      let ultimo = 0;
      for (let x = 0; x <= SL; x++) {
        if (x < SL && col[x]) {
          if (!dentro) {
            dentro = true;
            da0 = x;
          }
          ultimo = x;
          buco = 0;
        } else if (dentro && (x === SL || ++buco >= vuoto)) {
          dentro = false;
          // un segno più stretto di mezzo corpo non è una parola (una virgola staccata, un bordo della cornice)
          if (ultimo + 1 - da0 >= corpo * 0.5) blocchi.push([da0, ultimo + 1]);
          buco = 0;
        }
      }
      if (!blocchi.length) {
        linee.push({alto: yb - ya, y: (ya + yb) / 2, parole: 0, estranei: 1, colonne});
        continue;
      }
      // la scritta è centrata: si parte dal blocco più vicino al centro e ci si allarga finché i vuoti sono da
      // spazio tra parole. Quello che resta più lontano non è sottotitolo: è il palco che entra nella fascia.
      let centro = 0;
      for (let k = 1; k < blocchi.length; k++) {
        const dist = (b) => Math.max(0, b[0] - SL / 2, SL / 2 - b[1]);
        if (dist(blocchi[k]) < dist(blocchi[centro])) centro = k;
      }
      let primo = centro;
      let fine = centro;
      while (primo > 0 && blocchi[primo][0] - blocchi[primo - 1][1] <= corpo * 2.2) primo--;
      while (fine < blocchi.length - 1 && blocchi[fine + 1][0] - blocchi[fine][1] <= corpo * 2.2) fine++;
      estranei += blocchi.length - (fine - primo + 1);
      parole += fine - primo + 1;
      for (let k = primo; k <= fine; k++) for (let x = blocchi[k][0]; x < blocchi[k][1]; x++) colonne[x] = 1;
      linee.push({alto: yb - ya, y: (ya + yb) / 2, parole, estranei, colonne});
    }
    // contrasto come lo definisce l'accessibilità del web: (chiaro + 0,05) / (scuro + 0,05), in luce lineare
    const lin = (v) => (v / 255) ** 2.2;
    const contrasto = (lin(lumaTesto / quanti) + 0.05) / (lin(lumaFondo / (SL * SA - quanti)) + 0.05);
    serie.push({linee, contrasto});
  });

  // Quali righe sono sottotitoli? Quelle alte come le lettere dei sottotitoli di questo video (l'altezza più
  // frequente). Il resto che passa nella fascia (una fila di luci, il bordo di un oggetto) è palco, e si conta a parte.
  // (per ogni fotogramma conta la riga più larga: maniglie e puntini non devono abbassare la misura)
  const largaLinea = (l) => l.colonne.reduce((t, c) => t + c, 0);
  const alti = serie.map((s) => (s.linee ?? []).filter((l) => l.parole > 0).sort((a, b) => largaLinea(b) - largaLinea(a))[0]?.alto).filter(Boolean);
  const altoTipico = mediana(alti) ?? 0;
  const yTipico = mediana(serie.map((s) => (s.linee ?? []).filter((l) => l.parole > 0).sort((a, b) => largaLinea(b) - largaLinea(a))[0]?.y).filter(Boolean)) ?? 0;
  for (const s of serie) {
    // (una riga bassa, stretta o lontana dalla riga dei sottotitoli, non è testo: sono le maniglie tonde della cornice
    // attorno alla parola chiave, con un pezzo del suo bordo)
    const buone = (s.linee ?? []).filter((l) => l.parole > 0 && l.alto >= altoTipico * 0.45 && l.alto <= altoTipico * 1.9 && !(l.alto < altoTipico * 0.62 && (largaLinea(l) < altoTipico * 1.2 || Math.abs(l.y - yTipico) > altoTipico * 0.6)));
    s.parole = buone.reduce((t, l) => t + l.parole, 0);
    s.estranei = (s.linee ?? []).reduce((t, l) => t + (l.cornice ? 0 : buone.includes(l) ? l.estranei : Math.max(1, l.parole)), 0);
    s.righe = buone.length;
    s.alto = buone.length ? Math.max(...buone.map((l) => l.alto)) / SA : 0;
    s.cy = buone.length ? media(buone.map((l) => l.y)) / SA : 0;
    s.colonne = new Uint8Array(SL);
    let sx = 0;
    let larghi = 0;
    for (const l of buone) for (let x = 0; x < SL; x++) if (l.colonne[x]) s.colonne[x] = 1;
    for (let x = 0; x < SL; x++) {
      if (s.colonne[x]) {
        sx += x;
        larghi++;
      }
    }
    s.cx = larghi ? sx / larghi / SL : 0.5;
  }

  // il conteggio di un fotogramma può sbagliare mentre una parola entra: vale la mediana di cinque fotogrammi,
  // e un valore che dura meno di un sesto di secondo è uno sbaglio, non una parola
  const conta = serie.map((s, i) => {
    const intorno = serie.slice(Math.max(0, i - 2), i + 3).map((x) => x.parole).sort((a, b) => a - b);
    return intorno[Math.floor(intorno.length / 2)];
  });
  const BREVE = Math.max(3, Math.round(fps / 6));
  for (let i = 0; i < conta.length; ) {
    let j = i;
    while (j < conta.length && conta[j] === conta[i]) j++;
    if (j - i < BREVE && i > 0 && conta[i] > 0 && conta[i - 1] > 0) for (let k = i; k < j; k++) conta[k] = conta[i - 1];
    i = j;
  }
  const larga = serie.map((s) => s.colonne.reduce((t, c) => t + c, 0));
  // pagine: dentro una pagina le parole si aggiungono (il testo è centrato, quindi si sposta: non si può guardare
  // dove sta). Comincia una pagina nuova quando le parole calano, o restano tante ma la scritta cambia larghezza.
  const pagine = [];
  const eventi = []; // {t, parole}: quando compaiono parole nuove
  let pagina = null;
  for (let i = 0; i < serie.length; i++) {
    const n = conta[i];
    if (!n) {
      pagina = null;
      continue;
    }
    const w = larga[i];
    let nuova = !pagina;
    if (pagina) {
      // le parole calano: pagina nuova. (Un calo di una sola, restando sopra uno, è il conteggio che si corregge:
      // una pagina nuova comincia quasi sempre da una parola.)
      if (n < pagina.adesso && (n === 1 || pagina.adesso - n >= 2)) nuova = true;
      else if (n < pagina.adesso) pagina.adesso = n;
      else if (n === pagina.adesso) {
        // stesse parole ma larghezza diversa, e resta diversa: è un'altra scritta
        const diversa = Math.abs(w - pagina.larga) / Math.max(1, Math.max(w, pagina.larga)) > 0.25;
        pagina.diversi = diversa ? pagina.diversi + 1 : 0;
        if (pagina.diversi >= BREVE && i - pagina.ultimoCambio > BREVE * 2) nuova = true;
      }
    }
    if (nuova) {
      pagina = {da: i / fps, parole: n, adesso: n, larga: w, fotogrammi: 1, ultimoCambio: i, diversi: 0, tempi: {}};
      pagine.push(pagina);
      eventi.push({t: i / fps, parole: n});
    } else {
      pagina.fotogrammi++;
      if (n > pagina.adesso) {
        eventi.push({t: i / fps, parole: n - pagina.adesso});
        pagina.adesso = n;
        pagina.parole = Math.max(pagina.parole, n);
        pagina.ultimoCambio = i;
        pagina.diversi = 0;
      }
      // la larghezza di riferimento si prende a parola entrata (per qualche fotogramma sta ancora crescendo)
      if (i - pagina.ultimoCambio === BREVE) pagina.larga = w;
    }
    pagina.tempi[n] = (pagina.tempi[n] ?? 0) + 1;
  }
  // le parole di una pagina: il numero più alto rimasto a schermo almeno un quarto di secondo (un numero più alto
  // visto per meno è uno sbaglio di conteggio); se nessuno dura tanto, quello rimasto più a lungo
  for (const p of pagine) {
    const durati = Object.entries(p.tempi).map(([k, f]) => [Number(k), f]);
    const lunghi = durati.filter(([, f]) => f >= fps / 4).map(([k]) => k);
    p.parole = lunghi.length ? Math.max(...lunghi) : durati.sort((a, b) => b[1] - a[1])[0][0];
  }
  // una "pagina" di uno o due fotogrammi è un passaggio (il testo che entra), non una pagina vera
  const vere = pagine.filter((p) => p.fotogrammi >= 3);
  const conTesto = serie.filter((s) => s.parole > 0);
  const paroleTotali = vere.reduce((s, p) => s + p.parole, 0);
  const durata = serie.length / fps;
  if (conTesto.length < fps) return {presenti: false, eventi: []};
  return {
    presenti: true,
    posizioneY: arr(z.y0 + media(conTesto.map((s) => s.cy)) * (z.y1 - z.y0), 3),
    posizioneX: arr(z.x0 + media(conTesto.map((s) => s.cx)) * (z.x1 - z.x0), 3),
    altezzaLettere: arr(mediana(conTesto.map((s) => s.alto)) * (z.y1 - z.y0), 4),
    pagine: vere.length,
    paroleContate: paroleTotali,
    paroleAlMinuto: arr((paroleTotali / durata) * 60, 0),
    paroleInsiemeMedia: arr(media(vere.map((p) => p.parole)), 2),
    paroleInsiemeMassimo: Math.round(quantile(vere.map((p) => p.parole), 0.98) ?? 0),
    invasaPercento: arr((conTesto.filter((s) => s.estranei > 0).length / conTesto.length) * 100, 1),
    duePiuRighePercento: arr((conTesto.filter((s) => s.righe > 1).length / conTesto.length) * 100, 1),
    aSchermoPercento: arr((conTesto.length / serie.length) * 100, 1),
    contrasto: arr(mediana(conTesto.map((s) => s.contrasto)), 1),
    contrastoMinimo: arr(quantile(conTesto.map((s) => s.contrasto), 0.1), 1),
    eventi: eventi.filter((e) => vere.some((p) => e.t >= p.da && e.t < p.da + p.fotogrammi / fps)),
  };
}

// ───────────────────────── 3 · narratore ─────────────────────────

const NL = 40;
const NA = 48;
const NFPS = 10;

async function misuraNarratore(ff, file) {
  const z = ZONE.narratore;
  const firme = [];
  const densita = [];
  await grezzo(ff, ['-i', file, '-map', '0:v:0', '-vf', `fps=${NFPS},${ritaglio(z)},scale=${NL}:${NA}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'gray'], NL * NA, (Y) => {
    // i contorni della figura: resistono al cambio di colore dello sfondo
    const bordi = new Float32Array(NL * NA);
    let forti = 0;
    for (let y = 1; y < NA - 1; y++) {
      for (let x = 1; x < NL - 1; x++) {
        const gx = Y[y * NL + x + 1] - Y[y * NL + x - 1];
        const gy = Y[(y + 1) * NL + x] - Y[(y - 1) * NL + x];
        const g = Math.min(1, Math.hypot(gx, gy) / 120);
        bordi[y * NL + x] = g;
        if (g > 0.3) forti++;
      }
    }
    // un poco sfocati: un pixel di differenza (il respiro, la bocca) non deve contare come un'altra posa
    const morbidi = new Float32Array(NL * NA);
    for (let y = 1; y < NA - 1; y++) {
      for (let x = 1; x < NL - 1; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += bordi[(y + dy) * NL + x + dx];
        morbidi[y * NL + x] = s / 9;
      }
    }
    firme.push(morbidi);
    densita.push(forti / (NL * NA));
  });
  const presenza = media(densita) ?? 0;
  if (presenza < 0.05) return {presente: false, contorni: arr(presenza, 3)};
  // distanza tra due firme: 0 = uguali, 1 = niente in comune
  const distanza = (a, b) => {
    let ab = 0;
    let aa = 0;
    let bb = 0;
    for (let i = 0; i < a.length; i++) {
      ab += a[i] * b[i];
      aa += a[i] * a[i];
      bb += b[i] * b[i];
    }
    return 1 - ab / Math.sqrt(aa * bb || 1);
  };
  // tratti: finché la figura resta vicina a com'era all'inizio del tratto è la stessa posa
  const CAMBIO = 0.045;
  const tratti = [];
  let tratto = {da: 0, base: firme[0], somma: Float32Array.from(firme[0]), n: 1};
  let diversi = 0;
  for (let i = 1; i < firme.length; i++) {
    if (distanza(firme[i], tratto.base) > CAMBIO) diversi++;
    else diversi = 0;
    if (diversi >= 3) {
      // la posa è cambiata tre campioni fa
      const inizio = i - 2;
      tratti.push({...tratto, a: inizio});
      tratto = {da: inizio, base: firme[i], somma: new Float32Array(NL * NA), n: 0};
      diversi = 0;
    }
    for (let k = 0; k < tratto.somma.length; k++) tratto.somma[k] += firme[i][k];
    tratto.n++;
  }
  tratti.push({...tratto, a: firme.length});
  // pose diverse: i tratti che si somigliano sono la stessa posa ripresa più tardi
  const pose = [];
  for (const t of tratti) {
    const firma = t.somma.map((v) => v / Math.max(1, t.n));
    const uguale = pose.find((p) => distanza(p.firma, firma) < CAMBIO * 0.8);
    if (uguale) uguale.secondi += (t.a - t.da) / NFPS;
    else pose.push({firma, secondi: (t.a - t.da) / NFPS});
  }
  const durate = tratti.map((t) => (t.a - t.da) / NFPS);
  return {
    presente: true,
    contorni: arr(presenza, 3),
    poseDiverse: pose.filter((p) => p.secondi >= 0.5).length,
    cambi: tratti.length - 1,
    cambiAlMinuto: arr(((tratti.length - 1) / (firme.length / NFPS)) * 60, 1),
    stessaPosaMediana: arr(mediana(durate)),
    stessaPosaMassimo: arr(Math.max(...durate)),
  };
}

// ───────────────────────── 4 · audio ─────────────────────────

const HZ = 16000;
const FINESTRA = 160; // 10 ms

async function inviluppo(ff, file, filtro) {
  const energie = [];
  await grezzo(ff, ['-i', file, '-map', '0:a:0', '-af', filtro, '-ac', '1', '-ar', String(HZ), '-f', 's16le'], FINESTRA * 2, (pezzo) => {
    let s = 0;
    for (let i = 0; i < FINESTRA; i++) {
      const v = pezzo.readInt16LE(i * 2) / 32768;
      s += v * v;
    }
    energie.push(10 * Math.log10(s / FINESTRA + 1e-10));
  });
  return energie;
}

async function misuraAudio(ff, file, eventi) {
  const info = infoMedia(ff, file);
  if (!info.audio) return {presente: false};
  // volume come lo misurano le piattaforme
  const r = spawnSync(ff.percorso, ['-hide_banner', '-nostdin', '-i', file, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});
  const testo = r.stderr ?? '';
  const riassunto = testo.slice(testo.lastIndexOf('Summary:'));
  const numero = (re) => {
    const m = re.exec(riassunto);
    return m ? Number(m[1]) : null;
  };
  const lufs = numero(/I:\s*(-?[\d.]+) LUFS/);
  const momenti = [...testo.matchAll(/ M:\s*(-?[\d.]+) S:/g)].map((m) => Number(m[1]));
  if (lufs === null || lufs < -60) return {presente: true, muto: true};
  const voce = await inviluppo(ff, file, 'highpass=f=250,lowpass=f=3500');
  const acuti = await inviluppo(ff, file, 'highpass=f=6000');
  // attacchi della voce: quando l'energia sale di colpo
  const liscio = voce.map((_, i) => media(voce.slice(Math.max(0, i - 2), i + 3)));
  const attacchi = liscio.map((v, i) => (i >= 4 ? Math.max(0, v - liscio[i - 4]) : 0));
  // ritardo dei sottotitoli: di quanto vanno spostati perché le parole che compaiono coincidano con gli attacchi
  let ritardo = null;
  let forza = null;
  if (eventi.length >= 20) {
    const treno = new Float32Array(attacchi.length);
    for (const e of eventi) {
      const k = Math.round(e.t * 100);
      for (let d = -3; d <= 3; d++) if (k + d >= 0 && k + d < treno.length) treno[k + d] += Math.exp(-(d * d) / 4);
    }
    const mediaA = media(attacchi);
    let migliore = -Infinity;
    const valori = [];
    for (let spost = -60; spost <= 60; spost++) {
      // spost > 0: la parola compare DOPO l'attacco della voce
      let s = 0;
      for (let i = Math.max(0, spost); i < treno.length + Math.min(0, spost); i++) s += treno[i] * (attacchi[i - spost] - mediaA);
      valori.push(s);
      if (s > migliore) {
        migliore = s;
        ritardo = spost / 100;
      }
    }
    // quanto è netto il picco: rispetto alla dispersione dei valori agli altri spostamenti
    const m = media(valori);
    const dev = Math.sqrt(media(valori.map((v) => (v - m) ** 2)));
    forza = dev ? (migliore - m) / dev : 0;
  }
  // parlato: quanta parte del tempo c'è voce, e le sillabe (i picchi dell'energia)
  const tetto = quantile(liscio, 0.95);
  const parla = liscio.filter((v) => v > tetto - 25).length / liscio.length;
  let sillabe = 0;
  let ultima = -100;
  for (let i = 3; i < liscio.length - 3; i++) {
    if (liscio[i] > tetto - 22 && liscio[i] >= liscio[i - 1] && liscio[i] > liscio[i + 1] && liscio[i] - Math.min(liscio[i - 3], liscio[i + 3]) > 2.5 && i - ultima >= 9) {
      sillabe++;
      ultima = i;
    }
  }
  // musica: se nelle pause della voce il volume non scende, sotto c'è un tappeto
  const udibili = momenti.filter((v) => v > -70);
  const fondo = quantile(udibili, 0.05);
  // effetti: colpi negli acuti molto più forti del solito (le "s" della voce stanno sotto)
  const baseAcuti = mediana(acuti);
  let colpi = 0;
  ultima = -100;
  for (let i = 1; i < acuti.length - 1; i++) {
    if (acuti[i] > baseAcuti + 22 && acuti[i] >= acuti[i - 1] && acuti[i] > acuti[i + 1] && i - ultima >= 30) {
      colpi++;
      ultima = i;
    }
  }
  const durata = voce.length / 100;
  // senza voce (un video muto con i soli effetti) volume, ritardo ed effetti non dicono niente: non si giudicano
  if (sillabe / durata < 1) return {presente: true, muto: false, senzaVoce: true, soloEffetti: {lufs: arr(lufs, 1), colpiAcutiAlMinuto: arr((colpi / durata) * 60, 1)}};
  return {
    presente: true,
    muto: false,
    senzaVoce: false,
    lufs: arr(lufs, 1),
    escursione: arr(numero(/LRA:\s*(-?[\d.]+) LU/), 1),
    picco: arr(numero(/Peak:\s*(-?[\d.]+) dBFS/), 1),
    fondoLufs: arr(fondo, 1),
    fondoSottoLaVoce: arr(lufs - fondo, 1),
    musica: fondo !== null && lufs - fondo < 14,
    vocePercento: arr(parla * 100, 0),
    sillabeAlSecondo: arr(sillabe / durata, 2),
    colpiAcutiAlMinuto: arr((colpi / durata) * 60, 1),
    ritardoSottotitoli: arr(ritardo, 2),
    ritardoNettezza: arr(forza, 1),
  };
}

// ───────────────────────── misura completa ─────────────────────────

/** Misura un video. Restituisce solo numeri (niente date, niente percorsi assoluti): stesso file, stesso risultato. */
export async function misura(file) {
  if (!fs.existsSync(file)) throw new ErroreFmlab(`Non trovo il video ${file}`);
  const ff = await trovaFfmpeg();
  const info = infoMedia(ff, file);
  if (!info.video) throw new ErroreFmlab(`${file} non contiene una traccia video.`);
  const fps = info.video.fps || 30;
  const scena = await misuraScena(ff, file, fps);
  const sottotitoli = await misuraSottotitoli(ff, file, fps, info.video.larghezza, info.video.altezza);
  const narratore = await misuraNarratore(ff, file);
  const {eventi, ...sub} = sottotitoli;
  const audio = await misuraAudio(ff, file, eventi ?? []);
  return {
    metro: VERSIONE_METRO,
    formato: {larghezza: info.video.larghezza, altezza: info.video.altezza, fps, durata: scena.durata, fotogrammi: scena.fotogrammi},
    tagli: scena.tagli,
    novita: scena.novita,
    palco: scena.palco,
    colori: scena.colori,
    sottotitoli: sub,
    narratore,
    audio,
  };
}

// ───────────────────────── tabella e soglie ─────────────────────────

/**
 * Le misure che hanno una soglia: [chiave, etichetta, unità, verso].
 * verso: 'max' = non deve superare · 'min' = non deve stare sotto · 'tra' = dentro l'intervallo dei riferimenti.
 * Le soglie si calcolano dai riferimenti (calcolaSoglie) e si leggono da riferimenti/misure.json.
 */
export const VOCI = [
  ['tagli.quanti', 'Tagli netti', '', 'max'],
  ['novita.intervalloMediano', 'Secondi tra due novità (mediana)', 's', 'max'],
  ['novita.intervalloP90', 'Secondi tra due novità (9 volte su 10 meno di)', 's', 'max'],
  ['novita.intervalloMassimo', 'Attesa più lunga senza novità', 's', 'max'],
  ['palco.occupato', 'Palco occupato (media)', '0-1', 'min'],
  ['palco.occupatoMinimo', 'Palco occupato (nei momenti più vuoti)', '0-1', 'min'],
  ['palco.dettaglio', 'Dettaglio del disegno sul palco', '%', 'min'],
  ['palco.movimento', 'Movimento sul palco', '%', 'min'],
  ['palco.fermoPercento', 'Tempo con il palco fermo', '%', 'max'],
  ['palco.fermoMassimo', 'Fermo più lungo', 's', 'max'],
  ['colori.luminosita', 'Luminosità media (fondo scuro)', '0-1', 'tra'],
  ['colori.tinteDiverse', 'Tinte diverse lungo il video', '', 'min'],
  ['sottotitoli.posizioneY', 'Sottotitoli: altezza sul fotogramma', '0-1', 'tra'],
  ['sottotitoli.altezzaLettere', 'Sottotitoli: altezza delle lettere', '0-1', 'tra'],
  ['sottotitoli.paroleInsiemeMedia', 'Sottotitoli: parole a schermo insieme (media)', '', 'tra'],
  ['sottotitoli.paroleInsiemeMassimo', 'Sottotitoli: parole a schermo insieme (massimo)', '', 'max'],
  ['sottotitoli.invasaPercento', 'Sottotitoli: tempo con altro nella loro fascia', '%', 'max'],
  ['sottotitoli.contrastoMinimo', 'Sottotitoli: contrasto nei momenti peggiori', ':1', 'min'],
  ['sottotitoli.paroleAlMinuto', 'Parole al minuto (contate dai sottotitoli)', '', 'tra'],
  ['audio.ritardoSottotitoli', 'Ritardo dei sottotitoli sulla voce', 's', 'tra'],
  ['narratore.poseDiverse', 'Narratore: pose diverse', '', 'min'],
  ['narratore.cambiAlMinuto', 'Narratore: cambi di posa al minuto', '', 'min'],
  ['narratore.stessaPosaMediana', 'Narratore: secondi nella stessa posa (mediana)', 's', 'max'],
  ['narratore.stessaPosaMassimo', 'Narratore: posa tenuta più a lungo', 's', 'max'],
  ['audio.lufs', 'Volume', 'LUFS', 'tra'],
  ['audio.escursione', 'Escursione del volume', 'LU', 'max'],
  ['audio.fondoSottoLaVoce', 'Fondo sotto la voce (meno = più musica)', 'LU', 'max'],
  ['audio.colpiAcutiAlMinuto', 'Effetti: colpi acuti al minuto', '', 'min'],
];

const prendi = (oggetto, chiave) => chiave.split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), oggetto);

/**
 * Dai numeri dei riferimenti alle soglie. `margine` allarga l'intervallo (0,15 = 15% oltre il riferimento più
 * permissivo): un reel del kit non deve essere identico a un riferimento, deve starci vicino.
 */
export function calcolaSoglie(riferimenti, margine = 0.15) {
  const soglie = {};
  for (const [chiave, , , verso] of VOCI) {
    const valori = riferimenti.map((r) => prendi(r, chiave)).filter((v) => typeof v === 'number');
    if (!valori.length) continue;
    const mn = Math.min(...valori);
    const mx = Math.max(...valori);
    // il margine si prende sull'ampiezza del valore; per i valori attorno a zero (un ritardo, un taglio) è fisso
    const largo = (v) => Math.max(Math.abs(v) * margine, chiave === 'audio.ritardoSottotitoli' ? 0.05 : 0);
    if (verso === 'max') soglie[chiave] = {max: arr(mx + largo(mx), 3)};
    else if (verso === 'min') soglie[chiave] = {min: arr(mn - largo(mn), 3)};
    else soglie[chiave] = {min: arr(mn - largo(mn), 3), max: arr(mx + largo(mx), 3)};
  }
  return soglie;
}

/** Giudica una misura con le soglie: {dentro, fuori: [...], nonMisurate: [...]}. */
export function giudica(m, soglie) {
  const righe = [];
  for (const [chiave, etichetta, unita] of VOCI) {
    const valore = prendi(m, chiave);
    const soglia = soglie?.[chiave] ?? null;
    let esito = '·';
    if (typeof valore !== 'number') esito = '—';
    else if (soglia) esito = (soglia.min === undefined || valore >= soglia.min) && (soglia.max === undefined || valore <= soglia.max) ? 'ok' : 'NO';
    righe.push({chiave, etichetta, unita, valore: typeof valore === 'number' ? valore : null, soglia, esito});
  }
  return righe;
}

const scrivi = (v) => (v === null || v === undefined ? '—' : String(v).replace('.', ','));
function scriviSoglia(s) {
  if (!s) return '';
  if (s.min !== undefined && s.max !== undefined) return `da ${scrivi(s.min)} a ${scrivi(s.max)}`;
  return s.min !== undefined ? `almeno ${scrivi(s.min)}` : `al massimo ${scrivi(s.max)}`;
}

export function tabella(nome, m, soglie) {
  const righe = giudica(m, soglie);
  const f = m.formato;
  const testa = [`\n${nome}  ·  ${f.larghezza}×${f.altezza}, ${scrivi(f.fps)} fotogrammi al secondo, ${scrivi(f.durata)} s`, ''];
  const larga = Math.max(...righe.map((r) => r.etichetta.length));
  for (const r of righe) {
    const valore = `${scrivi(r.valore)}${r.valore !== null && r.unita && !['0-1'].includes(r.unita) ? ' ' + r.unita : ''}`;
    testa.push(`  ${r.esito.padEnd(2)}  ${r.etichetta.padEnd(larga)}  ${valore.padStart(10)}   ${scriviSoglia(r.soglia)}`);
  }
  const altro = [];
  if (m.colori.tinte.length) altro.push(`tinte: ${m.colori.tinte.slice(0, 4).map((t) => `${t.tinta} ${t.percento}%`).join(', ')}`);
  if (m.sottotitoli.presenti) altro.push(`sottotitoli: ${m.sottotitoli.pagine} pagine, ${m.sottotitoli.paroleContate} parole, contrasto ${scrivi(m.sottotitoli.contrasto)}:1`);
  else altro.push('sottotitoli: non trovati nella fascia in alto');
  if (!m.narratore.presente) altro.push('narratore: non c\'è');
  if (!m.audio.presente) altro.push('audio: nessuna traccia');
  else if (m.audio.muto) altro.push('audio: silenzio (niente voce: volume, ritardo ed effetti non si possono misurare)');
  else if (m.audio.senzaVoce) altro.push(`audio: solo effetti sonori, nessuna voce (${scrivi(m.audio.soloEffetti.lufs)} LUFS): volume, ritardo e musica si misurano solo con la voce vera`);
  else altro.push(`audio: ${m.audio.musica ? 'con musica o tappeto sotto la voce' : 'voce su silenzio'}, voce per il ${scrivi(m.audio.vocePercento)}% del tempo, ${scrivi(m.audio.sillabeAlSecondo)} sillabe al secondo, nettezza del ritardo ${scrivi(m.audio.ritardoNettezza)}`);
  const fuori = righe.filter((r) => r.esito === 'NO');
  const dentro = righe.filter((r) => r.esito === 'ok');
  const coda = soglie ? [`\n  ${dentro.length} misure dentro le soglie, ${fuori.length} fuori${righe.some((r) => r.esito === '—') ? `, ${righe.filter((r) => r.esito === '—').length} non misurabili su questo video` : ''}.`] : ['\n  (nessuna soglia: manca riferimenti/misure.json — crealo con  npm run confronta riferimenti)'];
  return [...testa, '', ...altro.map((a) => `  ${a}`), ...coda, ''].join('\n');
}

/** npm run confronta <file.mp4 | reel | riferimenti> [json] */
export async function comandoConfronta(argomenti = []) {
  const json = argomenti.includes('json');
  const cosa = argomenti.filter((a) => a !== 'json')[0];
  if (!cosa) throw new ErroreFmlab('Uso:  npm run confronta <file.mp4>   ·   npm run confronta <reel>   ·   npm run confronta riferimenti');
  const cartella = path.join(RADICE, 'riferimenti');
  if (cosa === 'riferimenti') {
    const video = fs.existsSync(cartella) ? fs.readdirSync(cartella).filter((f) => /\.(mp4|mov|m4v)$/i.test(f)).sort() : [];
    if (!video.length) throw new ErroreFmlab('In riferimenti/ non c\'è nessun video. Mettici i video di riferimento (mp4) e riprova.');
    const misure = {};
    for (const f of video) {
      if (!json) console.log(`Misuro ${f}…`);
      misure[f.replace(/\.[^.]+$/, '')] = await misura(path.join(cartella, f));
    }
    const margine = fs.existsSync(FILE_MISURE) ? (leggiJson(FILE_MISURE).margine ?? 0.15) : 0.15;
    const soglie = calcolaSoglie(Object.values(misure), margine);
    const dati = {
      cosa: 'Misure dei video di riferimento e soglie che ne derivano. Si rifà con: npm run confronta riferimenti',
      metro: VERSIONE_METRO,
      zone: ZONE,
      margine,
      soglie,
      riferimenti: misure,
    };
    scriviJson(FILE_MISURE, dati);
    if (json) return console.log(JSON.stringify(dati, null, 2));
    for (const [nome, m] of Object.entries(misure)) console.log(tabella(nome, m, soglie));
    console.log(`Soglie salvate in ${rel(FILE_MISURE)} (margine ${String(margine).replace('.', ',')}: si cambia in quel file).`);
    return dati;
  }
  let file = cosa;
  if (!fs.existsSync(file) && elencoReel().includes(cosa)) file = path.join(CARTELLA_REELS, cosa, `${cosa}.mp4`);
  if (!fs.existsSync(file)) throw new ErroreFmlab(`Non trovo "${cosa}": indica un file video, il nome di un reel con il video già fatto (${elencoReel().join(', ')}), oppure "riferimenti".`);
  const m = await misura(file);
  const soglie = fs.existsSync(FILE_MISURE) ? leggiJson(FILE_MISURE).soglie : null;
  if (json) return console.log(JSON.stringify({misura: m, giudizio: giudica(m, soglie)}, null, 2));
  console.log(tabella(path.basename(file), m, soglie));
  return {misura: m, giudizio: giudica(m, soglie)};
}
