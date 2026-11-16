// REEL: Come fa il GPS a sapere dove sei
// Le scene come codice. Ogni scena corrisponde a un [scena:nome] di copione.md e si aggancia alle parole
// con s.dopo('segno'): secondi trascorsi da quando viene pronunciata la parola marcata con [segno].
import {useId} from 'react';
import type {ReactNode} from 'react';
import {
  Bagliore,
  Camera,
  Cartello,
  Cifra,
  Divieto,
  Etichetta,
  Fonte,
  Globo,
  Linea,
  MappaSchermo,
  Onde,
  Orologio,
  Scena3D,
  Scritta,
  Segnaposto,
  Spunta,
  Targa,
  Telefono,
  TracciaOrbita,
  alfa,
  curve,
  definisciReel,
  impulso,
  limita,
  luogo,
  mix,
  molla,
  numero,
  onda,
  rampa,
  satellite3d,
  scegli,
  stile,
  suOrbita,
  useScena,
  useTempo,
  vistaA,
} from '../../libreria';

// ───────────────────────── testi sul palco, per lingua ─────────────────────────

const TESTI = {
  it: {
    ascolto: 'Solo ascolto',
    quota: 'km di quota',
    oltre: 'OLTRE 30',
    attivi: 'satelliti attivi',
    dove: 'Dove sono',
    ore: 'Che ore sono',
    viaggio: 'secondi di viaggio',
    ritardo: 'Ritardo',
    distanza: '≈ 20.000 km',
    formula: 'ritardo × velocità della luce',
    seiQui: 'Sei qui',
    orologio: 'Orologio corretto',
    terra: 'A terra',
    orbita: 'In orbita',
    micro: 'milionesimi di secondo al giorno',
    errore: 'km di errore al giorno',
    vera: 'Posizione vera',
    senza: 'Senza correzione',
    relativita: 'RELATIVITÀ',
    corretta: 'correzione attiva',
    commenta: 'Commenta',
    fonti: 'ti mando le fonti',
    fonteGps: 'Fonte: GPS.gov',
    fonteEsa: 'Fonte: ESA',
    fonteOsu: 'Fonte: Ohio State University',
  },
  en: {
    ascolto: 'Listen only',
    quota: 'km altitude',
    oltre: '30+',
    attivi: 'active satellites',
    dove: 'Where I am',
    ore: 'What time it is',
    viaggio: 'seconds of travel',
    ritardo: 'Delay',
    distanza: '≈ 20,000 km',
    formula: 'delay × speed of light',
    seiQui: 'You are here',
    orologio: 'Clock corrected',
    terra: 'On Earth',
    orbita: 'In orbit',
    micro: 'millionths of a second per day',
    errore: 'km of error per day',
    vera: 'True position',
    senza: 'Without correction',
    relativita: 'RELATIVITY',
    corretta: 'correction on',
    commenta: 'Comment',
    fonti: "I'll send the sources",
    fonteGps: 'Source: GPS.gov',
    fonteEsa: 'Source: ESA',
    fonteOsu: 'Source: Ohio State University',
  },
};

function useTesti() {
  return scegli(useTempo().lingua, TESTI);
}

/** Numeri scritti come si usa nella lingua del reel (20.200 in italiano, 20,200 in inglese). */
function useNumero() {
  const {lingua} = useTempo();
  return (valore: number, decimali = 0) => numero(valore, decimali, lingua);
}

const C = stile.colori;

// ───────────────────────── pezzi condivisi ─────────────────────────

/**
 * Il satellite, in 3D: oscilla piano attorno al suo asse e la camera lo guarda un po' dall'alto.
 * `larghezza` è quanto è largo sul video; `fase` è l'angolo (gradi) attorno a cui oscilla: tienilo tra -35 e 35,
 * oltre si vede di taglio e sparisce.
 */
function SatelliteTre({x, y, larghezza, fase = 0, inclina = 0, opacita = 1, acceso = 1}: {x: number; y: number; larghezza: number; fase?: number; inclina?: number; opacita?: number; acceso?: number}) {
  const {ora} = useTempo();
  if (opacita <= 0.01 || larghezza < 2) return null;
  return (
    <Scena3D
      oggetti={satellite3d({scala: larghezza / 400, ruota: [0, fase + onda(ora, 9, fase / 90) * 22, inclina], acceso})}
      x={x}
      y={y}
      camera={{giro: 0, alza: 20, distanza: 1250}}
      opacita={opacita}
    />
  );
}

