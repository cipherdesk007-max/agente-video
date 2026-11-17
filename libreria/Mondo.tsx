// FMLAB Reel Kit — IL MONDO: quello che sta dietro alle scene. Non è uno sfondo: è un posto a più livelli,
// ognuno a una distanza diversa, e una camera che lo attraversa senza fermarsi mai.
//
//   fondo      nero, con l'alone della tinta della scena
//   nebbia     foschia colorata che scorre piano
//   trama      fili sottili lontani e vicini (si spostano a velocità diverse: è la parallasse)
//   luogo      l'ambiente disegnato della scena (un vaso sanguigno, una membrana, uno stadio…)
//   luce       fasci dall'alto, dischi sfocati, pulviscolo che brilla
//
// La camera viaggia sempre; a ogni cambio di scena fa uno scatto in avanti (si attraversa il luogo vecchio e si
// arriva nel nuovo: nessun taglio, nessuna dissolvenza semplice) e a ogni [segno] del copione dà una piccola
// spinta con un lampo di luce: così ogni novità si sente anche nello spazio attorno.
//
// Tutto dipende solo dal tempo: stesso fotogramma, stesso disegno.
import {useId, useMemo} from 'react';
import type {ReactNode} from 'react';
import {useTempo} from './tempo';
import {alfa} from './colore';
import {casuale, limita, mix} from './anim';
import {stile} from '../stile/stile';

/** I luoghi pronti. 'vuoto' = solo trama e luce. */
export type NomeLuogo = 'vuoto' | 'corpo' | 'vaso' | 'membrana' | 'laboratorio' | 'stadio' | 'palco' | 'bilancia' | 'studio';
export const LUOGHI: NomeLuogo[] = ['vuoto', 'corpo', 'vaso', 'membrana', 'laboratorio', 'stadio', 'palco', 'bilancia', 'studio'];

/** Da che parte la camera entra in una scena o ne esce. 'avanti' = attraversando. */
export type Verso = 'avanti' | 'sinistra' | 'destra' | 'alto' | 'basso';

export type CameraMondo = {
  /** Quanto ha viaggiato la camera, in pixel (i livelli vicini si spostano di più, quelli lontani di meno). */
  x: number;
  y: number;
  /** 0…1,5: la spinta dopo un segno del copione (sale in un decimo di secondo, si spegne in meno di uno). */
  spinta: number;
};

const liscia = (k: number) => k * k * (3 - 2 * k);
const DIREZIONE: Record<Verso, [number, number]> = {avanti: [0.85, -0.52], sinistra: [-1, 0], destra: [1, 0], alto: [0, -1], basso: [0, 1]};

/**
 * Dove sta la camera al secondo `ora`.
 * @param inizi  i secondi in cui comincia ogni scena (con il verso da cui si entra, se dichiarato)
 * @param segni  i secondi dei [segni] del copione
 */
export function cameraMondo(ora: number, inizi: {t: number; verso?: Verso}[], segni: number[], durataPassaggio = 0.5): CameraMondo {
  // il viaggio di fondo: non si ferma mai
  let x = 92 * ora + 40 * Math.sin(ora * 0.31);
  let y = -54 * ora + 30 * Math.sin(ora * 0.23 + 1);
  let spinta = 0;
  // lo scatto tra una scena e l'altra
  for (const s of inizi) {
    if (s.t <= 0 || ora <= s.t - durataPassaggio * 0.3) continue;
    const k = liscia(limita((ora - (s.t - durataPassaggio * 0.3)) / (durataPassaggio * 1.5), 0, 1));
    const [dx, dy] = DIREZIONE[s.verso ?? 'avanti'];
    x += 760 * dx * k;
    y += 760 * dy * k;
  }
  // la spinta a ogni segno
  for (const s of segni) {
    const d = ora - s;
    if (d < 0) continue;
    const e = 1 - (1 - Math.min(1, d / 0.42)) ** 3;
    x += 58 * e;
    y -= 34 * e;
    if (d < 0.95) spinta += d < 0.1 ? d / 0.1 : 1 - (d - 0.1) / 0.85;
  }
  return {x, y, spinta: Math.min(1.5, spinta)};
}

