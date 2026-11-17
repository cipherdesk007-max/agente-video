# Contro i riferimenti: i numeri

Le misure sono quelle del metro del kit (`npm run confronta`, versione 2). Niente voti: valori.

- **Riferimenti**: i tre video in `riferimenti/` (54,03, 51,93, 55,33 secondi), misurati una volta e scritti in
  `riferimenti/misure.json`. La colonna dice il valore più basso e il più alto dei tre.
- **Soglia**: quella che il kit ricava dai riferimenti, con il 15% di margine oltre il più permissivo.
- **Reel del kit**: `reta-testo` (112,37 secondi) e `mots-c` (83,73 secondi), misurati il 17/11/2026 con
  `npm run confronta <reel>` sui video che c'erano: tempi stimati, senza voce. Quello di `reta-testo` è precedente all'ultimo ricalcolo dei
  tempi (oggi la stima è 107,9 secondi). I video non stanno nel repository: per rifare le due colonne si rifà il
  video (`npm run fai <reel>`) e si rilancia il comando.

| Misura | Riferimenti | Soglia | reta-testo | mots-c | Perché questa differenza |
|---|---|---|---|---|---|
| Tagli netti | 0 | al massimo 0 | 0 | 0 | Uguale. Nei riferimenti e nel kit il reel è una ripresa sola: le scene cambiano con un movimento, non con un taglio. |
| Secondi tra due novità (mediana) | da 1,5 a 1,75 s | al massimo 2,013 | 1,77 | 1,4 | Scelta di stile comune: una novità ogni due secondi circa. `reta-testo` sta 0,02 s sopra il riferimento più lento e dentro la soglia. |
| Secondi tra due novità (9 volte su 10 meno di) | da 2,65 a 3,62 s | al massimo 4,163 | 2,57 | 2,6 | Il kit sta sotto il riferimento più rapido: `npm run piano` avvisa a ogni tratto oltre 3,5 secondi senza novità. |
| Attesa più lunga senza novità | da 3,63 a 6,97 s | al massimo 8,015 | 3,57 | 3,87 | Stesso motivo. Due riferimenti su tre hanno un'attesa oltre i 6 secondi; i due reel del kit restano sotto i 4. |
| Palco occupato (media) | da 0,424 a 0,563 | almeno 0,36 | 0,507 | 0,443 | Dentro l'intervallo dei riferimenti. |
| Palco occupato (nei momenti più vuoti) | da 0,143 a 0,379 | almeno 0,122 | 0,286 | 0,25 | Dentro l'intervallo dei riferimenti. |
| Dettaglio del disegno sul palco | da 5,18 a 7,43 % | almeno 4,403 | 6,06 | 5,09 | `reta-testo` è dentro. Da chiudere: `mots-c` sta 0,09 sotto il riferimento più basso (resta sopra la soglia). |
| Movimento sul palco | da 3,51 a 4,95 % | almeno 2,984 | 3,32 | 2,86 | Da chiudere. Tutti e due i reel del kit stanno sotto il riferimento più basso: `reta-testo` è dentro la soglia per 0,34, `mots-c` è fuori per 0,12. |
| Tempo con il palco fermo | da 0,2 a 6,4 % | al massimo 7,36 | 0,1 | 0,1 | Il palco del kit non si ferma: bagliore, scintille e riflesso dei soggetti restano in moto. Un riferimento su tre sta fermo il 6,4% del tempo. |
| Fermo più lungo | da 0,1 a 1,53 s | al massimo 1,76 | 0,1 | 0,1 | Stesso motivo: nel kit il fermo più lungo è di un decimo di secondo. |
| Luminosità media (fondo scuro) | da 0,15 a 0,194 | da 0,128 a 0,223 | 0,166 | 0,162 | Dentro l'intervallo dei riferimenti: fondo scuro. |
| Tinte diverse lungo il video | da 3 a 4 | almeno 2,55 | 4 | 2 | Da chiudere in `mots-c`: due tinte sole (verde acqua 69%, azzurro 21%), fuori soglia. `reta-testo` ne ha quattro, e una sua scena (`rischi`) ha una tinta propria. |
| Sottotitoli: altezza sul fotogramma | da 0,189 a 0,19 | da 0,161 a 0,219 | 0,188 | 0,188 | Scelta di stile presa dai riferimenti: sottotitoli in alto, alla stessa altezza. |
| Sottotitoli: altezza delle lettere | da 0,0257 a 0,0279 | da 0,022 a 0,032 | 0,0279 | 0,0279 | Uguale al riferimento con le lettere più grandi. |
| Sottotitoli: parole a schermo insieme (media) | da 2,65 a 3,17 | da 2,253 a 3,645 | 2,95 | 2,85 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: parole a schermo insieme (massimo) | da 5 a 6 | al massimo 6,9 | 5 | 6 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: tempo con altro nella loro fascia | da 23,2 a 45 % | al massimo 51,75 | 32,8 | 25 | Dentro l'intervallo dei riferimenti. |
| Sottotitoli: contrasto nei momenti peggiori | da 3,5 a 5,2 :1 | almeno 2,975 | 5,8 | 5,8 | Il kit sta sopra tutti e tre i riferimenti. |
| Parole al minuto (contate dai sottotitoli) | da 172 a 223 | da 146,2 a 256,45 | 176 | 147 | Da rimisurare con la voce vera: i due video hanno tempi stimati. `mots-c` sta sotto il riferimento più lento e 0,8 sopra la soglia. |
| Ritardo dei sottotitoli sulla voce | da -0,09 a -0,07 s | da -0,14 a -0,02 | non misurata | non misurata | Non misurabile: i due video non hanno la voce. |
| Narratore: pose diverse | da 6 a 10 | almeno 5,1 | 7 | 7 | Dentro l'intervallo dei riferimenti. |
| Narratore: cambi di posa al minuto | da 41,1 a 54,3 | almeno 34,935 | 49,6 | 55,9 | `reta-testo` è dentro. `mots-c` cambia posa 1,6 volte al minuto in più del riferimento più alto. |
| Narratore: secondi nella stessa posa (mediana) | da 1 a 1,4 s | al massimo 1,61 | 1,25 | 0,9 | `reta-testo` è dentro; `mots-c` tiene le pose 0,1 s in meno del riferimento più rapido. |
| Narratore: posa tenuta più a lungo | da 2,6 a 2,9 s | al massimo 3,335 | 3 | 2,7 | Da chiudere in `reta-testo`: una posa dura 0,1 s più del riferimento più lungo (comincia al secondo 70,9). È dentro la soglia. |
| Volume | da -14,6 a -14,4 LUFS | da -16,79 a -12,24 | non misurata | non misurata | Non misurabile senza voce. |
| Escursione del volume | da 1,5 a 2,6 LU | al massimo 2,99 | non misurata | non misurata | Non misurabile senza voce. |
| Fondo sotto la voce (meno = più musica) | da 10,2 a 12,1 LU | al massimo 13,915 | non misurata | non misurata | Non misurabile senza voce e senza musica. |
| Effetti: colpi acuti al minuto | da 20,6 a 43,3 | almeno 17,51 | non misurata | non misurata | Non misurabile senza voce. |

## In breve

- `reta-testo`: 23 misure dentro le soglie, 0 fuori, 5 non misurabili senza voce.
- `mots-c`: 21 dentro, 2 fuori (movimento sul palco, tinte diverse), 5 non misurabili senza voce.

## Cosa resta da chiudere

1. **Movimento sul palco.** È l'unica misura in cui tutti e due i reel del kit stanno sotto tutti e tre i riferimenti.
2. **Tinte in `mots-c`.** Due sole, contro le tre o quattro dei riferimenti.
3. **Le cinque misure dell'audio.** Si possono scrivere solo dopo un video con la voce vera.
