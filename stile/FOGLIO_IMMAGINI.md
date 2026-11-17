# Foglio di stile delle illustrazioni

Scritto guardando i tre video di riferimento (`npm run affianca`), fotogramma per fotogramma. È la descrizione che
ogni immagine generata riceve insieme al suo soggetto: sta in `stile/immagini.json` (campo `stile`), e un reel può
averne una sua in `reels/<reel>/immagini.json`. Cambiare una parola qui cambia l'impronta di tutte le immagini:
quelle già in biblioteca restano, le nuove si rigenerano.

## Cosa si vede nei riferimenti

| | Nei riferimenti | Nel prompt |
|---|---|---|
| **Luce** | Il soggetto è illuminato da dentro e dal bordo, nel suo colore. Nessuna luce di studio, nessuna ombra a terra. Attorno ha un alone morbido. La parte che conta (l'articolazione, la lancetta, la riga del foglio) è la più luminosa. | "luce che viene da dentro e dal bordo, nessuna ombra; il punto che conta è la parte più luminosa" |
| **Volumi** | Forme semplici e arrotondate, semitrasparenti come vetro satinato, con un contorno netto. Da tre a sei parti grandi, nessun dettaglio fine. Vista di fronte, soggetto intero, spesso simmetrico. | "forme semplici e arrotondate, semitrasparenti come vetro satinato, contorno netto e luminoso; vista frontale, poche parti grandi" |
| **Palette** | Fondo quasi nero che tira al verde petrolio (misurato: da `#081010` a `#182020`). Un colore per ruolo e sempre quello: verde lime (tinta attorno a 105°) per il soggetto buono, grigio-bianco per il confronto, rosso per dolore e rischio, ambra (30-45°) per l'attenzione. | "verde lime acceso per il soggetto buono, grigio-bianco per il confronto, rosso per dolore e rischio, ambra per l'attenzione" |
| **Scritte** | Dentro le illustrazioni non c'è testo. Le etichette sono pillole messe sopra dal montaggio. | "nessuna scritta, nessun numero, nessun logo" |
| **Quanto riempie** | Un soggetto solo occupa circa tre quarti della larghezza del palco; due, metà ciascuno. | lo decide il kit (`bloccoSoggetti`), non il prompt |

## Cosa non chiedere mai

Fotorealismo, texture, persone riconoscibili, sfondi, ombre, più soggetti nella stessa immagine, prospettive forti,
scritte. Ogni immagine è **un soggetto solo su fondo pieno**: il fondo lo toglie il kit.

## Il fondo da togliere è magenta, non verde

I soggetti buoni dei riferimenti sono verdi. Con il fondo verde il ritaglio mangerebbe il soggetto: per questo
`stile/immagini.json` chiede `"fondo": "magenta"`. Il ritaglio su magenta non è mai stato provato con un'immagine
vera: alla prima va guardato il bordo del soggetto (se resta un filo rosa si alza la tolleranza in `motore/immagini.mjs`).

## Una differenza da decidere

Il colore di luce del kit (`stile.colori.luce`, `#5CF2C8`) è un verde acqua, tinta attorno a 160°. Quello dei
riferimenti è un verde lime, attorno a 105°. Nel foglio affiancato si vede: il kit è più freddo. Cambiarlo è una
riga in `stile/stile.ts`, ma è il colore della pagina: decide Francesco.
