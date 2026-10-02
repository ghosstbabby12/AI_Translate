import { useCallback, useEffect, useRef, useState } from "react";
import { api, ErrorApi, type EstadoRespuesta, type VideoDetalle } from "../api";
import { parsearVtt, type Cue } from "../vtt";

const INTERVALO_MS = 2000;
const INTERVALO_OCULTO_MS = 10_000; // pestaña en segundo plano: consulta menos

/**
 * Consulta periódica de GET /videos/:id/estado mientras el video se procesa.
 * Cada vez que aumenta la cantidad de segmentos listos, vuelve a pedir el VTT,
 * así los subtítulos nuevos aparecen en el reproductor sin recargar.
 */
export function useEstadoVideo(id: string) {
  const [detalle, setDetalle] = useState<VideoDetalle | null>(null);
  const [estado, setEstado] = useState<EstadoRespuesta | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ciclo, setCiclo] = useState(0); // incrementarlo reinicia la consulta
  const listosVistos = useRef(-1);

  useEffect(() => {
    const control = new AbortController();
    const { signal } = control;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let urlLista = false;
    listosVistos.current = -1;

    async function tick() {
      try {
        const est = await api.estado(id, signal);
        setEstado(est);
        setError(null);

        if (est.progreso.listos !== listosVistos.current) {
          listosVistos.current = est.progreso.listos;
          setCues(parsearVtt(await api.subtitulosVtt(id, signal)));
        }

        // Con un link, el video recién queda en S3 cuando el worker lo descarga,
        // así que el detalle (con la URL firmada) se pide hasta que exista.
        if (!urlLista) {
          const det = await api.obtenerVideo(id, signal);
          urlLista = det.url_reproduccion !== null;
          setDetalle(det);
        }

        // Se sigue consultando mientras haya trabajo o falte la URL del video
        // (un video en error ya no va a conseguirla).
        if (est.estado === "pendiente" || est.estado === "procesando") programar();
        else if (est.estado === "completo" && !urlLista) programar();
      } catch (e) {
        if (signal.aborted) return;
        setError(e instanceof Error ? e.message : String(e));
        if (e instanceof ErrorApi && e.status === 404) return;
        programar(); // un fallo de red puntual no corta la consulta
      }
    }

    function programar() {
      temporizador = setTimeout(tick, document.hidden ? INTERVALO_OCULTO_MS : INTERVALO_MS);
    }

    tick();
    return () => {
      control.abort();
      clearTimeout(temporizador);
    };
  }, [id, ciclo]);

  const reiniciar = useCallback(() => setCiclo((c) => c + 1), []);

  return { detalle, estado, cues, error, reiniciar };
}
