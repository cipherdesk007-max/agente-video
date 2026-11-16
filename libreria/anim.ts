// FMLAB Reel Kit — mattoni di animazione. Sono tutte funzioni pure: stesso tempo, stesso risultato.
// Schema tipico in una scena:   const p = rampa(s.dopo('segno'), 0.4);   // 0 → 1 a partire dalla parola
import type {CSSProperties} from 'react';

export const limita = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

export type Curva = (p: number) => number;

export const curve = {
  lineare: (p: number) => p,
  /** Parte piano. */
  entra: (p: number) => p * p * p,
  /** Arriva piano (la più usata). */
  esce: (p: number) => 1 - Math.pow(1 - p, 3),
  /** Piano all'inizio e alla fine. */
  morbida: (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  /** Supera il traguardo e torna indietro: dà "peso". */
  slancio: (p: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
} satisfies Record<string, Curva>;

/** Da 0 a 1 in `durata` secondi, partendo quando x = 0. Prima vale 0, dopo vale 1. */
export function rampa(x: number, durata = 0.4, curva: Curva = curve.esce): number {
  if (durata <= 0) return x >= 0 ? 1 : 0;
  return curva(limita(x / durata));
}

/** Porta x dall'intervallo `da` all'intervallo `a` (con i bordi bloccati). */
export function mappa(x: number, da: [number, number], a: [number, number], curva: Curva = curve.lineare): number {
  const p = limita((x - da[0]) / (da[1] - da[0]));
  return mix(a[0], a[1], curva(p));
}

/**
 * Molla: da 0 a 1 con un piccolo rimbalzo, x = secondi trascorsi.
 * rigidita più alta = più veloce; smorzamento più basso = più rimbalzo.
 */
export function molla(x: number, {rigidita = 180, smorzamento = 16, massa = 1}: {rigidita?: number; smorzamento?: number; massa?: number} = {}): number {
  if (x <= 0) return 0;
  const w0 = Math.sqrt(rigidita / massa);
  const z = smorzamento / (2 * Math.sqrt(rigidita * massa));
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + ((z * w0) / wd) * Math.sin(wd * x));
  }
  return 1 - Math.exp(-w0 * x) * (1 + w0 * x);
}

/** Sale e scende: 0 → 1 → 0 in `durata` secondi (un "colpo"). */
export function impulso(x: number, durata = 0.5): number {
  return Math.sin(Math.PI * limita(x / durata));
}

/** Oscillazione continua tra -1 e 1. */
export function onda(t: number, periodo = 2, fase = 0): number {
  return Math.sin(2 * Math.PI * (t / periodo + fase));
}

/** Visibile da x = 0 per `durata` secondi, con entrata e uscita morbide. Restituisce 0…1. */
export function finestra(x: number, durata: number, {entra = 0.3, esce = 0.3}: {entra?: number; esce?: number} = {}): number {
  return rampa(x, entra) * (1 - rampa(x - (durata - esce), esce, curve.entra));
}

/** Numero "a caso" ma sempre uguale per lo stesso seme: 0 ≤ n < 1. */
export function casuale(seme: number): number {
  let t = (Math.floor(seme * 1000003) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export type Entrata = {
  /** Da dove arriva l'elemento. */
  da?: 'basso' | 'alto' | 'sinistra' | 'destra' | 'zoom' | 'nessuno';
  distanza?: number;
  durata?: number;
  /** true = arrivo con rimbalzo. */
  rimbalzo?: boolean;
};

/**
 * Stile CSS pronto per far entrare un elemento: opacità + spostamento.
 *   <div style={entrata(s.dopo('km'))}>…</div>
 */
export function entrata(x: number, {da = 'basso', distanza = 46, durata = 0.42, rimbalzo = true}: Entrata = {}): CSSProperties {
  const p = rimbalzo ? molla(x, {rigidita: 210, smorzamento: 17}) : rampa(x, durata);
  const opacita = rampa(x, Math.min(0.18, durata));
  const r = 1 - p;
  let trasformazione = '';
  if (da === 'basso') trasformazione = `translateY(${r * distanza}px)`;
  else if (da === 'alto') trasformazione = `translateY(${-r * distanza}px)`;
  else if (da === 'sinistra') trasformazione = `translateX(${-r * distanza}px)`;
  else if (da === 'destra') trasformazione = `translateX(${r * distanza}px)`;
  else if (da === 'zoom') trasformazione = `scale(${mix(0.6, 1, p)})`;
  return {opacity: opacita, transform: trasformazione || undefined, visibility: opacita <= 0 ? 'hidden' : undefined};
}

/**
 * Numero scritto come si usa nella lingua del reel: in italiano 20200 → "20.200" e 0.067 → "0,067";
 * in inglese "20,200" e "0.067".
 */
export function numero(valore: number, decimali = 0, lingua = 'it'): string {
  const inglese = lingua.toLowerCase().startsWith('en');
  const segno = valore < 0 ? '-' : '';
  const fisso = Math.abs(valore).toFixed(decimali);
  const [intero, frazione] = fisso.split('.');
  const conMigliaia = intero.replace(/\B(?=(\d{3})+(?!\d))/g, inglese ? ',' : '.');
  return segno + conMigliaia + (frazione ? (inglese ? '.' : ',') + frazione : '');
}
