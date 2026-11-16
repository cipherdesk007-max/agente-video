// FMLAB Reel Kit — la Terra in 3D (proiezione calcolata, quindi ruota davvero) con orbite e satelliti.
// Stile "ologramma": oceani scuri, terre luminose, reticolo sottile, alone d'atmosfera.
import {useId, useMemo} from 'react';
import {alfa} from './colore';
import {stile} from '../stile/stile';

const RAD = Math.PI / 180;

/** Contorni molto semplificati dei continenti: [longitudine, latitudine]. Bastano a far riconoscere la Terra. */
const TERRE: [number, number][][] = [
  // Africa
  [[-17, 21], [-17, 15], [-15, 11], [-8, 4.5], [-4, 5], [1, 6], [5, 4.5], [9, 4], [9.5, 1], [9, -1], [12, -5], [13.5, -12], [12, -17], [14.5, -23], [17, -29], [18.5, -34], [22, -34.5], [26, -34], [30.5, -30], [32.5, -26], [35.5, -23], [35, -19], [40.5, -15], [40, -10], [39, -6], [41, -2], [45, 2], [51, 11.5], [44, 11], [43, 12.5], [39.5, 15], [37, 21], [35, 24], [33, 28], [32, 31], [25, 31.5], [20, 30.5], [19, 32], [11, 33.5], [10, 37], [3, 37], [-2, 35], [-6, 35.5], [-9.5, 31], [-13, 27.5], [-16, 23.5]],
  // Eurasia
  [[-9, 37], [-9, 43.5], [-1.5, 43.5], [-4.5, 48.5], [2, 51], [8, 54], [8.5, 57], [5, 58.5], [5, 62], [14, 68], [26, 71], [41, 67], [44, 68], [60, 69], [68, 73], [80, 73], [90, 75.5], [104, 77.5], [113, 73.5], [130, 71], [140, 72.5], [160, 70], [170, 69], [180, 68.5], [180, 65], [172, 61], [163, 57.5], [156, 51], [156, 57], [143, 59], [135, 54.5], [141, 53], [140, 48], [135, 43.5], [130, 42.5], [129, 35.5], [126, 34.5], [126, 37.5], [121.5, 39], [118, 38.5], [122, 37], [120, 34], [122, 30], [120, 26], [116, 22.5], [110, 21], [108, 18], [109, 12], [105, 9], [103, 13], [100, 13.5], [99, 8], [103, 1.5], [101, 3], [98, 8.5], [98, 16], [94, 16.5], [92, 22], [89, 22], [86, 20], [80, 15.5], [80, 10], [77.5, 8], [73, 16], [72.5, 21], [67, 24.5], [61, 25], [57, 25.5], [56.5, 27], [51, 28], [48, 30], [50, 26], [56, 24.5], [59, 22.5], [55, 17], [45, 13], [43, 13], [39, 20.5], [34.5, 28], [35, 31.5], [36, 36.5], [30, 36.5], [27, 37], [26, 40], [29, 41], [35, 42], [41, 41.5], [39, 47], [33, 46], [30, 46], [28, 43], [23.5, 40], [22.5, 37], [19.5, 40.5], [19, 42], [13.5, 45.5], [12.5, 44], [16, 41.5], [18, 40], [16, 38], [15.5, 40], [12, 42], [8.5, 44.5], [3, 43], [0, 40], [-0.5, 38], [-5, 36]],
  // Gran Bretagna
  [[-5.5, 50], [1.5, 51], [0, 53.5], [-2, 56], [-3, 58.5], [-6, 58], [-5, 54.5], [-3, 53.5], [-5, 51.7]],
  // Nord e Centro America
  [[-168, 66], [-162, 70], [-156, 71], [-141, 70], [-128, 70], [-115, 68.5], [-100, 68], [-95, 67], [-94, 59], [-88, 56.5], [-82, 55], [-80, 51.5], [-79, 55], [-77, 58], [-78, 62.5], [-72, 62], [-65, 60.5], [-64, 57], [-60, 54], [-56, 52], [-60, 50], [-66, 50], [-65, 47.5], [-61, 45.5], [-66, 44.5], [-70, 43], [-70.5, 41.5], [-74, 40.5], [-76, 37], [-76, 35], [-81, 31.5], [-80, 27], [-80.5, 25], [-82.5, 28], [-84, 30], [-89, 30], [-94, 29.5], [-97.5, 27], [-97.5, 22], [-95, 18.5], [-91, 18.5], [-90.5, 21], [-87, 21.5], [-88, 17], [-84, 15.5], [-83.5, 11], [-80, 9], [-77.5, 8.5], [-80, 7.5], [-83, 8.5], [-86, 11.5], [-88, 13], [-92, 14.5], [-96, 16], [-105, 20], [-106, 23], [-109, 26], [-112.5, 29.5], [-114.7, 31.5], [-112.5, 27.5], [-109.7, 23], [-112, 26], [-115.5, 30], [-117, 32.5], [-120.5, 34.5], [-124, 40], [-124, 48], [-128, 51], [-133, 57], [-140, 60], [-148, 61], [-152, 58], [-158, 56], [-165, 54.5], [-158, 58.5], [-162, 60], [-165, 62.5], [-161, 64], [-166, 65]],
  // Groenlandia
  [[-73, 78], [-60, 76], [-52, 69], [-51, 63], [-44, 60], [-42, 63.5], [-32, 68], [-22, 70.5], [-20, 75], [-20, 80], [-33, 83], [-60, 82]],
  // Sud America
  [[-77.5, 8.5], [-72, 12], [-62, 10.5], [-57, 6], [-51, 4], [-50, 0], [-44, -2.5], [-37, -5], [-35, -8], [-39, -14], [-39, -18], [-41, -22], [-48, -25.5], [-48.5, -28], [-53, -33.5], [-58, -34.5], [-57, -38], [-62, -39], [-65, -42], [-65.5, -45], [-67.5, -46.5], [-66, -48], [-69, -51], [-68.5, -53], [-71, -54], [-74, -52], [-75.5, -47], [-73, -42], [-73.5, -37], [-71.5, -30], [-70, -18.5], [-76, -14], [-81, -6], [-80, -2.5], [-80, 1], [-77.5, 4], [-77.5, 7]],
  // Australia
  [[114, -22], [114, -26], [115.5, -34], [119, -34.5], [124, -33], [129, -31.5], [134, -32.5], [138, -35], [140.5, -38], [146, -39], [150, -37.5], [153, -31], [153, -25], [149, -21.5], [146, -19], [145.5, -15], [142.5, -11], [141.5, -13.5], [141, -17.5], [136, -15.5], [136.5, -12], [131, -12], [129, -15], [125, -14], [122, -17.5], [117, -20.5]],
  // Madagascar
  [[44, -25], [47, -25], [50, -15.5], [49, -12], [44.5, -16], [43.5, -21]],
  // Giappone
  [[130, 31.5], [131, 34], [136, 35], [140, 35.5], [141, 38], [141.5, 41], [140, 41], [139, 38], [136, 36.5], [133, 35.5]],
];

