// FMLAB Reel Kit — disegna un personaggio "pupazzo": una sola immagine, mossa a parti (testa, braccio, mani),
// con bocca e occhi sostituiti da piccoli pezzi. Tutto dipende solo dai valori ricevuti: stesso istante,
// stesso disegno.
import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cellePiene, creaMaglia, deforma, disegnaMaglia, scalaOssa} from './maglia';
import type {Maglia, Mosse, Osso} from './maglia';
import {ASSETTI} from './gesti';
import type {Assetto, Limiti} from './gesti';

/**
 * Una parte ritagliata su un'immagine sua (di solito un avambraccio con la mano): sta sopra il corpo, ruota per
 * intero attorno al perno del suo osso e può passargli davanti. La crea `npm run personaggio livello`.
 */
export type Livello = {
  nome: string;
  file?: string;
  /** Dove sta nell'immagine di base, e quanto è grande (pixel). */
  x?: number;
  y?: number;
  misure?: [number, number];
  /** Ossa del corpo che la parte segue per intero (la spalla, per un avambraccio). */
  segue?: string[];
  /** 0…1: quanto è scura l'ombra che getta sul corpo quando ci passa davanti. */
  ombra?: number;
  /** La ricetta del ritaglio: la legge solo `npm run personaggio livello`. */
  taglio?: unknown;
};

/**
 * Una posa disegnata: un atteggiamento che dall'immagine non si ricava spostando le parti. Due modi:
 *  - una FIGURA INTERA: un altro disegno dello stesso personaggio (`personaggio` = la sua cartella), con bocca e
 *    occhi suoi. Finché la posa dura prende il posto di tutta la figura. Sono così le braccia conserte del Dottore;
 *  - SOLO UNA PARTE: un'immagine (`file`) che sta sopra il corpo al posto dei livelli che nasconde.
 */
export type Disegno = {
  /** Figura intera: il nome della cartella dell'altro disegno, e di quanto spostarlo perché le teste combacino. */
  personaggio?: string;
  dx?: number;
  dy?: number;
  /** Solo una parte: l'immagine, dove sta nell'immagine di base e quanto è grande (pixel). */
  file?: string;
  x?: number;
  y?: number;
  misure?: [number, number];
  /** I livelli che spariscono quando la parte è in scena. */
  nasconde?: string[];
};

export type ConfigPupazzo = {
  id: string;
  nome?: string;
  tipo: 'pupazzo';
  immagine: string;
  /** Larghezza e altezza dell'immagine, in pixel. */
  misure: [number, number];
  pezzi?: Record<string, {file: string; x: number; y: number}>;
  /** Pezzi della bocca, dalla più chiusa alla più aperta (quella tutta aperta è l'immagine base). */
  bocche?: string[];
  /** Pezzi degli occhi: socchiusi, chiusi. */
  occhi?: string[];
  /** Pezzo con scritte e loghi già ribaltati: si usa solo quando il personaggio è specchiato, così restano leggibili. */
  specchio?: string;
  /** L'immagine di base senza le parti ritagliate sui livelli (la crea `npm run personaggio livello`). */
  corpo?: string;
  livelli?: Livello[];
  ossa?: Record<string, Osso>;
  /** Pose che ritoccano quelle di serie (dito, alto, lato, aperto) o ne aggiungono di nuove. */
  pose?: Record<string, Assetto>;
  /**
   * Gli stati della seconda mano, per i personaggi che hanno anche l'altro avambraccio su un livello suo (osso
   * "braccio2"): {"aperta": {}, "alza": {"braccio2": {"ruota": 9}}, "giu": {"braccio2": {"ruota": -68}}}.
   * A ogni posa il kit ne sceglie uno, così quella mano non resta mai ferma.
   */
  pose2?: Record<string, Assetto>;
  /** Pose disegnate (vedi `Disegno`): una posa le usa scrivendo "disegno": "nome" in "pose". */
  disegni?: Record<string, Disegno>;
  /** Angoli massimi di questo personaggio, se diversi da quelli di serie: {"braccio": [-40, 58]}. */
  limiti?: Limiti;
  /**
   * Come la faccia accompagna il labiale (servono le ossa "mascella" e "bocca"):
   * mascella = di quanti pixel il mento sale quando la bocca si chiude; stringe = di quanto la bocca si stringe sulla "u".
   */
  labiale?: {mascella?: number; stringe?: number};
};

