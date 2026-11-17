// FMLAB Reel Kit — la regia del narratore fatto da un'immagine: pose e gesti.
//
// Dal copione (parole, frasi, *enfasi*, [segni], scene) nascono due scalette:
//   · le POSE: come sta (dito alzato, dito in alto, dito al mento, braccio di lato, mano aperta…). Cambia a ogni frase;
//   · la SECONDA MANO: se il personaggio ha anche l'altro avambraccio su un livello suo, a ogni posa quella mano
//     prende uno stato suo (aperta com'è nel disegno, alzata, giù lungo il fianco), così non resta mai ferma;
//   · i GESTI: piccoli movimenti sopra la posa (accento sulla parola, cenno del capo, "no" con la testa…).
//
// Come sono pensati i movimenti (sono le regole di chi anima a mano):
//   · pochi gesti, leggibili: ognuno ha preparazione, colpo, tenuta e ritorno, mai uno scatto;
//   · il colpo cade SULLA parola: la preparazione comincia un quarto di secondo prima;
//   · tra un gesto e l'altro c'è una pausa: il personaggio respira e basta;
//   · il corpo partecipa: quando il braccio sale il busto si sporge e la testa accompagna;
//   · le parti non si muovono insieme: la mano segue il braccio con un filo di ritardo, la testa segue il corpo.
// Sono tutte funzioni pure: stesso copione, stessi movimenti, a ogni render.
import type {DatiReel, Parola} from './tempo';
import type {Mossa, Mosse} from './maglia';
import {curve, impulso, limita, onda, rampa} from './anim';
import {energiaVoce} from './bocca';

// ───────────────────────── pose ─────────────────────────

/**
 * Le pose che il kit ricava da una sola immagine, spostando braccio, mani, testa e busto.
 * Un personaggio con il braccio su un livello suo ne può avere altre (`pensa`, `presenta`): le scrive in
 * personaggio.json, alla voce "pose", e il kit le usa da solo.
 */
export type PosaPupazzo =
  /** L'immagine com'è. */
  | 'dito'
  /** Il dito sale dritto, vicino al viso: "attenzione". */
  | 'alto'
  /** Il braccio si apre di lato e si abbassa: accompagna, presenta. */
  | 'lato'
  /** La mano aperta sale, la testa si inclina: "ecco", "guarda". */
  | 'aperto';

export const POSE_PUPAZZO: PosaPupazzo[] = ['dito', 'alto', 'lato', 'aperto'];

/**
 * Le parti che pose e gesti muovono. `spalla`, `viso` e `braccio2` (l'altro avambraccio, con la mano aperta)
 * ci sono solo nei personaggi che hanno quelle ossa.
 */
const PARTI = ['testa', 'viso', 'spalla', 'braccio', 'mano', 'palmo', 'braccio2'] as const;
type Parte = (typeof PARTI)[number];

/**
 * Di quanto ogni parte si sposta in una posa, rispetto all'immagine.
 * `disegno` = nome di una posa disegnata del personaggio ("disegni" in personaggio.json): finché la posa dura,
 * quel disegno prende il posto dei livelli che nasconde (per esempio le braccia conserte al posto dei due avambracci).
 */
export type Assetto = Partial<Record<Parte, Mossa>> & {corpo?: {ruota?: number; dx?: number; dy?: number}; disegno?: string};

/** Le pose di serie. Un personaggio può ritoccarle (o aggiungerne) in personaggio.json, alla voce "pose". */
export const ASSETTI: Record<string, Assetto> = {
  dito: {},
  alto: {braccio: {ruota: 22}, mano: {ruota: 7}, spalla: {ruota: 1.2}, testa: {ruota: -3.5}, viso: {dx: -3}, palmo: {ruota: -3, dy: 8}, corpo: {ruota: -1.1, dx: -4}},
  lato: {braccio: {ruota: -24}, mano: {ruota: -9}, spalla: {ruota: 1.5}, testa: {ruota: -4.5, dx: -3}, viso: {dx: -5}, palmo: {ruota: 3, dy: -6}, corpo: {ruota: -1.8, dx: -8}},
  aperto: {braccio: {ruota: -11}, mano: {ruota: -4}, palmo: {ruota: 10, dx: -8, dy: -22}, testa: {ruota: 5}, viso: {dx: 3}, corpo: {ruota: 1.1, dx: 4}},
};

/** Oltre questi angoli (in gradi) l'immagine si deforma male. Un personaggio con i livelli può allargarli ("limiti"). */
export type Limiti = Partial<Record<Parte, [number, number]>>;
export const LIMITI: Record<'braccio' | 'mano' | 'palmo' | 'testa' | 'spalla' | 'braccio2', [number, number]> = {
  braccio: [-34, 30],
  mano: [-16, 14],
  palmo: [-8, 22],
  testa: [-9, 9],
  spalla: [-4, 4],
  braccio2: [-8, 8],
};

/**
 * Nomi di pose che un personaggio può non avere, con quella che prende il loro posto (vale anche per le pose
 * del Dottore disegnato dal kit: così la stessa regia funziona con qualsiasi narratore).
 */
const SINONIMI: Record<string, string[]> = {
  base: ['dito'],
  indica: ['lato'],
  spalle: ['aperto'],
  pensa: ['aperto'],
  presenta: ['lato'],
  saluta: ['alto'],
  telefono: ['alto'],
  conserte: ['pensa', 'aperto'],
};
/** L'ordine in cui il kit alterna le pose quando nessuna regola ne sceglie una. */
const GIRO_POSE = ['dito', 'aperto', 'lato', 'pensa', 'alto', 'presenta', 'conserte'];

/**
 * Pose che a guardarle sono quasi la stessa: il braccio si sposta di una decina di gradi e basta (presenta e lato,
 * lato e aperto, aperto e dito). Una dopo l'altra non sono un cambio di posa: il narratore sembra fermo, e il metro
 * lo conta fermo. Dopo una posa non si sceglie mai una sua vicina.
 */
