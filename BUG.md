# Difetti del kit 1.5.0

Diagnosi della fase 0, fatta il 16/11/2026 su un clone pulito (commit `f065938`), Linux, Node 22, Chrome, ffmpeg 6.1,
2 processori. Ogni voce è stata riprodotta a mano: i passi sono quelli usati davvero.

Gravità: **grave** = rompe una regola del capitolo 6 dell'incarico, oppure produce un risultato sbagliato senza
dirlo · **media** = funziona male, ma si vede o si aggira · **bassa** = fastidio.

Le prove stanno in `prove/difetti.mjs` (veloci, dentro `npm test`) e in `prove/lente.mjs` (`npm run prove:lente`,
con il browser). Stato: **aperto**, **chiuso** (con la prova che ora passa), **rimandato** (con la fase).

| # | Gravità | Difetto | Prova | Stato |
|---|---|---|---|---|
| B01 | grave | Il testo incollato nel pannello non diventa il testo del reel | `difetti` B01 · `lente` pannello | aperto |
| B02 | grave | La durata scelta non è salvata, rispettata né verificata | `difetti` B02 | aperto |
| B03 | grave | Un testo libero nel copione perde parole o dà errore | `difetti` B03 | aperto |
| B04 | grave | Copione cambiato dopo la voce: il render fa il video con il testo vecchio | `difetti` B04 | aperto |
| B05 | grave | Le scene pronte buttano via in silenzio quello che supera il tetto | `difetti` B05 | aperto |
| B06 | media | Tre scene pronte escono dalle zone sicure appena create dal modello | `lente` modelli | aperto |
| B07 | media | `.gitignore` non copre provini, video e rapporto di verifica | `difetti` B07 | aperto |
| B08 | media | Pannello: quattro durate fisse, tetto a 120 secondi | `difetti` B08 | aperto |
| B09 | media | Fermare un render stampa "Errore imprevisto" con la traccia del programma | `lente` ferma | aperto |
| B10 | media | Due comandi sullo stesso reel si pestano i file; i pezzi restano sul disco | `difetti` B10 | aperto |
| B11 | media | La verifica non controlla che ogni numero a schermo sia in `fonti.md` | `difetti` B11 | aperto |
| B12 | media | Lingue senza spazi tra le parole: una frase diventa una parola sola | `difetti` B12 | aperto |
| B13 | bassa | `npm run nuovo … oggetto` non imposta lo stile 3D (il pannello sì) | `difetti` B13 | aperto |
| B14 | bassa | Rilanciare la voce cambia l'ordine dei campi in `parole.json` | `difetti` B14 | aperto |
| B15 | bassa | Narratore a sinistra non specchiato: nessun avviso | `difetti` B15 | aperto |
| B16 | bassa | La verifica dice "silenzio" anche quando ci sono gli effetti sonori | `difetti` B16 | aperto |
| B17 | bassa | Manca `package-lock.json`: installazioni non ripetibili | — | aperto |
| B18 | bassa | Nomi di assistenti in quattro file | `difetti` B18 | aperto |
| B19 | bassa | Una parola più larga di 920 px esce dai sottotitoli | — | aperto |
| B20 | bassa | La punteggiatura isolata si attacca alla parola prima ("caffè—") | — | aperto |

## B01 · Il testo incollato nel pannello non diventa il testo del reel (grave)

- **Passi:** `npm run pannello` → scheda "Nuovo reel" → incollo un testo di 95 parole → durata 30 s → "Crea il reel".
- **Atteso:** `copione.md` contiene quelle 95 parole, nell'ordine, e nient'altro da pronunciare.
- **Successo:** `copione.md` contiene il testo finto del modello ("Scrivi qui la frase che ferma il pollice…",
  41 parole, 17,5 s). Il mio testo finisce in `richiesta.md` sotto "Cosa deve spiegare il reel", cioè come argomento
  che qualcun altro deve riscrivere. Niente, da lì in poi, confronta il video con il testo dato.
- **Regola violata:** capitolo 6, prima riga.

## B02 · La durata scelta non è salvata, rispettata né verificata (grave)

- **Passi:** nel pannello scelgo 30 s. Poi `npm run voce`, `render`, `verifica` sul reel `reta-ginocchio`
  (290 parole, 114,7 s).