/** Piano inclinato "a mappa": quello che ci si disegna sopra finisce in prospettiva. */
const PIANO = {cx: 540, cy: 935, lato: 900, inclinazione: 60, prospettiva: 1500};

/** Da un punto del piano (origine al centro) al punto sullo schermo. */
function sulPiano(u: number, v: number) {
  const a = (PIANO.inclinazione * Math.PI) / 180;
  const k = PIANO.prospettiva / (PIANO.prospettiva - v * Math.sin(a));
  return {x: PIANO.cx + u * k, y: PIANO.cy + v * Math.cos(a) * k};
}

function Piano({children, opacita = 1, colore = C.luce2}: {children?: ReactNode; opacita?: number; colore?: string}) {
  const L = PIANO.lato;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const righe = [];
  for (let k = -5; k <= 5; k++) {
    righe.push(<path key={`o${k}`} d={`M ${-L / 2} ${k * 80} H ${L / 2}`} />);
    righe.push(<path key={`v${k}`} d={`M ${k * 80} ${-L / 2} V ${L / 2}`} />);
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: PIANO.cx - L / 2,
        top: PIANO.cy - L / 2,
        width: L,
        height: L,
        opacity: opacita,
        transform: `perspective(${PIANO.prospettiva}px) rotateX(${PIANO.inclinazione}deg)`,
      }}
    >
      <svg width={L} height={L} viewBox={`${-L / 2} ${-L / 2} ${L} ${L}`} style={{overflow: 'visible'}}>
        <defs>
          <radialGradient id={`sfuma-${id}`}>
            <stop offset="0.35" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <mask id={`maschera-${id}`}>
            <rect x={-L / 2} y={-L / 2} width={L} height={L} fill={`url(#sfuma-${id})`} />
          </mask>
        </defs>
        <g mask={`url(#maschera-${id})`}>
          <rect x={-L / 2} y={-L / 2} width={L} height={L} fill={alfa(colore, 0.07)} />
          <g stroke={alfa(colore, 0.42)} strokeWidth={2.5}>
            {righe}
          </g>
        </g>
        {children}
      </svg>
    </div>
  );
}

/** Cerchio sul piano che si disegna da solo (p da 0 a 1). */
function CerchioSulPiano({cx, cy, r, p, colore}: {cx: number; cy: number; r: number; p: number; colore: string}) {
  if (p <= 0) return null;
  const giro = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={alfa(colore, 0.06 * p)} stroke={alfa(colore, 0.3)} strokeWidth={16} strokeDasharray={`${giro * p} ${giro}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={colore} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${giro * p} ${giro}`} transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={9} fill={colore} opacity={p} />
    </g>
  );
}

// ───────────────────────── 1 · aggancio ─────────────────────────
// "I satelliti GPS non sanno dove sei. Il tuo telefono non gli manda niente: ascolta e basta."

