# I narratori: come sono fatti e come se ne aggiunge uno

Ogni narratore è una cartella dentro `personaggi/`. Chi parla in un reel, quanto è grande e dove sta si
sceglie reel per reel (`npm run imposta <reel> narratore=…` oppure dal pannello), non qui.

| Cartella | Cos'è |
|---|---|
| `dottore/` | il Dottore PEPTMAP: una sola immagine, mossa a parti dal kit |
| `fmlab/` | il Dottore disegnato dal kit (vettoriale, con le sue pose) |

## Un personaggio da una sola immagine

Il kit prende **un'immagine** e la fa vivere: gira e inclina la testa, alza, abbassa e piega il braccio fino a
portarlo davanti al petto, muove le mani, apre e chiude la bocca sulle sillabe (e con lei si muove il mento),
sbatte le palpebre. Non servono altre pose.

Nella cartella trovi:

| File | Cos'è |
|---|---|
| `base.png` | l'immagine senza sfondo, con la **bocca aperta** |
| `bocca-*.png` | piccoli pezzi: la stessa bocca via via più chiusa |
| `occhi-*.png` | piccoli pezzi: occhi socchiusi e chiusi |
| `scritta-specchio.png` | il logo già ribaltato: serve quando il personaggio viene specchiato |
| `livello-*.png` | una parte ritagliata su un'immagine sua (l'avambraccio con la mano) |
| `corpo.png` | l'immagine senza le parti ritagliate sui livelli |
| `personaggio.json` | nome, misure nel video, "ossa", livelli, pose |
| `anteprima.png` | la miniatura che si vede nel pannello |
| `prova.jpg` | il foglio di prova con tutte le pose e i gesti |

### 1. L'immagine giusta

- mezzo busto, **sfondo a tinta unita** (nero, bianco o verde);
- **bocca aperta** mentre parla (quella chiusa la crea il kit);
- **braccia e mani staccate dal corpo** e dalla testa: una mano che copre il petto si muove peggio di una
  alzata di lato;
- grande almeno 1000 pixel di lato.

Testo che funziona con un generatore di immagini:

> Personaggio illustrato a mezzo busto, sfondo nero uniforme. [Descrizione: viso, capelli, vestiti, logo.]
> Guarda leggermente di lato, sorride con la bocca aperta mentre parla. Un braccio alzato di lato con l'indice
> che punta in alto, l'altra mano aperta davanti a sé con il palmo in su. Braccia ben staccate dal corpo.
> Stile cartoon pulito, luce morbida, contorni netti.

### 2. I comandi

```
npm run personaggio nuovo <nome> <immagine> "Nome da mostrare"
npm run personaggio griglia <nome>                      l'immagine con una griglia numerata: serve per le coordinate
npm run personaggio griglia <nome> <x1,y1> <x2,y2>      lo stesso, ingrandito su un ritaglio (bocca, occhi)
npm run personaggio bocca <nome> <x1,y1> <x2,y2> <apertura>
npm run personaggio occhi <nome> <x1,y1> <x2,y2> <su> <giu> [<x1,y1> <x2,y2> <su> <giu>]
npm run personaggio scritta <nome> <x1,y1> <x2,y2> [sposta <dx,dy>]      solo se ha una scritta o un logo addosso
npm run personaggio livello <nome>                      ritaglia le parti descritte in personaggio.json (capitolo 4)
npm run personaggio pulisci <nome>                      toglie i puntini rimasti attorno alla figura
npm run personaggio prova <nome>                        il foglio con tutte le pose e i gesti
npm run personaggio prova <nome> mosse.json             un foglio con le mosse che scrivi tu (capitolo 6)
```

Tutte le coordinate sono in pixel dell'immagine e si leggono sulla griglia (gialle le x, azzurre le y).

