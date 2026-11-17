# Difetti del kit 1.5.0

Diagnosi della fase 0, fatta il 16/11/2026 su un clone pulito (commit `f065938`), Linux, Node 22, Chrome, ffmpeg 6.1,
2 processori. Ogni voce è stata riprodotta a mano: i passi sono quelli usati davvero.

Gravità: **grave** = rompe una regola del capitolo 6 dell'incarico, oppure produce un risultato sbagliato senza
dirlo · **media** = funziona male, ma si vede o si aggira · **bassa** = fastidio.

Le prove stanno in `prove/difetti.mjs` (veloci, dentro `npm test`) e in `prove/lente.mjs` (`npm run prove:lente`,
con il browser). Stato: **aperto**, **chiuso** (con la prova che ora passa), **rimandato** (con la fase).

**Al 16/11/2026:** 15 chiusi, 5 aperti o rimandati (B12, B17, B18, B19, B20), nessuno grave. Il giorno della diagnosi `prove/difetti.mjs` dava
19 prove fallite su 20; oggi 20 superate e 3 segnate come rimandate (B12, B17, B18). Le sezioni qui sotto descrivono
il difetto com'era; in fondo a ognuna, come è stato chiuso.

| # | Gravità | Difetto | Prova | Stato |
|---|---|---|---|---|
| B01 | grave | Il testo incollato nel pannello non diventa il testo del reel | `difetti` B01 · `lente` pannello | chiuso |
| B02 | grave | La durata scelta non è salvata, rispettata né verificata | `difetti` B02 | chiuso |
| B03 | grave | Un testo libero nel copione perde parole o dà errore | `difetti` B03 | chiuso |
| B04 | grave | Copione cambiato dopo la voce: il render fa il video con il testo vecchio | `difetti` B04 | chiuso |
| B05 | grave | Le scene pronte buttano via in silenzio quello che supera il tetto | `difetti` B05 | chiuso |
| B06 | media | Tre scene pronte escono dalle zone sicure appena create dal modello | `lente` modelli | chiuso |
| B07 | media | `.gitignore` non copre provini, video e rapporto di verifica | `difetti` B07 | chiuso |
| B08 | media | Pannello: quattro durate fisse, tetto a 120 secondi | `difetti` B08 | chiuso |
| B09 | media | Fermare un render stampa "Errore imprevisto" con la traccia del programma | `lente` ferma | chiuso |
| B10 | media | Due comandi sullo stesso reel si pestano i file; i pezzi restano sul disco | `difetti` B10 | chiuso |
| B11 | media | La verifica non controlla che ogni numero a schermo sia in `fonti.md` | `difetti` B11 | chiuso |
| B12 | media | Lingue senza spazi tra le parole: una frase diventa una parola sola | `difetti` B12 | rimandato · fase 3 |
| B13 | bassa | `npm run nuovo … oggetto` non imposta lo stile 3D (il pannello sì) | `difetti` B13 | chiuso |
| B14 | bassa | Rilanciare la voce cambia l'ordine dei campi in `parole.json` | `difetti` B14 | chiuso |
| B15 | bassa | Narratore a sinistra non specchiato: nessun avviso | `difetti` B15 | chiuso |
| B16 | bassa | La verifica dice "silenzio" anche quando ci sono gli effetti sonori | `difetti` B16 | chiuso |
| B17 | bassa | Manca `package-lock.json`: installazioni non ripetibili | — | aperto · serve la rete |
| B18 | bassa | Nomi di assistenti in quattro file | `difetti` B18 | rimandato · fase 4 |
| B19 | bassa | Una parola più larga di 920 px esce dai sottotitoli | — | aperto |
| B20 | bassa | La punteggiatura isolata si attacca alla parola prima ("caffè—") | — | aperto |

## B01 · Il testo incollato nel pannello non diventa il testo del reel (grave)

