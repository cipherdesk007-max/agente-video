// FMLAB Reel Kit — la "maglia": il modo in cui un personaggio fatto di UNA sola immagine si muove a parti.
// L'immagine viene stesa su una maglia di punti; ogni "osso" (testa, braccio, mano…) ha una zona e un
// perno, e sposta i punti della sua zona ruotandoli attorno al perno. Ai bordi della zona lo spostamento
// sfuma, così collo, gomito e polso si piegano invece di spezzarsi.

export type Zona =
  | {tipo: 'ellisse'; centro: [number, number]; raggi: [number, number]}
  | {tipo: 'poligono'; punti: [number, number][]}
  /** Tutta la tela: per una parte ritagliata su un livello suo, che si muove per intero e non si piega. */
  | {tipo: 'tutto'};

export type Osso = {
  /** Punto attorno a cui ruota (in pixel dell'immagine). */
  perno: [number, number];
  /** La parte che si muove per intero. */
  zona: Zona;
  /** Larghezza, in pixel, della fascia in cui il movimento sfuma fino a zero. */
  sfuma: number;
  /** Osso a cui è attaccato (la mano al braccio, le sopracciglia alla testa). */
  genitore?: string;
  /** Nome del livello che questo osso muove. Se manca, muove il corpo (l'immagine di base). */
  livello?: string;
};

/**
 * Come si muove un osso in un dato istante: rotazione in gradi attorno al perno (positiva = senso orario),
 * spostamento in pixel dell'immagine originale, e allungamento/schiacciamento rispetto al perno (1 = nessuno).
 */
export type Mossa = {ruota?: number; dx?: number; dy?: number; sx?: number; sy?: number};
export type Mosse = Record<string, Mossa>;

export type Maglia = {
  larghezza: number;
  altezza: number;
  passo: number;
  colonne: number;
  righe: number;
  /** Coordinate a riposo: x0, y0, x1, y1… */
  punti: Float32Array;
  /** Per ogni osso, quanto pesa su ogni punto (0…1). */
  pesi: Record<string, Float32Array>;
  /** Ossa in ordine: prima i genitori, poi i figli. */
  ordine: string[];
};

function distanzaDalSegmento(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distanza di un punto dalla zona: 0 se è dentro. */
export function distanzaDallaZona(zona: Zona, x: number, y: number): number {
  if (zona.tipo === 'tutto') return 0;
  if (zona.tipo === 'ellisse') {
    const r = Math.hypot((x - zona.centro[0]) / zona.raggi[0], (y - zona.centro[1]) / zona.raggi[1]);
    return r <= 1 ? 0 : (r - 1) * Math.min(zona.raggi[0], zona.raggi[1]);
  }
  const p = zona.punti;
  let dentro = false;
  let minima = Infinity;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    minima = Math.min(minima, distanzaDalSegmento(x, y, xi, yi, xj, yj));
  }
  return dentro ? 0 : minima;
}

const liscio = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export function creaMaglia(larghezza: number, altezza: number, ossa: Record<string, Osso>, passo = 30): Maglia {
  const colonne = Math.ceil(larghezza / passo);
  const righe = Math.ceil(altezza / passo);
  const n = (colonne + 1) * (righe + 1);
  const punti = new Float32Array(n * 2);
  for (let r = 0; r <= righe; r++) {
    for (let c = 0; c <= colonne; c++) {
      const i = r * (colonne + 1) + c;
      punti[i * 2] = Math.min(larghezza, c * passo);
      punti[i * 2 + 1] = Math.min(altezza, r * passo);
    }
  }
  const pesi: Record<string, Float32Array> = {};
  for (const [nome, osso] of Object.entries(ossa)) {
    const p = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const d = distanzaDallaZona(osso.zona, punti[i * 2], punti[i * 2 + 1]);
      p[i] = d === 0 ? 1 : liscio(1 - d / Math.max(1, osso.sfuma));
    }
    pesi[nome] = p;
  }
  // genitori prima dei figli
  const ordine: string[] = [];
  const visita = (nome: string, profondita = 0) => {
    if (ordine.includes(nome) || profondita > 8) return;
    const g = ossa[nome]?.genitore;
    if (g && ossa[g]) visita(g, profondita + 1);
    ordine.push(nome);
  };
  Object.keys(ossa).forEach((nome) => visita(nome));
  return {larghezza, altezza, passo, colonne, righe, punti, pesi, ordine};
}

function ferma(m: Mossa): boolean {
  return (!(m.ruota ?? 0) && !(m.dx ?? 0) && !(m.dy ?? 0) && (m.sx ?? 1) === 1 && (m.sy ?? 1) === 1);
}

