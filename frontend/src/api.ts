// Cliente de la API del backend. Los tipos reflejan las respuestas de
// backend/src/api/routes/videos.routes.ts.

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type EstadoVideo = "pendiente" | "procesando" | "completo" | "error";
export type EstadoSegmento = "pendiente" | "procesando" | "listo" | "error";
export type FormatoSubtitulos = "srt" | "vtt";

export interface Idioma {
  codigo: string;
  nombre: string;
}

export interface Video {
  id: string;
  nombre: string;
  origen_tipo: "archivo" | "url";
  origen_url: string | null;
  idioma_destino: string;
  idioma_origen: string | null;
  estado: EstadoVideo;
  total_segmentos: number | null;
  duracion_seg: number | null;
  error: string | null;
  creado_en: string;
}

export interface VideoHistorial extends Video {
  segmentos_listos: number;
}

export interface VideoDetalle extends Video {
  url_reproduccion: string | null;
}

export interface SegmentoEstado {
  indice: number;
  tiempo_inicio: number;
  tiempo_fin: number;
  estado: EstadoSegmento;
  texto_traducido: string | null;
  error: string | null;
}

export interface EstadoRespuesta {
  id: string;
  estado: EstadoVideo;
  error: string | null;
  idioma_origen: string | null;
  idioma_destino: string;
  progreso: {
    total: number;
    listos: number;
    pendientes: number;
    procesando: number;
    errores: number;
    porcentaje: number;
  };
  segmentos: SegmentoEstado[];
}

// Sin login todavía: cada navegador recibe un id estable (ver middleware usuario.ts).
let idSesion: string | undefined;
function usuarioId(): string {
  const CLAVE = "traductor.usuarioId";
  try {
    let id = localStorage.getItem(CLAVE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLAVE, id);
    }
    return id;
  } catch {
    // localStorage bloqueado (modo privado estricto): id solo para esta sesión
    return (idSesion ??= crypto.randomUUID());
  }
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function pedir(ruta: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: { "X-Usuario-Id": usuarioId(), ...init.headers },
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new ErrorApi(cuerpo?.error ?? `Error ${res.status}`, res.status);
  }
  return res;
}

const json = async <T,>(ruta: string, init?: RequestInit) => (await pedir(ruta, init)).json() as Promise<T>;

export const api = {
  idiomas: () => json<Idioma[]>("/idiomas"),
  listarVideos: () => json<VideoHistorial[]>("/videos"),
  obtenerVideo: (id: string, signal?: AbortSignal) => json<VideoDetalle>(`/videos/${id}`, { signal }),
  estado: (id: string, signal?: AbortSignal) => json<EstadoRespuesta>(`/videos/${id}/estado`, { signal }),
  subtitulosVtt: async (id: string, signal?: AbortSignal) =>
    (await pedir(`/videos/${id}/subtitulos?formato=vtt`, { signal })).text(),
  reintentar: (id: string) => json<{ reencolados: number }>(`/videos/${id}/reintentar`, { method: "POST" }),

  crearDesdeUrl: (url: string, idiomaDestino: string) =>
    json<Video>("/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, idioma_destino: idiomaDestino }),
    }),

  /**
   * Subida con XMLHttpRequest porque fetch no informa el progreso del envío,
   * y un video de cientos de MB sin barra parece colgado.
   */
  subirArchivo: (archivo: File, idiomaDestino: string, onProgreso: (fraccion: number) => void) =>
    new Promise<Video>((resolve, reject) => {
      const form = new FormData();
      form.append("idioma_destino", idiomaDestino);
      form.append("video", archivo);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/videos`);
      xhr.setRequestHeader("X-Usuario-Id", usuarioId());
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgreso(e.loaded / e.total);
      xhr.onload = () => {
        let cuerpo: { error?: string } | Video | null = null;
        try {
          cuerpo = JSON.parse(xhr.responseText);
        } catch {
          /* respuesta no JSON */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(cuerpo as Video);
        else reject(new ErrorApi((cuerpo as { error?: string })?.error ?? `Error ${xhr.status}`, xhr.status));
      };
      xhr.onerror = () => reject(new ErrorApi("No se pudo conectar con el servidor", 0));
      xhr.send(form);
    }),

  /** La descarga lleva la cabecera de usuario, así que no sirve un <a href> directo. */
  descargarSubtitulos: async (id: string, formato: FormatoSubtitulos) => {
    const res = await pedir(`/videos/${id}/subtitulos?formato=${formato}&descargar=1`);
    const nombre =
      /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `subtitulos.${formato}`;
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
    a.click();
    URL.revokeObjectURL(url);
  },
};
