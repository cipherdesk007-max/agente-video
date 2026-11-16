// FMLAB Reel Kit — IL CATALOGO: tutto quello che c'è già pronto, disegnato in un foglio solo.
// Serve a due cose: far vedere a colpo d'occhio cosa si può usare (a te e all'agente) e provare che ogni pezzo
// della libreria si disegna senza errori (lo usa anche  npm run collaudo).
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {ComponentType, ReactNode} from 'react';
import {FaBrain, FaCarSide, FaClock, FaHeartPulse, FaScaleBalanced, FaSyringe} from 'react-icons/fa6';
import {LuPill} from 'react-icons/lu';
import {MdOutlineScience} from 'react-icons/md';
import * as L from '../../libreria';
import {ScenaCtx, TempoCtx, creaScena, creaTempo} from '../../libreria/tempo';
import type {DatiReel} from '../../libreria/tempo';
import {IMPOSTAZIONI_BASE} from '../../libreria/impostazioni';
import {stile} from '../../stile/stile';

const C = stile.colori;
/** Un copione finto: sei segni in fila, così ogni scena pronta ha qualcosa a cui agganciarsi. */
const DATI: DatiReel = {versione: 1, lingua: 'it', motore: 'stima', precisione: 'stimata', voce: null, durataVoce: 5, coda: 1, durata: 6, fps: 30, parole: [], segni: {a: 0.4, b: 1.0, c: 1.6, d: 2.2, e: 2.8, f: 3.4}, scene: [{nome: 'scena', inizio: 0, fine: 6}], impronta: 'catalogo'};

/** Un palco in miniatura: dentro vale tutto come in un reel vero (1080x1920), rimpicciolito. */
function Palchetto({children, ora = 5.4, scala = 0.25, tre = true, altezza = 1920, sposta = 0}: {children: ReactNode; ora?: number; scala?: number; tre?: boolean; altezza?: number; sposta?: number}) {
  const tempo = creaTempo(DATI, 'catalogo', Math.round(ora * 30), {impostazioni: {...IMPOSTAZIONI_BASE, stile: tre ? '3d' : '2d'}});
  return (
    <div style={{width: 1080 * scala, height: altezza * scala, overflow: 'hidden', borderRadius: 14, background: `radial-gradient(120% 80% at 50% 45%, #0C1B22 0%, ${C.fondo} 70%)`, position: 'relative'}}>
      <div style={{width: 1080, height: 1920, transform: `scale(${scala}) translateY(${-sposta}px)`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0}}>
        <TempoCtx.Provider value={tempo}>
          <ScenaCtx.Provider value={creaScena(tempo, 0)}>{children}</ScenaCtx.Provider>
        </TempoCtx.Provider>
      </div>
    </div>
  );
}

type Voce = {nome: string; cosa: string; disegno: ReactNode};

const scena = (Blocco: ComponentType): ReactNode => (
  <Palchetto altezza={1000} sposta={400}>
    <Blocco />
  </Palchetto>
);

/** Una "foto" disegnata: nel catalogo fa vedere cornice e telefono senza portarsi dietro un file. */
const FOTO_FINTA =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3d5c"/><stop offset="1" stop-color="#0b1a26"/></linearGradient></defs>' +
      '<rect width="640" height="800" fill="url(#c)"/><circle cx="470" cy="210" r="62" fill="#FFD23F"/>' +
      '<path d="M0 620 L170 400 L300 560 L430 360 L640 640 L640 800 L0 800 Z" fill="#5CF2C8" opacity="0.85"/><path d="M0 700 L220 520 L380 690 L520 560 L640 700 L640 800 L0 800 Z" fill="#0f6f5c"/></svg>'
  );

