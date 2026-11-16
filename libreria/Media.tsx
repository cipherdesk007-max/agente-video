// FMLAB Reel Kit — FOTO e FILMATI: immagini e registrazioni dello schermo dentro le scene.
//
// Una foto (uno screenshot, la prima pagina di uno studio, un prodotto). Il file sta nella cartella del reel:
//
//   <Foto file="studio.png" x={540} y={860} larghezza={700} da={s.dopo('rivista')} />
//
// Un filmato (una registrazione dello schermo, una clip). Prima si divide in fotogrammi, una volta sola:
//
//   npm run clip <reel> registrazione.mp4 demo
//
// e poi nella scena:
//
//   import demo from './clip/demo/clip.json';
//   <Filmato clip={demo} x={540} y={880} larghezza={420} da={s.dopo('apri')} />
//
// Dentro un telefono (lo schermo dell'app):
//
//   <Telefono x={540} y={900} larghezza={420}>
//     <Filmato clip={demo} schermo da={s.dopo('apri')} />
//   </Telefono>
//
// Perché non un <video>: nel render il tempo non scorre da solo, ogni fotogramma viene chiesto e fotografato.
// Un <video> resterebbe fermo o salterebbe. Il Filmato sceglie il fotogramma giusto per ogni istante: nel video
// finale è preciso al fotogramma. L'audio della clip non viene usato (nel reel parla la voce).
import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import {curve, limita, mix, molla, rampa} from './anim';
import {alfa} from './colore';
import {stile} from '../stile/stile';
import {useTempo} from './tempo';

/** Quello che `npm run clip` scrive in clip.json. */
export type Clip = {
  nome: string;
  /** Quanti fotogrammi ha (file 00001.jpg … ). */
  fotogrammi: number;
  /** Fotogrammi al secondo (gli stessi del reel). */
  fps: number;
  larghezza: number;
  altezza: number;
  /** Secondi. */
  durata?: number;
};

/**
 * Quale fotogramma del filmato (contando da 1) si vede dopo `secondi` di riproduzione.
 * Alla fine resta fermo sull'ultimo; con `ripeti` ricomincia.
 */
export function fotogrammaClip(clip: Clip, secondi: number, {inizio = 0, velocita = 1, ripeti = false}: {inizio?: number; velocita?: number; ripeti?: boolean} = {}): number {
  const quanti = Math.max(1, Math.floor(clip.fotogrammi));
  const n = Math.floor((inizio + Math.max(0, secondi) * velocita) * clip.fps + 1e-6);
  if (ripeti) return (((n % quanti) + quanti) % quanti) + 1;
  return limita(n + 1, 1, quanti);
}

/** Nome del file di un fotogramma: 00001.jpg, 00002.jpg… */
export const fileFotogramma = (clip: Clip, n: number) => `clip/${clip.nome}/${String(n).padStart(5, '0')}.jpg`;

/** true se è già un indirizzo completo (inizia con /, http o data:) e non un file della cartella del reel. */
const completo = (file: string) => /^(\/|https?:|data:|blob:)/.test(file);

/** Se il file non c'è, il render non deve andare avanti in silenzio: lo dice a `foto`, `provini` e `verifica`. */
function manca(file: string) {
  const w = window as unknown as {__fmlabErrore?: {scena?: string; errore: string} | null};
  if (!w.__fmlabErrore) w.__fmlabErrore = {errore: `Foto/Filmato: non trovo "${file}" nella cartella del reel.`};
}

type Presenza = {
  /** Secondi da quando deve comparire (di solito s.dopo('segno')). */
  da: number;
  /** Secondi da quando deve sparire. */
  fino?: number;
  /** 0…1: quanto è attenuata. */
  spento?: number;
};

type Riquadro = {
  /** Centro, in pixel del video (1080 x 1920). Non servono con `schermo`. */
  x?: number;
  y?: number;
  /** Larghezza in pixel. L'altezza segue le proporzioni dell'immagine, a meno che tu non la scriva. */
  larghezza?: number;
  altezza?: number;
  /** Raggio degli angoli. */
  raggio?: number;
  /** Bordo sottile e ombra, per staccarla dal fondo. false = immagine nuda. */
  cornice?: boolean;
  /** Colore del bordo. */
  colore?: string;
  /** Gradi di inclinazione (2-3 bastano per farla sembrare appoggiata). */
  ruota?: number;
  /** Riempie tutto lo spazio in cui è messa (lo schermo di un <Telefono>): niente cornice, niente x e y. */
  schermo?: boolean;
  /** Una riga sotto l'immagine. */
  didascalia?: string;
};

function cornice({x = 540, y = 880, larghezza = 640, altezza, raggio = 28, cornice: bordo = true, colore = stile.colori.luce, ruota = 0, schermo = false}: Riquadro, arrivo: number, opacita: number): {fuori: CSSProperties; dentro: CSSProperties} {
  if (schermo) {
    return {fuori: {position: 'absolute', inset: 0, opacity: opacita}, dentro: {position: 'absolute', inset: 0, overflow: 'hidden'}};
  }
  return {
    fuori: {
      position: 'absolute',
      left: x,
      top: y,
      width: larghezza,
      transform: `translate(-50%, -50%) rotate(${ruota}deg) scale(${mix(0.9, 1, arrivo).toFixed(4)})`,
      opacity: opacita,
    },
    dentro: {
      position: 'relative',
      width: larghezza,
      height: altezza,
      overflow: 'hidden',
      borderRadius: raggio,
      background: '#0B1218',
      boxShadow: bordo ? `0 0 0 3px ${alfa(colore, 0.55)}, 0 26px 60px rgba(0,0,0,0.55), 0 0 70px ${alfa(colore, 0.16)}` : undefined,
    },
  };
}

