# Illustrazioni da generare per `reta-testo`

Sette soggetti. Oggi il reel li disegna il kit (ginocchio, stomaco, riflettori, foglio, scale, e un'icona per le
persone); ognuno di questi può essere sostituito da un'illustrazione generata, senza toccare altro. Quadrante e
batteria restano disegnati dal kit: hanno una lancetta e delle tacche che si muovono, un'immagine ferma non può.

**Niente è stato generato e niente è stato speso.** I comandi vanno lanciati sul Mac, con le chiavi nel `.env`
(`FMLAB_IMMAGINI=higgsfield`, `HF_API_KEY_ID`, `HF_API_KEY_SECRET`). Lo stile aggiunto a ogni soggetto è quello di
`stile/immagini.json` (spiegato in `stile/FOGLIO_IMMAGINI.md`).

| # | Soggetto (è il testo del comando) | Scene | Prende il posto di |
|---|---|---|---|
| 1 | un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno verde lime, la linea dell'articolazione che brilla | aggancio, conclusione | ginocchio "Reta" |
| 2 | un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno grigio-bianco, la linea dell'articolazione che brilla | aggancio, conclusione | ginocchio "Placebo" |
| 3 | un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno ambra, l'articolazione rossa e infiammata | amico | ginocchio "A quell'amico" |
| 4 | la pagina di un articolo scientifico, bianca, leggermente inclinata, con un titolo scuro, righe grigie e una riga evidenziata in verde lime, senza parole leggibili | studi, azienda | foglio |
| 5 | un gruppo fitto di sagome di persone viste di fronte, a mezzo busto, tutte uguali, azzurre e luminose | studi | icona delle persone |
| 6 | un piccolo palco da concerto visto di fronte, con un'asta del microfono e una chitarra, tre fari dall'alto con i coni di luce verde lime | applauso | riflettori |
| 7 | uno stomaco umano al neon rosso, con le pieghe interne, visto di fronte | rischi | stomaco |

Poi la scala di gradini della scena "amico" resta disegnata: i gradini si accendono uno alla volta.

## Comandi (uno per soggetto, nell'ordine della tabella)

```
npm run immagine reta-testo "un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno verde lime, la linea dell'articolazione che brilla"
npm run immagine reta-testo "un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno grigio-bianco, la linea dell'articolazione che brilla"
npm run immagine reta-testo "un ginocchio umano visto di fronte, femore sopra e tibia sotto, ossa di vetro satinato con il contorno ambra, l'articolazione rossa e infiammata"
npm run immagine reta-testo "la pagina di un articolo scientifico, bianca, leggermente inclinata, con un titolo scuro, righe grigie e una riga evidenziata in verde lime, senza parole leggibili"
npm run immagine reta-testo "un gruppo fitto di sagome di persone viste di fronte, a mezzo busto, tutte uguali, azzurre e luminose"
npm run immagine reta-testo "un piccolo palco da concerto visto di fronte, con un'asta del microfono e una chitarra, tre fari dall'alto con i coni di luce verde lime"
npm run immagine reta-testo "uno stomaco umano al neon rosso, con le pieghe interne, visto di fronte"
```

Ogni comando stampa il file che ha scritto (`libreria/immagini/….png`). La seconda volta lo stesso comando non
chiama nessuno e non costa: l'immagine esce dalla biblioteca. Per rifarne una che non piace: stesso comando con
`nuova` in fondo (questa costa di nuovo).

## Dove metterle nel piano

In `piano.json`, nel soggetto da sostituire, `tipo` diventa `"immagine"` e si aggiunge `file`:

```json
{"tipo": "immagine", "file": "libreria/immagini/un-ginocchio-umano-visto-di-fronte-….png", "etichetta": "Reta", "colore": "#5CF2C8", "segno": "…"}
```

Poi `npm run piano reta-testo`, `npm run affianca reta-testo` e si guarda il foglio. Un'immagine ferma non cambia
stato: il rosso del dolore che cala oggi lo fa il ginocchio disegnato. Con le immagini si perde, finché non si
aggiunge un alone del kit sopra l'immagine. Va guardato sul foglio prima di decidere se il cambio conviene.

## Costo stimato

Sette immagini. Contando tre tentativi a soggetto per arrivare a una buona: circa venti generazioni.

Il prezzo esatto a immagine non l'ho potuto leggere dal listino ufficiale di Higgsfield (va guardato sulla loro
pagina dei prezzi prima di lanciare). Le stime pubblicate da terzi nel 2026 non concordano: da circa 0,01-0,02
dollari a immagine per il modello Soul, fino a 0,07-0,14 dollari per altri modelli. Quindi:

| | A immagine | Venti generazioni |
|---|---|---|
| Stima bassa (Soul) | circa 0,02 $ | circa 0,40 $ |
| Stima alta (altri modelli) | circa 0,14 $ | circa 2,80 $ |

La prima immagine va fatta da sola e guardata prima delle altre: è anche la prima chiamata vera al servizio, e il
kit finora l'ha provato solo contro un servizio finto.
