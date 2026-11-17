// FMLAB Reel Kit — trova Chrome (o un browser della stessa famiglia) e lo usa per "fotografare" le scene.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {ErroreFmlab, FORMATO} from './percorsi.mjs';

function candidati() {
  const casa = os.homedir();
  const lista = [];
  if (process.env.FMLAB_CHROME) lista.push(process.env.FMLAB_CHROME);
  if (process.platform === 'darwin') {
    for (const base of ['/Applications', path.join(casa, 'Applications')]) {
      lista.push(
        `${base}/Google Chrome.app/Contents/MacOS/Google Chrome`,
        `${base}/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
        `${base}/Chromium.app/Contents/MacOS/Chromium`,
        `${base}/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`,
        `${base}/Brave Browser.app/Contents/MacOS/Brave Browser`
      );
    }
  } else if (process.platform === 'win32') {
    const basi = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    for (const base of basi) {
      lista.push(
        path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(base, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
      );
    }
  } else {
    lista.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      '/usr/bin/microsoft-edge'
    );
  }
  try {
    lista.push(chromium.executablePath());
  } catch {
    // nessun browser scaricato da playwright: va bene così
  }
  return lista;
}

export function trovaBrowser() {
  for (const c of candidati()) {
    if (c && fs.existsSync(c)) return c;
  }
  throw new ErroreFmlab(
    [
      'Non trovo Google Chrome (serve per disegnare i fotogrammi).',
      'Soluzioni:',
      '  1. installa Google Chrome da https://www.google.com/chrome/ e riprova;',
      '  2. se usi Edge, Brave o Chromium in una cartella particolare, indica il percorso nel file .env:',
      '     FMLAB_CHROME=/percorso/del/browser',
    ].join('\n')
  );
}

export async function avviaBrowser() {
  const eseguibile = trovaBrowser();
  try {
    return await chromium.launch({
      executablePath: eseguibile,
      headless: true,
      // Ctrl+C e "Ferma" li gestisce il kit (motore/cli.mjs): chiude lui il browser e pulisce i file a metà
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
      args: [
        '--force-color-profile=srgb',
        '--hide-scrollbars',
        '--disable-lcd-text',
        '--font-render-hinting=none',
        '--mute-audio',
        '--autoplay-policy=no-user-gesture-required',
        // niente collegamenti a internet durante il lavoro: il render funziona anche senza rete
        '--disable-background-networking',
        '--disable-sync',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        '--no-pings',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
      ],
    });
  } catch (e) {
    throw new ErroreFmlab(`Non riesco ad avviare il browser:\n  ${eseguibile}\n${String(e.message).split('\n').slice(0, 3).join('\n')}`);
  }
}

/**
 * Apre la pagina di un reel in modalità render e aspetta che font e scene siano pronti.
 * `scala` 1 = misura piena, 0.5 = bozza a metà pixel (stessa impaginazione). `formato` = larghezza e altezza del
 * video (di serie 1080x1920; quadrato e orizzontale: vedi FORMATI in percorsi.mjs).
 */
export async function apriPagina(browser, url, {scala = 1, formato = FORMATO} = {}) {
  const contesto = await browser.newContext({
    viewport: {width: formato.larghezza, height: formato.altezza},
    deviceScaleFactor: 1,
  });
  // la pagina è sempre impaginata a 1080x1920; per le bozze è la "fotografia" a essere rimpicciolita
  const ritaglio = scala === 1 ? {} : {clip: {x: 0, y: 0, width: formato.larghezza, height: formato.altezza, scale: scala}};
  const pagina = await contesto.newPage();
  const errori = [];
  pagina.on('pageerror', (e) => errori.push(e.message));
  pagina.on('console', (m) => {
    if (m.type() === 'error') errori.push(m.text());
  });
  pagina.on('requestfailed', (r) => errori.push(`File non caricato: ${r.url()}`));
  pagina.on('response', (r) => {
    if (r.status() >= 400) errori.push(`File non trovato (${r.status()}): ${r.url()}`);
  });
  await pagina.goto(url, {waitUntil: 'load'});
  try {
    await pagina.waitForFunction(() => Boolean(window.__fmlab), null, {timeout: 20000});
  } catch {
    throw new ErroreFmlab(`La pagina del reel non si è avviata.\n${errori.slice(0, 5).join('\n') || '(nessun messaggio dal browser)'}`);
  }
  const info = await pagina.evaluate(async () => {
    await window.__fmlab.pronto;
    return window.__fmlab.info;
  });
  const cdp = await contesto.newCDPSession(pagina);

  async function vai(fotogramma) {
    const esito = await pagina.evaluate((n) => window.__fmlab.vai(n), fotogramma);
    if (esito && esito.errore) {
      throw new ErroreFmlab(`Errore nella scena${esito.scena ? ` "${esito.scena}"` : ''} al secondo ${(fotogramma / info.fps).toFixed(2)}:\n  ${esito.errore}`);
    }
  }

  return {
    pagina,
    info,
    errori,
    vai,
    /** JPEG veloce, per il video. */
    async jpeg(qualita = 92) {
      const {data} = await cdp.send('Page.captureScreenshot', {format: 'jpeg', quality: qualita, optimizeForSpeed: true, ...ritaglio});
      return Buffer.from(data, 'base64');
    },
    /** PNG senza perdita, per i fotogrammi da guardare. */
    async png() {
      const {data} = await cdp.send('Page.captureScreenshot', {format: 'png', ...ritaglio});
      return Buffer.from(data, 'base64');
    },
    async chiudi() {
      await contesto.close();
    },
  };
}
