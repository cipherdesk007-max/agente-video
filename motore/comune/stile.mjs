// FMLAB Reel Kit — 2D o 3D? Un suggerimento ricavato dalle parole della richiesta.
// È solo un consiglio (lo mostrano il pannello e la richiesta per l'agente): la scelta "auto" la chiude
// l'agente dopo aver scritto il piano, seguendo le regole di FMLAB_AVVIA.md.
// Questo file viene usato sia dal motore (Node) sia dal pannello (browser): niente import.

const TRE_D = [
  // corpo e natura
  'corpo', 'cuore', 'cervello', 'organo', 'cellul', 'molecol', 'dna', 'protein', 'peptid', 'virus', 'batter', 'muscol', 'ossa', 'osso', 'polmon', 'dente', 'denti', 'occhio', 'sangue', 'neuron', 'fegato', 'pelle', 'intestin', 'farmac', 'pillol', 'vaccin',
  'body', 'heart', 'brain', 'organ', 'cell', 'molecul', 'protein', 'peptide', 'muscle', 'bone', 'lung', 'tooth', 'teeth', 'eye', 'blood', 'neuron', 'liver', 'skin', 'drug', 'pill', 'vaccine',
  // spazio e terra
  'pianet', 'terra', 'spazio', 'satellit', 'razzo', 'luna', 'sole', 'stell', 'galass', 'orbit', 'vulcan', 'ocean', 'montagn', 'terremot', 'atomo', 'atomi',
  'planet', 'earth', 'space', 'rocket', 'moon', 'sun', 'star', 'galaxy', 'volcano', 'mountain', 'earthquake', 'atom',
  // oggetti e macchine
  'motore', 'macchin', 'auto', 'aereo', 'treno', 'nave', 'edific', 'ponte', 'robot', 'chip', 'batteria', 'telefon', 'computer', 'turbina', 'ingranagg', 'pistone', 'freno', 'freni', 'cambio', 'ruota', 'gomm',
  'engine', 'machine', 'car', 'plane', 'train', 'ship', 'building', 'bridge', 'battery', 'phone', 'turbine', 'gear', 'piston', 'brake', 'wheel', 'tyre', 'tire',
];

const DUE_D = [
  'soldi', 'prezzo', 'prezzi', 'percentual', 'statistic', 'grafico', 'classific', 'storia', 'legge', 'regola', 'regole', 'tasse', 'mercato', 'inflazion', 'borsa', 'interess', 'mutuo', 'prestito', 'risparm', 'invest', 'stipend',
  'parola', 'parole', 'lingua', 'abitudin', 'psicolog', 'produttiv', 'consigli', 'errori', 'passi', 'lista', 'confront', 'trucchi', 'metodo', 'strategi', 'vendit', 'marketing', 'asta', 'aste', 'contratt', 'garanzia', 'sondagg',
  'money', 'price', 'percent', 'statistic', 'chart', 'ranking', 'history', 'law', 'rule', 'tax', 'market', 'inflation', 'stock', 'interest', 'loan', 'saving', 'invest', 'salary',
  'word', 'language', 'habit', 'psycholog', 'productiv', 'tips', 'mistakes', 'steps', 'list', 'compar', 'tricks', 'method', 'strateg', 'sales', 'auction', 'contract', 'warranty', 'survey',
];

function trovate(testo, radici) {
  const parole = testo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const esito = new Set();
  for (const p of parole) {
    for (const r of radici) {
      if (p === r || (r.length >= 4 && p.startsWith(r))) {
        esito.add(p);
        break;
      }
    }
  }
  return [...esito];
}

/**
 * @param {string} testo  la richiesta scritta per il reel
 * @returns {{stile: '2d' | '3d', parole: string[], certo: boolean}}
 */
export function suggerisciStile(testo) {
  const tre = trovate(String(testo ?? ''), TRE_D);
  const due = trovate(String(testo ?? ''), DUE_D);
  if (tre.length > due.length) return {stile: '3d', parole: tre.slice(0, 4), certo: tre.length - due.length >= 2 || due.length === 0};
  if (due.length > tre.length) return {stile: '2d', parole: due.slice(0, 4), certo: due.length - tre.length >= 2 || tre.length === 0};
  if (tre.length) return {stile: '3d', parole: tre.slice(0, 4), certo: false};
  return {stile: '2d', parole: [], certo: false};
}

export const DESCRIZIONI_STILE = {
  auto: 'Decide l\'agente in base all\'argomento: oggetti e luoghi veri in 3D, idee, numeri e confronti in 2D.',
  '2d': 'Grafica piatta: schemi, numeri grandi, icone, linee che si disegnano. La più chiara per idee, soldi, regole, confronti.',
  '3d': 'Oggetti con volume che ruotano, camera che gira loro attorno, profondità. La più forte per corpo, spazio, macchine, oggetti.',
};
