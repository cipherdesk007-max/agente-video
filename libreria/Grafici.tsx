// FMLAB Reel Kit — GRAFICI. Linea, torta e classifica, disegnati con d3 (scale e forme; niente che dipenda dall'orologio).
// Tutti si animano da un solo numero, `p` (0…1): di solito rampa(s.dopo('segno'), 1.2).
// Le misure sono in pixel del video (1080x1920); x e y sono il CENTRO del grafico.
import {arc, area, curveMonotoneX, line, pie, scaleLinear} from 'd3';
import {curve, limita, mix, numero, rampa} from './anim';
import {alfa} from './colore';
import {useTempo} from './tempo';
import {stile} from '../stile/stile';

const C = stile.colori;
/** I colori dati alle serie quando non li scegli tu. */
export const COLORI_GRAFICI = [C.luce, C.luce2, C.accento, C.negativo, C.positivo, '#C58BFF'];

const scritta = (dimensione: number, colore: string, peso = 800) => ({
  position: 'absolute' as const,
  whiteSpace: 'nowrap' as const,
  fontFamily: stile.font.titoli,
  fontWeight: peso,
  fontSize: dimensione,
  lineHeight: 1,
  color: colore,
  fontFeatureSettings: '"tnum"',
  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
});

// ───────────────────────── linea ─────────────────────────

export type PuntoLinea = {
  /** Scritta sotto il punto (un anno, un mese, "settimana 12"). */
  etichetta?: string;
  valore: number;
};

/**
 * Grafico a linea: la linea si disegna da sinistra a destra mentre `p` va da 0 a 1, e in testa c'è il valore
 * a cui è arrivata. Con `evidenzia` (indice di un punto) quel punto resta acceso alla fine.
 */
