# Fonti · Come fa il GPS a sapere dove sei

Ogni numero e ogni affermazione del copione ha una riga qui. Controllate il 15 novembre 2026.

| # | Affermazione nel copione | Fonte | Cosa dice la fonte (parole mie) |
|---|---|---|---|
| 1 | I satelliti GPS non sanno dove sei; il telefono non manda niente, ascolta e basta | GPS.gov, panoramica del sistema — https://www.gps.gov/gps | I satelliti trasmettono segnali a senso unico; è il ricevitore che, ascoltandoli, calcola posizione e ora. |
| 2 | A ventimila chilometri | U.S. Space Force, aggiornamento sullo stato del GPS (aprile 2026) — https://www.gps.gov/sites/default/files/2026-04/Mediate%2020260421_CGSIC%20MD%2031_FINAL.pdf | Quota dell'orbita: 20.200 km, su 6 piani orbitali inclinati di 55°. |
| 3 | Più di trenta satelliti | Stesso documento (aprile 2026) e GPS.gov, segmento spaziale — https://www.gps.gov/systems/gps/space | Ne servono 24 in servizio; in aprile 2026 la costellazione ne contava 32. Da oltre dieci anni ne volano 31 operativi. |
| 4 | Ognuno ripete dove si trova e che ore sono | GPS.gov — https://www.gps.gov/gps | Il segnale di ogni satellite contiene la sua posizione e la sua ora. |
| 5 | Il segnale arriva in circa settanta millesimi di secondo | Calcolo (vedi sotto) dai dati della riga 2 | — |
| 6 | Dal ritardo il telefono calcola la distanza | ESA, "How does it work?" — https://m.esa.int/Applications/Satellite_navigation/How_does_it_work | Il ricevitore misura il tempo di viaggio dei segnali e ne ricava le distanze dai satelliti. |
| 7 | Il quarto satellite corregge l'orologio del telefono | ESA (stessa pagina) e National Academies — https://nap.nationalacademies.org/read/9479/chapter/5 | Il quarto satellite serve a sincronizzare l'orologio del ricevitore; così al ricevitore basta un normale orologio al quarzo. |
| 8 | Lassù il tempo scorre più veloce, di trentotto milionesimi di secondo al giorno | R. Pogge, Ohio State University — https://www.astronomy.ohio-state.edu/pogge.1/Ast162/Unit5/gps | Per la relatività generale gli orologi in orbita guadagnano 45 microsecondi al giorno, per quella ristretta ne perdono 7: il saldo è +38. |
| 9 | Circa dieci chilometri di errore al giorno | Stessa pagina di Pogge, più il calcolo qui sotto | Senza correzione gli errori di posizione crescerebbero di circa 10 km al giorno. |
| 10 | Gli orologi dei satelliti sono corretti con le formule di Einstein | Stessa pagina di Pogge | Per far funzionare il sistema bisogna tenere conto di relatività ristretta e generale. |

## Calcoli

- **Tempo di viaggio del segnale.** 20.200 km ÷ 299.792 km/s = 0,067 s con il satellite proprio sopra la testa.
  Con il satellite basso sull'orizzonte la distanza sale a circa 25.800 km, cioè 0,086 s. "Circa settanta millesimi" sta in mezzo.
  La velocità della luce (299.792,458 km/s) è un valore esatto, fissato dalla definizione del metro.
- **Dieci chilometri al giorno.** 38 milionesimi di secondo × 299.792 km/s = 11,4 km. Il copione dice "circa dieci", come la fonte.
- **Numeri arrotondati a schermo.** "≈ 20.000 km" è la quota di 20.200 km (riga 2) arrotondata, come la dice la voce
  ("ventimila"). "0,07 s" è 0,067 s arrotondato a due decimali. "OLTRE 30": i satelliti in orbita sono 31-32 (riga 3).

## Sfumature lasciate fuori dal copione

- "Ti mette su un cerchio": la distanza da un satellite ti mette su una sfera; quella sfera taglia la superficie
  della Terra lungo un cerchio.
- "Tre cerchi si incrociano in un punto solo": tre sfere si incontrano in due punti, ma solo uno sta sulla Terra.
- I dieci chilometri sono l'errore che si accumulerebbe sulle distanze misurate. Alcuni fisici fanno notare che un
  ricevitore reale ne assorbirebbe una parte quando corregge il proprio orologio: il numero resta quello della fonte,
  ma va detto come "errore al giorno", non come "la mappa sbaglia di dieci chilometri esatti".
- "Più di trenta": il numero cambia quando un satellite viene lanciato o ritirato. Il minimo garantito è 24.
