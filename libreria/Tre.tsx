// FMLAB Reel Kit — il 3D: oggetti con volume veri (scatole, cilindri, sfere, capsule, forme estruse),
// illuminati e visti da una camera che può girare loro attorno.
//
// Come si usa in una scena:
//
//   const oggetti = [
//     ...scatola({misure: [220, 140, 90], colore: C.luce2, ruota: [0, s.t * 30, 0]}),
//     ...cilindro({pos: [0, -160, 0], raggio: 40, altezza: 120, colore: '#FFFFFF'}),
//   ];
//   <Scena3D oggetti={oggetti} x={540} y={880} camera={{giro: 25 + s.t * 6, alza: 18}} />
//
// Assi: x verso destra, y verso l'ALTO, z verso chi guarda. Le misure sono in pixel del video
// (con camera ferma e zoom 1 un oggetto largo 300 è largo circa 300 pixel).
// Tutto è una funzione pura dei valori ricevuti: stesso istante, stesso disegno.
import type {CSSProperties, ReactElement} from 'react';
import {stile} from '../stile/stile';

export type V3 = [number, number, number];

export type Faccia = {
  punti: V3[];
  colore: string;
  /** 0…1: quanto il colore ignora la luce (1 = luminoso di suo: schermi, liquidi accesi, laser). */
  emissione?: number;
  /** 0…1 */
  opacita?: number;
  /** true = si vede da entrambi i lati (lastre sottili, piani, vetro). */
  doppia?: boolean;
  /** Se c'è, la faccia è una LINEA tra i primi due punti, spessa così tanti pixel. */
  linea?: number;
  /** Alone luminoso attorno, in pixel. */
  bagliore?: number;
  /** Sfocatura in pixel (per le ombre a terra). */
  sfoca?: number;
};

/** Dove sta un oggetto: posizione, rotazione attorno a x, y, z (gradi) e scala. */
export type Posto = {pos?: V3; ruota?: V3; scala?: number};
export type Aspetto = {emissione?: number; opacita?: number; bagliore?: number};

const RAD = Math.PI / 180;

/** Ruota un punto attorno all'asse x, poi y, poi z (gradi). */
export function ruotaPunto(p: V3, r: V3): V3 {
  let [x, y, z] = p;
  if (r[0]) {
    const c = Math.cos(r[0] * RAD);
    const s = Math.sin(r[0] * RAD);
    [y, z] = [y * c - z * s, y * s + z * c];
  }
  if (r[1]) {
    const c = Math.cos(r[1] * RAD);
    const s = Math.sin(r[1] * RAD);
    [x, z] = [x * c + z * s, -x * s + z * c];
  }
  if (r[2]) {
    const c = Math.cos(r[2] * RAD);
    const s = Math.sin(r[2] * RAD);
    [x, y] = [x * c - y * s, x * s + y * c];
  }
  return [x, y, z];
}

/** Sposta, ruota e ingrandisce un gruppo di facce: serve a comporre oggetti fatti di più pezzi. */
export function gruppo(facce: Faccia[], {pos = [0, 0, 0], ruota = [0, 0, 0], scala = 1}: Posto = {}): Faccia[] {
  const fermo = !ruota[0] && !ruota[1] && !ruota[2];
  return facce.map((f) => ({
    ...f,
    linea: f.linea !== undefined ? f.linea * scala : undefined,
    punti: f.punti.map((p) => {
      const q: V3 = [p[0] * scala, p[1] * scala, p[2] * scala];
      const r = fermo ? q : ruotaPunto(q, ruota);
      return [r[0] + pos[0], r[1] + pos[1], r[2] + pos[2]] as V3;
    }),
  }));
}

const con = (facce: Faccia[], posto: Posto, aspetto: Aspetto): Faccia[] => {
  const extra: Partial<Faccia> = {};
  if (aspetto.emissione !== undefined) extra.emissione = aspetto.emissione;
  if (aspetto.opacita !== undefined) extra.opacita = aspetto.opacita;
  if (aspetto.bagliore !== undefined) extra.bagliore = aspetto.bagliore;
  const vestite = Object.keys(extra).length ? facce.map((f) => ({...extra, ...f})) : facce;
  return posto.pos || posto.ruota || posto.scala !== undefined ? gruppo(vestite, posto) : vestite;
};