export function GraficoLinea({
  x,
  y,
  larghezza = 820,
  altezza = 430,
  punti,
  p = 1,
  colore = C.luce,
  riempi = true,
  decimali = 0,
  prefisso = '',
  suffisso = '',
  minimo,
  massimo,
  evidenzia,
  opacita = 1,
}: {
  x: number;
  y: number;
  larghezza?: number;
  altezza?: number;
  punti: PuntoLinea[];
  p?: number;
  colore?: string;
  riempi?: boolean;
  decimali?: number;
  prefisso?: string;
  suffisso?: string;
  minimo?: number;
  massimo?: number;
  evidenzia?: number;
  opacita?: number;
}) {
  const {lingua} = useTempo();
  if (punti.length < 2 || opacita <= 0) return null;
  const q = limita(p);
  const valori = punti.map((d) => d.valore);
  const lo = minimo ?? Math.min(0, ...valori);
  const hi = massimo ?? Math.max(...valori);
  const margine = (hi - lo || 1) * 0.08;
  const sx = scaleLinear([0, punti.length - 1], [0, larghezza]);
  const sy = scaleLinear([lo, hi + margine], [altezza, 0]);
  const forma = line<PuntoLinea>()
    .x((_, i) => sx(i))
    .y((d) => sy(d.valore))
    .curve(curveMonotoneX);
  const sotto = area<PuntoLinea>()
    .x((_, i) => sx(i))
    .y0(altezza)
    .y1((d) => sy(d.valore))
    .curve(curveMonotoneX);
  // dov'è arrivata la testa della linea
  const passo = q * (punti.length - 1);
  const k = Math.min(punti.length - 2, Math.floor(passo));
  const f = passo - k;
  const testaX = sx(passo);
  const testaValore = mix(punti[k].valore, punti[k + 1].valore, f);
  const testaY = sy(testaValore);
  const sinistra = x - larghezza / 2;
  const alto = y - altezza / 2;
  const tacche = [lo, (lo + hi) / 2, hi];
  const id = `fmlab-linea-${Math.round(x)}-${Math.round(y)}`;
  const etichette = punti.length <= 8;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: opacita}}>
      <svg width={larghezza + 40} height={altezza + 40} style={{position: 'absolute', left: sinistra - 20, top: alto - 20, overflow: 'visible'}}>
        <defs>
          <clipPath id={id}>
            <rect x={-20} y={-40} width={testaX + 20} height={altezza + 80} />
          </clipPath>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={colore} stopOpacity={0.34} />
            <stop offset="1" stopColor={colore} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform="translate(20 20)">
          {tacche.map((v, i) => (
            <line key={i} x1={0} x2={larghezza} y1={sy(v)} y2={sy(v)} stroke={alfa('#FFFFFF', i === 0 ? 0.3 : 0.1)} strokeWidth={i === 0 ? 3 : 2} strokeDasharray={i === 0 ? undefined : '4 12'} />
          ))}
          <g clipPath={`url(#${id})`}>
            {riempi ? <path d={sotto(punti) ?? ''} fill={`url(#${id}-g)`} /> : null}
            <path d={forma(punti) ?? ''} fill="none" stroke={colore} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 14px ${alfa(colore, 0.8)})`}} />
          </g>
          {punti.map((d, i) => {
            const arrivato = rampa(passo - i + 0.05, 0.18);
            if (arrivato <= 0) return null;
            const acceso = evidenzia === i ? rampa(q - 0.98, 0.02) : 0;
            return <circle key={i} cx={sx(i)} cy={sy(d.valore)} r={mix(9, 16, acceso) * arrivato} fill={evidenzia === i && acceso > 0 ? C.accento : '#FFFFFF'} stroke={colore} strokeWidth={5} />;
          })}
          {q > 0 && q < 1 ? <circle cx={testaX} cy={testaY} r={15} fill={colore} style={{filter: `drop-shadow(0 0 16px ${colore})`}} /> : null}
        </g>
      </svg>
      {tacche.map((v, i) => (
        <div key={i} data-fmlab-zona="testo" style={{...scritta(26, C.tenue, 700), left: sinistra - 14, top: alto + sy(v), transform: 'translate(-100%, -50%)', opacity: rampa(q, 0.1)}}>
          {numero(v, decimali, lingua)}
        </div>
      ))}
      {etichette
        ? punti.map((d, i) =>
            d.etichetta ? (
              <div key={i} data-fmlab-zona="testo" style={{...scritta(27, C.tenue, 700), left: sinistra + sx(i), top: alto + altezza + 34, transform: 'translate(-50%, -50%)', opacity: rampa(passo - i + 0.3, 0.3)}}>
                {d.etichetta}
              </div>
            ) : null
          )
        : null}
      {q > 0 ? (
        <div data-fmlab-zona="testo" style={{...scritta(54, '#FFFFFF', 900), left: limita(sinistra + testaX, sinistra + 60, sinistra + larghezza - 60), top: alto + testaY - 58, transform: 'translate(-50%, -50%)', opacity: rampa(q, 0.06)}}>
          {prefisso + numero(testaValore, decimali, lingua) + suffisso}
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────── torta ─────────────────────────

export type Fetta = {etichetta: string; valore: number; colore?: string};

/**
 * Torta (o ciambella, con `foro`): le fette si aprono in senso orario mentre `p` va da 0 a 1.
 * `evidenzia` (indice) stacca una fetta dalle altre. Fino a sei fette: di più non si leggono.
 */
export function GraficoTorta({
  x,
  y,
  raggio = 250,
  foro = 0.56,
  fette,
  p = 1,
  evidenzia,
  stacca = 1,
  percentuali = true,
  scritte = true,
  opacita = 1,
}: {
  x: number;
  y: number;
  raggio?: number;
  /** 0 = torta piena; 0.56 = ciambella. */
  foro?: number;
  fette: Fetta[];
  p?: number;
  evidenzia?: number;
  /** 0…1: quanto è staccata la fetta in evidenza. */
  stacca?: number;
  percentuali?: boolean;
  /** false = senza i nomi attorno (li metti tu, per esempio in una legenda sotto). */
  scritte?: boolean;
  opacita?: number;
}) {
  const {lingua} = useTempo();
  if (!fette.length || opacita <= 0) return null;
  const q = curve.morbida(limita(p));
  const totale = fette.reduce((s, f) => s + Math.max(0, f.valore), 0) || 1;
  const spicchi = pie<Fetta>()
    .sort(null)
    .value((d) => Math.max(0, d.valore))
    .startAngle(0)
    .endAngle(Math.PI * 2 * q)
    .padAngle(fette.length > 1 ? 0.018 : 0)(fette);
  const forma = arc<(typeof spicchi)[number]>()
    .innerRadius(raggio * foro)
    .outerRadius(raggio)
    .cornerRadius(8);
  const lato = raggio * 2 + 80;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: opacita}}>
      <svg width={lato} height={lato} style={{position: 'absolute', left: x - lato / 2, top: y - lato / 2, overflow: 'visible'}}>
        <g transform={`translate(${lato / 2} ${lato / 2})`}>
          {spicchi.map((s, i) => {
            const colore = fette[i].colore ?? COLORI_GRAFICI[i % COLORI_GRAFICI.length];
            const meta = (s.startAngle + s.endAngle) / 2 - Math.PI / 2;
            const fuori = evidenzia === i ? 26 * limita(stacca) : 0;
            const spento = evidenzia !== undefined && evidenzia !== i ? 1 - 0.55 * limita(stacca) : 1;
            return <path key={i} d={forma(s) ?? ''} fill={colore} opacity={spento} transform={`translate(${(Math.cos(meta) * fuori).toFixed(2)} ${(Math.sin(meta) * fuori).toFixed(2)})`} style={{filter: evidenzia === i ? `drop-shadow(0 0 18px ${alfa(colore, 0.8)})` : undefined}} />;
          })}
        </g>
      </svg>
      {(scritte ? spicchi : []).map((s, i) => {
        const colore = fette[i].colore ?? COLORI_GRAFICI[i % COLORI_GRAFICI.length];
        const quota = Math.max(0, fette[i].valore) / totale;
        // le scritte compaiono quando la torta è aperta per metà, e seguono la loro fetta fino in fondo
        const aperta = rampa(q - 0.45, 0.35);
        if (aperta <= 0 || quota < 0.03) return null;
        const meta = (s.startAngle + s.endAngle) / 2 - Math.PI / 2;
        const r = raggio + 34 + (evidenzia === i ? 26 * limita(stacca) : 0);
        const destra = Math.cos(meta) >= 0;
        return (
          <div key={i} data-fmlab-zona="testo" style={{position: 'absolute', left: x + Math.cos(meta) * r, top: y + Math.sin(meta) * r, transform: `translate(${destra ? '0' : '-100%'}, -50%)`, opacity: aperta * (evidenzia !== undefined && evidenzia !== i ? 1 - 0.4 * limita(stacca) : 1), textAlign: destra ? 'left' : 'right'}}>
            {percentuali ? <div style={{...scritta(46, colore, 900), position: 'static'}}>{numero(quota * 100, 0, lingua)}%</div> : null}
            <div style={{...scritta(26, '#FFFFFF', 700), position: 'static', marginTop: 4}}>{fette[i].etichetta}</div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────── classifica ─────────────────────────

export type VoceClassifica = {etichetta: string; valore: number; colore?: string};

/**
 * Classifica a barre orizzontali: le barre crescono una dopo l'altra mentre `p` va da 0 a 1.
 * `evidenzia` (indice) ne accende una e attenua le altre. Fino a sei voci.
 */
export function GraficoClassifica({
  x,
  y,
  larghezza = 820,
  voci,
  p = 1,
  colore = C.luce,
  evidenzia,
  decimali = 0,
  prefisso = '',
  suffisso = '',
  massimo,
  opacita = 1,
}: {
  x: number;
  y: number;
  larghezza?: number;
  voci: VoceClassifica[];
  p?: number;
  colore?: string;
  evidenzia?: number;
  decimali?: number;
  prefisso?: string;
  suffisso?: string;
  massimo?: number;
  opacita?: number;
}) {
  const {lingua} = useTempo();
  if (!voci.length || opacita <= 0) return null;
  const q = limita(p);
  const n = voci.length;
  const riga = n <= 3 ? 150 : n <= 4 ? 128 : 108;
  const alta = Math.round(riga * 0.42);
  const hi = massimo ?? Math.max(...voci.map((v) => v.valore), 1e-9);
  const lunga = scaleLinear([0, hi], [0, larghezza - 190]);
  const sinistra = x - larghezza / 2;
  const alto = y - (riga * n) / 2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: opacita}}>
      {voci.map((v, i) => {
        // ogni barra parte un po' dopo la precedente
        const sua = rampa(q * (1 + 0.5 * (n - 1) * 0.35) - i * 0.5 * 0.35, 1, curve.esce) * rampa(q, 0.02);
        const c = v.colore ?? colore;
        const acceso = evidenzia === i;
        const spento = evidenzia !== undefined && !acceso ? 0.42 : 1;
        const yRiga = alto + riga * i;
        const w = Math.max(alta, lunga(v.valore) * sua);
        return (
          <div key={i} style={{opacity: rampa(sua, 0.05) * spento}}>
            <div data-fmlab-zona="testo" style={{...scritta(n <= 4 ? 36 : 31, '#FFFFFF', 800), left: sinistra, top: yRiga + 8}}>
              {v.etichetta}
            </div>
            <div style={{position: 'absolute', left: sinistra, top: yRiga + riga * 0.42, width: larghezza - 190, height: alta, borderRadius: alta / 2, background: alfa('#FFFFFF', 0.07)}} />
            <div style={{position: 'absolute', left: sinistra, top: yRiga + riga * 0.42, width: w, height: alta, borderRadius: alta / 2, background: `linear-gradient(90deg, ${alfa(c, 0.55)}, ${c})`, boxShadow: `0 0 ${acceso ? 34 : 18}px ${alfa(c, acceso ? 0.8 : 0.35)}`}} />
            <div data-fmlab-zona="testo" style={{...scritta(n <= 4 ? 46 : 40, acceso ? C.accento : c, 900), left: sinistra + w + 18, top: yRiga + riga * 0.42 + alta / 2, transform: 'translateY(-50%)'}}>
              {prefisso + numero(v.valore * sua, decimali, lingua) + suffisso}
            </div>
          </div>
        );
      })}
    </div>
  );
}
