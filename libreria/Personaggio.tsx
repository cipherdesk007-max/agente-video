// FMLAB Reel Kit — il narratore in scena: dove sta, come si muove, quando parla.
// Le scene non lo disegnano: al massimo lo "dirigono" (vedi `dottore:` in scene.tsx). Se non dicono nulla,
// il kit sceglie da solo: gesti legati alle parole per i personaggi fatti da un'immagine (pupazzi),
// una posa nuova a ogni frase per il Dottore disegnato dal kit.
import {useMemo} from 'react';
import {useTempo} from './tempo';
import type {DatiReel} from './tempo';
import {Dottore, POSE} from './Dottore';
import type {Posa} from './Dottore';
import {MARGINE_PUPAZZO, Pupazzo, pezzoBocca, pezzoOcchi, mosseLabiale, scambioFigure, secondeDi} from './Pupazzo';
import type {ConfigPupazzo} from './Pupazzo';
import {atteggiamento} from './gesti';
import type {CambioPosa, EventoGesto, Gesto, RegiaGesti} from './gesti';
import {battitoDa, energiaVoce, enfasiOra, formaBocca, listaBattiti} from './bocca';
import {curve, limita, rampa} from './anim';
import {ingombroNarratore} from './impostazioni';
import type {ConfigPersonaggio, ImpostazioniNarratore} from './impostazioni';

/** Indicazioni di regia per il narratore, valide per una scena (o per tutto il reel). */
export type Regia = RegiaGesti & {
  /** false per toglierlo dalla scena. */
  mostra?: boolean;
  /** Solo per il Dottore disegnato dal kit. */
  umore?: 'neutro' | 'felice' | 'sorpreso';
};

/** I nomi delle pose del pupazzo, tradotti in quelle del Dottore disegnato dal kit. */
const COME_IL_DOTTORE: Record<string, Posa> = {alto: 'dito', lato: 'indica', aperto: 'spalle'};
function posaDottore(nome: string): Posa {
  if ((POSE as string[]).includes(nome)) return nome as Posa;
  const tradotta = COME_IL_DOTTORE[nome];
  if (!tradotta) throw new Error(`Regia del narratore: la posa "${nome}" non esiste. Pose: ${POSE.join(', ')}.`);
  return tradotta;
}

export type Cambio = {t: number; posa: Posa};

const GIRO: Posa[] = ['spalle', 'dito', 'pensa', 'indica', 'dito', 'spalle', 'indica', 'pensa'];

