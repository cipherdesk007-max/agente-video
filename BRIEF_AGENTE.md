# Incarico: portare il FMLAB Reel Kit al livello dei video di riferimento

Sei l'agente che programma. Lavori nel repository `cipherdesk007-max/agente-video`, ramo `main`.
Questo file è l'incarico completo: leggilo tutto prima di toccare il codice.

## 1. Il traguardo, in una frase

Incollo un testo nel pannello, scelgo durata e narratore, premo un pulsante: esce un reel verticale che una
persona estranea non sa distinguere, per qualità, dai tre video in `riferimenti/`. Senza che nessuno scriva
scene a mano.

"Senza vincoli" vuol dire: qualsiasi argomento, qualsiasi lingua, durata da 15 a 180 secondi, qualsiasi
personaggio e marchio, nessun tetto fisso nei blocchi (oggi: 5 voci, 6 barre, 3 schede). Non vuol dire
togliere le regole del capitolo 6.

## 2. Da dove parti

Il repository contiene il kit 1.5.0: funziona in parte, è limitato e ha difetti non ancora elencati.
Nessuno li ha misurati: **non fidarti di nessuna descrizione, nemmeno di questa, finché non l'hai riprodotta.**

Leggi in quest'ordine: `SCHEDA.md`, `riferimenti/ANALISI.md`, `stile/appunti.md`, `NOVITA.md`,
`reels/reta-ginocchio/scene.tsx` (il meglio che il kit sa fare oggi). `FMLAB_AVVIA.md` solo per capitoli.

Il materiale grezzo da cui lavorare, sempre preferito a quello già elaborato:

- i tre mp4 in `riferimenti/` (li mette Francesco; se mancano, chiedili e non andare avanti con la fase 1):
  guardali fotogramma per fotogramma, non fidarti del riassunto in `ANALISI.md`;
- l'mp4 che il kit produce oggi, rifatto da te su questo computer, non le immagini già nel repository;
- l'output vero dei comandi (`npm test`, `npm run collaudo`, `npm run verifica`), non i documenti che
  dicono che passano.

Computer di lavoro: MacBook Pro 15" 2017, Intel i7 quad-core, 16 GB, macOS Ventura. Tutto deve girare lì:
niente che richieda una scheda grafica recente o Apple Silicon.

## 3. Le fasi

Una fase è chiusa quando il suo controllo passa e lo hai scritto in `STATO.md`. Non cominciare la successiva prima.

### Fase 0 · Diagnosi (niente codice nuovo)

1. `npm install`, `npm test`, `npm run collaudo`. Rifai da zero il reel `reta-ginocchio` (voce `stima`, non a
   pagamento) e il reel `gps`.
2. Prova il pannello come lo userebbe Francesco: testo incollato, durata scelta, ogni pulsante.
3. Scrivi `BUG.md`: per ogni difetto i passi per riprodurlo, cosa ti aspettavi, cosa è successo, gravità.
4. Aggiungi per ogni difetto una prova che oggi fallisce. Poi correggi, dal più grave.

Controllo: clone pulito → `npm install && npm test && npm run collaudo` senza errori; `BUG.md` senza voci gravi aperte.

### Fase 1 · Il metro (prima di migliorare qualsiasi cosa)

Costruisci `npm run confronta <file.mp4>`: misura un video qualsiasi e stampa una tabella. Almeno:

- tagli netti (devono essere 0) e secondi tra una novità visiva e la successiva;
- quanta parte del palco è occupata, e se qualcosa finisce sotto i sottotitoli o dietro il narratore;
- sottotitoli: posizione, parole a schermo insieme, ritardo rispetto alla voce (trascrizione con tempi);
- narratore: quante pose diverse, secondi nella stessa posa;
- parole al minuto, volume in LUFS, presenza di musica ed effetti;
- palette: tinta dominante per scena, contrasto delle scritte.

Lancialo sui tre riferimenti e salva i numeri in `riferimenti/misure.json`: quelle sono le soglie.
Lancialo sul reel `reta-ginocchio` del kit: la differenza è l'elenco dei lavori delle fasi 2 e 3.

Controllo: `npm run confronta` dà gli stessi numeri due volte di fila sullo stesso file, e le soglie stanno in
un file, non nel codice.

### Fase 2 · Il motore delle scene illustrate

Oggi le scene sono schede. Nei riferimenti sono luoghi e oggetti disegnati che si trasformano. Serve:

- **Scene a livelli con profondità:** fondo, ambiente, soggetto, primo piano, luce (fasci, nebbia, particelle,
  bagliori), con parallasse e camera che entra ed esce. Ogni scena dichiara da dove si entra e da dove si esce.