- **Passi:** `npm run pannello` → scheda "Nuovo reel" → incollo un testo di 95 parole → durata 30 s → "Crea il reel".
- **Atteso:** `copione.md` contiene quelle 95 parole, nell'ordine, e nient'altro da pronunciare.
- **Successo:** `copione.md` contiene il testo finto del modello ("Scrivi qui la frase che ferma il pollice…",
  41 parole, 17,5 s). Il mio testo finisce in `richiesta.md` sotto "Cosa deve spiegare il reel", cioè come argomento
  che qualcun altro deve riscrivere. Niente, da lì in poi, confronta il video con il testo dato.
- **Regola violata:** capitolo 6, prima riga.
- **Chiuso:** il testo diventa `copione.md` (una scena, caratteri protetti) e resta intatto in `testo.txt`; voce e
  verifica si fermano alla prima parola diversa. "È solo l'argomento" si sceglie a parte.

## B02 · La durata scelta non è salvata, rispettata né verificata (grave)

- **Passi:** nel pannello scelgo 30 s. Poi `npm run voce`, `render`, `verifica` sul reel `reta-ginocchio`
  (290 parole, 114,7 s).
- **Atteso:** la durata chiesta sta in un file che il kit legge; se la voce è più lunga viene velocizzata; se non
  basta lo dice prima di generare la voce, con le parole da togliere; la verifica dà errore oltre i 5 secondi di scarto.
- **Successo:** la durata compare solo come "circa 30 secondi" nel testo di `richiesta.md`. `voce` non ha nessuna
  velocità, `verifica` ha un solo avviso fisso ("oltre 90 secondi") uguale per tutti i reel.
- **Chiuso:** campo `durata` in `impostazioni.json`; `motore/durata.mjs` velocizza la voce fino a 1,4 puntando alla
  durata chiesta; controllo prima della voce a pagamento; errore della verifica oltre i 5 secondi.

## B03 · Un testo libero nel copione perde parole o dà errore (grave)

- **Passi:** `leggiCopione()` su testi normali (file di prova: `prove/difetti.mjs`).
- **Successo:**
  - una riga che comincia con `#caffeina` o con `> 5 è maggiore di 3` sparisce tutta (5 e 6 parole perse);
  - `Lo studio [1] dice così` perde `[1]`; `[nota bene]` ferma tutto con "segno non valido";
  - `3 * 2` ferma tutto con "asterisco aperto e mai chiuso";
  - `<!-- … -->` sparisce.
- **Atteso:** un modo di scrivere questi caratteri come testo, e una funzione che prepara il copione da un testo
  qualsiasi senza perdere un carattere. Serve a B01.
- **Chiuso:** `\[ \] \* \# \> \<` nel copione; `copioneDaTesto()` e `confrontaTesto()` in `motore/copione.mjs`.

## B04 · Copione cambiato dopo la voce: il render fa il video con il testo vecchio (grave)

- **Passi:** reel con la voce già fatta; aggiungo una parola in `copione.md`; `npm run render <reel> bozza`.
- **Atteso:** con i tempi stimati li rifà da solo; con una voce vera si ferma e dice di rilanciare `npm run voce`.
- **Successo:** "Fatto", codice di uscita 0, video e sottotitoli con il testo di prima. Solo `verifica` se ne accorge.
- **Chiuso:** tempi stimati rifatti da soli; con una voce vera il render si ferma e dice quale comando lanciare.

## B05 · Le scene pronte buttano via in silenzio quello che supera il tetto (grave)

- **Passi:** `bloccoLista` con 6 voci, `bloccoBarre` con 7 colonne, una voce di lista di 70 caratteri.
- **Atteso:** tutto a schermo, oppure un errore che dice cosa non entra.
- **Successo:** la sesta voce, la settima colonna e la coda del testo non vengono disegnate. Nessun messaggio:
  in un grafico vuol dire mostrare dati incompleti senza saperlo. I tagli sono 15 (`slice(0, n)` in
  `libreria/Blocchi.tsx`).
- **Nota:** l'adattamento vero (scala, scorre, raggruppa) è lavoro della fase 2. Qui il difetto è il silenzio.
- **Chiuso:** ogni taglio è diventato un errore che dice quante cose ci sono, quante ne entrano e cosa fare.

