// FMLAB Reel Kit — prove lente: usano il browser e fanno dei render veri. Non girano a ogni modifica.
//   npm run prove:lente            tutte (qualche minuto)
//   npm run prove:lente modelli    solo quelle che hanno "modelli" nel nome
// Si lanciano a fine fase, sul computer di lavoro. Le prove veloci sono in  npm test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const K = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(K, 'motore', 'cli.mjs');
const REELS = path.join(K, 'reels');
const filtro = process.argv[2] ?? '';
const esiti = [];
const daCancellare = new Set();
const cancella = () => {
  for (const slug of daCancellare) {
    fs.rmSync(path.join(REELS, slug), {recursive: true, force: true});
    fs.rmSync(path.join(K, '.fmlab', slug), {recursive: true, force: true});
  }
};
process.on('exit', cancella);

async function prova(nome, f) {
  if (filtro && !nome.includes(filtro)) return;
  const inizio = Date.now();
  try {
    await f();
    esiti.push({nome, ok: true});
    console.log(`  ok ${nome}  (${((Date.now() - inizio) / 1000).toFixed(0)} s)`);
  } catch (e) {
    esiti.push({nome, ok: false});
    console.log('  NO', nome, '\n       ' + String(e.message).split('\n').slice(0, 6).join('\n       '));
  }
}

/** Lancia un comando del kit e restituisce codice di uscita e testo stampato. */
function kit(argomenti, {env = {}, attesa = 900000} = {}) {
  const r = spawnSync(process.execPath, [CLI, ...argomenti], {cwd: K, encoding: 'utf8', timeout: attesa, env: {...process.env, FMLAB_NON_APRIRE: '1', ...env}});
  return {codice: r.status, testo: `${r.stdout ?? ''}${r.stderr ?? ''}`};
}
function nuovo(nome, modello = 'spiegazione') {
  const slug = `zz-lente-${nome}-${process.pid}`;
  daCancellare.add(slug);
  const r = kit(['nuovo', slug, `Prova ${nome}`, modello]);
  assert.equal(r.codice, 0, r.testo);
  return slug;
}
const ffmpeg = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});

/** Una voce finta per le prove: una nota per parola. Scritta in un file a parte, così si usa come motore "comando". */
const VOCE_FINTA = path.join(K, 'prove', 'sostegno', 'voce-finta.mjs');

// ───────────────────────── collaudo ─────────────────────────

await prova('collaudo: tutto a posto su questo computer', () => {
  const r = kit(['collaudo']);
  assert.equal(r.codice, 0, r.testo.split('\n').filter((l) => l.includes('✖')).join('\n'));
  assert.match(r.testo, /TUTTO OK/);
});

// ───────────────────────── B06 · i modelli nascono dentro le zone sicure ─────────────────────────

await prova('B06 · modelli: un reel appena creato da ogni modello non ha scritte fuori zona né coperte dal narratore', async () => {
  const {elencoModelli} = await import(`${K}/motore/nuovo.mjs`);
  const problemi = [];
  for (const m of elencoModelli()) {
    const slug = nuovo(`modello-${m.id}`, m.id);
    const r = kit(['verifica', slug]);
    for (const riga of r.testo.split('\n')) if (/fuori dalle zone sicure|coperta dal narratore|Errore nella scena/.test(riga)) problemi.push(`${m.id}: ${riga.trim()}`);
  }
  assert.deepEqual(problemi, []);
});

// ───────────────────────── B09 · fermare un render ─────────────────────────

