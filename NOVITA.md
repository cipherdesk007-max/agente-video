# Novità

## Verso la 2.0 · fase 0: i difetti del kit 1.5

L'elenco completo, con i passi per riprodurli, è in `BUG.md`; a che punto è il lavoro, in `STATO.md`.

- **Il testo scritto nel pannello è il testo del reel**, parola per parola: diventa il copione e resta intatto in
  `testo.txt`. Voce e verifica si fermano se il copione dice altro. "È solo l'argomento" si sceglie a parte.
- **La durata chiesta si rispetta**: da 15 a 180 secondi, salvata in `impostazioni.json`
  (`npm run imposta <reel> durata=45`). La voce troppo lunga viene velocizzata fino a 1,4; se non basta il kit lo
  dice prima di spendere, con le parole da togliere. La verifica dà errore oltre i 5 secondi di scarto.
- **Il render non usa più un testo vecchio**: copione cambiato dopo la voce → tempi stimati rifatti da soli, voce
  vera da rigenerare (il render si ferma e lo dice).
- **Niente tagli in silenzio** nelle scene pronte: quello che non entra dà un errore chiaro.
- **Numeri e fonti**: la verifica cerca in `fonti.md` ogni numero che compare a schermo.
- Nel copione `\[ \] \* \# \>` scrivono quei caratteri come testo.
- Lista, mito e confronto non finiscono più sotto le icone dell'app. "Ferma" e Ctrl+C chiudono il render puliti.
  I pezzi del render non restano sul disco. `git` ignora provini, video e rapporti di verifica.
- **Prove**: `npm test` ha una prova per ogni difetto (`prove/difetti.mjs`); `npm run prove:lente` fa quelle con il
  browser e i render (pannello dal telefono, modelli, durata con una voce finta, numeri e fonti).

## 1.5

- **Braccia conserte**: il Dottore PEPTMAP ha una posa in più, `conserte`, fatta con un secondo disegno dello
  stesso dottore (`personaggi/dottore-conserte`). Il kit gli ha creato bocche e palpebre sue: in quella posa
  parla, batte le ciglia e fa i cenni con la testa. La sceglie da solo sulle frasi che frenano ("Ma…", "Però…",
  "Non…"); nella regia: `dottore: {posa: 'conserte'}`.
- **Pose disegnate** per qualsiasi personaggio: un altro disegno diventa una posa con
  `npm run personaggio figura <personaggio> <posa> <immagine>` (`personaggi/COME-FARE.md`). Le figure non
  compaiono tra i narratori da scegliere.
- **Più pezzi pronti**: tre scene (`bloccoPersone` per dire "2 su 10", `bloccoTempo` per una linea del tempo,
  `bloccoSchermo` per uno screenshot o un video nel telefono) e cinque oggetti 3D (provetta, flacone, bilancia,
  scudo, lente). Poi il **logo della pagina** (`stile/logo.png`, componente `Logo`), la sigla (`bloccoSigla`),
  l'aggancio in forma di domanda (`bloccoDomanda`) e la scheda di uno studio (`bloccoStudio`). In tutto 24 scene
  pronte e 18 oggetti 3D.
- **Ebook in 3D**: la copertina del database (`stile/ebook.jpg`) su un tablet in 3D vero che entra girando e poi
  oscilla: componente `Ebook`, scena pronta `bloccoEbook` (la numero 25).
- **Effetti sonori**: una cartella `suoni/` con otto effetti di serie generati dal kit (pop, clic, ding, whoosh,
  tonfo, sale, successo, errore). Nel copione `[suono:pop]` davanti a una parola lo fa partire lì; i tuoi file
  messi nella cartella si chiamano allo stesso modo. `npm run suoni` li elenca.
- **Riuso**: `npm run riuso <reel>` elenca quello che in un reel è scritto a mano e dice se in libreria c'è già
  qualcosa di simile. È il passo che chiude ogni reel (scheda, manuale e prompt lo chiedono): quello che può
  riservire entra in libreria e nel catalogo, così il reel dopo costa meno.
- **Colori del video più fedeli**: nel passaggio dai fotogrammi al video il bianco diventava 252, 255, 252 (un
  filo più scuro e verdino). Ora il bianco resta bianco e i colori arrivano entro un livello su 255; c'è una
  prova che lo controlla.
- **Codex e Claude Code**: `AGENTS.md` e `CLAUDE.md` dicono la stessa cosa e ognuno dei due agenti legge il suo.
  `LEGGIMI.md` spiega come avviarli dal pannello (`.env.esempio` ha i due comandi pronti).
- Il bordo di sotto del narratore, quando è alzato, sfuma più dolcemente.

## 1.4

- **La seconda mano del dottore**: anche l'altro avambraccio, quello con la mano aperta, è su un livello suo.
  A ogni posa prende uno stato (aperta, alzata, giù lungo il fianco) e nei gesti è lei che sale: non resta più
  ferma. Sotto, il camice è stato ridisegnato. Si può fissare dal pannello o con `npm run imposta <reel> mano=giu`.
- **Tre librerie in più**, installate da `npm install` e già avvolte in pezzi del kit: **d3** (grafici a linea,
  torta, classifica), **react-icons** (35.000 icone: `npm run icone cuore` le cerca anche in italiano),
  **roughjs** (cerchi, frecce e sottolineature fatti "a mano").
