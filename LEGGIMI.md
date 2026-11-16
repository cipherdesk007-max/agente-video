# FMLAB Reel Kit

Dai un argomento, esce un reel verticale finito: copione con le fonti, voce, scene animate sulla parola
esatta, sottotitoli, narratore che parla e gesticola, video mp4 1080x1920. Il lavoro lo fa un agente di
programmazione (quello che usi di solito), seguendo le istruzioni che trova nella cartella; tu chiedi e
controlli.

Dentro ci sono già due reel: `reels/gps/` ("Come fa il GPS a sapere dove sei"), in italiano e in inglese, e
`reels/reta-ginocchio/`, fatto da un testo già scritto, con i numeri di due studi.

Tre file da aprire subito: `catalogo.jpg` (tutto quello che è già pronto, disegnato), `PROMPT.md` (le frasi da
incollare all'agente) e `personaggi/dottore/prova.jpg` (pose e gesti del dottore).

## Cosa serve

- un Mac (o un computer Linux; su Windows non è stato provato) con **Node.js 20 o più recente**
  (https://nodejs.org, versione LTS);
- **Google Chrome** installato (vanno bene anche Edge o Brave);
- per la voce migliore, una chiave **ElevenLabs**. Senza chiave, su Mac il kit usa la voce di sistema.

## Si parte in tre mosse

1. Scompatta la cartella dove vuoi.
2. Aprila con il tuo agente e scrivigli:

   > Leggi SCHEDA.md, lancia npm install e npm run collaudo, e dimmi cosa manca.

   (È il primo dei prompt pronti: gli altri sono in `PROMPT.md` e nel pannello.)

   (A mano: apri il Terminale nella cartella e lancia `npm install`, poi `npm run collaudo`.)
3. Quando il collaudo dice TUTTO OK, apri il pannello:

   ```
   npm run pannello rete
   ```

   Nel Terminale compaiono l'indirizzo e un codice. Aprilo dal computer o dal telefono (stessa rete Wi-Fi).

## Con Codex o con Claude Code

Il kit funziona con tutti e due, e non devi preparare niente: ognuno legge da solo il suo file di istruzioni,
che sta nella cartella del kit.

| Agente | File che legge da solo | Per avviarlo dal pannello, nel file `.env` |
|---|---|---|
| Codex | `AGENTS.md` | `FMLAB_AGENTE=codex exec --full-auto` |
| Claude Code | `CLAUDE.md` | `FMLAB_AGENTE=claude -p --permission-mode acceptEdits --allowedTools "Bash,Read,Write,Edit"` |

I due file dicono la stessa cosa (leggi `SCHEDA.md`, parti da `npm run stato`, chiudi con `npm run riuso`): se
ne cambi uno, copia la modifica nell'altro. I prompt di `PROMPT.md` vanno bene per entrambi.

Con Codex la cartella deve essere un repository Git: una volta sola, nel Terminale dentro la cartella,
`git init` (oppure aggiungi `--skip-git-repo-check` al comando).

## Il pannello

È una pagina sola, fatta per il telefono.

**Nuovo reel**

- incolli **il testo del reel**: verrà detto così com'è, parola per parola (se vuoi dare solo l'argomento e far
  scrivere il testo a chi realizza il reel, tocca "È solo l'argomento");
- scegli la **durata**, da 15 a 180 secondi: il reel la rispetta con al massimo 5 secondi di scarto, e mentre
  scrivi il pannello ti dice se il testo ci sta;
- scegli lingua e **tipo di reel** (spiegazione, elenco, confronto, mito e realtà, passi, oggetto in 3D,
  numeri e grafico): l'agente parte da un reel già montato e riempie il contenuto;
- scegli il **narratore**: il tuo dottore, il Dottore disegnato dal kit, oppure **nessuno**;
- regola **grandezza**, lato e altezza: lo vedi subito nel telefono disegnato, con le zone che l'app copre;
- scegli lo **stile**: 2D, 3D oppure automatico (decide l'agente in base all'argomento, e il pannello ti dice
  già cosa suggerisce);
- premi "Crea il reel": ottieni la frase da dare all'agente. Lui legge la tua richiesta e fa tutto il resto.

**I miei reel**

- "Scegli la voce": il motore e la voce per quel reel, con l'ascolto di prova (gli assaggi non costano);
- "Genera la voce" (ElevenLabs, voce del Mac, un tuo servizio, o solo tempi stimati);
- "Anteprima": il reel nel browser, con play, cursore e **audio**;
- "Provini", "Bozza veloce", "Video finale", "Verifica": partono con un tocco e vedi l'avanzamento;
- il video finito si guarda e si scarica da lì;
- "Narratore, grandezza e stile": le stesse scelte, per un reel che esiste già; in più la **seconda mano** del
  dottore (da sola, aperta, alzata, giù) e il **volume della musica**.

**Catalogo e prompt**

- i **prompt pronti**: aprine uno, premi "Copia", incollalo all'agente e cambia solo le parti tra `<…>`;
- il **catalogo**: tutte le scene pronte, gli oggetti 3D, i grafici, le icone. Serve a te per sapere cosa
  chiedere ("usa la scena con la scala", "mettici la molecola") e all'agente per non rifare quello che c'è.

**Perché un'anteprima può essere muta.** La voce si genera sul tuo computer. Finché un reel ha solo i "tempi
stimati" non esiste nessun file audio: anteprima e video sono muti. Premi "Genera la voce" e poi rifai il
video: le scene si riallineano da sole alle parole.

## Cosa puoi chiedere all'agente

- "Fammi un reel su…" (un argomento, un link, uno studio, un PDF)
- "Fammelo vedere prima di fare il video" (ti mostra i provini)
- "Accorcialo a 40 secondi", "cambia l'inizio", "togli la terza scena"
- "Traducilo in inglese" (stesse animazioni, si risincronizzano da sole)
- "Senza dottore", "il dottore più piccolo", "mettilo a sinistra"
- "Fallo in 3D", "fallo in 2D"
- "Usa questa immagine come narratore"
- "In questa scena fagli indicare il numero", "qui deve stare fermo"
- "Cambia i colori", "sottotitoli più grandi"
- "Dammi il testo del post e le fonti"
- "Fammene cinque sullo stesso tema"

## I comandi, se vuoi usarli tu

| Comando | Cosa fa |
|---|---|
| `npm run pannello` | il pannello nel browser (`rete` in fondo per aprirlo anche dal telefono) |
| `npm run stato` | a che punto è ogni reel e qual è il prossimo passo |
| `npm run collaudo` | controlla che il kit funzioni su questo computer |
| `npm run nuovo cuore "Titolo" lista` | crea un reel nuovo da un modello (senza niente: elenco dei modelli) |
| `npm run imposta gps` | mostra narratore e stile del reel |
| `npm run imposta gps narratore=nessuno` | li cambia: `narratore=dottore` `grandezza=80` `lato=sinistra` `alza=60` `mano=giu` `stile=3d` `musica=30` |
| `npm run voce gps` | genera voce e tempi (ElevenLabs se c'è la chiave, altrimenti voce del Mac) |
| `npm run anteprima gps` | apre il reel nel browser, con play, cursore e audio |
| `npm run provini gps` | un'immagine con tutti i momenti chiave, da controllare prima del video |
| `npm run foto gps 12.5 guide` | un fotogramma preciso, con le zone coperte dall'app in rosso |
| `npm run render gps` | crea il video (`bozza` in fondo per una versione veloce) |
| `npm run verifica gps` | controlli automatici, con rapporto in `verifica.md` |
| `npm run personaggio` | i narratori: elenco, e come crearne uno da un'immagine |
| `npm run catalogo` | ridisegna `catalogo.jpg` con tutto quello che è pronto |
| `npm run icone cuore` | cerca un'icona tra 35.000, anche in italiano |
| `npm run clip gps registrazione.mp4 demo` | prepara un video (una registrazione dello schermo) per metterlo in una scena |
| `npm run suoni` | l'elenco degli effetti sonori (cartella `suoni/`: ci metti anche i tuoi) |
| `npm run riuso gps` | a fine reel: cosa è scritto a mano e può entrare in libreria |
| `npm test` | prove veloci del kit (pochi secondi, senza browser) |

Per un'altra lingua aggiungi il codice dopo il nome: `npm run render gps en`.

## La voce

Copia `.env.esempio` con il nome `.env` e incolla la chiave di ElevenLabs. Con ElevenLabs il kit riceve il
tempo esatto di ogni lettera, quindi bocca, sottotitoli, gesti e animazioni sono precisi al fotogramma. Con la
voce del Mac (gratuita) la sincronia è esatta sulle frasi e sulle pause.

- La voce si sceglie reel per reel, dal pannello, ascoltandola prima.
- **I crediti si spendono una volta sola**: se il testo non cambia, rigenerare la voce riusa l'audio che c'è
  già. Spostare i punti in cui compaiono le cose non costa niente.
- Qualsiasi altro servizio di voce si collega con un piccolo programma: `voci/COME-FARE.md`.

**Musica di sottofondo.** Metti un file `musica.mp3` nella cartella del reel (un brano tuo, o di cui hai i
diritti): al prossimo video finisce sotto la voce, basso, e si abbassa ancora mentre la voce parla. Il volume si
regola dal pannello o con `npm run imposta <reel> musica=30`; con 0 non c'è. Il kit non contiene musica.

## Il narratore

Il tuo dottore è **una sola immagine** (`personaggi/dottore/`). Il kit ne ha ritagliato tutti e due gli
avambracci su livelli loro: il braccio che indica può distendersi e piegarsi fino a passare davanti al petto,
l'altro può alzare la mano aperta o scendere lungo il fianco. Da quell'immagine ricava:

- **sette pose** (dito alzato, dito dritto in alto, dito al mento mentre pensa, braccio aperto di lato, braccio
  disteso verso il palco, mano aperta che sale, braccia conserte): ne cambia una a ogni frase e la tiene, come fa
  chi spiega. Le braccia conserte sono un secondo disegno dello stesso dottore: il kit lo usa come posa, con
  bocca e palpebre sue, sulle frasi che frenano ("Ma…", "Non…"). Ogni altro disegno che gli fai fare (seduto,
  il pollice in su) diventa una posa nello stesso modo: `npm run personaggio figura dottore <nome> <immagine>`;
- **la seconda mano**, che non resta mai ferma: aperta com'è nel disegno, alzata quando lui presenta qualcosa,
  giù lungo il fianco (esce dal quadro, come in tasca) quando l'altro braccio è in alto o al mento. Dove prima
  c'era la mano il camice è stato ridisegnato, taschino compreso;
- **i gesti** sopra la posa: l'accento del dito sulla parola in evidenza, lo sguardo verso il palco quando
  compare qualcosa, il cenno a fine frase, la testa inclinata sulle domande, il "no" sulle negazioni;
- **la faccia**: il mento sale e scende con la bocca, che si stringe sulla "u" e sulla "o"; quando si volta, il
  viso scorre un poco dentro la testa, come in una testa vera;
- **i dettagli**: respira, sposta il peso, sbatte le palpebre a intervalli irregolari; da una posa all'altra il
  braccio parte piano e arriva piano, e getta un'ombra leggera quando passa davanti al camice.

Ogni movimento ha preparazione, colpo e ritorno, e il colpo cade sulla parola: per questo con la voce vera
sembra che parli lui. `personaggi/dottore/prova.jpg` mostra pose e gesti. Lo puoi mettere anche a sinistra:
specchiato guarda verso il centro, e il logo PEPTMAP sul camice resta leggibile. A riposo è identico alla tua
immagine: lo controlla `npm run collaudo`. Per quello che nell'immagine non esiste (la mano chiusa a pugno,
seduto, braccia conserte, un oggetto in mano) servono altri disegni dello stesso dottore: si aggiungono come
pezzi o come nuovi personaggi. Per un altro personaggio basta un'altra immagine:
`personaggi/COME-FARE.md` spiega come, oppure dalla all'agente e digli "usa questa come narratore".

## 2D o 3D

- **3D**: l'oggetto protagonista ha un volume vero, ruota, la camera gli gira attorno. Per corpo, spazio,
  macchine, farmaci, oggetti.
- **2D**: grafica piatta, numeri grandi, schemi, linee che si disegnano. Per soldi, regole, confronti, idee.

Il reel d'esempio è in 3D: i satelliti sono oggetti veri, illuminati. Gli oggetti 3D pronti (satellite,
telefono, fiala, pillola, siringa, molecola, DNA, ginocchio, cuore, moneta, stella, colonne, freccia) sono in
`libreria/Modelli.ts`; l'agente ne costruisce di nuovi quando servono.

