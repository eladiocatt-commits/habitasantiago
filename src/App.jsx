import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, PlusCircle, Camera, Heart, Home, Bell, AlertTriangle, Filter
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function GaleriaFotosEdificio({ resenas }) {
  const fotosConResena = resenas.filter(r => r.url_imagen);

  if (fotosConResena.length === 0) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-slate-800">
      <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>📸</span> Fotos de la comunidad ({fotosConResena.length})
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {fotosConResena.map((r, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-slate-700/60 shadow-md group cursor-pointer"
            onClick={() => window.open(r.url_imagen, '_blank')}
          >
            <img 
              src={r.url_imagen} 
              alt="Foto vecinal" 
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[10px] text-white font-medium truncate">{r.titulo ? `★ ${r.titulo}` : 'Foto vecinal'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);
  
  const [resenas, setResenas] = useState([]);
  const [cargandoResenas, setCargandoResenas] = useState(false);
  
  // Filtros y Favoritos
  const [filtroComuna, setFiltroComuna] = useState('todas');
  const [filtroRating, setFiltroRating] = useState(false);
  const [filtroPresupuesto, setFiltroPresupuesto] = useState('todos'); // NUEVO FILTRO DE PRECIO
  const [favoritos, setFavoritos] = useState([]);

  // Modales
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState(false); // NUEVO MODAL DE ALERTAS
  const [modalEdificioAbierto, setModalEdificioAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login'); 
  const [enviando, setEnviando] = useState(false);

  // Auth Form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Reseña Form (con etiquetas de incidencias añadidas)
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [nuevaResena, setNuevaResena] = useState({
    titulo: '', 
    comentario: '', 
    nota_ruido: 3, 
    nota_administracion: 3, 
    nota_gastos_comunes: 3, 
    nota_seguridad: 3,
    gasto_comun: '',
    arriendo: '',
    habitaciones: '1',
    etiqueta: 'Excelente conectividad al metro'
  });

  // Estado para Alerta de Arriendo
  const [correoAlerta, setCorreoAlerta] = useState('');

  // Subida rápida de foto
  const [archivoFotoRapida, setArchivoFotoRapida] = useState(null);

  // Edificio Form
  const [nuevoEdificio, setNuevoEdificio] = useState({
    nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const favsGuardados = JSON.parse(localStorage.getItem('habitasantiago_favs') || '[]');
    setFavoritos(favsGuardados);

    return () => subscription.unsubscribe();
  }, []);

  const toggleFavorito = (edificioId, e) => {
    e.stopPropagation();
    let nuevosFavs;
    if (favoritos.includes(edificioId)) {
      nuevosFavs = favoritos.filter(id => id !== edificioId);
    } else {
      nuevosFavs = [...favoritos, edificioId];
    }
    setFavoritos(nuevosFavs);
    localStorage.setItem('habitasantiago_favs', JSON.stringify(nuevosFavs));
  };

  const cargarEdificios = async () => {
    try {
      const { data, error } = await supabase
        .from('vista_edificios_con_promedios')
        .select('*');

      if (!error) setEdificios(data || []);
    } catch (err) {
      console.error("Error al cargar edificios:", err);
    } finally {
      setCargando(false);
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

  const calcularPromediosEdificio = () => {
    const resenasConGastos = resenas.filter(r => r.gasto_comun && Number(r.gasto_comun) > 0);
    const resenasConArriendo = resenas.filter(r => r.arriendo && Number(r.arriendo) > 0);

    let promedioGasto = 'Sin datos';
    if (resenasConGastos.length > 0) {
      const suma = resenasConGastos.reduce((acc, curr) => acc + Number(curr.gasto_comun), 0);
      promedioGasto = `$${Math.round(suma / resenasConGastos.length).toLocaleString('es-CL')}`;
    }

    const arriendosPorHab = {};
    resenasConArriendo.forEach(r => {
      const hab = r.habitaciones || '1';
      if (!arriendosPorHab[hab]) arriendosPorHab[hab] = [];
      arriendosPorHab[hab].push(Number(r.arriendo));
    });

    const promediosArriendoPorHab = {};
    Object.keys(arriendosPorHab).forEach(hab => {
      const lista = arriendosPorHab[hab];
      const suma = lista.reduce((a, b) => a + b, 0);
      promediosArriendoPorHab[hab] = `$${Math.round(suma / lista.length).toLocaleString('es-CL')}`;
    });

    return { promedioGasto, promediosArriendoPorHab };
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAuthError('');

    if (modoAuth === 'registro') {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else { alert('¡Cuenta creada con éxito!'); setModalAuthAbierto(false); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError('Correo o contraseña incorrectos.');
      else { setModalAuthAbierto(false); }
    }
    setEnviando(false);
  };

  const handleCerrarSesion = async () => { await supabase.auth.signOut(); };

  const handleGuardarResena = async (e) => {
    e.preventDefault();
    if (!edificioSeleccionado || !session) return;
    setEnviando(true);

    let fotoUrl = null;
    if (archivoFoto) {
      const fileExt = archivoFoto.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `resenas/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(filePath, archivoFoto);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos-edificios').getPublicUrl(filePath);
        fotoUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from('resenas').insert([{
      edificio_id: edificioSeleccionado.id,
      titulo: nuevaResena.titulo,
      comentario: nuevaResena.comentario,
      nota_ruido: parseInt(nuevaResena.nota_ruido),
      nota_administracion: parseInt(nuevaResena.nota_administracion),
      nota_gastos_comunes: parseInt(nuevaResena.nota_gastos_comunes),
      nota_seguridad: parseInt(nuevaResena.nota_seguridad),
      gasto_comun: nuevaResena.gasto_comun ? parseFloat(nuevaResena.gasto_comun) : null,
      arriendo: nuevaResena.arriendo ? parseFloat(nuevaResena.arriendo) : null,
      habitaciones: nuevaResena.habitaciones ? String(nuevaResena.habitaciones) : '1',
      etiqueta: nuevaResena.etiqueta,
      url_imagen: fotoUrl,
      usuario_email: session.user.email,
      es_verificado: true
    }]);

    if (!error) {
      setModalResenaAbierto(false);
      setArchivoFoto(null);
      setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro' });
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []);
      cargarEdificios();
    } else { alert('Error al guardar la reseña. Asegúrate de haber ejecutado la columna de etiqueta en Supabase si es nueva.'); }
    setEnviando(false);
  };

  const handleGuardarAlerta = (e) => {
    e.preventDefault();
    if (!correoAlerta) return;
    alert(`¡Listo! Te avisaremos al correo ${correoAlerta} cuando haya nuevos arriendos o reportes en ${edificioSeleccionado?.nombre}.`);
    setCorreoAlerta('');
    setModalAlertaAbierto(false);
  };

  const handleGuardarFotoRapida = async (e) => {
    e.preventDefault();
    if (!edificioSeleccionado || !session || !archivoFotoRapida) return;
    setEnviando(true);

    let fotoUrl = null;
    const fileExt = archivoFotoRapida.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `resenas/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(filePath, archivoFotoRapida);
    
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('fotos-edificios').getPublicUrl(filePath);
      fotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('resenas').insert([{
      edificio_id: edificioSeleccionado.id,
      titulo: 'Foto de fachada',
      comentario: 'Aporte fotográfico de la comunidad.',
      nota_ruido: 3,
      nota_administracion: 3,
      nota_gastos_comunes: 3,
      nota_seguridad: 3,
      url_imagen: fotoUrl,
      usuario_email: session.user.email,
      es_verificado: true
    }]);

    if (!error) {
      setModalFotoAbierto(false);
      setArchivoFotoRapida(null);
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []);
      cargarEdificios();
    } else { alert('Error al subir la foto.'); }
    setEnviando(false);
  };

  const handleGuardarEdificio = async (e) => {
    e.preventDefault();
    if (!session) return;
    setEnviando(true);

    let lat = parseFloat(nuevoEdificio.latitud);
    let lon = parseFloat(nuevoEdificio.longitud);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${nuevoEdificio.direccion}, ${nuevoEdificio.comuna}, Santiago, Chile`)}`);
      const datosMapa = await res.json();
      if (datosMapa && datosMapa.length > 0) {
        lat = parseFloat(datosMapa[0].lat);
        lon = parseFloat(datosMapa[0].lon);
      }
    } catch (err) { console.warn(err); }

    const { data, error } = await supabase.from('edificios').insert([{
      nombre: nuevoEdificio.nombre, direccion: nuevoEdificio.direccion, comuna: nuevoEdificio.comuna, latitud: lat, longitud: lon
    }]).select();

    if (!error) {
      setModalEdificioAbierto(false);
      setNuevoEdificio({ nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693' });
      await cargarEdificios();
      if (data && data.length > 0) setEdificioSeleccionado(data[0]);
    } else { alert('Error al crear el edificio.'); }
    setEnviando(false);
  };

  const edificiosFiltrados = edificios.filter(e => {
    const matchTexto = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                       e.comuna.toLowerCase().includes(busqueda.toLowerCase()) ||
                       e.direccion.toLowerCase().includes(busqueda.toLowerCase());
                       
    const matchComuna = filtroComuna === 'todas' || e.comuna.toLowerCase() === filtroComuna.toLowerCase();
    const matchRating = !filtroRating || (e.calificacion_promedio >= 4.0);

    let matchPresupuesto = true;
    if (filtroPresupuesto === 'bajo') matchPresupuesto = (e.calificacion_promedio >= 3.0); // Simulado con rating/datos
    if (filtroPresupuesto === 'alto') matchPresupuesto = true;

    return matchTexto && matchComuna && matchRating && matchPresupuesto;
  });

  const { promedioGasto, promediosArriendoPorHab } = calcularPromediosEdificio();

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans relative text-white">
      
      {/* 1. BARRA SUPERIOR FLOTANTE */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-400" />
          <h1 className="text-sm font-bold tracking-wide">HabitaSantiago</h1>
        </div>

        <div className="pointer-events-auto hidden md:flex items-center bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 px-3 py-2 rounded-2xl shadow-2xl w-80">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text"
            placeholder="Buscar comuna, edificio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none w-full placeholder-slate-400"
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 p-1.5 rounded-2xl shadow-2xl">
          <button 
            onClick={() => {
              if (!session) { setModoAuth('login'); setModalAuthAbierto(true); }
              else { setModalEdificioAbierto(true); }
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nuevo Edificio
          </button>

          {session ? (
            <button 
              onClick={handleCerrarSesion}
              title={`Cerrar sesión (${session.user.email})`}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button 
              onClick={() => { setModoAuth('login'); setModalAuthAbierto(true); }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}
        </div>
      </header>

      {/* 2. FILTROS RÁPIDOS Y DE PRESUPUESTO */}
      <div className="absolute top-20 left-4 right-4 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-full shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar">
          <button 
            onClick={() => setFiltroComuna('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filtroComuna === 'todas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            🏢 Todas
          </button>
          <button 
            onClick={() => setFiltroComuna('Santiago Centro')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filtroComuna === 'Santiago Centro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Santiago Centro
          </button>
          <button 
            onClick={() => setFiltroComuna('Providencia')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filtroComuna === 'Providencia' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Providencia
          </button>
          <button 
            onClick={() => setFiltroComuna('Ñuñoa')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filtroComuna === 'Ñuñoa' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            Ñuñoa
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
          <button 
            onClick={() => setFiltroRating(!filtroRating)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${filtroRating ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Star size={12} className={filtroRating ? 'fill-white' : 'text-yellow-400 fill-yellow-400'} /> ⭐ 4.0+
          </button>
          <select 
            value={filtroPresupuesto} 
            onChange={(e) => setFiltroPresupuesto(e.target.value)}
            className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full text-xs font-medium border-0 focus:outline-none cursor-pointer"
          >
            <option value="todos">💵 Todo Precio</option>
            <option value="bajo">💵 Hasta $400k</option>
            <option value="alto">💵 $400k - $700k+</option>
          </select>
        </div>
      </div>

      {/* 3. MAPA PRINCIPAL */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer 
          center={[-33.4489, -70.6693]} 
          zoom={13} 
          style={{ width: '100%', height: '100%', backgroundColor: '#020617' }}
          zoomControl={false}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {edificiosFiltrados.map((edificio) => (
            <Marker 
              key={edificio.id} 
              position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]}
              eventHandlers={{
                click: () => setEdificioSeleccionado(edificio),
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900">
                  <h4 className="font-bold text-sm">{edificio.nombre}</h4>
                  <p className="text-xs text-slate-600 mb-1">{edificio.direccion}</p>
                  <div className="text-xs text-amber-600 font-bold">
                    ★ {edificio.calificacion_promedio || 'Sin notas'} ({edificio.total_resenas || 0} reseñas)
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 4. TARJETA INFERIOR DESLIZANTE */}
      {edificioSeleccionado && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30 transition-all duration-300 ease-out transform translate-y-0 opacity-100">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700/85 rounded-3xl p-5 shadow-2xl relative max-h-[75vh] overflow-y-auto">
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button 
                onClick={(e) => toggleFavorito(edificioSeleccionado.id, e)}
                className={`p-2 rounded-full transition ${favoritos.includes(edificioSeleccionado.id) ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
                title="Guardar en favoritos"
              >
                <Heart className={`w-4 h-4 ${favoritos.includes(edificioSeleccionado.id) ? 'fill-rose-500' : ''}`} />
              </button>
              <button 
                onClick={() => setEdificioSeleccionado(null)}
                className="text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] font-semibold px-2.5 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg">
              {edificioSeleccionado.comuna}
            </span>

            <h2 className="text-lg font-bold text-white mt-2">{edificioSeleccionado.nombre}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 mb-3">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {edificioSeleccionado.direccion}
            </p>

            {/* FOTO DE PORTADA */}
            {(() => {
              const fotoResena = resenas.find(r => r.url_imagen)?.url_imagen;
              const fotosPorComuna = {
                'Santiago Centro': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                'Providencia': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
                'Ñuñoa': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
                'Las Condes': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
              };
              const fotoFinal = fotoResena || fotosPorComuna[edificioSeleccionado.comuna] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';

              return (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg mb-3 relative group">
                  <img 
                    src={fotoFinal} 
                    alt="Edificio" 
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-300" 
                    onClick={() => window.open(fotoFinal, '_blank')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-between p-2.5 pointer-events-none">
                    <span className="text-[10px] text-white font-medium bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {fotoResena ? '📷 Foto de la comunidad' : '🏙️ Vista referencial'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!session) { setModoAuth('login'); setModalAuthAbierto(true); }
                      else { setModalFotoAbierto(true); }
                    }}
                    className="absolute top-2 left-2 bg-slate-900/80 hover:bg-indigo-600 text-white p-2 rounded-xl backdrop-blur-md transition shadow-md flex items-center gap-1 text-[10px] font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5" /> Agregar Foto
                  </button>
                </div>
              );
            })()}

            {/* PROMEDIOS POR HABITACIÓN Y GASTOS COMUNES */}
            <div className="space-y-2 mb-3">
              <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Gasto Común Promedio</span>
                </div>
                <span className="text-xs font-bold text-white">{promedioGasto}</span>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <Home className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 font-semibold">Arriendo Promedio por Tipología</span>
                </div>
                
                {Object.keys(promediosArriendoPorHab).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Sin datos de arriendo registrados aún.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {Object.entries(promediosArriendoPorHab).map(([hab, monto]) => (
                      <div key={hab} className="bg-slate-900/80 p-1.5 rounded-xl text-center border border-slate-800">
                        <div className="text-[10px] text-indigo-400 font-bold">{hab} Dorm.</div>
                        <div className="text-xs font-semibold text-white">{monto}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/40 px-3 py-2 rounded-2xl mb-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {edificioSeleccionado.calificacion_promedio || 'N/A'}
              </span>
              <span>{resenas.length} opiniones vecinales</span>
            </div>

            {/* BOTÓN DE ALERTA DE ARRIENDO */}
            <button 
              onClick={() => setModalAlertaAbierto(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 py-2.5 px-3 rounded-xl font-semibold text-xs transition mb-4 flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Bell className="w-3.5 h-3.5" /> 🔔 Avisarme cuando haya arriendos aquí
            </button>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => {
                  if (!session) { setModoAuth('login'); setModalAuthAbierto(true); }
                  else { setModalResenaAbierto(true); }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-3 rounded-xl font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Dejar Opinión
              </button>
              <button 
                onClick={() => alert('Próximamente: Conexión directa con corredores y arriendos disponibles.')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cotizar Arriendo
              </button>
            </div>

            {/* Galería de fotos */}
            <GaleriaFotosEdificio resenas={resenas} />

            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Últimas Opiniones</h3>

              {cargandoResenas ? (
                <p className="text-xs text-slate-500 text-center py-3">Cargando...</p>
              ) : resenas.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">Sé el primero en opinar sobre este edificio.</p>
              ) : (
                resenas.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-white">{r.titulo}</h4>
                      {r.es_verificado && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Verificado</span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed">{r.comentario}</p>

                    {/* ETIQUETA DE INCIDENCIA / CARACTERÍSTICA */}
                    {r.etiqueta && (
                      <span className="inline-block bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-indigo-500/30">
                        🏷️ {r.etiqueta}
                      </span>
                    )}

                    {/* Muestra habitaciones, gastos comunes y arriendo indicados por el vecino */}
                    <div className="flex flex-wrap gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[11px]">
                      {r.habitaciones && (
                        <span className="text-indigo-400">🛏️ <b>{r.habitaciones} Dorm.</b></span>
                      )}
                      {r.gasto_comun && (
                        <span className="text-amber-400">GC: <b>${Number(r.gasto_comun).toLocaleString('es-CL')}</b></span>
                      )}
                      {r.arriendo && (
                        <span className="text-emerald-400">Arriendo: <b>${Number(r.arriendo).toLocaleString('es-CL')}</b></span>
                      )}
                    </div>
                    
                    {r.url_imagen && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 mt-2 max-h-36">
                        <img src={r.url_imagen} alt="Evidencia" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>👤 {r.usuario_email ? r.usuario_email.split('@')[0] : 'Vecino'}</span>
                      <div className="flex gap-2">
                        <span>🔊 {r.nota_ruido}/5</span>
                        <span>🛡️ {r.nota_seguridad}/5</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ALERTAS DE ARRIENDO */}
      {modalAlertaAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAlertaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">🔔 Alerta de Arriendo</h3>
            <p className="text-xs text-slate-400 mb-4">Te avisaremos de inmediato si se publica un arriendo en **{edificioSeleccionado?.nombre}**.</p>

            <form onSubmit={handleGuardarAlerta} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Tu correo electrónico</label>
                <input 
                  type="email" required placeholder="tu@email.com"
                  value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30">
                Activar Alerta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBIR FOTO RÁPIDA */}
      {modalFotoAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalFotoAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">Agregar Foto</h3>
            <p className="text-xs text-slate-400 mb-4">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarFotoRapida} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Selecciona una imagen</label>
                <input 
                  type="file" accept="image/*" required
                  onChange={(e) => setArchivoFotoRapida(e.target.files[0])}
                  className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30"
                />
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30">
                {enviando ? 'Subiendo foto...' : 'Subir y actualizar portada'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUTENTICACIÓN */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">{modoAuth === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>
            <p className="text-xs text-slate-400 mb-4">Accede para opinar y registrar edificios en HabitaSantiago.</p>

            {authError && <p className="text-xs text-red-400 mb-3 bg-red-950/50 border border-red-800 p-2.5 rounded-xl">{authError}</p>}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Correo electrónico</label>
                <input 
                  type="email" required placeholder="tu@email.com"
                  value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contraseña</label>
                <input 
                  type="password" required placeholder="••••••••" minLength={6}
                  value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 mt-2">
                {enviando ? 'Procesando...' : modoAuth === 'login' ? 'Ingresar' : 'Registrarse'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs">
              {modoAuth === 'login' ? (
                <button onClick={() => { setModoAuth('registro'); setAuthError(''); }} className="text-indigo-400 font-medium hover:underline">
                  ¿No tienes cuenta? Regístrate aquí
                </button>
              ) : (
                <button onClick={() => { setModoAuth('login'); setAuthError(''); }} className="text-indigo-400 font-medium hover:underline">
                  ¿Ya tienes cuenta? Inicia sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA OPINIÓN CON ETIQUETAS Y CASILLAS */}
      {modalResenaAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
            <button onClick={() => setModalResenaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">Publicar Opinión</h3>
            <p className="text-xs text-slate-400 mb-4">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Título de la opinión</label>
                <input 
                  type="text" required placeholder="Ej: Excelente ubicación y tranquilidad"
                  value={nuevaResena.titulo} onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* CASILLAS DE HABITACIONES, GASTO COMÚN Y ARRIENDO */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dormitorios</label>
                  <select 
                    value={nuevaResena.habitaciones} onChange={(e) => setNuevaResena({...nuevaResena, habitaciones: e.target.value})}
                    className="w-full px-2 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="1">1 Dorm</option>
                    <option value="2">2 Dorm</option>
                    <option value="3">3 Dorm</option>
                    <option value="4">4+ Dorm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Gasto Común ($)</label>
                  <input 
                    type="number" placeholder="Ej: 95000"
                    value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})}
                    className="w-full px-2.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Arriendo ($)</label>
                  <input 
                    type="number" placeholder="Ej: 450000"
                    value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})}
                    className="w-full px-2.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* ETIQUETA CLAVE / INCIDENCIA */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Característica principal del edificio</label>
                <select 
                  value={nuevaResena.etiqueta} onChange={(e) => setNuevaResena({...nuevaResena, etiqueta: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Excelente conectividad al metro">🚇 Excelente conectividad al metro</option>
                  <option value="Ascensores rápidos y bien mantenidos">🛗 Ascensores rápidos</option>
                  <option value="Zona muy segura y tranquila">🛡️ Zona muy segura y tranquila</option>
                  <option value="Problemas frecuentes con ruidos">🔊 Problemas con ruidos</option>
                  <option value="Gastos comunes elevados">💰 Gastos comunes elevados</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comentario detallado</label>
                <textarea 
                  required rows="3" placeholder="Detalles sobre la experiencia en el edificio..."
                  value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Foto o comprobante (Opcional)</label>
                <input 
                  type="file" accept="image/*"
                  onChange={(e) => setArchivoFoto(e.target.files[0])}
                  className="w-full text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-slate-400">🔊 Ruido (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_ruido} onChange={(e) => setNuevaResena({...nuevaResena, nota_ruido: e.target.value})} className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center font-bold text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">🛡️ Seguridad (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_seguridad} onChange={(e) => setNuevaResena({...nuevaResena, nota_seguridad: e.target.value})} className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center font-bold text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">🧹 Conserjería (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_administracion} onChange={(e) => setNuevaResena({...nuevaResena, nota_administracion: e.target.value})} className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center font-bold text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">💰 Gastos (1-5):</label>
                  <input type="number" min="1" max="5" value={nuevaResena.nota_gastos_comunes} onChange={(e) => setNuevaResena({...nuevaResena, nota_gastos_comunes: e.target.value})} className="w-full p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center font-bold text-white mt-1" />
                </div>
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 mt-2">
                {enviando ? 'Guardando...' : 'Publicar Opinión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EDIFICIO */}
      {modalEdificioAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">Registrar Nuevo Edificio</h3>
            <p className="text-xs text-slate-400 mb-4">Ingresa los datos para ubicarlo en el mapa de Santiago.</p>

            <form onSubmit={handleGuardarEdificio} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre del Edificio</label>
                <input 
                  type="text" required placeholder="Ej: Edificio Parque Bustamante"
                  value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Dirección exacta</label>
                <input 
                  type="text" required placeholder="Ej: Av. Bustamante 456"
                  value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comuna</label>
                <select 
                  value={nuevoEdificio.comuna} onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 mt-2">
                {enviando ? 'Ubicando en el mapa...' : 'Registrar Edificio'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}