/** Aggiunge punti intermedi: così i bordi seguono la curvatura della sfera. */
function infittisci(poligono: [number, number][], passo = 4): [number, number][] {
  const fitto: [number, number][] = [];
  for (let i = 0; i < poligono.length; i++) {
    const [a, b] = poligono[i];
    const [c, d] = poligono[(i + 1) % poligono.length];
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(c - a), Math.abs(d - b)) / passo));
    for (let k = 0; k < n; k++) fitto.push([a + ((c - a) * k) / n, b + ((d - b) * k) / n]);
  }
  return fitto;
}

export type Punto3D = {x: number; y: number; z: number};

/** Vista sulla sfera: quale longitudine e latitudine stanno al centro. */
export type VistaGlobo = {longitudine: number; latitudine: number};

/** Da (longitudine, latitudine, quota in raggi terrestri) a coordinate viste dalla camera (z > 0 = davanti). */
export function suSfera(lon: number, lat: number, vista: VistaGlobo, distanza = 1): Punto3D {
  const l = (lon - vista.longitudine) * RAD;
  const f = lat * RAD;
  const x = Math.cos(f) * Math.sin(l) * distanza;
  const y = Math.sin(f) * distanza;
  const z = Math.cos(f) * Math.cos(l) * distanza;
  const t = vista.latitudine * RAD;
  return {x, y: y * Math.cos(t) - z * Math.sin(t), z: y * Math.sin(t) + z * Math.cos(t)};
}

