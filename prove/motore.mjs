// FMLAB Reel Kit — prove del motore: copione, tempi, sottotitoli, audio. Veloci, senza browser.
//   npm test
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const K = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {leggiCopione, tempiDaCaratteri, componiDati, stimaTempi, sillabe, riallinea} = await import(`${K}/motore/copione.mjs`);
const {impagina, creaSrt} = await import(`${K}/motore/comune/pagine.mjs`);
const {leggiWav, scriviWav, trattiDiVoce} = await import(`${K}/motore/wav.mjs`);
const {montaFrasi, scegliVoceMac, distribuisciFrase} = await import(`${K}/motore/voce.mjs`);
let n = 0;
const prova = (nome, f) => { f(); n++; console.log('  ok', nome); };
/** Come `prova`, per le prove che devono aspettare qualcosa (ffmpeg): va chiamata con await. */
const provaLunga = async (nome, f) => { await f(); n++; console.log('  ok', nome); };

prova('copione: segni, scene, enfasi, punteggiatura attaccata', () => {
  const c = leggiCopione(`<!-- lingua: it -->\n# Titolo\n> nota\n[scena:uno]\nIl *GPS*. Non [x]sa dove\n[scena:due] sei: [y]l'*orologio*, però — va.`);
  assert.deepEqual(c.parole.map((p) => p.testo), ['Il', 'GPS.', 'Non', 'sa', 'dove', 'sei:', "l'orologio,", 'però', '—', 'va.'].filter((t) => t !== '—').map((t) => (t === 'però' ? 'però—' : t)));
  assert.equal(c.parole[1].enfasi, true);
  assert.equal(c.parole[6].enfasi, true);
  assert.equal(c.parole[0].enfasi, false);
  assert.deepEqual(c.segni, {x: 3, y: 6});
  assert.deepEqual(c.scene, [{nome: 'uno', indice: 0}, {nome: 'due', indice: 5}]);
  assert.equal(c.parole[2].frase, 1);
  assert.equal(c.testoParlato.startsWith('Il GPS. Non sa'), true);
});
prova('copione: un segno scritto dentro una parola vale per quella parola', () => {
  const c = leggiCopione("con il coinvolgimento dell'[azienda]azienda che produce, e i [dopo]*dettagli*[fine], poi basta.");
  assert.deepEqual(c.parole.map((p) => p.testo).slice(3, 6), ["dell'azienda", 'che', 'produce,']);
  assert.deepEqual(c.segni, {azienda: 3, dopo: 8, fine: 9});
});
prova('copione: errori chiari', () => {
  assert.throws(() => leggiCopione('[a]uno [a]due'), /compare due volte/);
  assert.throws(() => leggiCopione('uno *due'), /asterisco/);
  assert.throws(() => leggiCopione('uno [fine]'), /non c'è nessuna parola/);
  assert.throws(() => leggiCopione('# solo titolo'), /vuoto/);
  assert.throws(() => leggiCopione('[scena:a b]x'), /non valido/);
});
prova('copione: senza scene ne crea una', () => {
  assert.deepEqual(leggiCopione('ciao mondo').scene, [{nome: 'unica', indice: 0}]);
});
prova('tempi da caratteri (formato ElevenLabs)', () => {
  const testo = 'Ciao, mondo bello.';
  const characters = testo.split('');
  const inizi = characters.map((_, i) => i * 0.1);
  const fini = characters.map((_, i) => i * 0.1 + 0.1);
  const t = tempiDaCaratteri(testo, {characters, character_start_times_seconds: inizi, character_end_times_seconds: fini});
  assert.equal(t.length, 3);
  assert.ok(Math.abs(t[0].inizio - 0) < 1e-9 && Math.abs(t[0].fine - 0.5) < 1e-9);
  assert.ok(Math.abs(t[1].inizio - 0.6) < 1e-9 && Math.abs(t[2].fine - 1.8) < 1e-9);
  assert.throws(() => tempiDaCaratteri('una due', {characters: ['u'], character_start_times_seconds: [0], character_end_times_seconds: [1]}), /parole/);
});
prova('componi dati: segni, scene, durata a fotogramma intero', () => {
  const c = leggiCopione('[scena:a]Uno [m]due tre. [scena:b]Quattro cinque.');
  const d = componiDati(c, stimaTempi(c.parole), {motore: 'stima', precisione: 'stimata', lingua: 'it'});
  assert.equal(d.scene.length, 2);
  assert.equal(d.scene[0].inizio, 0);
  assert.equal(d.scene[0].fine, d.scene[1].inizio);
  assert.equal(d.scene[1].fine, d.durata);
  assert.ok(Math.abs(d.durata * 30 - Math.round(d.durata * 30)) < 1e-6);
  assert.equal(d.segni.m, d.parole[1].inizio);
  for (let i = 1; i < d.parole.length; i++) assert.ok(d.parole[i].inizio >= d.parole[i - 1].fine - 1e-9);
  assert.ok(d.scene[1].inizio <= d.parole[3].inizio && d.scene[1].inizio >= d.parole[2].fine - 0.03);
});
prova('segni spostati senza toccare il testo: si riallinea senza rifare la voce', () => {
  const prima = leggiCopione('[scena:a]Uno [m]due tre. [scena:b]Quattro *cinque* sei.');
  const tempi = stimaTempi(prima.parole).map((t) => ({inizio: t.inizio * 1.3, fine: t.fine * 1.3})); // tempi "veri", non quelli stimati
  const dati = componiDati(prima, tempi, {motore: 'elevenlabs', precisione: 'parola', voce: 'voce.mp3', durataAudio: 9.9});
  assert.equal(riallinea(prima, dati), null); // niente è cambiato: non si tocca niente
  const dopo = leggiCopione('[scena:a]Uno due [m]tre. Quattro [scena:b]cinque [n]*sei*.');
  const nuovi = riallinea(dopo, dati);
  assert.deepEqual(nuovi.parole.map((p) => [p.inizio, p.fine]), dati.parole.map((p) => [p.inizio, p.fine])); // i tempi della voce restano quelli
  assert.equal(nuovi.segni.m, dati.parole[2].inizio);
  assert.equal(nuovi.segni.n, dati.parole[5].inizio);
  assert.equal(nuovi.scene[1].nome, 'b');
  assert.ok(nuovi.scene[1].inizio > dati.scene[1].inizio);
  assert.deepEqual([nuovi.parole[4].enfasi, nuovi.parole[5].enfasi], [undefined, true]);
  assert.deepEqual([nuovi.durata, nuovi.durataVoce, nuovi.voce, nuovi.motore], [dati.durata, dati.durataVoce, 'voce.mp3', 'elevenlabs']);
  assert.equal(riallinea(dopo, nuovi), null); // una volta riallineato è a posto
  assert.equal(riallinea(leggiCopione('Uno due tre quattro. Cinque sei.'), dati), null); // testo cambiato: serve la voce nuova
});
prova('sillabe e sigle', () => {
  assert.equal(sillabe('satelliti'), 4);
  assert.ok(sillabe('GPS') >= 3);
});
prova('sottotitoli: pagine e srt', () => {
  const c = leggiCopione('Il segnale viaggia alla velocità della *luce*: arriva in circa settanta millesimi di secondo.');
  const d = componiDati(c, stimaTempi(c.parole), {motore: 'stima', precisione: 'stimata'});
  const p = impagina(d.parole, {lingua: 'it'});
  assert.ok(p.length >= 3);
  assert.equal(p.flatMap((x) => x.indici).length, d.parole.length);
  for (const x of p) assert.ok(x.parole.map((w) => w.testo).join(' ').length <= 30);
  for (let i = 1; i < p.length; i++) assert.ok(p[i].mostraDa >= p[i - 1].mostraDa);
  assert.ok(!['della', 'di', 'in'].includes(p[0].parole.at(-1).testo.toLowerCase()), 'non chiude con una parola debole');
  const srt = creaSrt(d.parole);
  assert.match(srt, /^1\n00:00:00,250 --> /);
  const en = impagina(d.parole, {lingua: 'en', maiuscolo: true, punteggiatura: false});
  assert.equal(en[0].parole[0].testo, 'IL');
});
// ── WAV e voce "a frasi" (il percorso della voce del Mac), con un sintetizzatore finto ──
function finto(testo) {
  // ogni parola = un tono, ogni virgola = pausa lunga; in testa e in coda un po' di silenzio, più un blocco FLLR come fa macOS
  const f = 22050;
  const pezzi = [];
  const zitto = (s) => Buffer.alloc(Math.round(s * f) * 2);
  const tono = (s) => { const b = Buffer.alloc(Math.round(s * f) * 2); for (let i = 0; i < b.length / 2; i++) b.writeInt16LE(Math.round(Math.sin(i * 0.2) * 12000), i * 2); return b; };
  pezzi.push(zitto(0.08));
  for (const parola of testo.split(' ')) { pezzi.push(tono(0.05 * parola.length)); pezzi.push(zitto(/,$/.test(parola) ? 0.3 : 0.02)); }
  pezzi.push(zitto(0.2));
  const wav = scriviWav(Buffer.concat(pezzi), f, 1);
  const fllr = Buffer.alloc(8 + 20); fllr.write('FLLR', 0, 'ascii'); fllr.writeUInt32LE(20, 4);
  const conBlocco = Buffer.concat([wav.subarray(0, 36), fllr, wav.subarray(36)]);
  conBlocco.writeUInt32LE(conBlocco.length - 8, 4);
  return conBlocco;
}
prova('wav: lettura con blocco FLLR, tratti di voce', () => {
  const w = leggiWav(finto('uno due, tre'));
  assert.equal(w.frequenza, 22050);
  const tratti = trattiDiVoce(w);
  assert.equal(tratti.length, 2, 'due tratti separati dalla pausa della virgola');
  assert.ok(Math.abs(tratti[0][0] - 0.08) < 0.03);
});
prova('voce a frasi: tempi di ogni parola dentro l\'audio, virgole agganciate alle pause', () => {
  const c = leggiCopione('Sopra di te, a ventimila chilometri, volano i satelliti. Ognuno ripete due cose.');
  const {audio, tempi, durata} = montaFrasi(c, finto);
  const w = leggiWav(audio);
  assert.ok(Math.abs(w.durata - durata) < 0.02);
  assert.equal(tempi.length, c.parole.length);
  for (let i = 0; i < tempi.length; i++) {
    assert.ok(tempi[i].fine > tempi[i].inizio);
    if (i) assert.ok(tempi[i].inizio >= tempi[i - 1].inizio);
    assert.ok(tempi[i].fine <= w.durata + 0.01);
  }
  // "a" (dopo la prima virgola) deve cominciare dopo la pausa lunga: cioè dove ricomincia davvero il suono
  const tratti = trattiDiVoce(w);
  const dopoVirgola = tempi[3].inizio;
  assert.ok(tratti.some(([a]) => Math.abs(a - dopoVirgola) < 0.04), `la parola dopo la virgola parte a ${dopoVirgola.toFixed(2)}, tratti: ${JSON.stringify(tratti.map((t) => t.map((x) => +x.toFixed(2))))}`);
  // la seconda frase comincia dopo la pausa tra frasi
  assert.ok(tempi[9].inizio - tempi[8].fine > 0.25);
  const d = componiDati(c, tempi, {motore: 'mac', precisione: 'frase', voce: 'voce.wav', durataAudio: durata});
  assert.ok(d.durata > d.durataVoce);
});
prova('voce del Mac: scelta della voce per lingua', () => {
  const elenco = `Alice               it_IT    # Ciao! Mi chiamo Alice.\nDaniel              en_GB    # Hello! My name is Daniel.\nFederica (Premium)  it_IT    # Ciao! Mi chiamo Federica.\nSamantha            en_US    # Hello! My name is Samantha.\n`;
  assert.equal(scegliVoceMac(elenco, undefined, 'it'), 'Federica (Premium)');
  assert.equal(scegliVoceMac(elenco, 'alice', 'it'), 'Alice');
  assert.ok(['Daniel', 'Samantha'].includes(scegliVoceMac(elenco, undefined, 'en')));
  assert.throws(() => scegliVoceMac(elenco, undefined, 'de'), /nessuna voce/);
});
prova('distribuzione senza pause rilevate', () => {
  const t = distribuisciFrase(['uno,', 'due', 'tre.'], [[0.1, 1.1]], 1.2);
  assert.equal(t.length, 3);
  assert.ok(t[0].inizio >= 0.1 && t[2].fine <= 1.1 + 1e-9);
});
// la musica di sottofondo (serve ffmpeg: se su questo computer non c'è, la prova si salta e lo dice)
{
  const fs = await import('node:fs');
  const os = await import('node:os');
  const {trovaFfmpeg, esegui, argomentiAudio, volumeMedio, lufsMusica, infoMedia} = await import(`${K}/motore/ffmpeg.mjs`);
  let ff = null;
  try {
    ff = await trovaFfmpeg();
  } catch {
    console.log('  -- musica di sottofondo: prova saltata (ffmpeg non trovato)');
  }
  if (ff) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-musica-'));
    const onda = (secondi, hz, forza, quando = () => 1, frequenza = 24000) => {
      const dati = Buffer.alloc(Math.round(secondi * frequenza) * 2);
      for (let i = 0; i < dati.length / 2; i++) dati.writeInt16LE(Math.round(32767 * forza * quando(i / frequenza) * Math.sin((2 * Math.PI * hz * i) / frequenza)), i * 2);
      return scriviWav(dati, frequenza, 1);
    };
    // "voce": un suono basso che parla da 0 a 2,5 s e da 5 a 7 s, e tace in mezzo; "musica": un fischio alto, di soli 3 secondi
    fs.writeFileSync(path.join(dir, 'voce.wav'), onda(7, 220, 0.3, (t) => (t < 2.5 || t >= 5 ? 1 : 0)));
    fs.writeFileSync(path.join(dir, 'musica.wav'), onda(3, 1800, 0.5));
    const muto = path.join(dir, 'muto.mp4');
    await esegui(ff, ['-f', 'lavfi', '-i', 'color=c=black:s=160x284:r=30:d=8', '-an', '-pix_fmt', 'yuv420p', '-y', muto]);
    const fai = async (nome, cosa) => {
      const uscita = path.join(dir, nome);
      await esegui(ff, ['-i', muto, ...argomentiAudio({...cosa, durata: 8}), '-y', uscita]);
      return uscita;
    };
    const voce = path.join(dir, 'voce.wav');
    const musica = path.join(dir, 'musica.wav');
    const insieme = await fai('insieme.mp4', {voce, musica, volume: 30});
    const soloVoce = await fai('voce.mp4', {voce, musica, volume: 0});
    const soloMusica = await fai('musica.mp4', {musica, volume: 30});
    const zitto = await fai('zitto.mp4', {});
    const alta = 'highpass=f=1000';
    await prova('musica: più bassa della voce, si abbassa ancora mentre la voce parla, si ripete fino alla fine', () => {
      assert.equal(lufsMusica(30), -33.2);
      const parlato = volumeMedio(ff, insieme, 0.6, 1.6);
      const pausa = volumeMedio(ff, insieme, 3.3, 1.4);
      assert.ok(parlato > -22 && parlato < -8, `voce a ${parlato} dB`);
      assert.ok(pausa < parlato - 10 && pausa > -50, `nella pausa la musica è a ${pausa} dB (voce ${parlato})`);
      // solo le note alte (la musica): mentre la voce parla sono più basse che nella pausa
      const sotto = volumeMedio(ff, insieme, 0.9, 1.3, alta);
      const libera = volumeMedio(ff, insieme, 3.4, 1.3, alta);
      assert.ok(libera - sotto > 2.5, `la musica non si abbassa sotto la voce: ${sotto} dB contro ${libera} dB`);
      // la musica dura 3 secondi ma il video 8: a 7 secondi c'è ancora
      assert.ok(volumeMedio(ff, soloMusica, 6.2, 1.0) > -50);
      assert.ok(volumeMedio(ff, soloVoce, 3.3, 1.4) < -60, 'a volume zero la musica non deve esserci');
      assert.ok(volumeMedio(ff, zitto, 0, 8) < -80);
      for (const f of [insieme, soloVoce, soloMusica, zitto]) assert.equal(infoMedia(ff, f).audio?.hz, 48000);
    });
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

// il comando clip: un video diviso in fotogrammi per <Filmato> (serve ffmpeg, come sopra)
{
  const fs = await import('node:fs');
  const os = await import('node:os');
  const {trovaFfmpeg, esegui} = await import(`${K}/motore/ffmpeg.mjs`);
  let ff = null;
  try {
    ff = await trovaFfmpeg();
  } catch {
    console.log('  -- clip: prova saltata (ffmpeg non trovato)');
  }
  if (ff) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-clip-'));
    const video = path.join(dir, 'Registrazione Schermo.mp4');
    // una "registrazione dello schermo" di 2 secondi a 60 fotogrammi al secondo, alta e stretta come un telefono
    await esegui(ff, ['-f', 'lavfi', '-i', 'testsrc=s=540x1170:r=60:d=2', '-pix_fmt', 'yuv420p', '-y', video]);
    const {creaClip} = await import(`${K}/motore/clip.mjs`);
    await provaLunga('clip: un video diventa fotogrammi a 30 al secondo, non più larghi di quanto chiesto; se ne può prendere un pezzo', async () => {
      const {clip, cartella} = await creaClip({slug: 'prova', file: video, cartella: dir, larghezza: 360});
      assert.equal(clip.nome, 'registrazione-schermo');
      assert.ok(Math.abs(clip.fotogrammi - 60) <= 1, `${clip.fotogrammi} fotogrammi per 2 secondi`);
      assert.equal(clip.fps, 30);
      assert.deepEqual([clip.larghezza, clip.altezza], [360, 780]);
      const numerati = () => fs.readdirSync(cartella).filter((f) => /^\d{5}\.jpg$/.test(f)).sort();
      assert.equal(numerati().length, clip.fotogrammi);
      assert.equal(numerati()[0], '00001.jpg');
      assert.equal(JSON.parse(fs.readFileSync(path.join(cartella, 'clip.json'), 'utf8')).fotogrammi, clip.fotogrammi);
      // un pezzo solo, con lo stesso nome: i fotogrammi di prima spariscono
      const pezzo = await creaClip({slug: 'prova', file: video, cartella: dir, nome: 'registrazione-schermo', da: 0.5, durata: 1});
      assert.ok(Math.abs(pezzo.clip.fotogrammi - 30) <= 1, `${pezzo.clip.fotogrammi} fotogrammi per 1 secondo`);
      assert.equal(numerati().length, pezzo.clip.fotogrammi);
      assert.equal(pezzo.clip.larghezza, 540, 'non deve ingrandire oltre la larghezza del video');
      await assert.rejects(() => creaClip({slug: 'prova', file: 'non-esiste.mp4', cartella: dir}), /Non trovo il video/);
      await assert.rejects(() => creaClip({slug: 'prova', file: video, cartella: dir, da: 5}), /dura solo/);
    });
    await provaLunga('suoni: [suono:nome] nel copione mette l\'effetto sulla sua parola; nel video si sente lì e non altrove', async () => {
      const {leggiCopione, componiDati, riallinea} = await import(`${K}/motore/copione.mjs`);
      const {elencoSuoni, suoniDelReel, tracciaSuoni, DI_SERIE} = await import(`${K}/motore/suoni.mjs`);
      const {argomentiAudio, volumeMedio} = await import(`${K}/motore/ffmpeg.mjs`);
      const copione = leggiCopione('[scena:a]\nUno due [suono:pop][tre]tre quattro [suono:ding]cinque.');
      assert.deepEqual(copione.suoni, [{nome: 'pop', indice: 2}, {nome: 'ding', indice: 4}]);
      assert.equal(copione.testoParlato, 'Uno due tre quattro cinque.', 'i suoni non entrano nel testo letto dalla voce');
      const tempi = [0, 1, 2, 3, 4].map((i) => ({inizio: 0.5 + i, fine: 1.2 + i}));
      const dati = componiDati(copione, tempi, {motore: 'stima', precisione: 'stimata'});
      assert.deepEqual(dati.suoni, [{nome: 'pop', t: 2.5}, {nome: 'ding', t: 4.5}]);
      assert.equal(componiDati(leggiCopione('Uno due.'), tempi.slice(0, 2), {motore: 'stima', precisione: 'stimata'}).suoni, undefined);
      assert.throws(() => leggiCopione('Uno [suono:due parole] due.'), /nome di suono non valido/);
      // spostare un suono senza toccare il testo non chiede di rifare la voce
      const spostato = riallinea(leggiCopione('[scena:a]\nUno [suono:pop]due [tre]tre quattro [suono:ding]cinque.'), dati);
      assert.deepEqual(spostato.suoni, [{nome: 'pop', t: 1.5}, {nome: 'ding', t: 4.5}]);
      assert.equal(riallinea(copione, dati), null);
      // i suoni di serie ci sono tutti; uno che manca viene detto per nome
      const disponibili = elencoSuoni();
      for (const [nome] of DI_SERIE) assert.ok(disponibili[nome], `manca suoni/${nome}.wav (npm run suoni crea)`);
      assert.throws(() => suoniDelReel({suoni: [{nome: 'trombone', t: 1}]}, dir), /\[suono:trombone\]/);
      // nel video: silenzio prima, il pop a 2,5 s, silenzio in mezzo, il ding a 4,5 s
      const muto = path.join(dir, 'muto-suoni.mp4');
      await esegui(ff, ['-f', 'lavfi', '-i', 'color=c=black:s=160x284:r=30:d=7', '-an', '-pix_fmt', 'yuv420p', '-y', muto]);
      const traccia = await tracciaSuoni(ff, suoniDelReel(dati, dir), 7, path.join(dir, 'suoni.wav'));
      const video = path.join(dir, 'con-suoni.mp4');
      await esegui(ff, ['-i', muto, ...argomentiAudio({durata: 7, effetti: traccia}), '-y', video]);
      assert.ok(volumeMedio(ff, video, 0.5, 1.5) < -70, 'prima del pop deve esserci silenzio');
      assert.ok(volumeMedio(ff, video, 2.45, 0.15) > -35, `il pop non si sente a 2,5 s (${volumeMedio(ff, video, 2.45, 0.15)} dB)`);
      assert.ok(volumeMedio(ff, video, 3.2, 1.0) < -70, 'tra i due suoni deve esserci silenzio');
      assert.ok(volumeMedio(ff, video, 4.45, 0.4) > -35, 'il ding non si sente a 4,5 s');
    });
    await provaLunga('colori: nel video il bianco resta bianco, il nero nero e il grigio neutro', async () => {
      const {FILTRO_COLORE} = await import(`${K}/motore/ffmpeg.mjs`);
      for (const [colore, attesa] of [['white', 235], ['black', 16], ['gray', null]]) {
        const jpg = path.join(dir, `${colore}.jpg`);
        const grezzo = path.join(dir, `${colore}.yuv`);
        // un fotogramma come quelli che arrivano dal browser (JPEG), passato dallo stesso filtro del render
        await esegui(ff, ['-f', 'lavfi', '-i', `color=c=${colore}:s=64x64`, '-frames:v', '1', '-pix_fmt', 'yuvj420p', '-q:v', '2', '-y', jpg]);
        await esegui(ff, ['-i', jpg, '-vf', FILTRO_COLORE, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-y', grezzo]);
        const d = fs.readFileSync(grezzo);
        const media = (da, a) => d.subarray(da, a).reduce((s, x) => s + x, 0) / (a - da);
        const [y, cb, cr] = [media(0, 4096), media(4096, 5120), media(5120, 6144)];
        if (attesa !== null) assert.ok(Math.abs(y - attesa) <= 0.6, `${colore}: luminosità ${y.toFixed(1)}, attesa ${attesa}`);
        assert.ok(Math.abs(cb - 128) <= 0.6 && Math.abs(cr - 128) <= 0.6, `${colore}: ha preso una tinta (${cb.toFixed(1)}, ${cr.toFixed(1)} invece di 128, 128)`);
      }
    });
    fs.rmSync(dir, {recursive: true, force: true});
  }
}

// ───────────────────────── registro, coda, chiavi, diario (la dashboard) ─────────────────────────
{
  const fs = await import('node:fs');
  const os = await import('node:os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fmlab-registro-'));
  const prima = {...process.env};
  Object.assign(process.env, {FMLAB_REGISTRO: tmp, FMLAB_ENV: path.join(tmp, 'env'), FMLAB_DIARIO: path.join(tmp, 'diario.md')});
  const r = await import(`${K}/motore/registro.mjs`);
  const chiavi = await import(`${K}/motore/chiavi.mjs`);
  try {
    prova('registro: i fatti si rileggono in ordine, i crediti si sommano per reel, una chiave non ci finisce mai', () => {
      r.annota('inizio', {comando: 'fai', reel: 'uno'});
      r.annota('spesa', {reel: 'uno', caratteri: 100});
      r.annota('spesa', {reel: 'due', caratteri: 40});
      r.annota('spesa', {reel: 'uno', caratteri: 5});
      assert.deepEqual(r.leggiRegistro().map((f) => f.tipo), ['inizio', 'spesa', 'spesa', 'spesa']);
      assert.deepEqual(r.creditiSpesi(), {totale: 145, perReel: {uno: 105, due: 40}});
      assert.equal(r.senzaSegreti('voce sk_finta_0000000000000000 chiave=abc123 reel'), 'voce … chiave=… reel');
      assert.equal(r.leggiAdesso(), null);
      r.adesso({comando: 'render', reel: 'uno', percento: 12});
      assert.equal(r.leggiAdesso().percento, 12);
      r.adesso(null);
      assert.equal(r.leggiAdesso(), null);
    });
    prova('coda: una richiesta con i pulsanti porta il comando che la applica; nuova, vista, fatta; vuota non entra', () => {
      assert.throws(() => r.aggiungiRichiesta({reel: 'uno', testo: '  '}), /vuota/);
      const q = r.aggiungiRichiesta({reel: 'uno', testo: 'senza dottore', scelte: {narratore: 'nessuno', formato: '1:1; echo ciao'}});
      assert.equal(q.comando, 'npm run imposta uno narratore=nessuno formato=1:1echociao', 'i valori dei pulsanti non possono portare altri comandi');
      assert.equal(r.leggiCoda()[0].stato, 'nuova');
      assert.equal(r.segnaRichiesta(q.id, 'vista').stato, 'vista');
      assert.equal(r.segnaRichiesta(q.id, 'fatta').stato, 'fatta');
      assert.equal(r.segnaRichiesta('zzzzzz', 'fatta'), null);
    });
    prova('chiavi: si scrivono solo quelle dell\'elenco, su una riga; quelle segrete non tornano indietro; si tolgono', () => {
      fs.writeFileSync(process.env.FMLAB_ENV, '# mio\nALTRA=resta\n');
      chiavi.scriviChiave('ELEVENLABS_API_KEY', ' chiave-finta-123 ');
      chiavi.scriviChiave('ELEVENLABS_MODEL', 'eleven_v4');
      assert.equal(fs.readFileSync(process.env.FMLAB_ENV, 'utf8'), '# mio\nALTRA=resta\nELEVENLABS_API_KEY=chiave-finta-123\nELEVENLABS_MODEL=eleven_v4\n');
      const stato = Object.fromEntries(chiavi.statoChiavi().map((c) => [c.nome, c]));
      assert.deepEqual([stato.ELEVENLABS_API_KEY.presente, stato.ELEVENLABS_API_KEY.valore], [true, null]);
      assert.equal(stato.ELEVENLABS_MODEL.valore, 'eleven_v4');
      assert.equal(stato.HF_API_KEY_ID.presente, false);
      assert.throws(() => chiavi.scriviChiave('ALTRA', 'x'), /non è una delle righe/);
      assert.throws(() => chiavi.scriviChiave('ELEVENLABS_API_KEY', 'a\nB=1'), /una riga sola/);
      chiavi.scriviChiave('ELEVENLABS_API_KEY', '');
      assert.doesNotMatch(fs.readFileSync(process.env.FMLAB_ENV, 'utf8'), /ELEVENLABS_API_KEY/);
      assert.match(fs.readFileSync(process.env.FMLAB_ENV, 'utf8'), /ALTRA=resta/);
    });
    prova('diario: la voce più nuova sta in cima; lo stesso reel rifatto nello stesso giorno ha una voce sola', () => {
      r.scriviDiario('uno · 10 scene, 60 s', ['prima versione'], {chiave: 'uno'});
      r.scriviDiario('due · 8 scene, 45 s', ['un altro reel'], {chiave: 'due'});
      r.scriviDiario('uno · 11 scene, 62 s', ['seconda versione'], {chiave: 'uno'});
      const voci = r.leggiDiario();
      assert.deepEqual(voci.map((v) => v.titolo.replace(/^\S+ · /, '')), ['uno · 11 scene, 62 s', 'due · 8 scene, 45 s']);
      assert.deepEqual(voci[0].righe, ['seconda versione']);
    });
  } finally {
    for (const k of ['FMLAB_REGISTRO', 'FMLAB_ENV', 'FMLAB_DIARIO', 'ELEVENLABS_API_KEY', 'ELEVENLABS_MODEL']) {
      if (prima[k] === undefined) delete process.env[k];
      else process.env[k] = prima[k];
    }
    fs.rmSync(tmp, {recursive: true, force: true});
  }
}

console.log(`\n${n} prove superate`);
