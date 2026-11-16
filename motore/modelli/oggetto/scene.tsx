// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoChiusura, bloccoNumero, bloccoOggetto, bloccoTitolo, definisciReel, fiala3d, ombra, rampa, stile} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({titolo: 'Dentro questa fiala', sotto: "c'è meno di quello che pensi", segno: 'sorpresa'}),
    // l'oggetto: una fiala che si riempie quando si parla del liquido. Cambiala con un altro modello 3D
    // (satellite3d, telefono3d, pillola3d…) o componine uno con scatola, cilindro, sfera (libreria/Tre.tsx).
    oggetto: bloccoOggetto({
      oggetti: (s) => [...ombra({pos: [0, -78, 0], raggio: 95}), ...fiala3d({liquido: stile.colori.luce, livello: 0.15 + 0.6 * rampa(s.dopo('liquido'), 0.9)})],
      etichette: [
        {testo: 'Liquido', punto: [0, -30, 42], segno: 'liquido'},
        {testo: 'Tappo', punto: [0, 110, 30], segno: 'tappo', colore: stile.colori.luce2},
        {testo: 'Principio attivo', punto: [20, -60, 40], segno: 'dose', colore: stile.colori.accento},
      ],
    }),
    quanto: bloccoNumero({valore: 5, unita: 'milligrammi', segno: 'numero', fonte: 'nome della fonte'}),
    chiusura: bloccoChiusura({parola: 'PAROLA', segno: 'commenta'}),
  },
});
