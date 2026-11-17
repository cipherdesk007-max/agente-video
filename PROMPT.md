# Prompt pronti

Frasi da incollare al tuo agente AI di programmazione, aperto **dentro la cartella del kit**.
Cambia solo le parti tra `<…>`. Gli stessi prompt sono nel pannello (`npm run pannello`, scheda "Catalogo e prompt"),
con il pulsante per copiarli.

L'agente trova tutto il resto da solo: le regole in `SCHEDA.md` (una pagina) e in `FMLAB_AVVIA.md`, i pezzi pronti in
`CATALOGO.md`, lo stato di ogni reel con `npm run stato`.

## Primo avvio su questo computer

Da fare una volta sola, appena scaricato il kit.

```text
Sei nella cartella del FMLAB Reel Kit. Leggi SCHEDA.md.
Poi: lancia `npm install`, poi `npm run collaudo`, e sistema quello che il collaudo segnala.
Alla fine dimmi in tre righe: cosa funziona, cosa manca (voce ElevenLabs, ffmpeg, Chrome) e cosa devo fare io.
Non creare reel: voglio solo sapere che il kit è pronto.
```

## Nuovo reel da un argomento

Dall'idea al video finito. Scrive lui copione, fonti e scene.

```text
Leggi SCHEDA.md e FMLAB_AVVIA.md, poi fai un reel su: <argomento, in una o due frasi>.
Durata: <45-60 secondi>. Lingua: italiano. Narratore: dottore, a destra. Invito finale: commenta "<PAROLA>".
Regole che non si discutono:
- ogni numero e ogni affermazione ha la sua riga in fonti.md, presa dalla fonte più diretta che trovi
  (lo studio, il sito ufficiale), non da un articolo che la riassume; se non la trovi scrivi DA VERIFICARE e fermati;
- prima frase sotto le 12 parole; un segno ogni 2-3 secondi; i numeri compaiono quando la voce li dice;
- usa le scene pronte e gli oggetti di CATALOGO.md; scrivi a mano solo la scena che deve stupire.
Consegna: video mp4, verifica senza errori, e un elenco di cosa hai scelto tu e perché.
Per ultimo `npm run riuso <nome-del-reel>`: porta in libreria i pezzi nuovi che possono riservire e dimmi quali.
```

## Nuovo reel da un testo già scritto

Quando il testo lo hai scritto tu: non si tocca. Lui fa la regia e il kit fa il resto.

```text
Leggi SCHEDA.md. Questo è il testo del reel, già scritto da me: va detto così com'è, parola per parola.

<incolla qui il testo>

Fai così:
1. salva il testo in un file e lancia `npm run fai <nome-del-reel> testo=<file> "Titolo"`
   (scelte, se le voglio: durata=60 · regalo=mappa · formato=1:1 · narratore=nessuno);
2. migliora `reels/<nome-del-reel>/piano.json` scena per scena come dice il primo capitolo di SCHEDA.md
   (soggetti grandi in primo piano, una cosa nuova ogni 2-3 secondi, ogni numero a schermo con la sua riga in
   fonti.md) e rilancia `npm run fai <nome-del-reel>` finché `npm run piano` non dà errori;
3. guarda i provini e `npm run affianca <nome-del-reel>` prima di andare avanti: giudica l'occhio, poi i numeri;
4. prima della voce a pagamento fermati e dimmi quanti crediti costa.
Non scrivere codice e non cambiare le parole. I dubbi sui fatti non li correggi: li elenchi alla fine e in fonti.md.
Alla fine dimmi: dove sta il video, la durata, i crediti spesi, errori e avvisi della verifica.
Per ultimo `npm run riuso <nome-del-reel>`.
```

## Voce e video finale

