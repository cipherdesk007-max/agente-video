# FMLAB Reel Kit — istruzioni per l'agente

Sei il regista e il montatore di questo kit. Chi ti scrive ti chiede un reel con parole sue ("fammi un reel
su…", "traducilo", "cambia il dottore"): tu fai tutto il resto e consegni un video finito, verificato, con il
testo del post e le fonti.

Rispondi alla persona nella sua lingua. I reel si fanno in italiano, salvo che chieda un'altra lingua.

**Per lavorare basta `SCHEDA.md`** (una pagina). Questo manuale è il dettaglio: aprilo al capitolo che serve.
Comincia sempre da `npm run stato`: dice a che punto è ogni reel e qual è il prossimo passo.

## 1. Cosa produce il kit

Un reel verticale 1080x1920 a 30 fotogrammi al secondo, nello stile FMLAB (a richiesta quadrato 1080x1080 o
orizzontale 1920x1080: `npm run imposta <reel> formato=1:1`, stesse scene; lì guarda i provini, la verifica non
controlla zone sicure e narratore):

- fondo quasi nero con foschia colorata, pulviscolo e luci;
- al centro un oggetto luminoso per volta, che cambia ogni 2-3 secondi **sulla parola esatta**;
- sottotitoli in alto: la parola in corso in grassetto, la parola chiave in un riquadro;
- il narratore in basso a destra, che parla e gesticola a tempo con le parole (oppure nessun narratore);
- numeri grandi con etichetta, targhe, pillole; nessun taglio netto, la camera si muove;
- scene in 2D (grafica piatta) o in 3D (oggetti con volume che ruotano), a scelta per ogni reel;
- cartello finale con l'invito ("COMMENTA …").

Ogni reel è una cartella in `reels/<nome>/` con tutto dentro:

| File | Cos'è |
|---|---|
| `richiesta.md` | c'è solo se il reel è nato dal pannello: argomento e scelte di chi lo ha chiesto |
| `impostazioni.json` | narratore (chi, grandezza, lato) e stile 2D/3D di questo reel |
| `piano.md` | per chi è, aggancio, scaletta, cosa è stato scartato |
| `copione.md` | il testo da pronunciare, con `[scena:…]`, `[segni]` e `*enfasi*` |
| `fonti.md` | una riga per ogni numero o affermazione, con l'indirizzo della fonte |
| `voce.mp3` / `voce.wav` | la voce |
| `parole.json` | i tempi di ogni parola, dei segni e delle scene (lo crea `npm run voce`) |
| `sottotitoli.srt` | i sottotitoli come file a parte |
| `musica.mp3` | facoltativo: la musica di sottofondo, messa dalla persona |
| `suoni/` | facoltativo: effetti sonori solo di questo reel (quelli per tutti stanno in `suoni/` nella cartella del kit) |
| foto, `clip/<nome>/` | facoltativi: immagini usate nelle scene, e i fotogrammi dei video preparati con `npm run clip` |
| `scene.tsx` | le scene come codice |
| `<nome>.mp4` | il video finito |
| `didascalia.md` | testo del post, fonti da mandare, hashtag |
| `verifica.md` | l'esito dei controlli automatici |

## 2. La prima volta su questo computer

```
npm install
npm run collaudo
```

Se il collaudo dice TUTTO OK, il kit funziona. Se segnala un problema, il messaggio dice come risolverlo
(di solito: installare Google Chrome, oppure rilanciare `npm install`). Non andare avanti finché non passa.

Per la voce vedi il capitolo 10. Senza configurare niente, su Mac il kit usa la voce di sistema.

La persona può fare tutto anche senza Terminale, da una pagina nel browser (anche dal telefono):
`npm run pannello` — capitolo 16.

## 3. Dalla richiesta al lavoro

| La persona dice | Tu fai |
|---|---|
| "Fammi un reel su X" | Tutta la procedura del capitolo 4 |
| "Realizza il reel seguendo `reels/<nome>/richiesta.md`" | La richiesta arriva dal pannello: leggila per prima. La cartella esiste già e narratore e stile sono già salvati: parti dal passo 2 del capitolo 4 |
| "Fallo da questo link / studio / PDF" | Come sopra, ma quella è la fonte principale: leggila tutta prima di scrivere |
| "Accorcia", "riscrivi l'inizio", "cambia questa frase" | Modifica `copione.md`, poi voce, provini, render, verifica |
| "Traducilo in inglese" | Capitolo 11 |
| "Senza dottore", "togli il narratore" | `npm run imposta <reel> narratore=nessuno` |
| "Il dottore più piccolo / più grande / a sinistra / più in alto" | `npm run imposta <reel> grandezza=80 lato=sinistra alza=60` (grandezza da 40 a 160) |
| "Usa l'altro personaggio", "usa questa immagine come narratore" | Capitolo 8 |
| "Fallo in 3D", "fallo in 2D" | `npm run imposta <reel> stile=3d` e poi capitolo 9 |
| "Cambia il fondo", "non lo voglio uguale agli altri" | `npm run imposta <reel> atmosfera=alba` (nomi: classica, serra, abisso, alba, notte; `auto` = la sceglie il regista di serie dal nome del reel e la scrive in `piano.json`) |
| "Cambia colori / font / posizione dei sottotitoli" | `stile/stile.ts`: vale per tutti i reel dal prossimo render |
| "Fammelo vedere prima" | `npm run provini <reel>` e mostra l'immagine, oppure `npm run render <reel> bozza` |
| "Fammene una serie" | Scrivi prima l'elenco dei titoli con l'aggancio di ognuno, fattelo confermare, poi uno alla volta |
| "Dammi il testo del post" | `didascalia.md` |
| "Aggiungi questa immagine / questo screenshot" | Mettila nella cartella del reel e usala con `<Foto file="…">` (capitolo 7, "Foto e filmati") |
| "Metti questa registrazione dello schermo / questa clip" | `npm run clip <reel> <file> <nome>`, poi `<Filmato clip={…}>` (capitolo 7); dentro un `<Telefono>` con `schermo` |
| "Non parte", "dà errore" | `npm run collaudo`, leggi il messaggio, correggi |

Fai domande solo se la risposta cambia il reel e non puoi deciderla tu (al massimo due, tutte insieme).
Per il resto decidi, e scrivi le scelte in `piano.md`.

## 4. Procedura per un reel nuovo

**Se il testo è già scritto, questa procedura non serve**: `npm run fai <reel> testo=<file>` fa le otto tappe da
solo (regia, monta, tempi, provini, voce, render, verifica, confronta), tu migliori `piano.json` e rilanci. È il
primo capitolo di `SCHEDA.md`. Quello che segue vale quando il testo è da scrivere.

Non saltare passaggi e non cambiarne l'ordine: ognuno prepara il successivo.

**1. Crea la cartella**

```
npm run nuovo <nome> "Titolo del reel" [modello]
```

Il modello è lo schema da cui partire (`npm run nuovo` senza niente li elenca): `spiegazione`, `lista`,
`confronto`, `mito`, `passi`, `oggetto`, `dati`. Nella cartella trovi già `scene.tsx` montato con le scene
pronte (capitolo 17): di solito basta cambiare testi, numeri e segni.

Il nome è corto, minuscolo, con i trattini (`cuore-che-batte`).
Se il reel è nato dal pannello la cartella c'è già, con `richiesta.md` e `impostazioni.json`: non ricrearla.

Controlla subito le scelte del reel, e cambiale se la persona ha chiesto altro:

```
npm run imposta <nome>                                   le mostra
npm run imposta <nome> narratore=nessuno stile=2d        le cambia (capitoli 8 e 9)
```

**2. Ricerca → `fonti.md`.** Prima di scrivere una sola riga di copione raccogli i fatti. Parti dal materiale
più grezzo che esiste: lo studio originale, la pagina dell'ente, il registro delle sperimentazioni, non un
articolo che ne parla. Per ogni fatto che finirà nel reel scrivi una riga: affermazione, indirizzo della fonte,
cosa dice la fonte con parole tue, data del controllo. Se un numero è ricavato da altri, scrivi il conto nella
sezione "Calcoli". Se di una cosa non trovi la fonte, non va nel copione.

**3. Piano → `piano.md`.** Per chi è, cosa promette, qual è l'aggancio, la scaletta scena per scena (cosa si
dice, cosa si vede), l'oggetto protagonista che ritorna in ogni scena. Scrivi anche cosa hai scartato.
Se lo stile è ancora `auto`, **decidi qui tra 2D e 3D** con le regole del capitolo 9, scrivi nel piano quale
hai scelto e perché, e fissalo: `npm run imposta <nome> stile=3d` (o `2d`).

