import type { EstadoVideo } from "../api";

const TEXTO: Record<EstadoVideo, string> = {
  pendiente: "En cola",
  procesando: "Procesando",
  completo: "Completo",
  error: "Error",
};

export function EstadoBadge({ estado }: { estado: EstadoVideo }) {
  return (
    <span className={`badge badge-${estado}`}>
      {estado === "procesando" && <span className="punto-vivo" aria-hidden />}
      {TEXTO[estado]}
    </span>
  );
}
