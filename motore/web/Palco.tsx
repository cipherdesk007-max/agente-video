// FMLAB Reel Kit — il palco: per un dato fotogramma mette insieme atmosfera, scene, narratore,
// sottotitoli e firma. Tra una scena e l'altra non si taglia: la camera "attraversa" e arriva.
import {Component, useMemo} from 'react';
import type {ReactNode} from 'react';
import {ScenaCtx, TempoCtx, creaScena, creaTempo} from '../../libreria/tempo';
import type {DatiReel, Scena, Tempo} from '../../libreria/tempo';
import type {AtmosferaScena, DefinizioneScena, Reel} from '../../libreria/reel';
import {Atmosfera} from '../../libreria/Atmosfera';
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
  return {tinta: a.tinta ?? stile.colori.foschia, densita: a.densita ?? 1, raggi: a.raggi ?? 0};
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

  // 'viaggio': la scena vecchia viene attraversata (si ingrandisce e svanisce), la nuova arriva da lontano
  const strati: {scena: Scena; opacita: number; scala: number}[] = [];
  if (precedente) {
    strati.push({
      scena: precedente,
      opacita: 1 - rampa(corrente.t, durata * 0.8, curve.entra),
      scala: (tipo === 'viaggio' ? mix(1, 1.7, curve.entra(p)) : 1) * respiro(precedente),
    });
  }
  strati.push({
    scena: corrente,
    opacita: indice > 0 && durata > 0 ? rampa(corrente.t - durata * 0.15, durata * 0.85, curve.esce) : 1,
    scala: (tipo === 'viaggio' ? mix(0.62, 1, p) : 1) * respiro(corrente),
  });

  // atmosfera, umore e presenza del narratore si mescolano durante il passaggio
  let aria = atmosferaDi(reel, corrente.nome);
  let stato = umore(regiaDi(reel, corrente.nome));
  if (precedente) {
    const a0 = atmosferaDi(reel, precedente.nome);
    const s0 = umore(regiaDi(reel, precedente.nome));
    aria = {tinta: miscela(a0.tinta, aria.tinta, p), densita: mix(a0.densita, aria.densita, p), raggi: mix(a0.raggi, aria.raggi, p)};
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
        <Atmosfera tinta={aria.tinta} densita={aria.densita} raggi={aria.raggi} />
        {strati.map(({scena, opacita, scala}) => {
          const Comp = parti(reel.scene[scena.nome]).componente;
          return (
            <ScenaCtx.Provider key={scena.nome} value={scena}>
              <div
                data-fmlab-scena={scena.nome}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: opacita,
                  transform: scala === 1 ? undefined : `scale(${scala.toFixed(4)})`,
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
        {reel.firma === false || !stile.firma.mostra ? null : <Firma />}
        <Personaggio config={config} narratore={narratore} cambi={cambi} assetti={assetti} eventi={eventi} visibile={stato.visibile} sorriso={stato.sorriso} sopracciglia={stato.sopracciglia} personaggi={personaggi} />
        {reel.sottotitoli === false ? null : <Sottotitoli />}
        {guide ? <Guide /> : null}
      </TempoCtx.Provider>
    </div>
  );
}
