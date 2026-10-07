import { useEffect, useState } from "react";

export type Tema = "claro" | "oscuro" | "sistema";

// La misma clave la lee el script de index.html antes de pintar la página.
const CLAVE = "traductor.tema";

function leerTema(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === "claro" || t === "oscuro" ? t : "sistema";
  } catch {
    return "sistema";
  }
}

/** Sin atributo = sigue al sistema (lo resuelve el @media de styles.css). */
export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-theme");
  else raiz.dataset.theme = tema === "oscuro" ? "dark" : "light";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(leerTema);

  useEffect(() => {
    aplicarTema(tema);
    try {
      if (tema === "sistema") localStorage.removeItem(CLAVE);
      else localStorage.setItem(CLAVE, tema);
    } catch {
      /* sin almacenamiento: el tema dura lo que la pestaña */
    }
  }, [tema]);

  return [tema, setTema] as const;
}
