# FMLAB Reel Kit — la scheda

Per fare un reel bastano queste pagine. `FMLAB_AVVIA.md` si apre solo per il dettaglio di un capitolo.

## Prima di tutto: `npm run stato`

Lancialo all'inizio e dopo ogni passo. Fa tre cose: dice a che punto è ogni reel; accende la **dashboard** (se non è
già accesa) e ne scrive l'indirizzo, così chi ti segue vede in diretta tappe, provini, errori e crediti; ti mostra le
**richieste** che quella persona ha scritto nella dashboard. Le richieste si fanno in ordine: se hanno una riga
`→ npm run imposta …` lanciala così com'è, poi rifai quello che serve (`npm run fai <reel>`) e chiudi con
`npm run richieste fatta <id>`. Leggi anche le ultime voci di `diario.md`: dicono cosa è andato storto negli ultimi reel.

## Dal testo al reel: il regista sei tu, il kit fa il resto

Quando arriva **un testo già scritto** (incollato in chat, dal pannello, in un file) il lavoro è questo, e non altro:

```
npm run fai <reel> testo=<file.txt> "Titolo" durata=60 narratore=dottore regalo=mappa    # crea, piano di serie, provini
# → migliora reels/<reel>/piano.json scena per scena, riempi fonti.md
npm run piano <reel>          # controllo: errori, consigli, rischio cartelli (deve essere "basso")
npm run fai <reel>            # riparte da dove serve: monta, tempi, provini | voce, render, verifica, confronta
```

- **Il testo non si tocca** (sta in `testo.txt`). **Non si scrive codice**: si scrive `piano.json`; `copione.md` e
  `scene.tsx` li scrive `npm run monta` (lo chiama `fai`) e non si modificano a mano. Una scena che nessun blocco
  rende si scrive in `mano.tsx` e nel piano si chiama con `{"blocco": "mano", "dati": {"componente": "Nome"}}`.
- **Le scelte della persona** (`npm run imposta <reel> …`, o in coda a `fai`/`nuovo`): `durata=` · `narratore=dottore|nessuno`
  · `regalo=auto|nessuno|<nome>` (cosa si regala in chiusura: `npm run regalo` li elenca e ne aggiunge da un'immagine o
  da un PDF) · `formato=9:16|1:1|16:9` (verticale, quadrato, orizzontale: le scene sono le stesse, cambia la finestra
  e dove sta il narratore) · `musica=` · `voce=`. Se la persona non dice niente valgono quelle del kit.
- **Due tempi.** Prima si fissa la composizione senza spendere (piano, provini a bassa risoluzione: guardali), poi si
  paga il dettaglio (voce, video). `fai` si ferma prima della voce a pagamento e dice quanti crediti costa: si
  riparte con `voce=si` solo dopo il sì della persona. Se una tappa fallisce si corregge e si rilancia `fai`:
  le tappe riuscite non si rifanno. Il reel è fatto solo se `verifica` passa; al massimo due giri di correzione
  guardando `confronta`, poi si consegna dicendo cosa resta fuori soglia.

