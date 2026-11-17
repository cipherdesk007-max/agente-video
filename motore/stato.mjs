// FMLAB Reel Kit — lo stato di un reel in una schermata: cosa c'è, cosa manca, cosa fare adesso.
//   npm run stato            tutti i reel, una riga ciascuno
//   npm run stato gps        il dettaglio di un reel (scene, segni, voce, video, verifica)
// Serve a chi riprende un lavoro (persona o agente) per non dover riaprire tutti i file.
import fs from 'node:fs';
import path from 'node:path';
import {CARTELLA_REELS, elencoReel, leggiJson, rel, sec} from './percorsi.mjs';
import {altreLingue, apriReel} from './reel.mjs';
import {leggiCopione} from './copione.mjs';
import {leggiImpostazioni} from './impostazioni.mjs';

function riassunto(slug, variante = null) {
  const reel = apriReel(slug, variante);
  const esiste = (f) => fs.existsSync(f);
  const copione = leggiCopione(fs.readFileSync(reel.copione, 'utf8'));
  const dati = esiste(reel.parole) ? leggiJson(reel.parole) : null;
  const fileVerifica = path.join(reel.dir, `verifica${reel.suffisso}.md`);
  const verifica = esiste(fileVerifica) ? (/\*\*Esito: (.+?)\*\*/.exec(fs.readFileSync(fileVerifica, 'utf8'))?.[1] ?? '?') : null;
  const data = (f) => fs.statSync(f).mtimeMs;
  const prossimo = (() => {
    // un reel nato da un testo già scritto si porta avanti con il piano di regia: un comando solo riparte da dove serve
    if (esiste(path.join(reel.dir, 'testo.txt')) && !reel.suffisso) {
      if (!esiste(path.join(reel.dir, 'piano.json'))) return `npm run fai ${slug}   (il testo c'è: scrive il piano di regia di serie e i provini)`;
      const pronto = verifica && esiste(reel.video) && data(fileVerifica) >= data(reel.video) && !/NON PRONTO/.test(verifica) && data(path.join(reel.dir, 'piano.json')) < data(reel.video);
      if (!pronto) return `migliora piano.json (npm run piano ${slug}), poi  npm run fai ${slug}`;
    }
    if (!dati) return `npm run voce ${slug} stima`;
    if (dati.impronta !== copione.impronta) return `npm run voce ${slug}   (il copione è cambiato dopo la voce)`;
    if (dati.motore === 'stima') return `provini e scene; poi la voce vera: npm run voce ${slug}`;
    if (!esiste(reel.video)) return `npm run render ${slug}`;
    if ([reel.parole, reel.scene, path.join(reel.dir, 'impostazioni.json')].some((f) => esiste(f) && data(f) > data(reel.video) + 1000)) return `npm run render ${slug}   (il video è più vecchio delle ultime modifiche)`;
    if (!verifica || data(fileVerifica) < data(reel.video)) return `npm run verifica ${slug}`;
    return /NON PRONTO/.test(verifica) ? 'correggi gli errori scritti in verifica.md' : `pronto: controlla didascalia.md, poi porta in libreria quello che può riservire (npm run riuso ${slug})`;
  })();
  return {reel, copione, dati, verifica, prossimo};
}

/** In fondo a ogni stato: dov'è la dashboard (la accende, se serve) e cosa ha chiesto chi la guarda. */
async function pieDiStato() {
  const {leggiCoda, segnaRichiesta, stampaRichiesta} = await import('./registro.mjs');
  const {assicuraDashboard} = await import('./dashboard.mjs');
  const d = await assicuraDashboard().catch(() => null);
  if (d) console.log(`Dashboard: ${d.indirizzo}${d.nuova ? '   (accesa adesso: si apre nel browser)' : ''}`);
  const aperte = leggiCoda().filter((r) => r.stato !== 'fatta');
  if (aperte.length) {
    console.log(`\nRichieste dalla dashboard (${aperte.length}): falle in ordine; dopo ognuna  npm run richieste fatta <id>\n`);
    for (const r of aperte) {
      stampaRichiesta(r);
      if (r.stato === 'nuova') segnaRichiesta(r.id, 'vista');
    }
  }
  console.log('');
}

export async function comandoStato(slug) {
  if (!slug) {
    const tutti = elencoReel();
    if (!tutti.length) {
      console.log('\nNessun reel. Per crearne uno:  npm run nuovo   (oppure dalla dashboard)\n');
      return pieDiStato();
    }
    console.log('');
    for (const s of tutti) {
      const {dati, verifica, prossimo, reel} = riassunto(s);
      console.log(`  ${s.padEnd(34)} ${dati ? `${sec(dati.durata, 1).padStart(7)} · voce ${dati.motore}` : 'senza tempi'.padEnd(22)}${fs.existsSync(reel.video) ? ' · video' : ''}${verifica ? ` · ${verifica}` : ''}`);
      console.log(`  ${''.padEnd(34)} → ${prossimo}`);
    }
    console.log('');
    return pieDiStato();
  }
  const {reel, copione, dati, verifica, prossimo} = riassunto(slug);
  const imp = leggiImpostazioni(slug);
  const n = imp.narratore;
  console.log(`\n${slug}  ·  ${rel(reel.dir)}  ·  lingua ${reel.linguaBase}${altreLingue(slug).length ? ` (+ ${altreLingue(slug).join(', ')})` : ''}`);
  console.log(`narratore ${n.chi}${n.chi === 'nessuno' ? '' : ` ${n.grandezza}% a ${n.lato}`}  ·  stile ${imp.stile}  ·  voce ${imp.voce.motore}  ·  durata ${imp.durata ? `chiesta ${imp.durata} s` : 'libera'}`);
  console.log(`copione: ${copione.parole.length} parole, ${copione.scene.length} scene, ${Object.keys(copione.segni).length} segni`);
  if (dati) {
    console.log(`tempi: ${dati.motore} (${dati.precisione}), durata ${sec(dati.durata, 1)}${dati.velocita && dati.velocita !== 1 ? ` (voce a velocità ${String(dati.velocita).replace('.', ',')})` : ''}${imp.durata && Math.abs(dati.durata - imp.durata) > 5 ? `  ✖ chiesti ${imp.durata} s: fuori dai 5 secondi di scarto` : ''}${dati.impronta === copione.impronta ? '' : '  ⚠ il copione è cambiato dopo la voce'}`);
    for (const s of dati.scene) {
      const segni = Object.entries(dati.segni).filter(([, t]) => t >= s.inizio && t < s.fine).map(([nome, t]) => `${nome} ${t.toFixed(1)}`);
      console.log(`  ${s.nome.padEnd(12)} ${s.inizio.toFixed(1).padStart(5)} → ${s.fine.toFixed(1).padStart(5)}   ${segni.join(' · ')}`);
    }
  } else {
    console.log('tempi: non ancora generati');
  }
  const file = ['richiesta.md', 'piano.md', 'fonti.md', 'didascalia.md', `${slug}.mp4`, `provini${reel.suffisso}.jpg`].filter((f) => fs.existsSync(path.join(CARTELLA_REELS, slug, f)));
  console.log(`file: ${file.join(', ')}`);
  if (verifica) console.log(`verifica: ${verifica}`);
  console.log(`\nprossimo passo → ${prossimo}\n`);
  return pieDiStato();
}