const resto = (v: number, m: number) => ((v % m) + m) % m;
/** Lato della piastrella che si ripete all'infinito sotto la camera. */
const PL = 1400;
const PA = 2300;

// ───────────────────────── i luoghi disegnati ─────────────────────────

type DatiLuogo = {tinta: string; ora: number};

function Vaso({tinta, ora}: DatiLuogo) {
  // le due pareti del vaso e i globuli che scorrono
  const parete = (y: number, verso: number) => {
    const punti = Array.from({length: 13}, (_, i) => `${-120 + i * 110},${y + Math.sin(i * 1.3 + verso) * 26 + Math.sin(ora * 0.5 + i) * 6}`);
    return `M${punti.join(' L')}`;
  };
  return (
    <g>
      {[430, 1290].map((y, k) => (
        <g key={y}>
          <path d={parete(y, k)} fill="none" stroke={tinta} strokeWidth={46} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
          <path d={parete(y + (k ? -30 : 30), k)} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeOpacity={0.22} strokeLinejoin="round" />
        </g>
      ))}
      {Array.from({length: 11}, (_, i) => {
        const x = resto(casuale(i + 7) * 1500 + ora * (70 + casuale(i + 31) * 80), 1500) - 200;
        const y = 560 + casuale(i + 17) * 620 + Math.sin(ora * 0.9 + i) * 18;
        const r = 26 + casuale(i + 5) * 24;
        return (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ora * 30 + i * 47) % 360})`} opacity={0.3 + casuale(i + 3) * 0.25}>
            <ellipse rx={r} ry={r * 0.62} fill="#B8263A" />
            <ellipse rx={r * 0.5} ry={r * 0.26} fill="#7E1526" />
          </g>
        );
      })}
    </g>
  );
}

function Membrana({tinta, ora}: DatiLuogo) {
  // il doppio strato: due file di teste con le code che si guardano, e tre recettori che lo attraversano
  const y0 = 1235;
  const teste: ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = -40 + i * 30;
    const onda = Math.sin(i * 0.5 + ora * 1.1) * 5;
    teste.push(
      <g key={i} transform={`translate(${x} ${(y0 + onda).toFixed(1)})`}>
        <line x1={0} y1={8} x2={0} y2={30} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={3} />
        <line x1={0} y1={38} x2={0} y2={60} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={3} />
        <circle r={10} fill="#E9E2CF" fillOpacity={0.42} />
        <circle cy={68} r={10} fill="#E9E2CF" fillOpacity={0.42} />
      </g>
    );
  }
  return (
    <g>
      {teste}
      {[190, 560, 900].map((x, k) => (
        <g key={x} transform={`translate(${x} ${y0 + 34 + Math.sin(ora * 0.8 + k) * 4})`}>
          <rect x={-26} y={-78} width={52} height={156} rx={22} fill={tinta} fillOpacity={0.3} stroke={tinta} strokeOpacity={0.7} strokeWidth={3} />
          <line x1={0} y1={-60} x2={0} y2={60} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} strokeDasharray="6 10" />
        </g>
      ))}
    </g>
  );
}

function Corpo({tinta, ora}: DatiLuogo) {
  // il busto con gli organi: cuore che batte, polmoni, fegato, stomaco, intestino
  const battito = 1 + 0.06 * Math.max(0, Math.sin(ora * 6.2)) ** 6;
  return (
    <g transform="translate(540 900)" fill="none" stroke={tinta} strokeLinecap="round" strokeLinejoin="round">
      <path d="M-90,-430 C-90,-520 90,-520 90,-430 C90,-380 60,-350 50,-330 C150,-310 250,-280 270,-180 L300,180 C300,220 250,220 245,180 L215,-90 L205,330 C205,420 -205,420 -205,330 L-215,-90 L-245,180 C-250,220 -300,220 -300,180 L-270,-180 C-250,-280 -150,-310 -50,-330 C-60,-350 -90,-380 -90,-430 Z" strokeOpacity={0.3} strokeWidth={5} />
      <path d="M-30,-250 C-130,-270 -160,-120 -140,-20 C-110,10 -50,-10 -30,-60 Z" strokeOpacity={0.3} strokeWidth={4} fill={tinta} fillOpacity={0.06} />
      <path d="M30,-250 C130,-270 160,-120 140,-20 C110,10 50,-10 30,-60 Z" strokeOpacity={0.3} strokeWidth={4} fill={tinta} fillOpacity={0.06} />
      <g transform={`translate(18 -110) scale(${battito.toFixed(3)})`}>
        <path d="M0,34 C-58,-6 -34,-52 0,-24 C34,-52 58,-6 0,34 Z" fill="#E8455A" fillOpacity={0.4} stroke="#E8455A" strokeOpacity={0.8} strokeWidth={4} />
      </g>
      <path d="M-150,40 C-60,10 60,20 120,60 C90,120 -90,130 -150,90 Z" strokeOpacity={0.28} strokeWidth={4} fill={tinta} fillOpacity={0.05} />
      <path d="M40,90 C130,70 150,170 70,190 C20,200 10,150 40,90 Z" strokeOpacity={0.28} strokeWidth={4} />
      <path d="M-130,210 C-130,170 130,170 130,210 C130,250 -110,240 -110,270 C-110,300 110,290 110,320 C110,350 -90,340 -90,360" strokeOpacity={0.26} strokeWidth={14} />
    </g>
  );
}

function Laboratorio({tinta, ora}: DatiLuogo) {
  // il banco con la vetreria: beuta che bolle, provette, becher; in alto una mensola
  const bolla = (i: number) => resto(ora * (40 + i * 13) + i * 60, 150);
  return (
    <g fill="none" stroke="#FFFFFF" strokeOpacity={0.26} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <line x1={-60} y1={1300} x2={1140} y2={1300} strokeWidth={6} />
      <line x1={40} y1={470} x2={420} y2={470} />
      {[90, 170, 250, 330].map((x, i) => (
        <rect key={x} x={x} y={470 - 70 - i * 6} width={44} height={70 + i * 6} rx={6} fill={tinta} fillOpacity={0.08} />
      ))}
      <g transform="translate(150 1300)">
        <path d="M-30,-250 L-30,-150 L-100,0 L100,0 L30,-150 L30,-250 Z" fill={tinta} fillOpacity={0.07} />
        <path d="M-78,-48 L78,-48 L100,0 L-100,0 Z" fill={tinta} fillOpacity={0.35} stroke="none" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={-40 + i * 26} cy={-50 - bolla(i)} r={6 + i} stroke={tinta} strokeOpacity={0.6 * (1 - bolla(i) / 150)} strokeWidth={3} />
        ))}
      </g>
      <g transform="translate(880 1300)">
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${-90 + i * 56} 0)`}>
            <path d="M-16,-220 L-16,-20 A16,16 0 0 0 16,-20 L16,-220" />
            <rect x={-13} y={-110 + i * 16} width={26} height={96 - i * 16} rx={10} fill={[tinta, '#5AA8FF', '#FFD23F', '#FF4D5E'][i]} fillOpacity={0.3} stroke="none" />
          </g>
        ))}
        <line x1={-130} y1={-150} x2={110} y2={-150} />
      </g>
    </g>
  );
}