function Aggancio() {
  const s = useScena();
  const T = useTesti();
  const globo = {x: 540, y: 890, raggio: 268, longitudine: 5 + s.t * 1.7, latitudine: 26};
  const qui = luogo(12.5, 42.5, globo);

  const partenza = s.segno('niente') - 0.7;
  const vista = vistaA(s.t, [
    {quando: 0, x: 540, y: 880, zoom: 1},
    {quando: partenza, x: qui.x, y: qui.y - 30, zoom: 3.0, durata: 0.85},
  ]);
  const telefono = s.t - (partenza + 0.4);
  const mondo = 1 - 0.62 * rampa(telefono, 0.45);
  const attorno = 1 - rampa(s.t - partenza, 0.45); // orbite e satelliti spariscono mentre la camera stringe

  const satelliti = [0, 1, 2].map((k) => {
    const p = suOrbita(1.62, 55, 30 + k * 120, 50 + k * 95 + s.t * 20, globo);
    return {k, x: globo.x + p.x * globo.raggio, y: globo.y - p.y * globo.raggio, z: p.z};
  });
  const dubbio = s.dopo('nonsa');
  const invio = s.dopo('niente');
  const ascolto = s.dopo('ascolta');

  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: mondo}}>
        <Camera {...vista}>
          <Bagliore x={globo.x} y={globo.y} raggio={520} colore={C.luce2} forza={0.32} />
          {[0, 1, 2].map((k) => (
            <TracciaOrbita key={k} globo={globo} raggio={1.62} inclinazione={55} nodo={30 + k * 120} lato="dietro" colore={C.luce} opacita={attorno} />
          ))}
          {satelliti.filter((o) => o.z < 0).map((o) => (
            <SatelliteTre key={o.k} x={o.x} y={o.y} larghezza={92} fase={o.k * 25 - 25} opacita={0.55 * attorno} acceso={0.3} />
          ))}
          <Globo {...globo} />
          {[0, 1, 2].map((k) => (
            <TracciaOrbita key={k} globo={globo} raggio={1.62} inclinazione={55} nodo={30 + k * 120} lato="davanti" colore={C.luce} opacita={attorno} />
          ))}
          {satelliti.filter((o) => o.z >= 0).map((o) => (
            <SatelliteTre key={o.k} x={o.x} y={o.y} larghezza={126} fase={o.k * 25 - 25} opacita={attorno} />
          ))}
          <Segnaposto x={qui.x} y={qui.y} dimensione={58} p={molla(s.t - 0.45, {rigidita: 170, smorzamento: 13})} />
          {/* punti di domanda sopra i satelliti: non sanno dove sei */}
          {satelliti.map((o, n) => (
            <Scritta key={o.k} x={o.x + 6} y={o.y - 86} dimensione={92} peso={900} colore={C.accento} da={dubbio - n * 0.13} fino={s.t - partenza + 0.1}>
              ?
            </Scritta>
          ))}
        </Camera>
      </div>

      {/* il telefono: arriva quando la camera ha finito di stringere */}
      {telefono > 0 ? (
        <>
          <Bagliore x={540} y={930} raggio={420} forza={0.22 + 0.25 * rampa(ascolto, 0.4)} />
          <Onde x={540} y={690} t={invio} verso={-90} apertura={84} raggioMax={200} colore={C.tenue} forza={1 - rampa(ascolto, 0.25)} />
          <Onde x={540} y={452} t={ascolto} verso={90} apertura={76} raggioMax={250} periodo={0.9} spessore={6} />
          <Telefono x={540} y={940} larghezza={250 * mix(0.55, 1, molla(telefono, {rigidita: 200, smorzamento: 17}))} inclina={[9, -12]} luce={0.35 + 0.65 * rampa(ascolto, 0.3)} opacita={rampa(telefono, 0.2)}>
            <MappaSchermo battito={ascolto > 0 ? (ascolto * 0.9) % 1 : 0} />
          </Telefono>
          <Divieto x={540} y={575} raggio={92} p={(invio - 0.28) / 0.42} opacita={1 - rampa(ascolto, 0.25)} />
          <Etichetta x={540} y={1262} testo={T.ascolto} da={ascolto - 0.15} />
        </>
      ) : null}
    </>
  );
}

// ───────────────────────── 2 · orbita ─────────────────────────
// "Sopra di te, a ventimila chilometri, volano più di trenta satelliti. Ognuno ripete due cose:
//  dove si trova e che ore sono."

/** Raggio dell'orbita GPS in raggi terrestri: (6.371 + 20.200) km / 6.371 km. */
const ORBITA_GPS = 4.17;