const VICINE: Record<string, string[]> = {presenta: ['lato'], lato: ['presenta', 'aperto'], aperto: ['lato', 'dito'], dito: ['aperto']};
export const poseVicine = (a: string, b: string): boolean => a === b || (VICINE[a] ?? []).includes(b);

/** `seconda` = lo stato dell'altra mano scelto insieme a questa posa (solo per i personaggi che ce l'hanno). */
export type CambioPosa = {t: number; posa: string; seconda?: string};

/**
 * Gli stati della seconda mano che vanno d'accordo con ogni posa, in ordine di preferenza. Quando il braccio
 * che parla è alto o al mento, l'altra mano scende lungo il fianco; quando presenta, l'altra accompagna.
 */
const SECONDE: Record<string, string[]> = {
  dito: ['giu', 'aperta'],
  alto: ['giu', 'aperta'],
  pensa: ['giu'],
  lato: ['aperta', 'alza'],
  presenta: ['alza', 'aperta'],
  aperto: ['alza', 'aperta'],
  conserte: ['aperta'],
};
/** Lo stato della seconda mano che il kit preferisce per una posa (il primo adatto tra quelli che il personaggio ha). */
export function secondaAdatta(posa: string, seconde: string[]): string | undefined {
  return (SECONDE[posa] ?? []).find((s) => seconde.includes(s)) ?? seconde[0];
}
/** La seconda mano arriva un attimo dopo il braccio che parla: le parti non si muovono mai insieme. */
const RITARDO_SECONDA = 0.16;
/** Quanto si tiene, al minimo, una posa prima di cambiarla (secondi). */
export const TENUTA = 1.1;

// ───────────────────────── gesti ─────────────────────────

export type Gesto =
  /** Alza un po' il dito verso il palco e lo tiene: "guarda qui". Solo se lo chiedi nella regia. */
  | 'indica'
  /** Accento: il dito si prepara e batte in avanti sulla parola. Sulle *enfasi*. */
  | 'batte'
  /** La mano aperta sale e accompagna il discorso. Nelle frasi lunghe. */
  | 'spiega'
  /** Un cenno del capo. A fine frase. */
  | 'annuisce'
  /** Testa inclinata e mano aperta che sale. Sulle domande. */
  | 'domanda'
  /** La testa fa "no", piano. Sulle negazioni. */
  | 'nega'
  /** Dito in alto, tenuto, con un piccolo slancio. Sull'invito finale. */
  | 'saluta'
  /** Si volta appena verso il palco: sta guardando quello che è comparso. Sui [segni]. */
  | 'guarda';

export const GESTI: Gesto[] = ['indica', 'batte', 'spiega', 'annuisce', 'domanda', 'nega', 'saluta', 'guarda'];

export type EventoGesto = {t: number; gesto: Gesto; forza: number; durata: number};

export type RegiaGesti = {
  /**
   * Gesti del narratore in questa scena.
   *   - niente: li sceglie il kit, parola per parola
   *   - false: solo respiro, labiale e ciglia
   *   - una lista: [['segno', 'batte'], [2.5, 'spiega']] (nome di un segno, oppure secondi dall'inizio della scena)
   */
  gesti?: false | [string | number, Gesto][];
  /**
   * Posa del narratore in questa scena: una sola ('alto') oppure una lista di cambi [['km', 'alto'], [3, 'lato']].
   * Se manca, il kit ne sceglie una nuova a ogni frase.
   */
  posa?: string | [string | number, string][];
  /** Stato dell'altra mano per tutta la scena ('aperta', 'alza', 'giu'), per i personaggi che ce l'hanno. Se manca, sceglie il kit. */
  seconda?: string;
};

const DURATA: Record<Gesto, number> = {indica: 1.9, batte: 0.95, spiega: 2.3, annuisce: 0.75, domanda: 1.7, nega: 1.05, saluta: 2.1, guarda: 1.05};
/** Di quanto il gesto comincia PRIMA dell'istante a cui è agganciato (è la preparazione). */
const ANTICIPO: Record<Gesto, number> = {indica: 0.3, batte: 0.27, spiega: 0, annuisce: 0.05, domanda: 0, nega: 0.1, saluta: 0.3, guarda: 0.15};
const PRIORITA: Record<Gesto, number> = {saluta: 5, domanda: 4, indica: 3.5, nega: 3, batte: 2, annuisce: 1.5, spiega: 1.2, guarda: 1};
const CANALI: Record<Gesto, string[]> = {
  indica: ['braccio'],
  saluta: ['braccio'],
  batte: ['braccio'],
  nega: ['testa'],
  annuisce: ['testa'],
  guarda: ['testa'],
  domanda: ['testa', 'palmo'],
  spiega: ['palmo'],
};
/** Per quanto tempo un gesto "occupa" il suo canale: è anche la pausa minima prima del gesto successivo. */
function occupa(e: EventoGesto): number {
  if (e.gesto === 'indica') return e.durata * 0.7;
  if (e.gesto === 'batte') return 1.6;
  if (e.gesto === 'annuisce') return 1.4;
  if (e.gesto === 'guarda') return 1.2;
  return e.durata + 0.2;
}