/** Scaletta delle pose del Dottore disegnato dal kit: quelle chieste dalle scene, più quelle scelte in automatico. */
export function scalettaPose(dati: DatiReel, regiaDi: (nomeScena: string) => Regia | undefined): Cambio[] {
  const cambi: Cambio[] = [];
  let giro = 0;
  dati.scene.forEach((scena, k) => {
    const regia = regiaDi(scena.nome);
    const ultima = k === dati.scene.length - 1;
    if (regia?.posa !== undefined) {
      if (typeof regia.posa === 'string') {
        cambi.push({t: scena.inizio, posa: posaDottore(regia.posa)});
      } else {
        for (const [quando, posa] of regia.posa) {
          const t = typeof quando === 'number' ? scena.inizio + quando : dati.segni[quando];
          if (typeof t !== 'number') throw new Error(`Regia del narratore: il segno [${quando}] non esiste nel copione.`);
          cambi.push({t: t - 0.08, posa: posaDottore(posa)});
        }
      }
      return;
    }
    // automatico: una posa nuova all'inizio di ogni frase della scena
    const parole = dati.parole.filter((p) => p.inizio >= scena.inizio - 0.25 && p.inizio < scena.fine - 0.25);
    let frase = -1;
    let ultimoCambio = -10;
    for (const p of parole) {
      if (p.frase === frase) continue;
      frase = p.frase;
      if (p.inizio - ultimoCambio < 1.4) continue;
      const testoFrase = dati.parole.filter((q) => q.frase === p.frase).map((q) => q.testo).join(' ');
      let posa: Posa;
      if (ultima) posa = /comment|scrivi|link|segui|follow/i.test(testoFrase) ? 'telefono' : 'saluta';
      else if (/\?["”»)]*$/.test(testoFrase)) posa = 'pensa';
      else posa = GIRO[giro++ % GIRO.length];
      if (cambi.length && cambi[cambi.length - 1].posa === posa && !ultima) posa = GIRO[giro++ % GIRO.length];
      cambi.push({t: Math.max(0, p.inizio - 0.1), posa});
      ultimoCambio = p.inizio;
    }
  });
  cambi.sort((a, b) => a.t - b.t);
  return cambi;
}

/** Posa di partenza, posa di arrivo e punto del passaggio all'istante `ora`. */
export function posaOra(cambi: Cambio[], ora: number): {da: Posa; a: Posa; passaggio: number; eta: number} {
  let k = -1;
  for (let i = 0; i < cambi.length; i++) {
    if (cambi[i].t <= ora) k = i;
    else break;
  }
  if (k < 0) return {da: 'base', a: 'base', passaggio: 1, eta: 99};
  const eta = ora - cambi[k].t;
  return {da: k > 0 ? cambi[k - 1].posa : 'base', a: cambi[k].posa, passaggio: rampa(eta, 0.36, curve.slancio), eta};
}

export type PropsPersonaggio = {
  /** Il personaggio scelto; null per un reel senza narratore. */
  config: ConfigPersonaggio | null;
  narratore: ImpostazioniNarratore;
  /** Pose del Dottore disegnato dal kit; pose e gesti dei pupazzi: le scalette di tutto il reel. */
  cambi: Cambio[];
  assetti: CambioPosa[];
  eventi: EventoGesto[];
  /** 0…1: quanto è in scena (0 = sceso sotto il bordo). */
  visibile: number;
  /** 0…1 */
  sorriso: number;
  sopracciglia: number;
  /** Tutti i personaggi del kit: servono per le pose che sono un altro disegno intero (le braccia conserte). */
  personaggi?: Record<string, ConfigPersonaggio>;
};

export function Personaggio({config, narratore, cambi, assetti, eventi, visibile, sorriso, sopracciglia, personaggi = {}}: PropsPersonaggio) {
  const tempo = useTempo();
  // le palpebre: una lista fissa per tutto il reel, con un battito in più a ogni cambio di posa
  const ciglia = useMemo(() => listaBattiti(tempo.dati.durata, [...assetti.map((c) => c.t + 0.14), ...cambi.map((c) => c.t + 0.1)]), [tempo.dati.durata, assetti, cambi]);
  const box = ingombroNarratore(config, narratore, tempo.larghezza, tempo.altezza);
  if (!config || !box) return null;
  const {parole} = tempo.dati;
  // entra dal basso nei primi istanti del reel (senza rimbalzo: non deve mai scoprire il bordo di sotto)
  const ingresso = rampa(tempo.ora - 0.1, 0.55, curve.esce);
  const quanto = visibile * ingresso;
  if (quanto <= 0.002) return null;

  const giu = (1 - quanto) * (tempo.altezza - box.y + 60);
  // se il bordo di sotto dell'immagine resta dentro il video (personaggio alzato), lo sfuma invece di tagliarlo
  const scoperto = box.y + box.altezza < tempo.altezza + 26;
  const sfumatura = scoperto ? 'linear-gradient(to bottom, #000 0%, #000 84%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.5) 92%, rgba(0,0,0,0.16) 96%, transparent 100%)' : undefined;
  const bocca = formaBocca(parole, tempo.ora);
  const chiusuraOcchi = battitoDa(ciglia, tempo.ora);
  const specchia = narratore.specchia;

  let figura;
  let trasformazione = '';
  if (config.tipo === 'pupazzo') {
    const k = box.larghezza / config.misure[0];
    const {mosse: gesti, corpo, disegni} = atteggiamento(eventi, tempo.dati, tempo.ora, {ampiezza: config.ampiezza ?? 1, cambi: assetti, pose: config.pose, limiti: config.limiti, seconde: secondeDi(config)});
    const mosse = {...gesti, ...mosseLabiale(config, bocca)};
    const verso = specchia ? -1 : 1;
    trasformazione = `translate(${(corpo.dx * k * verso).toFixed(2)}px, ${(corpo.dy * k).toFixed(2)}px) rotate(${(corpo.ruota * verso).toFixed(3)}deg) scaleY(${corpo.scalaY.toFixed(4)})`;
    // le pose che sono un'altra figura intera: stanno sempre caricate, si vedono solo quando tocca a loro
    const figure = Object.entries(config.disegni ?? {})
      .map(([nome, d]) => ({nome, d, altra: d.personaggio ? personaggi[d.personaggio] : undefined, peso: disegni?.[nome] ?? 0}))
      .filter((f): f is typeof f & {altra: ConfigPupazzo & ConfigPersonaggio} => f.altra?.tipo === 'pupazzo');
    const scambio = scambioFigure(Math.max(0, ...figure.map((f) => f.peso)));
    figura = (
      <>
        <div style={{opacity: scambio.sotto, visibility: scambio.sotto < 0.004 ? 'hidden' : undefined}}>
          <Pupazzo config={config} larghezza={box.larghezza} mosse={mosse} bocca={pezzoBocca(config, bocca.apertura)} occhi={pezzoOcchi(config, chiusuraOcchi)} specchia={specchia} sfumaFondo={scoperto} disegni={disegni} inScena={scambio.sotto >= 0.004} />
        </div>
        {figure.map(({nome, d, altra, peso}) => {
          const sopra = scambioFigure(peso).sopra;
          // la figura ha la sua testa e la sua bocca: stessi cenni, stesso labiale, nessun braccio da muovere
          const sue = {...atteggiamento(eventi, tempo.dati, tempo.ora, {ampiezza: altra.ampiezza ?? 1, pose: altra.pose, limiti: altra.limiti}).mosse, ...mosseLabiale(altra, bocca)};
          return (
            <div key={nome} style={{position: 'absolute', left: (d.dx ?? 0) * k * verso, top: (d.dy ?? 0) * k, opacity: sopra, visibility: sopra < 0.004 ? 'hidden' : undefined}}>
              <Pupazzo config={altra} larghezza={box.larghezza} mosse={sue} bocca={pezzoBocca(altra, bocca.apertura)} occhi={pezzoOcchi(altra, chiusuraOcchi)} specchia={specchia} sfumaFondo={scoperto} inScena={sopra >= 0.004} />
            </div>
          );
        })}
      </>
    );
  } else {
    const {da, a, passaggio} = posaOra(cambi, tempo.ora);
    trasformazione = specchia ? 'scaleX(-1)' : '';
    figura = (
      <Dottore
        larghezza={box.larghezza}
        ora={tempo.ora}
        bocca={bocca}
        chiusuraOcchi={chiusuraOcchi}
        energia={energiaVoce(parole, tempo.ora)}
        sopracciglia={limita(sopracciglia + enfasiOra(parole, tempo.ora) * 0.7)}
        sorriso={sorriso}
        posaDa={da}
        posaA={a}
        passaggio={passaggio}
        specchiato={specchia}
      />
    );
  }

  return (
    <div
      data-fmlab-personaggio={config.id}
      style={{position: 'absolute', left: box.x, top: box.y + giu, width: box.larghezza, height: box.altezza}}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: trasformazione || undefined,
          transformOrigin: '50% 100%',
          // il pupazzo sfuma da sé (il suo disegno esce un po' dal riquadro), il Dottore disegnato si sfuma qui
          WebkitMaskImage: config.tipo === 'vettoriale' ? sfumatura : undefined,
          maskImage: config.tipo === 'vettoriale' ? sfumatura : undefined,
        }}
      >
        {figura}
      </div>
    </div>
  );
}

export {POSE, MARGINE_PUPAZZO};
export type {Posa, Gesto};
