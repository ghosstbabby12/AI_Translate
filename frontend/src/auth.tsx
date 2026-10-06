import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, configurarSesion, type Sesion, type Usuario } from "./api";

const CLAVE_TOKEN = "traductor.token";

interface ContextoAuth {
  usuario: Usuario | null;
  /** true mientras se valida el token guardado al abrir la app */
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (nombre: string, email: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
}

const Contexto = createContext<ContextoAuth | null>(null);

function leerToken(): string | null {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* sin almacenamiento: la sesión dura lo que la pestaña */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    configurarSesion(null);
    setUsuario(null);
  }, []);

  // Al abrir la app: si hay un token guardado, se valida con /auth/yo.
  useEffect(() => {
    const token = leerToken();
    configurarSesion(token, cerrarSesion);
    if (!token) {
      setCargando(false);
      return;
    }
    // Un 401 cierra la sesión por sí solo (ver pedir() en api.ts); un fallo de
    // red no borra el token, así que basta recargar cuando vuelva la API.
    api
      .yo()
      .then(setUsuario, () => {})
      .finally(() => setCargando(false));
  }, [cerrarSesion]);

  const abrir = useCallback(({ token, usuario }: Sesion) => {
    guardarToken(token);
    configurarSesion(token);
    setUsuario(usuario);
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      usuario,
      cargando,
      iniciarSesion: async (email, password) => abrir(await api.login(email, password)),
      registrarse: async (nombre, email, password) => abrir(await api.registro(nombre, email, password)),
      cerrarSesion,
    }),
    [usuario, cargando, abrir, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
