// Scritto da `npm run monta` a partire da piano.json: non modificarlo a mano, cambia il piano e rimonta.
// Una scena su misura si scrive in mano.tsx e nel piano si chiama con {"blocco": "mano", "dati": {"componente": "Nome"}}.
import {bloccoDomanda, bloccoEbook, bloccoParole, bloccoSoggetti, definisciReel} from '../../libreria';
import {FaUsers} from 'react-icons/fa6';

export default definisciReel({
  titolo: "Reta e dolore al ginocchio: quanto è merito del farmaco?",
  protagonista: {tipo: "peptide", colore: "#5CF2C8"},
  scene: {
    aggancio: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "ginocchio",
            etichetta: "Reta",
            colore: "#5CF2C8",
            stato: {dolore: 1},
            cambia: [
              {segno: "meno", stato: {dolore: 0.25}, durata: 1.2},
            ],
          },
          {
            tipo: "ginocchio",
            etichetta: "Placebo",
            colore: "#C9D4E0",
            segno: "ginocchio",
            stato: {dolore: 1},
            cambia: [
              {segno: "meno", stato: {dolore: 0.5}, durata: 1.2},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "medio",
      camera: "spinta",
      protagonista: [
        {acceso: 0.7, carica: 0.4, onda: 0.6},
        {segno: "reta", acceso: 1},
        {segno: "placebo", colore: "#C9D4E0", onda: 1.2},
        {segno: "meno", colore: "#5CF2C8", onda: 0.5, acceso: 1},
      ],
    },
    domanda: {
      componente: bloccoDomanda({domanda: "Quanto è merito della Reta?", sopra: "Il dolore cala anche con il placebo", segno: "quanto"}),
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "indietro",
      protagonista: [
        {acceso: 0.4, carica: 0.4, onda: 1},
        {segno: "merito", acceso: 0.8, grandezza: 0.74},
        {segno: "vediamo", acceso: 1, carica: 0.7, grandezza: 0.62},
      ],
    },
    studi: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "foglio",
            etichetta: "2 studi",
            colore: "#5CF2C8",
            segno: "pubblicati",
            cambia: [
              {segno: "riviste", stato: {evidenzia: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: FaUsers,
            etichetta: "1.019 adulti",
            nota: "oltre un anno",
            colore: "#5AA8FF",
            segno: "mille",
          },
        ],
        fonte: "NEJM, novembre 2026",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "destra",
      campo: "stretto",
      camera: "destra",
      protagonista: [
        {acceso: 1, carica: 0.6, onda: 0.4},
        {segno: "due", carica: 0.7},
        {segno: "mondo", carica: 0.8, grandezza: 0.74},
        {segno: "artrosi", onda: 1.2, grandezza: 0.62},
        {segno: "anno", carica: 1, onda: 0.4},
      ],
    },
    scala: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "quadrante",
            etichetta: "Dolore, da 0 a 10",
            colore: "#5CF2C8",
            stato: {valore: 0, massimo: 10},
            cambia: [
              {segno: "scala", stato: {valore: 5}, durata: 1.1},
              {segno: "dieci", stato: {valore: 10}, durata: 0.8},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "sale",
      protagonista: [
        {carica: 0.6, onda: 0.5},
        {segno: "dieci", colore: "#FF4D5E", onda: 1.4},
      ],
    },
    risultati: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "quadrante",
            etichetta: "Reta",
            nota: "−3,96 punti",
            colore: "#5CF2C8",
            stato: {valore: 6, massimo: 10},
            cambia: [
              {segno: "quattro", stato: {valore: 2.04}, durata: 1.3},
            ],
          },
          {
            tipo: "quadrante",
            etichetta: "Placebo",
            nota: "−2,12 punti",
            colore: "#C9D4E0",
            segno: "anche",
            stato: {valore: 6, massimo: 10},
            cambia: [
              {segno: "duepunti", stato: {valore: 3.88}, durata: 1.3},
            ],
          },
        ],
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
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "riflettori",
            etichetta: "Effetto placebo",
            colore: "#5CF2C8",
            stato: {luci: 0.15},
            cambia: [
              {segno: "pubblico", stato: {luci: 1}},
              {segno: "band", stato: {luci: 0.45}},
              {segno: "aspettarsi", stato: {luci: 1}},
              {segno: "sollievo", stato: {luci: 0.7}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "basso",
      campo: "medio",
      camera: "gira",
      protagonista: {colore: "#5AA8FF", acceso: 0.3, onda: 0.3},
    },
    differenza: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "batteria",
            etichetta: "Placebo",
            nota: "2,12 punti",
            colore: "#C9D4E0",
            segno: "capire",
            stato: {livello: 0, accesa: 0.3},
            cambia: [
              {segno: "funziona", stato: {livello: 0.53}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "Reta",
            nota: "3,96 punti",
            colore: "#5CF2C8",
            segno: "differenza",
            stato: {livello: 0.53},
            cambia: [
              {segno: "unodue", stato: {livello: 0.99}, durata: 1.2},
            ],
          },
        ],
        fonte: "NEJM 2026: tra 1,35 e 1,84 punti di differenza",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "destra",
      campo: "stretto",
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
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "indietro",
      protagonista: {grandezza: 0.62, onda: 0.4},
    },
    rischi: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "stomaco",
            etichetta: "Effetti collaterali gravi",
            nota: "più frequenti con la Reta",
            colore: "#FF8FA0",
            segno: "autori",
            stato: {irritato: 0.1},
            cambia: [
              {segno: "effetti", stato: {irritato: 0.55}},
              {segno: "frequenti", stato: {irritato: 0.8}},
              {segno: "gastro", stato: {irritato: 1}},
            ],
          },
        ],
        fonte: "NEJM 2026, riportato dagli autori",
      }),
      atmosfera: {luogo: "vuoto", tinta: "#E8455A"},
      entra: "avanti",
      campo: "medio",
      camera: "scende",
      protagonista: [
        {onda: 0.6},
        {segno: "altro", colore: "#FF4D5E", onda: 1.6, acceso: 1},
      ],
      dottore: {posa: "conserte"},
    },
    conclusione: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "ginocchio",
            etichetta: "Reta",
            colore: "#5CF2C8",
            segno: "duestudi",
            stato: {dolore: 1},
            cambia: [
              {segno: "riduce", stato: {dolore: 0.2}, durata: 1.2},
            ],
          },
          {
            tipo: "ginocchio",
            etichetta: "Placebo",
            colore: "#C9D4E0",
            segno: "dimostrato",
            stato: {dolore: 1},
            cambia: [
              {segno: "piu", stato: {dolore: 0.5}, durata: 1.2},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "sinistra",
      campo: "stretto",
      camera: "destra",
      protagonista: {colore: "#5CF2C8", onda: 0.5, acceso: 1, carica: 1, grandezza: 0.62},
    },
    azienda: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "foglio",
            etichetta: "Coinvolta l'azienda",
            nota: "i dettagli contano",
            colore: "#FFD23F",
            stato: {evidenzia: 0},
            cambia: [
              {segno: "azienda", stato: {evidenzia: 0.6}},
              {segno: "dettagli", stato: {evidenzia: 1}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "avanti",
      campo: "medio",
      camera: "spinta",
      protagonista: [
        {colore: "#FFD23F", acceso: 0.5, onda: 0.9},
        {segno: "condotti", acceso: 0.8},
        {segno: "risultati", colore: "#5CF2C8", acceso: 1, onda: 0.5},
      ],
    },
    amico: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "ginocchio",
            etichetta: "A quell'amico",
            colore: "#FFD23F",
            segno: "manda",
            stato: {dolore: 0.1},
            cambia: [
              {segno: "scricchiolano", stato: {dolore: 0.95}, durata: 0.6},
            ],
          },
          {
            tipo: "scale",
            etichetta: "Le scale",
            colore: "#5CF2C8",
            segno: "volta",
            stato: {passo: 0},
            cambia: [
              {segno: "scale", stato: {passo: 6}, durata: 1.4},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "basso",
      campo: "stretto",
      camera: "sale",
      protagonista: [
        {acceso: 0.6, onda: 0.9},
        {segno: "amico", acceso: 1, grandezza: 0.74},
      ],
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