/** Posizione sullo schermo di un luogo della Terra. `visibile` è false se sta dall'altra parte. */
export function luogo(lon: number, lat: number, globo: {x: number; y: number; raggio: number} & VistaGlobo) {
  const p = suSfera(lon, lat, globo);
  return {x: globo.x + p.x * globo.raggio, y: globo.y - p.y * globo.raggio, visibile: p.z > 0};
}

/**
 * Punto di un'orbita circolare.
 * @param raggio      distanza dal centro, in raggi terrestri (GPS: 4,17)
 * @param inclinazione gradi rispetto all'equatore (GPS: 55)
 * @param nodo         gradi: orientamento del piano orbitale
 * @param angolo       gradi: posizione lungo l'orbita
 */
export function suOrbita(raggio: number, inclinazione: number, nodo: number, angolo: number, vista: VistaGlobo): Punto3D {
  const u = angolo * RAD;
  const i = inclinazione * RAD;
  const o = (nodo - vista.longitudine) * RAD;
  const x0 = Math.cos(u) * raggio;
  const y0 = Math.sin(u) * Math.sin(i) * raggio;
  const z0 = Math.sin(u) * Math.cos(i) * raggio;
  const x = x0 * Math.cos(o) + z0 * Math.sin(o);
  const z = -x0 * Math.sin(o) + z0 * Math.cos(o);
  const t = vista.latitudine * RAD;
  return {x, y: y0 * Math.cos(t) - z * Math.sin(t), z: y0 * Math.sin(t) + z * Math.cos(t)};
}

export type PropsGlobo = VistaGlobo & {
  x: number;
  y: number;
  raggio: number;
  /** Colore delle terre e del reticolo. */
  colore?: string;
  /** Colore dell'alone d'atmosfera. */
  alone?: string;
  reticolo?: boolean;
  opacita?: number;
};