- **Atteso:** la durata chiesta sta in un file che il kit legge; se la voce è più lunga viene velocizzata; se non
  basta lo dice prima di generare la voce, con le parole da togliere; la verifica dà errore oltre i 5 secondi di scarto.
- **Successo:** la durata compare solo come "circa 30 secondi" nel testo di `richiesta.md`. `voce` non ha nessuna
  velocità, `verifica` ha un solo avviso fisso ("oltre 90 secondi") uguale per tutti i reel.

## B03 · Un testo libero nel copione perde parole o dà errore (grave)

- **Passi:** `leggiCopione()` su testi normali (file di prova: `prove/difetti.mjs`).
- **Successo:**
  - una riga che comincia con `#caffeina` o con `> 5 è maggiore di 3` sparisce tutta (5 e 6 parole perse);
  - `Lo studio [1] dice così` perde `[1]`; `[nota bene]` ferma tutto con "segno non valido";
  - `3 * 2` ferma tutto con "asterisco aperto e mai chiuso";
  - `<!-- … -->` sparisce.
- **Atteso:** un modo di scrivere questi caratteri come testo, e una funzione che prepara il copione da un testo
  qualsiasi senza perdere un carattere. Serve a B01.

## B04 · Copione cambiato dopo la voce: il render fa il video con il testo vecchio (grave)

- **Passi:** reel con la voce già fatta; aggiungo una parola in `copione.md`; `npm run render <reel> bozza`.
- **Atteso:** con i tempi stimati li rifà da solo; con una voce vera si ferma e dice di rilanciare `npm run voce`.
- **Successo:** "Fatto", codice di uscita 0, video e sottotitoli con il testo di prima. Solo `verifica` se ne accorge.

## B05 · Le scene pronte buttano via in silenzio quello che supera il tetto (grave)

- **Passi:** `bloccoLista` con 6 voci, `bloccoBarre` con 7 colonne, una voce di lista di 70 caratteri.
- **Atteso:** tutto a schermo, oppure un errore che dice cosa non entra.
- **Successo:** la sesta voce, la settima colonna e la coda del testo non vengono disegnate. Nessun messaggio:
  in un grafico vuol dire mostrare dati incompleti senza saperlo. I tagli sono 15 (`slice(0, n)` in
  `libreria/Blocchi.tsx`).
- **Nota:** l'adattamento vero (scala, scorre, raggruppa) è lavoro della fase 2. Qui il difetto è il silenzio.

## B06 · Tre scene pronte escono dalle zone sicure appena create dal modello (media)

- **Passi:** `npm run nuovo zz-lista "Prova" lista` → `npm run verifica zz-lista`. Lo stesso con `mito` e `confronto`.
- **Atteso:** un reel appena creato da un modello non ha scritte fuori zona.
- **Successo:** "Scritta fuori dalle zone sicure … sotto le icone dell'app" in tutti e tre: la riga della lista arriva
  a x 976, la scheda "REALTÀ" a x 960, l'etichetta della colonna destra a x 945. La colonna delle icone parte a 940.

## B07 · `.gitignore` non copre provini, video e rapporto di verifica (media)

- **Passi:** `npm run provini reta-ginocchio && npm run render reta-ginocchio && git status`.
- **Successo:** `provini.jpg` (1,4 MB) e `reta-ginocchio.mp4` (44 MB) risultano da aggiungere. La regola presente,
  `reels/*/provini/`, copre solo la cartella delle foto singole. Un `git add -A` porta 44 MB nel repository.

## B08 · Pannello: quattro durate fisse, tetto a 120 secondi (media)

- **Passi:** scheda "Nuovo reel": i pulsanti sono 30, 45, 60, 75. `POST /api/nuovo` con `durata: 150` → errore.
- **Atteso:** da 15 a 180 secondi (incarico, capitolo 1), anche un valore scritto a mano.

## B09 · Fermare un render stampa "Errore imprevisto" (media)

- **Passi:** pulsante "Ferma" durante "Bozza veloce", oppure `kill -TERM` sul comando `npm run render`.
- **Successo:** `✖ Errore imprevisto: cdpSession.send: Target page, context or browser has been closed` con la
  traccia del programma. Nessun processo resta appeso (controllato).