function Stadio({tinta, ora}: DatiLuogo) {
  // le gradinate a ferro di cavallo con il pubblico, e due torri faro che spazzano
  const file: ReactNode[] = [];
  for (let f = 0; f < 6; f++) {
    const y = 470 + f * 46;
    const rx = 700 - f * 26;
    file.push(<path key={`a${f}`} d={`M${540 - rx},${y + 150} A${rx},${210 - f * 12} 0 0 1 ${540 + rx},${y + 150}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.1 + f * 0.02} strokeWidth={3} />);
    for (let i = 0; i < 26; i++) {
      const ang = Math.PI * (0.06 + (0.88 * i) / 25);
      const acceso = Math.sin(ora * 2.2 + i * 1.7 + f * 2.3) > 0.4;
      file.push(<circle key={`p${f}-${i}`} cx={540 - Math.cos(ang) * rx} cy={y + 150 - Math.sin(ang) * (210 - f * 12)} r={5} fill={acceso ? '#FFFFFF' : tinta} fillOpacity={acceso ? 0.5 : 0.22} />);
    }
  }
  return (
    <g>
      {file}
      {[90, 990].map((x, k) => {
        const giro = Math.sin(ora * 0.5 + k * 2) * 14;
        return (
          <g key={x} transform={`translate(${x} 440)`}>
            <rect x={-34} y={-30} width={68} height={40} rx={6} fill="#FFFFFF" fillOpacity={0.35} />
            <polygon points={`-30,10 30,10 ${(k ? -330 : 330) + giro * 9},900 ${(k ? -90 : 90) + giro * 9},900`} fill="#FFFFFF" fillOpacity={0.05} />
          </g>
        );
      })}
      <ellipse cx={540} cy={1330} rx={470} ry={70} fill="none" stroke={tinta} strokeOpacity={0.3} strokeWidth={4} />
    </g>
  );
}

function PalcoScenico({tinta, ora}: DatiLuogo) {
  // il sipario ai lati, tre riflettori dall'alto, la pedana
  const piega = (x: number, verso: number) => `M${x},380 C${x + verso * 30},700 ${x - verso * 20},1000 ${x + verso * 14},1340`;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={piega(20 + i * 44, 1)} fill="none" stroke="#B8263A" strokeOpacity={0.4 - i * 0.07} strokeWidth={30} strokeLinecap="round" />
          <path d={piega(1060 - i * 44, -1)} fill="none" stroke="#B8263A" strokeOpacity={0.4 - i * 0.07} strokeWidth={30} strokeLinecap="round" />
        </g>
      ))}
      {[250, 540, 830].map((x, k) => {
        const giro = Math.sin(ora * 0.7 + k * 2.1) * 90;
        return <polygon key={x} points={`${x - 22},390 ${x + 22},390 ${x + giro + 190},1310 ${x + giro - 190},1310`} fill={k === 1 ? '#FFFFFF' : tinta} fillOpacity={0.06} />;
      })}
      <ellipse cx={540} cy={1320} rx={430} ry={56} fill={tinta} fillOpacity={0.1} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={4} />
    </g>
  );
}

function Bilancia({tinta, ora}: DatiLuogo) {
  // la bilancia a due piatti: il giogo oscilla piano attorno al fulcro
  const pende = Math.sin(ora * 0.8) * 5;
  const piatto = (x: number) => (
    <g transform={`translate(${x} 0) rotate(${-pende})`}>
      <line x1={0} y1={0} x2={-80} y2={250} />
      <line x1={0} y1={0} x2={80} y2={250} />
      <path d="M-110,250 L110,250 A110,46 0 0 1 -110,250 Z" fill={tinta} fillOpacity={0.12} />
    </g>
  );
  return (
    <g transform="translate(540 560)" fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
      <line x1={0} y1={0} x2={0} y2={720} />
      <path d="M-150,740 L150,740 M-90,720 L90,720" />
      <circle r={18} fill={tinta} fillOpacity={0.4} />
      <g transform={`rotate(${pende})`}>
        <line x1={-400} y1={0} x2={400} y2={0} strokeWidth={8} />
        {piatto(-400)}
        {piatto(400)}
      </g>
    </g>
  );
}

function Studio({tinta, ora}: DatiLuogo) {
  // fogli di uno studio scientifico: righe di testo, un grafico, un timbro; galleggiano appena
  const foglio = (x: number, y: number, giro: number, k: number) => (
    <g key={k} transform={`translate(${x} ${(y + Math.sin(ora * 0.6 + k * 1.9) * 14).toFixed(1)}) rotate(${giro + Math.sin(ora * 0.4 + k) * 1.5})`}>
      <rect x={-150} y={-200} width={300} height={400} rx={10} fill="#FFFFFF" fillOpacity={0.06} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} />
      <rect x={-120} y={-170} width={170} height={16} rx={8} fill={tinta} fillOpacity={0.5} />
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} x={-120} y={-130 + i * 26} width={i % 3 === 2 ? 150 : 240} height={8} rx={4} fill="#FFFFFF" fillOpacity={0.2} />
      ))}
      <polyline points="-120,150 -70,110 -20,128 30,70 80,84 120,40" fill="none" stroke={tinta} strokeOpacity={0.7} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {foglio(170, 640, -9, 0)}
      {foglio(930, 720, 7, 1)}
      {foglio(250, 1160, 6, 2)}
      <g transform="translate(880 1180) rotate(-14)" opacity={0.5}>
        <circle r={74} fill="none" stroke={tinta} strokeWidth={6} />
        <circle r={58} fill="none" stroke={tinta} strokeWidth={2} />
        <path d="M-30,2 L-8,24 L34,-22" fill="none" stroke={tinta} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

const DISEGNI: Record<NomeLuogo, ((d: DatiLuogo) => ReactNode) | null> = {
  vuoto: null,
  corpo: Corpo,
  vaso: Vaso,
  membrana: Membrana,
  laboratorio: Laboratorio,
  stadio: Stadio,
  palco: PalcoScenico,
  bilancia: Bilancia,
  studio: Studio,
};

// ───────────────────────── il mondo ─────────────────────────

export type PropsMondo = {
  tinta?: string;
  /** 0…1: quanto è densa la foschia. */
  densita?: number;
  /** 0…1: fasci di luce dall'alto. */
  raggi?: number;
  camera: CameraMondo;
  /** Il luogo della scena di adesso, quanto ci siamo dentro (0…1 lungo la scena) e da che parte ci si è entrati. */
  luogo?: NomeLuogo;
  avanzamento?: number;
  /** Durante un passaggio: il luogo che si sta lasciando e a che punto è il passaggio (0…1). */
  luogoPrima?: NomeLuogo;
  passaggio?: number;
  verso?: Verso;
  /** La trama di fumo già pronta (la disegna Atmosfera): se manca la foschia non c'è. */
  fumo?: string;
};

export function Mondo({tinta, densita = 1, raggi = 0, camera, luogo = 'vuoto', avanzamento = 0, luogoPrima, passaggio = 1, verso = 'avanti', fumo}: PropsMondo) {
  const {ora, larghezza: L, altezza: A} = useTempo();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const colore = tinta ?? stile.colori.foschia;

  // i fili della trama: curve lunghe e sottili, sempre le stesse
  const fili = useMemo(() => {
    const curva = (i: number, seme: number) => {
      const x0 = casuale(i * 7 + seme) * PL;
      const y0 = casuale(i * 7 + seme + 1) * PA;
      const ang = casuale(i * 7 + seme + 2) * Math.PI * 2;
      const lungo = 520 + casuale(i * 7 + seme + 3) * 760;
      const x3 = x0 + Math.cos(ang) * lungo;
      const y3 = y0 + Math.sin(ang) * lungo;
      const piega = (casuale(i * 7 + seme + 4) - 0.5) * 520;
      const nx = -Math.sin(ang) * piega;
      const ny = Math.cos(ang) * piega;
      return {d: `M${x0.toFixed(0)},${y0.toFixed(0)} C${(x0 + (x3 - x0) * 0.33 + nx).toFixed(0)},${(y0 + (y3 - y0) * 0.33 + ny).toFixed(0)} ${(x0 + (x3 - x0) * 0.66 - nx * 0.6).toFixed(0)},${(y0 + (y3 - y0) * 0.66 - ny * 0.6).toFixed(0)} ${x3.toFixed(0)},${y3.toFixed(0)}`, x: x3, y: y3, forza: 0.5 + casuale(i * 7 + seme + 5) * 0.5};
    };
    return {lontani: Array.from({length: 26}, (_, i) => curva(i, 11)), vicini: Array.from({length: 20}, (_, i) => curva(i, 977))};
  }, []);
  const dischi = useMemo(() => Array.from({length: 22}, (_, i) => ({x: casuale(i + 61) * PL, y: casuale(i + 161) * PA, r: 14 + casuale(i + 261) ** 2 * 70, forza: 0.1 + casuale(i + 361) * 0.22, fase: casuale(i + 461) * 6.28})), []);
  const granelli = useMemo(() => Array.from({length: 70}, (_, i) => ({x: casuale(i + 71) * PL, y: casuale(i + 171) * PA, r: 2 + casuale(i + 271) ** 2 * 5, fase: casuale(i + 371) * 6.28})), []);

  // un livello che si ripete: quattro copie della piastrella coprono sempre lo schermo
  const livello = (nome: string, distanza: number, contenuto: ReactNode, opacita = 1) => {
    const dx = -resto(camera.x * distanza, PL);
    const dy = -resto(camera.y * distanza, PA);
    return (
      <g opacity={opacita}>
        <defs>
          <g id={`${nome}-${id}`}>{contenuto}</g>
        </defs>
        {[0, 1].map((ix) => [0, 1].map((iy) => <use key={`${ix}${iy}`} href={`#${nome}-${id}`} x={(dx + ix * PL).toFixed(1)} y={(dy + iy * PA).toFixed(1)} />))}
      </g>
    );
  };

  // il luogo: ci si entra avvicinandosi, ci si resta avanzando piano, se ne esce attraversandolo
  const [vx, vy] = DIREZIONE[verso];
  const disegnaLuogo = (nome: NomeLuogo, scala: number, opacita: number, sposta: number) => {
    const Disegno = DISEGNI[nome];
    if (!Disegno || opacita <= 0.003) return null;
    // carrellata: durante la scena la camera scorre lungo il luogo, da un capo all'altro
    const ox = (0.5 - avanzamento) * L * 0.42 + Math.sin(ora * 0.21) * 20 - camera.spinta * 14 + (verso === 'avanti' ? 0 : -vx * sposta * L);
    const oy = Math.sin(ora * 0.17 + 2) * 22 + (verso === 'avanti' ? 0 : -vy * sposta * A * 0.6);
    return (
      <g opacity={opacita} transform={`translate(${(L / 2 + ox).toFixed(1)} ${(stile.palco.centroY + oy).toFixed(1)}) scale(${scala.toFixed(4)}) translate(${-L / 2} ${-stile.palco.centroY})`}>
        <Disegno tinta={colore} ora={ora} />
      </g>
    );
  };
  const dentro = verso === 'avanti';
  const p = limita(passaggio, 0, 1);

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: stile.colori.fondo}}>
      {/* alone centrale: dà profondità al palco; si accende a ogni spinta */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 42% at 50% 46%, ${alfa(colore, (0.2 + 0.16 * camera.spinta) * densita)} 0%, ${alfa(colore, (0.07 + 0.05 * camera.spinta) * densita)} 55%, ${alfa(colore, 0)} 100%)`,
        }}
      />
      {/* nebbia: due veli che scorrono in versi opposti (la trama non si ripete: si sposta avanti e indietro) */}
      {fumo
        ? [
            {dx: Math.sin(ora * 0.16) * 150 - camera.spinta * 26, dy: Math.cos(ora * 0.13) * 110, z: 1.1, o: 0.22, s: false},
            {dx: Math.cos(ora * 0.12) * 190 + camera.spinta * 34, dy: Math.sin(ora * 0.15) * 130, z: 1.4, o: 0.14, s: true},
          ].map((n, k) => (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: -L * 0.3,
                top: -A * 0.2,
                width: L * 1.6,
                height: A * 1.4,
                background: colore,
                WebkitMaskImage: `url(${fumo})`,
                maskImage: `url(${fumo})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                opacity: n.o * densita,
                transform: `translate(${n.dx.toFixed(1)}px, ${n.dy.toFixed(1)}px) scale(${n.s ? -n.z : n.z}, ${n.z})`,
              }}
            />
          ))
        : null}

      <svg width={L} height={A} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`disco-${id}`}>
            <stop offset="0" stopColor={colore} stopOpacity="0.55" />
            <stop offset="0.6" stopColor={colore} stopOpacity="0.28" />
            <stop offset="1" stopColor={colore} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`granello-${id}`}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="0.4" stopColor={colore} stopOpacity="0.5" />
            <stop offset="1" stopColor={colore} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`raggio-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2 * raggi} />
            <stop offset="0.55" stopColor={colore} stopOpacity={0.07 * raggi} />
            <stop offset="1" stopColor={colore} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* trama lontana: fili sottili, si spostano poco */}
        {livello(
          'lontani',
          0.3,
          fili.lontani.map((f, i) => <path key={i} d={f.d} fill="none" stroke={colore} strokeOpacity={0.34 * f.forza} strokeWidth={2} />)
        )}
        {/* dischi sfocati, a mezza distanza */}
        {livello(
          'dischi',
          0.5,
          dischi.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={`url(#disco-${id})`} opacity={d.forza * (0.7 + 0.3 * Math.sin(ora * 0.7 + d.fase))} />)
        )}

        {/* il luogo: quello che si lascia viene attraversato, quello nuovo arriva da lontano */}
        {luogoPrima && p < 1 ? disegnaLuogo(luogoPrima, 1.32 * (dentro ? mix(1.1, 2.7, liscia(p)) : 1.1), 1 - liscia(limita(p / 0.8, 0, 1)), liscia(p)) : null}
        {disegnaLuogo(luogo, 1.32 * (dentro && p < 1 ? mix(0.5, 1, liscia(p)) : 1) * (1 + 0.1 * avanzamento) * (1 + 0.014 * camera.spinta), liscia(limita((p - 0.15) / 0.85, 0, 1)), liscia(p) - 1)}

        {/* fasci di luce dall'alto */}
        {raggi > 0
          ? [0.2, 0.52, 0.83].map((px, k) => {
              const oscilla = Math.sin(ora * 0.55 + k * 2.1) * 60;
              const xAlto = L * px + oscilla * 0.3;
              const xBasso = L * (0.5 + (px - 0.5) * 0.55) + oscilla;
              return [70, 150, 250].map((apertura, j) => (
                <polygon key={`${k}-${j}`} points={`${xAlto - 20},-20 ${xAlto + 20},-20 ${xBasso + apertura},${A * 0.86} ${xBasso - apertura},${A * 0.86}`} fill={`url(#raggio-${id})`} opacity={0.55} />
              ));
            })
          : null}

        {/* trama vicina: fili più chiari con un nodo luminoso in fondo, si spostano molto */}
        {livello(
          'vicini',
          0.85,
          fili.vicini.map((f, i) => (
            <g key={i}>
              <path d={f.d} fill="none" stroke="#FFFFFF" strokeOpacity={0.3 * f.forza} strokeWidth={2.4} />
              <circle cx={f.x} cy={f.y} r={5} fill="#FFFFFF" fillOpacity={0.5 * f.forza} />
            </g>
          ))
        )}
        {/* pulviscolo in primo piano: è il livello più veloce */}
        {livello(
          'granelli',
          1.15,
          granelli.map((g, i) => <circle key={i} cx={g.x} cy={g.y} r={g.r * 2.2} fill={`url(#granello-${id})`} opacity={0.35 + 0.4 * (0.5 + 0.5 * Math.sin(ora * 1.3 + g.fase))} />)
        )}
      </svg>

      {/* scurisce i bordi: tiene leggibili sottotitoli e narratore */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 85% 62% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
