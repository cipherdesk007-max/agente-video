// FMLAB Reel Kit — sostegno alle prove: disegna una scena pronta senza browser e restituisce l'HTML.
import {renderToStaticMarkup} from 'react-dom/server.browser';
import type {ComponentType} from 'react';
import {ScenaCtx, TempoCtx, creaScena, creaTempo} from '../../libreria/tempo';
import type {DatiReel} from '../../libreria/tempo';

export * as blocchi from '../../libreria/Blocchi';
export * as mondo from '../../libreria/Mondo';
export * as protagonista from '../../libreria/Protagonista';

/** Disegna `Scena` al secondo `t` di una scena lunga `durata` secondi. I segni cadono tutti al secondo 0,5. */
export function disegna(Scena: ComponentType, {t = 9, durata = 10, lingua = 'it'} = {}): string {
  const dati: DatiReel = {
    versione: 1,
    lingua,
    motore: 'stima',
    precisione: 'stimata',
    voce: null,
    durataVoce: durata,
    coda: 0,
    durata,
    fps: 30,
    parole: [{testo: 'prova.', inizio: 0, fine: durata, frase: 0}],
    segni: new Proxy({}, {get: () => 0.5, has: () => true}) as Record<string, number>,
    scene: [{nome: 'prova', inizio: 0, fine: durata}],
    impronta: 'prova',
  };
  const tempo = creaTempo(dati, 'prova', Math.round(t * 30));
  return renderToStaticMarkup(
    <TempoCtx.Provider value={tempo}>
      <ScenaCtx.Provider value={creaScena(tempo, 0)}>
        <Scena />
      </ScenaCtx.Provider>
    </TempoCtx.Provider>
  );
}
