// FMLAB Reel Kit — IL REGISTA DI SERIE. Dal testo dato scrive un primo piano di regia (piano.json) completo e
// valido, senza rete e senza spesa: divide in scene, sceglie una scena pronta per ciascuna, mette i segni sulle
// parole che contano, luogo, inquadratura, movimento di camera, protagonista, suoni.
// È una base onesta, fatta di regole: chi fa la regia (la persona o l'agente) la legge e la migliora scena per
// scena, mettendo numeri, grafici e oggetti dove il testo li chiede. Il testo non lo tocca nessuno.
//
//   npm run regia <reel>            scrive piano.json (se c'è già non lo tocca: "nuova" per rifarlo)
//
// Il metodo viene da come si descrive una ripresa a un generatore di video (vedi riferimenti/ANALISI.md):
// ogni scena è un'inquadratura con un compito, un movimento di camera con un nome, un'azione (qualcosa che cambia,
// non solo qualcosa che si vede), una luce sola; da un'inquadratura all'altra cambia la scala (largo, medio,
// stretto) e restano uguali il protagonista e i colori dei soggetti.
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, cartellaReel, elencoReel, rel} from './percorsi.mjs';
import {atmosferaDalNome} from './comune/atmosfere.mjs';
import {musicaDalNome} from './musiche.mjs';
import {CAMERE, CAMPI, LUOGHI, controllaPiano, leggiRegali, paroleDelTesto} from './piano.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';
import {stimaTempi} from './copione.mjs';

// Il ritmo del piano di serie, in secondi di voce stimati (non in parole: una parola lunga o una virgola pesano).
// Nei reel di riferimento una scena dura quattro-cinque secondi e sul palco cambia qualcosa ogni due o tre.
/** Una scena più lunga di così si spezza in due. */
export const SCENA_LUNGA = 6.5;
/** Ogni quanto si cerca di far comparire qualcosa. */
const SEGNO_OGNI = 2.3;
/**
 * Mai più di così tra due segni, nei tempi stimati. La promessa del kit è 4 secondi: il margine è per la voce
 * vera, che può essere più lenta della stima e fa pause più lunghe dopo i punti.
 */
export const SEGNO_MASSIMO = 3.0;

/** L'istante stimato in cui comincia la parola i (dopo l'ultima: la fine del testo). */
export function orologio(parole) {
  const tempi = stimaTempi(parole);
  return (i) => (i >= tempi.length ? (tempi[tempi.length - 1]?.fine ?? 0) : tempi[Math.max(0, i)].inizio);
}

const VUOTE = new Set(
  (
    'il lo la i gli le un uno una di a da in con su per tra fra e ed o ma se che chi cui non più meno come anche già solo sono è era ha hanno ho hai del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle col questo questa questi queste quello quella quelli quelle quell quel cosa cosa quando dove mentre però quindi allora poi ancora sempre mai molto poco tanto tanti tante tutto tutti tutte ogni altro altra altri altre suo sua suoi sue loro nostro nostra essere stato stata stati state viene veniva fare fatto può possono deve bisogna c ci si ne li mi ti vi lui lei noi voi io tu circa quasi oltre davvero proprio prima dopo senza rispetto volta ' +
    'the a an of to in on at for with by from and or but if that this these those is are was were be been has have had it its as not more less than then so very just also only into over about what when where which who how why their our your his her they we you i do does did can could will would should may might each every all any some no ' +
    'el los las un una unos unas de del al y o pero si que no más menos como también ya solo es son era ha han por para con sin sobre entre este esta estos estas ese esa eso lo le les se su sus muy cuando donde ' +
    'le la les un une des du de et ou mais si que qui ne pas plus moins comme aussi déjà seulement est sont était a ont pour par avec sans sur entre ce cette ces il elle ils elles nous vous son sa ses leur très quand où ' +
    'der die das ein eine einen einem einer und oder aber wenn dass nicht mehr weniger wie auch schon nur ist sind war hat haben für mit ohne auf über zwischen dieser diese dieses er sie es wir ihr sein seine sehr wann wo von zu im am ' +
    'o os as um uma uns umas do da dos das no na nos nas e ou mas se que não mais menos como também já só é são era tem têm por para com sem sobre entre este esta esse essa ele ela eles elas seu sua muito quando onde'
  ).split(/\s+/)
);