function Didascalia({testo, larghezza}: {testo: string; larghezza: number}) {
  return (
    <div
      data-fmlab-zona="testo"
      style={{marginTop: 18, width: larghezza, textAlign: 'center', fontFamily: stile.font.testo, fontWeight: 700, fontSize: 30, lineHeight: 1.15, color: stile.colori.tenue, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}
    >
      {testo}
    </div>
  );
}

/**
 * Una foto o uno screenshot. Entra con un piccolo rimbalzo e, se vuoi, si avvicina piano (`zoom`) o scorre
 * (`sposta`): un'immagine che si muove appena tiene l'occhio molto più di una ferma.
 */
export function Foto({
  file,
  zoom = [1, 1.06],
  sposta = [0, 0],
  punto = [50, 50],
  durata = 6,
  adatta = 'copri',
  da,
  fino,
  spento = 0,
  didascalia,
  ...riquadro
}: Riquadro &
  Presenza & {
    /** Nome del file nella cartella del reel ("studio.png"). */
    file: string;
    /** Ingrandimento all'inizio e alla fine del movimento. [1, 1] = ferma. */
    zoom?: [number, number];
    /** Di quanti pixel scorre [a destra, in basso] durante il movimento (utile per una pagina lunga). */
    sposta?: [number, number];
    /** Il punto verso cui si avvicina, in percentuale dell'immagine: [50, 50] è il centro. */
    punto?: [number, number];
    /** Quanti secondi dura il movimento. */
    durata?: number;
    /** Con un'altezza scritta da te: "copri" riempie il riquadro tagliando i bordi, "contieni" la mostra tutta. */
    adatta?: 'copri' | 'contieni';
  }) {
  const tempo = useTempo();
  const immagine = useRef<HTMLImageElement | null>(null);
  const indirizzo = completo(file) ? file : tempo.risorsa(file);
  useLayoutEffect(() => {
    const img = immagine.current;
    if (img && img.complete && img.naturalWidth === 0) manca(file);
  });
  if (da <= 0) return null;
  const uscita = fino === undefined ? 0 : rampa(fino, 0.25, curve.entra);
  if (uscita >= 1) return null;
  const arrivo = molla(da, {rigidita: 200, smorzamento: 19});
  const opacita = rampa(da, 0.16) * (1 - uscita) * (1 - 0.6 * spento);
  // movimento lento che parte subito e si ferma piano: non "pompa" come farebbe una curva a S
  const p = Math.sin((limita(da / Math.max(0.1, durata)) * Math.PI) / 2);
  const scala = mix(zoom[0], zoom[1], p);
  const stili = cornice(riquadro, arrivo, opacita);
  const fissa = riquadro.schermo || riquadro.altezza !== undefined;
  return (
    <div style={stili.fuori}>
      <div style={stili.dentro}>
        <img
          ref={immagine}
          src={indirizzo}
          alt=""
          onError={() => manca(file)}
          style={{
            display: 'block',
            width: '100%',
            height: fissa ? '100%' : 'auto',
            objectFit: fissa ? (adatta === 'contieni' ? 'contain' : 'cover') : undefined,
            transform: `translate(${(-sposta[0] * p).toFixed(2)}px, ${(-sposta[1] * p).toFixed(2)}px) scale(${scala.toFixed(5)})`,
            transformOrigin: `${punto[0]}% ${punto[1]}%`,
          }}
        />
      </div>
      {didascalia && !riquadro.schermo ? <Didascalia testo={didascalia} larghezza={riquadro.larghezza ?? 640} /> : null}
    </div>
  );
}

/**
 * Un filmato, preciso al fotogramma. `clip` è il clip.json scritto da `npm run clip`.
 * Parte quando compare (`da`); con `avvio` resta fermo sul primo fotogramma finché non glielo dici tu.
 */
export function Filmato({
  clip,
  avvio,
  inizio = 0,
  velocita = 1,
  ripeti = false,
  da,
  fino,
  spento = 0,
  didascalia,
  ...riquadro
}: Riquadro &
  Presenza & {
    clip: Clip;
    /** Secondi da quando deve partire, se non parte appena compare (di solito s.dopo('segno')). */
    avvio?: number;
    /** Da che secondo della clip partire. */
    inizio?: number;
    /** 1 = velocità vera, 2 = doppia, 0.5 = rallentata. */
    velocita?: number;
    /** Alla fine ricomincia invece di fermarsi sull'ultimo fotogramma. */
    ripeti?: boolean;
  }) {
  const tempo = useTempo();
  const immagine = useRef<HTMLImageElement | null>(null);
  const n = fotogrammaClip(clip, avvio ?? da, {inizio, velocita, ripeti});
  const file = fileFotogramma(clip, n);
  useLayoutEffect(() => {
    const img = immagine.current;
    if (img && img.complete && img.naturalWidth === 0) manca(file);
  });
  if (da <= 0) return null;
  const uscita = fino === undefined ? 0 : rampa(fino, 0.25, curve.entra);
  if (uscita >= 1) return null;
  const arrivo = molla(da, {rigidita: 200, smorzamento: 19});
  const opacita = rampa(da, 0.16) * (1 - uscita) * (1 - 0.6 * spento);
  const larghezza = riquadro.larghezza ?? 420;
  const altezza = riquadro.altezza ?? Math.round((larghezza * clip.altezza) / Math.max(1, clip.larghezza));
  const stili = cornice({...riquadro, larghezza, altezza}, arrivo, opacita);
  return (
    <div style={stili.fuori}>
      <div style={stili.dentro}>
        <img ref={immagine} src={tempo.risorsa(file)} alt="" onError={() => manca(file)} style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      {didascalia && !riquadro.schermo ? <Didascalia testo={didascalia} larghezza={larghezza} /> : null}
    </div>
  );
}