## B06 · Tre scene pronte escono dalle zone sicure appena create dal modello (media)

- **Passi:** `npm run nuovo zz-lista "Prova" lista` → `npm run verifica zz-lista`. Lo stesso con `mito` e `confronto`.
- **Atteso:** un reel appena creato da un modello non ha scritte fuori zona.
- **Successo:** "Scritta fuori dalle zone sicure … sotto le icone dell'app" in tutti e tre: la riga della lista arriva
  a x 976, la scheda "REALTÀ" a x 960, l'etichetta della colonna destra a x 945. La colonna delle icone parte a 940.
- **Chiuso:** riga della lista larga 830, scheda larga 780, colonne a x 280 e 740. Provato su tutti e sette i modelli.

## B07 · `.gitignore` non copre provini, video e rapporto di verifica (media)

- **Passi:** `npm run provini reta-ginocchio && npm run render reta-ginocchio && git status`.
- **Successo:** `provini.jpg` (1,4 MB) e `reta-ginocchio.mp4` (44 MB) risultano da aggiungere. La regola presente,
  `reels/*/provini/`, copre solo la cartella delle foto singole. Un `git add -A` porta 44 MB nel repository.
- **Chiuso:** ignorati `provini*.jpg`, `*.mp4` e `verifica*.md` dentro `reels/*/`.

## B08 · Pannello: quattro durate fisse, tetto a 120 secondi (media)

- **Passi:** scheda "Nuovo reel": i pulsanti sono 30, 45, 60, 75. `POST /api/nuovo` con `durata: 150` → errore.
- **Atteso:** da 15 a 180 secondi (incarico, capitolo 1), anche un valore scritto a mano.
- **Chiuso:** pulsanti 15-180 più un campo per scrivere i secondi; il server accetta da 15 a 180.

## B09 · Fermare un render stampa "Errore imprevisto" (media)

- **Passi:** pulsante "Ferma" durante "Bozza veloce", oppure `kill -TERM` sul comando `npm run render`.
- **Successo:** `✖ Errore imprevisto: cdpSession.send: Target page, context or browser has been closed` con la
  traccia del programma. Nessun processo resta appeso (controllato).
- **Atteso:** "Fermato." e basta.
- **Chiuso:** il render esce al fotogramma successivo, chiude il browser, cancella i file a metà, dice "Fermato.".

## B10 · Due comandi sullo stesso reel si pestano i file (media)

- **Passi:** letto in `motore/render.mjs`: i pezzi del video vanno sempre in `.fmlab/<reel>/render/pezzo-N.mp4`,
  anche quando l'uscita è un'altra. `npm run collaudo` rende un secondo di `gps`: se intanto gira
  `npm run render gps`, scrivono lo stesso file.
- **In più:** i pezzi e `muto.mp4` non vengono mai cancellati: dopo questa diagnosi `.fmlab/` pesava 199 MB.
- **Chiuso:** una cartella per ogni lancio (`render-<processo>-<n>`), cancellata alla fine anche se il render fallisce.

## B11 · La verifica non controlla i numeri a schermo (media)

- **Passi:** in un reel tolgo da `fonti.md` la riga di un numero che sta in una grafica → `npm run verifica`.
- **Successo:** "fonti.md: 5 fonti con indirizzo". L'unico controllo è che nel file ci sia almeno un indirizzo web.
- **Regola violata:** capitolo 6, "Ogni numero mostrato ha la sua riga in fonti.md".
- **Chiuso:** `motore/fonti.mjs` e un controllo nuovo nella verifica. Ha trovato quattro numeri arrotondati senza
  spiegazione nei due reel del kit: aggiunti sotto "Calcoli" nei loro `fonti.md`.

## B12 · Lingue senza spazi tra le parole (media) — rimandato alla fase 3

- **Passi:** copione in giapponese di due frasi.
- **Successo:** una sola "parola", durata stimata 1,9 s, un sottotitolo solo con tutto il testo. Il pannello offre sei
  lingue. "Qualsiasi lingua" chiede di dividere il testo in un altro modo: va insieme al regista.

