// FMLAB Reel Kit — le scelte fatte per un reel (file impostazioni.json nella sua cartella, o dal pannello):
// chi fa il narratore, quanto è grande, da che lato sta, e se il reel è in stile 2D o 3D.
import type {ConfigPupazzo} from './Pupazzo';
import {PROPORZIONE_DOTTORE} from './Dottore';

/** Come un personaggio sta nel video, quando la grandezza è al 100%. */
export type MisureVideo = {
  /** Larghezza in pixel sul video (1080 = tutto lo schermo). */
  larghezza: number;
  /** Quanta parte dell'altezza resta sotto il bordo del video (0 = si vede fino in fondo). */
  sborda: number;
  /** Di quanti pixel esce dal lato del video. */
  rientro: number;
};

type Comune = {
  id: string;
  nome?: string;
  video: MisureVideo;
  /** Moltiplica l'ampiezza di tutti i gesti (1 = normale). */
  ampiezza?: number;
  /** false se ha scritte addosso non ancora preparate: specchiandolo si leggerebbero al contrario (vedi `specchio`). */
  specchiabile?: boolean;
};
export type ConfigVettoriale = Comune & {tipo: 'vettoriale'};
export type ConfigPersonaggio = (ConfigPupazzo & Comune) | ConfigVettoriale;

export type ImpostazioniNarratore = {
  /** Nome di una cartella in personaggi/, oppure "nessuno". */
  chi: string;
  /** Grandezza in percentuale rispetto alla misura normale del personaggio. */
  grandezza: number;
  lato: 'destra' | 'sinistra';
  /** Di quanti pixel alzarlo rispetto alla sua posizione normale. */
  alza: number;
  specchia: boolean;
  /**
   * La seconda mano del narratore (se ce l'ha su un livello suo): "auto" = cambia stato a ogni posa;
   * "aperta", "alza", "giu" = resta sempre così.
   */
  mano2?: string;
};

export type StileVideo = '2d' | '3d' | 'auto';

export type Impostazioni = {
  narratore: ImpostazioniNarratore;
  /** Come sono costruite le scene: grafica piatta (2d), oggetti con volume (3d), o a scelta (auto). */
  stile: StileVideo;
  /** Volume della musica di sottofondo, da 0 (niente) a 100. Vale solo se nella cartella del reel c'è un file musica.mp3. */
  musica?: number;
  /** Il formato del video: verticale (di serie), quadrato, orizzontale. */
  formato?: '9:16' | '1:1' | '16:9';
  /** La voce scelta per il reel (la usa `npm run voce`; non cambia come si disegnano le scene). */
  voce?: {motore: string; elevenlabs: Record<string, string>; mac: Record<string, string>; comando: Record<string, string>};
};

export const IMPOSTAZIONI_BASE: Impostazioni = {
  narratore: {chi: 'nessuno', grandezza: 100, lato: 'destra', alza: 0, specchia: false},
  stile: 'auto',
};

export type Ingombro = {x: number; y: number; larghezza: number; altezza: number};

/** Larghezza / altezza del personaggio. */
export function proporzione(config: ConfigPersonaggio): number {
  return config.tipo === 'pupazzo' ? config.misure[0] / config.misure[1] : PROPORZIONE_DOTTORE;
}

/** Il rettangolo che il narratore occupa sul video (può uscire dai bordi). null se non c'è. */
export function ingombroNarratore(config: ConfigPersonaggio | null | undefined, n: ImpostazioniNarratore, larghezzaVideo = 1080, altezzaVideo = 1920): Ingombro | null {
  if (!config) return null;
  const larghezza = Math.round((config.video.larghezza * n.grandezza) / 100);
  const altezza = Math.round(larghezza / proporzione(config));
  const x = n.lato === 'sinistra' ? -config.video.rientro : larghezzaVideo - larghezza + config.video.rientro;
  const y = altezzaVideo - Math.round(altezza * (1 - config.video.sborda)) - n.alza;
  return {x, y, larghezza, altezza};
}

/** La tela è sempre 1080×1920: ci si disegna come nel verticale. Il formato dice quale finestra della tela si vede. */
export const TELA = {larghezza: 1080, altezza: 1920};
/**
 * I formati: misura del video; di quanto si sposta la tela (negli altri formati si vede il riquadro con sottotitoli
 * e palco, da 240 a 1320 pixel); dove va e quanto è grande il narratore, ancorato all'angolo in basso a destra.
 */
export const FORMATI: Record<string, {larghezza: number; altezza: number; tela: {x: number; y: number}; narratore: number}> = {
  '9:16': {larghezza: 1080, altezza: 1920, tela: {x: 0, y: 0}, narratore: 1},
  '1:1': {larghezza: 1080, altezza: 1080, tela: {x: 0, y: -240}, narratore: 0.54},
  '16:9': {larghezza: 1920, altezza: 1080, tela: {x: 230, y: -240}, narratore: 1},
};
export function formatoDi(impostazioni?: Impostazioni | null) {
  return FORMATI[impostazioni?.formato ?? '9:16'] ?? FORMATI['9:16'];
}
