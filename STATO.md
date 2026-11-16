# Stato dei lavori

Incarico: `BRIEF_AGENTE.md`. Difetti: `BUG.md`. Aggiornato il 16/11/2026.

| Fase | Stato | Controllo |
|---|---|---|
| 0 · Diagnosi | **chiusa** (un punto da confermare sul Mac, vedi sotto) | prove veloci, collaudo e prove lente verdi; nessun difetto grave aperto |
| 1 · Il metro | **ferma: mancano i tre video di riferimento** in `riferimenti/` | — |
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
| `npm test` | 58 prove (17 motore, 21 libreria, 20 difetti), 8,7 s |
| `npm run collaudo` | tutto a posto, 12 s |
| `npm run prove:lente` | 6 prove superate, 5 min 18 s (pannello dal telefono, 7 modelli, render fermato, durata, fonti, collaudo) |
| Render `reta-ginocchio` (114,7 s, 3.441 fotogrammi, 1080×1920) | 12 min 36 s con 1 pezzo: 4,6 fotogrammi al secondo; processore usato per il 60% |
| Stesso computer, 2 pezzi in parallelo (reel di 17 s) | 5,8 fotogrammi al secondo |
| Tagli netti in `reta-ginocchio.mp4` (ffmpeg `scene` > 0,3) | 0 |
| Verifica `reta-ginocchio` | 271 fotogrammi senza errori; video uguale alle scene entro lo 0,8% |
| Volume: voce nel video finale | −14,0 LUFS (il riferimento 1 è a −17,7: fase 4) |
| Volume: reel con soli effetti sonori | −24,0 LUFS |
| Scene scritte a mano nei due reel (`npm run riuso`) | 16 su 16 |
| Cartella di lavoro `.fmlab/` dopo una sessione, prima della correzione | 199 MB |
| Durata con voce finta: 60 parole, 20 s chiesti | velocità tra 1,05 e 1,4, video entro 5 s, voce e tempi allineati |

## Cosa non è stato possibile provare

- **`npm install` da zero su questo computer:** la rete verso il registro dei pacchetti era chiusa. Le prove sono
  girate con gli stessi pacchetti alle stesse versioni di `package.json` (d3 7.9.0, esbuild 0.28.2,
  playwright-core 1.63.0, react e react-dom 19.2.8, react-icons 5.7.0, roughjs 4.6.6), già presenti sul computer.
  L'installazione da zero la fa la CI su GitHub a ogni invio. **Da rifare una volta sul Mac:**
  `git pull && npm install && npm test && npm run collaudo && npm run prove:lente`.
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

## Prossimo passo

Fase 1, il metro (`npm run confronta`). **Servono i tre mp4 in `riferimenti/`**: senza, le soglie non si possono
misurare. Nell'attesa non si comincia la fase 2.
