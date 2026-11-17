// FMLAB Reel Kit — LA PROVA CIECA. Una pagina con dieci spezzoni di cinque secondi, senza audio: cinque dai video
// di riferimento e cinque dal kit, mescolati. Si vede solo il palco: narratore e sottotitoli sono tagliati via,
// perché tradirebbero da dove viene lo spezzone. Tre persone dicono per ognuno "riferimento" o "kit".
// Passata se nessuno ne indovina più di 6 su 10: vuol dire che a occhio non si distinguono.
//
//   npm run prova-cieca                     spezzoni del kit da tutti i reel, resi adesso (bozza): sempre aggiornati
//   npm run prova-cieca reel=reta-testo     solo da quel reel (o più: reel=a,b)
//   npm run prova-cieca seme=7              un'altra scelta di spezzoni (di serie il seme è 1: stessa prova rifatta = stessi momenti)
//
// Esce prova-cieca/prova-cieca.html (un file solo, si apre anche dal telefono) e prova-cieca/soluzione.txt.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ErroreFmlab, RADICE, cartellaReel, elencoReel, leggiJson, rel} from './percorsi.mjs';
import {infoMedia, trovaFfmpeg} from './ffmpeg.mjs';

export const SPEZZONE = 5;
/** La parte di fotogramma che si mostra: tutto il palco, senza la fascia dei sottotitoli sopra né il narratore sotto. */
export const RITAGLIO = {y0: 0.235, y1: 0.69};

/** Numeri a caso ripetibili: stesso seme, stessa prova. */
export function caso(seme) {
  let s = (seme >>> 0) || 1;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * Sceglie `quanti` spezzoni tra più video: a turno un video alla volta, inizio a caso lontano da testa e coda,
 * mai due spezzoni che si toccano nello stesso video.
 * @param {{nome: string, durata: number}[]} video
 * @returns {{nome: string, da: number}[]}
 */
export function scegliSpezzoni(video, quanti, tira) {
  const adatti = video.filter((v) => v.durata >= SPEZZONE + 6);
  if (!adatti.length) return [];
  const scelti = [];
  for (let giro = 0; scelti.length < quanti && giro < quanti * 40; giro++) {
    const v = adatti[giro % adatti.length];
    const da = Math.round((2.5 + tira() * (v.durata - SPEZZONE - 5)) * 10) / 10;
    if (!scelti.some((s) => s.nome === v.nome && Math.abs(s.da - da) < SPEZZONE + 1)) scelti.push({nome: v.nome, da});
  }
  return scelti;
}

/** Taglia uno spezzone: solo il palco, senza audio, piccolo. Restituisce il file come dato da mettere nella pagina. */
function taglia(ff, file, da, uscita) {
  const filtro = `crop=iw:ih*${(RITAGLIO.y1 - RITAGLIO.y0).toFixed(3)}:0:ih*${RITAGLIO.y0},scale=432:-2,fps=24`;
  const r = spawnSync(ff.percorso, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', da.toFixed(2), '-t', String(SPEZZONE), '-i', file, '-an', '-vf', filtro, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', uscita], {encoding: 'utf8'});
  if (r.status !== 0 || !fs.existsSync(uscita)) throw new ErroreFmlab(`ffmpeg non riesce a tagliare lo spezzone da ${file}:\n${(r.stderr ?? '').split('\n').slice(-3).join('\n')}`);
  return `data:video/mp4;base64,${fs.readFileSync(uscita).toString('base64')}`;
}