await prova('B09 · ferma: un render interrotto dice "Fermato" e non lascia processi né file a metà', async () => {
  const slug = nuovo('ferma');
  const figlio = spawn(process.execPath, [CLI, 'render', slug, 'bozza'], {cwd: K, stdio: ['ignore', 'pipe', 'pipe']});
  let testo = '';
  figlio.stdout.on('data', (d) => (testo += d));
  figlio.stderr.on('data', (d) => (testo += d));
  // aspetta i primi fotogrammi, poi ferma
  const limite = Date.now() + 60000;
  while (!/\d+\/\d+ fotogrammi/.test(testo) && Date.now() < limite) await new Promise((r) => setTimeout(r, 200));
  assert.match(testo, /fotogrammi/, 'il render non è partito');
  figlio.kill('SIGTERM');
  const codice = await new Promise((r) => figlio.on('close', r));
  assert.doesNotMatch(testo, /Errore imprevisto|cdpSession|at .*\.mjs:\d+/);
  assert.match(testo, /Fermato/);
  assert.notEqual(codice, 0);
  await new Promise((r) => setTimeout(r, 800));
  assert.equal(fs.readdirSync(path.join(REELS, slug)).filter((f) => f.endsWith('.mp4')).length, 0, 'è rimasto un video a metà');
  const lavoro = path.join(K, '.fmlab', slug);
  const avanzi = fs.existsSync(lavoro) ? fs.readdirSync(lavoro, {recursive: true}).filter((f) => String(f).endsWith('.mp4')) : [];
  assert.deepEqual(avanzi, [], 'sono rimasti dei pezzi di video');
});

// ───────────────────────── B02 · B10 · durata e pezzi del render, con una voce finta ─────────────────────────

await prova('B02 · B10 · durata: testo lungo, 20 secondi chiesti → il video dura 20 s (±5) e la voce finisce prima della fine', async () => {
  const slug = nuovo('durata');
  const dir = path.join(REELS, slug);
  // 60 parole: con la voce finta durano circa 27 secondi
  const frase = 'Questa è una frase di prova, lunga dodici parole esatte, detta con calma.';
  fs.writeFileSync(path.join(dir, 'copione.md'), `<!-- lingua: it -->\n[scena:aggancio]\n${Array(5).fill(frase).join(' ')}\n`);
  fs.writeFileSync(path.join(dir, 'scene.tsx'), "import {bloccoTitolo, definisciReel} from '../../libreria';\nexport default definisciReel({scene: {aggancio: bloccoTitolo({titolo: 'Prova'})}});\n");
  assert.equal(kit(['imposta', slug, 'durata=20']).codice, 0);
  const env = {FMLAB_VOCE_COMANDO: `node ${JSON.stringify(VOCE_FINTA)} {testo} {uscita}`};
  const voce = kit(['voce', slug, 'comando'], {env});
  assert.equal(voce.codice, 0, voce.testo);
  assert.match(voce.testo, /velocità/i);
  const dati = JSON.parse(fs.readFileSync(path.join(dir, 'parole.json'), 'utf8'));
  assert.ok(dati.velocita > 1.05 && dati.velocita <= 1.4, `velocità ${dati.velocita}`);
  const render = kit(['render', slug, 'bozza'], {env});
  assert.equal(render.codice, 0, render.testo);
  const video = path.join(dir, `${slug}.bozza.mp4`);
  const durata = Number(/Duration: (\d+):(\d+):([\d.]+)/.exec(ffmpeg(['-i', video]).stderr).slice(1).reduce((s, x) => s * 60 + Number(x), 0));
  assert.ok(Math.abs(durata - 20) <= 5, `il video dura ${durata} s, chiesti 20`);
  // la voce (velocizzata) deve finire dove dicono i tempi: silenzio nell'ultimo secondo, suono poco prima della fine della voce
  const volume = (da, lungo) => Number(/mean_volume: (-?[\d.]+|-inf)/.exec(ffmpeg(['-ss', String(da), '-t', String(lungo), '-i', video, '-af', 'volumedetect', '-vn', '-f', 'null', '-']).stderr)?.[1].replace('-inf', '-120'));
  const fineVoce = dati.parole.at(-1).fine;
  assert.ok(volume(fineVoce - 1.0, 0.8) > -45, `nessun suono poco prima della fine della voce (${fineVoce} s)`);
  assert.ok(volume(fineVoce + 0.5, 0.6) < -55, 'la voce continua dopo la fine prevista: audio e tempi non sono stati velocizzati insieme');
  // B10: niente pezzi lasciati sul disco
  const lavoro = path.join(K, '.fmlab', slug);
  assert.deepEqual(fs.readdirSync(lavoro, {recursive: true}).filter((f) => String(f).endsWith('.mp4')), []);
  // e la verifica giudica la durata chiesta
  const verifica = kit(['verifica', slug], {env});
  assert.match(verifica.testo, /✓ Durata .*chiesti 20/);
});

