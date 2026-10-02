import { useEffect, useState } from "react";
import { api, type FormatoSubtitulos, type VideoHistorial } from "../api";
import { navegar } from "../hooks/useRuta";
import { EstadoBadge } from "./EstadoBadge";

const fecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export function Historial() {
  const [videos, setVideos] = useState<VideoHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Se refresca solo mientras haya algún video en proceso.
  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let vivo = true;
    async function cargar() {
      try {
        const lista = await api.listarVideos();
        if (!vivo) return;
        setVideos(lista);
        setError(null);
        if (lista.some((v) => v.estado === "pendiente" || v.estado === "procesando")) {
          temporizador = setTimeout(cargar, 5000);
        }
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : String(e));
      }
    }
    cargar();
    return () => {
      vivo = false;
      clearTimeout(temporizador);
    };
  }, []);

  const descargar = (id: string, formato: FormatoSubtitulos) =>
    api.descargarSubtitulos(id, formato).catch((e) => setError(e.message));

  if (error && !videos) return <p className="error">{error}</p>;
  if (!videos) return <p className="sutil">Cargando…</p>;

  return (
    <section>
      <h1>Historial</h1>
      {error && <p className="error">{error}</p>}
      {videos.length === 0 ? (
        <div className="tarjeta vacio">
          <p>Todavía no has traducido ningún video.</p>
          <button type="button" className="primario" onClick={() => navegar("/")}>
            Traducir el primero
          </button>
        </div>
      ) : (
        <ul className="historial">
          {videos.map((v) => {
            const total = v.total_segmentos ?? 0;
            const pct = total ? Math.round((v.segmentos_listos / total) * 100) : 0;
            return (
              <li key={v.id} className="tarjeta fila-historial">
                <button type="button" className="fila-principal" onClick={() => navegar(`/video/${v.id}`)}>
                  <strong title={v.nombre}>{v.nombre}</strong>
                  <span className="sutil">
                    {fecha.format(new Date(v.creado_en))} · {v.idioma_destino.toUpperCase()}
                    {total > 0 && ` · ${v.segmentos_listos}/${total} segmentos`}
                  </span>
                  {v.estado === "procesando" && total > 0 && (
                    <div className="progreso-barra fina">
                      <div className="progreso-relleno" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </button>
                <EstadoBadge estado={v.estado} />
                <div className="acciones">
                  <button type="button" disabled={v.segmentos_listos === 0} onClick={() => descargar(v.id, "srt")}>
                    .srt
                  </button>
                  <button type="button" disabled={v.segmentos_listos === 0} onClick={() => descargar(v.id, "vtt")}>
                    .vtt
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