export function Globo({x, y, raggio, longitudine, latitudine, colore, alone, reticolo = true, opacita = 1}: PropsGlobo) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const c = colore ?? stile.colori.luce;
  const aria = alone ?? stile.colori.luce2;
  const vista = {longitudine, latitudine};
  const terreFitte = useMemo(() => TERRE.map((t) => infittisci(t)), []);

  const terre: string[] = [];
  for (const poligono of terreFitte) {
    let davanti = 0;
    const punti = poligono.map(([lon, lat]) => {
      const p = suSfera(lon, lat, vista);
      if (p.z > 0) {
        davanti++;
        return [p.x, p.y];
      }
      // dietro: il punto viene schiacciato sul bordo del disco, così la parte nascosta non si vede
      const n = Math.hypot(p.x, p.y) || 1;
      return [p.x / n, p.y / n];
    });
    if (davanti < 2) continue;
    terre.push('M ' + punti.map(([px, py]) => `${(px * raggio).toFixed(1)} ${(-py * raggio).toFixed(1)}`).join(' L ') + ' Z');
  }

  const linee: string[] = [];
  if (reticolo) {
    const traccia = (punti: Punto3D[]) => {
      let d = '';
      let aperto = false;
      for (const p of punti) {
        if (p.z > 0.02) {
          d += `${aperto ? ' L' : ' M'} ${(p.x * raggio).toFixed(1)} ${(-p.y * raggio).toFixed(1)}`;
          aperto = true;
        } else {
          aperto = false;
        }
      }
      if (d) linee.push(d);
    };
    for (let lon = -180; lon < 180; lon += 30) {
      const punti: Punto3D[] = [];
      for (let lat = -90; lat <= 90; lat += 6) punti.push(suSfera(lon, lat, vista));
      traccia(punti);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const punti: Punto3D[] = [];
      for (let lon = -180; lon <= 180; lon += 6) punti.push(suSfera(lon, lat, vista));
      traccia(punti);
    }
  }

  const R = raggio;
  const bordo = R * 1.42;
  return (
    <svg
      width={bordo * 2}
      height={bordo * 2}
      viewBox={`${-bordo} ${-bordo} ${bordo * 2} ${bordo * 2}`}
      style={{position: 'absolute', left: x - bordo, top: y - bordo, overflow: 'visible', opacity: opacita}}
    >
      <defs>
        <radialGradient id={`aria-${id}`}>
          <stop offset={0.66} stopColor={aria} stopOpacity={0} />
          <stop offset={0.7} stopColor={aria} stopOpacity={0.55} />
          <stop offset={0.78} stopColor={aria} stopOpacity={0.2} />
          <stop offset={1} stopColor={aria} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`mare-${id}`} cx="36%" cy="30%" r="80%">
          <stop offset={0} stopColor="#17456F" />
          <stop offset={0.55} stopColor="#0A2542" />
          <stop offset={1} stopColor="#040C19" />
        </radialGradient>
        <radialGradient id={`ombra-${id}`} cx="30%" cy="26%" r="88%">
          <stop offset={0.45} stopColor="#000000" stopOpacity={0} />
          <stop offset={1} stopColor="#000000" stopOpacity={0.78} />
        </radialGradient>
        <radialGradient id={`lucido-${id}`} cx="30%" cy="24%" r="46%">
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`disco-${id}`}>
          <circle r={R} />
        </clipPath>
      </defs>
      <circle r={bordo} fill={`url(#aria-${id})`} />
      <circle r={R} fill={`url(#mare-${id})`} />
      <g clipPath={`url(#disco-${id})`}>
        {linee.map((d, k) => (
          <path key={k} d={d} fill="none" stroke={alfa(c, 0.2)} strokeWidth={Math.max(1, R * 0.006)} />
        ))}
        {terre.map((d, k) => (
          <path key={k} d={d} fill={alfa(c, 0.5)} stroke={alfa(c, 0.95)} strokeWidth={Math.max(1.2, R * 0.009)} strokeLinejoin="round" />
        ))}
        <circle r={R} fill={`url(#ombra-${id})`} />
        <circle r={R} fill={`url(#lucido-${id})`} />
      </g>
      <circle r={R} fill="none" stroke={alfa(aria, 0.75)} strokeWidth={Math.max(1.5, R * 0.012)} />
    </svg>
  );
}

/**
 * Disegna metà di un'orbita: quella davanti al globo oppure quella dietro.
 * Metti 'dietro' PRIMA del <Globo> e 'davanti' DOPO: così l'orbita gli gira davvero attorno.
 */
export function TracciaOrbita({
  globo,
  raggio,
  inclinazione,
  nodo,
  lato,
  colore,
  spessore = 2,
  opacita = 1,
  tratteggio,
}: {
  globo: {x: number; y: number; raggio: number} & VistaGlobo;
  raggio: number;
  inclinazione: number;
  nodo: number;
  lato: 'davanti' | 'dietro';
  colore?: string;
  spessore?: number;
  opacita?: number;
  tratteggio?: string;
}) {
  const c = colore ?? stile.colori.luce;
  let d = '';
  let aperto = false;
  for (let a = 0; a <= 360; a += 4) {
    const p = suOrbita(raggio, inclinazione, nodo, a, globo);
    const nascosto = p.z < 0 && Math.hypot(p.x, p.y) < 1; // dietro al disco della Terra
    const giusto = lato === 'davanti' ? p.z >= 0 : p.z < 0 && !nascosto;
    if (giusto) {
      d += `${aperto ? ' L' : ' M'} ${(globo.x + p.x * globo.raggio).toFixed(1)} ${(globo.y - p.y * globo.raggio).toFixed(1)}`;
      aperto = true;
    } else {
      aperto = false;
    }
  }
  if (!d) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <path d={d} fill="none" stroke={c} strokeWidth={spessore} strokeDasharray={tratteggio} opacity={opacita * (lato === 'davanti' ? 1 : 0.4)} />
    </svg>
  );
}
