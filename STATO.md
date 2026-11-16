# Stato dei lavori

Incarico: `BRIEF_AGENTE.md`. Difetti: `BUG.md`. Aggiornato il 16/11/2026.

| Fase | Stato | Controllo |
|---|---|---|
| 0 · Diagnosi | **chiusa** (un punto da confermare sul Mac, vedi sotto) | prove veloci, collaudo e prove lente verdi; nessun difetto grave aperto |
| 1 · Il metro | **chiusa** | `npm run confronta` dà gli stessi numeri due volte; le soglie stanno in `riferimenti/misure.json` |
| 2 · Motore delle scene | da fare | — |
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

## Da decidere (Francesco)

1. **Voce vera per misurare un reel del kit** (volume, musica, anticipo dei sottotitoli, parole al minuto): serve
   generare la voce di un reel. Gratis con la voce del Mac; con ElevenLabs circa un credito per carattere
   (`reta-ginocchio`: circa 1.900 caratteri).
2. **Riconoscitore della voce sul Mac**, per il controllo "parole pronunciate = testo dato": un programma gratuito
   da installare una volta, che il kit chiamerebbe da solo. Senza, quel controllo resta fatto sul copione e non
   sull'audio.

## Prossimo passo

Fase 2, il motore delle scene illustrate. Il primo numero da muovere è il palco fermo (57% → sotto il 7%), poi i
secondi tra due novità (2,7 → sotto 2,0). Controllo di fase: `reta-ginocchio` rifatto con il motore nuovo dentro le
soglie su tagli, novità e palco, con il tempo di render misurato.
