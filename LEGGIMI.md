# FMLAB Reel Kit

Dai un argomento, esce un reel verticale finito: copione con le fonti, voce, scene animate sulla parola
esatta, sottotitoli, narratore che parla e gesticola, video mp4 1080x1920. Il lavoro lo fa un agente di
programmazione (quello che usi di solito), seguendo le istruzioni che trova nella cartella; tu chiedi e
controlli.

Dentro ci sono già tre reel: `reels/gps/` ("Come fa il GPS a sapere dove sei"), in italiano e in inglese,
`reels/reta-ginocchio/`, con i numeri di due studi, e `reels/reta-testo/`, fatto da un testo già scritto con un
comando solo (`npm run fai`): è il modello da guardare per i prossimi.

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

   Se lanci un comando del kit prima di `npm install`, non succede niente di male: il kit dice che è la prima
   volta su questo computer e scrive i tre comandi da dare.
3. Quando il collaudo dice TUTTO OK, apri il pannello:

   ```
   npm run pannello rete
   ```

   Nel Terminale compaiono l'indirizzo e un codice. Aprilo dal computer o dal telefono (stessa rete Wi-Fi).

## Con un agente che lavora nella cartella

Il kit funziona con gli agenti da riga di comando, e non devi preparare niente: l'agente legge da solo il suo file
di istruzioni, che sta nella cartella del kit. Ce ne sono due, `AGENTS.md` e `CLAUDE.md`, perché agenti diversi
cercano nomi diversi: dicono la stessa cosa (leggi `SCHEDA.md`, parti da `npm run stato`, chiudi con
`npm run riuso`). Se ne cambi uno, copia la modifica nell'altro. I prompt di `PROMPT.md` vanno bene per tutti.

Per avviarlo dal pannello con un tocco, nel file `.env` scrivi in `FMLAB_AGENTE` il comando con cui lo avvii dal
Terminale senza finestra e con il permesso di lavorare da solo nella cartella (è nella guida del tuo agente).

Alcuni agenti vogliono che la cartella sia un repository Git: una volta sola, nel Terminale dentro la cartella,
`git init`.

## La dashboard

È il pannello: una pagina sola, fatta anche per il telefono. Non devi aprirla tu: quando l'agente lancia
`npm run stato` (lo fa per prima cosa) la dashboard si accende e si apre nel browser sulla pagina **Adesso**.
`npm run pannello ferma` la spegne; `FMLAB_DASHBOARD=no` nel file `.env` non la fa partire da sola.

- **Adesso**: cosa sta girando (comando, tappa, percentuale), le otto tappe del reel con ✓ e ✖, l'errore se una si
  è fermata, i provini, l'anteprima, i crediti spesi e quelli che costerebbe la voce. Sotto, **"Chiedi una cosa
  all'agente"**: scegli il reel, tocca i pulsanti (con o senza dottore, formato, durata, regalo, voce) o scrivi con
  parole tue, e metti in coda. L'agente legge la coda al prossimo `npm run stato`. La dashboard non scrive nella chat
  dell'agente: se è fermo ad aspettarti, digli "guarda lo stato".
- **Riferimenti**: i tuoi video di riferimento, da guardare lì, e il pulsante che apre la cartella.
- **Chiavi**: per ogni chiave dice "c'è" o "manca" e la scrive nel file `.env`. Una chiave scritta non viene più
  mostrata, e si scrive solo dal computer del kit, non dal telefono.
- **Catalogo e prompt**: oltre al catalogo disegnato, i pezzi per nome (scene, soggetti, oggetti 3D, luoghi) e le
  frasi in banca, da ascoltare.
- **Diario**: una voce per ogni reel chiuso, scritta dal kit (`diario.md`): cosa è entrato in catalogo, cosa è da
  sistemare, i crediti spesi.

Le altre due pagine sono quelle di sempre.

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