// ───────────────────────── il metro (fase 1) ─────────────────────────

await prova('metro: lo stesso video misurato due volte dà gli stessi numeri; sul reel del kit ritrova parole e pagine vere', async () => {
  const slug = nuovo('metro');
  assert.equal(kit(['render', slug, 'bozza']).codice, 0);
  const video = path.join(REELS, slug, `${slug}.bozza.mp4`);
  const a = kit(['confronta', video, 'json']);
  const b = kit(['confronta', video, 'json']);
  assert.equal(a.codice, 0, a.testo);
  assert.equal(a.testo, b.testo, 'due misure dello stesso file sono diverse');
  const m = JSON.parse(a.testo).misura;
  // il video viene dal kit: parole e pagine dei sottotitoli sono note, il metro deve ritrovarle (entro una su dieci)
  const dati = JSON.parse(fs.readFileSync(path.join(REELS, slug, 'parole.json'), 'utf8'));
  assert.ok(Math.abs(m.sottotitoli.paroleContate - dati.parole.length) <= Math.ceil(dati.parole.length * 0.1), `parole contate ${m.sottotitoli.paroleContate}, vere ${dati.parole.length}`);
  assert.equal(m.tagli.quanti, 0);
  assert.equal(m.narratore.presente, true);
  assert.ok(m.sottotitoli.posizioneY > 0.17 && m.sottotitoli.posizioneY < 0.2);
  // senza narratore il metro lo dice e non inventa pose
  assert.equal(kit(['imposta', slug, 'narratore=nessuno']).codice, 0);
  assert.equal(kit(['render', slug, 'bozza']).codice, 0);
  const senza = JSON.parse(kit(['confronta', video, 'json']).testo).misura;
  assert.equal(senza.narratore.presente, false);
});

await prova('mondo: un reel appena creato, reso con il mondo a livelli, sta nelle soglie su tagli, novità e palco fermo', () => {
  const slug = nuovo('mondo', 'dati');
  const reso = kit(['render', slug]);
  assert.equal(reso.codice, 0, reso.testo);
  const m = JSON.parse(kit(['confronta', path.join(REELS, slug, `${slug}.mp4`), 'json']).testo).misura;
  const soglie = JSON.parse(fs.readFileSync(path.join(K, 'riferimenti', 'misure.json'), 'utf8')).soglie;
  assert.equal(m.tagli.quanti, 0);
  assert.ok(m.palco.fermoPercento <= soglie['palco.fermoPercento'].max, `palco fermo per il ${m.palco.fermoPercento}% del tempo (soglia ${soglie['palco.fermoPercento'].max})`);
  assert.ok(m.palco.fermoMassimo <= soglie['palco.fermoMassimo'].max, `fermo più lungo ${m.palco.fermoMassimo} s`);
  assert.ok(m.palco.occupato >= soglie['palco.occupato'].min, `palco occupato ${m.palco.occupato}`);
  assert.ok(m.novita.intervalloMediano <= soglie['novita.intervalloMediano'].max, `una novità ogni ${m.novita.intervalloMediano} s (soglia ${soglie['novita.intervalloMediano'].max})`);
  assert.ok(m.sottotitoli.contrastoMinimo >= soglie['sottotitoli.contrastoMinimo'].min, `contrasto dei sottotitoli ${m.sottotitoli.contrastoMinimo}`);
});

await prova('metro: rimisurando i video di riferimento escono le soglie salvate in riferimenti/misure.json', () => {
  const cartella = path.join(K, 'riferimenti');
  const video = fs.readdirSync(cartella).filter((f) => /\.(mp4|mov|m4v)$/i.test(f));
  if (video.length < 3) {
    console.log('       (saltata: i video di riferimento non sono in riferimenti/ su questo computer)');
    return;
  }
  const file = path.join(cartella, 'misure.json');
  const prima = fs.readFileSync(file, 'utf8');
  try {
    assert.equal(kit(['confronta', 'riferimenti', 'json']).codice, 0);
    assert.equal(fs.readFileSync(file, 'utf8'), prima, 'le misure dei riferimenti sono cambiate: lo strumento non è più lo stesso');
  } finally {
    fs.writeFileSync(file, prima);
  }
});

