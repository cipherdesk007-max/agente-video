// FMLAB Reel Kit — sostegno alle prove: una voce finta per il motore "comando".
//   FMLAB_VOCE_COMANDO=node prove/sostegno/voce-finta.mjs {testo} {uscita}
// Una nota per ogni parola (lunga quanto la parola), pausa più lunga dopo le virgole: così le prove hanno un audio vero
// di cui si conoscono i tempi, senza reti e senza crediti.
import fs from 'node:fs';
const [fileTesto, fileUscita] = process.argv.slice(2);
const parole = fs.readFileSync(fileTesto, 'utf8').trim().split(/\s+/);
const hz = 22050;
const pezzi = [];
const silenzio = (s) => pezzi.push(new Int16Array(Math.round(s * hz)));
silenzio(0.08);
for (const p of parole) {
  const durata = 0.09 + 0.045 * p.length;
  const n = Math.round(durata * hz);
  const a = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const inviluppo = Math.min(1, i / 300, (n - i) / 300);
    a[i] = Math.round(9000 * inviluppo * Math.sin((2 * Math.PI * 220 * i) / hz));
  }
  pezzi.push(a);
  silenzio(/[,;:]$/.test(p) ? 0.28 : 0.03);
}
silenzio(0.1);
const dati = Buffer.concat(pezzi.map((p) => Buffer.from(p.buffer)));
const testa = Buffer.alloc(44);
testa.write('RIFF', 0); testa.writeUInt32LE(36 + dati.length, 4); testa.write('WAVEfmt ', 8); testa.writeUInt32LE(16, 16);
testa.writeUInt16LE(1, 20); testa.writeUInt16LE(1, 22); testa.writeUInt32LE(hz, 24); testa.writeUInt32LE(hz * 2, 28);
testa.writeUInt16LE(2, 32); testa.writeUInt16LE(16, 34); testa.write('data', 36); testa.writeUInt32LE(dati.length, 40);
fs.writeFileSync(fileUscita, Buffer.concat([testa, dati]));
