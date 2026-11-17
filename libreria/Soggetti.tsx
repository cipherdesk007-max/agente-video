// FMLAB Reel Kit — I SOGGETTI: oggetti grandi, illustrati, in primo piano, che non si fermano mai.
// È quello che nei reel di riferimento riempie il palco: due ginocchia che brillano, un quadrante, due batterie.
// Un soggetto occupa da metà a tutto il palco, ha un bagliore che respira, scintille che gli girano attorno,
// galleggia; e ha uno STATO fatto di numeri (dolore, valore, livello) che cambia su una parola del copione.
// Lo stesso soggetto torna in più scene con uno stato diverso: è così che il reel resta una cosa sola.
//
//   bloccoSoggetti({soggetti: [
//     {tipo: 'ginocchio', etichetta: 'Reta', stato: {dolore: 1}, cambia: [{segno: 'meno', stato: {dolore: 0.2}}]},
//     {tipo: 'ginocchio', etichetta: 'Placebo', colore: '#C9D4E0', stato: {dolore: 1}, segno: 'placebo'},
//   ]})
import {useId} from 'react';
import type {ComponentType, ReactNode} from 'react';
import {stile} from '../stile/stile';
import {limita, mix, molla, rampa} from './anim';
import {alfa, miscela} from './colore';
import {useScena, useTempo} from './tempo';

const C = stile.colori;
const CX = stile.palco.centroX;
const CY = stile.palco.centroY;

type Testo = string | Record<string, string>;
type Quando = string | number;

export type TipoSoggetto = 'ginocchio' | 'quadrante' | 'batteria' | 'icona' | 'stomaco' | 'riflettori' | 'foglio' | 'scale' | 'immagine';
export const SOGGETTI: Record<TipoSoggetto, {cosa: string; stato: Record<string, number>}> = {
  ginocchio: {cosa: 'un ginocchio che brilla: rosso se fa male, verde se sta bene', stato: {dolore: 0}},
  quadrante: {cosa: 'un quadrante da 0 al massimo con la lancetta', stato: {valore: 0, massimo: 10}},
  batteria: {cosa: 'una batteria a tacche: quanto ce n\'è', stato: {livello: 1, accesa: 1}},
  icona: {cosa: 'un\'icona grande che brilla (npm run icone <parola>)', stato: {acceso: 1}},
  stomaco: {cosa: 'uno stomaco al neon: si irrita', stato: {irritato: 0}},
  riflettori: {cosa: 'un palco con i fari che girano', stato: {luci: 1}},
  foglio: {cosa: 'la pagina di uno studio, con una riga che si accende', stato: {evidenzia: 0}},
  scale: {cosa: 'una scala i cui gradini si accendono uno dopo l\'altro', stato: {passo: 0}},
  immagine: {cosa: 'un\'illustrazione generata, su fondo trasparente (npm run immagine): prende il posto di un soggetto disegnato', stato: {acceso: 1}},
};

export type Soggetto = {
  tipo: TipoSoggetto;
  /** Solo per tipo 'immagine': il file, es. "libreria/immagini/ginocchio-1a2b3c4d5e6f.png" (lo dice `npm run immagine`). */
  file?: string;
  /** Solo per tipo 'icona'. */
  icona?: ComponentType<{size?: number | string; color?: string}>;
  etichetta?: Testo;
  /** Una riga piccola sotto l'etichetta (un numero con la sua unità, per esempio). */
  nota?: Testo;
  colore?: string;
  /** Quando compare (di serie: all'inizio della scena). */
  segno?: Quando;
  /** I numeri di partenza. */
  stato?: Record<string, number>;
  /** Cosa cambia, e su quale parola. */
  cambia?: {segno: Quando; stato: Record<string, number>; durata?: number}[];
};

type Disegno = {p: Record<string, number>; t: number; colore: string; lato: number; icona?: Soggetto['icona']; /** Solo la forma, senza aloni: è la copia su cui passa il riflesso. */ nudo?: boolean};

const ARIA = 'drop-shadow(0 0 14px VAR)';
const luceDi = (colore: string, forza = 1) => ({filter: ARIA.replace('VAR', alfa(colore, 0.75 * forza))});

// ───────────────────────── i disegni (in una scatola da -100 a 100) ─────────────────────────

