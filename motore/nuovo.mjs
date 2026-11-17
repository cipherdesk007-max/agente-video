// FMLAB Reel Kit — crea la cartella di un nuovo reel partendo da un modello.
//   npm run nuovo cuore-che-batte "Perché il cuore non si stanca mai"            (modello: spiegazione)
//   npm run nuovo errori-auto "3 errori quando compri un'auto usata" lista       (modello: lista)
//   npm run nuovo                                                                 elenco dei modelli
// Lo usa anche il pannello (npm run pannello), che in più scrive la richiesta per l'agente e le impostazioni.
import fs from 'node:fs';
import path from 'node:path';
import {CARTELLA_REELS, ErroreFmlab, RADICE, rel, slugValido} from './percorsi.mjs';
import {comandoVoce} from './voce.mjs';
import {copioneDaTesto} from './copione.mjs';
import {scriviJson} from './percorsi.mjs';

const CARTELLA_MODELLI = path.join(RADICE, 'motore', 'modelli');

/** I modelli di reel da cui si può partire: [{id, descrizione, stile?}]. */
export function elencoModelli() {
  if (!fs.existsSync(CARTELLA_MODELLI)) return [];
  return fs
    .readdirSync(CARTELLA_MODELLI, {withFileTypes: true})
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(CARTELLA_MODELLI, d.name, 'scene.tsx')))
    .map((d) => {
      let info = {};
      try {
        info = JSON.parse(fs.readFileSync(path.join(CARTELLA_MODELLI, d.name, 'modello.json'), 'utf8'));
      } catch {
        // modello senza descrizione
      }
      return {id: d.name, descrizione: info.descrizione ?? '', stile: info.stile ?? null};
    })
    .sort((a, b) => (a.id === 'spiegazione' ? -1 : b.id === 'spiegazione' ? 1 : a.id.localeCompare(b.id)));
}

/** "Perché il cuore non si stanca mai" → "perche-il-cuore-non-si-stanca-mai" (corto, senza accenti). */
export function nomeDaTitolo(titolo) {
  const base = String(titolo ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const parole = base.split('-').filter(Boolean);
  let slug = '';
  for (const p of parole) {
    if ((slug + '-' + p).length > 36) break;
    slug = slug ? `${slug}-${p}` : p;
  }
  return slug || 'reel';
}

/** Un nome libero: se "gps" esiste già propone "gps-2", "gps-3"… */
export function nomeLibero(slug) {
  let candidato = slug;
  for (let n = 2; fs.existsSync(path.join(CARTELLA_REELS, candidato)); n++) candidato = `${slug}-${n}`;
  return candidato;
}

/**
 * Crea la cartella del reel con i file di partenza e i tempi stimati.
 * @param {{lingua?: string, silenzioso?: boolean}} opzioni
 */
export async function creaReel(slug, titolo, opzioni = {}) {
  if (!slugValido(slug)) {
    throw new ErroreFmlab('Dai un nome corto al reel: solo lettere minuscole, numeri e trattini.\nEsempio: npm run nuovo cuore-che-batte "Perché il cuore non si stanca mai"');
  }
  const dir = path.join(CARTELLA_REELS, slug);
  if (fs.existsSync(dir)) throw new ErroreFmlab(`Il reel "${slug}" esiste già (${rel(dir)}).`);
  const lingua = (opzioni.lingua ?? 'it').toLowerCase();
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(lingua)) throw new ErroreFmlab(`"${lingua}" non è un codice di lingua valido (esempi: it, en, es, fr, de, pt).`);
  const nome = (titolo || slug.replace(/-/g, ' ')).trim();
  const modello = opzioni.modello ?? 'spiegazione';
  const modelli = elencoModelli();
  if (!modelli.some((m) => m.id === modello)) throw new ErroreFmlab(`Il modello "${modello}" non esiste. Modelli: ${modelli.map((m) => m.id).join(', ')}.`);
  // i file comuni (piano, fonti, didascalia) più copione e scene del modello scelto
  const sorgenti = [path.join(RADICE, 'motore', 'scheletro'), path.join(CARTELLA_MODELLI, modello)];
  fs.mkdirSync(dir, {recursive: true});
  for (const cartella of sorgenti) {
    for (const file of fs.readdirSync(cartella)) {
      if (file === 'modello.json') continue;
      let testo = fs.readFileSync(path.join(cartella, file), 'utf8').replaceAll('{{TITOLO}}', nome.replaceAll("'", '’'));
      if (file === 'copione.md') testo = testo.replace('<!-- lingua: it -->', `<!-- lingua: ${lingua} -->`);
      fs.writeFileSync(path.join(dir, file), testo);
    }
  }
  // il testo è già scritto (dal pannello, o con --testo): diventa il copione così com'è, in una scena sola, e una
  // copia intatta resta in testo.txt. Voce e verifica controllano che il copione continui a dire quelle parole.
  if (typeof opzioni.testo === 'string' && opzioni.testo.trim()) {
    const testo = opzioni.testo.replace(/\r\n?/g, '\n').trim();
    fs.writeFileSync(path.join(dir, 'testo.txt'), testo + '\n');
    fs.writeFileSync(path.join(dir, 'copione.md'), copioneDaTesto(testo, {titolo: nome, lingua}));
    const scritta = JSON.stringify(nome.replaceAll("'", '’'));
    fs.writeFileSync(
      path.join(dir, 'scene.tsx'),
      [
        '// Scena di partenza. Il testo è già nel copione, in una scena sola: dividilo con [scena:nome] e disegna qui',
        '// una scena per ogni nome (le scene pronte sono in SCHEDA.md; un esempio scritto a mano in reels/gps/scene.tsx).',
        "import {bloccoTitolo, definisciReel} from '../../libreria';",
        '',
        'export default definisciReel({',
        `  titolo: ${scritta},`,
        '  scene: {',
        `    testo: bloccoTitolo({titolo: ${scritta}}),`,
        '  },',
        '});',
        '',
      ].join('\n')
    );
  }
  // un modello pensato per uno stile (l'oggetto che gira è 3D) lo imposta subito, anche da riga di comando (B13)
  const stileModello = modelli.find((m) => m.id === modello)?.stile;
  if (stileModello && !opzioni.testo) scriviJson(path.join(dir, 'impostazioni.json'), {stile: stileModello});
  // tempi stimati subito, così foto e anteprima funzionano già
  const registro = console.log;
  if (opzioni.silenzioso) console.log = () => {};
  try {
    await comandoVoce(slug, ['stima']);
  } finally {
    console.log = registro;
  }
  return dir;
}

