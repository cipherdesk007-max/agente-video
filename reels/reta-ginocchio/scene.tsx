// REEL: Reta e dolore al ginocchio: quanto è merito del farmaco?
// Le scene come codice. Ogni scena corrisponde a un [scena:nome] di copione.md e si aggancia alle parole
// con s.dopo('segno'): secondi trascorsi da quando viene pronunciata la parola marcata con [segno].
// Ogni numero che compare qui ha la sua riga in fonti.md.
import {
  Bagliore,
  Cifra,
  Etichetta,
  Faro,
  Fonte,
  Linea,
  Onde,
  Scena3D,
  Scritta,
  Spunta,
  Targa,
  alfa,
  bloccoChiusura,
  cilindro,
  curve,
  definisciReel,
  fiala3d,
  freccia3d,
  ginocchio3d,
  impulso,
  limita,
  miscela,
  mix,
  molla,
  numero,
  ombra,
  onda,
  pillola3d,
  proietta,
  rampa,
  scatola,
  scegli,
  sfera,
  stile,
  useScena,
  useTempo,
} from '../../libreria';
import type {CameraTre, Faccia, Posto} from '../../libreria';

const C = stile.colori;
/** I colori del reel: verde acqua = il farmaco, azzurro = il placebo, rosso = dolore e rischi, giallo = ciò che conta. */
const RETA = C.luce;
const PLACEBO = C.luce2;
const DOLORE = C.negativo;
const ORO = C.accento;

const TESTI = {
  it: {
    reta: 'RETA',
    placebo: 'PLACEBO',
    menoDolore: 'meno dolore anche col placebo',
    domanda: 'QUANTO È MERITO DELLA RETA?',
    mese: 'NOVEMBRE 2026',
    pubblicati: 'pubblicati questo mese',
    rivista: 'THE NEW ENGLAND JOURNAL OF MEDICINE · 8 NOV 2026',
    contesto: 'da 0 a 10 · si partiva da 6',
    studio1: 'STUDIO 1',
    studio2: 'STUDIO 2',
    persone: 'PERSONE',
    settimane: 'settimane',
    adulti: 'ADULTI CON ARTROSI AL GINOCCHIO',
    conPeso: 'tutti con sovrappeso o obesità',
    scala: 'IL DOLORE, DA 0 A 10',
    inizio: 'in media, all\'inizio: 6',
    zero: '0 = nessun dolore',
    dieci: '10 = il più forte',
    punti: 'PUNTI',
    finoA: 'da −3,2 a −4,0 secondo studio e dose',
    conPlacebo: '−2,1 e −1,9 nei due studi',
    applausi: 'APPLAUSI',
    palcoVuoto: 'il palco è ancora vuoto',
    effettoPlacebo: 'EFFETTO PLACEBO',
    attesa: 'aspettarsi di stare meglio dà già sollievo',
    entrambi: 'in entrambi gli studi',
    inPiu: 'PUNTI IN PIÙ DEL PLACEBO',
    miracolo: 'non è un miracolo',
    caso: 'ma non è un caso',
    autori: 'lo riportano gli autori',
    gravi: 'EFFETTI COLLATERALI GRAVI',
    graviSotto: 'persone con almeno uno, nello studio 1',
    finoPerc: 'fino a',
    comuni: 'più comuni: nausea, diarrea, stitichezza',
    studio2Gravi: 'studio 2: dal 4,2% al 14,6% con Reta, 6,9% con placebo',
    dueStudi: '2 STUDI · 1.019 PERSONE',
    piuDelPlacebo: 'PIÙ DEL PLACEBO',
    perChi: 'in adulti con artrosi e sovrappeso',
    chi: 'chi li ha finanziati?',
    azienda: 'FINANZIATI DA ELI LILLY',
    aziendaSotto: 'l\'azienda che produce il farmaco',
    stato: 'farmaco sperimentale · non approvato',
    manda: 'MANDALO A QUELL\'AMICO',
    crac: 'crac',
    commenta: 'COMMENTA',
    database: 'e ricevi il database gratis',
    composti: 'su questo e tanti altri composti',
    fonte: 'Fonte: New England Journal of Medicine, 8 nov 2026',
  },
};

function useTesti() {
  return scegli(useTempo().lingua, TESTI);
}

// ───────────────────────── gli oggetti del reel ─────────────────────────

/** Il ginocchio (dalla libreria: `ginocchio3d`), con il rosso del dolore di questo reel. */
const ginocchio = (cosa: {dolore?: number; piega?: number} & Posto = {}): Faccia[] => ginocchio3d({coloreDolore: DOLORE, ...cosa});

function Ginocchio({x, y, zoom = 1, dolore, piega = 14, giro, opacita = 1}: {x: number; y: number; zoom?: number; dolore: number; piega?: number; giro: number; opacita?: number}) {
  const camera: CameraTre = {giro, alza: 8, distanza: 1500, zoom};
  return (
    <>
      <Bagliore x={x} y={y} raggio={330 * zoom} colore={DOLORE} forza={0.55 * limita(dolore) * opacita} />
      <Scena3D x={x} y={y} camera={camera} opacita={opacita} oggetti={ginocchio({dolore, piega})} />
    </>
  );
}