const SCENE: Voce[] = [
  {nome: 'bloccoTitolo', cosa: 'una frase grande: l\'aggancio', disegno: scena(L.bloccoTitolo({sopra: 'Lo sapevi?', titolo: 'Il GPS non sa dove sei', sotto: 'in 45 secondi'}))},
  {nome: 'bloccoNumero', cosa: 'un numero che sale, con l\'unità', disegno: scena(L.bloccoNumero({valore: 20200, unita: 'km di quota', nota: 'Più di 30 satelliti', sottoNota: 'sempre in volo', fonte: 'GPS.gov'}))},
  {nome: 'bloccoLista', cosa: 'fino a 5 voci, una alla volta', disegno: scena(L.bloccoLista({titolo: 'Tre errori', voci: [{testo: 'Guardi solo il prezzo'}, {testo: 'Salti la perizia'}, {testo: 'Non provi l\'auto'}]}))},
  {nome: 'bloccoConfronto', cosa: 'A contro B, con i numeri', disegno: scena(L.bloccoConfronto({titolo: 'Costo in un anno', sinistra: {titolo: 'Benzina', valore: 1850, unita: 'euro'}, destra: {titolo: 'Elettrica', valore: 620, unita: 'euro'}}))},
  {nome: 'bloccoBarre', cosa: 'colonne (in 3D sono solidi)', disegno: scena(L.bloccoBarre({titolo: 'Vendite', unita: 'migliaia', dati: [{etichetta: '2022', valore: 12}, {etichetta: '2023', valore: 19}, {etichetta: '2024', valore: 31}]}))},
  {nome: 'bloccoAnello', cosa: 'una percentuale che si riempie', disegno: scena(L.bloccoAnello({valore: 68, etichetta: 'delle persone'}))},
  {nome: 'bloccoPassi', cosa: 'i passi di un procedimento', disegno: scena(L.bloccoPassi({titolo: 'Come si fa', passi: [{testo: 'Scegli'}, {testo: 'Prova'}, {testo: 'Firma'}]}))},
  {nome: 'bloccoMito', cosa: 'mito e realtà', disegno: scena(L.bloccoMito({mito: 'Il motore va scaldato da fermo', verita: 'Basta partire piano'}))},
  {nome: 'bloccoOggetto', cosa: 'un oggetto 3D con le etichette', disegno: scena(L.bloccoOggetto({titolo: 'Com\'è fatta', oggetti: () => L.fiala3d(), etichette: [{testo: 'Tappo', punto: [0, 110, 0]}, {testo: 'Liquido', punto: [0, -30, 40]}]}))},
  {nome: 'bloccoChiusura', cosa: 'l\'invito finale', disegno: scena(L.bloccoChiusura({parola: 'MAPPA'}))},
  {nome: 'bloccoLinea', cosa: 'una linea nel tempo (d3)', disegno: scena(L.bloccoLinea({titolo: 'Prezzo medio', unita: 'euro', punti: [{etichetta: '2020', valore: 14}, {etichetta: '2021', valore: 17}, {etichetta: '2022', valore: 16}, {etichetta: '2023', valore: 23}, {etichetta: '2024', valore: 29}], fonte: 'esempio'}))},
  {nome: 'bloccoTorta', cosa: 'le parti di un tutto (d3)', disegno: scena(L.bloccoTorta({titolo: 'Chi compra', fette: [{etichetta: 'Privati', valore: 54}, {etichetta: 'Aziende', valore: 31}, {etichetta: 'Noleggio', valore: 15}], evidenzia: 0}))},
  {nome: 'bloccoClassifica', cosa: 'barre orizzontali, dalla prima', disegno: scena(L.bloccoClassifica({titolo: 'Autonomia', unita: 'km', voci: [{etichetta: 'Modello A', valore: 610}, {etichetta: 'Modello B', valore: 540}, {etichetta: 'Modello C', valore: 420}, {etichetta: 'Modello D', valore: 310}], evidenzia: 0}))},
  {nome: 'bloccoIcone', cosa: 'da 2 a 6 icone con il nome', disegno: scena(L.bloccoIcone({titolo: 'Cosa conta', voci: [{icona: FaHeartPulse, testo: 'Cuore'}, {icona: FaBrain, testo: 'Testa'}, {icona: FaClock, testo: 'Sonno'}]}))},
  {nome: 'bloccoScala', cosa: 'una scala con i cursori', disegno: scena(L.bloccoScala({titolo: 'Dolore da 0 a 10', cursori: [{etichetta: 'Prima', valore: 6}, {etichetta: 'Dopo', valore: 2, da: 6, colore: C.luce}], estremi: ['nessun dolore', 'il più forte']}))},
  {nome: 'bloccoSchede', cosa: '2 o 3 schede e il totale', disegno: scena(L.bloccoSchede({titolo: 'Due studi', schede: [{sopra: 'Studio 1', valore: 445, unita: 'persone', sotto: '68 settimane'}, {sopra: 'Studio 2', valore: 574, unita: 'persone', sotto: '80 settimane'}], totale: {valore: 1019, etichetta: 'adulti'}}))},
  {nome: 'bloccoAvviso', cosa: 'rischi, "attenzione a"', disegno: scena(L.bloccoAvviso({titolo: 'Effetti indesiderati', sotto: 'più frequenti con il farmaco', punti: [{testo: 'nausea'}, {testo: 'diarrea'}]}))},
  {nome: 'bloccoCitazione', cosa: 'una frase tra virgolette', disegno: scena(L.bloccoCitazione({testo: 'I dettagli contano quanto i risultati', autore: 'la regola del kit'}))},
  {nome: 'bloccoEbook', cosa: "l'ebook regalo sul tablet 3D che gira", disegno: scena(L.bloccoEbook({invito: 'Commenta MAPPA', sotto: 'te lo mando gratis'}))},
  {nome: 'bloccoSigla', cosa: 'il logo della pagina con il nome', disegno: scena(L.bloccoSigla({sotto: 'la mappa dei peptidi'}))},
  {nome: 'bloccoDomanda', cosa: 'una domanda grande: l\'aggancio', disegno: scena(L.bloccoDomanda({sopra: 'Reta e ginocchio', domanda: 'Quanto è merito del farmaco?'}))},
  {nome: 'bloccoStudio', cosa: 'la scheda di uno studio', disegno: scena(L.bloccoStudio({rivista: 'New England Journal of Medicine', titolo: 'Retatrutide negli adulti con artrosi del ginocchio', dati: [{testo: '8 nov 2026'}, {testo: '1.019 persone'}, {testo: '68-80 settimane'}], pagato: 'finanziato da Eli Lilly'}))},
  {nome: 'bloccoPersone', cosa: '"2 su 10": gli omini si accendono', disegno: scena(L.bloccoPersone({titolo: 'Chi ha avuto nausea', quante: 10, accese: 2, etichetta: 'persone'}))},
  {nome: 'bloccoTempo', cosa: 'una linea del tempo, fino a 4 tappe', disegno: scena(L.bloccoTempo({titolo: 'Lo studio', tappe: [{quando: 'Inizio', testo: 'dolore 6'}, {quando: '24 sett.', testo: 'primi effetti'}, {quando: '68 sett.', testo: 'dolore 2'}]}))},
  {nome: 'bloccoSchermo', cosa: 'uno screenshot o un video nel telefono', disegno: scena(L.bloccoSchermo({titolo: 'Com\'è l\'app', file: FOTO_FINTA, note: [{testo: 'un tocco'}, {testo: 'gratis'}]}))},
];

