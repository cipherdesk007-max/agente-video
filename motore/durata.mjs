// FMLAB Reel Kit — la durata chiesta. Regola fissa: il reel dura quanto è stato chiesto, con al massimo 5 secondi
// di scarto. Il testo non si tocca: se la voce è troppo lunga la si velocizza (voce e tempi insieme, della stessa
// misura); se non basta nemmeno alla velocità massima, lo si dice prima di spendere, con le parole da togliere.
//
// La durata chiesta sta in impostazioni.json del reel (campo "durata", in secondi; null = nessuna richiesta):
//   npm run imposta <reel> durata=45        oppure dal pannello
export const TOLLERANZA = 5;
/** Oltre questa velocità la voce non si capisce più bene. */
export const VELOCITA_MASSIMA = 1.4;
export const DURATA = {min: 15, max: 180};
/** Ritmo di una voce naturale: circa 200 parole al minuto (300 in 90 secondi), pause comprese. */
export const PAROLE_AL_SECONDO = 200 / 60;

const tre = (x) => Math.round(x * 1000) / 1000;

/**
 * Decide la velocità della voce.
 * @param {{fineVoce: number, coda: number, parole: number, chiesta: number|null}} dati
 *        fineVoce = secondo in cui finisce l'ultima parola a velocità naturale; coda = secondi di chiusura dopo la voce
 * @returns {{velocita: number, durata: number, entra: boolean, paroleDaTogliere?: number, paroleMancanti?: number}}
 */
export function adattaDurata({fineVoce, coda = 1.4, parole = 0, chiesta = null}) {
  const naturale = fineVoce + coda;
  if (!chiesta) return {velocita: 1, durata: tre(naturale), entra: true};
  if (naturale > chiesta + TOLLERANZA) {
    // punta alla durata chiesta giusta, non al bordo dei 5 secondi
    const velocita = Math.min(VELOCITA_MASSIMA, fineVoce / Math.max(1, chiesta - coda));
    const durata = fineVoce / velocita + coda;
    if (durata <= chiesta + TOLLERANZA) return {velocita: tre(velocita), durata: tre(durata), entra: true};
    // quante parole stanno, alla velocità massima, nel tempo più lungo ammesso
    const entrano = Math.floor((parole * (chiesta + TOLLERANZA - coda) * VELOCITA_MASSIMA) / fineVoce);
    return {velocita: VELOCITA_MASSIMA, durata: tre(durata), entra: false, paroleDaTogliere: Math.max(1, parole - entrano)};
  }
  if (naturale < chiesta - TOLLERANZA) {
    // una voce rallentata suona finta: non si rallenta. Si dice quante parole mancano per arrivarci.
    const servono = Math.ceil((parole * (chiesta - TOLLERANZA - coda)) / Math.max(0.1, fineVoce));
    return {velocita: 1, durata: tre(naturale), entra: false, paroleMancanti: Math.max(1, servono - parole)};
  }
  return {velocita: 1, durata: tre(naturale), entra: true};
}

/** Prima di generare una voce a pagamento: quante parole possono stare, al massimo, nella durata chiesta. */
export function paroleMassime(chiesta, coda = 1.4) {
  return Math.floor((chiesta + TOLLERANZA - coda) * PAROLE_AL_SECONDO * VELOCITA_MASSIMA);
}

/** La durata più corta che si può chiedere per un testo di tante parole (arrotondata ai 5 secondi sopra). */
export function durataMinima(parole, coda = 1.4) {
  return Math.ceil((parole / (PAROLE_AL_SECONDO * VELOCITA_MASSIMA) + coda - TOLLERANZA) / 5) * 5;
}

/** Il giudizio della verifica: la durata vera sta entro 5 secondi da quella chiesta? */
export function giudicaDurata(durata, chiesta) {
  if (!chiesta) return {ok: true, scarto: 0};
  const scarto = durata - chiesta;
  return {ok: Math.abs(scarto) <= TOLLERANZA + 1e-9, scarto: Math.round(scarto * 10) / 10};
}