function Ginocchio({p, t, colore, nudo}: Disegno) {
  const dolore = limita(p.dolore ?? 0);
  const giunto = miscela(C.positivo, C.negativo, dolore);
  const batte = 0.5 + 0.5 * Math.sin(t * (3 + 4 * dolore));
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Una radiografia di vetro: le due teste dell'osso sono piene e luminose vicino all'articolazione e svaniscono
  // allontanandosi, il bordo è una luce morbida più un filo netto. Il contorno uniforme di prima era un'icona.
  const FEMORE = 'M-30 -106 C-31 -74 -38 -54 -60 -42 C-80 -31 -83 -9 -67 -4 C-50 1 -31 -3 -17 -9 C-9 -13 -7 -19 0 -19 C7 -19 9 -13 17 -9 C31 -3 50 1 67 -4 C83 -9 80 -31 60 -42 C38 -54 31 -74 30 -106';
  const TIBIA = 'M-28 106 C-30 86 -33 70 -41 57 C-53 41 -75 29 -69 11 C-66 5 -40 6 -15 7 C-9 7 -7 1 0 1 C7 1 9 7 15 7 C40 6 66 5 69 11 C75 29 53 41 41 57 C33 70 30 86 28 106';
  const PERONE = 'M47 106 C47 90 49 77 47 67 C45 58 47 52 54 50 C63 47 71 55 67 67 C63 79 61 91 61 106';
  return (
    <>
      <defs>
        <linearGradient id={`${id}su`} gradientUnits="userSpaceOnUse" x1="0" y1="-106" x2="0" y2="-4">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#F4F1E8" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}giu`} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="106">
          <stop offset="0" stopColor="#F4F1E8" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}bsu`} gradientUnits="userSpaceOnUse" x1="0" y1="-106" x2="0" y2="-4">
          <stop offset="0" stopColor={colore} stopOpacity="0" />
          <stop offset="0.35" stopColor={colore} stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${id}bgiu`} gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="106">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.65" stopColor={colore} stopOpacity="0.75" />
          <stop offset="1" stopColor={colore} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}male`}>
          <stop offset="0" stopColor={giunto} stopOpacity={0.9} />
          <stop offset="0.55" stopColor={giunto} stopOpacity={0.35} />
          <stop offset="1" stopColor={giunto} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}testa`} cx="0.5" cy="0.9" r="0.7">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="scale(1.04)">
      {/* il calore dentro l'articolazione: più fa male, più è largo e batte */}
      {nudo ? null : <ellipse cx="0" cy="-2" rx={70 + 16 * dolore + 8 * batte * dolore} ry={44 + 18 * dolore + 6 * batte * dolore} fill={`url(#${id}male)`} opacity={0.3 + 0.6 * dolore} />}
      {nudo
        ? null
        : [0, 1, 2].map((k) => {
            const giro = (t * (0.5 + 0.6 * dolore) + k / 3) % 1;
            return <ellipse key={k} cx="0" cy="-2" rx={52 + 60 * giro} ry={34 + 44 * giro} fill="none" stroke={giunto} strokeWidth={2} opacity={(1 - giro) * (0.05 + 0.3 * dolore)} />;
          })}
      {/* le due parentesi rosse ai lati, come un gonfiore: ci sono solo se fa male */}
      {nudo || dolore < 0.05
        ? null
        : [-1, 1].map((lato) => (
            <path key={lato} d={`M${lato * 78} -38 C${lato * (89 + 3 * batte)} -15 ${lato * (89 + 3 * batte)} 13 ${lato * 78} 36`} fill="none" stroke={C.negativo} strokeWidth={3.2} strokeLinecap="round" opacity={dolore * (0.55 + 0.4 * batte)} style={luceDi(C.negativo, 1.2)} />
          ))}
      {/* il vetro: il pieno che svanisce */}
      <path d={FEMORE} fill={`url(#${id}su)`} />
      <path d={`${TIBIA} Z`} fill={`url(#${id}giu)`} />
      <path d={PERONE} fill={`url(#${id}giu)`} opacity="0.7" />
      {/* il volume: le due teste del femore e il piatto della tibia prendono luce dal centro */}
      <ellipse cx="-40" cy="-22" rx="30" ry="22" fill={`url(#${id}testa)`} />
      <ellipse cx="40" cy="-22" rx="30" ry="22" fill={`url(#${id}testa)`} />
      <ellipse cx="0" cy="22" rx="58" ry="18" fill={`url(#${id}testa)`} opacity="0.7" />
      {/* il bordo: una luce larga e morbida, poi il filo netto */}
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        <g style={{filter: 'blur(3.5px)'}} strokeWidth="9" opacity="0.75">
          <path d={FEMORE} stroke={`url(#${id}bsu)`} />
          <path d={TIBIA} stroke={`url(#${id}bgiu)`} />
        </g>
        <g strokeWidth="2.4" style={luceDi(colore, 1.2)}>
          <path d={FEMORE} stroke={`url(#${id}bsu)`} />
          <path d={TIBIA} stroke={`url(#${id}bgiu)`} />
          <path d={PERONE} stroke={`url(#${id}bgiu)`} opacity="0.6" strokeWidth="1.8" />
        </g>
      </g>
      {/* la rima dell'articolazione: la cosa che si guarda. Verde e ferma se sta bene, rossa e che batte se fa male */}
      <path d={`M-66 ${1.5 + 2 * batte * dolore} C-30 -3 30 -3 66 ${1.5 - 2 * batte * dolore}`} fill="none" stroke={giunto} strokeWidth={9 + 4 * batte} strokeLinecap="round" opacity="0.55" style={{filter: 'blur(4px)'}} />
      <path d={`M-66 ${1.5 + 2 * batte * dolore} C-30 -3 30 -3 66 ${1.5 - 2 * batte * dolore}`} fill="none" stroke={giunto} strokeWidth={4.4 + 1.6 * batte} strokeLinecap="round" style={luceDi(giunto, 1.3)} />
      <path d={`M-58 ${1.2 + 2 * batte * dolore} C-28 -2.6 28 -2.6 58 ${1.2 - 2 * batte * dolore}`} fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      </g>
    </>
  );
}

