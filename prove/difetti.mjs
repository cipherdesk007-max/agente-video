// FMLAB Reel Kit — una prova per ogni difetto trovato e corretto (B01, B02…). Veloci, senza browser.
//   npm test
// Ogni prova porta il numero del difetto. Una prova "rimandata" è un difetto ancora aperto: oggi deve fallire,
// e se un giorno passa lo dice, così la prova diventa normale.
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
  console.log('  NO', nome, `\n       adesso passa: il difetto è chiuso, togli "rimandata"`);
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

await prova('B12 · lingue senza spazi: il giapponese si divide in parole, i sottotitoli le riattaccano, il piano e il regista ci lavorano', async () => {
  const testo = 'コーヒーはエネルギーを与えません。貸してくれるだけです。\n\n朝の一杯は気分を上げます。でも夜は眠れなくなります。';
  const c = copioni.leggiCopione(copioni.copioneDaTesto(testo, {lingua: 'ja'}));
  assert.ok(c.parole.length >= 12, `solo ${c.parole.length} parole`);
  assert.equal(copioni.confrontaTesto(testo, c.testoParlato), null, 'nessun carattere perso');
  // dentro una frase le parole sono "unite" (niente spazio nei sottotitoli); la prima dopo un a capo no
  assert.equal(c.parole[0].unita, undefined);
  assert.equal(c.parole[1].unita, true);
  assert.ok(c.parole.every((p) => !/\s/.test(p.testo)));
  // la stima non è più "una parola sola, due secondi": conta le sillabe dei segni
  assert.ok(copioni.sillabe('エネルギー') >= 4);
  const tempi = copioni.stimaTempi(c.parole);
  assert.ok(tempi[tempi.length - 1].fine > 5, `quattro frasi in giapponese durano più di cinque secondi (stimati ${tempi[tempi.length - 1].fine})`);
  // un segno in mezzo a un testo senza spazi cade sulla parola giusta e non spezza i sottotitoli
  const conSegno = copioni.leggiCopione('[scena:a]\n今日はいい[x]天気です。');
  assert.equal(conSegno.parole[conSegno.segni.x].testo, '天気');
  assert.equal(conSegno.parole[conSegno.segni.x].unita, true);
  // il regista di serie e il montaggio: piano valido, testo intatto, parole riattaccate nel copione
  const {regia} = await carica('motore/regista.mjs');
  const {controllaPiano, montaCopione} = await carica('motore/piano.mjs');
  const {piano} = regia(testo, {titolo: 'コーヒー'});
  const esito = controllaPiano(piano, testo);
  assert.deepEqual(esito.errori, []);
  const montato = montaCopione(piano, esito, {lingua: 'ja'});
  assert.equal(copioni.confrontaTesto(testo, copioni.leggiCopione(montato).testoParlato), null);
  assert.doesNotMatch(montato.split('\n').filter((r) => !r.startsWith('#') && !r.startsWith('>') && !r.startsWith('<')).join('\n'), /[ぁ-んァ-ヶ一-龠] [ぁ-んァ-ヶ一-龠]/u, 'nel copione le parole giapponesi restano attaccate');
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

await prova('B17 · package-lock.json: se è salvato nel repository è uno vero, non la fotografia del computer che lo ha fatto', () => {
  // Va creato su un computer con la rete (`npm install --package-lock-only`) e poi salvato. Fatto dove node_modules è
  // un collegamento a un'altra cartella, esce pieno di "link": true e di percorsi di quel computer: altrove
  // `npm install` non installa più niente. È successo: questa prova c'è perché non succeda di nuovo.
  if (spawnSync('git', ['ls-files', 'package-lock.json'], {cwd: K, encoding: 'utf8'}).stdout.trim() !== 'package-lock.json') return;
  const lock = JSON.parse(fs.readFileSync(path.join(K, 'package-lock.json'), 'utf8'));
  const voci = Object.entries(lock.packages ?? {});
  assert.deepEqual(voci.filter(([dove, v]) => v.link || dove.startsWith('..')).map(([dove]) => dove).slice(0, 5), []);
  for (const nome of Object.keys(JSON.parse(fs.readFileSync(path.join(K, 'package.json'), 'utf8')).dependencies)) {
    assert.match(lock.packages[`node_modules/${nome}`]?.resolved ?? '', /^https:\/\/registry\.npmjs\.org\//, `${nome} non viene dal registro pubblico`);
  }
});
await prova('B18 · nessun nome di assistente nei file del kit (resta solo il nome del file di istruzioni che un agente pretende)', () => {
  const nomi = new RegExp(['clau' + 'de', 'cod' + 'ex', 'chat' + 'gpt', 'open' + 'ai', 'gem' + 'ini', 'copi' + 'lot'].join('|'), 'i');
  const file = spawnSync('git', ['ls-files'], {cwd: K, encoding: 'utf8'}).stdout.split('\n').filter((f) => f && !/\.(jpg|png|mp3|wav|woff2?|ttf)$/i.test(f));
  const trovati = file.filter((f) => nomi.test(fs.readFileSync(path.join(K, f), 'utf8').replace(/CLAU[D]E\.md/g, '')));
  assert.deepEqual(trovati, []);
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
  // soggetti verdi: il fondo da togliere diventa magenta, e l'impronta cambia (non si confonde con quella su verde)
  assert.match(im.componiPrompt({soggetto: 'Una fiala', stile: 'morbido', fondo: 'magenta'}), /sfondo magenta pieno uniforme \(#FF00FF\).*niente magenta nel soggetto/);
  assert.notEqual(im.improntaImmagine({soggetto: 'a', stile: 'b', formato: '1:1'}), im.improntaImmagine({soggetto: 'a', stile: 'b', formato: '1:1', fondo: 'magenta'}));
  assert.equal(im.improntaImmagine({soggetto: 'a', stile: 'b', formato: '1:1'}), im.improntaImmagine({soggetto: 'a', stile: 'b', formato: '1:1', fondo: 'verde'}));
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
  assert.match(scheda.prompt, /sfondo (verde|magenta) pieno/);
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
  // il servizio finto disegna sul fondo che il foglio di stile del kit chiede (verde o magenta)
  spawnSync(process.execPath, [path.join(K, 'prove/sostegno/immagine-finta.mjs'), im.componiPrompt({soggetto: 'x', stile: 'x', fondo: im.foglioDiStile().fondo}), png]);
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
// lo stesso testo con un piano fatto di blocchi diversi (confronto, oggetto 3D, icone, studio, barre): serve a provarli tutti
const PIANO_BLOCCHI = () => JSON.parse(fs.readFileSync(path.join(K, 'prove/sostegno/piano-blocchi.json'), 'utf8'));

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
    const piano = PIANO_BLOCCHI();
    cambia(piano);
    return controllaPiano(piano, TESTO_RETA).errori.join('\n');
  };
  assert.match(rotto((p) => (p.scene[1].blocco = 'ologramma')), /Scena 2 "domanda": il blocco "ologramma" non esiste\. Blocchi: titolo, domanda/);
  assert.match(rotto((p) => (p.scene[2].segni.mille = 'duemila')), /Scena 3 "studi" · segno "mille": "duemila" non è in questa scena/);
  assert.match(rotto((p) => (p.scene[2].segni.mille = 'placebo')), /nel testo c'è, ma in un'altra scena/);
  assert.match(rotto((p) => (p.scene[4].dati.sinistra.segno = 'boh')), /il segno "boh" non è tra i segni di questa scena \(quattro, anche, duepunti, attivo\)/);
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
  const piano = PIANO_BLOCCHI();
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

const TESTI_DI_PROVA = Object.fromEntries(['salute', 'tecnologia', 'economia'].map((n) => [n, fs.readFileSync(path.join(K, 'prove/sostegno/testi', `${n}.txt`), 'utf8')]));

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
  // il regista di serie non mette cifre a schermo: una cifra è un dato e vuole la sua fonte, che lui non ha
  const {numeriNelTesto} = await carica('motore/fonti.mjs');
  for (const testo of [...Object.values(TESTI_DI_PROVA), TESTO_RETA]) assert.deepEqual(numeriNelTesto(controllaPiano(regia(testo).piano, testo).scritte.join(' ')).filter((n) => !testo.includes(String(n))), []);
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

await prova('soggetti: grandi, vivi, con uno stato che cambia su una parola; il piano li controlla e li scrive', async () => {
  const {bloccoSoggetti, statoSoggetto, SOGGETTI, disegna} = await ts('prove/sostegno/soggetti.tsx');
  const {controllaPiano, scriviScene, SOGGETTI: nelPiano} = await carica('motore/piano.mjs');
  // il piano conosce gli stessi soggetti e gli stessi numeri della libreria
  assert.deepEqual(Object.fromEntries(Object.entries(SOGGETTI).map(([k, v]) => [k, Object.keys(v.stato)])), nelPiano);
  // lo stato va dal numero di partenza a quello nuovo, sul suo segno
  const ginocchio = {tipo: 'ginocchio', stato: {dolore: 1}, cambia: [{segno: 'meno', stato: {dolore: 0.2}, durata: 1}]};
  assert.equal(statoSoggetto(ginocchio, () => -1).dolore, 1);
  assert.ok(Math.abs(statoSoggetto(ginocchio, () => 5).dolore - 0.2) < 1e-9);
  const meta = statoSoggetto(ginocchio, () => 0.5).dolore;
  assert.ok(meta < 1 && meta > 0.2, 'a metà del cambio il numero è a metà strada');
  // sul palco: un soggetto solo è largo almeno 700 pixel, due almeno 500; due istanti diversi non sono mai uguali
  const scena = bloccoSoggetti({soggetti: [{tipo: 'quadrante', etichetta: 'Dolore', stato: {valore: 6}}]});
  const html = disegna(scena, {t: 2});
  assert.match(html, /width:800px/);
  assert.match(html, />Dolore</);
  assert.notEqual(html, disegna(scena, {t: 2.2}), 'il soggetto si è fermato');
  assert.match(disegna(bloccoSoggetti({soggetti: [{tipo: 'batteria'}, {tipo: 'stomaco'}]}), {t: 2}), /width:520px/);
  assert.throws(() => bloccoSoggetti({soggetti: [1, 2, 3, 4].map(() => ({tipo: 'scale'}))}), /da 1 a 3/);
  // il piano: errori chiari, e le scene scritte usano il blocco
  const piano = PIANO_RETA();
  const esito = controllaPiano(piano, TESTO_RETA);
  assert.deepEqual(esito.errori, []);
  assert.match(scriviScene(piano, esito), /bloccoSoggetti\(\{\n\s+soggetti: \[/);
  piano.scene[0].dati.soggetti[0].stato = {febbre: 1};
  assert.match(controllaPiano(piano, TESTO_RETA).errori.join('\n'), /"ginocchio" non ha "febbre"\. Il suo stato: dolore/);
});

await prova('formati: verticale, quadrato e orizzontale si scelgono per reel; la tela resta 1080×1920 e se ne vede una finestra', async () => {
  const {sistema} = await carica('motore/impostazioni.mjs');
  const {formatoDi, FORMATI} = await carica('motore/percorsi.mjs');
  assert.equal(sistema({}, {}).formato, '9:16');
  assert.equal(sistema({formato: '1:1'}, {}).formato, '1:1');
  assert.deepEqual(formatoDi({}), {larghezza: 1080, altezza: 1920});
  assert.deepEqual(formatoDi({formato: '1:1'}), {larghezza: 1080, altezza: 1080});
  assert.deepEqual(formatoDi({formato: '16:9'}), {larghezza: 1920, altezza: 1080});
  assert.throws(() => sistema({formato: '4:3'}, {}), /"formato" può essere 9:16 \(verticale\), 1:1 \(quadrato\) o 16:9/);
  // la pagina usa le stesse misure del motore, e in ogni formato la finestra contiene sottotitoli e palco
  const web = await ts('prove/sostegno/formati.tsx');
  const {stile} = web;
  for (const [nome, f] of Object.entries(web.FORMATI)) {
    assert.deepEqual({larghezza: f.larghezza, altezza: f.altezza}, FORMATI[nome], nome);
    const alto = -f.tela.y;
    const basso = alto + f.altezza;
    assert.ok(alto <= stile.sottotitoli.y - 60 && basso >= stile.palco.basso, `${nome}: nella finestra devono entrare i sottotitoli (y ${stile.sottotitoli.y}) e il palco (fino a ${stile.palco.basso})`);
    assert.ok(f.tela.x >= 0 && f.tela.x + 1080 <= f.larghezza, `${nome}: la tela deve stare dentro il video in larghezza`);
  }
});

await prova('B19 · una parola più larga della riga dei sottotitoli si rimpicciolisce finché entra; le parole normali restano a 60', async () => {
  const {corpoSottotitoli} = await ts('prove/sostegno/sottotitoli.tsx');
  assert.equal(corpoSottotitoli([{testo: 'Il'}, {testo: 'placebo,'}], 60, 920), 60);
  assert.equal(corpoSottotitoli([{testo: 'gastrointestinali.'}], 60, 920), 60);
  const lunga = 'Rindfleischetikettierungsüberwachungsaufgabenübertragung'; // 56 lettere
  const corpo = corpoSottotitoli([{testo: lunga}], 60, 920);
  assert.ok(corpo < 60 && corpo >= 24, `corpo ${corpo}`);
  assert.ok(lunga.length * 0.58 * corpo <= 920, 'la parola deve stare nella riga');
});

await prova('B20 · un segno che apre, scritto da solo, va con la parola dopo; quello che chiude e il trattino con la parola prima', async () => {
  const {leggiCopione, confrontaTesto} = await carica('motore/copione.mjs');
  const {paroleDelTesto} = await carica('motore/piano.mjs');
  const testo = 'Il caffè — quello vero — costa. Disse « bene » e ( forse ) basta.';
  const attese = ['Il', 'caffè—', 'quello', 'vero—', 'costa.', 'Disse', '«bene»', 'e', '(forse)', 'basta.'];
  const c = leggiCopione(`[scena:a]\n${testo}`);
  assert.deepEqual(c.parole.map((p) => p.testo), attese);
  assert.equal(confrontaTesto(testo, c.testoParlato), null);
  // nessuna parola ha uno spazio dentro: i tempi della voce contano le parole dagli spazi
  assert.ok(c.parole.every((p) => !/\s/.test(p.testo)));
  // il piano divide il testo dato nello stesso numero di parole
  assert.equal(paroleDelTesto(testo).length, attese.length);
});

// ───────────────────────── il giudice è l'occhio: il foglio affiancato ─────────────────────────

await prova('affianca: stessi momenti = stessa frazione della durata; senza il video di riferimento lo dice e dice dove metterlo', async () => {
  const {momenti, trovaRiferimento, paginaAffianca} = await carica('motore/affianca.mjs');
  assert.deepEqual(momenti(120, 12).map((t) => Math.round(t)), [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 115]);
  assert.deepEqual(momenti(60, 12).map((t) => t * 2), momenti(120, 12));
  assert.throws(() => trovaRiferimento('rif-che-non-esiste'), /Non trovo il video di riferimento "rif-che-non-esiste"/);
  const html = paginaAffianca({titolo: 'T', sotto: 'S', coppie: [{kit: 'data:a', rif: 'data:b', tKit: 4.72, tRif: 2.3}]});
  assert.match(html, /KIT 4,7 s/);
  assert.match(html, /RIF 2,3 s/);
  assert.ok(html.indexOf('data:a') < html.indexOf('data:b'), 'il kit sta a sinistra');
});

await prova('prova cieca: stesso seme stessa prova, spezzoni che non si toccano, soluzione non in chiaro nella pagina', async () => {
  const {caso, scegliSpezzoni, paginaProvaCieca, SPEZZONE, RITAGLIO} = await carica('motore/provacieca.mjs');
  const video = [{nome: 'a', durata: 55}, {nome: 'b', durata: 52}, {nome: 'corto', durata: 8}];
  const uno = scegliSpezzoni(video, 5, caso(1));
  assert.deepEqual(uno, scegliSpezzoni(video, 5, caso(1)));
  assert.notDeepEqual(uno, scegliSpezzoni(video, 5, caso(2)));
  assert.equal(uno.length, 5);
  assert.ok(uno.every((s) => s.nome !== 'corto' && s.da >= 2.5 && s.da + SPEZZONE <= 55 - 2.4));
  for (const x of uno) for (const y of uno) if (x !== y && x.nome === y.nome) assert.ok(Math.abs(x.da - y.da) >= SPEZZONE + 1, 'due spezzoni dello stesso video si toccano');
  // il ritaglio lascia fuori la fascia dei sottotitoli (fino al 22,5%) e il narratore (dal 70%)
  assert.ok(RITAGLIO.y0 > 0.225 && RITAGLIO.y1 < 0.7);
  const html = paginaProvaCieca([{kit: true, src: 'data:k'}, {kit: false, src: 'data:r'}]);
  assert.doesNotMatch(html.replace(/<button[^>]*>[^<]*<\/button>/g, '').replace(/<p>.*?<\/p>/s, ''), /"kr"|KIT|RIFERIMENTO/);
  assert.match(html, /atob\("a3I="\)/);
  assert.match(html, /persone\.every\(\(n\) => n <= 6\)/);
});

await prova('B24 · regista di serie: mai più di 4 secondi senza un segno (anche con una voce lenta), scene corte come nei riferimenti, mai quattro uguali di fila', async () => {
  const {regia, SCENA_LUNGA, SEGNO_MASSIMO} = await carica('motore/regista.mjs');
  const {controllaPiano, paroleDelTesto} = await carica('motore/piano.mjs');
  const {stimaTempi} = await carica('motore/copione.mjs');
  assert.ok(SEGNO_MASSIMO <= 3 && SCENA_LUNGA <= 7);
  const testi = {...TESTI_DI_PROVA, reta: TESTO_RETA};
  for (const [nome, testo] of Object.entries(testi)) {
    const {piano} = regia(testo, {titolo: nome});
    const parole = paroleDelTesto(testo);
    // una voce più lenta della stima di un quarto: la promessa dei 4 secondi deve reggere lo stesso
    for (const ritmo of [1, 0.8]) {
      const tempi = stimaTempi(parole, {ritmo});
      const quando = (i) => (i >= tempi.length ? tempi[tempi.length - 1].fine : tempi[i].inizio);
      const esito = controllaPiano(piano, testo, {tempi: quando});
      assert.deepEqual(esito.errori, [], `${nome}: il piano di serie deve passare il controllo`);
      for (const s of esito.scene) {
        const novita = [s.inizio, ...s.segni.filter((x) => s.usati.has(x.nome)).map((x) => x.indice), s.fine].sort((a, b) => a - b);
        for (let k = 0; k < novita.length - 1; k++) {
          const buco = quando(novita[k + 1]) - quando(novita[k]);
          assert.ok(buco <= 4, `${nome} (voce ${ritmo}), ${s.dove}: ${buco.toFixed(1)} secondi senza un segno da "${parole.slice(novita[k], novita[k] + 3).map((p) => p.testo).join(' ')}…"`);
        }
      }
      if (ritmo !== 1) continue;
      const durate = esito.scene.map((s) => quando(s.fine) - quando(s.inizio));
      const media = durate.reduce((a, b) => a + b, 0) / durate.length;
      assert.ok(media <= 6, `${nome}: le scene durano in media ${media.toFixed(1)} secondi (nei riferimenti quattro-cinque)`);
      // una scena più lunga di SCENA_LUNGA resta solo se è una frase sola senza virgole né punti dove spezzarla
      esito.scene.forEach((s, i) => {
        if (durate[i] <= SCENA_LUNGA || piano.scene[i].blocco === 'ebook' || piano.scene[i].blocco === 'chiusura') return;
        const dentro = parole.slice(s.inizio, s.fine - 1);
        const tagli = dentro.map((p, k) => ({k: k + 1, qui: /[.!?…,;:]["”»)]*$/.test(p.testo)})).filter((x) => x.qui && x.k >= 5 && dentro.length + 1 - x.k >= 5);
        assert.ok(tagli.every((x) => quando(s.inizio + x.k) - quando(s.inizio) < 2 || quando(s.fine) - quando(s.inizio + x.k) < 2), `${nome}, ${s.dove}: dura ${durate[i].toFixed(1)} s e si poteva spezzare`);
      });
      assert.deepEqual(esito.avvisi.filter((a) => /di fila/.test(a)), [], `${nome}: mai quattro scene dello stesso tipo di fila`);
      assert.ok(new Set(piano.scene.map((s) => s.blocco)).size >= (piano.scene.length >= 6 ? 3 : 2), `${nome}: i pezzi pronti si alternano (${[...new Set(piano.scene.map((s) => s.blocco))].join(', ')})`);
    }
  }
});

// ───────────────────────── B21–B23, B25, B26 · fornitori, tetto di spesa, .env, crediti ─────────────────────────
// Un fornitore finto in casa: nessuna rete, nessun credito. Ogni percorso si comporta in un modo e conta le richieste.
{
  const http = await import('node:http');
  const viste = [];
  const fornitore = {guasto: true};
  const server = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (d) => (corpo += d));
    req.on('end', () => {
      const quante = viste.filter((v) => v.percorso === req.url).length;
      viste.push({percorso: req.url, corpo});
      const rispondi = (stato, testate = {}, dati = '{}') => res.writeHead(stato, {'Content-Type': 'application/json', ...testate}).end(dati);
      if (req.url === '/muto') return; // non risponde mai
      if (req.url === '/a-meta') return void res.writeHead(200, {'Content-Type': 'application/json'}).write('{"inizio":'); // comincia e si ferma
      if (req.url === '/due-429') return quante < 2 ? rispondi(429, {'Retry-After': '0.1'}) : rispondi(200, {}, '{"ok":true}');
      if (req.url === '/sempre-500') return rispondi(500);
      if (req.url === '/503-senza-testata') return quante < 1 ? rispondi(503) : rispondi(200);
      const rifiuto = /^\/rifiuto-(\d+)$/.exec(req.url);
      if (rifiuto) return rispondi(Number(rifiuto[1]));
      if (/\/v1\/text-to-speech\//.test(req.url)) {
        const testo = JSON.parse(corpo).text;
        if (fornitore.guasto && /seconda/.test(testo)) return rispondi(500);
        const caratteri = [...testo];
        return rispondi(200, {}, JSON.stringify({audio_base64: Buffer.from('audio finto').toString('base64'), alignment: {characters: caratteri, character_start_times_seconds: caratteri.map((_, i) => i * 0.05), character_end_times_seconds: caratteri.map((_, i) => (i + 1) * 0.05)}}));
      }
      rispondi(404);
    });
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-fornitori-'));
  const prima = {...process.env};
  Object.assign(process.env, {FMLAB_ATTESA_FORNITORE: '0.4', FMLAB_ATTESA_RIPROVA: '0.05', FMLAB_FRASI_PAGATE: path.join(tmp, 'pagate'), FMLAB_FRASI: path.join(tmp, 'banca'), FMLAB_REGISTRO: path.join(tmp, 'registro'), FMLAB_ENV: path.join(tmp, 'env')});
  delete process.env.FMLAB_MAX_CARATTERI;
  const richieste = (percorso) => viste.filter((v) => v.percorso === percorso).length;
  const {chiamaFornitore, attesaRiprova} = await carica('motore/rete.mjs');
  const voce = await carica('motore/voce.mjs');
  const zitto = async (f) => {
    const stampa = console.log;
    console.log = () => {};
    try {
      return await f();
    } finally {
      console.log = stampa;
    }
  };
  try {
    await prova('B21 · fornitori: una chiamata che non risponde (o che si ferma a metà risposta) scade, e l\'errore dice di riprovare', async () => {
      for (const percorso of ['/muto', '/a-meta']) {
        const inizio = Date.now();
        await assert.rejects(chiamaFornitore('Il fornitore finto', base + percorso), /Il fornitore finto non ha risposto entro 0,4 secondi\. Riprova/);
        assert.ok(Date.now() - inizio < 3000, `${percorso}: ha aspettato ${Date.now() - inizio} ms`);
        assert.equal(richieste(percorso), 1, 'dopo una scadenza non si riprova da soli');
      }
      // di serie sono 90 secondi, e nessuna chiamata a un fornitore passa fuori da qui
      delete process.env.FMLAB_ATTESA_FORNITORE;
      await assert.rejects(chiamaFornitore('X', 'http://127.0.0.1:9/'), /Non riesco a raggiungere X/);
      process.env.FMLAB_ATTESA_FORNITORE = '0.4';
      assert.match(fs.readFileSync(path.join(K, 'motore/rete.mjs'), 'utf8'), /numero\('FMLAB_ATTESA_FORNITORE', 90\)/);
      for (const file of ['motore/voce.mjs', 'motore/immagini.mjs']) assert.doesNotMatch(fs.readFileSync(path.join(K, file), 'utf8'), /\bfetch\(/, `${file} chiama un fornitore senza limite di tempo`);
    });

    await prova('B22 · fornitori: si riprova solo su 429 e 5xx, tre volte al massimo, aspettando Retry-After; una frase già arrivata non si richiede più', async () => {
      const inizio = Date.now();
      const r = await zitto(() => chiamaFornitore('F', `${base}/due-429`));
      assert.deepEqual([r.ok, r.tentativi, richieste('/due-429')], [true, 3, 3]);
      assert.ok(Date.now() - inizio >= 190, 'ha aspettato i secondi chiesti dal servizio');
      const guasto = await zitto(() => chiamaFornitore('F', `${base}/sempre-500`));
      assert.deepEqual([guasto.status, guasto.tentativi, richieste('/sempre-500')], [500, 3, 3]);
      assert.equal((await zitto(() => chiamaFornitore('F', `${base}/503-senza-testata`))).tentativi, 2);
      for (const stato of [401, 402, 404, 422]) {
        const no = await chiamaFornitore('F', `${base}/rifiuto-${stato}`);
        assert.deepEqual([no.status, no.tentativi, richieste(`/rifiuto-${stato}`)], [stato, 1, 1], `su ${stato} non si riprova`);
      }
      assert.deepEqual([attesaRiprova('7'), attesaRiprova(null, 20), attesaRiprova('99999')], [7, 20, 300]);
      // tre frasi: la seconda fallisce sempre. La prima è arrivata ed è salvata: la volta dopo non si chiede di nuovo.
      const piano = () => ['prima frase.', 'seconda frase.', 'terza frase.'].map((testo, i) => {
        const file = path.join(tmp, 'pagate', `f${i}.mp3`);
        const tempi = path.join(tmp, 'pagate', `f${i}.json`);
        return {testo, origine: fs.existsSync(file) && fs.existsSync(tempi) ? 'deposito' : 'elevenlabs', file, tempi};
      });
      const chieste = (testo) => viste.filter((v) => /text-to-speech/.test(v.percorso) && JSON.parse(v.corpo).text === testo).length;
      await assert.rejects(zitto(() => voce.scaricaFrasiElevenLabs(piano(), 'v', 'chiave-finta', {base})), /ElevenLabs ha risposto 500.*dopo 3 tentativi/s);
      assert.deepEqual([chieste('prima frase.'), chieste('seconda frase.'), chieste('terza frase.')], [1, 3, 0]);
      fornitore.guasto = false;
      const dopo = await voce.scaricaFrasiElevenLabs(piano(), 'v', 'chiave-finta', {base});
      assert.deepEqual([chieste('prima frase.'), chieste('seconda frase.'), chieste('terza frase.')], [1, 4, 1], 'la prima frase era già pagata');
      assert.equal(dopo.caratteri, 'seconda frase.'.length + 'terza frase.'.length);
      assert.equal((await voce.scaricaFrasiElevenLabs(piano(), 'v', 'chiave-finta', {base})).caratteri, 0);
    });

    await prova('B23 · tetto di spesa: sopra FMLAB_MAX_CARATTERI ci si ferma prima di chiamare ElevenLabs, dicendo il costo e come alzarlo', async () => {
      const lungo = [{testo: 'x'.repeat(40), origine: 'elevenlabs', file: path.join(tmp, 'pagate', 'lungo.mp3'), tempi: path.join(tmp, 'pagate', 'lungo.json')}];
      const prime = viste.length;
      process.env.FMLAB_MAX_CARATTERI = '30';
      await assert.rejects(voce.scaricaFrasiElevenLabs(lungo, 'v', 'chiave-finta', {base}), /costerebbe circa 40 crediti: supera il tetto di 30 \(FMLAB_MAX_CARATTERI\)\. Non ho chiamato ElevenLabs[\s\S]*FMLAB_MAX_CARATTERI=1000/);
      assert.equal(viste.length, prime, 'nessuna richiesta deve essere partita');
      // quello che è già pagato o in banca non conta: si guarda solo quello che si pagherebbe adesso
      assert.doesNotThrow(() => voce.controllaTetto(30));
      process.env.FMLAB_MAX_CARATTERI = '0';
      assert.doesNotThrow(() => voce.controllaTetto(10_000_000), '0 spegne il tetto');
      delete process.env.FMLAB_MAX_CARATTERI;
      assert.equal(voce.tettoCaratteri(), 50000);
      assert.doesNotThrow(() => voce.controllaTetto(50000));
      assert.throws(() => voce.controllaTetto(50001), /supera il tetto di 50000/);
      assert.match(fs.readFileSync(path.join(K, '.env.esempio'), 'utf8'), /FMLAB_MAX_CARATTERI=50000/);
    });

    await prova('B25 · .env scritto a mano: la nota in fondo alla riga non entra nel valore (solo dopo uno spazio, e non tra virgolette)', async () => {
      const {valoreEnv, righeEnv} = await carica('motore/percorsi.mjs');
      assert.equal(valoreEnv('eleven_v4 # il modello della banca'), 'eleven_v4');
      assert.equal(valoreEnv('eleven_v4\t# nota'), 'eleven_v4');
      assert.equal(valoreEnv('colore#5CF2C8'), 'colore#5CF2C8', 'senza spazio il cancelletto fa parte del valore');
      assert.equal(valoreEnv('"valore # non è una nota"'), 'valore # non è una nota');
      assert.equal(valoreEnv("'a b' # nota"), 'a b');
      assert.equal(valoreEnv('  semplice  '), 'semplice');
      assert.equal(valoreEnv('# solo una nota'), '# solo una nota', 'un valore che comincia con il cancelletto resta com\'è');
      assert.deepEqual(righeEnv('# titolo\nA=1 # uno\n B = due\nnon una riga\nC="tre # 3"\n'), [['A', '1'], ['B', 'due'], ['C', 'tre # 3']]);
      // la dashboard legge il file allo stesso modo
      const chiavi = await carica('motore/chiavi.mjs');
      fs.writeFileSync(process.env.FMLAB_ENV, 'ELEVENLABS_MODEL=eleven_v4 # come la banca\n');
      assert.equal(chiavi.statoChiavi().find((c) => c.nome === 'ELEVENLABS_MODEL').valore, 'eleven_v4');
    });

    await prova('B26 · crediti: il totale non si perde quando il registro viene accorciato, e una spesa non si conta due volte', async () => {
      const r = await carica('motore/registro.mjs');
      const registro = path.join(process.env.FMLAB_REGISTRO, 'registro.jsonl');
      // un registro di prima del contatore: si parte da quello che ricorda
      fs.mkdirSync(process.env.FMLAB_REGISTRO, {recursive: true});
      fs.writeFileSync(registro, `${JSON.stringify({t: '2026-01-01T00:00:00.000Z', tipo: 'spesa', reel: 'vecchio', caratteri: 30})}\n`);
      assert.deepEqual(r.creditiSpesi(), {totale: 30, perReel: {vecchio: 30}});
      r.annota('spesa', {reel: 'uno', caratteri: 100});
      assert.deepEqual(r.creditiSpesi(), {totale: 130, perReel: {vecchio: 30, uno: 100}}, 'la spesa appena scritta non va sommata due volte');
      // il registro viene tagliato (qui: buttato via del tutto): il totale resta
      fs.rmSync(registro);
      r.annota('spesa', {reel: 'uno', caratteri: 50});
      assert.deepEqual(r.creditiSpesi(), {totale: 180, perReel: {vecchio: 30, uno: 150}});
      assert.equal(r.creditiDalRegistro().totale, 50, 'il registro da solo ricorda solo gli ultimi tempi');
    });
  } finally {
    server.closeAllConnections?.();
    server.close();
    for (const k of ['FMLAB_ATTESA_FORNITORE', 'FMLAB_ATTESA_RIPROVA', 'FMLAB_FRASI_PAGATE', 'FMLAB_FRASI', 'FMLAB_REGISTRO', 'FMLAB_ENV', 'FMLAB_MAX_CARATTERI', 'ELEVENLABS_MODEL']) {
      if (prima[k] === undefined) delete process.env[k];
      else process.env[k] = prima[k];
    }
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

// ───────────────────────── B27–B29 · un'atmosfera per reel ─────────────────────────

await prova('B27 · atmosfera: dal nome del reel esce sempre la stessa, diversa da quella del reel che lo precede; i reel esistenti restano com\'erano', async () => {
  const {atmosferaDalNome, NOMI_ATMOSFERE} = await carica('motore/comune/atmosfere.mjs');
  const {atmosferaPerReel, atmosferaInUso} = await carica('motore/regista.mjs');
  const nomi = Array.from({length: 200}, (_, i) => `reel-di-prova-${i}`);
  for (const n of nomi) {
    assert.equal(atmosferaDalNome(n), atmosferaDalNome(n), 'lo stesso nome dà la stessa atmosfera');
    assert.ok(NOMI_ATMOSFERE.includes(atmosferaDalNome(n)));
    assert.notEqual(atmosferaDalNome(n, atmosferaDalNome(n)), atmosferaDalNome(n), 'mai quella del reel precedente');
  }
  assert.deepEqual([...new Set(nomi.map((n) => atmosferaDalNome(n)))].sort(), [...NOMI_ATMOSFERE].sort(), 'su molti nomi escono tutte');
  // nella cartella: conta il reel che viene subito prima, in ordine di nome
  const sua = atmosferaDalNome('b-reel');
  const altra = NOMI_ATMOSFERE.find((a) => a !== sua);
  assert.equal(atmosferaPerReel('b-reel', ['b-reel'], () => sua), sua, 'da solo nella cartella: quella del suo nome');
  assert.equal(atmosferaPerReel('b-reel', ['a-reel', 'b-reel', 'c-reel'], (r) => (r === 'a-reel' ? altra : sua)), sua, 'il reel dopo non conta');
  assert.notEqual(atmosferaPerReel('b-reel', ['a-reel', 'b-reel'], () => sua), sua, 'il reel prima ha la stessa: se ne prende un\'altra');
  assert.equal(atmosferaPerReel('b-reel', ['a-reel', 'b-reel'], () => sua), atmosferaPerReel('b-reel', ['a-reel', 'b-reel'], () => sua), 'e resta quella');
  // i reel che c'erano già non hanno un'atmosfera scritta: restano sul fondo di sempre
  for (const reel of ['gps', 'reta-ginocchio', 'reta-testo', 'mots-c']) {
    assert.equal(atmosferaInUso(reel), 'classica', reel);
    assert.doesNotMatch(fs.readFileSync(path.join(K, 'reels', reel, 'impostazioni.json'), 'utf8'), /atmosfera/, `${reel}: le impostazioni non sono state toccate`);
  }
});

await prova('B28 · atmosfere: da quattro a sei nomi, fatte solo di tinta, densità e raggi; "classica" è il fondo di sempre; il piano le scrive nel reel', async () => {
  const {ATMOSFERE, NOMI_ATMOSFERE, valoriAtmosfera} = await carica('motore/comune/atmosfere.mjs');
  const {stile} = await ts('stile/stile.ts');
  assert.deepEqual(NOMI_ATMOSFERE, ['classica', 'serra', 'abisso', 'alba', 'notte']);
  assert.ok(NOMI_ATMOSFERE.length >= 4 && NOMI_ATMOSFERE.length <= 6);
  for (const [nome, a] of Object.entries(ATMOSFERE)) {
    assert.deepEqual(Object.keys(a).sort(), ['cosa', 'densita', 'raggi', 'tinta'], `${nome}: solo quello che il fondo sa già fare`);
    assert.match(a.tinta, /^#[0-9A-F]{6}$/);
    assert.ok(a.densita >= 0.5 && a.densita <= 1.3 && a.raggi >= 0 && a.raggi <= 1, nome);
  }
  assert.equal(new Set(Object.values(ATMOSFERE).map((a) => a.tinta)).size, NOMI_ATMOSFERE.length, 'ogni atmosfera ha il suo colore');
  assert.deepEqual(valoriAtmosfera('classica'), {tinta: stile.colori.foschia, densita: 1, raggi: 0});
  assert.equal(valoriAtmosfera('tramonto'), null);
  // nel piano si scrive il nome; nel reel montato finiscono i tre valori
  const {regia} = await carica('motore/regista.mjs');
  const {controllaPiano, scriviScene} = await carica('motore/piano.mjs');
  const {piano} = regia(TESTO_RETA);
  assert.equal(piano.atmosfera, undefined, 'il regista puro non sceglie: sceglie il comando, che conosce il nome del reel');
  piano.atmosfera = 'alba';
  const esito = controllaPiano(piano, TESTO_RETA);
  assert.deepEqual(esito.errori, []);
  assert.match(scriviScene(piano, esito), /atmosfera: \{tinta: "#F2A93C", densita: 0\.85, raggi: 0\.5\},/);
  piano.atmosfera = 'tramonto';
  assert.match(controllaPiano(piano, TESTO_RETA).errori.join('\n'), /l'atmosfera "tramonto" non esiste\. Puoi scegliere: classica, serra, abisso, alba, notte/);
});

await prova('B29 · atmosfera scritta male nelle impostazioni: l\'errore dice i nomi che esistono', async () => {
  const {sistema} = await carica('motore/impostazioni.mjs');
  assert.equal(sistema({}, {}).atmosfera, 'auto', 'di serie decide il regista');
  assert.equal(sistema({atmosfera: ' ALBA '}, {}).atmosfera, 'alba');
  assert.throws(() => sistema({atmosfera: 'tramonto'}, {}, 'reels/x/impostazioni.json'), /reels\/x\/impostazioni\.json: l'atmosfera "tramonto" non esiste\. Puoi scegliere: auto, classica, serra, abisso, alba, notte\./);
  // dalla riga di comando: stesso errore, e niente viene salvato
  const r = spawnSync(process.execPath, [path.join(K, 'motore/cli.mjs'), 'imposta', 'gps', 'atmosfera=tramonto'], {cwd: K, encoding: 'utf8', env: {...process.env, FMLAB_REGISTRO: path.join(os.tmpdir(), `fmlab-b29-${process.pid}`), FMLAB_DASHBOARD: 'no'}});
  assert.match(`${r.stdout}${r.stderr}`, /l'atmosfera "tramonto" non esiste\. Puoi scegliere: auto, classica, serra, abisso, alba, notte\./);
  assert.doesNotMatch(fs.readFileSync(path.join(K, 'reels/gps/impostazioni.json'), 'utf8'), /atmosfera/);
  fs.rmSync(path.join(os.tmpdir(), `fmlab-b29-${process.pid}`), {recursive: true, force: true});
});

// ───────────────────────── B30 · la banca musicale del kit ─────────────────────────

await prova('B30 · musica: le trame le genera il kit da una formula; dal nome del reel esce sempre la stessa; musica=no la spegne; il file del reel vince', async () => {
  const m = await carica('motore/musiche.mjs');
  const {sistema} = await carica('motore/impostazioni.mjs');
  assert.ok(m.NOMI_TRAME.length >= 3 && m.NOMI_TRAME.length <= 4);
  // generate dal kit: una formula di ffmpeg, nessun file da leggere
  for (const [nome, [cosa, note, filtro]] of Object.entries(m.TRAME)) {
    assert.ok(cosa && note.length >= 2 && filtro, nome);
    for (const n of note) {
      assert.match(n, /^[\d.]+\*sin\(2\*PI\*[\d.]+\*t\)/, `${nome}: solo note sintetizzate`);
      const hz = Number(/2\*PI\*([\d.]+)\*t/.exec(n)[1]);
      assert.ok(Math.abs(hz * m.DURATA_TRAMA - Math.round(hz * m.DURATA_TRAMA)) < 1e-6, `${nome}: ${hz} Hz non chiude il giro in ${m.DURATA_TRAMA} secondi (si sentirebbe lo scalino)`);
    }
  }
  // dal nome: stabile, e su molti nomi escono tutte
  const nomi = Array.from({length: 120}, (_, i) => `reel-${i}`);
  for (const n of nomi) assert.equal(m.musicaDalNome(n), m.musicaDalNome(n));
  assert.deepEqual([...new Set(nomi.map((n) => m.musicaDalNome(n)))].sort(), [...m.NOMI_TRAME].sort());
  // l'ordine di chi decide
  const trama = m.NOMI_TRAME[0];
  assert.deepEqual(m.qualeMusica({nelReel: '/x/musica.mp3', volume: 0, scelta: trama, delPiano: trama}), {tipo: 'file', file: '/x/musica.mp3'}, 'il file del reel vince su tutto');
  assert.equal(m.qualeMusica({volume: 0, scelta: trama, delPiano: trama, delKit: '/k/musica.mp3'}), null, 'musica=no: nessuna musica');
  assert.equal(m.qualeMusica({scelta: m.NOMI_TRAME[1], delPiano: trama}).nome, m.NOMI_TRAME[1], 'la scelta a mano vince su quella del piano');
  assert.equal(m.qualeMusica({scelta: 'auto', delPiano: trama}).nome, trama, 'auto: quella scritta nel piano dal regista di serie');
  assert.equal(m.qualeMusica({scelta: 'auto', delPiano: null}), null, 'un reel senza scelta resta senza musica, come prima');
  assert.deepEqual(m.qualeMusica({scelta: 'auto', delKit: '/k/musica.mp3'}), {tipo: 'file', file: '/k/musica.mp3'}, 'la musica del kit in stile/ vale come prima');
  // le impostazioni: auto di serie, un nome sbagliato dà l'elenco
  assert.equal(sistema({}, {}).trama, 'auto');
  assert.throws(() => sistema({trama: 'valzer'}, {}, 'x'), new RegExp(`la musica "valzer" non esiste\\. Puoi scegliere: auto, ${m.NOMI_TRAME.join(', ')}`));
  // dalla riga di comando: un numero è il volume, "no" spegne, un nome sceglie la trama (su una copia: gps non si tocca)
  const {comandoImposta, leggiImpostazioni} = await carica('motore/impostazioni.mjs');
  const slug = `zz-difetti-musica-${process.pid}`;
  daCancellare.add(slug);
  const creato = spawnSync(process.execPath, [path.join(K, 'motore/cli.mjs'), 'nuovo', slug, 'Prova musica', 'spiegazione'], {cwd: K, encoding: 'utf8', env: {...process.env, FMLAB_REGISTRO: path.join(os.tmpdir(), `fmlab-b30-${process.pid}`), FMLAB_DASHBOARD: 'no'}});
  assert.equal(creato.status, 0, creato.stderr);
  fs.rmSync(path.join(os.tmpdir(), `fmlab-b30-${process.pid}`), {recursive: true, force: true});
  const zitto = console.log;
  console.log = () => {};
  try {
    await comandoImposta(slug, ['musica=45']);
    assert.deepEqual([leggiImpostazioni(slug).musica, leggiImpostazioni(slug).trama], [45, 'auto']);
    await comandoImposta(slug, ['musica=no']);
    assert.equal(leggiImpostazioni(slug).musica, 0);
    await comandoImposta(slug, [`musica=${trama}`]);
    assert.deepEqual([leggiImpostazioni(slug).musica > 0, leggiImpostazioni(slug).trama], [true, trama]);
  } finally {
    console.log = zitto;
  }
  // il regista di serie scrive la trama nel piano, e il piano la controlla
  const {controllaPiano} = await carica('motore/piano.mjs');
  const {regia} = await carica('motore/regista.mjs');
  const {piano} = regia(TESTO_RETA);
  piano.musica = 'valzer';
  assert.match(controllaPiano(piano, TESTO_RETA).errori.join('\n'), /la musica "valzer" non esiste/);
});

// ───────────────────────── B31 · le voci alternative documentate ─────────────────────────

await prova('B31 · voci: gli esempi di voci/COME-FARE.md si leggono come li legge il motore "comando", e la sintassi documentata produce l\'audio', async () => {
  const {spezza} = await carica('motore/voce.mjs');
  const guida = fs.readFileSync(path.join(K, 'voci/COME-FARE.md'), 'utf8');
  const righe = guida.split('\n').filter((r) => r.startsWith('FMLAB_VOCE_COMANDO=')).map((r) => r.slice('FMLAB_VOCE_COMANDO='.length));
  assert.ok(righe.length >= 4, `nella guida ci sono ${righe.length} righe FMLAB_VOCE_COMANDO: servono il modello e tre esempi`);
  for (const riga of righe) {
    const pezzi = spezza(riga);
    assert.ok(pezzi.length >= 3, riga);
    assert.ok(pezzi.includes('{testo}') && pezzi.includes('{uscita}'), `l'esempio non dice dove leggere la frase o dove scrivere l'audio: ${riga}`);
    assert.ok(!/["\\]/.test(pezzi[0]), `il programma da lanciare non si legge: ${riga}`);
  }
  // l'esempio con "sh -c": lo script resta un pezzo solo, con le sue virgolette, e riceve i due percorsi
  const conShell = spezza(righe.find((r) => r.startsWith('sh -c ')));
  assert.deepEqual([conShell[0], conShell[1], conShell.length], ['sh', '-c', 6]);
  assert.match(conShell[2], /--output_file "\$2" < "\$1"$/);
  // la stessa sintassi, con una voce finta al posto del programma: il kit la lancia così, frase per frase
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-b31-'));
  try {
    const testo = path.join(tmp, 'frase con spazi.txt');
    const uscita = path.join(tmp, 'audio con spazi.grezzo');
    fs.writeFileSync(testo, 'Vediamo cosa è successo.');
    const riga = `sh -c "node prove/sostegno/voce-finta.mjs \\"$1\\" \\"$2\\"" voce {testo} {uscita}`;
    const pezzi = spezza(riga).map((p) => p.replaceAll('{testo}', testo).replaceAll('{uscita}', uscita));
    const r = spawnSync(pezzi[0], pezzi.slice(1), {cwd: K, encoding: 'utf8'});
    assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.readFileSync(uscita).subarray(0, 4).toString(), 'RIFF', 'l\'audio è stato scritto dove il kit lo aspetta');
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  // l'onestà su cosa parte in rete: la guida lo dice per ogni esempio, e LEGGIMI non parla più solo di ElevenLabs
  assert.equal((guida.match(/In rete:/g) ?? []).length, 3);
  const leggimi = fs.readFileSync(path.join(K, 'LEGGIMI.md'), 'utf8');
  assert.doesNotMatch(leggimi, /L'unica cosa che manda in rete è il testo del copione a ElevenLabs/);
  assert.match(leggimi, /FMLAB_VOCE_COMANDO/);
});

// ───────────────────────── B32 · la pagella (docs/OCCHIO.md) ─────────────────────────

await prova('B32 · docs/OCCHIO.md: otto voci, ognuna con il suo controllo; i numeri sono quelli che il kit usa davvero; tre domande in fondo', async () => {
  const occhio = fs.readFileSync(path.join(K, 'docs/OCCHIO.md'), 'utf8');
  const righe = occhio.split('\n').filter((r) => /^\| \d \|/.test(r));
  assert.equal(righe.length, 8);
  for (const r of righe) assert.ok(r.split('|')[3].trim().length > 20, `la voce non dice come si controlla: ${r.slice(0, 60)}`);
  const virgola = (n) => String(n).replace('.', ',');
  const {PAUSA_MASSIMA} = await carica('motore/piano.mjs');
  const {TOLLERANZA} = await carica('motore/durata.mjs');
  const soglie = JSON.parse(fs.readFileSync(path.join(K, 'riferimenti/misure.json'), 'utf8')).soglie;
  assert.ok(occhio.includes(`oltre ${virgola(PAUSA_MASSIMA)} secondi senza novità`), 'la pausa massima è quella di npm run piano');
  assert.ok(occhio.includes(`soglia ${virgola(soglie['narratore.stessaPosaMassimo'].max)} secondi`), 'la soglia della posa è quella dei riferimenti');
  assert.ok(occhio.includes(`entro ${TOLLERANZA} secondi`) && occhio.includes(`Fuori dai ${TOLLERANZA} secondi`.toLowerCase()) || occhio.includes(`fuori dai ${TOLLERANZA} secondi`), 'lo scarto di durata è quello della verifica');
  assert.match(fs.readFileSync(path.join(K, 'motore/verifica.mjs'), 'utf8'), /primaFrase\.length > 14/);
  assert.match(fs.readFileSync(path.join(K, 'motore/piano.mjs'), 'utf8'), /punti >= 60 \? 'alto' : punti >= 35 \? 'medio' : 'basso'/);
  assert.ok(occhio.includes('supera le 14') && occhio.includes('sotto 35') && occhio.includes('da 60 in su'));
  assert.equal(occhio.slice(occhio.indexOf('## Tre domande')).split('\n').filter((r) => /^\d\. .+\?/.test(r)).length, 3);
});

// ───────────────────────── B33 · le ricette (docs/RICETTE.md) ─────────────────────────

await prova('B33 · docs/RICETTE.md: da sei a otto ricette, ognuna con quando usarla, il testo e una scena che passa il controllo del piano; i numeri sono quelli di reta-testo', async () => {
  const {controllaPiano, BLOCCHI} = await carica('motore/piano.mjs');
  const ricette = fs.readFileSync(path.join(K, 'docs/RICETTE.md'), 'utf8').split(/^## \d · /m).slice(1);
  const catalogo = fs.readFileSync(path.join(K, 'CATALOGO.md'), 'utf8');
  const fonti = fs.readFileSync(path.join(K, 'reels/reta-testo/fonti.md'), 'utf8') + fs.readFileSync(path.join(K, 'reels/reta-testo/piano.json'), 'utf8');
  assert.ok(ricette.length >= 6 && ricette.length <= 8, `le ricette sono ${ricette.length}`);
  const blocchi = [];
  for (const r of ricette) {
    const titolo = r.split('\n')[0];
    assert.match(r, /\*\*Quando:\*\* .{20,}/, `${titolo}: manca quando usarla`);
    const testo = /\*\*Testo:\*\* (.+)/.exec(r)?.[1];
    const riga = /```json\n(.+)\n```/.exec(r)?.[1];
    assert.ok(testo && riga, `${titolo}: mancano il testo o la scena`);
    const scena = JSON.parse(riga);
    blocchi.push(scena.blocco);
    assert.ok(catalogo.includes(BLOCCHI[scena.blocco].fn), `${titolo}: il blocco "${scena.blocco}" non è in CATALOGO.md`);
    assert.ok(Object.keys(scena.segni ?? {}).length && scena.enfasi?.length && scena.camera, `${titolo}: la scena mostra segni, enfasi e camera`);
    const esito = controllaPiano({versione: 1, titolo: 'Ricetta', scene: [scena]}, testo);
    assert.deepEqual(esito.errori, [], titolo);
    assert.deepEqual(esito.avvisi.filter((a) => !a.startsWith('Effetti sonori')), [], `${titolo}: la scena d'esempio ha un avviso`);
    // nessun numero inventato: ogni numero con la virgola è scritto nelle fonti o nel piano di reta-testo
    for (const [n] of riga.matchAll(/\b\d+\.\d+\b/g)) {
      if (Number(n) <= 1) continue; // gli stati dei soggetti vanno da 0 a 1: non sono dati
      assert.ok(fonti.includes(n.replace('.', ',')) || fonti.includes(n), `${titolo}: il numero ${n} non viene da reels/reta-testo`);
    }
  }
  for (const serve of ['numero', 'confronto', 'passi', 'mito', 'scala', 'barre']) assert.ok(blocchi.includes(serve), `manca la ricetta con il blocco "${serve}"`);
});

if (pannello) await pannello.server.chiudi();
cancella();
const falliti = esiti.filter((e) => !e.ok);
console.log(`\n${esiti.length - falliti.length} prove superate${falliti.length ? `, ${falliti.length} FALLITE` : ''}`);
process.exit(falliti.length ? 1 : 0);
