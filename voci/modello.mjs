// FMLAB Reel Kit — modello per collegare un servizio di voce qualsiasi (motore "comando").
//
// Nel file .env:
//   FMLAB_VOCE_COMANDO=node voci/modello.mjs {testo} {uscita} {lingua} {voce}
//   MIA_VOCE_CHIAVE=la-chiave-del-servizio
//
// Il kit chiama questo programma una volta per frase. Qui sotto ci sono tre righe da completare con
// l'indirizzo e il formato del servizio che usi (li trovi nella sua documentazione, alla voce "text to speech").
import fs from 'node:fs';

const [fileTesto, fileUscita, lingua, voce] = process.argv.slice(2);
const testo = fs.readFileSync(fileTesto, 'utf8');
const chiave = process.env.MIA_VOCE_CHIAVE;
if (!chiave) {
  console.error('Manca MIA_VOCE_CHIAVE nel file .env');
  process.exit(1);
}

// DA COMPLETARE 1: l'indirizzo a cui il servizio riceve il testo
const indirizzo = 'https://esempio.invalid/v1/voce';

const risposta = await fetch(indirizzo, {
  method: 'POST',
  // DA COMPLETARE 2: come il servizio vuole la chiave (di solito così, oppure in un'intestazione con un altro nome)
  headers: {Authorization: `Bearer ${chiave}`, 'Content-Type': 'application/json'},
  // DA COMPLETARE 3: i nomi dei campi che il servizio si aspetta
  body: JSON.stringify({text: testo, voice: voce || undefined, language: lingua}),
});

if (!risposta.ok) {
  console.error(`Il servizio ha risposto ${risposta.status}: ${(await risposta.text()).slice(0, 300)}`);
  process.exit(1);
}

// Qui si assume che il servizio risponda direttamente con il file audio.
// Se invece risponde con un JSON che contiene l'audio (in base64, o l'indirizzo da cui scaricarlo), va letto da lì.
fs.writeFileSync(fileUscita, Buffer.from(await risposta.arrayBuffer()));
