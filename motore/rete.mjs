// FMLAB Reel Kit — LE CHIAMATE AI FORNITORI (voce, immagini): mai senza un limite di tempo, riprovate solo quando serve.
//
// Una chiamata a un servizio esterno può restare appesa per sempre, e allora il kit sembra bloccato senza dire
// perché. Qui ogni chiamata ha 90 secondi per rispondere, corpo compreso; se non ce la fa, l'errore dice di riprovare.
// Si riprova da soli solo quando il servizio dice "adesso no, più tardi": 429 (troppe richieste) e gli errori 5xx.
// Al massimo tre tentativi, aspettando i secondi che il servizio chiede (Retry-After), o 20 se non lo dice.
// Mai su 401, 402, 404, 422: lì riprovare non cambia niente, e può costare.
//
//   FMLAB_ATTESA_FORNITORE=90   secondi concessi a ogni chiamata        FMLAB_ATTESA_RIPROVA=20   secondi tra due tentativi
import {ErroreFmlab} from './percorsi.mjs';

export const TENTATIVI = 3;
const numero = (nome, diSerie) => {
  const n = Number(String(process.env[nome] ?? '').replace(',', '.'));
  return process.env[nome] !== undefined && process.env[nome] !== '' && Number.isFinite(n) && n >= 0 ? n : diSerie;
};
/** Si riprova solo su "troppe richieste" e sugli errori del servizio: mai su un rifiuto. */
export const siRiprova = (stato) => stato === 429 || (stato >= 500 && stato <= 599);

/** I secondi da aspettare prima di riprovare: quelli chiesti dal servizio (un numero o una data), altrimenti 20. */
export function attesaRiprova(testata, diSerie = numero('FMLAB_ATTESA_RIPROVA', 20)) {
  const grezzo = String(testata ?? '').trim();
  if (/^\d+(\.\d+)?$/.test(grezzo)) return Math.min(300, Number(grezzo));
  const data = Date.parse(grezzo);
  if (grezzo && Number.isFinite(data)) return Math.min(300, Math.max(0, (data - Date.now()) / 1000));
  return diSerie;
}

/**
 * Chiama un fornitore. Torna {ok, status, tentativi, testate, corpo (Buffer), testo(), json()}: il corpo è già letto,
 * dentro lo stesso limite di tempo. Una risposta che non è "ok" torna a chi chiama, che sa cosa dire; qui si lancia
 * un errore solo se il servizio non risponde in tempo o non si raggiunge.
 * @param {string} nome  il nome da dire a chi legge l'errore ("ElevenLabs")
 */
export async function chiamaFornitore(nome, indirizzo, opzioni = {}, {riprova = true, quando = null} = {}) {
  const limite = numero('FMLAB_ATTESA_FORNITORE', 90);
  const massimo = riprova ? TENTATIVI : 1;
  for (let tentativo = 1; ; tentativo++) {
    const guardia = new AbortController();
    const sveglia = setTimeout(() => guardia.abort(), limite * 1000);
    let risposta;
    let corpo;
    try {
      risposta = await fetch(indirizzo, {...opzioni, signal: guardia.signal});
      corpo = Buffer.from(await risposta.arrayBuffer());
    } catch (e) {
      if (guardia.signal.aborted) {
        throw new ErroreFmlab(`${nome} non ha risposto entro ${String(limite).replace('.', ',')} secondi. Riprova tra poco: quello che era già arrivato resta salvato e non viene richiesto di nuovo.`);
      }
      throw new ErroreFmlab(`Non riesco a raggiungere ${nome} (${e.cause?.code ?? e.message}). Controlla la connessione e riprova.`);
    } finally {
      clearTimeout(sveglia);
    }
    if (siRiprova(risposta.status) && tentativo < massimo) {
      const secondi = attesaRiprova(risposta.headers.get('retry-after'));
      quando?.({tentativo, stato: risposta.status, secondi});
      console.log(`  ${nome} ha risposto ${risposta.status}: riprovo tra ${String(Math.round(secondi * 10) / 10).replace('.', ',')} secondi (tentativo ${tentativo + 1} di ${massimo}).`);
      await new Promise((ok) => setTimeout(ok, secondi * 1000));
      continue;
    }
    return {
      ok: risposta.ok,
      status: risposta.status,
      tentativi: tentativo,
      testate: risposta.headers,
      corpo,
      testo: () => corpo.toString('utf8'),
      json: () => JSON.parse(corpo.toString('utf8')),
    };
  }
}
