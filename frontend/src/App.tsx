import { useAuth } from "./auth";
import { FormularioNuevo } from "./components/FormularioNuevo";
import { Historial } from "./components/Historial";
import { PantallaAcceso } from "./components/PantallaAcceso";
import { VistaVideo } from "./components/VistaVideo";
import { useRuta } from "./hooks/useRuta";

export function App() {
  const { usuario, cargando, cerrarSesion } = useAuth();
  const ruta = useRuta();

  if (cargando) return <p className="sutil centrado cargando">Cargando…</p>;
  if (!usuario) return <PantallaAcceso />;

  return (
    <>
      <nav className="barra">
        <a href="#/" className="marca">
          Traductor de Video
        </a>
        <div className="enlaces">
          <a href="#/" className={ruta.vista === "nuevo" ? "activo" : ""}>
            Nuevo
          </a>
          <a href="#/historial" className={ruta.vista === "historial" ? "activo" : ""}>
            Historial
          </a>
          <span className="usuario" title={usuario.email}>
            {usuario.nombre}
          </span>
          <button type="button" className="boton-texto" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </nav>
      <main>
        {ruta.vista === "nuevo" && <FormularioNuevo />}
        {ruta.vista === "historial" && <Historial />}
        {/* key: al cambiar de video se reinicia todo el estado de la vista */}
        {ruta.vista === "video" && <VistaVideo key={ruta.id} id={ruta.id} />}
      </main>
    </>
  );
}