function Orbita() {
  const s = useScena();
  const T = useTesti();
  const n = useNumero();
  const globo = {x: 540, y: 880, raggio: 96, longitudine: 12 + s.t * 5, latitudine: 20};
  const km = s.dopo('km');
  const tanti = s.dopo('sat');
  const due = s.dopo('due');
  const dove = s.dopo('dove');
  const ore = s.dopo('ora');
  const stretta = rampa(due + 0.45, 0.6, curve.morbida);

  // sei piani orbitali, cinque satelliti per piano
  const sciame = [];
  for (let piano = 0; piano < 6; piano++) {
    for (let j = 0; j < 5; j++) {
      const p = suOrbita(ORBITA_GPS, 55, piano * 60, j * 72 + piano * 25 + s.t * 13, globo);
      sciame.push({n: piano * 5 + j, x: globo.x + p.x * globo.raggio, y: globo.y - p.y * globo.raggio, z: p.z});
    }
  }
  const quotaY = globo.y - globo.raggio * ORBITA_GPS;
  const punto = (o: {n: number; x: number; y: number; z: number}) => {
    const lampo = impulso(tanti - o.n * 0.025, 0.7);
    const r = (o.z >= 0 ? 8 : 5.5) * (1 + lampo * 0.45);
    return (
      <g key={o.n} opacity={o.z >= 0 ? 1 : 0.45}>
        <circle cx={o.x} cy={o.y} r={r * 3} fill={C.luce} opacity={0.2 + lampo * 0.25} />
        <circle cx={o.x} cy={o.y} r={r} fill="#FFFFFF" />
        <path d={`M ${o.x - r * 2.6} ${o.y} H ${o.x + r * 2.6}`} stroke={C.luce2} strokeWidth={r * 0.8} opacity={0.9} />
        <circle cx={o.x} cy={o.y} r={r * 0.9} fill="#FFFFFF" />
      </g>
    );
  };

  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - 0.8 * stretta, transform: `scale(${mix(1, 0.86, stretta)})`, transformOrigin: '540px 880px'}}>
        <Bagliore x={540} y={880} raggio={470} colore={C.luce2} forza={0.2} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <TracciaOrbita key={k} globo={globo} raggio={ORBITA_GPS} inclinazione={55} nodo={k * 60} lato="dietro" colore={C.luce} spessore={2} />
        ))}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {sciame.filter((o) => o.z < 0).map(punto)}
        </svg>
        <Globo {...globo} />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <TracciaOrbita key={k} globo={globo} raggio={ORBITA_GPS} inclinazione={55} nodo={k * 60} lato="davanti" colore={C.luce} spessore={2.5} opacita={0.75} />
        ))}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {sciame.filter((o) => o.z >= 0).map(punto)}
        </svg>
        {/* la quota: una linea dalla superficie fino all'orbita */}
        <Linea da={[540, globo.y - globo.raggio]} a={[540, quotaY]} p={rampa(km, 0.55)} colore={C.accento} spessore={4} tratteggio="4 14" />
      </div>

      <Cifra x={786} y={610} valore={n(mix(0, 20200, rampa(km, 0.8)))} etichetta={T.quota} dimensione={104} colore={C.accento} da={km} fino={due + 0.35} />
      <Targa x={300} y={1210} titolo={T.oltre} sotto={T.attivi} da={tanti} fino={due + 0.35} />

      {/* un satellite da vicino: ripete due cose */}
      {due > -0.45 ? (
        <>
          <Bagliore x={540} y={700} raggio={360} forza={0.3 * stretta} />
          <Onde x={540} y={770} t={due + 0.1} verso={90} apertura={96} raggioMax={420} periodo={1.3} quante={4} spessore={5} forza={0.85} />
          <SatelliteTre x={540} y={690} larghezza={450 * mix(0.5, 1, molla(due + 0.35, {rigidita: 150, smorzamento: 15}))} opacita={rampa(due + 0.4, 0.3)} />
          <Linea da={[470, 800]} a={[330, 968]} p={rampa(dove, 0.3)} spessore={3.5} />
          <Etichetta x={320} y={1010} testo={T.dove} da={dove} dimensione={32} />
          <Linea da={[610, 800]} a={[752, 968]} p={rampa(ore, 0.3)} spessore={3.5} colore={C.accento} />
          <Etichetta x={762} y={1010} testo={T.ore} da={ore} dimensione={32} colore={C.accento} />
        </>
      ) : null}
      <Fonte testo={T.fonteGps} da={km - 0.3} />
    </>
  );
}

// ───────────────────────── 3 · distanza ─────────────────────────
// "Il segnale viaggia alla velocità della luce: arriva in circa settanta millesimi di secondo.
//  Da quel ritardo il telefono calcola la distanza."