// ───────────────────────── forme di base ─────────────────────────

export type LatiScatola = 'davanti' | 'dietro' | 'destra' | 'sinistra' | 'sopra' | 'sotto';

/** Parallelepipedo centrato nell'origine. `colori` cambia il colore di singole facce. */
export function scatola({misure, colore, colori = {}, ...resto}: {misure: V3; colore: string; colori?: Partial<Record<LatiScatola, string>>} & Posto & Aspetto): Faccia[] {
  const [x, y, z] = [misure[0] / 2, misure[1] / 2, misure[2] / 2];
  const f = (lato: LatiScatola, punti: V3[]): Faccia => ({punti, colore: colori[lato] ?? colore});
  return con(
    [
      f('davanti', [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]),
      f('dietro', [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]),
      f('destra', [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]),
      f('sinistra', [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]),
      f('sopra', [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]),
      f('sotto', [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]),
    ],
    resto,
    resto
  );
}

/**
 * Cilindro con l'asse verticale, centrato nell'origine. Con `raggioAlto` diverso diventa un tronco di cono
 * (0 = cono). `tappi: false` lo lascia aperto (tubo).
 */
export function cilindro({
  raggio,
  raggioAlto = raggio,
  altezza,
  lati = 24,
  colore,
  coloreTappi = colore,
  tappi = true,
  ...resto
}: {raggio: number; raggioAlto?: number; altezza: number; lati?: number; colore: string; coloreTappi?: string; tappi?: boolean} & Posto & Aspetto): Faccia[] {
  const h = altezza / 2;
  const facce: Faccia[] = [];
  const giu: V3[] = [];
  const su: V3[] = [];
  for (let i = 0; i < lati; i++) {
    const a = (i / lati) * 2 * Math.PI;
    giu.push([raggio * Math.cos(a), -h, raggio * Math.sin(a)]);
    su.push([raggioAlto * Math.cos(a), h, raggioAlto * Math.sin(a)]);
  }
  for (let i = 0; i < lati; i++) {
    const j = (i + 1) % lati;
    facce.push({punti: raggioAlto < 0.001 ? [giu[j], giu[i], su[i]] : [giu[j], giu[i], su[i], su[j]], colore, doppia: !tappi});
  }
  if (tappi) {
    if (raggioAlto > 0.001) facce.push({punti: [...su].reverse(), colore: coloreTappi});
    if (raggio > 0.001) facce.push({punti: giu, colore: coloreTappi});
  }
  return con(facce, resto, resto);
}

function fascia(raggio: number, centroY: number, lat0: number, lat1: number, meridiani: number, colore: string): Faccia[] {
  const facce: Faccia[] = [];
  const p = (lat: number, lon: number): V3 => [raggio * Math.cos(lat) * Math.sin(lon), centroY + raggio * Math.sin(lat), raggio * Math.cos(lat) * Math.cos(lon)];
  for (let m = 0; m < meridiani; m++) {
    const l0 = (m / meridiani) * 2 * Math.PI;
    const l1 = ((m + 1) / meridiani) * 2 * Math.PI;
    facce.push({punti: [p(lat0, l0), p(lat0, l1), p(lat1, l1), p(lat1, l0)], colore});
  }
  return facce;
}

/** Sfera centrata nell'origine. */
export function sfera({raggio, colore, paralleli = 10, meridiani = 18, ...resto}: {raggio: number; colore: string; paralleli?: number; meridiani?: number} & Posto & Aspetto): Faccia[] {
  const facce: Faccia[] = [];
  for (let k = 0; k < paralleli; k++) {
    facce.push(...fascia(raggio, 0, -Math.PI / 2 + (k / paralleli) * Math.PI, -Math.PI / 2 + ((k + 1) / paralleli) * Math.PI, meridiani, colore));
  }
  return con(facce, resto, resto);
}

