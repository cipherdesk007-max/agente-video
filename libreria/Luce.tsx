// FMLAB Reel Kit — la luce: bagliori, onde di segnale, linee luminose, fari.
// Su fondo scuro è la luce a far sembrare "3D" e preziosi gli oggetti: ogni cosa importante si illumina.
import {useId} from 'react';
import type {CSSProperties} from 'react';
import {alfa} from './colore';
import {limita} from './anim';
import {stile} from '../stile/stile';

/** Alone morbido di luce attorno a un punto. Mettilo DIETRO all'oggetto che deve brillare. */
export function Bagliore({x, y, raggio = 220, colore, forza = 0.5, style}: {x: number; y: number; raggio?: number; colore?: string; forza?: number; style?: CSSProperties}) {
  const c = colore ?? stile.colori.luce;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - raggio,
        top: y - raggio,
        width: raggio * 2,
        height: raggio * 2,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${alfa(c, forza)} 0%, ${alfa(c, forza * 0.42)} 32%, ${alfa(c, forza * 0.1)} 66%, ${alfa(c, 0)} 100%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

/** Punto luminoso: nucleo chiaro + alone. Tanti in fila fanno una "catena" o una scia. */
export function Lume({x, y, r = 12, colore, forza = 1}: {x: number; y: number; r?: number; colore?: string; forza?: number}) {
  const c = colore ?? stile.colori.luce;
  const R = r * 4.2;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - R,
        top: y - R,
        width: R * 2,
        height: R * 2,
        borderRadius: '50%',
        opacity: forza,
        background: `radial-gradient(closest-side, #FFFFFF 0%, ${alfa(c, 1)} ${(100 / 4.2) * 0.75}%, ${alfa(c, 0.5)} ${100 / 4.2}%, ${alfa(c, 0.16)} 55%, ${alfa(c, 0)} 100%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Onde che partono da un punto (segnali radio, impulsi, battiti).
 * `t` = secondi da quando partono. Con `verso` e `apertura` diventano archi in una sola direzione.
 */
export function Onde({
  x,
  y,
  t,
  colore,
  quante = 3,
  periodo = 1.1,
  raggioMax = 300,
  spessore = 5,
  forza = 1,
  verso,
  apertura = 70,
}: {
  x: number;
  y: number;
  t: number;
  colore?: string;
  quante?: number;
  periodo?: number;
  raggioMax?: number;
  spessore?: number;
  forza?: number;
  /** Direzione in gradi (0 = destra, 90 = giù). Se manca: cerchi completi. */
  verso?: number;
  /** Ampiezza dell'arco in gradi, se c'è `verso`. */
  apertura?: number;
}) {
  if (t <= 0) return null;
  const c = colore ?? stile.colori.luce;
  const lato = raggioMax + spessore * 4;
  const nucleo = [];
  const alone = [];
  for (let k = 0; k < quante; k++) {
    const corsa = t / periodo - k / quante;
    if (corsa < 0) continue;
    const fase = corsa % 1;
    const r = fase * raggioMax;
    const opacita = Math.pow(1 - fase, 1.4) * forza;
    let d: string;
    if (verso === undefined) {
      d = `M ${lato - r} ${lato} A ${r} ${r} 0 1 0 ${lato + r} ${lato} A ${r} ${r} 0 1 0 ${lato - r} ${lato}`;
    } else {
      const a0 = ((verso - apertura / 2) * Math.PI) / 180;
      const a1 = ((verso + apertura / 2) * Math.PI) / 180;
      d = `M ${lato + Math.cos(a0) * r} ${lato + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${lato + Math.cos(a1) * r} ${lato + Math.sin(a1) * r}`;
    }
    alone.push(<path key={k} d={d} fill="none" stroke={c} strokeWidth={spessore * 3.4} strokeLinecap="round" opacity={opacita * 0.3} />);
    nucleo.push(<path key={k} d={d} fill="none" stroke={c} strokeWidth={spessore} strokeLinecap="round" opacity={opacita} />);
  }
  return (
    <svg width={lato * 2} height={lato * 2} style={{position: 'absolute', left: x - lato, top: y - lato, overflow: 'visible', pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {alone}
      {nucleo}
    </svg>
  );
}

/**
 * Linea luminosa da un punto a un altro. `p` (0…1) è quanta se ne vede: usala per "disegnarla".
 * Con `impulso` (0…1) un punto di luce corre lungo la linea.
 */
export function Linea({
  da,
  a,
  p = 1,
  colore,
  spessore = 5,
  tratteggio,
  impulso,
  opacita = 1,
}: {
  da: [number, number];
  a: [number, number];
  p?: number;
  colore?: string;
  spessore?: number;
  tratteggio?: string;
  impulso?: number;
  opacita?: number;
}) {
  const c = colore ?? stile.colori.luce;
  const q = limita(p);
  if (q <= 0 || opacita <= 0) return null;
  const fx = da[0] + (a[0] - da[0]) * q;
  const fy = da[1] + (a[1] - da[1]) * q;
  const ix = impulso === undefined ? 0 : da[0] + (a[0] - da[0]) * limita(impulso);
  const iy = impulso === undefined ? 0 : da[1] + (a[1] - da[1]) * limita(impulso);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', mixBlendMode: 'screen', opacity: opacita}}>
      <line x1={da[0]} y1={da[1]} x2={fx} y2={fy} stroke={c} strokeWidth={spessore * 3.4} strokeLinecap="round" opacity={0.22} />
      <line x1={da[0]} y1={da[1]} x2={fx} y2={fy} stroke={c} strokeWidth={spessore} strokeLinecap="round" strokeDasharray={tratteggio} />
      {impulso !== undefined && impulso > 0 && impulso < 1 ? (
        <g>
          <circle cx={ix} cy={iy} r={spessore * 5} fill={c} opacity={0.28} />
          <circle cx={ix} cy={iy} r={spessore * 2.2} fill="#FFFFFF" />
        </g>
      ) : null}
    </svg>
  );
}

/** Faro: cono di luce che scende da un punto (riflettori, proiettori, "raggio" di un satellite). */
export function Faro({
  x,
  y,
  verso = 90,
  lunghezza = 700,
  apertura = 34,
  colore,
  forza = 0.5,
}: {
  x: number;
  y: number;
  /** Direzione in gradi (90 = verso il basso). */
  verso?: number;
  lunghezza?: number;
  /** Ampiezza del cono in gradi. */
  apertura?: number;
  colore?: string;
  forza?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const c = colore ?? stile.colori.luce;
  const strati = [1, 0.66, 0.36];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`faro-${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={lunghezza} y2={0}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={forza * 0.7} />
          <stop offset="0.25" stopColor={c} stopOpacity={forza * 0.42} />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform={`translate(${x} ${y}) rotate(${verso})`}>
        {strati.map((k, i) => {
          const mezza = Math.tan(((apertura * k) / 2) * (Math.PI / 180)) * lunghezza;
          return <polygon key={i} points={`0,-4 ${lunghezza},${-mezza} ${lunghezza},${mezza} 0,4`} fill={`url(#faro-${id})`} opacity={0.5} />;
        })}
      </g>
    </svg>
  );
}
