// FMLAB Reel Kit — oggetti 3D già pronti, fatti con le forme di Tre.tsx.
// Ognuno restituisce le sue facce: si mettono in <Scena3D oggetti={[...satellite3d(), ...fiala3d({…})]} />.
// I nomi finiscono tutti in "3d", per non confonderli con gli oggetti piatti di Oggetti.tsx.
// Per farne di nuovi basta copiarne uno e cambiare i pezzi: sono poche righe.
import {anello, capsula, cilindro, estrusione, gruppo, linea3d, scatola, sfera} from './Tre';
import type {Faccia, Posto, V3} from './Tre';
import {limita} from './anim';
import {miscela} from './colore';
import {stile} from '../stile/stile';

/** Satellite con due pannelli solari e l'antenna verso il basso. Largo circa 400. */
export function satellite3d({corpo = '#E9B949', pannello = '#2B5FD9', acceso = 1, ...posto}: {corpo?: string; pannello?: string; acceso?: number} & Posto = {}): Faccia[] {
  const facce: Faccia[] = [
    ...scatola({misure: [72, 86, 72], colore: corpo, colori: {sopra: '#F6D77A', sotto: '#8C6A1C'}}),
    ...scatola({misure: [44, 22, 44], colore: '#C7D2EA', pos: [0, 54, 0]}),
    // antenna parabolica verso terra
    ...cilindro({raggio: 34, raggioAlto: 8, altezza: 28, colore: '#DDE6F5', coloreTappi: '#9FB0C8', pos: [0, -57, 0], lati: 20}),
    ...cilindro({raggio: 3, altezza: 22, colore: '#9FB0C8', pos: [0, -80, 0], lati: 8}),
    // asta con la punta accesa
    ...cilindro({raggio: 3, altezza: 46, colore: '#C7D2EA', pos: [18, 88, 14], lati: 8}),
    ...sfera({raggio: 7, colore: stile.colori.luce, pos: [18, 114, 14], paralleli: 5, meridiani: 8, emissione: acceso, bagliore: acceso > 0.5 ? 10 : undefined}),
  ];
  for (const lato of [-1, 1]) {
    const cx = lato * 124;
    facce.push(...cilindro({raggio: 4, altezza: 30, colore: '#9FB0C8', pos: [lato * 50, 0, 0], ruota: [0, 0, 90], lati: 8}));
    facce.push(...scatola({misure: [150, 62, 5], colore: '#1A2F66', colori: {davanti: pannello, sopra: '#9FB0C8', sotto: '#9FB0C8'}, pos: [cx, 0, 0]}));
    // le celle del pannello
    for (let k = -2; k <= 2; k++) facce.push(...linea3d([cx + k * 30, -31, 3.2], [cx + k * 30, 31, 3.2], '#8FB4FF', 1.6, {opacita: 0.75}));
    facce.push(...linea3d([cx - 75, 0, 3.2], [cx + 75, 0, 3.2], '#8FB4FF', 1.6, {opacita: 0.75}));
  }
  return gruppo(facce, posto);
}

/** Telefono in piedi, con lo schermo acceso del colore dato. Alto circa 310. */
export function telefono3d({schermo = '#0F3A52', scocca = '#141A24', ...posto}: {schermo?: string; scocca?: string} & Posto = {}): Faccia[] {
  return gruppo(
    [
      ...scatola({misure: [150, 310, 18], colore: scocca, colori: {davanti: '#05080C'}}),
      {punti: [[-66, -146, 9.4], [66, -146, 9.4], [66, 146, 9.4], [-66, 146, 9.4]], colore: schermo, emissione: 0.9},
      ...scatola({misure: [46, 9, 2], colore: '#05080C', pos: [0, 134, 9.6]}),
    ],
    posto
  );
}

/**
 * Fiala di vetro con il liquido dentro (livello da 0 a 1) e il tappo di metallo. Alta circa 200.
 * È l'oggetto tipico dei reel su farmaci, peptidi, vaccini.
 */
