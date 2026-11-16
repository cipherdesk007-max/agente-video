// FMLAB Reel Kit — le scritte che stanno sul palco: numeri grandi, targhe, etichette, cartello finale.
// Regola: poche parole, grandi. Il discorso lo fa la voce; sul palco vanno solo cifre e nomi.
// Tutte prendono `da` = secondi da quando devono comparire (di solito s.dopo('segno')):
// prima di zero non si vedono, poi entrano da sole. Con `fino` (secondi all'uscita) spariscono.
import type {CSSProperties, ReactNode} from 'react';
import {curve, mix, molla, rampa} from './anim';
import {alfa} from './colore';
import {stile} from '../stile/stile';
import {useTempo} from './tempo';

type Presenza = {
  /** Secondi trascorsi dal momento in cui deve comparire. */
  da: number;
  /** Secondi trascorsi dal momento in cui deve sparire (negativo = non ancora). */
  fino?: number;
};

function presenza({da, fino}: Presenza) {
  const arrivo = molla(da, {rigidita: 230, smorzamento: 18});
  const uscita = fino === undefined ? 0 : rampa(fino, 0.25, curve.entra);
  return {visibile: da > 0 && uscita < 1, arrivo, opacita: rampa(da, 0.14) * (1 - uscita)};
}

const centrato = (x: number, y: number, extra = ''): CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  transform: `translate(-50%, -50%) ${extra}`,
  whiteSpace: 'nowrap',
});

/** Numero grande con una piccola etichetta sotto:  2022 / AGGIUNTO  ·  20.200 / KM DI QUOTA */
export function Cifra({
  x,
  y,
  valore,
  etichetta,
  dimensione = 150,
  colore,
  da,
  fino,
}: Presenza & {x: number; y: number; valore: ReactNode; etichetta?: ReactNode; dimensione?: number; colore?: string}) {
  const p = presenza({da, fino});
  if (!p.visibile) return null;
  const c = colore ?? stile.colori.testo;
  return (
    <div data-fmlab-zona="testo" style={{...centrato(x, y, `scale(${mix(0.72, 1, p.arrivo).toFixed(4)})`), opacity: p.opacita, textAlign: 'center'}}>
      <div
        style={{
          fontFamily: stile.font.titoli,
          fontWeight: 900,
          fontSize: dimensione,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          fontFeatureSettings: '"tnum"',
          color: c,
          textShadow: `0 0 ${Math.round(dimensione * 0.3)}px ${alfa(colore ?? stile.colori.luce, 0.55)}, 0 4px 14px rgba(0,0,0,0.6)`,
        }}
      >
        {valore}
      </div>
      {etichetta ? (
        <div
          style={{
            marginTop: dimensione * 0.1,
            fontFamily: stile.font.titoli,
            fontWeight: 700,
            fontSize: Math.max(26, dimensione * 0.2),
            letterSpacing: '0.3em',
            marginRight: '-0.3em',
            textTransform: 'uppercase',
            color: '#DCE6F2',
            textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            opacity: rampa(da - 0.12, 0.25),
          }}
        >
          {etichetta}
        </div>
      ) : null}
    </div>
  );
}

/** Targa: riquadro scuro con bordo luminoso, titolo e riga piccola sotto:  2 STUDI / SU PERSONE */
export function Targa({
  x,
  y,
  titolo,
  sotto,
  colore,
  dimensione = 58,
  da,
  fino,
}: Presenza & {x: number; y: number; titolo: ReactNode; sotto?: ReactNode; colore?: string; dimensione?: number}) {
  const p = presenza({da, fino});
  if (!p.visibile) return null;
  const c = colore ?? stile.colori.luce;
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        ...centrato(x, y, `scale(${mix(0.8, 1, p.arrivo).toFixed(4)})`),
        opacity: p.opacita,
        textAlign: 'center',
        padding: `${dimensione * 0.22}px ${dimensione * 0.5}px ${dimensione * 0.26}px`,
        borderRadius: dimensione * 0.3,
        background: 'rgba(5,10,12,0.84)',
        border: `2.5px solid ${alfa(c, 0.85)}`,
        boxShadow: `0 0 ${dimensione * 0.6}px ${alfa(c, 0.35)}, inset 0 0 ${dimensione * 0.5}px ${alfa(c, 0.12)}`,
      }}
    >
      <div style={{fontFamily: stile.font.titoli, fontWeight: 900, fontSize: dimensione, lineHeight: 1, letterSpacing: '-0.01em', color: stile.colori.testo, fontFeatureSettings: '"tnum"'}}>
        {titolo}
      </div>
      {sotto ? (
        <div
          style={{
            marginTop: dimensione * 0.14,
            fontFamily: stile.font.titoli,
            fontWeight: 700,
            fontSize: Math.max(20, dimensione * 0.34),
            letterSpacing: '0.26em',
            marginRight: '-0.26em',
            textTransform: 'uppercase',
            color: c,
          }}
        >
          {sotto}
        </div>
      ) : null}
    </div>
  );
}

