// FMLAB Reel Kit — sottotitoli in alto, una frase breve per volta.
// Le parole compaiono quando vengono pronunciate: quella in corso è bianca e in grassetto, quelle già
// dette si spengono, la parola chiave (scritta tra *asterischi* nel copione) resta dentro un riquadro.
import {useMemo} from 'react';
import {useTempo} from './tempo';
import {mix, molla, rampa} from './anim';
import {alfa} from './colore';
import {stile} from '../stile/stile';
import {impagina} from '../motore/comune/pagine.mjs';

function Maniglia({x, y, colore}: {x: 'sinistra' | 'destra'; y: 'alto' | 'basso'; colore: string}) {
  return (
    <span
      style={{
        position: 'absolute',
        [x === 'sinistra' ? 'left' : 'right']: -9,
        [y === 'alto' ? 'top' : 'bottom']: -9,
        width: 13,
        height: 13,
        borderRadius: 9,
        background: '#FFFFFF',
        border: `3px solid ${colore}`,
        boxSizing: 'border-box',
      }}
    />
  );
}

export function Sottotitoli() {
  const tempo = useTempo();
  const cfg = stile.sottotitoli;
  const lingua = tempo.dati.lingua ?? 'it';
  const pagine = useMemo(
    () => impagina(tempo.dati.parole, {maxParole: cfg.maxParole, maxCaratteri: cfg.maxCaratteri, maiuscolo: cfg.maiuscolo, lingua}),
    [tempo.dati, cfg.maxParole, cfg.maxCaratteri, cfg.maiuscolo, lingua]
  );
  const pagina = pagine.find((p) => tempo.ora >= p.mostraDa && tempo.ora < p.mostraA);
  if (!pagina) return null;

  const blu = stile.colori.riquadro;
  const eta = tempo.ora - pagina.mostraDa;
  return (
    <div
      data-fmlab-zona="sottotitoli"
      style={{
        position: 'absolute',
        left: (tempo.larghezza - cfg.larghezzaMax) / 2,
        width: cfg.larghezzaMax,
        top: cfg.y,
        transform: 'translateY(-50%)',
        opacity: rampa(eta, 0.08),
        textAlign: 'center',
        fontFamily: stile.font.titoli,
        fontSize: cfg.dimensione,
        lineHeight: 1.32,
        letterSpacing: '-0.012em',
        textShadow: '0 3px 18px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)',
      }}
    >
      {pagina.parole.map((p, k) => {
        const prossima = pagina.parole[k + 1];
        const apparsa = tempo.ora >= p.inizio;
        // le parole non ancora dette non occupano spazio: la riga cresce restando centrata
        if (!apparsa) return null;
        // resta "in corso" fino all'inizio della parola dopo: niente sfarfallio nelle micro-pause
        const inCorso = apparsa && tempo.ora < Math.min(p.fine + 0.14, prossima ? prossima.inizio : Infinity);
        const dentro = tempo.ora - p.inizio;
        const arrivo = molla(dentro, {rigidita: 520, smorzamento: 28});
        const forte = inCorso || p.enfasi;
        const colore = forte ? stile.colori.testo : alfa(stile.colori.testo, 0.48);
        return (
          <span key={p.indice}>
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                padding: '0 0.05em',
                opacity: apparsa ? rampa(dentro, 0.07) : 0,
                transform: apparsa ? `translateY(${((1 - arrivo) * 10).toFixed(2)}px)` : undefined,
              }}
            >
              {p.enfasi && apparsa ? (
                <span
                  style={{
                    position: 'absolute',
                    left: -2,
                    right: -2,
                    top: '0.08em',
                    bottom: '0.06em',
                    border: `3px solid ${blu}`,
                    background: alfa(blu, 0.2),
                    borderRadius: 9,
                    boxSizing: 'border-box',
                    opacity: rampa(dentro, 0.1),
                    transform: `scale(${mix(1.14, 1, arrivo).toFixed(4)})`,
                  }}
                >
                  <Maniglia x="sinistra" y="alto" colore={blu} />
                  <Maniglia x="destra" y="basso" colore={blu} />
                </span>
              ) : null}
              {/* la copia invisibile in grassetto tiene ferma la larghezza: le parole non "ballano" */}
              <span style={{visibility: 'hidden', fontWeight: 700}}>{p.testo}</span>
              <span style={{position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', fontWeight: forte ? 700 : 500, color: colore}}>
                {p.testo}
              </span>
            </span>{' '}
          </span>
        );
      })}
    </div>
  );
}
