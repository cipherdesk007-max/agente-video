// FMLAB Reel Kit — avvio della pagina di un reel.
// modo=render  → il motore chiede i fotogrammi uno per uno (window.__fmlab.vai(n)) e li fotografa.
// modo=anteprima → player con play/pausa, cursore e audio, per guardare il reel nel browser.
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {DatiReel} from '../../libreria/tempo';
import type {Reel} from '../../libreria/reel';
import {IMPOSTAZIONI_BASE, ingombroNarratore} from '../../libreria/impostazioni';
import type {ConfigPersonaggio, Impostazioni} from '../../libreria/impostazioni';
import {Palco} from './Palco';
import {Player} from './Player';
import {stile} from '../../stile/stile';

type Rettangolo = {zona: string; scena: string | null; testo: string; x: number; y: number; larghezza: number; altezza: number};

declare global {
  interface Window {
    __fmlab?: {
      info: Record<string, unknown>;
      pronto: Promise<void>;
      vai: (fotogramma: number, guide?: boolean) => Promise<{ok?: boolean; scena?: string; errore?: string}>;
      misura: () => Rettangolo[];
      /** Nomi delle scene che in questo fotogramma mostrano oggetti 3D. */
      tre: () => string[];
    };
  }
}

async function attendiImmagini() {
  const immagini = Array.from(document.images);
  await Promise.all(
    immagini.map((img) => {
      if (img.complete) return img.naturalWidth ? img.decode().catch(() => undefined) : undefined;
      return new Promise<void>((fatto) => {
        // caricata non basta: deve essere anche decodificata, o nel fotogramma comparirebbe con un istante di ritardo
        img.addEventListener('load', () => void img.decode().catch(() => undefined).then(() => fatto()), {once: true});
        img.addEventListener('error', () => fatto(), {once: true});
      });
    })
  );
}

function opacitaEffettiva(el: Element): number {
  let o = 1;
  let n: Element | null = el;
  while (n && (n instanceof HTMLElement || n instanceof SVGElement)) {
    const stile = getComputedStyle(n);
    if (stile.display === 'none' || stile.visibility === 'hidden') return 0;
    o *= Number(stile.opacity);
    n = n.parentElement;
  }
  return o;
}

/** Rettangoli occupati da testi e sottotitoli visibili (per controllare le zone sicure). */
function misura(): Rettangolo[] {
  const radice = document.getElementById('radice');
  if (!radice) return [];
  const scalaX = radice.getBoundingClientRect().width / 1080 || 1;
  const origine = radice.getBoundingClientRect();
  return Array.from(document.querySelectorAll('[data-fmlab-zona]'))
    .filter((el) => opacitaEffettiva(el) > 0.25)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        zona: el.getAttribute('data-fmlab-zona') ?? '',
        scena: el.closest('[data-fmlab-scena]')?.getAttribute('data-fmlab-scena') ?? null,
        testo: (el.textContent ?? '').trim().slice(0, 60),
        x: (r.left - origine.left) / scalaX,
        y: (r.top - origine.top) / scalaX,
        larghezza: r.width / scalaX,
        altezza: r.height / scalaX,
      };
    })
    .filter((r) => r.larghezza > 1 && r.altezza > 1);
}

/** Scene che in questo momento mostrano oggetti 3D (disegnati con Scena3D). */
function tre(): string[] {
  const nomi = new Set<string>();
  for (const el of Array.from(document.querySelectorAll('[data-fmlab-3d]'))) {
    if (opacitaEffettiva(el) <= 0.25 || !el.childElementCount) continue;
    nomi.add(el.closest('[data-fmlab-scena]')?.getAttribute('data-fmlab-scena') ?? '');
  }
  return [...nomi];
}

export type Avvio = {
  modulo: {default?: Reel; reel?: Reel};
  dati: DatiReel;
  slug: string;
  impostazioni?: Impostazioni;
  personaggi?: Record<string, ConfigPersonaggio>;
};

export function avvia({modulo, dati, slug, impostazioni = IMPOSTAZIONI_BASE, personaggi = {}}: Avvio) {
  const contenitore = document.getElementById('radice')!;
  const parametri = new URLSearchParams(location.search);
  const modo = parametri.get('modo') ?? 'anteprima';
  const reel = modulo.default ?? modulo.reel;
  const fps = dati.fps || 30;
  const totale = Math.max(1, Math.round(dati.durata * fps));

  window.addEventListener('error', (e) => {
    if (!window.__fmlabErrore) window.__fmlabErrore = {errore: e.message};
  });

  const sceneCodice = reel && reel.scene ? Object.keys(reel.scene) : [];
  const info = {
    slug,
    fps,
    totale,
    durata: dati.durata,
    motore: dati.motore,
    precisione: dati.precisione,
    voce: dati.voce,
    scene: dati.scene,
    segni: dati.segni,
    sceneCodice,
    zone: stile.zone,
    palco: stile.palco,
    sottotitoli: stile.sottotitoli,
    impostazioni,
    narratore: ingombroNarratore(impostazioni.narratore.chi === 'nessuno' ? null : personaggi[impostazioni.narratore.chi], impostazioni.narratore),
  };

  if (!reel || !reel.scene) {
    const errore = 'scene.tsx deve finire con:  export default definisciReel({ scene: { … } })';
    contenitore.textContent = errore;
    window.__fmlab = {info, pronto: Promise.resolve(), vai: async () => ({errore}), misura: () => [], tre: () => []};
    return;
  }

  const radice = createRoot(contenitore);

  if (modo === 'render') {
    contenitore.style.width = '1080px';
    contenitore.style.height = '1920px';
    contenitore.style.overflow = 'hidden';
    const disegna = (fotogramma: number, guide: boolean) =>
      flushSync(() => radice.render(<Palco reel={reel} dati={dati} slug={slug} frame={fotogramma} guide={guide} impostazioni={impostazioni} personaggi={personaggi} />));
    window.__fmlab = {
      info,
      pronto: (async () => {
        // carica tutti i font dichiarati prima del primo fotogramma, così nessuna scritta "salta"
        await Promise.all(Array.from(document.fonts).map((f) => f.load().catch(() => undefined)));
        await document.fonts.ready;
        disegna(0, false);
        await attendiImmagini();
      })(),
      vai: async (fotogramma, guide = false) => {
        window.__fmlabErrore = null;
        try {
          disegna(fotogramma, guide);
        } catch (e) {
          return {errore: e instanceof Error ? e.message : String(e)};
        }
        await attendiImmagini();
        const errore = window.__fmlabErrore as {scena?: string; errore: string} | null;
        return errore ? errore : {ok: true};
      },
      misura,
      tre,
    };
    return;
  }

  window.__fmlab = {info, pronto: Promise.resolve(), vai: async () => ({ok: true}), misura, tre};
  radice.render(<Player reel={reel} dati={dati} slug={slug} totale={totale} impostazioni={impostazioni} personaggi={personaggi} />);
}