/** La pagina: dieci spezzoni, due pulsanti ciascuno, il conto per ogni persona e il verdetto dopo tre. */
export function paginaProvaCieca(spezzoni, {quando = ''} = {}) {
  // la soluzione sta nella pagina ma non in chiaro: chi fa la prova non la legge per sbaglio
  const chiave = Buffer.from(spezzoni.map((s) => (s.kit ? 'k' : 'r')).join('')).toString('base64');
  return `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prova cieca · FMLAB</title><style>
  body{margin:0;background:#0b0d14;color:#fff;font:500 16px/1.4 system-ui,sans-serif;padding:16px;max-width:940px;margin:auto}
  h1{font-size:22px;margin:0 0 6px} p{color:#aab3d6;margin:0 0 14px}
  .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
  .c{background:#141826;border-radius:12px;padding:10px} video{width:100%;border-radius:8px;display:block;background:#000}
  .n{color:#7f89b0;font-size:13px;margin:6px 0}
  .b{display:flex;gap:8px} button{flex:1;padding:12px 6px;border-radius:10px;border:2px solid #2a3150;background:#0b0d14;color:#fff;font:600 15px system-ui;cursor:pointer}
  button.s{border-color:#ffd23f;color:#ffd23f} #fine{margin:18px 0;width:100%;border-color:#5cf2c8;color:#5cf2c8}
  #esito{font-size:18px;font-weight:700;white-space:pre-line;margin-bottom:30px}
</style>
<h1>Prova cieca</h1>
<p>Dieci spezzoni di ${SPEZZONE} secondi, senza audio. Cinque vengono da video fatti da altri, cinque dal kit. Per ognuno di': è un <b>riferimento</b> o è il <b>kit</b>? Guarda come è fatto, non in che lingua sono le scritte. La fanno tre persone, una alla volta.${quando ? ` Preparata il ${quando}.` : ''}</p>
<div class="g">${spezzoni.map((s, i) => `<div class="c"><video src="${s.src}" autoplay loop muted playsinline></video><div class="n">Spezzone ${i + 1}</div><div class="b"><button data-i="${i}" data-v="r">riferimento</button><button data-i="${i}" data-v="k">kit</button></div></div>`).join('')}</div>
<button id="fine">Ho finito: segna la mia prova</button>
<div id="esito"></div>
<script>
  const giuste = atob(${JSON.stringify(chiave)});
  const scelte = {};
  const persone = [];
  document.querySelectorAll('button[data-i]').forEach((b) => b.onclick = () => {
    scelte[b.dataset.i] = b.dataset.v;
    document.querySelectorAll('button[data-i="' + b.dataset.i + '"]').forEach((x) => x.classList.toggle('s', x === b));
  });
  document.getElementById('fine').onclick = () => {
    const esito = document.getElementById('esito');
    if (Object.keys(scelte).length < giuste.length) { esito.textContent = 'Mancano ' + (giuste.length - Object.keys(scelte).length) + ' risposte.'; return; }
    persone.push([...giuste].filter((g, i) => scelte[i] === g).length);
    for (const k of Object.keys(scelte)) delete scelte[k];
    document.querySelectorAll('button.s').forEach((x) => x.classList.remove('s'));
    const righe = persone.map((n, i) => 'Persona ' + (i + 1) + ': ' + n + ' su ' + giuste.length + ' indovinati');
    if (persone.length >= 3) righe.push('', persone.every((n) => n <= 6) ? 'PASSATA: nessuno ne ha indovinati più di 6. A occhio non si distinguono.' : 'NON PASSATA: qualcuno ne ha indovinati più di 6. Si distinguono ancora.');
    else righe.push('', 'Ora tocca alla persona ' + (persone.length + 1) + ' (servono tre persone).');
    esito.textContent = righe.join('\\n');
    window.scrollTo(0, 0);
  };
</script></html>`;
}

