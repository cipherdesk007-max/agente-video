// FMLAB Reel Kit — il palco: per un dato fotogramma mette insieme atmosfera, scene, narratore,
// sottotitoli e firma. Tra una scena e l'altra non si taglia: la camera "attraversa" e arriva.
import {Component, useMemo} from 'react';
import type {ReactNode} from 'react';
import {ScenaCtx, TempoCtx, creaScena, creaTempo} from '../../libreria/tempo';
import type {DatiReel, Scena, Tempo} from '../../libreria/tempo';
import type {AtmosferaScena, DefinizioneScena, Reel} from '../../libreria/reel';
import {Atmosfera, tramaFumo} from '../../libreria/Atmosfera';
import {Mondo, cameraMondo} from '../../libreria/Mondo';
import type {NomeLuogo, Verso} from '../../libreria/Mondo';
import {Protagonista, STATO_BASE, statoProtagonista} from '../../libreria/Protagonista';
import {Firma, Guide} from '../../libreria/Firma';
import {Sottotitoli} from '../../libreria/Sottotitoli';
import {Personaggio, scalettaPose} from '../../libreria/Personaggio';
import type {Regia} from '../../libreria/Personaggio';
import {scalettaAssetti, scalettaGesti} from '../../libreria/gesti';
import {poseDi, secondeDi} from '../../libreria/Pupazzo';
import {IMPOSTAZIONI_BASE, ingombroNarratore} from '../../libreria/impostazioni';
import type {ConfigPersonaggio, Impostazioni} from '../../libreria/impostazioni';
import {curve, mix, rampa} from '../../libreria/anim';
import {miscela} from '../../libreria/colore';
import {stile} from '../../stile/stile';

/** Durata del passaggio tra una scena e la successiva, in secondi. */
const PASSAGGIO = 0.5;
/** Di quanto la camera si avvicina lungo una scena (0.012 = 1,2%). */
const RESPIRO = 0.012;

/**
 * I movimenti di camera dentro una scena, dall'inizio alla fine della scena: scala, spostamento (pixel) e giro (gradi).
 * 'spinta' si avvicina, 'indietro' si allontana, 'destra'/'sinistra' carrellano (la scena scorre dall'altra parte),
 * 'sale'/'scende' come una gru, 'gira' ruota di poco attorno al centro, 'ferma' lascia solo il respiro.
 * La scena non diventa mai più grande di come è disegnata (scala al più 1): così niente esce dalle zone sicure.
 */
const MOVIMENTI: Record<string, {scala: [number, number]; x: [number, number]; y: [number, number]; giro: [number, number]}> = {
  ferma: {scala: [1, 1], x: [0, 0], y: [0, 0], giro: [0, 0]},
  spinta: {scala: [0.92, 1], x: [0, 0], y: [0, 0], giro: [0, 0]},
  indietro: {scala: [1, 0.92], x: [0, 0], y: [0, 0], giro: [0, 0]},
  destra: {scala: [0.95, 0.95], x: [26, -26], y: [0, 0], giro: [0, 0]},
  sinistra: {scala: [0.95, 0.95], x: [-26, 26], y: [0, 0], giro: [0, 0]},
  sale: {scala: [0.95, 0.95], x: [0, 0], y: [-20, 20], giro: [0, 0]},
  scende: {scala: [0.95, 0.95], x: [0, 0], y: [20, -20], giro: [0, 0]},
  gira: {scala: [0.93, 0.96], x: [-12, 12], y: [0, 0], giro: [-1.6, 1.6]},
};

declare global {
  interface Window {
    __fmlabErrore?: {scena?: string; errore: string} | null;
  }
}

function segnala(scena: string | undefined, errore: unknown) {
  const messaggio = errore instanceof Error ? errore.message : String(errore);
  if (!window.__fmlabErrore) window.__fmlabErrore = {scena, errore: messaggio};
}

class Confine extends Component<{nome: string; children: ReactNode}, {errore: string | null}> {
  state = {errore: null as string | null};
  static getDerivedStateFromError(errore: unknown) {
    return {errore: errore instanceof Error ? errore.message : String(errore)};
  }
  componentDidCatch(errore: unknown) {
    segnala(this.props.nome, errore);
  }
  render() {
    if (this.state.errore) return <Avviso testo={`Errore nella scena "${this.props.nome}": ${this.state.errore}`} />;
    return this.props.children;
  }
}

