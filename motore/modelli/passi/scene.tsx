// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoChiusura, bloccoPassi, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({titolo: 'Come funziona davvero', segno: 'sorpresa'}),
    passi: bloccoPassi({
      titolo: 'In tre passi',
      passi: [
        {testo: 'Prima succede questo', segno: 'uno'},
        {testo: 'Poi il secondo passaggio', segno: 'due'},
        {testo: 'Alla fine il risultato', segno: 'tre'},
      ],
    }),
    chiusura: bloccoChiusura({parola: 'PAROLA', sotto: 'ti mando la spiegazione', segno: 'commenta'}),
  },
});
