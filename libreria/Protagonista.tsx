// FMLAB Reel Kit — IL PROTAGONISTA: un oggetto che resta in scena da una scena all'altra e cambia STATO, invece di
// essere sostituito. Per PEPTMAP è la catena del peptide (una fila di perle); 'goccia' e 'cellula' servono agli
// altri argomenti. Lo stesso oggetto passa da spento ad acceso, da vuoto a pieno, da un colore a un altro, da
// calmo ad agitato: i passaggi sono sempre graduali, mai uno scambio.
//
//   definisciReel({
//     protagonista: {tipo: 'peptide', colore: '#5CF2C8'},
//     scene: {
//       aggancio: {componente: Aggancio, protagonista: {x: 300, y: 1230, grandezza: 0.8}},
//       rischi:   {componente: Rischi, protagonista: [{colore: '#FF4D5E', onda: 1}, {segno: 'stop', acceso: 0.2}]},
//       fine:     {componente: Fine, protagonista: false},        // esce di scena
//     },
//   })
import {useId} from 'react';
import {useTempo} from './tempo';
import {limita, mix} from './anim';
import {miscela} from './colore';
import {stile} from '../stile/stile';

export type TipoProtagonista = 'peptide' | 'goccia' | 'cellula';

export type DefinizioneProtagonista = {
  tipo: TipoProtagonista;
  /** Colore quando è acceso (di serie il colore "luce" dello stile). */
  colore?: string;
  /** Per il peptide: quante perle ha la catena (di serie 14). */
  perle?: number;
};

/** Lo stato del protagonista in un momento. Quello che una scena non dice resta com'era nella scena prima. */
export type StatoProtagonista = {
  /** Dove sta (pixel del fotogramma 1080×1920) e quanto è grande (1 = 420 px di larghezza). */
  x?: number;
  y?: number;
  grandezza?: number;
  /** 0…1: da spento (grigio, senza luce) ad acceso. */
  acceso?: number;
  /** 0…1: da vuoto a pieno (per il peptide: quante perle sono colorate). */
  carica?: number;
  /** Colore in questo stato (il passaggio dal colore di prima è graduale). */
  colore?: string;
  /** 0…2: da calmo ad agitato. */
  onda?: number;
  /** 0…1: quanto si vede (0 = fuori scena). */
  presenza?: number;
  /** Dentro una scena: il [segno] del copione a cui si passa a questo stato. Il primo stato della scena non ne ha. */
  segno?: string;
};

export type StatoPieno = Required<Omit<StatoProtagonista, 'segno'>>;

export const STATO_BASE: StatoPieno = {x: 260, y: 1392, grandezza: 0.62, acceso: 1, carica: 1, colore: stile.colori.luce, onda: 0.6, presenza: 1};

/** Mescola due stati: k = 0 il primo, k = 1 il secondo. */
export function mescolaStati(a: StatoPieno, b: StatoPieno, k: number): StatoPieno {
  const t = limita(k, 0, 1);
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    grandezza: mix(a.grandezza, b.grandezza, t),
    acceso: mix(a.acceso, b.acceso, t),
    carica: mix(a.carica, b.carica, t),
    colore: miscela(a.colore, b.colore, t),
    onda: mix(a.onda, b.onda, t),
    presenza: mix(a.presenza, b.presenza, t),
  };
}

const morbida = (k: number) => k * k * (3 - 2 * k);

/**
 * Lo stato del protagonista al secondo `ora`, lungo tutto il reel.
 * @param scene   le scene in ordine: quando cominciano e cosa dichiarano (uno stato, più stati con i segni, false, o niente)
 * @param segni   nome del segno → secondo
 * @param durata  secondi di un passaggio da uno stato all'altro
 */
export function statoProtagonista(
  ora: number,
  base: StatoPieno,
  scene: {inizio: number; stati: StatoProtagonista | StatoProtagonista[] | false | undefined}[],
  segni: Record<string, number>,
  durata = 0.6
): StatoPieno {
  let stato = base;
  for (const scena of scene) {
    if (ora < scena.inizio - durata * 0.3) break;
    const elenco = scena.stati === false ? [{presenza: 0} as StatoProtagonista] : scena.stati === undefined ? [] : Array.isArray(scena.stati) ? scena.stati : [scena.stati];
    elenco.forEach((passo, i) => {
      // il primo stato arriva con la scena (un attimo prima: si muove mentre la camera scatta), gli altri al loro segno
      const quando = i === 0 || !passo.segno ? scena.inizio - durata * 0.3 : (segni[passo.segno] ?? Infinity);
      if (ora <= quando) return;
      const {segno: _segno, ...resto} = passo;
      // una scena che lo rimette in campo senza dirlo lo fa tornare visibile
      const arrivo: StatoPieno = {...stato, ...(scena.stati !== false && i === 0 && resto.presenza === undefined ? {presenza: 1} : {}), ...resto};
      stato = mescolaStati(stato, arrivo, morbida(limita((ora - quando) / durata, 0, 1)));
    });
  }
  return stato;
}

