// FMLAB Reel Kit — foglio di prova di un personaggio: ogni gesto nel suo punto più spinto, più bocche e occhi.
// Serve a controllare a colpo d'occhio che testa, braccia e mani si muovano senza strappi.
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Pupazzo, mosseLabiale, poseDi, secondeDi} from '../../libreria/Pupazzo';
import type {ConfigPupazzo} from '../../libreria/Pupazzo';
import {GESTI, atteggiamento, gestoAlMassimo, secondaAdatta} from '../../libreria/gesti';
import {Dottore, POSE, PROPORZIONE_DOTTORE} from '../../libreria/Dottore';
import type {ConfigPersonaggio} from '../../libreria/impostazioni';
import type {DatiReel} from '../../libreria/tempo';
import {stile} from '../../stile/stile';

declare global {
  interface Window {
    __prova?: Promise<void>;
  }
}

const VUOTI: DatiReel = {versione: 1, lingua: 'it', motore: 'stima', precisione: 'stimata', voce: null, durataVoce: 0, coda: 0, durata: 10, fps: 30, parole: [], segni: {}, scene: [], impronta: ''};
const NOMI: Record<string, string> = {
  indica: 'gesto "indica" — alza il dito e lo tiene',
  batte: 'gesto "batte" — accento su una parola',
  spiega: 'gesto "spiega" — la mano aperta accompagna',
  annuisce: 'gesto "annuisce" — cenno a fine frase',
  domanda: 'gesto "domanda" — testa inclinata',
  nega: 'gesto "nega" — la testa fa "no"',
  saluta: 'gesto "saluta" — invito finale',
  guarda: 'gesto "guarda" — si volta verso il palco',
};
const NOMI_POSE: Record<string, string> = {
  dito: 'posa "dito" — l\'immagine com\'è',
  alto: 'posa "alto" — dito in alto: attenzione',
  lato: 'posa "lato" — braccio aperto di lato',
  aperto: 'posa "aperto" — la mano aperta sale',
  pensa: 'posa "pensa" — dito al mento: ci sta pensando',
  presenta: 'posa "presenta" — braccio disteso: ecco',
  conserte: 'posa "conserte" — braccia incrociate (un altro disegno): frena',
};

function Cella({titolo, children, ingrandimento = 1}: {titolo: string; children: React.ReactNode; ingrandimento?: number}) {
  return (
    <div style={{position: 'relative', width: 520 * ingrandimento, height: 640 * ingrandimento, background: '#0b1016', borderRadius: 18, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 104 * ingrandimento, top: 170 * ingrandimento}}>{children}</div>
      <div style={{position: 'absolute', left: 18, top: 14, right: 18, color: '#fff', font: `700 22px ${stile.font.testo}`}}>{titolo}</div>
    </div>
  );
}

/** Una cella chiesta a mano: le mosse di ogni osso scritte una per una (serve per mettere a punto pose e limiti). */
export type CellaLibera = {titolo: string; mosse?: Record<string, {ruota?: number; dx?: number; dy?: number; sx?: number; sy?: number}>; corpo?: {ruota?: number; dx?: number; dy?: number}; bocca?: number | null; occhi?: number | null; specchia?: boolean};

type Figure = Record<string, ConfigPupazzo & ConfigPersonaggio>;