function Quadrante({p, t, colore}: Disegno) {
  const massimo = p.massimo || 10;
  const quota = limita((p.valore ?? 0) / massimo);
  const trema = 1.6 * Math.sin(t * 9) * (0.3 + quota) + 1.2 * Math.sin(t * 2.3);
  const angolo = (180 + 180 * quota + trema) * (Math.PI / 180);
  const R = 80;
  const cy = 34;
  const punto = (a: number, r: number) => `${(r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  const N = 36;
  const tinta = miscela(miscela(C.positivo, C.accento, limita(quota * 2)), C.negativo, limita(quota * 2 - 1));
  return (
    <>
      <path d={`M-96 ${cy + 8} A96 96 0 0 1 96 ${cy + 8} L96 ${cy + 22} L-96 ${cy + 22} Z`} fill="#0A1016" stroke={alfa(colore, 0.55)} strokeWidth="2" style={luceDi(colore, 0.7)} />
      {Array.from({length: N}, (_, i) => {
        const a0 = Math.PI + (Math.PI * i) / N;
        const a1 = Math.PI + (Math.PI * (i + 1)) / N + 0.01;
        const k = (i + 0.5) / N;
        const c = miscela(miscela(C.positivo, C.accento, limita(k * 2)), C.negativo, limita(k * 2 - 1));
        const acceso = k <= quota + 0.02;
        return <path key={i} d={`M${punto(a0, R)} A${R} ${R} 0 0 1 ${punto(a1, R)}`} fill="none" stroke={c} strokeWidth={acceso ? 17 : 13} opacity={acceso ? 1 : 0.38} />;
      })}
      {Array.from({length: 11}, (_, i) => {
        const a = Math.PI + (Math.PI * i) / 10;
        return <path key={i} d={`M${punto(a, R - 16)} L${punto(a, R - (i % 5 ? 22 : 28))}`} stroke="#FFFFFF" strokeWidth={i % 5 ? 1.4 : 2.4} opacity="0.8" />;
      })}
      <text x={-R + 22} y={cy - 2} fill="#fff" fontSize="15" fontWeight="800" textAnchor="middle" fontFamily={stile.font.titoli}>0</text>
      <text x={R - 24} y={cy - 2} fill="#fff" fontSize="15" fontWeight="800" textAnchor="middle" fontFamily={stile.font.titoli}>{massimo}</text>
      <g style={luceDi(tinta, 1.2)}>
        <path d={`M${punto(angolo + Math.PI / 2, 5)} L${punto(angolo, R - 12)} L${punto(angolo - Math.PI / 2, 5)} Z`} fill="#FFFFFF" />
        <circle cx="0" cy={cy} r="9" fill={tinta} stroke="#fff" strokeWidth="2.5" />
      </g>
    </>
  );
}

function Batteria({p, t, colore}: Disegno) {
  const livello = limita(p.livello ?? 1);
  const accesa = limita(p.accesa ?? 1);
  const tinta = miscela('#B9C4CF', colore, accesa);
  const TACCHE = 4;
  const alta = 36;
  const passa = ((t * 0.55) % 1) * 190 - 95;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Un oggetto di vetro, non un contorno: il corpo è scuro e lucido, le tacche sono blocchi pieni con la luce in
  // alto a sinistra, un riflesso corre lungo il fianco.
  return (
    <>
      <defs>
        <linearGradient id={`${id}corpo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="0.18" stopColor="#0A1016" stopOpacity="0.5" />
          <stop offset="0.8" stopColor="#0A1016" stopOpacity="0.62" />
          <stop offset="1" stopColor={tinta} stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={`${id}tacca`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={miscela(tinta, '#FFFFFF', 0.62)} />
          <stop offset="0.45" stopColor={miscela(tinta, '#FFFFFF', 0.16)} />
          <stop offset="1" stopColor={miscela(tinta, '#04121A', 0.3)} />
        </linearGradient>
        <clipPath id={`${id}dentro`}>
          <rect x="-42" y="-84" width="84" height="172" rx="13" />
        </clipPath>
      </defs>
      <rect x="-15" y="-97" width="30" height="14" rx="4" fill={`url(#${id}tacca)`} opacity={0.55 + 0.45 * accesa} />
      <rect x="-42" y="-84" width="84" height="172" rx="13" fill="none" stroke={tinta} strokeWidth="9" opacity={0.3 + 0.35 * accesa} style={{filter: 'blur(4px)'}} />
      <rect x="-42" y="-84" width="84" height="172" rx="13" fill={`url(#${id}corpo)`} stroke={tinta} strokeWidth="2.6" style={luceDi(tinta, 0.5 + 0.5 * accesa)} />
      {Array.from({length: TACCHE}, (_, i) => {
        const piena = limita(livello * TACCHE - i);
        const y = 78 - (i + 1) * (alta + 5) + 5;
        if (piena <= 0) return <rect key={i} x="-33" y={y} width="66" height={alta} rx="6" fill={alfa(tinta, 0.06)} stroke={alfa(tinta, 0.28)} strokeWidth="1.5" />;
        const h = alta * piena;
        return (
          <g key={i} opacity={0.9 + 0.1 * Math.sin(t * 3.1 + i)}>
            <rect x="-33" y={y + alta - h} width="66" height={h} rx="6" fill={`url(#${id}tacca)`} style={luceDi(tinta, accesa)} />
            {h > 12 ? <rect x="-28" y={y + alta - h + 4} width="56" height="5" rx="2.5" fill="#FFFFFF" opacity="0.42" /> : null}
          </g>
        );
      })}
      <g clipPath={`url(#${id}dentro)`}>
        <rect x="-36" y="-78" width="7" height="160" rx="3.5" fill="#FFFFFF" opacity="0.2" />
        <rect x="-42" y={passa} width="84" height="16" fill="#FFFFFF" opacity={0.22 * accesa} />
      </g>
    </>
  );
}
function Stomaco({p, t, colore, nudo}: Disegno) {
  const irritato = limita(p.irritato ?? 0);
  const tinta = miscela(colore, C.negativo, irritato);
  const onda = (k: number) => 3 * Math.sin(t * (2 + 3 * irritato) + k);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const SACCA = 'M-34 -96 L-34 -60 C-70 -50 -86 -10 -76 30 C-64 76 -10 92 34 74 C58 64 70 44 72 26 L96 26 L96 6 L60 6 C52 6 50 16 48 26 C44 44 20 54 0 46 C-24 36 -22 2 -4 -22 C8 -38 6 -50 -8 -58 L-8 -96 Z';
  const piega = (k: number) => `M${-62 + k * 5} ${-22 + k * 22 + onda(k)} C${-48 + k * 8} ${-8 + k * 22 - onda(k)} ${-36 + k * 12} ${2 + k * 20 + onda(k + 1)} ${-22 + k * 16} ${10 + k * 17 - onda(k)}`;
  // Un tubo al neon ha spessore: un alone largo, il tubo colorato, il filo bianco al centro. E dentro la sacca è
  // piena, più chiara verso il bordo: è un organo, non un'icona.
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <radialGradient id={`${id}carne`} cx="0.42" cy="0.55" r="0.62">
          <stop offset="0" stopColor={miscela(tinta, '#1A0508', 0.6)} stopOpacity="0.55" />
          <stop offset="0.7" stopColor={tinta} stopOpacity={0.2 + 0.14 * irritato} />
          <stop offset="1" stopColor={tinta} stopOpacity={0.42 + 0.2 * irritato} />
        </radialGradient>
      </defs>
      <path d={SACCA} stroke={tinta} strokeWidth="16" opacity="0.5" style={{filter: 'blur(6px)'}} />
      <path d={SACCA} stroke={tinta} strokeWidth="6.5" fill={`url(#${id}carne)`} style={luceDi(tinta, 1.3)} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k} opacity={0.6 + 0.4 * irritato}>
          <path d={piega(k)} stroke={tinta} strokeWidth="9" opacity="0.4" style={{filter: 'blur(3px)'}} />
          <path d={piega(k)} stroke={miscela(tinta, '#FFFFFF', 0.25)} strokeWidth="3.6" />
        </g>
      ))}
      <path d={SACCA} stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
      {(nudo ? [] : [0, 1, 2]).map((k) => {
        const giro = (t * (0.4 + 0.7 * irritato) + k / 3) % 1;
        return <circle key={k} cx="-20" cy="34" r={20 + 70 * giro} stroke={tinta} strokeWidth="2.2" opacity={(1 - giro) * irritato * 0.7} />;
      })}
    </g>
  );
}
function Riflettori({p, t, colore, nudo}: Disegno) {
  const luci = nudo ? 0 : limita(p.luci ?? 1);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  // Un concerto visto dalla platea: i coni di luce sono pieni vicino al faro e si perdono nel fumo, il palco ha
  // un bordo che brilla, il pubblico è una fila di teste e spalle in controluce che ondeggia.
  const testa = (x: number, y: number, r: number, k: number) => {
    const su = 3 * Math.sin(t * 5 + k * 1.3) * luci;
    return (
      <g key={k} transform={`translate(${x} ${y + su})`}>
        <path d={`M${-r * 1.9} ${r * 3} C${-r * 1.9} ${r * 1.3} ${-r * 0.9} ${r * 1.05} 0 ${r * 1.05} C${r * 0.9} ${r * 1.05} ${r * 1.9} ${r * 1.3} ${r * 1.9} ${r * 3} Z`} fill="#05090D" stroke={alfa(colore, 0.35)} strokeWidth="1.2" />
        <circle r={r} fill="#05090D" stroke={alfa('#FFFFFF', 0.4)} strokeWidth="1.2" />
        <path d={`M${-r * 0.75} ${-r * 0.62} A${r} ${r} 0 0 1 ${r * 0.75} ${-r * 0.62}`} fill="none" stroke={alfa(colore, 0.8 * luci)} strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  };
  return (
    <>
      <defs>
        {[0, 1].map((k) => (
          <linearGradient key={k} id={`${id}cono${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={k ? '#FFFFFF' : colore} stopOpacity="0.85" />
            <stop offset="0.5" stopColor={k ? '#FFFFFF' : colore} stopOpacity="0.28" />
            <stop offset="1" stopColor={k ? '#FFFFFF' : colore} stopOpacity="0" />
          </linearGradient>
        ))}
        <linearGradient id={`${id}palco`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colore} stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#0A1016" stopOpacity="0.9" />
          <stop offset="1" stopColor="#05090D" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <g transform="translate(0 -12) scale(0.96)">
      <path d="M-98 -80 L98 -80" stroke="#C9D4E0" strokeWidth="3.4" strokeLinecap="round" />
      {[-66, -22, 22, 66].map((x, i) => {
        const gira = 16 * Math.sin(t * 0.9 + i * 1.7);
        const forza = (0.5 + 0.22 * Math.sin(t * 2 + i)) * luci;
        return (
          <g key={i}>
            <path d={`M${x - 4} -76 L${x + 4} -76 L${x + gira + 34} 62 L${x + gira - 34} 62 Z`} fill={`url(#${id}cono${i % 2})`} opacity={forza} style={{filter: 'blur(2.5px)'}} />
            <path d={`M${x - 7} -84 L${x + 7} -84 L${x + 5} -72 L${x - 5} -72 Z`} fill="#1B2630" stroke="#C9D4E0" strokeWidth="1.4" />
            <circle cx={x} cy="-72" r={4 + 2 * luci} fill="#fff" opacity={0.5 + 0.5 * luci} style={luceDi(i % 2 ? '#FFFFFF' : colore, 1.4)} />
          </g>
        );
      })}
      <ellipse cx="0" cy="62" rx="92" ry="9" fill={colore} opacity={0.3 * luci} style={{filter: 'blur(6px)'}} />
      <path d="M-98 60 L98 60 L98 76 L-98 76 Z" fill={`url(#${id}palco)`} stroke={alfa(colore, 0.75)} strokeWidth="1.8" />
      <g stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.92" style={luceDi('#FFFFFF', 0.6)}>
        <path d="M0 60 L0 -4" />
        <path d="M-10 60 L10 60" />
        <rect x="-5" y="-22" width="10" height="18" rx="5" fill="#fff" fillOpacity="0.9" />
      </g>
      <g transform="translate(-50 28) rotate(-18)" stroke="#fff" strokeWidth="1.6" style={luceDi(colore, 0.8)}>
        <path d="M0 -4 C10 -4 12 4 9 9 C16 12 17 28 0 30 C-17 28 -16 12 -9 9 C-12 4 -10 -4 0 -4 Z" fill={alfa(colore, 0.85)} />
        <circle cx="0" cy="14" r="4" fill="#05090D" />
        <rect x="-2.4" y="-40" width="4.8" height="37" fill={alfa(colore, 0.6)} />
        <rect x="-4" y="-47" width="8" height="8" rx="1.5" fill="#fff" />
      </g>
      {Array.from({length: 8}, (_, i) => testa(-84 + i * 24, 84, 7, i + 9))}
      {Array.from({length: 7}, (_, i) => testa(-78 + i * 26, 92, 9, i))}
      </g>
    </>
  );
}
function Foglio({p, t, colore}: Disegno) {
  const evidenzia = limita(p.evidenzia ?? 0);
  const piega = 4 * Math.sin(t * 0.8);
  return (
    <g transform={`rotate(${-5 + piega * 0.4}) skewY(${-3 + piega * 0.3})`}>
      <rect x="-68" y="-92" width="136" height="184" rx="6" fill="#F4F7F2" stroke={colore} strokeWidth="2" style={luceDi(colore, 0.9)} />
      <rect x="-58" y="-82" width="80" height="12" rx="2" fill="#12161D" />
      <rect x="-58" y="-62" width="116" height="9" rx="2" fill={colore} opacity="0.9" />
      {Array.from({length: 13}, (_, i) => {
        const acceso = i === 5 || i === 6;
        return <rect key={i} x="-58" y={-44 + i * 10} width={acceso ? 116 : 116 - ((i * 37) % 40)} height="5" rx="2" fill={acceso ? miscela('#9AA5A0', colore, evidenzia) : '#9AA5A0'} opacity={acceso ? 0.6 + 0.4 * evidenzia : 0.6} />;
      })}
      <rect x="-62" y={4} width="124" height="24" rx="4" fill="none" stroke={colore} strokeWidth={3 * evidenzia} opacity={evidenzia * (0.7 + 0.3 * Math.sin(t * 5))} />
    </g>
  );
}

function Scale({p, t, colore}: Disegno) {
  const passo = p.passo ?? 0;
  const N = 6;
  return (
    <>
      {Array.from({length: N}, (_, i) => {
        const x = -96 + i * 30;
        const y = 84 - i * 28;
        const acceso = limita(passo - i + 0.5 + 0.5 * Math.sin(t * 2.4 - i * 0.9));
        return (
          <g key={i}>
            <path d={`M${x} ${y} L${x + 34} ${y} L${x + 34} 96 L${x} 96 Z`} fill="#0A1016" stroke={alfa(colore, 0.35 + 0.5 * acceso)} strokeWidth="1.6" />
            <path d={`M${x} ${y} L${x + 34} ${y}`} stroke={colore} strokeWidth={3 + 3 * acceso} opacity={0.35 + 0.65 * acceso} style={luceDi(colore, acceso)} />
          </g>
        );
      })}
    </>
  );
}

const DISEGNI: Record<TipoSoggetto, (d: Disegno) => ReactNode> = {
  ginocchio: Ginocchio,
  quadrante: Quadrante,
  batteria: Batteria,
  stomaco: Stomaco,
  riflettori: Riflettori,
  foglio: Foglio,
  scale: Scale,
  icona: () => null,
  immagine: () => null,
};

// ───────────────────────── il soggetto vivo ─────────────────────────

/** Un soggetto grande e vivo: bagliore che respira, scintille in orbita, galleggia. `lato` è il lato della sua scatola in pixel. */
export function SoggettoVivo({soggetto, x, y, lato, p, da, indice = 0, colpo = 0}: {soggetto: Soggetto; x: number; y: number; lato: number; p: Record<string, number>; da: number; indice?: number; /** Da 1 a 0 nel mezzo secondo dopo un cambio di stato: il soggetto dà un colpo, così il cambio si vede. */ colpo?: number}) {
  const tempo = useTempo();
  const t = tempo.ora + indice * 1.37;
  if (da <= 0) return null;
  const colore = soggetto.colore ?? C.luce;
  const entra = molla(da, {rigidita: 120, smorzamento: 13});
  const galleggia = 24 * Math.sin(t * 1.3) + 8 * Math.sin(t * 2.9);
  const deriva = 16 * Math.sin(t * 0.9 + 2);
  const dondola = 2.6 * Math.sin(t * 1.1 + 1);
  const respira = 1 + 0.05 * Math.sin(t * 2.2);
  // il riflesso: una lama di luce che attraversa il soggetto ogni due secondi e mezzo, solo dove il soggetto c'è
  const PERIODO = 2.5;
  const passa = ((t % PERIODO) / 0.95) * 150 - 35; // da -35% a 115% in 0,95 secondi, poi pausa
  const battito = 0.5 + 0.5 * Math.sin(t * 2.6);
  const Icona = soggetto.icona;
  const Disegno = DISEGNI[soggetto.tipo];
  const SCINTILLE = 12;
  return (
    <div style={{position: 'absolute', left: x - lato / 2, top: y - lato / 2, width: lato, height: lato, opacity: rampa(da, 0.25), transform: `translate(${deriva.toFixed(2)}px, ${((1 - entra) * 90 + galleggia).toFixed(2)}px) rotate(${dondola.toFixed(3)}deg) scale(${(mix(0.7, 1, entra) * respira * (1 + 0.09 * colpo)).toFixed(4)})`}}>
      {/* il colpo: un anello di luce che si allarga dal soggetto quando cambia stato */}
      {colpo > 0.02 ? <div style={{position: 'absolute', inset: `${(-lato * 0.32 * (1 - colpo)).toFixed(1)}px`, borderRadius: '50%', border: `${(3 + 9 * colpo).toFixed(1)}px solid ${alfa(colore, 0.85 * colpo)}`, boxShadow: `0 0 ${Math.round(50 * colpo)}px ${alfa(colore, 0.7 * colpo)}`}} /> : null}
      {/* il bagliore dietro, che respira */}
      <div style={{position: 'absolute', inset: -lato * 0.18, borderRadius: '50%', background: `radial-gradient(circle, ${alfa(colore, 0.3 + 0.22 * battito)} 0%, ${alfa(colore, 0.1 + 0.08 * battito)} 38%, transparent 68%)`}} />
      {soggetto.tipo === 'immagine' && soggetto.file ? (
        <img src={tempo.risorsa(soggetto.file)} alt="" style={{position: 'absolute', left: '5%', top: '5%', width: '90%', height: '90%', objectFit: 'contain', filter: `drop-shadow(0 0 ${Math.round(16 + 14 * battito)}px ${alfa(colore, 0.8)})`, opacity: 0.55 + 0.45 * limita(p.acceso ?? 1)}} />
      ) : soggetto.tipo === 'icona' && Icona ? (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 ${Math.round(18 + 16 * battito)}px ${alfa(colore, 0.85)})`, opacity: 0.55 + 0.45 * limita(p.acceso ?? 1)}}>
          <Icona size={lato * 0.72} color={colore} />
        </div>
      ) : (
        <svg width={lato} height={lato} viewBox="-100 -100 200 200" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Disegno p={p} t={t} colore={colore} lato={lato} />
        </svg>
      )}
      {passa < 115 ? (
        <div style={{position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'plus-lighter', filter: 'brightness(0) invert(1)', WebkitMaskImage: `linear-gradient(108deg, transparent ${(passa - 10).toFixed(1)}%, #000 ${passa.toFixed(1)}%, transparent ${(passa + 10).toFixed(1)}%)`, maskImage: `linear-gradient(108deg, transparent ${(passa - 10).toFixed(1)}%, #000 ${passa.toFixed(1)}%, transparent ${(passa + 10).toFixed(1)}%)`}}>
          {soggetto.tipo === 'immagine' && soggetto.file ? (
            <img src={tempo.risorsa(soggetto.file)} alt="" style={{position: 'absolute', left: '5%', top: '5%', width: '90%', height: '90%', objectFit: 'contain'}} />
          ) : soggetto.tipo === 'icona' && Icona ? (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icona size={lato * 0.72} color="#fff" />
            </div>
          ) : (
            <svg width={lato} height={lato} viewBox="-100 -100 200 200" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <Disegno p={p} t={t} colore={colore} lato={lato} nudo />
            </svg>
          )}
        </div>
      ) : null}
      {/* le scintille in orbita: fanno parte del soggetto, non del fondo */}
      <svg width={lato} height={lato} viewBox="-100 -100 200 200" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {Array.from({length: SCINTILLE}, (_, i) => {
          const a = t * (0.9 + 0.13 * (i % 3)) + (i * Math.PI * 2) / SCINTILLE;
          const rx = 92 + 10 * Math.sin(i * 2.1);
          const ry = 34 + 14 * Math.cos(i * 1.3);
          const px = rx * Math.cos(a);
          const py = ry * Math.sin(a) + 18 * Math.sin(i * 3.7);
          const davanti = Math.sin(a) > 0;
          return <circle key={i} cx={px} cy={py} r={davanti ? 4.6 : 2.6} fill={i % 3 ? colore : '#FFFFFF'} opacity={davanti ? 0.95 : 0.4} style={{filter: `drop-shadow(0 0 6px ${colore})`}} />;
        })}
      </svg>
    </div>
  );
}

/** Il colpo di un soggetto: 1 nell'istante di un cambio di stato, poi giù a 0 in mezzo secondo. */
export function colpoSoggetto(soggetto: Soggetto, dopo: (q: Quando) => number): number {
  let colpo = 0;
  for (const c of soggetto.cambia ?? []) {
    const t = dopo(c.segno);
    if (t > 0 && t < 0.5) colpo = Math.max(colpo, 1 - t / 0.5);
  }
  return colpo;
}

/** Lo stato di un soggetto in questo momento: i numeri di partenza, portati verso ogni cambio con il suo segno. */
export function statoSoggetto(soggetto: Soggetto, dopo: (q: Quando) => number): Record<string, number> {
  const p: Record<string, number> = {...SOGGETTI[soggetto.tipo].stato, ...(soggetto.stato ?? {})};
  for (const c of soggetto.cambia ?? []) {
    const k = rampa(dopo(c.segno), c.durata ?? 0.9);
    if (k <= 0) continue;
    for (const [chiave, valore] of Object.entries(c.stato)) p[chiave] = mix(p[chiave] ?? 0, valore, k);
  }
  return p;
}

/**
 * Da uno a tre soggetti grandi sul palco, ognuno con la sua etichetta a pillola sotto. È la scena di base di un
 * reel illustrato: il soggetto mostra la cosa, lo stato che cambia racconta cosa le succede.
 */
export function bloccoSoggetti({soggetti, titolo, fonte}: {soggetti: Soggetto[]; titolo?: Testo; fonte?: Testo}): ComponentType {
  if (!soggetti.length || soggetti.length > 3) throw new Error(`bloccoSoggetti: i soggetti vanno da 1 a 3 (trovati ${soggetti.length}). Con più cose da mostrare, dividi la scena.`);
  return function Soggetti() {
    const s = useScena();
    const tempo = useTempo();
    const dice = (testo?: Testo): string => (testo === undefined ? '' : typeof testo === 'string' ? testo : testo[tempo.lingua] ?? Object.values(testo)[0] ?? '');
    const dopo = (q: Quando | undefined): number => (q === undefined ? s.t + 0.01 : typeof q === 'string' ? s.dopo(q) : s.t - q);
    const n = soggetti.length;
    const lato = n === 1 ? 800 : n === 2 ? 520 : 360;
    const passo = n === 2 ? 500 : 340;
    // tre soggetti stanno più in alto: così le loro etichette finiscono sopra la colonna delle icone dell'app e non
    // devono stringersi una contro l'altra per evitarla
    const yCentro = CY - (n === 1 ? 50 : n === 2 ? 40 : 170);
    // Etichette e note restano dentro le zone sicure anche quando la camera scorre (fino a 26 pixel per parte); in
    // basso a destra c'è la colonna delle icone dell'app, e lì il limite è più stretto. Se la scritta non ci sta
    // sotto il suo soggetto, si sposta di lato quanto basta: meglio un'etichetta un po' fuori asse che una coperta.
    const dentro = (x: number, larga: number, y: number): number => {
      const destra = (y > stile.zone.icone.y - 50 ? stile.zone.icone.x : stile.zone.destra) - 40;
      const sinistra = stile.zone.sinistra + 40;
      return Math.max(sinistra + larga / 2, Math.min(destra - larga / 2, x));
    };
    const largaEtichetta = (testo: string) => testo.length * (n === 3 ? 28 : 36) * 0.76 + 60;
    const largaNota = (testo: string) => testo.length * (n === 3 ? 26 : 32) * 0.56;
    return (
      <>
        {titolo ? (
          <div data-fmlab-zona="testo" style={{position: 'absolute', left: CX, top: stile.palco.alto + 34, transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 800, fontSize: 34, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.tenue, opacity: rampa(s.t - 0.1, 0.4)}}>
            {dice(titolo)}
          </div>
        ) : null}
        {soggetti.map((sg, i) => {
          const x = CX + (i - (n - 1) / 2) * passo;
          const da = dopo(sg.segno);
          const colore = sg.colore ?? C.luce;
          const etichetta = dice(sg.etichetta);
          const nota = dice(sg.nota);
          return (
            <div key={i}>
              <SoggettoVivo soggetto={sg} x={x} y={yCentro} lato={lato} p={statoSoggetto(sg, dopo)} da={da} indice={i} colpo={colpoSoggetto(sg, dopo)} />
              {etichetta && da > 0 ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: dentro(x, largaEtichetta(etichetta), yCentro + lato / 2 + (n === 1 ? 14 : n === 2 ? 30 : 44)), top: yCentro + lato / 2 + (n === 1 ? 14 : n === 2 ? 30 : 44), transform: `translate(-50%, -50%) scale(${mix(0.7, 1, molla(da - 0.15, {rigidita: 200, smorzamento: 16})).toFixed(3)})`, opacity: rampa(da - 0.15, 0.2), padding: '10px 26px', borderRadius: 999, border: `3px solid ${colore}`, background: alfa('#06090D', 0.82), boxShadow: `0 0 22px ${alfa(colore, 0.55)}`, whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 900, fontSize: n === 3 ? 28 : 36, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff'}}>
                  {etichetta}
                </div>
              ) : null}
              {nota && da > 0 ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: dentro(x, largaNota(nota), yCentro + lato / 2 + (n === 1 ? 72 : n === 2 ? 88 : 100)), top: yCentro + lato / 2 + (n === 1 ? 72 : n === 2 ? 88 : 100), transform: 'translate(-50%, -50%)', opacity: rampa(da - 0.3, 0.3), whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 800, fontSize: n === 3 ? 26 : 32, color: colore}}>
                  {nota}
                </div>
              ) : null}
            </div>
          );
        })}
        {fonte ? (
          <div data-fmlab-zona="testo" style={{position: 'absolute', left: 70, top: stile.palco.basso - 30, fontFamily: stile.font.testo, fontSize: 22, color: alfa('#FFFFFF', 0.5), opacity: rampa(s.t - 0.6, 0.4)}}>
            {dice(fonte)}
          </div>
        ) : null}
      </>
    );
  };
}
