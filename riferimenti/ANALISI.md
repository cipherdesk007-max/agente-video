# I tre video di riferimento: cosa c'è dentro

I tre mp4 non stanno nel repository (sono di un'altra pagina): Francesco li mette a mano in questa cartella,
che Git ignora. Servono per capire il **linguaggio visivo**, non per copiare personaggio, marchio o testi.

## Misurato sui file

Misure del 16/11/2026 con `npm run confronta riferimenti` (il metro del kit, `motore/confronta.mjs`). I numeri completi
e le soglie che ne derivano stanno in `misure.json`; qui i principali. In questa cartella i file si chiamano
`rif1.mp4`, `rif2.mp4`, `rif3.mp4`, nell'ordine della tabella.

| | Rif. 1 (sport e peptidi) | Rif. 2 (reta nel corpo) | Rif. 3 (reta e ginocchio) | Kit: `reta-ginocchio` |
|---|---|---|---|---|
| Formato, durata | 576×1024, 54,0 s | 576×1024, 51,9 s | 576×1024, 55,3 s | 1080×1920, 114,7 s |
| Tagli netti | 0 | 0 | 0 | 0 |
| Secondi tra due novità (mediana) | 1,73 | 1,75 | 1,50 | **2,70** |
| Movimento sul palco | 4,95% | 4,40% | 3,51% | **0,62%** |
| Tempo con il palco fermo | 0,2% | 6,4% | 0,2% | **56,6%** |
| Fermo più lungo | 0,1 s | 1,5 s | 0,1 s | **4,4 s** |
| Palco occupato | 0,42 | 0,56 | 0,52 | 0,46 |
| Narratore: cambi di posa al minuto | 40 | 53 | 40 | **15,7** |
| Narratore: secondi nella stessa posa (mediana / massimo) | 1,4 / 3,3 | 1,0 / 3,2 | 1,35 / 2,8 | **2,7 / 11,6** |
| Sottotitoli: altezza sul fotogramma | 0,189 | 0,190 | 0,189 | 0,187 |
| Sottotitoli: parole insieme (media / massimo) | 2,9 / 5 | 2,7 / 6 | 3,2 / 6 | 3,1 / 5 |
| Parole al minuto (contate dai sottotitoli) | 172 | 174 | 223 | 147 (tempi stimati) |
| Sottotitoli rispetto alla voce | 0,07 s prima | 0,07 s prima | 0,09 s prima | senza voce: non misurato |
| Volume | −14,6 LUFS | −14,5 LUFS | −14,4 LUFS | senza voce (il kit porta la voce a −14,0) |
| Fondo sotto la voce (musica) | 11,4 LU | 12,1 LU | 10,2 LU | nessuna musica |
| Luminosità media | 0,16 | 0,15 | 0,19 | 0,14 |

In grassetto quello che è fuori dalle soglie. **Correzione:** la prima versione di questa pagina dava il riferimento 1
a −17,7 LUFS; rimisurato, è a −14,6 (gli altri due a −14,5 e −14,4). Il volume del kit è già quello giusto.

Cosa il metro non sa dire: se una scena è un luogo disegnato o una scheda (palco occupato e dettaglio danno numeri
simili per i riferimenti e per il kit: lo decide la prova cieca); cosa c'è dietro il narratore (lo controlla
`npm run verifica`, che conosce le scene); se le parole pronunciate sono quelle del testo (serve un riconoscitore
della voce, che il kit non ha ancora).

## Visto nei fotogrammi

- **Nessun taglio.** Una scena diventa la successiva: la camera entra in un oggetto, il fondo cambia colore,
  un elemento resta e il resto gli cresce intorno.
- **Un protagonista che attraversa tutto il video.** La catena del peptide (pallini luminosi) c'è quasi in
  ogni scena: entra nel sangue, si aggancia ai recettori, sta sul piatto della bilancia, sopra le fiale.
- **Ogni scena è un luogo o un oggetto disegnato, non una scheda.** Stadio con i fari, spogliatoio, palco con
  il pubblico, laboratorio, vaso sanguigno, membrana con tre recettori, cervello in sezione, stomaco, isole
  del pancreas, lobulo del fegato, sagoma del corpo con gli organi, bilancia d'ottone, manichino di legno.
- **Illustrazione ricca con profondità:** volumi ombreggiati, bagliori, nebbia, particelle, fasci di luce,
  fondo scuro quasi nero con una tinta per reel (verde, rosso, ambra).
- **Poche scritte sul palco:** un numero grande con un'etichetta piccola (`34 PLAYERS`, `86% REACHED NORMAL`,
  `1,019 ADULTS`), una targa, due etichette. Mai elenchi, mai paragrafi.
- **Lo stesso oggetto cambia stato** invece di essere sostituito: il recettore grigio diventa verde, il
  lobulo passa da chiaro a rosso, l'ago dell'indicatore scende, la barra si svuota.
- **Sottotitoli in alto**, da una a sei parole che si aggiungono una alla volta: quella detta in bianco pieno, le
  altre attenuate, la parola chiave dentro un riquadro con due maniglie. Entrano sfocate e si mettono a fuoco;
  compaiono 0,07-0,09 s prima della voce. È lo stesso disegno dei sottotitoli del kit, che qui è già allineato.
- **Narratore in basso a destra**, mezzo busto, circa il 40% della larghezza: posa diversa in quasi ogni
  fotogramma (dito alzato, mani aperte, mano al mento, indica di lato, telefono in mano nella chiusura).
- **Chiusura:** "Comment PAROLA" grande al centro, con il protagonista ancora in scena.

## Dove il kit oggi è lontano (misurato)

Dal confronto qui sopra, in ordine di distanza. È l'elenco dei lavori delle fasi 2, 3 e 4.