- **Otto scene pronte nuove** (18 in tutto): linea nel tempo, torta, classifica, icone, scala con i cursori,
  schede con il totale, avviso, citazione.
- **Sette oggetti 3D nuovi** (13 in tutto): siringa, molecola, DNA, ginocchio, cuore, moneta, stella.
- **Foto e filmati nelle scene**: `Foto` per uno screenshot o la pagina di uno studio (entra, si avvicina piano),
  `Filmato` per una registrazione dello schermo o una clip, anche dentro il telefono disegnato. Il video si
  prepara con `npm run clip <reel> <file> <nome>` e nel render è preciso al fotogramma. Se il file manca, foto,
  provini e verifica lo dicono.
- **Catalogo**: `catalogo.jpg` mostra tutto quello che è pronto, `CATALOGO.md` dice come si usa,
  `npm run catalogo` lo ridisegna. Le prove controllano che ogni pezzo nuovo ci finisca dentro.
- **Prompt pronti**: `PROMPT.md`, e nel pannello la scheda "Catalogo e prompt" con il pulsante per copiarli.
- **Musica di sottofondo**: un file `musica.mp3` nella cartella del reel finisce sotto la voce e si abbassa da
  solo mentre la voce parla. Volume dal pannello o con `npm run imposta <reel> musica=30`.
- **Segni senza rifare la voce**: se nel copione sposti o aggiungi `[segni]`, scene o `*enfasi*` e il testo
  resta uguale, il kit rifà gli agganci da solo sui tempi della voce che c'è già.
- Un segno scritto dentro una parola (`dell'[azienda]azienda`) ora vale per quella parola: prima finiva sulla
  parola dopo e la grafica arrivava in ritardo.
- Per chi crea personaggi: una parte che sta davanti al corpo si stacca con `personaggi/strumenti/stacca_parte.py`
  (serve Python), che ridisegna anche quello che c'è sotto. Corretta la griglia, che si fermava sui personaggi
  con un livello.

## 1.3

- **Il braccio su un livello suo**: l'avambraccio del Dottore PEPTMAP è ritagliato su un'immagine sua e ruota
  attorno al gomito. Si distende del tutto e si piega fino a passare davanti al petto, con una leggera ombra
  sul camice. A riposo il dottore è identico all'immagine di partenza (lo controlla il collaudo).
- **Sei pose** invece di quattro: si aggiungono `pensa` (dito al mento) e `presenta` (braccio disteso verso il
  palco). Il kit sceglie ogni volta quella adatta che manca da più tempo.
- **La faccia**: il mento segue la bocca, la bocca si stringe sulla "u" e sulla "o", il viso scorre dentro la
  testa quando si volta. Partecipa anche la spalla.
- **Movimenti più veri**: da una posa all'altra il braccio va come un braccio vero (parte piano, arriva piano)
  e si prende più tempo quando la strada è lunga.
- **Bordi puliti**: tolti i puntini che restavano attorno alla figura dopo lo scontorno.
- **Per chi crea personaggi**: `npm run personaggio livello`, `pulisci`, e il foglio di prova con le mosse
  scritte a mano (`npm run personaggio prova <nome> mosse.json`).
- Verifica: nel passaggio tra due scene non conta più dove sfilano le scritte della scena che esce.
- Il cartello finale stringe da solo le righe piccole troppo lunghe.
- Reel d'esempio in più: `reta-ginocchio`, con un oggetto 3D fatto apposta (il ginocchio) e i numeri di due studi.

## 1.2

- **Narratore**: da una sola immagine ora nascono quattro pose (dito, alto, lato, aperto), cambiate a ogni
  frase e tenute; gesti ridisegnati con preparazione, colpo e ritorno, agganciati alle parole; palpebre a
  intervalli irregolari, labbra al ritmo delle sillabe, respiro e spostamento del peso.
- **Narratore a sinistra**: specchiato guarda verso il centro e il logo sul camice resta leggibile
  (`npm run personaggio scritta`, per qualsiasi personaggio con una scritta addosso).
- **Scene pronte** (`libreria/Blocchi.tsx`): titolo, numero, lista, confronto, grafico a colonne, percentuale,
  passi, mito e realtà, oggetto 3D con etichette, chiusura. Una scena in una riga.
- **Modelli di reel** (`npm run nuovo <reel> "Titolo" <modello>`): spiegazione, lista, confronto, mito, passi,
  oggetto, dati. Si scelgono anche dal pannello.
- **Voci**: scelta della voce reel per reel dal pannello, con ascolto di prova; la voce ElevenLabs viene
  riusata se il testo non cambia (zero crediti); motore `comando` per collegare qualsiasi altro servizio.
- **Meno lavoro per l'agente**: `SCHEDA.md` (una pagina), `npm run stato`, `npm test`.

## 1.1

- **Pannello** nel browser, anche dal telefono (`npm run pannello rete`): nuova richiesta, narratore o
  nessuno, grandezza e lato, stile 2D/3D, voce, anteprima con audio, video, verifica.
- **Narratore da una sola immagine**, mosso a parti (testa, braccio, mani, bocca, occhi); più personaggi
  nella cartella `personaggi/`; scelte per reel in `impostazioni.json`.
- **3D**: oggetti con volume veri (`Scena3D`, forme di base, modelli pronti).
- Verifica: scritte coperte dal narratore, stile scelto contro stile visto.

## 1.0

- Motore: copione con segni → voce e tempi → scene sincronizzate → mp4 1080x1920, con verifica.
