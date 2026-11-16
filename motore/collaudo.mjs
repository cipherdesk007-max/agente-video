// FMLAB Reel Kit — collaudo: controlla che su questo computer ci sia tutto e che il kit produca un video.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {elencoReel, leggiJson} from './percorsi.mjs';
import {apriReel} from './reel.mjs';
import {trovaBrowser} from './browser.mjs';
import {infoMedia, misuraTraccia, trovaFfmpeg} from './ffmpeg.mjs';
import {rendi} from './render.mjs';
import {scegliVoceMac} from './voce.mjs';
import {CARTELLA_PERSONAGGI, leggiPersonaggi} from './personaggio.mjs';
import {impostazioniKit, leggiImpostazioni} from './impostazioni.mjs';

export async function comandoCollaudo() {
  let problemi = 0;
  const ok = (t) => console.log(`  ✓ ${t}`);
  const no = (t, come) => {
    problemi++;
    console.log(`  ✖ ${t}\n      ${come}`);
  };
  const nota = (t) => console.log(`  · ${t}`);

  console.log('\nCollaudo FMLAB Reel Kit\n');
  const versione = Number(process.versions.node.split('.')[0]);
  if (versione >= 20) ok(`Node.js ${process.versions.node}`);
  else no(`Node.js ${process.versions.node} è troppo vecchio`, 'Installa la versione LTS da https://nodejs.org e riprova.');

  for (const pacchetto of ['esbuild', 'playwright-core', 'react', 'react-dom']) {
    try {
      await import(pacchetto);
    } catch {
      no(`Manca il pacchetto "${pacchetto}"`, 'Esegui  npm install  nella cartella del kit.');
    }
  }
  if (!problemi) ok('Pacchetti installati');

  let browser = null;
  try {
    browser = trovaBrowser();
    ok(`Browser: ${browser}`);
  } catch (e) {
    no('Nessun browser trovato', e.message.split('\n').slice(1).join('\n      '));
  }

  let ff = null;
  try {
    ff = await trovaFfmpeg();
    ok(`ffmpeg: ${ff.percorso}${ff.x264 ? '' : ' (codifica con VideoToolbox)'}`);
  } catch (e) {
    no('ffmpeg non trovato', e.message.split('\n').slice(1).join('\n      '));
  }

  // voce: cosa è disponibile
  if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) ok('Voce ElevenLabs: chiave e voce presenti nel file .env');
  else nota('Voce ElevenLabs: non configurata (copia .env.esempio in .env e inserisci chiave e voce)');
  if (process.platform === 'darwin') {
    try {
      const elenco = spawnSync('say', ['-v', '?'], {encoding: 'utf8'}).stdout;
      ok(`Voce del Mac disponibile: ${scegliVoceMac(elenco, undefined, 'it')}`);
    } catch (e) {
      nota(`Voce del Mac: ${e.message.split('\n')[0]}`);
    }
  }

  // narratori: le cartelle sono complete e le scelte di partenza puntano a un narratore che esiste?
  try {
    const personaggi = leggiPersonaggi();
    const mancanti = [];
    for (const p of Object.values(personaggi)) {
      if (p.tipo !== 'pupazzo') continue;
      // l'immagine, i pezzi di bocca e occhi, i livelli e le pose disegnate
      const livelli = p.corpo ? [p.corpo, ...(p.livelli ?? []).map((x) => x.file).filter(Boolean)] : [];
      for (const file of [p.immagine, ...Object.values(p.pezzi ?? {}).map((x) => x.file), ...livelli, ...Object.values(p.disegni ?? {}).map((x) => x.file).filter(Boolean)]) {
        if (!fs.existsSync(path.join(CARTELLA_PERSONAGGI, p.id, file))) mancanti.push(`personaggi/${p.id}/${file}`);
      }
    }
    for (const p of Object.values(personaggi)) {
      for (const d of Object.values(p.disegni ?? {})) if (d.personaggio && !personaggi[d.personaggio]) mancanti.push(`personaggi/${d.personaggio}/ (la figura di una posa di "${p.id}")`);
    }
    if (mancanti.length) no(`Mancano dei file dei narratori: ${mancanti.join(', ')}`, 'Ricreali con  npm run personaggio  (vedi personaggi/COME-FARE.md).');
    else {
      const scelte = impostazioniKit(personaggi);
      for (const slug of elencoReel()) leggiImpostazioni(slug, personaggi);
      const narratori = Object.keys(personaggi).filter((k) => !personaggi[k].figuraDi);
      const figure = Object.keys(personaggi).filter((k) => personaggi[k].figuraDi);
      ok(`Narratori: ${narratori.join(', ') || '(nessuno)'}${figure.length ? `  ·  pose disegnate: ${figure.join(', ')}` : ''}  ·  di serie: ${scelte.narratore.chi}, stile ${scelte.stile}`);
    }
  } catch (e) {
    no('Narratori o impostazioni non a posto', String(e.message).split('\n').join('\n      '));
  }

  // i narratori con parti ritagliate su livelli: a riposo devono essere identici alla loro immagine
  if (browser && !problemi) {
    try {
      const {confrontaRiposo} = await import('./foto.mjs');
      for (const p of Object.values(leggiPersonaggi())) {
        const esito = await confrontaRiposo(p.id);
        if (!esito) continue;
        if (esito.media < 0.6 && esito.diversi < 0.002) ok(`Narratore "${p.id}": a riposo è identico alla sua immagine (i livelli combaciano)`);
        else no(`Narratore "${p.id}": a riposo non combacia con la sua immagine`, `Differenza media ${esito.media.toFixed(2)} su 255, ${(esito.diversi * 100).toFixed(2)}% di pixel diversi. Rifai i livelli:  npm run personaggio livello ${p.id}`);
      }
    } catch (e) {
      no('Il controllo dei livelli dei narratori non è riuscito', String(e.message).split('\n').slice(0, 3).join('\n      '));
    }
  }

  // la libreria: tutte le scene pronte, gli oggetti 3D, i grafici e le icone si disegnano senza errori
  if (browser && !problemi) {
    const foglio = path.join(os.tmpdir(), `fmlab-catalogo-${process.pid}.jpg`);
    try {
      const {catalogo} = await import('./foto.mjs');
      const {nomi} = await catalogo(foglio);
      ok(`Libreria: ${nomi.length} pezzi del catalogo disegnati senza errori (scene pronte, oggetti 3D, grafici, icone)`);
    } catch (e) {
      no('Un pezzo della libreria non si disegna', String(e.message).split('\n').slice(0, 4).join('\n      ') + '\n      Se mancano d3, react-icons o roughjs:  npm install');
    } finally {
      fs.rmSync(foglio, {force: true});
    }
  }

  // prova vera: un secondo di video dal primo reel disponibile
  const reel = elencoReel().includes('gps') ? 'gps' : elencoReel()[0];
  if (browser && ff && reel && !problemi) {
    const info = apriReel(reel);
    if (!fs.existsSync(info.parole)) {
      nota(`Il reel "${reel}" non ha ancora i tempi: lancia  npm run voce ${reel} stima`);
    } else {
      const dati = leggiJson(info.parole);
      const uscita = path.join(os.tmpdir(), `fmlab-collaudo-${process.pid}.mp4`);
      try {
        const da = Math.min(Math.round(dati.fps * 2), Math.max(0, Math.round(dati.durata * dati.fps) - 31));
        await rendi(reel, null, {bozza: true, da, a: da + 30, uscita, silenzioso: true});
        const media = infoMedia(ff, uscita);
        const traccia = misuraTraccia(ff, uscita, 'v');
        if (media.video?.larghezza === 540 && media.video?.altezza === 960 && traccia?.fotogrammi === 30) {
          ok(`Render di prova riuscito (30 fotogrammi del reel "${reel}", ${media.video.codec})`);
        } else {
          no('Il render di prova ha prodotto un file inatteso', `${media.video?.riga ?? 'nessuna traccia video'} · fotogrammi: ${traccia?.fotogrammi}`);
        }
      } catch (e) {
        no('Il render di prova non è riuscito', String(e.message).split('\n').slice(0, 4).join('\n      '));
      } finally {
        fs.rmSync(uscita, {force: true});
      }
    }
  }

  if (problemi) {
    console.log(`\n${problemi} ${problemi === 1 ? 'cosa' : 'cose'} da sistemare prima di usare il kit.\n`);
    process.exitCode = 1;
  } else {
    console.log('\nTUTTO OK: il kit funziona su questo computer.');
    console.log(`Prova subito:  npm run pannello   (oppure  npm run anteprima ${reel ?? ''}  ·  npm run render ${reel ?? '<reel>'})\n`);
  }
  return problemi === 0;
}