Il piano, una scena (l'esempio intero è `prove/sostegno/piano-reta.json`; `npm run piano` senza reel elenca blocchi e campi):

```json
{"nome": "risultati", "da": "Con la Reta, il",
 "perche": "i due quadranti uno accanto all'altro: quasi quattro punti contro circa due",
 "blocco": "soggetti",
 "dati": {"soggetti": [
   {"tipo": "quadrante", "etichetta": "Reta", "nota": "−3,96 punti", "colore": "#5CF2C8",
    "stato": {"valore": 6, "massimo": 10}, "cambia": [{"segno": "quattro", "stato": {"valore": 2.04}}]},
   {"tipo": "quadrante", "etichetta": "Placebo", "nota": "−2,12 punti", "colore": "#C9D4E0", "segno": "anche",
    "stato": {"valore": 6, "massimo": 10},
    "cambia": [{"segno": "attivo", "stato": {"valore": 5.2}}, {"segno": "duepunti", "stato": {"valore": 3.88}}]}],
   "fonte": "NEJM 2026, studio TRIUMPH-4"},
 "segni": {"quattro": "quattro", "anche": "placebo", "attivo": "attivo", "duepunti": "due"},
 "enfasi": ["quattro", "due"], "suoni": [{"suono": "ding", "su": "quattro"}],
 "luogo": "vuoto", "campo": "medio", "camera": "spinta"}
```

`da` = le prime parole della scena come sono nel testo · `segni` = nome → parola del testo su cui cade (se la parola
torna nella scena: `{"su": "dieci", "volta": 2}`) · un segno conta solo se fa comparire o cambiare qualcosa.

**Ogni scena è una ripresa, non un cartello** (è il metodo con cui si descrive una ripresa a un generatore di video):

1. **un perché** (`perche`): cosa deve far capire. Se non lo sai dire in una riga, la scena decora e basta;
2. **un soggetto grande che si può mostrare** e che torna: prima scelta il blocco `soggetti` (uno o due soggetti che
   riempiono il palco, lo stesso soggetto in più scene con uno stato diverso), poi numero, grafico, oggetto 3D. Sul
   palco solo etichette a pillola: elenchi e righe da leggere sono l'ultima scelta;
3. **un'azione**: qualcosa che *cambia* su una parola (un valore che sale, un soggetto che cambia stato con
   `cambia`), almeno ogni 3 secondi. **Ogni segno fa cambiare un soggetto grande**: un segno che non muove niente
   si toglie. Descrivi verbi, non aspetti;
4. **un'inquadratura** (`campo`: largo → medio → stretto, mai due scene uguali di fila) e **un movimento di camera con
   un nome** (`camera`: spinta, indietro, destra, sinistra, sale, scende, gira);
5. **continuità**: lo stesso soggetto che torna, lo stesso colore per lo stesso soggetto in tutto il reel (es. Reta verde,
   placebo azzurro, dolore rosso), lo stesso suono per lo stesso tipo di cosa, una luce sola per scena (`tinta`).

Mai più di tre scene dello stesso blocco di fila; almeno tre blocchi diversi nel reel; da 4 a 6 suoni.

## Il giro (quando il testo è da scrivere)

