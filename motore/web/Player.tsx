// FMLAB Reel Kit — anteprima nel browser: il reel con play/pausa, cursore, audio e salto alle scene.
// Tasti: spazio = play/pausa · frecce = un fotogramma avanti/indietro (con Maiusc: mezzo secondo) · G = zone sicure.
import {useCallback, useEffect, useRef, useState} from 'react';
import type {DatiReel} from '../../libreria/tempo';
import type {Reel} from '../../libreria/reel';
import type {ConfigPersonaggio, Impostazioni} from '../../libreria/impostazioni';
import {Palco} from './Palco';

const BARRA = 132;

function istanteIniziale(fps: number, totale: number) {
  const m = /t=([\d.]+)/.exec(location.hash);
  return m ? Math.min(totale - 1, Math.max(0, Math.round(Number(m[1]) * fps))) : 0;
}

type PropsPlayer = {reel: Reel; dati: DatiReel; slug: string; totale: number; impostazioni?: Impostazioni; personaggi?: Record<string, ConfigPersonaggio>};

export function Player({reel, dati, slug, totale, impostazioni, personaggi}: PropsPlayer) {
  const fps = dati.fps || 30;
  const [frame, setFrame] = useState(() => istanteIniziale(fps, totale));
  const [suona, setSuona] = useState(false);
  const [guide, setGuide] = useState(false);
  const [scala, setScala] = useState(0.4);
  const audio = useRef<HTMLAudioElement | null>(null);
  const orologio = useRef({partenza: 0, base: 0});
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    const misura = () => setScala(Math.min(window.innerWidth / 1080, (window.innerHeight - BARRA) / 1920));
    misura();
    window.addEventListener('resize', misura);
    return () => window.removeEventListener('resize', misura);
  }, []);

  const pausa = useCallback(() => {
    setSuona(false);
    audio.current?.pause();
  }, []);

  const play = useCallback(() => {
    const da = frameRef.current >= totale - 1 ? 0 : frameRef.current;
    if (da === 0) setFrame(0);
    orologio.current = {partenza: performance.now(), base: da / fps};
    const a = audio.current;
    if (a) {
      a.currentTime = da / fps;
      a.play().catch(() => undefined);
    }
    setSuona(true);
  }, [fps, totale]);

  const vaiA = useCallback(
    (f: number) => {
      const n = Math.min(totale - 1, Math.max(0, Math.round(f)));
      setFrame(n);
      orologio.current = {partenza: performance.now(), base: n / fps};
      if (audio.current) audio.current.currentTime = n / fps;
    },
    [fps, totale]
  );

  useEffect(() => {
    if (!suona) return;
    let id = 0;
    const passo = () => {
      const a = audio.current;
      // finché l'audio suona è lui l'orologio: così bocca e parole restano agganciate alla voce
      const ora = a && !a.paused && !a.ended ? a.currentTime : orologio.current.base + (performance.now() - orologio.current.partenza) / 1000;
      const n = Math.min(totale - 1, Math.floor(ora * fps));
      setFrame(n);
      if (n >= totale - 1) {
        setSuona(false);
        a?.pause();
        return;
      }
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [suona, fps, totale]);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (suona) pausa();
        else play();
      } else if (e.code === 'ArrowRight') vaiA(frameRef.current + (e.shiftKey ? fps / 2 : 1));
      else if (e.code === 'ArrowLeft') vaiA(frameRef.current - (e.shiftKey ? fps / 2 : 1));
      else if (e.code === 'KeyG') setGuide((g) => !g);
    };
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  }, [suona, play, pausa, vaiA, fps]);

  // se cambiano copione, scene o stile, l'anteprima si ricarica da sola restando allo stesso istante
  useEffect(() => {
    const parametri = new URLSearchParams(location.search);
    const ricarica = parametri.get('ricarica');
    if (!ricarica) return;
    let prima: string | null = null;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/__fmlab/versione?reel=${encodeURIComponent(slug)}`, {cache: 'no-store'});
        const v = await r.text();
        if (prima !== null && v !== prima) location.replace(`${ricarica}#t=${(frameRef.current / fps).toFixed(2)}`);
        prima = v;
      } catch {
        // il server di anteprima è stato chiuso: non fa niente
      }
    }, 1200);
    return () => clearInterval(id);
  }, [slug, fps]);

  const ora = frame / fps;
  const scena = dati.scene.find((s) => ora >= s.inizio && ora < s.fine) ?? dati.scene[dati.scene.length - 1];
  const bottone = {
    font: '600 15px system-ui, sans-serif',
    color: '#fff',
    background: '#1c2230',
    border: '1px solid #343d52',
    borderRadius: 10,
    padding: '8px 12px',
    cursor: 'pointer',
  } as const;

  return (
    <div style={{position: 'fixed', inset: 0, background: '#07090d', color: '#fff', font: '500 14px system-ui, sans-serif'}}>
      <div style={{position: 'absolute', left: '50%', top: 0, width: 1080 * scala, height: 1920 * scala, marginLeft: (-1080 * scala) / 2, overflow: 'hidden'}}>
        <div style={{width: 1080, height: 1920, transform: `scale(${scala})`, transformOrigin: '0 0'}}>
          <Palco reel={reel} dati={dati} slug={slug} frame={frame} guide={guide} impostazioni={impostazioni} personaggi={personaggi} />
        </div>
      </div>
      {dati.voce ? <audio ref={audio} src={`/reels/${slug}/${dati.voce}`} preload="auto" /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: BARRA, boxSizing: 'border-box', padding: '10px 14px', background: '#0e1118', borderTop: '1px solid #222a3a'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <button type="button" style={{...bottone, minWidth: 82}} onClick={() => (suona ? pausa() : play())}>
            {suona ? 'Pausa' : 'Play'}
          </button>
          <input
            type="range"
            min={0}
            max={totale - 1}
            value={frame}
            onChange={(e) => {
              pausa();
              vaiA(Number(e.target.value));
            }}
            style={{flex: 1, minWidth: 60}}
          />
          <span style={{fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
            {ora.toFixed(2).replace('.', ',')} / {dati.durata.toFixed(1).replace('.', ',')} s
          </span>
          <button type="button" style={{...bottone, background: guide ? '#7a2231' : '#1c2230'}} onClick={() => setGuide((g) => !g)}>
            Zone
          </button>
        </div>
        <div style={{display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', whiteSpace: 'nowrap'}}>
          {dati.scene.map((s) => (
            <button
              key={s.nome}
              type="button"
              style={{...bottone, padding: '5px 10px', background: s.nome === scena.nome ? '#2d5bd0' : '#1c2230'}}
              onClick={() => {
                pausa();
                vaiA(s.inizio * fps + 1);
              }}
            >
              {s.nome}
            </button>
          ))}
        </div>
        <div style={{marginTop: 7, color: '#8d98b3', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
          {dati.motore === 'stima' ? 'Tempi stimati, senza voce · ' : ''}
          {Object.entries(dati.segni)
            .filter(([, t]) => t >= scena.inizio && t < scena.fine)
            .map(([nome, t]) => `[${nome}] ${t.toFixed(1)}`)
            .join('  ')}
        </div>
      </div>
    </div>
  );
}
