# Appunti del kit

Lezioni dai reel già fatti. Leggile prima di cominciarne uno nuovo; alla fine aggiungi le tue.

## Dal reel "gps"

- L'aggancio che rovescia una convinzione ("i satelliti non sanno dove sei") funziona se nel primo secondo
  si vede già l'oggetto di cui si parla. Il primo fotogramma non deve mai essere vuoto.
- Un numero grande con l'etichetta sotto si legge in mezzo secondo. Due numeri insieme no: uno per volta.
- Passare da "tutto il sistema" a "un oggetto da vicino" (camera che stringe) vale più di una scena nuova.
- Le scritte accanto al bordo destro sotto metà schermo finiscono sotto le icone dell'app: la verifica lo
  segnala, meglio tenerle a sinistra o al centro.
- Un tratto di voce lungo senza segni (più di 4 secondi) si nota: sul palco non succede niente. Basta un
  segno in più e un'etichetta che compare.
- Per far capire "sbagliato / giusto" bastano rosso e verde sullo stesso oggetto, senza spiegare.
- Le sfumature tolte dal copione vanno scritte in `fonti.md`: servono quando qualcuno contesta nei commenti.
- In 3D l'oggetto si legge solo se si muove: una rotazione lenta e una camera che gira di pochi gradi bastano.
  Un oggetto 3D fermo sembra un disegno piatto fatto peggio.
- Gli oggetti 3D visti "di taglio" (un satellite con i pannelli in fila verso la camera) spariscono: scegli
  l'angolo di partenza guardando un fotogramma, non a caso.
- Un oggetto che gira attorno a una scritta non deve mai passarci sopra: l'anello va fatto più largo delle
  scritte, e le facce dietro si disegnano prima del testo (vedi la scena `chiusura`).
- Il narratore gesticola sulle parole in *enfasi* e sui [segni]: se sembra agitato, nel copione ci sono troppe
  enfasi vicine. Una per frase.
- Narratore al 100% = testa da y ≈ 1347: il palco è tutto libero fino a 1320. Sopra il 120% comincia a
  coprirlo, e le scene vanno spostate in alto.
- Narratore a sinistra: va specchiato (`specchia=si`), così guarda e indica verso il centro. Il logo sul camice
  resta leggibile e la riga della fonte passa da sola a destra.
- Il narratore cambia posa a ogni frase: frasi brevi e staccate lo fanno muovere bene; un periodo unico di
  dieci secondi lo lascia fermo nella stessa posa. Meglio spezzare.
- Per i reel "a schema" (elenco, confronto, mito, passi, numeri) conviene partire dal modello e dalle scene
  pronte: si scrive a mano solo la scena che deve stupire.

## Dal reel "reta-ginocchio"

- Con un testo già scritto da qualcuno (qui 290 parole, quasi due minuti) il lavoro è: controllare ogni numero
  sulla fonte prima di disegnarlo, e segnare in `fonti.md` ogni frase ritoccata, con il perché.
- Un numero detto a voce in modo tondo ("quasi quattro") in grafica va scritto preciso, con accanto da dove
  viene ("fino a −4,0 · da −3,2 a −4,0 secondo studio e dose"): chi mette in pausa deve trovare il dato vero.
- Quando uno studio riguarda un gruppo preciso (qui: adulti con sovrappeso o obesità), il gruppo va scritto
  sul palco anche se la voce non lo dice.
- Le etichette lunghe (più di 35 lettere) sotto metà schermo finiscono sotto le icone dell'app: spezzale in
  una targa a due righe, o tienile a sinistra del centro.
