// FMLAB Reel Kit — SCHIZZI. Segni fatti "a mano" (con roughjs): un cerchio attorno a un numero, una freccia,
// una sottolineatura, un riquadro. Si disegnano da soli mentre `p` va da 0 a 1 e restano sempre uguali da un
// render all'altro (stesso `seme`, stesso tratto).
//
//   <SchizzoCerchio x={540} y={700} larghezza={420} altezza={220} p={rampa(s.dopo('numero'), 0.5)} />
import rough from 'roughjs';
import {limita} from './anim';
import {alfa} from './colore';
import {stile} from '../stile/stile';

const penna = rough.generator();
type Tratto = {d: string};
type Comune = {
  colore?: string;
  spessore?: number;
  /** 0…1: quanto del segno è già disegnato. */
  p?: number;
  /** Cambia la "mano": stesso numero, stesso identico segno. */
  seme?: number;
  /** Quanto trema il tratto (1 = normale, 0 = preciso). */
  mano?: number;
  opacita?: number;
};

function Disegno({tratti, colore = stile.colori.accento, spessore = 7, p = 1, opacita = 1, x, y, larghezza, altezza, punta}: Comune & {tratti: Tratto[]; x: number; y: number; larghezza: number; altezza: number; punta?: string}) {
  const q = limita(p);
  if (q <= 0 || opacita <= 0) return null;
  const m = 60;
  return (
    <svg width={larghezza + m * 2} height={altezza + m * 2} viewBox={`${-m} ${-m} ${larghezza + m * 2} ${altezza + m * 2}`} style={{position: 'absolute', left: x - m, top: y - m, overflow: 'visible', opacity: opacita, filter: `drop-shadow(0 0 10px ${alfa(colore, 0.55)})`}}>
      {tratti.map((t, i) => (
        <path key={i} d={t.d} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={(1 - q).toFixed(4)} />
      ))}
      {punta && q > 0.92 ? <path d={punta} fill="none" stroke={colore} strokeWidth={spessore} strokeLinecap="round" strokeLinejoin="round" opacity={limita((q - 0.92) / 0.08)} /> : null}
    </svg>
  );
}

const opzioni = (seme: number, mano: number, spessore: number) => ({seed: Math.max(1, Math.round(seme)), roughness: 1.5 * mano, bowing: 1.2 * mano, strokeWidth: spessore, disableMultiStrokeFill: true});

/** Un ovale tracciato a mano attorno a qualcosa: x e y sono il centro. */
export function SchizzoCerchio({x, y, larghezza, altezza, seme = 1, mano = 1, spessore = 7, ...resto}: Comune & {x: number; y: number; larghezza: number; altezza: number}) {
  const tratti = penna.toPaths(penna.ellipse(larghezza / 2, altezza / 2, larghezza, altezza, opzioni(seme, mano, spessore)));
  return <Disegno tratti={tratti} x={x - larghezza / 2} y={y - altezza / 2} larghezza={larghezza} altezza={altezza} spessore={spessore} {...resto} />;
}

/** Un riquadro a mano: x e y sono il centro. */
export function SchizzoRiquadro({x, y, larghezza, altezza, seme = 1, mano = 1, spessore = 7, ...resto}: Comune & {x: number; y: number; larghezza: number; altezza: number}) {
  const tratti = penna.toPaths(penna.rectangle(0, 0, larghezza, altezza, opzioni(seme, mano, spessore)));
  return <Disegno tratti={tratti} x={x - larghezza / 2} y={y - altezza / 2} larghezza={larghezza} altezza={altezza} spessore={spessore} {...resto} />;
}

/** Una sottolineatura a mano, da sinistra a destra: x e y sono il suo centro. */
export function SchizzoSottolinea({x, y, larghezza, seme = 1, mano = 1, spessore = 8, ...resto}: Comune & {x: number; y: number; larghezza: number}) {
  const tratti = penna.toPaths(penna.line(0, 10, larghezza, 10, opzioni(seme, mano, spessore)));
  return <Disegno tratti={tratti} x={x - larghezza / 2} y={y - 10} larghezza={larghezza} altezza={20} spessore={spessore} {...resto} />;
}

/** Una freccia curva a mano dal punto `da` al punto `a`. `curva` la piega (0 = dritta; negativo = dall'altra parte). */
export function SchizzoFreccia({da, a, curva = 0.22, seme = 1, mano = 1, spessore = 7, ...resto}: Comune & {da: [number, number]; a: [number, number]; curva?: number}) {
  const x0 = Math.min(da[0], a[0]);
  const y0 = Math.min(da[1], a[1]);
  const larghezza = Math.abs(a[0] - da[0]) || 1;
  const altezza = Math.abs(a[1] - da[1]) || 1;
  const p1: [number, number] = [da[0] - x0, da[1] - y0];
  const p2: [number, number] = [a[0] - x0, a[1] - y0];
  const lunga = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
  // il punto di mezzo, spostato di lato: è lui che fa la curva
  const nx = -(p2[1] - p1[1]) / lunga;
  const ny = (p2[0] - p1[0]) / lunga;
  const mezzo: [number, number] = [(p1[0] + p2[0]) / 2 + nx * lunga * curva, (p1[1] + p2[1]) / 2 + ny * lunga * curva];
  const tratti = penna.toPaths(penna.curve([p1, mezzo, p2], {...opzioni(seme, mano * 0.6, spessore), disableMultiStroke: true}));
  // la punta: due baffi all'arrivo, nella direzione in cui arriva la curva
  const dx = p2[0] - mezzo[0];
  const dy = p2[1] - mezzo[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const baffo = Math.max(22, Math.min(46, lunga * 0.16));
  const ala = (segno: number) => `${(p2[0] - ux * baffo + segno * -uy * baffo * 0.6).toFixed(1)} ${(p2[1] - uy * baffo + segno * ux * baffo * 0.6).toFixed(1)}`;
  const punta = `M ${ala(1)} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L ${ala(-1)}`;
  return <Disegno tratti={tratti} punta={punta} x={x0} y={y0} larghezza={larghezza} altezza={altezza} spessore={spessore} {...resto} />;
}