function Avviso({testo}: {testo: string}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 620,
        padding: 36,
        borderRadius: 28,
        background: 'rgba(255,60,80,0.92)',
        color: '#fff',
        fontFamily: stile.font.testo,
        fontWeight: 600,
        fontSize: 38,
        lineHeight: 1.25,
      }}
    >
      {testo}
    </div>
  );
}

function parti(def: DefinizioneScena | undefined) {
  if (!def) return {componente: null, dottore: undefined as Regia | undefined, atmosfera: undefined as AtmosferaScena | undefined};
  if (typeof def === 'function') return {componente: def, dottore: undefined, atmosfera: undefined};
  return {componente: def.componente, dottore: def.dottore, atmosfera: def.atmosfera};
}

function atmosferaDi(reel: Reel, nome: string) {
  const a = {...(reel.atmosfera ?? {}), ...(parti(reel.scene[nome]).atmosfera ?? {})};
  return {tinta: a.tinta ?? stile.colori.foschia, densita: a.densita ?? 1, raggi: a.raggi ?? 0, luogo: (a.luogo ?? 'vuoto') as NomeLuogo};
}

function regiaDi(reel: Reel, nome: string): Regia {
  return {...(reel.dottore ?? {}), ...(parti(reel.scene[nome]).dottore ?? {})};
}

function umore(regia: Regia) {
  const u = regia.umore ?? 'neutro';
  return {
    visibile: regia.mostra === false ? 0 : 1,
    sorriso: u === 'felice' ? 1 : u === 'sorpreso' ? 0.25 : 0.55,
    sopracciglia: u === 'sorpreso' ? 0.9 : 0,
  };
}

export type PropsPalco = {
  reel: Reel;
  dati: DatiReel;
  slug: string;
  frame: number;
  guide?: boolean;
  /** Le scelte del reel (narratore, stile) e i personaggi disponibili. */
  impostazioni?: Impostazioni;
  personaggi?: Record<string, ConfigPersonaggio>;
};

