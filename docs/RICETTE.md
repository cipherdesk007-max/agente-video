# Ricette: i modi di dire una cosa

Otto schemi che tornano in quasi ogni reel, con la scena di `piano.json` già scritta. Si copia la scena, si cambiano
le scritte e le parole dei segni. I blocchi sono quelli di `CATALOGO.md`; i numeri degli esempi sono quelli di
`reels/reta-testo` (`fonti.md`, righe 6-9).

La sintassi, in quattro righe:

- **scena**: `{"nome": …, "da": "le prime parole della scena", "blocco": …, "dati": {…}}`. La prima scena non ha `"da"`.
- **segno**: `"segni": {"nome": "parola del testo"}`. Nei dati si scrive il nome: `"segno": "nome"`. La cosa compare
  quando la voce dice quella parola. Se la parola torna due volte: `{"su": "parola", "volta": 2}`.
- **enfasi**: `"enfasi": ["parola"]`. La parola si accende nei sottotitoli. Una o due per scena.
- **camera**: ogni scena ha il suo movimento (`spinta`, `indietro`, `destra`, `sinistra`, `sale`, `scende`, `gira`),
  diverso da quello della scena prima.

Ogni esempio qui sotto passa il controllo del piano con il suo testo (prova B33).

## 1 · Il numero che arriva

**Quando:** la frase porta un solo numero, ed è la notizia. Il numero parte sul verbo e la nota arriva sulla cifra.

**Testo:** Con la Reta, il dolore è diminuito di quasi quattro punti.

```json
{"nome": "calo", "blocco": "numero", "dati": {"valore": 3.96, "decimali": 2, "unita": "punti", "segno": "cala", "nota": "su una scala da 0 a 10", "segnoNota": "quattro", "fonte": "NEJM 2026, studio TRIUMPH-4"}, "segni": {"cala": "diminuito", "quattro": "quattro"}, "enfasi": ["quattro"], "suoni": [{"suono": "ding", "su": "quattro"}], "camera": "spinta"}
```

## 2 · Il confronto tra due cose

**Quando:** due valori della stessa misura, detti uno dopo l'altro. Ogni lato entra sulla sua cifra.

**Testo:** Con la Reta quasi quattro punti in meno. Con il placebo circa due.

```json
{"nome": "confronto", "blocco": "confronto", "dati": {"sinistra": {"titolo": "Reta", "valore": 3.96, "decimali": 2, "unita": "punti", "segno": "quattro"}, "destra": {"titolo": "Placebo", "valore": 2.12, "decimali": 2, "unita": "punti", "segno": "due"}, "fonte": "NEJM 2026, studio TRIUMPH-4"}, "segni": {"quattro": "quattro", "due": "due"}, "enfasi": ["quattro", "due"], "camera": "destra"}
```

## 3 · La lista di passi

**Quando:** il testo dice cosa fare in ordine ("prima", "poi", "infine"). Un passo per segno, al massimo cinque.

**Testo:** Prima guarda quanto cala il dolore con il farmaco, poi quanto cala con il placebo, infine la differenza.

```json
{"nome": "passi", "blocco": "passi", "dati": {"titolo": "Come si legge uno studio", "passi": [{"testo": "Il calo con il farmaco", "segno": "farmaco"}, {"testo": "Il calo con il placebo", "segno": "placebo"}, {"testo": "La differenza", "segno": "differenza"}]}, "segni": {"farmaco": "farmaco", "placebo": "placebo", "differenza": "differenza"}, "enfasi": ["differenza"], "camera": "sale"}
```

## 4 · La frase-mito da rovesciare

**Quando:** il testo riporta una cosa che si dice in giro e subito la corregge. Il mito entra sulla sua parola, la
verità sulla parola che lo rovescia.

**Testo:** Molti pensano che sia tutto merito del farmaco. In realtà una parte arriva anche con il placebo.

```json
{"nome": "mito", "blocco": "mito", "dati": {"mito": "È tutto merito del farmaco", "verita": "Una parte arriva anche con il placebo", "segnoMito": "merito", "segnoVerita": "realta"}, "segni": {"merito": "merito", "realta": "realtà"}, "enfasi": ["placebo"], "camera": "indietro"}
```

## 5 · Il prima/dopo

**Quando:** la stessa cosa misurata in due momenti. Il secondo cursore parte da dove stava il primo (`"da"`) e si
sposta sul verbo.

**Testo:** All'inizio il dolore era a sei. Con la Reta è sceso a circa due.

```json
{"nome": "primadopo", "blocco": "scala", "dati": {"titolo": "Dolore da 0 a 10", "cursori": [{"etichetta": "Prima", "valore": 6, "segno": "sei"}, {"etichetta": "Dopo", "valore": 2.04, "da": 6, "segno": "sceso"}], "estremi": ["nessun dolore", "il più forte"], "verso": "male"}, "segni": {"sei": "sei", "sceso": "sceso"}, "enfasi": ["due"], "camera": "spinta"}
```

## 6 · La scalata dal piccolo al grande

**Quando:** tre o più valori che crescono. Le colonne entrano nell'ordine in cui la voce le nomina, la più alta per ultima.

**Testo:** La differenza è meno di due punti. Il placebo ne toglie circa due. La Reta quasi quattro.

```json
{"nome": "scalata", "blocco": "barre", "dati": {"unita": "punti", "decimali": 2, "dati": [{"etichetta": "Differenza", "valore": 1.84, "segno": "differenza"}, {"etichetta": "Placebo", "valore": 2.12, "segno": "placebo"}, {"etichetta": "Reta", "valore": 3.96, "segno": "reta"}], "fonte": "NEJM 2026, studio TRIUMPH-4"}, "segni": {"differenza": "differenza", "placebo": "placebo", "reta": "Reta"}, "enfasi": ["quattro"], "camera": "sale"}
```

## 7 · La metafora che cambia stato

**Quando:** un concetto che non si vede (qui l'effetto placebo). Un soggetto grande resta in scena e cambia stato a
ogni parola che conta. È la scena `applauso` di `reels/reta-testo`.

**Testo:** È un po' come quando il pubblico inizia ad applaudire prima ancora che la band salga sul palco: a volte basta aspettarsi di stare meglio per provare un po' di sollievo.

```json
{"nome": "applauso", "blocco": "soggetti", "dati": {"soggetti": [{"tipo": "riflettori", "etichetta": "Effetto placebo", "colore": "#5CF2C8", "stato": {"luci": 0.15}, "cambia": [{"segno": "pubblico", "stato": {"luci": 1}}, {"segno": "band", "stato": {"luci": 0.45}}, {"segno": "aspettarsi", "stato": {"luci": 1}}, {"segno": "sollievo", "stato": {"luci": 0.7}}]}]}, "segni": {"pubblico": "pubblico", "band": "band", "aspettarsi": "aspettarsi", "sollievo": "sollievo"}, "enfasi": ["applaudire", "aspettarsi"], "camera": "gira"}
```

## 8 · La domanda che apre

**Quando:** il reel risponde a una domanda sola. La domanda a schermo è più corta di quella detta.

**Testo:** Quindi, quanto di questo miglioramento è davvero merito della Reta?

```json
{"nome": "domanda", "blocco": "domanda", "dati": {"domanda": "Quanto è merito della Reta?", "segno": "quanto"}, "segni": {"quanto": "quanto"}, "enfasi": ["merito"], "camera": "indietro"}
```