function Oggetto({facce, zoom = 1, alza = 14, giro = -28}: {facce: L.Faccia[]; zoom?: number; alza?: number; giro?: number}) {
  return (
    <Palchetto altezza={1080} scala={0.25} sposta={340}>
      <L.Bagliore x={540} y={880} raggio={420} forza={0.16} />
      <L.Scena3D x={540} y={880} camera={{giro, alza, distanza: 1500, zoom}} oggetti={facce} />
    </Palchetto>
  );
}

const OGGETTI: Voce[] = [
  {nome: 'satellite3d', cosa: 'satellite', disegno: <Oggetto facce={L.satellite3d()} zoom={1.7} />},
  {nome: 'telefono3d', cosa: 'telefono', disegno: <Oggetto facce={L.telefono3d()} zoom={1.7} />},
  {nome: 'fiala3d', cosa: 'fiala con il liquido', disegno: <Oggetto facce={L.fiala3d()} zoom={2.6} />},
  {nome: 'pillola3d', cosa: 'capsula a due colori', disegno: <Oggetto facce={L.pillola3d()} zoom={2.6} />},
  {nome: 'siringa3d', cosa: 'siringa', disegno: <Oggetto facce={L.siringa3d()} zoom={1.25} />},
  {nome: 'molecola3d', cosa: 'molecola', disegno: <Oggetto facce={L.molecola3d()} zoom={1.7} giro={-18} />},
  {nome: 'dna3d', cosa: 'doppia elica', disegno: <Oggetto facce={L.dna3d({giro: 20})} zoom={1.2} />},
  {nome: 'ginocchio3d', cosa: 'ginocchio (si arrossa)', disegno: <Oggetto facce={L.ginocchio3d({dolore: 0.8})} zoom={0.95} giro={28} alza={8} />},
  {nome: 'cuore3d', cosa: 'cuore', disegno: <Oggetto facce={L.cuore3d()} zoom={2} />},
  {nome: 'moneta3d', cosa: 'moneta', disegno: <Oggetto facce={L.moneta3d()} zoom={2.2} />},
  {nome: 'stella3d', cosa: 'stella', disegno: <Oggetto facce={L.stella3d()} zoom={2} />},
  {nome: 'provetta3d', cosa: 'provetta', disegno: <Oggetto facce={L.provetta3d({ruota: [0, 0, -14]})} zoom={2} />},
  {nome: 'flacone3d', cosa: 'flacone di compresse', disegno: <Oggetto facce={L.flacone3d()} zoom={2.3} />},
  {nome: 'bilancia3d', cosa: 'bilancia (pende da un lato)', disegno: <Oggetto facce={L.bilancia3d({pende: 0.6})} zoom={1.45} giro={-14} alza={8} />},
  {nome: 'scudo3d', cosa: 'scudo', disegno: <Oggetto facce={L.scudo3d()} zoom={2} giro={-22} />},
  {nome: 'lente3d', cosa: 'lente d\'ingrandimento', disegno: <Oggetto facce={L.lente3d()} zoom={2} giro={-16} alza={6} />},
  {nome: 'freccia3d', cosa: 'freccia', disegno: <Oggetto facce={L.freccia3d()} zoom={2.4} />},
  {nome: 'barre3d', cosa: 'colonne', disegno: <Oggetto facce={[...L.ombra({raggio: 260}), ...L.barre3d({valori: [3, 5, 8], pos: [0, -160, 0]})]} zoom={1.6} />},
  {nome: 'scatola · cilindro · sfera', cosa: 'le forme per farne altri', disegno: <Oggetto facce={[...L.scatola({misure: [150, 150, 150], colore: C.luce2, pos: [-200, 0, 0]}), ...L.cilindro({raggio: 80, altezza: 170, colore: C.luce}), ...L.sfera({raggio: 90, colore: C.accento, pos: [200, 0, 0]})]} zoom={1.5} />},
];

