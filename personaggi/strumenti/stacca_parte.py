#!/usr/bin/env python3
# Stacca dal corpo una parte che gli sta davanti (un avambraccio con la mano) e ricostruisce quello che c'è sotto.
#   stacca.py <cartella del personaggio> <ricetta.json> [--prova <immagine di controllo>]
# Dalla ricetta e da base.png ricava due immagini, grandi quanto base.png:
#   maschera-<nome>.png   rosso = quanto è piena la parte (255 = tutta; meno = la sfumatura attorno al perno);
#                         verde = la zona del corpo che viene rifatta (la parte più un piccolo alone)
#   sotto-<nome>.png      il corpo come appare quando la parte non c'è (trasparente dove dietro c'è il vuoto)
# Poi:  npm run personaggio livello <personaggio>   mette insieme corpo.png e livello-<nome>.png.
# Serve Python 3 con numpy, scipy, pillow e opencv:  pip install numpy scipy pillow opencv-python-headless
import json, sys, math
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage
from scipy.sparse import lil_matrix, csr_matrix
from scipy.sparse.linalg import spsolve

def main():
    cartella, ricetta = sys.argv[1], json.load(open(sys.argv[2]))
    prova = sys.argv[sys.argv.index('--prova') + 1] if '--prova' in sys.argv else None
    base = np.array(Image.open(f"{cartella}/{ricetta.get('immagine', 'base.png')}").convert('RGBA'))
    H, W = base.shape[:2]
    rgb = base[..., :3].astype(np.int32)
    alfa = base[..., 3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    sat = rgb.max(-1) - rgb.min(-1)
    opaco = alfa > 200
    yy, xx = np.mgrid[0:H, 0:W]
    px, py = ricetta['perno']
    R = ricetta['raggio']
    F = ricetta.get('sfuma', 14)
    raggio = np.hypot(xx - px, yy - py)
    angolo = (np.degrees(np.arctan2(yy - py, xx - px)) + 360) % 360
    a1, a2 = ricetta['settore']
    nel_settore = (angolo >= a1) & (angolo <= a2)
    def poligoni(elenco):
        m = np.zeros((H, W), np.uint8)
        for pol in elenco:
            cv2.fillPoly(m, [np.array(pol, np.int32)], 1)
        return m.astype(bool)
    # i recinti: la pelle e la stoffa hanno ognuna il suo, così un contorno interrotto non fa uscire l'allagamento
    recinti = {k: poligoni([v]) for k, v in ricetta['recinto'].items()}
    recinto = np.logical_or.reduce(list(recinti.values()))
    zona = nel_settore & (raggio >= R - F)

    # 1) due allagamenti: la pelle resta nella pelle, la stoffa nella stoffa; le linee scure li fermano
    scuro = ricetta.get('scuro', 112)
    pelle = (rgb[..., 0] - rgb[..., 2] > 30) & (rgb[..., 0] > 95)
    stoffa = (lum > scuro) & (sat < 34)
    def allaga(passa, semi, dove):
        etichette, _ = ndimage.label(passa & dove & opaco & zona)
        scelte = {etichette[y, x] for x, y in semi} - {0}
        if len(scelte) < 1: raise SystemExit(f'nessun seme cade su una zona buona: {semi}')
        return np.isin(etichette, list(scelte))
    parte = allaga(pelle, ricetta['semi']['pelle'], recinti['pelle']) | allaga(stoffa, ricetta['semi']['stoffa'], recinti['stoffa'])
    # 2) i suoi contorni: un pixel di passaggio, poi fino a 4 pixel di tratto scuro, poi la frangia grigia
    otto = np.ones((3, 3), bool)
    # (dove la parte confina con il vuoto contano anche i pixel mezzi trasparenti del suo bordo)
    limite = ndimage.binary_dilation(recinto, otto, iterations=4) & (alfa > 8) & zona
    sottile = poligoni(ricetta.get('bordoSottile', []))
    parte = ndimage.binary_dilation(parte, otto, iterations=1) & limite
    for giro in range(ricetta.get('tratto', 4)):
        nuovi = ndimage.binary_dilation(parte, otto) & limite & ((lum < scuro + 20) | (alfa < 200))
        if giro >= 1: nuovi &= ~sottile
        parte |= nuovi
    parte |= ndimage.binary_dilation(parte, otto) & limite & ((lum < 196) | (sat >= 34) | (alfa < 250)) & ~sottile
    parte = ndimage.binary_fill_holes(parte) & limite
    parte = ndimage.binary_opening(parte, np.ones((2, 2), bool)) | (parte & ndimage.binary_erosion(parte, otto))
    # tiene solo il pezzo grande
    etichette, quante = ndimage.label(parte)
    if quante > 1:
        grandezze = ndimage.sum(parte, etichette, range(1, quante + 1))
        parte = etichette == (1 + int(np.argmax(grandezze)))

    # 3) la maschera: piena fuori dal cerchio del perno, sfumata dentro
    maschera = np.where(parte, 255, 0).astype(np.float64)
    dentro = parte & (raggio < R)
    t = np.clip((raggio - (R - F)) / F, 0, 1)
    maschera[dentro] = 255 * (t[dentro] ** 2 * (3 - 2 * t[dentro]))
    piena = parte & (raggio >= R)
    # la zona da rifare sul corpo è un po' più larga della parte: così non restano ombre dei suoi contorni
    buco = ndimage.binary_dilation(piena, otto, iterations=ricetta.get('alone', 3))
    buco = ndimage.binary_fill_holes(buco) & (alfa > 0) & nel_settore & (raggio >= R)

    # 4) quello che c'è sotto
    sotto = base.copy().astype(np.float64)
    rip = ricetta['ripara']
    barriera = np.zeros((H, W), np.uint8)
    def curva(punti, passo=1.0):
        # passa per tutti i punti (Catmull-Rom), fitta
        p = np.array(punti, float)
        if len(p) < 3: 
            n = max(2, int(np.hypot(*(p[-1] - p[0])) / passo))
            return np.linspace(p[0], p[-1], n)
        est = np.vstack([2 * p[0] - p[1], p, 2 * p[-1] - p[-2]])
        fuori = []
        for i in range(1, len(est) - 2):
            p0, p1, p2, p3 = est[i - 1], est[i], est[i + 1], est[i + 2]
            n = max(2, int(np.hypot(*(p2 - p1)) / passo))
            for s in np.linspace(0, 1, n, endpoint=False):
                fuori.append(0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s ** 3))
        fuori.append(p[-1])
        return np.array(fuori)
    linee = []
    for L in rip.get('linee', []):
        punti = L['punti']
        if 'arco' in L:  # tratto lungo il cerchio del perno, in gradi
            da, a = L['arco']
            # `fuori` = quanti pixel oltre il cerchio: un numero, oppure [all'inizio, alla fine] dell'arco
            f = L.get('fuori', 2)
            f1, f2 = f if isinstance(f, list) else (f, f)
            gradi = np.arange(da, a + (1 if a >= da else -1), 1 if a >= da else -1)
            arco = [[px + (R + f1 + (f2 - f1) * i / max(1, len(gradi) - 1)) * math.cos(math.radians(g)), py + (R + f1 + (f2 - f1) * i / max(1, len(gradi) - 1)) * math.sin(math.radians(g))] for i, g in enumerate(gradi)]
            tutti = np.vstack([curva(punti), np.array(arco)]) if punti else np.array(arco)
        else:
            tutti = curva(punti)
        linee.append((L, tutti))
        cv2.polylines(barriera, [np.round(tutti).astype(np.int32)], False, 1, thickness=2)
    barriera = barriera.astype(bool)
    vuoto = np.zeros((H, W), np.uint8)
    for pol in rip.get('vuoto', []):
        cv2.fillPoly(vuoto, [np.array(pol, np.int32)], 1)
    vuoto = vuoto.astype(bool) & buco
    # dentro l'arco ridisegnato attorno al perno c'è stoffa (è la punta arrotondata dell'osso che resta fermo), non vuoto
    for L, tutti in linee:
        if 'arco' in L:
            n = len(np.arange(L['arco'][0], L['arco'][1] + (1 if L['arco'][1] >= L['arco'][0] else -1), 1 if L['arco'][1] >= L['arco'][0] else -1))
            spicchio = np.zeros((H, W), np.uint8)
            cv2.fillPoly(spicchio, [np.round(np.vstack([tutti[-n:], [[px, py]]])).astype(np.int32)], 1)
            vuoto &= ~spicchio.astype(bool)
    riempi = buco & ~vuoto
    # diffusione: ogni pixel da riempire vale la media dei vicini; le barriere non lasciano passare
    libero = riempi & ~barriera
    indice = -np.ones((H, W), np.int64)
    ys, xs = np.nonzero(libero)
    indice[ys, xs] = np.arange(len(ys))
    noto = opaco & ~buco & ~barriera
    n = len(ys)
    righe, colonne, valori = [], [], []
    b = np.zeros((n, 3))
    diag = np.zeros(n)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        y2, x2 = ys + dy, xs + dx
        ok = (y2 >= 0) & (y2 < H) & (x2 >= 0) & (x2 < W)
        y2c, x2c = np.clip(y2, 0, H - 1), np.clip(x2, 0, W - 1)
        vic_libero = ok & libero[y2c, x2c]
        vic_noto = ok & noto[y2c, x2c]
        diag += vic_libero + vic_noto
        k = np.nonzero(vic_libero)[0]
        righe.extend(k); colonne.extend(indice[y2c[k], x2c[k]]); valori.extend([-1.0] * len(k))
        k = np.nonzero(vic_noto)[0]
        b[k] += base[y2c[k], x2c[k], :3]
    soli = diag == 0
    diag[soli] = 1
    righe.extend(range(n)); colonne.extend(range(n)); valori.extend(diag)
    A = csr_matrix((valori, (righe, colonne)), shape=(n, n))
    for c in range(3):
        sotto[ys, xs, c] = np.clip(spsolve(A, b[:, c]), 0, 255)
    sotto[ys, xs, 3] = 255
    # le barriere dentro la zona riempita prendono il colore dei vicini riempiti (poi ci passa sopra la linea)
    by, bx = np.nonzero(riempi & barriera)
    for y, x in zip(by, bx):
        vic = [(y + dy, x + dx) for dy in (-2, -1, 0, 1, 2) for dx in (-2, -1, 0, 1, 2) if 0 <= y + dy < H and 0 <= x + dx < W and libero[y + dy, x + dx]]
        if vic: sotto[y, x, :3] = np.mean([sotto[v[0], v[1], :3] for v in vic], axis=0)
        sotto[y, x, 3] = 255
    sotto = np.clip(sotto, 0, 255).astype(np.uint8)
    # le linee ridisegnate (contorni che passavano sotto la parte), solo dentro la zona tolta
    strato = Image.fromarray(sotto, 'RGBA')
    tela = np.array(strato)
    for L, tutti in linee:
        colore = L.get('colore')
        if not colore:
            cx, cy = [int(round(v)) for v in (L.get('campione') or tutti[0])]
            zona = base[max(0, cy - 6):cy + 7, max(0, cx - 6):cx + 7].reshape(-1, 4).astype(int)
            zona = zona[zona[:, 3] > 250]
            colore = zona[np.argmin(zona[:, :3].sum(1))][:3].tolist()
        disegno = np.zeros((H, W, 4), np.uint8)
        cv2.polylines(disegno, [np.round(tutti * 8).astype(np.int32)], False, (*colore, 255), thickness=max(1, int(round(L.get('spessore', 4)))), lineType=cv2.LINE_AA, shift=3)
        peso = (disegno[..., 3:4].astype(float) / 255) * buco[..., None]
        tela[..., :3] = np.round(tela[..., :3] * (1 - peso) + disegno[..., :3] * peso).astype(np.uint8)
        tela[..., 3] = np.maximum(tela[..., 3], np.round(peso[..., 0] * 255).astype(np.uint8) * buco)
    tela[vuoto & ~(tela[..., 3] > 0) ] = 0
    # il vuoto resta vuoto, tranne dove passa una linea
    senza_linea = vuoto.copy()
    for L, tutti in linee:
        m = np.zeros((H, W), np.uint8)
        cv2.polylines(m, [np.round(tutti).astype(np.int32)], False, 1, thickness=max(1, int(round(L.get('spessore', 4)))) + 1)
        senza_linea &= ~m.astype(bool)
    tela[senza_linea] = 0
    fuori_zona = ~buco
    tela[fuori_zona] = 0
    nome = ricetta['nome']
    doppia = np.zeros((H, W, 3), np.uint8)
    doppia[..., 0] = np.round(maschera).astype(np.uint8)
    doppia[..., 1] = np.where(buco, 255, 0)
    Image.fromarray(doppia, 'RGB').save(f'{cartella}/maschera-{nome}.png', optimize=True)
    Image.fromarray(tela, 'RGBA').save(f'{cartella}/sotto-{nome}.png', optimize=True)
    ys, xs = np.nonzero(parte)
    print(f'parte: {int(parte.sum())} pixel, da ({xs.min()},{ys.min()}) a ({xs.max()},{ys.max()}); riempiti {n}, vuoti {int(vuoto.sum())}')
    if prova:
        # a sinistra la parte evidenziata, a destra il corpo senza la parte (su fondo colorato)
        x1, y1, x2, y2 = max(0, xs.min() - 60), max(0, ys.min() - 60), min(W, xs.max() + 60), min(H, ys.max() + 60)
        fondo = np.zeros((H, W, 3), np.float64); fondo[:] = (60, 90, 150)
        vista = base[..., :3] * (alfa[..., None] / 255) + fondo * (1 - alfa[..., None] / 255)
        vista[parte] = vista[parte] * 0.45 + np.array([255, 40, 160]) * 0.55
        bordo = parte & ~ndimage.binary_erosion(parte, otto)
        vista[bordo] = (255, 255, 0)
        corpo = base.copy()
        corpo[buco] = tela[buco]
        senza = corpo[..., :3] * (corpo[..., 3:4] / 255) + fondo * (1 - corpo[..., 3:4] / 255)
        unite = np.hstack([vista[y1:y2, x1:x2], senza[y1:y2, x1:x2]])
        Image.fromarray(unite.astype(np.uint8)).save(prova, quality=92)

main()
