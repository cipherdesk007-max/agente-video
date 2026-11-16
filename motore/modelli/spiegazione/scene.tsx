// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoChiusura, bloccoNumero, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({sopra: 'Lo sapevi?', titolo: 'La frase che ferma il pollice', segno: 'sorpresa'}),
    numero: bloccoNumero({valore: 42, unita: 'unità di misura', segno: 'numero', nota: 'Perché conta', sottoNota: 'in tre parole', segnoNota: 'perche', fonte: 'nome della fonte'}),
    chiusura: bloccoChiusura({parola: 'PAROLA', segno: 'commenta'}),
  },
});
