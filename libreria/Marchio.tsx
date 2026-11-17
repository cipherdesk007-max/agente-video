// FMLAB Reel Kit — IL LOGO della pagina (stile/logo.png) come oggetto del palco.
//
//   <Logo x={540} y={760} larghezza={460} da={s.dopo('pagina')} />
//
// Entra con un piccolo rimbalzo e poi "respira" appena, con il suo bagliore. Per la sigla intera (logo + nome)
// c'è la scena pronta bloccoSigla; per averlo sopra il cartello finale: bloccoChiusura({..., logo: true}).
import {curve, mix, molla, onda, rampa} from './anim';
import {stile} from '../stile/stile';
import {useTempo} from './tempo';
import regali from '../stile/regali.json';

export type Regalo = {file: string; titolo: string; misure: [number, number]; parola?: string};

/** I regali della pagina (ebook, mappe, PDF) con la loro copertina: `stile/regali.json`, li aggiunge `npm run regalo`. */
export const REGALI = regali as Record<string, Regalo>;

/** Il regalo con quel nome; senza nome, il primo dell'elenco. Un nome che non esiste ferma la scena e dice quali ci sono. */
export function regaloDi(nome?: string): Regalo {
  const nomi = Object.keys(REGALI);
  if (nome === undefined || nome === 'auto') return REGALI[nomi[0]] ?? {file: stile.ebook.file, titolo: stile.ebook.titolo, misure: stile.ebook.misure};
  const scelto = REGALI[nome.toLowerCase()];
  if (!scelto) throw new Error(`bloccoEbook: il regalo "${nome}" non esiste. Ci sono: ${nomi.join(', ') || '(nessuno)'}. Per aggiungerne uno: npm run regalo <nome> <copertina.jpg|pdf> "Titolo".`);
  return scelto;
}

export function Logo({x, y, larghezza = 420, da, fino, bagliore = 1, spento = 0}: {x: number; y: number; larghezza?: number; /** Secondi da quando compare (di solito s.dopo('segno')). */ da: number; fino?: number; /** 0…1: quanto è forte l'alone attorno. */ bagliore?: number; spento?: number}) {
  const tempo = useTempo();
  if (da <= 0) return null;
  const uscita = fino === undefined ? 0 : rampa(fino, 0.25, curve.entra);
  if (uscita >= 1) return null;
  const [l, a] = stile.logo.misure;
  const altezza = (larghezza * a) / l;
  const p = molla(da, {rigidita: 190, smorzamento: 15});
  const respiro = 1 + 0.012 * onda(tempo.ora, 3.4);
  return (
    <img
      src={`/stile/${stile.logo.file}`}
      alt=""
      style={{
        position: 'absolute',
        left: x - larghezza / 2,
        top: y - altezza / 2,
        width: larghezza,
        height: altezza,
        opacity: rampa(da, 0.18) * (1 - uscita) * (1 - 0.6 * spento),
        transform: `scale(${(mix(0.6, 1, p) * respiro).toFixed(4)})`,
        filter: bagliore > 0 ? `drop-shadow(0 0 ${Math.round(larghezza * 0.07 * bagliore * (1 + 0.25 * onda(tempo.ora, 2.6)))}px rgba(60,255,110,0.55))` : undefined,
      }}
    />
  );
}

/**
 * L'EBOOK della pagina (stile/ebook.jpg) su un tablet in 3D vero: entra girando, poi oscilla piano e mostra lo spessore.
 *
 *   <Ebook x={540} y={860} larghezza={470} da={s.dopo('database')} />
 *
 * Per la scena intera ("Commenta MAPPA e te lo mando") c'è bloccoEbook. Per cambiare copertina: sostituisci stile/ebook.jpg.
 */