export function fiala3d({liquido = stile.colori.luce, livello = 0.7, tappo = '#B9C4D6', ...posto}: {liquido?: string; livello?: number; tappo?: string} & Posto = {}): Faccia[] {
  const h = 150;
  const quanto = Math.max(0.02, Math.min(1, livello)) * (h - 8);
  return gruppo(
    [
      ...cilindro({raggio: 40, altezza: quanto, colore: liquido, pos: [0, -h / 2 + 4 + quanto / 2, 0], emissione: 0.72, opacita: 0.94, lati: 22}),
      ...cilindro({raggio: 47, altezza: h, colore: '#CFE8FF', opacita: 0.2, lati: 22}).map((f) => ({...f, doppia: true})),
      ...cilindro({raggio: 47, raggioAlto: 27, altezza: 20, colore: '#CFE8FF', opacita: 0.26, pos: [0, h / 2 + 10, 0], lati: 22, tappi: false}),
      ...cilindro({raggio: 31, altezza: 30, colore: tappo, coloreTappi: '#2C3442', pos: [0, h / 2 + 35, 0], lati: 22}),
    ],
    posto
  );
}

/** Pillola a due colori, sdraiata di sbieco. Lunga circa 200. */
export function pillola3d({colori = [stile.colori.luce2, '#F4F7FB'], ...posto}: {colori?: [string, string]} & Posto = {}): Faccia[] {
  return gruppo(capsula({raggio: 46, altezza: 200, colori, ruota: [0, 0, 62]}), posto);
}

/**
 * Colonne 3D appoggiate a terra, alte in proporzione ai valori: un grafico a barre con il volume.
 * `cresci` (0…1) le fa salire. Sono centrate attorno all'origine, la base sta a y = 0.
 */
export function barre3d({valori, colori, cresci = 1, larghezza = 80, passo = 124, altezzaMax = 340, ...posto}: {valori: number[]; colori?: string[]; cresci?: number; larghezza?: number; passo?: number; altezzaMax?: number} & Posto): Faccia[] {
  const massimo = Math.max(...valori, 0.0001);
  const facce: Faccia[] = [];
  valori.forEach((v, i) => {
    const h = Math.max(2, (v / massimo) * altezzaMax * Math.max(0, Math.min(1, cresci)));
    const x = (i - (valori.length - 1) / 2) * passo;
    facce.push(...scatola({misure: [larghezza, h, larghezza], colore: colori?.[i % colori.length] ?? stile.colori.luce, pos: [x, h / 2, 0]}));
  });
  return gruppo(facce, posto);
}

/** Freccia spessa che punta verso destra (ruotala per puntare altrove). Lunga `lunghezza`. */
export function freccia3d({lunghezza = 260, colore = stile.colori.accento, spessore = 30, ...posto}: {lunghezza?: number; colore?: string; spessore?: number} & Posto = {}): Faccia[] {
  const m = lunghezza / 2;
  const profilo: [number, number][] = [
    [-m, -18],
    [m - 70, -18],
    [m - 70, -48],
    [m, 0],
    [m - 70, 48],
    [m - 70, 18],
    [-m, 18],
  ];
  return gruppo(estrusione({profilo, profondita: spessore, colore}), posto);
}

// ───────────────────────── corpo, salute, laboratorio ─────────────────────────

/**
 * Ginocchio: il femore sopra, tibia e perone sotto (piegati di `piega` gradi), la rotula davanti.
 * `dolore` (0…1) arrossa l'articolazione. È alto circa 700: va rimpicciolito con `scala` o con lo zoom della camera.
 */
