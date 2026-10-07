/** Icono de la marca: una pantalla con líneas de subtítulos. */
export function Logo() {
  return (
    <span className="marca-logo" aria-hidden>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 14h6M15 14h2M7 17h3M12 17h5" />
      </svg>
    </span>
  );
}