/** npm run prova-cieca [seme=N] [reel=a,b] */
export async function comandoProvaCieca(argomenti = []) {
  const seme = Number(argomenti.find((a) => a.startsWith('seme='))?.slice(5) ?? 1);
  const soloReel = argomenti.find((a) => a.startsWith('reel='))?.slice(5).split(',').filter(Boolean);
  const ff = await trovaFfmpeg();
  const cartellaRif = path.join(RADICE, 'riferimenti');
  const fileRif = fs.existsSync(cartellaRif) ? fs.readdirSync(cartellaRif).filter((f) => /\.(mp4|mov)$/i.test(f)).sort() : [];
  if (!fileRif.length) throw new ErroreFmlab('In riferimenti/ non ci sono video: la prova cieca ha bisogno dei video di riferimento (restano fuori da Git, vanno copiati lì).');
  const reel = (soloReel ?? elencoReel().filter((r) => !r.startsWith('zz-'))).filter((r) => fs.existsSync(path.join(cartellaReel(r), 'parole.json')));
  if (!reel.length) throw new ErroreFmlab('Nessun reel del kit da cui prendere gli spezzoni.');
  const tira = caso(seme);
  const riferimenti = scegliSpezzoni(fileRif.map((f) => ({nome: f, durata: infoMedia(ff, path.join(cartellaRif, f)).durata ?? 0})), 5, tira);
  const kit = scegliSpezzoni(reel.map((r) => ({nome: r, durata: leggiJson(path.join(cartellaReel(r), 'parole.json')).durata})), 5, tira);
  if (riferimenti.length < 5 || kit.length < 5) throw new ErroreFmlab('Non ci sono abbastanza secondi di video per dieci spezzoni.');

  const uscita = path.join(RADICE, 'prova-cieca');
  fs.rmSync(uscita, {recursive: true, force: true});
  fs.mkdirSync(uscita, {recursive: true});
  const {rendi} = await import('./render.mjs');
  const spezzoni = [];
  for (const [n, s] of riferimenti.entries()) spezzoni.push({kit: false, da: s.da, nome: s.nome, src: taglia(ff, path.join(cartellaRif, s.nome), s.da, path.join(uscita, `r${n}.mp4`))});
  for (const [n, s] of kit.entries()) {
    // lo spezzone del kit si rende adesso, dal codice e dal piano di adesso: la prova non guarda mai un video vecchio
    const fps = leggiJson(path.join(cartellaReel(s.nome), 'parole.json')).fps || 30;
    const intero = path.join(uscita, `k${n}.intero.mp4`);
    console.log(`  spezzone del kit ${n + 1}/5: ${s.nome} da ${s.da.toFixed(1)} s`);
    await rendi(s.nome, null, {bozza: true, da: Math.round(s.da * fps), a: Math.round((s.da + SPEZZONE) * fps), uscita: intero, silenzioso: true});
    spezzoni.push({kit: true, da: s.da, nome: s.nome, src: taglia(ff, intero, 0, path.join(uscita, `k${n}.mp4`))});
    fs.rmSync(intero, {force: true});
  }
  // mescolati con lo stesso seme: Fisher-Yates
  for (let i = spezzoni.length - 1; i > 0; i--) {
    const j = Math.floor(tira() * (i + 1));
    [spezzoni[i], spezzoni[j]] = [spezzoni[j], spezzoni[i]];
  }
  const pagina = path.join(uscita, 'prova-cieca.html');
  fs.writeFileSync(pagina, paginaProvaCieca(spezzoni, {quando: new Date().toLocaleDateString('it-IT')}));
  fs.writeFileSync(path.join(uscita, 'soluzione.txt'), spezzoni.map((s, i) => `Spezzone ${i + 1}: ${s.kit ? 'KIT' : 'RIFERIMENTO'} · ${s.nome} da ${s.da.toFixed(1)} s`).join('\n') + '\n');
  for (const f of fs.readdirSync(uscita)) if (/^[rk]\d+\.mp4$/.test(f)) fs.rmSync(path.join(uscita, f));
  console.log(`\nProva cieca pronta: ${rel(pagina)} (${(fs.statSync(pagina).size / 1e6).toFixed(1)} MB, un file solo: si apre anche dal telefono).\nFalla fare a tre persone che non hanno visto i video. Passata se nessuno ne indovina più di 6 su 10.\nLa soluzione è in ${rel(path.join(uscita, 'soluzione.txt'))}: non farla vedere prima.`);
  return {pagina, spezzoni: spezzoni.map(({src, ...resto}) => resto)};
}