export function ginocchio3d({dolore = 0, piega = 14, coloreDolore = stile.colori.negativo, ...posto}: {dolore?: number; piega?: number; coloreDolore?: string} & Posto = {}): Faccia[] {
  const osso = '#F1E9D8';
  const d = limita(dolore);
  const caldo = miscela(osso, coloreDolore, 0.8 * d);
  const tiepido = miscela(osso, coloreDolore, 0.35 * d);
  const femore = [
    ...sfera({raggio: 44, colore: osso, pos: [0, 372, 0], paralleli: 7, meridiani: 14}),
    ...cilindro({raggio: 50, raggioAlto: 44, altezza: 240, colore: osso, pos: [0, 252, 0], lati: 18, tappi: false}),
    ...cilindro({raggio: 88, raggioAlto: 50, altezza: 74, colore: tiepido, pos: [0, 96, 0], lati: 18, tappi: false}),
    // i due condili: le "nocche" con cui il femore appoggia sulla tibia
    ...sfera({raggio: 60, colore: caldo, pos: [-40, 50, 4], emissione: 0.3 * d, paralleli: 8, meridiani: 14}),
    ...sfera({raggio: 60, colore: caldo, pos: [40, 50, 4], emissione: 0.3 * d, paralleli: 8, meridiani: 14}),
  ];
  const tibia = gruppo(
    [
      // la cartilagine tra le due ossa: è lei che si consuma nell'artrosi
      ...cilindro({raggio: 84, altezza: 16, colore: miscela('#BFE6F2', coloreDolore, 0.85 * d), pos: [0, -4, 0], emissione: 0.25 + 0.3 * d, lati: 20}),
      ...cilindro({raggio: 74, raggioAlto: 90, altezza: 40, colore: tiepido, pos: [0, -32, 0], lati: 18}),
      ...cilindro({raggio: 42, raggioAlto: 74, altezza: 84, colore: osso, pos: [0, -94, 0], lati: 18, tappi: false}),
      ...cilindro({raggio: 36, raggioAlto: 42, altezza: 220, colore: osso, pos: [0, -246, 0], lati: 18, tappi: false}),
      ...sfera({raggio: 36, colore: osso, pos: [0, -356, 0], paralleli: 7, meridiani: 14}),
      // il perone, sottile, di lato
      ...cilindro({raggio: 15, raggioAlto: 17, altezza: 270, colore: miscela(osso, '#000000', 0.08), pos: [70, -214, -16], lati: 10}),
      ...sfera({raggio: 22, colore: osso, pos: [70, -76, -16], paralleli: 6, meridiani: 10}),
    ],
    {ruota: [piega, 0, 0]}
  );
  const rotula = gruppo(sfera({raggio: 34, colore: miscela(osso, coloreDolore, 0.45 * d), paralleli: 7, meridiani: 12}), {pos: [0, 34, 84]});
  return gruppo([...femore, ...tibia, ...rotula], posto);
}

/**
 * Molecola a palline e bastoncini: un anello di sei atomi con tre atomi attaccati. Larga circa 360.
 * Per i reel su farmaci, peptidi, integratori: è "il principio attivo".
 */
export function molecola3d({colori = [stile.colori.luce, stile.colori.luce2, stile.colori.accento], legame = '#AEBBCB', ...posto}: {colori?: [string, string, string]; legame?: string} & Posto = {}): Faccia[] {
  const R = 104;
  const anello: V3[] = Array.from({length: 6}, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * R, Math.sin(a) * R, i % 2 ? 16 : -16] as V3;
  });
  const fuori: {da: number; pos: V3; colore: string; r: number}[] = [
    {da: 0, pos: [196, 96, 34], colore: colori[2], r: 34},
    {da: 2, pos: [-196, 96, -30], colore: colori[1], r: 30},
    {da: 4, pos: [0, -214, 40], colore: colori[2], r: 28},
  ];
  const facce: Faccia[] = [];
  anello.forEach((p, i) => facce.push(...linea3d(p, anello[(i + 1) % 6], legame, 12)));
  fuori.forEach((f) => facce.push(...linea3d(anello[f.da], f.pos, legame, 12)));
  anello.forEach((p, i) => facce.push(...sfera({raggio: 40, colore: i % 3 === 0 ? colori[1] : colori[0], pos: p, paralleli: 8, meridiani: 14, emissione: 0.18})));
  fuori.forEach((f) => facce.push(...sfera({raggio: f.r, colore: f.colore, pos: f.pos, paralleli: 7, meridiani: 12, emissione: 0.22})));
  return gruppo(facce, posto);
}

