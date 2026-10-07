import type { ReactNode } from "react";
import { useTema, type Tema } from "../hooks/useTema";

const icono = (trazos: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {trazos}
  </svg>
);

const OPCIONES: { valor: Tema; etiqueta: string; icono: ReactNode }[] = [
  {
    valor: "claro",
    etiqueta: "Tema claro",
    icono: icono(
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>,
    ),
  },
  {
    valor: "oscuro",
    etiqueta: "Tema oscuro",
    icono: icono(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />),
  },
  {
    valor: "sistema",
    etiqueta: "Usar el tema del sistema",
    icono: icono(
      <>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>,
    ),
  },
];

export function SelectorTema() {
  const [tema, setTema] = useTema();
  return (
    <div className="selector-tema" role="group" aria-label="Tema">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={tema === o.valor}
          aria-label={o.etiqueta}
          title={o.etiqueta}
          onClick={() => setTema(o.valor)}
        >
          {o.icono}
        </button>
      ))}
    </div>
  );
}