- **Atteso:** "Fermato." e basta.

## B10 · Due comandi sullo stesso reel si pestano i file (media)

- **Passi:** letto in `motore/render.mjs`: i pezzi del video vanno sempre in `.fmlab/<reel>/render/pezzo-N.mp4`,
  anche quando l'uscita è un'altra. `npm run collaudo` rende un secondo di `gps`: se intanto gira
  `npm run render gps`, scrivono lo stesso file.
- **In più:** i pezzi e `muto.mp4` non vengono mai cancellati: dopo questa diagnosi `.fmlab/` pesava 199 MB.

## B11 · La verifica non controlla i numeri a schermo (media)

- **Passi:** in un reel tolgo da `fonti.md` la riga di un numero che sta in una grafica → `npm run verifica`.
- **Successo:** "fonti.md: 5 fonti con indirizzo". L'unico controllo è che nel file ci sia almeno un indirizzo web.
- **Regola violata:** capitolo 6, "Ogni numero mostrato ha la sua riga in fonti.md".

## B12 · Lingue senza spazi tra le parole (media) — rimandato alla fase 3

- **Passi:** copione in giapponese di due frasi.
- **Successo:** una sola "parola", durata stimata 1,9 s, un sottotitolo solo con tutto il testo. Il pannello offre sei
  lingue. "Qualsiasi lingua" chiede di dividere il testo in un altro modo: va insieme al regista.

## B13 · `npm run nuovo … oggetto` non imposta lo stile 3D (bassa)

- **Successo:** la verifica del reel appena creato avvisa "Stile ancora su auto (di fatto 3D)". Dal pannello lo
  stesso modello salva `stile: 3d`.

## B14 · Rilanciare la voce cambia l'ordine dei campi in `parole.json` (bassa)

- **Passi:** clone pulito → `npm run voce reta-ginocchio stima` → `git diff`.
- **Successo:** 52 righe cambiate: il blocco `suoni` passa da dopo `parole` a prima. Nessun valore cambia.

## B15 · Narratore a sinistra non specchiato (bassa)

- **Successo:** `npm run imposta <reel> lato=sinistra` lo lascia girato verso il bordo; `verifica` non dice niente.
  `SCHEDA.md` dice che a sinistra va specchiato.

## B16 · "Silenzio" anche con gli effetti sonori (bassa)

- **Successo:** reel senza voce ma con 6 effetti: la verifica scrive "Audio aac 48000 Hz (silenzio: voce non ancora
  generata)". L'audio misurato è a −24 LUFS: gli effetti ci sono.

## B17 · Manca `package-lock.json` (bassa) — aperto

- `ffmpeg-static` è chiesto come `^5.2.0`. Senza file di blocco due installazioni possono dare versioni diverse.
  Va creato da un computer collegato alla rete (`npm install --package-lock-only`).

## B18 · Nomi di assistenti in quattro file (bassa) — rimandato alla fase 4

- `git grep -il` li trova in `.env.esempio`, `LEGGIMI.md`, `NOVITA.md`, `prove/libreria.mjs`. I nomi dei due file
  di istruzioni (`AGENTS.md`, `CLAUDE.md`) li impone chi li legge e restano. Il resto si riscrive con i documenti.

## B19 · Parola più larga dei sottotitoli (bassa) — aperto

- Una parola di 50 lettere a 60 px esce dai 920 px. La verifica lo segnala come scritta fuori zona. In italiano non
  capita; in tedesco sì.

## B20 · Punteggiatura isolata attaccata alla parola prima (bassa) — aperto

- `Il caffè — quello vero —` diventa `caffè—` `vero—` nei sottotitoli. È una scelta del kit (un trattino da solo non
  è una parola da pronunciare); resta brutto con i segni che aprono, come `(` o `«` staccati.

## Cosa non è un difetto ma è lontano dal traguardo

Misurato in questa fase, lavoro delle fasi successive: formato solo 9:16; passaggi tra le scene fatti con zoom e
dissolvenza; scene scritte a mano (`npm run riuso`: 16 scene su 16 nei due reel); voce a −14,0 LUFS contro i −17,7
del primo riferimento; narratore con una sola posa disegnata in più (braccia conserte).
