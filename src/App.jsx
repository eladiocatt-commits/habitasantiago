import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, CheckCircle2, MessageSquare, PlusCircle, Upload, Map as MapIcon, List, LogIn, LogOut, User
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function App() {
  const [session, setSession] = useState(null);
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);
  
  const [vistaMovil, setVistaMovil] = useState('lista');
  const [resenas, setResenas] = useState([]);
  const [cargandoResenas, setCargandoResenas] = useState(false);

  // Modales
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalEdificioAbierto, setModalEdificioAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login'); // 'login' | 'registro'
  const [enviando, setEnviando] = useState(false);

  // Auth Form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Reseña Form
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [nuevaResena, setNuevaResena] = useState({
    titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3
  });

  // Edificio Form
  const [nuevoEdificio, setNuevoEdificio] = useState({
    nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693'
  });

  // Listener de Sesión en Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cargarEdificios = async () => {
    try {
      const { data, error } = await supabase
        .from('vista_edificios_con_promedios')
        .select('*');

      if (!error) setEdificios(data || []);
    } catch (err) {
      console.error("Error al cargar edificios:", err);
    } finally {
      setCargando.call ? setCargando(false) : null;
    }
  };

  useEffect(() => {
    cargarEdificios();
  }, []);

  useEffect(() => {
    if (!edificioSeleccionado) return;

    async function cargarResenas() {
      setCargandoResenas(true);
      const { data, error } = await supabase
        .from('resenas')
        .select('*')
        .eq('edificio_id', edificioSeleccionado.id)
        .order('creado_en', { ascending: false });

      if (!error) setResenas(data || []);
      setCargandoResenas(false);
    }

    cargarResenas();
  }, [edificioSeleccionado]);

  // Manejo de Auth (Registro e Inicio de Sesión)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAuthError('');

    if (modoAuth === 'registro') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthError(error.message);
      else {
        alert('¡Cuenta creada con éxito!');
        setModalAuthAbierto(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthError('Correo o contraseña incorrectos.');
      else {
        setModalAuthAbierto(false);
      }
    }
    setEnviando(false);
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  const handleAbrirResenaModal = () => {
    if (!session) {
      setModoAuth('login');
      setModalAuthAbierto(true);
      return;
    }
    setModalResenaAbierto(true);
  };

  const handleAbrirEdificioModal = () => {
    if (!session) {
      setModoAuth('login');
      setModalAuthAbierto(true);
      return;
    }
    setModalEdificioAbierto(true);
  };

  const handleGuardarResena = async (e) => {
    e.preventDefault();
    if (!edificioSeleccionado || !session) return;
    setEnviando(true);

    let fotoUrl = null;

    if (archivoFoto) {
      const fileExt = archivoFoto.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `resenas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-edificios')
        .upload(filePath, archivoFoto);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('fotos-edificios')
          .getPublicUrl(filePath);
        fotoUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from('resenas').insert([
      {
        edificio_id: edificioSeleccionado.id,
        titulo: nuevaResena.titulo,
        comentario: nuevaResena.comentario,
        nota_ruido: parseInt(nuevaResena.nota_ruido),
        nota_administracion: parseInt(nuevaResena.nota_administracion),
        nota_gastos_comunes: parseInt(nuevaResena.nota_gastos_comunes),
        nota_seguridad: parseInt(nuevaResena.nota_seguridad),
        url_imagen: fotoUrl,
        usuario_email: session.user.email,
        es_verificado: true
      }
    ]);

    if (!error) {
      setModalResenaAbierto(false);
      setArchivoFoto(null);
      setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3 });
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []);
      cargarEdificios();
    } else {
      alert('Error al guardar la reseña.');
    }
    setEnviando(false);
  };

  const handleGuardarEdificio = async (e) => {
    e.preventDefault();
    if (!session) return;
    setEnviando(true);

    let lat = parseFloat(nuevoEdificio.latitud);
    let lon = parseFloat(nuevoEdificio.longitud);

    try {
      const direccionCompleta = `${nuevoEdificio.direccion}, ${nuevoEdificio.comuna}, Santiago, Chile`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionCompleta)}`);
      const datosMapa = await res.json();

      if (datosMapa && datosMapa.length > 0) {
        lat = parseFloat(datosMapa[0].lat);
        lon = parseFloat(datosMapa[0].lon);
      }
    } catch (err) {
      console.warn("Ubicación por defecto.", err);
    }

    const { data, error } = await supabase.from('edificios').insert([
      {
        nombre: nuevoEdificio.nombre,
        direccion: nuevoEdificio.direccion,
        comuna: nuevoEdificio.comuna,
        latitud: lat,
        longitud: lon
      }
    ]).select();

    if (!error) {
      setModalEdificioAbierto(false);
      setNuevoEdificio({ nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693' });
      await cargarEdificios();
      if (data && data.length > 0) setEdificioSeleccionado(data[0]);
    } else {
      alert('Error al crear el edificio.');
    }
    setEnviando(false);
  };

  const edificiosFiltrados = edificios.filter(e => 
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.comuna.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans relative overflow-hidden">
      
      {/* PANEL IZQUIERDO */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10 pb-14 md:pb-0 ${vistaMovil === 'mapa' ? 'hidden md:flex' : 'flex'}`}>
        
        {/* ENCABEZADO CON BOTÓN DE SESIÓN */}
        <header className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" />
            <h1 className="text-lg font-bold text-slate-900">HabitaSantiago</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAbrirEdificioModal}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Nuevo
            </button>

            {session ? (
              <button 
                onClick={handleCerrarSesion}
                title={`Sesión: ${session.user.email}`}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ) : (
              <button 
                onClick={() => { setModoAuth('login'); setModalAuthAbierto(true); }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" /> Entrar
              </button>
            )}
          </div>
        </header>

        {!edificioSeleccionado ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar comuna, calle o edificio..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cargando ? (
                <p className="text-sm text-slate-500 text-center py-8">Cargando datos...</p>
              ) : edificiosFiltrados.map((edificio) => (
                <div 
                  key={edificio.id}
                  onClick={() => { setEdificioSeleccionado(edificio); setVistaMovil('lista'); }}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 transition cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-800">{edificio.nombre}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{edificio.calificacion_promedio || 'N/A'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-slate-400" /> {edificio.direccion}, {edificio.comuna}
                  </p>
                  <span className="text-xs text-indigo-600 font-medium">
                    {edificio.total_resenas} {edificio.total_resenas === 1 ? 'reseña' : 'reseñas'} &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <button 
                onClick={() => setEdificioSeleccionado(null)}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                &larr; Volver a la lista
              </button>
            </div>

            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-slate-900">{edificioSeleccionado.nombre}</h2>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {edificioSeleccionado.calificacion_promedio || 'N/A'}
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {edificioSeleccionado.direccion}, {edificioSeleccionado.comuna}
              </p>

              <button
                type="button"
                onClick={handleAbrirResenaModal}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
              >
                <Plus className="w-4 h-4" /> Dejar una Reseña
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" /> Opiniones ({resenas.length})
              </h3>

              {cargandoResenas ? (
                <p className="text-xs text-slate-400 text-center py-4">Cargando opiniones...</p>
              ) : resenas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aún no hay opiniones.</p>
              ) : (
                resenas.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm text-slate-800">{r.titulo}</h4>
                      {r.es_verificado && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verificado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.comentario}</p>
                    
                    {r.url_imagen && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 max-h-48">
                        <img src={r.url_imagen} alt="Evidencia" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {r.usuario_email ? r.usuario_email.split('@')[0] : 'Vecino'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                      <div>🔊 Ruido: <strong>{r.nota_ruido}/5</strong></div>
                      <div>🛡️ Seguridad: <strong>{r.nota_seguridad}/5</strong></div>
                      <div>🧹 Conserjería: <strong>{r.nota_administracion}/5</strong></div>
                      <div>💰 Gastos: <strong>{r.nota_gastos_comunes}/5</strong></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* PANEL DERECHO / MAPA */}
      <div className={`flex-1 h-full relative z-0 pb-14 md:pb-0 ${vistaMovil === 'lista' ? 'hidden md:block' : 'block'}`}>
        <MapContainer 
          center={[-33.4489, -70.6693]} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {edificiosFiltrados.map((edificio) => (
            <Marker 
              key={edificio.id} 
              position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]}
              eventHandlers={{
                click: () => {
                  setEdificioSeleccionado(edificio);
                  setVistaMovil('lista');
                },
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm text-slate-900">{edificio.nombre}</h4>
                  <p className="text-xs text-slate-600 mb-1">{edificio.direccion}</p>
                  <div className="text-xs text-amber-600 font-bold">
                    Nota: {edificio.calificacion_promedio || 'Sin notas'} ★
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* BARRA INFERIOR DE NAVEGACIÓN MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
        <button 
          onClick={() => setVistaMovil('lista')}
          className={`flex flex-col items-center gap-1 text-xs font-semibold py-1 px-4 rounded-lg transition ${vistaMovil === 'lista' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
        >
          <List className="w-5 h-5" />
          <span>Edificios</span>
        </button>
        <button 
          onClick={() => setVistaMovil('mapa')}
          className={`flex flex-col items-center gap-1 text-xs font-semibold py-1 px-4 rounded-lg transition ${vistaMovil === 'mapa' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}
        >
          <MapIcon className="w-5 h-5" />
          <span>Mapa</span>
        </button>
      </div>

      {/* MODAL 0: AUTENTICACIÓN (LOGIN / REGISTRO) */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              type="button"
              onClick={() => setModalAuthAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {modoAuth === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {modoAuth === 'login' ? 'Ingresa para publicar opiniones o crear edificios' : 'Regístrate gratis para opinar'}
            </p>

            {authError && <p className="text-xs text-red-500 mb-3 bg-red-50 p-2 rounded">{authError}</p>}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
                <input 
                  type="email" required placeholder="tu@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
                <input 
                  type="password" required placeholder="••••••••" minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow">
                {enviando ? 'Cargando...' : modoAuth === 'login' ? 'Ingresar' : 'Registrarse'}
              </button>
            </form>

            <div className="mt-4 text-center">
              {modoAuth === 'login' ? (
                <button onClick={() => { setModoAuth('registro'); setAuthError(''); }} className="text-xs text-indigo-600 font-medium hover:underline">
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              ) : (
                <button onClick={() => { setModoAuth('login'); setAuthError(''); }} className="text-xs text-indigo-600 font-medium hover:underline">
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RESEÑA */}
      {modalResenaAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setModalResenaAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Publicar Opinión</h3>
            <p className="text-xs text-slate-500 mb-4">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título corto</label>
                <input 
                  type="text" required placeholder="Ej: Excelente vista y conserjería"
                  value={nuevaResena.titulo}
                  onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comentario detallado</label>
                <textarea 
                  required rows="3" placeholder="Describe el estado del edificio..."
                  value={nuevaResena.comentario}
                  onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjuntar foto / comprobante (Opcional)</label>
                <div className="flex items-center gap-2 border border-dashed border-slate-300 p-2.5 rounded-lg bg-slate-50 text-xs">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setArchivoFoto(e.target.files[0])}
                    className="w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">🔊 Ruido (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_ruido} onChange={(e) => setNuevaResena({...nuevaResena, nota_ruido: e.target.value})} className="w-full p-1 border rounded text-center font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">🛡️ Seguridad (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_seguridad} onChange={(e) => setNuevaResena({...nuevaResena, nota_seguridad: e.target.value})} className="w-full p-1 border rounded text-center font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">🧹 Conserjería (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_administracion} onChange={(e) => setNuevaResena({...nuevaResena, nota_administracion: e.target.value})} className="w-full p-1 border rounded text-center font-bold" />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">💰 Gastos (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_gastos_comunes} onChange={(e) => setNuevaResena({...nuevaResena, nota_gastos_comunes: e.target.value})} className="w-full p-1 border rounded text-center font-bold" />
                </div>
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow">
                {enviando ? 'Guardando...' : 'Publicar Reseña'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVO EDIFICIO */}
      {modalEdificioAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setModalEdificioAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Registrar Nuevo Edificio</h3>
            <p className="text-xs text-slate-500 mb-4">Agrega la dirección para ubicarlo en Santiago.</p>

            <form onSubmit={handleGuardarEdificio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Edificio / Condominio</label>
                <input 
                  type="text" required placeholder="Ej: Condominio Barrio Italia"
                  value={nuevoEdificio.nombre}
                  onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección exacta</label>
                <input 
                  type="text" required placeholder="Ej: Av. Italia 1234"
                  value={nuevoEdificio.direccion}
                  onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comuna</label>
                <select 
                  value={nuevoEdificio.comuna}
                  onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Santiago Centro">Santiago Centro</option>
                  <option value="Providencia">Providencia</option>
                  <option value="Ñuñoa">Ñuñoa</option>
                  <option value="Las Condes">Las Condes</option>
                  <option value="San Miguel">San Miguel</option>
                  <option value="La Reina">La Reina</option>
                  <option value="Macul">Macul</option>
                  <option value="Estación Central">Estación Central</option>
                  <option value="Independencia">Independencia</option>
                  <option value="Recoleta">Recoleta</option>
                </select>
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow">
                {enviando ? 'Buscando ubicación...' : 'Crear Edificio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}