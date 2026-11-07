import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, PlusCircle
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para forzar la actualización del mapa en móviles
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

// Componente para mostrar las fotos de los edificios al estilo Google Maps
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
              <span className="text-[10px] text-white font-medium truncate">★ {r.titulo}</span>
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
  
  const [filtroComuna, setFiltroComuna] = useState('todas');
  const [filtroRating, setFiltroRating] = useState(false);

  // Modales
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalEdificioAbierto, setModalEdificioAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login'); 
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
      const filePath = `resenas/${fileName}`; const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(filePath, archivoFoto); if (!uploadError) { const { data: publicUrlData } = supabase.storage.from('fotos-edificios').getPublicUrl(filePath); fotoUrl = publicUrlData.publicUrl; } }  const { error } = await supabase.from('resenas').insert([{ edificio_id: edificioSeleccionado.id, titulo: nuevaResena.titulo, comentario: nuevaResena.comentario, nota_ruido: parseInt(nuevaResena.nota_ruido), nota_administracion: parseInt(nuevaResena.nota_administracion), nota_gastos_comunes: parseInt(nuevaResena.nota_gastos_comunes), nota_seguridad: parseInt(nuevaResena.nota_seguridad), url_imagen: fotoUrl, usuario_email: session.user.email, es_verificado: true }]);  if (!error) { setModalResenaAbierto(false); setArchivoFoto(null); setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3 }); const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false }); setResenas(res.data \vert{}\vert{} []); cargarEdificios(); } else { alert('Error al guardar la reseña.'); } setEnviando(false); };  const handleGuardarEdificio = async (e) => { e.preventDefault(); if (!session) return; setEnviando(true);  let lat = parseFloat(nuevoEdificio.latitud); let lon = parseFloat(nuevoEdificio.longitud);  try { const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${nuevoEdificio.direccion}, ${nuevoEdificio.comuna}, Santiago, Chile`)}`);
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

    return matchTexto && matchComuna && matchRating;
  });

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

      {/* 2. FILTROS RÁPIDOS Y POR COMUNAS FLOTANTES */}
      <div className="absolute top-20 left-4 right-4 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-1.5 rounded-full shadow-2xl flex items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
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
          <button 
            onClick={() => setFiltroRating(!filtroRating)}
            className={`px-3 py-1.5 rounded-