/** Capsula (pillola) in piedi: metà di sotto di un colore, metà di sopra di un altro. `altezza` comprende le calotte. */
export function capsula({raggio, altezza, colori, lati = 20, anelli = 5, ...resto}: {raggio: number; altezza: number; colori: [string, string]; lati?: number; anelli?: number} & Posto & Aspetto): Faccia[] {
  const mezzo = Math.max(0, altezza / 2 - raggio);
  const facce: Faccia[] = [];
  for (let k = 0; k < anelli; k++) {
    const a0 = (k / anelli) * (Math.PI / 2);
    const a1 = ((k + 1) / anelli) * (Math.PI / 2);
    facce.push(...fascia(raggio, -mezzo, -Math.PI / 2 + a0, -Math.PI / 2 + a1, lati, colori[0]));
    facce.push(...fascia(raggio, mezzo, a0, a1, lati, colori[1]));
  }
  if (mezzo > 0) {
    facce.push(...cilindro({raggio, altezza: mezzo, lati, colore: colori[0], tappi: false, pos: [0, -mezzo / 2, 0]}).map((f) => ({...f, doppia: false})));
    facce.push(...cilindro({raggio, altezza: mezzo, lati, colore: colori[1], tappi: false, pos: [0, mezzo / 2, 0]}).map((f) => ({...f, doppia: false})));
  }
  return con(facce, resto, resto);
}

/** Anello piatto, sdraiato (piano orizzontale). Per orbite, aloni, bersagli. */
export function anello({raggio, larghezza, lati = 48, colore, ...resto}: {raggio: number; larghezza: number; lati?: number; colore: string} & Posto & Aspetto): Faccia[] {
  const facce: Faccia[] = [];
  const dentro = raggio - larghezza / 2;
  const fuori = raggio + larghezza / 2;
  for (let i = 0; i < lati; i++) {
    const a = (i / lati) * 2 * Math.PI;
    const b = ((i + 1) / lati) * 2 * Math.PI;
    facce.push({
      punti: [
        [dentro * Math.cos(a), 0, dentro * Math.sin(a)],
        [fuori * Math.cos(a), 0, fuori * Math.sin(a)],
        [fuori * Math.cos(b), 0, fuori * Math.sin(b)],
        [dentro * Math.cos(b), 0, dentro * Math.sin(b)],
      ],
      colore,
      doppia: true,
    });
  }
  return con(facce, resto, resto);
}

/** Lastra piatta orizzontale (un "pavimento"), larga `misure[0]` e profonda `misure[1]`. */
export function piano({misure, colore, ...resto}: {misure: [number, number]; colore: string} & Posto & Aspetto): Faccia[] {
  const [x, z] = [misure[0] / 2, misure[1] / 2];
  return con([{punti: [[-x, 0, z], [x, 0, z], [x, 0, -z], [-x, 0, -z]], colore, doppia: true}], resto, resto);
}

/** Linea tra due punti dello spazio. */
export function linea3d(da: V3, a: V3, colore: string, spessore = 3, aspetto: Aspetto = {}): Faccia[] {
  return [{punti: [da, a], colore, linea: spessore, emissione: 1, ...aspetto}];
}

/** Griglia di linee sul pavimento: dà subito il senso dello spazio. */
export function griglia({lato, passi = 8, colore, spessore = 2, ...resto}: {lato: number; passi?: number; colore: string; spessore?: number} & Posto & Aspetto): Faccia[] {
  const facce: Faccia[] = [];
  const m = lato / 2;
  for (let k = 0; k <= passi; k++) {
    const v = -m + (k / passi) * lato;
    facce.push(...linea3d([-m, 0, v], [m, 0, v], colore, spessore));
    facce.push(...linea3d([v, 0, -m], [v, 0, m], colore, spessore));
  }
  return con(facce, resto, resto);
}

/**
 * Forma piatta "tirata" in profondità: disegna il profilo come punti [x, y] in senso antiorario
 * (guardandolo di fronte) e diventa un solido spesso `profondita`. Per frecce, lettere a blocchi, ingranaggi.
 */