function applica(x: number, y: number, px: number, py: number, m: Mossa, k: number): [number, number] {
  const a = ((m.ruota ?? 0) * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rx = (x - px) * (m.sx ?? 1);
  const ry = (y - py) * (m.sy ?? 1);
  return [px + rx * c - ry * s + (m.dx ?? 0) * k, py + rx * s + ry * c + (m.dy ?? 0) * k];
}

/**
 * Le stesse ossa, riportate alla grandezza a cui il personaggio viene disegnato
 * (k = pixel disegnati / pixel dell'immagine) e spostate del margine lasciato attorno all'immagine.
 */
export function scalaOssa(ossa: Record<string, Osso>, k: number, margineX = 0, margineY = 0): Record<string, Osso> {
  const esito: Record<string, Osso> = {};
  const px = (x: number) => x * k + margineX;
  const py = (y: number) => y * k + margineY;
  for (const [nome, o] of Object.entries(ossa)) {
    const zona: Zona =
      o.zona.tipo === 'tutto'
        ? {tipo: 'tutto'}
        : o.zona.tipo === 'ellisse'
          ? {tipo: 'ellisse', centro: [px(o.zona.centro[0]), py(o.zona.centro[1])], raggi: [o.zona.raggi[0] * k, o.zona.raggi[1] * k]}
          : {tipo: 'poligono', punti: o.zona.punti.map(([x, y]) => [px(x), py(y)] as [number, number])};
    esito[nome] = {...o, perno: [px(o.perno[0]), py(o.perno[1])], zona, sfuma: o.sfuma * k};
  }
  return esito;
}

/**
 * Posizione di tutti i punti della maglia con le mosse date. Restituisce anche quali punti si sono mossi.
 * `k` porta gli spostamenti (scritti in pixel dell'immagine originale) alla grandezza della maglia.
 */
export function deforma(maglia: Maglia, ossa: Record<string, Osso>, mosse: Mosse, k = 1): {punti: Float32Array; mossi: Uint8Array} {
  const n = maglia.punti.length / 2;
  const punti = new Float32Array(maglia.punti);
  const mossi = new Uint8Array(n);
  // il perno di un figlio si sposta insieme al genitore
  const perni: Record<string, [number, number]> = {};
  for (const nome of maglia.ordine) {
    const osso = ossa[nome];
    let perno: [number, number] = [osso.perno[0], osso.perno[1]];
    let g = osso.genitore;
    const catena: string[] = [];
    while (g && ossa[g] && catena.length < 8) {
      catena.unshift(g);
      g = ossa[g].genitore;
    }
    for (const antenato of catena) {
      const m = mosse[antenato];
      if (!m || ferma(m)) continue;
      const pa = perni[antenato] ?? ossa[antenato].perno;
      perno = applica(perno[0], perno[1], pa[0], pa[1], m, k);
    }
    perni[nome] = perno;
    const m = mosse[nome];
    if (!m || ferma(m)) continue;
    const pesi = maglia.pesi[nome];
    for (let i = 0; i < n; i++) {
      const w = pesi[i];
      if (w <= 0.001) continue;
      const x = punti[i * 2];
      const y = punti[i * 2 + 1];
      const [tx, ty] = applica(x, y, perno[0], perno[1], m, k);
      punti[i * 2] = x + (tx - x) * w;
      punti[i * 2 + 1] = y + (ty - y) * w;
      // 2 = il punto sta dentro la parte rigida dell'osso, 1 = sta nella fascia che si piega
      mossi[i] = w >= 0.999 ? 2 : Math.max(mossi[i], 1);
    }
  }
  return {punti, mossi};
}

type Tela = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function triangolo(ctx: Tela, sorgente: CanvasImageSource, s: number[], d: number[], larghezza: number, altezza: number) {
  const [x0, y0, x1, y1, x2, y2] = s;
  const [u0, v0, u1, v1, u2, v2] = d;
  const den = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  if (Math.abs(den) < 1e-6) return;
  // un triangolo che si è rovesciato (la fascia si è piegata su se stessa) non si disegna: darebbe una macchia
  const arrivo = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
  if (arrivo * den <= 0) return;
  const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / den;
  const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / den;
  const e = u0 - a * x0 - c * y0;
  const b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / den;
  const dd = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / den;
  const f = v0 - b * x0 - dd * y0;
  // il triangolo di arrivo viene allargato di poco: così tra un triangolo e l'altro non restano fessure
  const cx = (u0 + u1 + u2) / 3;
  const cy = (v0 + v1 + v2) / 3;
  const allarga = (u: number, v: number): [number, number] => {
    const l = Math.hypot(u - cx, v - cy) || 1;
    return [u + ((u - cx) / l) * 1.1, v + ((v - cy) / l) * 1.1];
  };
  const [a0, b0] = allarga(u0, v0);
  const [a1, b1] = allarga(u1, v1);
  const [a2, b2] = allarga(u2, v2);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.moveTo(a0, b0);
  ctx.lineTo(a1, b1);
  ctx.lineTo(a2, b2);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(a, b, c, dd, e, f);
  const sx = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 3);
  const sy = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 3);
  const sw = Math.min(larghezza, Math.ceil(Math.max(x0, x1, x2)) + 3) - sx;
  const sh = Math.min(altezza, Math.ceil(Math.max(y0, y1, y2)) + 3) - sy;
  ctx.drawImage(sorgente, sx, sy, sw, sh, sx, sy, sw, sh);
  ctx.restore();
}

