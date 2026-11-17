// Scritto da `npm run monta` a partire da piano.json: non modificarlo a mano, cambia il piano e rimonta.
// Una scena su misura si scrive in mano.tsx e nel piano si chiama con {"blocco": "mano", "dati": {"componente": "Nome"}}.
import {bloccoEbook, bloccoSoggetti, definisciReel} from '../../libreria';
import {FaMagnifyingGlass, FaQuestion, FaSyringe, FaUsers} from 'react-icons/fa6';

export default definisciReel({
  titolo: "Reta e dolore al ginocchio: quanto è merito del farmaco?",
  scene: {
    aggancio: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "ginocchio",
            etichetta: "Reta",
            colore: "#5CF2C8",
            stato: {dolore: 0.6},
            cambia: [
              {segno: "reta", stato: {dolore: 1}, durata: 0.5},
              {segno: "meno", stato: {dolore: 0.25}},
            ],
          },
          {
            tipo: "ginocchio",
            etichetta: "Placebo",
            colore: "#C9D4E0",
            segno: "ginocchio",
            stato: {dolore: 1},
            cambia: [
              {segno: "placebo", stato: {dolore: 0.85}, durata: 0.5},
              {segno: "meno", stato: {dolore: 0.5}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "medio",
      camera: "spinta",
    },
    domanda: {
      componente: bloccoSoggetti({
        titolo: "Quanto è merito della Reta?",
        soggetti: [
          {tipo: "icona", icona: FaQuestion, etichetta: "Quanto?", colore: "#FFD23F", segno: "quanto"},
          {tipo: "icona", icona: FaSyringe, etichetta: "Merito suo?", colore: "#5CF2C8", segno: "merito"},
          {tipo: "icona", icona: FaMagnifyingGlass, etichetta: "Vediamo", colore: "#FFFFFF", segno: "vediamo"},
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "largo",
      camera: "indietro",
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
              {segno: "due", stato: {evidenzia: 0.35}},
              {segno: "riviste", stato: {evidenzia: 0.7}},
              {segno: "mondo", stato: {evidenzia: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: FaUsers,
            etichetta: "1.019 adulti",
            nota: "oltre un anno",
            colore: "#5AA8FF",
            segno: "mille",
            stato: {acceso: 0.55},
            cambia: [
              {segno: "anno", stato: {acceso: 1}},
            ],
          },
          {tipo: "ginocchio", etichetta: "Artrosi", colore: "#FFD23F", segno: "artrosi", stato: {dolore: 0.9}},
        ],
        fonte: "NEJM, novembre 2026",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "destra",
      campo: "largo",
      camera: "destra",
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
              {segno: "attivo", stato: {valore: 5.2}, durata: 0.8},
              {segno: "duepunti", stato: {valore: 3.88}, durata: 1.3},
            ],
          },
        ],
        fonte: "NEJM 2026, studio TRIUMPH-4",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "avanti",
      campo: "medio",
      camera: "spinta",
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
      campo: "largo",
      camera: "gira",
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
              {segno: "rispetto", stato: {accesa: 0.08}},
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
              {segno: "studi", stato: {livello: 0.76}},
              {segno: "unodue", stato: {livello: 0.99}, durata: 1.2},
            ],
          },
        ],
        fonte: "NEJM 2026: tra 1,35 e 1,84 punti di differenza",
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "destra",
      campo: "medio",
      camera: "sinistra",
    },
    misura: {
      componente: bloccoSoggetti({
        titolo: "Non è un miracolo. Non è un caso.",
        soggetti: [
          {
            tipo: "ginocchio",
            etichetta: "Reta",
            colore: "#5CF2C8",
            stato: {dolore: 1},
            cambia: [
              {segno: "miracolo", stato: {dolore: 0.45}, durata: 1},
            ],
          },
          {
            tipo: "ginocchio",
            etichetta: "Placebo",
            colore: "#C9D4E0",
            segno: "ma",
            stato: {dolore: 1},
            cambia: [
              {segno: "caso", stato: {dolore: 0.72}, durata: 1},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "indietro",
    },
    rischi: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "stomaco",
            etichetta: "Effetti collaterali gravi",
            nota: "più frequenti con la Reta",
            colore: "#FF8FA0",
            segno: "altro",
            stato: {irritato: 0.05},
            cambia: [
              {segno: "autori", stato: {irritato: 0.3}},
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
      campo: "stretto",
      camera: "scende",
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
      campo: "medio",
      camera: "destra",
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
              {segno: "condotti", stato: {evidenzia: 0.3}},
              {segno: "azienda", stato: {evidenzia: 0.65}},
              {segno: "risultati", stato: {evidenzia: 1}},
            ],
          },
          {tipo: "icona", icona: FaMagnifyingGlass, etichetta: "I dettagli", colore: "#FFFFFF", segno: "dettagli"},
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      entra: "avanti",
      campo: "largo",
      camera: "spinta",
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
              {segno: "amico", stato: {dolore: 0.4}, durata: 0.5},
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
      campo: "medio",
      camera: "sale",
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
    },
  },
});