export function estrusione({profilo, profondita, colore, coloreLati = colore, ...resto}: {profilo: [number, number][]; profondita: number; colore: string; coloreLati?: string} & Posto & Aspetto): Faccia[] {
  const d = profondita / 2;
  const facce: Faccia[] = [
    {punti: profilo.map(([x, y]) => [x, y, d] as V3), colore},
    {punti: [...profilo].reverse().map(([x, y]) => [x, y, -d] as V3), colore},
  ];
  for (let i = 0; i < profilo.length; i++) {
    const [ax, ay] = profilo[i];
    const [bx, by] = profilo[(i + 1) % profilo.length];
    facce.push({punti: [[ax, ay, d], [ax, ay, -d], [bx, by, -d], [bx, by, d]], colore: coloreLati});
  }
  return con(facce, resto, resto);
}

/** Ombra morbida a terra sotto un oggetto: lo "appoggia" allo spazio. */
export function ombra({pos = [0, 0, 0], raggio, forza = 0.45}: {pos?: V3; raggio: number; forza?: number}): Faccia[] {
  const punti: V3[] = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * 2 * Math.PI;
    punti.push([pos[0] + raggio * Math.cos(a), pos[1], pos[2] + raggio * Math.sin(a)]);
  }
  return [{punti, colore: '#000000', opacita: forza, doppia: true, emissione: 1, sfoca: Math.max(4, raggio * 0.22)}];
}

// ───────────────────────── camera e disegno ─────────────────────────

export type CameraTre = {
  /** Di quanti gradi la camera ha girato attorno all'oggetto (0 = di fronte, 90 = lo guarda dal suo lato destro). */
  giro?: number;
  /** Di quanti gradi guarda dall'alto (0 = ad altezza d'occhi, 90 = a piombo). */
  alza?: number;
  /** Distanza dal centro, in pixel: più è piccola, più la prospettiva è forte. */
  distanza?: number;
  zoom?: number;
  /** Punto dello spazio che finisce al centro dell'inquadratura. */
  mira?: V3;
};

function versoCamera(p: V3, c: CameraTre): V3 {
  const m = c.mira ?? [0, 0, 0];
  return ruotaPunto(ruotaPunto([p[0] - m[0], p[1] - m[1], p[2] - m[2]], [0, -(c.giro ?? 0), 0]), [c.alza ?? 0, 0, 0]);
}

/**
 * Dove finisce sullo schermo un punto dello spazio: serve per agganciare scritte, linee e bagliori 2D
 * a un oggetto 3D.  const p = proietta([0, 120, 0], camera, [540, 880]);  <Etichetta x={p.x} y={p.y} … />
 */
export function proietta(punto: V3, camera: CameraTre = {}, centro: [number, number] = [stile.palco.centroX, stile.palco.centroY]): {x: number; y: number; scala: number; z: number} {
  const d = camera.distanza ?? 1400;
  const [x, y, z] = versoCamera(punto, camera);
  const s = (d / Math.max(1, d - z)) * (camera.zoom ?? 1);
  return {x: centro[0] + x * s, y: centro[1] - y * s, scala: s, z};
}

