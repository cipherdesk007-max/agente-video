// FMLAB Reel Kit — il Dottore: il narratore disegnato dal kit (mezzo busto, vettoriale).
// È fatto di parti che si muovono da sole: testa, occhi, sopracciglia, bocca, avambracci e mani.
// Le pose sono le stesse dei personaggi a immagini: base, dito, spalle, pensa, indica, saluta, telefono.
import {useId} from 'react';
import type {FormaBocca} from './bocca';
import {mix, onda} from './anim';
import {stile} from '../stile/stile';

export type Posa = 'base' | 'dito' | 'spalle' | 'pensa' | 'indica' | 'saluta' | 'telefono';
export const POSE: Posa[] = ['base', 'dito', 'spalle', 'pensa', 'indica', 'saluta', 'telefono'];

/** Il disegno vive in un riquadro 560 x 760. */
export const PROPORZIONE_DOTTORE = 560 / 760;

type TipoMano = 'aperta' | 'punta' | 'telefono';
type Mano = {gomito: [number, number]; polso: [number, number]; tipo: TipoMano; ruota: number};
type Assetto = {destra?: Mano; sinistra?: Mano; sopracciglia?: number; guarda?: [number, number]; testa?: number};

const ASSETTI: Record<Posa, Assetto> = {
  base: {},
  dito: {destra: {gomito: [470, 830], polso: [456, 446], tipo: 'punta', ruota: 5}, sopracciglia: 0.45},
  spalle: {
    destra: {gomito: [424, 800], polso: [496, 468], tipo: 'aperta', ruota: 60},
    sinistra: {gomito: [136, 800], polso: [64, 468], tipo: 'aperta', ruota: -60},
    sopracciglia: 0.95,
  },
  pensa: {destra: {gomito: [446, 830], polso: [352, 392], tipo: 'punta', ruota: -22}, guarda: [-0.55, -0.6], testa: -3.5},
  indica: {destra: {gomito: [530, 690], polso: [270, 500], tipo: 'punta', ruota: -84}, guarda: [-0.75, -0.1], testa: -2},
  saluta: {destra: {gomito: [462, 830], polso: [482, 460], tipo: 'aperta', ruota: 8}, sopracciglia: 0.4},
  telefono: {destra: {gomito: [458, 830], polso: [452, 516], tipo: 'telefono', ruota: -7}, guarda: [0.35, 0.3]},
};

export type PropsDottore = {
  /** Larghezza in pixel. */
  larghezza: number;
  ora: number;
  bocca: FormaBocca;
  /** 0 = occhi aperti, 1 = chiusi. */
  chiusuraOcchi: number;
  /** 0…1: quanto sta parlando (muove la testa). */
  energia: number;
  /** 0…1: sopracciglia alzate (oltre a quelle della posa). */
  sopracciglia: number;
  /** 0…1: sorriso. */
  sorriso: number;
  /** Posa da cui arriva, posa verso cui va, e a che punto è il passaggio (0…1). */
  posaDa: Posa;
  posaA: Posa;
  passaggio: number;
  /** true quando la figura viene specchiata: la scritta sul taschino si disegna ribaltata, così resta leggibile. */
  specchiato?: boolean;
};

