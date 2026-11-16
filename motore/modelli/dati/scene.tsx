// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoAnello, bloccoBarre, bloccoChiusura, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({sopra: 'I dati', titolo: 'I numeri dicono il contrario', segno: 'sorpresa'}),
    grafico: bloccoBarre({
      titolo: 'Che cosa si misura',
      unita: 'unità',
      dati: [
        {etichetta: 'Primo', valore: 12, segno: 'a'},
        {etichetta: 'Secondo', valore: 31, segno: 'b'},
        {etichetta: 'Terzo', valore: 70, segno: 'c'},
      ],
      fonte: 'nome della fonte',
    }),
    quanto: bloccoAnello({valore: 70, etichetta: 'del totale', segno: 'percento'}),
    chiusura: bloccoChiusura({parola: 'PAROLA', sotto: 'ti mando i dati', segno: 'commenta'}),
  },
});
