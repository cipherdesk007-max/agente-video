// FMLAB Reel Kit — cerca un'icona tra quelle di react-icons, anche scrivendo in italiano.
//   npm run icone cuore            npm run icone orologio sveglia            npm run icone heart pulse
// Stampa i nomi trovati e la riga di import da copiare in scene.tsx. Non serve internet: legge i file installati.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {ErroreFmlab, RADICE} from './percorsi.mjs';

/** Le raccolte in cui cercare, in ordine di preferenza (le prime hanno lo stile più adatto ai reel). */
export const RACCOLTE = {
  fa6: 'Font Awesome 6',
  lu: 'Lucide',
  tb: 'Tabler',
  md: 'Material',
  pi: 'Phosphor',
  gi: 'Game Icons (corpo umano, oggetti, animali)',
  bs: 'Bootstrap',
  hi2: 'Heroicons',
  io5: 'Ionicons',
  ri: 'Remix',
};

/** Italiano → parole inglesi da cercare nei nomi delle icone. */
export const ITALIANO = {
  cuore: ['heart'], cervello: ['brain'], ginocchio: ['knee'], osso: ['bone'], ossa: ['bone'], scheletro: ['skeleton'], muscolo: ['muscle', 'biceps', 'dumbbell'],
  stomaco: ['stomach'], intestino: ['intestine'], polmoni: ['lungs'], polmone: ['lungs'], fegato: ['liver'], rene: ['kidney'], reni: ['kidney'], occhio: ['eye'], orecchio: ['ear'],
  dente: ['tooth'], denti: ['tooth'], mano: ['hand'], mani: ['hand'], piede: ['foot'], sangue: ['blood', 'droplet'], goccia: ['droplet', 'drop'], dna: ['dna'], virus: ['virus'], batterio: ['bacteria', 'bacterium'],
  pillola: ['pill'], pastiglia: ['pill', 'tablet'], capsula: ['capsule', 'pill'], siringa: ['syringe'], iniezione: ['syringe'], fiala: ['vial'], farmaco: ['pill', 'medicine', 'prescription'], medicina: ['medicine', 'medical'],
  medico: ['doctor', 'stethoscope'], dottore: ['doctor', 'stethoscope'], stetoscopio: ['stethoscope'], ospedale: ['hospital'], ambulanza: ['ambulance'], cerotto: ['bandage'], termometro: ['thermometer'],
  bilancia: ['scale', 'weight', 'balance'], peso: ['weight'], dieta: ['apple', 'salad', 'carrot'], cibo: ['food', 'utensils'], mela: ['apple'], acqua: ['water', 'droplet'], sonno: ['bed', 'sleep', 'moon'], letto: ['bed'],
  corsa: ['running'], sport: ['dumbbell', 'running'], palestra: ['dumbbell'], orologio: ['clock', 'watch'], tempo: ['clock', 'hourglass'], clessidra: ['hourglass'], sveglia: ['alarm'], calendario: ['calendar'],
  soldi: ['money', 'coins', 'euro'], denaro: ['money', 'coins'], euro: ['euro'], moneta: ['coin'], prezzo: ['tag', 'price'], sconto: ['percent', 'tag'], carrello: ['cart'], negozio: ['store', 'shop'], banca: ['bank'], carta: ['card'],
  auto: ['car'], macchina: ['car'], automobile: ['car'], chiave: ['key'], motore: ['engine'], benzina: ['gas', 'fuel'], ruota: ['tire', 'wheel'], strada: ['road'], camion: ['truck'], moto: ['motorcycle'], bici: ['bicycle', 'bike'],
  mappa: ['map'], posizione: ['location', 'pin'], bussola: ['compass'], casa: ['home', 'house'], telefono: ['phone', 'mobile'], computer: ['laptop', 'computer', 'desktop'], email: ['envelope', 'mail'], posta: ['envelope', 'mail'],
  messaggio: ['message', 'comment', 'chat'], commento: ['comment'], ricerca: ['search', 'magnifying'], lente: ['search', 'magnifying'], grafico: ['chart'], statistica: ['chart'], documento: ['file', 'document'], libro: ['book'],
  studio: ['book', 'graduation', 'flask'], scuola: ['school', 'graduation'], scienza: ['flask', 'atom', 'microscope', 'science'], laboratorio: ['flask', 'microscope', 'vial'], microscopio: ['microscope'], atomo: ['atom'], molecola: ['molecule', 'atom'],
  idea: ['lightbulb', 'bulb'], lampadina: ['lightbulb', 'bulb'], domanda: ['question'], attenzione: ['warning', 'exclamation', 'alert'], pericolo: ['skull', 'warning', 'hazard'], divieto: ['ban', 'forbidden'],
  spunta: ['check'], giusto: ['check'], errore: ['xmark', 'close'], sbagliato: ['xmark', 'close'], stella: ['star'], fuoco: ['fire', 'flame'], fulmine: ['bolt', 'lightning'], energia: ['bolt', 'battery'], batteria: ['battery'],
  luce: ['sun', 'lightbulb'], sole: ['sun'], luna: ['moon'], nuvola: ['cloud'], pioggia: ['rain'], neve: ['snow'], albero: ['tree'], foglia: ['leaf'], pianta: ['plant', 'seedling'], fiore: ['flower'],
  animale: ['paw'], cane: ['dog'], gatto: ['cat'], pesce: ['fish'], persona: ['user', 'person'], gruppo: ['users', 'people'], famiglia: ['family', 'people'], bambino: ['baby', 'child'], donna: ['woman', 'female'], uomo: ['man', 'male'],
  mondo: ['globe', 'earth'], terra: ['earth', 'globe'], bandiera: ['flag'], premio: ['trophy', 'award', 'medal'], coppa: ['trophy'], medaglia: ['medal'], razzo: ['rocket'], freccia: ['arrow'], satellite: ['satellite'],
  lucchetto: ['lock'], sicurezza: ['shield', 'lock'], scudo: ['shield'], foto: ['camera', 'image'], video: ['video', 'film'], musica: ['music'], microfono: ['microphone'], cuffie: ['headphones'], regalo: ['gift'],
  cestino: ['trash'], impostazioni: ['gear', 'settings'], ingranaggio: ['gear', 'cog'], strumenti: ['tools', 'wrench'], martello: ['hammer'], pennello: ['brush', 'paint'], bersaglio: ['bullseye', 'target'], occhiali: ['glasses'],
};