export function Ebook({x, y, larghezza = 460, da, fino, gira = 22, bagliore = 1, file, misure, giro = 0}: {x: number; y: number; larghezza?: number; da: number; fino?: number; /** Gradi di oscillazione a destra e a sinistra (0 = fermo, di fronte). */ gira?: number; bagliore?: number; /** Un'altra copertina, dalla cartella stile/. */ file?: string; /** Larghezza e altezza della copertina in pixel (di serie quelle di stile.ebook). */ misure?: [number, number]; /** Gradi in più attorno all'asse verticale: 360 = un giro intero (per farlo girare su una parola). */ giro?: number}) {
  const tempo = useTempo();
  if (da <= 0) return null;
  const uscita = fino === undefined ? 0 : rampa(fino, 0.3, curve.entra);
  if (uscita >= 1) return null;
  const [cl, ca] = misure ?? stile.ebook.misure;
  const L = larghezza;
  const bordo = L * 0.045;
  const A = ((L - bordo * 2) * ca) / cl + bordo * 2;
  const spessore = L * 0.04;
  const raggio = L * 0.075;
  const p = molla(da, {rigidita: 70, smorzamento: 13});
  const ry = mix(-150, 0, p) + gira * Math.sin((tempo.ora * 2 * Math.PI) / 5.2) * rampa(da - 0.5, 0.8) + giro;
  const rx = 5 + 2.5 * onda(tempo.ora, 4.1);
  const su = 10 * onda(tempo.ora, 3.3);
  const strati = 9;
  const faccia = {position: 'absolute' as const, left: 0, top: 0, width: L, height: A, borderRadius: raggio};
  // il riflesso scorre sullo schermo secondo l'angolo: è quello che fa "vedere" il vetro
  const riflesso = 50 - ry * 2.6;
  return (
    <div style={{position: 'absolute', left: x - L / 2, top: y - A / 2 + su, width: L, height: A, perspective: L * 3.2, opacity: rampa(da, 0.2) * (1 - uscita), filter: bagliore > 0 ? `drop-shadow(0 0 ${Math.round(L * 0.09 * bagliore)}px rgba(60,255,110,${(0.32 + 0.08 * onda(tempo.ora, 2.6)).toFixed(3)}))` : undefined}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `scale(${mix(0.55, 1, Math.min(1, p)).toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`}}>
        {/* il retro */}
        <div style={{...faccia, background: 'linear-gradient(135deg,#3a3f47,#15181c 60%,#2a2e35)', transform: `translateZ(${(-spessore / 2).toFixed(2)}px) rotateY(180deg)`, backfaceVisibility: 'hidden'}}>
          <img src={`/stile/${stile.logo.file}`} alt="" style={{position: 'absolute', left: L * 0.3, top: A * 0.5 - L * 0.16, width: L * 0.4, opacity: 0.55}} />
        </div>
        {/* il bordo di metallo: tanti strati sottili fanno lo spessore, anche negli angoli tondi */}
        {Array.from({length: strati}, (_, i) => {
          const z = mix(-spessore / 2, spessore / 2, i / (strati - 1));
          const chiaro = Math.round(mix(70, 190, Math.sin((i / (strati - 1)) * Math.PI)));
          return <div key={i} style={{...faccia, background: `rgb(${chiaro},${chiaro + 4},${chiaro + 10})`, transform: `translateZ(${z.toFixed(2)}px)`}} />;
        })}
        {/* il davanti: cornice nera e la copertina */}
        <div style={{...faccia, background: '#050607', transform: `translateZ(${(spessore / 2 + 0.6).toFixed(2)}px)`, backfaceVisibility: 'hidden', overflow: 'hidden'}}>
          <img src={`/stile/${file ?? stile.ebook.file}`} alt="" style={{position: 'absolute', left: bordo, top: bordo, width: L - bordo * 2, height: A - bordo * 2, borderRadius: raggio * 0.55, objectFit: 'cover'}} />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${(riflesso - 16).toFixed(1)}%, rgba(255,255,255,0.13) ${riflesso.toFixed(1)}%, transparent ${(riflesso + 16).toFixed(1)}%)`}} />
        </div>
      </div>
    </div>
  );
}