/** Quanto margine resta attorno all'immagine, perché un braccio che si alza non venga tagliato. */
export const MARGINE_PUPAZZO = 0.24;

const sorgenti = new Map<string, HTMLCanvasElement>();
let banco: HTMLCanvasElement | null = null;
let strato: HTMLCanvasElement | null = null;
let penombra: HTMLCanvasElement | null = null;

type Strato = {livello: Livello; ossa: Record<string, Osso>; maglia: Maglia; celle: Uint8Array; centro: number};

/** I livelli pronti all'uso: servono il corpo senza le parti e, per ognuno, la sua immagine. */
export function livelliAttivi(config: ConfigPupazzo): Livello[] {
  return config.corpo ? (config.livelli ?? []).filter((l) => l.file && l.misure) : [];
}

/** Gli stati della seconda mano, se il personaggio può usarli davvero (osso "braccio2" sul suo livello). */
export function secondeDi(config: {tipo?: string; ossa?: Record<string, Osso>; pose2?: Record<string, Assetto>; corpo?: string; livelli?: Livello[]} | null | undefined): Record<string, Assetto> | undefined {
  if (!config || config.tipo === 'vettoriale') return undefined;
  const osso = config.ossa?.braccio2;
  if (!osso || !config.pose2 || !Object.keys(config.pose2).length) return undefined;
  if (osso.livello && !livelliAttivi(config as ConfigPupazzo).some((l) => l.nome === osso.livello)) return undefined;
  return config.pose2;
}

/**
 * Le pose che il personaggio può fare davvero. Una posa disegnata vale solo se il suo disegno c'è e ci sono i
 * livelli che deve nascondere: senza, si vedrebbero due paia di braccia.
 */
export function poseDi(
  config: {pose?: Record<string, Assetto>; disegni?: Record<string, Disegno>; corpo?: string; livelli?: Livello[]} | null | undefined,
  /** Gli altri personaggi del kit: una figura intera vale solo se la sua cartella c'è. */
  conosciuti: Record<string, {tipo?: string} | undefined> = {}
): string[] {
  const attivi = config ? livelliAttivi(config as ConfigPupazzo).map((l) => l.nome) : [];
  return Object.keys({...ASSETTI, ...(config?.pose ?? {})}).filter((nome) => {
    const voluto = config?.pose?.[nome]?.disegno;
    if (!voluto) return true;
    const disegno = config?.disegni?.[voluto];
    if (!disegno) return false;
    if (disegno.personaggio) return conosciuti[disegno.personaggio]?.tipo === 'pupazzo';
    return !!disegno.file && (disegno.nasconde ?? []).every((l) => attivi.includes(l));
  });
}

/**
 * Sotto e sopra in uno scambio di figure: nella prima metà la figura nuova compare sopra quella vecchia ancora
 * piena, nella seconda la vecchia sparisce sotto la nuova ormai piena. Così non si vede mai lo sfondo attraverso.
 */
export function scambioFigure(peso: number): {sotto: number; sopra: number} {
  const w = Math.min(1, Math.max(0, peso));
  return {sotto: Math.min(1, 2 * (1 - w)), sopra: Math.min(1, 2 * w)};
}

