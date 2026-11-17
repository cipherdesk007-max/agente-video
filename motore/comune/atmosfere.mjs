// FMLAB Reel Kit — LE ATMOSFERE: lo stesso fondo scuro con foschia, pulviscolo e luci, in più varianti.
//
// Un'atmosfera è una combinazione di tre cose che il fondo sa già fare (libreria/Atmosfera.tsx): il colore della
// foschia, quanto è densa, quanti raggi scendono dall'alto. Niente di nuovo da disegnare. Serve perché i reel di
// una stessa pagina non abbiano tutti lo stesso fondo; lo stile resta quello: fondo quasi nero, un colore solo.
//
//   npm run imposta <reel> atmosfera=<nome>     la sceglie a mano ("auto": decide il regista di serie, dal nome del reel)
//
// Questo file è letto sia dal motore (controlli, regista) sia dalla pagina che disegna i fotogrammi.

/** `classica` è il fondo di sempre: gli stessi tre valori che il kit usa quando nessuno dice niente. */
export const ATMOSFERE = {
  classica: {tinta: '#19C7A4', densita: 1, raggi: 0, cosa: 'il fondo di sempre: foschia verde acqua, nessun raggio'},
  serra: {tinta: '#7CF26B', densita: 0.9, raggi: 0.35, cosa: 'foschia verde lime, più leggera, con raggi dall\'alto'},
  abisso: {tinta: '#3A8BFF', densita: 1.15, raggi: 0, cosa: 'foschia blu, più densa, nessun raggio'},
  alba: {tinta: '#F2A93C', densita: 0.85, raggi: 0.5, cosa: 'foschia ambra, leggera, raggi forti dall\'alto'},
  notte: {tinta: '#9B7BFF', densita: 1, raggi: 0.2, cosa: 'foschia viola, raggi appena accennati'},
};
export const NOMI_ATMOSFERE = Object.keys(ATMOSFERE);

/** I tre valori di un'atmosfera, pronti per il fondo (o null se il nome non esiste). */
export function valoriAtmosfera(nome) {
  const a = ATMOSFERE[nome];
  return a ? {tinta: a.tinta, densita: a.densita, raggi: a.raggi} : null;
}

/** Un numero che dipende solo dal nome: lo stesso nome dà sempre lo stesso numero, su qualunque computer. */
function improntaNome(nome) {
  let h = 2166136261;
  for (const c of String(nome)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * L'atmosfera di un reel quando nessuno la sceglie: viene dal nome del reel, quindi è sempre la stessa (il kit resta
 * riproducibile, niente caso). Se è quella del reel che viene prima nella cartella, si prende la successiva
 * dell'elenco: due reel vicini non hanno lo stesso fondo.
 * @param {string} nome  il nome del reel
 * @param {string|null} precedente  l'atmosfera del reel che lo precede nella cartella, se c'è
 */
export function atmosferaDalNome(nome, precedente = null) {
  const scelta = improntaNome(nome) % NOMI_ATMOSFERE.length;
  return NOMI_ATMOSFERE[scelta] === precedente ? NOMI_ATMOSFERE[(scelta + 1) % NOMI_ATMOSFERE.length] : NOMI_ATMOSFERE[scelta];
}
