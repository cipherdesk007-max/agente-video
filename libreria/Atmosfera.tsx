// FMLAB Reel Kit — l'atmosfera di ogni reel: fondo quasi nero, foschia colorata che si muove piano,
// pulviscolo luminoso e (se serve) raggi di luce dall'alto. È ciò che dà l'aria "cinematografica".
import {useId, useMemo} from 'react';
import {useTempo} from './tempo';
import {alfa} from './colore';
import {casuale} from './anim';
import {stile} from '../stile/stile';

let fumoInCache: string | null = null;

/** Trama di fumo generata una volta sola (sempre identica): bianco con trasparenza variabile. */
function tramaFumo(): string {
  if (fumoInCache) return fumoInCache;
  const L = 135;
  const A = 240;
  const tela = document.createElement('canvas');
  tela.width = L;
  tela.height = A;
  const ctx = tela.getContext('2d')!;
  const img = ctx.createImageData(L, A);
  const nodo = (x: number, y: number, ottava: number) => casuale(x * 0.731 + y * 127.13 + ottava * 911.7);
  const liscio = (t: number) => t * t * (3 - 2 * t);
  const rumore = (x: number, y: number, ottava: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = liscio(x - xi);
    const fy = liscio(y - yi);
    const a = nodo(xi, yi, ottava);
    const b = nodo(xi + 1, yi, ottava);
    const c = nodo(xi, yi + 1, ottava);
    const d = nodo(xi + 1, yi + 1, ottava);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      let v = 0;
      let peso = 0.5;
      let scala = 1 / 46;
      for (let o = 0; o < 4; o++) {
        v += rumore(x * scala, y * scala, o) * peso;
        peso *= 0.5;
        scala *= 2.1;
      }
      const forza = Math.max(0, (v - 0.36) * 2.2);
      const i = (y * L + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.min(255, Math.round(forza * forza * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  fumoInCache = tela.toDataURL('image/png');
  return fumoInCache;
}

export type PropsAtmosfera = {
  /** Colore della foschia. */
  tinta?: string;
  /** 0…1: quanto è densa la foschia. */
  densita?: number;
  /** 0…1: raggi di luce dall'alto (0 = nessuno). */
  raggi?: number;
};

export function Atmosfera({tinta, densita = 1, raggi = 0}: PropsAtmosfera) {
  const {ora, larghezza: L, altezza: A} = useTempo();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const colore = tinta ?? stile.colori.foschia;
  const fumo = tramaFumo();

  const granelli = useMemo(
    () =>
      Array.from({length: 54}, (_, i) => ({
        x: casuale(i + 1) * L,
        y: casuale(i + 101) * A,
        r: 1.6 + Math.pow(casuale(i + 201), 2.2) * 10,
        velocita: 7 + casuale(i + 301) * 20,
        fase: casuale(i + 401),
        dondolo: 14 + casuale(i + 501) * 40,
      })),
    [L, A]
  );

  const strato = (dx: number, dy: number, ingrandimento: number, opacita: number, specchia: boolean) => ({
    position: 'absolute' as const,
    left: -L * 0.25,
    top: -A * 0.15,
    width: L * 1.5,
    height: A * 1.3,
    background: colore,
    WebkitMaskImage: `url(${fumo})`,
    maskImage: `url(${fumo})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    opacity: opacita * densita,
    transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${specchia ? -ingrandimento : ingrandimento}, ${ingrandimento})`,
  });

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: stile.colori.fondo}}>
      {/* alone centrale: dà profondità al palco */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 42% at 50% 46%, ${alfa(colore, 0.2 * densita)} 0%, ${alfa(colore, 0.07 * densita)} 55%, ${alfa(colore, 0)} 100%)`,
        }}
      />
      <div style={strato(Math.sin(ora * 0.11) * 70, Math.cos(ora * 0.09) * 50 - ora * 3, 1.05, 0.2, false)} />
      <div style={strato(Math.cos(ora * 0.08) * 90, Math.sin(ora * 0.1) * 60 + ora * 2, 1.3, 0.13, true)} />

      {raggi > 0 ? (
        <svg width={L} height={A} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id={`raggio-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2 * raggi} />
              <stop offset="0.55" stopColor={colore} stopOpacity={0.07 * raggi} />
              <stop offset="1" stopColor={colore} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.2, 0.52, 0.83].map((px, k) => {
            const oscilla = Math.sin(ora * 0.35 + k * 2.1) * 26;
            const xAlto = L * px + oscilla * 0.3;
            const xBasso = L * (0.5 + (px - 0.5) * 0.55) + oscilla;
            return [70, 150, 250].map((apertura, j) => (
              <polygon
                key={`${k}-${j}`}
                points={`${xAlto - 20},-20 ${xAlto + 20},-20 ${xBasso + apertura},${A * 0.86} ${xBasso - apertura},${A * 0.86}`}
                fill={`url(#raggio-${id})`}
                opacity={0.55}
              />
            ));
          })}
        </svg>
      ) : null}

      <svg width={L} height={A} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`granello-${id}`}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="0.35" stopColor={colore} stopOpacity="0.5" />
            <stop offset="1" stopColor={colore} stopOpacity="0" />
          </radialGradient>
        </defs>
        {granelli.map((g, i) => {
          const y = (((g.y - ora * g.velocita) % (A + 60)) + (A + 60)) % (A + 60) - 30;
          const x = g.x + Math.sin(ora * 0.5 + g.fase * 6.28) * g.dondolo;
          const brillio = 0.2 + 0.32 * (0.5 + 0.5 * Math.sin(ora * (0.8 + g.fase) + g.fase * 12));
          return <circle key={i} cx={x} cy={y} r={g.r} fill={`url(#granello-${id})`} opacity={brillio} />;
        })}
      </svg>

      {/* scurisce i bordi: tiene leggibili sottotitoli e narratore */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 85% 62% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
