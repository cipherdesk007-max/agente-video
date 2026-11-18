// FMLAB Reel Kit — IL LOOK. Tutto quello che rende i reel riconoscibili sta qui.
// Cambia questi valori una volta sola: ogni reel, vecchio e nuovo, li eredita al prossimo render.

export const stile = {
  /** Il marchio: sul camice del Dottore disegnato dal kit e, se la accendi, nella piccola firma in alto. */
  marchio: 'FMLAB',

  /**
   * Il logo della pagina: un'immagine con il fondo trasparente in questa cartella. Lo usano <Logo>, la sigla
   * (bloccoSigla) e, se lo chiedi, il cartello finale. Per cambiarlo sostituisci il file e scrivi qui larghezza e altezza.
   */
  logo: {file: 'logo.png', nome: 'PEPTMAP', misure: [845, 660] as [number, number]},
  /** La copertina dell'ebook regalo (quello di "Commenta MAPPA"): la mostra <Ebook> su un tablet 3D che gira. */
  ebook: {file: 'ebook.jpg', titolo: 'Il database dei peptidi', misure: [816, 1228] as [number, number]},

  colori: {
    /** Fondo quasi nero: fa risaltare tutto ciò che si illumina. */
    fondo: '#04070A',
    /** Tinta della foschia, se la scena non ne chiede un'altra. */
    foschia: '#19C7A4',
    testo: '#FFFFFF',
    tenue: '#9FB0BD',
    /** Il colore "protagonista": segnali, bagliori, linee, numeri importanti. */
    luce: '#5CF2C8',
    /** Secondo colore di luce, per i confronti (A contro B). */
    luce2: '#5AA8FF',
    accento: '#FFD23F',
    positivo: '#7CF26B',
    negativo: '#FF4D5E',
    /** Riquadro attorno alla parola chiave nei sottotitoli. */
    riquadro: '#4F8DFF',
    /** Contorno scuro di personaggio e oggetti. */
    contorno: '#070B12',
  },

  font: {
    titoli: '"Inter Display", "Inter", system-ui, sans-serif',
    testo: '"Inter", "Inter Display", system-ui, sans-serif',
  },

  /**
   * Zone sicure (pixel su 1080x1920): fuori da qui l'app copre il video con nome, icone e didascalia.
   * `npm run verifica` controlla che sottotitoli e scritte restino dentro.
   */
  zone: {
    alto: 220,
    basso: 1560,
    sinistra: 50,
    destra: 1030,
    /** Colonna delle icone (mi piace, commenti…) in basso a destra. */
    icone: {x: 940, y: 1040},
  },

  /** Il palco: l'area dove vivono le immagini, tra sottotitoli e narratore. */
  palco: {centroX: 540, centroY: 880, alto: 470, basso: 1320},

  sottotitoli: {
    /** Centro verticale dei sottotitoli (in alto, come nei reel di riferimento: misurati stanno a 0,189-0,190 dell'altezza). */
    y: 359,
    dimensione: 60,
    maxParole: 5,
    maxCaratteri: 26,
    larghezzaMax: 920,
    maiuscolo: false,
  },

  /**
   * Colori del Dottore disegnato dal kit (personaggi/fmlab).
   * Chi fa il narratore, quanto è grande e da che lato sta NON si decide qui:
   *   - per tutti i reel:  stile/impostazioni.json
   *   - per un reel solo:  reels/<reel>/impostazioni.json  (o dal pannello: npm run pannello)
   * I personaggi stanno nella cartella personaggi/ (vedi personaggi/COME-FARE.md).
   */
  personaggio: {
    colori: {
      pelle: '#F6C9A3',
      pelleOmbra: '#E2A27C',
      capelli: '#2A2F4D',
      camice: '#F6F9FF',
      camiceOmbra: '#CFD9EE',
      divisa: '#19B8A6',
      strumento: '#3A4580',
      metallo: '#C7D2EA',
      guance: '#F28B8B',
    } as Record<string, string>,
  },

  /** Piccola scritta col marchio in alto. Spenta di serie: il marchio lo porta già il narratore. */
  firma: {mostra: false, y: 232},
};

export type Stile = typeof stile;