function FoglioPupazzo({config, libere, ingrandimento = 1, figure = {}}: {config: ConfigPupazzo & ConfigPersonaggio; libere?: CellaLibera[]; ingrandimento?: number; figure?: Figure}) {
  const larghezza = 380 * ingrandimento;
  const k = larghezza / config.misure[0];
  const celle: {titolo: string; mosse: ReturnType<typeof atteggiamento>; bocca: string | null; occhi: string | null; specchia?: boolean}[] = [];
  const fermo = {mosse: {}, corpo: {ruota: 0, dx: 0, dy: 0, scalaY: 1}};
  // la seconda mano, se il personaggio ce l'ha su un livello suo: ogni posa si vede con lo stato che il kit le abbina
  const seconde = secondeDi(config);
  const NOMI_SECONDE: Record<string, string> = {aperta: 'mano aperta', alza: 'mano alzata', giu: 'mano giù'};
  const opzioni = {ampiezza: config.ampiezza ?? 1, pose: config.pose, limiti: config.limiti, seconde};
  // la faccia segue la bocca mostrata nella cella: bocca chiusa = mento su
  const conLabiale = (bocca: string | null) => {
    const livello = bocca ? (config.bocche ?? []).indexOf(bocca) : (config.bocche ?? []).length;
    const apertura = (config.bocche ?? []).length ? livello / ((config.bocche ?? []).length * 1.15) : 1;
    return mosseLabiale(config, {apertura, larghezza: 0.7});
  };
  if (libere) {
    for (const l of libere) {
      celle.push({
        titolo: l.titolo,
        mosse: {mosse: l.mosse ?? {}, corpo: {ruota: l.corpo?.ruota ?? 0, dx: l.corpo?.dx ?? 0, dy: l.corpo?.dy ?? 0, scalaY: 1}},
        bocca: l.bocca == null ? null : (config.bocche?.[l.bocca] ?? null),
        occhi: l.occhi == null ? null : (config.occhi?.[l.occhi] ?? null),
        specchia: l.specchia,
      });
    }
  }
  // le pose, ognuna arrivata fino in fondo
  for (const posa of libere ? [] : poseDi(config, figure)) {
    const seconda = seconde && posa !== 'dito' ? secondaAdatta(posa, Object.keys(seconde)) : undefined;
    const titolo = (NOMI_POSE[posa] ?? `posa "${posa}"`) + (seconda && seconda !== 'aperta' ? ` · ${NOMI_SECONDE[seconda] ?? seconda}` : '');
    celle.push({titolo, mosse: atteggiamento([], VUOTI, 5, {...opzioni, cambi: [{t: 0, posa, seconda}]}), bocca: posa === 'dito' ? null : (config.bocche?.[2] ?? null), occhi: null});
  }
  // gli stati della seconda mano, da soli sulla posa di partenza
  for (const s of libere || !seconde ? [] : Object.keys(seconde).filter((x) => x !== 'aperta')) {
    celle.push({titolo: `seconda mano: ${NOMI_SECONDE[s] ?? s}`, mosse: atteggiamento([], VUOTI, 5, {...opzioni, cambi: [{t: 0, posa: 'dito', seconda: s}]}), bocca: config.bocche?.[2] ?? null, occhi: null});
  }
  // i gesti, da soli, nel punto più spinto
  for (const g of libere ? [] : GESTI) {
    const {eventi, ora} = gestoAlMassimo(g);
    celle.push({titolo: NOMI[g] ?? g, mosse: atteggiamento(eventi, VUOTI, ora, opzioni), bocca: config.bocche?.[1] ?? null, occhi: null});
  }
  // il caso più difficile: posa più spinta e accento insieme
  if (!libere) celle.push({titolo: 'posa "alto" + accento', mosse: atteggiamento(gestoAlMassimo('batte').eventi.map((e) => ({...e, t: 4.6})), VUOTI, 4.6 + 0.2, {...opzioni, cambi: [{t: 0, posa: 'alto'}]}), bocca: config.bocche?.[1] ?? null, occhi: null});
  if (!libere) celle.push({titolo: 'posa "lato" + accento', mosse: atteggiamento(gestoAlMassimo('batte').eventi.map((e) => ({...e, t: 4.6})), VUOTI, 4.6 + 0.48, {...opzioni, cambi: [{t: 0, posa: 'lato'}]}), bocca: config.bocche?.[1] ?? null, occhi: null});
  const bocche = config.bocche ?? [];
  const occhi = config.occhi ?? [];
  if (!libere && bocche.length) celle.push({titolo: 'bocca chiusa', mosse: fermo, bocca: bocche[0], occhi: null});
  if (!libere && bocche.length > 2) celle.push({titolo: 'bocca a metà', mosse: fermo, bocca: bocche[Math.floor(bocche.length / 2)], occhi: null});
  if (!libere && occhi.length) celle.push({titolo: 'occhi chiusi', mosse: fermo, bocca: bocche[0] ?? null, occhi: occhi[occhi.length - 1]});
  if (!libere && config.specchio) celle.push({titolo: 'specchiato — la scritta resta dritta', mosse: fermo, bocca: bocche[0] ?? null, occhi: null, specchia: true});
  // una posa che è un'altra figura intera (le braccia conserte) si vede con quella figura, spostata come nel video
  const figuraDi = (c: (typeof celle)[number]) => {
    for (const [nome, d] of Object.entries(config.disegni ?? {})) {
      if (d.personaggio && figure[d.personaggio] && (c.mosse.disegni?.[nome] ?? 0) > 0.5) return {altra: figure[d.personaggio], dx: d.dx ?? 0, dy: d.dy ?? 0};
    }
    return null;
  };
  return (
    <>
      {celle.map((c) => {
        const f = figuraDi(c);
        return (
          <Cella key={c.titolo} titolo={c.titolo} ingrandimento={ingrandimento}>
            <div
              style={{
                transform: `translate(${c.mosse.corpo.dx * k}px, ${c.mosse.corpo.dy * k}px) rotate(${c.mosse.corpo.ruota}deg) scaleY(${c.mosse.corpo.scalaY})`,
                transformOrigin: '50% 100%',
              }}
            >
              {f ? (
                <div style={{position: 'relative', left: f.dx * k, top: f.dy * k}}>
                  <Pupazzo config={f.altra} larghezza={larghezza} mosse={mosseLabiale(f.altra, {apertura: 0.55, larghezza: 0.7})} bocca={c.bocca && f.altra.pezzi?.[c.bocca] ? c.bocca : null} occhi={null} specchia={c.specchia} />
                </div>
              ) : (
                <Pupazzo config={config} larghezza={larghezza} mosse={{...conLabiale(c.bocca), ...c.mosse.mosse}} bocca={c.bocca} occhi={c.occhi} specchia={c.specchia} disegni={c.mosse.disegni} />
              )}
            </div>
          </Cella>
        );
      })}
    </>
  );
}

