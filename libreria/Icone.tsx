// FMLAB Reel Kit — ICONE. Qualsiasi icona di react-icons (Font Awesome, Material, Tabler, Lucide, Phosphor… migliaia)
// diventa un oggetto del palco: entra con un piccolo rimbalzo, si illumina, può avere un tondo dietro e un nome sotto.
//
//   import {FaHeartPulse} from 'react-icons/fa6';
//   <Icona disegno={FaHeartPulse} x={540} y={800} dimensione={220} da={s.dopo('cuore')} />
//
// Per trovare il nome giusto:  npm run icone cuore   (cerca anche in italiano e stampa la riga di import).
import type {ComponentType, CSSProperties} from 'react';
import {mix, molla, rampa, curve} from './anim';
import {alfa} from './colore';
import {stile} from '../stile/stile';

/** Un'icona di react-icons (o qualsiasi componente che accetti `size` e `color`). */
export type DisegnoIcona = ComponentType<{size?: string | number; color?: string; style?: CSSProperties}>;

export function Icona({
  disegno: Disegno,
  x,
  y,
  dimensione = 180,
  colore = stile.colori.luce,
  tondo = false,
  etichetta,
  da,
  fino,
  spento = 0,
}: {
  disegno: DisegnoIcona;
  x: number;
  y: number;
  dimensione?: number;
  colore?: string;
  /** Un disco scuro con il bordo luminoso dietro l'icona: la stacca dal fondo. */
  tondo?: boolean;
  /** Nome sotto l'icona. */
  etichetta?: string;
  /** Secondi da quando deve comparire (di solito s.dopo('segno')). */
  da: number;
  /** Secondi da quando deve sparire. */
  fino?: number;
  /** 0…1: quanto è attenuata (per lasciare accesa solo l'ultima di una fila). */
  spento?: number;
}) {
  if (da <= 0) return null;
  const uscita = fino === undefined ? 0 : rampa(fino, 0.25, curve.entra);
  if (uscita >= 1) return null;
  const p = molla(da, {rigidita: 210, smorzamento: 15});
  const opacita = rampa(da, 0.14) * (1 - uscita) * (1 - 0.6 * spento);
  const lato = tondo ? dimensione * 1.62 : dimensione;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(0.55, 1, p).toFixed(4)})`, opacity: opacita, textAlign: 'center'}}>
      <div
        style={{
          width: lato,
          height: lato,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: tondo ? 'rgba(5,10,12,0.82)' : undefined,
          border: tondo ? `3px solid ${alfa(colore, 0.85)}` : undefined,
          boxShadow: tondo ? `0 0 ${dimensione * 0.34}px ${alfa(colore, 0.35)}, inset 0 0 ${dimensione * 0.3}px ${alfa(colore, 0.12)}` : undefined,
          boxSizing: 'border-box',
        }}
      >
        <Disegno size={dimensione} color={colore} style={{filter: `drop-shadow(0 0 ${Math.round(dimensione * 0.12)}px ${alfa(colore, 0.65)})`, display: 'block'}} />
      </div>
      {etichetta ? (
        <div data-fmlab-zona="testo" style={{marginTop: dimensione * 0.14, whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 800, fontSize: Math.max(26, Math.min(44, dimensione * 0.24)), lineHeight: 1.05, color: stile.colori.testo, textShadow: '0 2px 10px rgba(0,0,0,0.8)'}}>
          {etichetta}
        </div>
      ) : null}
    </div>
  );
}
