import { useEffect, useState, type FormEvent } from "react";
import { api, type Idioma } from "../api";
import { navegar } from "../hooks/useRuta";

type Modo = "archivo" | "url";

const formatoMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function FormularioNuevo() {
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [modo, setModo] = useState<Modo>("archivo");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [idioma, setIdioma] = useState("es");
  const [arrastrando, setArrastrando] = useState(false);
  const [subida, setSubida] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.idiomas().then(setIdiomas, () => setError("No se pudo conectar con el servidor"));
  }, []);

  const enviando = subida !== null;
  const listo = modo === "archivo" ? archivo !== null : url.trim() !== "";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubida(0);
    try {
      const video =
        modo === "archivo" && archivo
          ? await api.subirArchivo(archivo, idioma, setSubida)
          : await api.crearDesdeUrl(url.trim(), idioma);
      navegar(`/video/${video.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubida(null);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h1>Traducir un video</h1>
      <p className="sutil">
        Sube un archivo o pega el link de un video público. Verás los subtítulos traducidos a medida que se generan.
      </p>

      <div className="pestanas" role="tablist">
        {(["archivo", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            className={modo === m ? "activa" : ""}
            onClick={() => setModo(m)}
            disabled={enviando}
          >
            {m === "archivo" ? "Subir archivo" : "Pegar link"}
          </button>
        ))}
      </div>

      {modo === "archivo" ? (
        <label
          className={`zona-archivo ${arrastrando ? "arrastrando" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            const f = e.dataTransfer.files[0];
            if (f) setArchivo(f);
          }}
        >
          <input
            type="file"
            accept="video/*,audio/*"
            disabled={enviando}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          {archivo ? (
            <span>
              <strong>{archivo.name}</strong> · {formatoMB(archivo.size)}
            </span>
          ) : (
            <span>Arrastra un video aquí o haz clic para elegirlo</span>
          )}
        </label>
      ) : (
        <label className="campo">
          Link del video
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={url}
            disabled={enviando}
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
      )}

      <label className="campo">
        Traducir al
        <select value={idioma} onChange={(e) => setIdioma(e.target.value)} disabled={enviando}>
          {idiomas.map((i) => (
            <option key={i.codigo} value={i.codigo}>
              {i.nombre}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      {enviando && modo === "archivo" && (
        <div className="progreso-barra" role="progressbar" aria-valuenow={Math.round(subida * 100)}>
          <div className="progreso-relleno" style={{ width: `${subida * 100}%` }} />
        </div>
      )}

      <button type="submit" className="primario" disabled={!listo || enviando || idiomas.length === 0}>
        {enviando ? (modo === "archivo" ? `Subiendo… ${Math.round(subida * 100)}%` : "Registrando…") : "Traducir"}
      </button>
    </form>
  );
}
