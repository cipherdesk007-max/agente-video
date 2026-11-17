// FMLAB Reel Kit — LE CHIAVI: cosa serve nel file .env, cosa c'è e cosa manca.
//
// Le chiavi stanno solo nel file .env, sul computer di chi usa il kit. La dashboard dice "c'è" o "manca" e le può
// scrivere, ma solo dal computer stesso, e non le mostra mai: una chiave scritta non torna più indietro.
// Le regolazioni che non sono segrete (il modello della voce, chi genera le immagini) si vedono.
import fs from 'node:fs';
import path from 'node:path';
import {ErroreFmlab, RADICE} from './percorsi.mjs';

export const CHIAVI = [
  {nome: 'ELEVENLABS_API_KEY', gruppo: 'Voce · ElevenLabs', cosa: 'la chiave del tuo account ElevenLabs', segreto: true},
  {nome: 'ELEVENLABS_VOICE_ID', gruppo: 'Voce · ElevenLabs', cosa: 'l\'ID della voce dei reel (lo trovi nella pagina della voce)', segreto: true},
  {nome: 'ELEVENLABS_MODEL', gruppo: 'Voce · ElevenLabs', cosa: 'il modello: lo stesso con cui è stata registrata la banca delle frasi', segreto: false, esempio: 'eleven_v4'},
  {nome: 'ELEVENLABS_STABILITY', gruppo: 'Voce · ElevenLabs', cosa: 'stabilità, da 0 a 1', segreto: false, esempio: '0.5'},
  {nome: 'ELEVENLABS_SIMILARITY', gruppo: 'Voce · ElevenLabs', cosa: 'somiglianza, da 0 a 1', segreto: false, esempio: '0.75'},
  {nome: 'FMLAB_IMMAGINI', gruppo: 'Immagini', cosa: 'chi genera le illustrazioni: nessuno, higgsfield, stability, comando', segreto: false, esempio: 'nessuno'},
  {nome: 'HF_API_KEY_ID', gruppo: 'Immagini · Higgsfield', cosa: 'prima chiave (cloud.higgsfield.ai)', segreto: true},
  {nome: 'HF_API_KEY_SECRET', gruppo: 'Immagini · Higgsfield', cosa: 'seconda chiave', segreto: true},
  {nome: 'STABILITY_API_KEY', gruppo: 'Immagini · Stability', cosa: 'la chiave di Stability', segreto: true},
  {nome: 'FMLAB_AGENTE', gruppo: 'Agente', cosa: 'il comando con cui avvii il tuo agente dal Terminale: accende il pulsante "Avvia l\'agente"', segreto: false},
];

/** FMLAB_ENV sposta il file (serve alle prove, per non toccare quello vero). */
export const fileEnv = () => (process.env.FMLAB_ENV ? path.resolve(process.env.FMLAB_ENV) : path.join(RADICE, '.env'));

function righeEnv() {
  try {
    return fs.readFileSync(fileEnv(), 'utf8').split(/\r?\n/);
  } catch {
    return [];
  }
}
const valoreDi = (righe, nome) => {
  for (const r of righe) {
    const m = r.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && m[1] === nome) return m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return '';
};

/** Per ogni chiave: se c'è. Il valore torna solo per le regolazioni che non sono segrete. */
export function statoChiavi() {
  const righe = righeEnv();
  return CHIAVI.map((c) => {
    const valore = valoreDi(righe, c.nome) || process.env[c.nome] || '';
    return {nome: c.nome, gruppo: c.gruppo, cosa: c.cosa, segreto: c.segreto, esempio: c.esempio ?? null, presente: valore !== '', valore: c.segreto ? null : valore};
  });
}

/** Scrive (o toglie, con un valore vuoto) una riga del file .env. Solo i nomi dell'elenco, solo una riga. */
export function scriviChiave(nome, valore) {
  const voce = CHIAVI.find((c) => c.nome === nome);
  if (!voce) throw new ErroreFmlab(`"${String(nome).slice(0, 40)}" non è una delle righe che la dashboard può scrivere. Le altre si scrivono a mano nel file .env.`);
  const pulito = String(valore ?? '').trim();
  if (/[\r\n]/.test(pulito) || pulito.length > 600) throw new ErroreFmlab('Il valore deve stare su una riga sola.');
  const file = fileEnv();
  const righe = righeEnv();
  const riga = pulito === '' ? null : `${nome}=${/\s|#/.test(pulito) ? JSON.stringify(pulito) : pulito}`;
  const dove = righe.findIndex((r) => new RegExp(`^\\s*${nome}\\s*=`).test(r));
  if (dove >= 0) {
    if (riga) righe[dove] = riga;
    else righe.splice(dove, 1);
  } else if (riga) {
    if (righe.length && righe[righe.length - 1] !== '') righe.push('');
    righe.splice(righe[righe.length - 1] === '' ? righe.length - 1 : righe.length, 0, riga);
  }
  const testo = righe.join('\n').replace(/\n*$/, '\n');
  fs.writeFileSync(file, testo, {mode: 0o600});
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // su alcuni dischi i permessi non si possono cambiare
  }
  if (pulito === '') delete process.env[nome];
  else process.env[nome] = pulito;
  return {nome, presente: pulito !== ''};
}
