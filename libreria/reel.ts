// FMLAB Reel Kit — com'è fatto un reel: l'elenco delle scene (una per ogni [scena:nome] del copione).
import type {ComponentType} from 'react';
import type {Regia} from './Personaggio';

export type AtmosferaScena = {
  /** Colore della foschia in questa scena (es. rosso scuro per l'interno del corpo). */
  tinta?: string;
  /** 0…1: quanto è densa. */
  densita?: number;
  /** 0…1: raggi di luce dall'alto. */
  raggi?: number;
};

export type DefinizioneScena =
  | ComponentType
  | {
      componente: ComponentType;
      /** Regia del narratore in questa scena (posa, umore, nascosto). */
      dottore?: Regia;
      atmosfera?: AtmosferaScena;
    };

export type Reel = {
  titolo?: string;
  /** nome della scena (come nel copione) → componente che la disegna. */
  scene: Record<string, DefinizioneScena>;
  /** Regia di base del narratore, per le scene che non dicono altro. */
  dottore?: Regia;
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
