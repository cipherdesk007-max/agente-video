# Catalogo

Tutto quello che è già pronto, con il nome da scrivere e come si usa. La stessa lista, disegnata, è in
`catalogo.jpg` (si rifà con `npm run catalogo`; si vede anche nel pannello, scheda "Catalogo e prompt").

Tutto si importa da `'../../libreria'`. Le icone da `'react-icons/<raccolta>'`.

Regole comuni:

- ogni testo è una scritta (`'ciao'`) oppure una per lingua (`{it: 'ciao', en: 'hi'}`);
- `segno` è il nome di un `[segno]` del copione: la cosa compare su quella parola. Può essere anche un numero
  (secondi dall'inizio della scena) o mancare (gli elementi si distribuiscono da soli);
- le misure sono in pixel del video (1080 x 1920); il palco va da y = 470 a y = 1320, centro (540, 880).

## Scene pronte (25)

Una scena intera in una riga, dentro `definisciReel({scene: {nome: blocco…({…})}})`.

| Nome | Cosa mostra | Cosa gli dai |
|---|---|---|
| `bloccoTitolo` | una frase grande: l'aggancio | `titolo`, `sopra?`, `sotto?`, `segno?` |
| `bloccoNumero` | un numero che sale, con l'unità | `valore`, `unita?`, `decimali?`, `prefisso?`, `suffisso?`, `segno?`, `nota?`, `sottoNota?`, `segnoNota?`, `fonte?` |
| `bloccoLista` | fino a 5 voci, una alla volta | `voci: [{testo, segno?}]`, `titolo?` |
| `bloccoConfronto` | A contro B, con i numeri | `sinistra` e `destra`: `{titolo, valore, unita?, segno?}`, `titolo?`, `fonte?` |
| `bloccoBarre` | colonne (in 3D sono solidi) | `dati: [{etichetta, valore, segno?}]` (max 6), `titolo?`, `unita?`, `decimali?`, `fonte?` |
| `bloccoAnello` | una percentuale che si riempie | `valore` (0-100), `etichetta?`, `segno?`, `fonte?` |
| `bloccoPassi` | i passi di un procedimento | `passi: [{testo, segno?}]` (max 5), `titolo?` |
| `bloccoMito` | mito e realtà | `mito`, `verita`, `segnoMito?`, `segnoVerita?`, `fonte?` |
| `bloccoOggetto` | un oggetto 3D che gira, con le etichette | `oggetti: () => fiala3d()`, `etichette: [{testo, punto: [x, y, z], segno?}]`, `titolo?`, `zoom?`, `fonte?` |
| `bloccoChiusura` | l'invito finale | `parola`, `sopra?`, `sotto?`, `segno?` |
| `bloccoLinea` | una linea nel tempo, con il valore in testa | `punti: [{etichetta?, valore}]`, `titolo?`, `unita?`, `decimali?`, `prefisso?`, `suffisso?`, `segno?`, `durata?`, `evidenzia?`, `fonte?` |
| `bloccoTorta` | le parti di un tutto, con la legenda | `fette: [{etichetta, valore, colore?}]` (max 6), `titolo?`, `segno?`, `evidenzia?` (indice), `segnoEvidenzia?`, `fonte?` |
| `bloccoClassifica` | barre orizzontali, dalla prima | `voci: [{etichetta, valore}]` (max 6), `titolo?`, `unita?`, `decimali?`, `prefisso?`, `suffisso?`, `segno?`, `evidenzia?`, `segnoEvidenzia?`, `fonte?` |
| `bloccoIcone` | da 2 a 6 icone con il nome | `voci: [{icona, testo, segno?, colore?}]`, `titolo?` |
| `bloccoScala` | una scala graduata con i cursori | `cursori: [{etichetta, valore, da?, segno?, colore?}]` (max 3), `minimo?`, `massimo?`, `estremi?: [testo, testo]`, `verso?: 'male' \| 'bene'`, `titolo?`, `fonte?` |
| `bloccoSchede` | 2 o 3 schede con un numero, e il totale | `schede: [{sopra?, valore, unita?, sotto?, colore?, segno?}]`, `totale?: {valore, etichetta?, segno?}`, `titolo?`, `fonte?` |
| `bloccoAvviso` | il triangolo d'avviso con una frase | `titolo`, `sotto?`, `punti?: [{testo, segno?}]` (max 3), `segno?`, `fonte?` |
| `bloccoCitazione` | una frase tra virgolette | `testo`, `autore?`, `segno?` |
| `bloccoSigla` | il logo della pagina che si accende, con il nome sotto | `nome?`, `sotto?`, `segno?` |
| `bloccoEbook` | l'ebook regalo su un tablet 3D che entra girando e oscilla, con l'invito sotto | `invito?`, `sotto?`, `sopra?`, `segno?`, `gira?` |
| `bloccoDomanda` | una domanda grande con il punto interrogativo dietro: l'aggancio | `domanda`, `sopra?`, `sotto?`, `segno?` |
| `bloccoStudio` | la scheda di uno studio: rivista, titolo, dati, chi ha pagato | `rivista`, `titolo`, `dati?: [{testo, segno?}]` (max 3), `pagato?`, `segnoPagato?`, `fonte?` |
| `bloccoPersone` | "2 su 10": gli omini si accendono uno alla volta | `accese`, `quante?` (fino a 20), `etichetta?`, `titolo?`, `segno?`, `fonte?` |
| `bloccoTempo` | una linea del tempo che si disegna | `tappe: [{quando, testo?, segno?}]` (max 4), `titolo?`, `fonte?` |
| `bloccoSchermo` | uno screenshot o una registrazione dentro il telefono | `file` (nella cartella del reel) oppure `clip`, `note?: [{testo, segno?}]` (max 3), `titolo?`, `segno?` |

Esempi:

```tsx
crescita: bloccoLinea({titolo: 'Prezzo medio', unita: 'euro', punti: [{etichetta: '2020', valore: 14}, {etichetta: '2024', valore: 29}], segno: 'sale', fonte: 'Istat'}),
dolore:   bloccoScala({titolo: 'Dolore da 0 a 10', cursori: [{etichetta: 'Prima', valore: 6, segno: 'prima'}, {etichetta: 'Dopo', valore: 2, da: 6, segno: 'dopo'}], estremi: ['nessun dolore', 'il più forte']}),
cosa:     bloccoIcone({titolo: 'Cosa conta', voci: [{icona: FaHeartPulse, testo: 'Cuore', segno: 'cuore'}, {icona: FaBrain, testo: 'Testa', segno: 'testa'}]}),
```

## Oggetti 3D

Ognuno restituisce le sue facce: `<Scena3D x={540} y={880} camera={{giro: -20 + s.t * 4, alza: 14, zoom: 2}} oggetti={[...fiala3d(), ...ombra({raggio: 200})]} />`.
Tutti accettano `pos: [x, y, z]`, `ruota: [x, y, z]` (gradi) e `scala`.

| Nome | Cos'è | Opzioni sue |
|---|---|---|
| `satellite3d` | satellite con i pannelli | `corpo`, `pannello`, `acceso` |
| `telefono3d` | telefono | `schermo`, `scocca` |
| `fiala3d` | fiala con il liquido | `liquido`, `livello` (0…1), `tappo` |
| `pillola3d` | capsula a due colori | `colori: [a, b]` |
| `siringa3d` | siringa, ago in giù | `liquido`, `livello` (0…1: abbassandolo lo stantuffo scende) |
| `molecola3d` | molecola a palline e bastoncini | `colori: [a, b, c]`, `legame` |
| `dna3d` | doppia elica | `colori: [a, b]`, `gradini`, `giro` (gradi: `s.t * 40` la fa ruotare) |
| `ginocchio3d` | femore, tibia, perone, rotula | `dolore` (0…1: si arrossa), `piega` (gradi), `coloreDolore` |
| `cuore3d` | cuore | `colore`, `spessore` |
| `moneta3d` | moneta | `colore`, `bordo` |
| `stella3d` | stella | `colore`, `spessore` |
| `provetta3d` | provetta con il liquido | `liquido`, `livello` |
| `flacone3d` | flacone di compresse | `colore`, `tappo`, `etichetta` |
| `bilancia3d` | bilancia a due piatti | `pende` (da -1 a 1), `piatti: [colore, colore]` |
| `scudo3d` | scudo | `colore`, `spessore` |
| `lente3d` | lente d'ingrandimento | `colore`, `vetro` |
| `freccia3d` | freccia verso destra | `lunghezza`, `colore`, `spessore` |
| `barre3d` | colonne | `valori`, `colori`, `cresci` (0…1) |

Per farne altri: `scatola`, `cilindro` (anche tronco di cono), `sfera`, `capsula`, `anello`, `piano`, `linea3d`,
`griglia`, `estrusione` (una sagoma piatta con lo spessore), `gruppo` (sposta e ruota più pezzi insieme), `ombra`.
`proietta([x, y, z], camera, [cx, cy])` dice dove cade sul video un punto dell'oggetto: serve per metterci un'etichetta.

## Grafici (d3)

Si usano anche dentro una scena scritta a mano. `p` va da 0 a 1 e li disegna: `p={rampa(s.dopo('segno'), 1.5)}`.

| Nome | Cosa gli dai |
|---|---|
| `GraficoLinea` | `x`, `y`, `punti: [{etichetta?, valore}]`, `p`, `larghezza?`, `altezza?`, `colore?`, `riempi?`, `decimali?`, `prefisso?`, `suffisso?`, `minimo?`, `massimo?`, `evidenzia?` |
| `GraficoTorta` | `x`, `y`, `fette: [{etichetta, valore, colore?}]`, `p`, `raggio?`, `foro?` (0 = torta piena), `evidenzia?`, `stacca?`, `scritte?` |
| `GraficoClassifica` | `x`, `y`, `voci: [{etichetta, valore, colore?}]`, `p`, `larghezza?`, `evidenzia?`, `decimali?`, `prefisso?`, `suffisso?`, `massimo?` |

Da d3 si può importare qualsiasi altra cosa (`import {scaleLinear, line, arc} from 'd3'`): scale e forme sono
funzioni pure, vanno d'accordo con il render fotogramma per fotogramma. Non usare `d3.transition` né `d3.timer`:
dipendono dall'orologio, nel video non si muoverebbero.

## Icone (react-icons)

```tsx
import {FaHeartPulse} from 'react-icons/fa6';
<Icona disegno={FaHeartPulse} x={540} y={800} dimensione={220} da={s.dopo('cuore')} tondo etichetta="Cuore" />
```

`npm run icone cuore` cerca il nome giusto (capisce anche l'italiano) e stampa la riga di import. Raccolte: `fa6`
Font Awesome, `lu` Lucide, `tb` Tabler, `md` Material, `pi` Phosphor, `gi` Game Icons (corpo umano, oggetti),
`bs`, `hi2`, `io5`, `ri`. Opzioni di `Icona`: `colore`, `tondo`, `etichetta`, `da`, `fino`, `spento`.

## Segni a mano (roughjs)

Si disegnano da soli mentre `p` va da 0 a 1; con lo stesso `seme` il tratto è sempre identico.

| Nome | Cosa gli dai |
|---|---|
| `SchizzoCerchio` | `x`, `y`, `larghezza`, `altezza` (un ovale attorno a un numero) |
| `SchizzoRiquadro` | `x`, `y`, `larghezza`, `altezza` |
| `SchizzoSottolinea` | `x`, `y`, `larghezza` |
| `SchizzoFreccia` | `da: [x, y]`, `a: [x, y]`, `curva?` |

Per tutti: `p`, `colore?`, `spessore?`, `seme?`, `mano?` (quanto trema il tratto).

## Foto e filmati

| Nome | Cosa gli dai |
|---|---|
| `Foto` | `file` (nella cartella del reel), `x`, `y`, `larghezza`, `altezza?`, `zoom?: [da, a]`, `punto?`, `sposta?`, `ruota?`, `didascalia?`, `da`, `fino?` |
| `Filmato` | `clip` (il `clip.json` importato), `x`, `y`, `larghezza`, `avvio?`, `inizio?`, `velocita?`, `ripeti?`, `da`, `fino?` |

- Una foto: `<Foto file="studio.png" x={540} y={860} larghezza={700} da={s.dopo('rivista')} />`. Si avvicina piano da sola.
- Un video va prima diviso in fotogrammi: `npm run clip <reel> registrazione.mp4 demo` (con `da=3 durata=10` per
  prenderne un pezzo). Poi `import demo from './clip/demo/clip.json'` e `<Filmato clip={demo} … />`.
- Con `schermo` riempiono lo schermo di un telefono: `<Telefono …><Filmato clip={demo} schermo da={…} /></Telefono>`.
- Mai un `<video>`: nel render resterebbe fermo. Il `Filmato` è preciso al fotogramma; l'audio della clip non si usa.

## Il logo della pagina

L'ebook regalo: `stile/ebook.jpg` (la copertina). `<Ebook x={540} y={860} larghezza={470} da={s.dopo('database')} />` lo
mostra su un tablet in 3D vero (spessore, bordo di metallo, riflesso sul vetro) che entra girando e poi oscilla;
`gira={0}` lo tiene fermo di fronte. Scena intera: `bloccoEbook({invito: 'Commenta MAPPA', segno: 'database'})`.
Per cambiare copertina sostituisci il file (e `misure` in `stile/stile.ts` se le proporzioni cambiano).

`stile/logo.png` (fondo trasparente). `<Logo x={540} y={760} larghezza={460} da={s.dopo('pagina')} />` lo mette dove
vuoi; `bloccoSigla()` è la sigla intera; `bloccoChiusura({parola: 'MAPPA', logo: true})` lo mette sopra il cartello
finale. Per cambiarlo sostituisci il file e aggiorna nome e misure in `stile/stile.ts`, alla voce `logo`.

## Scritte, luci, oggetti piatti

| Nome | A cosa serve |
|---|---|
| `Cifra` | numero grande con l'etichetta sotto: `x`, `y`, `valore`, `etichetta?`, `dimensione?`, `colore?`, `da`, `fino?` |
| `Targa` | riquadro con titolo e riga piccola: `titolo`, `sotto?` |
| `Etichetta` | pillola con un nome: `testo`, `piena?` |
| `Scritta` | una riga semplice |
| `Cartello` | il cartello finale: `sopra`, `parola`, `sotto` |
| `Fonte` | la fonte in piccolo (si sposta da sola se il narratore è da quel lato) |
| `Bagliore`, `Lume`, `Onde`, `Faro`, `Linea` | luci, onde che si allargano, un faro, una linea che si disegna |
| `Globo`, `Orologio`, `Spunta`, `Divieto`, `Segnaposto`, `Satellite`, `Telefono` | oggetti piatti |
| `Camera`, `vistaA` | movimenti di camera su tutta la scena |

Tutte le scritte prendono `da` (secondi da quando compaiono) e `fino` (secondi da quando spariscono).
Quando una scritta lascia il posto a un'altra nello stesso punto: la prima `fino={segno + 0.3}`, la seconda `da={segno}`.

## Attrezzi per animare

`rampa(x, durata, curva)` 0→1 · `molla(x)` arriva con un piccolo rimbalzo · `impulso(x, durata)` 0→1→0 ·
`onda(t, periodo)` oscilla · `mix(a, b, p)` · `limita(x)` · `numero(valore, decimali, lingua)` scrive le cifre come
si scrivono in quella lingua · `curve.morbida`, `curve.esce`, `curve.entra`.

## Il narratore

- Pose del Dottore PEPTMAP: `dito`, `alto`, `pensa`, `lato`, `presenta`, `aperto`, `conserte` (braccia
  incrociate). Ne sceglie una a ogni frase; `conserte` sulle frasi che frenano ("Ma…", "Non…").
- Seconda mano: `aperta`, `alza`, `giu` (scende lungo il fianco). La sceglie insieme alla posa; per fissarla:
  `npm run imposta <reel> mano=giu`, oppure in una scena `dottore: {seconda: 'alza'}`.
- Gesti: `indica`, `batte`, `spiega`, `annuisce`, `domanda`, `nega`, `saluta`, `guarda`.
- Per decidere tu in una scena: `scena: {componente: Scena, dottore: {posa: 'pensa', gesti: [['segno', 'batte']]}}`.

## Voce e musica

- Voce: `npm run voce <reel>` (ElevenLabs, voce del Mac, o un tuo comando).
- Effetti sonori: `[suono:pop]` nel copione, davanti a una parola. Di serie: `pop`, `clic`, `ding`, `whoosh`, `tonfo`,
  `sale`, `successo`, `errore`. I tuoi: un file in `suoni/`. Elenco: `npm run suoni`.
- Musica: un file `musica.mp3` nella cartella del reel (o in `stile/`, per tutti). Volume: `npm run imposta <reel> musica=30`
  (0 = niente). Resta sotto la voce e si abbassa da sola mentre la voce parla.