## Cosa c'è dentro, oltre al motore

- **25 scene pronte**: titolo, numero, lista, confronto, colonne, percentuale, passi, mito e realtà, oggetto 3D,
  chiusura, linea nel tempo, torta, classifica, icone, scala con i cursori, schede, avviso, citazione, persone
  ("2 su 10"), linea del tempo a tappe, schermo del telefono, sigla con il logo, domanda, scheda di uno studio;
- **il logo della pagina** (`stile/logo.png`): entra nella sigla, nel cartello finale o dove serve;
- **grafici** disegnati con d3, **icone** (le raccolte di react-icons: Font Awesome, Material, Lucide, Tabler,
  Phosphor e altre), **segni a mano** (roughjs) per cerchiare un numero o tirare una freccia;
- **foto e filmati**: uno screenshot o la prima pagina di uno studio (`Foto`), una registrazione dello schermo
  precisa al fotogramma, anche dentro il telefono disegnato (`Filmato`). I file li metti tu nella cartella del reel;
- le tre librerie si installano da sole con `npm install`. Altre (three.js, Lottie…) l'agente le può aggiungere,
  ma solo se si lasciano comandare fotogramma per fotogramma: lo spiega `FMLAB_AVVIA.md`.

**Ogni reel fa costare meno il successivo.** A fine lavoro l'agente lancia `npm run riuso <reel>`: il kit elenca
quello che in quel reel è stato scritto a mano, e quello che può riservire (una scena, un oggetto 3D, un grafico)
entra in libreria e nel catalogo. La volta dopo è già pronto: una riga invece di cento, meno crediti. La scheda,
il manuale e i prompt pronti lo chiedono come ultimo passo di ogni reel.

