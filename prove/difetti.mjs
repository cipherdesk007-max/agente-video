// FMLAB Reel Kit — una prova per ogni difetto di BUG.md. Veloci, senza browser.
//   npm test
// Ogni prova porta il numero del difetto. Una prova "rimandata" è un difetto ancora aperto: oggi deve fallire,
// e se un giorno passa lo dice, così la voce di BUG.md viene chiusa e la prova diventa normale.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const K = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const carica = (file) => import(`${K}/${file}`);
const esbuild = await import(path.join(K, 'node_modules/esbuild/lib/main.js'));
async function ts(file) {
  const out = path.join(os.tmpdir(), `fmlab-difetti-${path.basename(file).replace(/\W/g, '_')}-${process.pid}.mjs`);
  await esbuild.build({entryPoints: [path.join(K, file)], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'}, loader: {'.png': 'dataurl', '.jpg': 'dataurl'}});
  return import(out);
}

const esiti = [];
async function prova(nome, f) {
  try {
    await f();
    esiti.push({nome, ok: true});
    console.log('  ok', nome);
  } catch (e) {
    esiti.push({nome, ok: false});
    console.log('  NO', nome, '\n       ' + String(e.message).split('\n').slice(0, 3).join('\n       '));
  }
}
async function rimandata(nome, fase, f) {
  try {
    await f();
  } catch {
    console.log(`  ··  ${nome}  (ancora aperto: ${fase})`);
    return;
  }
  esiti.push({nome, ok: false});
  console.log('  NO', nome, `\n       adesso passa: chiudi la voce in BUG.md e togli "rimandata"`);
}

/** Un reel usa e getta dentro reels/, cancellato alla fine. */
const daCancellare = new Set();
const {CARTELLA_REELS} = await carica('motore/percorsi.mjs');
function cancella() {
  for (const slug of daCancellare) fs.rmSync(path.join(CARTELLA_REELS, slug), {recursive: true, force: true});
}
process.on('exit', cancella);
const zitto = async (f) => {
  const registro = console.log;
  console.log = () => {};
  try {
    return await f();
  } finally {
    console.log = registro;
  }
};

const TESTI_DIFFICILI = [
  'Oggi parliamo di caffè.\n#caffeina è la parola chiave.\nFine.',
  'Il risultato:\n> 5 è maggiore di 3.\nFine.',
  'Costa 3 * 2 euro, cioè *poco*. Fine.',
  'Lo studio [1] dice così, e [nota bene] conta. Fine.',
  'Prima <!-- non è un commento --> dopo.',
  'Una barra \\ rovesciata e una [scena:finta] che resta testo.',
  "Il 38% delle persone beve 5 caffè al giorno: 2,5 euro l'uno.",
];

// ───────────────────────── B03 · caratteri del copione ─────────────────────────

const copioni = await carica('motore/copione.mjs');
await prova('B03 · copione: i caratteri dei comandi si possono scrivere come testo (\\[ \\] \\* \\# \\>)', () => {
  const c = copioni.leggiCopione('Lo studio \\[1\\] costa 3\\*2 euro.\n\\#caffeina resta.\n\\> anche questa. E \\<!-- questo --> pure.');
  // (i segni rimasti soli, come ">" e "<!--", si attaccano alla parola prima: è il difetto B20, qui contano i caratteri)
  assert.equal(c.testoParlato.replace(/\s+/g, ''), 'Lostudio[1]costa3*2euro.#caffeinaresta.>anchequesta.E<!--questo-->pure.');
  assert.equal(c.parole[2].testo, '[1]');
  assert.deepEqual(c.segni, {});
});
await prova('B03 · copione: da un testo qualsiasi non si perde nemmeno un carattere', () => {
  assert.equal(typeof copioni.copioneDaTesto, 'function', 'manca copioneDaTesto()');
  for (const testo of TESTI_DIFFICILI) {
    const c = copioni.leggiCopione(copioni.copioneDaTesto(testo, {titolo: 'Prova # con [segni]', lingua: 'it'}));
    assert.equal(c.testoParlato.replace(/\s+/g, ''), testo.replace(/\s+/g, ''), `perso qualcosa in: ${testo}`);
    assert.deepEqual(c.segni, {});
    assert.equal(c.scene.length, 1);
    assert.equal(c.parole.some((p) => p.enfasi), false);
  }
});

// ───────────────────────── B01 · il testo del pannello è il testo del reel ─────────────────────────

await prova('B01 · testo: il confronto parola per parola trova la prima differenza', () => {
  assert.equal(typeof copioni.confrontaTesto, 'function', 'manca confrontaTesto()');
  assert.equal(copioni.confrontaTesto('Il caffè — quello vero.\nFine.', 'Il caffè— quello vero. Fine.'), null);
  const d = copioni.confrontaTesto('Il caffè non ti dà energia.', 'Il caffè non dà energia.');
  assert.equal(d.atteso, 'ti');
  assert.equal(d.trovato, 'dà');
  assert.equal(d.parola, 4);
  assert.ok(copioni.confrontaTesto('uno due', 'uno due tre').trovato === 'tre');
});

let pannello = null;
async function apriPannello() {
  if (pannello) return pannello;
  Object.assign(process.env, {FMLAB_PANNELLO_PROVA: '1', FMLAB_NON_APRIRE: '1', FMLAB_PORTA_PANNELLO: '0', FMLAB_CHIAVE_PANNELLO: 'PROVA234'});
  const {comandoPannello} = await carica('motore/pannello.mjs');
  const {server, chiave} = await zitto(() => comandoPannello([]));
  const base = `http://127.0.0.1:${server.porta}`;
  const chiama = async (percorso, corpo) => {
    const r = await fetch(base + percorso, {method: corpo ? 'POST' : 'GET', headers: {Cookie: `fmlab_chiave=${chiave}`, 'Content-Type': 'application/json'}, body: corpo ? JSON.stringify(corpo) : undefined});
    return {codice: r.status, dati: await r.json()};
  };
  pannello = {server, chiama};
  return pannello;
}
const TESTO_PANNELLO = 'Il caffè non ti dà energia. Te la presta.\n#adenosina: si accumula mentre stai sveglio [1].\nDopo circa 5 ore metà della caffeina è sparita * e il conto arriva. Commenta CAFFÈ.';
await prova('B01 · pannello: il testo incollato diventa il copione, parola per parola, e resta scritto in testo.txt', async () => {
  const {chiama} = await apriPannello();
  const r = await chiama('/api/nuovo', {richiesta: TESTO_PANNELLO, titolo: `zz difetti testo ${process.pid}`, durata: 30, narratore: {chi: 'dottore'}});
  if (r.dati.slug) daCancellare.add(r.dati.slug);
  assert.equal(r.codice, 200, r.dati.errore);
  const dir = path.join(CARTELLA_REELS, r.dati.slug);
  const copione = copioni.leggiCopione(fs.readFileSync(path.join(dir, 'copione.md'), 'utf8'));
  assert.equal(copioni.confrontaTesto(TESTO_PANNELLO, copione.testoParlato), null, `il copione dice: ${copione.testoParlato.slice(0, 80)}…`);
  assert.equal(fs.readFileSync(path.join(dir, 'testo.txt'), 'utf8').trim(), TESTO_PANNELLO);
  // le scene di partenza corrispondono al copione: provini e anteprima funzionano subito
  const scene = fs.readFileSync(path.join(dir, 'scene.tsx'), 'utf8');
  for (const s of copione.scene) assert.ok(new RegExp(`\\b${s.nome}:`).test(scene), `la scena "${s.nome}" manca in scene.tsx`);
  assert.match(fs.readFileSync(path.join(dir, 'richiesta.md'), 'utf8'), /parola per parola/);
});
await prova('B01 · pannello: chi vuole dare solo l\'argomento lo dice, e il testo non viene preso per copione', async () => {
  const {chiama} = await apriPannello();
  const r = await chiama('/api/nuovo', {tipo: 'argomento', richiesta: 'Spiega perché il caffè non dà energia ma la presta.', titolo: `zz difetti argomento ${process.pid}`, durata: 45, narratore: {chi: 'dottore'}});
  if (r.dati.slug) daCancellare.add(r.dati.slug);
  assert.equal(r.codice, 200, r.dati.errore);
  assert.equal(fs.existsSync(path.join(CARTELLA_REELS, r.dati.slug, 'testo.txt')), false);
});

// ───────────────────────── B02 · B08 · durata ─────────────────────────

await prova('B02 · durata: la voce troppo lunga si velocizza fino a 1,4; oltre, dice quante parole togliere', async () => {
  const {adattaDurata, paroleMassime, giudicaDurata} = await carica('motore/durata.mjs');
  // 62 s chiesti 60: è già dentro i 5 secondi, non si tocca
  assert.deepEqual(adattaDurata({fineVoce: 60.6, coda: 1.4, parole: 200, chiesta: 60}), {velocita: 1, durata: 62, entra: true});
  // 80 s chiesti 60: si velocizza per arrivare a 60 giusti
  const a = adattaDurata({fineVoce: 78.6, coda: 1.4, parole: 260, chiesta: 60});
  assert.ok(Math.abs(a.velocita - 78.6 / 58.6) < 0.001 && Math.abs(a.durata - 60) < 0.01 && a.entra);
  // 114,7 s chiesti 60: a 1,4 fa 82,3 s, fuori di 17 secondi: servono parole in meno
  const b = adattaDurata({fineVoce: 113.3, coda: 1.4, parole: 290, chiesta: 60});
  assert.equal(b.velocita, 1.4);
  assert.equal(b.entra, false);
  assert.ok(b.paroleDaTogliere >= 55 && b.paroleDaTogliere <= 70, `parole da togliere: ${b.paroleDaTogliere}`);
  // troppo corto: non si rallenta, si dice
  const c = adattaDurata({fineVoce: 28, coda: 1.4, parole: 95, chiesta: 60});
  assert.equal(c.velocita, 1);
  assert.equal(c.entra, false);
  assert.ok(c.paroleMancanti > 50);
  // senza durata chiesta non cambia niente
  assert.deepEqual(adattaDurata({fineVoce: 113.3, coda: 1.4, parole: 290, chiesta: null}), {velocita: 1, durata: 114.7, entra: true});
  // prima di spendere: quante parole entrano al massimo (200 parole al minuto, velocità 1,4)
  assert.ok(paroleMassime(60) >= 290 && paroleMassime(60) <= 300);
  assert.ok(paroleMassime(30) < 160);
  assert.equal(giudicaDurata(64.9, 60).ok, true);
  assert.equal(giudicaDurata(65.2, 60).ok, false);
  assert.equal(giudicaDurata(54.5, 60).ok, false);
  assert.equal(giudicaDurata(300, null).ok, true);
});
await prova('B02 · B08 · impostazioni: la durata chiesta si salva, da 15 a 180 secondi', async () => {
  const {sistema} = await carica('motore/impostazioni.mjs');
  const pers = {dottore: {id: 'dottore'}};
  assert.equal(sistema({}, pers).durata, null);
  assert.equal(sistema({durata: '45'}, pers).durata, 45);
  assert.equal(sistema({durata: 180}, pers).durata, 180);
  assert.throws(() => sistema({durata: 181}, pers), /durata/);
  assert.throws(() => sistema({durata: 10}, pers), /durata/);
});
await prova('B02 · voce: con la durata chiesta i tempi vengono stretti e la velocità resta scritta', async () => {
  const {creaReel} = await carica('motore/nuovo.mjs');
  const {scriviImpostazioni, leggiImpostazioni} = await carica('motore/impostazioni.mjs');
  const {comandoVoce} = await carica('motore/voce.mjs');
  const slug = `zz-difetti-durata-${process.pid}`;
  daCancellare.add(slug);
  await creaReel(slug, 'Prova durata', {silenzioso: true});
  // 70 parole: a ritmo stimato circa 38 secondi; ne chiedo 30
  fs.writeFileSync(path.join(CARTELLA_REELS, slug, 'copione.md'), '<!-- lingua: it -->\n[scena:aggancio]\n' + Array.from({length: 70}, (_, i) => (i % 12 === 11 ? 'parola.' : 'parola')).join(' ') + '\n');
  scriviImpostazioni(slug, {...leggiImpostazioni(slug), durata: 30});
  const dati = await zitto(() => comandoVoce(slug, ['stima']));
  assert.ok(Math.abs(dati.durata - 30) <= 5, `durata ${dati.durata} s, chiesti 30`);
  assert.ok(dati.velocita > 1.05 && dati.velocita <= 1.4, `velocità ${dati.velocita}`);
  assert.equal(JSON.parse(fs.readFileSync(path.join(CARTELLA_REELS, slug, 'parole.json'), 'utf8')).velocita, dati.velocita);
});
await prova('B02 · audio: nel video la voce è velocizzata della stessa misura dei tempi', async () => {
  const {argomentiAudio} = await carica('motore/ffmpeg.mjs');
  const grafo = argomentiAudio({voce: 'voce.mp3', durata: 30, velocita: 1.25}).join(' ');
  assert.match(grafo, /atempo=1\.25/);
  assert.doesNotMatch(argomentiAudio({voce: 'voce.mp3', durata: 30}).join(' '), /atempo/);
});
await prova('B08 · pannello: accetta da 15 a 180 secondi, rifiuta il resto, e la pagina ha il campo per scriverla', async () => {
  const {chiama} = await apriPannello();
  const fuori = await chiama('/api/nuovo', {richiesta: TESTO_PANNELLO, titolo: `zz difetti fuori ${process.pid}`, durata: 181, narratore: {chi: 'dottore'}});
  if (fuori.dati.slug) daCancellare.add(fuori.dati.slug);
  assert.equal(fuori.codice, 400);
  const lunga = await chiama('/api/nuovo', {tipo: 'argomento', richiesta: 'Un argomento lungo da spiegare con calma.', titolo: `zz difetti lunga ${process.pid}`, durata: 180, narratore: {chi: 'dottore'}});
  if (lunga.dati.slug) daCancellare.add(lunga.dati.slug);
  assert.equal(lunga.codice, 200, lunga.dati.errore);
  const {leggiImpostazioni} = await carica('motore/impostazioni.mjs');
  assert.equal(leggiImpostazioni(lunga.dati.slug).durata, 180);
  assert.match(fs.readFileSync(path.join(K, 'motore/web/pannello.html'), 'utf8'), /id="durata-libera"/);
});

// ───────────────────────── B04 · copione cambiato dopo la voce ─────────────────────────

await prova('B04 · copione cambiato dopo la voce: i tempi stimati si rifanno da soli, una voce vera ferma il render', async () => {
  const {creaReel} = await carica('motore/nuovo.mjs');
  const {impacchetta} = await carica('motore/impacchetta.mjs');
  const slug = `zz-difetti-vecchio-${process.pid}`;
  daCancellare.add(slug);
  const dir = await creaReel(slug, 'Prova testo vecchio', {silenzioso: true});
  const fileCopione = path.join(dir, 'copione.md');
  const fileParole = path.join(dir, 'parole.json');
  const leggi = () => JSON.parse(fs.readFileSync(fileParole, 'utf8'));
  // tempi stimati: basta rifarli
  fs.writeFileSync(fileCopione, fs.readFileSync(fileCopione, 'utf8').replace('Metti un', 'Metti sempre un'));
  await zitto(() => impacchetta(slug, null, {rigido: true}));
  assert.ok(leggi().parole.some((p) => p.testo === 'sempre'), 'i tempi stimati non sono stati rifatti');
  // voce vera: non si può rifare da soli (costa), quindi il render si ferma
  fs.writeFileSync(fileParole, JSON.stringify({...leggi(), motore: 'elevenlabs', voce: 'voce.mp3'}));
  fs.writeFileSync(fileCopione, fs.readFileSync(fileCopione, 'utf8').replace('Metti sempre un', 'Metti un'));
  await assert.rejects(zitto(() => impacchetta(slug, null, {rigido: true})), /copione è cambiato/);
  assert.ok(leggi().parole.some((p) => p.testo === 'sempre'), 'la voce vera non va toccata');
});

// ───────────────────────── B05 · scene pronte: niente tagli in silenzio ─────────────────────────

const {disegna, blocchi} = await ts('prove/sostegno/disegna.tsx');
await prova('B05 · scene pronte: quello che non entra dà un errore che dice cosa, non sparisce', () => {
  const voci = (n) => Array.from({length: n}, (_, i) => ({testo: `Voce ${i + 1}`}));
  assert.equal((disegna(blocchi.bloccoLista({voci: voci(5)})).match(/Voce \d/g) ?? []).length, 5);
  assert.throws(() => disegna(blocchi.bloccoLista({voci: voci(6)})), /bloccoLista.*6.*5/s);
  assert.throws(() => disegna(blocchi.bloccoBarre({dati: Array.from({length: 7}, (_, i) => ({etichetta: `C${i}`, valore: i + 1}))})), /bloccoBarre.*7.*6/s);
  assert.throws(() => disegna(blocchi.bloccoPassi({passi: voci(6)})), /bloccoPassi/);
  assert.throws(() => disegna(blocchi.bloccoSchede({schede: Array.from({length: 4}, (_, i) => ({valore: `${i}`}))})), /bloccoSchede/);
  assert.throws(() => disegna(blocchi.bloccoTempo({tappe: Array.from({length: 5}, (_, i) => ({quando: `${i}`}))})), /bloccoTempo/);
  const lungo = 'Questa voce è lunga e arriva fino in fondo alla riga senza perdere la parola FINALE';
  assert.throws(() => disegna(blocchi.bloccoLista({voci: [{testo: lungo}]})), /bloccoLista.*caratteri/s);
  assert.throws(() => disegna(blocchi.bloccoMito({mito: `${lungo} ${lungo}`, verita: 'Corta'})), /bloccoMito.*caratteri/s);
});
await prova('B05 · scene pronte: nel codice non resta nessun taglio muto', () => {
  const codice = fs.readFileSync(path.join(K, 'libreria/Blocchi.tsx'), 'utf8');
  assert.equal((codice.match(/\.slice\(0, \d\)/g) ?? []).length, 0, 'ci sono ancora dei .slice(0, n) in libreria/Blocchi.tsx');
});

// ───────────────────────── B07 · B10 · file di lavoro ─────────────────────────

await prova('B07 · git non propone di salvare provini, video e rapporti di verifica', () => {
  for (const file of ['reels/x/provini.jpg', 'reels/x/provini.en.jpg', 'reels/x/x.mp4', 'reels/x/x.en.mp4', 'reels/x/verifica.md', 'reels/x/verifica.en.md', 'reels/x/provini/x-00010.png']) {
    const r = spawnSync('git', ['check-ignore', '-q', file], {cwd: K});
    assert.equal(r.status, 0, `${file} non è ignorato`);
  }
  for (const file of ['reels/x/copione.md', 'reels/x/voce.mp3', 'reels/x/parole.json', 'reels/x/testo.txt', 'reels/x/impostazioni.json']) {
    assert.equal(spawnSync('git', ['check-ignore', '-q', file], {cwd: K}).status, 1, `${file} non deve essere ignorato`);
  }
});
await prova('B10 · render: ogni lancio lavora in una cartella sua', async () => {
  const {cartellaLavoro} = await carica('motore/render.mjs');
  assert.equal(typeof cartellaLavoro, 'function', 'manca cartellaLavoro()');
  const a = cartellaLavoro('gps');
  const b = cartellaLavoro('gps');
  assert.notEqual(a, b);
  assert.ok(a.includes(`${path.sep}.fmlab${path.sep}gps${path.sep}`));
});

// ───────────────────────── B11 · numeri e fonti ─────────────────────────

await prova('B11 · fonti: ogni numero a schermo si cerca in fonti.md, per valore e non per come è scritto', async () => {
  const {numeriNelTesto, numeriSenzaFonte} = await carica('motore/fonti.mjs');
  assert.deepEqual(numeriNelTesto('1.019 adulti, −4,0 punti, 10,8% e 2,0%; nel 2026, 20\u202f200 km'), [1019, 4, 10.8, 2, 2026, 20200]);
  assert.deepEqual(numeriNelTesto('20,200 km in English, 3.96 points'), [20200, 3.96]);
  const fonti = '| 3 | Circa mille adulti | fonte 2 | 445 + 574 = 1.019 adulti | 15/11/2026 |\n- "fino a -4,0" è -3,96 arrotondato; 10,8% contro il 2,0%.';
  assert.deepEqual(numeriSenzaFonte(['1.019', 'fino a −4,0', '445', '10,8%', 'STUDIO 2'], fonti), []);
  assert.deepEqual(numeriSenzaFonte(['964 adulti', '86% REACHED NORMAL'], fonti).map((x) => x.numero), [964, 86]);
  // i numeri che non sono dati: i passi di un elenco e gli anni dentro una data non contano
  assert.deepEqual(numeriSenzaFonte(['1', '2', '3'], fonti), []);
});

// ───────────────────────── B12 · lingue senza spazi ─────────────────────────

await rimandata('B12 · copione: una frase in giapponese viene divisa in più parole', 'fase 3', () => {
  assert.ok(copioni.leggiCopione('コーヒーはエネルギーを与えません。貸してくれるだけです。').parole.length > 2);
});

// ───────────────────────── B13 · B14 · B15 · B16 ─────────────────────────

await prova('B13 · nuovo: il modello "oggetto" imposta lo stile 3D anche da riga di comando', async () => {
  const {creaReel} = await carica('motore/nuovo.mjs');
  const {leggiImpostazioni} = await carica('motore/impostazioni.mjs');
  const slug = `zz-difetti-oggetto-${process.pid}`;
  daCancellare.add(slug);
  await creaReel(slug, 'Prova oggetto', {silenzioso: true, modello: 'oggetto'});
  assert.equal(leggiImpostazioni(slug).stile, '3d');
});
await prova('B14 · parole.json: rifare la voce o riallineare i segni non cambia l\'ordine dei campi', () => {
  const testo = '[scena:a]Uno [x]due [suono:pop]tre. [scena:b]Quattro [y]cinque.';
  const c = copioni.leggiCopione(testo);
  const dati = copioni.componiDati(c, copioni.stimaTempi(c.parole), {motore: 'stima', precisione: 'stimata'});
  const spostato = copioni.riallinea(copioni.leggiCopione(testo.replace('[x]due', 'due').replace('[suono:pop]tre', '[suono:pop][x]tre')), dati);
  assert.deepEqual(Object.keys(spostato), Object.keys(dati));
  assert.ok(Object.keys(dati).indexOf('suoni') < Object.keys(dati).indexOf('parole'));
  // i reel del kit sono già scritti così: rifare i tempi non deve sporcare git
  for (const reel of ['gps', 'reta-ginocchio']) {
    const salvato = JSON.parse(fs.readFileSync(path.join(K, 'reels', reel, 'parole.json'), 'utf8'));
    const copione = copioni.leggiCopione(fs.readFileSync(path.join(K, 'reels', reel, 'copione.md'), 'utf8'));
    const rifatto = copioni.componiDati(copione, copioni.stimaTempi(copione.parole), {motore: 'stima', precisione: 'stimata', lingua: 'it'});
    assert.equal(JSON.stringify(rifatto), JSON.stringify(salvato), `${reel}: parole.json rifatto è diverso da quello salvato`);
  }
});
await prova('B15 · narratore a sinistra non specchiato: c\'è un avviso', async () => {
  const {avvisiNarratore} = await carica('motore/impostazioni.mjs');
  assert.equal(typeof avvisiNarratore, 'function', 'manca avvisiNarratore()');
  assert.equal(avvisiNarratore({chi: 'dottore', lato: 'sinistra', specchia: false}).length, 1);
  assert.equal(avvisiNarratore({chi: 'dottore', lato: 'sinistra', specchia: true}).length, 0);
  assert.equal(avvisiNarratore({chi: 'dottore', lato: 'destra', specchia: false}).length, 0);
  assert.equal(avvisiNarratore({chi: 'nessuno', lato: 'sinistra', specchia: false}).length, 0);
});
await prova('B16 · verifica: l\'audio viene descritto per quello che contiene', async () => {
  const {fraseAudio} = await carica('motore/verifica.mjs');
  assert.equal(typeof fraseAudio, 'function', 'manca fraseAudio()');
  assert.match(fraseAudio({voce: false, effetti: 6, musica: false}), /6 effetti/);
  assert.doesNotMatch(fraseAudio({voce: false, effetti: 6, musica: false}), /silenzio/);
  assert.match(fraseAudio({voce: false, effetti: 0, musica: false}), /silenzio/);
  assert.match(fraseAudio({voce: true, effetti: 0, musica: true}), /voce.*musica/);
});

// ───────────────────────── B17 · B18 ─────────────────────────

await rimandata('B17 · package-lock.json è salvato nel repository', 'serve un computer collegato alla rete', () => {
  // conta quello salvato in git: `npm install` ne crea uno sul momento, ma senza salvarlo ogni installazione fa da sé
  assert.equal(spawnSync('git', ['ls-files', 'package-lock.json'], {cwd: K, encoding: 'utf8'}).stdout.trim(), 'package-lock.json');
});
await rimandata('B18 · nessun nome di assistente fuori dai due file di istruzioni', 'fase 4', () => {
  const nomi = ['clau' + 'de', 'cod' + 'ex', 'chat' + 'gpt', 'open' + 'ai', 'gem' + 'ini', 'copi' + 'lot'].join('\\|');
  const r = spawnSync('git', ['grep', '-il', nomi, '--', '.', ':!BRIEF_AGENTE.md', ':!BUG.md', ':!STATO.md'], {cwd: K, encoding: 'utf8'});
  assert.equal(r.stdout.trim(), '');
});

if (pannello) await pannello.server.chiudi();
cancella();
const falliti = esiti.filter((e) => !e.ok);
console.log(`\n${esiti.length - falliti.length} prove superate${falliti.length ? `, ${falliti.length} FALLITE` : ''}`);
process.exit(falliti.length ? 1 : 0);