/** Etichetta a pillola per dare un nome alle cose:  SATELLITE  ·  TELEFONO  ·  PLACEBO */
export function Etichetta({
  x,
  y,
  testo,
  colore,
  dimensione = 30,
  piena = false,
  da,
  fino,
}: Presenza & {x: number; y: number; testo: ReactNode; colore?: string; dimensione?: number; piena?: boolean}) {
  const p = presenza({da, fino});
  if (!p.visibile) return null;
  const c = colore ?? stile.colori.luce;
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        ...centrato(x, y, `translateY(${((1 - p.arrivo) * 14).toFixed(2)}px)`),
        opacity: p.opacita,
        padding: `${dimensione * 0.3}px ${dimensione * 0.72}px`,
        borderRadius: dimensione,
        background: piena ? c : 'rgba(5,10,12,0.78)',
        border: `2.5px solid ${alfa(c, 0.9)}`,
        boxShadow: `0 0 ${dimensione * 0.7}px ${alfa(c, 0.3)}`,
        fontFamily: stile.font.titoli,
        fontWeight: 900,
        fontSize: dimensione,
        lineHeight: 1,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: piena ? stile.colori.contorno : c,
      }}
    >
      <span style={{marginRight: '-0.16em'}}>{testo}</span>
    </div>
  );
}

/** Scritta semplice sul palco (una riga): per formule, unità, piccole spiegazioni. */
export function Scritta({
  x,
  y,
  children,
  dimensione = 44,
  colore,
  peso = 700,
  da,
  fino,
}: Presenza & {x: number; y: number; children: ReactNode; dimensione?: number; colore?: string; peso?: number}) {
  const p = presenza({da, fino});
  if (!p.visibile) return null;
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        ...centrato(x, y, `translateY(${((1 - p.arrivo) * 16).toFixed(2)}px)`),
        opacity: p.opacita,
        fontFamily: stile.font.titoli,
        fontWeight: peso,
        fontSize: dimensione,
        lineHeight: 1.1,
        color: colore ?? stile.colori.testo,
        fontFeatureSettings: '"tnum"',
        textShadow: '0 3px 14px rgba(0,0,0,0.75)',
      }}
    >
      {children}
    </div>
  );
}

/** Cartello finale:  COMMENTA / GPS  (riga piccola sopra, parola enorme sotto). */
export function Cartello({
  x = 540,
  y = 760,
  sopra,
  parola,
  sotto,
  colore,
  dimensione = 190,
  da,
  fino,
}: Presenza & {x?: number; y?: number; sopra?: ReactNode; parola: ReactNode; sotto?: ReactNode; colore?: string; dimensione?: number}) {
  const p = presenza({da, fino});
  if (!p.visibile) return null;
  const c = colore ?? stile.colori.luce;
  // le due righe piccole si restringono da sole, se sono lunghe, per non uscire dal video
  const sta = (testo: ReactNode) => (typeof testo === 'string' ? Math.min(dimensione * 0.2, 900 / (Math.max(1, testo.length) * 1.04)) : dimensione * 0.2);
  const piccola: CSSProperties = {
    fontFamily: stile.font.titoli,
    fontWeight: 700,
    letterSpacing: '0.42em',
    marginRight: '-0.42em',
    textTransform: 'uppercase',
    color: stile.colori.testo,
  };
  return (
    <div data-fmlab-zona="testo" style={{...centrato(x, y, `scale(${mix(0.7, 1, p.arrivo).toFixed(4)})`), opacity: p.opacita, textAlign: 'center'}}>
      {sopra ? <div style={{...piccola, fontSize: sta(sopra), opacity: 0.92}}>{sopra}</div> : null}
      <div
        style={{
          marginTop: dimensione * 0.06,
          fontFamily: stile.font.titoli,
          fontWeight: 900,
          fontSize: dimensione,
          lineHeight: 1,
          letterSpacing: '0.01em',
          color: '#FFFFFF',
          textShadow: `0 0 ${Math.round(dimensione * 0.22)}px ${alfa(c, 0.9)}, 0 0 ${Math.round(dimensione * 0.6)}px ${alfa(c, 0.5)}`,
        }}
      >
        {parola}
      </div>
      {sotto ? <div style={{...piccola, fontSize: sta(sotto), marginTop: dimensione * 0.12, color: c, opacity: rampa(da - 0.3, 0.3)}}>{sotto}</div> : null}
    </div>
  );
}

/** Fonte in piccolo sotto al palco: dà credibilità e si legge al fermo immagine. */
export function Fonte({testo, da, fino, x, y = 1300}: Presenza & {testo: ReactNode; x?: number; y?: number}) {
  const p = presenza({da, fino});
  const narratore = useTempo().narratore;
  if (!p.visibile) return null;
  // Di serie sta in basso a sinistra. Se lì arriva il narratore (messo a sinistra, o molto grande) passa a destra,
  // dentro la parte che l'app non copre. Con una x scritta a mano resta dove gli è stato detto.
  const largo = typeof testo === 'string' ? testo.length * 15 + 12 : 420;
  const occupato = (x1: number, x2: number) => {
    const n = narratore;
    if (!n || n.y > y + 92) return false;
    const testa = y < n.y + n.altezza * 0.33 && n.x + n.larghezza * 0.25 < x2 && n.x + n.larghezza * 0.75 > x1;
    const busto = y + 32 > n.y + n.altezza * 0.33 && n.x < x2 && n.x + n.larghezza > x1;
    return testa || busto;
  };
  const aDestra = x === undefined && occupato(60, 60 + largo) && !occupato(930 - largo, 930);
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        position: 'absolute',
        left: aDestra ? undefined : (x ?? 60),
        right: aDestra ? 150 : undefined,
        top: y,
        opacity: p.opacita * 0.78,
        fontFamily: stile.font.testo,
        fontWeight: 600,
        fontSize: 26,
        letterSpacing: '0.02em',
        color: stile.colori.tenue,
        whiteSpace: 'nowrap',
      }}
    >
      {testo}
    </div>
  );
}