// ───────────────────────── B11 · numeri e fonti sui reel veri ─────────────────────────

await prova('B11 · fonti: nei due reel del kit ogni numero a schermo è in fonti.md; tolta una riga, la verifica lo dice', async () => {
  for (const reel of ['gps', 'reta-ginocchio']) {
    const r = kit(['verifica', reel]);
    assert.match(r.testo, /✓ Numeri a schermo/, `${reel}:\n${r.testo.split('\n').filter((l) => /senza riga|Numeri/.test(l)).join('\n')}`);
  }
  const file = path.join(REELS, 'reta-ginocchio', 'fonti.md');
  const originale = fs.readFileSync(file, 'utf8');
  try {
    fs.writeFileSync(file, originale.replace(/1\.019/g, 'circa mille').replace(/445 \+ 574/g, 'la somma'));
    const r = kit(['verifica', 'reta-ginocchio']);
    assert.match(r.testo, /✖ .*senza riga in fonti\.md.*1\.019/s);
    assert.notEqual(r.codice, 0);
  } finally {
    fs.writeFileSync(file, originale);
  }
});

// ───────────────────────── B01 · il pannello, come lo usa una persona dal telefono ─────────────────────────

await prova('B01 · pannello: testo incollato, durata scritta a mano, ogni pulsante', async () => {
  const {chromium} = await import('playwright-core');
  const {trovaBrowser} = await import(`${K}/motore/browser.mjs`);
  const porta = 4300 + (process.pid % 500);
  const server = spawn(process.execPath, [CLI, 'pannello'], {cwd: K, stdio: 'ignore', env: {...process.env, FMLAB_NON_APRIRE: '1', FMLAB_CHIAVE_PANNELLO: 'LENTE234', FMLAB_PORTA_PANNELLO: String(porta)}});
  const browser = await chromium.launch({executablePath: trovaBrowser(), headless: true});
  const errori = [];
  try {
    await new Promise((r) => setTimeout(r, 1500));
    const pagina = await (await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true})).newPage();
    pagina.on('pageerror', (e) => errori.push(e.message));
    await pagina.goto(`http://localhost:${porta}/`);
    await pagina.fill('input[name=chiave]', 'lente234');
    await pagina.click('button');
    await pagina.waitForSelector('#crea');
    const testo = 'Il caffè non ti dà energia. Te la presta.\n#adenosina: si accumula mentre stai sveglio [1].\nDopo circa 5 ore metà della caffeina è sparita * e il conto arriva. Commenta CAFFÈ.';
    await pagina.fill('#richiesta', testo);
    await pagina.fill('#titolo', `zz lente pannello ${process.pid}`);
    const slug = `zz-lente-pannello-${process.pid}`;
    daCancellare.add(slug);
    await pagina.fill('#durata-libera', '15');
    await pagina.dispatchEvent('#durata-libera', 'change');
    await pagina.click('#crea');
    await pagina.waitForSelector('#esito-nuovo .avviso');
    assert.match(await pagina.textContent('#esito-nuovo'), /Creato/);
    const {leggiCopione, confrontaTesto} = await import(`${K}/motore/copione.mjs`);
    assert.equal(confrontaTesto(testo, leggiCopione(fs.readFileSync(path.join(REELS, slug, 'copione.md'), 'utf8')).testoParlato), null);
    assert.equal(JSON.parse(fs.readFileSync(path.join(REELS, slug, 'impostazioni.json'), 'utf8')).durata, 15);

    await pagina.click('nav button[data-vista=reel]');
    const carta = pagina.locator('.reel', {hasText: slug});
    await carta.waitFor();
    const lavoro = async (bottone, atteso) => {
      await carta.locator(`button:has-text("${bottone}")`).click();
      await pagina.waitForFunction((t) => document.querySelector('#reg-titolo').textContent.startsWith(t) && !/ · \d+ s$/.test(document.querySelector('#reg-titolo').textContent), atteso, {timeout: 600000});
      const titolo = await pagina.textContent('#reg-titolo');
      assert.match(titolo, /fatto$/, `${bottone}: ${titolo}\n${(await pagina.textContent('#reg-testo')).trim().split('\n').slice(-5).join('\n')}`);
      await pagina.waitForTimeout(700);
    };
    await carta.locator('select[aria-label="Motore della voce"]').selectOption('stima');
    await lavoro('Genera la voce', 'Voce');
    await lavoro('Provini', 'Provini');
    await lavoro('Bozza veloce', 'Video di bozza');
    // "Ferma" durante il video finale
    await carta.locator('button:has-text("Video finale")').click();
    await pagina.waitForFunction(() => /fotogrammi/.test(document.querySelector('#reg-testo').textContent), null, {timeout: 120000});
    await pagina.click('#reg-ferma');
    await pagina.waitForFunction(() => /fermato$/.test(document.querySelector('#reg-titolo').textContent), null, {timeout: 30000});
    assert.doesNotMatch(await pagina.textContent('#reg-testo'), /Errore imprevisto/);
    // la verifica gira e scrive il rapporto (un reel appena creato non ha ancora le fonti: è giusto che non sia pronto)
    await carta.locator('button:has-text("Verifica")').click();
    await pagina.waitForFunction(() => /^Verifica/.test(document.querySelector('#reg-titolo').textContent) && !/ · \d+ s$/.test(document.querySelector('#reg-titolo').textContent), null, {timeout: 300000});
    const rapporto = fs.readFileSync(path.join(REELS, slug, 'verifica.md'), 'utf8');
    assert.match(rapporto, /✓ Il testo del reel è quello dato, parola per parola/);
    assert.match(rapporto, /✓ Durata .*chiesti 15/);
    // catalogo
    await pagina.click('nav button[data-vista=catalogo]');
    assert.ok((await pagina.locator('details.prompt').count()) > 5);
    assert.deepEqual(errori, []);
  } finally {
    await browser.close().catch(() => {});
    server.kill('SIGTERM');
  }
});

