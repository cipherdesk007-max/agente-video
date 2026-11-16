// FMLAB Reel Kit — la camera: si muove sul "mondo" della scena invece di tagliare.
// Disegna la scena in coordinate normali (1080x1920) e poi decidi dove guarda la camera:
//
//   const vista = vistaA(s.t, [
//     {quando: 0, x: 300, y: 900, zoom: 2.4},                    // parte stretta su un dettaglio
//     {quando: s.segno('km'), x: 540, y: 880, zoom: 1, durata: 1}, // alla parola "km" si allarga
//   ]);
//   <Camera {...vista}> …la scena… </Camera>
import type {ReactNode} from 'react';
import {curve, mix, rampa} from './anim';
import type {Curva} from './anim';
import {stile} from '../stile/stile';

export type Vista = {
  /** Punto del mondo che finisce al centro del palco. */
  x: number;
  y: number;
  /** 1 = grandezza naturale, 2 = il doppio. */
  zoom: number;
  /** Gradi di inclinazione. */
  ruota?: number;
};

export type Tappa = Vista & {
  /** Secondo in cui la camera PARTE verso questa vista. La prima tappa è la vista iniziale. */
  quando: number;
  /** Durata del movimento in secondi (0,9 se manca). */
  durata?: number;
  curva?: Curva;
};

/** Vista della camera all'istante t, passando in modo morbido da una tappa all'altra. */
export function vistaA(t: number, tappe: Tappa[]): Vista {
  let v: Vista = {x: tappe[0].x, y: tappe[0].y, zoom: tappe[0].zoom, ruota: tappe[0].ruota ?? 0};
  for (let i = 1; i < tappe.length; i++) {
    const tp = tappe[i];
    const p = rampa(t - tp.quando, tp.durata ?? 0.9, tp.curva ?? curve.morbida);
    if (p <= 0) continue;
    v = {
      x: mix(v.x, tp.x, p),
      y: mix(v.y, tp.y, p),
      // lo zoom si mescola in scala logaritmica: sembra un movimento a velocità costante
      zoom: Math.exp(mix(Math.log(v.zoom), Math.log(tp.zoom), p)),
      ruota: mix(v.ruota ?? 0, tp.ruota ?? 0, p),
    };
  }
  return v;
}

/** Vista neutra: il mondo coincide con l'inquadratura. */
export const VISTA_PIENA: Vista = {x: stile.palco.centroX, y: stile.palco.centroY, zoom: 1, ruota: 0};

export function Camera({x, y, zoom, ruota = 0, children}: Vista & {children: ReactNode}) {
  const {centroX, centroY} = stile.palco;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: '0 0',
        transform: `translate(${centroX}px, ${centroY}px) rotate(${ruota.toFixed(3)}deg) scale(${zoom.toFixed(5)}) translate(${(-x).toFixed(2)}px, ${(-y).toFixed(2)}px)`,
      }}
    >
      {children}
    </div>
  );
}
