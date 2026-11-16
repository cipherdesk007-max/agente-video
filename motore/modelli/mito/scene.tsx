// REEL: {{TITOLO}}
// Fatto con le SCENE PRONTE (libreria/Blocchi.tsx): qui si scrive solo il contenuto.
// Ogni scena corrisponde a un [scena:nome] di copione.md; `segno` è il nome di un [segno] del copione.
// I testi possono essere una scritta ('ciao') oppure una per lingua ({it: 'ciao', en: 'hi'}).
// Chi fa il narratore e lo stile (2D o 3D) non si scrivono qui:  npm run imposta <reel>
// Se un blocco non basta, quella scena si scrive a mano: vedi reels/gps/scene.tsx.
import {bloccoChiusura, bloccoMito, bloccoNumero, bloccoTitolo, definisciReel} from '../../libreria';

export default definisciReel({
  titolo: '{{TITOLO}}',
  scene: {
    aggancio: bloccoTitolo({sopra: 'Falso', titolo: "Te l'hanno detto tutti", segno: 'sorpresa'}),
    mito: bloccoMito({mito: 'Quello che si dice in giro', verita: 'Come stanno le cose davvero', segnoMito: 'mito', segnoVerita: 'verita'}),
    prova: bloccoNumero({valore: 1000, unita: 'persone nello studio', segno: 'numero', fonte: 'nome dello studio'}),
    chiusura: bloccoChiusura({parola: 'PAROLA', sotto: 'ti mando lo studio', segno: 'commenta'}),
  },
});