const coloriLetti = new Map<string, [number, number, number]>();
function rgbDi(colore: string): [number, number, number] {
  const noto = coloriLetti.get(colore);
  if (noto) return noto;
  let rgb: [number, number, number] = [255, 255, 255];
  const c = colore.trim();
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(c);
  if (m) rgb = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if (/^#[0-9a-f]{3}$/i.test(c)) rgb = [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) as [number, number, number];
  else if (/^#[0-9a-f]{6}/i.test(c)) rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
  coloriLetti.set(colore, rgb);
  return rgb;
}

const norma = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

export type PropsScena3D = {
  /** Le facce di tutti gli oggetti: [...scatola(…), ...cilindro(…)]. */
  oggetti: Faccia[];
  camera?: CameraTre;
  /** Punto del video in cui finisce il centro dello spazio. */
  x?: number;
  y?: number;
  /** Da dove arriva la luce, vista dalla camera: [destra, alto, verso chi guarda]. */
  luce?: V3;
  /** 0…1: quanta luce arriva anche alle facce in ombra. */
  ambiente?: number;
  /** Le cose lontane sfumano verso questo colore (dà profondità). `da` e `a` sono distanze in pixel dietro al centro. */
  nebbia?: {colore: string; da: number; a: number};
  opacita?: number;
};

/** Disegna gli oggetti 3D: proietta ogni faccia, la illumina e la dipinge dalla più lontana alla più vicina. */
export function Scena3D({oggetti, camera = {}, x = stile.palco.centroX, y = stile.palco.centroY, luce = [-0.45, 0.7, 0.55], ambiente = 0.36, nebbia, opacita = 1}: PropsScena3D) {
  if (opacita <= 0.001) return null;
  const d = camera.distanza ?? 1400;
  const zoom = camera.zoom ?? 1;
  const L = norma(luce);
  const fumo = nebbia ? rgbDi(nebbia.colore) : null;
  type Pronta = {z: number; nodo: ReactElement};
  const pronte: Pronta[] = [];

  oggetti.forEach((f, indice) => {
    const pc = f.punti.map((p) => versoCamera(p, camera));
    if (pc.some((p) => p[2] > d - 20)) return; // dietro la camera
    const piatti = pc.map((p) => {
      const s = (d / (d - p[2])) * zoom;
      return [x + p[0] * s, y - p[1] * s] as [number, number];
    });
    const z = pc.reduce((somma, p) => somma + p[2], 0) / pc.length;
    const base = rgbDi(f.colore);
    const velo = fumo && nebbia ? Math.min(1, Math.max(0, (-z - nebbia.da) / Math.max(1, nebbia.a - nebbia.da))) : 0;
    const tinta = (rgb: [number, number, number]) => {
      const c = fumo ? rgb.map((v, k) => v + (fumo[k] - v) * velo) : rgb;
      return `rgb(${c.map((v) => Math.round(Math.min(255, Math.max(0, v)))).join(',')})`;
    };
    const stileComune: CSSProperties = {};
    const filtri: string[] = [];
    if (f.sfoca) filtri.push(`blur(${f.sfoca.toFixed(1)}px)`);
    if (f.bagliore) filtri.push(`drop-shadow(0 0 ${f.bagliore}px ${f.colore})`);
    if (filtri.length) stileComune.filter = filtri.join(' ');

    if (f.linea !== undefined) {
      const s = (d / (d - z)) * zoom;
      pronte.push({
        z,
        nodo: <line key={indice} x1={piatti[0][0]} y1={piatti[0][1]} x2={piatti[1][0]} y2={piatti[1][1]} stroke={tinta(base)} strokeWidth={Math.max(0.6, f.linea * s)} strokeLinecap="round" opacity={f.opacita ?? 1} style={stileComune} />,
      });
      return;
    }
    // normale della faccia (metodo di Newell: regge anche i poligoni irregolari)
    let nx = 0;
    let ny = 0;
    let nz = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < pc.length; i++) {
      const a = pc[i];
      const b = pc[(i + 1) % pc.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
      cx += a[0];
      cy += a[1];
    }
    let n = norma([nx, ny, nz]);
    const v = norma([-cx / pc.length, -cy / pc.length, d - z]);
    const diFronte = n[0] * v[0] + n[1] * v[1] + n[2] * v[2] > 0;
    if (!diFronte) {
      if (!f.doppia) return; // faccia girata dall'altra parte
      n = [-n[0], -n[1], -n[2]];
    }
    const diffusa = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const intensita = ambiente + (1 - ambiente) * diffusa;
    const H = norma([L[0] + v[0], L[1] + v[1], L[2] + v[2]]);
    const riflesso = Math.pow(Math.max(0, n[0] * H[0] + n[1] * H[1] + n[2] * H[2]), 26) * 70;
    const e = f.emissione ?? 0;
    const colore = tinta(base.map((c) => c * (0.26 + 0.9 * intensita) * (1 - e) + c * e + riflesso * (1 - e)) as [number, number, number]);
    const piena = (f.opacita ?? 1) >= 0.999 && !f.sfoca;
    pronte.push({
      z,
      nodo: (
        <polygon
          key={indice}
          points={piatti.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
          fill={colore}
          stroke={piena ? colore : 'none'}
          strokeWidth={piena ? 0.8 : 0}
          strokeLinejoin="round"
          opacity={f.opacita ?? 1}
          style={stileComune}
        />
      ),
    });
  });

  pronte.sort((a, b) => a.z - b.z);
  return (
    <svg data-fmlab-3d="1" width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: opacita, pointerEvents: 'none'}}>
      {pronte.map((p) => p.nodo)}
    </svg>
  );
}
