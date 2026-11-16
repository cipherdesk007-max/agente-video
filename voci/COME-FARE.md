# Le voci

Il kit sa parlare in quattro modi. Si sceglie per ogni reel, dal pannello ("Scegli la voce") oppure con
`npm run imposta <reel> voce=mac` (o `elevenlabs`, `comando`, `stima`, `auto`).

| Motore | Costa | Sincronia | Quando |
|---|---|---|---|
| `stima` | niente | stimata, video muto | mentre si costruiscono le scene |
| `mac` | niente | esatta sulle frasi e sulle pause | bozze con la voce, o video finali senza abbonamenti |
| `elevenlabs` | crediti | esatta, lettera per lettera | video finali |
| `comando` | dipende dal servizio | esatta sulle frasi e sulle pause | qualsiasi altro servizio di voce |

## Come non sprecare crediti

- Costruisci tutto con `stima` (o con la voce del Mac): i crediti si spendono una volta, alla fine.
- **ElevenLabs viene chiamato solo se cambia qualcosa**: se testo, voce e impostazioni sono gli stessi
  dell'ultima volta, `npm run voce` riusa l'audio che c'è già e scrive `crediti: 0`. Spostare o aggiungere
  `[segni]` e `*enfasi*` non cambia il testo: non costa niente.
- Con il motore `comando` il riuso è frase per frase: se cambi una frase del copione, si rigenera solo quella.
- Per rifare apposta una voce identica (per esempio dopo aver cambiato la voce sul sito): `npm run voce <reel> nuova`.
- Ascoltare le voci dal pannello non costa crediti: quelle di ElevenLabs hanno un assaggio già pronto, quelle
  del Mac sono gratuite.

## Scegliere la voce

- **ElevenLabs**: nel pannello compare l'elenco delle voci del tuo account, ognuna con l'assaggio da ascoltare.
  La voce scelta resta salvata nel reel (`impostazioni.json`), una per lingua. Se non scegli niente vale
  `ELEVENLABS_VOICE_ID` del file `.env`.
- **Mac**: l'elenco è quello delle voci installate per la lingua del reel; "Ascolta questa voce" legge la prima
  frase del copione. Le voci migliori ("Premium", "Enhanced") si scaricano da Impostazioni di Sistema →
  Accessibilità → Contenuto letto ad alta voce → Voce di sistema → Gestisci voci.

## Collegare un altro servizio (motore `comando`)

Qualsiasi servizio che trasforma un testo in un file audio si collega con un piccolo programma. Nel file `.env`:

```
FMLAB_VOCE_COMANDO=node voci/mia-voce.mjs {testo} {uscita} {lingua} {voce}
```

Il kit lancia quel comando **una volta per frase**, sostituendo:

| Segnaposto | Diventa |
|---|---|
| `{testo}` | il percorso di un file di testo con la frase da leggere |
| `{uscita}` | il percorso dove il programma deve scrivere l'audio (WAV, MP3, AIFF…: qualsiasi formato) |
| `{lingua}` | la lingua del reel: `it`, `en`… |
| `{voce}` | il nome della voce scelta per quel reel (può essere vuoto) |

Il programma deve solo: leggere la frase, chiedere l'audio al servizio, scriverlo nel file d'uscita, uscire
senza errori. Il kit pensa al resto: unisce le frasi, misura le pause, calcola i tempi di ogni parola, riusa
le frasi già fatte.

`voci/modello.mjs` è un programma già scritto a metà: ci sono da riempire l'indirizzo del servizio, la chiave
e il modo in cui il servizio vuole ricevere il testo (tre righe segnate con `DA COMPLETARE`). La chiave va nel
file `.env`, mai nel programma.

Per provarlo: `npm run voce <reel> comando`. Se qualcosa non va, il messaggio riporta quello che ha risposto
il programma.