- Una scena non deve cominciare vuota perché il suo primo segno arriva dopo due secondi: metti subito qualcosa
  (una data, la barra vuota, il triangolo d'avviso) legato all'inizio della scena, non al segno.
- Per un paragone a voce ("come il pubblico che applaude prima della band") basta una scena semplice e
  riconoscibile: un palco, un faro, il microfono solo.
- L'oggetto protagonista fatto su misura (il ginocchio: cilindri e sfere) vale la mezz'ora che costa: torna in
  quattro scene e tiene insieme il reel.
- Riguardando il video finito, i difetti erano tutti di tempo e nessuno di disegno: un numero che compariva
  a fine scena (mezzo secondo a schermo), due targhe che si incrociavano nello stesso punto, una targa in
  ritardo perché il segno era finito sulla parola dopo. Vanno cercati così: un fotogramma ogni 0,2 secondi
  attorno a ogni cambio.
- Quando una scritta lascia il posto a un'altra nello stesso punto: la prima esce con `fino={segno + 0.3}`
  (comincia a uscire 0,3 s prima), la seconda entra con `da={segno}`. Né accavallate né palco vuoto.
- Il conto che scorre (da 0 a −4,0) parte sul verbo ("è diminuito") e si ferma sul numero ("quattro"):
  la durata si ricava dai due segni, `s.dopo('verbo') - s.dopo('numero')`, così resta giusta con ogni voce.
- Un confronto si costruisce in tre tempi: prima un dato, poi l'altro accanto, poi la differenza che si
  accende. Tutto insieme dall'inizio lascia cinque secondi senza niente da guardare.
- Riuso dopo il reel sul ginocchio: sono entrati in libreria `ginocchio3d` (l'oggetto), `bloccoScala`,
  `bloccoSchede` e `bloccoAvviso` (tre scene che torneranno in ogni reel su uno studio). Sono rimaste nel reel
  l'applauso sul palco e la scena dell'amico sulle scale: metafore di quel copione. `npm run riuso <reel>` fa
  l'elenco da cui partire.
- Le braccia conserte stanno bene sulla frase che frena ("Ma anche con il placebo…"): il kit le mette lì da
  solo. Una volta o due per reel bastano: è una posa chiusa, non una posa per spiegare.

## Dai reel "reta-testo" e "mots-c"

- Le fonti non vanno a schermo (scelta di Francesco, 17/11/2026): la scritta "Fonte: …" è spenta di serie. Le fonti
  restano in `fonti.md`, una riga per numero.
- Un soggetto entrato da solo deve riempire il palco: piccolo in un angolo ad aspettare gli altri lascia il
  fotogramma vuoto. Ora lo fa il kit (sta in mezzo, 800 pixel, poi si stringe quando entra il secondo). Movimento
  sul palco misurato: da 3,32 a 4,37 in `reta-testo`, da 2,86 a 4,29 in `mots-c`.
- Una scena con una tinta sua si vede solo se anche il soggetto principale ha quel colore: in `mots-c` il fondo
  rosso e quello ambra non contavano finché i soggetti restavano verdi e azzurri (tinte misurate: da 2 a 4).
- Il narratore fa un gesto a ogni segno. Con 30,6 segni al minuto (`reta-testo`) cambia 47,3 volte al minuto, come i
  riferimenti; con 35,8 (`mots-c`) arriva a 55,9, più del riferimento più mosso (54,3).

## Voce

- La voce dei reel è **Vittorio** (ElevenLabs), stabilità 50, somiglianza 75, modello v4: sono le regolazioni con cui
  è stata registrata la banca delle frasi (`voci/frasi/`, 24 frasi, 17/11/2026). Nel file `.env` voce, modello e
  regolazioni devono essere gli stessi, altrimenti le frasi della banca suonano diverse da quelle generate.
- Passo misurato: nelle frasi è quasi quello che il kit stimava (1,04 volte). Il testo della Reta (284 parole) dura
  circa 1 minuto e 48: per stare più corti si chiede una durata (`npm run imposta <reel> durata=75`, la voce viene
  velocizzata fino a 1,4) o si accorcia il testo. Decide chi ha scritto il testo.
- Frasi fisse in banca (scritte uguali non costano): `npm run frasi` le elenca.