function Bocca({forma, sorriso, id}: {forma: FormaBocca; sorriso: number; id: string}) {
  const a = Math.max(0, Math.min(1, forma.apertura));
  const mezza = mix(15, 33, forma.larghezza) * mix(1, 0.92, a);
  const h = a * 31;
  const curva = mix(5, 11, sorriso) * (1 - a * 0.55);
  // labbro di sopra e di sotto: da chiuse coincidono (una linea che sorride), da aperte si separano
  const ySopra = mix(2 * curva, curva * 0.5 - h * 0.22, a);
  const ySotto = mix(2 * curva + 0.6, curva * 0.5 + h * 2.05, a);
  const sagoma = `M ${-mezza} 0 Q 0 ${ySopra} ${mezza} 0 Q 0 ${ySotto} ${-mezza} 0 Z`;
  const linea = `M ${-mezza} 0 Q 0 ${2 * curva} ${mezza} 0`;
  const c = stile.colori.contorno;
  if (a < 0.07) return <path d={linea} fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />;
  return (
    <g>
      <clipPath id={`bocca-${id}`}>
        <path d={sagoma} />
      </clipPath>
      <path d={sagoma} fill="#6B1B2A" />
      <g clipPath={`url(#bocca-${id})`}>
        <rect x={-mezza} y={ySopra / 2 - 6} width={mezza * 2} height={7 + h * 0.2} fill="#FFFFFF" />
        <ellipse cx={0} cy={ySotto / 2 + 3} rx={mezza * 0.62} ry={h * 0.42} fill="#EE6F82" />
      </g>
      <path d={sagoma} fill="none" stroke={c} strokeWidth={5.5} strokeLinejoin="round" />
    </g>
  );
}

function Occhio({cx, cy, chiusura, guarda, grande}: {cx: number; cy: number; chiusura: number; guarda: [number, number]; grande: number}) {
  const c = stile.colori.contorno;
  if (chiusura > 0.72) {
    return <path d={`M ${cx - 13} ${cy + 2} Q ${cx} ${cy + 10} ${cx + 13} ${cy + 2}`} fill="none" stroke={c} strokeWidth={5.5} strokeLinecap="round" />;
  }
  const px = cx + guarda[0] * 9;
  const py = cy + 2 + guarda[1] * 7;
  return (
    <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(1 ${(1 - chiusura * 0.85).toFixed(3)})`}>
      <circle r={10.5 * grande} fill={c} />
      <circle cx={-3.4} cy={-4} r={3.6} fill="#FFFFFF" />
    </g>
  );
}

/** Mano disegnata con il polso nell'origine e le dita verso l'alto. */
function FormaMano({tipo}: {tipo: TipoMano}) {
  const p = stile.personaggio.colori;
  const c = stile.colori.contorno;
  const dito = {fill: p.pelle, stroke: c, strokeWidth: 5.5};
  if (tipo === 'aperta') {
    const dita: [number, number, number][] = [
      [-23, -124, -9],
      [-8, -134, -3],
      [8, -131, 3],
      [23, -119, 9],
    ];
    return (
      <g>
        {dita.map(([x, alto, giro], k) => (
          <rect key={k} x={x - 8} y={alto} width={16} height={-alto - 50} rx={8} transform={`rotate(${giro} ${x} -60)`} {...dito} />
        ))}
        <rect x={-52} y={-78} width={17} height={48} rx={8.5} transform="rotate(-40 -40 -40)" {...dito} />
        <rect x={-33} y={-74} width={66} height={76} rx={24} fill={p.pelle} stroke={c} strokeWidth={6} />
        <path d="M -14 -30 q 14 10 30 -2" fill="none" stroke={p.pelleOmbra} strokeWidth={4.5} strokeLinecap="round" />
      </g>
    );
  }
  if (tipo === 'telefono') {
    return (
      <g>
        <rect x={-30} y={-56} width={60} height={58} rx={22} fill={p.pelle} stroke={c} strokeWidth={6} />
        <rect x={-37} y={-176} width={74} height={140} rx={14} fill="#0E141D" stroke={c} strokeWidth={6} />
        <rect x={-30} y={-168} width={60} height={124} rx={9} fill={stile.colori.luce} opacity={0.92} />
        <rect x={-30} y={-168} width={60} height={124} rx={9} fill="#FFFFFF" opacity={0.25} />
        <rect x={-18} y={-150} width={36} height={7} rx={3.5} fill="#0E141D" opacity={0.55} />
        <rect x={-18} y={-134} width={24} height={7} rx={3.5} fill="#0E141D" opacity={0.4} />
        <rect x={-18} y={-104} width={36} height={34} rx={6} fill="#0E141D" opacity={0.3} />
        {[-118, -94, -70].map((y, k) => (
          <rect key={k} x={24} y={y} width={24} height={19} rx={9.5} {...dito} />
        ))}
        <rect x={-50} y={-96} width={19} height={46} rx={9.5} transform="rotate(10 -40 -70)" {...dito} />
      </g>
    );
  }
  return (
    <g>
      <rect x={-10.5} y={-134} width={21} height={84} rx={10.5} {...dito} />
      <rect x={-31} y={-70} width={62} height={72} rx={25} fill={p.pelle} stroke={c} strokeWidth={6} />
      <rect x={-48} y={-66} width={18} height={42} rx={9} transform="rotate(-24 -38 -40)" {...dito} />
      <path d="M 6 -62 q 9 5 7 16 M 18 -52 q 7 5 5 13" fill="none" stroke={p.pelleOmbra} strokeWidth={4.5} strokeLinecap="round" />
    </g>
  );
}

function nascosta(m: Mano): Mano {
  return {...m, gomito: [m.gomito[0], m.gomito[1] + 520], polso: [m.polso[0], m.polso[1] + 520]};
}

function tra(a: Mano | undefined, b: Mano | undefined, p: number): Mano | null {
  if (!a && !b) return null;
  const da = a ?? nascosta(b!);
  const verso = b ?? nascosta(a!);
  return {
    gomito: [mix(da.gomito[0], verso.gomito[0], p), mix(da.gomito[1], verso.gomito[1], p)],
    polso: [mix(da.polso[0], verso.polso[0], p), mix(da.polso[1], verso.polso[1], p)],
    ruota: mix(da.ruota, verso.ruota, p),
    tipo: p < 0.5 ? da.tipo : verso.tipo,
  };
}

function Avambraccio({mano, dondolo}: {mano: Mano; dondolo: number}) {
  const p = stile.personaggio.colori;
  const c = stile.colori.contorno;
  const [gx, gy] = mano.gomito;
  const [px, py] = mano.polso;
  if (py > 800) return null;
  const lunghezza = Math.hypot(px - gx, py - gy) || 1;
  const ux = (px - gx) / lunghezza;
  const uy = (py - gy) / lunghezza;
  // la manica si ferma poco prima del polso; il polsino è una riga di traverso
  const fx = px - ux * 6;
  const fy = py - uy * 6;
  const qx = px - ux * 30;
  const qy = py - uy * 30;
  return (
    <g>
      <path d={`M ${gx} ${gy} L ${fx} ${fy}`} stroke={c} strokeWidth={76} strokeLinecap="round" />
      <path d={`M ${gx} ${gy} L ${fx} ${fy}`} stroke={p.camice} strokeWidth={62} strokeLinecap="round" />
      <path d={`M ${qx - uy * 31} ${qy + ux * 31} L ${qx + uy * 31} ${qy - ux * 31}`} stroke={c} strokeWidth={5} />
      <g transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${(mano.ruota + dondolo).toFixed(2)})`}>
        <FormaMano tipo={mano.tipo} />
      </g>
    </g>
  );
}