/** La scala del dolore: una barra dal verde al rosso tra `x0` (zero) e `x1` (dieci). `p` (0…1) la fa comparire da sinistra. */
function Barra({x0, x1, y, alta = 44, p = 1, tacche = true}: {x0: number; x1: number; y: number; alta?: number; p?: number; tacche?: boolean}) {
  const larga = x1 - x0;
  return (
    <>
      <div style={{position: 'absolute', left: x0, top: y - alta / 2, width: larga, height: alta, borderRadius: alta / 2, background: alfa('#FFFFFF', 0.09)}} />
      <div style={{position: 'absolute', left: x0, top: y - alta / 2, width: larga * limita(p), height: alta, borderRadius: alta / 2, overflow: 'hidden', boxShadow: `0 0 34px ${alfa(ORO, 0.25)}`}}>
        <div style={{width: larga, height: alta, background: `linear-gradient(90deg, ${C.positivo} 0%, ${ORO} 52%, ${DOLORE} 100%)`}} />
      </div>
      {Array.from({length: 11}, (_, k) => {
        const grande = k % 5 === 0;
        if (!tacche && !(k === 0 || k === 10)) return null;
        return (
          <div
            key={k}
            data-fmlab-zona="testo"
            style={{
              position: 'absolute',
              left: x0 + (larga * k) / 10,
              top: y + alta / 2 + 12,
              transform: 'translateX(-50%)',
              fontFamily: stile.font.titoli,
              fontWeight: grande ? 900 : 700,
              fontSize: grande ? 40 : 26,
              color: grande ? C.testo : C.tenue,
              opacity: rampa(p * 11 - k, 1),
            }}
          >
            {k}
          </div>
        );
      })}
    </>
  );
}

/** L'indicatore che scorre sulla barra: un'asta con un pallino. */
function Indicatore({x, y, alta = 44, colore, da}: {x: number; y: number; alta?: number; colore: string; da: number}) {
  if (da <= 0) return null;
  const p = molla(da, {rigidita: 210, smorzamento: 16});
  const opacita = rampa(da, 0.15);
  return (
    <>
      <div style={{position: 'absolute', left: x - 4, top: y - alta / 2 - 34, width: 8, height: alta + 46, borderRadius: 4, background: '#FFFFFF', opacity: opacita, transformOrigin: '50% 100%', transform: `scaleY(${p.toFixed(4)})`, boxShadow: `0 0 16px ${alfa(colore, 0.9)}`}} />
      <div style={{position: 'absolute', left: x - 19, top: y - alta / 2 - 62, width: 38, height: 38, borderRadius: 19, boxSizing: 'border-box', background: colore, border: '5px solid #FFFFFF', opacity: opacita, transform: `scale(${p.toFixed(4)})`, boxShadow: `0 0 26px ${alfa(colore, 0.95)}`}} />
    </>
  );
}

// ───────────────────────── 1 · aggancio ─────────────────────────
// "Nei nuovi studi sulla Reta per il dolore al ginocchio, anche chi ha ricevuto il placebo ha avuto meno dolore.
//  Quindi, quanto di questo miglioramento è davvero merito della Reta? Vediamo cosa è successo."

function Aggancio() {
  const s = useScena();
  const T = useTesti();
  const reta = s.dopo('reta');
  const gin = s.dopo('ginocchio');
  const placebo = s.dopo('placebo');
  const meno = s.dopo('meno');
  const quanto = s.dopo('quanto');
  const merito = s.dopo('merito');
  const calma = rampa(meno, 0.9, curve.morbida);
  const dolore = mix(1, 0.5, calma) * (1 + 0.1 * onda(s.t, 0.9));
  const entra = mix(0.86, 1, molla(s.t + 0.25, {rigidita: 120, smorzamento: 14}));
  return (
    <>
      <Ginocchio x={540} y={850} zoom={0.76 * entra} dolore={dolore} giro={26 + s.t * 3} piega={14 + 5 * onda(s.t, 3.1)} />
      {gin > 0 ? <Onde x={540} y={815} t={gin} colore={DOLORE} quante={3} periodo={1.25} raggioMax={300} spessore={4} forza={0.75 * mix(1, 0.35, calma)} /> : null}

      {/* la fiala: la Reta */}
      {reta > -0.1 ? (
        <>
          <Bagliore x={225} y={820} raggio={200} colore={RETA} forza={0.3 * rampa(reta, 0.4)} />
          <Scena3D x={225} y={840} camera={{giro: -24 + s.t * 6, alza: 12, distanza: 1400, zoom: 1.05 * molla(reta, {rigidita: 170, smorzamento: 15})}} oggetti={fiala3d({liquido: RETA})} opacita={rampa(reta, 0.2)} />
        </>
      ) : null}
      <Etichetta x={225} y={996} testo={T.reta} colore={RETA} dimensione={32} piena da={reta - 0.15} />

      {/* la capsula: il placebo */}
      {placebo > -0.1 ? (
        <>
          <Bagliore x={838} y={815} raggio={200} colore={PLACEBO} forza={0.3 * rampa(placebo, 0.4)} />
          <Scena3D x={838} y={822} camera={{giro: 20 - s.t * 6, alza: 14, distanza: 1400, zoom: 0.9 * molla(placebo, {rigidita: 170, smorzamento: 15})}} oggetti={pillola3d({colori: [PLACEBO, '#F4F7FB']})} opacita={rampa(placebo, 0.2)} />
        </>
      ) : null}
      <Etichetta x={832} y={996} testo={T.placebo} colore={PLACEBO} dimensione={32} piena da={placebo - 0.15} />
      <Etichetta x={540} y={1196} testo={T.menoDolore} colore={PLACEBO} dimensione={28} da={meno} fino={quanto} />

      {/* la domanda */}
      <Cifra x={715} y={640} valore="?" dimensione={190} colore={ORO} da={quanto} />
      <Targa x={540} y={1218} titolo={T.domanda} dimensione={44} colore={ORO} da={merito - 0.1} />
    </>
  );
}

