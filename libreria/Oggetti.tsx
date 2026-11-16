// FMLAB Reel Kit — oggetti pronti da mettere sul palco: satellite, telefono, orologio, divieto, segnaposto.
// Sono disegnati con sfumature e riflessi per sembrare solidi su fondo scuro. Quando un reel ha bisogno
// di un oggetto nuovo (fiala, cuore, batteria…), si aggiunge qui con lo stesso schema e resta per i prossimi.
import {useId} from 'react';
import type {ReactNode} from 'react';
import {alfa} from './colore';
import {limita} from './anim';
import {stile} from '../stile/stile';

/** Satellite: corpo dorato, due pannelli solari, antenna verso il basso. `dimensione` = larghezza totale in pixel. */
export function Satellite({x, y, dimensione = 200, ruota = 0, acceso = 1, opacita = 1}: {x: number; y: number; dimensione?: number; ruota?: number; acceso?: number; opacita?: number}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const c = stile.colori.contorno;
  const luce = stile.colori.luce;
  const k = dimensione / 220;
  return (
    <svg
      width={220 * k}
      height={160 * k}
      viewBox="-110 -80 220 160"
      style={{position: 'absolute', left: x - 110 * k, top: y - 80 * k, overflow: 'visible', opacity: opacita, transform: `rotate(${ruota}deg)`}}
    >
      <defs>
        <linearGradient id={`oro-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.5" stopColor="#E3B04B" />
          <stop offset="1" stopColor="#8A5F1C" />
        </linearGradient>
        <linearGradient id={`pannello-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3D7BE0" />
          <stop offset="1" stopColor="#12306B" />
        </linearGradient>
        <radialGradient id={`alone-${id}`}>
          <stop offset="0" stopColor={luce} stopOpacity={0.5 * acceso} />
          <stop offset="1" stopColor={luce} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={120} fill={`url(#alone-${id})`} />
      {[-1, 1].map((lato) => (
        <g key={lato} transform={`scale(${lato} 1)`}>
          <rect x={22} y={-5} width={14} height={10} fill="#9AA6BD" stroke={c} strokeWidth={3} />
          <rect x={34} y={-26} width={70} height={52} rx={4} fill={`url(#pannello-${id})`} stroke={c} strokeWidth={4} />
          <path d="M 51.5 -26 V 26 M 69 -26 V 26 M 86.5 -26 V 26 M 34 0 H 104" stroke="#8FB8FF" strokeOpacity={0.55} strokeWidth={2} />
          <path d="M 38 -22 H 100" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} />
        </g>
      ))}
      <path d="M 0 30 L 0 46" stroke={c} strokeWidth={5} />
      <path d="M -17 46 Q 0 68 17 46 Z" fill="#DDE5F4" stroke={c} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-24} y={-34} width={48} height={66} rx={9} fill={`url(#oro-${id})`} stroke={c} strokeWidth={4.5} />
      <rect x={-15} y={-24} width={30} height={16} rx={4} fill="#0B1322" stroke={c} strokeWidth={3} />
      <circle cx={0} cy={12} r={6} fill={luce} opacity={0.4 + 0.6 * acceso} />
      <path d="M -18 -30 L -6 -30" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Telefono. `larghezza` in pixel (l'altezza è il doppio). Dentro `children` va quello che si vede sullo schermo,
 * disegnato in un'area 300 x 600. `inclina` = [gradi avanti/indietro, gradi destra/sinistra] per metterlo in prospettiva.
 */
export function Telefono({
  x,
  y,
  larghezza = 240,
  inclina = [0, 0],
  ruota = 0,
  luce = 1,
  opacita = 1,
  children,
}: {
  x: number;
  y: number;
  larghezza?: number;
  inclina?: [number, number];
  ruota?: number;
  /** 0…1: quanto è acceso lo schermo. */
  luce?: number;
  opacita?: number;
  children?: ReactNode;
}) {
  const k = larghezza / 300;
  const c = stile.colori.luce;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 150,
        top: y - 300,
        width: 300,
        height: 600,
        opacity: opacita,
        transform: `scale(${k}) perspective(1400px) rotateX(${inclina[0]}deg) rotateY(${inclina[1]}deg) rotate(${ruota}deg)`,
      }}
    >
      {/* spessore: più strati sfalsati */}
      {[5, 4, 3, 2, 1].map((s) => (
        <div key={s} style={{position: 'absolute', inset: 0, borderRadius: 46, background: '#05080D', transform: `translate(${s * 1.6}px, ${s * 2.2}px)`}} />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 46,
          background: 'linear-gradient(145deg, #6B7790 0%, #2A3447 34%, #121824 100%)',
          boxShadow: `0 0 0 3px ${stile.colori.contorno}, inset 0 0 0 3px rgba(255,255,255,0.16), 0 0 ${70 * luce}px ${alfa(c, 0.5 * luce)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 13,
          top: 13,
          right: 13,
          bottom: 13,
          borderRadius: 35,
          overflow: 'hidden',
          background: `radial-gradient(ellipse at 50% 45%, ${alfa(c, 0.2 + 0.3 * luce)} 0%, #0B2233 75%), #0B2233`,
        }}
      >
        {children}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%)'}} />
      </div>
      <div style={{position: 'absolute', left: 110, top: 24, width: 80, height: 20, borderRadius: 12, background: '#020406'}} />
    </div>
  );
}

