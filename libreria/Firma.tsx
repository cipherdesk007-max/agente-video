// FMLAB Reel Kit — la firma in alto, sempre presente, e le guide delle zone sicure.
import {stile} from '../stile/stile';

/** Piccolo marchio in alto al centro. */
export function Firma() {
  const spazio = 0.4;
  return (
    <div
      data-fmlab-zona="firma"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: stile.firma.y,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        fontFamily: stile.font.titoli,
        fontWeight: 900,
        fontSize: 24,
        lineHeight: 1,
        letterSpacing: `${spazio}em`,
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      <span style={{width: 9, height: 9, borderRadius: 5, background: stile.colori.luce, display: 'block'}} />
      <span style={{marginRight: `-${spazio}em`}}>{stile.marchio}</span>
    </div>
  );
}

/** Mostra in rosso le zone coperte dall'app (solo per controllare, mai nel video finale). */
export function Guide() {
  const z = stile.zone;
  const rosso = 'rgba(255,60,80,0.28)';
  const bordo = '2px dashed rgba(255,120,130,0.9)';
  const etichetta = {
    position: 'absolute' as const,
    left: 16,
    fontFamily: stile.font.testo,
    fontWeight: 600,
    fontSize: 24,
    color: '#fff',
  };
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: z.alto, background: rosso, borderBottom: bordo}}>
        <span style={{...etichetta, top: 16}}>coperto dall'app (alto)</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: z.basso, bottom: 0, background: rosso, borderTop: bordo}}>
        <span style={{...etichetta, top: 16}}>coperto dall'app (nome, didascalia)</span>
      </div>
      <div style={{position: 'absolute', left: z.icone.x, right: 0, top: z.icone.y, height: z.basso - z.icone.y, background: rosso, borderLeft: bordo, borderTop: bordo}} />
      <div style={{position: 'absolute', left: 0, width: z.sinistra, top: z.alto, height: z.basso - z.alto, background: 'rgba(255,60,80,0.14)'}} />
      <div style={{position: 'absolute', left: z.destra, right: 0, top: z.alto, height: z.icone.y - z.alto, background: 'rgba(255,60,80,0.14)'}} />
    </div>
  );
}
