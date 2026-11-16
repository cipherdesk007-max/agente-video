// FMLAB Reel Kit — piccoli aiuti per i colori (esadecimali tipo "#39D5FF" oppure "rgb(57,213,255)").

function leggi(hex: string): [number, number, number] {
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(hex.trim());
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Stesso colore con trasparenza: alfa('#39D5FF', 0.3) */
export function alfa(hex: string, a: number): string {
  const [r, g, b] = leggi(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

/** Miscela due colori: p = 0 → il primo, p = 1 → il secondo. */
export function miscela(hexA: string, hexB: string, p: number): string {
  const a = leggi(hexA);
  const b = leggi(hexB);
  const q = Math.max(0, Math.min(1, p));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * q));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export const schiarisci = (hex: string, p: number) => miscela(hex, '#FFFFFF', p);
export const scurisci = (hex: string, p: number) => miscela(hex, '#000000', p);
