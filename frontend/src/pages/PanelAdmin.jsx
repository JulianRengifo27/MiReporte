// ===== Panel de ADMINISTRADOR =====
// Revisión de reportes dudosos, eliminar eventos, usuarios y roles, estadísticas.
import { useCallback, useEffect, useState } from 'react';
import {
  obtenerRevision, aprobarEvento, rechazarEvento, obtenerEventosGestion, eliminarEvento, eliminarEventosViejos,
  obtenerUsuarios, crearUsuario, actualizarUsuario, obtenerEstadisticas, socket,
} from '../api.js';
import { TIPOS, ESTADOS, PRIORIDADES, textoReportes } from '../config.js';
import { formatoHace } from '../utils/geo.js';
import { useSesion } from '../sesion.jsx';

const ENTIDADES = ['Bomberos', 'Tránsito', 'Cruz Roja', 'Defensa Civil', 'Alcaldía'];
const ROLES = { ciudadano: 'Ciudadano', entidad_oficial: 'Entidad oficial', admin: 'Administrador' };

export default function PanelAdmin() {
  const [pestana, setPestana] = useState('revision');
  const pestanas = { revision: '🕵️ Revisión', eventos: '🗂️ Eventos', usuarios: '👥 Usuarios', estadisticas: '📊 Estadísticas' };
  return (
    <div className="pagina">
      <h2>Administración</h2>
      <p className="nota">Para cambiar estados o escribir desvíos usa el <a href="#/oficial">Panel oficial</a>.</p>
      <div className="pestanas-panel" role="tablist">
        {Object.entries(pestanas).map(([k, txt]) => (
          <button key={k} type="button" role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}>{txt}</button>
        ))}
      </div>
      {pestana === 'revision' && <Revision />}
      {pestana === 'eventos' && <Eventos />}
      {pestana === 'usuarios' && <Usuarios />}
      {pestana === 'estadisticas' && <Estadisticas />}
    </div>
  );
}