const NEGAZIONI: Record<string, RegExp> = {
  it: /^(non|no|mai|niente|nessun[oa']?|senza|nulla|neanche|nemmeno|neppure)$/,
  en: /^(not|no|never|nothing|none|without|don't|doesn't|didn't|isn't|aren't|can't|cannot|won't)$/,
  es: /^(no|nunca|nada|ning[uú]n[oa]?|sin|jam[aá]s|tampoco)$/,
  fr: /^(ne|n'|pas|non|jamais|rien|aucun[e]?|sans)$/,
  de: /^(nicht|nein|nie|niemals|nichts|kein[e]?[nmrs]?|ohne)$/,
  pt: /^(n[aã]o|nunca|nada|nenhum[a]?|sem|jamais)$/,
};
const INVITI = /^(comment|coment|scriv|link|segui|follow|salva|save|condivid|share|iscriv|subscribe|sigue|suscr)/;
/** Parole con cui una frase "frena" quello che è stato appena detto. */
const FRENI = /^(ma|però|pero|eppure|tuttavia|but|however|yet|mais|pourtant|aber|doch|sin embargo|porém|mas)$/;

const pulita = (testo: string) => testo.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

type Frase = {indice: number; inizio: number; fine: number; parole: Parola[]; domanda: boolean};

function frasiDi(parole: Parola[]): Frase[] {
  const frasi: Frase[] = [];
  for (const p of parole) {
    let f = frasi[frasi.length - 1];
    if (!f || f.indice !== p.frase) {
      f = {indice: p.frase, inizio: p.inizio, fine: p.fine, parole: [], domanda: false};
      frasi.push(f);
    }
    f.parole.push(p);
    f.fine = p.fine;
  }
  for (const f of frasi) f.domanda = /\?["”»)]*$/.test(f.parole[f.parole.length - 1]?.testo ?? '');
  return frasi;
}

const istante = (dati: DatiReel, scena: {inizio: number}, quando: string | number): number => {
  const t = typeof quando === 'number' ? scena.inizio + quando : dati.segni[quando];
  if (typeof t !== 'number') throw new Error(`Regia del narratore: il segno [${quando}] non esiste nel copione.`);
  return t;
};

/** La scaletta delle pose: una nuova a ogni frase (mai due uguali di fila), oppure quelle chieste dalla regia. */
export function scalettaAssetti(dati: DatiReel, regiaDi: (nomeScena: string) => RegiaGesti | undefined, disponibili: string[] = POSE_PUPAZZO, seconde: string[] = []): CambioPosa[] {
  const cambi: CambioPosa[] = [];
  // la seconda mano: tra gli stati adatti alla posa, quello che manca da più tempo
  const usoSeconda: Record<string, number> = {};
  let contaSeconde = 0;
  const secondaPer = (posa: string, voluta?: string): string | undefined => {
    if (!seconde.length) return undefined;
    if (voluta !== undefined) {
      if (!seconde.includes(voluta)) throw new Error(`Regia del narratore: la seconda mano non ha lo stato "${voluta}". Stati: ${seconde.join(', ')}.`);
      return voluta;
    }
    const adatte = (SECONDE[posa] ?? seconde).filter((s) => seconde.includes(s));
    const lista = adatte.length ? adatte : seconde;
    const scelta = lista.reduce((migliore, s) => ((usoSeconda[s] ?? -1) < (usoSeconda[migliore] ?? -1) ? s : migliore), lista[0]);
    usoSeconda[scelta] = contaSeconde++;
    return scelta;
  };
  const frasi = frasiDi(dati.parole);
  const negazione = NEGAZIONI[(dati.lingua ?? 'it').slice(0, 2)] ?? NEGAZIONI.it;
  const nota = (nome: string) => (disponibili.includes(nome) ? nome : ((SINONIMI[nome] ?? []).find((p) => disponibili.includes(p)) ?? null));
  const alterna = GIRO_POSE.filter((p) => disponibili.includes(p));
  if (!alterna.length) alterna.push(disponibili[0] ?? 'dito');
  // quando è stata usata l'ultima volta ogni posa: tra quelle adatte al momento si prende quella che manca da più tempo,
  // così in un reel lungo si vedono tutte e nessuna torna troppo spesso
  const ultimoUso: Record<string, number> = {};
  let conta = 0;
  const scegli = (adatte: string[], precedente: string): string => {
    const candidate = [...new Set(adatte.map((p) => nota(p)).filter((p): p is string => !!p))];
    // all'inizio del reel non c'è una posa di prima da cui allontanarsi: basta non restare com'è
    const vicina = (p: string) => (cambi.length ? poseVicine(p, precedente) : p === precedente);
    const libere = candidate.filter((p) => !vicina(p));
    const lontane = libere.length ? libere : alterna.filter((p) => !vicina(p));
    const tra = lontane.length ? lontane : [...candidate, ...alterna].filter((p) => p !== precedente);
    const lista = tra.length ? tra : candidate.length ? candidate : alterna;
    return lista.reduce((migliore, p) => ((ultimoUso[p] ?? -1) < (ultimoUso[migliore] ?? -1) ? p : migliore), lista[0]);
  };
  dati.scene.forEach((scena, k) => {
    const regia = regiaDi(scena.nome);
    // Una posa chiesta dalla regia con il suo nome è la posa "di casa" della scena: la scena comincia così e ci
    // torna, ma tra un ritorno e l'altro il narratore continua a muoversi (tenere una posa per tutta una scena lo
    // lascia fermo otto secondi). Una lista di pose con i loro momenti, invece, è presa alla lettera.
    let casa: string | null = null;
    if (regia?.posa !== undefined) {
      const voci: [string | number, string][] = typeof regia.posa === 'string' ? [[0, regia.posa]] : regia.posa;
      for (const [quando, nome] of voci) {
        const posa = nota(nome);
        if (!posa) throw new Error(`Regia del narratore: la posa "${nome}" non esiste. Pose: ${disponibili.join(', ')}.`);
        cambi.push({t: Math.max(0, istante(dati, scena, quando) - 0.25), posa, seconda: secondaPer(posa, regia.seconda)});
        ultimoUso[posa] = conta++;
        casa = posa;
      }
      if (typeof regia.posa !== 'string') return;
    }
    const ultima = k === dati.scene.length - 1;
    const dentro = (t: number) => t >= scena.inizio - 0.05 && t < scena.fine - 0.05;
    let ultimoCambio = casa ? scena.inizio : cambi.length ? cambi[cambi.length - 1].t : -10;
    // Gli spunti per cambiare posa: l'inizio di ogni frase, e dentro la frase l'inizio di ogni inciso (dopo una
    // virgola, due punti, punto e virgola) e ogni segno della regia (lì sul palco compare qualcosa: il narratore lo
    // accompagna). Nei reel di riferimento il narratore cambia gesto ogni secondo e mezzo circa: una posa per frase
    // lo lasciava fermo tre volte tanto.
    const segniScena = Object.values(dati.segni ?? {}).filter((t): t is number => typeof t === 'number' && dentro(t));
    type Spunto = Frase & {dentro: boolean; invito: boolean};
    const spunti: Spunto[] = [];
    frasi.filter((f) => dentro(f.inizio)).forEach((f) => {
      const tagli = new Set<number>([0]);
      f.parole.forEach((p, i) => {
        if (i > 0 && /[,;:]["”»)]*$/.test(f.parole[i - 1].testo)) tagli.add(i);
        if (i > 0 && segniScena.some((t) => Math.abs(t - p.inizio) < 0.02)) tagli.add(i);
      });
      const inizi = [...tagli].sort((a, b) => a - b);
      // un tratto senza virgole né segni più lungo di due secondi si divide ancora, a parole intere
      for (let k = 0; k < inizi.length; k++) {
        const fine = inizi[k + 1] ?? f.parole.length;
        const lungo = f.parole[fine - 1].fine - f.parole[inizi[k]].inizio;
        if (lungo > 2.0 && fine - inizi[k] >= 3) {
          const meta = f.parole.findIndex((p, i) => i > inizi[k] && p.inizio >= f.parole[inizi[k]].inizio + lungo / 2);
          if (meta > inizi[k] && meta < fine) {
            inizi.splice(k + 1, 0, meta);
            k--; // anche la prima metà si riguarda: una frase di sette secondi senza virgole fa quattro tratti, non due
          }
        }
      }
      inizi.forEach((da, k) => {
        const parole = f.parole.slice(da, inizi[k + 1] ?? f.parole.length);
        spunti.push({indice: f.indice, inizio: parole[0].inizio, fine: parole[parole.length - 1].fine, parole, domanda: f.domanda && k === 0, dentro: k > 0, invito: f.parole.some((p) => INVITI.test(pulita(p.testo)))} as Spunto);
      });
    });
    let n = -1;
    let ruoli: Map<Spunto, 'alto' | 'altra'> | null = null;
    let ultimoInvito: Spunto | null = null;
    spunti.forEach((f) => {
      if (!f.dentro) n++;
      // L'invito finale ("Commenta…") si prepara tutto insieme, partendo dalla fine: l'ultima posa è il dito in alto
      // e la frase finisce così, prima un'altra, prima ancora il dito in alto… Deciso una posa alla volta, capitava
      // che l'ultimo spunto trovasse il dito già alzato e il narratore restasse fermo cinque secondi.
      if (ultima && f.invito) {
        if (!ruoli) {
          ruoli = new Map();
          const scattano: Spunto[] = [];
          let u = ultimoCambio;
          for (const s of spunti.slice(spunti.indexOf(f))) {
            if (!s.invito || s.inizio - u < TENUTA || s.inizio > scena.fine - 1.2) continue;
            scattano.push(s);
            u = s.inizio;
          }
          scattano.reverse().forEach((s, i) => ruoli!.set(s, i % 2 === 0 ? 'alto' : 'altra'));
          ultimoInvito = scattano[0] ?? null;
        }
        const ruolo = ruoli.get(f);
        if (!ruolo) return;
        const alto = nota('alto') ?? alterna[0];
        const precedenteQui = cambi.length ? cambi[cambi.length - 1].posa : 'dito';
        // tra un dito in alto e l'altro una posa che invita (mano aperta, indica, presenta): mai braccia conserte, che frenano
        const altra = () => scegli(['aperto', 'presenta', 'lato'], precedenteQui);
        const posa = ruolo === 'altra' ? altra() : precedenteQui === alto && f !== ultimoInvito ? altra() : alto;
        if (posa !== precedenteQui) {
          cambi.push({t: Math.max(0, f.inizio - 0.25), posa, seconda: secondaPer(posa, regia?.seconda)});
          ultimoUso[posa] = conta++;
          ultimoCambio = f.inizio;
        }
        return;
      }
      if (f.inizio - ultimoCambio < TENUTA) return; // una posa va tenuta almeno un po': niente cambi a raffica
      if (f.inizio >= scena.fine - TENUTA && f.dentro) return; // non si cambia posa a un soffio dal cambio di scena: lì ne arriva un'altra
      const haEnfasi = f.parole.some((p) => p.enfasi);
      // una frase che comincia negando o frenando ("Non è un miracolo…", "Ma…") si dice bene a braccia conserte
      const frena = f.parole.slice(0, 2).some((p) => negazione.test(pulita(p.testo))) || FRENI.test(pulita(f.parole[0]?.testo ?? ''));
      const precedente = cambi.length ? cambi[cambi.length - 1].posa : 'dito';
      let posa: string;
      if (casa) posa = poseVicine(precedente, casa) ? scegli(alterna, precedente) : casa; // di casa, un'altra lontana, di casa…
      else if (f.domanda) posa = scegli(['pensa', 'aperto'], precedente); // ci sta pensando: dito al mento, o mano aperta
      else if (n === 0 && k > 0 && !f.dentro) posa = scegli(['lato', 'presenta', 'aperto'], precedente); // scena nuova: presenta quello che è comparso
      else if (frena && !ultima) posa = scegli(['conserte', 'pensa'], precedente); // sta mettendo un freno: braccia conserte, o dito al mento
      else if (haEnfasi) posa = scegli(['alto', 'dito', 'aperto', 'pensa'], precedente); // una parola che conta: attenzione
      else posa = scegli(alterna, precedente);
      if (!disponibili.includes(posa) || posa === precedente) return; // già in quella posa: resta com'è
      cambi.push({t: Math.max(0, f.inizio - 0.25), posa, seconda: secondaPer(posa, regia?.seconda)});
      ultimoUso[posa] = conta++;
      ultimoCambio = f.inizio;
    });
  });
  return cambi.sort((a, b) => a.t - b.t);
}

/** Toglie i gesti che si pesterebbero i piedi: vince quello più importante, poi quello più forte. */
function sfoltisci(eventi: EventoGesto[]): EventoGesto[] {
  const ordinati = [...eventi].sort((a, b) => PRIORITA[b.gesto] - PRIORITA[a.gesto] || b.forza - a.forza || a.t - b.t);
  const tenuti: EventoGesto[] = [];
  for (const e of ordinati) {
    const da = e.t;
    const a = e.t + occupa(e);
    const scontro = tenuti.some((x) => {
      if (!CANALI[x.gesto].some((c) => CANALI[e.gesto].includes(c))) return false;
      return da < x.t + occupa(x) && x.t < a;
    });
    if (!scontro) tenuti.push(e);
  }
  return tenuti.sort((a, b) => a.t - b.t);
}

/** La scaletta dei gesti di tutto il reel. */
export function scalettaGesti(dati: DatiReel, regiaDi: (nomeScena: string) => RegiaGesti | undefined): EventoGesto[] {
  const eventi: EventoGesto[] = [];
  const frasi = frasiDi(dati.parole);
  const lingua = (dati.lingua ?? 'it').slice(0, 2);
  const negazione = NEGAZIONI[lingua] ?? NEGAZIONI.it;
  // `quando` è l'istante della parola (o del segno): il gesto parte prima, di quanto serve a prepararsi
  const metti = (quando: number, gesto: Gesto, forza = 1, durata = DURATA[gesto]) => eventi.push({t: Math.max(0, quando - ANTICIPO[gesto]), gesto, forza, durata});

  dati.scene.forEach((scena, k) => {
    const regia = regiaDi(scena.nome);
    if (regia?.gesti === false) return;
    if (Array.isArray(regia?.gesti)) {
      for (const [quando, gesto] of regia.gesti) {
        if (!GESTI.includes(gesto)) throw new Error(`Regia del narratore: il gesto "${gesto}" non esiste. Gesti: ${GESTI.join(', ')}.`);
        metti(istante(dati, scena, quando), gesto);
      }
      return;
    }
    const ultima = k === dati.scene.length - 1;
    const dentro = (t: number) => t >= scena.inizio - 0.05 && t < scena.fine - 0.05;
    const frasiScena = frasi.filter((f) => dentro(f.inizio));
    const paroleScena = dati.parole.filter((p) => dentro(p.inizio));

    const invito = ultima ? paroleScena.find((p) => INVITI.test(pulita(p.testo))) : undefined;
    if (invito) metti(invito.inizio, 'saluta', 1, limita(scena.fine - invito.inizio + 0.2, 1.6, 2.6));

    // parole: l'accento sulle enfasi, il "no" sulle negazioni
    for (const p of paroleScena) {
      if (p.enfasi) metti(p.inizio + 0.07, 'batte', 1);
      else if (negazione.test(pulita(p.testo))) metti(p.inizio, 'nega', 1);
    }
    // segni: sul palco è comparso qualcosa, e lui lo guarda
    for (const t of Object.values(dati.segni)) if (dentro(t)) metti(t, 'guarda', 1);

    // frasi: domanda, cenno a fine frase, mano che spiega in quelle lunghe
    for (const f of frasiScena) {
      const lunga = f.fine - f.inizio;
      if (f.domanda) {
        const t = Math.max(f.inizio, f.fine - 1.2);
        metti(t, 'domanda', 1, f.fine - t + 0.6);
      } else {
        metti(f.fine - 0.18, 'annuisce', 0.85);
      }
      if (lunga >= 3) metti(f.inizio + 0.8, 'spiega', 0.8, Math.min(2.8, lunga - 0.9));
    }
  });
  return sfoltisci(eventi);
}

// ───────────────────────── dal tempo al movimento ─────────────────────────

/** Tutto il corpo: una piccola rotazione attorno ai piedi, uno spostamento, il respiro. */
export type Corpo = {ruota: number; dx: number; dy: number; scalaY: number};
/** `disegni` = quanto si vede ogni posa disegnata (0…1): lo usa il pupazzo per sfumare dai livelli al disegno. */
export type Atteggiamento = {mosse: Mosse; corpo: Corpo; disegni?: Record<string, number>};

type Piena = Required<Mossa>;
const vuota = (): Piena => ({ruota: 0, dx: 0, dy: 0, sx: 1, sy: 1});

/** Colpo morbido: scende in `su` secondi e torna in `giu`, con un filo di rimbalzo. */
function colpo(x: number, su: number, giu: number): number {
  if (x <= 0) return 0;
  if (x < su) return curve.morbida(x / su);
  const p = (x - su) / giu;
  if (p >= 1.25) return 0;
  return Math.exp(-3.6 * p) * Math.cos(1.25 * Math.PI * p) * (1 - rampa(p - 0.85, 0.4, curve.lineare));
}

/** Gesto tenuto: piccola rincorsa all'indietro, salita, resta, torna piano. */
function tenuto(x: number, durata: number): number {
  if (x <= 0 || x >= durata) return 0;
  const rincorsa = Math.min(0.16, durata * 0.1);
  const salita = Math.min(0.36, durata * 0.24);
  const uscita = Math.min(0.62, durata * 0.36);
  if (x < rincorsa) return -0.14 * curve.morbida(x / rincorsa);
  if (x < rincorsa + salita) {
    const p = (x - rincorsa) / salita;
    return -0.14 + 1.14 * curve.morbida(p) + 0.05 * Math.sin(Math.PI * p) * p; // arriva un filo oltre e si assesta
  }
  if (x < durata - uscita) return 1;
  return 1 - curve.morbida((x - (durata - uscita)) / uscita);
}

/** Sale piano, resta, scende piano. */
function campana(x: number, durata: number, entra = 0.38, esce = 0.5): number {
  if (x <= 0 || x >= durata) return 0;
  const e = Math.min(entra, durata * 0.4);
  const u = Math.min(esce, durata * 0.4);
  return rampa(x, e, curve.morbida) * (1 - rampa(x - (durata - u), u, curve.morbida));
}

/** Accento: si prepara (+), batte (−1), tiene un attimo, torna. Il colpo arriva a 0,34 s dall'inizio. */
function accento(x: number): number {
  if (x <= 0 || x >= 0.95) return 0;
  if (x < 0.2) return 0.42 * curve.morbida(x / 0.2);
  if (x < 0.34) return 0.42 - 1.42 * curve.morbida((x - 0.2) / 0.14);
  if (x < 0.55) return -1;
  return -1 + curve.morbida((x - 0.55) / 0.4);
}

/** 0…1: sale e scende sull'attacco di una parola lunga o in enfasi (le altre non contano). */
function parolaForte(parole: Parola[], ora: number): number {
  let lo = 0;
  let hi = parole.length - 1;
  let k = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (parole[m].inizio <= ora + 0.06) {
      k = m;
      lo = m + 1;
    } else hi = m - 1;
  }
  let v = 0;
  // guarda anche la parola prima: il cenno di una parola può non essere ancora finito
  for (const i of [k - 1, k]) {
    if (i < 0) continue;
    const p = parole[i];
    if (!p.enfasi && pulita(p.testo).length < 7) continue;
    v = Math.max(v, colpo(ora + 0.06 - p.inizio, 0.13, 0.3));
  }
  return v;
}

type Grezzo = Record<Parte, Piena> & {corpo: Corpo};

/**
 * Durata del passaggio da una posa all'altra, in secondi: più strada deve fare il braccio, più tempo si prende
 * (un braccio che attraversa tutto il petto in mezzo secondo sembra uno scatto, non un gesto).
 */
/**
 * La curva con cui un braccio vero va da un punto all'altro: parte piano, arriva piano, e a metà strada non
 * corre mai più del doppio della sua velocità media (in animazione si chiama "minimo strappo").
 */
function comeUnBraccio(t: number): number {
  const x = limita(t);
  return x * x * x * (10 - 15 * x + 6 * x * x);
}

function durataCambio(da: Assetto | undefined, a: Assetto | undefined): number {
  const strada = Math.abs((a?.braccio?.ruota ?? 0) - (da?.braccio?.ruota ?? 0));
  const durata = limita(0.55 + 0.0065 * strada, 0.62, 1.12);
  return (a?.disegno ?? da?.disegno) && a?.disegno !== da?.disegno ? Math.max(durata, 0.9) : durata;
}

/**
 * Quanto si vede ogni posa disegnata all'istante `ora` (0…1). Entrando, prima il braccio va verso il petto e
 * solo alla fine il disegno prende il suo posto; uscendo, il disegno sparisce subito e il braccio riparte.
 */
export function pesiDisegni(cambi: CambioPosa[], assetti: Record<string, Assetto>, ora: number): Record<string, number> {
  const pesi: Record<string, number> = {};
  let k = -1;
  for (let i = 0; i < cambi.length; i++) {
    if (cambi[i].t <= ora) k = i;
    else break;
  }
  if (k < 0) return pesi;
  const adesso = assetti[cambi[k].posa];
  const prima = k > 0 ? assetti[cambi[k - 1].posa] : undefined;
  const entra = adesso?.disegno;
  const esce = prima?.disegno;
  if (entra && entra === esce) return {[entra]: 1};
  const p = limita((ora - cambi[k].t) / durataCambio(prima, adesso));
  const scalino = (a: number, b: number) => {
    const t = limita((p - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  // lo scambio dura quattro fotogrammi: abbastanza per non sembrare uno scatto, troppo poco per vedere due braccia
  if (entra) pesi[entra] = k === 0 && !esce && cambi[k].t <= 0 ? 1 : scalino(0.44, 0.58);
  if (esce && p < 1) pesi[esce] = 1 - scalino(0.2, 0.34);
  return pesi;
}

/** Lo stesso per la seconda mano: conta la strada del suo avambraccio. */
function durataSeconda(da: Assetto | undefined, a: Assetto | undefined): number {
  const strada = Math.abs((a?.braccio2?.ruota ?? 0) - (da?.braccio2?.ruota ?? 0));
  return limita(0.5 + 0.0085 * strada, 0.55, 1.15);
}

/** Aggiunge a `g` una posa, pesata (serve per sfumare da una posa all'altra). */
function sommaAssetto(g: Grezzo, assetto: Assetto | undefined, peso: number) {
  if (!assetto || peso === 0) return;
  for (const parte of PARTI) {
    const m = assetto[parte];
    if (!m) continue;
    g[parte].ruota += (m.ruota ?? 0) * peso;
    g[parte].dx += (m.dx ?? 0) * peso;
    g[parte].dy += (m.dy ?? 0) * peso;
  }
  if (assetto.corpo) {
    g.corpo.ruota += (assetto.corpo.ruota ?? 0) * peso;
    g.corpo.dx += (assetto.corpo.dx ?? 0) * peso;
    g.corpo.dy += (assetto.corpo.dy ?? 0) * peso;
  }
}

/** Dove "vorrebbe" essere ogni parte all'istante `ora`, prima di ammorbidire e sfasare. */
function grezzo(eventi: EventoGesto[], cambi: CambioPosa[], assetti: Record<string, Assetto>, limiti: Limiti, dati: DatiReel, ora: number, seconde?: Record<string, Assetto>): Grezzo {
  const energia = energiaVoce(dati.parole, ora);
  const g: Grezzo = {testa: vuota(), viso: vuota(), spalla: vuota(), braccio: vuota(), mano: vuota(), palmo: vuota(), braccio2: vuota(), corpo: {ruota: 0, dx: 0, dy: 0, scalaY: 1}};
  const {testa, viso, spalla, braccio, mano, palmo, braccio2, corpo} = g;
  // il personaggio ha l'altro avambraccio su un livello suo: la mano aperta si muove ruotando dal gomito
  const due = Boolean(seconde);

  // la posa: sfuma da quella di prima a quella di adesso
  let k = -1;
  for (let i = 0; i < cambi.length; i++) {
    if (cambi[i].t <= ora) k = i;
    else break;
  }
  if (k >= 0) {
    const prima = k > 0 ? assetti[cambi[k - 1].posa] : undefined;
    const p = comeUnBraccio((ora - cambi[k].t) / durataCambio(prima, assetti[cambi[k].posa]));
    sommaAssetto(g, assetti[cambi[k].posa], p);
    if (p < 1 && k > 0) sommaAssetto(g, prima, 1 - p);
  }
  // la seconda mano: sfuma dal suo stato di prima a quello di adesso, partendo un attimo dopo
  if (seconde) {
    let adesso: string | undefined;
    let primaDi: string | undefined;
    let quando = 0;
    for (const c of cambi) {
      if (c.t + RITARDO_SECONDA > ora) break;
      if (!c.seconda || c.seconda === adesso) continue;
      primaDi = adesso;
      adesso = c.seconda;
      quando = c.t + RITARDO_SECONDA;
    }
    if (adesso) {
      const da = primaDi ? seconde[primaDi] : undefined;
      const p = comeUnBraccio((ora - quando) / durataSeconda(da, seconde[adesso]));
      sommaAssetto(g, seconde[adesso], p);
      if (p < 1 && da) sommaAssetto(g, da, 1 - p);
    }
  }
  // quando la seconda mano è giù lungo il fianco i suoi gesti si fanno piccoli: una mano in tasca non gesticola
  const viva = due ? limita(1 + braccio2.ruota / 70, 0.2, 1) : 1;

  // sempre: respiro, il peso che si sposta piano da un lato all'altro, e un filo di vita in più mentre parla
  testa.ruota += 0.7 * onda(ora, 5.7) + 0.5 * energia * onda(ora, 2.3, 0.2);
  corpo.dx += 2.5 * onda(ora, 9.7, 0.15);
  // la testa segue la voce: un cenno appena accennato sulle parole "piene" (lunghe, o in enfasi)
  const forte = parolaForte(dati.parole, ora);
  testa.dy += 3.6 * forte;
  testa.ruota += -0.9 * forte;
  braccio.ruota += 0.4 * onda(ora, 4.3, 0.3) + 0.35 * energia * onda(ora, 1.7);
  palmo.ruota += 0.7 * onda(ora, 3.9, 0.5) + 0.8 * energia * onda(ora, 1.5, 0.4);
  if (due) braccio2.ruota += 0.5 * onda(ora, 4.9, 0.6) + 0.6 * energia * viva * onda(ora, 1.9, 0.1);
  else palmo.dy += -1.5 * energia;
  corpo.ruota += 0.35 * onda(ora, 6.1);
  corpo.scalaY *= 1 + 0.004 * onda(ora, 3.7);

  for (const e of eventi) {
    const x = ora - e.t;
    if (x <= 0) break; // sono in ordine di tempo
    if (x > e.durata + 0.2) continue;
    const f = e.forza;
    switch (e.gesto) {
      case 'indica': {
        const a = tenuto(x, e.durata) * f;
        braccio.ruota += 9 * a;
        spalla.ruota += 1.6 * a;
        mano.ruota += 3 * a;
        testa.ruota += -2.4 * a;
        viso.dx += -3 * a;
        corpo.ruota += -1 * a;
        corpo.dx += -4 * a;
        break;
      }
      case 'batte': {
        const v = accento(x) * f;
        braccio.ruota += 6 * v;
        mano.ruota += 4 * v;
        testa.ruota += 1.4 * v;
        testa.dy += -3 * v;
        corpo.dy += -2.5 * v;
        if (due) braccio2.ruota += -1.6 * v * viva; // l'altra mano accompagna appena
        break;
      }
      case 'guarda': {
        const a = campana(x, e.durata, 0.3, 0.45) * f;
        testa.ruota += -2.2 * a;
        viso.dx += -5 * a;
        viso.dy += -1.5 * a;
        corpo.ruota += -0.4 * a;
        break;
      }
      case 'nega': {
        if (x >= e.durata) break;
        const inviluppo = Math.pow(Math.sin((Math.PI * x) / e.durata), 0.9) * f;
        const va = Math.sin(2 * Math.PI * 1.9 * x);
        testa.dx += 4 * inviluppo * va;
        testa.ruota += 1.5 * inviluppo * va;
        viso.dx += 5 * inviluppo * va; // il viso gira un po' più della testa: è questo che fa leggere il "no"
        palmo.ruota += -3 * inviluppo;
        braccio.ruota += -2 * inviluppo;
        if (due) braccio2.ruota += -2.5 * inviluppo * viva;
        break;
      }
      case 'spiega': {
        const a = campana(x, e.durata, 0.5, 0.6) * f;
        if (due) {
          // la mano aperta sale ruotando dal gomito e ondeggia piano: è lei che "spiega"
          braccio2.ruota += (5.5 + 1.2 * Math.sin((2 * Math.PI * x) / 1.1)) * a * viva;
          palmo.ruota += (4 + 1.3 * Math.sin((2 * Math.PI * x) / 1.1)) * a * viva;
        } else {
          palmo.ruota += (6 + 1.3 * Math.sin((2 * Math.PI * x) / 1.1)) * a;
          palmo.dy += -11 * a;
          palmo.dx += -5 * a;
        }
        testa.ruota += 1.3 * a;
        corpo.ruota += 0.4 * a;
        break;
      }
      case 'domanda': {
        const a = campana(x, e.durata, 0.35, 0.5) * f;
        testa.ruota += 4.5 * a;
        spalla.ruota += 1.4 * a; // un accenno di spallucce
        viso.dx += 2 * a;
        if (due) {
          braccio2.ruota += 7 * a * viva;
          palmo.ruota += 6 * a * viva;
        } else {
          palmo.ruota += 6 * a;
          palmo.dy += -12 * a;
        }
        corpo.ruota += 0.7 * a;
        break;
      }
      case 'annuisce': {
        const c = colpo(x, 0.2, 0.42) * f;
        testa.dy += 8 * c;
        testa.sy *= 1 - 0.03 * c;
        testa.ruota += -3.2 * c;
        viso.dy += 3 * c;
        break;
      }
      case 'saluta': {
        const a = tenuto(x, e.durata) * f;
        const slancio = Math.sin(2 * Math.PI * 1.6 * Math.max(0, x - 0.55)) * limita((x - 0.55) / 0.2) * limita((e.durata - 0.7 - x) / 0.25);
        braccio.ruota += 7 * a + 1.6 * slancio;
        spalla.ruota += 1.2 * a;
        mano.ruota += 2 * a + 3 * slancio;
        testa.ruota += -2 * a;
        corpo.dy += -4 * f * impulso(x, 0.5);
        if (due) braccio2.ruota += 3 * a * viva;
        break;
      }
    }
  }
  // limiti: oltre questi angoli l'immagine si deforma male, qualunque somma di posa e gesti capiti
  for (const parte of ['braccio', 'mano', 'palmo', 'testa', 'spalla', 'braccio2'] as const) {
    const [minimo, massimo] = limiti[parte] ?? LIMITI[parte];
    g[parte].ruota = limita(g[parte].ruota, minimo, massimo);
  }
  // il viso scorre dentro la testa di pochi pixel: di più si vedrebbe il trucco
  viso.dx = limita(viso.dx, -9, 9);
  viso.dy = limita(viso.dy, -5, 5);
  return g;
}

/** Quanto ogni parte arriva "dopo" (secondi): è il ritardo che fa sembrare vivo il movimento. */
const RITARDO = {braccio: 0, spalla: 0.01, corpo: 0.02, testa: 0.035, viso: 0.02, mano: 0.05, palmo: 0.06, braccio2: 0.02};
/** Finestra con cui i movimenti vengono ammorbiditi: sei campioni a 22 millesimi l'uno dall'altro. */
const PESI = [1, 5, 10, 10, 5, 1].map((p) => p / 32);
const PASSO = 0.022;
/** Il ritardo medio della finestra: gli istanti vengono anticipati di tanto, così il colpo resta sulla parola. */
const RECUPERO = (PASSO * (PESI.length - 1)) / 2;

export type OpzioniAtteggiamento = {
  /** Moltiplica tutti i movimenti (1 = normale). */
  ampiezza?: number;
  /** La scaletta delle pose (se manca: sempre l'immagine com'è). */
  cambi?: CambioPosa[];
  /** Pose del personaggio che ritoccano o si aggiungono a quelle di serie. */
  pose?: Record<string, Assetto>;
  /** Angoli massimi del personaggio, se diversi da quelli di serie (un braccio su un livello suo può ruotare molto di più). */
  limiti?: Limiti;
  /** Gli stati della seconda mano del personaggio ("pose2" in personaggio.json), se ha l'altro avambraccio su un livello. */
  seconde?: Record<string, Assetto>;
};

/**
 * Come sta il narratore all'istante `ora`: movimenti delle ossa (testa, braccio, mano, palmo) e del corpo intero.
 * Gli spostamenti sono in pixel dell'immagine originale, le rotazioni in gradi (positive = senso orario).
 */
export function atteggiamento(eventi: EventoGesto[], dati: DatiReel, ora: number, {ampiezza = 1, cambi = [], pose, limiti = {}, seconde}: OpzioniAtteggiamento = {}): Atteggiamento {
  const assetti = pose ? {...ASSETTI, ...pose} : ASSETTI;
  const visti = new Map<number, Grezzo>();
  const a = (t: number) => {
    const chiave = Math.round(t * 1e5);
    let g = visti.get(chiave);
    if (!g) {
      g = grezzo(eventi, cambi, assetti, limiti, dati, t, seconde);
      visti.set(chiave, g);
    }
    return g;
  };
  const liscio = <K extends keyof Grezzo>(parte: K, ritardo: number): Grezzo[K] => {
    const somma: Record<string, number> = {};
    PESI.forEach((peso, j) => {
      const g = a(ora + RECUPERO - ritardo - j * PASSO)[parte] as unknown as Record<string, number>;
      for (const k of Object.keys(g)) somma[k] = (somma[k] ?? 0) + g[k] * peso;
    });
    return somma as unknown as Grezzo[K];
  };
  const scala = (m: Piena): Mossa => ({
    ruota: m.ruota * ampiezza,
    dx: m.dx * ampiezza,
    dy: m.dy * ampiezza,
    sx: 1 + (m.sx - 1) * ampiezza,
    sy: 1 + (m.sy - 1) * ampiezza,
  });
  const corpo = liscio('corpo', RITARDO.corpo);
  const disegni = pesiDisegni(cambi, assetti, ora);
  // sotto una posa disegnata la spalla resta dov'è: il disegno è fatto per l'immagine a riposo
  const ferma = 1 - Math.max(0, ...Object.values(disegni));
  const spalla = liscio('spalla', RITARDO.spalla);
  return {
    disegni,
    mosse: {
      testa: scala(liscio('testa', RITARDO.testa)),
      viso: scala(liscio('viso', RITARDO.viso)),
      spalla: scala({...spalla, ruota: spalla.ruota * ferma, dx: spalla.dx * ferma, dy: spalla.dy * ferma}),
      braccio: scala(liscio('braccio', RITARDO.braccio)),
      mano: scala(liscio('mano', RITARDO.mano)),
      palmo: scala(liscio('palmo', RITARDO.palmo)),
      braccio2: scala(liscio('braccio2', RITARDO.braccio2)),
    },
    corpo: {ruota: corpo.ruota * ampiezza, dx: corpo.dx * ampiezza, dy: corpo.dy * ampiezza, scalaY: 1 + (corpo.scalaY - 1) * ampiezza},
  };
}

/** Per il foglio di prova: il gesto nel suo punto più "spinto", da solo. */
export function gestoAlMassimo(gesto: Gesto): {eventi: EventoGesto[]; ora: number} {
  const durata = DURATA[gesto];
  const quando: Record<Gesto, number> = {indica: 1, batte: 0.48, spiega: 1.2, annuisce: 0.24, domanda: 0.9, nega: 0.7, saluta: 1, guarda: 0.55};
  return {eventi: [{t: 0, gesto, forza: 1, durata}], ora: quando[gesto]};
}