function Mezzo({children}: {children: ReactNode}) {
  return (
    <Palchetto altezza={1080} scala={0.25} sposta={340}>
      {children}
    </Palchetto>
  );
}

const ALTRO: Voce[] = [
  {nome: 'GraficoLinea', cosa: 'linea (anche dentro le tue scene)', disegno: <Mezzo><L.GraficoLinea x={560} y={880} larghezza={760} altezza={420} punti={[{etichetta: 'gen', valore: 4}, {etichetta: 'feb', valore: 9}, {etichetta: 'mar', valore: 7}, {etichetta: 'apr', valore: 15}]} p={0.8} /></Mezzo>},
  {nome: 'GraficoTorta', cosa: 'torta o ciambella', disegno: <Mezzo><L.GraficoTorta x={540} y={880} raggio={230} fette={[{etichetta: 'A', valore: 50}, {etichetta: 'B', valore: 30}, {etichetta: 'C', valore: 20}]} evidenzia={1} /></Mezzo>},
  {nome: 'GraficoClassifica', cosa: 'barre orizzontali', disegno: <Mezzo><L.GraficoClassifica x={540} y={880} voci={[{etichetta: 'Primo', valore: 92}, {etichetta: 'Secondo', valore: 71}, {etichetta: 'Terzo', valore: 38}]} suffisso="%" /></Mezzo>},
  {nome: 'Icona', cosa: 'migliaia di icone (react-icons)', disegno: <Mezzo><L.Icona disegno={FaCarSide} x={300} y={720} dimensione={170} da={3} tondo /><L.Icona disegno={FaSyringe} x={760} y={720} dimensione={170} da={3} colore={C.luce2} tondo /><L.Icona disegno={LuPill} x={300} y={1080} dimensione={190} da={3} colore={C.accento} /><L.Icona disegno={MdOutlineScience} x={560} y={1080} dimensione={190} da={3} colore={C.positivo} /><L.Icona disegno={FaScaleBalanced} x={820} y={1080} dimensione={190} da={3} colore={C.negativo} /></Mezzo>},
  {nome: 'Schizzo…', cosa: 'segni a mano (roughjs)', disegno: <Mezzo><L.Cifra x={540} y={760} valore="−4,0" dimensione={170} colore={C.luce} da={3} /><L.SchizzoCerchio x={540} y={760} larghezza={520} altezza={270} /><L.SchizzoFreccia da={[820, 1120]} a={[700, 900]} /><L.SchizzoSottolinea x={380} y={1120} larghezza={360} colore={C.luce2} /><L.SchizzoRiquadro x={380} y={1050} larghezza={420} altezza={110} colore={C.luce2} spessore={5} /></Mezzo>},
  {nome: 'Foto · Filmato', cosa: 'foto, screenshot e video', disegno: <Mezzo><L.Foto file={FOTO_FINTA} x={330} y={880} larghezza={400} da={3} ruota={-3} didascalia="la tua foto" /><L.Telefono x={790} y={880} larghezza={290}><L.Foto file={FOTO_FINTA} schermo da={3} /></L.Telefono></Mezzo>},
  {nome: 'Ebook', cosa: "l'ebook della pagina su un tablet 3D", disegno: <Mezzo><L.Ebook x={540} y={880} larghezza={520} da={3.6} /></Mezzo>},
  {nome: 'Logo', cosa: 'il logo della pagina (stile/logo.png)', disegno: <Mezzo><L.Logo x={540} y={820} larghezza={620} da={3} /></Mezzo>},
  {nome: 'Cifra · Targa · Etichetta', cosa: 'le scritte del palco', disegno: <Mezzo><L.Cifra x={540} y={650} valore="1.019" etichetta="adulti" dimensione={150} colore={C.accento} da={3} /><L.Targa x={540} y={920} titolo="PIÙ DEL PLACEBO" sotto="in due studi" da={3} /><L.Etichetta x={370} y={1130} testo="reta" da={3} piena /><L.Etichetta x={690} y={1130} testo="placebo" colore={C.luce2} da={3} /></Mezzo>},
  {nome: 'Bagliore · Onde · Faro · Linea', cosa: 'luci e segnali', disegno: <Mezzo><L.Faro x={540} y={480} verso={90} lunghezza={640} apertura={36} colore="#C9D6FF" forza={0.5} /><L.Onde x={540} y={900} t={2.2} raggioMax={300} quante={3} /><L.Bagliore x={540} y={900} raggio={200} forza={0.5} /><L.Linea da={[160, 1180]} a={[920, 1180]} p={1} colore={C.accento} spessore={5} tratteggio="6 14" /></Mezzo>},
  {nome: 'Globo · Orologio · Spunta · Divieto', cosa: 'oggetti piatti', disegno: <Mezzo><L.Globo x={330} y={720} raggio={170} longitudine={12} latitudine={30} /><L.Orologio x={770} y={720} raggio={150} secondi={18} /><L.Spunta x={330} y={1100} raggio={90} /><L.Divieto x={770} y={1100} raggio={110} /></Mezzo>},
];

