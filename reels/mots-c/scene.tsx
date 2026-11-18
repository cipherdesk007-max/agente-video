// Scritto da `npm run monta` a partire da piano.json: non modificarlo a mano, cambia il piano e rimonta.
// Una scena su misura si scrive in mano.tsx e nel piano si chiama con {"blocco": "mano", "dati": {"componente": "Nome"}}.
import {bloccoSoggetti, definisciReel} from '../../libreria';
import {GiLeg, GiMuscleUp} from 'react-icons/gi';
import {FaBicycle, FaDna, FaDroplet, FaDumbbell, FaHandFist, FaPersonRunning} from 'react-icons/fa6';
import {LuRat} from 'react-icons/lu';

export default definisciReel({
  titolo: "MOTS-c: il peptide che nei muscoli anziani aumenta",
  scene: {
    aggancio: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: GiLeg,
            etichetta: "30 anni",
            colore: "#5CF2C8",
            stato: {acceso: 0.6},
            cambia: [
              {segno: "trenta1", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: GiLeg,
            etichetta: "70 anni",
            colore: "#C9D4E0",
            segno: "diversa1",
            stato: {acceso: 1},
            cambia: [
              {segno: "settanta1", stato: {acceso: 0.35}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "medio",
      camera: "spinta",
    },
    sorpresa: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: GiMuscleUp,
            etichetta: "Muscoli anziani",
            colore: "#C9D4E0",
            stato: {acceso: 0.55},
            cambia: [
              {segno: "anziani2", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "MOTS-c",
            colore: "#5CF2C8",
            segno: "peptide2",
            stato: {livello: 0.35, accesa: 0.5},
            cambia: [
              {segno: "mots2", stato: {accesa: 1}},
              {segno: "aumenta2", stato: {livello: 0.95}, durata: 1},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "sale",
    },
    cose: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: FaDna,
            etichetta: "Mitocondri",
            colore: "#5AA8FF",
            stato: {acceso: 0.4},
            cambia: [
              {segno: "dna3", stato: {acceso: 0.75}},
              {segno: "mitocondri3", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "Energia",
            colore: "#5CF2C8",
            segno: "centrali3",
            stato: {livello: 0.2, accesa: 0.7},
            cambia: [
              {segno: "energetiche3", stato: {livello: 1}, durata: 1},
              {segno: "cellula3", stato: {accesa: 1}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "largo",
      camera: "destra",
    },
    sangue: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "foglio",
            etichetta: "Studio 2020",
            nota: "Nuova Zelanda",
            colore: "#FF8FA0",
            stato: {evidenzia: 0},
            cambia: [
              {segno: "studio4", stato: {evidenzia: 0.4}},
              {segno: "zelanda4", stato: {evidenzia: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: FaDroplet,
            etichetta: "70–81 anni",
            colore: "#FF8FA0",
            nota: "sangue: meno",
            segno: "uomini4",
            stato: {acceso: 1},
            cambia: [
              {segno: "meno4", stato: {acceso: 0.3}},
            ],
          },
          {
            tipo: "icona",
            icona: FaDroplet,
            etichetta: "Ventenni",
            colore: "#5AA8FF",
            nota: "sangue: di più",
            segno: "ventenni4",
          },
        ],
        fonte: "Aging, 2020 · uomini sani",
      }),
      atmosfera: {luogo: "vuoto", tinta: "#E8455A"},
      campo: "largo",
      camera: "sinistra",
    },
    cosce: {
      componente: bloccoSoggetti({
        titolo: "MOTS-c nel muscolo della coscia",
        soggetti: [
          {
            tipo: "batteria",
            etichetta: "Ventenni",
            colore: "#5AA8FF",
            stato: {livello: 0.6, accesa: 0.6},
            cambia: [
              {segno: "cosce5", stato: {accesa: 1}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "70–81 anni",
            nota: "circa 1,5 volte",
            colore: "#5CF2C8",
            segno: "muscoli5",
            stato: {livello: 0.6, accesa: 0.8},
            cambia: [
              {segno: "mezza5", stato: {livello: 0.9}, durata: 1},
              {segno: "piu5", stato: {accesa: 1}},
            ],
          },
        ],
        fonte: "Aging, 2020",
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "medio",
      camera: "spinta",
    },
    ipotesi: {
      componente: bloccoSoggetti({
        titolo: "Un'ipotesi dei ricercatori",
        soggetti: [
          {
            tipo: "icona",
            icona: GiMuscleUp,
            etichetta: "Muscolo: di più",
            colore: "#5CF2C8",
            stato: {acceso: 0.4},
            cambia: [
              {segno: "muscoli6", stato: {acceso: 0.6}},
              {segno: "producano6", stato: {acceso: 0.8}},
              {segno: "stress6", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: FaDroplet,
            etichetta: "Sangue: di meno",
            colore: "#FF8FA0",
            segno: "minore6",
            stato: {acceso: 0.9},
            cambia: [
              {segno: "corpo6", stato: {acceso: 0.3}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "largo",
      camera: "indietro",
    },
    topi: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "foglio",
            etichetta: "Studio 2021",
            nota: "Nature Communications",
            colore: "#5CF2C8",
            stato: {evidenzia: 0},
            cambia: [
              {segno: "studio7", stato: {evidenzia: 0.4}},
              {segno: "nature7", stato: {evidenzia: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: LuRat,
            etichetta: "Topi anziani",
            colore: "#C9D4E0",
            segno: "topi7",
            stato: {acceso: 0.7},
            cambia: [
              {segno: "anziani7", stato: {acceso: 1}},
            ],
          },
        ],
        fonte: "Studio su animali",
      }),
      atmosfera: {luogo: "vuoto", tinta: "#5AA8FF"},
      campo: "largo",
      camera: "destra",
    },
    risultati: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: LuRat,
            etichetta: "Con MOTS-c",
            colore: "#5CF2C8",
            stato: {acceso: 0.5},
            cambia: [
              {segno: "ricevuto8", stato: {acceso: 1}},
              {segno: "quelli8", stato: {acceso: 0.55}},
            ],
          },
          {
            tipo: "icona",
            icona: FaPersonRunning,
            etichetta: "Più corsa",
            colore: "#5AA8FF",
            segno: "correre8",
            stato: {acceso: 0.6},
            cambia: [
              {segno: "lungo8", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "icona",
            icona: FaHandFist,
            etichetta: "Più presa",
            colore: "#5CF2C8",
            segno: "presa8",
            stato: {acceso: 0.6},
            cambia: [
              {segno: "forte8", stato: {acceso: 1}},
            ],
          },
        ],
        fonte: "Nature Communications, 2021 · topi",
      }),
      atmosfera: {luogo: "vuoto", tinta: "#5AA8FF"},
      campo: "medio",
      camera: "gira",
    },
    cyclette: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: FaBicycle,
            etichetta: "Cyclette",
            colore: "#FFB347",
            stato: {acceso: 0.5},
            cambia: [
              {segno: "umani9", stato: {acceso: 0.75}},
              {segno: "cyclette9", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "Muscoli",
            colore: "#FFB347",
            segno: "aumentare9",
            stato: {livello: 0.25},
            cambia: [
              {segno: "muscoli9", stato: {livello: 1}, durata: 1},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "Sangue",
            colore: "#FF8FA0",
            segno: "livelli9",
            stato: {livello: 0.25},
            cambia: [
              {segno: "sangue9", stato: {livello: 0.6}, durata: 0.8},
            ],
          },
        ],
        fonte: "Nature Communications, 2021 · persone",
      }),
      atmosfera: {luogo: "vuoto", tinta: "#FFB347"},
      campo: "largo",
      camera: "sale",
    },
    ruolo: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: GiLeg,
            etichetta: "Massa muscolare",
            colore: "#C9D4E0",
            stato: {acceso: 1},
            cambia: [
              {segno: "perdita10", stato: {acceso: 0.6}},
              {segno: "invecchiamento10", stato: {acceso: 0.3}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "MOTS-c",
            colore: "#5CF2C8",
            segno: "peptide10",
            stato: {livello: 0.5, accesa: 0.6},
            cambia: [
              {segno: "ruolo10", stato: {accesa: 1, livello: 0.75}},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "stretto",
      camera: "sinistra",
    },
    esercizio: {
      componente: bloccoSoggetti({
        soggetti: [
          {
            tipo: "icona",
            icona: FaDumbbell,
            etichetta: "Esercizio fisico",
            colore: "#5CF2C8",
            stato: {acceso: 0.5},
            cambia: [
              {segno: "esercizio11", stato: {acceso: 1}},
            ],
          },
          {
            tipo: "batteria",
            etichetta: "MOTS-c",
            colore: "#5CF2C8",
            segno: "unica11",
            stato: {livello: 0.3},
            cambia: [
              {segno: "dimostrato11", stato: {livello: 0.55}},
              {segno: "aumentarne11", stato: {livello: 1}, durata: 1},
            ],
          },
        ],
      }),
      atmosfera: {luogo: "vuoto"},
      campo: "medio",
      camera: "spinta",
    },
  },
});