function Distanza() {
  const s = useScena();
  const T = useTesti();
  const n = useNumero();
  const parte = s.dopo('parte');
  const ms = s.dopo('ms');
  const ritardo = s.dopo('ritardo');
  const dist = s.dopo('dist');
  const A: [number, number] = [368, 664];
  const B: [number, number] = [596, 956];
  const evidenza = rampa(ritardo, 0.3) * (1 - rampa(dist - 0.1, 0.4));
  const coloreLinea = evidenza > 0.5 ? C.accento : C.luce;

  return (
    <>
      <Bagliore x={330} y={600} raggio={330} forza={0.26} />
      <Bagliore x={640} y={1110} raggio={330} colore={C.luce2} forza={0.2} />
      <Linea da={A} a={B} p={rampa(parte, 0.5)} colore={coloreLinea} spessore={5} tratteggio="3 16" impulso={parte > 0.2 ? ((parte - 0.2) / 0.8) % 1 : undefined} />
      <Onde x={A[0]} y={A[1]} t={parte} verso={52} apertura={70} raggioMax={170} periodo={0.8} spessore={4} />
      <SatelliteTre x={310} y={600} larghezza={340 * mix(0.6, 1, molla(s.t - 0.1))} inclina={-16} fase={14} />
      <Telefono x={650} y={1120} larghezza={184 * mix(0.6, 1, molla(s.t - 0.25))} inclina={[10, -14]} luce={0.5 + 0.5 * impulso(((parte - 0.2) % 0.8) - 0.62, 0.25)}>
        <MappaSchermo />
      </Telefono>

      <Cifra x={776} y={640} valore={n(mix(0, 0.07, rampa(ms, 0.6)), 2)} etichetta={T.viaggio} dimensione={128} da={ms} />
      <Etichetta x={338} y={872} testo={T.ritardo} colore={C.accento} da={ritardo} fino={dist - 0.1} />
      <Targa x={330} y={1196} titolo={T.distanza} sotto={T.formula} dimensione={50} colore={C.accento} da={dist} />
    </>
  );
}

// ───────────────────────── 4 · cerchi ─────────────────────────
// "Un satellite ti mette su un cerchio. Tre cerchi si incrociano in un punto solo.
//  Il quarto corregge l'orologio del telefono."

function Cerchi() {
  const s = useScena();
  const T = useTesti();
  const uno = s.dopo('uno');
  const tre = s.dopo('tre');
  const punto = s.dopo('punto');
  const quarto = s.dopo('quarto');
  const orologio = s.dopo('orologio');

  // il punto P e tre cerchi che ci passano: raggio = distanza del centro da P
  const P = {u: 40, v: 20};
  const cerchi = [
    {u: -230, v: -110, colore: C.luce, sat: [214, 600] as [number, number], da: uno},
    {u: 250, v: -150, colore: C.luce2, sat: [866, 600] as [number, number], da: tre},
    {u: -40, v: 250, colore: C.accento, sat: [430, 530] as [number, number], da: tre - 0.25},
  ].map((c) => ({...c, r: Math.hypot(c.u - P.u, c.v - P.v), centro: sulPiano(c.u, c.v)}));
  const qui = sulPiano(P.u, P.v);
  const quartoSat: [number, number] = [660, 530];
  // prima degli altri cerchi "potresti essere ovunque" sul primo
  const giro = uno * 1.5;
  const dubbio = {u: cerchi[0].u + Math.cos(giro) * cerchi[0].r, v: cerchi[0].v + Math.sin(giro) * cerchi[0].r};

  return (
    <>
      <Piano opacita={rampa(s.t, 0.4)}>
        {cerchi.map((c, k) => (
          <CerchioSulPiano key={k} cx={c.u} cy={c.v} r={c.r} p={rampa(c.da - 0.15, 0.75, curve.morbida)} colore={c.colore} />
        ))}
        {uno > 0.2 && punto < 0.2 ? <circle cx={dubbio.u} cy={dubbio.v} r={15} fill="#FFFFFF" opacity={rampa(uno - 0.2, 0.3) * (1 - rampa(punto, 0.2))} /> : null}
        {punto > 0 ? <circle cx={P.u} cy={P.v} r={22 + impulso(punto, 0.5) * 40} fill={alfa('#FFFFFF', 0.9)} opacity={0.5 + 0.5 * (1 - rampa(punto, 0.5))} /> : null}
      </Piano>

      {cerchi.map((c, k) => (
        <Linea key={k} da={c.sat} a={[c.centro.x, c.centro.y]} p={rampa(c.da - 0.1, 0.4)} colore={c.colore} spessore={3} tratteggio="3 13" opacita={0.75} />
      ))}
      {cerchi.map((c, k) => (
        <SatelliteTre key={k} x={c.sat[0]} y={c.sat[1]} larghezza={158 * mix(0.4, 1, molla(c.da + 0.2, {rigidita: 190, smorzamento: 15}))} fase={k * 28 - 28} opacita={rampa(c.da + 0.2, 0.2)} />
      ))}

      <Bagliore x={qui.x} y={qui.y} raggio={190} colore={C.accento} forza={0.45 * rampa(punto, 0.3)} />
      <Segnaposto x={qui.x} y={qui.y} dimensione={96} p={molla(punto, {rigidita: 170, smorzamento: 12})} />
      <Etichetta x={330} y={1010} testo={T.seiQui} colore={C.accento} piena da={punto - 0.2} />

      {/* il quarto satellite: sistema l'orologio */}
      <Linea da={quartoSat} a={[qui.x, qui.y - 70]} p={rampa(quarto, 0.4)} colore="#FFFFFF" spessore={3} tratteggio="3 13" opacita={0.8} />
      <SatelliteTre x={quartoSat[0]} y={quartoSat[1]} larghezza={158 * mix(0.4, 1, molla(quarto, {rigidita: 190, smorzamento: 15}))} fase={18} opacita={rampa(quarto, 0.2)} />
      {orologio > 0 ? (
        <>
          <Orologio x={842} y={960} raggio={64 * mix(0.5, 1, molla(orologio))} secondi={12 + orologio * 30} opacita={rampa(orologio, 0.2)} />
          <Spunta x={908} y={896} raggio={34} p={(orologio - 0.35) / 0.4} />
          <Etichetta x={716} y={1092} testo={T.orologio} dimensione={25} colore={C.positivo} da={orologio - 0.35} />
        </>
      ) : null}
      <Fonte testo={T.fonteEsa} da={tre} />
    </>
  );
}