1. **Il palco sta fermo.** Fermo per il 57% del tempo (riferimenti: da 0,2 a 6,4%), fino a 4,4 secondi di fila
   (riferimenti: al massimo 1,5); movimento medio 0,62% contro 3,5-5%. Nei riferimenti la camera, la luce o un
   oggetto si muovono sempre. → fase 2: scene a livelli, parallasse, camera che entra ed esce, particelle e fasci.
2. **Le novità arrivano più di rado.** Una ogni 2,7 secondi contro 1,5-1,75. → fasi 2 e 3: stati degli oggetti e
   più agganci per frase nel piano di regia.
3. **Il narratore cambia poco.** 16 cambi al minuto contro 40-53; la stessa posa per 2,7 secondi contro 1,0-1,4, e
   fino a 11,6 secondi contro 3,3. → fase 4: più pose, un gesto a ogni frase breve.
4. **Niente musica né tappeto sotto la voce**, pochi effetti. → fase 4.
5. **Voce più lenta** nei tempi stimati (147 parole al minuto contro 172-223): da rimisurare con la voce vera.
6. Non si misura ma si vede: le scene pronte sono schede di interfaccia su fondo uniforme, gli oggetti 3D sono
   solidi semplici, le scene si danno il cambio invece di trasformarsi, manca un protagonista ricorrente, le scene
   le scrive un agente esterno. → fasi 2 e 3, con la prova cieca come giudice.

Già allineati: nessun taglio, posizione e disegno dei sottotitoli, parole a schermo insieme, contrasto, luminosità
del fondo, numero di tinte, palco occupato, volume della voce.

## Cosa si impara da chi fa video con i modelli (studiato il 17/11/2026)

Due progetti letti per il metodo, su indicazione di Francesco. Nessuno dei due è dentro il kit.

### LTX-2.5 (Lightricks): come si descrive una ripresa

Fonti: `github.com/Lightricks/LTX-2` (pagina del progetto), `docs.ltx.io` (guida ai prompt, generazione in due tempi,
risoluzione nativa). Il modello non si può usare sul Mac del 2017 (pesi di circa 66 GB, schede NVIDIA); via servizio
costa a secondi di video. Qui interessa come chiede di descrivere una ripresa, perché è la stessa cosa che deve
fare il piano di regia.

| Cosa fa LTX | Cosa è diventato nel kit |
|---|---|
| Ogni ripresa si apre dichiarando l'inquadratura (scala del campo) | `campo`: largo, medio, stretto, per scena; il controllo avvisa se due scene di fila sono uguali |
| Il movimento di camera ha un nome (spinge, si allontana, carrella, sale, gira, ferma) | `camera`: spinta, indietro, destra, sinistra, sale, scende, gira, ferma; "ferma" pesa nel rischio cartelli |
| Si descrivono azioni, con un verbo per frase: l'aspetto da solo non dà movimento | un segno conta solo se fa comparire o cambiare qualcosa; `cambia` negli oggetti 3D; stati del protagonista |
| Più riprese in fila: 2-4, ognuna con un compito; a ogni taglio si ridice chi c'è e cosa resta uguale | `perche` per scena; protagonista unico; stesso colore per lo stesso soggetto in tutto il reel |
| Una sola logica di luce per ripresa, pochi soggetti | una `tinta` per scena; i blocchi non accettano più elementi di quanti ne entrano |
| Due tempi: prima la composizione a bassa risoluzione, poi il dettaglio | `npm run fai`: piano e provini senza spendere, poi voce e video |
| La durata si adatta all'azione descritta; le pause vanno scritte | la durata di una scena è quella delle sue parole; il controllo segnala oltre 3,5 secondi senza novità |
| Le scritte dentro i video generati vengono male: brevi, e quelle importanti si aggiungono dopo | qui le scritte le disegna il kit: è il motivo per cui il rendering resta in casa |

### OpenMontage: l'agente fa il regista, il programma controlla

Fonte: `github.com/OpenMontageInc/OpenMontage` (letti `lib/slideshow_risk.py`, `skills/pipelines/explainer/scene-director.md`,
`skills/meta/reviewer.md`). Licenza AGPL-3.0: vedi `STATO.md`, "Da dove viene cosa".

| Cosa fa OpenMontage | Cosa è diventato nel kit |
|---|---|
| Non c'è un programma che orchestra: lo fa l'agente, leggendo le istruzioni di ogni tappa | il regista è l'agente; le istruzioni sono il primo capitolo di `SCHEDA.md`; il piano è un file solo |
| Tappe fisse con salvataggio: ricerca, proposta, copione, piano delle scene, materiali, montaggio, composizione | `npm run fai`: otto tappe salvate, si riparte dalla prima non riuscita |
| Prima di comporre misura il "rischio diapositive" su sei voci e sopra una soglia non va avanti | "rischio cartelli" in `npm run piano`: sette voci, da 0 a 100; "alto" ferma il render |
| Varietà: mai più di tre scene dello stesso tipo di fila, almeno tre tipi diversi | stessi due controlli, come consigli del piano |
| Ogni scena dichiara soggetto, movimento del soggetto, ambiente, inquadratura, camera | `blocco`+`dati`, segni e `cambia`, `luogo`+`tinta`, `campo`, `camera` |
| Revisione dopo il render: se fallisce il video non viene presentato | `fai` dice "fatto" solo se `verifica` passa |
| Preventivo, soglia di spesa per azione, cancello di approvazione | `fai` si ferma prima della voce a pagamento e dice i crediti; riparte con `voce=si` |
| Voce gratuita senza rete (Piper) e riconoscimento parola per parola (WhisperX) | non ancora nel kit: si possono collegare oggi come voce `comando`; sono la strada per la voce di prova e per il controllo "detto = scritto" |