function Sezione({titolo, voci, colonne}: {titolo: string; voci: Voce[]; colonne: number}) {
  return (
    <div style={{marginBottom: 34}}>
      <div style={{fontFamily: stile.font.titoli, fontWeight: 900, fontSize: 34, color: '#FFFFFF', margin: '0 0 16px 4px'}}>{titolo}</div>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${colonne}, 270px)`, gap: 18}}>
        {voci.map((v) => (
          <div key={v.nome} data-catalogo={v.nome}>
            {v.disegno}
            <div style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: 17, color: C.luce, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{v.nome}</div>
            <div style={{fontFamily: stile.font.testo, fontSize: 15, color: C.tenue, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{v.cosa}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** I nomi di tutto quello che il catalogo disegna: il collaudo controlla che ogni scena pronta della libreria ci sia. */
export const NEL_CATALOGO = [...SCENE, ...OGGETTI, ...ALTRO].map((v) => v.nome);

export function avviaCatalogo() {
  const radice = createRoot(document.getElementById('radice')!);
  const colonne = 6;
  window.__prova = (async () => {
    await Promise.all(Array.from(document.fonts).map((f) => f.load().catch(() => undefined)));
    flushSync(() =>
      radice.render(
        <div style={{padding: 28, background: '#05070a', width: colonne * 270 + (colonne - 1) * 18}}>
          <div style={{fontFamily: stile.font.titoli, fontWeight: 900, fontSize: 46, color: '#FFFFFF'}}>
            {stile.marchio} Reel Kit <span style={{color: C.luce}}>· catalogo</span>
          </div>
          <div style={{fontFamily: stile.font.testo, fontSize: 19, color: C.tenue, margin: '6px 0 26px'}}>Tutto quello che è già pronto. I nomi sono quelli da scrivere in scene.tsx; come si usano è in CATALOGO.md.</div>
          <Sezione titolo={`Scene pronte (${SCENE.length})`} voci={SCENE} colonne={colonne} />
          <Sezione titolo={`Oggetti 3D (${OGGETTI.length})`} voci={OGGETTI} colonne={colonne} />
          <Sezione titolo="Grafici, icone, segni a mano, foto, scritte, luci" voci={ALTRO} colonne={colonne} />
        </div>
      )
    );
    // le immagini (le foto del catalogo) devono essere caricate e decodificate prima dello scatto
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? img.decode().catch(() => undefined)
          : new Promise<void>((fatto) => {
              img.addEventListener('load', () => void img.decode().catch(() => undefined).then(() => fatto()), {once: true});
              img.addEventListener('error', () => fatto(), {once: true});
            })
      )
    );
    await new Promise((fatto) => requestAnimationFrame(() => requestAnimationFrame(fatto)));
    return NEL_CATALOGO;
  })();
}

declare global {
  interface Window {
    __prova?: Promise<unknown>;
  }
}