function pronta(img: HTMLImageElement | null | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

/** Sceglie il pezzo della bocca per un'apertura 0…1 (null = bocca dell'immagine base, tutta aperta). */
export function pezzoBocca(config: ConfigPupazzo, apertura: number): string | null {
  const bocche = config.bocche ?? [];
  if (!bocche.length) return null;
  const livello = Math.min(bocche.length, Math.max(0, Math.round(apertura * 1.15 * bocche.length)));
  return livello >= bocche.length ? null : bocche[livello];
}

/**
 * Le mosse della faccia che seguono il labiale: il mento sale quando la bocca si chiude (nell'immagine di base
 * la bocca è aperta, quindi il mento è già "giù") e la bocca si stringe sulle vocali chiuse.
 * Valgono solo per i personaggi che hanno le ossa "mascella" e "bocca".
 */
export function mosseLabiale(config: ConfigPupazzo, forma: {apertura: number; larghezza: number}): Mosse {
  const mosse: Mosse = {};
  const aperta = Math.max(0, Math.min(1, forma.apertura * 1.15));
  if (config.ossa?.mascella) mosse.mascella = {dy: -(config.labiale?.mascella ?? 7) * (1 - aperta)};
  if (config.ossa?.bocca) mosse.bocca = {sx: 1 - (config.labiale?.stringe ?? 0.15) * Math.max(0, Math.min(1, (0.9 - forma.larghezza) / 0.8))};
  return mosse;
}

/** Sceglie il pezzo degli occhi per una chiusura 0…1 (null = occhi aperti). */
export function pezzoOcchi(config: ConfigPupazzo, chiusura: number): string | null {
  const occhi = config.occhi ?? [];
  if (!occhi.length || chiusura < 0.28) return null;
  if (occhi.length === 1) return chiusura > 0.5 ? occhi[0] : null;
  return chiusura > 0.72 ? occhi[occhi.length - 1] : occhi[0];
}

export type PropsPupazzo = {
  config: ConfigPupazzo;
  /** Larghezza a cui disegnare l'immagine (senza margini), in pixel del video. */
  larghezza: number;
  mosse: Mosse;
  bocca: string | null;
  occhi: string | null;
  specchia?: boolean;
  /** true per sfumare il bordo di sotto (quando il personaggio non arriva al bordo del video). */
  sfumaFondo?: boolean;
  /** Quanto si vede ogni posa disegnata, da 0 a 1 (lo calcola `atteggiamento`). */
  disegni?: Record<string, number>;
  /** false = le immagini restano caricate ma non si disegna niente (una figura che in questo momento non è in scena). */
  inScena?: boolean;
};

export function Pupazzo({config, larghezza, mosse, bocca, occhi, specchia = false, sfumaFondo = false, disegni, inScena: visibile = true}: PropsPupazzo) {
  const [L0, A0] = config.misure;
  const W = Math.max(8, Math.round(larghezza));
  const k = W / L0;
  const H = Math.round(A0 * k);
  const m = Math.round(W * MARGINE_PUPAZZO);
  const tela = useRef<HTMLCanvasElement | null>(null);
  const immagini = useRef<Record<string, HTMLImageElement | null>>({});
  const [, ridisegna] = useState(0);
  const cartella = `/personaggi/${config.id}`;
  const livelli = livelliAttivi(config);
  const ky = H / A0;

  const {corpo, strati} = useMemo(() => {
    const tutte = config.ossa ?? {};
    const attivi = livelliAttivi(config);
    const passo = Math.max(8, Math.round(W / 40));
    // il corpo: tutte le ossa che non appartengono a un livello
    const delCorpo = Object.fromEntries(Object.entries(tutte).filter(([, o]) => !o.livello));
    const ossaCorpo = scalaOssa(delCorpo, k, m, m);
    const fatti: Strato[] = attivi.map((l) => {
      // un livello si muove con le ossa che "segue" (per intero) e con le sue (la mano, che piega al polso)
      const sue: Record<string, Osso> = {};
      for (const nome of l.segue ?? []) if (tutte[nome]) sue[nome] = {...tutte[nome], zona: {tipo: 'tutto'}, sfuma: 1};
      for (const [nome, o] of Object.entries(tutte)) if (o.livello === l.nome) sue[nome] = o;
      const ossa = scalaOssa(sue, k, m, m);
      const maglia = creaMaglia(W + 2 * m, H + m, ossa, passo);
      const x = m + (l.x ?? 0) * k;
      const y = m + (l.y ?? 0) * ky;
      const celle = cellePiene(maglia, x - 2, y - 2, l.misure![0] * k + 4, l.misure![1] * ky + 4);
      // il punto della maglia più vicino al centro della parte: dice di quanto si è spostata
      const colonna = Math.round((x + (l.misure![0] * k) / 2) / maglia.passo);
      const riga = Math.round((y + (l.misure![1] * ky) / 2) / maglia.passo);
      const centro = Math.min(maglia.righe, riga) * (maglia.colonne + 1) + Math.min(maglia.colonne, colonna);
      return {livello: l, ossa, maglia, celle, centro};
    });
    return {corpo: {ossa: ossaCorpo, maglia: creaMaglia(W + 2 * m, H + m, ossaCorpo, passo)}, strati: fatti};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, W, H, m, k]);

  // Disegna subito dopo ogni aggiornamento, prima che il fotogramma venga fotografato.
  useLayoutEffect(() => {
    const c = tela.current;
    const base = immagini.current.base;
    if (!visibile) return;
    if (!c || !pronta(base)) return;
    const pezzi = [bocca, occhi, specchia ? config.specchio : null].filter((n): n is string => !!n && !!config.pezzi?.[n]);
    if (pezzi.some((n) => !pronta(immagini.current[n]))) return;
    if (strati.some((st) => !pronta(immagini.current[`livello:${st.livello.nome}`]))) return;
    // le pose disegnate in scena in questo istante, e quanto nascondono ogni livello
    const inScena = Object.entries(config.disegni ?? {}).filter(([nome, d]) => !!d.file && (disegni?.[nome] ?? 0) > 0.004);
    if (inScena.some(([nome]) => !pronta(immagini.current[`disegno:${nome}`]))) return;
    const nascosto = (livello: string) => Math.min(1, Math.max(0, ...inScena.filter(([, d]) => (d.nasconde ?? []).includes(livello)).map(([nome]) => disegni?.[nome] ?? 0)));
    /** Un'immagine grande come quella di base, rimpicciolita una volta sola alla grandezza del video, con il margine attorno. */
    const rimpicciolita = (chiave: string, dipingi: (b: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
      let fatta = sorgenti.get(chiave);
      if (fatta) return fatta;
      banco = banco ?? document.createElement('canvas');
      banco.width = L0;
      banco.height = A0;
      const b = banco.getContext('2d')!;
      b.clearRect(0, 0, L0, A0);
      dipingi(b);
      fatta = document.createElement('canvas');
      fatta.width = W + 2 * m;
      fatta.height = H + m;
      const s = fatta.getContext('2d')!;
      s.imageSmoothingEnabled = true;
      s.imageSmoothingQuality = 'high';
      s.drawImage(banco, 0, 0, L0, A0, m, m, W, H);
      if (sorgenti.size > 64) sorgenti.clear();
      sorgenti.set(chiave, fatta);
      return fatta;
    };
    // il corpo, con bocca e occhi giusti
    const sorgente = rimpicciolita(`${config.id}|${W}|${bocca ?? '-'}|${occhi ?? '-'}|${specchia && config.specchio ? 'specchio' : '-'}`, (b) => {
      b.drawImage(base, 0, 0, L0, A0);
      for (const n of pezzi) {
        const p = config.pezzi![n];
        b.drawImage(immagini.current[n]!, p.x, p.y);
      }
    });
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const {punti, mossi} = deforma(corpo.maglia, corpo.ossa, mosse, k);
    disegnaMaglia(ctx, sorgente, corpo.maglia, punti, mossi);
    // i livelli, uno sopra l'altro: ognuno prima su una tela sua, poi (con la sua ombra) sul corpo
    for (const st of strati) {
      const l = st.livello;
      const vista = 1 - nascosto(l.nome);
      if (vista < 0.004) continue;
      const sua = rimpicciolita(`${config.id}|${W}|livello:${l.nome}`, (b) => b.drawImage(immagini.current[`livello:${l.nome}`]!, l.x ?? 0, l.y ?? 0));
      strato = strato ?? document.createElement('canvas');
      if (strato.width !== c.width || strato.height !== c.height) {
        strato.width = c.width;
        strato.height = c.height;
      }
      const g = strato.getContext('2d')!;
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      const d = deforma(st.maglia, st.ossa, mosse, k);
      disegnaMaglia(g, sua, st.maglia, d.punti, d.mossi, st.celle);
      // l'ombra: compare solo quando la parte si è spostata da dove stava, e cade solo sul corpo
      const spostata = Math.hypot(d.punti[st.centro * 2] - st.maglia.punti[st.centro * 2], d.punti[st.centro * 2 + 1] - st.maglia.punti[st.centro * 2 + 1]) / k;
      const quanta = Math.max(0, Math.min(1, (spostata - 14) / 80)) * (l.ombra ?? 0);
      if (quanta > 0.01) {
        penombra = penombra ?? document.createElement('canvas');
        const pw = Math.ceil(c.width / 5);
        const ph = Math.ceil(c.height / 5);
        penombra.width = pw;
        penombra.height = ph;
        const o = penombra.getContext('2d')!;
        o.imageSmoothingEnabled = true;
        o.imageSmoothingQuality = 'high';
        o.drawImage(strato, 0, 0, c.width, c.height, 0, 0, pw, ph);
        o.globalCompositeOperation = 'source-in';
        o.fillStyle = '#18213a';
        o.fillRect(0, 0, pw, ph);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = quanta * vista;
        ctx.drawImage(penombra, 0, 0, pw, ph, 7 * k, 13 * k, pw * 5, ph * 5);
        ctx.restore();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = vista;
      ctx.drawImage(strato, 0, 0);
      ctx.globalAlpha = 1;
    }
    // le pose disegnate, sopra tutto: ferme sul corpo, sfumate quanto dice il loro peso
    for (const [nome, d] of inScena) {
      const sua = rimpicciolita(`${config.id}|${W}|disegno:${nome}`, (b) => b.drawImage(immagini.current[`disegno:${nome}`]!, d.x ?? 0, d.y ?? 0));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, disegni?.[nome] ?? 0);
      ctx.drawImage(sua, 0, 0);
      ctx.globalAlpha = 1;
    }
  });

  const file = (nome: string) => `${cartella}/${nome}`;
  const sfumatura = sfumaFondo ? 'linear-gradient(to bottom, #000 0%, #000 84%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.5) 92%, rgba(0,0,0,0.16) 96%, transparent 100%)' : undefined;
  const nascosta = {position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none'} as const;
  return (
    <div style={{position: 'relative', width: W, height: H}}>
      <img ref={(el) => void (immagini.current.base = el)} src={file(livelli.length ? config.corpo! : config.immagine)} alt="" style={nascosta} onLoad={() => ridisegna((n) => n + 1)} />
      {livelli.map((l) => (
        <img key={`livello:${l.nome}`} ref={(el) => void (immagini.current[`livello:${l.nome}`] = el)} src={file(l.file!)} alt="" style={nascosta} onLoad={() => ridisegna((n) => n + 1)} />
      ))}
      {Object.entries(config.disegni ?? {}).map(([nome, d]) =>
        d.file ? <img key={`disegno:${nome}`} ref={(el) => void (immagini.current[`disegno:${nome}`] = el)} src={file(d.file)} alt="" style={nascosta} onLoad={() => ridisegna((n) => n + 1)} /> : null
      )}
      {Object.entries(config.pezzi ?? {}).map(([nome, p]) => (
        <img key={nome} ref={(el) => void (immagini.current[nome] = el)} src={file(p.file)} alt="" style={nascosta} onLoad={() => ridisegna((n) => n + 1)} />
      ))}
      <canvas
        ref={tela}
        width={W + 2 * m}
        height={H + m}
        style={{
          position: 'absolute',
          left: -m,
          top: -m,
          width: W + 2 * m,
          height: H + m,
          transform: specchia ? 'scaleX(-1)' : undefined,
          WebkitMaskImage: sfumatura,
          maskImage: sfumatura,
        }}
      />
    </div>
  );
}
