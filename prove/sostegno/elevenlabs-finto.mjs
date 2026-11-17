// FMLAB Reel Kit — sostegno alle prove: un ElevenLabs finto, in casa, senza rete e senza crediti.
//   node prove/sostegno/elevenlabs-finto.mjs <porta> <registro.jsonl> [rifiuta]
// Risponde come /v1/text-to-speech/<voce>/with-timestamps: una nota per parola e i tempi di ogni carattere.
// Ogni richiesta finisce nel registro, così le prove contano quante frasi sono state "pagate" e con quale contesto.
// Con "rifiuta" risponde 422 alle richieste che portano previous_text o next_text, come un modello che non li accetta.
import fs from 'node:fs';
import http from 'node:http';
const [porta, registro, rifiuta] = process.argv.slice(2);
const HZ = 22050;

function frase(testo) {
  const parole = testo.trim().split(/\s+/);
  const pezzi = [];
  const caratteri = [];
  const inizi = [];
  const fini = [];
  let t = 0;
  const silenzio = (s) => {
    pezzi.push(new Int16Array(Math.round(s * HZ)));
    t += s;
  };
  silenzio(0.08);
  parole.forEach((p, k) => {
    const durata = 0.09 + 0.045 * p.length;
    const n = Math.round(durata * HZ);
    const a = new Int16Array(n);
    for (let i = 0; i < n; i++) a[i] = Math.round(9000 * Math.min(1, i / 300, (n - i) / 300) * Math.sin((2 * Math.PI * 220 * i) / HZ));
    pezzi.push(a);
    [...p].forEach((c, i, tutti) => {
      caratteri.push(c);
      inizi.push(t + (durata * i) / tutti.length);
      fini.push(t + (durata * (i + 1)) / tutti.length);
    });
    t += durata;
    const pausa = /[,;:]$/.test(p) ? 0.28 : 0.03;
    if (k < parole.length - 1) {
      caratteri.push(' ');
      inizi.push(t);
      fini.push(t + pausa);
    }
    silenzio(pausa);
  });
  silenzio(0.1);
  const dati = Buffer.concat(pezzi.map((p) => Buffer.from(p.buffer)));
  const testa = Buffer.alloc(44);
  testa.write('RIFF', 0); testa.writeUInt32LE(36 + dati.length, 4); testa.write('WAVEfmt ', 8); testa.writeUInt32LE(16, 16);
  testa.writeUInt16LE(1, 20); testa.writeUInt16LE(1, 22); testa.writeUInt32LE(HZ, 24); testa.writeUInt32LE(HZ * 2, 28);
  testa.writeUInt16LE(2, 32); testa.writeUInt16LE(16, 34); testa.write('data', 36); testa.writeUInt32LE(dati.length, 40);
  return {audio_base64: Buffer.concat([testa, dati]).toString('base64'), alignment: {characters: caratteri, character_start_times_seconds: inizi, character_end_times_seconds: fini}};
}

http
  .createServer((req, res) => {
    let corpo = '';
    req.on('data', (d) => (corpo += d));
    req.on('end', () => {
      if (req.method !== 'POST' || !/\/v1\/text-to-speech\/[^/]+\/with-timestamps/.test(req.url)) {
        res.writeHead(404).end('{}');
        return;
      }
      const dati = JSON.parse(corpo || '{}');
      const conContesto = dati.previous_text !== undefined || dati.next_text !== undefined;
      const accettata = !(rifiuta && conContesto);
      fs.appendFileSync(registro, JSON.stringify({testo: dati.text, prima: dati.previous_text ?? null, dopo: dati.next_text ?? null, accettata}) + '\n');
      if (!accettata) {
        res.writeHead(422, {'Content-Type': 'application/json'}).end('{"detail":"previous_text non accettato da questo modello"}');
        return;
      }
      res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(frase(dati.text)));
    });
  })
  .listen(Number(porta), '127.0.0.1', () => console.log('pronto'));