/** Le parole che dicono un numero, nelle lingue più usate. "sei" resta fuori: in italiano è quasi sempre il verbo. */
const NUMERI = {
  zero: 0, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sette: 7, otto: 8, nove: 9, dieci: 10, venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, cento: 100, mille: 1000, duemila: 2000, milione: 1e6, miliardo: 1e9,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100, thousand: 1000, million: 1e6, billion: 1e9,
  dos: 2, tres: 3, cuatro: 4, cinco: 5, siete: 7, ocho: 8, nueve: 9, diez: 10, cien: 100, mil: 1000, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10, cent: 100, zwei: 2, drei: 3, vier: 4, fünf: 5, zehn: 10, hundert: 100, tausend: 1000,
};

const INVITO = /^(commenta|comment|comenta|commente|kommentiere)$/;
const FRENA = /^(risch\w*|grav\w*|attenzion\w*|pericol\w*|collateral\w*|danno|danni|avvers\w*|risk\w*|danger\w*|warning|side|harm\w*|riesgo\w*|peligro\w*|risque\w*|gefahr\w*)$/;
const CHIUDE = /^(conclusione|dimostrato|dimostrano|funziona|risultato|conclusion|proved|shown|works|result|conclusión|resultado|ergebnis)$/;

/** Dove siamo, dalle parole della scena. Il primo luogo che trova una sua parola vince. */
const DOVE = [
  ['studio', /^(stud[io]\w*|rivist\w*|ricerc\w*|pubblicat\w*|autor\w*|articol\w*|scienziat\w*|stud(y|ies)|journal\w*|research\w*|paper\w*|author\w*|estudio\w*|étude\w*|studie\w*)$/],
  ['bilancia', /^(differenz\w*|confront\w*|rispetto|contro|placebo|peso|pesa\w*|costo|costa\w*|prezz\w*|euro|soldi|difference|compar\w*|versus|price\w*|cost\w*|weigh\w*|money)$/],
  ['palco', /^(pubblico|applau\w*|band|palco|concerto|spettacol\w*|audience|stage|applau\w*|show|crowd)$/],
  ['stadio', /^(amic\w*|squadra|sport\w*|gara|partita|allen\w*|atlet\w*|scale|corr\w*|friend\w*|team|game|race|athlet\w*|train\w*|run\w*)$/],
  ['laboratorio', /^(laborator\w*|scala|misur\w*|valutat\w*|test\w*|esperiment\w*|dat[io]|punt[io]|percent\w*|lab\w*|measur\w*|scale|experiment\w*|data|points?)$/],
  ['vaso', /^(sangue|vas[io]|arter\w*|ven[ae]|circol\w*|pression\w*|effett\w*|blood|vessel\w*|arter\w*|vein\w*|pressure)$/],
  ['membrana', /^(cellul\w*|recettor\w*|membran\w*|molecol\w*|protein\w*|peptid\w*|compost\w*|cell\w*|receptor\w*|molecul\w*|compound\w*)$/],
  ['corpo', /^(corpo|dolor\w*|ginocchi\w*|cuore|muscol\w*|ossa|osso|artrosi|pelle|stomaco|cervello|adult\w*|uomo|persone|body|pain|knee\w*|heart|muscle\w*|bone\w*|skin|brain|people)$/],
];

const SALUTE = /^(dolor\w*|farmac\w*|placebo|peptid\w*|artrosi|studi\w*|medic\w*|effett\w*|salute|terapi\w*|dose|dosi|pain|drug\w*|health|therap\w*|medic\w*|dose\w*)$/;