// ───────────────────────── 5 · tempo ─────────────────────────
// "Dettaglio assurdo: lassù il tempo scorre più veloce, di trentotto milionesimi di secondo al giorno.
//  Sembra niente, ma alla velocità della luce fanno circa dieci chilometri di errore al giorno.
//  Per questo gli orologi dei satelliti sono corretti con le formule di Einstein."

function TempoScena() {
  const s = useScena();
  const T = useTesti();
  const n = useNumero();
  const veloce = s.dopo('veloce');
  const micro = s.dopo('micro');
  const poco = s.dopo('poco');
  const luce = s.dopo('luce');
  const dieci = s.dopo('dieci');
  const percio = s.dopo('percio');
  const einstein = s.dopo('einstein');

  // parte A: due orologi a confronto
  const cambio = rampa(luce + 0.55, 0.5, curve.morbida);
  const secondiTerra = s.t * 9;
  const secondiOrbita = s.t * 9 + Math.max(0, veloce) * 9;

  // parte B: l'errore che cresce sulla mappa, poi la correzione
  const durataDeriva = s.segno('dieci') - s.segno('luce') + 0.3;
  const corretto = molla(einstein - 0.1, {rigidita: 120, smorzamento: 14});
  const deriva = rampa(luce - 0.1, durataDeriva, curve.lineare) * (1 - corretto);
  const vera = sulPiano(-250, 130);
  const falsa = sulPiano(mix(-250, 270, deriva), mix(130, -150, deriva));
  const rosso = C.negativo;

  return (
    <>
      {cambio < 1 ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - cambio, transform: `scale(${mix(1, 1.25, cambio)})`, transformOrigin: '540px 880px'}}>
          <Bagliore x={780} y={800} raggio={330} forza={0.2 + 0.2 * rampa(veloce, 0.4)} />
          <Globo x={300} y={590} raggio={54} longitudine={12 + s.t * 6} latitudine={20} reticolo={false} />
          <SatelliteTre x={780} y={588} larghezza={210} fase={-12} />
          <Orologio x={300} y={800} raggio={118} secondi={secondiTerra} colore={C.tenue} />
          <Orologio x={780} y={800} raggio={118 * (1 + 0.05 * impulso(veloce, 0.5))} secondi={secondiOrbita} />
          <Etichetta x={300} y={990} testo={T.terra} colore={C.tenue} da={s.t - 0.35} />
          <Etichetta x={780} y={990} testo={T.orbita} da={s.t - 0.5} />
          {/* "sembra niente": il numero si fa piccolo, un attimo prima di scoprire quanto pesa */}
          <Cifra x={540} y={1168} valore={'+' + n(mix(0, 38, rampa(micro, 0.8)))} etichetta={T.micro} dimensione={126 * mix(1, 0.5, rampa(poco, 0.45))} colore={C.luce} da={micro} />
        </div>
      ) : null}

      {cambio > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: cambio}}>
          <Piano colore={mix(0, 1, corretto) > 0.5 ? C.luce : '#C9506A'}>
            <path d="M -460 240 L 420 -230" stroke={alfa('#FFFFFF', 0.16)} strokeWidth={46} strokeLinecap="round" />
            <path d="M -460 240 L 420 -230" stroke={alfa('#FFFFFF', 0.5)} strokeWidth={4} strokeDasharray="26 26" />
            <path d="M -300 -260 L 60 300" stroke={alfa('#FFFFFF', 0.1)} strokeWidth={34} strokeLinecap="round" />
          </Piano>
          <Linea da={[vera.x, vera.y]} a={[falsa.x, falsa.y]} p={deriva > 0.01 ? 1 : 0} colore={rosso} spessore={6} opacita={limita(deriva * 6)} />
          <Bagliore x={falsa.x} y={falsa.y} raggio={150} colore={corretto > 0.6 ? C.positivo : rosso} forza={0.5} />
          <div style={{position: 'absolute', left: falsa.x - 26, top: falsa.y - 26, width: 52, height: 52, borderRadius: 26, background: corretto > 0.6 ? C.positivo : rosso, border: '6px solid #FFFFFF', boxSizing: 'border-box'}} />
          <Segnaposto x={vera.x} y={vera.y} dimensione={84} colore={C.positivo} p={rampa(luce + 0.35, 0.35)} />
          <Etichetta x={vera.x + 30} y={vera.y + 62} testo={T.vera} dimensione={24} colore={C.positivo} da={luce + 0.3} />
          <Cifra x={540} y={640} valore={n(mix(0, 10, rampa(luce - 0.1, durataDeriva, curve.lineare)))} etichetta={T.errore} dimensione={190 * (1 + 0.07 * impulso(dieci - 0.25, 0.35))} colore={rosso} da={luce + 0.1} fino={einstein - 0.15} />
          <Etichetta x={540} y={872} testo={T.senza} colore={rosso} piena da={percio} fino={einstein - 0.1} />
          <Targa x={540} y={640} titolo={T.relativita} sotto={T.corretta} colore={C.positivo} dimensione={72} da={einstein} />
          <Spunta x={826} y={560} raggio={40} p={(einstein - 0.3) / 0.4} />
        </div>
      ) : null}
      <Fonte testo={T.fonteOsu} da={micro - 0.3} />
    </>
  );
}

