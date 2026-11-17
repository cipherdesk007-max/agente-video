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
  return (
    <>
      <defs>
        <linearGradient id="osso" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="#E9E2D2" stopOpacity="0.34" />
          <stop offset="1" stopColor="#B9B09C" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="male">
          <stop offset="0" stopColor={giunto} stopOpacity={0.85} />
          <stop offset="1" stopColor={giunto} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* visto di fronte e largo: le due teste dell'osso riempiono la scatola, come nei riferimenti */}
      <g transform="scale(1.42 1.06)">
      {nudo ? null : <circle cx="0" cy="-2" r={46 + 22 * dolore + 10 * batte * dolore} fill="url(#male)" opacity={0.35 + 0.55 * dolore} />}
      {nudo
        ? null
        : [0, 1, 2].map((k) => {
            const giro = (t * (0.5 + 0.6 * dolore) + k / 3) % 1;
            return <circle key={k} cx="0" cy="-2" r={30 + 62 * giro} fill="none" stroke={giunto} strokeWidth={2.4} opacity={(1 - giro) * (0.25 + 0.6 * dolore)} />;
          })}
      <g style={luceDi(colore, 1.4)} stroke={colore} strokeWidth="2.8" strokeLinejoin="round" fill="url(#osso)">
        <path d="M-19 -100 L19 -100 L23 -47 C50 -47 55 -9 31 -7 C19 -6 9 -13 0 -13 C-9 -13 -19 -6 -31 -7 C-55 -9 -50 -47 -23 -47 Z" />
        <path d="M-45 8 C-44 3 44 3 45 8 C47 27 27 35 21 46 L17 100 L-17 100 L-21 46 C-27 35 -47 27 -45 8 Z" />
        <path d="M33 42 C41 42 41 52 37 58 L35 100 L27 100 L29 58 C27 50 27 42 33 42 Z" opacity="0.8" />
        <ellipse cx="0" cy="-22" rx="15" ry="17" fill="#FFFFFF" fillOpacity="0.28" />
      </g>
      <path d={`M-44 ${1 + 2 * batte * dolore} C-20 -8 20 -8 44 ${1 - 2 * batte * dolore}`} fill="none" stroke={giunto} strokeWidth={5 + 3 * batte} strokeLinecap="round" style={luceDi(giunto, 1.3)} />
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
  return (
    <>
      <rect x="-15" y="-96" width="30" height="13" rx="4" fill={alfa(tinta, 0.5)} stroke={tinta} strokeWidth="2" />
      <rect x="-42" y="-84" width="84" height="172" rx="13" fill="#0A1016" fillOpacity="0.55" stroke={tinta} strokeWidth="2.6" style={luceDi(tinta, 0.5 + 0.5 * accesa)} />
      {Array.from({length: TACCHE}, (_, i) => {
        const piena = limita(livello * TACCHE - i);
        const y = 78 - (i + 1) * (alta + 5) + 5;
        if (piena <= 0) return <rect key={i} x="-33" y={y} width="66" height={alta} rx="6" fill="none" stroke={alfa(tinta, 0.25)} strokeWidth="1.5" />;
        const h = alta * piena;
        return <rect key={i} x="-33" y={y + alta - h} width="66" height={h} rx="6" fill={miscela(tinta, '#FFFFFF', 0.25)} opacity={0.88 + 0.12 * Math.sin(t * 3.1 + i)} style={luceDi(tinta, accesa)} />;
      })}
      <clipPath id={`corpo-${Math.round(livello * 100)}`}>
        <rect x="-42" y="-84" width="84" height="172" rx="13" />
      </clipPath>
      <rect x="-42" y={passa} width="84" height="16" fill="#FFFFFF" opacity={0.2 * accesa} clipPath={`url(#corpo-${Math.round(livello * 100)})`} />
    </>
  );
}

function Stomaco({p, t, colore, nudo}: Disegno) {
  const irritato = limita(p.irritato ?? 0);
  const tinta = miscela(colore, C.negativo, irritato);
  const onda = (k: number) => 3 * Math.sin(t * (2 + 3 * irritato) + k);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M-34 -96 L-34 -60 C-70 -50 -86 -10 -76 30 C-64 76 -10 92 34 74 C58 64 70 44 72 26 L96 26 L96 6 L60 6 C52 6 50 16 48 26 C44 44 20 54 0 46 C-24 36 -22 2 -4 -22 C8 -38 6 -50 -8 -58 L-8 -96 Z"
        stroke={tinta}
        strokeWidth="5.5"
        fill={alfa(tinta, 0.16 + 0.12 * irritato)}
        style={luceDi(tinta, 1.3)}
      />
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={`M${-62 + k * 5} ${-22 + k * 22 + onda(k)} C${-48 + k * 8} ${-8 + k * 22 - onda(k)} ${-36 + k * 12} ${2 + k * 20 + onda(k + 1)} ${-22 + k * 16} ${10 + k * 17 - onda(k)}`} stroke={tinta} strokeWidth="3.4" opacity={0.55 + 0.4 * irritato} />
      ))}
      {(nudo ? [] : [0, 1, 2]).map((k) => {
        const giro = (t * (0.4 + 0.7 * irritato) + k / 3) % 1;
        return <circle key={k} cx="-20" cy="34" r={20 + 70 * giro} stroke={tinta} strokeWidth="2.2" opacity={(1 - giro) * irritato * 0.7} />;
      })}
    </g>
  );
}

