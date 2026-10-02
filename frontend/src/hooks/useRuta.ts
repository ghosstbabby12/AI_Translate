import { useEffect, useState } from "react";

// Rutas por hash (#/, #/historial, #/video/<id>): funciona en cualquier hosting
// estático sin configurar reescrituras.
export type Ruta = { vista: "nuevo" } | { vista: "historial" } | { vista: "video"; id: string };

function leerRuta(): Ruta {
  const partes = location.hash.replace(/^#\/?/, "").split("/");
  if (partes[0] === "historial") return { vista: "historial" };
  if (partes[0] === "video" && partes[1]) return { vista: "video", id: partes[1] };
  return { vista: "nuevo" };
}

export function navegar(ruta: string) {
  location.hash = ruta;
}

export function useRuta(): Ruta {
  const [ruta, setRuta] = useState(leerRuta);
  useEffect(() => {
    const alCambiar = () => setRuta(leerRuta());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);
  return ruta;
}
