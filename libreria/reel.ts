// FMLAB Reel Kit — com'è fatto un reel: l'elenco delle scene (una per ogni [scena:nome] del copione).
import type {ComponentType} from 'react';
import type {Regia} from './Personaggio';
import type {NomeLuogo, Verso} from './Mondo';
import type {DefinizioneProtagonista, StatoProtagonista} from './Protagonista';

export type AtmosferaScena = {
  /** Colore della foschia in questa scena (es. rosso scuro per l'interno del corpo). */
  tinta?: string;
  /** 0…1: quanto è densa. */
  densita?: number;
  /** 0…1: raggi di luce dall'alto. */
  raggi?: number;
  /**
   * Il luogo disegnato dietro la scena: 'corpo', 'vaso', 'membrana', 'laboratorio', 'stadio', 'palco', 'bilancia',
   * 'studio' (oppure 'vuoto': solo trama e luce). Ci si entra e se ne esce con la camera, senza tagli.
   */
  luogo?: NomeLuogo;
};

export type DefinizioneScena =
  | ComponentType
  | {
      componente: ComponentType;
      /** Regia del narratore in questa scena (posa, umore, nascosto). */
      dottore?: Regia;
      atmosfera?: AtmosferaScena;
      /**
       * Da che parte la camera entra in questa scena: 'avanti' (attraversa quella prima e arriva qui, di serie),
       * 'sinistra', 'destra', 'alto', 'basso' (carrellata: la scena prima esce dalla parte opposta).
       */
      entra?: Verso;
      /** Quanto è larga l'inquadratura: 'largo' (si vede tutto, più piccolo), 'medio' (di serie), 'stretto' (più vicino). Da una scena all'altra conviene cambiarla. */
      campo?: 'largo' | 'medio' | 'stretto';
      /**
       * Come si muove la camera mentre la scena dura: 'spinta' (si avvicina), 'indietro' (si allontana), 'destra',
       * 'sinistra' (carrellata), 'sale', 'scende' (gru), 'gira' (ruota di poco), 'ferma' (di serie: solo il respiro).
       */
      camera?: 'ferma' | 'spinta' | 'indietro' | 'destra' | 'sinistra' | 'sale' | 'scende' | 'gira';
      /**
       * Lo stato del protagonista in questa scena (dove sta, acceso/spento, pieno/vuoto, colore, calmo/agitato).
       * Più stati: il primo all'ingresso, gli altri ognuno al suo `segno`. false = esce di scena.
       * Quello che non dici resta com'era nella scena prima: è lo stesso oggetto che cambia, non uno nuovo.
       */
      protagonista?: StatoProtagonista | StatoProtagonista[] | false;
    };

export type Reel = {
  titolo?: string;
  /** nome della scena (come nel copione) → componente che la disegna. */
  scene: Record<string, DefinizioneScena>;
  /** Regia di base del narratore, per le scene che non dicono altro. */
  dottore?: Regia;
  /** Il protagonista del reel: un oggetto che resta in scena da una scena all'altra e cambia stato (per PEPTMAP la catena del peptide). */
  protagonista?: DefinizioneProtagonista;
  /** Atmosfera di base, per le scene che non dicono altro. */
  atmosfera?: AtmosferaScena;
  /** false per togliere i sottotitoli o la firma in alto. */
  sottotitoli?: boolean;
  firma?: boolean;
  /**
   * Passaggio tra le scene: 'viaggio' (la camera attraversa la scena e arriva nella successiva, senza tagli),
   * 'dissolvenza' oppure 'taglio'.
   */
  transizione?: 'viaggio' | 'dissolvenza' | 'taglio';
  /**
   * false per tornare al fondo semplice (foschia e pulviscolo fermi sul posto). Di serie dietro le scene c'è il
   * mondo a livelli: trama, luogo disegnato, luce, con la camera che viaggia e dà una spinta a ogni segno.
   */
  mondo?: boolean;
  /** false per tenere la camera immobile dentro le scene (di serie si avvicina piano, dell'1%). */
  respiro?: boolean;
};

/** Non fa nulla, serve solo a far controllare i nomi dei campi mentre si scrive. */
export function definisciReel(reel: Reel): Reel {
  return reel;
}

/** Sceglie il testo nella lingua del reel:  scegli(lingua, {it: 'QUOTA', en: 'ALTITUDE'}) */
export function scegli<T>(lingua: string, testi: Record<string, T>): T {
  const corta = lingua.slice(0, 2);
  return testi[lingua] ?? testi[corta] ?? testi.it ?? Object.values(testi)[0];
}
