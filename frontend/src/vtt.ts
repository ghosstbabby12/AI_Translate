export interface Cue {
  inicio: number;
  fin: number;
  texto: string;
}

const TIEMPO = /(\d+):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d+):(\d{2}):(\d{2})\.(\d{3})/;

const segundos = (h: string, m: string, s: string, ms: string) => +h * 3600 + +m * 60 + +s + +ms / 1000;

/**
 * Parser mínimo para el WebVTT que genera el backend. Se usa el VTT (y no el
 * texto crudo de cada segmento) porque el backend ya lo parte en líneas cortas.
 */
export function parsearVtt(vtt: string): Cue[] {
  const cues: Cue[] = [];
  for (const bloque of vtt.replace(/\r/g, "").split(/\n{2,}/)) {
    const lineas = bloque.split("\n");
    const i = lineas.findIndex((l) => TIEMPO.test(l));
    if (i === -1) continue;
    const m = TIEMPO.exec(lineas[i])!;
    cues.push({
      inicio: segundos(m[1], m[2], m[3], m[4]),
      fin: segundos(m[5], m[6], m[7], m[8]),
      texto: lineas.slice(i + 1).join("\n").trim(),
    });
  }
  return cues;
}

/** Búsqueda binaria: los cues vienen ordenados y no se solapan. */
export function cueEn(cues: Cue[], t: number): Cue | null {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t < cues[mid].inicio) hi = mid - 1;
    else if (t >= cues[mid].fin) lo = mid + 1;
    else return cues[mid];
  }
  return null;
}

export function formatoTiempo(seg: number): string {
  const s = Math.floor(seg);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