const senzaAccenti = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Dove sta react-icons su questo computer (null se non è installato). */
export function cartellaIcone() {
  try {
    // (il pacchetto non lascia leggere il suo package.json da fuori: si parte dal suo file principale)
    return path.dirname(createRequire(import.meta.url).resolve('react-icons'));
  } catch {
    const diretta = path.join(RADICE, 'node_modules', 'react-icons');
    return fs.existsSync(path.join(diretta, 'fa6', 'index.d.ts')) ? diretta : null;
  }
}

/** I nomi di tutte le icone di una raccolta. */
export function nomiRaccolta(cartella, raccolta) {
  const file = path.join(cartella, raccolta, 'index.d.ts');
  if (!fs.existsSync(file)) return [];
  return [...fs.readFileSync(file, 'utf8').matchAll(/export declare const (\w+): IconType/g)].map((m) => m[1]);
}

/** "FaHeartPulse" → ["heart", "pulse"] (senza la sigla della raccolta). */
export function pezziDelNome(nome) {
  const pezzi = nome.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').split(' ');
  return pezzi.slice(1).map((p) => p.toLowerCase());
}

/** Le parole da cercare davvero: quelle scritte, più le traduzioni di quelle italiane. */
export function paroleDaCercare(richieste) {
  const esito = new Set();
  for (const r of richieste) {
    const parola = senzaAccenti(r).replace(/[^a-z0-9]/g, '');
    if (!parola) continue;
    esito.add(parola);
    // plurali semplici: cuori → cuore, pillole → pillola
    const forme = [parola, parola.replace(/i$/, 'e'), parola.replace(/i$/, 'o'), parola.replace(/e$/, 'a'), parola.replace(/he$/, 'a'), parola.replace(/hi$/, 'o')];
    for (const f of forme) for (const inglese of ITALIANO[f] ?? []) esito.add(inglese);
  }
  return [...esito];
}

/** Cerca le icone: restituisce [{nome, raccolta, punti}] dalla più adatta. */
export function cercaIcone(richieste, {cartella = cartellaIcone(), quante = 36, raccolte = Object.keys(RACCOLTE)} = {}) {
  if (!cartella) return [];
  const parole = paroleDaCercare(richieste);
  const trovate = [];
  raccolte.forEach((raccolta, ordine) => {
    for (const nome of nomiRaccolta(cartella, raccolta)) {
      const pezzi = pezziDelNome(nome);
      let punti = 0;
      for (const p of parole) {
        if (pezzi.includes(p)) punti += 6;
        else if (pezzi.some((x) => x.startsWith(p) && p.length >= 3)) punti += 3;
        else if (p.length >= 4 && nome.toLowerCase().includes(p)) punti += 1;
      }
      if (punti > 0) trovate.push({nome, raccolta, punti: punti - pezzi.length * 0.4 - ordine * 0.3});
    }
  });
  trovate.sort((a, b) => b.punti - a.punti || a.nome.length - b.nome.length || a.nome.localeCompare(b.nome));
  // non più di otto per raccolta: così si vedono stili diversi
  const perRaccolta = {};
  return trovate.filter((t) => (perRaccolta[t.raccolta] = (perRaccolta[t.raccolta] ?? 0) + 1) <= 8).slice(0, quante);
}

/** npm run icone <parola> [altre parole] */
export async function comandoIcone(argomenti = []) {
  const cartella = cartellaIcone();
  if (!cartella) throw new ErroreFmlab('Le icone non sono installate. Lancia  npm install  nella cartella del kit e riprova.');
  if (!argomenti.length) {
    console.log('\nCerca un\'icona:  npm run icone cuore     npm run icone orologio sveglia     npm run icone heart pulse\n');
    console.log('Raccolte in cui cerco:');
    for (const [sigla, nome] of Object.entries(RACCOLTE)) console.log(`  react-icons/${sigla.padEnd(4)} ${nome}  (${nomiRaccolta(cartella, sigla).length} icone)`);
    console.log('\nParole italiane che conosco: ' + Object.keys(ITALIANO).join(', ') + '\n');
    return;
  }
  const trovate = cercaIcone(argomenti, {cartella});
  if (!trovate.length) {
    console.log(`\nNessuna icona per "${argomenti.join(' ')}". Prova con la parola in inglese (heart, clock, car…).\n`);
    return;
  }
  console.log(`\nIcone per "${argomenti.join(' ')}" (cercato: ${paroleDaCercare(argomenti).join(', ')}):\n`);
  const gruppi = {};
  for (const t of trovate) (gruppi[t.raccolta] ??= []).push(t.nome);
  for (const [raccolta, nomi] of Object.entries(gruppi)) {
    console.log(`  ${RACCOLTE[raccolta]}`);
    console.log(`    import {${nomi.join(', ')}} from 'react-icons/${raccolta}';`);
  }
  const prima = trovate[0];
  console.log(`\nNella scena:\n  import {${prima.nome}} from 'react-icons/${prima.raccolta}';\n  <Icona disegno={${prima.nome}} x={540} y={800} dimensione={220} da={s.dopo('segno')} />\n`);
}