const senzaAccenti = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const maiuscola = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const pulita = (t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}%]+$/gu, '');
const fineFrase = (p) => /[.!?…]["”»)]*$/.test(p.testo);
const pieno = (p) => p.chiave.length >= 4 && !VUOTE.has(p.chiave);

/** Il numero che una parola dice, o null: "mille" → 1000, "45%" → 45. */
export function numeroDi(parola) {
  if (/^\d/.test(parola.chiave)) {
    const n = Number(parola.chiave.replace(/\.(?=\d{3})/g, '').replace(',', '.').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return NUMERI[parola.chiave] ?? null;
}

/** Divide il testo in scene: a capo, domande e invito finale aprono una scena; quelle troppo corte si uniscono. */
export function dividiInScene(parole, quando = orologio(parole)) {
  // 1 · le frasi
  const frasi = [];
  let da = 0;
  parole.forEach((p, i) => {
    if (fineFrase(p) || i === parole.length - 1) {
      frasi.push({da, a: i + 1, capoverso: parole[da].capoverso, domanda: /\?["”»)]*$/.test(p.testo), invito: parole.slice(da, i + 1).some((x) => INVITO.test(x.chiave))});
      da = i + 1;
    }
  });
  // 2 · le scene: si apre a ogni capoverso, a ogni domanda (che poi tiene con sé la frase dopo, se breve) e all'invito
  const scene = [];
  for (const f of frasi) {
    const ultima = scene[scene.length - 1];
    const lunga = ultima ? ultima.a - ultima.da : 0;
    const nuova = !ultima || f.invito || ultima.invito || (f.domanda && lunga >= 6) || (f.capoverso !== ultima.capoverso && (ultima.domanda ? f.a - f.da > 6 : lunga >= 16)) || lunga + (f.a - f.da) > 40;
    if (nuova) scene.push({...f});
    else {
      ultima.a = f.a;
      ultima.capoverso = f.capoverso;
      ultima.domanda ||= f.domanda;
    }
  }
  // 3 · una scena di meno di 6 parole (meno di due secondi) si unisce a quella prima, tranne l'invito
  for (let i = scene.length - 1; i > 0; i--) {
    if (scene[i].a - scene[i].da < 6 && !scene[i].invito && !scene[i - 1].invito) {
      scene[i - 1].a = scene[i].a;
      scene[i - 1].domanda ||= scene[i].domanda;
      scene.splice(i, 1);
    }
  }
  // 4 · una scena che dura troppo si spezza in due (e poi ancora, se serve): alla fine di una frase, o dopo una
  //     virgola, nel punto più vicino alla metà. Ogni metà deve avere almeno cinque parole e due secondi.
  for (let i = 0; i < scene.length; i++) {
    const sc = scene[i];
    if (sc.invito || quando(sc.a) - quando(sc.da) <= SCENA_LUNGA) continue;
    const meta = (quando(sc.da) + quando(sc.a)) / 2;
    const buono = (k) => k - sc.da >= 5 && sc.a - k >= 5 && quando(k) - quando(sc.da) >= 2 && quando(sc.a) - quando(k) >= 2;
    const tagli = (regola) => {
      const adatti = [];
      for (let k = sc.da + 1; k < sc.a; k++) if (regola(parole[k - 1]) && buono(k)) adatti.push(k);
      return adatti.sort((x, y) => Math.abs(quando(x) - meta) - Math.abs(quando(y) - meta));
    };
    const taglio = tagli(fineFrase)[0] ?? tagli((p) => /[,;:]["”»)]*$/.test(p.testo))[0];
    if (taglio === undefined) continue; // una frase sola senza virgole: resta intera, i segni la tengono viva
    const domandaIn = (da, a) => parole.slice(da, a).some((p) => /\?["”»)]*$/.test(p.testo));
    scene.splice(i, 1, {...sc, a: taglio, domanda: domandaIn(sc.da, taglio)}, {...sc, da: taglio, capoverso: parole[taglio].capoverso, domanda: domandaIn(taglio, sc.a)});
    i--; // la prima metà si riguarda: può essere ancora lunga
  }
  return scene;
}

/**
 * Sceglie le parole su cui far comparire qualcosa: una ogni due secondi e mezzo circa, e mai più di SEGNO_MASSIMO
 * secondi (stimati) tra una e l'altra, né dall'inizio della scena alla prima, né dall'ultima alla fine.
 */
function scegliAncore(parole, da, a, quando = orologio(parole)) {
  const durata = quando(a) - quando(da);
  const quante = Math.max(1, Math.round(durata / SEGNO_OGNI));
  const voto = (p, i) => (numeroDi(p) !== null && p.chiave !== 'uno' && p.chiave !== 'one' ? 6 : 0) + (p.enfasi ? 5 : 0) + (/^\p{Lu}/u.test(p.testo) && i > da && !fineFrase(parole[i - 1]) ? 4 : 0) + Math.min(3, p.chiave.length / 4) - (VUOTE.has(p.chiave) ? 9 : 0);
  // la parola migliore tra quelle che cominciano dentro una fetta di tempo
  const migliore = (dalle, alle, tra = [da, a]) => {
    let meglio = -1;
    for (let i = tra[0]; i < tra[1]; i++) {
      if (quando(i) < dalle || quando(i) >= alle) continue;
      if (meglio < 0 || voto(parole[i], i) > voto(parole[meglio], meglio)) meglio = i;
    }
    return meglio;
  };
  const scelte = [];
  for (let k = 0; k < quante; k++) {
    const i = migliore(quando(da) + (k * durata) / quante, quando(da) + ((k + 1) * durata) / quante);
    if (i >= 0) scelte.push(i);
  }
  if (!scelte.length) scelte.push(da);
  // nessun buco più lungo del massimo: dove c'è, si aggiunge un segno verso la metà del buco
  const punti = [da, ...[...new Set(scelte)].sort((x, y) => x - y), a];
  for (let k = 0; k < punti.length - 1; k++) {
    if (quando(punti[k + 1]) - quando(punti[k]) <= SEGNO_MASSIMO) continue;
    const meta = (quando(punti[k]) + quando(punti[k + 1])) / 2;
    let i = migliore(meta - 0.5, meta + 0.5, [punti[k] + 1, punti[k + 1]]);
    if (i < 0) {
      // nessuna parola comincia proprio lì (una parola lunga, una pausa): la più vicina alla metà
      for (let j = punti[k] + 1; j < punti[k + 1]; j++) if (i < 0 || Math.abs(quando(j) - meta) < Math.abs(quando(i) - meta)) i = j;
    }
    if (i < 0) continue; // tra i due punti non c'è nessuna parola: non si può fare di più
    punti.splice(k + 1, 0, i);
    k--;
  }
  return [...new Set(punti.slice(1, -1))].sort((x, y) => x - y);
}

/**
 * La scritta che compare su una parola: la parola con quella che la completa ("Quattro punti", "Effetti collaterali").
 * I numeri restano scritti come li dice il testo, in lettere: una cifra a schermo è un dato, e un dato vuole la sua
 * riga in fonti.md. Le cifre le mette chi fa la regia, insieme alla fonte.
 */
function scrittaDi(parole, i, a) {
  const p = parole[i];
  const dopo = i + 1 < a && !/[,;:.!?…]$/.test(p.testo) ? parole[i + 1] : null;
  const base = maiuscola(pulita(p.testo));
  return {testo: dopo && pieno(dopo) && (base + dopo.chiave).length <= 22 ? `${base} ${pulita(dopo.testo)}` : base, numero: numeroDi(p)};
}

/**
 * Il piano di serie per un testo.
 * @param {string} testo  il testo dato
 * @param {{titolo?: string, regalo?: string, lingua?: string}} scelte  regalo: 'auto' | 'nessuno' | nome
 * @returns {{piano: object}}
 */
export function regia(testo, {titolo = '', regalo = 'auto'} = {}) {
  const parole = paroleDelTesto(testo);
  if (parole.length < 3) throw new ErroreFmlab('Il testo è troppo corto per farne un reel: servono almeno una frase intera.');
  const quando = orologio(parole);
  const tratti = dividiInScene(parole, quando);
  const regali = leggiRegali();
  const salute = parole.filter((p) => SALUTE.test(senzaAccenti(p.chiave))).length >= 2;
  const nomi = new Set();
  const nomeLibero = (base) => {
    let b = senzaAccenti(base).replace(/[^a-z0-9]/g, '') || 'punto';
    if (/^\d/.test(b)) b = 'n' + b;
    if (b.startsWith('scena') || b.startsWith('suono')) b = 'p' + b;
    let nome = b;
    for (let k = 2; nomi.has(nome); k++) nome = `${b}${k}`;
    nomi.add(nome);
    return nome;
  };
  const scene = [];
  const suoni = [];
  let luogoPrima = null;
  let enfasiMesse = 0;
  const GIRO_LUOGHI = LUOGHI.filter((l) => l !== 'vuoto');

  tratti.forEach((t, n) => {
    const mie = parole.slice(t.da, t.a);
    const ultima = n === tratti.length - 1;
    const invito = mie.findIndex((p) => INVITO.test(p.chiave));
    const frena = mie.some((p) => FRENA.test(senzaAccenti(p.chiave)));
    const sc = {nome: nomeLibero(ultima && invito >= 0 ? 'chiusura' : n === 0 ? 'aggancio' : frena ? 'attenzione' : t.domanda ? 'domanda' : `scena${n + 1}`.replace('scena', 'parte')), da: mie.slice(0, Math.min(4, mie.length)).map((p) => p.testo).join(' ')};
    const ancore = scegliAncore(parole, t.da, t.a, quando);
    const segni = {};
    const nomeDi = new Map();
    for (const i of ancore) {
      const nome = nomeLibero(parole[i].chiave.split(/['’]/).pop());
      const chiave = parole[i].chiave.split(/['’]/).pop();
      // la stessa parola due volte nella scena: si dice quale
      const uguale = (p) => p.chiave === chiave || p.chiave.split(/['’]/).pop() === chiave;
      const volta = mie.slice(0, i - t.da).filter(uguale).length + 1;
      segni[nome] = volta > 1 ? {su: chiave, volta} : chiave;
      nomeDi.set(i, nome);
    }
    // cosa si vede
    if (invito >= 0 && ultima) {
      const parola = pulita(mie[invito + 1]?.testo ?? '').toUpperCase();
      const dove = t.da + invito;
      const segno = nomeDi.get(dove) ?? nomeLibero('commenta');
      if (!nomeDi.has(dove)) segni[segno] = parole[dove].chiave;
      // 'auto': il regalo che si manda a chi commenta proprio quella parola; se non c'è, resta il cartello con la parola
      const scelto = regalo === 'auto' ? Object.keys(regali).find((k) => (regali[k].parola ?? '').toUpperCase() === parola) : regalo;
      if (regalo !== 'nessuno' && scelto && regali[scelto]) {
        sc.blocco = 'ebook';
        // la chiusura non resta ferma: il titolo del regalo compare più avanti, poi il tablet fa un giro, ognuno su una sua parola
        const poi = ancore.filter((i) => i > dove + 1);
        const [uno, due, tre] = poi.length >= 3 ? [poi[0], poi[1], poi[2]] : poi.length === 2 ? [undefined, poi[0], poi[1]] : [undefined, poi[0], undefined];
        sc.dati = {regalo: scelto, invito: `${pulita(mie[invito].testo)} ${parola}`.trim(), sotto: regali[scelto].titolo, segno};
        sc.segni = {[segno]: segni[segno]};
        if (uno !== undefined) Object.assign(sc.dati, {sopra: scrittaDi(parole, uno, t.a).testo, segnoSopra: nomeDi.get(uno)});
        if (due !== undefined) sc.dati.segnoSotto = nomeDi.get(due);
        if (tre !== undefined) sc.dati.segnoGiro = nomeDi.get(tre);
        for (const i of [uno, due, tre]) if (i !== undefined) sc.segni[nomeDi.get(i)] = segni[nomeDi.get(i)];
      } else {
        sc.blocco = 'chiusura';
        sc.dati = {parola: parola || 'INFO', segno};
        sc.segni = {[segno]: segni[segno]};
      }
      suoni.push({scena: scene.length, suono: 'whoosh', su: parole[dove].chiave, forza: 9});
    } else {
      const voci = ancore.map((i) => ({i, ...scrittaDi(parole, i, t.a), segno: nomeDi.get(i)}));
      const frase = t.domanda ? (() => {
        // la domanda: dall'inizio della sua frase al punto interrogativo
        const fine = mie.findIndex((p) => /\?["”»)]*$/.test(p.testo));
        let inizio = fine;
        while (inizio > 0 && !fineFrase(mie[inizio - 1])) inizio--;
        return {inizio, fine, testo: mie.slice(inizio, fine + 1).map((p) => p.testo).join(' ')};
      })() : null;
      if (frase && frase.testo.length <= 78 && frase.inizio <= 2) {
        // la scena si apre con la domanda: la domanda grande, poi niente altro da leggere
        const segno = nomeDi.get(t.da + frase.inizio) ?? nomeLibero('domanda');
        if (!nomeDi.has(t.da + frase.inizio)) segni[segno] = parole[t.da + frase.inizio].chiave;
        sc.blocco = 'domanda';
        sc.dati = {domanda: frase.testo, segno};
        sc.segni = {[segno]: segni[segno]};
        // dopo la domanda la scena non resta ferma: il protagonista cambia stato sulle parole che seguono
        sc.poi = ancore.filter((i) => i !== t.da + frase.inizio).map((i) => nomeDi.get(i));
        for (const nome of sc.poi) sc.segni[nome] = segni[nome];
      } else {
        // Le scene sono corte: per non farne quattro uguali di fila si gira tra i pezzi pronti che si possono
        // riempire senza capire il testo. Una cosa sola da dire: una frase grande. Una scena che frena: un "attenzione"
        // con i suoi punti. Altrimenti parole ed elenco, una volta l'uno e una volta l'altro.
        const prima = scene[scene.length - 1]?.blocco;
        const semplici = voci.map((v) => ({testo: v.testo, segno: v.segno}));
        if (voci.length === 1 && prima !== 'titolo') {
          sc.blocco = 'titolo';
          sc.dati = {titolo: voci[0].testo, segno: voci[0].segno};
        } else if (frena && voci.length >= 2 && voci.length <= 4 && prima !== 'avviso') {
          sc.blocco = 'avviso';
          sc.dati = {titolo: voci[0].testo, segno: voci[0].segno, punti: semplici.slice(1)};
        } else if (voci.length >= 2 && prima === 'parole') {
          sc.blocco = 'lista';
          sc.dati = {voci: semplici};
        } else {
          sc.blocco = 'parole';
          sc.dati = {parole: semplici};
        }
        sc.segni = segni;
        for (const v of voci) {
          if (v.numero === null) continue;
          suoni.push({scena: scene.length, suono: 'ding', su: segni[v.segno], forza: 6});
        }
      }
      const primo = Object.keys(sc.segni)[0];
      const allarme = mie.find((p) => FRENA.test(senzaAccenti(p.chiave)));
      if (allarme && sc.blocco !== 'domanda') suoni.push({scena: scene.length, suono: 'errore', su: allarme.chiave, forza: 8});
      else if (mie.some((p) => CHIUDE.test(senzaAccenti(p.chiave)))) suoni.push({scena: scene.length, suono: 'successo', su: sc.segni[primo], forza: 5});
      else suoni.push({scena: scene.length, suono: 'pop', su: sc.segni[primo], forza: n === 0 ? 4 : 2});
    }
    // enfasi: i numeri e i nomi propri della scena, al più due per scena e otto in tutto
    const daDire = [];
    mie.forEach((p, k) => {
      const proprio = /^\p{Lu}/u.test(p.testo) && k > 0 && !fineFrase(mie[k - 1]) && pieno(p);
      if ((proprio || (numeroDi(p) !== null && p.chiave.length > 3) || (invito >= 0 && k === invito + 1)) && !daDire.includes(p.chiave) && !p.enfasi) daDire.push(p.chiave);
    });
    const scelte = daDire.slice(0, Math.max(0, Math.min(2, 8 - enfasiMesse)));
    if (scelte.length) sc.enfasi = scelte;
    enfasiMesse += scelte.length;
    // dove siamo, come si entra, quanto è larga l'inquadratura, come si muove la camera
    let luogo = DOVE.find(([, r]) => mie.some((p) => r.test(senzaAccenti(p.chiave))))?.[0] ?? null;
    if (!luogo || luogo === luogoPrima) luogo = GIRO_LUOGHI.find((l) => l !== luogoPrima && !scene.some((s) => s.luogo === l)) ?? GIRO_LUOGHI[(n + 3) % GIRO_LUOGHI.length];
    sc.luogo = ultima && invito >= 0 ? 'vuoto' : luogo;
    luogoPrima = sc.luogo;
    if (n > 0) sc.entra = ['avanti', 'destra', 'avanti', 'basso', 'avanti', 'sinistra'][n % 6];
    sc.campo = sc.blocco === 'ebook' || sc.blocco === 'chiusura' ? 'medio' : CAMPI[[0, 1, 2, 1][n % 4]];
    sc.camera = sc.blocco === 'ebook' || sc.blocco === 'chiusura' ? 'spinta' : frena ? 'indietro' : CAMERE.filter((c) => c !== 'ferma')[n % (CAMERE.length - 1)];
    if (frena) sc.tinta = '#E8455A';
    // il protagonista: resta lo stesso, cambia stato con il senso della scena
    if (ultima && invito >= 0) sc.protagonista = false;
    else if (frena) sc.protagonista = {colore: '#FF4D5E', onda: 1.6, acceso: 1};
    else if (sc.blocco === 'domanda') sc.protagonista = [{colore: '#5CF2C8', onda: 0.9, acceso: 0.45, carica: 0.3, grandezza: 0.62}, ...(sc.poi ?? []).map((segno, k) => ({segno, acceso: 1, carica: Math.min(1, 0.5 + 0.25 * k), grandezza: k % 2 ? 0.62 : 0.74}))];
    else sc.protagonista = {colore: '#5CF2C8', onda: 0.5, acceso: 1, carica: Math.min(1, 0.4 + 0.2 * n)};
    delete sc.poi;
    scene.push(sc);
  });

  // effetti sonori: da 4 a 6 in tutto. Prima i più importanti, uno per scena; se non bastano, un secondo nella stessa
  // scena; se ancora non bastano, un "pop" sulle altre comparse.
  const stessa = (x, y) => x.scena === y.scena && JSON.stringify(x.su) === JSON.stringify(y.su);
  const ordinati = [...suoni].sort((x, y) => y.forza - x.forza);
  const tenuti = [];
  for (const s of ordinati) if (tenuti.length < 6 && !tenuti.some((x) => x.scena === s.scena)) tenuti.push(s);
  for (const s of ordinati) if (tenuti.length < 4 && !tenuti.some((x) => stessa(x, s))) tenuti.push(s);
  scene.forEach((sc, n) => {
    for (const su of Object.values(sc.segni ?? {})) {
      const s = {scena: n, suono: 'pop', su};
      if (tenuti.length < 4 && !tenuti.some((x) => stessa(x, s))) tenuti.push(s);
    }
  });
  for (const s of tenuti) (scene[s.scena].suoni ??= []).push(typeof s.su === 'string' ? {suono: s.suono, su: s.su} : {suono: s.suono, ...s.su});
  // se il testo non ha nomi né numeri da mettere in evidenza, l'enfasi va sulla parola più lunga delle prime scene
  if (!enfasiMesse && !parole.some((p) => p.enfasi)) {
    for (const sc of scene.slice(0, 4)) {
      const parola = Object.values(sc.segni ?? {}).map((a) => (typeof a === 'string' ? a : a.su)).sort((x, y) => y.length - x.length)[0];
      if (parola) sc.enfasi = [parola];
    }
  }

  const piano = {
    versione: 1,
    regista: 'di serie',
    titolo: titolo || parole.slice(0, 8).map((p) => p.testo).join(' ').replace(/[,;:.!?…]+$/, ''),
    protagonista: {tipo: salute ? 'peptide' : 'goccia', colore: '#5CF2C8'},
    scene,
  };
  return {piano};
}

/** npm run regia <reel> [nuova] [regalo=nome|nessuno] */
/** L'atmosfera che un reel ha già: quella scelta a mano, altrimenti quella del suo piano, altrimenti il fondo di sempre. */
/**
 * L'atmosfera che il regista di serie dà a un reel. Dipende solo dai nomi: il suo e quelli dei reel che lo
 * precedono nella cartella, in ordine di nome. Non legge cosa c'è scritto negli altri reel e non guarda quando sono
 * stati fatti: in qualunque ordine si lancino i comandi esce la stessa. Si parte dal primo nome dell'elenco: ognuno
 * prende l'atmosfera del suo nome, e se è quella del nome prima passa alla successiva.
 */
export function atmosferaPerReel(slug, reel = elencoReel()) {
  let precedente = null;
  for (const nome of [...new Set(reel)].filter((r) => r < slug).sort()) precedente = atmosferaDalNome(nome, precedente);
  return atmosferaDalNome(slug, precedente);
}

export async function comandoRegia(slug, argomenti = []) {
  if (!slug) throw new ErroreFmlab('Quale reel? Esempio: npm run regia reta-ginocchio');
  const dir = cartellaReel(slug);
  const file = path.join(dir, 'piano.json');
  const fileTesto = path.join(dir, 'testo.txt');
  if (!fs.existsSync(fileTesto)) throw new ErroreFmlab(`In ${rel(dir)} manca testo.txt, il testo del reel. Un reel dal testo si crea con: npm run nuovo ${slug} "Titolo" testo=<file.txt>`);
  if (fs.existsSync(file) && !argomenti.includes('nuova')) throw new ErroreFmlab(`${rel(file)} c'è già: non lo tocco. Per rifarlo da capo (e perdere le modifiche): npm run regia ${slug} nuova`);
  const testo = fs.readFileSync(fileTesto, 'utf8');
  const scritto = fs.existsSync(path.join(dir, 'copione.md')) ? /^#\s+(.+)$/m.exec(fs.readFileSync(path.join(dir, 'copione.md'), 'utf8'))?.[1] : '';
  let regalo = argomenti.find((a) => a.startsWith('regalo='))?.slice(7);
  try {
    regalo ??= leggiImpostazioni(slug).regalo;
  } catch {
    // impostazioni non leggibili: regalo di serie
  }
  const {piano} = regia(testo, {titolo: (scritto ?? '').trim(), regalo: regalo ?? 'auto'});
  // l'atmosfera del fondo: se nessuno l'ha scelta a mano la decide il nome del reel, e resta scritta nel piano
  let scelta = 'auto';
  try {
    scelta = leggiImpostazioni(slug).atmosfera ?? 'auto';
  } catch {
    scelta = 'auto';
  }
  if (scelta === 'auto') piano.atmosfera = atmosferaPerReel(slug);
  // la musica di sottofondo: una trama del kit, anche questa dal nome del reel (a mano: npm run imposta <reel> musica=<nome>)
  let trama = 'auto';
  try {
    trama = leggiImpostazioni(slug).trama ?? 'auto';
  } catch {
    trama = 'auto';
  }
  if (trama === 'auto') piano.musica = musicaDalNome(slug);
  const esito = controllaPiano(piano, testo, {cartella: dir});
  if (esito.errori.length) throw new ErroreFmlab(`Il regista di serie ha scritto un piano che non passa il controllo (è un difetto del kit, segnalalo):\n${esito.errori.map((e) => '  ✗ ' + e).join('\n')}`);
  fs.writeFileSync(file, JSON.stringify(piano, null, 2) + '\n');
  console.log(`Scritto ${rel(file)}: ${piano.scene.length} scene (${piano.scene.map((s) => s.blocco).join(', ')}).${piano.atmosfera ? ` Atmosfera: ${piano.atmosfera} (a mano: npm run imposta ${slug} atmosfera=<nome>).` : ''}`);
  for (const a of esito.avvisi) console.log(`  ! ${a}`);
  console.log(`È il piano di serie, fatto di regole: leggilo e miglioralo scena per scena (npm run piano: i blocchi), poi  npm run monta ${slug}`);
  return piano;
}
