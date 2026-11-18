# Un piano spiegato: `reels/reta-testo`

Un piano scena per scena, con il perché di ogni pezzo e di ogni segno. Nel kit i reel con un piano sono due,
`reta-testo` e `mots-c`, tutti e due senza avvisi e con rischio cartelli 0 su 100: questo è quello con più scene e
più segni (13 e 55, contro 11 e 50).
Il file è `reels/reta-testo/piano.json`; il testo è quello dato dalla persona (`testo.txt`), parola per parola.

## I numeri del piano

Li dà `npm run piano reta-testo` (i tempi sono quelli di `parole.json`, stimati: la voce vera non è stata generata).

| Cosa | Valore |
|---|---|
| Scene | 13 |
| Parole | 284 |
| Segni | 55 |
| Durata stimata | 107,9 secondi: un segno ogni 2,0 secondi in media |
| Rischio cartelli | 0 su 100 (basso) |
| Scene con soggetti illustrati | 12 su 13 (l'ultima è il regalo) |
| Effetti sonori | 6: `pop`, `ding` due volte, `errore`, `successo`, `whoosh` |

Tre scelte tengono insieme tutto il piano:

- **Una cosa che torna.** Le due ginocchia, Reta e Placebo, aprono il reel e tornano in `misura` e in `conclusione`.
  Chi guarda impara a leggerle una volta sola.
- **Lo stesso strumento per lo stesso tipo di cosa.** Il quadrante spiega la scala in `scala` e porta i numeri in
  `risultati`. Il foglio è lo studio in `studi` e in `azienda`. Il `ding` suona solo sui due numeri.
- **Nessuna inquadratura uguale a quella prima.** Ogni scena cambia campo o movimento di camera rispetto alla
  precedente.

## Scena per scena

### 1 · aggancio

- **Pezzo:** due ginocchia affiancate, `Reta` e `Placebo`.
- **Segni:** `Reta` (la prima si accende), `ginocchio` (entra la seconda), `placebo` (la seconda si muove),
  `meno dolore` (calano tutte e due).
- **Perché:** la notizia della frase è che cala anche il placebo. Le due ginocchia calano sulla stessa parola, e la
  sorpresa si vede senza leggere niente. Quattro segni perché la frase è lunga venti parole.

### 2 · domanda

- **Pezzo:** tre icone grandi con il titolo "Quanto è merito della Reta?".
- **Segni:** `quanto` (il punto interrogativo), `merito` (la siringa), `Vediamo` (la lente).
- **Perché:** è la promessa del reel, e va fissata. Tre icone, una per parola, invece di una frase ferma. La lente
  entra su "Vediamo" e apre la scena dopo. La camera va indietro e il campo si allarga: l'opposto dell'aggancio.

### 3 · studi

- **Pezzo:** il foglio dello studio, l'icona delle persone con "1.019 adulti", un ginocchio con "Artrosi".
- **Segni:** `pubblicati` (entra il foglio), `due`, `riviste`, `mondo` (la riga evidenziata cresce), `mille` (entrano
  le persone, con il `pop`), `artrosi` (entra il ginocchio), `anno` (le persone si accendono del tutto).
- **Perché:** sono due frasi e trentuno parole di prova: sette segni, il numero più alto del piano, perché qui il
  rischio di fermarsi è più alto. Il numero a schermo arriva sulla parola "mille".

### 4 · scala

- **Pezzo:** un quadrante solo, "Dolore, da 0 a 10".
- **Segni:** `scala` (la lancetta sale a 5), il secondo `dieci` (la lancetta arriva a 10).
- **Perché:** prima dei numeri si spiega il metro. La lancetta tocca il fondo scala sul secondo "dieci", quello di
  "dieci indicava il dolore più forte": per questo il segno ha `"volta": 2`. Campo stretto: c'è una cosa sola.

### 5 · risultati

- **Pezzo:** due quadranti, `Reta` e `Placebo`, tutti e due fermi a 6.
- **Segni:** `quattro` (la Reta scende a 2,04, con il `ding`), `placebo` (entra il secondo), `attivo` (comincia a
  scendere), `due` (arriva a 3,88, con il `ding`).
- **Perché:** il numero arriva quando la voce lo dice. Lo strumento è quello della scena prima, quindi si legge
  subito. Le note "−3,96 punti" e "−2,12 punti" sono i valori di `fonti.md`; lo stesso suono segna i due numeri.

### 6 · applauso

- **Pezzo:** i riflettori di un palco, "Effetto placebo".
- **Segni:** `pubblico` (le luci si accendono), `band` (si abbassano), `aspettarsi` (tornano su), `sollievo` (si
  fermano a metà).
- **Perché:** l'effetto placebo non si vede, e il testo offre già la metafora. Un soggetto solo che cambia stato
  quattro volte in trentuno parole. La camera gira intorno al palco: è l'unica scena con questo movimento.

### 7 · differenza

- **Pezzo:** due batterie, `Placebo` e `Reta`.
- **Segni:** `capire` (entra il placebo), `Reta` (il placebo si riempie a 0,53), `differenza` (entra la Reta, già a
  0,53), `studi` (sale a 0,76), `uno` (sale a 0,99), `rispetto` (il placebo si spegne).
- **Perché:** quello che conta è lo scarto. La batteria della Reta parte dal livello del placebo, e quello che si
  aggiunge sotto gli occhi è la differenza. Il placebo si spegne su "rispetto" e lascia l'occhio sullo scarto.
  I livelli sono i punti divisi per quattro: 2,12 e 3,96.

### 8 · misura

- **Pezzo:** le due ginocchia dell'aggancio, con il titolo "Non è un miracolo. Non è un caso.".
- **Segni:** `miracolo` (la Reta cala, ma si ferma a 0,45), `ma` (entra il placebo), `caso` (il placebo cala a 0,72).
- **Perché:** è la frase che dà la misura, in tredici parole. Il ginocchio con la Reta migliora e non guarisce: lo
  stato non arriva a zero. Tornano le ginocchia dell'inizio, e il campo stretto le porta vicino.

### 9 · rischi

- **Pezzo:** lo stomaco, "Effetti collaterali gravi", con la tinta rossa.
- **Segni:** `altro` (entra), `autori`, `effetti`, `frequenti`, `gastrointestinali` (si irrita un passo alla volta).
- **Perché:** qui il tono cambia, ed è l'unica scena con una tinta sua. Il soggetto è l'organo che il testo nomina.
  Il suono `errore` cade su "gravi" e non torna altrove. La camera scende.

### 10 · conclusione

- **Pezzo:** le due ginocchia, per la terza volta.
- **Segni:** `due` (entra la Reta), `dimostrato` (entra il placebo), `riduce` (la Reta cala a 0,2), `più` (il placebo
  si ferma a 0,5, con il `successo`).
- **Perché:** la stessa immagine dell'aggancio, adesso con la risposta: la Reta finisce più in basso del placebo.
  Il verbo "riduce" muove il ginocchio.

### 11 · azienda

- **Pezzo:** il foglio dello studio, "Coinvolta l'azienda", e la lente.
- **Segni:** `condotti`, `azienda`, `risultati` (la riga evidenziata cresce), `dettagli` (entra la lente).
- **Perché:** chi ha pagato gli studi è scritto nello studio: torna il foglio di `studi`, con un'altra riga accesa.
  La lente è quella della domanda.

### 12 · amico

- **Pezzo:** un ginocchio, "A quell'amico", e le scale.
- **Segni:** `Manda` (entra il ginocchio), `amico`, `scricchiolano` (il dolore sale), `volta` (entrano le scale),
  `scale` (si salgono).
- **Perché:** l'invito a mandare il video mostra la cosa detta, un ginocchio sulle scale, e non una scritta
  "condividi".

### 13 · chiusura

- **Pezzo:** il regalo sul tablet (`ebook`, la mappa).
- **Segni:** `Commenta` (entra il tablet, con il `whoosh`), `gratis`, `database` (le due scritte), `essenziali` (il
  tablet gira).
- **Perché:** l'invito a commentare sta alla fine, per esteso, con la parola da scrivere e il regalo in mano.
  Quattro segni tengono viva anche l'ultima frase.

## Cosa non è a posto

Lo dice `npm run giudica reta-testo`: 5 righe a posto, 2 da sistemare, 1 senza giudizio (non c'è una durata chiesta).

- La prima frase ha 20 parole: la pagella ne chiede meno di 12. Il testo è della persona e non si tocca; il piano
  risponde con quattro segni dentro quella frase.
- Gli inviti sono due ("Manda questo video…" e "Commenta…"): la pagella ne chiede uno. Anche questo è nel testo.
- I tempi sono stimati. Con la voce vera i segni restano sulle loro parole, ma la durata cambia.
