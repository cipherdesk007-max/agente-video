// FMLAB Reel Kit — labiale: dalla parola pronunciata in questo istante alla forma della bocca.
import type {Parola} from './tempo';
import {parolaAllIstante} from './tempo';
import {casuale, impulso} from './anim';

export type FormaBocca = {
  /** 0 = chiusa, 1 = spalancata. */
  apertura: number;
  /** 0 = stretta (u), 1 = larga (i, e). */
  larghezza: number;
};

const RIPOSO: FormaBocca = {apertura: 0, larghezza: 0.62};

const FORME: Record<string, FormaBocca> = {
  a: {apertura: 1, larghezza: 0.72},
  e: {apertura: 0.62, larghezza: 0.92},
  i: {apertura: 0.36, larghezza: 1},
  o: {apertura: 0.82, larghezza: 0.28},
  u: {apertura: 0.5, larghezza: 0.1},
  m: {apertura: 0, larghezza: 0.5},
  b: {apertura: 0, larghezza: 0.5},
  p: {apertura: 0, larghezza: 0.5},
  f: {apertura: 0.12, larghezza: 0.62},
  v: {apertura: 0.12, larghezza: 0.62},
};
const ALTRA: FormaBocca = {apertura: 0.24, larghezza: 0.62};

function senzaAccenti(c: string): string {
  return c.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function campione(parole: Parola[], ora: number): FormaBocca {
  const i = parolaAllIstante(parole, ora);
  if (i < 0) return RIPOSO;
  const p = parole[i];
  const lettere = senzaAccenti(p.testo.toLowerCase()).replace(/[^a-z]/g, '');
  if (!lettere) return RIPOSO;
  const avanzamento = (ora - p.inizio) / Math.max(0.001, p.fine - p.inizio);
  const k = Math.min(lettere.length - 1, Math.floor(avanzamento * lettere.length));
  return FORME[lettere[k]] ?? ALTRA;
}

/**
 * Forma della bocca all'istante `ora`. È una media su cinque istanti vicini (prima e dopo): così la bocca si
 * muove al ritmo delle sillabe, non lettera per lettera, e non "sfarfalla".
 */
export function formaBocca(parole: Parola[], ora: number): FormaBocca {
  const pesi: [number, number][] = [
    [-0.066, 1],
    [-0.033, 2],
    [0, 3],
    [0.033, 2],
    [0.066, 1],
  ];
  let apertura = 0;
  let larghezza = 0;
  for (const [dt, peso] of pesi) {
    const f = campione(parole, ora + dt);
    apertura += (f.apertura * peso) / 9;
    larghezza += (f.larghezza * peso) / 9;
  }
  return {apertura, larghezza};
}

/** Quanto sta parlando in questo momento (0…1), per i piccoli movimenti della testa. */
export function energiaVoce(parole: Parola[], ora: number): number {
  let somma = 0;
  const campioni = 6;
  for (let k = 0; k < campioni; k++) {
    if (parolaAllIstante(parole, ora - 0.22 + (k * 0.27) / (campioni - 1)) >= 0) somma += 1;
  }
  return somma / campioni;
}

/** true se la parola pronunciata ora era in *enfasi* nel copione (sopracciglia su). */
export function enfasiOra(parole: Parola[], ora: number): number {
  let somma = 0;
  for (const dt of [0, -0.06, -0.12]) {
    const i = parolaAllIstante(parole, ora + dt);
    if (i >= 0 && parole[i].enfasi) somma += 1 / 3;
  }
  return somma;
}

/** Battito di ciglia: 0 = occhi aperti, 1 = chiusi. Un battito ogni 3 secondi circa, sempre negli stessi istanti. */
export function battito(ora: number): number {
  const passo = 3.1;
  const base = Math.floor((ora - 1.2) / passo);
  let chiusura = 0;
  for (const k of [base - 1, base, base + 1]) {
    if (k < 0) continue;
    const istante = 1.2 + k * passo + casuale(k + 7) * 1.3;
    chiusura = Math.max(chiusura, impulso(ora - istante, 0.17));
  }
  return chiusura;
}

/**
 * Gli istanti in cui sbatte le palpebre lungo tutto il reel, come fa una persona: a intervalli irregolari
 * (tra 2 e 5 secondi), ogni tanto due volte di fila, e sempre quando cambia posa o gira la testa (`extra`).
 * È una lista fissa: stesso reel, stessi battiti.
 */
export function listaBattiti(durata: number, extra: number[] = []): number[] {
  const istanti: number[] = [];
  let t = 1.1;
  let k = 0;
  while (t < durata) {
    istanti.push(t);
    if (casuale(k + 31) < 0.22) istanti.push(t + 0.3); // doppio battito
    t += 2.1 + casuale(k + 7) * 2.9;
    k++;
  }
  for (const e of extra) {
    // un battito "in più" solo se non ce n'è già uno vicino
    if (e > 0.4 && e < durata && !istanti.some((x) => Math.abs(x - e) < 0.55)) istanti.push(e);
  }
  return istanti.sort((a, b) => a - b);
}

/** Chiusura delle palpebre (0 aperte, 1 chiuse) all'istante `ora`: si chiudono in fretta e si riaprono più piano. */
export function battitoDa(istanti: number[], ora: number): number {
  let chiusura = 0;
  for (const t of istanti) {
    const x = ora - t;
    if (x < 0) break;
    if (x > 0.24) continue;
    const v = x < 0.07 ? x / 0.07 : x < 0.1 ? 1 : 1 - (x - 0.1) / 0.14;
    chiusura = Math.max(chiusura, v);
  }
  return chiusura;
}

