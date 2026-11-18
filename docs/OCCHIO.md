# L'occhio del regista: la pagella di un piano

Cosa deve avere un piano fatto bene. Ogni voce dice come si controlla. I numeri sono quelli che il kit usa nei suoi
controlli (`motore/piano.mjs`, `motore/verifica.mjs`, `motore/durata.mjs`, `riferimenti/misure.json`).
`npm run giudica <reel>` stampa questa pagella per un reel, senza render e senza voce.

**Il comando esce sempre con esito 0, anche con delle ✖.** "Il comando è passato" non vuol dire niente: contano le
righe. Ogni ✖ si sistema nel piano. Se non si può (per esempio viene dal testo della persona, che non si tocca), si
scrive nella consegna quale riga resta ✖ e perché.

| # | Cosa | Come si controlla |
|---|---|---|
| 1 | **Aggancio**: la prima frase ha meno di 12 parole. | Si conta in `copione.md`. `npm run verifica` avvisa quando la prima frase supera le 14. |
| 2 | **Un segno ogni 2-3 secondi**, mai più di 4 secondi senza un cambio sul palco. | `npm run piano <reel>`: avvisa a ogni tratto oltre 3,5 secondi senza novità e dice da quali parole comincia. |
| 3 | **Il numero arriva quando la voce lo pronuncia**: nella frase "è diminuito di circa due punti" un segno su "diminuito" (parte il movimento) e uno su "due" (il numero è arrivato). | Manuale, capitolo 5. `npm run giudica` conta le scene con un numero a schermo che hanno un segno su una cifra detta dalla voce. Poi si guarda nei provini: sul fotogramma della parola "due" il numero c'è già. |
| 4 | **Nessuna posa del narratore tenuta più di 4 secondi circa.** | `npm run giudica` la legge dalla scaletta delle pose, senza video. Sul video la misura `npm run confronta <reel>`: riga "Narratore: posa tenuta più a lungo", soglia 3,335 secondi (dai riferimenti). |
| 5 | **Rischio cartelli basso.** | `npm run piano <reel>`: "Rischio cartelli: N su 100 (basso)". Basso è sotto 35, alto da 60 in su: con il rischio alto il render non parte. Sotto elenca le voci che lo alzano. |
| 6 | **Durata entro 5 secondi da quella chiesta.** | `npm run verifica <reel>`: fuori dai 5 secondi è un errore. La durata chiesta è in `impostazioni.json`. |
| 7 | **Numeri in lettere nel testo; ogni numero a schermo con la sua riga in `fonti.md`.** | `npm run piano <reel>` avvisa per ogni numero a schermo senza riga; `npm run verifica` lo dà come errore. |
| 8 | **Un invito solo, per esteso, alla fine.** | Si legge l'ultima frase di `copione.md`: un "Commenta…" e nessun altro invito prima. `npm run giudica` conta le frasi che cominciano con un invito (Commenta, Segui, Salva, Manda…). |

## Tre domande prima di consegnare

Si dicono ad alta voce, guardando i provini e non il piano.

1. Se tolgo l'audio, da ogni scena si capisce di cosa si sta parlando? (Se la risposta è "c'è scritto", la scena è un cartello.)
2. In quale momento sul palco non cambia niente per più di tre secondi, e cosa ci metto?
3. Qual è la scena più debole, e perché la lascio così?