// ───────────────────────── 2 · gli studi ─────────────────────────
// "Questo mese sono stati pubblicati due studi sull'uomo in una delle riviste mediche più importanti al mondo.
//  Hanno coinvolto circa mille adulti con artrosi al ginocchio, seguiti per oltre un anno."

function Scheda({x, y, titolo, nome, persone, durata, da, conta, accendi, colore}: {x: number; y: number; titolo: string; nome: string; persone: string; durata: string; da: number; conta: number; accendi: number; colore: string}) {
  const T = useTesti();
  if (da <= 0) return null;
  const p = molla(da, {rigidita: 200, smorzamento: 17});
  return (
    <div
      data-fmlab-zona="testo"
      style={{
        position: 'absolute',
        left: x - 205,
        top: y - 150,
        width: 410,
        height: 300,
        borderRadius: 28,
        boxSizing: 'border-box',
        border: `3px solid ${alfa(colore, 0.85)}`,
        background: `linear-gradient(180deg, ${alfa(colore, 0.2)}, ${alfa('#0B1220', 0.86)})`,
        boxShadow: `0 0 54px ${alfa(colore, 0.28)}`,
        transform: `translateY(${((1 - p) * 46).toFixed(2)}px) scale(${mix(0.86, 1, p).toFixed(4)})`,
        opacity: rampa(da, 0.18),
        fontFamily: stile.font.testo,
        color: C.testo,
        textAlign: 'center',
      }}
    >
      <div style={{marginTop: 24, fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', color: colore}}>{titolo}</div>
      <div style={{marginTop: 2, fontSize: 23, fontWeight: 600, letterSpacing: '0.06em', color: C.tenue}}>{nome}</div>
      <div style={{marginTop: 16, fontFamily: stile.font.titoli, fontSize: 92, fontWeight: 900, lineHeight: 1, fontFeatureSettings: '"tnum"', color: miscela(C.testo, ORO, rampa(conta, 0.25)), transform: `scale(${(1 + 0.08 * impulso(conta, 0.45)).toFixed(4)})`}}>{persone}</div>
      <div style={{fontSize: 22, fontWeight: 700, letterSpacing: '0.16em', color: C.tenue}}>{T.persone}</div>
      <div style={{marginTop: 12, fontSize: 31, fontWeight: 700, color: miscela(C.testo, ORO, rampa(accendi, 0.3))}}>{durata}</div>
    </div>
  );
}

function Studi() {
  const s = useScena();
  const T = useTesti();
  const {lingua} = useTempo();
  const due = s.dopo('due');
  const rivista = s.dopo('rivista');
  const coinvolto = s.dopo('coinvolto');
  const mille = s.dopo('mille');
  const anno = s.dopo('anno');
  return (
    <>
      <Bagliore x={540} y={800} raggio={540} colore={PLACEBO} forza={0.16} />
      <Targa x={540} y={790} titolo={T.mese} sotto={T.pubblicati} dimensione={76} colore={PLACEBO} da={s.t - 0.15} fino={due + 0.25} />
      <Etichetta x={540} y={548} testo={T.rivista} dimensione={25} piena colore={C.testo} da={rivista} />
      <Scheda x={302} y={752} titolo={T.studio1} nome="TRIUMPH-4" persone="445" durata={`68 ${T.settimane}`} da={due} conta={coinvolto} accendi={anno} colore={RETA} />
      <Scheda x={778} y={752} titolo={T.studio2} nome="TRIUMPH-1-OA" persone="574" durata={`80 ${T.settimane}`} da={due - 0.2} conta={coinvolto - 0.15} accendi={anno} colore={PLACEBO} />
      <Cifra x={520} y={1040} valore={numero(Math.round(mix(0, 1019, rampa(mille, 0.9))), 0, lingua)} etichetta={T.adulti} dimensione={126} colore={ORO} da={mille} />
      <Scritta x={520} y={1186} dimensione={29} colore={C.tenue} peso={600} da={mille - 0.6}>
        {T.conPeso}
      </Scritta>
      <Fonte testo={T.fonte} da={rivista} />
    </>
  );
}

// ───────────────────────── 3 · la scala ─────────────────────────
// "Il dolore veniva valutato su una scala da zero a dieci, dove dieci indicava il dolore più forte."

function Scala() {
  const s = useScena();
  const T = useTesti();
  const scala = s.dopo('scala');
  const dieci = s.dopo('dieci');
  const X0 = 150;
  const X1 = 930;
  const Y = 800;
  const xDi = (v: number) => X0 + ((X1 - X0) * v) / 10;
  const p = rampa(scala + 0.5, 1.1, curve.morbida);
  return (
    <>
      <Bagliore x={540} y={Y} raggio={520} colore={ORO} forza={0.13} />
      <Etichetta x={540} y={560} testo={T.scala} dimensione={34} piena colore={C.testo} da={s.t - 0.3} />
      <Barra x0={X0} x1={X1} y={Y} alta={58} p={p} />
      {/* da dove partivano, in media */}
      <Indicatore x={xDi(6)} y={Y} alta={58} colore={ORO} da={scala - 1.0} />
      <Etichetta x={xDi(6)} y={672} testo={T.inizio} dimensione={28} colore={ORO} da={scala - 1.2} />
      {/* i due estremi */}
      <Etichetta x={262} y={985} testo={T.zero} dimensione={28} colore={C.positivo} da={scala - 0.3} />
      <Etichetta x={790} y={985} testo={T.dieci} dimensione={28} piena colore={DOLORE} da={dieci} />
      {dieci > 0 ? <Onde x={X1 - 8} y={Y} t={dieci} colore={DOLORE} quante={2} periodo={1.1} raggioMax={150} spessore={4} forza={0.8} /> : null}
      {/* il ginocchio: fa male quanto dice l'indicatore */}
      <Ginocchio x={540} y={1170} zoom={0.34} dolore={0.62 + 0.08 * onda(s.t, 1)} giro={30 + s.t * 7} />
    </>
  );
}

// ───────────────────────── 4 · i risultati ─────────────────────────
// "Con la Reta, il dolore è diminuito fino a quasi quattro punti.
//  Ma anche con il placebo, una sostanza senza principio attivo, è diminuito di circa due punti."

function Riga({y, nome, colore, da, scende, durata, calo, nota}: {y: number; nome: string; colore: string; da: number; scende: number; durata: number; calo: number; nota: string}) {
  const T = useTesti();
  const {lingua} = useTempo();
  const X0 = 96;
  const X1 = 676;
  const xDi = (v: number) => X0 + ((X1 - X0) * v) / 10;
  // `scende` = secondi da quando la voce dice "è diminuito"; `durata` = quanto manca, da lì, al numero
  const p = rampa(scende, Math.max(0.6, durata), curve.morbida);
  const ora = 6 - calo * p;
  return (
    <>
      <Etichetta x={X0 + 86} y={y - 96} testo={nome} colore={colore} dimensione={32} piena da={da} />
      {da > 0 ? (
        <div style={{opacity: rampa(da, 0.25)}}>
          <Barra x0={X0} x1={X1} y={y} alta={34} p={rampa(da, 0.7, curve.esce)} tacche={false} />
          {/* il tratto guadagnato */}
          {p > 0 ? <div style={{position: 'absolute', left: xDi(ora), top: y - 40, width: xDi(6) - xDi(ora), height: 12, borderRadius: 6, background: colore, boxShadow: `0 0 20px ${alfa(colore, 0.9)}`}} /> : null}
          <div style={{position: 'absolute', left: xDi(6) - 2, top: y - 46, width: 4, height: 24, background: alfa('#FFFFFF', 0.6)}} />
        </div>
      ) : null}
      <Indicatore x={xDi(ora)} y={y} alta={34} colore={colore} da={da - 0.35} />
      <Cifra x={868} y={y - 18} valore={`${calo * p < 0.05 ? '' : '−'}${numero(calo * p, 1, lingua)}`} etichetta={T.punti} dimensione={128} colore={colore} da={scende - 0.1} />
      <Scritta x={(X0 + X1) / 2} y={y + 92} dimensione={25} colore={C.tenue} peso={600} da={scende - 0.3}>
        {nota}
      </Scritta>
    </>
  );
}

function Risultati() {
  const s = useScena();
  const T = useTesti();
  return (
    <>
      <Bagliore x={540} y={860} raggio={560} colore={RETA} forza={0.1} />
      <Riga y={670} nome={T.reta} colore={RETA} da={s.t - 0.1} scende={s.dopo('calareta')} durata={s.dopo('calareta') - s.dopo('quattro')} calo={3.96} nota={T.finoA} />
      <Riga y={960} nome={T.placebo} colore={PLACEBO} da={s.dopo('conplacebo')} scende={s.dopo('calaplacebo')} durata={s.dopo('calaplacebo') - s.dopo('duepunti')} calo={2.0} nota={T.conPlacebo} />
      <Etichetta x={386} y={1180} testo={T.contesto} dimensione={26} colore={C.tenue} da={s.t - 0.6} />
      <Fonte testo={T.fonte} da={s.dopo('quattro')} />
    </>
  );
}

// ───────────────────────── 5 · l'applauso ─────────────────────────
// "È un po' come quando il pubblico inizia ad applaudire prima ancora che la band salga sul palco:
//  a volte basta aspettarsi di stare meglio per provare un po' di sollievo."

function Applauso() {
  const s = useScena();
  const T = useTesti();
  const pubblico = s.dopo('pubblico');
  const prima = s.dopo('prima');
  const palco = s.dopo('palco');
  const aspettarsi = s.dopo('aspettarsi');
  const camera: CameraTre = {giro: -14 + s.t * 1.3, alza: 15, distanza: 1700, zoom: 0.92};
  const accesa = rampa(palco, 0.6);
  const batte = pubblico > 0 ? 1 : 0;
  const teste = [-3, -2, -1, 0, 1, 2, 3].flatMap((k) =>
    sfera({raggio: 38, colore: '#222C42', pos: [k * 96, -86 + batte * 9 * Math.max(0, onda(pubblico + k * 0.13, 0.42)), 320], paralleli: 7, meridiani: 12})
  );
  const oggetti: Faccia[] = [
    ...ombra({pos: [0, 0, 0], raggio: 350, forza: 0.5}),
    // il palco
    ...cilindro({raggio: 300, altezza: 44, colore: '#27324C', coloreTappi: miscela('#35436A', '#7C8CC0', 0.45 * accesa), pos: [0, 22, 0], lati: 44}),
    // l'asta del microfono, da sola
    ...cilindro({raggio: 44, altezza: 10, colore: '#5F6C87', pos: [0, 49, 0], lati: 20}),
    ...cilindro({raggio: 7, altezza: 236, colore: '#9AA7BD', pos: [0, 172, 0], lati: 10}),
    ...sfera({raggio: 23, colore: '#D4DDEE', pos: [0, 304, 0], emissione: 0.35 * accesa, paralleli: 8, meridiani: 14}),
    // il pubblico
    ...teste,
  ];
  return (
    <>
      <Faro x={540} y={592} verso={90} lunghezza={486} apertura={40} colore="#C9D6FF" forza={0.18 + 0.42 * accesa} />
      <Scena3D x={540} y={960} camera={camera} oggetti={oggetti} />
      {/* gli applausi salgono dal pubblico */}
      {pubblico > 0
        ? [300, 540, 780].map((x, k) => <Onde key={x} x={x} y={1140} t={pubblico + k * 0.11} colore={ORO} quante={3} periodo={0.46} raggioMax={130} spessore={4} forza={0.8} verso={-90} apertura={110} />)
        : null}
      <Etichetta x={228} y={1228} testo={T.applausi} dimensione={30} piena colore={ORO} da={pubblico} />
      <Etichetta x={540} y={548} testo={T.palcoVuoto} dimensione={30} colore={C.testo} da={prima} fino={aspettarsi + 0.3} />
      <Targa x={540} y={560} titolo={T.effettoPlacebo} sotto={T.attesa} dimensione={58} colore={PLACEBO} da={aspettarsi + 0.05} />
    </>
  );
}

// ───────────────────────── 6 · la differenza ─────────────────────────
// "Quindi, per capire quanto funziona davvero la Reta, bisogna guardare la differenza. In entrambi gli studi,
//  il dolore è diminuito da uno a due punti in più rispetto al placebo. Non è un miracolo, ma non è nemmeno
//  un risultato dovuto al caso."

function Differenza() {
  const s = useScena();
  const T = useTesti();
  const confronta = s.dopo('confronta');
  const diff = s.dopo('differenza');
  const entrambi = s.dopo('entrambi');
  const unodue = s.dopo('unodue');
  const miracolo = s.dopo('miracolo');
  const caso = s.dopo('caso');
  const U = 70; // pixel per ogni punto di dolore in meno
  const BASE: [number, number] = [540, 1085];
  const camera: CameraTre = {giro: -17 + s.t * 1.05, alza: 13, distanza: 1800};
  const hR = Math.max(2, 3.9 * U * rampa(s.t - 0.25, 1.0, curve.esce));
  const hP = 2.1 * U * rampa(confronta, 0.9, curve.esce);
  const acceso = rampa(diff, 0.6);
  const sotto = Math.min(hR, hP);
  const oggetti: Faccia[] = [
    ...ombra({pos: [0, 0, 0], raggio: 370, forza: 0.42}),
    ...(hP > 1 ? scatola({misure: [150, hP, 150], colore: PLACEBO, pos: [170, hP / 2, 0], emissione: 0.2}) : []),
    // la colonna della Reta: fin dove arriva il placebo è "quello che succede comunque"; sopra c'è la differenza
    ...(sotto > 1 ? scatola({misure: [150, sotto, 150], colore: miscela(RETA, '#22303F', 0.6 * acceso), pos: [-170, sotto / 2, 0], emissione: 0.2 * (1 - 0.7 * acceso)}) : []),
    ...(hR > hP + 1 ? scatola({misure: [150, hR - hP, 150], colore: miscela(RETA, ORO, acceso), pos: [-170, hP + (hR - hP) / 2, 0], emissione: 0.22 + 0.5 * acceso}) : []),
  ];
  const cimaR = proietta([-170, hR, 0], camera, BASE);
  const cimaP = proietta([170, hP, 0], camera, BASE);
  const piedeR = proietta([-170, 0, 110], camera, BASE);
  const piedeP = proietta([170, 0, 110], camera, BASE);
  const livelloA = proietta([262, hP, 80], camera, BASE);
  const livelloB = proietta([-262, hP, 80], camera, BASE);
  const metaDiff = proietta([-262, hP + (hR - hP) / 2, 80], camera, BASE);
  return (
    <>
      <Bagliore x={540} y={900} raggio={560} colore={RETA} forza={0.1 + 0.08 * acceso} />
      <Scena3D x={BASE[0]} y={BASE[1]} camera={camera} oggetti={oggetti} />
      <Scritta x={cimaR.x} y={cimaR.y - 58} dimensione={56} colore={RETA} peso={900} da={s.t - 1.0}>
        −3,9
      </Scritta>
      <Scritta x={cimaP.x} y={cimaP.y - 58} dimensione={56} colore={PLACEBO} peso={900} da={confronta - 0.75}>
        −2,1
      </Scritta>
      <Etichetta x={piedeR.x} y={piedeR.y + 44} testo={T.reta} colore={RETA} dimensione={30} piena da={s.t - 0.4} />
      <Etichetta x={piedeP.x} y={piedeP.y + 44} testo={T.placebo} colore={PLACEBO} dimensione={30} piena da={confronta - 0.1} />
      {/* la linea all'altezza del placebo: sopra, è merito del farmaco */}
      <Linea da={[livelloA.x, livelloA.y]} a={[livelloB.x, livelloB.y]} p={rampa(diff, 0.6)} colore={ORO} spessore={4} tratteggio="5 13" />
      {diff > 0.5 ? <Bagliore x={metaDiff.x + 90} y={metaDiff.y} raggio={150} colore={ORO} forza={0.35 * rampa(diff - 0.5, 0.5)} /> : null}
      <Etichetta x={540} y={585} testo={T.entrambi} dimensione={32} colore={C.testo} da={entrambi} fino={unodue + 0.3} />
      <Cifra x={540} y={585} valore="1–2" etichetta={T.inPiu} dimensione={150} colore={ORO} da={unodue} />
      <Etichetta x={292} y={1236} testo={T.miracolo} dimensione={29} colore={C.tenue} da={miracolo} />
      <Etichetta x={706} y={1236} testo={T.caso} dimensione={29} piena colore={RETA} da={caso} />
      <Fonte testo={T.fonte} da={unodue} />
    </>
  );
}

// ───────────────────────── 7 · i rischi ─────────────────────────
// "C'è però un altro aspetto da considerare. Gli autori hanno riportato che gli effetti collaterali gravi erano
//  più frequenti con la Reta; i più comuni, in generale, erano quelli gastrointestinali."

function Attenzione({x, y, lato, da, fino}: {x: number; y: number; lato: number; da: number; fino: number}) {
  if (da <= 0 || fino > 0.3) return null;
  const p = molla(da, {rigidita: 190, smorzamento: 13});
  const h = lato * 0.87;
  return (
    <svg width={lato + 40} height={h + 40} viewBox={`${-lato / 2 - 20} ${-h / 2 - 20} ${lato + 40} ${h + 40}`} style={{position: 'absolute', left: x - lato / 2 - 20, top: y - h / 2 - 20, opacity: rampa(da, 0.15) * (1 - rampa(fino, 0.3)), transform: `scale(${mix(0.5, 1, p).toFixed(4)})`, filter: `drop-shadow(0 0 30px ${alfa(DOLORE, 0.7)})`}}>
      <path d={`M 0 ${-h / 2} L ${lato / 2} ${h / 2} L ${-lato / 2} ${h / 2} Z`} fill={alfa(DOLORE, 0.16)} stroke={DOLORE} strokeWidth={16} strokeLinejoin="round" />
      <rect x={-11} y={-h * 0.18} width={22} height={h * 0.36} rx={11} fill={DOLORE} />
      <circle cx={0} cy={h * 0.32} r={14} fill={DOLORE} />
    </svg>
  );
}

function Rischi() {
  const s = useScena();
  const T = useTesti();
  const altro = s.dopo('altro');
  const autori = s.dopo('autori');
  const effetti = s.dopo('effetti');
  const gravi = s.dopo('gravi');
  const comuni = s.dopo('comuni');
  const gastro = s.dopo('gastro');
  const U = 25; // pixel per ogni punto percentuale
  const BASE: [number, number] = [540, 1040];
  const camera: CameraTre = {giro: 15 - s.t * 0.9, alza: 13, distanza: 1800};
  const cresci = rampa(gravi, 1.0, curve.esce);
  const hR = Math.max(2, 10.8 * U * cresci);
  const hP = Math.max(2, 2.0 * U * cresci);
  const visibile = rampa(effetti, 0.4);
  const oggetti: Faccia[] = [
    ...ombra({pos: [0, 0, 0], raggio: 360, forza: 0.42}),
    ...scatola({misure: [150, hR, 150], colore: DOLORE, pos: [-170, hR / 2, 0], emissione: 0.3}),
    ...scatola({misure: [150, hP, 150], colore: PLACEBO, pos: [170, hP / 2, 0], emissione: 0.2}),
  ];
  const cimaR = proietta([-170, hR, 0], camera, BASE);
  const cimaP = proietta([170, hP, 0], camera, BASE);
  const piedeR = proietta([-170, 0, 110], camera, BASE);
  const piedeP = proietta([170, 0, 110], camera, BASE);
  return (
    <>
      <Bagliore x={540} y={860} raggio={560} colore={DOLORE} forza={0.14} />
      {altro > 0 && effetti < 0.3 ? <Onde x={540} y={868} t={altro} colore={DOLORE} quante={2} periodo={1.4} raggioMax={340} spessore={4} forza={0.6 * (1 - rampa(effetti, 0.3))} /> : null}
      <Attenzione x={540} y={850} lato={330} da={s.t - 0.15} fino={effetti} />
      <Etichetta x={540} y={1092} testo={T.autori} dimensione={30} colore={C.testo} da={autori} fino={effetti + 0.2} />
      <Etichetta x={540} y={552} testo={T.gravi} dimensione={36} piena colore={DOLORE} da={effetti} />
      <Scritta x={540} y={612} dimensione={26} colore={C.tenue} peso={600} da={gravi - 0.2}>
        {T.graviSotto}
      </Scritta>
      <Scena3D x={BASE[0]} y={BASE[1]} camera={camera} oggetti={oggetti} opacita={visibile} />
      <Scritta x={cimaR.x} y={cimaR.y - 62} dimensione={62} colore={DOLORE} peso={900} da={gravi - 0.7}>
        {`${T.finoPerc} 10,8%`}
      </Scritta>
      <Scritta x={cimaP.x} y={cimaP.y - 56} dimensione={56} colore={PLACEBO} peso={900} da={gravi - 0.9}>
        2,0%
      </Scritta>
      <Etichetta x={piedeR.x} y={piedeR.y + 44} testo={T.reta} colore={DOLORE} dimensione={30} piena da={effetti - 0.2} />
      <Etichetta x={piedeP.x} y={piedeP.y + 44} testo={T.placebo} colore={PLACEBO} dimensione={30} piena da={effetti - 0.35} />
      <Scritta x={540} y={1172} dimensione={24} colore={C.tenue} peso={600} da={gravi - 2.0}>
        {T.studio2Gravi}
      </Scritta>
      <Etichetta x={500} y={1232} testo={T.comuni} dimensione={25} piena={gastro > 0} colore={ORO} da={comuni - 0.1} />
      <Fonte testo={T.fonte} da={gravi} />
    </>
  );
}

// ───────────────────────── 8 · la conclusione ─────────────────────────
// "In conclusione, due studi sull'uomo hanno dimostrato che la Reta riduce il dolore al ginocchio più del
//  placebo. Gli studi sono stati condotti con il coinvolgimento dell'azienda che produce la Reta, e i dettagli
//  sono importanti tanto quanto i risultati."

function Conclusione() {
  const s = useScena();
  const T = useTesti();
  const duestudi = s.dopo('duestudi');
  const riduce = s.dopo('riduce');
  const piu = s.dopo('piu');
  const chi = s.dopo('chi');
  const azienda = s.dopo('azienda');
  const dettagli = s.dopo('dettagli');
  const dolore = mix(0.95, 0.28, rampa(riduce, 1.5, curve.morbida)) * (1 + 0.08 * onda(s.t, 1.1));
  return (
    <>
      <Etichetta x={540} y={508} testo={T.dueStudi} dimensione={28} colore={C.testo} da={duestudi} />
      <Ginocchio x={500} y={815} zoom={0.55} dolore={dolore} giro={-26 + s.t * 2.4} piega={12 + 4 * onda(s.t, 3.4)} />
      {piu > 0 ? <Onde x={500} y={800} t={piu} colore={RETA} quante={2} periodo={1.7} raggioMax={300} spessore={4} forza={0.6} /> : null}
      {piu > 0 ? <Spunta x={740} y={690} raggio={54} colore={RETA} p={rampa(piu, 0.45)} /> : null}
      <Targa x={510} y={1112} titolo={T.piuDelPlacebo} sotto={T.perChi} dimensione={60} colore={RETA} da={piu - 0.1} fino={azienda + 0.3} />
      {/* chi ha pagato gli studi, e a che punto è il farmaco */}
      <Etichetta x={510} y={1238} testo={T.chi} dimensione={28} colore={ORO} da={chi} fino={azienda + 0.3} />
      <Targa x={510} y={1112} titolo={T.azienda} sotto={T.aziendaSotto} dimensione={50} colore={ORO} da={azienda} />
      <Etichetta x={510} y={1238} testo={T.stato} dimensione={26} piena colore={ORO} da={dettagli - 0.1} />
    </>
  );
}

// ───────────────────────── 9 · l'amico ─────────────────────────
// "Manda questo video a quell'amico a cui scricchiolano le ginocchia ogni volta che fa le scale."

function Amico() {
  const s = useScena();
  const T = useTesti();
  const manda = s.dopo('manda');
  const scricchiola = s.dopo('scricchiola');
  const scale = s.dopo('scale');
  const BASE: [number, number] = [540, 1090];
  const camera: CameraTre = {giro: 34 + s.t * 1.2, alza: 15, distanza: 1750};
  const passo = onda(s.t, 1.25);
  const sale = rampa(s.t - 0.1, 0.7, curve.esce);
  const accese = rampa(scale, 0.4);
  const gradini = [0, 1, 2, 3].flatMap((k) => {
    const alto = 50 * (k + 1) * sale;
    return scatola({misure: [140, Math.max(2, alto), 300], colore: miscela(k % 2 ? '#2B3852' : '#36456A', PLACEBO, 0.35 * accese), pos: [-250 + k * 140, alto / 2, 0], emissione: 0.1 + 0.25 * accese});
  });
  const fitta = scricchiola > 0 ? impulso(scricchiola % 1.25, 0.5) : 0;
  // il ginocchio sale: un gradino più su ogni giro
  const strada = limita(s.avanzamento * 1.15);
  const dove: [number, number, number] = [mix(-250, 120, strada), mix(250, 350, strada) + 14 * passo, 0];
  const oggetti: Faccia[] = [
    ...ombra({pos: [0, 0, 0], raggio: 380, forza: 0.42}),
    ...gradini,
    ...ginocchio({dolore: 0.35 + 0.6 * fitta, piega: 34 + 26 * passo, pos: dove, scala: 0.42}),
  ];
  const giunto = proietta([dove[0], dove[1], 40], camera, BASE);
  const volo = rampa(manda, 1.1, curve.esce);
  return (
    <>
      <Bagliore x={540} y={860} raggio={540} colore={PLACEBO} forza={0.13} />
      <Scena3D x={BASE[0]} y={BASE[1]} camera={camera} oggetti={oggetti} />
      {scricchiola > 0 ? <Onde x={giunto.x} y={giunto.y} t={scricchiola % 1.25} colore={ORO} quante={2} periodo={0.5} raggioMax={120} spessore={4} forza={0.9 * fitta} /> : null}
      <Etichetta x={giunto.x + 150} y={giunto.y - 40} testo={T.crac} dimensione={32} piena colore={ORO} da={scricchiola} />
      {/* la freccia: il video che parte */}
      {manda > 0 ? <Scena3D x={mix(150, 880, volo)} y={mix(700, 590, volo)} camera={{giro: -20, alza: 20, distanza: 1400, zoom: 0.62}} oggetti={freccia3d({colore: RETA, ruota: [0, 0, 12]})} opacita={rampa(manda, 0.2)} /> : null}
      <Etichetta x={540} y={502} testo={T.manda} dimensione={32} piena colore={RETA} da={manda - 0.4} />
    </>
  );
}

// ───────────────────────── 10 · la chiusura ─────────────────────────
// "Commenta MAPPA per ricevere gratis il nostro database con tutte le informazioni essenziali su questo e
//  tanti altri composti."

const Cartello = bloccoChiusura({parola: 'MAPPA', sopra: {it: 'COMMENTA'}, sotto: {it: 'e ricevi il database gratis'}, segno: 'commenta'});

function Chiusura() {
  const s = useScena();
  const T = useTesti();
  return (
    <>
      <Cartello />
      <Etichetta x={540} y={1120} testo={T.composti} dimensione={28} colore={C.testo} da={s.dopo('essenziali')} />
    </>
  );
}

// ───────────────────────── il reel ─────────────────────────

export default definisciReel({
  titolo: 'Reta e dolore al ginocchio: quanto è merito del farmaco?',
  atmosfera: {tinta: '#19C7A4'},
  // il protagonista: la catena della Reta. Resta in scena dall'inizio alla fine e cambia stato con il racconto.
  protagonista: {tipo: 'peptide', colore: RETA},
  scene: {
    aggancio: {componente: Aggancio, atmosfera: {tinta: '#E8455A', luogo: 'corpo'}, protagonista: {x: 250, y: 1392, grandezza: 0.62, acceso: 1, carica: 1, onda: 0.6}},
    studi: {componente: Studi, atmosfera: {tinta: '#2A78E8', luogo: 'studio'}, entra: 'destra', protagonista: {onda: 0.3}},
    scala: {componente: Scala, atmosfera: {tinta: '#C99A2E', luogo: 'laboratorio'}, protagonista: {carica: 0.45, acceso: 0.75}},
    risultati: {componente: Risultati, atmosfera: {tinta: '#19C7A4', luogo: 'bilancia'}, protagonista: {carica: 1, acceso: 1, onda: 0.7}},
    applauso: {componente: Applauso, atmosfera: {tinta: '#7A62F0', raggi: 0.7, luogo: 'palco'}, entra: 'basso', protagonista: {acceso: 0.12, onda: 0.2}},
    differenza: {componente: Differenza, atmosfera: {tinta: '#19C7A4', luogo: 'bilancia'}, protagonista: {acceso: 1, carica: 0.5, onda: 0.5}},
    rischi: {componente: Rischi, atmosfera: {tinta: '#E8455A', luogo: 'vaso'}, protagonista: {colore: DOLORE, onda: 1.6, acceso: 1}},
    conclusione: {componente: Conclusione, atmosfera: {tinta: '#19C7A4', raggi: 0.6, luogo: 'membrana'}, protagonista: {colore: RETA, onda: 0.5, carica: 1}},
    amico: {componente: Amico, atmosfera: {tinta: '#2A78E8', luogo: 'stadio'}, entra: 'sinistra', protagonista: {grandezza: 0.52}},
    chiusura: {componente: Chiusura, atmosfera: {tinta: '#19C7A4', raggi: 0.8, luogo: 'vuoto'}, protagonista: {grandezza: 0.62, onda: 0.9}},
  },
});