// ---------- Cola de revisión ----------
function Revision() {
  const [cola, setCola] = useState(null);
  const [error, setError] = useState('');
  const cargar = useCallback(() => { obtenerRevision().then(setCola).catch((e) => setError(e.message)); }, []);
  useEffect(() => { cargar(); const i = setInterval(cargar, 15000); return () => clearInterval(i); }, [cargar]);

  async function decidir(id, aprobar) {
    setError('');
    try { await (aprobar ? aprobarEvento(id) : rechazarEvento(id)); cargar(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <p className="nota">Reportes que la IA marcó como dudosos (baja confianza). No salen en el mapa hasta que los apruebes.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {!cola && <p>Cargando…</p>}
      {cola?.length === 0 && <p>No hay reportes en revisión. ✅</p>}
      <ul className="lista-simple">
        {cola?.map((e) => {
          const t = TIPOS[e.tipo];
          const ia = e.analisis_ia?.texto;
          const img = e.analisis_ia?.imagen;
          return (
            <li key={e.id} className="tarjeta tarjeta-gestion" style={{ '--color': t.color }}>
              <span className="tarjeta-icono" aria-hidden="true">{t.icono}</span>
              <div className="tarjeta-cuerpo">
                <div className="tarjeta-fila"><strong>#{e.id} {t.etiqueta}</strong><span>{formatoHace(e.creado_en)}</span></div>
                <p className="tarjeta-desc-completa">“{e.descripcion || 'Sin descripción'}”</p>
                {e.foto_url && <img className="foto-previa" src={e.foto_url} alt="Foto del reporte" />}
                <div className="caja-ia">
                  <strong>🤖 Análisis ({ia?.fuente === 'gemini' ? 'Gemini' : 'reglas de respaldo'}):</strong>
                  <span>Confianza {e.confianza}/100 · {ia?.coherente === false ? '❌ Incoherente' : ia?.coherente ? '✔ Coherente' : 'Sin texto'}
                    {ia?.tipo_sugerido && ia.tipo_sugerido !== e.tipo ? ` · Parece: ${TIPOS[ia.tipo_sugerido]?.etiqueta}` : ''}
                    {ia?.gravedad ? ` · Gravedad ${ia.gravedad}/5` : ''}</span>
                  {ia?.razon && <span>Razón: {ia.razon}</span>}
                  {img?.corresponde != null && <span>Foto: {img.corresponde ? '✔ corresponde' : '❌ no corresponde'}{img.descripcion ? ` (${img.descripcion})` : ''}</span>}
                  <span>{textoReportes(e.cantidad_reportes)}</span>
                </div>
                <div className="acciones">
                  <button type="button" className="boton boton-primario" onClick={() => decidir(e.id, true)}>✔ Aprobar y publicar</button>
                  <button type="button" className="boton boton-secundario" onClick={() => decidir(e.id, false)}>✕ Rechazar</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ---------- Eventos (eliminar) ----------
function Eventos() {
  const [eventos, setEventos] = useState(null);
  const [dias, setDias] = useState(30);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const cargar = useCallback(() => { obtenerEventosGestion(true).then(setEventos).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    cargar();
    socket.on('evento_actualizado', cargar); socket.on('nuevo_evento', cargar);
    return () => { socket.off('evento_actualizado', cargar); socket.off('nuevo_evento', cargar); };
  }, [cargar]);

  async function borrar(id) {
    if (!window.confirm(`¿Eliminar el evento #${id}? Esta acción no se puede deshacer.`)) return;
    try { await eliminarEvento(id); cargar(); } catch (e) { setError(e.message); }
  }
  async function borrarViejos() {
    if (!window.confirm(`¿Eliminar los eventos resueltos o rechazados de hace más de ${dias} días? No se puede deshacer.`)) return;
    try { const r = await eliminarEventosViejos(dias); setMensaje(`Se eliminaron ${r.eliminados} evento(s).`); cargar(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="fila-campos fila-centrada">
        <label className="campo"><span className="campo-etiqueta">Eliminar resueltos/rechazados de hace más de (días)</span>
          <input type="number" min={1} value={dias} onChange={(e) => setDias(e.target.value)} />
        </label>
        <button type="button" className="boton boton-secundario" onClick={borrarViejos}>🗑️ Eliminar viejos</button>
      </div>
      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="tabla-scroll">
        <table className="tabla">
          <thead><tr><th>#</th><th>Tipo</th><th>Estado</th><th>Prioridad</th><th>Origen</th><th>Reportes</th><th>Actualizado</th><th /></tr></thead>
          <tbody>
            {eventos?.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td>
                <td>{TIPOS[e.tipo].icono} {TIPOS[e.tipo].etiqueta}</td>
                <td><span className={`chip ${ESTADOS[e.estado].clase}`}>{ESTADOS[e.estado].etiqueta}</span></td>
                <td>{PRIORIDADES[e.prioridad].etiqueta.replace('Prioridad ', '')}</td>
                <td>{e.verificado ? `✔ ${e.entidad}` : 'Ciudadano'}</td>
                <td>{e.cantidad_reportes}</td>
                <td>{formatoHace(e.actualizado_en)}</td>
                <td><button type="button" className="boton boton-secundario boton-chico" onClick={() => borrar(e.id)} aria-label={`Eliminar evento ${e.id}`}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Usuarios y roles ----------
function Usuarios() {
  const { usuario: yo } = useSesion();
  const [usuarios, setUsuarios] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', password: '', rol: 'entidad_oficial', entidad: 'Bomberos' });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const cargar = useCallback(() => { obtenerUsuarios().then(setUsuarios).catch((e) => setError(e.message)); }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function cambiar(id, cambios) {
    setError('');
    try { await actualizarUsuario(id, cambios); cargar(); } catch (e) { setError(e.message); }
  }
  async function crear(e) {
    e.preventDefault();
    setError(''); setMensaje('');
    try {
      await crearUsuario({ ...nuevo, entidad: nuevo.rol === 'entidad_oficial' ? nuevo.entidad : null });
      setMensaje(`✅ Cuenta creada para ${nuevo.email}. Entrégale la contraseña por un medio seguro.`);
      setNuevo({ ...nuevo, nombre: '', email: '', password: '' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <details className="caja-plegable">
        <summary>➕ Crear cuenta (entidad oficial o administrador)</summary>
        <form className="formulario" onSubmit={crear}>
          <div className="fila-campos">
            <label className="campo"><span className="campo-etiqueta">Nombre</span><input required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></label>
            <label className="campo"><span className="campo-etiqueta">Correo</span><input type="email" required value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></label>
            <label className="campo"><span className="campo-etiqueta">Contraseña inicial</span><input type="password" required minLength={8} autoComplete="new-password" value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} /></label>
          </div>
          <div className="fila-campos">
            <label className="campo"><span className="campo-etiqueta">Rol</span>
              <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {nuevo.rol === 'entidad_oficial' && (
              <label className="campo"><span className="campo-etiqueta">Entidad</span>
                <select value={nuevo.entidad} onChange={(e) => setNuevo({ ...nuevo, entidad: e.target.value })}>
                  {ENTIDADES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </label>
            )}
          </div>
          <button type="submit" className="boton boton-primario">Crear cuenta</button>
        </form>
      </details>
      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="tabla-scroll">
        <table className="tabla">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Entidad</th><th>Reportes</th><th>Activo</th></tr></thead>
          <tbody>
            {usuarios?.map((u) => {
              const soyYo = u.id === yo?.id;
              return (
                <tr key={u.id} className={u.activo ? '' : 'fila-inactiva'}>
                  <td>{u.nombre}{soyYo && ' (tú)'}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.rol} disabled={soyYo} aria-label={`Rol de ${u.nombre}`}
                      onChange={(e) => cambiar(u.id, { rol: e.target.value, entidad: e.target.value === 'entidad_oficial' ? (u.entidad || 'Bomberos') : null })}>
                      {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td>
                    {u.rol === 'entidad_oficial' ? (
                      <select value={u.entidad || ''} disabled={soyYo} aria-label={`Entidad de ${u.nombre}`} onChange={(e) => cambiar(u.id, { entidad: e.target.value })}>
                        {ENTIDADES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                    ) : '—'}
                  </td>
                  <td>{u.reportes}</td>
                  <td><input type="checkbox" checked={u.activo} disabled={soyYo} aria-label={`Cuenta activa de ${u.nombre}`} onChange={(e) => cambiar(u.id, { activo: e.target.checked })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Estadísticas (barras simples con CSS) ----------
function Estadisticas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { obtenerEstadisticas().then(setDatos).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!datos) return <p>Cargando…</p>;

  const maxTipo = Math.max(1, ...datos.por_tipo.map((x) => x.total));
  const maxDia = Math.max(1, ...datos.por_dia.map((x) => x.total));
  const { totales } = datos;

  return (
    <div className="estadisticas">
      <div className="tarjetas-numero">
        <div><strong>{totales.reportes}</strong><span>reportes</span></div>
        <div><strong>{totales.eventos}</strong><span>eventos</span></div>
        <div><strong>{totales.en_revision}</strong><span>en revisión</span></div>
        <div><strong>{totales.usuarios}</strong><span>usuarios</span></div>
      </div>

      <section>
        <h3>Reportes por tipo</h3>
        <ul className="barras">
          {datos.por_tipo.map((x) => (
            <li key={x.tipo}>
              <span className="barra-etiqueta">{TIPOS[x.tipo].icono} {TIPOS[x.tipo].etiqueta}</span>
              <span className="barra-pista"><span className="barra" style={{ width: `${(x.total / maxTipo) * 100}%`, background: TIPOS[x.tipo].color }} /></span>
              <span className="barra-valor">{x.total}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Reportes por día (últimos 14 días)</h3>
        <div className="columnas" role="img" aria-label={`Reportes por día: ${datos.por_dia.map((d) => `${d.dia}: ${d.total}`).join(', ')}`}>
          {datos.por_dia.map((d) => (
            <div key={d.dia} className="columna" title={`${d.dia}: ${d.total}`}>
              <span className="columna-valor">{d.total || ''}</span>
              <span className="columna-barra" style={{ height: `${(d.total / maxDia) * 100}%` }} />
              <span className="columna-dia">{d.dia.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
