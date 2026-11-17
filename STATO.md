# Stato dei lavori

Incarico: `BRIEF_AGENTE.md`. Difetti: `BUG.md`. Aggiornato il 17/11/2026 (fase 3 in corso; il giudice è l'occhio: vedi la sezione con questo nome).

| Fase | Stato | Controllo |
|---|---|---|
| 0 · Diagnosi | **chiusa** (un punto da confermare sul Mac, vedi sotto) | prove veloci, collaudo e prove lente verdi; nessun difetto grave aperto |
| 1 · Il metro | **chiusa** | `npm run confronta` dà gli stessi numeri due volte; le soglie stanno in `riferimenti/misure.json` |
| 2 · Motore delle scene | **chiusa** (controllo superato; tre punti aperti, vedi sotto) | `reta-ginocchio` rifatto: tagli, novità e palco dentro le soglie; render misurato |
| 3 · Il regista | **in corso**: il percorso dal testo al video c'è ed è provato; restano formati, lingue senza spazi, pannello | tre testi di prova (salute, tecnologia, economia) dal testo al video con un comando: passa (`npm run prove:lente regista`, 3 minuti), in bozza, senza narratore e senza voce |
| 4 · Rifinitura | da fare | — |

## Fase 0 · cosa è chiuso

- Rifatti da zero `reta-ginocchio` e `gps` (italiano e inglese) con tempi stimati: voce, provini, render completo, verifica.
- Provato il pannello da un browser grande come un telefono: ingresso con il codice, testo incollato, durata, ogni
  pulsante (voce, provini, bozza, video finale, ferma, verifica, scelte del narratore, voce, anteprima, catalogo).
- `BUG.md`: 20 difetti, ognuno riprodotto. 5 gravi, 7 medi, 8 bassi.
- Una prova per difetto, scritta prima della correzione: il giorno della diagnosi `prove/difetti.mjs` dava 19 prove
  fallite su 20.
- Corretti 15 difetti: i 5 gravi (B01-B05), 6 medi (B06-B11) e 4 bassi (B13-B16).
- Aperti 5, nessuno grave: B12 (lingue senza spazi, fase 3), B17 (file di blocco delle dipendenze: serve la rete),
  B18 (nomi di assistenti in quattro file, fase 4), B19 e B20 (sottotitoli: parola lunghissima, punteggiatura isolata).

## Numeri misurati (16/11/2026)

Computer della diagnosi: Linux, 2 processori, 8 GB, Node 22.23, Chrome, ffmpeg 6.1. **Non è il Mac di lavoro:** i
tempi di render vanno rimisurati lì.

| Cosa | Valore |
|---|---|
| `npm test` | 58 prove (17 motore, 21 libreria, 20 difetti), 8,7 s; in CI su GitHub 34 s con l'installazione |
| `npm run collaudo` | tutto a posto, 12 s |
| `npm run prove:lente` | 6 prove superate, 5 min 18 s (pannello dal telefono, 7 modelli, render fermato, durata, fonti, collaudo) |
| Render `reta-ginocchio` (114,7 s, 3.441 fotogrammi, 1080×1920) | 12 min 36 s con 1 pezzo: 4,6 fotogrammi al secondo; processore usato per il 60% |
| Stesso computer, 2 pezzi in parallelo (reel di 17 s) | 5,8 fotogrammi al secondo |
| Tagli netti in `reta-ginocchio.mp4` (ffmpeg `scene` > 0,3) | 0 |
| Verifica `reta-ginocchio` | 271 fotogrammi senza errori; video uguale alle scene entro lo 0,8% |
| Volume: voce nel video finale | −14,0 LUFS (i riferimenti, rimisurati in fase 1: da −14,4 a −14,6) |
| Volume: reel con soli effetti sonori | −24,0 LUFS |
| Scene scritte a mano nei due reel (`npm run riuso`) | 16 su 16 |
| Cartella di lavoro `.fmlab/` dopo una sessione, prima della correzione | 199 MB |
| Durata con voce finta: 60 parole, 20 s chiesti | velocità tra 1,05 e 1,4, video entro 5 s, voce e tempi allineati |

## Cosa non è stato possibile provare

- **`npm install` da zero su questo computer:** la rete verso il registro dei pacchetti era chiusa. Le prove sono
  girate con gli stessi pacchetti alle stesse versioni di `package.json` (d3 7.9.0, esbuild 0.28.2,
  playwright-core 1.63.0, react e react-dom 19.2.8, react-icons 5.7.0, roughjs 4.6.6), già presenti sul computer.
  L'installazione da zero l'ha fatta la CI su GitHub (Ubuntu, Node 22): `npm install` e le 58 prove veloci sono
  verdi sul commit `29e0e88`. Il giro prima era rosso per una prova scritta male (B17 guardava il file creato da
  `npm install` invece di quello salvato in git): corretta. Collaudo e prove lente la CI non li fa.
  **Da rifare una volta sul Mac:** `git pull && npm install && npm test && npm run collaudo && npm run prove:lente`.
- **Il Mac di lavoro** (MacBook Pro 2017, Ventura): niente è stato lanciato lì. Voce del Mac (`say`) e codifica con
  VideoToolbox non si possono provare su Linux.
- **ElevenLabs:** nessuna chiave e nessun credito speso. La velocità sulla voce è provata con il motore "comando" e
  una voce finta (`prove/sostegno/voce-finta.mjs`); la strada di ElevenLabs passa dallo stesso codice ma non è stata
  ascoltata con una voce vera.
- **Come suona la voce a 1,3-1,4:** misurata la durata, non la gradevolezza. Da ascoltare sul primo reel vero.

## Scelte fatte, e perché

1. **Nel pannello il testo è il testo del reel, di serie.** È la prima regola del capitolo 6. "È solo l'argomento"
   resta, ma va scelto.
2. **Il testo dato sta in `testo.txt`, intatto.** È il termine di paragone: voce e verifica confrontano il copione
   con quel file e si fermano alla prima parola diversa. Senza `testo.txt` (i due reel già fatti) nessun confronto.
3. **La voce velocizzata non si salva.** L'audio sul disco resta quello naturale e la velocità sta in `parole.json`:
   la applicano il render (`atempo`) e l'anteprima. Così cambiare durata non rigenera la voce e non costa crediti.
4. **Si punta alla durata giusta, non al bordo dei 5 secondi**; se la voce è già dentro i 5 secondi non si tocca.
5. **Una voce troppo corta non si rallenta** (suona finta): è un errore della verifica, con le parole che mancano
   o la durata da scegliere. Decide la persona.
6. **Prima di una voce a pagamento il conto si fa a 200 parole al minuto** e velocità massima 1,4: se il testo non
   può entrare, nessun credito viene speso.
7. **Le scene pronte danno errore invece di tagliare.** Fermarsi è meglio di un grafico con una colonna in meno.
   L'adattamento (scala, scorre, raggruppa) è lavoro della fase 2: lì gli errori diventano impaginazione.
8. **I numeri si confrontano per valore** ("1.019" e "1019" sono lo stesso numero). Non contano le scritte fatte solo
   di un intero fino a 10 (numeri d'ordine, tacche di una scala).
9. **`fonti.md` dei due reel:** aggiunte due righe sotto "Calcoli" per quattro numeri arrotondati che erano a schermo
   senza spiegazione (gps: ≈ 20.000 km, 0,07 s, oltre 30; reta: −2,1 e −1,9). Nessun dato nuovo: sono arrotondamenti
   di righe già presenti.
10. **`git` ignora video, provini e rapporti di verifica dei reel**; restano tracciati testo, copione, tempi,
    impostazioni e voce (la voce costa crediti: non si butta).
11. **Prove in due giri**, come chiede l'incarico: `npm test` (10 secondi, a ogni modifica, anche in CI) e
    `npm run prove:lente` (browser e render, a fine fase).

## Fase 1 · cosa è chiuso

- Arrivati i tre video di riferimento (16/11/2026): stanno in `riferimenti/` come `rif1.mp4`, `rif2.mp4`, `rif3.mp4`
  (Git li ignora). Guardati a fogli di fotogrammi e, per i sottotitoli, striscia per striscia.
- **`npm run confronta`** (`motore/confronta.mjs`): 28 misure con soglia, più le tinte. Solo ffmpeg, niente da installare.
- **`riferimenti/misure.json`**: le misure dei tre riferimenti, le zone guardate, il margine (15%) e le soglie.
- Misurati i due reel del kit: la differenza è l'elenco dei lavori, scritto in `riferimenti/ANALISI.md`.
- Indicazione di Francesco: i reel devono venire così **con il personaggio oppure senza**. Il metro dice se il
  narratore c'è e, quando non c'è, non giudica le pose.

### Il metro è tarato sul kit, dove i valori veri si conoscono

| Cosa | Vero | Misurato |
|---|---|---|
| Parole di `reta-ginocchio` (dai sottotitoli) | 290 | 281 (−3%) |
| Parole di `gps` | 132 | 130 (−1,5%) |
| Pagine di sottotitoli | 88 · 41 | 90 · 43 |
| Novità che cadono su un segno o un cambio di scena del copione | — | 40 su 40 · 20 su 20 |
| Segni e cambi di scena ritrovati | 59 · 33 | 42 (71%) · 24 (73%) |
| Posa tenuta più a lungo (`reta-ginocchio`) | 10,6 s | 11,6 s |
| Stesso file misurato due volte | — | numeri identici (riferimenti e kit) |
| Tempo di una misura | — | 7 s per un riferimento, 45 s per un reel di due minuti in 1080×1920 |

### Riferimenti e kit: i numeri che contano

| | Riferimenti | Soglia | `reta-ginocchio` | `gps` |
|---|---|---|---|---|
| Tagli netti | 0 · 0 · 0 | 0 | 0 | 0 |
| Secondi tra due novità (mediana) | 1,73 · 1,75 · 1,50 | al massimo 2,01 | **2,70** | **2,37** |
| Movimento sul palco | 4,95 · 4,40 · 3,51% | almeno 2,98% | **0,62%** | **0,97%** |
| Tempo con il palco fermo | 0,2 · 6,4 · 0,2% | al massimo 7,4% | **56,6%** | **31,3%** |
| Fermo più lungo | 0,1 · 1,5 · 0,1 s | al massimo 1,76 s | **4,4 s** | **2,4 s** |
| Narratore: cambi di posa al minuto | 40 · 53 · 40 | almeno 34 | **15,7** | **19,5** |
| Narratore: stessa posa (mediana) | 1,4 · 1,0 · 1,35 s | al massimo 1,61 s | **2,7 s** | **2,6 s** |
| Narratore: posa più lunga | 3,3 · 3,2 · 2,8 s | al massimo 3,8 s | **11,6 s** | **6,6 s** |
| Parole al minuto | 172 · 174 · 223 | da 146 a 256 | 147 | **141** (tempi stimati) |
| Volume | −14,6 · −14,5 · −14,4 LUFS | da −16,8 a −12,2 | senza voce | senza voce |
| Misure dentro le soglie / fuori / non misurabili | 28 / 0 / 0 | | 15 / 8 / 5 | 14 / 9 / 5 |

In grassetto quello che è fuori soglia. Già dentro: tagli, sottotitoli (posizione, grandezza, parole insieme,
contrasto), luminosità, tinte, palco occupato.

### Cosa il metro non misura, e cosa non è stato possibile provare

- **Niente riconoscimento della voce** (su questo computer non c'è, e il kit non ne installa). Le parole si contano
  dai sottotitoli; l'anticipo dei sottotitoli sulla voce si ricava allineando gli attacchi della voce con la comparsa
  delle parole (picco netto: da 2,0 a 3,1 deviazioni). **Il punto 4 della verifica finale** ("testo pronunciato uguale
  al testo dato, trascrizione parola per parola") **chiede un riconoscitore sul Mac**: è una scelta da fare prima
  della fase 3 (vedi sotto).
- **I reel del kit sono stati misurati senza voce** (tempi stimati): volume, musica, effetti e anticipo dei
  sottotitoli sono "non misurabili" finché non c'è un reel con la voce vera. Costa crediti: va chiesto.
- **Luogo disegnato o scheda?** Palco occupato e dettaglio non li distinguono (kit e riferimenti danno numeri
  simili). Per quello resta la prova cieca.
- **Dietro il narratore**: il metro vede solo quello che c'è nel video. Lo controlla `npm run verifica`.
- **Contrasto delle scritte**: misurato sui sottotitoli, non sulle scritte del palco.
- **Margine del 15%** sulle soglie: è una scelta mia (sta in `misure.json`, campo `margine`). Con tre soli
  riferimenti l'intervallo "vero" non si conosce: più stretto vuol dire copiare, più largo non misura niente.
- Correzione a una misura della fase 0: il riferimento 1 è a **−14,6 LUFS**, non −17,7 come scriveva `ANALISI.md`.
  Il volume della voce del kit (−14,0) è già dentro la soglia: non c'è niente da cambiare in fase 4.

## Fase 2 · cosa è chiuso (17/11/2026)

- **Il mondo a livelli** (`libreria/Mondo.tsx`): fondo, nebbia, trama lontana e vicina, luogo disegnato, luce, ognuno
  a una distanza diversa. La camera viaggia sempre, scatta a ogni cambio di scena, dà una spinta con un lampo a ogni
  `[segno]`. Vale per tutti i reel, anche quelli già fatti (`mondo: false` lo spegne).
- **Otto luoghi pronti**, disegnati dal kit a costo zero: corpo con organi, vaso sanguigno, membrana con recettori,
  laboratorio, stadio, palco, bilancia, documento/studio.
- **Passaggi senza taglio**: `entra: 'avanti'` attraversa la scena prima (si ingrandisce e si sfoca), `sinistra`,
  `destra`, `alto`, `basso` sono carrellate; la tinta del mondo cambia insieme. Guardati a un fotogramma ogni 0,2 s.
- **Il protagonista** (`libreria/Protagonista.tsx`): un oggetto solo che resta mentre le scene cambiano, e cambia
  stato (acceso/spento, pieno/vuoto, colore, calmo/agitato) al cambio di scena o a un segno. Tre tipi: peptide,
  goccia, cellula.
- **Immagini generate come materiale** (`motore/immagini.mjs`): un'interfaccia, quattro fornitori (`nessuno` di serie,
  `higgsfield`, `stability`, `comando`), fondo trasparente fatto dal kit, biblioteca con impronta.
- **Le scene pronte si adattano** invece di fermarsi: scorrono, raggruppano, stringono.
- **`reta-ginocchio` rifatto** con il motore nuovo: un luogo per scena, tre carrellate, la catena della Reta come
  protagonista (mezza carica alla scala del dolore, spenta sul placebo, rossa e agitata sui rischi).

### `reta-ginocchio`, prima e dopo (stesso copione, stesse scene, `npm run confronta`)

| | Soglia | Prima | Dopo |
|---|---|---|---|
| Tagli netti | 0 | 0 | 0 |
| Secondi tra due novità (mediana) | al massimo 2,01 | 2,70 | **1,95** |
| Secondi tra due novità (9 volte su 10) | al massimo 4,16 | 4,67 | **3,15** |
| Attesa più lunga senza novità | al massimo 8,0 | 7,1 s | 3,73 s |
| Palco occupato (media / momenti più vuoti) | almeno 0,36 / 0,12 | 0,46 / 0,23 | 0,54 / 0,34 |
| Tempo con il palco fermo | al massimo 7,4% | 56,6% | **0,1%** |
| Fermo più lungo | al massimo 1,76 s | 4,4 s | **0,13 s** |
| Movimento sul palco | almeno 2,98% | 0,62% | 1,49% (ancora fuori) |
| Sottotitoli: contrasto nei momenti peggiori | almeno 2,98 | 6,0 | 4,5 |
| Sottotitoli: tempo con altro nella loro fascia | al massimo 51,8% | 0,4% | 43,8% (riferimenti: 23-45%) |
| Misure dentro / fuori / non misurabili | | 15 / 8 / 5 | **19 / 4 / 5** |
| Tempo di render (2 pezzi, 3.441 fotogrammi) | | 5,8 fotogrammi al secondo | 4,5: **12 min 40 s** |
| Peso del video | | 44 MB | 102 MB |

Le quattro misure ancora fuori: il movimento, e le tre del narratore (fase 4).

Prove a fine fase: `npm test` 65 prove in 8,9 s (17 motore, 21 libreria, 27 difetti e fasi); `npm run prove:lente`
9 su 9 in 11 min 23 s su questo computer (collaudo, modelli, render fermato, durata con voce finta, metro, mondo,
soglie dei riferimenti, numeri e fonti, pannello dal telefono).

### Punti aperti della fase 2

1. **Movimento sul palco: 1,49% contro almeno 2,98%.** Il fondo ora si muove sempre, ma nei riferimenti si muove
   quello che sta *davanti*: oggetti che girano, la camera che gli passa accanto. Ho provato a spingere solo il fondo
   (camera il doppio più veloce, più fili): il numero sale di poco (1,31 → 1,47 → 1,60) e la fascia dei sottotitoli
   si riempie (dal 2% al 40% del tempo). Non è la strada: serve che le scene siano oggetti in movimento, cioè il
   lavoro del regista (fase 3) sulle scene, non altro fondo.
2. **Immagini generate: mai provate con un fornitore vero.** Higgsfield e Stability sono provati contro servizi finti
   in locale (richiesta, attesa, scarico, ritaglio). La forma della risposta "finita" di Higgsfield e l'indirizzo di
   Stability li ho scritti dalla loro documentazione senza poterli chiamare: **alla prima immagine vera possono
   servire ritocchi.** Servono le chiavi, e si spendono crediti: è una delle cose da chiedere.
3. **I luoghi sono disegni al tratto fatti dal kit**, non illustrazioni: danno il posto e il movimento, non ancora la
   ricchezza dei riferimenti. Il salto di aspetto passa dalle immagini generate (punto 2) e dalla prova cieca, che
   non è ancora stata fatta.

### Scelte della fase 2, e perché

- **Una scena dichiara solo da dove si entra** (`entra`); da dove si esce è l'ingresso della scena dopo. Due
  dichiarazioni per lo stesso passaggio potevano contraddirsi.
- **La trasparenza delle immagini la fa il kit** (soggetto chiesto su verde pieno, `ffmpeg` toglie il verde): così
  vale per qualunque fornitore, anche per quelli che non sanno fare il fondo trasparente.
- **Secondo fornitore: Stability, più `comando`** (un programma qualsiasi, anche uno che gira sul Mac senza rete).
  Di serie `nessuno`: il kit non spende mai da solo.
- **Barre fino a 12 colonne, poi errore**: oltre non si leggono su un telefono, e raggruppare una serie nel tempo
  la falsa. Torta e classifica invece raggruppano ("Altri (n)"), gli elenchi scorrono.
- **Il protagonista sta in basso a sinistra** (x 260, y 1392) se la scena non dice altro: è il punto libero in
  tutte e dieci le scene di `reta-ginocchio`, tra il palco e la didascalia dell'app.
- **Effetto sul metro da tenere presente:** con il mondo dietro, il conteggio delle parole dai sottotitoli sbaglia
  di più (316 contate, 290 vere: +9%; prima −3%), e le misure del narratore si spostano anche se il narratore non è
  cambiato (cambi di posa al minuto 15,7 → 14,1), perché nel suo riquadro ora passa il fondo. Da sistemare nel metro
  prima di giudicare il narratore in fase 4.

## Fase 3 · il regista (17/11/2026, in corso)

**Decisione di Francesco (17/11):** il regista è sempre l'agente che lavora sul kit, non un modello chiamato dal
kit. Quindi niente fornitore di linguaggio in `.env`: l'incarico lo prevedeva, la scelta lo toglie. Il kit dà
all'agente un solo file da scrivere e tutti i controlli per sapere se l'ha scritto bene.

Cosa c'è:

- **`piano.json`**, il piano di regia: per ogni scena le prime parole (`da`), il blocco e i suoi dati, i segni come
  "nome → parola del testo", enfasi, suoni, luogo, ingresso, inquadratura, movimento di camera, stato del
  protagonista, posa del narratore, e il perché della scena. `npm run monta` scrive `copione.md` e `scene.tsx`.
  26 blocchi, 18 oggetti 3D che cambiano stato su un segno, scene a mano in `mano.tsx`.
- **Il testo non si tocca**, e lo garantisce il montaggio: dopo aver scritto il copione lo rilegge e lo confronta
  con `testo.txt` parola per parola.
- **`npm run piano`**: errori che dicono scena, campo e cosa fare; consigli (pause oltre 3,5 secondi, segni che non
  fanno comparire niente, quattro scene uguali di fila, camera ferma, numeri senza fonte); **rischio cartelli** da
  0 a 100 su sette voci. Con i tempi veri della voce i consigli si ricalcolano su quelli.
- **`npm run regia`**, il regista di serie: regole, niente rete, niente spesa. Dà un piano valido da cui partire.
- **`npm run fai`**: otto tappe salvate, in due tempi (composizione gratis, poi voce e video). Riparte dalla tappa
  fallita. Si ferma prima della voce a pagamento con il costo. Dice "fatto" solo se la verifica passa.
- **Scelte della persona**: `durata=`, `narratore=dottore|nessuno`, `regalo=auto|nessuno|<nome>`, in coda a `fai` o
  con `imposta`. I regali (ebook, mappe, PDF) si aggiungono con `npm run regalo`, anche da un PDF.
- **Ogni scena è una ripresa**: `campo` e `camera` per scena, il fondo che segue la camera.

### Il controllo dell'incarico: tre testi lontani, un comando ciascuno

`npm run prove:lente regista`: un testo di salute, uno di tecnologia, uno di economia (in `prove/sostegno/testi/`),
ognuno con `npm run fai <reel> testo=<file> … bozza`. Per ciascuno: otto tappe riuscite, verifica senza errori, le
parole dette uguali al testo dato, e rilanciando il comando nessuna tappa viene rifatta. Circa un minuto a testo.
**Limiti di questa prova:** è una bozza a metà risoluzione, senza narratore e senza voce (tempi stimati), e il
piano è quello di serie, che usa quasi solo scritte in movimento. Dimostra che il percorso regge da solo, non che
il risultato sia al livello dei riferimenti: quello lo fa il piano scritto da chi fa la regia (tabella qui sotto).

### Il testo di Francesco, dal testo al video (`reels/reta-testo`)

Il testo incollato il 17/11 (284 parole), prima con il piano di serie, poi con il piano scritto da chi fa la regia
(dodici scene, due giri di correzione guardando i provini). Tempi stimati, senza voce, narratore dottore.

| Misura (`npm run confronta`) | `reta-ginocchio` fase 2 | piano di serie | piano di regia | soglia |
|---|---|---|---|---|
| Tagli | 0 | 0 | 0 | 0 |
| Secondi tra due novità (mediana) | 1,95 | 2,10 | **1,93** | al massimo 2,01 |
| Secondi tra due novità (9 su 10) | 3,15 | 3,88 | **2,83** | al massimo 4,16 |
| Movimento sul palco | 1,49% | 2,33% | **1,74%** (fuori) | almeno 2,98% |
| Tempo con il palco fermo | 0,1% | 0,1% | 0,1% | al massimo 7,4% |
| Palco occupato (media) | 0,54 | 0,52 | 0,50 | almeno 0,36 |
| Misure dentro le soglie | 19 su 23 | 17 su 23 | 18 su 23 | — |
| Rischio cartelli del piano | — | medio | 8 su 100 (basso) | sotto 35 |

Render: 11 minuti 49 secondi su questo computer (due processori), 3.371 fotogrammi. Verifica: passata, 5 avvisi (tempi stimati, durata oltre 90 secondi, prima frase di 20 parole, una scritta fuori zona a 54,5 s, stile 2D con oggetti 3D).

Letta la tabella:

- **Novità**: l'attesa più lunga senza niente di nuovo scende da 8,1 secondi (piano di serie) a 3,6. È l'effetto
  del controllo sulle pause, ricalcolato sui tempi veri.
- **Movimento sul palco: ancora fuori, 1,74% contro almeno 2,98%.** Il 2,33% del piano di serie non è un risultato
  da tenere: era misurato con movimenti di camera più ampi, che spingevano le scritte fuori dalle zone sicure
  (cinque avvisi), e sono stati ridotti. Inquadratura e camera da sole non bastano: nei riferimenti si muovono
  oggetti grandi e illustrati. Servono scene con più cose in moto (oggetti 3D che girano sempre, grafici che non
  si fermano dopo essere comparsi) oppure materiale filmato.
- **Sottotitoli con altro nella loro fascia: 52,4% contro al massimo 51,75%.** Appena fuori: è il fondo che ora
  segue la camera e porta i suoi fili dentro la fascia. Da abbassare insieme al punto sopra.
- **Narratore**: tre misure fuori, come prima. Non è stato toccato (fase 4).

**Dubbi sui fatti del testo** (il testo non è stato toccato; sono scritti in `reels/reta-testo/fonti.md`):
"diminuito di quasi quattro punti" vale per un solo gruppo (3,96; gli altri da 3,22 a 3,74); "effetti collaterali
gravi… soprattutto gastrointestinali" unisce due cose che le fonti tengono distinte.

### Da dove viene cosa (licenze)

- **LTX-2.5**: studiato il modo di descrivere una ripresa, niente codice, niente modello nel kit. Non può girare sul
  MacBook del 2017 (pesi di circa 66 GB, schede NVIDIA). Francesco ha chiarito che va studiato, non integrato.
- **OpenMontage** (licenza AGPL-3.0): letti `lib/slideshow_risk.py`, `skills/pipelines/explainer/scene-director.md`
  e `skills/meta/reviewer.md`. Nel kit **non c'è nessun file loro e nessuna riga copiata**: il rischio cartelli e le
  regole di varietà sono riscritti qui, in un altro linguaggio, su dati diversi (il piano del kit). Francesco ha
  detto che il kit è privato e che si può prendere anche il codice: finora non è servito. Se un giorno si copia un
  loro file, va scritto qui con il percorso, perché da quel momento chi riceve il kit ha diritto al sorgente.
- La tabella di cosa è diventato cosa è in `riferimenti/ANALISI.md`.

### Scelte della fase 3, e perché

- **Il piano è un file di dati, le scene si scrivono da sole.** Un agente che scrive codice sbaglia in mille modi e
  ogni errore si scopre al render; un piano sbagliato si scopre in mezzo secondo, con il nome della scena.
- **Il regista di serie non mette cifre a schermo.** Una cifra è un dato e vuole la sua riga in `fonti.md`; lui la
  fonte non ce l'ha. Scrive i numeri come li dice il testo. Le cifre le mette chi fa la regia, con la fonte.
- **Testo dato senza indirizzi in `fonti.md`: avviso, non errore.** I fatti di un testo già scritto sono di chi l'ha
  scritto. I numeri messi a schermo restano obbligati alla loro riga: quello è ancora un errore.
- **Il `**grassetto**` incollato diventa enfasi.** Gli asterischi non sono parole. `testo.txt` resta com'è stato dato.
- **Le pause si contano a voce lenta** (2,6 parole al secondo) finché non ci sono i tempi veri: chi rispetta la
  pausa sul piano la rispetta anche dopo la voce.
- **La camera di scena non ingrandisce mai oltre il disegno.** Alla prima prova allargava le scene e le scritte
  uscivano dalle zone sicure (cinque avvisi della verifica): ora la scala è al più 1.
- **"Si corregge da solo" è diventato "dice esattamente cosa correggere".** Con l'agente come regista, il giro di
  correzione lo fa lui: `piano` e `verifica` gli dicono scena e motivo, `SCHEDA.md` fissa due giri al massimo.

### Non fatto nella fase 3, e non provato

- **Formati 1:1 e 16:9**: non iniziati. Tutto il kit ragiona in 1080×1920.
- **Lingue senza spazi** (B12): aperto. Il piano cerca le parole dividendo sugli spazi.
- **Pannello**: scrive la richiesta giusta per l'agente, ma non ha il pulsante unico con le tappe di `fai`.
- **Preventivo di spesa**: `fai` si ferma solo prima della voce ElevenLabs. Le immagini generate restano spente di serie.
- **Nessun agente diverso da chi ha scritto il kit ha ancora fatto un reel seguendo solo `SCHEDA.md`.** È la prova
  che conta e va fatta sul Mac: dare a Codex un testo e guardare se arriva in fondo senza aiuto.
- Il metro conta peggio le parole dei sottotitoli con il fondo in movimento (punto aperto dalla fase 2): i numeri
  dei sottotitoli e del narratore nella tabella sopra non sono affidabili.
- Voce vera e riconoscimento della voce: non provati (servono sul Mac). Strada gratuita vista in OpenMontage:
  Piper per la voce, WhisperX per il controllo "detto = scritto".

## Il giudice è l'occhio (17/11/2026, seconda parte)

Indicazione di Francesco: prima si guarda, poi si misura. Sette punti; qui cosa è fatto, cosa no, e cosa si vede.

| Punto | Stato | Guardato a fotogrammi |
|---|---|---|
| 1 · `npm run affianca` | fatto | sì: il foglio è il controllo di tutto il resto |
| 2 · Movimento con oggetti grandi in primo piano | fatto: 3,43% sul video intero (soglia 2,98%) | sì, dodici coppie e i passaggi a 0,2 s |
| 3 · Narratore: metro, poi pose | metro corretto; pose: 42,7 cambi al minuto; resta fuori la posa più lunga | solo in parte: vedi sotto |
| 4 · `npm run prova-cieca` | costruita; **nessuna persona l'ha ancora fatta** | la pagina sì, il verdetto no |
| 5 · Chiudere la fase 3 | **non fatto**: pulsante unico, formati 1:1 e 16:9, B12, B17. Chiusi B18, B19, B20 | — |
| 6 · Illustrazioni vere, senza spendere | fatto: foglio di stile, elenco, comandi, costo stimato | il foglio di stile è scritto sui fotogrammi di riferimento |
| 7 · `BRIEF_AGENTE.md` | aggiornato | — |

### Cosa ha detto il primo foglio affiancato

`reta-testo` accanto a `rif3.mp4` (il riferimento sullo stesso argomento), dodici momenti. Il kit perdeva su cinque
cose, tutte visibili senza metro:

1. **Soggetto.** Di là un oggetto grande e illustrato per momento; di qua blocchi piccoli da cruscotto e molto vuoto.
2. **Continuità.** Di là tornano gli stessi oggetti (due ginocchia, due batterie); di qua ogni scena cambiava grafica.
3. **Scritte.** Di là solo etichette a pillola; di qua elenchi e righe da leggere.
4. **Fondo.** Di là una nebbia uniforme; di qua i luoghi disegnati al tratto facevano concorrenza al contenuto.
5. **Narratore.** Di là più grande e con un gesto diverso a ogni momento; di qua più piccolo e quasi sempre col dito.

### Cosa è cambiato

- **`bloccoSoggetti`** (`libreria/Soggetti.tsx`): da uno a tre soggetti larghi da 360 a 800 pixel (ginocchio,
  quadrante, batteria, stomaco, riflettori, foglio, scale, un'icona, o un'illustrazione generata), con bagliore che
  respira, scintille in orbita, un riflesso che li attraversa, un colpo di luce a ogni cambio di stato, e
  un'etichetta a pillola. È tutto primo piano: al fondo non è stato aggiunto movimento.
- **`reta-testo` rifatto attorno ai soggetti**: tredici scene, dieci con soggetti. Le due ginocchia Reta/Placebo
  aprono e chiudono; quadrante, due quadranti, riflettori, due batterie, stomaco, pagina dello studio, ginocchio e scale.
- **I luoghi disegnati sono stati tolti da questo reel** (`"luogo": "vuoto"` in tutte le scene). Guardando il foglio
  facevano peggio: i riferimenti non hanno luoghi, hanno una nebbia. Il lavoro della fase 2 sui luoghi resta nel kit
  ma, onestamente, a occhio non serve così com'è.
- **Narratore**: una posa nuova a ogni inizio di frase, dopo ogni virgola, su ogni segno e a metà dei tratti lunghi
  (prima: una per frase, tenuta almeno 2,2 secondi). La posa chiesta dalla regia è la posa di casa della scena.

### I numeri, dopo aver guardato (`reta-testo`, video intero, tempi stimati)

| Misura | prima (piano di regia a blocchi) | adesso (soggetti) | soglia |
|---|---|---|---|
| Movimento sul palco | 1,74% | **3,43%** | almeno 2,98% |
| Secondi tra due novità (mediana) | 1,93 | 1,95 | al massimo 2,01 |
| Secondi tra due novità (9 su 10) | 2,83 | 3,5 | al massimo 4,16 |
| Sottotitoli con altro nella loro fascia | 52,4% | **32,7%** | al massimo 51,75% |
| Narratore: cambi di posa al minuto | 12,3 | **42,7** | almeno 34,9 (metro 2) |
| Narratore: stessa posa, mediana | 4,3 s | **1,2 s** | al massimo 1,61 s |
| Narratore: posa più lunga | 14,8 s | 6,9 s nel video intero; 4,5 s dopo la correzione (fuori) | al massimo 3,34 s (metro 2) |
| Misure dentro le soglie | 18 su 23 | **22 su 23** | — |

Come leggerli, senza farsi belli:

- **Il foglio affiancato è migliorato insieme ai numeri**, e si vede: stessi oggetti dei riferimenti, alla stessa
  scala, con la stessa etichetta. Non è migliorato in tre cose che il metro non vede: il colore (più freddo), il
  narratore (più piccolo), la materia dei soggetti (disegno piatto contro illustrazione con volume).
- **Le novità erano peggiorate a metà strada.** Con i soggetti ma senza il colpo di luce sui cambi di stato la
  mediana era salita a 2,45 s e i 9 su 10 a 4,27 s: fuori soglia tutte e due. Un quadrante che scivola da 6 a 2 non
  "compare", cambia piano. Il colpo (anello di luce e scatto) ha riportato le misure dentro, e a fotogrammi si vede.
- **Posa più lunga del narratore: ancora fuori.** Il video intero è stato misurato prima dell'ultima correzione e
  dava 6,9 s: era il dito in alto tenuto per tutto l'invito finale. Dopo la correzione, misurato solo il tratto
  finale (da 98 s alla fine): 4,5 s contro 3,34. Sono le ultime parole più il secondo e mezzo di coda in silenzio,
  con il dito in alto. Il video intero non è stato rifatto dopo quella correzione.
- **Costo:** il render è passato da 11 min 49 s a 13 min 39 s su questo computer (ogni soggetto si disegna due
  volte, per il riflesso). Sul Mac del 2017 non è misurato.
- Verifica: passata, 3 avvisi (tempi stimati, durata oltre 90 secondi, prima frase di 20 parole).

### Il metro del narratore (versione 2)

Con il fondo in movimento la versione 1 contava i contorni dei fili dietro al narratore. Ora, prima di cercare i
contorni, tutto quello che è più scuro di una soglia (78 su 255) si spegne: resta la figura. Controllo fatto:
lo stesso tratto di `reta-ginocchio` (da 20 a 50 secondi) reso con il mondo in movimento e con il fondo fermo dà
**gli stessi 18 cambi di posa**, 36 al minuto, posa più lunga 3,7 s in entrambi (mediana 1,5 e 1,4). Le soglie sono
state ricalcolate sui tre riferimenti: cambi al minuto da 34 a 34,9; pose diverse da 4,25 a 5,1; posa più lunga da
3,80 a 3,34 secondi. Le altre non cambiano.

### La prova cieca

`npm run prova-cieca` fa una pagina sola (si apre dal telefono) con dieci spezzoni di cinque secondi, cinque dai
riferimenti e cinque dal kit resi al momento, solo il palco. **Non l'ha fatta nessuno**: servono tre persone.
Il mio parere, che non vale come prova: oggi si distinguono. I soggetti del kit sono disegni vettoriali piatti con
un alone; quelli dei riferimenti sono illustrazioni con volume e materia. E le scritte sono in italiano di qua e
in inglese di là: chi legge indovina senza guardare.

### Non fatto, e perché

- **Punto 5**: pulsante unico nel pannello, formati 1:1 e 16:9, B12 (lingue senza spazi), B17 (`package-lock.json`:
  serve la rete, qui non c'è: sul Mac `npm install --package-lock-only` e poi salvarlo). Non iniziati.
- **Il colore.** Il verde del kit è acqua (160°), quello dei riferimenti è lime (105°): sul foglio il kit è più
  freddo. È il colore della pagina, decide Francesco (`stile/FOGLIO_IMMAGINI.md`).
- **Il protagonista** (la catenella in basso a sinistra) nei riferimenti non c'è. Sul foglio sembra un di più. È
  rimasto perché metà dei momenti "nuovi" del piano erano suoi cambi di stato: toglierlo va fatto con il piano.
- **Il narratore resta più piccolo** di quello dei riferimenti. Non toccato.
- **B19** è provato sul calcolo, non su un video in tedesco.

## Da decidere (Francesco)

1. **Voce vera per misurare un reel del kit** (volume, musica, anticipo dei sottotitoli, parole al minuto): serve
   generare la voce di un reel. Gratis con la voce del Mac; con ElevenLabs circa un credito per carattere
   (`reta-ginocchio`: circa 1.900 caratteri).
2. **Riconoscitore della voce sul Mac**, per il controllo "parole pronunciate = testo dato": un programma gratuito
   da installare una volta, che il kit chiamerebbe da solo. Senza, quel controllo resta fatto sul copione e non
   sull'audio.
3. **Chiavi per le immagini** (Higgsfield, che hai già): per provare `npm run immagine` con il servizio vero
   servono `HF_API_KEY_ID` e `HF_API_KEY_SECRET` nel file `.env` del Mac, e il permesso di spendere i crediti di
   qualche immagine di prova.
4. ~~Chi scrive il piano di regia~~: deciso il 17/11, lo scrive l'agente.
5. **La prova con un altro agente sul Mac**: dare a Codex un testo e la frase "fai il reel" e guardare se arriva al
   video seguendo solo `SCHEDA.md`. Costa tempo, non crediti (con la voce del Mac o senza voce).

## Prossimo passo

1. Francesco guarda `affianca` e fa fare la prova cieca a tre persone: è il giudizio che manca.
2. Punto 5: pulsante unico nel pannello con le tappe di `fai`, formati 1:1 e 16:9, B12, B17 (dal Mac).
3. Illustrazioni vere: la prima immagine da sola, guardata, poi le altre (`reels/reta-testo/immagini.md`).
4. Narratore: più grande, e la posa finale.