Per un reel che ha già le scene (per esempio un'anteprima muta).

```text
Leggi SCHEDA.md. Per il reel <nome-del-reel>: `npm run stato <nome-del-reel>`, poi genera la voce (`npm run voce`),
rifai il video (`npm run render`) e controllalo (`npm run verifica`).
Guarda i provini dopo la voce: con i tempi veri qualche scritta può arrivare troppo presto o troppo tardi; sistemala
spostando i [segni] nel copione, non i numeri nelle scene.
Dimmi quanto dura, quanti caratteri di voce hai speso e cosa dice la verifica.
```

## Correggi una cosa

Una modifica precisa a un reel che esiste già.

```text
Leggi SCHEDA.md. Nel reel <nome-del-reel> cambia questo: <cosa non va e come lo vuoi>.
Tocca solo quello che serve. Fammi vedere il fotogramma prima e dopo (`npm run foto`), poi rifai video e verifica.
Se la modifica cambia un numero, aggiorna anche fonti.md.
```

## Accorcia

Per portare un reel lungo sotto il minuto.

```text
Leggi SCHEDA.md. Il reel <nome-del-reel> dura troppo: portalo a <55> secondi.
Proponimi prima i tagli (frasi che togli, frasi che unisci) senza cambiare il senso e senza togliere fonti, rischi e
chi ha pagato gli studi. Aspetta il mio sì, poi rifai copione, voce, video e verifica.
```

## Traduci in un'altra lingua

Stesse scene, voce e scritte nuove.

```text
Leggi SCHEDA.md e il capitolo sulle lingue di FMLAB_AVVIA.md. Fai la versione <inglese> del reel <nome-del-reel>:
copione.<en>.md con gli stessi [segni] e le stesse scene, scritte tradotte in TESTI, voce, video e verifica.
I numeri restano quelli delle fonti; le unità si adattano alla lingua.
```

## Cambia il narratore

Chi parla, quanto è grande, dove sta, cosa fa la seconda mano.

```text
Leggi SCHEDA.md. Nel reel <nome-del-reel>: narratore <dottore | fmlab | nessuno>, grandezza <100>, lato <destra>,
seconda mano <auto | aperta | alza | giu>. Usa `npm run imposta`, poi rifai i provini: se il narratore copre una
scritta sposta la scritta, non il narratore. Poi video e verifica.
```

## Musica di sottofondo

Serve un file audio tuo (di cui hai i diritti).

```text
Leggi SCHEDA.md. Ho messo il file musica.mp3 nella cartella del reel <nome-del-reel>.
Rifai il video con la musica a volume <30> (`npm run imposta <nome-del-reel> musica=30`, poi `npm run render`).
Controlla che la voce si capisca sempre: se la musica la copre, abbassala.
```

## Metti una foto o una registrazione dello schermo

Uno screenshot, la pagina di uno studio, il video di un'app. Il file è tuo: mettilo nella cartella del reel.

```text
Leggi SCHEDA.md e "Foto e filmati" in FMLAB_AVVIA.md. Nel reel <nome-del-reel> ho messo il file <nome-del-file>.
Mostralo quando la voce dice "<parole>": <dentro il telefono | a tutto palco | piccolo accanto al numero>.
Se è un video preparalo con `npm run clip` e prendi solo i secondi che servono; usa Foto o Filmato, mai <video>.
Fammi vedere due fotogrammi (`npm run foto`), poi rifai video e verifica. Scrivi in fonti.md da dove viene il file.
```

## Dopo un reel: metti in libreria quello che può riservire

Da fare ogni volta: è quello che fa costare meno i reel successivi.

```text
Leggi SCHEDA.md. Lancia `npm run riuso <nome-del-reel>` e guarda l'elenco dei pezzi scritti a mano.
Per ognuno decidi se può servire in un altro reel. Quelli sì: spostali in libreria con testi, numeri e colori come
opzioni, usali in scene.tsx al posto di quelli scritti a mano, aggiungili a motore/web/catalogo.tsx e a
CATALOGO.md, poi `npm run catalogo`, `npm test` e `npm run provini <nome-del-reel>` (deve essere uguale a prima).
Dimmi cosa è entrato in libreria, cosa hai lasciato fuori e perché, e scrivi una riga in stile/appunti.md.
```

## Effetti sonori

Pop, ding, whoosh sulle parole giuste. I tuoi file vanno nella cartella `suoni/`.

```text
Leggi SCHEDA.md e "Effetti sonori" in FMLAB_AVVIA.md. Nel reel <nome-del-reel> metti da 4 a 6 effetti sonori nei
momenti che contano (un numero che compare, un cambio di scena, il risultato): `npm run suoni` dice quali ci sono.
<Ho aggiunto in suoni/ il file …: usalo per …> Scrivili nel copione con [suono:nome], rifai il video e dimmi a che
secondo cade ognuno. Niente suoni sopra le parole difficili da capire.
```

## Controlla i fatti

Una seconda lettura delle fonti, prima di pubblicare.

```text
Leggi SCHEDA.md. Per il reel <nome-del-reel> rifai da zero il controllo di fonti.md: apri ogni fonte, confronta ogni
numero che compare nel copione e nelle scene, e dimmi riga per riga: confermato, impreciso (con il valore giusto) o
non trovato. Non correggere niente finché non ti dico io.
```

## Nuovo personaggio da un'immagine

Un altro narratore, partendo da un disegno.

```text
Leggi personaggi/COME-FARE.md. Ho messo l'immagine <file.png> nella cartella del kit: crea il personaggio <nome>.
Voglio bocca e occhi che si muovono e il braccio su un livello suo. Fammi vedere il foglio di prova
(`npm run personaggio prova <nome>`) e dimmi quali pose riesce a fare e quali no con questo disegno.
```

## Una posa nuova da un disegno

Lo stesso narratore in un altro atteggiamento (seduto, pollice in su, un oggetto in mano).

```text
Leggi "Pose disegnate" in personaggi/COME-FARE.md. Ho messo l'immagine <file.png> nella cartella del kit: è il
dottore nella posa <nome>, grande quanto la sua immagine di base. Aggiungila come posa con
`npm run personaggio figura dottore <nome> <file.png>`, poi crea bocca e occhi leggendo le coordinate dalla
griglia, e regola dx e dy perché la testa combaci con quella del dottore. Fammi vedere il foglio di prova
(`npm run personaggio prova dottore`) e dimmi quando il kit la userà da solo e come chiederla in una scena.
```

## Un pezzo nuovo per la libreria

Un oggetto 3D o una scena pronta che non c'è ancora.

```text
Leggi CATALOGO.md e guarda catalogo.jpg. Mi serve <un oggetto 3D: … | una scena pronta: …>.
Fallo con le forme di libreria/Tre.tsx (o con d3, le icone, i segni a mano), nello stile degli altri, aggiungilo a
motore/web/catalogo.tsx e a CATALOGO.md, poi `npm run catalogo` e `npm test`. Fammi vedere com'è venuto.
```