export function Dottore(props: PropsDottore) {
  const {larghezza, ora, bocca, chiusuraOcchi, energia, sorriso, posaDa, posaA, passaggio} = props;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const p = stile.personaggio.colori;
  const c = stile.colori.contorno;
  const altezza = larghezza / PROPORZIONE_DOTTORE;

  const a = ASSETTI[posaDa] ?? ASSETTI.base;
  const b = ASSETTI[posaA] ?? ASSETTI.base;
  const destra = tra(a.destra, b.destra, passaggio);
  const sinistra = tra(a.sinistra, b.sinistra, passaggio);
  const sopracciglia = Math.min(1, props.sopracciglia + mix(a.sopracciglia ?? 0, b.sopracciglia ?? 0, passaggio));
  const guardaPosa: [number, number] = [
    mix(a.guarda?.[0] ?? -0.35, b.guarda?.[0] ?? -0.35, passaggio),
    mix(a.guarda?.[1] ?? -0.25, b.guarda?.[1] ?? -0.25, passaggio),
  ];
  const guarda: [number, number] = [guardaPosa[0] + onda(ora, 5.3) * 0.12, guardaPosa[1] + onda(ora, 4.1, 0.3) * 0.1];
  const testaPosa = mix(a.testa ?? 0, b.testa ?? 0, passaggio);

  // piccoli movimenti che lo tengono vivo
  const inclina = testaPosa + onda(ora, 3.4) * 1.5 + onda(ora, 0.9) * 1.1 * energia + guarda[0] * 1.4;
  const sobbalzo = -Math.abs(onda(ora, 0.46)) * 3.2 * energia;
  const respiro = onda(ora, 4.2) * 2;
  const saluto = posaA === 'saluta' ? onda(ora, 0.45) * 13 * passaggio : posaDa === 'saluta' ? onda(ora, 0.45) * 13 * (1 - passaggio) : 0;
  const dondolo = onda(ora, 1.7) * 1.6;

  return (
    <svg width={larghezza} height={altezza} viewBox="0 0 560 760" style={{display: 'block', overflow: 'visible'}}>
      <g transform="translate(70 0)">
        {/* busto */}
        <g transform={`translate(0 ${respiro.toFixed(2)})`}>
          <path d="M 60 800 L 60 442 C 60 372 112 346 172 330 L 248 330 C 308 346 360 372 360 442 L 360 800 Z" fill={p.camice} stroke={c} strokeWidth={7} strokeLinejoin="round" />
          <path d="M 316 470 L 316 800 L 356.5 800 L 356.5 442 C 356.5 420 350 400 338 386 C 330 410 316 440 316 470 Z" fill={p.camiceOmbra} />
          <path d="M 104 472 L 104 800 M 316 472 L 316 800" stroke={c} strokeWidth={5.5} strokeLinecap="round" />
          <path d="M 172 330 L 210 424 L 248 330 Z" fill={p.divisa} stroke={c} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 172 330 L 210 424 L 178 452 L 138 366 Z" fill={p.camice} stroke={c} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 248 330 L 210 424 L 242 452 L 282 366 Z" fill={p.camice} stroke={c} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 210 426 L 210 800" stroke={c} strokeWidth={5.5} />
          <circle cx={226} cy={520} r={6.5} fill={c} />
          <circle cx={226} cy={604} r={6.5} fill={c} />
          <circle cx={226} cy={688} r={6.5} fill={c} />
          {/* taschino con penna e targhetta */}
          <rect x={262} y={452} width={10} height={34} rx={4} fill={stile.colori.accento} stroke={c} strokeWidth={4} />
          <rect x={246} y={476} width={62} height={50} rx={7} fill={p.camice} stroke={c} strokeWidth={5.5} />
          <text x={277} y={508} textAnchor="middle" fontFamily={stile.font.titoli} fontWeight={900} fontSize={14} fill={p.strumento} transform={props.specchiato ? 'matrix(-1 0 0 1 554 0)' : undefined}>
            {stile.marchio}
          </text>
          {/* stetoscopio */}
          <path d="M 150 470 C 138 420 158 372 176 338" fill="none" stroke={c} strokeWidth={15} strokeLinecap="round" />
          <path d="M 150 470 C 138 420 158 372 176 338" fill="none" stroke={p.strumento} strokeWidth={8} strokeLinecap="round" />
          <path d="M 244 338 C 262 372 284 408 300 432" fill="none" stroke={c} strokeWidth={15} strokeLinecap="round" />
          <path d="M 244 338 C 262 372 284 408 300 432" fill="none" stroke={p.strumento} strokeWidth={8} strokeLinecap="round" />
          <path d="M 150 470 L 138 494 M 150 470 L 164 494" stroke={c} strokeWidth={7} strokeLinecap="round" />
          <circle cx={137} cy={497} r={6} fill={p.metallo} stroke={c} strokeWidth={4} />
          <circle cx={165} cy={497} r={6} fill={p.metallo} stroke={c} strokeWidth={4} />
          <circle cx={303} cy={437} r={16} fill={p.metallo} stroke={c} strokeWidth={6} />
          <circle cx={303} cy={437} r={6} fill={p.strumento} />
          {/* collo */}
          <path d="M 186 286 L 186 332 Q 210 352 234 332 L 234 286 Z" fill={p.pelle} stroke={c} strokeWidth={6.5} strokeLinejoin="round" />
          <path d="M 189.5 294 Q 210 312 230.5 294 L 230.5 288 L 189.5 288 Z" fill={p.pelleOmbra} />
        </g>

        {/* testa */}
        <g transform={`translate(0 ${(sobbalzo + respiro * 0.6).toFixed(2)}) rotate(${inclina.toFixed(2)} 210 296)`}>
          <circle cx={124} cy={206} r={19} fill={p.pelle} stroke={c} strokeWidth={6.5} />
          <circle cx={296} cy={206} r={19} fill={p.pelle} stroke={c} strokeWidth={6.5} />
          <rect x={128} y={92} width={164} height={202} rx={76} fill={p.pelle} stroke={c} strokeWidth={7} />
          <clipPath id={`testa-${id}`}>
            <rect x={128} y={92} width={164} height={202} rx={76} />
          </clipPath>
          <g clipPath={`url(#testa-${id})`}>
            <ellipse cx={305} cy={220} rx={34} ry={110} fill={p.pelleOmbra} opacity={0.5} />
          </g>
          <circle cx={150} cy={242} r={14} fill={p.guance} opacity={0.5} />
          <circle cx={270} cy={242} r={14} fill={p.guance} opacity={0.5} />
          <path
            d="M 123 182 C 108 96 160 60 214 64 C 270 60 314 100 297 184 C 291 152 276 128 252 117 C 224 137 176 139 143 126 C 132 140 126 160 123 182 Z"
            fill={p.capelli}
            stroke={c}
            strokeWidth={6.5}
            strokeLinejoin="round"
          />
          <path d="M 168 84 C 196 70 232 72 258 88" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={9} strokeLinecap="round" />
          <g transform={`translate(0 ${(-sopracciglia * 10).toFixed(2)})`}>
            <path d="M 149 149 Q 168 137 189 146" fill="none" stroke={p.capelli} strokeWidth={9} strokeLinecap="round" />
            <path d="M 231 146 Q 252 137 271 149" fill="none" stroke={p.capelli} strokeWidth={9} strokeLinecap="round" />
          </g>
          <circle cx={170} cy={193} r={33} fill="rgba(255,255,255,0.94)" stroke={c} strokeWidth={7} />
          <circle cx={250} cy={193} r={33} fill="rgba(255,255,255,0.94)" stroke={c} strokeWidth={7} />
          <path d="M 203 189 Q 210 181 217 189" fill="none" stroke={c} strokeWidth={6.5} strokeLinecap="round" />
          <path d="M 137 189 L 127 197 M 283 189 L 293 197" stroke={c} strokeWidth={6.5} strokeLinecap="round" />
          <Occhio cx={170} cy={193} chiusura={chiusuraOcchi} guarda={guarda} grande={1 + sopracciglia * 0.12} />
          <Occhio cx={250} cy={193} chiusura={chiusuraOcchi} guarda={guarda} grande={1 + sopracciglia * 0.12} />
          <path d="M 207 215 q 10 10 -3 16" fill="none" stroke={p.pelleOmbra} strokeWidth={5.5} strokeLinecap="round" />
          <g transform="translate(210 255)">
            <Bocca forma={bocca} sorriso={sorriso} id={id} />
          </g>
        </g>
      </g>

      {/* avambracci e mani: stanno davanti a tutto */}
      {sinistra ? <Avambraccio mano={sinistra} dondolo={-dondolo} /> : null}
      {destra ? <Avambraccio mano={destra} dondolo={dondolo + saluto} /> : null}
    </svg>
  );
}