function Riflettori({p, t, colore, nudo}: Disegno) {
  const luci = nudo ? 0 : limita(p.luci ?? 1);
  return (
    <>
      <path d="M-98 -78 L98 -78" stroke="#C9D4E0" strokeWidth="3" />
      {[-66, -22, 22, 66].map((x, i) => {
        const gira = 16 * Math.sin(t * 0.9 + i * 1.7);
        return (
          <g key={i}>
            <path d={`M${x} -76 L${x + gira - 30} 60 L${x + gira + 30} 60 Z`} fill={i % 2 ? '#FFFFFF' : colore} opacity={(0.16 + 0.1 * Math.sin(t * 2 + i)) * luci} />
            <circle cx={x} cy="-78" r="6" fill="#fff" style={luceDi(colore)} />
          </g>
        );
      })}
      <path d="M-98 62 L98 62 L98 74 L-98 74 Z" fill="#0A1016" stroke={alfa(colore, 0.7)} strokeWidth="2" />
      <g stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M0 60 L0 -4" />
        <circle cx="0" cy="-12" r="8" fill="#fff" fillOpacity="0.9" />
        <path d="M-10 60 L10 60" />
      </g>
      <g transform="translate(-50 30) rotate(-18)" fill={alfa(colore, 0.85)} stroke="#fff" strokeWidth="1.6">
        <ellipse cx="0" cy="14" rx="13" ry="16" />
        <rect x="-2.5" y="-34" width="5" height="36" />
      </g>
      {Array.from({length: 9}, (_, i) => (
        <circle key={i} cx={-88 + i * 22} cy={92 + 3 * Math.sin(t * 5 + i * 1.3) * luci} r="12" fill="#0A1016" stroke={alfa('#FFFFFF', 0.35)} strokeWidth="1.5" />
      ))}
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
export function SoggettoVivo({soggetto, x, y, lato, p, da, indice = 0}: {soggetto: Soggetto; x: number; y: number; lato: number; p: Record<string, number>; da: number; indice?: number}) {
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
    <div style={{position: 'absolute', left: x - lato / 2, top: y - lato / 2, width: lato, height: lato, opacity: rampa(da, 0.25), transform: `translate(${deriva.toFixed(2)}px, ${((1 - entra) * 90 + galleggia).toFixed(2)}px) rotate(${dondola.toFixed(3)}deg) scale(${(mix(0.7, 1, entra) * respira).toFixed(4)})`}}>
      {/* il bagliore dietro, che respira */}
      <div style={{position: 'absolute', inset: -lato * 0.18, borderRadius: '50%', background: `radial-gradient(circle, ${alfa(colore, 0.3 + 0.22 * battito)} 0%, ${alfa(colore, 0.1 + 0.08 * battito)} 38%, transparent 68%)`}} />
      {soggetto.tipo === 'immagine' && soggetto.file ? (
        <img src={tempo.risorsa(soggetto.file)} alt="" style={{position: 'absolute', left: '5%', top: '5%', width: '90%', height: '90%', objectFit: 'contain', filter: `drop-shadow(0 0 ${Math.round(16 + 14 * battito)}px ${alfa(colore, 0.8)})`, opacity: 0.55 + 0.45 * limita(p.acceso ?? 1)}} />
      ) : soggetto.tipo === 'icona' && Icona ? (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 ${Math.round(18 + 16 * battito)}px ${alfa(colore, 0.85)})`, opacity: 0.55 + 0.45 * limita(p.acceso ?? 1)}}>
          <Icona size={lato * 0.62} color={colore} />
        </div>
      ) : (
        <svg width={lato} height={lato} viewBox="-100 -100 200 200" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Disegno p={p} t={t} colore={colore} lato={lato} />
        </svg>
      )}
      {passa < 115 ? (
        <div style={{position: 'absolute', inset: 0, opacity: 0.6, mixBlendMode: 'plus-lighter', filter: 'brightness(0) invert(1)', WebkitMaskImage: `linear-gradient(108deg, transparent ${(passa - 13).toFixed(1)}%, #000 ${passa.toFixed(1)}%, transparent ${(passa + 13).toFixed(1)}%)`, maskImage: `linear-gradient(108deg, transparent ${(passa - 13).toFixed(1)}%, #000 ${passa.toFixed(1)}%, transparent ${(passa + 13).toFixed(1)}%)`}}>
          {soggetto.tipo === 'immagine' && soggetto.file ? (
            <img src={tempo.risorsa(soggetto.file)} alt="" style={{position: 'absolute', left: '5%', top: '5%', width: '90%', height: '90%', objectFit: 'contain'}} />
          ) : soggetto.tipo === 'icona' && Icona ? (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icona size={lato * 0.62} color="#fff" />
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
    const yCentro = CY - (n === 1 ? 50 : 40);
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
              <SoggettoVivo soggetto={sg} x={x} y={yCentro} lato={lato} p={statoSoggetto(sg, dopo)} da={da} indice={i} />
              {etichetta && da > 0 ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: x, top: yCentro + lato / 2 + (n === 1 ? 14 : n === 2 ? 30 : 44), transform: `translate(-50%, -50%) scale(${mix(0.7, 1, molla(da - 0.15, {rigidita: 200, smorzamento: 16})).toFixed(3)})`, opacity: rampa(da - 0.15, 0.2), padding: '10px 26px', borderRadius: 999, border: `3px solid ${colore}`, background: alfa('#06090D', 0.82), boxShadow: `0 0 22px ${alfa(colore, 0.55)}`, whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 900, fontSize: n === 3 ? 28 : 36, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff'}}>
                  {etichetta}
                </div>
              ) : null}
              {nota && da > 0 ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: x, top: yCentro + lato / 2 + (n === 1 ? 72 : n === 2 ? 88 : 100), transform: 'translate(-50%, -50%)', opacity: rampa(da - 0.3, 0.3), whiteSpace: 'nowrap', fontFamily: stile.font.titoli, fontWeight: 800, fontSize: n === 3 ? 26 : 32, color: colore}}>
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
