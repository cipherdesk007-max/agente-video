// FMLAB Reel Kit — prove di narratore (pose, gesti, maglia), 3D, impostazioni, pannello, voci. Veloci, senza browser.
//   npm test
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const K = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = await import(path.join(K, 'node_modules/esbuild/lib/main.js'));
async function ts(file) {
  const out = path.join(os.tmpdir(), `fmlab-prova-${path.basename(file).replace(/\W/g, '_')}-${process.pid}.mjs`);
  await esbuild.build({entryPoints: [path.join(K, file)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'}});
  return import(out);
}
let n = 0;
const prova = async (nome, f) => { await f(); n++; console.log('  ok', nome); };

const {scegliVoceMac} = await import(`${K}/motore/voce.mjs`);
await prova('voci del Mac: elenco di Ventura e di Sonoma, voci giocattolo scartate', () => {
  const ventura = 'Alice               it_IT    # Ciao! Mi chiamo Alice.\nSamantha            en_US    # Hello! My name is Samantha.\n';
  assert.equal(scegliVoceMac(ventura, undefined, 'it'), 'Alice');
  const sonoma = [
    'Eddy (Italiano (Italia)) it_IT    # Ciao! Mi chiamo Eddy.',
    'Alice               it_IT    # Ciao! Mi chiamo Alice.',
    'Luca (Enhanced)     it_IT    # Ciao! Mi chiamo Luca.',
    'Federica (Premium)  it_IT    # Ciao! Mi chiamo Federica.',
    'Grandma (Italiano (Italia)) it_IT    # Ciao! Mi chiamo Grandma.',
    'Samantha            en_US    # Hello! My name is Samantha.',
  ].join('\n');
  assert.equal(scegliVoceMac(sonoma, undefined, 'it'), 'Federica (Premium)');
  assert.equal(scegliVoceMac(sonoma, 'luca', 'it'), 'Luca (Enhanced)');
  assert.equal(scegliVoceMac(sonoma, undefined, 'en'), 'Samantha');
  assert.equal(scegliVoceMac('Eddy (Italiano (Italia)) it_IT    # Ciao!\nAlice it_IT # Ciao!', undefined, 'it'), 'Alice');
  assert.throws(() => scegliVoceMac(sonoma, undefined, 'ja'), /nessuna voce/);
  assert.throws(() => scegliVoceMac(sonoma, 'Pippo', 'it'), /non è installata/);
});

const gesti = await ts('libreria/gesti.ts');
const dati = JSON.parse(fs.readFileSync(`${K}/reels/gps/parole.json`, 'utf8'));
await prova('gesti: scaletta sempre uguale, in ordine, con una pausa tra un gesto e l\'altro', () => {
  const a = gesti.scalettaGesti(dati, () => undefined);
  const b = gesti.scalettaGesti(dati, () => undefined);
  assert.deepEqual(a, b);
  assert.ok(a.length > 15);
  for (let i = 1; i < a.length; i++) assert.ok(a[i].t >= a[i - 1].t);
  const braccio = a.filter((e) => ['indica', 'saluta', 'batte'].includes(e.gesto));
  for (let i = 1; i < braccio.length; i++) assert.ok(braccio[i].t - braccio[i - 1].t >= 1.2, `gesti del braccio troppo vicini a ${braccio[i].t}`);
  assert.equal(a.filter((e) => e.gesto === 'saluta').length, 1);
  assert.ok(a.every((e) => gesti.GESTI.includes(e.gesto)));
});
await prova('pose: una nuova a ogni frase, inciso e segno; mai due uguali o quasi uguali di fila; tenute da uno a tre secondi e mezzo', () => {
  const pose = gesti.scalettaAssetti(dati, () => undefined);
  assert.ok(pose.length >= 8, `solo ${pose.length} pose`);
  for (let i = 1; i < pose.length; i++) {
    assert.notEqual(pose[i].posa, pose[i - 1].posa);
    // due pose quasi uguali di fila (presenta e lato, lato e aperto, aperto e dito) a guardarle sono una posa sola
    assert.ok(!gesti.poseVicine(pose[i].posa, pose[i - 1].posa), `${pose[i - 1].posa} e poi ${pose[i].posa} a ${pose[i].t}: sembra fermo`);
    assert.ok(pose[i].t - pose[i - 1].t >= gesti.TENUTA - 0.26, `pose troppo vicine a ${pose[i].t}`);
  }
  // nessuna posa tenuta più di tre secondi e mezzo, nemmeno sull'ultima frase
  pose.forEach((c, i) => assert.ok((pose[i + 1]?.t ?? dati.durata) - c.t <= 3.5, `${c.posa} tenuta ${((pose[i + 1]?.t ?? dati.durata) - c.t).toFixed(1)} s da ${c.t.toFixed(1)}`));
  assert.ok(new Set(pose.map((p) => p.posa)).size >= 3);
  assert.equal(pose[pose.length - 1].posa, 'alto'); // sull'invito finale il dito va in alto
  const fissa = gesti.scalettaAssetti(dati, () => ({posa: 'lato'}));
  // una posa chiesta per nome è la posa di casa: la scena comincia così e ci torna, ma non resta ferma
  assert.equal(fissa[0].posa, 'lato');
  assert.ok(fissa.filter((p) => p.posa === 'lato').length >= fissa.length * 0.4, 'la posa di casa torna spesso');
  for (let i = 1; i < fissa.length; i++) assert.ok(fissa[i].posa === 'lato' || fissa[i - 1].posa === 'lato', 'tra due pose diverse da quella di casa si torna a casa');
  const tradotta = gesti.scalettaAssetti(dati, (nome) => (nome === 'aggancio' ? {posa: [['nonsa', 'spalle']]} : {posa: 'dito'}));
  assert.equal(tradotta[0].posa, 'aperto'); // i nomi delle pose del Dottore disegnato valgono anche qui
  assert.throws(() => gesti.scalettaAssetti(dati, () => ({posa: 'verticale'})), /non esiste\. Pose/);
});
await prova('gesti: regia della scena (lista, false) ed errori chiari', () => {
  const solo = gesti.scalettaGesti(dati, (nome) => (nome === 'aggancio' ? {gesti: [['nonsa', 'nega'], [1, 'indica']]} : {gesti: false}));
  assert.deepEqual(solo.map((e) => e.gesto).sort(), ['indica', 'nega']);
  assert.throws(() => gesti.scalettaGesti(dati, () => ({gesti: [['nonesiste', 'batte']]})), /non esiste nel copione/);
  assert.throws(() => gesti.scalettaGesti(dati, () => ({gesti: [[1, 'balla']]})), /non esiste\. Gesti/);
});
await prova('movimento: continuo (nessuno scatto), dentro i limiti, fermo a riposo', () => {
  const ev = gesti.scalettaGesti(dati, () => undefined);
  const cambi = gesti.scalettaAssetti(dati, () => undefined);
  let prima = null;
  for (let f = 0; f < Math.round(dati.durata * 30); f++) {
    const a = gesti.atteggiamento(ev, dati, f / 30, {cambi});
    const v = [a.mosse.testa.ruota, a.mosse.braccio.ruota, a.mosse.mano.ruota, a.mosse.palmo.ruota];
    if (prima) v.forEach((x, i) => assert.ok(Math.abs(x - prima[i]) < 7, `scatto di ${Math.abs(x - prima[i]).toFixed(1)}° a ${(f / 30).toFixed(2)} s`));
    prima = v;
    assert.ok(Math.abs(a.mosse.braccio.ruota) <= 34.01 && Math.abs(a.mosse.testa.ruota) <= 9.01 && a.mosse.palmo.ruota <= 22.01);
  }
  const vuoti = {...dati, parole: [], scene: [], segni: {}};
  const fermo = gesti.atteggiamento([], vuoti, 3);
  assert.ok(Math.abs(fermo.mosse.braccio.ruota) < 1 && Math.abs(fermo.mosse.testa.ruota) < 1.5);
  // una posa arriva fino in fondo e ci resta
  const alto = gesti.atteggiamento([], vuoti, 5, {cambi: [{t: 0, posa: 'alto'}]});
  assert.ok(Math.abs(alto.mosse.braccio.ruota - gesti.ASSETTI.alto.braccio.ruota) < 1);
});
await prova('personaggio con i livelli: pose in più (pensa, presenta), limiti suoi, viso e spalla, sempre continuo', () => {
  const dottore = JSON.parse(fs.readFileSync(`${K}/personaggi/dottore/personaggio.json`, 'utf8'));
  const disponibili = Object.keys({...gesti.ASSETTI, ...dottore.pose});
  assert.ok(disponibili.includes('pensa') && disponibili.includes('presenta'));
  // un copione con una domanda: sulla domanda ci pensa (dito al mento); senza quella posa ripiega sulla mano aperta
  const parole = [];
  let t = 0.3;
  ['Questo funziona davvero?', 'Vediamo cosa dicono i dati.', 'Il risultato sorprende tutti.', 'Commenta qui sotto.'].forEach((frase, k) => {
    for (const w of frase.split(' ')) {
      parole.push({testo: w, inizio: t, fine: t + 0.3, frase: k, enfasi: false});
      t += 0.4;
    }
    t += 1.6;
  });
  const reel = {...dati, parole, segni: {}, durata: t + 1, scene: [{nome: 'unica', inizio: 0, fine: t + 1}]};
  const conLivelli = gesti.scalettaAssetti(reel, () => undefined, disponibili);
  assert.equal(conLivelli[0].posa, 'pensa');
  assert.equal(gesti.scalettaAssetti(reel, () => undefined)[0].posa, 'aperto');
  assert.equal(gesti.scalettaAssetti(reel, () => ({posa: 'presenta'}))[0].posa, 'lato'); // chiesta a mano ma assente: la più vicina
  // tutto il reel d'esempio con le pose e i limiti del dottore
  const ev = gesti.scalettaGesti(dati, () => undefined);
  const cambi = gesti.scalettaAssetti(dati, () => undefined, disponibili);
  assert.ok(new Set(cambi.map((c) => c.posa)).size >= 5, 'poche pose diverse');
  const [minimo, massimo] = dottore.limiti.braccio;
  let prima = null;
  let piega = 0;
  for (let f = 0; f < Math.round(dati.durata * 30); f++) {
    const a = gesti.atteggiamento(ev, dati, f / 30, {cambi, pose: dottore.pose, limiti: dottore.limiti});
    const m = a.mosse;
    assert.ok(m.braccio.ruota >= minimo - 0.01 && m.braccio.ruota <= massimo + 0.01, `braccio a ${m.braccio.ruota.toFixed(1)}°`);
    assert.ok(Math.abs(m.spalla.ruota) <= 4.01 && Math.abs(m.viso.dx) <= 9.01 && Math.abs(m.viso.dy) <= 5.01);
    assert.ok(!m.braccio.dx && !m.braccio.dy, 'il braccio su un livello ruota soltanto: non si stacca dal gomito');
    const v = [m.testa.ruota, m.braccio.ruota, m.mano.ruota, m.palmo.ruota, m.spalla.ruota, m.viso.dx];
    if (prima) v.forEach((x, i) => assert.ok(Math.abs(x - prima[i]) < 7, `scatto di ${Math.abs(x - prima[i]).toFixed(1)} a ${(f / 30).toFixed(2)} s`));
    prima = v;
    piega = Math.max(piega, m.braccio.ruota);
  }
  assert.ok(piega > 40, 'il braccio non arriva mai davanti al petto');
});
const pupazzoPose = await ts('libreria/Pupazzo.tsx');
await prova('braccia conserte: una posa disegnata (un altro disegno intero, con bocca e occhi suoi) prende il posto della figura; lo scambio è breve', async () => {
  const dottore = JSON.parse(fs.readFileSync(`${K}/personaggi/dottore/personaggio.json`, 'utf8'));
  const figura = JSON.parse(fs.readFileSync(`${K}/personaggi/dottore-conserte/personaggio.json`, 'utf8'));
  const conosciuti = {dottore: {id: 'dottore', ...dottore}, 'dottore-conserte': {id: 'dottore-conserte', ...figura}};
  // la posa del dottore punta alla figura; la figura è grande uguale, sa di chi è e ha bocche, occhi e testa suoi
  assert.equal(dottore.pose.conserte.disegno, 'conserte');
  assert.equal(dottore.disegni.conserte.personaggio, 'dottore-conserte');
  assert.deepEqual(figura.misure, dottore.misure);
  assert.equal(figura.figuraDi, 'dottore');
  assert.deepEqual([figura.bocche.length, figura.occhi.length], [4, 2]);
  assert.ok(figura.ossa.testa && figura.ossa.mascella && figura.ossa.bocca && figura.specchio);
  for (const pezzo of [{file: figura.immagine}, ...Object.values(figura.pezzi)]) assert.ok(fs.existsSync(path.join(K, 'personaggi/dottore-conserte', pezzo.file)), `manca ${pezzo.file}`);
  for (const [nome, posa] of Object.entries(dottore.pose)) if (posa.disegno) assert.ok(dottore.disegni?.[posa.disegno], `la posa "${nome}" usa il disegno "${posa.disegno}", che non esiste`);
  const assetti = {...gesti.ASSETTI, ...dottore.pose};
  // la posa vale solo se la figura c'è; le altre pose non ne risentono
  assert.ok(pupazzoPose.poseDi(dottore, conosciuti).includes('conserte'));
  assert.ok(!pupazzoPose.poseDi(dottore).includes('conserte'));
  assert.ok(pupazzoPose.poseDi(dottore).includes('pensa'));
  // l'altra forma di posa disegnata: solo una parte sopra il corpo, che vale se ci sono i livelli che nasconde
  const conParte = {...dottore, disegni: {mela: {file: 'mela.png', x: 1, y: 2, misure: [10, 10], nasconde: ['braccio2']}}, pose: {...dottore.pose, mela: {disegno: 'mela'}}};
  assert.ok(pupazzoPose.poseDi(conParte).includes('mela'));
  assert.ok(!pupazzoPose.poseDi({...conParte, corpo: undefined}).includes('mela'));
  // nello scambio una delle due figure è sempre piena: lo sfondo non si vede mai attraverso
  assert.deepEqual(pupazzoPose.scambioFigure(0), {sotto: 1, sopra: 0});
  assert.deepEqual(pupazzoPose.scambioFigure(1), {sotto: 0, sopra: 1});
  for (let w = 0; w <= 1; w += 0.05) assert.equal(Math.max(...Object.values(pupazzoPose.scambioFigure(w))), 1);
  // una figura non è un narratore: non si può scegliere
  const {sistema} = await import(`${K}/motore/impostazioni.mjs`);
  assert.throws(() => sistema({narratore: {chi: 'dottore-conserte'}}, conosciuti), /è una posa di "dottore"/);
  assert.equal(sistema({narratore: {chi: 'dottore'}}, conosciuti).narratore.chi, 'dottore');
  // entra a 2 s, esce a 6 s
  const cambi = [{t: 0, posa: 'dito'}, {t: 2, posa: 'conserte'}, {t: 6, posa: 'lato'}];
  const peso = (ora) => gesti.pesiDisegni(cambi, assetti, ora).conserte ?? 0;
  assert.equal(peso(1.9), 0);
  assert.equal(peso(4), 1);
  assert.equal(peso(7.5), 0);
  let prima = 0;
  let scambio = 0;
  for (let f = 60; f <= 120; f++) {
    const w = peso(f / 30);
    assert.ok(w >= prima - 1e-9, 'entrando il disegno deve solo comparire');
    if (w > 0.02 && w < 0.98) scambio++;
    prima = w;
  }
  assert.ok(scambio >= 2 && scambio <= 6, `lo scambio dura ${scambio} fotogrammi`);
  prima = 1;
  for (let f = 180; f <= 230; f++) {
    const w = peso(f / 30);
    assert.ok(w <= prima + 1e-9, 'uscendo il disegno deve solo sparire');
    prima = w;
  }
  // a posa raggiunta il disegno è pieno, la spalla è ferma (il disegno è fatto per il corpo a riposo) e la testa vive ancora
  const dentro = gesti.atteggiamento([], dati, 4, {cambi, pose: dottore.pose, limiti: dottore.limiti});
  assert.equal(dentro.disegni.conserte, 1);
  assert.ok(Math.abs(dentro.mosse.spalla.ruota) < 1e-6 && Math.abs(dentro.mosse.testa.ruota) > 0.5);
  // fuori dalla posa non c'è traccia del disegno
  assert.deepEqual(gesti.atteggiamento([], dati, 1, {cambi, pose: dottore.pose}).disegni, {});
  // il kit la sceglie da solo quando una frase "frena"; chi non ha il disegno prende la posa più vicina
  const parole = [];
  let t = 0.3;
  ['Il farmaco riduce il dolore.', 'Ma anche il placebo lo riduce.', 'Non è un miracolo.', 'Commenta qui sotto.'].forEach((frase, k) => {
    for (const w of frase.split(' ')) {
      parole.push({testo: w, inizio: t, fine: t + 0.3, frase: k, enfasi: false});
      t += 0.4;
    }
    t += 2.2;
  });
  const reel = {...dati, lingua: 'it', parole, segni: {}, durata: t + 1, scene: [{nome: 'uno', inizio: 0, fine: 9}, {nome: 'due', inizio: 9, fine: t + 1}]};
  const disponibili = pupazzoPose.poseDi(dottore, conosciuti);
  const scelte = gesti.scalettaAssetti(reel, () => undefined, disponibili, ['aperta', 'alza', 'giu']);
  const conserte = scelte.find((c) => c.posa === 'conserte');
  assert.ok(conserte, `nessuna frase a braccia conserte: ${scelte.map((c) => c.posa).join(', ')}`);
  assert.equal(conserte.seconda, 'aperta');
  assert.ok(!gesti.scalettaAssetti(reel, () => undefined).some((c) => c.posa === 'conserte'), 'un personaggio senza il disegno non può incrociare le braccia');
  assert.equal(gesti.scalettaAssetti(reel, () => ({posa: 'conserte'}))[0].posa, 'aperto'); // chiesta a mano ma assente: la più vicina
  assert.equal(gesti.scalettaAssetti(reel, () => ({posa: 'conserte'}), disponibili)[0].posa, 'conserte');
});
const pupazzo = await ts('libreria/Pupazzo.tsx');
await prova('labiale: il mento sale quando la bocca si chiude, la bocca si stringe sulla "u"; solo se ci sono le ossa', () => {
  const dottore = JSON.parse(fs.readFileSync(`${K}/personaggi/dottore/personaggio.json`, 'utf8'));
  const chiusa = pupazzo.mosseLabiale(dottore, {apertura: 0, larghezza: 0.62});
  const aperta = pupazzo.mosseLabiale(dottore, {apertura: 1, larghezza: 0.72});
  assert.ok(chiusa.mascella.dy < -5 && Math.abs(aperta.mascella.dy) < 0.01);
  assert.ok(pupazzo.mosseLabiale(dottore, {apertura: 0.5, larghezza: 0.1}).bocca.sx < 0.87);
  assert.deepEqual(pupazzo.mosseLabiale({...dottore, ossa: {testa: dottore.ossa.testa}}, {apertura: 0, larghezza: 0.5}), {});
  // i livelli valgono solo quando ci sono il corpo e le immagini delle parti
  assert.equal(pupazzo.livelliAttivi(dottore).length, 2);
  assert.equal(pupazzo.livelliAttivi({...dottore, corpo: undefined}).length, 0);
});
await prova('seconda mano: uno stato a ogni posa, scende lungo il fianco e torna, mai uno scatto; solo per chi ha il livello', () => {
  const dottore = JSON.parse(fs.readFileSync(`${K}/personaggi/dottore/personaggio.json`, 'utf8'));
  const seconde = pupazzo.secondeDi(dottore);
  assert.deepEqual(Object.keys(seconde).sort(), ['alza', 'aperta', 'giu']);
  assert.equal(pupazzo.secondeDi({...dottore, corpo: undefined}), undefined); // senza i livelli quella mano resta com'è
  assert.equal(pupazzo.secondeDi({...dottore, pose2: undefined}), undefined);
  const {braccio2: _via, ...senzaOsso} = dottore.ossa;
  assert.equal(pupazzo.secondeDi({...dottore, ossa: senzaOsso}), undefined);
  const disponibili = Object.keys({...gesti.ASSETTI, ...dottore.pose});
  const cambi = gesti.scalettaAssetti(dati, () => undefined, disponibili, Object.keys(seconde));
  assert.ok(cambi.every((c) => seconde[c.seconda]), 'ogni cambio di posa ha lo stato della seconda mano');
  assert.ok(new Set(cambi.map((c) => c.seconda)).size >= 2, 'la seconda mano resta sempre nello stesso stato');
  assert.ok(gesti.scalettaAssetti(dati, () => undefined, disponibili).every((c) => c.seconda === undefined));
  assert.ok(gesti.scalettaAssetti(dati, () => ({seconda: 'giu'}), disponibili, Object.keys(seconde)).every((c) => c.seconda === 'giu'));
  assert.throws(() => gesti.scalettaAssetti(dati, () => ({seconda: 'tasca'}), disponibili, Object.keys(seconde)), /seconda mano/);
  const ev = gesti.scalettaGesti(dati, () => undefined);
  const [minimo, massimo] = dottore.limiti.braccio2;
  let prima = null;
  let bassa = 0;
  let alta = -99;
  for (let f = 0; f < Math.round(dati.durata * 30); f++) {
    const m = gesti.atteggiamento(ev, dati, f / 30, {cambi, pose: dottore.pose, limiti: dottore.limiti, seconde}).mosse;
    assert.ok(m.braccio2.ruota >= minimo - 0.01 && m.braccio2.ruota <= massimo + 0.01, `seconda mano a ${m.braccio2.ruota.toFixed(1)}°`);
    assert.ok(!m.palmo.dx && !m.palmo.dy, 'con il livello la mano ruota dal gomito e dal polso: non si allunga');
    if (prima !== null) assert.ok(Math.abs(m.braccio2.ruota - prima) < 6, `scatto di ${Math.abs(m.braccio2.ruota - prima).toFixed(1)}° a ${(f / 30).toFixed(2)} s`);
    prima = m.braccio2.ruota;
    bassa = Math.min(bassa, m.braccio2.ruota);
    alta = Math.max(alta, m.braccio2.ruota);
  }
  assert.ok(bassa < -55 && alta > 4, `la seconda mano va da ${bassa.toFixed(0)}° a ${alta.toFixed(0)}°: troppo poco`);
  // senza gli stati della seconda mano tutto resta com'era: l'osso non si muove
  const senza = gesti.atteggiamento(ev, dati, 5, {cambi, pose: dottore.pose, limiti: dottore.limiti}).mosse;
  assert.equal(senza.braccio2.ruota, 0);
});
const bocca = await ts('libreria/bocca.ts');
await prova('palpebre: battiti irregolari, uno in più a ogni cambio di posa, sempre gli stessi', () => {
  const lista = bocca.listaBattiti(60, [10.05, 30]);
  assert.deepEqual(lista, bocca.listaBattiti(60, [10.05, 30]));
  assert.ok(lista.length >= 12 && lista.length <= 40);
  assert.ok(lista.some((t) => Math.abs(t - 30) < 0.56));
  assert.equal(bocca.battitoDa(lista, lista[3] + 0.08), 1);
  assert.equal(bocca.battitoDa(lista, lista[3] - 0.01 < lista[2] + 0.24 ? lista[3] + 0.5 : lista[3] - 0.01), 0);
  const aperta = bocca.formaBocca([{testo: 'aaaa', inizio: 1, fine: 1.4, frase: 0}], 1.2);
  assert.ok(aperta.apertura > 0.9 && bocca.formaBocca([], 1).apertura === 0);
});

const maglia = await ts('libreria/maglia.ts');
await prova('maglia: senza mosse niente si muove; una rotazione muove solo la zona e sfuma ai bordi', () => {
  const ossa = {testa: {perno: [100, 200], zona: {tipo: 'ellisse', centro: [100, 100], raggi: [60, 80]}, sfuma: 30}, mano: {perno: [300, 300], zona: {tipo: 'poligono', punti: [[280, 280], [340, 280], [340, 340], [280, 340]]}, sfuma: 10}};
  const m = maglia.creaMaglia(400, 400, ossa, 20);
  const ferma = maglia.deforma(m, ossa, {});
  assert.equal(ferma.mossi.reduce((a, b) => a + b, 0), 0);
  const mossa = maglia.deforma(m, ossa, {testa: {ruota: 10}});
  const i = (r, c) => r * (m.colonne + 1) + c;
  const dentro = i(5, 5); // (100,100): pieno peso
  assert.equal(mossa.mossi[dentro], 2); // 2 = parte rigida, 1 = fascia che si piega
  const dx = mossa.punti[dentro * 2] - m.punti[dentro * 2];
  assert.ok(Math.abs(dx - (100 * Math.sin((10 * Math.PI) / 180))) < 0.5, `spostamento ${dx}`);
  const lontano = i(15, 15); // (300,300): fuori dalla testa
  assert.equal(mossa.mossi[lontano], 0);
  assert.equal(maglia.distanzaDallaZona(ossa.mano.zona, 300, 300), 0);
  assert.ok(Math.abs(maglia.distanzaDallaZona(ossa.mano.zona, 350, 300) - 10) < 1e-6);
  // un livello: l'osso "tutto" lo muove per intero, e l'osso figlio (la mano) ruota attorno al perno che si è spostato
  const livello = {braccio: {perno: [200, 400], zona: {tipo: 'tutto'}, sfuma: 1}, mano: {...ossa.mano, genitore: 'braccio'}};
  const ml = maglia.creaMaglia(400, 400, livello, 20);
  const girato = maglia.deforma(ml, livello, {braccio: {ruota: 90}});
  assert.ok(girato.mossi.every((v) => v === 2));
  const angolo = i(0, 0); // (0,0) ruota di 90° in senso orario attorno a (200,400) → (600,200)
  assert.ok(Math.abs(girato.punti[angolo * 2] - 600) < 0.01 && Math.abs(girato.punti[angolo * 2 + 1] - 200) < 0.01);
  const celle = maglia.cellePiene(ml, 100, 100, 50, 30);
  assert.equal(celle.reduce((a, b) => a + b, 0), 6); // tre colonne per due righe di celle da 20
  const sc = maglia.scalaOssa(ossa, 0.5, 10, 20);
  assert.deepEqual(sc.testa.perno, [60, 120]);
  assert.equal(sc.testa.sfuma, 15);
});

const tre = await ts('libreria/Tre.tsx');
await prova('3D: forme chiuse, facce orientate verso l\'esterno, proiezione', () => {
  const fuori = (facce) => {
    for (const f of facce) {
      if (f.linea !== undefined || f.doppia) continue;
      let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
      f.punti.forEach((a, k) => { const b = f.punti[(k + 1) % f.punti.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); cx += a[0]; cy += a[1]; cz += a[2]; });
      const k = f.punti.length;
      assert.ok(nx * (cx / k) + ny * (cy / k) + nz * (cz / k) > 0, 'faccia rivolta verso l\'interno');
    }
  };
  fuori(tre.scatola({misure: [100, 60, 40], colore: '#fff'}));
  fuori(tre.cilindro({raggio: 40, altezza: 100, colore: '#fff'}));
  fuori(tre.cilindro({raggio: 40, raggioAlto: 0, altezza: 100, colore: '#fff'}));
  fuori(tre.sfera({raggio: 50, colore: '#fff'}));
  fuori(tre.capsula({raggio: 30, altezza: 160, colori: ['#f00', '#fff']}));
  fuori(tre.estrusione({profilo: [[-50, -50], [50, -50], [50, 50], [-50, 50]], profondita: 30, colore: '#fff'}));
  assert.equal(tre.scatola({misure: [1, 1, 1], colore: '#fff'}).length, 6);
  const p = tre.proietta([0, 100, 0], {giro: 0, alza: 0, distanza: 1000}, [540, 880]);
  assert.ok(Math.abs(p.x - 540) < 1e-6 && Math.abs(p.y - 780) < 1e-6);
  const vicino = tre.proietta([0, 0, 500], {distanza: 1000}, [540, 880]);
  assert.ok(Math.abs(vicino.scala - 2) < 1e-6);
  const girato = tre.ruotaPunto([1, 0, 0], [0, 90, 0]);
  assert.ok(Math.abs(girato[2] + 1) < 1e-9);
  const sp = tre.gruppo(tre.scatola({misure: [2, 2, 2], colore: '#fff'}), {pos: [10, 0, 0], scala: 2});
  assert.ok(sp.every((f) => f.punti.every((q) => q[0] >= 8 && q[0] <= 12)));
});

const {sistema} = await import(`${K}/motore/impostazioni.mjs`);
await prova('impostazioni: valori completati e controllati', () => {
  const pers = {dottore: {id: 'dottore'}, fmlab: {id: 'fmlab'}};
  assert.deepEqual(sistema({}, pers), {regalo: 'auto', atmosfera: 'auto', formato: '9:16', narratore: {chi: 'nessuno', grandezza: 100, lato: 'destra', alza: 0, specchia: false, mano2: 'auto'}, stile: 'auto', musica: 30, durata: null, voce: {motore: 'auto', elevenlabs: {}, mac: {}, comando: {}}});
  // la seconda mano del narratore e il volume della musica
  assert.equal(sistema({narratore: {chi: 'dottore', mano2: 'Giù'}}, pers).narratore.mano2, 'giu');
  assert.throws(() => sistema({narratore: {chi: 'dottore', mano2: 'tasca'}}, pers), /seconda mano/);
  assert.equal(sistema({musica: '0'}, pers).musica, 0);
  assert.throws(() => sistema({musica: 140}, pers), /musica/);
  assert.deepEqual(sistema({voce: {motore: 'MAC', mac: {it: ' Alice ', xx9: 'no'}}}, pers).voce, {motore: 'mac', elevenlabs: {}, mac: {it: 'Alice'}, comando: {}});
  assert.throws(() => sistema({voce: {motore: 'radio'}}, pers), /motore della voce/);
  assert.equal(sistema({narratore: {chi: 'dottore', grandezza: '80'}, stile: '3D'}, pers).stile, '3d');
  assert.throws(() => sistema({narratore: {chi: 'pippo'}}, pers), /non esiste/);
  assert.throws(() => sistema({narratore: {chi: 'dottore', grandezza: 500}}, pers), /grandezza/);
  assert.throws(() => sistema({stile: '4d'}, pers), /stile/);
  assert.throws(() => sistema({narratore: {chi: 'dottore', lato: 'sopra'}}, pers), /lato/);
});

const {nomeDaTitolo, elencoModelli} = await import(`${K}/motore/nuovo.mjs`);
const {titoloDaRichiesta, spezzaComando, fraseAgente} = await import(`${K}/motore/pannello.mjs`);
const {suggerisciStile} = await import(`${K}/motore/comune/stile.mjs`);
await prova('pannello: nome del reel, titolo, comando dell\'agente, suggerimento 2D/3D', () => {
  assert.equal(nomeDaTitolo('Perché il cuore non si stanca mai?'), 'perche-il-cuore-non-si-stanca-mai');
  assert.equal(nomeDaTitolo('   '), 'reel');
  assert.ok(nomeDaTitolo('una frase lunghissima che non finisce mai e continua ancora per molto').length <= 36);
  assert.equal(titoloDaRichiesta('Come funziona il cambio automatico: perché non serve la frizione.'), 'Come funziona il cambio automatico');
  assert.deepEqual(spezzaComando('agente -p "testo con spazi" --altro \'x y\''), ['agente', '-p', 'testo con spazi', '--altro', 'x y']);
  assert.match(fraseAgente('gps'), /reels\/gps\/richiesta\.md/);
  assert.equal(suggerisciStile('Perché il cuore non si stanca mai').stile, '3d');
  assert.equal(suggerisciStile('Come funzionano le tasse sul mutuo').stile, '2d');
});

await prova('catalogo: ogni scena pronta e ogni oggetto 3D è disegnato nel catalogo e spiegato in CATALOGO.md', async () => {
  const {NEL_CATALOGO} = await ts('motore/web/catalogo.tsx');
  const guida = fs.readFileSync(path.join(K, 'CATALOGO.md'), 'utf8');
  const esportati = (file, filtro) => [...fs.readFileSync(path.join(K, file), 'utf8').matchAll(/^export function (\w+)/gm)].map((m) => m[1]).filter(filtro);
  const blocchi = esportati('libreria/Blocchi.tsx', (n) => n.startsWith('blocco'));
  const oggetti = esportati('libreria/Modelli.ts', (n) => n.endsWith('3d'));
  const grafici = esportati('libreria/Grafici.tsx', (n) => n.startsWith('Grafico'));
  const schizzi = esportati('libreria/Schizzo.tsx', (n) => n.startsWith('Schizzo'));
  assert.ok(blocchi.length >= 18 && oggetti.length >= 13 && grafici.length === 3 && schizzi.length === 4);
  for (const nome of [...blocchi, ...oggetti, ...grafici]) {
    assert.ok(NEL_CATALOGO.includes(nome), `"${nome}" non è disegnato nel catalogo (motore/web/catalogo.tsx)`);
    assert.ok(guida.includes('`' + nome + '`'), `"${nome}" non è spiegato in CATALOGO.md`);
  }
  for (const nome of schizzi) assert.ok(guida.includes('`' + nome + '`'), `"${nome}" non è spiegato in CATALOGO.md`);
});
await prova('filmato: a ogni istante il suo fotogramma; alla fine resta sull\'ultimo oppure ricomincia', async () => {
  const {fotogrammaClip, fileFotogramma} = await ts('libreria/Media.tsx');
  const clip = {nome: 'demo', fotogrammi: 60, fps: 30, larghezza: 360, altezza: 780};
  assert.equal(fotogrammaClip(clip, -1), 1, 'prima di partire mostra il primo fotogramma');
  assert.equal(fotogrammaClip(clip, 0), 1);
  // un fotogramma del reel = un fotogramma della clip, senza saltarne e senza ripeterne
  for (let f = 0; f < 60; f++) assert.equal(fotogrammaClip(clip, f / 30), f + 1);
  assert.equal(fotogrammaClip(clip, 5), 60, 'finita la clip resta sull\'ultimo fotogramma');
  assert.equal(fotogrammaClip(clip, 2, {ripeti: true}), 1);
  assert.equal(fotogrammaClip(clip, 2.5, {ripeti: true}), 16);
  assert.equal(fotogrammaClip(clip, 0.5, {velocita: 2}), 31);
  assert.equal(fotogrammaClip(clip, 0, {inizio: 1}), 31);
  assert.equal(fileFotogramma(clip, 7), 'clip/demo/00007.jpg');
  const {nomeClip, variabileClip} = await import(`${K}/motore/clip.mjs`);
  assert.equal(nomeClip('Registrazione Schermo 12.MOV'), 'registrazione-schermo-12');
  assert.equal(nomeClip('perché così.mp4'), 'perche-cosi');
  assert.equal(nomeClip('...'), 'clip');
  assert.equal(variabileClip('demo-app'), 'demoApp');
  assert.equal(variabileClip('2-prova'), 'clip2Prova');
  const guida = fs.readFileSync(path.join(K, 'CATALOGO.md'), 'utf8');
  assert.ok(guida.includes('`Foto`') && guida.includes('`Filmato`') && guida.includes('npm run clip'));
});
await prova('riuso: a fine reel elenca scene, pezzi e oggetti scritti a mano, e dice se in libreria c\'è già qualcosa di simile', async () => {
  const {analizzaRiuso, nomiDellaLibreria} = await import(`${K}/motore/riuso.mjs`);
  const libreria = nomiDellaLibreria();
  assert.ok(libreria.has('bloccoScala') && libreria.has('ginocchio3d') && libreria.get('ginocchio3d') === 'Modelli.ts');
  const scritto = `import {Scena3D, cilindro, sfera, definisciReel, bloccoChiusura, useScena} from '../../libreria';
const TESTI = {it: {a: 'A'}};
function useTesti() {
  return TESTI.it;
}
const bilancia = (peso = 1) => [
  ...cilindro({raggio: 40, altezza: 10}),
  ...sfera({raggio: 20 * peso}),
];
function Piatto({x, y}: {x: number; y: number}) {
  return (
    <div style={{left: x, top: y}}>
      <b>piatto</b>
    </div>
  );
}
function Scala() {
  const s = useScena();
  return (
    <>
      <Piatto x={1} y={2} />
      <Scena3D oggetti={bilancia(s.t)} />
    </>
  );
}
export default definisciReel({
  titolo: 'Prova',
  scene: {
    scala: {componente: Scala, atmosfera: {tinta: '#fff'}},
    chiusura: bloccoChiusura({parola: 'X', segno: 'c'}),
  },
});
`;
  const r = analizzaRiuso(scritto, libreria);
  assert.equal(r.scene, 2);
  assert.equal(r.aMano, 1);
  assert.deepEqual(r.pronte, ['bloccoChiusura']);
  const per = Object.fromEntries(r.pezzi.map((p) => [p.nome, p]));
  assert.deepEqual(Object.keys(per).sort(), ['Piatto', 'Scala', 'bilancia']);
  assert.equal(per.Scala.tipo, 'scena');
  assert.equal(per.Scala.simile, 'bloccoScala');
  assert.equal(per.Piatto.tipo, 'pezzo');
  assert.equal(per.bilancia.tipo, 'oggetto 3D');
  assert.equal(per.Piatto.righe, 7);
  assert.equal(per.Piatto.riga, 10);
  // un reel fatto solo con le scene pronte non ha niente da portare in libreria
  const modello = fs.readFileSync(path.join(K, 'motore/modelli/spiegazione/scene.tsx'), 'utf8');
  const pulito = analizzaRiuso(modello, libreria);
  assert.equal(pulito.pezzi.length, 0);
  assert.ok(pulito.pronte.length >= 2 && pulito.aMano === 0);
  // il reel sul ginocchio: tante scene a mano, e il kit segnala quelle che hanno già un fratello in libreria
  const reta = analizzaRiuso(fs.readFileSync(path.join(K, 'reels/reta-ginocchio/scene.tsx'), 'utf8'), libreria);
  assert.equal(reta.scene, 10);
  assert.ok(reta.pezzi.find((p) => p.nome === 'Ginocchio')?.simile === 'ginocchio3d');
  for (const doc of ['SCHEDA.md', 'FMLAB_AVVIA.md', 'PROMPT.md']) assert.ok(fs.readFileSync(path.join(K, doc), 'utf8').includes('npm run riuso'), `${doc} non chiede il riuso`);
});
const {cercaIcone, pezziDelNome, paroleDaCercare, cartellaIcone} = await import(`${K}/motore/icone.mjs`);
await prova('icone: si cercano anche in italiano e al plurale; il nome si legge a pezzi', () => {
  assert.deepEqual(pezziDelNome('FaHeartPulse'), ['heart', 'pulse']);
  assert.deepEqual(pezziDelNome('GiKneeCap'), ['knee', 'cap']);
  assert.ok(paroleDaCercare(['cuori']).includes('heart') && paroleDaCercare(['Pillole']).includes('pill') && paroleDaCercare(['orologio']).includes('clock'));
  assert.deepEqual(paroleDaCercare(['heart']), ['heart']);
  if (cartellaIcone()) {
    const cuore = cercaIcone(['cuore']);
    assert.ok(cuore.length >= 10 && /Heart/.test(cuore[0].nome), 'cercando "cuore" la prima icona non è un cuore');
    assert.ok(cercaIcone(['ginocchio']).some((i) => i.raccolta === 'gi'));
    assert.equal(cercaIcone(['zzzqqq']).length, 0);
  } else {
    console.log('     (icone non installate: la ricerca vera si prova dopo npm install)');
  }
});
const {leggiPrompt} = await import(`${K}/motore/pannello.mjs`);
await prova('prompt pronti: PROMPT.md si legge, ogni prompt ha titolo e testo e nomina i file giusti', () => {
  const elenco = leggiPrompt();
  assert.ok(elenco.length >= 10, `solo ${elenco.length} prompt`);
  for (const p of elenco) {
    assert.ok(p.titolo.length > 3 && p.testo.length > 60 && !p.testo.includes('```'), `prompt "${p.titolo}" incompleto`);
    for (const file of p.testo.match(/[\w\/-]*[A-Z][A-Z_-]*\.md\b/g) ?? []) assert.ok(fs.existsSync(path.join(K, file)), `il prompt "${p.titolo}" nomina ${file}, che non esiste`);
    for (const comando of p.testo.match(/npm run (\w+)/g) ?? []) assert.ok(JSON.parse(fs.readFileSync(path.join(K, 'package.json'), 'utf8')).scripts[comando.slice(8)], `il prompt "${p.titolo}" usa ${comando}, che non esiste`);
  }
});
await prova('agenti: i due file di istruzioni ci sono, dicono la stessa cosa e rimandano a file che esistono', () => {
  const [uno, due] = ['AGENTS.md', 'CLAUDE.md'].map((f) => fs.readFileSync(path.join(K, f), 'utf8'));
  assert.equal(uno, due, 'i due file di istruzioni devono restare uguali: copia la modifica anche nell\'altro');
  for (const file of uno.match(/[\w\/-]+\.md\b/g) ?? []) assert.ok(fs.existsSync(path.join(K, file)), `il file di istruzioni nomina ${file}, che non esiste`);
  assert.ok(/npm run stato/.test(uno) && /npm run riuso/.test(uno));
  const leggimi = fs.readFileSync(path.join(K, 'LEGGIMI.md'), 'utf8');
  assert.ok(leggimi.includes('FMLAB_AGENTE') && leggimi.includes('git init'));
  // un comando con le virgolette si spezza bene quando il pannello lo avvia
  assert.deepEqual(spezzaComando('agente -p --permessi "Leggi,Scrivi, Esegui"').slice(-2), ['--permessi', 'Leggi,Scrivi, Esegui']);
  const esempio = fs.readFileSync(path.join(K, '.env.esempio'), 'utf8');
  assert.match(esempio, /FMLAB_AGENTE=/);
});
await prova('modelli di reel: ognuno ha copione e scene con gli stessi segni', async () => {
  const {leggiCopione} = await import(`${K}/motore/copione.mjs`);
  const modelli = elencoModelli();
  assert.ok(modelli.length >= 6 && modelli[0].id === 'spiegazione');
  for (const m of modelli) {
    const dir = path.join(K, 'motore/modelli', m.id);
    const copione = leggiCopione(fs.readFileSync(path.join(dir, 'copione.md'), 'utf8'));
    const scene = fs.readFileSync(path.join(dir, 'scene.tsx'), 'utf8');
    for (const s of copione.scene) assert.ok(new RegExp(`\\b${s.nome}:`).test(scene), `${m.id}: la scena "${s.nome}" manca in scene.tsx`);
    for (const usato of scene.matchAll(/segno\w*: '([a-z0-9_-]+)'|dopo\('([a-z0-9_-]+)'\)/g)) {
      const nome = usato[1] ?? usato[2];
      assert.ok(nome in copione.segni, `${m.id}: scene.tsx usa il segno [${nome}] che nel copione non c'è`);
    }
    assert.ok(m.descrizione.length > 20);
  }
});

console.log(`\n${n} prove superate`);
