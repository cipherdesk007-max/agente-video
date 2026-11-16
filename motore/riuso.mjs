// FMLAB Reel Kit — RIUSO: a fine reel, cosa è stato scritto a mano e può entrare in libreria.
// Ogni pezzo portato in libreria è un pezzo che il prossimo reel non deve riscrivere: meno lavoro, meno crediti.
//
//   npm run riuso <reel>      elenco dei pezzi scritti a mano in scene.tsx, dal più lungo
//   npm run riuso             una riga per reel
import fs from 'node:fs';
import path from 'node:path';
import {RADICE, elencoReel, rel} from './percorsi.mjs';
import {apriReel} from './reel.mjs';

/** Forme della libreria con cui si costruisce un oggetto 3D: chi le usa, senza disegnare altro, è un oggetto. */
const FORME = /\b(scatola|cilindro|sfera|capsula|anello|estrusione|gruppo|piano|linea3d|griglia)\(/;
const DISEGNA = /<[A-Za-z]|useScena\(|useTempo\(/;

/** Dove finisce il blocco che comincia alla prima graffa (o tonda) aperta da `inizio` in poi. */
function fineBlocco(testo, inizio) {
  let profondita = 0;
  let aperto = false;
  for (let i = inizio; i < testo.length; i++) {
    const c = testo[i];
    if (c === '{' || c === '(' || c === '[') {
      profondita++;
      aperto = true;
    } else if (c === '}' || c === ')' || c === ']') {
      profondita--;
      if (aperto && profondita === 0 && c === '}') return i + 1;
    } else if (aperto && profondita === 0 && c === '\n') {
      return i; // una funzione a freccia scritta su una riga sola
    }
  }
  return testo.length;
}

/** Tutto quello che la libreria esporta già, con il file in cui sta. */
export function nomiDellaLibreria() {
  const dir = path.join(RADICE, 'libreria');
  const nomi = new Map();
  for (const f of fs.readdirSync(dir).filter((x) => /\.tsx?$/.test(x))) {
    const testo = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of testo.matchAll(/^export (?:function|const) (\w+)/gm)) nomi.set(m[1], f);
  }
  return nomi;
}

/**
 * Legge scene.tsx e dice cosa è scritto a mano: scene, pezzi (componenti usati dalle scene) e oggetti 3D.
 * Per ognuno: quante righe è lungo, se è una scena del reel, e se in libreria c'è già qualcosa di simile.
 */
export function analizzaRiuso(testo, libreria = nomiDellaLibreria()) {
  const righeFino = (i) => testo.slice(0, i).split('\n').length;
  const dichiarazioni = [...testo.matchAll(/^(?:export )?(?:function (\w+)\s*\(|const (\w+)\s*=\s*(?:\([^\n]*?\)|\w+)\s*(?::[^=\n]+)?=>)/gm)];
  // quali componenti sono le scene del reel:  nome: Componente  oppure  nome: {componente: Componente, …}
  const corpo = /scene:\s*\{([\s\S]*)\}\s*,?\s*\}\s*\)\s*;?\s*$/.exec(testo)?.[1] ?? '';
  const scene = new Set([...corpo.matchAll(/componente:\s*(\w+)|^\s*\w+:\s*([A-Z]\w*)\s*,?\s*$/gm)].map((m) => m[1] ?? m[2]));
  const pronte = [...corpo.matchAll(/\b(blocco[A-Z]\w*)\(/g)].map((m) => m[1]);
  const quanteScene = [...corpo.matchAll(/^\s{4}(\w+):/gm)].length;
  const pezzi = [];
  for (const m of dichiarazioni) {
    const nome = m[1] ?? m[2];
    if (/^use[A-Z]/.test(nome)) continue; // i ganci (useTesti…) sono di quel reel
    const fine = fineBlocco(testo, m.index);
    const codice = testo.slice(m.index, fine);
    const righe = codice.split('\n').length;
    const maiuscola = /^[A-Z]/.test(nome);
    const tipo = scene.has(nome) ? 'scena' : !maiuscola && FORME.test(codice) && !DISEGNA.test(codice) ? 'oggetto 3D' : maiuscola ? 'pezzo' : 'attrezzo';
    if (tipo === 'attrezzo' && righe < 4) continue;
    // c'è già qualcosa con un nome simile? (Ginocchio → ginocchio3d, Barra → barre3d / GraficoClassifica no)
    const base = nome.toLowerCase().replace(/3d$/, '');
    const simile = [...libreria.keys()].find((n) => {
      const x = n.toLowerCase().replace(/^blocco/, '').replace(/3d$/, '');
      return x === base || (base.length >= 5 && (x.startsWith(base) || base.startsWith(x)) && x.length >= 5);
    });
    pezzi.push({nome, tipo, righe, riga: righeFino(m.index), simile: simile ?? null});
  }
  pezzi.sort((a, b) => b.righe - a.righe);
  const aMano = pezzi.filter((p) => p.tipo === 'scena').length;
  return {scene: quanteScene, pronte: [...new Set(pronte)], aMano, pezzi, righe: testo.split('\n').length};
}

const DOVE = {
  scena: 'libreria/Blocchi.tsx, come bloccoNome({…}) con i testi e i segni passati da fuori',
  pezzo: 'libreria/ (Testi, Oggetti, Grafici: dove sta meglio), con le misure passate da fuori',
  'oggetto 3D': 'libreria/Modelli.ts, come nome3d({…})',
  attrezzo: 'libreria/anim.ts, se serve anche altrove',
};

export async function comandoRiuso(slug) {
  if (!slug) {
    const lista = elencoReel();
    console.log('\nRiuso: quanto di ogni reel è scritto a mano\n');
    for (const s of lista) {
      const r = analizzaRiuso(fs.readFileSync(apriReel(s).scene, 'utf8'));
      console.log(`  ${s.padEnd(28)} ${String(r.scene).padStart(2)} scene · ${r.pronte.length ? `${r.scene - r.aMano} con le scene pronte` : 'nessuna scena pronta'} · ${r.pezzi.length} pezzi a mano (${r.pezzi.reduce((n, p) => n + p.righe, 0)} righe)`);
    }
    console.log(`\nIl dettaglio di uno:  npm run riuso ${lista[0] ?? '<reel>'}\n`);
    return;
  }
  const reel = apriReel(slug);
  const r = analizzaRiuso(fs.readFileSync(reel.scene, 'utf8'));
  console.log(`\nRiuso · ${slug}   (${rel(reel.scene)}, ${r.righe} righe)\n`);
  console.log(`  Scene: ${r.scene} · fatte con le scene pronte: ${r.scene - r.aMano}${r.pronte.length ? ` (${r.pronte.join(', ')})` : ''} · scritte a mano: ${r.aMano}`);
  if (!r.pezzi.length) {
    console.log('\n  Niente di scritto a mano: questo reel usa solo pezzi della libreria. Non c\'è niente da portarci.\n');
    return r;
  }
  console.log('\n  Scritto a mano in questo reel, dal più lungo (più è lungo, più lavoro risparmia la prossima volta):\n');
  for (const p of r.pezzi) {
    console.log(`    ${p.nome.padEnd(16)} ${p.tipo.padEnd(11)} ${String(p.righe).padStart(4)} righe   riga ${String(p.riga).padEnd(5)}${p.simile ? `in libreria c'è già ${p.simile}: usalo, o allargalo` : ''}`);
  }
  console.log(`
  Per ogni pezzo chiediti: "servirà in un altro reel?" Se sì:
    1. spostalo in libreria, togliendo quello che vale solo per questo reel (testi, numeri, colori diventano opzioni):`);
  for (const tipo of [...new Set(r.pezzi.map((p) => p.tipo))]) console.log(`         ${tipo.padEnd(11)} → ${DOVE[tipo]}`);
  console.log(`    2. in scene.tsx usa il pezzo della libreria al posto di quello scritto a mano, e rifai i provini: devono essere uguali;
    3. disegnalo in motore/web/catalogo.tsx e spiegalo in CATALOGO.md (npm test controlla che ci sia);
    4. npm run catalogo  ·  npm test
    5. una riga in stile/appunti.md su cosa hai imparato facendo questo reel.
  Se un pezzo vale solo per questo reel (una metafora, una battuta) lascialo dov'è: la libreria non è un magazzino.
`);
  return r;
}