## Il look

`stile/stile.ts` contiene colori, caratteri, posizione dei sottotitoli, zone sicure.
`stile/impostazioni.json` contiene le scelte di partenza per i reel nuovi (narratore, grandezza, stile).
Li cambi una volta e valgono per tutti i reel dal render successivo.

## Dove sono le cose

```
AGENTS.md           il file che Codex legge da solo (rimanda alla scheda)
CLAUDE.md           lo stesso, per Claude Code
FMLAB_AVVIA.md      le istruzioni che segue l'agente
PROMPT.md           le frasi pronte da incollare all'agente
CATALOGO.md         tutto quello che è già pronto, con i nomi e come si usa (catalogo.jpg: lo stesso, disegnato)
reels/              un reel per cartella: richiesta, copione, fonti, scene, voce, video
personaggi/         i narratori
voci/               come scegliere le voci e collegare altri servizi
suoni/              gli effetti sonori: otto di serie, più quelli che ci metti tu (wav, mp3, m4a)
prove/              le prove veloci del kit (npm test)
SCHEDA.md           la pagina sola che basta all'agente per fare un reel
libreria/           i pezzi pronti per le scene: luci, scritte, camera, oggetti 2D e 3D, sottotitoli, narratore
stile/              il look: colori, caratteri, scelte di partenza, appunti
motore/             il motore: pannello, voce, render, verifica (non serve toccarlo)
```

## Da sapere

- I due reel non hanno ancora la voce: i tempi delle parole sono stimati e i video non sono nella cartella.
  Per farli: `npm run voce reta-ginocchio`, poi `npm run render reta-ginocchio` (o i due pulsanti del pannello).
- Il pannello si apre solo con il codice che compare nel Terminale. Con `rete` è raggiungibile da chi sta sulla
  tua stessa rete Wi-Fi e conosce quel codice: non usarlo su reti pubbliche.
- La musica puoi aggiungerla dall'app quando pubblichi, oppure metterla nel video con un file `musica.mp3`.
- Se chiudi un reel con "Commenta X e ti mando le fonti", poi le fonti vanno mandate davvero: sono già
  pronte in `didascalia.md`.
- I caratteri inclusi (Inter) hanno licenza libera: vedi `stile/font/LICENZA-Inter.txt`.
- Il kit non pubblica niente. L'unica cosa che manda in rete è il testo del copione a ElevenLabs, quando
  generi la voce con quel servizio.