- **Passaggi senza taglio:** la camera attraversa un oggetto, un elemento resta e il resto cambia intorno, il
  fondo cambia tinta. Nessun passaggio a stacco o a dissolvenza semplice.
- **Un protagonista per reel** (per PEPTMAP la catena del peptide; per altri argomenti lo sceglie il regista):
  un oggetto che resta in scena da una scena all'altra e cambia stato.
- **Stati, non sostituzioni:** lo stesso oggetto passa da spento ad acceso, da pieno a vuoto, da rosso a verde.
- **Immagini generate, usate come materiale e non come video finito:** un modulo `motore/immagini.mjs` con
  un'unica interfaccia e più fornitori scelti nel file `.env` (Higgsfield, che Francesco ha già, più almeno un
  secondo fornitore e una modalità `nessuno` che usa solo la libreria). Ogni immagine: fondo trasparente,
  stile fissato da un foglio di stile del reel, salvata in `libreria/immagini/` con il suo prompt e la sua
  impronta, così la seconda volta costa zero. Il rendering resta in casa: è il kit che anima i livelli.
- **Biblioteca di ambienti e soggetti** già pronti per partire senza spendere: almeno corpo umano con organi,
  vaso sanguigno, membrana con recettori, laboratorio, stadio, palco, bilancia, documento/studio.
- Togli i tetti fissi dai blocchi: quando gli elementi sono tanti il blocco si adatta (scala, scorre, raggruppa).

Controllo: rifai `reta-ginocchio` con il motore nuovo; `npm run confronta` rientra nelle soglie su tagli,
novità visive e palco occupato; tempo di render misurato e scritto in `STATO.md`.

### Fase 3 · Il regista (l'app diventa un'app AI)

Oggi le scene le scrive a mano un agente esterno. Deve farlo il kit.

> **Decisioni prese dopo l'incarico (17/11/2026), che valgono più del testo qui sotto:**
>
> 1. **Il regista è l'agente che lavora sul kit**, non un modello chiamato dal kit. Niente fornitore di linguaggio
>    nel `.env`: il punto "Modello di linguaggio dietro un'unica interfaccia" è tolto. Il kit dà all'agente un solo
>    file da scrivere (`piano.json`), il controllo che dice se è scritto bene (`npm run piano`) e un comando che fa
>    il resto (`npm run fai`). Il regista di serie (`npm run regia`) resta come base senza rete.
> 2. **"Si corregge da solo" diventa "dice esattamente cosa correggere"**: il giro di correzione lo fa l'agente,
>    al massimo due volte, guardando `piano`, `verifica`, `affianca`.
> 3. **LTX è stato solo studiato**, non integrato: non può girare sul Mac del 2017 e non deve fare il reel. Ne viene
>    il modo di descrivere una scena come una ripresa (inquadratura, movimento di camera, azione). Da OpenMontage
>    vengono le tappe salvate e il controllo che ferma un reel fatto di cartelli. Dettagli in `riferimenti/ANALISI.md`.
> 4. **Il giudice è l'occhio, il metro viene dopo.** Prima `npm run affianca` (dodici fotogrammi del reel accanto a
>    dodici del riferimento), poi `npm run prova-cieca`, poi `npm run confronta`. Niente si dichiara chiuso senza
>    averlo guardato a fotogrammi; se un numero migliora e il foglio affiancato no, si dice.

- `motore/regista.mjs`: dal testo produce un **piano di regia** in JSON (scene, protagonista, per ogni scena
  ambiente, soggetto, stati, parola a cui si aggancia ogni novità, posa del narratore, suoni, immagini da
  generare). Il piano è validato da uno schema: se non è valido si richiede, non si improvvisa.
- Dal piano si generano le scene senza codice scritto a mano: il piano è il formato, `scene.tsx` resta
  possibile per chi vuole una scena su misura.
- Modello di linguaggio dietro un'unica interfaccia, fornitore e chiave nel file `.env` (qualsiasi API
  compatibile con OpenAI, quindi anche Kimi; più una modalità senza rete che usa i modelli del kit).
- Il regista si corregge da solo: dopo i provini lancia `confronta` e `verifica`, e se una scena è sotto
  soglia la rifà, al massimo per un numero di giri fissato nelle impostazioni.
- Prima di ogni spesa (voce, immagini, modello) il pannello mostra il costo stimato e aspetta il sì.
- Pannello: testo, durata, lingua, formato (9:16, 1:1, 16:9), narratore, marchio, pulsante unico; avanzamento
  per passi, errori in italiano con cosa fare, ripresa dal passo fallito senza rifare quelli riusciti.

