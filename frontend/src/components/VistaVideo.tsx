import { useRef, useState } from "react";
import { api, type FormatoSubtitulos } from "../api";
import { useEstadoVideo } from "../hooks/useEstadoVideo";
import { formatoTiempo } from "../vtt";
import { BarraProgreso } from "./BarraProgreso";
import { EstadoBadge } from "./EstadoBadge";
import { ReproductorSubtitulado } from "./ReproductorSubtitulado";

export function VistaVideo({ id }: { id: string }) {
  const { detalle, estado, cues, error, reiniciar } = useEstadoVideo(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tiempo, setTiempo] = useState(0);
  const [accion, setAccion] = useState<string | null>(null);

  if (!estado || !detalle) {
    return <p className="sutil">{error ?? "Cargando…"}</p>;
  }

  const buscar = (segundos: number) => {
    if (videoRef.current) videoRef.current.currentTime = segundos;
  };

  const descargar = async (formato: FormatoSubtitulos) => {
    setAccion(null);
    try {
      await api.descargarSubtitulos(id, formato);
    } catch (e) {
      setAccion(e instanceof Error ? e.message : String(e));
    }
  };

  const reintentar = async () => {
    try {
      const r = await api.reintentar(id);
      setAccion(r.video ? "Video en cola de nuevo" : `${r.reencolados} segmento${r.reencolados === 1 ? "" : "s"} en cola de nuevo`);
    } catch (e) {
      setAccion(e instanceof Error ? e.message : String(e));
    }
    reiniciar();
  };

  const listos = estado.segmentos.filter((s) => s.estado === "listo" && s.texto_traducido);

  return (
    <section className="vista-video">
      <header className="vista-cabecera">
        <div>
          <h1 title={detalle.nombre}>{detalle.nombre}</h1>
          <p className="sutil">
            {estado.idioma_origen ? `${estado.idioma_origen.toUpperCase()} → ` : ""}
            {estado.idioma_destino.toUpperCase()}
          </p>
        </div>
        <EstadoBadge estado={estado.estado} />
      </header>

      {estado.estado === "error" && estado.error && <p className="error">{estado.error}</p>}
      {error && <p className="aviso">Sin conexión con el servidor, reintentando… ({error})</p>}

      <div className="vista-cuerpo">
        <div className="columna-principal">
          <ReproductorSubtitulado
            url={detalle.url_reproduccion}
            cues={cues}
            segmentos={estado.segmentos}
            videoRef={videoRef}
            onTiempo={setTiempo}
          />
          <BarraProgreso estado={estado} tiempoActual={tiempo} onBuscar={buscar} />

          <div className="acciones">
            <button type="button" onClick={() => descargar("srt")} disabled={estado.progreso.listos === 0}>
              Descargar .srt
            </button>
            <button type="button" onClick={() => descargar("vtt")} disabled={estado.progreso.listos === 0}>
              Descargar .vtt
            </button>
            {estado.estado === "error" && estado.progreso.total === 0 ? (
              <button type="button" className="secundario" onClick={reintentar}>
                Reintentar video
              </button>
            ) : (
              estado.progreso.errores > 0 &&
              estado.estado !== "procesando" && (
                <button type="button" className="secundario" onClick={reintentar}>
                  Reintentar segmentos fallidos
                </button>
              )
            )}
          </div>
          {accion && <p className="sutil">{accion}</p>}
        </div>

        <aside className="transcripcion">
          <h2>Traducción en vivo</h2>
          {listos.length === 0 ? (
            <p className="sutil">Los segmentos aparecerán aquí a medida que se traduzcan.</p>
          ) : (
            <ol>
              {listos.map((s) => {
                const activo = tiempo >= s.tiempo_inicio && tiempo < s.tiempo_fin;
                return (
                  <li key={s.indice} className={activo ? "activo" : ""}>
                    <button type="button" onClick={() => buscar(s.tiempo_inicio)}>
                      <time>{formatoTiempo(s.tiempo_inicio)}</time>
                      <span>{s.texto_traducido}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
}
