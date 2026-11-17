// Scritto da `npm run monta` a partire da piano.json: non modificarlo a mano, cambia il piano e rimonta.
// Una scena su misura si scrive in mano.tsx e nel piano si chiama con {"blocco": "mano", "dati": {"componente": "Nome"}}.
import {bloccoAvviso, bloccoBarre, bloccoConfronto, bloccoDomanda, bloccoEbook, bloccoIcone, bloccoLista, bloccoOggetto, bloccoParole, bloccoScala, bloccoStudio, definisciReel, ginocchio3d, mix, rampa} from '../../libreria';
import {FaFaceSmile, FaGuitar, FaHeartPulse, FaUsers} from 'react-icons/fa6';

export default definisciReel({
  titolo: "Reta e dolore al ginocchio: quanto è merito del farmaco?",
  protagonista: {tipo: "peptide", colore: "#5CF2C8"},
  scene: {
    aggancio: {
      componente: bloccoOggetto({oggetti: (s) => ginocchio3d({dolore: mix(1, 0.3, rampa(s.dopo("meno"), 1.2)), piega: mix(14, 26, rampa(s.dopo("meno"), 1.2)), pos: [0,-70,0], scala: 0.8}), etichette: [
        {testo: "Reta", punto: [0, 50, 24], segno: "reta"},
        {testo: "Placebo", punto: [0, -166, 24], segno: "placebo", colore: "#5AA8FF"},
        {testo: "Meno dolore", punto: [24, -62, 48], segno: "meno", colore: "#7CF26B"},
      ], zoom: 1.35}),
      atmosfera: {luogo: "corpo"},
      campo: "medio",
      camera: "spinta",
      protagonista: [
        {acceso: 0.7, carica: 0.4, onda: 0.6},
        {segno: "ginocchio", colore: "#FF4D5E", onda: 1.4},
        {segno: "meno", colore: "#5CF2C8", onda: 0.5, acceso: 1},
      ],
    },
    domanda: {
      componente: bloccoDomanda({domanda: "Quanto è merito della Reta?", sopra: "Il dolore cala anche con il placebo", segno: "quanto"}),
      atmosfera: {luogo: "corpo"},
      campo: "stretto",
      camera: "indietro",
      protagonista: [
        {acceso: 0.4, carica: 0.4, onda: 1},
        {segno: "merito", acceso: 0.8, grandezza: 0.74},
        {segno: "vediamo", acceso: 1, carica: 0.7, grandezza: 0.62},
      ],
    },
    studi: {
      componente: bloccoStudio({
        rivista: "New England Journal of Medicine",
        titolo: "Retatrutide e artrosi del ginocchio",
        segno: "pubblicati",
        dati: [
          {testo: "2 studi", segno: "due"},
          {testo: "tra le più importanti", segno: "riviste"},
          {testo: "1.019 adulti", segno: "mille"},
        ],
        fonte: "NEJM, novembre 2026",
      }),
      atmosfera: {luogo: "studio"},
      entra: "destra",
      campo: "stretto",
      camera: "destra",
      protagonista: [
        {acceso: 1, carica: 0.6, onda: 0.4},
        {segno: "mondo", carica: 0.8, grandezza: 0.74},
        {segno: "artrosi", onda: 1.2, grandezza: 0.62},
        {segno: "anno", carica: 1, onda: 0.4},
      ],
    },
    scala: {
      componente: bloccoScala({
        titolo: "Dolore, da 0 a 10",
        cursori: [
          {etichetta: "Dolore all'inizio", valore: 6, da: 0, segno: "scala"},
        ],
        estremi: ["nessun dolore", "il più forte"],
        verso: "male",
      }),
      atmosfera: {luogo: "laboratorio"},
      campo: "largo",
      camera: "sale",
      protagonista: [
        {carica: 0.6, onda: 0.5},
        {segno: "dieci", colore: "#FF4D5E", onda: 1.4},
      ],
    },
    risultati: {
      componente: bloccoConfronto({
        titolo: "Di quanto è calato il dolore",
        sinistra: {titolo: "Reta", valore: 3.96, decimali: 2, unita: "punti in meno", segno: "quattro", colore: "#5CF2C8"},
        destra: {titolo: "Placebo", valore: 2.12, decimali: 2, unita: "punti in meno", segno: "duepunti", colore: "#5AA8FF"},
        fonte: "NEJM 2026, studio TRIUMPH-4",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "avanti",
      campo: "stretto",
      camera: "spinta",
      protagonista: [
        {colore: "#5CF2C8", carica: 1, onda: 0.5},
        {segno: "anche", colore: "#5AA8FF", carica: 0.5},
        {segno: "attivo", acceso: 0.2, carica: 0.1},
      ],
    },
    applauso: {
      componente: bloccoIcone({
        titolo: "Effetto placebo",
        voci: [
          {icona: FaUsers, testo: "Il pubblico applaude", segno: "pubblico"},
          {icona: FaGuitar, testo: "prima della band", segno: "band"},
          {icona: FaFaceSmile, testo: "Aspettarsi di stare meglio", segno: "aspettarsi"},
          {icona: FaHeartPulse, testo: "dà già un po' di sollievo", segno: "sollievo"},
        ],
      }),
      atmosfera: {luogo: "palco"},
      entra: "basso",
      campo: "largo",
      camera: "gira",
      protagonista: {colore: "#5AA8FF", acceso: 0.3, onda: 0.3},
    },
    differenza: {
      componente: bloccoBarre({
        titolo: "Calo del dolore, in punti",
        dati: [
          {etichetta: "Placebo", valore: 2.12, segno: "capire"},
          {etichetta: "Reta", valore: 3.96, segno: "differenza"},
        ],
        decimali: 2,
        fonte: "NEJM 2026: tra 1,35 e 1,84 punti di differenza",
        colori: ["#5AA8FF", "#5CF2C8"],
      }),
      atmosfera: {luogo: "laboratorio"},
      entra: "destra",
      campo: "medio",
      camera: "sinistra",
      protagonista: [
        {colore: "#5CF2C8", acceso: 1, carica: 0.5, onda: 0.5},
        {segno: "funziona", onda: 1, grandezza: 0.74},
        {segno: "studi", carica: 0.75, grandezza: 0.62},
        {segno: "unodue", carica: 1, grandezza: 0.78},
        {segno: "rispetto", grandezza: 0.62, onda: 0.4},
      ],
    },
    misura: {
      componente: bloccoParole({
        parole: [
          {testo: "Non è un miracolo", segno: "miracolo"},
          {testo: "Non è un caso", segno: "caso", colore: "#7CF26B"},
        ],
      }),
      atmosfera: {luogo: "bilancia"},
      campo: "stretto",
      camera: "indietro",
      protagonista: {grandezza: 0.62, onda: 0.4},
    },
    rischi: {
      componente: bloccoAvviso({
        titolo: "Effetti collaterali gravi",
        segno: "effetti",
        punti: [
          {testo: "Più frequenti con la Reta", segno: "frequenti"},
          {testo: "Soprattutto gastrointestinali", segno: "gastro"},
        ],
        fonte: "NEJM 2026, riportato dagli autori",
      }),
      atmosfera: {luogo: "vaso", tinta: "#E8455A"},
      entra: "avanti",
      campo: "medio",
      camera: "scende",
      protagonista: [
        {onda: 0.6},
        {segno: "altro", colore: "#FF4D5E", onda: 1.6, acceso: 1},
        {segno: "autori", grandezza: 0.74},
      ],
      dottore: {posa: "conserte"},
    },
    conclusione: {
      componente: bloccoLista({
        titolo: "In conclusione",
        voci: [
          {testo: "2 studi sull'uomo", segno: "duestudi"},
          {testo: "La Reta riduce il dolore", segno: "riduce"},
          {testo: "più del placebo", segno: "piu"},
          {testo: "Coinvolta l'azienda che la produce", segno: "azienda"},
          {testo: "I dettagli contano", segno: "dettagli"},
        ],
      }),
      atmosfera: {luogo: "studio"},
      entra: "sinistra",
      campo: "largo",
      camera: "destra",
      protagonista: [
        {colore: "#5CF2C8", onda: 0.5, acceso: 1, carica: 1, grandezza: 0.62},
        {segno: "condotti", acceso: 0.5, onda: 0.9},
      ],
    },
    amico: {
      componente: bloccoOggetto({oggetti: (s) => ginocchio3d({dolore: mix(0.15, 0.9, rampa(s.dopo("scricchiolano"), 0.9)), piega: mix(mix(8, 46, rampa(s.dopo("scricchiolano"), 0.9)), 12, rampa(s.dopo("scale"), 0.7)), pos: [0,-70,0], scala: 0.8}), etichette: [
        {testo: "Manda questo video", punto: [0, 50, 24], segno: "manda"},
        {testo: "a quell'amico", punto: [0, -166, 24], segno: "amico", colore: "#FFD23F"},
      ], zoom: 1.35}),
      atmosfera: {luogo: "stadio"},
      entra: "basso",
      campo: "stretto",
      camera: "sale",
      protagonista: {acceso: 0.6, onda: 0.9},
    },
    chiusura: {
      componente: bloccoEbook({
        regalo: "mappa",
        invito: "Commenta MAPPA",
        sopra: "Gratis",
        sotto: "Il database dei peptidi",
        segno: "commenta",
        segnoSopra: "gratis",
        segnoSotto: "database",
        segnoGiro: "essenziali",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "avanti",
      campo: "medio",
      camera: "spinta",
      protagonista: false,
    },
  },
});
