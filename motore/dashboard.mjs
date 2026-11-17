// FMLAB Reel Kit — LA DASHBOARD CHE PARTE DA SOLA.
//
// La dashboard è il pannello (npm run pannello). Chi lavora nel terminale, persona o agente, comincia sempre da
// `npm run stato`: se la dashboard non è accesa, quel comando la accende in un processo a parte e la apre nel
// browser, così chi guarda vede in diretta quello che l'agente fa. Se è già accesa, dice solo l'indirizzo.
//
//   FMLAB_DASHBOARD=no   non accenderla mai da sola        npm run pannello ferma   la spegne
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {CACHE, RADICE} from './percorsi.mjs';

const base = () => (process.env.FMLAB_REGISTRO ? path.resolve(process.env.FMLAB_REGISTRO) : CACHE);
const fileInfo = () => path.join(base(), 'pannello.json');

export function scriviInfoPannello(info) {
  try {
    fs.mkdirSync(base(), {recursive: true});
    fs.writeFileSync(fileInfo(), JSON.stringify({...info, pid: process.pid, acceso: new Date().toISOString()}), {mode: 0o600});
    process.on('exit', () => {
      try {
        if (JSON.parse(fs.readFileSync(fileInfo(), 'utf8')).pid === process.pid) fs.rmSync(fileInfo(), {force: true});
      } catch {
        // già tolto
      }
    });
  } catch {
    // senza questo file la dashboard funziona lo stesso: solo non si ritrova da sola
  }
}

/** La dashboard accesa su questo computer, o null. */
export function dashboardViva() {
  try {
    const info = JSON.parse(fs.readFileSync(fileInfo(), 'utf8'));
    process.kill(info.pid, 0);
    return info;
  } catch {
    return null;
  }
}

/** Accende la dashboard se non c'è. Torna {indirizzo, nuova} oppure null (spenta per scelta, o non partita). */
export async function assicuraDashboard() {
  const viva = dashboardViva();
  if (viva) return {...viva, nuova: false};
  const scelta = process.env.FMLAB_DASHBOARD ?? '';
  if (/^(no|0|false)$/i.test(scelta)) return null;
  // nelle prove e nei lavori lanciati dal pannello stesso non se ne accende un'altra
  if (process.env.FMLAB_NON_APRIRE && !/^(si|sì|1|true)$/i.test(scelta)) return null;
  try {
    fs.mkdirSync(base(), {recursive: true});
    const registro = fs.openSync(path.join(base(), 'pannello.log'), 'a');
    const figlio = spawn(process.execPath, [path.join(RADICE, 'motore', 'cli.mjs'), 'pannello'], {cwd: RADICE, detached: true, stdio: ['ignore', registro, registro], env: {...process.env, FMLAB_VISTA: 'adesso'}});
    figlio.unref();
    for (let i = 0; i < 50; i++) {
      await new Promise((ok) => setTimeout(ok, 120));
      const v = dashboardViva();
      if (v && v.pid === figlio.pid) return {...v, nuova: true};
    }
  } catch {
    // niente dashboard: il lavoro nel terminale va avanti lo stesso
  }
  return null;
}

export function fermaDashboard() {
  const viva = dashboardViva();
  if (!viva) return false;
  try {
    process.kill(viva.pid, 'SIGTERM');
  } catch {
    return false;
  }
  fs.rmSync(fileInfo(), {force: true});
  return true;
}