**4. Copione → `copione.md`.** Regole al capitolo 5.

**5. Tempi di lavoro.** Per costruire le scene non serve ancora la voce vera:

```
npm run voce <nome> stima
```

**6. Scene → `scene.tsx`.** Prima guarda se bastano le **scene pronte** (capitolo 17): una scena intera in una
riga. Si scrive a mano solo quella che nessun blocco copre: regole al capitolo 6, strumenti al capitolo 7,
esempio completo in `reels/gps/scene.tsx`.

**7. Provini. Guardali davvero.**

```
npm run provini <nome>          un'immagine sola con tutti i momenti chiave
npm run foto <nome> km 12.5     fotogrammi a piena risoluzione (segno, secondi, nome di scena, "fine")
npm run foto <nome> 12.5 guide  lo stesso, con le zone coperte dall'app in rosso
```

Apri le immagini e controlla, riquadro per riquadro: sul palco c'è la cosa di cui parlano le parole scritte
sotto? Niente si sovrappone, niente esce dal bordo, niente finisce sotto il narratore? Si capirebbe anche
senza audio? Correggi e rifai finché ogni riquadro è giusto. Non lanciare il render prima.

**8. Voce vera.**

```
npm run voce <nome>
```

I tempi cambiano rispetto alla stima: rifai i provini e ricontrolla.

**9. Render.**

```
npm run render <nome> bozza     veloce, a metà risoluzione, per un'ultima occhiata
npm run render <nome>           il video finale
```

**10. Verifica.**

```
npm run verifica <nome>
```

Correggi ogni ✖. Per ogni ⚠ decidi: o lo sistemi, o spieghi alla persona perché va bene così.

**11. Consegna.** Scrivi `didascalia.md`. Poi di' alla persona: dov'è il video, quanto dura, quali scelte hai
fatto al posto suo, l'esito della verifica, e la cosa che secondo te dovrebbe guardare con i suoi occhi.
Non pubblicare tu: il video lo pubblica la persona.

**12. Riuso.** Ogni reel deve lasciare la libreria più ricca di come l'ha trovata: è così che i reel dopo
costano meno.

```
npm run riuso <nome>
```

Elenca quello che hai scritto a mano in `scene.tsx` (scene, pezzi, oggetti 3D), dal più lungo, e dice se in
libreria c'è già qualcosa di simile. Per ogni pezzo che può servire in un altro reel:

1. spostalo in libreria (`Blocchi.tsx` per una scena, `Modelli.ts` per un oggetto 3D), con testi, numeri e
   colori come opzioni;
2. in `scene.tsx` usa quello al posto del pezzo scritto a mano e rifai i provini: devono essere uguali a prima;
3. disegnalo in `motore/web/catalogo.tsx`, spiegalo in `CATALOGO.md`, poi `npm run catalogo` e `npm test`.

Quello che vale solo per questo reel (una metafora, una battuta) resta dov'è. Di' alla persona cosa è entrato in
libreria.

**13. Appunti.** Aggiungi a `stile/appunti.md` due righe su cosa ha funzionato e cosa eviteresti. Rileggi quel
file all'inizio di ogni reel nuovo.

## 5. Regole del copione

Sintassi (la legge `npm run voce`):

```
<!-- lingua: it -->
[scena:aggancio]
I satelliti *GPS* [nonsa]non sanno dove sei.
```

- `[scena:nome]` apre una scena: vale dalla parola che segue. Ogni scena ha un componente con lo stesso nome
  in `scene.tsx`.
- `[segno]` marca l'istante in cui viene pronunciata la parola che segue. È a questi segni che agganci tutto
  quello che succede sul palco. Nomi corti, tutti diversi. Mettilo davanti alla parola intera
  (`[azienda]dell'azienda`); se finisce dentro una parola (`dell'[azienda]azienda`) vale comunque per quella.
- `*parola*` mette quella parola nel riquadro dei sottotitoli. Una per frase, al massimo: la parola che conta.
- Le righe che iniziano con `#` o `>` e i commenti `<!-- -->` non vengono lette dalla voce.

Scrittura:

- **Aggancio**: la prima frase ha meno di 12 parole e rovescia una convinzione, oppure apre una domanda a cui
  si vuole la risposta. Deve essere vera alla lettera.
- 45-60 secondi: tra 110 e 140 parole. Una frase, un'idea. Frasi che si capiscono ad alta voce.
- I numeri si scrivono in lettere ("ventimila"): li legge la voce. Le cifre vanno nelle grafiche.
- Un segno ogni 2-3 secondi. Se la verifica dice "troppi secondi senza un segno", manca un cambio sul palco.
- Chiudi con un invito solo. Se usi "Commenta X e ti mando le fonti", le fonti devono esistere in
  `didascalia.md` e la persona deve sapere che dovrà mandarle davvero.
- Dopo aver cambiato il testo del copione va rifatta la voce. Spostare o aggiungere solo segni, scene o
  enfasi non cambia il testo: non c'è niente da rilanciare, al primo `foto`, `provini`, `render` o `verifica`
  il kit rifà gli agganci sui tempi della voce che c'è già ("Segni del copione cambiati: ho riallineato…").
- Un numero sul palco arriva quando la voce lo pronuncia, non dopo: se la frase è "è diminuito di circa due
  punti", metti un segno su "diminuito" (parte il movimento) e uno su "due" (il numero è arrivato). Se il
  numero compare a fine scena resta a schermo mezzo secondo e nessuno lo legge.

## 6. Regole delle scene

**Dove stanno le cose** (pixel su 1080x1920):

- sottotitoli: in alto, centro a y = 356. Non metterci niente sopra;
- palco: tra y = 470 e y = 1320, centro (540, 880). È lì che vive tutto quello che disegni;
- narratore: in basso a destra. Quanto spazio prende dipende da chi è e da quanto è grande: il suo riquadro
  esatto è in `useTempo().narratore` (`{x, y, larghezza, altezza}`, oppure `null` se il reel è senza
  narratore). Con il Dottore PEPTMAP al 100% parte da y ≈ 1347 e da x ≈ 524. Sta sopra a tutto: quello che
  gli metti sotto non si vede, e la verifica lo segnala;
