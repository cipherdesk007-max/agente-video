# FMLAB Reel Kit

Leggi `SCHEDA.md` (una pagina: basta per fare un reel), `stile/appunti.md` e le ultime voci di `diario.md`.
Prima di consegnare un piano: npm run giudica <reel>, e docs/OCCHIO.md dice cosa guardare.
`FMLAB_AVVIA.md` è il manuale completo: aprilo solo per il capitolo che ti serve.
`CATALOGO.md` elenca tutto quello che è già pronto (scene, oggetti 3D, grafici, icone): guardalo prima di disegnare.
La prima volta su un computer: `npm install`, poi `npm run collaudo` (se manca qualcosa lo dice, e dice come metterlo).
Prima di tutto, e dopo ogni passo: `npm run stato`. Accende la dashboard (chi ti guarda vede in diretta cosa fai) e
ti mostra le richieste scritte lì: falle in ordine e chiudi ognuna con `npm run richieste fatta <id>`.
Se il testo del reel è già scritto: non si tocca e non si scrive codice. `npm run fai <reel> testo=<file>`, poi si migliora
`piano.json` (primo capitolo di `SCHEDA.md`) e si rilancia `npm run fai <reel>`. Prima di ogni spesa ci si ferma e si chiede.
Le chiavi stanno solo nel file `.env` (pagina Chiavi della dashboard): non chiederle, non stamparle, non scriverle altrove.
Un reel è chiuso quando `npm run fai <reel>` arriva in fondo: il riuso parte da solo e scrive il diario. Se dice che un
pezzo scritto a mano può entrare in libreria, portacelo: `npm run riuso <reel>` dice come.
