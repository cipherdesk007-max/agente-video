// FMLAB Reel Kit — numeri e fonti. Regola fissa: ogni numero che si vede a schermo ha la sua riga in fonti.md.
// Qui si leggono i numeri da un testo (come li scrive una persona: 1.019 · 3,96 · 10,8% · −4,0 · 20,200) e si
// confrontano per valore, non per come sono scritti: "1.019" a schermo e "1019" nelle fonti sono lo stesso numero.
const NUMERO = /(?<![\p{L}\d])(?:\d{1,3}(?:[.  ’']\d{3})+(?:,\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)/gu;

function valore(scritto) {
  let t = scritto;
  if (/^\d{1,3}(?:[.  ’']\d{3})+(?:,\d+)?$/.test(t)) t = t.replace(/[.  ’']/g, '').replace(',', '.'); // 1.019 · 20 200 · 1.019,5
  else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(t)) t = t.replace(/,/g, ''); // 20,200 (all'inglese)
  else t = t.replace(',', '.'); // 3,96 · 3.96 · 42
  return Number(t);
}

/** Tutti i numeri di un testo, nell'ordine, come valori (il segno non conta: −4,0 vale 4). */
export function numeriNelTesto(testo) {
  return [...String(testo).matchAll(NUMERO)].map((m) => valore(m[0])).filter((n) => Number.isFinite(n));
}

/**
 * I numeri delle scritte a schermo che non compaiono in fonti.md.
 * Non contano le scritte fatte solo di un numero intero fino a 10: sono i numeri d'ordine di un elenco, i passi,
 * le tacche di una scala. (Un dato piccolo da solo, come "6", passa quindi senza controllo: va scritto con la sua unità.)
 * @param {string[]} scritte  i testi visibili sul palco
 * @param {string} fonti      il contenuto di fonti.md
 * @returns {{numero: number, testo: string}[]}
 */
export function numeriSenzaFonte(scritte, fonti) {
  const noti = numeriNelTesto(fonti);
  const presente = (n) => noti.some((x) => Math.abs(x - n) < 1e-9);
  const mancanti = new Map();
  for (const scritta of scritte) {
    const testo = String(scritta).trim();
    const numeri = numeriNelTesto(testo);
    if (!numeri.length) continue;
    if (/^[^\p{L}\d]*\d{1,2}[^\p{L}\d]*$/u.test(testo) && numeri[0] <= 10) continue;
    for (const n of numeri) if (!presente(n) && !mancanti.has(n)) mancanti.set(n, {numero: n, testo});
  }
  return [...mancanti.values()];
}
