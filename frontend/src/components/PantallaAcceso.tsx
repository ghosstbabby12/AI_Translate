import { useState, type FormEvent } from "react";
import { useAuth } from "../auth";
import { Logo } from "./Logo";
import { SelectorTema } from "./SelectorTema";

type Modo = "login" | "registro";

export function PantallaAcceso() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<Modo>("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRegistro = modo === "registro";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (esRegistro) await registrarse(nombre.trim(), email.trim(), password);
      else await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEnviando(false);
    }
  }

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setError(null);
  }

  return (
    <main className="acceso">
      <div className="acceso-tema">
        <SelectorTema />
      </div>
      <form className="tarjeta formulario" onSubmit={enviar}>
        <div>
          <span className="marca">
            <Logo />
            Traductor de Video
          </span>
          <h1>{esRegistro ? "Crear cuenta" : "Iniciar sesión"}</h1>
          <p className="sutil">
            Traduce videos con subtítulos generados por IA y guarda tu historial.
          </p>
        </div>

        {esRegistro && (
          <label className="campo">
            Nombre
            <input
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={100}
            />
          </label>
        )}

        <label className="campo">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="campo">
          Contraseña
          <div className="campo-password">
            <input
              type={verPassword ? "text" : "password"}
              autoComplete={esRegistro ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={esRegistro ? 8 : undefined}
              required
            />
            <button
              type="button"
              className="boton-texto"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {esRegistro && <span className="sutil">Mínimo 8 caracteres.</span>}
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="primario" disabled={enviando}>
          {enviando ? "Un momento…" : esRegistro ? "Crear cuenta" : "Entrar"}
        </button>

        <p className="sutil centrado">
          {esRegistro ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button type="button" className="boton-texto" onClick={() => cambiarModo(esRegistro ? "login" : "registro")}>
            {esRegistro ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </form>
    </main>
  );
}