Un reel nato da un testo già scritto ha un pulsante solo, **"Fai il reel"** (accanto, "Fai una bozza", più veloce):
otto tappe una dopo l'altra (regia, monta, tempi, provini, voce, render, verifica, confronta), ognuna con il suo
segno. Prima della voce a pagamento si ferma e ti dice quanti crediti costa: parte solo se tocchi "Sì". Se una
tappa si ferma, leggi perché, correggi e riparti da lì: quelle già fatte non si rifanno.

**I miei reel**

- "Scegli la voce": il motore e la voce per quel reel, con l'ascolto di prova (gli assaggi non costano);
- "Genera la voce" (ElevenLabs, voce del Mac, un tuo servizio, o solo tempi stimati);
- "Anteprima": il reel nel browser, con play, cursore e **audio**;
- "Provini", "Bozza veloce", "Video finale", "Verifica": partono con un tocco e vedi l'avanzamento;
- il video finito si guarda e si scarica da lì;
- "Narratore, grandezza e stile": le stesse scelte, per un reel che esiste già; in più la **seconda mano** del
  dottore (da sola, aperta, alzata, giù), il **volume della musica** e il **formato** (verticale, quadrato,
  orizzontale).

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
| `npm run stato` | a che punto è ogni reel e qual è il prossimo passo; accende la dashboard e mostra le richieste in coda |
| `npm run richieste` | le richieste scritte dalla dashboard (`fatta <id>` ne chiude una) |
| `npm run collaudo` | controlla che il kit funzioni su questo computer |
| `npm run fai ginocchio testo=testo.txt "Titolo"` | dal testo al video in otto tappe; poi `npm run fai ginocchio` riparte da dove serve (`bozza` per fare prima) |
| `npm run piano ginocchio` | controlla il piano di regia (`piano.json`) e dà il rischio cartelli da 0 a 100 |
| `npm run giudica ginocchio` | la pagella del piano in una schermata: otto righe, ✓ o ✖ con il numero accanto (`docs/OCCHIO.md`) |
| `npm run regalo` | cosa si può regalare in chiusura (ebook, mappa, PDF) e come aggiungerne uno |
| `npm run frasi audio.mp3 testo.txt` | taglia una registrazione della voce nelle sue frasi e le mette in banca: nei reel non costano (senza niente: elenco) |
| `npm run affianca ginocchio` | dodici fotogrammi del reel accanto a dodici del video di riferimento: si guarda prima di misurare |
| `npm run prova-cieca` | dieci spezzoni mescolati, kit e riferimenti, da far guardare a tre persone |
| `npm run confronta ginocchio` | misura il video (novità, movimento, sottotitoli, narratore) e lo mette accanto ai riferimenti |
| `npm run immagine ginocchio "descrizione"` | un'illustrazione generata, ritagliata e messa in biblioteca (costa crediti: chiede prima) |
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
| `npm run musiche` | le trame ambientali del kit: elenco, e le genera per ascoltarle |
| `npm run suoni` | l'elenco degli effetti sonori (cartella `suoni/`: ci metti anche i tuoi) |
| `npm run riuso gps` | a fine reel: cosa è scritto a mano e può entrare in libreria |
| `npm test` | prove veloci del kit (pochi secondi, senza browser) |

Per un'altra lingua aggiungi il codice dopo il nome: `npm run render gps en`. Le lingue scritte senza spazi
(giapponese, cinese, tailandese) si dividono in parole da sole.

Il **formato** si sceglie per reel: `npm run imposta gps formato=1:1` (quadrato) o `formato=16:9` (orizzontale);
`formato=9:16` torna al verticale. Le scene sono le stesse: cambia la finestra e dove sta il narratore.

## La voce

Copia `.env.esempio` con il nome `.env` e incolla la chiave di ElevenLabs. Con ElevenLabs il kit riceve il
tempo esatto di ogni lettera, quindi bocca, sottotitoli, gesti e animazioni sono precisi al fotogramma. Con la
voce del Mac (gratuita) la sincronia è esatta sulle frasi e sulle pause.