function FoglioVettoriale() {
  const larghezza = 360;
  return (
    <>
      {POSE.map((posa) => (
        <Cella key={posa} titolo={`posa "${posa}"`}>
          <div style={{width: larghezza, height: larghezza / PROPORZIONE_DOTTORE}}>
            <Dottore larghezza={larghezza} ora={1.3} bocca={{apertura: 0.5, larghezza: 0.7}} chiusuraOcchi={0} energia={0.5} sopracciglia={0} sorriso={0.6} posaDa={posa} posaA={posa} passaggio={1} />
          </div>
        </Cella>
      ))}
    </>
  );
}

/** La figura da sola, su fondo trasparente: diventa la miniatura usata dal pannello. */
function Miniatura({config}: {config: ConfigPersonaggio}) {
  const larghezza = 320;
  const altezza = Math.round(config.tipo === 'pupazzo' ? (larghezza * config.misure[1]) / config.misure[0] : larghezza / PROPORZIONE_DOTTORE);
  return (
    <div id="figura" style={{width: larghezza, height: altezza, position: 'relative', overflow: 'hidden'}}>
      {config.tipo === 'pupazzo' ? (
        <Pupazzo config={config} larghezza={larghezza} mosse={{}} bocca={null} occhi={null} />
      ) : (
        <Dottore larghezza={larghezza} ora={1.3} bocca={{apertura: 0.35, larghezza: 0.8}} chiusuraOcchi={0} energia={0} sopracciglia={0} sorriso={0.8} posaDa="dito" posaA="dito" passaggio={1} />
      )}
    </div>
  );
}

export function avviaProva(config: ConfigPersonaggio, opzioni: {solo?: boolean; libere?: CellaLibera[]; ingrandimento?: number; colonne?: number; figure?: Figure} = {}) {
  const contenitore = document.getElementById('radice')!;
  const radice = createRoot(contenitore);
  const disegna = () =>
    flushSync(() =>
      radice.render(
        opzioni.solo ? (
          <Miniatura config={config} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${opzioni.colonne ?? 4}, ${520 * (opzioni.ingrandimento ?? 1)}px)`,
              gap: 16,
              padding: 20,
              background: '#05070a',
              width: (opzioni.colonne ?? 4) * 520 * (opzioni.ingrandimento ?? 1) + ((opzioni.colonne ?? 4) - 1) * 16,
            }}
          >
            {config.tipo === 'pupazzo' ? <FoglioPupazzo config={config} libere={opzioni.libere} ingrandimento={opzioni.ingrandimento} figure={opzioni.figure} /> : <FoglioVettoriale />}
          </div>
        )
      )
    );
  window.__prova = (async () => {
    await Promise.all(Array.from(document.fonts).map((f) => f.load().catch(() => undefined)));
    disegna();
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? undefined
          : new Promise<void>((fatto) => {
              img.addEventListener('load', () => fatto(), {once: true});
              img.addEventListener('error', () => fatto(), {once: true});
            })
      )
    );
    disegna();
  })();
}