/** Mappa stilizzata per lo schermo del telefono (area 300 x 600), con il puntino della posizione. */
export function MappaSchermo({puntoX = 150, puntoY = 300, battito = 0, colore}: {puntoX?: number; puntoY?: number; battito?: number; colore?: string}) {
  const c = colore ?? stile.colori.luce2;
  const strade = 'M -20 120 L 320 60 M -20 260 L 320 220 M -20 420 L 320 470 M 70 -20 L 110 620 M 210 -20 L 180 620 M -20 520 L 320 330';
  return (
    <svg width={274} height={574} viewBox="13 13 274 574" style={{position: 'absolute', inset: 0}}>
      <path d={strade} stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={18} strokeLinecap="round" />
      <path d={strade} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} />
      <circle cx={puntoX} cy={puntoY} r={26 + battito * 60} fill={c} opacity={0.28 * (1 - battito)} />
      <circle cx={puntoX} cy={puntoY} r={24} fill={c} opacity={0.3} />
      <circle cx={puntoX} cy={puntoY} r={13} fill={c} stroke="#FFFFFF" strokeWidth={5} />
    </svg>
  );
}

/** Orologio a lancette. `secondi` muove le lancette (60 = un giro della lancetta lunga). */
export function Orologio({x, y, raggio = 120, secondi, colore, opacita = 1}: {x: number; y: number; raggio?: number; secondi: number; colore?: string; opacita?: number}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const c = colore ?? stile.colori.luce;
  const lunga = (secondi / 60) * 360;
  const corta = (secondi / 720) * 360 + 50;
  return (
    <svg width={raggio * 2.6} height={raggio * 2.6} viewBox="-130 -130 260 260" style={{position: 'absolute', left: x - raggio * 1.3, top: y - raggio * 1.3, overflow: 'visible', opacity: opacita}}>
      <defs>
        <radialGradient id={`quadrante-${id}`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#1B2A3A" />
          <stop offset="1" stopColor="#05090F" />
        </radialGradient>
        <radialGradient id={`alone-${id}`}>
          <stop offset="0.7" stopColor={c} stopOpacity="0.4" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r={130} fill={`url(#alone-${id})`} />
      <circle r={100} fill={`url(#quadrante-${id})`} stroke={c} strokeWidth={6} />
      {Array.from({length: 12}, (_, k) => (
        <path key={k} d="M 0 -88 L 0 -76" stroke={k % 3 === 0 ? '#FFFFFF' : alfa('#FFFFFF', 0.45)} strokeWidth={k % 3 === 0 ? 6 : 3.5} strokeLinecap="round" transform={`rotate(${k * 30})`} />
      ))}
      <path d="M 0 8 L 0 -48" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" transform={`rotate(${corta.toFixed(2)})`} />
      <path d="M 0 12 L 0 -74" stroke={c} strokeWidth={6} strokeLinecap="round" transform={`rotate(${lunga.toFixed(2)})`} />
      <circle r={9} fill="#FFFFFF" />
    </svg>
  );
}

/** Divieto rosso (cerchio barrato). `p` da 0 a 1 lo disegna. */
export function Divieto({x, y, raggio = 150, p = 1, opacita = 1}: {x: number; y: number; raggio?: number; p?: number; opacita?: number}) {
  const q = limita(p);
  if (q <= 0) return null;
  const r = raggio;
  const giro = 2 * Math.PI * r;
  const rosso = stile.colori.negativo;
  const barra = limita((q - 0.55) / 0.45);
  const d = r * Math.SQRT1_2;
  return (
    <svg width={r * 2.4} height={r * 2.4} viewBox={`${-r * 1.2} ${-r * 1.2} ${r * 2.4} ${r * 2.4}`} style={{position: 'absolute', left: x - r * 1.2, top: y - r * 1.2, overflow: 'visible', opacity: opacita}}>
      <circle r={r} fill={alfa(rosso, 0.12)} stroke={alfa(rosso, 0.3)} strokeWidth={r * 0.34} strokeDasharray={`${giro * limita(q / 0.6)} ${giro}`} transform="rotate(-135)" />
      <circle r={r} fill="none" stroke={rosso} strokeWidth={r * 0.17} strokeLinecap="round" strokeDasharray={`${giro * limita(q / 0.6)} ${giro}`} transform="rotate(-135)" />
      {barra > 0 ? <path d={`M ${-d} ${-d} L ${-d + 2 * d * barra} ${-d + 2 * d * barra}`} stroke={rosso} strokeWidth={r * 0.17} strokeLinecap="round" /> : null}
    </svg>
  );
}

/** Segnaposto luminoso ("sei qui"). `p` da 0 a 1 lo fa cadere al suo posto. */
export function Segnaposto({x, y, dimensione = 90, colore, p = 1}: {x: number; y: number; dimensione?: number; colore?: string; p?: number}) {
  const q = limita(p, 0, 1.2);
  if (q <= 0) return null;
  const c = colore ?? stile.colori.accento;
  const k = dimensione / 90;
  const caduta = (1 - Math.min(1, q)) * -160;
  return (
    <svg width={160 * k} height={200 * k} viewBox="-80 -150 160 200" style={{position: 'absolute', left: x - 80 * k, top: y - 150 * k, overflow: 'visible', opacity: limita(q * 3)}}>
      <ellipse cx={0} cy={0} rx={34 * Math.min(1, q)} ry={11 * Math.min(1, q)} fill={c} opacity={0.35} />
      <g transform={`translate(0 ${caduta.toFixed(1)})`}>
        <path d="M 0 0 C -10 -34 -42 -52 -42 -88 A 42 42 0 1 1 42 -88 C 42 -52 10 -34 0 0 Z" fill={c} stroke={stile.colori.contorno} strokeWidth={6} strokeLinejoin="round" />
        <circle cx={0} cy={-88} r={16} fill={stile.colori.contorno} />
        <path d="M -24 -112 A 34 34 0 0 1 6 -124" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={6} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Spunta dentro un cerchio. `p` da 0 a 1 la disegna. */
export function Spunta({x, y, raggio = 44, colore, p = 1}: {x: number; y: number; raggio?: number; colore?: string; p?: number}) {
  const q = limita(p);
  if (q <= 0) return null;
  const c = colore ?? stile.colori.positivo;
  const k = raggio / 44;
  return (
    <svg width={110 * k} height={110 * k} viewBox="-55 -55 110 110" style={{position: 'absolute', left: x - 55 * k, top: y - 55 * k, overflow: 'visible'}}>
      <circle r={44 * Math.min(1, q * 2)} fill={alfa(c, 0.18)} stroke={c} strokeWidth={6} />
      <path d="M -20 2 L -5 17 L 22 -14" fill="none" stroke={c} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${66 * limita((q - 0.3) / 0.7)} 66`} />
    </svg>
  );
}