export function Protagonista({def, stato}: {def: DefinizioneProtagonista; stato: StatoPieno}) {
  const {ora} = useTempo();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (stato.presenza <= 0.01) return null;
  const spento = '#7C8794';
  const colore = miscela(spento, stato.colore, stato.acceso);
  const larga = 420;
  let disegno;
  if (def.tipo === 'peptide') {
    const n = def.perle ?? 14;
    const piene = stato.carica * n;
    const punti = Array.from({length: n}, (_, i) => {
      const k = n === 1 ? 0.5 : i / (n - 1);
      return {x: (k - 0.5) * larga, y: Math.sin(i * 0.82 + ora * (1.4 + stato.onda * 2.2)) * (10 + stato.onda * 22) + Math.sin(k * Math.PI) * -14, k: limita(piene - i, 0, 1)};
    });
    disegno = (
      <>
        <polyline points={punti.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke={colore} strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {punti.map((p, i) => (
          <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
            {stato.acceso * p.k > 0.05 ? <circle r={30} fill={`url(#alone-${id})`} opacity={0.7 * stato.acceso * p.k} /> : null}
            <circle r={11} fill={miscela(spento, colore, p.k)} stroke="#06120F" strokeWidth={2.5} />
            <circle cx={-3.5} cy={-3.5} r={3.4} fill="#FFFFFF" opacity={0.25 + 0.5 * stato.acceso * p.k} />
          </g>
        ))}
      </>
    );
  } else if (def.tipo === 'goccia') {
    const livello = 60 - stato.carica * 120;
    disegno = (
      <>
        <circle r={96} fill={`url(#alone-${id})`} opacity={0.6 * stato.acceso} />
        <clipPath id={`taglio-${id}`}>
          <path d="M0,-78 C48,-18 62,14 62,36 A62,62 0 0 1 -62,36 C-62,14 -48,-18 0,-78 Z" />
        </clipPath>
        <path d="M0,-78 C48,-18 62,14 62,36 A62,62 0 0 1 -62,36 C-62,14 -48,-18 0,-78 Z" fill="#0B151B" stroke={colore} strokeWidth={5} />
        <rect x={-70} y={livello + Math.sin(ora * (2 + stato.onda * 3)) * (2 + stato.onda * 5)} width={140} height={200} fill={colore} opacity={0.85} clipPath={`url(#taglio-${id})`} />
        <path d="M-30,20 C-34,40 -22,58 -6,62" fill="none" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
      </>
    );
  } else {
    const batte = 1 + Math.sin(ora * (2 + stato.onda * 4)) * (0.02 + stato.onda * 0.04);
    disegno = (
      <g transform={`scale(${batte.toFixed(4)})`}>
        <circle r={104} fill={`url(#alone-${id})`} opacity={0.6 * stato.acceso} />
        <circle r={72} fill="#0B151B" stroke={colore} strokeWidth={6} />
        <circle r={72} fill={colore} opacity={0.12 + 0.3 * stato.carica} />
        <circle cx={14} cy={-8} r={26} fill={colore} opacity={0.35 + 0.5 * stato.carica} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={Math.cos(i * 1.9 + ora * 0.6) * 46} cy={Math.sin(i * 1.9 + ora * 0.6) * 46} r={6} fill="#FFFFFF" opacity={0.3 + 0.4 * stato.acceso} />
        ))}
      </g>
    );
  }
  return (
    <svg data-fmlab-protagonista={def.tipo} width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', opacity: stato.presenza}}>
      <defs>
        <radialGradient id={`alone-${id}`}>
          <stop offset="0" stopColor={stato.colore} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={stato.colore} stopOpacity="0.22" />
          <stop offset="1" stopColor={stato.colore} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(${stato.x.toFixed(1)} ${(stato.y + Math.sin(ora * 0.9) * 6).toFixed(1)}) scale(${stato.grandezza.toFixed(3)})`}>{disegno}</g>
    </svg>
  );
}