// ───────────────────────── fase 3 · dal testo al video con un comando ─────────────────────────

for (const argomento of ['salute', 'tecnologia', 'economia']) {
  await prova(`regista · ${argomento}: dal testo al video con un solo comando e nessun intervento`, () => {
    const slug = `zz-lente-testo-${argomento}-${process.pid}`;
    daCancellare.add(slug);
    const file = path.join(K, 'prove', 'sostegno', 'testi', `${argomento}.txt`);
    const r = kit(['fai', slug, `testo=${file}`, `Prova ${argomento}`, 'narratore=nessuno', 'voce=stima', 'bozza'], {attesa: 1500000});
    assert.equal(r.codice, 0, r.testo.split('\n').slice(-12).join('\n'));
    assert.match(r.testo, /Fatto: tutte le 8 tappe riuscite/);
    const dir = path.join(REELS, slug);
    // il testo detto è quello dato, parola per parola
    const dato = fs.readFileSync(file, 'utf8').split(/\s+/).filter(Boolean).join(' ');
    const parole = JSON.parse(fs.readFileSync(path.join(dir, 'parole.json'), 'utf8')).parole.map((p) => p.testo).join(' ');
    assert.equal(parole, dato);
    assert.ok(fs.readdirSync(dir).some((f) => f.endsWith('.mp4')), 'manca il video');
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'verifica.md'), 'utf8'), /✖/);
    // rilanciato, non rifà niente
    const di_nuovo = kit(['fai', slug, 'bozza']);
    assert.equal((di_nuovo.testo.match(/già fatta/g) ?? []).length, 8, di_nuovo.testo);
  });
}

cancella();
const falliti = esiti.filter((e) => !e.ok);
console.log(`\n${esiti.length - falliti.length} prove lente superate${falliti.length ? `, ${falliti.length} FALLITE` : ''}`);
process.exit(falliti.length ? 1 : 0);
