// FMLAB Reel Kit — sostegno alle prove: un "fornitore di immagini" finto per il motore "comando".
//   FMLAB_IMMAGINI_COMANDO="node prove/sostegno/immagine-finta.mjs {prompt} {uscita}"
// Scrive un PNG 64×64: fondo verde pieno con un quadrato bianco al centro (il "soggetto"). Segna ogni chiamata in
// un file accanto, così le prove contano quante volte è stato davvero chiamato (cioè quanto si sarebbe speso).
import fs from 'node:fs';
import zlib from 'node:zlib';
const [prompt, uscita] = process.argv.slice(2);
const L = 64;
const righe = [];
for (let y = 0; y < L; y++) {
  const riga = Buffer.alloc(1 + L * 3);
  for (let x = 0; x < L; x++) {
    const dentro = x >= 20 && x < 44 && y >= 20 && y < 44;
    riga.set(dentro ? [255, 255, 255] : [0, 255, 0], 1 + x * 3);
  }
  righe.push(riga);
}
const crc = (b) => {
  let c = ~0;
  for (const v of b) {
    c ^= v;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};
const pezzo = (tipo, dati) => {
  const corpo = Buffer.concat([Buffer.from(tipo), dati]);
  const lung = Buffer.alloc(4);
  lung.writeUInt32BE(dati.length);
  const somma = Buffer.alloc(4);
  somma.writeUInt32BE(crc(corpo));
  return Buffer.concat([lung, corpo, somma]);
};
const testa = Buffer.alloc(13);
testa.writeUInt32BE(L, 0);
testa.writeUInt32BE(L, 4);
testa.set([8, 2, 0, 0, 0], 8);
fs.writeFileSync(uscita, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', testa), pezzo('IDAT', zlib.deflateSync(Buffer.concat(righe))), pezzo('IEND', Buffer.alloc(0))]));
if (process.env.FMLAB_IMMAGINI_CONTA) fs.appendFileSync(process.env.FMLAB_IMMAGINI_CONTA, `${prompt.slice(0, 40)}\n`);
