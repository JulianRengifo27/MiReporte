// ===== Panel de ENTIDAD OFICIAL =====
// 1) Publicar un reporte oficial (sale con el sello "Verificado")
// 2) Gestionar eventos: confirmar, cambiar estado y escribir el desvío recomendado
import { useCallback, useEffect, useState } from 'react';
import { publicarOficial, obtenerEventosGestion, actualizarEvento, socket } from '../api.js';
import { TIPOS, TIPOS_CON_AREA, ESTADOS, PRIORIDADES, textoReportes } from '../config.js';
import { formatoHace } from '../utils/geo.js';
import { useSesion } from '../sesion.jsx';
import SelectorUbicacion from '../components/SelectorUbicacion.jsx';

const VACIO = { tipo: 'accidente', descripcion: '', radio_m: 0, prioridad: 'media', estado: 'activa', via_bloqueada: false, desvio: '' };

export default function PanelOficial({ ubicacion }) {
  const { usuario } = useSesion();
  const [pestana, setPestana] = useState('gestionar');

  return (
    <div className="pagina">
      <h2>Panel oficial {usuario?.entidad ? `· ${usuario.entidad}` : ''}</h2>
      <div className="pestanas-panel" role="tablist">
        <button type="button" role="tab" aria-selected={pestana === 'gestionar'} onClick={() => setPestana('gestionar')}>Gestionar eventos</button>
        <button type="button" role="tab" aria-selected={pestana === 'publicar'} onClick={() => setPestana('publicar')}>Publicar reporte oficial</button>
      </div>
      {pestana === 'publicar'
        ? <PublicarOficial ubicacion={ubicacion} alPublicar={() => setPestana('gestionar')} />
        : <GestionarEventos />}
    </div>
  );
}

