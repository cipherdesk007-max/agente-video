// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoChiusura, bloccoLista, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({sopra: 'Attenzione', titolo: '3 errori che fanno quasi tutti', segno: 'sorpresa'}),
    elenco: bloccoLista({
      titolo: 'Gli errori',
      voci: [
        {testo: 'Il primo errore', segno: 'uno'},
        {testo: 'Il secondo errore', segno: 'due'},
        {testo: 'Quello che nessuno controlla', segno: 'tre'},
      ],
    }),
    chiusura: bloccoChiusura({parola: 'PAROLA', sotto: 'ti mando la lista completa', segno: 'commenta'}),
  },
});
