#!/usr/bin/env node
// FMLAB Reel Kit — tutti i comandi passano da qui:  npm run <comando> <reel> [opzioni]
import {ErroreFmlab, elencoReel, leggiEnv} from './percorsi.mjs';

const AIUTO = `
FMLAB Reel Kit — comandi

  npm run pannello [rete]                  pagina nel browser: nuova richiesta, narratore, 2D/3D, voce, video
                                           (con "rete" si apre anche dal telefono, sulla stessa Wi-Fi)
  npm run stato [reel]                     a che punto è ogni reel e qual è il prossimo passo
  npm run collaudo                         controlla che il kit funzioni su questo computer
  npm test · npm run prove:lente [nome]    le prove: veloci (a ogni modifica) e lente (browser e render, a fine lavoro)
  npm run nuovo <reel> "Titolo" [modello]  crea un nuovo reel da un modello (senza niente: elenco dei modelli)
  npm run imposta <reel> [chiave=valore…]  le scelte del reel: narratore=dottore|fmlab|nessuno  grandezza=40…160
                                           lato=destra|sinistra  specchia=si|no  alza=0…600  stile=auto|2d|3d
                                           mano=auto|aperta|alza|giu (la seconda mano)  musica=0…100
                                           voce=auto|elevenlabs|mac|comando|stima
                                           durata=15…180|libera (secondi chiesti: scarto massimo 5, la voce si velocizza)
  npm run voce <reel> [lingua] [motore]    voce + tempi parola per parola (motore: elevenlabs | mac | comando | stima)
                                           se il testo non è cambiato riusa la voce già fatta: zero crediti ("nuova" per rifarla)
  npm run foto <reel> [lingua] <dove>…     fotogrammi a piena risoluzione (dove: secondi, segno, scena, "fine")
  npm run provini <reel> [lingua]          foglio con tutti i momenti chiave
  npm run anteprima [reel] [lingua]        guarda il reel nel browser, con audio
  npm run render <reel> [lingua] [bozza]   crea il video mp4
  npm run verifica <reel> [lingua]         controlli automatici su copione, sincronia, zone sicure e video
  npm run personaggio                      i narratori: elenco, e come crearne uno da un'immagine
                                           (nuovo · figura · bocca · occhi · scritta · livello · prova — vedi personaggi/COME-FARE.md)
  npm run catalogo                         ridisegna catalogo.jpg: tutte le scene pronte, gli oggetti, i grafici
  npm run icone <parola>                   cerca un'icona per nome, anche in italiano ("cuore", "auto", "orologio")
  npm run clip <reel> <video> [nome]       divide un video (registrazione dello schermo, clip) in fotogrammi per <Filmato>
                                           (larghezza=720  da=0  durata=…  per prenderne solo un pezzo)
  npm run suoni [crea]                     gli effetti sonori (pop, ding, whoosh…): nel copione [suono:pop] davanti a una parola
  npm run immagine <reel> "soggetto"       un'immagine su fondo trasparente: dalla biblioteca se c'è già (costo zero),
                                           altrimenti generata dal fornitore scelto in .env (FMLAB_IMMAGINI)
  npm run immagini                         la biblioteca delle immagini
  npm run confronta <video|reel>           il metro: misura un video (tagli, novità, palco, sottotitoli, narratore, audio)
                                           e lo confronta con le soglie di riferimenti/misure.json
                                           ("riferimenti" al posto del video: rimisura i riferimenti e riscrive le soglie)
  npm run riuso [reel]                     a fine reel: cosa è scritto a mano e può entrare in libreria (meno crediti la prossima volta)

  Aggiungi "guide" a foto / provini per vedere le zone coperte dall'app.
`;

async function principale() {
  const [comando, ...argomenti] = process.argv.slice(2);
  leggiEnv();
  switch (comando) {
    case 'voce': {
      const {comandoVoce} = await import('./voce.mjs');
      return comandoVoce(argomenti[0], argomenti.slice(1));
    }
    case 'foto': {
      const {comandoFoto} = await import('./foto.mjs');
      return comandoFoto(argomenti[0], argomenti.slice(1));
    }
    case 'provini': {
      const {comandoProvini} = await import('./foto.mjs');
      return comandoProvini(argomenti[0], argomenti.slice(1));
    }
    case 'render': {
      const {comandoRender} = await import('./render.mjs');
      return comandoRender(argomenti[0], argomenti.slice(1));
    }
    case 'verifica': {
      const {comandoVerifica} = await import('./verifica.mjs');
      return comandoVerifica(argomenti[0], argomenti.slice(1));
    }
    case 'anteprima': {
      const {comandoAnteprima} = await import('./anteprima.mjs');
      return comandoAnteprima(argomenti);
    }
    case 'nuovo': {
      const {comandoNuovo} = await import('./nuovo.mjs');
      return comandoNuovo(argomenti[0], argomenti.slice(1));
    }
    case 'stato': {
      const {comandoStato} = await import('./stato.mjs');
      return comandoStato(argomenti[0]);
    }
    case 'pannello': {
      const {comandoPannello} = await import('./pannello.mjs');
      return comandoPannello(argomenti);
    }
    case 'imposta': {
      const {comandoImposta} = await import('./impostazioni.mjs');
      return comandoImposta(argomenti[0], argomenti.slice(1));
    }
    case 'personaggio': {
      const {comandoPersonaggio} = await import('./personaggio.mjs');
      return comandoPersonaggio(argomenti);
    }
    case 'collaudo': {
      const {comandoCollaudo} = await import('./collaudo.mjs');
      return comandoCollaudo();
    }
    case 'catalogo': {
      const {comandoCatalogo} = await import('./foto.mjs');
      return comandoCatalogo();
    }
    case 'icone': {
      const {comandoIcone} = await import('./icone.mjs');
      return comandoIcone(argomenti);
    }
    case 'clip': {
      const {comandoClip} = await import('./clip.mjs');
      return comandoClip(argomenti);
    }
    case 'suoni': {
      const {comandoSuoni} = await import('./suoni.mjs');
      return comandoSuoni(argomenti);
    }
    case 'immagine':
    case 'immagini': {
      const {comandoImmagine} = await import('./immagini.mjs');
      return comandoImmagine(argomenti);
    }
    case 'confronta': {
      const {comandoConfronta} = await import('./confronta.mjs');
      return comandoConfronta(argomenti);
    }
    case 'riuso': {
      const {comandoRiuso} = await import('./riuso.mjs');
      return comandoRiuso(argomenti[0]);
    }
    default:
      console.log(AIUTO);
      console.log(`Reel presenti: ${elencoReel().join(', ') || '(nessuno)'}`);
      if (comando && comando !== 'aiuto') process.exitCode = 1;
  }
}

// Ctrl+C nel Terminale e "Ferma" dal pannello. Durante un render si esce al prossimo fotogramma, così il browser
// viene chiuso e i file a metà cancellati; negli altri comandi si esce subito.
let fermato = false;
for (const segnale of ['SIGINT', 'SIGTERM']) {
  process.on(segnale, () => {
    if (fermato || !globalThis.__fmlabInRender) {
      console.error('\nFermato.\n');
      process.exit(130);
    }
    fermato = true;
    globalThis.__fmlabFermato = true;
    setTimeout(() => process.exit(130), 8000).unref();
  });
}

principale().catch((e) => {
  if (fermato) {
    console.error('\nFermato.\n');
    process.exitCode = 130;
  } else if (e instanceof ErroreFmlab) {
    console.error(`\n✖ ${e.message}\n`);
  } else {
    console.error('\n✖ Errore imprevisto:\n', e);
  }
  process.exitCode = 1;
});