function PublicarOficial({ ubicacion, alPublicar }) {
  const [datos, setDatos] = useState(VACIO);
  const [punto, setPunto] = useState(ubicacion);
  const [foto, setFoto] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const poner = (campo, valor) => setDatos((d) => ({ ...d, [campo]: valor }));

  async function enviar(e) {
    e.preventDefault();
    setError(''); setMensaje(''); setEnviando(true);
    try {
      const r = await publicarOficial({ ...datos, ...punto, foto });
      setMensaje(r.unido_a_evento_existente
        ? '✅ Ya había reportes ciudadanos de este hecho: el evento ahora es oficial y verificado.'
        : '✅ Reporte oficial publicado en el mapa.');
      setDatos(VACIO); setFoto(null);
      setTimeout(alPublicar, 1500);
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label className="campo"><span className="campo-etiqueta">Tipo</span>
        <select value={datos.tipo} onChange={(e) => {
          const tipo = e.target.value;
          setDatos((d) => ({ ...d, tipo, radio_m: TIPOS_CON_AREA.includes(tipo) ? (d.radio_m || 200) : 0 }));
        }}>
          {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.icono} {t.etiqueta}</option>)}
        </select>
      </label>

      <div className="campo">
        <span className="campo-etiqueta">Ubicación (arrastra el pin)</span>
        <SelectorUbicacion inicial={ubicacion} onCambio={setPunto} alto={240} />
      </div>

      <label className="campo"><span className="campo-etiqueta">Descripción oficial</span>
        <textarea rows={3} maxLength={500} required value={datos.descripcion} onChange={(e) => poner('descripcion', e.target.value)}
          placeholder="Ej: Incendio estructural en bodega. Unidades en el lugar." />
      </label>

      <div className="fila-campos">
        <label className="campo"><span className="campo-etiqueta">Prioridad</span>
          <select value={datos.prioridad} onChange={(e) => poner('prioridad', e.target.value)}>
            {Object.entries(PRIORIDADES).map(([k, p]) => <option key={k} value={k}>{p.etiqueta}</option>)}
          </select>
        </label>
        <label className="campo"><span className="campo-etiqueta">Estado</span>
          <select value={datos.estado} onChange={(e) => poner('estado', e.target.value)}>
            {Object.entries(ESTADOS).map(([k, s]) => <option key={k} value={k}>{s.etiqueta}</option>)}
          </select>
        </label>
        <label className="campo"><span className="campo-etiqueta">Radio de riesgo (m)</span>
          <input type="number" min={0} max={3000} step={50} value={datos.radio_m} onChange={(e) => poner('radio_m', e.target.value)} />
        </label>
      </div>

      <label className="casilla">
        <input type="checkbox" checked={datos.via_bloqueada} onChange={(e) => poner('via_bloqueada', e.target.checked)} />
        <span>La emergencia bloquea una vía</span>
      </label>
      <label className="campo"><span className="campo-etiqueta">Desvío recomendado (ruta alterna)</span>
        <input maxLength={300} value={datos.desvio} onChange={(e) => poner('desvio', e.target.value)}
          placeholder="Ej: Tome la Av. Boyacá hacia el norte y retome por la Calle 80." />
      </label>

      <label className="boton boton-secundario boton-foto">
        📷 {foto ? foto.name : 'Adjuntar foto (opcional)'}
        <input type="file" accept="image/*" hidden onChange={(e) => setFoto(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {mensaje && <p className="exito" role="status">{mensaje}</p>}
      <button type="submit" className="boton boton-primario boton-enviar" disabled={enviando}>
        {enviando ? 'Publicando…' : '✔ Publicar como oficial'}
      </button>
    </form>
  );
}

function GestionarEventos() {
  const [eventos, setEventos] = useState(null);
  const [incluirResueltos, setIncluirResueltos] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    obtenerEventosGestion(incluirResueltos).then(setEventos).catch((e) => setError(e.message));
  }, [incluirResueltos]);

  useEffect(() => { cargar(); }, [cargar]);

  // Se actualiza solo cuando llegan eventos nuevos o cambios por tiempo real
  useEffect(() => {
    socket.on('nuevo_evento', cargar);
    socket.on('evento_actualizado', cargar);
    socket.on('evento_eliminado', cargar);
    return () => { socket.off('nuevo_evento', cargar); socket.off('evento_actualizado', cargar); socket.off('evento_eliminado', cargar); };
  }, [cargar]);

  async function cambiar(id, cambios) {
    setError('');
    try { await actualizarEvento(id, cambios); cargar(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <label className="casilla">
        <input type="checkbox" checked={incluirResueltos} onChange={(e) => setIncluirResueltos(e.target.checked)} />
        <span>Mostrar también los resueltos</span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      {!eventos && <p>Cargando…</p>}
      {eventos?.length === 0 && <p>No hay eventos activos. 🙌</p>}
      <ul className="lista-simple">
        {eventos?.map((e) => <TarjetaGestion key={e.id} evento={e} onCambiar={cambiar} />)}
      </ul>
    </>
  );
}

function TarjetaGestion({ evento: e, onCambiar }) {
  const t = TIPOS[e.tipo];
  const [desvio, setDesvio] = useState(e.desvio || '');
  useEffect(() => { setDesvio(e.desvio || ''); }, [e.desvio]);

  return (
    <li className="tarjeta tarjeta-gestion" style={{ '--color': t.color }}>
      <span className="tarjeta-icono" aria-hidden="true">{t.icono}</span>
      <div className="tarjeta-cuerpo">
        <div className="tarjeta-fila"><strong>#{e.id} {t.etiqueta}</strong><span>{formatoHace(e.actualizado_en)}</span></div>
        <p className="tarjeta-desc-completa">{e.descripcion || 'Sin descripción.'}</p>
        <div className="tarjeta-fila tarjeta-meta">
          <span className={`chip ${ESTADOS[e.estado].clase}`}>{ESTADOS[e.estado].etiqueta}</span>
          <span className={`chip ${PRIORIDADES[e.prioridad].clase}`}>{PRIORIDADES[e.prioridad].etiqueta}</span>
          {e.verificado ? <span className="sello-oficial">✔ {e.entidad}</span> : <span className="chip chip-ciudadano">Ciudadano · confianza {e.confianza}</span>}
          <span>{textoReportes(e.cantidad_reportes)}</span>
        </div>

        <div className="acciones">
          {!e.verificado && <button type="button" className="boton boton-primario" onClick={() => onCambiar(e.id, { confirmar: true })}>✔ Confirmar</button>}
          {e.estado !== 'en_atencion' && <button type="button" className="boton boton-secundario" onClick={() => onCambiar(e.id, { estado: 'en_atencion' })}>🚒 En atención</button>}
          {e.estado !== 'resuelta' && <button type="button" className="boton boton-secundario" onClick={() => onCambiar(e.id, { estado: 'resuelta' })}>✅ Resuelta</button>}
          {e.estado === 'resuelta' && <button type="button" className="boton boton-secundario" onClick={() => onCambiar(e.id, { estado: 'activa' })}>↩ Reabrir</button>}
        </div>

        <form className="fila-desvio" onSubmit={(ev) => { ev.preventDefault(); onCambiar(e.id, { desvio, via_bloqueada: Boolean(desvio) || e.via_bloqueada }); }}>
          <label className="campo"><span className="campo-etiqueta">Desvío recomendado</span>
            <input value={desvio} maxLength={300} onChange={(ev) => setDesvio(ev.target.value)} placeholder="Escribe la ruta alterna para los ciudadanos" />
          </label>
          <button type="submit" className="boton boton-secundario" disabled={desvio === (e.desvio || '')}>Guardar</button>
        </form>
      </div>
    </li>
  );
}