// ───────────────────────── 6 · chiusura ─────────────────────────
// "Commenta GPS e ti mando le fonti."

function Chiusura() {
  const s = useScena();
  const T = useTesti();
  const commenta = s.dopo('commenta');
  // tre satelliti su un anello che gira TUTTO attorno alle scritte (non le copre mai):
  // quelli dietro si disegnano prima della scritta, quelli davanti dopo
  const camera = {giro: 0, alza: 35, distanza: 1700};
  const flotta = [0, 1, 2].map((k) => {
    const a = s.t * 0.8 + (k * Math.PI * 2) / 3;
    return {k, z: Math.sin(a) * 575, facce: satellite3d({scala: 0.31, pos: [Math.cos(a) * 480, 0, Math.sin(a) * 575], ruota: [0, -a * 57.3 + 90, 0]})};
  });
  return (
    <>
      <Bagliore x={540} y={800} raggio={520} forza={0.3} />
      <Onde x={540} y={800} t={s.t} raggioMax={520} periodo={2.4} quante={3} spessore={3} forza={0.35} />
      <Scena3D oggetti={flotta.filter((o) => o.z < 0).flatMap((o) => o.facce)} x={540} y={800} camera={camera} opacita={0.75} />
      <Cartello x={540} y={800} sopra={T.commenta} parola="GPS" sotto={T.fonti} dimensione={230} da={commenta + 0.05} />
      <Scena3D oggetti={flotta.filter((o) => o.z >= 0).flatMap((o) => o.facce)} x={540} y={800} camera={camera} />
    </>
  );
}

// ───────────────────────── il reel ─────────────────────────

export default definisciReel({
  titolo: 'Come fa il GPS a sapere dove sei',
  atmosfera: {tinta: '#2A78E8'},
  scene: {
    aggancio: Aggancio,
    orbita: Orbita,
    distanza: {componente: Distanza, atmosfera: {tinta: '#1FB6C9', raggi: 0.7}},
    cerchi: {componente: Cerchi, atmosfera: {tinta: '#19C7A4'}},
    tempo: {componente: TempoScena, atmosfera: {tinta: '#7A62F0'}},
    chiusura: {componente: Chiusura, atmosfera: {tinta: '#19C7A4', raggi: 0.8}},
  },
});