/**
 * Doppia elica del DNA, in piedi: due file di palline che si avvolgono, unite dai gradini. Alta circa 560.
 * `giro` (gradi) la fa ruotare su sé stessa: `giro: s.t * 40`.
 */
export function dna3d({colori = [stile.colori.luce, stile.colori.luce2], gradini = 12, giro = 0, ...posto}: {colori?: [string, string]; gradini?: number; giro?: number} & Posto = {}): Faccia[] {
  const facce: Faccia[] = [];
  const R = 86;
  const passo = 46;
  for (let i = 0; i < gradini; i++) {
    const a = ((i * 34 + giro) * Math.PI) / 180;
    const y = (i - (gradini - 1) / 2) * passo;
    const p1: V3 = [Math.cos(a) * R, y, Math.sin(a) * R];
    const p2: V3 = [-Math.cos(a) * R, y, -Math.sin(a) * R];
    facce.push(...linea3d(p1, p2, '#C9D4E3', 9));
    facce.push(...sfera({raggio: 25, colore: colori[0], pos: p1, paralleli: 6, meridiani: 10, emissione: 0.25}));
    facce.push(...sfera({raggio: 25, colore: colori[1], pos: p2, paralleli: 6, meridiani: 10, emissione: 0.25}));
  }
  return gruppo(facce, posto);
}

/**
 * Siringa in piedi, con l'ago verso il basso. `livello` (0…1) è il liquido che resta: abbassandolo lo stantuffo scende.
 * Alta circa 520.
 */
export function siringa3d({liquido = stile.colori.luce, livello = 0.7, ...posto}: {liquido?: string; livello?: number} & Posto = {}): Faccia[] {
  const h = 230;
  const pieno = limita(livello, 0.02, 1) * (h - 16);
  const base = -h / 2 + 8;
  return gruppo(
    [
      // ago e innesto
      ...cilindro({raggio: 3.5, altezza: 150, colore: '#D8E0EA', pos: [0, -h / 2 - 104, 0], lati: 8, emissione: 0.3}),
      ...cilindro({raggio: 20, raggioAlto: 9, altezza: 30, colore: '#8FA0B5', pos: [0, -h / 2 - 15, 0], lati: 14}).map((f) => ({...f, doppia: true})),
      // liquido, poi il vetro attorno
      ...cilindro({raggio: 36, altezza: pieno, colore: liquido, pos: [0, base + pieno / 2, 0], emissione: 0.7, opacita: 0.94, lati: 20}),
      ...cilindro({raggio: 42, altezza: h, colore: '#CFE8FF', opacita: 0.2, lati: 20}).map((f) => ({...f, doppia: true})),
      // stantuffo: il tappo di gomma sopra il liquido, l'asta, il piattello per il pollice
      ...cilindro({raggio: 37, altezza: 18, colore: '#2C3442', pos: [0, base + pieno + 9, 0], lati: 20}),
      ...cilindro({raggio: 9, altezza: 190, colore: '#B9C4D6', pos: [0, base + pieno + 18 + 95, 0], lati: 10}),
      ...cilindro({raggio: 46, altezza: 12, colore: '#B9C4D6', pos: [0, base + pieno + 18 + 196, 0], lati: 18}),
      // le alette per le dita
      ...scatola({misure: [150, 10, 40], colore: '#B9C4D6', pos: [0, h / 2 + 5, 0]}),
    ],
    posto
  );
}

/** Moneta d'oro vista di faccia (ruotala per farla girare). Larga circa 240. Per prezzi, costi, risparmi. */
export function moneta3d({colore = '#F2C230', bordo = '#B8860B', ...posto}: {colore?: string; bordo?: string} & Posto = {}): Faccia[] {
  return gruppo(
    gruppo(
      [
        ...cilindro({raggio: 120, altezza: 22, colore: bordo, coloreTappi: colore, lati: 40}),
        ...cilindro({raggio: 92, altezza: 30, colore, coloreTappi: miscela(colore, '#FFFFFF', 0.25), lati: 36, emissione: 0.18}),
      ],
      {ruota: [90, 0, 0]}
    ),
    posto
  );
}