export function Palco({reel, dati, slug, frame, guide = false, impostazioni = IMPOSTAZIONI_BASE, personaggi = {}}: PropsPalco) {
  const narratore = impostazioni.narratore;
  const config = narratore.chi === 'nessuno' ? null : (personaggi[narratore.chi] ?? null);
  const tempo: Tempo = creaTempo(dati, slug, frame, {impostazioni, narratore: ingombroNarratore(config, narratore)});
  const elenco = dati.scene;

  const {cambi, assetti, eventi} = useMemo(() => {
    try {
      const regiaScene = (nome: string) => regiaDi(reel, nome);
      const pupazzo = config?.tipo === 'pupazzo' ? config : null;
      const seconde = Object.keys(secondeDi(pupazzo) ?? {});
      // seconda mano sempre nello stesso stato, se il reel lo chiede (e se una scena non dice altro)
      const fissa = narratore.mano2 && narratore.mano2 !== 'auto' && seconde.includes(narratore.mano2) ? narratore.mano2 : undefined;
      const regia = fissa ? (nome: string) => ({...(regiaScene(nome) ?? {}), seconda: regiaScene(nome)?.seconda ?? fissa}) : regiaScene;
      return {
        cambi: config?.tipo === 'vettoriale' ? scalettaPose(dati, regia) : [],
        assetti: pupazzo ? scalettaAssetti(dati, regia, poseDi(pupazzo, personaggi), seconde) : [],
        eventi: pupazzo ? scalettaGesti(dati, regia) : [],
      };
    } catch (e) {
      segnala(undefined, e);
      return {cambi: [], assetti: [], eventi: []};
    }
  }, [dati, reel, config, narratore.mano2]);

  let indice = elenco.findIndex((s, k) => tempo.ora >= s.inizio && (tempo.ora < s.fine || k === elenco.length - 1));
  if (indice < 0) indice = 0;
  const corrente = creaScena(tempo, indice);
  const tipo = reel.transizione ?? 'viaggio';
  const durata = tipo === 'taglio' ? 0 : PASSAGGIO;
  const p = indice > 0 && durata > 0 ? rampa(corrente.t, durata, curve.morbida) : 1;
  const precedente = indice > 0 && p < 1 ? creaScena(tempo, indice - 1) : null;

  // la camera non sta mai ferma: durante ogni scena si avvicina di un niente (non abbastanza da spostare le scritte)
  const respiro = (scena: Scena) => (reel.respiro === false ? 1 : 1 + RESPIRO * scena.avanzamento);

  // l'inquadratura della scena: quanto è larga (campo) e come si muove la camera mentre la scena dura.
  // Ogni scena è una ripresa con un movimento che ha un nome: mai un palco fermo con le scritte sopra.
  const inquadra = (scena: Scena): {scala: number; x: number; y: number; giro: number} => {
    const def = reel.scene[scena.nome];
    const scelte = def && typeof def === 'object' && 'componente' in def ? def : null;
    const base = scelte?.campo === 'largo' ? 0.9 : scelte?.campo === 'stretto' ? 1 : scelte?.campo === 'medio' ? 0.95 : 1;
    const a = scena.avanzamento;
    const m = MOVIMENTI[scelte?.camera ?? 'ferma'] ?? MOVIMENTI.ferma;
    return {scala: base * mix(m.scala[0], m.scala[1], a), x: mix(m.x[0], m.x[1], a), y: mix(m.y[0], m.y[1], a), giro: mix(m.giro[0], m.giro[1], a)};
  };

  // da che parte si entra nella scena di adesso: 'avanti' attraversa quella prima, gli altri sono carrellate
  const versoDi = (nome: string): Verso => {
    const def = reel.scene[nome];
    return (def && typeof def === 'object' && 'componente' in def ? def.entra : undefined) ?? 'avanti';
  };
  const verso = versoDi(corrente.nome);
  const lato: Record<Verso, [number, number]> = {avanti: [0, 0], sinistra: [-1, 0], destra: [1, 0], alto: [0, -1], basso: [0, 1]};
  const [lx, ly] = lato[verso];
  const corsa = (k: number) => (tipo === 'viaggio' && verso !== 'avanti' ? {x: lx * k * tempo.larghezza * 0.9, y: ly * k * tempo.altezza * 0.5} : {x: 0, y: 0});

  // 'viaggio': la scena vecchia viene attraversata (si ingrandisce, si sfoca e svanisce), la nuova arriva da lontano
  // e si mette a fuoco. Con una carrellata la vecchia esce da un lato e la nuova entra dall'altro.
  const strati: {scena: Scena; opacita: number; scala: number; sposta: {x: number; y: number}; sfoca: number; giro?: number}[] = [];
  if (precedente) {
    const k = curve.entra(p);
    strati.push({
      scena: precedente,
      opacita: 1 - rampa(corrente.t, durata * 0.8, curve.entra),
      scala: (tipo === 'viaggio' && verso === 'avanti' ? mix(1, 2.3, k) : 1) * respiro(precedente),
      sposta: corsa(-k),
      sfoca: tipo === 'viaggio' ? 14 * k : 0,
    });
  }
  strati.push({
    scena: corrente,
    opacita: indice > 0 && durata > 0 ? rampa(corrente.t - durata * 0.15, durata * 0.85, curve.esce) : 1,
    scala: (tipo === 'viaggio' && verso === 'avanti' ? mix(0.55, 1, p) : 1) * respiro(corrente),
    sposta: corsa(1 - p),
    sfoca: tipo === 'viaggio' && p < 1 ? 10 * (1 - p) : 0,
  });

  // la camera del mondo: viaggia sempre, scatta a ogni cambio di scena, dà una spinta a ogni segno
  const {inizi, segni} = useMemo(
    () => ({inizi: elenco.map((s) => ({t: s.inizio, verso: versoDi(s.nome)})), segni: [...new Set(Object.values(dati.segni))].sort((a, b) => a - b)}),
    [dati, reel]
  );
  // il mondo dietro segue il movimento di camera della scena, più forte di lei: è la parallasse che dà profondità
  const viaggio = cameraMondo(tempo.ora, inizi, segni, durata || PASSAGGIO);
  const q0 = inquadra(corrente);
  const camera = {x: viaggio.x - q0.x * 5, y: viaggio.y - q0.y * 5, spinta: viaggio.spinta + (q0.scala - 0.95) * 4};

  // il protagonista: un solo oggetto per tutto il reel, sopra le scene. Resta mentre intorno cambia tutto.
  const statoProt = reel.protagonista
    ? statoProtagonista(
        tempo.ora,
        {...STATO_BASE, colore: reel.protagonista.colore ?? stile.colori.luce},
        elenco.map((s) => {
          const def = reel.scene[s.nome];
          return {inizio: s.inizio, stati: def && typeof def === 'object' && 'componente' in def ? def.protagonista : undefined};
        }),
        dati.segni,
        (durata || PASSAGGIO) * 1.3
      )
    : null;

  // atmosfera, umore e presenza del narratore si mescolano durante il passaggio
  let aria = atmosferaDi(reel, corrente.nome);
  let luogoPrima: NomeLuogo | undefined;
  let stato = umore(regiaDi(reel, corrente.nome));
  if (precedente) {
    const a0 = atmosferaDi(reel, precedente.nome);
    const s0 = umore(regiaDi(reel, precedente.nome));
    luogoPrima = a0.luogo;
    aria = {tinta: miscela(a0.tinta, aria.tinta, p), densita: mix(a0.densita, aria.densita, p), raggi: mix(a0.raggi, aria.raggi, p), luogo: aria.luogo};
    stato = {visibile: mix(s0.visibile, stato.visibile, p), sorriso: mix(s0.sorriso, stato.sorriso, p), sopracciglia: mix(s0.sopracciglia, stato.sopracciglia, p)};
  }

  return (
    <div
      style={{
        position: 'relative',
        width: tempo.larghezza,
        height: tempo.altezza,
        overflow: 'hidden',
        background: stile.colori.fondo,
        color: stile.colori.testo,
        fontFamily: stile.font.testo,
        fontWeight: 600,
      }}
    >
      <TempoCtx.Provider value={tempo}>
        {reel.mondo === false ? (
          <Atmosfera tinta={aria.tinta} densita={aria.densita} raggi={aria.raggi} />
        ) : (
          <Mondo tinta={aria.tinta} densita={aria.densita} raggi={aria.raggi} camera={camera} luogo={aria.luogo} avanzamento={corrente.avanzamento} luogoPrima={luogoPrima} passaggio={p} verso={verso} fumo={tramaFumo()} />
        )}
        {strati.map(({scena, opacita, scala: scalaPassaggio, sposta: spostaPassaggio, sfoca}) => {
          const Comp = parti(reel.scene[scena.nome]).componente;
          const q = inquadra(scena);
          const scala = scalaPassaggio * q.scala;
          const sposta = {x: spostaPassaggio.x + q.x, y: spostaPassaggio.y + q.y};
          return (
            <ScenaCtx.Provider key={scena.nome} value={scena}>
              <div
                data-fmlab-scena={scena.nome}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: opacita,
                  transform: scala === 1 && !sposta.x && !sposta.y && !q.giro ? undefined : `translate(${sposta.x.toFixed(1)}px, ${sposta.y.toFixed(1)}px) scale(${scala.toFixed(4)})${q.giro ? ` rotate(${q.giro.toFixed(3)}deg)` : ''}`,
                  filter: sfoca > 0.3 ? `blur(${sfoca.toFixed(1)}px)` : undefined,
                  transformOrigin: `${stile.palco.centroX}px ${stile.palco.centroY}px`,
                }}
              >
                {Comp ? (
                  <Confine nome={scena.nome}>
                    <Comp />
                  </Confine>
                ) : (
                  <Avviso testo={`La scena "${scena.nome}" è nel copione ma manca in scene.tsx`} />
                )}
              </div>
            </ScenaCtx.Provider>
          );
        })}
        {reel.protagonista && statoProt ? <Protagonista def={reel.protagonista} stato={statoProt} /> : null}
        {reel.firma === false || !stile.firma.mostra ? null : <Firma />}
        <Personaggio config={config} narratore={narratore} cambi={cambi} assetti={assetti} eventi={eventi} visibile={stato.visibile} sorriso={stato.sorriso} sopracciglia={stato.sopracciglia} personaggi={personaggi} />
        {reel.sottotitoli === false ? null : <Sottotitoli />}
        {guide ? <Guide /> : null}
      </TempoCtx.Provider>
    </div>
  );
}