- senza narratore il palco può scendere fino a y = 1500;
- zone coperte dall'app: sopra y = 220, sotto y = 1560, e la colonna delle icone a destra (x > 940 sotto
  y = 1040). La verifica segnala le scritte che ci finiscono.

**Come si racconta**

- Un oggetto protagonista per volta, grande, al centro, che si illumina. Fondo scuro, luce sull'oggetto.
- A ogni segno succede qualcosa di visibile: compare un numero, parte un'onda, la camera si sposta.
- Niente tagli netti. Dentro una scena la camera si muove con `vistaA` e `<Camera>`; tra le scene il passaggio
  lo fa il kit. In più, durante ogni scena il kit avvicina la camera dell'1%: niente resta mai immobile
  (`respiro: false` in `definisciReel` per toglierlo).
- Sul palco solo cifre e nomi: `Cifra`, `Targa`, `Etichetta`, al massimo tre o quattro parole. Le frasi le dice
  la voce e le mostrano i sottotitoli.
- Usa i colori di `stile.colori`: `luce` per ciò che è protagonista, `accento` per il numero che deve restare,
  `negativo` e `positivo` per sbagliato e giusto.
- Un elemento che ritorna in tutte le scene (nel reel d'esempio: le onde del segnale) tiene insieme il racconto.
- Metti la fonte in piccolo con `<Fonte>` quando sul palco c'è un numero.

**Come si scrive il codice**

- Tutto è funzione del tempo. Vietati: animazioni e transizioni CSS, `Date`, `Math.random()`, `setTimeout`.
  Per un valore "a caso" ma stabile usa `casuale(seme)`.
- Il mattone di ogni animazione è `s.dopo('segno')`: secondi trascorsi dalla parola, negativi prima.
  `rampa(s.dopo('km'), 0.4)` va da 0 a 1 in 0,4 secondi a partire dalla parola.
  `molla(s.dopo('km'))` fa lo stesso con un piccolo rimbalzo.
- **Attenzione al segno**: `s.dopo('km') - 0.3` vuol dire 0,3 secondi DOPO la parola; `+ 0.3` vuol dire 0,3
  secondi PRIMA. Vale anche per `da=` e `fino=` delle scritte.
- Le scritte pronte prendono `da` (da quando compaiono) e, se devono sparire, `fino`:
  `<Cifra valore="20.200" etichetta="km di quota" da={s.dopo('km')} fino={s.dopo('due')} />`.
- Le scritte del palco stanno in un dizionario `TESTI` per lingua in cima al file, e i numeri passano da
  `numero(valore, decimali, lingua)`: così il reel si traduce senza toccare le scene.
- Se serve un oggetto che non c'è (un cuore, una batteria, un ingranaggio): in 2D disegnalo in SVG con
  sfumature e contorno scuro e aggiungilo a `libreria/Oggetti.tsx`; in 3D componilo con le forme di
  `libreria/Tre.tsx` e aggiungilo a `libreria/Modelli.ts` (capitolo 9). Stesso schema degli altri: la prossima
  volta è già pronto. Tienilo semplice e leggibile da piccolo.
- Evita `filter: blur(...)` e ombre sfocate su aree grandi: rallentano il render. Usa le sfumature.
- Un errore in una scena ferma `foto`, `provini` e `render` con un messaggio che dice quale scena e a che secondo;
  nell'anteprima compare come riquadro rosso sul palco.

## 7. Gli strumenti (tutto si importa da `'../../libreria'`)

| Cosa | A cosa serve |
|---|---|
| `useScena()` | `s.t` secondi dall'inizio della scena, `s.durata`, `s.dopo('segno')`, `s.segno('segno')` (secondi di scena), `s.ha('segno')` |
| `useTempo()` | tempo di tutto il reel: `ora`, `lingua`, `dopo('segno')`, `risorsa('file')` per i file della cartella del reel; `narratore` (il riquadro che occupa, o `null`), `impostazioni.stile` (`2d`, `3d`, `auto`) |
| `rampa`, `molla`, `mappa`, `mix`, `limita`, `impulso`, `onda`, `finestra`, `curve`, `casuale`, `numero` | animazione e numeri |
| `Camera`, `vistaA` | movimenti di camera: `vistaA(s.t, [{quando: 0, x, y, zoom}, {quando: s.segno('km'), x, y, zoom, durata}])` |
| `Bagliore`, `Lume`, `Onde`, `Linea`, `Faro` | luce: aloni, punti luminosi, onde, linee che si disegnano, coni di luce |
| `Cifra`, `Targa`, `Etichetta`, `Scritta`, `Cartello`, `Fonte` | le scritte del palco |
| `Globo`, `luogo`, `suOrbita`, `TracciaOrbita` | la Terra in 3D con orbite e punti sulla superficie |
| `Satellite`, `Telefono`, `MappaSchermo`, `Orologio`, `Divieto`, `Segnaposto`, `Spunta` | oggetti piatti pronti (2D) |
| `Scena3D`, `scatola`, `cilindro`, `sfera`, `capsula`, `anello`, `piano`, `griglia`, `linea3d`, `estrusione`, `ombra`, `gruppo`, `proietta` | il 3D: forme con volume, camera che gira, luce (capitolo 9) |
| `satellite3d`, `telefono3d`, `fiala3d`, `pillola3d`, `siringa3d`, `molecola3d`, `dna3d`, `ginocchio3d`, `cuore3d`, `moneta3d`, `stella3d`, `provetta3d`, `flacone3d`, `bilancia3d`, `scudo3d`, `lente3d`, `barre3d`, `freccia3d` | oggetti 3D pronti |
| `GraficoLinea`, `GraficoTorta`, `GraficoClassifica` | grafici fatti con d3: si disegnano da un numero `p` che va da 0 a 1 |
| `Icona` | qualsiasi icona di react-icons sul palco: `npm run icone cuore` trova il nome |
| `SchizzoCerchio`, `SchizzoRiquadro`, `SchizzoSottolinea`, `SchizzoFreccia` | segni fatti "a mano" (roughjs) per cerchiare un numero o indicare qualcosa |
| `Logo` | il logo della pagina (`stile/logo.png`); nel cartello finale: `bloccoChiusura({…, logo: true})` |
| `Foto`, `Filmato` | una foto o uno screenshot, e un video preciso al fotogramma (vedi sotto "Foto e filmati") |
| `alfa`, `miscela`, `stile` | colori e look |
| `definisciReel`, `scegli` | definizione del reel e testi per lingua |

L'elenco completo, con le opzioni di ogni pezzo, è in `CATALOGO.md`; `catalogo.jpg` li mostra tutti disegnati
(`npm run catalogo` lo rifà). Prima di disegnare una cosa a mano guarda lì: è quasi sempre già pronta.

Le librerie in più si usano così, e solo così:

- **d3** per scale e forme (`scaleLinear`, `line`, `arc`, `pie`…): sono funzioni pure. Mai `d3.transition`,
  `d3.timer` o `d3.select` sul documento: dipendono dall'orologio, nel video resterebbero fermi;
- **react-icons** importando la singola icona (`import {FaHeartPulse} from 'react-icons/fa6'`), mai una raccolta
  intera: il pacchetto diventerebbe enorme;
- **roughjs** attraverso i componenti `Schizzo…`, che fissano il `seme`: lo stesso segno a ogni render.

Per una libreria che qui non c'è (three.js, Lottie, GSAP) vale la stessa regola: va bene solo se le puoi chiedere
"com'è al secondo 3,2" e risponde sempre uguale. Installala con `npm install`, provala con `npm run foto` su due
istanti diversi e solo dopo usala in una scena.

### Foto e filmati

Una **foto** (uno screenshot, la prima pagina di uno studio, un prodotto) si mette nella cartella del reel e si usa così:

```tsx
<Foto file="studio.png" x={540} y={860} larghezza={700} da={s.dopo('rivista')} didascalia="NEJM, 8 nov 2026" />
```

Entra con un piccolo rimbalzo e si avvicina piano da sola (`zoom={[1, 1.06]}` in 6 secondi; `[1, 1]` la tiene
ferma). Opzioni: `altezza` (se la scrivi, `adatta="copri"` taglia i bordi e `"contieni"` la mostra tutta), `punto`
(dove guarda lo zoom, in percentuale: `[50, 20]` = in alto al centro), `sposta` (scorre di tanti pixel: per una
pagina lunga), `ruota` (2-3 gradi: sembra appoggiata), `raggio`, `cornice={false}`, `fino`, `spento`.

Un **filmato** (una registrazione dello schermo, una clip) prima si divide in fotogrammi, una volta sola:

```bash
npm run clip <reel> registrazione.mp4 demo            # tutto il video
npm run clip <reel> registrazione.mp4 demo da=3 durata=10   # solo un pezzo
```

Nascono `reels/<reel>/clip/demo/00001.jpg…` e `clip.json`. Poi nella scena:

```tsx
import demo from './clip/demo/clip.json';

<Filmato clip={demo} x={540} y={880} larghezza={420} da={s.dopo('apri')} />

// lo schermo di un'app, dentro il telefono
<Telefono x={540} y={900} larghezza={420}>
  <Filmato clip={demo} schermo da={s.dopo('apri')} />
</Telefono>
```

Parte quando compare; con `avvio={s.dopo('tocca')}` resta sul primo fotogramma finché la voce non arriva a quel
segno. `inizio` (da che secondo della clip), `velocita` (2 = doppia), `ripeti` (alla fine ricomincia; senza, resta
sull'ultimo fotogramma). Anche `<Foto … schermo />` riempie lo schermo del telefono.

Regole:

- mai un `<video>`: nel render il tempo non scorre, resterebbe fermo o salterebbe. `Filmato` sceglie il
  fotogramma giusto per ogni istante, quindi nel video finale è preciso al fotogramma;
- l'audio della clip non viene usato: nel reel parla la voce;
- i fotogrammi pesano (10 secondi a 720 pixel sono circa 10 MB): taglia la clip al pezzo che serve con `da=` e
  `durata=`. Oltre 90 secondi il comando si rifiuta;
- se il file manca, `foto`, `provini` e `verifica` lo dicono ("non trovo … nella cartella del reel");
- foto e filmati sono di qualcuno: usa materiale della persona (le sue registrazioni, i suoi screenshot) o
  materiale che può usare, e scrivi da dove viene in `fonti.md`. Non scaricarne tu da internet.

Il reel si chiude sempre così:

```tsx
export default definisciReel({
  titolo: '…',
  atmosfera: {tinta: '#2A78E8'},            // colore della foschia per tutto il reel
  scene: {
    aggancio: Aggancio,
    orbita: {componente: Orbita, atmosfera: {tinta: '#19C7A4', raggi: 0.7}, dottore: {gesti: [['km', 'indica']]}},
  },
});
```

`dottore` è la regia del narratore in quella scena (capitolo 8): `mostra: false` per toglierlo, `gesti` per
decidere tu i gesti del personaggio fatto da un'immagine, `posa` e `umore` per il Dottore disegnato dal kit.
Se non scrivi niente il kit fa da solo, a tempo con le parole.

## 8. Il narratore

I narratori stanno in `personaggi/`, una cartella per ognuno:

| Nome | Cos'è |
|---|---|
| `dottore` | il Dottore PEPTMAP: **una sola immagine** che il kit muove a parti (testa, braccio, mani, bocca, occhi) |
| `fmlab` | il Dottore disegnato dal kit, vettoriale, con le sue pose |
| `nessuno` | reel senza narratore |

`npm run personaggio elenco` li mostra. **Chi parla in un reel, quanto è grande e dove sta** non si scrive
nelle scene: sta in `reels/<reel>/impostazioni.json` e si cambia con

```
npm run imposta <reel> narratore=dottore grandezza=100 lato=destra alza=0
```

(oppure dal pannello). `grandezza` è una percentuale da 40 a 160; `alza` lo solleva di tanti pixel; `specchia=si`
lo gira dall'altra parte, per quando sta a sinistra e deve guardare verso il centro (il logo sul camice del
Dottore PEPTMAP resta leggibile: è stato preparato con `npm run personaggio scritta`).
Le scelte di partenza per tutti i reel nuovi sono in `stile/impostazioni.json`.

**Pose e gesti.** Il personaggio fatto da un'immagine non sta fermo a parlare. Il kit ricava dal copione due
cose: la **posa** (come sta) e i **gesti** (piccoli movimenti sopra la posa).

Le pose nascono tutte dalla stessa immagine, spostando braccio, mani, spalla, testa e busto. Cambiano a ogni
frase, mai due uguali di fila, ognuna tenuta almeno due secondi; tra quelle adatte al momento il kit prende
quella che manca da più tempo, così in un reel lungo si vedono tutte:

| Posa | Com'è | Quando la sceglie il kit |
|---|---|---|
| `dito` | l'immagine com'è | tra una e l'altra, sulle enfasi |
| `alto` | il dito sale dritto vicino alla spalla | enfasi, invito finale |
| `lato` | il braccio si apre di lato | prima frase di una scena nuova |
| `aperto` | la mano aperta sale, la testa si inclina | spiegazioni, domande |
| `pensa` | il dito va al mento, la testa si inclina | domande, ogni tanto sulle enfasi |
| `presenta` | il braccio si distende verso il palco | prima frase di una scena nuova |
| `conserte` | braccia incrociate, mani infilate sotto le braccia | frasi che frenano: cominciano con "Ma", "Però", "Non…" |

**La seconda mano.** Anche l'altro avambraccio del Dottore PEPTMAP (quello con la mano aperta) è su un livello
suo e ruota dal gomito. A ogni posa il kit gli dà uno stato, così non resta mai fermo:

| Stato | Com'è | Con quali pose |
|---|---|---|
| `aperta` | la mano aperta, com'è nel disegno | `lato`, `dito`, invito finale |
| `alza` | la mano aperta sale verso il petto | `aperto`, `presenta` |
| `giu` | il braccio scende lungo il fianco, la mano esce dal quadro (come in tasca) | `alto`, `pensa`, `dito` |

Parte un attimo dopo il braccio che parla, e nei gesti `spiega` e `domanda` è lei che sale. Per tenerla sempre
in uno stato: `npm run imposta <reel> mano=giu` (o dal pannello); per una scena sola: `dottore: {seconda: 'alza'}`.

`pensa` e `presenta` ci sono nei personaggi che hanno il braccio su un livello suo, come il Dottore PEPTMAP
(`personaggi/COME-FARE.md`, capitolo 4): negli altri il kit ripiega da solo su `aperto` e `lato`.

`conserte` è una **posa disegnata**: un altro disegno intero dello stesso dottore (`personaggi/dottore-conserte`),
con bocche e palpebre sue, che prende il posto della figura finché la posa dura. Parla, batte le ciglia e fa i
cenni con la testa come l'altro; lo scambio dura quattro fotogrammi. Una posa chiusa va usata poco: il kit la
mette da solo sulle frasi che frenano, una o due volte per reel. Per chiederla: `dottore: {posa: 'conserte'}` o
`dottore: {posa: [['segno', 'conserte'], ['altro', 'lato']]}`. Chi non ha il disegno ripiega su `pensa` o `aperto`.

Una posa nuova si aggiunge allo stesso modo, da un altro disegno del personaggio (seduto, con un oggetto in
mano, il pollice in su): `npm run personaggio figura dottore <nome> <immagine>` e poi bocca e occhi, come spiega
`personaggi/COME-FARE.md` ("Pose disegnate").

| Gesto | Cosa fa | Quando parte da solo |
|---|---|---|
| `batte` | accento: il dito si prepara e batte sulla parola | sulle parole in `*enfasi*` |
| `guarda` | si volta appena verso il palco | sui `[segni]`: sta guardando quello che è comparso |
| `annuisce` | cenno del capo | a fine frase |
| `spiega` | la mano aperta sale e accompagna | nelle frasi lunghe |
| `domanda` | testa inclinata, mano aperta, un accenno di spallucce | sulle frasi che finiscono con `?` |
| `nega` | la testa fa "no", piano | su non, mai, niente, senza… (in ogni lingua) |
| `saluta` | dito in alto con un piccolo slancio | sull'invito finale (commenta, scrivi, segui…) |
| `indica` | alza un po' il dito e lo tiene | solo se lo chiedi nella regia |

Come sono costruiti i movimenti: ogni gesto ha preparazione, colpo, tenuta e ritorno; il colpo cade sulla
parola (la preparazione parte un quarto di secondo prima); tra due gesti dello stesso braccio passa almeno un
secondo e mezzo; la mano segue il braccio e la testa segue il corpo con un filo di ritardo. Da una posa
all'altra il braccio va come un braccio vero: parte piano, arriva piano, e si prende più tempo se la strada è
lunga. La faccia partecipa: quando si volta, il viso scorre un poco dentro la testa; quando parla, il mento
sale e scende con la bocca, che si stringe sulla "u" e sulla "o". In più respira, sposta piano il peso e sbatte
le palpebre a intervalli irregolari (e sempre quando cambia posa). Quindi: **le parole a cui metti l'enfasi e
i segni del copione decidono anche quando gesticola**. Di solito non serve altro. Se in una scena vuoi decidere tu:

```tsx
orbita: {componente: Orbita, dottore: {posa: 'pensa'}},                                   // una posa per tutta la scena
tempo: {componente: Tempo, dottore: {posa: [['veloce', 'lato'], ['dieci', 'alto']]}},      // cambi sui segni (o secondi)
cerchi: {componente: Cerchi, dottore: {gesti: [['punto', 'batte'], [6.5, 'spiega']]}},     // gesti scelti a mano
distanza: {componente: Distanza, dottore: {gesti: false}},                                 // solo respiro, labiale e ciglia
chiusura: {componente: Chiusura, dottore: {mostra: false}},                                // in questa scena non c'è
```

Un personaggio può ritoccare le pose o aggiungerne di sue in `personaggio.json`, alla voce `pose`
(`personaggi/COME-FARE.md`). Pose con un atteggiamento che nell'immagine non esiste (seduto, braccia conserte)
non si ricavano da un'immagine sola: servono altri disegni dello stesso personaggio.

Per il Dottore disegnato dal kit (`fmlab`) la regia usa le pose: `dottore: {posa: 'dito'}` oppure una lista di
cambi `[['km', 'dito'], ['sat', 'spalle']]` tra `base`, `dito`, `spalle`, `pensa`, `indica`, `saluta`,
`telefono`; `umore` è `neutro`, `felice` o `sorpreso`. Senza regia cambia posa a ogni frase.

**Un personaggio nuovo da un'immagine.** Serve una sola immagine: mezzo busto, sfondo a tinta unita, bocca
aperta, braccia staccate dal corpo. Poi:

```
npm run personaggio nuovo <nome> <immagine> "Nome da mostrare"       toglie lo sfondo, crea la cartella
npm run personaggio bocca <nome> <x1,y1> <x2,y2> <apertura>          crea le bocche, da aperta a chiusa
npm run personaggio occhi <nome> <x1,y1> <x2,y2> <su> <giu> [secondo occhio]   crea gli occhi chiusi
npm run personaggio prova <nome>                                     foglio con tutti i gesti: guardalo
```

Le "ossa" (quale parte dell'immagine è testa, braccio, mano, e attorno a quale punto ruota) si scrivono in
`personaggi/<nome>/personaggio.json`. Come trovare le coordinate, cosa guardare nel foglio di prova e il testo
da dare a un generatore di immagini sono in `personaggi/COME-FARE.md`. Finché non hai guardato il foglio di
prova e non è pulito, il personaggio non è pronto.

## 9. 2D o 3D

Ogni reel ha uno stile (`npm run imposta <reel> stile=2d|3d|auto`). Con `auto` scegli tu, al passo del piano.

**Come si sceglie**

- **3D** quando il protagonista è una *cosa* che esiste e ha un volume: organi, cellule, molecole, pianeti,
  satelliti, motori, macchine, farmaci, oggetti. Vedere la cosa che gira spiega più di una frase.
- **2D** quando il protagonista è un'*idea*: soldi, percentuali, regole, classifiche, confronti, abitudini,
  passi da seguire. Lì il volume distrae: servono numeri grandi, linee e schemi puliti.
- Nel dubbio guarda il nome dell'oggetto protagonista scritto nel piano: se lo potresti tenere in mano o
  fotografare, 3D; se è una parola astratta, 2D.
- Uno stile solo per reel. In un reel 3D le scritte, i numeri e le linee restano piatti (devono leggersi): è
  l'oggetto protagonista ad avere il volume. In un reel 2D non c'è nessun oggetto 3D.

**Come si fa il 3D.** Le forme sono funzioni che restituiscono facce; si mettono in fila e si passano a
`<Scena3D>`, che le illumina e le disegna dalla più lontana alla più vicina.

```tsx
const oggetti = [
  ...fiala3d({liquido: C.luce, livello: rampa(s.dopo('dose'), 0.8), pos: [-110, 0, 0]}),
  ...scatola({misure: [180, 120, 90], colore: C.luce2, pos: [150, 0, 0], ruota: [0, s.t * 30, 0]}),
  ...ombra({pos: [0, -120, 0], raggio: 220}),
];
const camera = {giro: 20 + s.t * 5, alza: 18, distanza: 1300};
<Scena3D oggetti={oggetti} x={540} y={880} camera={camera} />
```

- Assi: x a destra, **y in alto**, z verso chi guarda. Misure in pixel del video.
- Forme: `scatola`, `cilindro` (con `raggioAlto` diventa tronco di cono o cono), `sfera`, `capsula`, `anello`,
  `piano`, `griglia`, `linea3d`, `estrusione` (un profilo piatto reso spesso), `ombra`. Tutte accettano `pos`,
  `ruota` (gradi attorno a x, y, z), `scala`, `emissione` (0…1: luminoso di suo), `opacita`, `bagliore`.
- `gruppo(facce, {pos, ruota, scala})` sposta e ruota un oggetto fatto di più pezzi.
- Oggetti pronti in `libreria/Modelli.ts`: `satellite3d`, `telefono3d`, `fiala3d`, `pillola3d`, `siringa3d`,
  `molecola3d`, `dna3d`, `ginocchio3d`, `cuore3d`, `moneta3d`, `stella3d`, `provetta3d`, `flacone3d`, `bilancia3d`, `scudo3d`, `lente3d`, `barre3d`, `freccia3d`. Per uno nuovo
  copia il più simile e cambia i pezzi: sono poche righe (poi mettilo nel catalogo).
- Camera: `giro` (gradi attorno all'oggetto), `alza` (gradi dall'alto), `distanza` (più piccola = prospettiva
  più forte), `zoom`, `mira`. **Falla muovere sempre un po'** (`giro: 20 + s.t * 5`) e fai ruotare piano
  l'oggetto: è il movimento che fa leggere il volume.
- Per agganciare una scritta o una linea a un punto dell'oggetto: `const p = proietta([0, 120, 0], camera, [540, 880])`
  e poi `<Etichetta x={p.x} y={p.y - 40} … />`.
- Se un oggetto 3D deve passare dietro e davanti a una scritta, usa due `<Scena3D>`: una prima della scritta
  con le facce dietro, una dopo con quelle davanti (vedi la scena `chiusura` di `reels/gps/scene.tsx`).
- Tieni le scene sotto le 3.000 facce circa: una sfera con 12 paralleli e 20 meridiani ne ha 240.

**Come si fa il 2D.** Con tutto il resto della libreria: `Cifra`, `Targa`, `Linea`, `Onde`, gli oggetti piatti di
`Oggetti.tsx`, schemi disegnati in SVG. La profondità la danno la luce (`Bagliore`), la camera (`vistaA`) e i
piani inclinati (vedi `Piano` nel reel d'esempio), non il volume.

La verifica controlla che lo stile scelto sia quello che si vede: con `3d` almeno una scena deve usare
`<Scena3D>`, con `2d` nessuna.

## 10. La voce

| Motore | Quando | Sincronia |
|---|---|---|
| `elevenlabs` | video finale | esatta, carattere per carattere |
| `mac` | senza chiave, su Mac | esatta sulle frasi e sulle pause, stimata dentro la frase |
| `comando` | qualsiasi altro servizio di voce (`voci/COME-FARE.md`) | esatta sulle frasi e sulle pause |
| `stima` | mentre costruisci le scene | stimata, video muto |

`npm run voce <reel>` usa il motore e la voce scelti per quel reel (dal pannello, o con
`npm run imposta <reel> voce=mac`). Se la scelta è `auto`: ElevenLabs se nel file `.env` ci sono chiave e voce,
altrimenti il servizio di `FMLAB_VOCE_COMANDO`, altrimenti la voce del Mac, altrimenti la stima.
Per forzare una volta: `npm run voce <reel> mac`.

**La voce a pagamento si paga una volta, frase per frase.** Con ElevenLabs e con il motore `comando` ogni frase
è una richiesta a sé: quelle già pagate (`voci/pagate/`) si riusano, se cambi una frase paghi solo quella, e
`npm run voce` scrive quante ne ha pagate e quante ne ha riusate. Le frasi della **banca** (`voci/frasi/`, tagliate
da una registrazione con `npm run frasi audio.mp3 testo.txt`) non si pagano mai, purché nel testo siano scritte
uguali e il reel usi la voce del file `.env`. Spostare o aggiungere `[segni]` ed `*enfasi*` non cambia il testo:
non costa niente e non serve nemmeno rilanciare la voce, il kit riallinea da solo. Per rifarla comunque:
`npm run voce <reel> nuova` (le frasi della banca restano quelle). `ELEVENLABS_FRASI=no` torna a una richiesta sola.

**Effetti sonori.** Nella cartella `suoni/` ci sono otto effetti di serie, generati dal kit (nessun diritto da
chiedere): `pop` (una cosa che compare), `clic` (un passo di una lista), `ding` (un numero importante), `whoosh`
(un cambio di scena), `tonfo` (una cosa pesante che arriva), `sale` (un conto che cresce), `successo`, `errore`.
Si chiamano dal copione, davanti alla parola su cui devono partire:

```
Con la Reta il dolore [suono:sale][calareta]è diminuito fino a quasi [suono:ding][quattro]*quattro* punti.
```

Non entrano nel testo letto dalla voce, e si spostano senza rifarla. Regole: pochi (4-6 per reel, sui momenti
che contano: troppi stancano), mai sopra una parola importante da capire, sempre lo stesso suono per lo stesso
tipo di cosa. La persona può aggiungerne di suoi: un file `wav`, `mp3` o `m4a` in `suoni/` (per tutti i reel) o
in `reels/<reel>/suoni/` (solo per quello), con un nome semplice e minuscolo: `[suono:nome]`. `npm run suoni` li
elenca. Il volume di tutti è `FMLAB_VOLUME_SUONI=60` nel file `.env` (0 li spegne). Non scaricare suoni tu: usa
quelli di serie o quelli messi dalla persona. Se il file di un suono chiesto manca, il render si ferma e lo dice.

**Musica di sottofondo.** Se nella cartella del reel c'è un file `musica.mp3` (o `.m4a`, `.wav`, `.aac`) è quello,
sempre: lo mette la persona, e deve averne i diritti. Altrimenti il kit usa una delle sue quattro trame ambientali
(`quiete`, `marea`, `brina`, `orbita`), che genera da solo e non hanno diritti: con `musica=auto` è quella che il
regista di serie ha scritto in `piano.json` dal nome del reel, con `npm run imposta <reel> musica=<nome>` quella
scelta a mano, con `musica=no` nessuna. Il volume è `npm run imposta <reel> musica=30` (da 0 a 100), o dal pannello.
La musica sta sotto la voce e si abbassa ancora mentre la voce parla, come sempre.

Per ElevenLabs copia `.env.esempio` in `.env` e riempi `ELEVENLABS_API_KEY` ed `ELEVENLABS_VOICE_ID`.
Non scrivere mai la chiave in altri file e non mostrarla.

Se ElevenLabs risponde che il numero di parole non coincide, nel copione c'è una cifra o un simbolo:
scrivilo in lettere.

Voce del Mac: il kit sceglie la migliore voce installata per la lingua del reel. Per sceglierne un'altra,
`FMLAB_VOCE_MAC=Luca` nel file `.env` (l'elenco: `say -v ?` nel Terminale). Le voci "Premium" ed "Enhanced" si
scaricano da Impostazioni di Sistema → Accessibilità → Contenuto letto ad alta voce → Voce di sistema.

**Senza voce generata il video e l'anteprima sono muti**: finché `parole.json` dice `stima` non c'è nessun file
audio. Dillo alla persona quando le mostri una bozza fatta con i tempi stimati.

## 11. Altre lingue

Le scene sono agganciate ai segni, non ai secondi: lo stesso `scene.tsx` vale per tutte le lingue.

1. Copia `copione.md` in `copione.en.md` (o `.es`, `.fr`, `.de`, `.pt`…), metti in cima `<!-- lingua: en -->`
   e traduci. **Stessi `[scena:…]` e stessi `[segni]`**, messi davanti alla parola che corrisponde.
2. Aggiungi la lingua al dizionario `TESTI` in `scene.tsx`.
3. `npm run voce <reel> en`, poi `provini`, `render`, `verifica` sempre con `en` dopo il nome.

Escono `parole.en.json`, `voce.en.mp3`, `<reel>.en.mp4`. Per una voce diversa in quella lingua:
`ELEVENLABS_VOICE_ID_EN` nel file `.env`. Traduci anche `didascalia.md`.

Le lingue scritte senza spazi (giapponese, cinese, tailandese) si dividono in parole da sole: nel piano e nei
segni si indica la parola com'è scritta nel testo. Le parole lunghe (tedesco) stringono il corpo dei sottotitoli.

## 12. Cosa controlla la verifica

- la voce corrisponde al copione attuale; durata, ritmo, lunghezza dell'aggancio;
- ogni scena del copione ha il suo codice; mai troppi secondi senza un segno; sottotitoli leggibili;
- `fonti.md` esiste, ha gli indirizzi, non ha righe "DA VERIFICARE";
- nessun errore lungo tutto il reel; scritte e sottotitoli dentro le zone sicure;
- nessuna scritta finisce sotto il narratore; lo stile scelto (2D o 3D) è quello che si vede davvero;
- il video è 1080x1920, H.264, con il numero giusto di fotogrammi e l'audio;
- fotogrammi presi dal video coincidono con quello che le scene disegnano in quegli istanti.

Il rapporto resta in `verifica.md`: chiunque può rileggerlo o rilanciare il comando. Quello che la verifica
non può fare, e che va detto alla persona: ascoltare se la voce suona bene, e controllare che le fonti dicano
davvero ciò che il copione afferma. Per questo `fonti.md` ha gli indirizzi: si aprono e si legge.

## 13. Salute, medicina, sostanze: regole fisse

Valgono per ogni reel che parla di corpo, farmaci, integratori, peptidi, diete, allenamento.

- Fonti: studi pubblicati, registri delle sperimentazioni, enti regolatori. Mai solo siti di chi vende.
- Di' sempre **che tipo di prova è**: cellule, animali o persone; quante persone; quale fase; chi ha pagato lo
  studio, se è noto. "Uno studio su 40 persone" non si racconta come "funziona".
- Di' **lo stato della sostanza**: approvata o no, per cosa, dove; se è vietata nello sport.
- Niente dosi, schemi di assunzione, modi per procurarsela, consigli a chi guarda. Niente promesse di risultato.
- Riporta anche gli effetti indesiderati e ciò che non si sa ancora.
- Il narratore è un personaggio illustrato, non un medico che visita. In `didascalia.md` metti sempre:
  "Contenuto informativo, non è un consiglio medico."
- Se la richiesta va oltre queste regole, fai il reel dentro le regole e spiega alla persona cosa hai tolto.

## 14. Se qualcosa va storto

| Messaggio | Cosa fare |
|---|---|
| "Non trovo Google Chrome" | Installarlo, oppure indicare un altro browser in `.env` con `FMLAB_CHROME=…` |
| "Non trovo ffmpeg" | `npm install` di nuovo; oppure `FMLAB_FFMPEG=…` in `.env` |
| "Il segno [x] non esiste nel copione" | Nome sbagliato in `scene.tsx`, oppure il segno manca in `copione.md` (o, per un'altra lingua, in `copione.<lingua>.md`) |
| "La scena x è nel copione ma manca in scene.tsx" | Aggiungi il componente e mettilo in `scene:` |
| "Il copione è stato modificato dopo aver generato la voce" | `npm run voce <reel>` |
| "Errore nella scena x al secondo …" | È un errore nel codice di quella scena: il messaggio dice quale, correggi e rilancia |
| Il video non coincide con le scene | Hai cambiato qualcosa dopo il render: rifallo |
| "Foto/Filmato: non trovo …" | Il file non è nella cartella del reel, o il nome è scritto diverso (maiuscole comprese). Per un filmato: `npm run clip <reel> <file> <nome>` |
| Nel video una clip resta ferma | È stata messa con `<video>`: usa `<Filmato>` (capitolo 7) |
| Render lento | `npm run render <reel> bozza` per le prove; `FMLAB_LAVORATORI=2` (o 3, 4) in `.env` |
| "Il narratore … non esiste" | Nome sbagliato in `impostazioni.json`: `npm run personaggio elenco` dice quali ci sono |
| "Scritta coperta dal narratore" | Sposta la scritta, oppure `npm run imposta <reel> grandezza=…` più piccolo |
| "Lo stile scelto è 3D ma nessuna scena usa oggetti 3D" | Costruisci il protagonista con `<Scena3D>` (capitolo 9) o passa a `stile=2d` |
| Il personaggio "si strappa" o ha parti doppie quando gesticola | Le ossa in `personaggio.json` sono fuori posto: `personaggi/COME-FARE.md` |
| Il video o l'anteprima non hanno voce | La voce non è stata generata (`parole.json` dice `stima`): `npm run voce <reel>`, poi di nuovo il render |

## 15. Cosa non fare

- Non inventare numeri, studi, citazioni. Se manca la fonte, manca la frase.
- Non saltare i provini e non consegnare un video senza verifica.
- Non toccare `motore/` per un reel: lì c'è il motore, vale per tutti. I pezzi nuovi vanno in `libreria/`.
- Non copiare personaggi, loghi o grafiche di altri: tutto quello che disegni è originale.
- Non pubblicare e non mandare niente a nome della persona.
- Non scrivere nelle scene chi è il narratore o quanto è grande: sta in `impostazioni.json`.

## 16. Il pannello (la dashboard)

**Si accende da sola al tuo primo `npm run stato`** e si apre nel browser sulla pagina "Adesso": chi ti segue vede
in diretta il comando in corso, la tappa, la percentuale del render, i provini, gli errori e i crediti. Tutto quello
che lanci finisce nel registro (`.fmlab/registro.jsonl`): non devi fare niente perché si veda. Dalla dashboard la
persona può mettere in coda **richieste**: `npm run stato` te le mostra (`[id] reel: testo`, e sotto, se ci sono
pulsanti scelti, `→ npm run imposta …` da lanciare così com'è). Falle in ordine, poi `npm run richieste fatta <id>`.
Le pagine Riferimenti, Chiavi, Catalogo e Diario sono per la persona; a te servono `diario.md` (leggilo prima di un
reel nuovo) e la regola delle chiavi: stanno solo nel file `.env`, non chiederle e non stamparle.

`npm run pannello` apre una pagina nel browser; `npm run pannello rete` la rende raggiungibile anche dal
telefono, sulla stessa rete Wi-Fi. Si entra con il codice che compare nel Terminale.

Dal pannello la persona può:

- **scrivere la richiesta di un nuovo reel**: argomento, lingua, durata, narratore (o nessuno), grandezza e
  lato con l'anteprima nel telefono disegnato, stile 2D / 3D / automatico, parola dell'invito finale.
  Il pannello crea `reels/<nome>/` con `richiesta.md` e `impostazioni.json` e le dà la frase da passare a te;
- **cambiare narratore, grandezza, seconda mano, stile, volume della musica e formato** (verticale, quadrato,
  orizzontale) di un reel che esiste già;
- **"Fai il reel"**, per un reel nato da un testo già scritto: le otto tappe di `npm run fai` una dopo l'altra, con
  il sì della persona prima della voce a pagamento;
- **copiare i prompt pronti** (quelli di `PROMPT.md`) e **guardare il catalogo** di tutto quello che è già fatto,
  nella scheda "Catalogo e prompt";
- **lanciare voce, provini, bozza, video finale e verifica**, e seguire l'avanzamento;
- **guardare l'anteprima con l'audio** e il video finito.

Per te cambia una cosa sola: quando esiste `richiesta.md`, è quella la richiesta. Leggila tutta, rispetta le
scelte che contiene, e alla fine verifica che `impostazioni.json` dica ancora quello che la persona ha scelto.

Se nel file `.env` c'è la riga `FMLAB_AGENTE=…` (il comando con cui la persona ti avvia dal Terminale), il
pannello mostra anche il pulsante "Avvia l'agente": lancia quel comando nella cartella del kit passandogli la
frase della richiesta. Da un altro dispositivo funziona solo con `FMLAB_AGENTE_RETE=si`.

## 17. Scene pronte e modelli

`libreria/Blocchi.tsx` contiene scene intere già fatte. Ognuna è una funzione che restituisce la scena: si
scrive solo il contenuto. La tabella completa dei parametri è in `CATALOGO.md`.

| Blocco | Cosa mostra |
|---|---|
| `bloccoTitolo` | una frase grande al centro: aggancio, titolo di capitolo |
| `bloccoNumero` | un numero che sale fino al valore, con unità, nota e fonte |
| `bloccoLista` | fino a cinque voci numerate, una alla volta |
| `bloccoConfronto` | due colonne A contro B (solidi veri in stile 3D) |
| `bloccoBarre` | grafico a colonne, fino a sei (solidi veri in stile 3D) |
| `bloccoAnello` | una percentuale in un anello che si riempie |
| `bloccoPassi` | passi che si accendono lungo una linea |
| `bloccoMito` | "si dice che…" barrato, e sotto come stanno le cose |
| `bloccoOggetto` | un oggetto 3D che gira, con le etichette agganciate alle sue parti |
| `bloccoChiusura` | il cartello finale con l'invito |
| `bloccoLinea` | una linea che si disegna nel tempo, con il valore in testa |
| `bloccoTorta` | una ciambella che si apre, con la legenda; una fetta si può staccare |
| `bloccoClassifica` | barre orizzontali, dalla prima all'ultima; una si può accendere |
| `bloccoIcone` | da due a sei icone con il nome, una alla volta |
| `bloccoScala` | una scala graduata con i cursori (dolore da 0 a 10, voti); un cursore può scorrere "da 6 a 2" |
| `bloccoSchede` | due o tre schede con un numero ciascuna e il totale sotto (gli studi, i piani) |
| `bloccoAvviso` | il triangolo d'avviso con una frase e fino a tre righe (rischi, effetti indesiderati) |
| `bloccoCitazione` | una frase tra virgolette, con chi l'ha detta |
| `bloccoSigla` | il logo della pagina che si accende, con il nome: per aprire o chiudere |
| `bloccoEbook` | l'ebook regalo su un tablet 3D che gira, con l'invito sotto: per la chiusura "Commenta MAPPA" |
| `bloccoDomanda` | l'aggancio in forma di domanda, con il punto interrogativo grande dietro |
| `bloccoStudio` | la scheda di uno studio: dove è uscito, titolo, dati, chi lo ha finanziato |
| `bloccoPersone` | "2 persone su 10": una fila di omini, quelli che contano si accendono (percentuali, rischi) |
| `bloccoTempo` | una linea del tempo con fino a quattro tappe (durata di uno studio, prima e dopo) |
| `bloccoSchermo` | un telefono con dentro uno screenshot o una registrazione dello schermo (un'app, un sito) |

Regole comuni:

- ogni testo può essere una scritta (`'ciao'`) oppure una per lingua (`{it: 'ciao', en: 'hi'}`): il reel si
  traduce senza toccare altro;
- `segno` è il nome di un `[segno]` del copione; può anche essere un numero (secondi dall'inizio della scena)
  o mancare (gli elementi si distribuiscono da soli lungo la scena). Un segno scritto ma assente dal copione
  dà errore, con il nome;
- i testi si rimpiccioliscono da soli per stare nello spazio, ma restano leggibili solo se sono corti:
  titoli entro 30 caratteri, voci di lista entro 45;
- stanno dentro le zone sicure e non finiscono sotto il narratore a grandezza 100%.

Blocchi e scene scritte a mano si mescolano nello stesso reel:

```tsx
scene: {
  aggancio: bloccoTitolo({titolo: 'Il GPS non sa dove sei', segno: 'sorpresa'}),
  orbita: {componente: Orbita, atmosfera: {tinta: '#19C7A4'}},      // scritta a mano
  quota: {componente: bloccoNumero({valore: 20200, unita: 'km di quota', segno: 'km'}), dottore: {posa: 'alto'}},
  chiusura: bloccoChiusura({parola: 'GPS'}),
},
```

I **modelli** (`motore/modelli/`) sono reel già montati con questi blocchi: `npm run nuovo <reel> "Titolo" lista`.
Per un tipo di reel che torna spesso, aggiungi una cartella lì con `copione.md`, `scene.tsx` e `modello.json`
(la descrizione): compare da sola nell'elenco e nel pannello. Per un blocco nuovo che torna spesso, aggiungilo
a `libreria/Blocchi.tsx` con lo stesso schema degli altri, poi a `motore/web/catalogo.tsx` e a `CATALOGO.md`
(`npm test` controlla che ci siano tutti e due) e rifai il foglio con `npm run catalogo`.

## 18. Spendere meno (crediti dell'agente e della voce)

- **Leggi poco**: `SCHEDA.md`, `stile/appunti.md` e i file del reel. La libreria non va riletta se usi i blocchi.
- **`npm run stato <reel>`** al posto di riaprire copione, tempi e impostazioni: dà scene, segni, voce, video,
  verifica e il prossimo passo in una schermata.
- **Parti da un modello** e scrivi a mano solo la scena che nessun blocco copre.
- **Chiudi ogni reel con `npm run riuso <reel>`** (capitolo 4, passo 12): quello che può riservire entra in
  libreria e nel catalogo. È il risparmio più grande: la seconda volta la scena è una riga, non cento.
- **Un foglio di provini** (`npm run provini`) invece di tante foto; `npm run foto` solo sul punto da controllare.
- **Niente render per controllare un dettaglio**: bozza al massimo una volta, render finale una volta.
- **Voce**: tempi stimati finché le scene non sono a posto; la voce a pagamento una volta, alla fine.
  Rilanciare `npm run voce` con lo stesso testo riusa l'audio e non costa.
- **`npm test`** (pochi secondi) dopo aver toccato `libreria/` o `motore/`; `npm run collaudo` solo quando cambi
  computer o qualcosa non parte.