/** Cuore con lo spessore. Largo circa 300. Per salute, cardio, "cosa fa bene". */
export function cuore3d({colore = stile.colori.negativo, spessore = 70, ...posto}: {colore?: string; spessore?: number} & Posto = {}): Faccia[] {
  const profilo: [number, number][] = [];
  const passi = 44;
  // il giro va fatto in senso antiorario (guardando il cuore di fronte)
  for (let i = passi; i > 0; i--) {
    const t = (i / passi) * Math.PI * 2;
    profilo.push([9.2 * 16 * Math.sin(t) ** 3, 9.2 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 18]);
  }
  return gruppo(estrusione({profilo, profondita: spessore, colore, coloreLati: miscela(colore, '#000000', 0.28), emissione: 0.2}), posto);
}

/** Stella a cinque punte con lo spessore. Larga circa 300. Per voti, recensioni, "il migliore". */
export function stella3d({colore = stile.colori.accento, spessore = 50, ...posto}: {colore?: string; spessore?: number} & Posto = {}): Faccia[] {
  const profilo: [number, number][] = Array.from({length: 10}, (_, i) => {
    const r = i % 2 ? 62 : 150;
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });
  return gruppo(estrusione({profilo, profondita: spessore, colore, coloreLati: miscela(colore, '#000000', 0.3), emissione: 0.22}), posto);
}

/** Provetta con il liquido, inclinata nel suo portaprovette. Alta circa 300. Per analisi, laboratorio, "lo studio". */
export function provetta3d({liquido = stile.colori.luce, livello = 0.55, ...posto}: {liquido?: string; livello?: number} & Posto = {}): Faccia[] {
  const h = 250;
  const quanto = Math.max(0.05, Math.min(1, livello)) * (h - 20);
  return gruppo(
    [
      ...sfera({raggio: 33, colore: liquido, pos: [0, -h / 2, 0], emissione: 0.7, paralleli: 8, meridiani: 16}),
      ...cilindro({raggio: 33, altezza: quanto, colore: liquido, pos: [0, -h / 2 + quanto / 2, 0], emissione: 0.72, opacita: 0.94, lati: 20}),
      ...cilindro({raggio: 40, altezza: h, colore: '#CFE8FF', opacita: 0.2, lati: 20, tappi: false}).map((f) => ({...f, doppia: true})),
      ...cilindro({raggio: 46, altezza: 12, colore: '#DCEBFA', opacita: 0.5, pos: [0, h / 2 + 4, 0], lati: 20}),
    ],
    posto
  );
}

/** Flacone di compresse con il tappo e l'etichetta. Alto circa 260. Per integratori, farmaci, "la cura". */
export function flacone3d({colore = '#F28A30', tappo = '#F4F7FB', etichetta = '#F4F7FB', ...posto}: {colore?: string; tappo?: string; etichetta?: string} & Posto = {}): Faccia[] {
  return gruppo(
    [
      ...cilindro({raggio: 72, altezza: 170, colore, opacita: 0.92, pos: [0, -30, 0], lati: 26, emissione: 0.25}),
      ...cilindro({raggio: 74, altezza: 84, colore: etichetta, pos: [0, -34, 0], lati: 26, tappi: false}),
      ...cilindro({raggio: 72, raggioAlto: 50, altezza: 26, colore, opacita: 0.92, pos: [0, 68, 0], lati: 26, tappi: false}),
      ...cilindro({raggio: 58, altezza: 46, colore: tappo, coloreTappi: miscela(tappo, '#000000', 0.12), pos: [0, 104, 0], lati: 26}),
    ],
    posto
  );
}

/**
 * Bilancia a due piatti. `pende` da -1 (giù a sinistra) a 1 (giù a destra): 0 è in equilibrio.
 * Larga circa 420. Per confronti, rischi e benefici, "cosa pesa di più".
 */