| # | Cosa | Comando |
|---|---|---|
| 0 | A che punto siamo | `npm run stato` · `npm run stato <reel>` |
| 1 | Cartella nuova (se c'è `richiesta.md` esiste già: leggila) | `npm run nuovo <reel> "Titolo" [modello]` |
| 2 | Fonti, poi piano, poi copione | `fonti.md` → `piano.md` → `copione.md` |
| 3 | Tempi di lavoro, senza voce | `npm run voce <reel> stima` |
| 4 | Scene: riempi quelle pronte | `scene.tsx` |
| 5 | Controllo a occhio, una sola immagine | `npm run provini <reel>` |
| 6 | Voce vera, poi di nuovo i provini | `npm run voce <reel>` |
| 7 | Video e controlli | `npm run render <reel>` · `npm run verifica <reel>` |
| 8 | Testo del post, consegna | `didascalia.md` |
| 9 | Riuso: quello che può riservire entra in libreria | `npm run riuso <reel>` |

Il metro: `npm run confronta <reel>` (o un file mp4) misura il video finito e lo confronta con le soglie ricavate dai
video di riferimento (`riferimenti/misure.json`): tagli, novità, palco, sottotitoli, narratore, audio.

Modelli (`npm run nuovo` li elenca): `spiegazione` · `lista` · `confronto` · `mito` · `passi` · `oggetto` (3D) · `dati`.
Scelte del reel: `npm run imposta <reel> narratore=dottore|fmlab|nessuno grandezza=40…160 lato=destra|sinistra specchia=si|no mano=auto|aperta|alza|giu stile=2d|3d musica=0…100 voce=auto|mac|elevenlabs|comando durata=15…180|libera`
(a sinistra va specchiato: guarda verso il centro e il logo resta leggibile).

## Testo dato e durata chiesta (regole fisse)

- **Se nella cartella c'è `testo.txt`, il testo è già scritto e non si tocca.** Sta in `copione.md` in una scena
  sola: si aggiungono `[scena:nome]`, `[segni]`, `*enfasi*`, `[suono:nome]`, e nient'altro. Nessuna parola tolta,
  aggiunta o corretta: i dubbi sui fatti vanno in `fonti.md` e si dicono alla fine. `npm run voce` e
  `npm run verifica` si fermano alla prima parola diversa. Una barra rovesciata davanti a `[ ] * # >` nel copione
  vuol dire "è testo, non un comando": resta dov'è.
- **La durata chiesta** (`durata` in `impostazioni.json`, dal pannello o con `npm run imposta <reel> durata=45`)
  si rispetta con al massimo 5 secondi di scarto. Se la voce è più lunga `npm run voce` la velocizza (fino a 1,4:
  voce e tempi insieme, l'audio sul disco resta quello naturale). Se non basta, con una voce a pagamento si ferma
  **prima** di generarla e dice quante parole togliere o quale durata chiedere. La verifica dà errore fuori dai 5 secondi.
- **Ogni numero a schermo sta in `fonti.md`**, scritto come compare (anche arrotondato: si spiega sotto "Calcoli").
  La verifica li cerca uno per uno.

## Copione

```
<!-- lingua: it -->
[scena:aggancio]
I satelliti *GPS* [nonsa]non sanno dove sei.
```

`[scena:nome]` apre una scena · `[segno]` marca la parola che segue · `*parola*` = riquadro nei sottotitoli e
accento del narratore · numeri in lettere · prima frase sotto le 12 parole · 110-140 parole per 45-60 secondi ·
un segno ogni 2-3 secondi. Segni ed enfasi si spostano senza rifare la voce: il kit riallinea da solo.
`[suono:pop]` davanti a una parola fa partire lì un effetto sonoro (`npm run suoni` li elenca: `pop` `clic` `ding`
`whoosh` `tonfo` `sale` `successo` `errore`, più quelli messi nella cartella `suoni/`). Pochi: 4-6 per reel.

## Scene pronte (`libreria/Blocchi.tsx`)

Le scene pronte si adattano: un elenco più lungo del posto **scorre** (restano a schermo gli ultimi comparsi, lungo
la scena passano tutti), torta e classifica **raggruppano** le voci più piccole in "Altri (n)", le barre arrivano a
12 colonne, una scritta un po' lunga si rimpicciolisce. Solo oltre questi limiti la scena si ferma con un errore che
dice cosa fare: niente viene tagliato in silenzio.
Ogni testo: `'scritta'` oppure `{it: '…', en: '…'}`. Ogni `segno`: nome di un `[segno]`, oppure secondi dall'inizio
della scena, oppure niente (si distribuiscono da soli).

| Blocco | Parametri |
|---|---|
| `bloccoTitolo` | `titolo`, `sopra?`, `sotto?`, `segno?` |
| `bloccoNumero` | `valore`, `unita?`, `decimali?`, `prefisso?`, `suffisso?`, `segno?`, `nota?`, `sottoNota?`, `segnoNota?`, `fonte?` |
| `bloccoLista` | `voci: [{testo, segno?}]` (max 5), `titolo?` |
| `bloccoConfronto` | `sinistra` e `destra`: `{titolo, valore, unita?, segno?}`, `titolo?`, `fonte?` |
| `bloccoBarre` | `dati: [{etichetta, valore, segno?}]` (max 6), `titolo?`, `unita?`, `decimali?`, `fonte?` |
| `bloccoAnello` | `valore` (0-100), `etichetta?`, `segno?`, `fonte?` |
| `bloccoPassi` | `passi: [{testo, segno?}]` (max 5), `titolo?` |
| `bloccoMito` | `mito`, `verita`, `segnoMito?`, `segnoVerita?`, `fonte?` |
| `bloccoOggetto` | `oggetti: (s) => facce 3D`, `etichette?: [{testo, punto: [x, y, z], segno?}]`, `titolo?`, `zoom?` |
| `bloccoChiusura` | `parola`, `sopra?`, `sotto?`, `segno?`, `logo?` (true = logo della pagina sopra) |
| `bloccoLinea` | `punti: [{etichetta?, valore}]`, `titolo?`, `unita?`, `decimali?`, `segno?`, `evidenzia?`, `fonte?` |
| `bloccoTorta` | `fette: [{etichetta, valore}]` (max 6), `titolo?`, `segno?`, `evidenzia?`, `segnoEvidenzia?`, `fonte?` |
| `bloccoClassifica` | `voci: [{etichetta, valore}]` (max 6), `titolo?`, `unita?`, `segno?`, `evidenzia?`, `fonte?` |
| `bloccoIcone` | `voci: [{icona, testo, segno?}]` (2-6), `titolo?` · icone: `npm run icone cuore` |
| `bloccoScala` | `cursori: [{etichetta, valore, da?, segno?}]` (max 3), `minimo?`, `massimo?`, `estremi?`, `verso?` |
| `bloccoSchede` | `schede: [{sopra?, valore, unita?, sotto?, segno?}]` (2-3), `totale?: {valore, etichetta?, segno?}` |
| `bloccoAvviso` | `titolo`, `sotto?`, `punti?: [{testo, segno?}]` (max 3), `segno?`, `fonte?` |
| `bloccoCitazione` | `testo`, `autore?`, `segno?` |
| `bloccoSigla` | `nome?`, `sotto?`, `segno?` · il logo della pagina (`stile/logo.png`) con il nome |
| `bloccoEbook` | `regalo?`, `invito?`, `sopra?`, `sotto?`, `segno?`, `segnoSopra?`, `segnoSotto?` · il regalo su un tablet 3D che gira: per "Commenta MAPPA" (`npm run regalo` li elenca) |
| `bloccoSoggetti` | `soggetti: [{tipo, etichetta?, nota?, colore?, segno?, stato?, cambia?}]` · **la prima scelta**: da 1 a 3 soggetti grandi che non si fermano mai (`ginocchio` dolore · `quadrante` valore, massimo · `batteria` livello · `stomaco` irritato · `riflettori` luci · `foglio` evidenzia · `scale` passo · `icona` + `icona`), ognuno cambia stato su una parola |
| `bloccoParole` | `parole: [{testo, segno?, colore?}]`, `titolo?` · le parole che contano, una alla volta, ognuna sulla sua parola |
| `bloccoDomanda` | `domanda`, `sopra?`, `sotto?`, `segno?` · l'aggancio in forma di domanda |
| `bloccoStudio` | `rivista`, `titolo`, `dati?: [{testo, segno?}]` (max 3), `pagato?`, `fonte?` |
| `bloccoPersone` | `accese`, `quante?` (fino a 20), `etichetta?`, `titolo?`, `segno?`, `fonte?` · "2 su 10" |
| `bloccoTempo` | `tappe: [{quando, testo?, segno?}]` (max 4), `titolo?`, `fonte?` |
| `bloccoSchermo` | `file` oppure `clip` (dentro il telefono), `note?: [{testo, segno?}]` (max 3), `titolo?` |

Con stile `3d`, `bloccoConfronto` e `bloccoBarre` diventano solidi veri da soli. Tutto il resto (oggetti 3D,
grafici, icone, segni a mano, con le loro opzioni) è in `CATALOGO.md`; disegnato, in `catalogo.jpg`.

```tsx
import {bloccoChiusura, bloccoNumero, bloccoTitolo, definisciReel} from '../../libreria';
export default definisciReel({
  titolo: '…',
  scene: {
    aggancio: bloccoTitolo({titolo: 'Il GPS non sa dove sei', segno: 'sorpresa'}),
    quota: bloccoNumero({valore: 20200, unita: 'km di quota', segno: 'km', fonte: 'GPS.gov'}),
    chiusura: bloccoChiusura({parola: 'GPS', segno: 'commenta'}),
  },
});
```

## Scena scritta a mano (quando un blocco non basta)

Esempio completo: `reels/gps/scene.tsx`. Tutto è funzione del tempo: `const s = useScena()`, poi
`s.dopo('segno')` = secondi dalla parola (negativo prima). `- 0.3` = 0,3 s dopo; `+ 0.3` = prima.

- animazione: `rampa` `molla` `mix` `mappa` `limita` `impulso` `onda` `finestra` `curve` `casuale` `numero`
- camera: `Camera` `vistaA` · luce: `Bagliore` `Lume` `Onde` `Linea` `Faro`
- scritte: `Cifra` `Targa` `Etichetta` `Scritta` `Cartello` `Fonte` (tutte con `da`, e `fino` per sparire)
- 2D: `Globo` `luogo` `suOrbita` `TracciaOrbita` `Satellite` `Telefono` `MappaSchermo` `Orologio` `Divieto` `Segnaposto` `Spunta`
- 3D: `<Scena3D oggetti={[...]} camera={{giro, alza, distanza, zoom}} x y />` con `scatola` `cilindro` `sfera`
  `capsula` `anello` `piano` `griglia` `linea3d` `estrusione` `ombra` `gruppo` `proietta`; pronti: `satellite3d`
  `telefono3d` `fiala3d` `pillola3d` `siringa3d` `molecola3d` `dna3d` `ginocchio3d` `cuore3d` `moneta3d`
  `stella3d` `provetta3d` `flacone3d` `bilancia3d` `scudo3d` `lente3d` `barre3d` `freccia3d`. Assi: x destra, y ALTO, z verso chi guarda.
- grafici (d3): `GraficoLinea` `GraficoTorta` `GraficoClassifica`, con `p` da 0 a 1 · icone: `<Icona disegno={FaHeartPulse} …/>`
  · segni a mano: `SchizzoCerchio` `SchizzoRiquadro` `SchizzoSottolinea` `SchizzoFreccia`
- logo della pagina: `<Logo x y larghezza da />`
- foto e filmati: `<Foto file="studio.png" x y larghezza da />` (file nella cartella del reel) · un video prima si
  divide in fotogrammi, `npm run clip <reel> video.mp4 demo`, poi `import demo from './clip/demo/clip.json'` e
  `<Filmato clip={demo} … />`; con `schermo` riempiono lo schermo di un `<Telefono>`. Mai `<video>`.

Vietati: animazioni CSS, `Date`, `Math.random()`, `setTimeout`.

## Il mondo dietro le scene: luogo, camera, protagonista

Dietro ogni scena c'è un posto a livelli (trama, luogo disegnato, luce) e una camera che non si ferma: viaggia
sempre, scatta a ogni cambio di scena e dà una spinta con un lampo a ogni `[segno]`. Tre cose si dichiarano in
`definisciReel`, scena per scena:

```tsx
export default definisciReel({
  protagonista: {tipo: 'peptide', colore: '#5CF2C8'},          // 'peptide' | 'goccia' | 'cellula'
  scene: {
    aggancio: {componente: Aggancio, atmosfera: {tinta: '#E8455A', luogo: 'corpo'}},
    studi:    {componente: Studi, atmosfera: {luogo: 'studio'}, entra: 'destra', protagonista: {onda: 0.3}},
    rischi:   {componente: Rischi, atmosfera: {luogo: 'vaso'}, protagonista: [{colore: '#FF4D5E', onda: 1.6}, {segno: 'stop', acceso: 0.1}]},
  },
});
```

- **`luogo`**: `corpo` · `vaso` · `membrana` · `laboratorio` · `stadio` · `palco` · `bilancia` · `studio` · `vuoto`.
- **`campo`** e **`camera`**: quanto è larga l'inquadratura (`largo` · `medio` · `stretto`) e come si muove la camera
  mentre la scena dura (`spinta` · `indietro` · `destra` · `sinistra` · `sale` · `scende` · `gira` · `ferma`).
- **`entra`**: da che parte la camera arriva nella scena. `avanti` (di serie: attraversa la scena prima, che si
  ingrandisce e si sfoca) · `sinistra` · `destra` · `alto` · `basso` (carrellata). Mai un taglio, mai una dissolvenza semplice.
- **`protagonista`** (facoltativo: nei reel di riferimento non c'è, e accanto ai soggetti grandi sembra un di più;
  usalo solo nei reel senza soggetti): un oggetto solo per tutto il reel, che resta mentre le scene cambiano. Ogni scena ne dice lo
  stato: `x`, `y`, `grandezza`, `acceso` (0-1), `carica` (0-1, da vuoto a pieno), `colore`, `onda` (0-2, da calmo ad
  agitato), `presenza`. Più stati nella stessa scena: il primo all'ingresso, gli altri ognuno al suo `segno`.
  `false` = esce di scena. Quello che non scrivi resta com'era: **è lo stesso oggetto che cambia stato, non uno nuovo.**
- `mondo: false` nel reel torna al fondo semplice di prima.

## Immagini generate (materiale, non video)

`npm run immagine <reel> "un ginocchio in sezione, cartilagine azzurra"` dà un PNG su fondo trasparente in
`libreria/immagini/`, da mettere in scena con `<Foto file="libreria/immagini/….png" … />`: ad animarlo è il kit.
Se un'immagine con lo stesso soggetto e lo stesso stile c'è già, esce dalla biblioteca e **costa zero**. Lo stile
è quello del foglio `reels/<reel>/immagini.json` (`{"stile": "…", "formato": "1:1"}`), oppure quello del kit.
Chi genera si sceglie in `.env` con `FMLAB_IMMAGINI`: `nessuno` (di serie: non spende mai), `higgsfield`,
`stability`, `comando`. **Prima di generare con un fornitore a pagamento: chiedi.** `npm run immagini` elenca la biblioteca.

## Dove stanno le cose (1080x1920)

Sottotitoli y 356 · palco y 470-1320, centro (540, 880) · narratore in basso a destra (il suo riquadro:
`useTempo().narratore`) · zone coperte dall'app: sopra 220, sotto 1560, colonna x > 940 sotto y 1040.

## Narratore

Si muove da solo: cambia posa a ogni frase (`dito` `alto` `lato` `aperto` `pensa` `presenta`, e `conserte`,
braccia incrociate, sulle frasi che frenano: "Ma…", "Non…"), mette l'accento
sulle `*enfasi*`, guarda il palco sui `[segni]`, annuisce a fine frase, porta il dito al mento sulle domande,
fa "no" sulle negazioni. Frasi brevi = più cambi di posa. Anche la seconda mano cambia a ogni posa: `aperta`,
`alza`, `giu` (lungo il fianco, come in tasca).
Per decidere a mano, nella scena: `dottore: {posa: 'alto'}`, `dottore: {seconda: 'giu'}`,
`dottore: {gesti: [['km', 'batte']]}`, `dottore: {gesti: false}`, `dottore: {mostra: false}`.
Per tutto il reel: `npm run imposta <reel> mano=giu` (`auto` per tornare a farla scegliere al kit).

## Musica

Un file `musica.mp3` nella cartella del reel finisce sotto la voce da solo (si abbassa mentre la voce parla).
Volume: `npm run imposta <reel> musica=30`; `musica=0` la spegne. Il file lo mette la persona: non scaricarne tu.
Gli effetti sonori stanno in `suoni/` e si chiamano dal copione con `[suono:nome]` (vedi sopra).

## Spendere meno

- Parti da un modello e riempi le scene pronte: si scrive a mano solo la scena che non c'è.
- **A fine reel, sempre:** `npm run riuso <reel>` elenca quello che hai scritto a mano. Ogni pezzo che può
  riservire (una scena, un oggetto 3D, un grafico) va spostato in libreria, disegnato nel catalogo e spiegato in
  `CATALOGO.md`; poi `npm run catalogo` e `npm test`. Il prossimo reel lo trova già fatto. Una riga in
  `stile/appunti.md` su cosa hai imparato.
- `npm run stato <reel>` invece di riaprire i file. Un foglio di provini invece di tante foto.
- Tempi stimati fino alla fine; la voce a pagamento una volta sola. ElevenLabs lavora frase per frase: le frasi
  già pagate (`voci/pagate/`) e quelle della banca (`voci/frasi/`, `npm run frasi` le elenca) non si ripagano, una
  frase cambiata costa solo i suoi caratteri. Spostare segni ed enfasi è gratis. Se nel testo c'è una frase fissa
  quasi uguale a una della banca, **non toccarla**: dillo a chi ha scritto il testo, decide lui.
- `render bozza` al massimo una volta, il render finale una volta: i dettagli si controllano con `foto`.

## Regole fisse

Nessun numero senza riga in `fonti.md` · salute e sostanze: capitolo 13 di `FMLAB_AVVIA.md` · mai consegnare
senza `provini` guardati e `verifica` passata · non pubblicare niente a nome della persona · un reel è chiuso
solo dopo il passo 9 (riuso).
