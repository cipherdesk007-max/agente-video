// FMLAB Reel Kit — lettura, taglio e unione di file WAV (PCM 16 bit) senza programmi esterni.
import {ErroreFmlab} from './percorsi.mjs';

/** Legge un WAV e restituisce i campioni grezzi. Accetta i blocchi extra che macOS aggiunge (FLLR, LIST…). */
export function leggiWav(buffer) {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new ErroreFmlab('Il file audio non è un WAV valido.');
  }
  let pos = 12;
  let fmt = null;
  let dati = null;
  while (pos + 8 <= buffer.length) {
    const id = buffer.toString('ascii', pos, pos + 4);
    const dim = buffer.readUInt32LE(pos + 4);
    const inizio = pos + 8;
    if (id === 'fmt ') {
      fmt = {
        formato: buffer.readUInt16LE(inizio),
        canali: buffer.readUInt16LE(inizio + 2),
        frequenza: buffer.readUInt32LE(inizio + 4),
        bit: buffer.readUInt16LE(inizio + 14),
      };
    } else if (id === 'data') {
      const fine = dim === 0 || inizio + dim > buffer.length ? buffer.length : inizio + dim;
      dati = buffer.subarray(inizio, fine);
      break;
    }
    pos = inizio + dim + (dim % 2);
  }
  if (!fmt || !dati) throw new ErroreFmlab('WAV incompleto: mancano il formato o i dati.');
  if (fmt.bit !== 16 || (fmt.formato !== 1 && fmt.formato !== 0xfffe)) {
    throw new ErroreFmlab(`WAV non supportato (servono 16 bit PCM, trovati ${fmt.bit} bit, formato ${fmt.formato}).`);
  }
  const bytePerCampione = 2 * fmt.canali;
  const utili = dati.length - (dati.length % bytePerCampione);
  return {frequenza: fmt.frequenza, canali: fmt.canali, dati: dati.subarray(0, utili), durata: utili / bytePerCampione / fmt.frequenza};
}

/** Crea un WAV PCM 16 bit dai campioni grezzi. */
export function scriviWav(dati, frequenza, canali = 1) {
  const testa = Buffer.alloc(44);
  testa.write('RIFF', 0, 'ascii');
  testa.writeUInt32LE(36 + dati.length, 4);
  testa.write('WAVE', 8, 'ascii');
  testa.write('fmt ', 12, 'ascii');
  testa.writeUInt32LE(16, 16);
  testa.writeUInt16LE(1, 20);
  testa.writeUInt16LE(canali, 22);
  testa.writeUInt32LE(frequenza, 24);
  testa.writeUInt32LE(frequenza * canali * 2, 28);
  testa.writeUInt16LE(canali * 2, 32);
  testa.writeUInt16LE(16, 34);
  testa.write('data', 36, 'ascii');
  testa.writeUInt32LE(dati.length, 40);
  return Buffer.concat([testa, dati]);
}

export function silenzio(secondi, frequenza, canali = 1) {
  return Buffer.alloc(Math.max(0, Math.round(secondi * frequenza)) * 2 * canali);
}

/** Taglia i campioni tra due istanti (secondi). */
export function taglia(wav, da, a) {
  const passo = 2 * wav.canali;
  const i = Math.max(0, Math.round(da * wav.frequenza)) * passo;
  const f = Math.min(wav.dati.length, Math.max(0, Math.round(a * wav.frequenza)) * passo);
  return wav.dati.subarray(i, Math.max(i, f));
}

/**
 * Trova dove c'è voce: restituisce i tratti [inizio, fine] in secondi separati da silenzi
 * lunghi almeno `pausaMinima` secondi.
 */
export function trattiDiVoce(wav, {soglia = 0.02, finestra = 0.01, pausaMinima = 0.09} = {}) {
  const passo = 2 * wav.canali;
  const perFinestra = Math.max(1, Math.round(finestra * wav.frequenza));
  const totale = Math.floor(wav.dati.length / passo);
  const limite = soglia * 32768;
  const attive = [];
  for (let i = 0; i < totale; i += perFinestra) {
    let picco = 0;
    const fine = Math.min(totale, i + perFinestra);
    for (let k = i; k < fine; k++) {
      const v = Math.abs(wav.dati.readInt16LE(k * passo));
      if (v > picco) picco = v;
    }
    attive.push(picco > limite);
  }
  const tratti = [];
  let inizio = -1;
  let ultimoAttivo = -1;
  const pausaFinestre = Math.max(1, Math.round(pausaMinima / finestra));
  attive.forEach((attiva, k) => {
    if (attiva) {
      if (inizio < 0) inizio = k;
      ultimoAttivo = k;
    } else if (inizio >= 0 && k - ultimoAttivo >= pausaFinestre) {
      tratti.push([inizio * finestra, (ultimoAttivo + 1) * finestra]);
      inizio = -1;
    }
  });
  if (inizio >= 0) tratti.push([inizio * finestra, (ultimoAttivo + 1) * finestra]);
  return tratti.map(([a, b]) => [a, Math.min(b, wav.durata)]);
}