export async function comandoNuovo(slug, parole = []) {
  const modelli = elencoModelli();
  if (!slug) {
    console.log('\nUso:  npm run nuovo <nome> "Titolo del reel" [modello]\n\nModelli da cui partire:');
    for (const m of modelli) console.log(`  ${m.id.padEnd(13)} ${m.descrizione}`);
    console.log('');
    return;
  }
  // testo=<file> : il testo è già scritto. Le altre coppie chiave=valore sono scelte del reel (durata=60 narratore=nessuno regalo=mappa…)
  const coppie = parole.filter((p) => /^[a-zà]+=/i.test(p));
  const fileTesto = coppie.find((c) => c.toLowerCase().startsWith('testo='))?.slice(6);
  if (fileTesto !== undefined) {
    if (!fs.existsSync(fileTesto)) throw new ErroreFmlab(`Non trovo il file del testo: ${fileTesto}`);
    const testo = fs.readFileSync(fileTesto, 'utf8');
    const lingua = coppie.find((c) => c.toLowerCase().startsWith('lingua='))?.slice(7);
    const titolo = parole.filter((p) => !coppie.includes(p)).join(' ');
    const dir = await creaReel(slug, titolo, {testo, lingua, silenzioso: true});
    const scelte = coppie.filter((c) => !/^(testo|lingua)=/i.test(c));
    if (scelte.length) {
      const {comandoImposta} = await import('./impostazioni.mjs');
      const registro = console.log;
      console.log = () => {};
      try {
        await comandoImposta(slug, scelte);
      } finally {
        console.log = registro;
      }
    }
    console.log(`Creato il reel "${slug}" in ${rel(dir)} dal testo dato (${testo.trim().split(/\s+/).length} parole): testo.txt è la copia che non si tocca.`);
    console.log(`Prossimo passo:  npm run regia ${slug}   (il piano di regia di serie, da migliorare)   oppure tutto in una volta:  npm run fai ${slug}`);
    return;
  }
  // l'ultima parola, se è il nome di un modello, sceglie il modello
  const resto = [...parole];
  const modello = resto.length && modelli.some((m) => m.id === resto[resto.length - 1].toLowerCase()) ? resto.pop().toLowerCase() : 'spiegazione';
  const dir = await creaReel(slug, resto.join(' '), {modello});
  console.log(`Creato il reel "${slug}" in ${rel(dir)} dal modello "${modello}":`);
  console.log('  piano.md       il piano: per chi è, aggancio, scaletta');
  console.log('  copione.md     il testo da pronunciare, con [scena:…] e [segni]');
  console.log('  fonti.md       una riga per ogni numero o affermazione');
  console.log('  scene.tsx      le scene: già montate con le scene pronte, da riempire con il contenuto');
  console.log('  didascalia.md  il testo del post');
  console.log(`\nNarratore e stile:  npm run imposta ${slug}        (oppure dal pannello: npm run pannello)`);
  console.log(`Prossimi passi:     npm run anteprima ${slug}   ·   npm run foto ${slug}`);
}
