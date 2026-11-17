# Stato dei lavori

Incarico: `BRIEF_AGENTE.md`. Difetti: `BUG.md`. Aggiornato il 17/11/2026.

| Fase | Stato | Controllo |
|---|---|---|
| 0 · Diagnosi | **chiusa** (un punto da confermare sul Mac, vedi sotto) | prove veloci, collaudo e prove lente verdi; nessun difetto grave aperto |
| 1 · Il metro | **chiusa** | `npm run confronta` dà gli stessi numeri due volte; le soglie stanno in `riferimenti/misure.json` |
| 2 · Motore delle scene | **chiusa** (controllo superato; tre punti aperti, vedi sotto) | `reta-ginocchio` rifatto: tagli, novità e palco dentro le soglie; render misurato |
| 3 · Il regista | da fare | — |
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
4. **Chi scrive il piano di regia nella fase 3**: un modello che gira sul Mac (gratis, ma sul MacBook del 2017 è
   lento e va installato) oppure un servizio a pagamento con la chiave in `.env` (pochi centesimi a reel).

## Prossimo passo

Fase 3, il regista: dal testo incollato al piano di regia (`piano.json`) e alle scene, senza un agente esterno.
Prima scelta da fare lì: quale modello scrive il piano (uno locale sul Mac, o uno a pagamento con la chiave in
`.env`). È una spesa o un'installazione: va chiesta.