- **nuovo** toglie lo sfondo e pulisce il bordo: attorno a una figura scontornata restano spesso dei puntini,
  che su un fondo scuro non si notano ma si vedono appena una mano passa davanti al camice. Per un personaggio
  creato prima di questa pulizia c'è `pulisci`.
- **bocca**: i due angoli della bocca, da sinistra a destra, sulla linea del labbro di sopra; `apertura` è
  l'altezza in pixel tra le labbra al centro. Escono quattro bocche, da quasi aperta a chiusa.
- **occhi**: per ogni occhio i due angoli, da sinistra a destra; `su` è di quanti pixel l'occhio sale sopra
  la linea tra i due angoli (ciglia comprese), `giu` di quanti scende sotto. La palpebra viene dipinta con il
  colore della pelle preso appena sotto l'occhio: occhiali e sopracciglia non si muovono.
- **scritta**: il riquadro attorno a una scritta o a un logo sul vestito (largo quanto basta, tutto sul
  tessuto). Serve per quando il personaggio viene specchiato (messo a sinistra, deve guardare verso il centro):
  una scritta specchiata si leggerebbe al contrario. Il comando prepara un pezzo in cui la scritta è già
  ribaltata sul posto, così nel video specchiato torna dritta. Le linee del disegno che attraversano il
  riquadro (un risvolto, una tasca) restano dove sono. Se la scritta ribaltata finisce sopra una di queste
  linee, `sposta 12,8` la muove di tanti pixel (a destra, in basso).

Dopo ogni comando rifai la griglia sul ritaglio, o il foglio di prova, e guarda: se la bocca chiusa lascia
un filo di denti aumenta `apertura` di 2-3 pixel; se la palpebra copre il bordo degli occhiali diminuisci `su`.

### 3. Le ossa

In `personaggio.json`, alla voce `ossa`, ogni parte che si muove ha:

- `zona`: il contorno della parte che si muove **tutta insieme**, come poligono (`{"tipo": "poligono",
  "punti": [[x, y], …]}`) o ellisse (`{"tipo": "ellisse", "centro": [x, y], "raggi": [rx, ry]}`);
- `perno`: il punto attorno a cui ruota (il collo per la testa, il gomito per l'avambraccio, il polso per
  la mano);
- `sfuma`: di quanti pixel, oltre la zona, il movimento si spegne. È la "pelle" che si piega: 40-50 per la
  testa, 25-35 per una mano;
- `genitore` (facoltativo): l'osso a cui è attaccato. La mano ha per genitore il braccio;
- `livello` (facoltativo): il nome del livello che quell'osso muove (capitolo 4).

Il kit conosce questi nomi, e muove solo quelli che trova:

| Osso | Cos'è | Chi lo muove |
|---|---|---|
| `testa` | testa e capelli, perno alla base del collo | pose, annuisce, domanda, nega, e sempre mentre parla |
| `viso` | occhi, occhiali, naso e bocca, genitore `testa` | scorre di pochi pixel dentro la testa: è ciò che fa sembrare che si giri (guarda, nega) |
| `mascella` | mento e barba sotto la bocca, genitore `testa` | il labiale: sale quando la bocca si chiude |
| `bocca` | un'ellisse attorno alla bocca, genitore `testa` | il labiale: si stringe sulla "u" e sulla "o" |
| `spalla` | la parte alta del braccio, perno alla spalla | pose e gesti: il gomito si sposta un po', come in un braccio vero |
| `braccio` | l'avambraccio che indica, mano compresa, perno al gomito | pose, indica, batte, saluta |
| `mano` | la mano di quel braccio, perno al polso, genitore `braccio` | pose, batte |
| `palmo` | l'altra mano, quella aperta, perno al polso | pose, spiega, domanda |

`viso`, `mascella`, `bocca` e `spalla` sono facoltativi: senza, il personaggio funziona lo stesso, ma è meno vivo.
Quanto si muovono mento e bocca si regola con `"labiale": {"mascella": 7, "stringe": 0.15}` (pixel di cui sale
il mento a bocca chiusa; di quanto si stringe la bocca).

