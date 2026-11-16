// FMLAB Reel Kit — SCENE PRONTE ("blocchi"). Una scena intera in una riga: si scrive solo il contenuto.
//
//   export default definisciReel({
//     scene: {
//       aggancio: bloccoTitolo({titolo: 'Il GPS non sa dove sei', segno: 'sorpresa'}),
//       quota:    bloccoNumero({valore: 20200, unita: 'km di quota', segno: 'km', fonte: 'GPS.gov'}),
//       errori:   bloccoLista({voci: [{testo: 'Guardi solo il prezzo', segno: 'uno'}, {testo: 'Non leggi la perizia', segno: 'due'}]}),
//       crescita: bloccoLinea({titolo: 'Vendite', punti: [{etichetta: '2022', valore: 12}, {etichetta: '2024', valore: 31}], segno: 'sale'}),
//       chiusura: bloccoChiusura({parola: 'GPS'}),
//     },
//   });
//
// Regole comuni a tutti i blocchi:
//   · ogni testo può essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'});
//   · `segno` è il nome di un [segno] del copione: la cosa compare su quella parola. Si può anche dare un numero
//     (secondi dall'inizio della scena) oppure niente: allora gli elementi si distribuiscono da soli lungo la scena;
//   · stanno tutti dentro le zone sicure e lasciano libero lo spazio del narratore.
// Quando un blocco non basta, la scena si scrive a mano con i pezzi della libreria (vedi reels/gps/scene.tsx).
import type {ComponentType, ReactNode} from 'react';
import {useScena, useTempo} from './tempo';
import {curve, limita, mix, molla, numero, rampa} from './anim';
import {alfa} from './colore';
import {scegli} from './reel';
import {Bagliore, Linea, Onde} from './Luce';
import {Cartello, Cifra, Etichetta, Fonte, Scritta, Targa} from './Testi';
import {GraficoClassifica, GraficoLinea, GraficoTorta, COLORI_GRAFICI} from './Grafici';
import {Icona} from './Icone';
import {Filmato, Foto} from './Media';
import type {Clip} from './Media';
import {Telefono} from './Oggetti';
import {Ebook, Logo} from './Marchio';
import type {DisegnoIcona} from './Icone';
import {Scena3D, ombra, proietta} from './Tre';
import type {CameraTre, Faccia, V3} from './Tre';
import {scatola} from './Tre';
import {stile} from '../stile/stile';

/** Una scritta, oppure una per lingua. */
export type Testo = string | Record<string, string>;
/** Quando compare: nome di un [segno], secondi dall'inizio della scena, oppure niente (si distribuisce da solo). */
export type Quando = string | number | undefined;

const C = stile.colori;
const CX = stile.palco.centroX;
const CY = stile.palco.centroY;

const PAROLE: Record<string, Record<string, string>> = {
  mito: {it: 'MITO', en: 'MYTH', es: 'MITO', fr: 'MYTHE', de: 'MYTHOS', pt: 'MITO'},
  realta: {it: 'REALTÀ', en: 'REALITY', es: 'REALIDAD', fr: 'RÉALITÉ', de: 'REALITÄT', pt: 'REALIDADE'},
  commenta: {it: 'Commenta', en: 'Comment', es: 'Comenta', fr: 'Commente', de: 'Kommentiere', pt: 'Comenta'},
  fonti: {it: 'ti mando le fonti', en: "I'll send the sources", es: 'te mando las fuentes', fr: "je t'envoie les sources", de: 'ich schicke dir die Quellen', pt: 'mando as fontes'},
  fonte: {it: 'Fonte: ', en: 'Source: ', es: 'Fuente: ', fr: 'Source : ', de: 'Quelle: ', pt: 'Fonte: '},
};

/** Gli attrezzi di ogni blocco: tempo della scena, testi nella lingua giusta, istanti. */
function useBlocco() {
  const s = useScena();
  const tempo = useTempo();
  const dice = (t: Testo | undefined): string => (t === undefined ? '' : typeof t === 'string' ? t : scegli(tempo.lingua, t));
  const parola = (chiave: keyof typeof PAROLE) => scegli(tempo.lingua, PAROLE[chiave]);
  /** Secondi trascorsi da `quando` (negativo = non ancora). Senza `quando`: l'elemento i di n, distribuito lungo la scena. */
  const dopo = (quando: Quando, i = 0, n = 1): number => {
    if (typeof quando === 'string') return s.dopo(quando);
    if (typeof quando === 'number') return s.t - quando;
    return s.t - (0.3 + (Math.max(1.2, s.durata) - 1.1) * (i / Math.max(1, n)));
  };
  const cifre = (valore: number, decimali = 0) => numero(valore, decimali, tempo.lingua);
  return {s, tempo, dice, parola, dopo, cifre, tre: tempo.impostazioni.stile === '3d'};
}

/** Grandezza del carattere perché `testo` stia in `larghezza` pixel (stima: non si può misurare prima di disegnare). */
function adatta(testo: string, larghezza: number, massima: number, minima = 30, largoMedio = 0.56): number {
  return Math.round(limita(larghezza / (Math.max(1, testo.length) * largoMedio), minima, massima));
}

/** Spezza una frase in righe di circa `massimo` caratteri, senza spezzare le parole. Le righe già date con "\n" restano. */
function righe(testo: string, massimo: number): string[] {
  const esito: string[] = [];
  for (const pezzo of testo.split('\n')) {
    let riga = '';
    for (const p of pezzo.split(/\s+/).filter(Boolean)) {
      if (riga && (riga + ' ' + p).length > massimo) {
        esito.push(riga);
        riga = p;
      } else riga = riga ? `${riga} ${p}` : p;
    }
    if (riga) esito.push(riga);
  }
  return esito;
}

