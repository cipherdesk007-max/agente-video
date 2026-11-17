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
await prova('B05 · fase 2 · scene pronte: quando gli elementi sono tanti la scena si adatta (scorre, raggruppa, stringe)', () => {
  const voci = (n) => Array.from({length: n}, (_, i) => ({testo: `Voce ${i + 1}.`}));
  const viste = (html) => [...new Set(html.match(/Voce \d+\./g) ?? [])];
  // fino al posto disponibile: tutte
  assert.equal(viste(disegna(blocchi.bloccoLista({voci: voci(5)}))).length, 5);
  // SCORRE: 8 voci in una scena di 10 secondi. A fine scena si vedono le ultime 5; a metà quelle comparse fin lì;
  // lungo la scena passano tutte e 8, nessuna esclusa.
  const lista = blocchi.bloccoLista({voci: voci(8)});
  assert.deepEqual(viste(disegna(lista, {t: 9.9})), ['Voce 4.', 'Voce 5.', 'Voce 6.', 'Voce 7.', 'Voce 8.']);
  const passate = new Set();
  for (let t = 0.2; t < 10; t += 0.2) for (const v of viste(disegna(lista, {t}))) passate.add(v);
  assert.equal(passate.size, 8, `lungo la scena si sono viste ${passate.size} voci su 8`);
  assert.ok(viste(disegna(lista, {t: 3})).length <= 5);
  for (const [nome, blocco] of [
    ['bloccoPassi', blocchi.bloccoPassi({passi: voci(7)})],
    ['bloccoAvviso', blocchi.bloccoAvviso({titolo: 'Attenzione', punti: voci(5)})],
    ['bloccoStudio', blocchi.bloccoStudio({rivista: 'Rivista', titolo: 'Titolo', dati: voci(5)})],
  ]) {
    const tutte = new Set();
    for (let t = 0.2; t < 10; t += 0.2) for (const v of viste(disegna(blocco, {t}))) tutte.add(v);
    assert.ok(tutte.size >= (nome === 'bloccoPassi' ? 7 : 5), `${nome}: viste ${tutte.size} voci`);
  }
  assert.doesNotThrow(() => disegna(blocchi.bloccoSchede({schede: Array.from({length: 5}, (_, i) => ({valore: `${i}`}))})));
  assert.doesNotThrow(() => disegna(blocchi.bloccoTempo({tappe: Array.from({length: 7}, (_, i) => ({quando: `${2000 + i}`}))})));
  // RAGGRUPPA: una torta di 9 fette ne mostra 5 più "Altri (4)", e il totale resta 100
  const torta = disegna(blocchi.bloccoTorta({fette: Array.from({length: 9}, (_, i) => ({etichetta: `Fetta${i + 1}`, valore: i === 0 ? 60 : 5}))}));
  assert.match(torta, /Altri \(4\)/);
  assert.equal((torta.match(/Fetta\d/g) ?? []).filter((v, i, a) => a.indexOf(v) === i).length, 5);
  assert.match(disegna(blocchi.bloccoClassifica({voci: Array.from({length: 8}, (_, i) => ({etichetta: `Voce${i}`, valore: 10 - i}))})), /Altri \(3\)/);
  // STRINGE: le barre arrivano a 12 colonne; oltre, lo dice (un grafico con 13 colonne non si legge su un telefono)
  const barre = (n) => blocchi.bloccoBarre({dati: Array.from({length: n}, (_, i) => ({etichetta: `Col${i + 1}x`, valore: i + 1}))});
  assert.equal(new Set(disegna(barre(12)).match(/Col\d+x/g)).size, 12);
  assert.throws(() => disegna(barre(13)), /bloccoBarre.*13.*12/s);
  // le scritte: fino al 40% più lunghe si rimpiccioliscono; oltre, l'errore dice quanto
  const lungo = 'Questa voce è lunga e arriva in fondo senza perdere FINALE';
  assert.match(disegna(blocchi.bloccoLista({voci: [{testo: lungo}]})), /FINALE/);
  assert.throws(() => disegna(blocchi.bloccoLista({voci: [{testo: `${lungo} ${lungo}`}]})), /bloccoLista.*caratteri/s);
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

// ───────────────────────── il mondo a livelli (fase 2) ─────────────────────────

await prova('mondo: la camera non si ferma mai, scatta a ogni cambio di scena e dà una spinta a ogni segno', async () => {
  const {mondo} = await ts('prove/sostegno/disegna.tsx');
  const inizi = [{t: 0}, {t: 10}, {t: 20, verso: 'sinistra'}];
  const segni = [3, 6.5, 14];
  const cam = (t) => mondo.cameraMondo(t, inizi, segni);
  // stesso istante, stessa camera (niente di casuale)
  assert.deepEqual(cam(7.3), cam(7.3));
  // mai ferma: in ogni decimo di secondo si sposta
  for (let t = 0; t < 25; t += 0.1) assert.ok(Math.hypot(cam(t + 0.1).x - cam(t).x, cam(t + 0.1).y - cam(t).y) > 3, `camera ferma al secondo ${t.toFixed(1)}`);
  // la spinta: zero prima del segno, piena un decimo dopo, spenta dopo un secondo
  assert.equal(cam(2.99).spinta, 0);
  assert.ok(cam(3.1).spinta > 0.95);
  assert.equal(cam(4.2).spinta, 0);
  // lo scatto al cambio di scena: in mezzo secondo la camera fa molta più strada del solito
  const passo = (t) => Math.hypot(cam(t + 0.5).x - cam(t).x, cam(t + 0.5).y - cam(t).y);
  assert.ok(passo(9.9) > passo(8) * 4, `scatto ${passo(9.9).toFixed(0)} contro viaggio ${passo(8).toFixed(0)}`);
  // una scena in cui si entra da sinistra sposta la camera verso sinistra
  assert.ok(cam(20.6).x - cam(19.8).x < 0);
});
await prova('mondo: tutti i luoghi pronti si disegnano, e ci sono quelli chiesti dall\'incarico', async () => {
  const {mondo, disegna} = await ts('prove/sostegno/disegna.tsx');
  for (const chiesto of ['corpo', 'vaso', 'membrana', 'laboratorio', 'stadio', 'palco', 'bilancia', 'studio']) assert.ok(mondo.LUOGHI.includes(chiesto), `manca il luogo ${chiesto}`);
  const {createElement} = await import('react');
  const vuoto = disegna(() => createElement(mondo.Mondo, {camera: {x: 0, y: 0, spinta: 0}, luogo: 'vuoto'})).length;
  for (const luogo of mondo.LUOGHI) {
    for (const t of [0.5, 9]) {
      const html = disegna(() => createElement(mondo.Mondo, {camera: mondo.cameraMondo(t, [{t: 0}], [1]), luogo, luogoPrima: 'vaso', passaggio: t < 1 ? 0.4 : 1, avanzamento: t / 10, raggi: 0.5}), {t});
      assert.doesNotMatch(html, /NaN|undefined/, `${luogo}: un valore non calcolato nel disegno`);
      if (luogo !== 'vuoto' && t > 1) assert.ok(html.length > vuoto + 400, `${luogo}: il disegno è vuoto`);
    }
  }
});

await prova('protagonista: resta da una scena all\'altra e cambia stato senza salti (stati, non sostituzioni)', async () => {
  const {protagonista: pr, disegna} = await ts('prove/sostegno/disegna.tsx');
  const scene = [
    {inizio: 0, stati: {x: 300, y: 1200}},
    {inizio: 10, stati: [{colore: '#FF4D5E', onda: 1.6}, {segno: 'stop', acceso: 0.1, carica: 0.3}]},
    {inizio: 20, stati: undefined}, // non dice niente: resta com'era
    {inizio: 30, stati: false}, // esce
    {inizio: 40, stati: {x: 700}}, // rientra, altrove
  ];
  const stato = (t) => pr.statoProtagonista(t, pr.STATO_BASE, scene, {stop: 14});
  assert.equal(stato(5).x, 300);
  assert.equal(stato(5).acceso, 1);
  // nella seconda scena cambia colore e si agita; la posizione resta quella di prima
  assert.equal(stato(12).x, 300);
  assert.equal(stato(12).onda, 1.6);
  assert.equal(stato(12).colore, 'rgb(255,77,94)');
  // al segno "stop" si spegne e si svuota, gradualmente
  assert.equal(stato(13.9).acceso, 1);
  assert.ok(stato(14.3).acceso < 1 && stato(14.3).acceso > 0.1);
  assert.ok(Math.abs(stato(15).acceso - 0.1) < 1e-9 && Math.abs(stato(15).carica - 0.3) < 1e-9);
  // la terza scena non dichiara niente: lo stato è quello lasciato dalla seconda
  assert.deepEqual(stato(25), stato(19));
  // esce, poi rientra spostato ma ancora spento: è lo stesso oggetto
  assert.equal(stato(35).presenza, 0);
  assert.equal(stato(45).presenza, 1);
  assert.equal(stato(45).x, 700);
  assert.ok(Math.abs(stato(45).acceso - 0.1) < 1e-9);
  // nessun salto: da un fotogramma al successivo ogni grandezza cambia poco
  for (let t = 0; t < 50; t += 1 / 30) {
    const a = stato(t);
    const b = stato(t + 1 / 30);
    assert.ok(Math.abs(b.x - a.x) < 40 && Math.abs(b.acceso - a.acceso) < 0.15 && Math.abs(b.presenza - a.presenza) < 0.15 && Math.abs(b.onda - a.onda) < 0.2, `salto al secondo ${t.toFixed(2)}`);
  }
  // i tre tipi si disegnano; fuori scena non si disegna niente
  const {createElement} = await import('react');
  for (const tipo of ['peptide', 'goccia', 'cellula']) {
    const html = disegna(() => createElement(pr.Protagonista, {def: {tipo}, stato: stato(12)}));
    assert.match(html, new RegExp(`data-fmlab-protagonista="${tipo}"`));
    assert.doesNotMatch(html, /NaN|undefined/);
  }
  assert.equal(disegna(() => createElement(pr.Protagonista, {def: {tipo: 'peptide'}, stato: stato(35)})), '');
});

// ───────────────────────── immagini generate (fase 2) ─────────────────────────

await prova('immagini: stessa richiesta, stessa impronta; senza fornitore non si genera niente e lo si dice', async () => {
  const im = await carica('motore/immagini.mjs');
  for (const f of ['nessuno', 'higgsfield', 'stability', 'comando']) assert.ok(im.FORNITORI.includes(f), `manca il fornitore ${f}`);
  const a = im.improntaImmagine({soggetto: 'Un ginocchio in sezione', stile: 'morbido', formato: '1:1'});
  assert.equal(a, im.improntaImmagine({soggetto: '  un  GINOCCHIO in sezione ', stile: 'Morbido', formato: '1:1'}));
  assert.notEqual(a, im.improntaImmagine({soggetto: 'Un ginocchio in sezione', stile: 'a matita', formato: '1:1'}));
  assert.match(im.componiPrompt({soggetto: 'Una fiala', stile: 'morbido'}), /Una fiala\. Stile: morbido\..*sfondo verde pieno/);
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-immagini-'));
  await assert.rejects(im.immagine({soggetto: 'una fiala di vetro', fornitore: 'nessuno', cartella}), /non genero niente[\s\S]*una fiala di vetro\. Stile:/);
  await assert.rejects(im.immagine({soggetto: 'una fiala di vetro', fornitore: 'inventato', cartella}), /non esiste/);
  // senza chiavi i fornitori veri si fermano prima di chiamare chiunque
  const salvate = {a: process.env.HF_API_KEY_ID, b: process.env.HF_API_KEY, c: process.env.STABILITY_API_KEY};
  delete process.env.HF_API_KEY_ID;
  delete process.env.HF_API_KEY;
  delete process.env.STABILITY_API_KEY;
  try {
    await assert.rejects(im.immagine({soggetto: 'una fiala di vetro', fornitore: 'higgsfield', cartella}), /HF_API_KEY_ID/);
    await assert.rejects(im.immagine({soggetto: 'una fiala di vetro', fornitore: 'stability', cartella}), /STABILITY_API_KEY/);
  } finally {
    if (salvate.a) process.env.HF_API_KEY_ID = salvate.a;
    if (salvate.b) process.env.HF_API_KEY = salvate.b;
    if (salvate.c) process.env.STABILITY_API_KEY = salvate.c;
  }
  fs.rmSync(cartella, {recursive: true, force: true});
});
await prova('immagini: generata una volta, la seconda esce dalla biblioteca e non costa; il fondo verde diventa trasparente', async () => {
  const {trovaFfmpeg} = await carica('motore/ffmpeg.mjs');
  try {
    await trovaFfmpeg();
  } catch {
    console.log('       (saltata: ffmpeg non trovato su questo computer)');
    return;
  }
  const im = await carica('motore/immagini.mjs');
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-immagini-'));
  const conta = path.join(cartella, 'chiamate.txt');
  Object.assign(process.env, {FMLAB_IMMAGINI_COMANDO: `node "${path.join(K, 'prove/sostegno/immagine-finta.mjs')}" {prompt} {uscita}`, FMLAB_IMMAGINI_CONTA: conta});
  const chiamate = () => (fs.existsSync(conta) ? fs.readFileSync(conta, 'utf8').trim().split('\n').length : 0);
  const prima = await im.immagine({soggetto: 'Una fiala di vetro', fornitore: 'comando', cartella});
  assert.equal(prima.daBiblioteca, false);
  assert.equal(chiamate(), 1);
  assert.ok(prima.trasparente > 0.7 && prima.trasparente < 0.95, `parte trasparente: ${prima.trasparente}`); // il quadrato è il 14% dell'immagine
  const scheda = JSON.parse(fs.readFileSync(prima.file.replace(/\.png$/, '.json'), 'utf8'));
  assert.equal(scheda.impronta, prima.impronta);
  assert.equal(scheda.soggetto, 'Una fiala di vetro');
  assert.match(scheda.prompt, /sfondo verde/);
  // seconda volta, anche scritta in un altro modo e senza fornitore: stessa immagine, nessuna chiamata
  const seconda = await im.immagine({soggetto: 'una  fiala di VETRO', fornitore: 'nessuno', cartella});
  assert.equal(seconda.daBiblioteca, true);
  assert.equal(seconda.file, prima.file);
  assert.equal(chiamate(), 1);
  // "nuova" la rifà davvero
  await im.immagine({soggetto: 'Una fiala di vetro', fornitore: 'comando', cartella, nuova: true});
  assert.equal(chiamate(), 2);
  assert.equal(im.elencoBiblioteca(cartella).length, 1);
  fs.rmSync(cartella, {recursive: true, force: true});
});

await prova('immagini: Higgsfield (richiesta, stato, scarico) e Stability (una chiamata) contro servizi finti: con quelli veri non è provato', async () => {
  const {trovaFfmpeg} = await carica('motore/ffmpeg.mjs');
  try {
    await trovaFfmpeg();
  } catch {
    console.log('       (saltata: ffmpeg non trovato su questo computer)');
    return;
  }
  const http = await import('node:http');
  const im = await carica('motore/immagini.mjs');
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-immagini-'));
  const png = path.join(cartella, 'finta.png');
  spawnSync(process.execPath, [path.join(K, 'prove/sostegno/immagine-finta.mjs'), 'x', png]);
  const viste = [];
  let giri = 0;
  const server = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (d) => (corpo += d));
    req.on('end', () => {
      viste.push({metodo: req.method, url: req.url, chi: req.headers.authorization, corpo});
      const base = `http://127.0.0.1:${server.address().port}`;
      const json = (dati) => res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(dati));
      if (req.url === '/higgsfield-ai/soul/standard') return json({status: 'queued', request_id: 'abc', status_url: `${base}/requests/abc/status`});
      if (req.url === '/requests/abc/status') return json(++giri < 2 ? {status: 'in_progress'} : {status: 'completed', images: [{url: `${base}/pronta.png`}]});
      if (req.url === '/pronta.png' || req.url === '/v2beta/stable-image/generate/core') return res.writeHead(200, {'Content-Type': 'image/png'}).end(fs.readFileSync(png));
      res.writeHead(404).end();
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, {FMLAB_HIGGSFIELD_URL: base, FMLAB_STABILITY_URL: base, HF_API_KEY_ID: 'chiave', HF_API_KEY_SECRET: 'segreto', STABILITY_API_KEY: 'chiave-s', FMLAB_IMMAGINI_ATTESA: '5'});
  try {
    const h = await im.immagine({soggetto: 'Un recettore sulla membrana', fornitore: 'higgsfield', cartella});
    assert.equal(h.daBiblioteca, false);
    assert.ok(h.trasparente > 0.7);
    const invio = viste.find((v) => v.metodo === 'POST');
    assert.equal(invio.chi, 'Key chiave:segreto');
    assert.match(JSON.parse(invio.corpo).prompt, /Un recettore sulla membrana/);
    assert.equal(viste.filter((v) => v.url === '/requests/abc/status').length, 2);
    const st = await im.immagine({soggetto: 'Una bilancia a due piatti', fornitore: 'stability', cartella});
    assert.equal(st.daBiblioteca, false);
    assert.equal(viste.at(-1).chi, 'Bearer chiave-s');
    assert.match(viste.at(-1).corpo, /Una bilancia a due piatti/);
    assert.equal(im.elencoBiblioteca(cartella).length, 2);
  } finally {
    server.close();
    for (const k of ['FMLAB_HIGGSFIELD_URL', 'FMLAB_STABILITY_URL', 'HF_API_KEY_ID', 'HF_API_KEY_SECRET', 'STABILITY_API_KEY', 'FMLAB_IMMAGINI_ATTESA']) delete process.env[k];
    fs.rmSync(cartella, {recursive: true, force: true});
  }
});

// ───────────────────────── il metro (fase 1) ─────────────────────────

await prova('metro: le soglie si ricavano dai riferimenti con il margine scritto nel file, e stanno nel file', async () => {
  const {calcolaSoglie, giudica, tabella, VOCI, FILE_MISURE} = await carica('motore/confronta.mjs');
  const rif = (novita, occupato, lufs) => ({formato: {larghezza: 576, altezza: 1024, fps: 30, durata: 50}, tagli: {quanti: 0}, novita: {intervalloMediano: novita}, palco: {occupato}, colori: {tinte: []}, sottotitoli: {presenti: false}, narratore: {presente: false}, audio: {presente: true, muto: false, lufs}});
  const soglie = calcolaSoglie([rif(1.5, 0.4, -14), rif(2, 0.6, -15)], 0.1);
  assert.deepEqual(soglie['tagli.quanti'], {max: 0});
  assert.deepEqual(soglie['novita.intervalloMediano'], {max: 2.2});
  assert.deepEqual(soglie['palco.occupato'], {min: 0.36});
  assert.deepEqual(soglie['audio.lufs'], {min: -16.5, max: -12.6});
  const righe = giudica(rif(2.5, 0.5, -14.5), soglie);
  const esito = (chiave) => righe.find((r) => r.chiave === chiave).esito;
  assert.equal(esito('novita.intervalloMediano'), 'NO');
  assert.equal(esito('palco.occupato'), 'ok');
  assert.equal(esito('audio.lufs'), 'ok');
  assert.equal(esito('narratore.poseDiverse'), '—'); // non misurabile: non c'è il narratore
  assert.match(tabella('prova.mp4', rif(2.5, 0.5, -14.5), soglie), /3 misure dentro le soglie, 1 fuori/);
  assert.equal(new Set(VOCI.map((v) => v[0])).size, VOCI.length);
  // il file delle soglie del kit: se c'è, le soglie sono proprio quelle che escono dalle misure salvate
  if (fs.existsSync(FILE_MISURE)) {
    const salvato = JSON.parse(fs.readFileSync(FILE_MISURE, 'utf8'));
    assert.ok(Object.keys(salvato.riferimenti).length >= 3, 'servono almeno tre riferimenti');
    assert.deepEqual(salvato.soglie, calcolaSoglie(Object.values(salvato.riferimenti), salvato.margine), 'le soglie di misure.json non corrispondono alle misure: rifalle con  npm run confronta riferimenti');
    assert.equal(salvato.soglie['tagli.quanti'].max, 0);
  }
});

// ───────────────────────── fase 3 · il piano di regia ─────────────────────────

const TESTO_RETA = fs.readFileSync(path.join(K, 'prove/sostegno/testo-reta.txt'), 'utf8');
const PIANO_RETA = () => JSON.parse(fs.readFileSync(path.join(K, 'prove/sostegno/piano-reta.json'), 'utf8'));

await prova('testo dato: il **grassetto** incollato diventa enfasi, le parole restano quelle', async () => {
  const {testoDaDire, copioneDaTesto, leggiCopione, confrontaTesto} = await carica('motore/copione.mjs');
  const dato = 'Commenta **"MAPPA"** per ricevere * gratis **due cose** insieme.';
  assert.equal(testoDaDire(dato), 'Commenta "MAPPA" per ricevere * gratis due cose insieme.');
  assert.deepEqual([...testoDaDire(dato, {conEnfasi: true}).enfasi], [1, 6, 7]);
  const c = leggiCopione(copioneDaTesto(dato));
  assert.equal(confrontaTesto(testoDaDire(dato), c.testoParlato), null);
  assert.deepEqual(c.parole.filter((p) => p.enfasi).map((p) => p.testo), ['"MAPPA"', 'due', 'cose']);
});

await prova('piano: il copione montato dice il testo dato parola per parola, con scene, segni, enfasi e suoni al loro posto', async () => {
  const {controllaPiano, montaCopione} = await carica('motore/piano.mjs');
  const {leggiCopione, confrontaTesto, testoDaDire} = await carica('motore/copione.mjs');
  const piano = PIANO_RETA();
  const esito = controllaPiano(piano, TESTO_RETA, {fonti: fs.readFileSync(path.join(K, 'reels/reta-ginocchio/fonti.md'), 'utf8')});
  assert.deepEqual(esito.errori, []);
  assert.deepEqual(esito.avvisi, [], 'il piano di esempio non deve avere consigli aperti');
  assert.equal(esito.rischio.livello, 'basso');
  const testo = montaCopione(piano, esito);
  const c = leggiCopione(testo);
  assert.equal(confrontaTesto(testoDaDire(TESTO_RETA), c.testoParlato), null);
  assert.deepEqual(c.scene.map((s) => s.nome), piano.scene.map((s) => s.nome));
  assert.equal(Object.keys(c.segni).length, piano.scene.reduce((n, s) => n + Object.keys(s.segni ?? {}).length, 0));
  assert.match(testo, /dell'\[azienda\]azienda/, 'un segno su "azienda" va dentro "dell\'azienda"');
  assert.match(testo, /\[suono:whoosh\]\[commenta\]Commenta \*"MAPPA\*"/);
  assert.equal(c.suoni.length, 6);
  // "dieci" compare due volte nella scena: il segno cade sulla seconda
  assert.equal(c.parole[c.segni.dieci].testo, 'dieci');
  assert.ok(c.parole.slice(0, c.segni.dieci).some((p) => p.testo === 'dieci,'));
});

await prova('piano: ogni errore dice in che scena, in che campo e cosa fare; con un errore non si scrive niente', async () => {
  const {controllaPiano} = await carica('motore/piano.mjs');
  const rotto = (cambia) => {
    const piano = PIANO_RETA();
    cambia(piano);
    return controllaPiano(piano, TESTO_RETA).errori.join('\n');
  };
  assert.match(rotto((p) => (p.scene[1].blocco = 'ologramma')), /Scena 2 "domanda": il blocco "ologramma" non esiste\. Blocchi: titolo, domanda/);
  assert.match(rotto((p) => (p.scene[2].segni.mille = 'duemila')), /Scena 3 "studi" · segno "mille": "duemila" non è in questa scena/);
  assert.match(rotto((p) => (p.scene[2].segni.mille = 'placebo')), /nel testo c'è, ma in un'altra scena/);
  assert.match(rotto((p) => (p.scene[4].dati.sinistra.segno = 'boh')), /il segno "boh" non è tra i segni di questa scena \(quattro, anche, duepunti\)/);
  assert.match(rotto((p) => (p.scene[4].dati.sinistra.valore = '3,96')), /sinistra · valore: serve un numero/);
  assert.match(rotto((p) => (p.scene[3].da = 'Il dolore era valutato')), /non trovo "Il dolore era valutato" nel testo/);
  assert.match(rotto((p) => (p.scene[5].dati.voci[0].icona = 'FaCosaCheNonCe')), /l'icona "FaCosaCheNonCe" non esiste/);
  assert.match(rotto((p) => (p.scene[0].camera = 'drone')), /"camera" \(come si muove durante la scena\) può essere ferma, spinta/);
  assert.match(rotto((p) => (p.scene[0].dati.cambia[0].parametri.colore = 3)), /"ginocchio" non ha il parametro "colore"/);
  assert.match(rotto((p) => (p.scene[11].dati.regalo = 'ricettario')), /il regalo "ricettario" non esiste\. Ci sono: mappa/);
  assert.match(rotto((p) => (p.scene[6].segni.quattro = 'capire')), /il segno "quattro" c'è già nella scena "risultati"/);
});

await prova('piano: le scene scritte dal piano si disegnano senza che nessuno scriva codice (oggetto 3D che cambia stato, icone, regalo)', async () => {
  const {controllaPiano, scriviScene} = await carica('motore/piano.mjs');
  const piano = PIANO_RETA();
  const sorgente = scriviScene(piano, controllaPiano(piano, TESTO_RETA));
  assert.match(sorgente, /ginocchio3d\(\{dolore: mix\(1, 0\.3, rampa\(s\.dopo\("meno"\), 1\.2\)\)/);
  assert.match(sorgente, /import \{FaFaceSmile, FaGuitar, FaHeartPulse, FaUsers\} from 'react-icons\/fa6';/);
  assert.match(sorgente, /campo: "stretto",\n\s+camera: "indietro"/);
  const dir = path.join(K, 'prove', `tmp-piano-${process.pid}`);
  fs.mkdirSync(dir, {recursive: true});
  try {
    fs.writeFileSync(path.join(dir, 'scene.tsx'), sorgente);
    fs.writeFileSync(path.join(dir, 'prova.tsx'), "export {default as reel} from './scene';\nexport {disegna} from '../sostegno/disegna';\n");
    const {reel, disegna} = await ts(path.relative(K, path.join(dir, 'prova.tsx')));
    assert.deepEqual(Object.keys(reel.scene), piano.scene.map((s) => s.nome));
    const html = Object.fromEntries(Object.entries(reel.scene).map(([nome, def]) => [nome, disegna(def.componente ?? def)]));
    assert.match(html.risultati, /3,96/);
    assert.match(html.studi, /1\.019 adulti/);
    assert.match(html.chiusura, /Commenta MAPPA/);
    assert.match(html.chiusura, /stile\/ebook\.jpg/);
    assert.match(html.applauso, /Il pubblico applaude/);
    assert.match(html.misura, /Non è un caso/);
    assert.equal(reel.scene.rischi.dottore.posa, 'conserte');
    assert.equal(reel.scene.chiusura.protagonista, false);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

const TESTI_DI_PROVA = {
  salute: 'Dormire poco fa ingrassare? Uno studio su mille adulti dice di sì.\n\nChi dormiva meno di sei ore mangiava di più il giorno dopo. Non è magia: cambia la fame, e con la fame cambiano le scelte a tavola.\n\nCommenta SONNO per ricevere la guida.',
  tecnologia: 'Il GPS non sa dove sei. I satelliti mandano solo l\'ora esatta, e nient\'altro.\n\nÈ il tuo telefono a fare il conto: ascolta quattro satelliti e misura i ritardi. Un errore di un milionesimo di secondo sposta la posizione di trecento metri.',
  economia: 'Perché i prezzi salgono? Quando tutti vogliono comprare e la merce è poca, chi vende alza il prezzo.\n\nSe costa di più anche l\'energia, sale tutto il resto. In un anno il carrello può costare il 10% in più.\n\nMa attenzione: i rischi non sono uguali per tutti.',
};

await prova('regista di serie: da tre testi lontani (salute, tecnologia, economia) esce un piano valido, senza pause lunghe, con il testo intatto', async () => {
  const {regia} = await carica('motore/regista.mjs');
  const {controllaPiano, montaCopione, PAUSA_MASSIMA} = await carica('motore/piano.mjs');
  const {leggiCopione, confrontaTesto, testoDaDire} = await carica('motore/copione.mjs');
  for (const [nome, testo] of [...Object.entries(TESTI_DI_PROVA), ['reta', TESTO_RETA]]) {
    const {piano} = regia(testo, {titolo: nome});
    const esito = controllaPiano(piano, testo);
    assert.deepEqual(esito.errori, [], `${nome}: il piano di serie deve passare il controllo`);
    assert.deepEqual(esito.avvisi.filter((a) => a.includes('senza niente di nuovo')), [], `${nome}: nessuna pausa oltre ${PAUSA_MASSIMA} secondi`);
    assert.notEqual(esito.rischio.livello, 'alto', `${nome}: rischio cartelli ${esito.rischio.punti}`);
    assert.equal(confrontaTesto(testoDaDire(testo), leggiCopione(montaCopione(piano, esito)).testoParlato), null, `${nome}: il testo non si tocca`);
    assert.ok(piano.scene.every((s) => s.camera && s.camera !== 'ferma' && s.campo && s.luogo), `${nome}: ogni scena ha luogo, inquadratura e movimento`);
    assert.ok(piano.scene.every((s, i) => i === 0 || s.luogo !== piano.scene[i - 1].luogo), `${nome}: mai lo stesso luogo due scene di fila`);
  }
  // l'invito finale: con il regalo di quella parola si vede il regalo, altrimenti il cartello con la parola
  assert.equal(regia(TESTO_RETA).piano.scene.at(-1).blocco, 'ebook');
  assert.equal(regia(TESTO_RETA, {regalo: 'nessuno'}).piano.scene.at(-1).blocco, 'chiusura');
  const sonno = regia(TESTI_DI_PROVA.salute).piano.scene.at(-1);
  assert.deepEqual([sonno.blocco, sonno.dati.parola], ['chiusura', 'SONNO']);
  // i numeri messi a schermo dal testo vengono dichiarati, per fonti.md
  assert.deepEqual(regia(TESTO_RETA).numeri.map((n) => n.numero), [1000]);
});

await prova('rischio cartelli: una fila di scritte con la camera ferma non arriva al render', async () => {
  const {controllaPiano} = await carica('motore/piano.mjs');
  const piano = PIANO_RETA();
  for (const s of piano.scene) {
    const primo = Object.keys(s.segni)[0];
    Object.assign(s, {blocco: 'titolo', dati: {titolo: 'Una scritta', segno: primo}, camera: 'ferma', campo: 'medio', perche: undefined, protagonista: undefined});
  }
  const esito = controllaPiano(JSON.parse(JSON.stringify(piano)), TESTO_RETA);
  assert.deepEqual(esito.errori, []);
  assert.equal(esito.rischio.livello, 'alto');
  assert.ok(esito.rischio.punti >= 80, `punti ${esito.rischio.punti}`);
  assert.ok(esito.rischio.voci.some((v) => v.nome === 'camera ferma') && esito.rischio.voci.some((v) => v.nome === 'scene di sole scritte'));
});

if (pannello) await pannello.server.chiudi();
cancella();
const falliti = esiti.filter((e) => !e.ok);
console.log(`\n${esiti.length - falliti.length} prove superate${falliti.length ? `, ${falliti.length} FALLITE` : ''}`);
process.exit(falliti.length ? 1 : 0);