Regole pratiche:

- la zona deve contenere **tutta** la parte (anche dita, capelli, orecchie) e **niente** di ciò che deve
  restare fermo (colletto, logo, tasche);
- il perno sta dentro il corpo, sull'articolazione, non al centro della zona;
- dove una mano sta davanti al corpo, tieni `sfuma` piccolo (25-30): di più trascina anche il vestito dietro;
- la zona del `viso` sta dentro la faccia (non arriva a capelli, orecchie e contorno): `sfuma` 45-50;
- la zona della `mascella` comincia sotto il labbro inferiore: `sfuma` 20-25;
- `npm run personaggio griglia <nome>` disegna le ossa sopra l'immagine: si vede subito se una zona è storta.

### 4. I livelli: un braccio che passa davanti al corpo

Con le sole ossa un braccio ruota di una trentina di gradi: oltre, tira con sé il vestito che ha accanto.
Per farlo ruotare tanto (fino a portare il dito al mento) la parte va **ritagliata su un'immagine sua**, che
sta sopra il corpo e ruota per intero attorno al gomito. È un livello.

Il comando `npm run personaggio livello <nome>` fa tutto da solo partendo da una ricetta scritta in
`personaggio.json`: crea `livello-<nome>.png` (la parte) e `corpo.png` (l'immagine senza la parte, con il
contorno ridisegnato dove prima c'era il braccio). **A riposo il personaggio è identico all'immagine di
partenza**: la parte copre esattamente il punto da cui è stata tolta (lo controlla anche `npm run collaudo`).

```json
"livelli": [
  {
    "nome": "braccio",
    "segue": ["spalla"],
    "ombra": 0.3,
    "taglio": {
      "giro":  [[317, 1069], [308, 1090], [240, 1112], [0, 1112], [0, 400], [300, 400], "…", [309, 818]],
      "bordo": [[311, 817], [323, 829], "…", [359, 993], [324, 1048], [317, 1069]],
      "sfuma": [8, 10, 10],
      "sotto": [[309, 818], [304, 832], "…", [312, 1066]],
      "spessore": 4
    }
  }
]
```

I punti si leggono sulla griglia ingrandita del gomito (`npm run personaggio griglia <nome> 240,740 480,1120`):

- **giro**: il contorno esterno della parte. Parte dal **perno** (la punta del gomito, sul contorno del disegno),
  scende nello sfondo, gira largo attorno all'avambraccio e alla mano e risale fino all'**incavo**, il punto in
  cui avambraccio e braccio si separano. Passa sempre nello sfondo: non deve tagliare niente.
- **bordo**: il lato interno, dall'incavo di nuovo al perno, lungo la piega della manica (la linea scura dove
  l'avambraccio sta sopra il braccio). Bastano punti presi a occhio: il taglio si aggancia da solo alla linea
  disegnata.
- **sfuma** `[da, a, larghezza]`: i tratti di `bordo` (numerati da 0) in cui non c'è nessuna linea disegnata,
  di solito l'ultimo pezzo prima del gomito. Lì il taglio viene sfumato di `larghezza` pixel, e non si vede.
- **sotto**: dove finisce il braccio che resta sul corpo, dall'incavo al perno, con una curva morbida che
  prosegue il contorno del braccio. Lungo questa linea viene disegnato il contorno nuovo (`spessore` pixel,
  dello stesso colore degli altri contorni). A riposo è nascosta dall'avambraccio; si vede quando il braccio
  si distende.
- **segue**: le ossa del corpo che il livello segue per intero (la `spalla`: se si alza, l'avambraccio va con lei).
- **ombra** (0…1): l'ombra che la parte getta sul corpo quando ci passa davanti. A riposo non c'è.

Poi, nelle ossa:

```json
"braccio": {"perno": [312, 1066], "zona": {"tipo": "tutto"}, "sfuma": 1, "genitore": "spalla", "livello": "braccio"},
"mano":    {"perno": [188, 738], "zona": {"tipo": "poligono", "punti": ["…"]}, "sfuma": 30, "genitore": "braccio", "livello": "braccio"}
```

`"zona": {"tipo": "tutto"}` vuol dire "tutto il livello": l'avambraccio ruota per intero, senza piegarsi.
Un braccio su un livello **ruota soltanto** (non si sposta: si staccherebbe dal gomito), e può andare molto
più lontano: lo dici al kit con `"limiti": {"braccio": [-40, 58]}`.

Controlla sempre con il foglio di prova e con un foglio di mosse a mano (capitolo 6) a più angoli: guarda il
gomito da vicino quando il braccio è tutto disteso e quando è tutto piegato.

**Una parte che sta DAVANTI al corpo** (l'altro avambraccio, appoggiato sul petto con la mano aperta) è un caso
diverso: quando si sposta lascia scoperto un pezzo di vestito che nel disegno non esiste, e il suo contorno non
passa nello sfondo ma sopra il camice. Qui il ritaglio non si fa con i punti: lo fa un programma, che in più
ridisegna quello che c'è sotto.

```
python3 personaggi/strumenti/stacca_parte.py personaggi/<nome> personaggi/<nome>/stacca-braccio2.json --prova /tmp/prova.jpg
npm run personaggio livello <nome>
```

Serve Python 3 con `numpy`, `scipy`, `pillow` e `opencv` (`pip install numpy scipy pillow opencv-python-headless`).
Serve una volta sola, a chi crea il personaggio: chi usa il kit non ne ha bisogno.
Dalla ricetta e da `base.png` il programma ricava due immagini grandi quanto quella di partenza, che il comando
`livello` poi usa: `maschera-<parte>.png` (dov'è la parte) e `sotto-<parte>.png` (il corpo come appare quando la
parte non c'è). La ricetta (`dottore/stacca-braccio2.json` è l'esempio completo):

- **perno** e **raggio**: il gomito e il cerchio attorno a cui la parte ruota. Dentro il cerchio resta l'osso
  fermo (il braccio), fuori comincia la parte. Il perno va al centro della rotondità del gomito e il raggio
  deve fermarsi prima del contorno del busto;
- **settore** `[da, a]`: tra quali angoli (in gradi, in senso orario, 0 = verso destra) sta la parte, vista dal perno;
- **semi**: qualche punto preso DENTRO la parte, divisi in `pelle` e `stoffa`. Da lì il programma "allaga" fino
  ai contorni disegnati: la pelle resta nella pelle, la stoffa nella stoffa;
- **recinto**: un poligono largo per la pelle e uno stretto per la stoffa, oltre i quali l'allagamento non va.
  Quello della stoffa deve passare pochi pixel fuori dai contorni della manica: dove una linea disegnata è
  interrotta, è lui a tenere dentro il ritaglio;
- **bordoSottile**: le zone in cui la parte sta sopra qualcosa di scuro (le dita sulla maglietta), dove si
  prende solo un filo di contorno;
- **ripara.linee**: le linee che passavano SOTTO la parte e vanno ridisegnate (il fianco del busto, il bordo del
  camice, il fondo del taschino), ognuna con `punti`, `spessore` e colore (`colore`, oppure `campione`: un punto
  dell'immagine da cui copiarlo). Una linea con `arco: [da, a]` segue il cerchio del perno: è la punta
  arrotondata del gomito, che si vede quando la parte si sposta;
- **ripara.vuoto**: i poligoni in cui, tolta la parte, non c'è niente (lo sfondo tra busto e braccio).
  Tutto il resto viene riempito sfumando i colori vicini, senza attraversare le linee ridisegnate.

Con `--prova` il programma salva un'immagine con la parte evidenziata a sinistra e il corpo senza la parte a
destra: guardala prima di andare avanti. Nelle ossa la parte è `"braccio2"` (zona `"tutto"`, sul suo livello), e
la mano aperta (`palmo`) diventa sua figlia. Nel livello, al posto dei punti:

```json
{"nome": "braccio2", "ombra": 0.26, "taglio": {"maschera": "maschera-braccio2.png", "sotto": "sotto-braccio2.png", "ricetta": "stacca-braccio2.json"}}
```

### 5. Le pose

Dalla stessa immagine il kit ricava le pose spostando le ossa. Quelle di serie sono quattro: `dito`
(l'immagine com'è), `alto`, `lato`, `aperto`. Un personaggio può ritoccarle e aggiungerne di sue alla voce
`pose`; quelle con un nome che il kit conosce vengono usate da sole:

| Posa | Com'è | Quando la sceglie il kit |
|---|---|---|
| `dito` | l'immagine com'è | tra una e l'altra, sulle enfasi |
| `alto` | il dito sale dritto vicino alla spalla | enfasi, invito finale |
| `lato` | il braccio si apre di lato | prima frase di una scena nuova |
| `aperto` | la mano aperta sale, la testa si inclina | spiegazioni, domande |
| `pensa` | il dito va al mento, la testa si inclina (serve il braccio su un livello) | domande, ogni tanto sulle enfasi |
| `presenta` | il braccio si distende verso il palco (serve il braccio su un livello) | prima frase di una scena nuova |
| `conserte` | braccia incrociate (è una posa disegnata: vedi più sotto) | frasi che frenano: "Ma…", "Non…" |

Tra quelle adatte al momento il kit prende la posa che manca da più tempo: in un reel lungo si vedono tutte.

```json
"pose": {
  "pensa": {"braccio": {"ruota": 50}, "mano": {"ruota": 4}, "spalla": {"ruota": -1}, "testa": {"ruota": 5.5, "dx": -2},
            "viso": {"dx": 2, "dy": 2}, "palmo": {"ruota": -4, "dy": 10}, "corpo": {"ruota": 0.8, "dx": 3}},
  "saluto": {"braccio": {"ruota": 30}, "palmo": {"ruota": 8, "dy": -12}, "corpo": {"ruota": -1}}
}
```

Ogni parte prende `ruota` (gradi, positivi in senso orario), `dx`, `dy` (pixel dell'immagine); `corpo` sposta
e inclina tutta la figura. Una posa con un nome nuovo (`saluto`) si usa chiedendola nella regia di una scena
(`dottore: {posa: 'saluto'}`). Limiti di serie, oltre i quali un'immagine senza livelli si deforma: braccio tra
-34 e +30 gradi, mano tra -16 e +14, palmo tra -8 e +22, testa ±9, spalla ±4.

Più strada deve fare il braccio tra una posa e l'altra, più tempo il kit gli dà (da sei decimi di secondo a
poco più di uno), con la curva di un braccio vero: parte piano, arriva piano.

**La seconda mano.** Un personaggio con l'osso `braccio2` può avere anche gli stati dell'altra mano, alla voce
`pose2`. A ogni posa il kit ne sceglie uno adatto (i nomi che conosce sono `aperta`, `alza`, `giu`), e lo fa
partire un attimo dopo il braccio che parla:

```json
"pose2": {
  "aperta": {},
  "alza": {"braccio2": {"ruota": 9}, "palmo": {"ruota": 5}},
  "giu": {"braccio2": {"ruota": -68}, "palmo": {"ruota": -4}}
},
"limiti": {"braccio": [-40, 58], "braccio2": [-72, 11], "palmo": [-22, 22]}
```

Con il livello la mano ruota dal gomito e dal polso: nelle pose non darle più `dx` e `dy`, che la allungherebbero.
`giu` porta la mano sotto il bordo dell'immagine: si legge come "lungo il fianco" o "in tasca". Quanto può alzarsi
prima di coprire una scritta o un logo dipende dal disegno: provalo sul foglio (capitolo 6).

**Pose disegnate.** Alcune pose non si ottengono spostando quello che c'è: le braccia conserte, seduto, un
oggetto in mano, il pollice in su. Per queste serve un altro disegno dello stesso personaggio, e il kit lo usa
come posa: finché la posa dura, quel disegno prende il posto della figura.

*Una figura intera* (è il caso normale, ed è così che il Dottore PEPTMAP incrocia le braccia):

```bash
npm run personaggio figura dottore conserte braccia-conserte.png
npm run personaggio griglia dottore-conserte                     # per leggere le coordinate
npm run personaggio bocca dottore-conserte 544,349 661,339 24
npm run personaggio occhi dottore-conserte 511,246 561,248 14 6 624,242 674,237 14 5
npm run personaggio scritta dottore-conserte 716,656 884,786      # se sul camice c'è una scritta
npm run personaggio prova dottore                                 # la posa nuova è nel foglio
```

`figura` toglie lo sfondo, crea la cartella `personaggi/dottore-conserte` (con scritto `"figuraDi": "dottore"`:
è una posa, non un narratore da scegliere) e aggiunge al dottore:

```json
"disegni": {"conserte": {"personaggio": "dottore-conserte", "dx": 58, "dy": 0}},
"pose": {"conserte": {"disegno": "conserte", "braccio": {"ruota": 50}, "testa": {"ruota": 3.5}, "corpo": {"ruota": 0.9, "dx": 3}}}
```

- Il disegno deve essere **grande quanto l'immagine di base**, con la figura alla stessa scala e tagliata
  nello stesso punto: occupa lo stesso riquadro nel video.
- `dx` e `dy` (pixel dell'immagine) lo spostano perché le due teste combacino: l'occhio di chi guarda resta sul
  viso, e lo scambio si nota meno. Si trovano confrontando la posizione del naso nelle due griglie.
- Bocche e palpebre le crea il kit con gli stessi comandi di sempre: la figura parla e batte le ciglia.
- Per i cenni della testa servono le ossa `testa`, `viso`, `mascella` e `bocca` della figura: si copiano da
  `dottore-conserte/personaggio.json` e si spostano sulla faccia nuova (capitolo 3).
- Le mosse scritte nella posa valgono per il tratto prima dello scambio: il braccio sale verso il petto, poi in
  quattro fotogrammi la figura nuova prende il posto della vecchia (una delle due è sempre piena: lo sfondo non
  si vede mai attraverso).

Il kit sceglie da solo `conserte` (sulle frasi che frenano). Una posa con un altro nome si chiede nella regia
della scena: `dottore: {posa: 'seduto'}`.

*Solo una parte.* Se cambia poco (un oggetto in mano) basta un'immagine piccola sopra il corpo, che nasconde i
livelli che sostituisce: `"disegni": {"mela": {"file": "mela.png", "x": 600, "y": 880, "misure": [300, 260],
"nasconde": ["braccio2"]}}`. Vale solo se quei livelli ci sono.

`npm run collaudo` controlla che i file di tutte le figure ci siano.

### 6. Il foglio di prova

`npm run personaggio prova <nome>` crea `prova.jpg`: il personaggio in ogni posa e in ogni gesto, nel punto più
spinto. Guarda riquadro per riquadro:

- il personaggio resta "intero"? Niente strappi, niente parti doppie, niente pezzi di sfondo che entrano;
- il collo, il gomito e il polso si piegano in modo morbido?
- il dito alzato non esce dal riquadro, e nella posa `pensa` non finisce sulla bocca?
- con la bocca chiusa e gli occhi chiusi il viso è pulito?

Per provare mosse precise (un angolo, un limite, una posa nuova prima di scriverla) c'è il foglio a richiesta:

```json
{"colonne": 4, "ingrandimento": 2, "celle": [
  {"titolo": "braccio +50", "mosse": {"braccio": {"ruota": 50}}, "bocca": 0},
  {"titolo": "viso a sinistra", "mosse": {"viso": {"dx": -9}, "testa": {"ruota": -3}}}
]}
```

`npm run personaggio prova <nome> mosse.json` lo disegna accanto al file (`"png": true` per un'immagine senza
compressione). `bocca` e `occhi` sono il numero del pezzo (0 = il più chiuso); senza, bocca e occhi aperti.

Se un gesto è troppo o troppo poco, `"ampiezza": 0.8` (o 1.2) in `personaggio.json` li scala tutti.
Finché il foglio non è pulito, il personaggio non è pronto.

### 7. Quanto è grande nel video

In `personaggio.json`, alla voce `video` (vale quando nel reel la grandezza è 100%):

- `larghezza`: larghezza dell'immagine sul video, in pixel (il video è largo 1080);
- `sborda`: quanta parte dell'altezza resta sotto il bordo (0.05 = il 5%);
- `rientro`: di quanti pixel esce dal lato.

`"specchiabile": false` avvisa, nel pannello e nella verifica, che il personaggio ha scritte addosso e che
specchiato si leggerebbero al contrario. Dopo `npm run personaggio scritta` l'avviso non serve più.

## I numeri del Dottore PEPTMAP

Sono quelli usati per crearlo; servono come esempio, o per rifarlo da una versione nuova dell'immagine:

```
npm run personaggio nuovo dottore <immagine> "Dottore PEPTMAP"
npm run personaggio bocca dottore 610,329 710,308 29
npm run personaggio occhi dottore 562,234 605,229 16 6 661,217 712,206 16 4.5
npm run personaggio scritta dottore 758,628 938,772 sposta 12,8
python3 personaggi/strumenti/stacca_parte.py personaggi/dottore personaggi/dottore/stacca-braccio2.json
npm run personaggio livello dottore
npm run personaggio figura dottore conserte <immagine a braccia conserte>
npm run personaggio bocca dottore-conserte 544,349 661,339 24
npm run personaggio occhi dottore-conserte 511,246 561,248 14 6 624,242 674,237 14 5
npm run personaggio scritta dottore-conserte 716,656 884,786
npm run personaggio prova dottore
```

Ossa, i due livelli, pose, stati della seconda mano e limiti sono in `dottore/personaggio.json`: è l'esempio
completo da copiare. Le braccia conserte sono un secondo disegno, in `dottore-conserte/`.
Se rifai `nuovo` con un'immagine diversa, ossa, ricetta del livello e misure nel video restano quelle di prima:
ricontrollale sulla griglia, perché in un'immagine nuova testa, gomito e mani non sono mai nello stesso punto,
poi rifai `livello`.

## Pose del tutto diverse

Le pose ricavate dall'immagine muovono quello che c'è: lo stesso braccio, la stessa mano con l'indice teso,
la stessa mano aperta. Per un atteggiamento che nell'immagine non esiste (le braccia conserte, il pugno chiuso,
il pollice in su, seduto, un oggetto in mano) serve un altro disegno dello stesso personaggio: fallo fare nello
stesso stile, grande uguale, e aggiungilo come posa disegnata (capitolo 5, `npm run personaggio figura`). Il
Dottore PEPTMAP ha già così le braccia conserte.

## Il Dottore disegnato dal kit

`fmlab/` non ha immagini: è disegnato dal codice (`libreria/Dottore.tsx`) e ha sette pose (`base`, `dito`,
`spalle`, `pensa`, `indica`, `saluta`, `telefono`) che il kit alterna a ogni frase. I suoi colori si cambiano
in `stile/stile.ts`, alla voce `personaggio.colori`; la scritta sul camice è `marchio`.