Controllo: tre testi di prova su argomenti lontani tra loro (uno di salute, uno di tecnologia, uno di
economia), ciascuno dal testo al video con un solo comando e nessun intervento.

### Fase 4 · Rifinitura e consegna

- Narratore: più pose e passaggi morbidi tra una posa e l'altra; pose scelte dal senso della frase.
- Audio: voce, musica che si abbassa sotto la voce, effetti, volume finale allineato ai riferimenti.
- Documenti aggiornati: `SCHEDA.md`, `CATALOGO.md`, `catalogo.jpg`, `NOVITA.md`, `PROMPT.md`.
- Versione 2.0.0.

## 4. Come lavora un professionista (e come devi lavorare tu)

- Misura prima, poi migliora: nessuna modifica "per bellezza" senza il numero che deve muoversi.
- Un problema per volta, commit piccoli, messaggio che dice cosa e perché.
- Guarda i fotogrammi veri: un fotogramma ogni 0,2 secondi attorno a ogni passaggio, non l'anteprima.
- Tieni `STATO.md` aggiornato: fase, cosa è chiuso, cosa è aperto, cosa hai deciso tu e perché.
- Quando una strada non regge sul Mac del 2017, dillo con il tempo misurato e proponine un'altra.

## 5. Quando fermarti e chiedere

Solo per: spendere crediti o soldi, chiavi mancanti, i video di riferimento mancanti, una scelta che cancella
lavoro già fatto. Per tutto il resto decidi, scrivi la scelta in `STATO.md` e vai avanti.

## 6. Regole che non si discutono

- Il testo scritto nel pannello è il testo del reel, parola per parola. Si aggiungono solo scene, segni,
  enfasi e suoni. Dubbi sui fatti: non correggere, elencali alla fine e in `fonti.md`.
- La durata è quella scelta, con al massimo 5 secondi di scarto: si velocizza la voce, non si taglia il testo.
  Se non rientra nemmeno così, dillo prima di generare la voce, con le parole da togliere.
- Ogni numero mostrato ha la sua riga in `fonti.md`. Salute e sostanze: capitolo 13 di `FMLAB_AVVIA.md`.
- Dei riferimenti si prende il linguaggio visivo. Non si copiano personaggio, marchio, testi, disegni.
- Le chiavi stanno solo nel file `.env`: mai nel codice, nei log, nei commit.
- Tutto è firmato FMLAB: nessun nome di strumenti o assistenti AI nei file, nei video, nei commit.
- Commit: nessuna riga di co-autore, nessun link a sessioni o chat.
- `AGENTS.md` e `CLAUDE.md` restano identici tra loro.
- CI veloce: a ogni modifica girano solo le prove rapide. Quelle lente (render completi, confronto con i
  riferimenti) stanno in un comando a parte, `npm run prove:lente`, da lanciare a fine fase.
- A fine lavoro su ogni reel di prova: `npm run riuso`, e i pezzi buoni entrano in libreria.

## 7. Come un estraneo verifica che è finito

Qualcuno che non sei tu e non è Francesco deve poter dire sì o no seguendo solo questo elenco:

1. Clone pulito, `npm install`, `npm test`, `npm run collaudo`: tutto verde, e la CI su GitHub è verde.
2. `npm run prove:lente`: i tre testi di prova diventano tre mp4 senza intervento.
3. `npm run confronta` su ciascuno dei tre: ogni misura dentro le soglie di `riferimenti/misure.json`.
4. Durata di ciascuno entro 5 secondi da quella chiesta; testo pronunciato uguale al testo dato (trascrizione
   confrontata parola per parola).
5. `npm run verifica` senza errori; ogni numero a schermo trovato in `fonti.md`.
6. **Prova cieca:** `npm run prova-cieca` prepara una pagina con dieci spezzoni di 5 secondi senza audio,
   cinque dai riferimenti e cinque dai video del kit, mescolati e senza narratore (ritagliato, perché lo
   tradirebbe). Tre persone dicono per ognuno "riferimento" o "kit". Finito se indovinano non più di 6 su 10.
7. `BUG.md` senza voci gravi aperte; `git grep` non trova chiavi né nomi di assistenti AI.

## 8. Cosa mi consegni alla fine

Un messaggio breve, in italiano: cosa funziona, i numeri di `confronta` accanto alle soglie, il tempo di
render sul Mac, quanto costa un reel in crediti, cosa non sei riuscito a provare, cosa resta aperto.
