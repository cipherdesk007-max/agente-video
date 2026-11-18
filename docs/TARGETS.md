# Contro i riferimenti: i numeri

> **Prima di leggere.** Le colonne `reta-testo` e `mots-c` non si possono rifare dal repository: vengono da due video
> locali misurati il 18/11/2026, fatti con i tempi stimati e senza voce, che non stanno in Git. Le colonne
> Riferimenti e Soglia invece stanno in `riferimenti/misure.json` e le controlla la prova B35.

Le misure sono quelle del metro del kit (`npm run confronta`, versione 2). Niente voti: valori.

- **Riferimenti**: i tre video in `riferimenti/` (54,03, 51,93, 55,33 secondi), misurati una volta e scritti in
  `riferimenti/misure.json`. La colonna dice il valore più basso e il più alto dei tre.
- **Soglia**: quella che il kit ricava dai riferimenti, con il 15% di margine oltre il più permissivo.
- **Reel del kit**: `reta-testo` (107,9 secondi) e `mots-c` (83,73 secondi). Per rifare le due
  colonne: `npm run render <reel>` e poi `npm run confronta <reel>`.

| Misura | Riferimenti | Soglia | reta-testo | mots-c | Perché questa differenza |
|---|---|---|---|---|---|
| Tagli netti | 0 | al massimo 0 | 0 | 0 | Uguale. Nei riferimenti e nel kit il reel è una ripresa sola: le scene cambiano con un movimento, non con un taglio. |
| Secondi tra due novità (mediana) | da 1,5 a 1,75 s | al massimo 2,013 | 1,63 | 1,7 | Dentro l'intervallo dei riferimenti. |
| Secondi tra due novità (9 volte su 10 meno di) | da 2,65 a 3,62 s | al massimo 4,163 | 2,65 | 2,67 | Dentro l'intervallo dei riferimenti. `reta-testo` è uguale al riferimento più rapido. |
| Attesa più lunga senza novità | da 3,63 a 6,97 s | al massimo 8,015 | 3,17 | 3,87 | `mots-c` è dentro. `reta-testo` aspetta meno del riferimento più rapido: `npm run piano` avvisa a ogni tratto oltre 3,5 secondi senza novità. |
| Palco occupato (media) | da 0,424 a 0,563 | almeno 0,36 | 0,565 | 0,552 | `mots-c` è dentro. `reta-testo` sta 0,002 sopra il riferimento più pieno. |
| Palco occupato (nei momenti più vuoti) | da 0,143 a 0,379 | almeno 0,122 | 0,438 | 0,429 | Scelta di stile: nel kit un soggetto solo sta in mezzo al palco ed è largo 800 pixel, quindi anche i momenti più vuoti sono più pieni di quelli dei riferimenti. |
| Dettaglio del disegno sul palco | da 5,18 a 7,43 % | almeno 4,403 | 6,84 | 6,3 | Dentro l'intervallo dei riferimenti. |
| Movimento sul palco | da 3,51 a 4,95 % | almeno 2,984 | 4,37 | 4,29 | Dentro l'intervallo dei riferimenti. Era la misura da chiudere: prima che un soggetto solo prendesse il centro del palco i due reel stavano a 3,32 e 2,86. |
| Tempo con il palco fermo | da 0,2 a 6,4 % | al massimo 7,36 | 0,1 | 0,1 | Il palco del kit non si ferma: bagliore, scintille e riflesso dei soggetti restano in moto. Un riferimento su tre sta fermo il 6,4% del tempo. |
| Fermo più lungo | da 0,1 a 1,53 s | al massimo 1,76 | 0,1 | 0,1 | Stesso motivo: nel kit il fermo più lungo è di un decimo di secondo. |
| Luminosità media (fondo scuro) | da 0,15 a 0,194 | da 0,128 a 0,223 | 0,184 | 0,187 | Dentro l'intervallo dei riferimenti. Fondo scuro; i soggetti grandi la portano vicino al riferimento più chiaro. |
| Tinte diverse lungo il video | da 3 a 4 | almeno 2,55 | 3 | 4 | Dentro l'intervallo dei riferimenti. In `mots-c` erano due: nelle scene `sangue` e `cyclette`, che hanno una tinta loro, il primo soggetto ha preso quel colore. |
| Sottotitoli: altezza sul fotogramma | da 0,189 a 0,19 | da 0,161 a 0,219 | 0,189 | 0,189 | Uguale ai riferimenti: i sottotitoli sono stati abbassati di 3 pixel (erano a 0,188). |
| Sottotitoli: altezza delle lettere | da 0,0257 a 0,0279 | da 0,022 a 0,032 | 0,0279 | 0,0279 | Uguale al riferimento con le lettere più grandi. |
| Sottotitoli: parole a schermo insieme (media) | da 2,65 a 3,17 | da 2,253 a 3,645 | 2,9 | 2,83 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: parole a schermo insieme (massimo) | da 5 a 6 | al massimo 6,9 | 5 | 5 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: tempo con altro nella loro fascia | da 23,2 a 45 % | al massimo 51,75 | 29 | 25,9 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: contrasto nei momenti peggiori | da 3,5 a 5,2 :1 | almeno 2,975 | 5,6 | 5,8 | Il kit sta sopra tutti e tre i riferimenti. |
| Parole al minuto (contate dai sottotitoli) | da 172 a 223 | da 146,2 a 256,45 | 182 | 158 | `reta-testo` è dentro. `mots-c` sta sotto il riferimento più lento e dentro la soglia: i tempi sono stimati, va rimisurato con la voce vera. |
| Ritardo dei sottotitoli sulla voce | da -0,09 a -0,07 s | da -0,14 a -0,02 | non misurata | non misurata | Non misurabile: i due video non hanno la voce. |
| Narratore: pose diverse | da 6 a 10 | almeno 5,1 | 6 | 7 | Dentro l'intervallo dei riferimenti. |
| Narratore: cambi di posa al minuto | da 41,1 a 54,3 | almeno 34,935 | 47,3 | 55,9 | `reta-testo` è dentro. Da chiudere: `mots-c` cambia 1,6 volte al minuto in più del riferimento più alto (ha più segni al minuto, e a ogni segno il narratore fa un gesto). |
| Narratore: secondi nella stessa posa (mediana) | da 1 a 1,4 s | al massimo 1,61 | 1,3 | 0,9 | `reta-testo` è dentro. Da chiudere: `mots-c` tiene le pose 0,1 s in meno del riferimento più rapido, per lo stesso motivo. |
| Narratore: posa tenuta più a lungo | da 2,6 a 2,9 s | al massimo 3,335 | 2,9 | 2,7 | Dentro l'intervallo dei riferimenti. |
| Volume | da -14,6 a -14,4 LUFS | da -16,79 a -12,24 | non misurata | non misurata | Non misurabile senza voce. |
| Escursione del volume | da 1,5 a 2,6 LU | al massimo 2,99 | non misurata | non misurata | Non misurabile senza voce. |
| Fondo sotto la voce (meno = più musica) | da 10,2 a 12,1 LU | al massimo 13,915 | non misurata | non misurata | Non misurabile senza voce e senza musica. |
| Effetti: colpi acuti al minuto | da 20,6 a 43,3 | almeno 17,51 | non misurata | non misurata | Non misurabile senza voce. |

## In breve

- `reta-testo`: 23 misure dentro le soglie, 0 fuori, 5 non misurabili senza voce.
- `mots-c`: 23 misure dentro le soglie, 0 fuori, 5 non misurabili senza voce.

## Cosa resta da chiudere

1. **Il narratore in `mots-c`.** Cambia posa 55,9 volte al minuto e la tiene 0,9 secondi di mediana: dentro le soglie,
   fuori dall'intervallo dei riferimenti. Va rimisurato con la voce vera, che sposta i segni.
2. **Le parole al minuto di `mots-c`** (158 contro 172-223) e **le cinque misure dell'audio**: si possono scrivere
   solo dopo un video con la voce vera.
3. **Quello che il metro non misura.** Nel foglio affiancato (`npm run affianca <reel>`) i riferimenti mostrano scene
   disegnate con il loro ambiente (uno stadio, un laboratorio, una fibra muscolare); il kit mostra soggetti a
   contorno luminoso su fondo scuro. Le misure sono dentro, il disegno non è lo stesso.
