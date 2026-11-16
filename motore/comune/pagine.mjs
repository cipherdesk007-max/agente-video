// FMLAB Reel Kit — divide le parole in "pagine" di sottotitoli (2-3 parole per volta).
// Questo file è usato sia dal browser (per disegnarli) sia dai comandi (per il file .srt e la verifica).

/** Parole "deboli" (articoli, preposizioni…): meglio che aprano una pagina invece di chiuderla. */
const DEBOLI = {
  it: 'a ad al alla alle allo ai agli che chi con da dal dalla dei del della delle dello di e ed gli i il in la le lo ma ne nel nella o per se su sul sulla tra fra un una uno',
  en: 'a an the of to in on at for and or but with by from as is it that this your my its',
  es: 'a al de del el la los las un una y o en con por para que se su lo',
  fr: 'à au aux de du des le la les un une et ou en dans pour par que qui sur se',
  de: 'der die das den dem des ein eine und oder in im an am auf für mit von zu zum zur dass',
  pt: 'a o as os de do da dos das um uma e ou em no na com por para que se',
};
const insiemi = new Map();
function deboliPer(lingua) {
  const chiave = String(lingua || 'it').slice(0, 2).toLowerCase();
  if (!insiemi.has(chiave)) insiemi.set(chiave, new Set((DEBOLI[chiave] ?? '').split(' ').filter(Boolean)));
  return insiemi.get(chiave);
}

/**
 * Testo di una parola come compare nei sottotitoli.
 * Con `punteggiatura: false` toglie virgole e punti (restano ? e !).
 */
export function testoSottotitolo(testo, {maiuscolo = false, punteggiatura = true, lingua = 'it'} = {}) {
  let t = String(testo);
  if (!punteggiatura) t = t.replace(/[.,;:«»"“”()…]/g, '');
  if (maiuscolo) t = t.toLocaleUpperCase(lingua);
  return t;
}

function lunghezza(parole, indici, opzioni) {
  return indici.reduce((n, i) => n + testoSottotitolo(parole[i].testo, opzioni).length, 0) + Math.max(0, indici.length - 1);
}

function debole(parola, lingua) {
  return deboliPer(lingua).has(String(parola.testo).toLowerCase().replace(/[^\p{L}']/gu, ''));
}

/**
 * @param {{testo:string,inizio:number,fine:number,frase:number,enfasi?:boolean}[]} parole
 * @returns {{indici:number[], inizio:number, fine:number, mostraDa:number, mostraA:number,
 *            parole:{indice:number,testo:string,inizio:number,fine:number,enfasi:boolean}[]}[]}
 */
export function impagina(parole, opzioni = {}) {
  const {maxParole = 5, maxCaratteri = 26, maiuscolo = false, punteggiatura = true, lingua = 'it', pausaMax = 0.55} = opzioni;
  const comeScrivere = {maiuscolo, punteggiatura, lingua};
  if (!parole.length) return [];

  // 1) gruppi: pezzi di frase senza punteggiatura né pause lunghe in mezzo
  const gruppi = [];
  let corrente = [];
  parole.forEach((p, i) => {
    corrente.push(i);
    const prossima = parole[i + 1];
    const chiude = /[.,;:!?…]["”»)]?$/.test(p.testo);
    const cambiaFrase = prossima && prossima.frase !== p.frase;
    const pausa = prossima && prossima.inizio - p.fine > pausaMax;
    if (!prossima || chiude || cambiaFrase || pausa) {
      gruppi.push(corrente);
      corrente = [];
    }
  });

  // 2) ogni gruppo diventa una o più pagine
  const pagine = [];
  for (const gruppo of gruppi) {
    const pezzi = [];
    let pezzo = [];
    for (const i of gruppo) {
      const prova = [...pezzo, i];
      if (pezzo.length && (prova.length > maxParole || lunghezza(parole, prova, comeScrivere) > maxCaratteri)) {
        pezzi.push(pezzo);
        pezzo = [i];
      } else {
        pezzo = prova;
      }
    }
    if (pezzo.length) pezzi.push(pezzo);

    // una parola debole in fondo alla pagina passa alla pagina dopo ("…DI" / "LUCE" → "…" / "DI LUCE")
    for (let k = 0; k < pezzi.length - 1; k++) {
      const a = pezzi[k];
      const b = pezzi[k + 1];
      const ultima = a[a.length - 1];
      if (a.length > 1 && debole(parole[ultima], lingua)) {
        const spostata = [ultima, ...b];
        if (spostata.length <= maxParole + 1 && lunghezza(parole, spostata, comeScrivere) <= maxCaratteri + 4) {
          a.pop();
          pezzi[k + 1] = spostata;
        }
      }
    }
    // niente parola sola in coda se la pagina prima ne ha tre: meglio 2 + 2
    for (let k = pezzi.length - 1; k > 0; k--) {
      const a = pezzi[k - 1];
      const b = pezzi[k];
      if (b.length === 1 && a.length >= 3) {
        const spostata = [a[a.length - 1], ...b];
        if (lunghezza(parole, spostata, comeScrivere) <= maxCaratteri + 4) {
          a.pop();
          pezzi[k] = spostata;
        }
      }
    }
    for (const p of pezzi) if (p.length) pagine.push(p);
  }

  // 3) tempi di ogni pagina
  return pagine.map((indici, k) => {
    const inizio = parole[indici[0]].inizio;
    const fine = parole[indici[indici.length - 1]].fine;
    const prossima = pagine[k + 1];
    const inizioProssima = prossima ? parole[prossima[0]].inizio : Infinity;
    const precedente = pagine[k - 1];
    const finePrecedente = precedente ? parole[precedente[precedente.length - 1]].fine : -Infinity;
    const mostraDa = Math.max(inizio - 0.06, Math.min(inizio, finePrecedente));
    const mostraA = inizioProssima - fine < 0.7 ? Math.max(fine, inizioProssima - 0.06) : fine + 0.35;
    return {
      indici,
      inizio,
      fine,
      mostraDa,
      mostraA,
      parole: indici.map((i) => ({
        indice: i,
        testo: testoSottotitolo(parole[i].testo, comeScrivere),
        inizio: parole[i].inizio,
        fine: parole[i].fine,
        enfasi: Boolean(parole[i].enfasi),
      })),
    };
  });
}

function orario(t) {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const due = (n) => String(n).padStart(2, '0');
  return `${due(h)}:${due(m)}:${due(s)},${String(r).padStart(3, '0')}`;
}

/** File .srt: una riga per ogni pezzo di frase, con la punteggiatura originale. */
export function creaSrt(parole) {
  if (!parole.length) return '';
  const blocchi = [];
  let corrente = [];
  parole.forEach((p, i) => {
    corrente.push(p);
    const prossima = parole[i + 1];
    const chiude = /[.;:!?…]["”»)]?$/.test(p.testo);
    const virgolaLunga = /,$/.test(p.testo) && corrente.length >= 5;
    if (!prossima || chiude || virgolaLunga || corrente.length >= 9 || prossima.frase !== p.frase) {
      blocchi.push(corrente);
      corrente = [];
    }
  });
  return (
    blocchi
      .map((b, k) => {
        const prossimo = blocchi[k + 1];
        const fine = Math.min(b[b.length - 1].fine + 0.25, prossimo ? prossimo[0].inizio : Infinity);
        return `${k + 1}\n${orario(b[0].inizio)} --> ${orario(Math.max(fine, b[0].inizio + 0.3))}\n${b.map((p) => p.testo).join(' ')}`;
      })
      .join('\n\n') + '\n'
  );
}