## B13 · `npm run nuovo … oggetto` non imposta lo stile 3D (bassa)

- **Successo:** la verifica del reel appena creato avvisa "Stile ancora su auto (di fatto 3D)". Dal pannello lo
  stesso modello salva `stile: 3d`.
- **Chiuso:** `creaReel` salva lo stile del modello.

## B14 · Rilanciare la voce cambia l'ordine dei campi in `parole.json` (bassa)

- **Passi:** clone pulito → `npm run voce reta-ginocchio stima` → `git diff`.
- **Successo:** 52 righe cambiate: il blocco `suoni` passa da dopo `parole` a prima. Nessun valore cambia.
- **Chiuso:** il riallineamento tiene l'ordine di `componiDati`; riscritto `reels/reta-ginocchio/parole.json`.

## B15 · Narratore a sinistra non specchiato (bassa)

- **Successo:** `npm run imposta <reel> lato=sinistra` lo lascia girato verso il bordo; `verifica` non dice niente.
  `SCHEDA.md` dice che a sinistra va specchiato.
- **Chiuso:** avviso in `npm run imposta` e nella verifica.

## B16 · "Silenzio" anche con gli effetti sonori (bassa)

- **Successo:** reel senza voce ma con 6 effetti: la verifica scrive "Audio aac 48000 Hz (silenzio: voce non ancora
  generata)". L'audio misurato è a −24 LUFS: gli effetti ci sono.
- **Chiuso:** la verifica elenca quello che c'è: voce, musica, numero di effetti.

## B17 · Manca `package-lock.json` (bassa) — aperto

- `ffmpeg-static` è chiesto come `^5.2.0`. Senza file di blocco due installazioni possono dare versioni diverse.
  Va creato da un computer collegato alla rete (`npm install --package-lock-only`).

## B18 · Nomi di assistenti in quattro file (bassa) — chiuso il 17/11

- Erano in `.env.esempio`, `LEGGIMI.md`, `NOVITA.md`, `prove/libreria.mjs`: riscritti senza nomi (il comando per
  avviare l'agente dal pannello ora si prende dalla guida del proprio agente). Resta, perché lo pretende chi lo
  legge, il nome del file di istruzioni `CLAUDE.md`. Prova: `B18` in `prove/difetti.mjs`, non più rimandata.
- **Cosa si perde:** `.env.esempio` non ha più i due comandi pronti da copiare. Chi li ha già nel suo `.env` non
  deve fare niente.

## B19 · Parola più larga dei sottotitoli (bassa) — chiuso il 17/11

- Era: una parola di 50 lettere a 60 px usciva dai 920 px. Ora la pagina che contiene una parola più larga della
  riga si scrive più piccola, quanto basta perché entri (le parole fino a 26 lettere restano a 60 px). Prova: `B19`
  in `prove/difetti.mjs`. **Non guardato su un video vero in tedesco**: la prova è sul calcolo, non sul fotogramma.

## B20 · Punteggiatura isolata attaccata alla parola prima (bassa) — chiuso il 17/11

- Era: `Disse « bene »` diventava `Disse«` `bene»`. Ora un segno che apre, scritto da solo (`«`, `(`, `“`, `¿`), va
  con la parola dopo: `«bene»`, `(forse)`. Il trattino e i segni che chiudono restano con la parola prima
  (`caffè—`): un trattino da solo non è una parola da dire, e una parola con uno spazio dentro non si allineerebbe
  più ai tempi della voce, che contano le parole dagli spazi. Prova: `B20` in `prove/difetti.mjs`.

## Cosa non è un difetto ma è lontano dal traguardo

Misurato in questa fase, lavoro delle fasi successive: formato solo 9:16; passaggi tra le scene fatti con zoom e
dissolvenza; scene scritte a mano (`npm run riuso`: 16 scene su 16 nei due reel); voce a −14,0 LUFS contro i −17,7
del primo riferimento; narratore con una sola posa disegnata in più (braccia conserte).
