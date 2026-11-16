// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoAnello, bloccoChiusura, bloccoConfronto, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({titolo: 'Sembrano uguali', sotto: 'ma una costa il doppio', segno: 'sorpresa'}),
    confronto: bloccoConfronto({
      titolo: 'A confronto',
      sinistra: {titolo: 'La prima', valore: 100, unita: 'euro', segno: 'prima'},
      destra: {titolo: 'La seconda', valore: 160, unita: 'euro', segno: 'seconda'},
      fonte: 'nome della fonte',
    }),
    quanto: bloccoAnello({valore: 60, etichetta: 'in più', segno: 'percento'}),
    chiusura: bloccoChiusura({parola: 'PAROLA', sotto: 'ti mando i conti', segno: 'commenta'}),
  },
});