/** Scritta centrata su più righe, che entra dal basso. */
function Righe({testo, x = CX, y, dimensione, colore = C.testo, peso = 800, da, interlinea = 1.12, larghezza = 900, massimo}: {testo: string; x?: number; y: number; dimensione: number; colore?: string; peso?: number; da: number; interlinea?: number; larghezza?: number; massimo?: number}) {
  if (da <= 0 || !testo) return null;
  const elenco = righe(testo, massimo ?? Math.max(8, Math.floor(larghezza / (dimensione * 0.56))));
  const piu = Math.max(...elenco.map((r) => r.length));
  const corpo = Math.min(dimensione, adatta('x'.repeat(piu), larghezza, dimensione, 28));
  const p = molla(da, {rigidita: 220, smorzamento: 18});
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${((1 - p) * 34).toFixed(2)}px)`,
        opacity: rampa(da, 0.16),
        textAlign: 'center',
        whiteSpace: 'nowrap',
        fontFamily: stile.font.titoli,
        fontWeight: peso,
        fontSize: corpo,
        lineHeight: interlinea,
        color: colore,
        letterSpacing: '-0.01em',
      }}
    >
      {elenco.map((r, i) => (
        <div key={i}>{r}</div>
      ))}
    </div>
  );
}

/** Scritta piccola, maiuscola, spaziata: il "cappello" sopra un titolo o un grafico. */
function Cappello({testo, y, da, colore = C.tenue, x = CX}: {testo: string; y: number; da: number; colore?: string; x?: number}) {
  if (da <= 0 || !testo) return null;
  const corpo = adatta(testo, 760, 34, 22, 0.86);
  return (
    <div data-fmlab-zona="testo" style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity: rampa(da, 0.25), whiteSpace: 'nowrap', fontFamily: stile.font.testo, fontWeight: 700, fontSize: corpo, letterSpacing: '0.22em', textTransform: 'uppercase', color: colore}}>
      {testo}
    </div>
  );
}

function ConFonte({fonte, da, children}: {fonte?: Testo; da: number; children: ReactNode}) {
  const {dice, parola} = useBlocco();
  return (
    <>
      {children}
      {fonte ? <Fonte testo={parola('fonte') + dice(fonte)} da={da - 0.2} /> : null}
    </>
  );
}

// ───────────────────────── 1 · titolo ─────────────────────────

/** Una frase grande al centro: l'aggancio, o il titolo di un capitolo. */
export function bloccoTitolo({sopra, titolo, sotto, segno, colore = C.testo}: {sopra?: Testo; titolo: Testo; sotto?: Testo; segno?: Quando; colore?: string}): ComponentType {
  return function Titolo() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.15 : dopo(segno);
    const testo = dice(titolo);
    return (
      <>
        <Bagliore x={CX} y={CY - 20} raggio={520} forza={0.22 + 0.16 * rampa(da, 0.5)} />
        <Onde x={CX} y={CY - 20} t={s.t} raggioMax={480} periodo={2.6} quante={3} spessore={3} forza={0.3} />
        <Cappello testo={dice(sopra)} y={CY - 210} da={s.t - 0.1} colore={C.luce} />
        <Righe testo={testo} y={CY - 20} dimensione={testo.length <= 14 ? 132 : testo.length <= 30 ? 104 : 84} colore={colore} peso={900} da={da} larghezza={900} />
        <Cappello testo={dice(sotto)} y={CY + 220} da={da - 0.35} />
      </>
    );
  };
}

// ───────────────────────── 2 · numero ─────────────────────────

/** Un numero grande che sale fino al valore, con l'unità sotto. Opzionali: una targa di spiegazione e la fonte. */
export function bloccoNumero({valore, decimali = 0, prefisso = '', suffisso = '', unita, segno, colore = C.accento, nota, sottoNota, segnoNota, fonte}: {valore: number; decimali?: number; prefisso?: string; suffisso?: string; unita?: Testo; segno?: Quando; colore?: string; nota?: Testo; sottoNota?: Testo; segnoNota?: Quando; fonte?: Testo}): ComponentType {
  return function Numero() {
    const {dice, dopo, cifre} = useBlocco();
    const da = dopo(segno, 0, 2);
    const mostrato = prefisso + cifre(mix(0, valore, rampa(da, 0.8)), decimali) + suffisso;
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={CY - 60} raggio={470} colore={colore} forza={0.14 + 0.2 * rampa(da, 0.4)} />
        <Onde x={CX} y={CY - 60} t={Math.max(0, da)} raggioMax={430} periodo={1.8} quante={2} spessore={3} colore={colore} forza={0.35 * (1 - rampa(da - 1.6, 0.6))} />
        <Cifra x={CX} y={CY - 60} valore={mostrato} etichetta={dice(unita) || undefined} dimensione={adatta(mostrato, 860, 250, 120, 0.6)} colore={colore} da={da} />
        {nota ? <Targa x={CX} y={CY + 270} titolo={dice(nota)} sotto={dice(sottoNota) || undefined} dimensione={adatta(dice(nota), 700, 58, 36, 0.66)} da={dopo(segnoNota, 1, 2)} /> : null}
      </ConFonte>
    );
  };
}

// ───────────────────────── 3 · lista ─────────────────────────

/** Fino a cinque voci numerate che entrano una alla volta; l'ultima entrata resta accesa, le altre si attenuano. */
export function bloccoLista({titolo, voci, colore = C.luce}: {titolo?: Testo; voci: {testo: Testo; segno?: Quando}[]; colore?: string}): ComponentType {
  return function Lista() {
    const {s, dice, dopo} = useBlocco();
    const elenco = voci.slice(0, 5);
    const passo = elenco.length > 4 ? 142 : 158;
    const y0 = CY + (titolo ? 40 : 0) - ((elenco.length - 1) * passo) / 2;
    const tempi = elenco.map((v, i) => dopo(v.segno, i, elenco.length));
    const attiva = tempi.reduce((ultima, t, i) => (t > 0 ? i : ultima), -1);
    return (
      <>
        <Bagliore x={CX} y={CY} raggio={560} forza={0.16} />
        <Cappello testo={dice(titolo)} y={y0 - passo * 0.82} da={s.t - 0.1} colore={colore} />
        {elenco.map((v, i) => {
          const da = tempi[i];
          if (da <= 0) return null;
          const p = molla(da, {rigidita: 210, smorzamento: 19});
          const accesa = i === attiva;
          const testo = dice(v.testo);
          const linee = righe(testo, 24).slice(0, 2);
          const corpo = adatta('x'.repeat(Math.max(...linee.map((r) => r.length))), 700, 54, 34);
          return (
            <div
              key={i}
              data-fmlab-zona="testo"
              style={{position: 'absolute', left: 96, top: y0 + i * passo, width: 880, transform: `translateY(-50%) translateX(${((1 - p) * -46).toFixed(2)}px)`, opacity: rampa(da, 0.16) * (accesa ? 1 : 0.5), display: 'flex', alignItems: 'center', gap: 30}}
            >
              <div style={{flex: 'none', width: 92, height: 92, borderRadius: 46, display: 'grid', placeItems: 'center', background: accesa ? colore : alfa(colore, 0.16), border: `3px solid ${colore}`, color: accesa ? C.fondo : colore, fontFamily: stile.font.titoli, fontWeight: 900, fontSize: 50, boxShadow: accesa ? `0 0 46px ${alfa(colore, 0.55)}` : 'none'}}>{i + 1}</div>
              <div style={{fontFamily: stile.font.titoli, fontWeight: 800, fontSize: corpo, lineHeight: 1.1, color: C.testo}}>
                {linee.map((r, k) => (
                  <div key={k} style={{whiteSpace: 'nowrap'}}>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  };
}

// ───────────────────────── 4 · confronto ─────────────────────────

type Lato = {titolo: Testo; valore: number; decimali?: number; unita?: Testo; segno?: Quando; colore?: string};

/** Due colonne a confronto, A contro B: crescono in proporzione ai valori. In stile 3D sono solidi veri. */
export function bloccoConfronto({sinistra, destra, titolo, fonte}: {sinistra: Lato; destra: Lato; titolo?: Testo; fonte?: Testo}): ComponentType {
  return function Confronto() {
    const {s, dice, dopo, cifre, tre} = useBlocco();
    const lati = [
      {...sinistra, x: 300, colore: sinistra.colore ?? C.luce2, da: dopo(sinistra.segno, 0, 2)},
      {...destra, x: 780, colore: destra.colore ?? C.luce, da: dopo(destra.segno, 1, 2)},
    ];
    const massimo = Math.max(sinistra.valore, destra.valore, 0.0001);
    const base = CY + 250;
    const altezzaMax = 370;
    const camera: CameraTre = {giro: -14 + s.t * 1.6, alza: 14, distanza: 1700};
    return (
      <ConFonte fonte={fonte} da={lati[0].da}>
        <Bagliore x={CX} y={CY + 40} raggio={560} forza={0.16} />
        <Cappello testo={dice(titolo)} y={CY - 376} da={s.t - 0.1} />
        {tre ? (
          <Scena3D
            x={CX}
            y={base}
            camera={camera}
            oggetti={[
              ...ombra({pos: [0, 0, 0], raggio: 330, forza: 0.4}),
              ...lati.flatMap((l) => {
                if (l.da <= 0) return [];
                const h = Math.max(3, (l.valore / massimo) * altezzaMax * rampa(l.da, 0.9, curve.esce));
                return scatola({misure: [150, h, 150], colore: l.colore, pos: [l.x - CX, h / 2, 0]});
              }),
            ]}
          />
        ) : (
          lati.map((l, i) => {
            const h = Math.max(4, (l.valore / massimo) * altezzaMax * rampa(l.da, 0.9, curve.esce));
            return l.da > 0 ? (
              <div key={i} style={{position: 'absolute', left: l.x - 85, top: base - h, width: 170, height: h, borderRadius: '18px 18px 4px 4px', background: `linear-gradient(180deg, ${l.colore}, ${alfa(l.colore, 0.35)})`, boxShadow: `0 0 60px ${alfa(l.colore, 0.4)}`}} />
            ) : null;
          })
        )}
        {lati.map((l, i) => {
          const h = (l.valore / massimo) * altezzaMax;
          const mostrato = cifre(mix(0, l.valore, rampa(l.da, 0.9)), l.decimali ?? 0);
          // in 3D la cima e il piede della colonna si trovano proiettando i punti veri
          const cima = tre ? proietta([l.x - CX, h, 0], camera, [CX, base]) : {x: l.x, y: base - h};
          const piede = tre ? proietta([l.x - CX, 0, 75], camera, [CX, base]) : {x: l.x, y: base};
          return (
            <div key={i}>
              <Cifra x={cima.x} y={cima.y - 104} valore={mostrato} etichetta={dice(l.unita) || undefined} dimensione={adatta(mostrato, 360, 104, 56, 0.62)} colore={l.colore} da={l.da} />
              <Etichetta x={piede.x} y={piede.y + 64} testo={dice(l.titolo)} colore={l.colore} dimensione={adatta(dice(l.titolo), 330, 34, 22, 0.8)} da={l.da - 0.1} />
            </div>
          );
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 5 · grafico a colonne ─────────────────────────

/** Grafico a colonne (fino a sei): crescono una alla volta, con il valore sopra e il nome sotto. In 3D sono solidi. */
export function bloccoBarre({titolo, dati, unita, decimali = 0, colori, fonte}: {titolo?: Testo; dati: {etichetta: Testo; valore: number; segno?: Quando}[]; unita?: Testo; decimali?: number; colori?: string[]; fonte?: Testo}): ComponentType {
  return function Barre() {
    const {s, dice, dopo, cifre, tre} = useBlocco();
    const voci = dati.slice(0, 6);
    const n = voci.length;
    const tinte = colori ?? [C.luce, C.luce2, C.accento, C.positivo, '#C58BFF', C.negativo];
    const passo = Math.min(210, 820 / n);
    const largo = passo * 0.62;
    const massimo = Math.max(...voci.map((v) => v.valore), 0.0001);
    const base = CY + 270;
    const altezzaMax = 400;
    const tempi = voci.map((v, i) => dopo(v.segno, i, n));
    const x = (i: number) => CX + (i - (n - 1) / 2) * passo;
    const camera: CameraTre = {giro: -18 + s.t * 1.8, alza: 16, distanza: 1800};
    return (
      <ConFonte fonte={fonte} da={tempi[0]}>
        <Bagliore x={CX} y={CY + 60} raggio={580} forza={0.15} />
        <Cappello testo={[dice(titolo), dice(unita)].filter(Boolean).join(' · ')} y={CY - 376} da={s.t - 0.1} />
        {tre ? (
          <Scena3D
            x={CX}
            y={base}
            camera={camera}
            oggetti={[
              ...ombra({pos: [0, 0, 0], raggio: (n * passo) / 2 + 60, forza: 0.4}),
              ...voci.flatMap((v, i) => {
                if (tempi[i] <= 0) return [];
                const h = Math.max(3, (v.valore / massimo) * altezzaMax * rampa(tempi[i], 0.8, curve.esce));
                return scatola({misure: [largo, h, largo], colore: tinte[i % tinte.length], pos: [x(i) - CX, h / 2, 0]});
              }),
            ]}
          />
        ) : (
          <div style={{position: 'absolute', left: 110, top: base, width: 860, height: 3, background: alfa(C.tenue, 0.4)}} />
        )}
        {voci.map((v, i) => {
          const da = tempi[i];
          if (da <= 0) return null;
          const tinta = tinte[i % tinte.length];
          const piena = (v.valore / massimo) * altezzaMax;
          const h = Math.max(4, piena * rampa(da, 0.8, curve.esce));
          const mostrato = cifre(mix(0, v.valore, rampa(da, 0.8)), decimali);
          const cima = tre ? proietta([x(i) - CX, piena, 0], camera, [CX, base]) : {x: x(i), y: base - piena};
          const piede = tre ? proietta([x(i) - CX, 0, largo / 2], camera, [CX, base]) : {x: x(i), y: base};
          return (
            <div key={i}>
              {tre ? null : <div style={{position: 'absolute', left: x(i) - largo / 2, top: base - h, width: largo, height: h, borderRadius: '14px 14px 3px 3px', background: `linear-gradient(180deg, ${tinta}, ${alfa(tinta, 0.35)})`, boxShadow: `0 0 50px ${alfa(tinta, 0.35)}`}} />}
              <Cifra x={cima.x} y={cima.y - 62} valore={mostrato} dimensione={adatta(mostrato, passo * 0.9, 76, 38, 0.62)} colore={tinta} da={da} />
              <Etichetta x={piede.x} y={piede.y + 56} testo={dice(v.etichetta)} colore={tinta} dimensione={adatta(dice(v.etichetta), passo * 0.86, 28, 18, 0.82)} da={da - 0.1} />
            </div>
          );
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 6 · percentuale ─────────────────────────

/** Un anello che si riempie fino alla percentuale, con il numero al centro. */
export function bloccoAnello({valore, etichetta, segno, colore = C.luce, fonte}: {valore: number; etichetta?: Testo; segno?: Quando; colore?: string; fonte?: Testo}): ComponentType {
  return function Anello() {
    const {dice, dopo, cifre} = useBlocco();
    const da = dopo(segno);
    const p = rampa(da, 1.1, curve.morbida);
    const r = 250;
    const giro = 2 * Math.PI * r;
    const quota = limita(valore / 100) * p;
    const y = CY - 50;
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={y} raggio={520} colore={colore} forza={0.14 + 0.16 * p} />
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: rampa(da + 0.3, 0.3)}}>
          <circle cx={CX} cy={y} r={r} fill="none" stroke={alfa(C.tenue, 0.2)} strokeWidth={34} />
          <circle cx={CX} cy={y} r={r} fill="none" stroke={alfa(colore, 0.3)} strokeWidth={58} strokeDasharray={`${giro * quota} ${giro}`} transform={`rotate(-90 ${CX} ${y})`} />
          <circle cx={CX} cy={y} r={r} fill="none" stroke={colore} strokeWidth={34} strokeLinecap="round" strokeDasharray={`${giro * quota} ${giro}`} transform={`rotate(-90 ${CX} ${y})`} />
        </svg>
        <Cifra x={CX} y={y} valore={`${cifre(valore * p)}%`} dimensione={170} colore={C.testo} da={da} />
        <Cappello testo={dice(etichetta)} y={y + r + 110} da={da - 0.3} colore={colore} />
      </ConFonte>
    );
  };
}

// ───────────────────────── 7 · passi ─────────────────────────

/** Una linea verticale con i passi che si accendono uno dopo l'altro: procedure, cronologie, "come funziona". */
export function bloccoPassi({titolo, passi, colore = C.luce}: {titolo?: Testo; passi: {testo: Testo; segno?: Quando}[]; colore?: string}): ComponentType {
  return function Passi() {
    const {s, dice, dopo} = useBlocco();
    const elenco = passi.slice(0, 5);
    const n = elenco.length;
    const passo = n > 4 ? 150 : 172;
    const y0 = CY + (titolo ? 40 : 0) - ((n - 1) * passo) / 2;
    const tempi = elenco.map((v, i) => dopo(v.segno, i, n));
    const attivo = tempi.reduce((ultimo, t, i) => (t > 0 ? i : ultimo), -1);
    const x = 170;
    // la linea avanza fino al passo attivo
    const fin = attivo <= 0 ? 0 : attivo - 1 + rampa(tempi[attivo], 0.35);
    return (
      <>
        <Bagliore x={CX} y={CY} raggio={560} forza={0.15} />
        <Cappello testo={dice(titolo)} y={y0 - passo * 0.8} da={s.t - 0.1} colore={colore} />
        <div style={{position: 'absolute', left: x - 3, top: y0, width: 6, height: (n - 1) * passo, borderRadius: 3, background: alfa(C.tenue, 0.22)}} />
        <div style={{position: 'absolute', left: x - 3, top: y0, width: 6, height: Math.min(n - 1, fin) * passo, borderRadius: 3, background: colore, boxShadow: `0 0 24px ${alfa(colore, 0.7)}`}} />
        {elenco.map((v, i) => {
          const da = tempi[i];
          const acceso = da > 0;
          const corrente = i === attivo;
          const testo = dice(v.testo);
          const linee = righe(testo, 24).slice(0, 2);
          const corpo = adatta('x'.repeat(Math.max(...linee.map((r) => r.length))), 690, 52, 32);
          const r = corrente ? 30 : 22;
          return (
            <div key={i}>
              <div style={{position: 'absolute', left: x - r, top: y0 + i * passo - r, width: r * 2, height: r * 2, borderRadius: r, background: acceso ? colore : C.fondo, border: `4px solid ${acceso ? colore : alfa(C.tenue, 0.4)}`, boxSizing: 'border-box', boxShadow: corrente ? `0 0 40px ${alfa(colore, 0.8)}` : 'none'}} />
              {acceso ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: x + 70, top: y0 + i * passo, transform: `translateY(-50%) translateX(${((1 - molla(da, {rigidita: 210, smorzamento: 19})) * 40).toFixed(2)}px)`, opacity: rampa(da, 0.16) * (corrente ? 1 : 0.5), fontFamily: stile.font.titoli, fontWeight: 800, fontSize: corpo, lineHeight: 1.1, color: C.testo}}>
                  {linee.map((riga, k) => (
                    <div key={k} style={{whiteSpace: 'nowrap'}}>
                      {riga}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </>
    );
  };
}

// ───────────────────────── 8 · mito e realtà ─────────────────────────

function Scheda({cappello, testo, colore, y, da, spenta = 0, barrata = 0}: {cappello: string; testo: string; colore: string; y: number; da: number; spenta?: number; barrata?: number}) {
  if (da <= 0) return null;
  const linee = righe(testo, 22).slice(0, 3);
  const corpo = adatta('x'.repeat(Math.max(...linee.map((r) => r.length))), 720, 58, 34);
  const p = molla(da, {rigidita: 200, smorzamento: 18});
  return (
    <div data-fmlab-zona="testo" style={{position: 'absolute', left: CX, top: y, width: 840, transform: `translate(-50%, -50%) scale(${mix(0.86, 1, p) * mix(1, 0.9, spenta)})`, opacity: rampa(da, 0.16) * mix(1, 0.42, spenta), boxSizing: 'border-box', padding: '34px 40px 38px', borderRadius: 34, background: alfa(colore, 0.1), border: `3px solid ${alfa(colore, 0.75)}`, boxShadow: `0 0 70px ${alfa(colore, 0.22 * (1 - spenta))}`, textAlign: 'center'}}>
      <div style={{fontFamily: stile.font.testo, fontWeight: 800, fontSize: 30, letterSpacing: '0.24em', color: colore, marginBottom: 16}}>{cappello}</div>
      <div style={{position: 'relative', display: 'inline-block', fontFamily: stile.font.titoli, fontWeight: 800, fontSize: corpo, lineHeight: 1.12, color: C.testo}}>
        {linee.map((r, i) => (
          <div key={i} style={{whiteSpace: 'nowrap'}}>
            {r}
          </div>
        ))}
        {barrata > 0 ? <div style={{position: 'absolute', left: '-3%', top: '50%', width: `${106 * barrata}%`, height: 8, marginTop: -4, borderRadius: 4, background: colore, transform: 'rotate(-4deg)', transformOrigin: '0 50%'}} /> : null}
      </div>
    </div>
  );
}

/** "Si dice che…" barrato, poi la versione vera: per smontare una convinzione. */
export function bloccoMito({mito, verita, segnoMito, segnoVerita, fonte}: {mito: Testo; verita: Testo; segnoMito?: Quando; segnoVerita?: Quando; fonte?: Testo}): ComponentType {
  return function Mito() {
    const {dice, parola, dopo} = useBlocco();
    const a = dopo(segnoMito, 0, 2);
    const b = dopo(segnoVerita, 1, 2);
    return (
      <ConFonte fonte={fonte} da={b}>
        <Bagliore x={CX} y={CY - 20} raggio={560} colore={b > 0 ? C.positivo : C.negativo} forza={0.16} />
        <Scheda cappello={parola('mito')} testo={dice(mito)} colore={C.negativo} y={CY - 210} da={a} spenta={rampa(b - 0.1, 0.4)} barrata={rampa(b + 0.25, 0.35)} />
        <Scheda cappello={parola('realta')} testo={dice(verita)} colore={C.positivo} y={CY + 190} da={b} />
      </ConFonte>
    );
  };
}

// ───────────────────────── 9 · oggetto 3D ─────────────────────────

/**
 * Un oggetto 3D al centro, su un piatto che gira piano, con etichette agganciate ai suoi punti.
 *   bloccoOggetto({oggetti: () => fiala3d({liquido: '#5CF2C8'}), etichette: [{testo: 'Principio attivo', punto: [0, -20, 50], segno: 'cosa'}]})
 * `oggetti` riceve il tempo della scena, così l'oggetto può cambiare (un livello che sale, un pezzo che si apre).
 */
export function bloccoOggetto({oggetti, etichette = [], titolo, camera, zoom = 2.3, fonte}: {oggetti: (s: {t: number; dopo: (segno: string) => number}) => Faccia[]; etichette?: {testo: Testo; punto: V3; segno?: Quando; colore?: string}[]; titolo?: Testo; camera?: (t: number) => CameraTre; zoom?: number; fonte?: Testo}): ComponentType {
  return function Oggetto() {
    const {s, dice, dopo} = useBlocco();
    const y = CY - 10;
    const vista: CameraTre = camera ? camera(s.t) : {giro: -22 + s.t * 7, alza: 16, distanza: 1300, zoom};
    const tempi = etichette.map((e, i) => dopo(e.segno, i, etichette.length));
    return (
      <ConFonte fonte={fonte} da={s.t - 0.4}>
        <Bagliore x={CX} y={y} raggio={520} forza={0.24} />
        <Cappello testo={dice(titolo)} y={CY - 340} da={s.t - 0.1} />
        <Scena3D x={CX} y={y} camera={vista} oggetti={oggetti({t: s.t, dopo: s.dopo})} opacita={rampa(s.t, 0.3)} />
        {etichette.map((e, i) => {
          const da = tempi[i];
          if (da <= 0) return null;
          const p = proietta(e.punto, vista, [CX, y]);
          // le etichette vanno a sinistra e a destra alternate, alla stessa altezza del punto (ma dentro il palco)
          const aDestra = i % 2 === 1;
          const ex = aDestra ? 800 : 280;
          const ey = limita(p.y + (i < 2 ? -190 : 190), 520, 1250);
          const tinta = e.colore ?? C.luce;
          return (
            <div key={i}>
              <Linea da={[p.x, p.y]} a={[ex, ey + (ey > p.y ? -34 : 34)]} p={rampa(da, 0.3)} colore={tinta} spessore={3} />
              <div style={{position: 'absolute', left: p.x - 9, top: p.y - 9, width: 18, height: 18, borderRadius: 9, background: tinta, opacity: rampa(da, 0.2), boxShadow: `0 0 18px ${tinta}`}} />
              <Etichetta x={ex} y={ey} testo={dice(e.testo)} colore={tinta} dimensione={adatta(dice(e.testo), 400, 32, 20, 0.82)} da={da - 0.2} />
            </div>
          );
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 10 · chiusura ─────────────────────────

/** Il cartello finale: "COMMENTA  PAROLA  ti mando le fonti". */
export function bloccoChiusura({parola, sopra, sotto, segno, colore, logo = false}: {parola: string; sopra?: Testo; sotto?: Testo; segno?: Quando; colore?: string; /** true = il logo della pagina sopra il cartello. */ logo?: boolean}): ComponentType {
  return function Chiusura() {
    const b = useBlocco();
    const da = segno === undefined ? b.s.t - 0.2 : b.dopo(segno);
    return (
      <>
        <Bagliore x={CX} y={800} raggio={520} colore={colore} forza={0.3} />
        <Onde x={CX} y={800} t={b.s.t} raggioMax={520} periodo={2.4} quante={3} spessore={3} colore={colore} forza={0.35} />
        {logo ? <Logo x={CX} y={520} larghezza={230} da={b.s.t - 0.05} bagliore={0.7} /> : null}
        <Cartello x={CX} y={logo ? 860 : 800} sopra={sopra ? b.dice(sopra) : b.parola('commenta')} parola={parola.toUpperCase()} sotto={sotto ? b.dice(sotto) : b.parola('fonti')} colore={colore} dimensione={adatta(parola, 820, 230, 110, 0.66)} da={da} />
      </>
    );
  };
}

// ───────────────────────── 11 · grafico a linea ─────────────────────────

/** Una linea che si disegna da sinistra a destra, con il valore in testa: per tutto ciò che cambia nel tempo. */
export function bloccoLinea({titolo, punti, unita, decimali = 0, prefisso = '', suffisso = '', segno, durata = 1.8, colore = C.luce, evidenzia, fonte}: {titolo?: Testo; punti: {etichetta?: Testo; valore: number}[]; unita?: Testo; decimali?: number; prefisso?: string; suffisso?: string; segno?: Quando; durata?: number; colore?: string; evidenzia?: number; fonte?: Testo}): ComponentType {
  return function LineaNelTempo() {
    const {s, dice, dopo} = useBlocco();
    const da = dopo(segno, 0, 3);
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={CY + 20} raggio={560} colore={colore} forza={0.13} />
        <Cappello testo={[dice(titolo), dice(unita)].filter(Boolean).join(' · ')} y={CY - 330} da={s.t - 0.1} />
        <GraficoLinea x={CX + 30} y={CY + 10} larghezza={780} altezza={420} punti={punti.map((d) => ({etichetta: dice(d.etichetta) || undefined, valore: d.valore}))} p={rampa(da, durata, curve.morbida)} colore={colore} decimali={decimali} prefisso={prefisso} suffisso={suffisso} evidenzia={evidenzia} opacita={rampa(s.t - 0.1, 0.3)} />
      </ConFonte>
    );
  };
}

// ───────────────────────── 12 · torta ─────────────────────────

/** Una ciambella che si apre, con la legenda sotto. `evidenzia` (con il suo segno) stacca una fetta e ne mette la percentuale al centro. */
export function bloccoTorta({titolo, fette, segno, evidenzia, segnoEvidenzia, fonte}: {titolo?: Testo; fette: {etichetta: Testo; valore: number; colore?: string}[]; segno?: Quando; evidenzia?: number; segnoEvidenzia?: Quando; fonte?: Testo}): ComponentType {
  return function Torta() {
    const {s, dice, dopo, cifre} = useBlocco();
    const voci = fette.slice(0, 6);
    const da = dopo(segno, 0, 3);
    const stacco = evidenzia === undefined ? 0 : rampa(segnoEvidenzia === undefined ? da - 1.6 : dopo(segnoEvidenzia), 0.5);
    const totale = voci.reduce((somma, f) => somma + Math.max(0, f.valore), 0) || 1;
    const centro = 800;
    const colonne = voci.length > 3 ? 2 : 1;
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={centro} raggio={520} forza={0.14} />
        <Cappello testo={dice(titolo)} y={CY - 376} da={s.t - 0.1} />
        <GraficoTorta x={CX} y={centro} raggio={228} fette={voci.map((f) => ({etichetta: dice(f.etichetta), valore: f.valore, colore: f.colore}))} p={rampa(da, 1.3)} evidenzia={stacco > 0 ? evidenzia : undefined} stacca={stacco} scritte={false} />
        {evidenzia !== undefined && voci[evidenzia] ? <Cifra x={CX} y={centro} valore={`${cifre((Math.max(0, voci[evidenzia].valore) / totale) * 100)}%`} dimensione={104} colore={voci[evidenzia].colore ?? COLORI_GRAFICI[evidenzia % COLORI_GRAFICI.length]} da={segnoEvidenzia === undefined ? da - 1.6 : dopo(segnoEvidenzia)} /> : null}
        {voci.map((f, i) => {
          const tinta = f.colore ?? COLORI_GRAFICI[i % COLORI_GRAFICI.length];
          const riga = Math.floor(i / colonne);
          const x = colonne === 1 ? CX : i % 2 === 0 ? 290 : 730;
          const quota = cifre((Math.max(0, f.valore) / totale) * 100);
          const testo = `${quota}%  ${dice(f.etichetta)}`;
          return <Etichetta key={i} x={x} y={1112 + riga * 66} testo={testo} colore={tinta} dimensione={adatta(testo, colonne === 1 ? 640 : 330, 30, 20, 0.86)} piena={stacco > 0.5 && evidenzia === i} da={da - 0.5 - i * 0.12} />;
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 13 · classifica ─────────────────────────

/** Barre orizzontali, dalla prima all'ultima: chi ha di più, chi di meno. `evidenzia` (con il suo segno) ne accende una. */
export function bloccoClassifica({titolo, voci, unita, decimali = 0, prefisso = '', suffisso = '', segno, evidenzia, segnoEvidenzia, colore = C.luce, fonte}: {titolo?: Testo; voci: {etichetta: Testo; valore: number; colore?: string}[]; unita?: Testo; decimali?: number; prefisso?: string; suffisso?: string; segno?: Quando; evidenzia?: number; segnoEvidenzia?: Quando; colore?: string; fonte?: Testo}): ComponentType {
  return function Classifica() {
    const {s, dice, dopo} = useBlocco();
    const da = dopo(segno, 0, 3);
    const acceso = evidenzia !== undefined && (segnoEvidenzia === undefined ? da > 2 : dopo(segnoEvidenzia) > 0);
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={CY} raggio={560} colore={colore} forza={0.12} />
        <Cappello testo={[dice(titolo), dice(unita)].filter(Boolean).join(' · ')} y={CY - 376} da={s.t - 0.1} />
        <GraficoClassifica x={CX} y={CY + 10} larghezza={820} voci={voci.slice(0, 6).map((v) => ({etichetta: dice(v.etichetta), valore: v.valore, colore: v.colore}))} p={rampa(da, 1.6)} colore={colore} decimali={decimali} prefisso={prefisso} suffisso={suffisso} evidenzia={acceso ? evidenzia : undefined} />
      </ConFonte>
    );
  };
}

// ───────────────────────── 14 · icone ─────────────────────────

/** Da due a sei icone con il loro nome, che entrano una alla volta: "le tre cose da sapere", "cosa serve". */
export function bloccoIcone({titolo, voci, colore = C.luce}: {titolo?: Testo; voci: {icona: DisegnoIcona; testo: Testo; segno?: Quando; colore?: string}[]; colore?: string}): ComponentType {
  return function Icone() {
    const {s, dice, dopo} = useBlocco();
    const lista = voci.slice(0, 6);
    const n = lista.length;
    const perRiga = n <= 3 ? n : n === 4 ? 2 : 3;
    const righeTotali = Math.ceil(n / perRiga);
    const passoX = perRiga === 2 ? 400 : 310;
    const passoY = 370;
    const grande = n <= 2 ? 190 : n <= 4 ? 150 : 124;
    const tempi = lista.map((v, i) => dopo(v.segno, i, n));
    const ultima = tempi.reduce((scelta, t, i) => (t > 0 && (scelta < 0 || t < tempi[scelta]) ? i : scelta), -1);
    return (
      <>
        <Bagliore x={CX} y={CY} raggio={560} colore={colore} forza={0.12} />
        <Cappello testo={dice(titolo)} y={CY - 376} da={s.t - 0.1} />
        {lista.map((v, i) => {
          const riga = Math.floor(i / perRiga);
          const inRiga = riga === righeTotali - 1 ? n - riga * perRiga : perRiga;
          const col = i - riga * perRiga;
          const x = CX + (col - (inRiga - 1) / 2) * passoX;
          const y = CY - 30 + (riga - (righeTotali - 1) / 2) * passoY;
          const nome = dice(v.testo);
          return <Icona key={i} disegno={v.icona} x={x} y={y} dimensione={grande} colore={v.colore ?? colore} tondo etichetta={nome} da={tempi[i]} spento={ultima >= 0 && ultima !== i && tempi[i] > 0 ? rampa(tempi[ultima], 0.4) * 0.7 : 0} />;
        })}
      </>
    );
  };
}

// ───────────────────────── 15 · scala ─────────────────────────

/**
 * Una scala graduata (da `minimo` a `massimo`) con uno o più cursori che arrivano al loro valore: dolore da 0 a 10,
 * voto, temperatura. Con `da` il cursore parte da un valore e scorre fino a quello nuovo ("da 6 a 2").
 * `verso`: 'male' = più alto è peggio (verde → rosso), 'bene' = più alto è meglio (rosso → verde).
 */
export function bloccoScala({titolo, minimo = 0, massimo = 10, cursori, estremi, verso = 'male', decimali = 0, fonte}: {titolo?: Testo; minimo?: number; massimo?: number; cursori: {etichetta: Testo; valore: number; da?: number; segno?: Quando; colore?: string}[]; estremi?: [Testo, Testo]; verso?: 'male' | 'bene'; decimali?: number; fonte?: Testo}): ComponentType {
  return function Scala() {
    const {s, dice, dopo, cifre} = useBlocco();
    const lista = cursori.slice(0, 3);
    const X0 = 150;
    const X1 = 930;
    const Y = CY - 20;
    const alta = 58;
    const xDi = (v: number) => X0 + ((X1 - X0) * (limita(v, minimo, massimo) - minimo)) / (massimo - minimo || 1);
    const compare = rampa(s.t - 0.2, 1.0, curve.morbida);
    const sfumatura = verso === 'male' ? `linear-gradient(90deg, ${C.positivo} 0%, ${C.accento} 52%, ${C.negativo} 100%)` : `linear-gradient(90deg, ${C.negativo} 0%, ${C.accento} 48%, ${C.positivo} 100%)`;
    const tempi = lista.map((c, i) => dopo(c.segno, i, lista.length));
    return (
      <ConFonte fonte={fonte} da={tempi[0]}>
        <Bagliore x={CX} y={Y} raggio={540} colore={C.accento} forza={0.12} />
        <Cappello testo={dice(titolo)} y={CY - 376} da={s.t - 0.1} />
        <div style={{position: 'absolute', left: X0, top: Y - alta / 2, width: X1 - X0, height: alta, borderRadius: alta / 2, background: alfa('#FFFFFF', 0.09)}} />
        <div style={{position: 'absolute', left: X0, top: Y - alta / 2, width: (X1 - X0) * compare, height: alta, borderRadius: alta / 2, overflow: 'hidden', boxShadow: `0 0 34px ${alfa(C.accento, 0.25)}`}}>
          <div style={{width: X1 - X0, height: alta, background: sfumatura}} />
        </div>
        <Scritta x={X0} y={Y + alta / 2 + 40} dimensione={44} peso={900} da={s.t - 0.3}>
          {cifre(minimo)}
        </Scritta>
        <Scritta x={X1} y={Y + alta / 2 + 40} dimensione={44} peso={900} da={s.t - 1.0}>
          {cifre(massimo)}
        </Scritta>
        {estremi ? <Etichetta x={X0 + 120} y={Y + 190} testo={dice(estremi[0])} dimensione={adatta(dice(estremi[0]), 330, 28, 18, 0.86)} colore={verso === 'male' ? C.positivo : C.negativo} da={s.t - 0.6} /> : null}
        {estremi ? <Etichetta x={X1 - 150} y={Y + 190} testo={dice(estremi[1])} dimensione={adatta(dice(estremi[1]), 330, 28, 18, 0.86)} colore={verso === 'male' ? C.negativo : C.positivo} da={s.t - 1.1} /> : null}
        {lista.map((c, i) => {
          const da = tempi[i];
          if (da <= 0) return null;
          const tinta = c.colore ?? (i === 0 ? '#FFFFFF' : COLORI_GRAFICI[i % COLORI_GRAFICI.length]);
          const ora = c.da === undefined ? c.valore : mix(c.da, c.valore, rampa(da - 0.4, 1.1, curve.morbida));
          const x = xDi(ora);
          const entra = molla(da, {rigidita: 210, smorzamento: 16});
          // le etichette si alternano su due piani, così tre cursori vicini non si coprono
          const yEtichetta = Y - alta / 2 - 118 - (i % 2) * 74;
          const testo = `${dice(c.etichetta)}: ${cifre(ora, decimali)}`;
          return (
            <div key={i} style={{opacity: rampa(da, 0.15)}}>
              <div style={{position: 'absolute', left: x - 4, top: yEtichetta + 30, width: 8, height: Y + alta / 2 + 10 - (yEtichetta + 30), borderRadius: 4, background: '#FFFFFF', transformOrigin: '50% 100%', transform: `scaleY(${entra.toFixed(4)})`, boxShadow: `0 0 16px ${alfa(tinta, 0.9)}`}} />
              <Etichetta x={limita(x, 230, 850)} y={yEtichetta} testo={testo} dimensione={adatta(testo, 420, 32, 22, 0.86)} colore={tinta} piena da={da} />
            </div>
          );
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 16 · schede ─────────────────────────

/** Due o tre schede affiancate con un numero ciascuna (gli studi, i piani, le versioni) e, se vuoi, il totale sotto. */
export function bloccoSchede({titolo, schede, totale, fonte}: {titolo?: Testo; schede: {sopra?: Testo; valore: string | number; unita?: Testo; sotto?: Testo; colore?: string; segno?: Quando}[]; totale?: {valore: number; etichetta?: Testo; segno?: Quando; decimali?: number}; fonte?: Testo}): ComponentType {
  return function Schede() {
    const {s, dice, dopo, cifre} = useBlocco();
    const lista = schede.slice(0, 3);
    const n = lista.length;
    const larga = n === 3 ? 280 : 400;
    const passo = larga + (n === 3 ? 26 : 60);
    const y = totale ? 760 : CY - 20;
    const tempi = lista.map((c, i) => dopo(c.segno, i, n + (totale ? 1 : 0)));
    const daTotale = totale ? dopo(totale.segno, n, n + 1) : -1;
    return (
      <ConFonte fonte={fonte} da={tempi[0]}>
        <Bagliore x={CX} y={y + 40} raggio={560} colore={C.luce2} forza={0.14} />
        <Cappello testo={dice(titolo)} y={y - 240} da={s.t - 0.1} />
        {lista.map((c, i) => {
          const da = tempi[i];
          if (da <= 0) return null;
          const tinta = c.colore ?? COLORI_GRAFICI[i % COLORI_GRAFICI.length];
          const p = molla(da, {rigidita: 200, smorzamento: 17});
          const numero = typeof c.valore === 'number' ? cifre(mix(0, c.valore, rampa(da, 0.7))) : c.valore;
          return (
            <div key={i} data-fmlab-zona="testo" style={{position: 'absolute', left: CX + (i - (n - 1) / 2) * passo - larga / 2, top: y - 160, width: larga, height: 320, borderRadius: 28, boxSizing: 'border-box', border: `3px solid ${alfa(tinta, 0.85)}`, background: `linear-gradient(180deg, ${alfa(tinta, 0.2)}, ${alfa('#0B1220', 0.86)})`, boxShadow: `0 0 54px ${alfa(tinta, 0.28)}`, transform: `translateY(${((1 - p) * 46).toFixed(2)}px) scale(${mix(0.86, 1, p).toFixed(4)})`, opacity: rampa(da, 0.18), fontFamily: stile.font.testo, color: C.testo, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8}}>
              {c.sopra ? <div style={{fontSize: adatta(dice(c.sopra), larga - 40, 30, 18, 0.74), fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tinta}}>{dice(c.sopra)}</div> : null}
              <div style={{fontFamily: stile.font.titoli, fontSize: adatta(String(numero), larga - 50, 104, 54, 0.62), fontWeight: 900, lineHeight: 1, fontFeatureSettings: '"tnum"'}}>{numero}</div>
              {c.unita ? <div style={{fontSize: adatta(dice(c.unita), larga - 40, 24, 16, 0.78), fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.tenue}}>{dice(c.unita)}</div> : null}
              {c.sotto ? <div style={{fontSize: adatta(dice(c.sotto), larga - 40, 31, 20, 0.58), fontWeight: 700}}>{dice(c.sotto)}</div> : null}
            </div>
          );
        })}
        {totale ? <Cifra x={CX} y={y + 300} valore={cifre(mix(0, totale.valore, rampa(daTotale, 0.9)), totale.decimali ?? 0)} etichetta={dice(totale.etichetta) || undefined} dimensione={126} colore={C.accento} da={daTotale} /> : null}
      </ConFonte>
    );
  };
}

// ───────────────────────── 17 · avviso ─────────────────────────

/** Il triangolo d'avviso con una frase e fino a tre righe sotto: rischi, effetti indesiderati, "attenzione a". */
export function bloccoAvviso({titolo, sotto, punti = [], segno, colore = C.negativo, fonte}: {titolo: Testo; sotto?: Testo; punti?: {testo: Testo; segno?: Quando}[]; segno?: Quando; colore?: string; fonte?: Testo}): ComponentType {
  return function Avviso() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.9 : dopo(segno);
    const lista = punti.slice(0, 3);
    const lato = 250;
    const h = lato * 0.87;
    const yTriangolo = lista.length ? 640 : 700;
    const entra = molla(s.t - 0.15, {rigidita: 190, smorzamento: 13});
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={yTriangolo + 60} raggio={520} colore={colore} forza={0.16} />
        {s.t > 0.4 ? <Onde x={CX} y={yTriangolo + 14} t={s.t - 0.4} colore={colore} quante={2} periodo={1.5} raggioMax={300} spessore={4} forza={0.5} /> : null}
        {s.t > 0.15 ? (
          <svg width={lato + 40} height={h + 40} viewBox={`${-lato / 2 - 20} ${-h / 2 - 20} ${lato + 40} ${h + 40}`} style={{position: 'absolute', left: CX - lato / 2 - 20, top: yTriangolo - h / 2 - 20, opacity: rampa(s.t - 0.15, 0.15), transform: `scale(${mix(0.5, 1, entra).toFixed(4)})`, filter: `drop-shadow(0 0 30px ${alfa(colore, 0.7)})`}}>
            <path d={`M 0 ${-h / 2} L ${lato / 2} ${h / 2} L ${-lato / 2} ${h / 2} Z`} fill={alfa(colore, 0.16)} stroke={colore} strokeWidth={14} strokeLinejoin="round" />
            <rect x={-9} y={-h * 0.18} width={18} height={h * 0.36} rx={9} fill={colore} />
            <circle cx={0} cy={h * 0.32} r={12} fill={colore} />
          </svg>
        ) : null}
        <Targa x={CX} y={yTriangolo + 250} titolo={dice(titolo)} sotto={dice(sotto) || undefined} dimensione={adatta(dice(titolo), 760, 62, 36, 0.62)} colore={colore} da={da} />
        {lista.map((v, i) => {
          const testo = dice(v.testo);
          return <Etichetta key={i} x={CX - 30} y={yTriangolo + 420 + i * 76} testo={testo} dimensione={adatta(testo, 720, 31, 21, 0.84)} colore={C.testo} da={dopo(v.segno, i + 1, lista.length + 1)} />;
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 18 · citazione ─────────────────────────

/** Una frase tra virgolette, con chi l'ha detta: una dichiarazione, la conclusione di uno studio, una recensione. */
export function bloccoCitazione({testo, autore, segno, colore = C.luce}: {testo: Testo; autore?: Testo; segno?: Quando; colore?: string}): ComponentType {
  return function Citazione() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.3 : dopo(segno);
    const frase = dice(testo);
    const corpo = frase.length <= 60 ? 68 : frase.length <= 110 ? 56 : 46;
    const elenco = righe(frase, Math.floor(880 / (corpo * 0.54)));
    const alto = elenco.length * corpo * 1.2;
    return (
      <>
        <Bagliore x={CX} y={CY - 40} raggio={540} colore={colore} forza={0.14} />
        {s.t > 0.1 ? (
          <div style={{position: 'absolute', left: 96, top: CY - 40 - alto / 2 - 210, fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 900, fontSize: 300, lineHeight: 1, color: alfa(colore, 0.5), opacity: rampa(s.t - 0.1, 0.3), textShadow: `0 0 40px ${alfa(colore, 0.4)}`}}>“</div>
        ) : null}
        <Righe testo={frase} y={CY - 40} dimensione={corpo} peso={800} da={da} interlinea={1.2} larghezza={880} massimo={Math.floor(880 / (corpo * 0.54))} />
        {autore ? <Etichetta x={CX} y={CY - 40 + alto / 2 + 90} testo={`— ${dice(autore)}`} dimensione={adatta(dice(autore), 700, 30, 20, 0.86)} colore={colore} da={da - 0.6} /> : null}
      </>
    );
  };
}

// ───────────────────────── 19 · persone ─────────────────────────

/**
 * "2 persone su 10": una fila di omini, e quelli che contano si accendono uno dopo l'altro. È il modo più
 * chiaro di dire una percentuale o un rischio. `quante` fino a 20 (due file).
 */
export function bloccoPersone({titolo, quante = 10, accese, etichetta, segno, colore = C.accento, fonte}: {titolo?: Testo; quante?: number; accese: number; etichetta?: Testo; segno?: Quando; colore?: string; fonte?: Testo}): ComponentType {
  return function Persone() {
    const {s, dice, dopo} = useBlocco();
    const n = Math.max(2, Math.min(20, Math.round(quante)));
    const quali = Math.max(0, Math.min(n, Math.round(accese)));
    const perFila = n > 10 ? Math.ceil(n / 2) : n;
    const file = Math.ceil(n / perFila);
    const passo = Math.min(118, 880 / perFila);
    const alto = passo * 1.75;
    const y0 = (file === 1 ? 700 : 640) - ((file - 1) * alto) / 2;
    const da = segno === undefined ? s.t - 1.1 : dopo(segno);
    const fatte = Math.min(quali, Math.floor(Math.max(0, da) / 0.16) + (da > 0 ? 1 : 0));
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={y0 + 60} raggio={560} colore={colore} forza={0.13} />
        <Cappello testo={dice(titolo)} y={y0 - alto * 0.5 - 60} da={s.t - 0.1} />
        {Array.from({length: n}, (_, i) => {
          const entra = s.t - 0.2 - i * 0.04;
          if (entra <= 0) return null;
          const accesa = i < quali ? rampa(da - i * 0.16, 0.22) : 0;
          const tinta = accesa > 0 ? colore : '#3A4658';
          const k = passo / 118;
          return (
            <svg key={i} width={passo} height={alto} viewBox="-59 -100 118 206" style={{position: 'absolute', left: CX + ((i % perFila) - (perFila - 1) / 2) * passo - passo / 2, top: y0 + Math.floor(i / perFila) * alto - alto / 2, opacity: rampa(entra, 0.18), transform: `scale(${(mix(0.7, 1, molla(entra)) * (1 + 0.1 * accesa * (1 - rampa(da - i * 0.16 - 0.22, 0.3)))).toFixed(4)})`, filter: accesa > 0 ? `drop-shadow(0 0 ${Math.round(16 * k)}px ${alfa(colore, 0.7 * accesa)})` : undefined}}>
              <circle cx={0} cy={-62} r={27} fill={tinta} opacity={0.35 + 0.65 * Math.max(accesa, 0.35)} />
              <path d="M -40 96 L -40 10 Q -40 -24 0 -24 Q 40 -24 40 10 L 40 96 Q 40 104 32 104 L -32 104 Q -40 104 -40 96 Z" fill={tinta} opacity={0.35 + 0.65 * Math.max(accesa, 0.35)} />
            </svg>
          );
        })}
        <Cifra x={CX} y={y0 + file * alto * 0.5 + 150} valore={`${fatte} su ${n}`} etichetta={dice(etichetta) || undefined} dimensione={128} colore={colore} da={da} />
      </ConFonte>
    );
  };
}

// ───────────────────────── 20 · tempo ─────────────────────────

/** Una linea del tempo con fino a quattro tappe: "settimana 1, settimana 24, settimana 68". Si disegna da sinistra. */
export function bloccoTempo({titolo, tappe, colore = C.luce, fonte}: {titolo?: Testo; tappe: {quando: Testo; testo?: Testo; segno?: Quando; colore?: string}[]; colore?: string; fonte?: Testo}): ComponentType {
  return function Tempo() {
    const {s, dice, dopo} = useBlocco();
    const lista = tappe.slice(0, 4);
    const n = lista.length;
    const y = CY - 40;
    const x0 = 150;
    const x1 = 930;
    const xDi = (i: number) => (n === 1 ? CX : x0 + ((x1 - x0) * i) / (n - 1));
    const tempi = lista.map((v, i) => dopo(v.segno, i, n));
    // la linea arriva fino all'ultima tappa già detta
    let fin = x0;
    lista.forEach((_, i) => {
      if (tempi[i] > 0) fin = Math.max(fin, mix(i === 0 ? x0 : xDi(i - 1), xDi(i), rampa(tempi[i], 0.5)));
    });
    return (
      <ConFonte fonte={fonte} da={tempi[0]}>
        <Bagliore x={CX} y={y} raggio={560} colore={colore} forza={0.12} />
        <Cappello testo={dice(titolo)} y={y - 330} da={s.t - 0.1} />
        <Linea da={[x0, y]} a={[x1, y]} p={rampa(s.t - 0.15, 0.5)} colore={alfa(C.tenue, 0.35)} spessore={6} />
        <Linea da={[x0, y]} a={[Math.max(x0 + 1, fin), y]} p={1} colore={colore} spessore={8} />
        {lista.map((v, i) => {
          const da = tempi[i];
          const x = xDi(i);
          const tinta = v.colore ?? colore;
          const sopra = i % 2 === 0;
          const acceso = rampa(da, 0.25);
          const quando = dice(v.quando);
          const testo = dice(v.testo);
          const largo = n > 2 ? 300 : 400;
          return (
            <div key={i}>
              <div style={{position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: '50%', boxSizing: 'border-box', border: `6px solid ${da > 0 ? tinta : '#3A4658'}`, background: da > 0 ? alfa(tinta, 0.35) : '#0B1220', boxShadow: da > 0 ? `0 0 ${Math.round(34 * acceso)}px ${alfa(tinta, 0.8)}` : undefined, transform: `scale(${mix(1, 1.18, acceso * (1 - rampa(da - 0.25, 0.3))).toFixed(4)})`, opacity: rampa(s.t - 0.2 - i * 0.08, 0.2)}} />
              {da > 0 ? (
                <div data-fmlab-zona="testo" style={{position: 'absolute', left: x - largo / 2, top: sopra ? y - 210 : y + 60, width: largo, height: 150, display: 'flex', flexDirection: 'column', justifyContent: sopra ? 'flex-end' : 'flex-start', textAlign: 'center', opacity: acceso, transform: `translateY(${((1 - molla(da)) * (sopra ? 24 : -24)).toFixed(2)}px)`, fontFamily: stile.font.testo, color: C.testo, textShadow: '0 2px 12px rgba(0,0,0,0.85)'}}>
                  <div style={{fontFamily: stile.font.titoli, fontWeight: 900, fontSize: adatta(quando, largo - 10, 54, 30, 0.6), lineHeight: 1.05, color: tinta}}>{quando}</div>
                  {testo ? <div style={{fontWeight: 700, fontSize: adatta(testo, largo - 10, 30, 20, 0.56), lineHeight: 1.15, marginTop: 6}}>{testo}</div> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </ConFonte>
    );
  };
}

// ───────────────────────── 21 · schermo ─────────────────────────

/**
 * Un telefono con dentro uno screenshot (`file`, nella cartella del reel) oppure una registrazione dello schermo
 * (`clip`, il clip.json fatto da `npm run clip`). Per far vedere un'app, un sito, una chat. Fino a tre etichette accanto.
 */
export function bloccoSchermo({titolo, file, clip, segno, note = [], colore = C.luce, fonte}: {titolo?: Testo; file?: string; clip?: Clip; segno?: Quando; note?: {testo: Testo; segno?: Quando}[]; colore?: string; fonte?: Testo}): ComponentType {
  return function Schermo() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.25 : dopo(segno);
    const lista = note.slice(0, 3);
    const entra = molla(s.t - 0.1, {rigidita: 170, smorzamento: 17});
    const x = lista.length ? 330 : CX;
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={x} y={CY + 40} raggio={520} colore={colore} forza={0.16} />
        <Cappello testo={dice(titolo)} y={490} da={s.t - 0.1} />
        <Telefono x={x} y={CY + 60 + (1 - entra) * 80} larghezza={360} inclina={[0, lista.length ? 10 : 0]} luce={rampa(da, 0.4)} opacita={rampa(s.t - 0.1, 0.2)}>
          {clip ? <Filmato clip={clip} schermo da={da} /> : file ? <Foto file={file} schermo da={da} zoom={[1, 1.04]} /> : null}
        </Telefono>
        {lista.map((v, i) => {
          const testo = dice(v.testo);
          return <Etichetta key={i} x={760} y={CY - 110 + i * 150} testo={testo} dimensione={adatta(testo, 380, 34, 22, 0.84)} colore={colore} da={dopo(v.segno, i + 1, lista.length + 1)} />;
        })}
      </ConFonte>
    );
  };
}


// ───────────────────────── 22 · sigla ─────────────────────────

/** La sigla della pagina: il logo che si accende, il nome sotto e una riga piccola. Per aprire o chiudere un reel. */
export function bloccoSigla({nome = stile.logo.nome, sotto, segno}: {nome?: Testo; sotto?: Testo; segno?: Quando} = {}): ComponentType {
  return function Sigla() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.15 : dopo(segno);
    const testo = dice(nome);
    return (
      <>
        <Bagliore x={CX} y={CY - 120} raggio={560} colore={C.positivo} forza={0.2 + 0.1 * rampa(da, 0.6)} />
        {da > 0.2 ? <Onde x={CX} y={CY - 120} t={da - 0.2} raggioMax={520} periodo={2.6} quante={3} spessore={3} colore={C.positivo} forza={0.3} /> : null}
        <Logo x={CX} y={CY - 120} larghezza={520} da={da} />
        <Righe testo={testo} y={CY + 190} dimensione={adatta(testo, 820, 120, 60, 0.66)} peso={900} da={da - 0.35} larghezza={900} />
        <Cappello testo={dice(sotto)} y={CY + 300} da={da - 0.6} />
      </>
    );
  };
}

// ───────────────────────── 25 · ebook ─────────────────────────

/** Il regalo della pagina: l'ebook sul tablet 3D che gira, con l'invito sotto ("Commenta MAPPA"). */
export function bloccoEbook({sopra, invito, sotto, segno, gira = 28}: {sopra?: Testo; invito?: Testo; sotto?: Testo; segno?: Quando; gira?: number} = {}): ComponentType {
  return function ScenaEbook() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.15 : dopo(segno);
    const testo = dice(invito);
    return (
      <>
        <Bagliore x={CX} y={CY - 90} raggio={600} colore={C.positivo} forza={0.16 + 0.1 * rampa(da, 0.6)} />
        <Cappello testo={dice(sopra)} y={CY - 480} da={da - 0.2} colore={C.positivo} />
        <Ebook x={CX} y={CY - 90} larghezza={450} da={da} gira={gira} />
        {testo ? <Righe testo={testo} y={CY + 340} dimensione={adatta(testo, 820, 84, 46, 0.66)} peso={900} da={da - 0.5} larghezza={900} /> : null}
        <Cappello testo={dice(sotto)} y={CY + 425} da={da - 0.8} />
      </>
    );
  };
}

// ───────────────────────── 23 · domanda ─────────────────────────

/** Una domanda grande con il punto interrogativo dietro: l'aggancio che apre un reel ("Quanto è merito del farmaco?"). */
export function bloccoDomanda({domanda, sopra, sotto, segno, colore = C.accento}: {domanda: Testo; sopra?: Testo; sotto?: Testo; segno?: Quando; colore?: string}): ComponentType {
  return function Domanda() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.15 : dopo(segno);
    const testo = dice(domanda);
    const p = molla(s.t - 0.1, {rigidita: 150, smorzamento: 13});
    return (
      <>
        <Bagliore x={CX} y={CY - 40} raggio={540} colore={colore} forza={0.2} />
        <div style={{position: 'absolute', left: CX - 300, top: CY - 480, width: 600, height: 760, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: stile.font.titoli, fontWeight: 900, fontSize: 760, lineHeight: 1, color: alfa(colore, 0.2), textShadow: `0 0 80px ${alfa(colore, 0.35)}`, transform: `rotate(${(mix(-18, 8, p) + 1.5 * Math.sin(s.t * 1.3)).toFixed(2)}deg) scale(${mix(0.5, 1, p).toFixed(4)})`, opacity: rampa(s.t - 0.1, 0.25)}}>?</div>
        <Cappello testo={dice(sopra)} y={CY - 250} da={s.t - 0.1} colore={colore} />
        <Righe testo={testo} y={CY - 30} dimensione={testo.length <= 18 ? 120 : testo.length <= 40 ? 92 : 74} peso={900} da={da} larghezza={900} />
        <Cappello testo={dice(sotto)} y={CY + 230} da={da - 0.4} />
      </>
    );
  };
}

// ───────────────────────── 24 · studio ─────────────────────────

/**
 * La scheda di uno studio: dove è uscito, il titolo, e sotto i dati che contano (quando, quante persone, quanto è
 * durato). `pagato` scrive in evidenza chi lo ha finanziato: nei reel su salute e sostanze va sempre detto.
 */
export function bloccoStudio({rivista, titolo, dati = [], pagato, segno, segnoPagato, colore = C.luce2, fonte}: {rivista: Testo; titolo: Testo; dati?: {testo: Testo; segno?: Quando}[]; pagato?: Testo; segno?: Quando; segnoPagato?: Quando; colore?: string; fonte?: Testo}): ComponentType {
  return function Studio() {
    const {s, dice, dopo} = useBlocco();
    const da = segno === undefined ? s.t - 0.2 : dopo(segno);
    const lista = dati.slice(0, 3);
    const p = molla(da, {rigidita: 180, smorzamento: 17});
    const testo = dice(titolo);
    const daPagato = pagato ? dopo(segnoPagato, lista.length + 1, lista.length + 2) : -1;
    return (
      <ConFonte fonte={fonte} da={da}>
        <Bagliore x={CX} y={CY - 60} raggio={560} colore={colore} forza={0.15} />
        {da > 0 ? (
          <div data-fmlab-zona="testo" style={{position: 'absolute', left: CX - 420, top: 520, width: 840, minHeight: 360, boxSizing: 'border-box', padding: '36px 44px 40px', borderRadius: 30, border: `3px solid ${alfa(colore, 0.8)}`, background: `linear-gradient(180deg, ${alfa(colore, 0.16)}, ${alfa('#0B1220', 0.9)})`, boxShadow: `0 0 60px ${alfa(colore, 0.25)}`, transform: `translateY(${((1 - p) * 50).toFixed(2)}px) scale(${mix(0.9, 1, p).toFixed(4)})`, opacity: rampa(da, 0.18), fontFamily: stile.font.testo, color: C.testo}}>
            <div style={{fontSize: adatta(dice(rivista), 750, 30, 20, 0.7), fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: colore}}>{dice(rivista)}</div>
            <div style={{height: 3, background: alfa(colore, 0.5), margin: '18px 0 22px', width: `${(rampa(da - 0.2, 0.6) * 100).toFixed(1)}%`}} />
            <div style={{fontFamily: stile.font.titoli, fontWeight: 800, fontSize: testo.length <= 50 ? 52 : testo.length <= 90 ? 42 : 34, lineHeight: 1.14}}>{testo}</div>
          </div>
        ) : null}
        {lista.map((v, i) => {
          const t = dice(v.testo);
          return <Etichetta key={i} x={CX + (i - (lista.length - 1) / 2) * (lista.length === 3 ? 290 : 400)} y={980} testo={t} dimensione={adatta(t, lista.length === 3 ? 250 : 360, 32, 20, 0.84)} colore={colore} da={dopo(v.segno, i + 1, lista.length + 2)} />;
        })}
        {pagato ? <Etichetta x={CX} y={1090} testo={dice(pagato)} dimensione={adatta(dice(pagato), 760, 32, 22, 0.84)} colore={C.accento} da={daPagato} piena /> : null}
      </ConFonte>
    );
  };
}