- La voce si sceglie reel per reel, dal pannello, ascoltandola prima.
- **I crediti si spendono una volta sola, frase per frase**: ogni frase generata resta in `voci/pagate/`. Se
  cambi una frase paghi solo quella; una frase che torna uguale in un altro reel non si paga più. Spostare i punti
  in cui compaiono le cose non costa niente. (`ELEVENLABS_FRASI=no` nel file `.env` torna a una richiesta sola per
  tutto il testo.)
- **La banca delle frasi** (`voci/frasi/`): le frasi fisse dei tuoi reel ("Vediamo cosa è successo.", "Commenta
  MAPPA per…") dette una volta dalla voce dei reel. Fai leggere alla voce un testo con una frase per riga, scarica
  l'mp3 e lancia `npm run frasi audio.mp3 testo.txt`: il kit lo taglia frase per frase. Da lì, scritte uguali, non
  costano mai. Dalla stessa registrazione il kit misura il passo della voce e lo usa per i tempi stimati.
  Una banca non fa dire parole nuove: per quelle serve la voce.
- Qualsiasi altro servizio di voce si collega con una riga nel `.env`: `voci/COME-FARE.md` ha tre esempi pronti
  (Piper sul computer, la voce del Mac scelta a mano, un servizio in rete).

**Musica di sottofondo.** Il kit ha la sua banca: quattro trame ambientali (`quiete`, `marea`, `brina`, `orbita`)
che genera lui stesso da una formula, come gli effetti di `suoni/`. Non c'è nessun file di altri e nessun diritto da
pagare. `npm run musiche` le elenca e le genera (in `.fmlab/musiche/`) per ascoltarle; durano 24 secondi e si
ripetono sotto il reel.

- Di serie è `auto`: quando il regista di serie scrive il piano sceglie la trama dal nome del reel (stesso nome,
  stessa trama) e la scrive in `piano.json` (`"musica": "marea"`).
- A mano: `npm run imposta <reel> musica=brina`. Per non averla: `musica=no`. Per il volume: `musica=30` (da 0 a 100).
- Un file `musica.mp3` nella cartella del reel (un brano tuo, o di cui hai i diritti) vince su tutto, come prima.
- Volume e sfumature sono quelli di sempre: la musica sta sotto la voce e si abbassa ancora mentre la voce parla.
- I reel che c'erano già non hanno una trama scritta e restano senza musica, come prima.

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

**Un'atmosfera per reel.** Il fondo (foschia, pulviscolo, luci) ha cinque varianti: `classica` (il fondo di sempre),
`serra`, `abisso`, `alba`, `notte`. Cambiano tre cose che il fondo sapeva già fare: il colore della foschia, quanto è
densa, quanti raggi scendono dall'alto. Lo stile resta quello: fondo scuro, un colore solo.

- Di serie è `auto`: quando il regista di serie scrive il piano (`npm run fai`, `npm run regia`) sceglie l'atmosfera
  dal nome del reel. Lo stesso nome dà sempre la stessa; se è quella del reel che viene prima nella cartella, prende
  la successiva dell'elenco. La scelta resta scritta in `piano.json` (`"atmosfera": "serra"`).
- A mano: `npm run imposta <reel> atmosfera=alba`. Vince su quella del piano. Un nome sbagliato dà l'elenco dei nomi.
- I reel che c'erano già (`gps`, `reta-ginocchio`, `reta-testo`, `mots-c`) non hanno un'atmosfera scritta e restano
  sul fondo di sempre: i loro fotogrammi sono identici a prima.
- Una scena che chiede il suo colore (il rosso di un "attenzione") lo tiene, in qualunque atmosfera.

## Dove sono le cose

```
AGENTS.md           il file che l'agente legge da solo (rimanda alla scheda)
CLAUDE.md           lo stesso, con il nome che cercano altri agenti
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
riferimenti/        i numeri dei video di riferimento e cosa si vede nei loro fotogrammi (i video li metti tu: Git li ignora)
```

## Voce vera e illustrazioni: i comandi, in ordine

Si fanno sul tuo computer, con le chiavi nel file `.env` (mai altrove). Ogni spesa è una riga sola e il kit chiede
prima.

```
git pull
npm install
npm test                              # 80 prove veloci: devono passare tutte
npm run collaudo                      # controlla Chrome, ffmpeg, voce su questo computer
npm run fai reta-testo                # gratis: regia, monta, tempi, provini; si ferma prima della voce e dice il costo
npm run fai reta-testo voce=si        # SPESA: circa 1.750 crediti ElevenLabs (un credito a carattere), una volta sola
npm run affianca reta-testo           # gratis: il foglio da guardare (servono i tuoi video in riferimenti/)
npm run riuso reta-testo              # gratis: chiude il reel
```

Cosa guardare dopo la voce: la durata (deve stare entro 5 secondi da quella chiesta), `verifica.md` senza errori, e
nella tabella di `confronta` le cinque righe che senza voce restano vuote (volume, ritardo dei sottotitoli, musica,
effetti). Se sposti segni, enfasi o suoni la voce non si rifà e non costa.

Le illustrazioni (facoltative: i soggetti disegnati dal kit ci sono già). Nel `.env`: `FMLAB_IMMAGINI=higgsfield`,
`HF_API_KEY_ID`, `HF_API_KEY_SECRET`. Elenco, descrizioni e comandi pronti sono in `reels/reta-testo/immagini.md`.

```
npm run immagine reta-testo "<la prima descrizione dell'elenco>"     # SPESA: una generazione
```

Fanne **una sola**, guardala (fondo tolto bene? stile del foglio `stile/FOGLIO_IMMAGINI.md`?), poi le altre sei.
Costo: il prezzo a immagine va letto sul listino di Higgsfield prima di lanciare; le stime trovate vanno da 0,02 a
0,14 dollari, quindi da 0,40 a 2,80 dollari per una ventina di tentativi. Non è verificato. La stessa descrizione,
la seconda volta, esce dalla biblioteca e non costa.

## Limiti noti

Scritti qui perché chi fa i reel sappia cosa non è stato ancora provato.

- **Mai provato con la voce vera.** Il kit è stato finito su un computer senza chiavi: voce ElevenLabs, voce del Mac,
  velocizzazione per stare nella durata e le misure dell'audio vanno guardate al primo reel vero.
- **La voce frase per frase è provata solo con un ElevenLabs finto.** Al primo reel vero va ascoltato se le frasi
  legano tra loro e con quelle della banca; se non legano, `ELEVENLABS_FRASI=no`.
- **Il primo avvio su un Mac pulito non è ancora stato provato.** La prova è pronta: su GitHub, pagina Actions,
  "primo-avvio-mac", "Run workflow". Su un Mac di GitHub (Apple Silicon) installa il kit da zero, passa le prove, fa
  un reel di prova senza voce e accende la dashboard; in fondo lascia la bozza da scaricare e guardare. Dura una
  decina di minuti e i minuti dei Mac contano dieci volte: per questo non parte da sola.
- **Una prova lenta oscilla**: quella del metro che conta le parole dei sottotitoli è fallita una volta su tre giri
  (47 parole contate contro 41 vere, il limite è 46). I fotogrammi sono identici da un giro all'altro: è il conteggio
  del metro a essere al limite, non il video.
- **La dashboard è provata nel browser su Linux**, non su un Mac: che si apra da sola nel browser e che "Apri la
  cartella" apra il Finder va guardato lì una volta.
- **Mai provato con un servizio di immagini vero**, e nemmeno il ritaglio dal fondo magenta su un'immagine vera.
- **Mai provato sul Mac del 2017**: i tempi di render scritti qui (circa 14 minuti per un reel di 112 secondi) sono
  di un computer a due processori.
- **Nessun altro agente ha ancora fatto un reel seguendo solo `SCHEDA.md`.** È la prova che conta: dagli un testo,
  la frase di `PROMPT.md` e guarda se arriva al video senza aiuto.
- **La prova cieca non l'ha fatta nessuno** (`npm run prova-cieca`, tre persone). Parere di chi ha costruito il kit:
  oggi i reel del kit si distinguono dai riferimenti. I soggetti sono disegni piatti con un alone, là sono
  illustrazioni con volume; il verde del kit è acqua, là è lime; il narratore là è più grande.
- **Formati 1:1 e 16:9**: provati su un reel breve e guardati su pochi fotogrammi. Zone sicure e narratore sopra le
  scritte lì non vengono controllati dalla verifica: guarda i provini.
- **Lingue**: giapponese provato sul testo e sui sottotitoli, non con la voce. Arabo ed ebraico (da destra a
  sinistra) non provati. Il corpo che si stringe sulle parole lunghe è provato sul calcolo, non su un video tedesco.
- **`package-lock.json` non c'è**: qui non si poteva creare (serve la rete). Le versioni in `package.json` sono
  esatte, ma per avere installazioni identiche ovunque va fatto una volta sul tuo computer:
  `npm install --package-lock-only`, poi `git add package-lock.json`, commit e push.
- **Il regista di serie** (`npm run regia`) fa un piano valido ma semplice: il reel bello viene dal piano
  migliorato a mano, scena per scena.

## Da dove vengono le idee

- **LTX-2.5** (Lightricks): studiato come si descrive una ripresa (inquadratura, movimento di camera con il suo
  nome, azione). Da lì `campo` e `camera` di ogni scena. Nel kit non c'è né il modello né una riga del loro codice.
- **OpenMontage** (licenza AGPL-3.0): studiati il punteggio contro i video fatti di cartelli e le regole di
  varietà. Sono riscritti qui da zero sul piano del kit: **nessun loro file e nessuna riga copiata**. Se un giorno
  si copia un loro file va scritto qui con il percorso, perché da quel momento chi riceve il kit ha diritto al
  sorgente.
- La tabella di cosa è diventato cosa è in `riferimenti/ANALISI.md`.

## Da sapere

- I reel inclusi non hanno ancora la voce: i tempi delle parole sono stimati e i video non sono nella cartella.
  Per farli: `npm run fai reta-testo`, oppure `npm run voce gps` e poi `npm run render gps` (o i pulsanti del pannello).
- Il pannello si apre solo con il codice che compare nel Terminale. Con `rete` è raggiungibile da chi sta sulla
  tua stessa rete Wi-Fi e conosce quel codice: non usarlo su reti pubbliche.
- La musica puoi aggiungerla dall'app quando pubblichi, oppure metterla nel video con un file `musica.mp3`.
- Se chiudi un reel con "Commenta X e ti mando le fonti", poi le fonti vanno mandate davvero: sono già
  pronte in `didascalia.md`.
- I caratteri inclusi (Inter) hanno licenza libera: vedi `stile/font/LICENZA-Inter.txt`.
- Il kit non pubblica niente. In rete manda solo il testo del copione, e solo al servizio di voce che scegli tu:
  a ElevenLabs quando generi la voce con quel servizio, oppure al servizio che colleghi con `FMLAB_VOCE_COMANDO`
  (`voci/COME-FARE.md` ha tre esempi: due lavorano sul computer e non mandano niente, uno manda le frasi al servizio
  che indichi). Con la voce del Mac e con i tempi stimati non parte niente. Le immagini generate, se le accendi,
  mandano la descrizione dell'immagine al servizio scelto in `FMLAB_IMMAGINI`.