export function bilancia3d({pende = 0, colore = '#B9C4D6', piatti = [stile.colori.luce, stile.colori.luce2], ...posto}: {pende?: number; colore?: string; piatti?: [string, string]} & Posto = {}): Faccia[] {
  const angolo = Math.max(-1, Math.min(1, pende)) * 14;
  const rad = (angolo * Math.PI) / 180;
  const braccio = 170;
  const piatto = (lato: -1 | 1, tinta: string): Faccia[] => {
    const x = lato * braccio * Math.cos(rad);
    const y = 150 - lato * braccio * Math.sin(rad);
    return [
      ...cilindro({raggio: 4, altezza: 110, colore, pos: [x, y - 55, 0], lati: 8}),
      ...cilindro({raggio: 78, raggioAlto: 86, altezza: 16, colore: tinta, pos: [x, y - 118, 0], lati: 26, emissione: 0.3}),
    ];
  };
  return gruppo(
    [
      ...cilindro({raggio: 96, raggioAlto: 70, altezza: 24, colore: miscela(colore, '#000000', 0.25), pos: [0, -150, 0], lati: 28}),
      ...cilindro({raggio: 12, altezza: 300, colore, pos: [0, 0, 0], lati: 14}),
      ...gruppo(scatola({misure: [braccio * 2 + 30, 14, 22], colore}), {pos: [0, 150, 0], ruota: [0, 0, -angolo]}),
      ...sfera({raggio: 20, colore: stile.colori.accento, pos: [0, 152, 0], emissione: 0.3, paralleli: 8, meridiani: 14}),
      ...piatto(-1, piatti[0]),
      ...piatto(1, piatti[1]),
    ],
    posto
  );
}

/** Scudo con lo spessore. Largo circa 260. Per protezione, sicurezza, difese, "ti copre". */
export function scudo3d({colore = stile.colori.luce2, spessore = 44, ...posto}: {colore?: string; spessore?: number} & Posto = {}): Faccia[] {
  // il profilo in senso antiorario, guardandolo di fronte: punta in basso, spalle larghe, piccolo colmo in alto
  const profilo: [number, number][] = [[0, -170], [72, -128], [120, -60], [132, 30], [130, 120], [70, 138], [0, 160], [-70, 138], [-130, 120], [-132, 30], [-120, -60], [-72, -128]];
  const dentro = profilo.map(([x, y]) => [x * 0.72, y * 0.72 + 4] as [number, number]);
  return gruppo(
    [
      ...estrusione({profilo, profondita: spessore, colore, coloreLati: miscela(colore, '#000000', 0.3), emissione: 0.2}),
      ...estrusione({profilo: dentro, profondita: spessore + 14, colore: miscela(colore, '#FFFFFF', 0.3), coloreLati: miscela(colore, '#000000', 0.15), emissione: 0.26}),
    ],
    posto
  );
}

/** Lente d'ingrandimento, vista di fronte. Larga circa 300. Per "guardiamo meglio", controlli, dettagli che contano. */
export function lente3d({colore = '#B9C4D6', vetro = stile.colori.luce, ...posto}: {colore?: string; vetro?: string} & Posto = {}): Faccia[] {
  return gruppo(
    [
      ...gruppo(
        [
          ...cilindro({raggio: 104, altezza: 18, colore: vetro, opacita: 0.28, lati: 36, emissione: 0.5}),
          ...gruppo(anello({raggio: 110, larghezza: 22, colore, lati: 40}), {pos: [0, 10, 0]}),
          ...gruppo(anello({raggio: 110, larghezza: 22, colore: miscela(colore, '#000000', 0.2), lati: 40}), {pos: [0, -10, 0]}),
        ],
        {ruota: [90, 0, 0], pos: [-30, 40, 0]}
      ),
      ...gruppo(cilindro({raggio: 17, altezza: 150, colore: '#2C3442', coloreTappi: '#1B212C', lati: 14}), {pos: [98, -112, 0], ruota: [0, 0, 40]}),
    ],
    posto
  );
}
