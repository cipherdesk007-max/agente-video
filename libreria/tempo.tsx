// FMLAB Reel Kit — il tempo del reel: fotogramma corrente, parole, segni e scene.
// Tutto ciò che si vede è una funzione pura del tempo: niente animazioni CSS, niente Date.now().
import {createContext, useContext} from 'react';
import {IMPOSTAZIONI_BASE} from './impostazioni';
import type {Impostazioni, Ingombro} from './impostazioni';

export type Parola = {
  /** Parola come scritta nel copione (con la punteggiatura attaccata). */
  testo: string;
  inizio: number;
  fine: number;
  /** Numero della frase a cui appartiene. */
  frase: number;
  /** true se nel copione era tra *asterischi*. */
  enfasi?: boolean;
};

export type InfoScena = {nome: string; inizio: number; fine: number};

export type DatiReel = {
  versione: number;
  /** Lingua del copione: "it", "en"… */
  lingua?: string;
  /** "elevenlabs", "mac" oppure "stima". */
  motore: string;
  /** "carattere" (esatta), "frase" (esatta sulle frasi) oppure "stimata". */
  precisione: string;
  /** File audio nella cartella del reel, o null se non c'è ancora la voce. */
  voce: string | null;
  durataVoce: number;
  /** Maggiore di 1 se la voce è stata velocizzata per stare nella durata chiesta (i tempi sono già quelli veloci). */
  velocita?: number;
  coda: number;
  durata: number;
  fps: number;
  parole: Parola[];
  segni: Record<string, number>;
  scene: InfoScena[];
  impronta: string;
};

export type Tempo = {
  frame: number;
  fps: number;
  /** Secondi dall'inizio del reel. */
  ora: number;
  durata: number;
  larghezza: number;
  altezza: number;
  dati: DatiReel;
  slug: string;
  /** Lingua di questa versione del reel: "it", "en"… */
  lingua: string;
  /** Secondo (assoluto) in cui viene pronunciata la parola marcata con [nome] nel copione. */
  segno: (nome: string) => number;
  /** Secondi trascorsi dal segno: negativo prima, positivo dopo. */
  dopo: (nome: string) => number;
  /** Indirizzo di un file che sta nella cartella del reel (immagini, clip…). */
  risorsa: (file: string) => string;
  /** Le scelte fatte per questo reel: narratore e stile (2d / 3d / auto). */
  impostazioni: Impostazioni;
  /** Il rettangolo occupato dal narratore, per non metterci sopra niente. null se il reel è senza narratore. */
  narratore: Ingombro | null;
};

export type Scena = {
  nome: string;
  indice: number;
  /** Inizio e fine della scena, in secondi assoluti. */
  inizio: number;
  fine: number;
  durata: number;
  /** Secondi dall'inizio della scena. */
  t: number;
  /** Da 0 a 1 lungo la scena. */
  avanzamento: number;
  /** Secondo, contato dall'inizio della scena, in cui cade il segno. */
  segno: (nome: string) => number;
  /** Secondi trascorsi dal segno: negativo prima, positivo dopo. È il mattone di ogni animazione. */
  dopo: (nome: string) => number;
  /** true se il segno esiste nel copione. */
  ha: (nome: string) => boolean;
  /** Intervallo [inizio, fine] in secondi di scena, a partire da un segno. */
  tra: (nome: string, durata: number) => [number, number];
};

function cercaSegno(dati: DatiReel, nome: string): number {
  const v = dati.segni[nome];
  if (typeof v !== 'number') {
    const elenco = Object.keys(dati.segni).join(', ') || '(nessuno)';
    throw new Error(`Il segno [${nome}] non esiste nel copione. Segni disponibili: ${elenco}`);
  }
  return v;
}

export function creaTempo(
  dati: DatiReel,
  slug: string,
  frame: number,
  extra: {impostazioni?: Impostazioni; narratore?: Ingombro | null} = {},
  formato = {larghezza: 1080, altezza: 1920}
): Tempo {
  const fps = dati.fps;
  const ora = frame / fps;
  return {
    impostazioni: extra.impostazioni ?? IMPOSTAZIONI_BASE,
    narratore: extra.narratore ?? null,
    frame,
    fps,
    ora,
    durata: dati.durata,
    larghezza: formato.larghezza,
    altezza: formato.altezza,
    dati,
    slug,
    lingua: dati.lingua ?? 'it',
    segno: (nome) => cercaSegno(dati, nome),
    dopo: (nome) => ora - cercaSegno(dati, nome),
    risorsa: (file) => `/reels/${slug}/${file.replace(/^\/+/, '')}`,
  };
}

export function creaScena(tempo: Tempo, indice: number): Scena {
  const info = tempo.dati.scene[indice];
  const durata = Math.max(0.001, info.fine - info.inizio);
  const t = tempo.ora - info.inizio;
  return {
    nome: info.nome,
    indice,
    inizio: info.inizio,
    fine: info.fine,
    durata,
    t,
    avanzamento: Math.min(1, Math.max(0, t / durata)),
    segno: (nome) => cercaSegno(tempo.dati, nome) - info.inizio,
    dopo: (nome) => tempo.ora - cercaSegno(tempo.dati, nome),
    ha: (nome) => typeof tempo.dati.segni[nome] === 'number',
    tra: (nome, d) => {
      const s = cercaSegno(tempo.dati, nome) - info.inizio;
      return [s, s + d];
    },
  };
}

export const TempoCtx = createContext<Tempo | null>(null);
export const ScenaCtx = createContext<Scena | null>(null);

/** Tempo globale del reel. */
export function useTempo(): Tempo {
  const t = useContext(TempoCtx);
  if (!t) throw new Error('useTempo() va usato dentro un reel.');
  return t;
}

/** Tempo della scena in cui ci si trova. */
export function useScena(): Scena {
  const s = useContext(ScenaCtx);
  if (!s) throw new Error('useScena() va usato dentro una scena.');
  return s;
}

/** Indice della parola pronunciata all'istante `ora` (-1 se in quel momento c'è silenzio). */
export function parolaAllIstante(parole: Parola[], ora: number): number {
  let a = 0;
  let b = parole.length - 1;
  while (a <= b) {
    const m = (a + b) >> 1;
    if (ora < parole[m].inizio) b = m - 1;
    else if (ora >= parole[m].fine) a = m + 1;
    else return m;
  }
  return -1;
}
