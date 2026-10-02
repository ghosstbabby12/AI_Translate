import { useEffect, useRef, useState, type RefObject } from "react";
import type { SegmentoEstado } from "../api";
import { cueEn, type Cue } from "../vtt";

interface Props {
  url: string | null;
  cues: Cue[];
  segmentos: SegmentoEstado[];
  videoRef: RefObject<HTMLVideoElement | null>;
  onTiempo: (segundos: number) => void;
}

/**
 * Los subtítulos se pintan en una capa propia sobre el <video> en vez de usar
 * <track>: así se actualizan al instante cuando llegan segmentos nuevos (un
 * <track> no relee su archivo) y se puede avisar qué tramo aún se traduce.
 */
export function ReproductorSubtitulado({ url, cues, segmentos, videoRef, onTiempo }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [tiempo, setTiempo] = useState(0);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(document.fullscreenElement === contenedor.current);
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  if (!url) {
    return (
      <div className="reproductor reproductor-vacio">
        <p>Preparando el video…</p>
      </div>
    );
  }

  const cue = cueEn(cues, tiempo);
  const tramo = segmentos.find((s) => tiempo >= s.tiempo_inicio && tiempo < s.tiempo_fin);
  const traduciendo = !cue && tramo && (tramo.estado === "pendiente" || tramo.estado === "procesando");

  const actualizar = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const t = e.currentTarget.currentTime;
    setTiempo(t);
    onTiempo(t);
  };

  // La pantalla completa nativa del <video> ocultaría la capa de subtítulos,
  // así que se pone en pantalla completa el contenedor.
  const alternarPantallaCompleta = () =>
    document.fullscreenElement ? document.exitFullscreen() : contenedor.current?.requestFullscreen();

  return (
    <div ref={contenedor} className={`reproductor ${pantallaCompleta ? "completa" : ""}`}>
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nofullscreen"
        playsInline
        onTimeUpdate={actualizar}
        onSeeked={actualizar}
      />
      <div className="subtitulo" aria-live="polite">
        {cue ? <span>{cue.texto}</span> : traduciendo ? <span className="traduciendo">Traduciendo este tramo…</span> : null}
      </div>
      <button type="button" className="boton-pantalla" onClick={alternarPantallaCompleta}>
        {pantallaCompleta ? "Salir" : "Pantalla completa"}
      </button>
    </div>
  );
}