/** Quali celle della maglia contengono qualcosa: quelle che toccano il rettangolo dato (x, y, larghezza, altezza). */
export function cellePiene(maglia: Maglia, x: number, y: number, larghezza: number, altezza: number): Uint8Array {
  const {colonne, righe, passo} = maglia;
  const celle = new Uint8Array(colonne * righe);
  for (let r = 0; r < righe; r++) {
    for (let c = 0; c < colonne; c++) {
      if ((c + 1) * passo > x && c * passo < x + larghezza && (r + 1) * passo > y && r * passo < y + altezza) celle[r * colonne + c] = 1;
    }
  }
  return celle;
}

/**
 * Disegna l'immagine deformata, a grandezza naturale, su una tela larga e alta come l'immagine.
 * Le celle ferme vengono copiate così come sono (veloce); solo quelle che si muovono vengono deformate.
 * `celle` (da `cellePiene`) fa saltare quelle vuote: serve ai livelli, che occupano solo un pezzo della tela.
 */
export function disegnaMaglia(ctx: Tela, sorgente: CanvasImageSource, maglia: Maglia, punti: Float32Array, mossi: Uint8Array, celle?: Uint8Array) {
  const {colonne, righe, larghezza, altezza} = maglia;
  const riposo = maglia.punti;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, larghezza, altezza);
  const indice = (r: number, c: number) => r * (colonne + 1) + c;
  const vuota = (r: number, c: number) => !!celle && !celle[r * colonne + c];
  const cellaFerma = (r: number, c: number) => !mossi[indice(r, c)] && !mossi[indice(r, c + 1)] && !mossi[indice(r + 1, c)] && !mossi[indice(r + 1, c + 1)];
  for (let r = 0; r < righe; r++) {
    let c = 0;
    while (c < colonne) {
      if (vuota(r, c)) {
        c++;
      } else if (cellaFerma(r, c)) {
        let fine = c;
        while (fine + 1 < colonne && !vuota(r, fine + 1) && cellaFerma(r, fine + 1)) fine++;
        const x = riposo[indice(r, c) * 2];
        const y = riposo[indice(r, c) * 2 + 1];
        const w = riposo[indice(r, fine + 1) * 2] - x;
        const h = riposo[indice(r + 1, c) * 2 + 1] - y;
        if (w > 0 && h > 0) ctx.drawImage(sorgente, x, y, w, h, x, y, w, h);
        c = fine + 1;
      } else {
        c++;
      }
    }
  }
  // due passate: prima le celle della fascia che si piega, poi quelle delle parti rigide (braccio, mano, testa),
  // così una parte che ruota molto copre la sua fascia invece di finirci sotto
  for (const passata of [1, 2]) {
    for (let r = 0; r < righe; r++) {
      for (let c = 0; c < colonne; c++) {
        if (vuota(r, c) || cellaFerma(r, c)) continue;
        const i00 = indice(r, c);
        const i10 = indice(r, c + 1);
        const i01 = indice(r + 1, c);
        const i11 = indice(r + 1, c + 1);
        const rigida = mossi[i00] === 2 && mossi[i10] === 2 && mossi[i01] === 2 && mossi[i11] === 2;
        if (rigida !== (passata === 2)) continue;
        const s = (i: number) => [riposo[i * 2], riposo[i * 2 + 1]];
        const d = (i: number) => [punti[i * 2], punti[i * 2 + 1]];
        triangolo(ctx, sorgente, [...s(i00), ...s(i10), ...s(i11)], [...d(i00), ...d(i10), ...d(i11)], larghezza, altezza);
        triangolo(ctx, sorgente, [...s(i00), ...s(i11), ...s(i01)], [...d(i00), ...d(i11), ...d(i01)], larghezza, altezza);
      }
    }
  }
}
