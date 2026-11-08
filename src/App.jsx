import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, PlusCircle, Camera, Heart, Home, Bell, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, Menu, User, Trash2, Bookmark, Settings, KeyRound
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
    <div className="space-y-2 pt-2 border-t border-slate-800">
      <h3 className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>📸</span> Fotos de la comunidad ({fotosConResena.length})
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {fotosConResena.map((r, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-slate-700/60 shadow-md group cursor-pointer"
            onClick={() => window.open(r.url_imagen, '_blank')}
          >
            <img 
              src={r.url_imagen} 
              alt="Foto vecinal" 
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const VistaMapaEdificio = ({ direccion, nombre }) => {
  const textoBusqueda = encodeURIComponent(`${nombre}, ${direccion}, Santiago, Chile`);

  return (
    <div className="w-full h-28 rounded-2xl overflow-hidden shadow-md bg-slate-900 mt-2 border border-slate-700/60 flex flex-col items-center justify-center p-3 text-center">
      <div className="mb-1">
        <span className="text-base">🗺️</span>
        <span className="text-[11px] font-bold text-white ml-1.5">Ubicación exacta</span>
      </div>
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${textoBusqueda}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition shadow-md flex items-center gap-1"
      >
        📍 Abrir en Google Maps
      </a>
    </div>
  );
};

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
  const [favoritos, setFavoritos] = useState([]);
  const [likesUsuario, setLikesUsuario] = useState([]);

  // Sidebar y Perfil
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [vistaSidebar, setVistaSidebar] = useState('perfil'); // 'perfil', 'favoritos', 'password'
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [nuevaPasswordSidebar, setNuevaPasswordSidebar] = useState('');

  // Modales
  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState(false);
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [modalEdificioAbierto, setModalEdificioAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login'); // 'login', 'registro', 'recuperar'
  const [enviando, setEnviando] = useState(false);

  // Interruptor para datos opcionales de arriendo/gastos comunes
  const [incluirDatosEconomicos, setIncluirDatosEconomicos] = useState(false);

  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);

  const mostrarAviso = (texto, tipo = 'success') => {
    setMensajeNotificacion({ texto, tipo });
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 4000);
  };

  const [listaAlertas, setListaAlertas] = useState([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [registroExitosoMsg, setRegistroExitosoMsg] = useState(false);
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false);

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

  const [correoAlerta, setCorreoAlerta] = useState('');
  const [archivoFotoRapida, setArchivoFotoRapida] = useState(null);

  const [nuevoEdificio, setNuevoEdificio] = useState({
    nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setNombreUsuario(session.user.user_metadata?.nombre || session.user.email.split('@')[0]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setNombreUsuario(session.user.user_metadata?.nombre || session.user.email.split('@')[0]);
      }
    });

    const favsGuardados = JSON.parse(localStorage.getItem('habitasantiago_favs') || '[]');
    setFavoritos(favsGuardados);

    const likesGuardados = JSON.parse(localStorage.getItem('habitasantiago_likes') || '[]');
    setLikesUsuario(likesGuardados);

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

  const handleDarUtil = async (resenaId, actualCount) => {
    const yaVotado = likesUsuario.includes(resenaId);
    const nuevoCount = yaVotado ? Math.max(0, (Number(actualCount) || 1) - 1) : (Number(actualCount) || 0) + 1;

    const { error } = await supabase
      .from('resenas')
      .update({ util_count: nuevoCount })
      .eq('id', resenaId);

    if (!error) {
      setResenas(resenas.map(r => r.id === resenaId ? { ...r, util_count: nuevoCount } : r));
      let nuevosLikes;
      if (yaVotado) {
        nuevosLikes = likesUsuario.filter(id => id !== resenaId);
        mostrarAviso('Has quitado tu voto de utilidad.');
      } else {
        nuevosLikes = [...likesUsuario, resenaId];
        mostrarAviso('¡Gracias! Reseña marcada como útil.');
      }
      setLikesUsuario(nuevosLikes);
      localStorage.setItem('habitasantiago_likes', JSON.stringify(nuevosLikes));
    } else {
      mostrarAviso('Error al actualizar voto.', 'error');
    }
  };

  const handleEliminarResena = async (resenaId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta opinión?')) return;

    const { error } = await supabase
      .from('resenas')
      .delete()
      .eq('id', resenaId);

    if (!error) {
      setResenas(resenas.filter(r => r.id !== resenaId));
      cargarEdificios();
      mostrarAviso('Reseña eliminada con éxito.');
    } else {
      mostrarAviso('Error al eliminar la reseña.', 'error');
    }
  };

  const cargarAlertasAdmin = async () => {
    const { data, error } = await supabase
      .from('alertas_arriendo')
      .select('*, edificios(nombre, comuna)')
      .order('creado_en', { ascending: false });

    if (!error) {
      setListaAlertas(data || []);
      setModalAdminAbierto(true);
    } else {
      mostrarAviso('Error al cargar el panel de leads.', 'error');
    }
  };

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
      const { error } = await supabase.auth.signUp({ 
        email: authEmail, 
        password: authPassword,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) setAuthError(error.message);
      else setRegistroExitosoMsg(true);
    } else if (modoAuth === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError('Correo o contraseña incorrectos.');
      else {
        setModalAuthAbierto(false);
        mostrarAviso('¡Bienvenido de vuelta a HabitaSantiago!');
      }
    } else if (modoAuth === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: window.location.origin,
      });
      if (error) setAuthError(error.message);
      else setRecuperacionEnviada(true);
    }
    setEnviando(false);
  };

  const handleCambiarPasswordSidebar = async (e) => {
    e.preventDefault();
    if (!nuevaPasswordSidebar) return;
    setEnviando(true);

    const { error } = await supabase.auth.updateUser({ password: nuevaPasswordSidebar });
    if (!error) {
      mostrarAviso('¡Contraseña actualizada con éxito!');
      setNuevaPasswordSidebar('');
    } else {
      mostrarAviso('Error al actualizar la contraseña.', 'error');
    }
    setEnviando(false);
  };

  const handleCerrarSesion = async () => { 
    await supabase.auth.signOut(); 
    setSidebarAbierto(false);
    mostrarAviso('Has cerrado sesión correctamente.');
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
      const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(filePath, archivoFoto);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('fotos-edificios').getPublicUrl(filePath);
        fotoUrl = publicUrlData.publicUrl;
      }
    }

    const objetoResena = {
      edificio_id: edificioSeleccionado.id,
      titulo: nuevaResena.titulo,
      comentario: nuevaResena.comentario,
      nota_ruido: parseInt(nuevaResena.nota_ruido) || 3,
      nota_administracion: parseInt(nuevaResena.nota_administracion) || 3,
      nota_gastos_comunes: parseInt(nuevaResena.nota_gastos_comunes) || 3,
      nota_seguridad: parseInt(nuevaResena.nota_seguridad) || 3,
      etiqueta: nuevaResena.etiqueta,
      url_imagen: fotoUrl,
      usuario_email: session.user.email,
      util_count: 0
    };

    // Si el usuario activó el interruptor, guardamos los datos opcionales. Si no, van en null para que no aparezca "1 habitación" por defecto.
    if (incluirDatosEconomicos) {
      objetoResena.habitaciones = nuevaResena.habitaciones ? parseInt(nuevaResena.habitaciones) : 1;
      objetoResena.gasto_comun = nuevaResena.gasto_comun ? parseFloat(nuevaResena.gasto_comun) : null;
      objetoResena.arriendo = nuevaResena.arriendo ? parseFloat(nuevaResena.arriendo) : null;
    } else {
      objetoResena.habitaciones = null;
      objetoResena.gasto_comun = null;
      objetoResena.arriendo = null;
    }

    const { error } = await supabase.from('resenas').insert([objetoResena]);

    if (!error) {
      setModalResenaAbierto(false);
      setArchivoFoto(null);
      setIncluirDatosEconomicos(false);
      setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro' });
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []);
      cargarEdificios();
      mostrarAviso('¡Tu opinión ha sido publicada con éxito!');
    } else { 
      console.error(error);
      mostrarAviso('Error al guardar la reseña.', 'error'); 
    }
    setEnviando(false);
  };

  const handleGuardarAlerta = async (e) => {
    e.preventDefault();
    if (!correoAlerta || !edificioSeleccionado) return;
    setEnviando(true);

    const { error } = await supabase.from('alertas_arriendo').insert([{
      edificio_id: edificioSeleccionado.id,
      correo: correoAlerta
    }]);

    if (!error) {
      mostrarAviso(`¡Suscrito con éxito! Te avisaremos a ${correoAlerta}.`);
      setCorreoAlerta('');
      setModalAlertaAbierto(false);
    } else {
      mostrarAviso('Hubo un error al registrar la alerta.', 'error');
    }
    setEnviando(false);
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
      mostrarAviso('¡Foto de portada actualizada con éxito!');
    } else { 
      mostrarAviso('Error al subir la foto.', 'error'); 
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
      mostrarAviso('¡Edificio registrado exitosamente en el mapa!');
    } else { 
      mostrarAviso('Error al crear el edificio.', 'error'); 
    }
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

  const { promedioGasto, promediosArriendoPorHab } = calcularPromediosEdificio();
  const esAdmin = session?.user?.email === 'eladiocatt@gmail.com';

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans relative text-white">
      
      {mensajeNotificacion && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[99999] bg-slate-900 border border-slate-700 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-bounce">
          {mensajeNotificacion.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-white">{mensajeNotificacion.texto}</span>
        </div>
      )}

      {/* BARRA SUPERIOR */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {session && (
            <button 
              onClick={() => setSidebarAbierto(true)}
              className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 p-2.5 rounded-2xl shadow-2xl text-slate-300 hover:text-white transition"
              title="Menú de Usuario"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <h1 className="text-sm font-bold tracking-wide">HabitaSantiago</h1>
          </div>
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
          {esAdmin && (
            <button 
              onClick={cargarAlertasAdmin}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-lg shadow-amber-600/30"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Admin Leads
            </button>
          )}

          <button 
            onClick={() => {
              if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); }
              else { setModalEdificioAbierto(true); }
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nuevo Edificio
          </button>

          {session ? (
            <button 
              onClick={() => setSidebarAbierto(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition font-medium"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" /> Mi Cuenta
            </button>
          ) : (
            <button 
              onClick={() => { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}
        </div>
      </header>

      {/* MENÚ LATERAL (SIDEBAR) */}
      {sidebarAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex justify-start animate-fadeIn">
          <div className="bg-slate-900 border-r border-slate-800 w-80 h-full p-6 shadow-2xl flex flex-col justify-between relative text-white">
            <button 
              onClick={() => setSidebarAbierto(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 bg-slate-800/80 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-3 mb-6 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-lg">
                  {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white truncate w-44">{nombreUsuario || 'Vecino'}</h3>
                  <p className="text-[11px] text-slate-400 truncate w-44">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <button 
                  onClick={() => setVistaSidebar('perfil')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${vistaSidebar === 'perfil' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Settings className="w-4 h-4" /> Mi Perfil
                </button>
                <button 
                  onClick={() => setVistaSidebar('password')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${vistaSidebar === 'password' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <KeyRound className="w-4 h-4" /> Cambiar Contraseña
                </button>
                <button 
                  onClick={() => setVistaSidebar('favoritos')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${vistaSidebar === 'favoritos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <Bookmark className="w-4 h-4" /> Edificios Favoritos ({favoritos.length})
                </button>
              </div>

              <div className="max-h-[42vh] overflow-y-auto pr-1 space-y-3">
                {vistaSidebar === 'perfil' && (
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-indigo-400">Editar Perfil</h4>
                    <div>
                      <label className="block text-slate-400 mb-1">Nombre de usuario</label>
                      <input 
                        type="text" 
                        value={nombreUsuario} 
                        onChange={(e) => setNombreUsuario(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => mostrarAviso('¡Perfil actualizado con éxito!')}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-semibold transition shadow"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                )}

                {vistaSidebar === 'password' && (
                  <form onSubmit={handleCambiarPasswordSidebar} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-indigo-400">Seguridad de la cuenta</h4>
                    <div>
                      <label className="block text-slate-400 mb-1">Nueva contraseña</label>
                      <input 
                        type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
                        value={nuevaPasswordSidebar} 
                        onChange={(e) => setNuevaPasswordSidebar(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none"
                      />
                    </div>
                    <button 
                      type="submit" disabled={enviando}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl font-semibold transition shadow"
                    >
                      {enviando ? 'Actualizando...' : 'Actualizar contraseña'}
                    </button>
                  </form>
                )}

                {vistaSidebar === 'favoritos' && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Tus edificios guardados</h4>
                    {favoritos.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No tienes edificios en favoritos aún. Haz clic en el corazón de cualquier edificio para guardarlo.</p>
                    ) : (
                      edificios.filter(e => favoritos.includes(e.id)).map(ed => (
                        <div 
                          key={ed.id} 
                          onClick={() => { setEdificioSeleccionado(ed); setSidebarAbierto(false); }}
                          className="bg-slate-950/60 hover:bg-slate-800/80 p-2.5 rounded-xl border border-slate-800 cursor-pointer transition text-xs"
                        >
                          <div className="font-bold text-white truncate">{ed.nombre}</div>
                          <div className="text-[10px] text-indigo-400">{ed.comuna}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button 
                onClick={handleCerrarSesion}
                className="w-full bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS RÁPIDOS */}
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
        </div>
      </div>

      {/* MAPA PRINCIPAL */}
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

      {/* TARJETA INFERIOR */}
      {edificioSeleccionado && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30 transition-all duration-300 ease-out transform translate-y-0 opacity-100">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-700/85 rounded-3xl p-4 shadow-2xl relative max-h-[78vh] overflow-y-auto">
            
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button 
                onClick={(e) => toggleFavorito(edificioSeleccionado.id, e)}
                className={`p-2 rounded-full transition ${favoritos.includes(edificioSeleccionado.id) ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800/80 text-slate-400 hover:text-white'}`}
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

            <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              {edificioSeleccionado.comuna}
            </span>

            <h2 className="text-base font-bold text-white mt-1.5">{edificioSeleccionado.nombre}</h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {edificioSeleccionado.direccion}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button 
                onClick={() => {
                  if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); }
                  else { setModalResenaAbierto(true); }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-2.5 rounded-xl font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Dejar Opinión
              </button>
              <button 
                onClick={() => mostrarAviso('Próximamente: Conexión directa con corredores y arriendos disponibles.')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-2.5 rounded-xl font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cotizar Arriendo
              </button>
            </div>

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
                <div className="w-full h-32 rounded-2xl overflow-hidden border border-slate-700/60 shadow-md mb-2.5 relative group">
                  <img 
                    src={fotoFinal} 
                    alt="Edificio" 
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-300" 
                    onClick={() => window.open(fotoFinal, '_blank')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-between p-2 pointer-events-none">
                    <span className="text-[10px] text-white font-medium bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {fotoResena ? '📷 Foto comunitaria' : '🏙️ Vista referencial'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); }
                      else { setModalFotoAbierto(true); }
                    }}
                    className="absolute top-2 left-2 bg-slate-900/80 hover:bg-indigo-600 text-white p-1.5 rounded-xl backdrop-blur-md transition shadow-md flex items-center gap-1 text-[10px] font-semibold"
                  >
                    <Camera className="w-3 h-3" /> Foto
                  </button>
                </div>
              );
            })()}

            <VistaMapaEdificio 
              direccion={edificioSeleccionado.direccion} 
              nombre={edificioSeleccionado.nombre} 
            />

            {/* PROMEDIOS Y GASTOS */}
            <div className="space-y-2 my-2.5">
              <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Gasto Común Promedio</span>
                </div>
                <span className="text-xs font-bold text-white">{promedioGasto}</span>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 p-2 rounded-2xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Home className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 font-semibold">Arriendo Promedio por Tipología</span>
                </div>
                
                {Object.keys(promediosArriendoPorHab).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Sin datos de arriendo registrados aún.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {Object.entries(promediosArriendoPorHab).map(([hab, monto]) => (
                      <div key={hab} className="bg-slate-900/80 p-1 rounded-xl text-center border border-slate-800">
                        <div className="text-[10px] text-indigo-400 font-bold">{hab} Dorm.</div>
                        <div className="text-[11px] font-semibold text-white">{monto}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/30 border border-slate-700/40 px-3 py-1.5 rounded-2xl mb-2.5 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {edificioSeleccionado.calificacion_promedio || 'N/A'}
              </span>
              <span>{resenas.length} opiniones vecinales</span>
            </div>

            <button 
              onClick={() => setModalAlertaAbierto(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-indigo-500/30 py-2 px-3 rounded-xl font-semibold text-xs transition mb-3 flex items-center justify-center gap-1.5 shadow"
            >
              <Bell className="w-3.5 h-3.5" /> 🔔 Avisarme cuando haya arriendos aquí
            </button>

            <GaleriaFotosEdificio resenas={resenas} />

            {/* SECCIÓN DE OPINIONES */}
            <div className="space-y-2.5 pt-2.5 border-t border-slate-800">
              <h3 className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">Últimas Opiniones</h3>

              {cargandoResenas ? (
                <p className="text-xs text-slate-500 text-center py-3">Cargando...</p>
              ) : resenas.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">Sé el primero en opinar sobre este edificio.</p>
              ) : (
                resenas.map((r) => {
                  const yaVotado = likesUsuario.includes(r.id);
                  const esMia = session?.user?.email === r.usuario_email;

                  return (
                    <div key={r.id} className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-white">{r.titulo}</h4>
                        <div className="flex items-center gap-1">
                          {esMia && (
                            <button 
                              onClick={() => handleEliminarResena(r.id)}
                              className="p-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg transition"
                              title="Eliminar mi opinión"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDarUtil(r.id, r.util_count)}
                            className={`flex items-center gap-1 border px-2 py-0.5 rounded-xl transition text-[10px] font-semibold ${yaVotado ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border-slate-800'}`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${yaVotado ? 'text-white fill-white' : 'text-indigo-400'}`} /> 
                            <span>{r.util_count || 0}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.comentario}</p>

                      {r.etiqueta && (
                        <span className="inline-block bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-indigo-500/30">
                          🏷️ {r.etiqueta}
                        </span>
                      )}

                      {/* SE MUESTRA SOLO SI EL USUARIO ACTIVÓ Y LLENÓ LOS DATOS ECONÓMICOS */}
                      {(r.habitaciones || r.gasto_comun || r.arriendo) && (
                        <div className="flex flex-wrap gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-[11px]">
                          {r.habitaciones && <span className="text-indigo-400">🛏️ <b>{r.habitaciones} Dorm.</b></span>}
                          {r.gasto_comun && <span className="text-amber-400">GC: <b>${Number(r.gasto_comun).toLocaleString('es-CL')}</b></span>}
                          {r.arriendo && <span className="text-emerald-400">Arriendo: <b>${Number(r.arriendo).toLocaleString('es-CL')}</b></span>}
                        </div>
                      )}
                      
                      {r.url_imagen && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 mt-1 max-h-32">
                          <img src={r.url_imagen} alt="Evidencia" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                        <span>👤 {r.usuario_email ? r.usuario_email.split('@')[0] : 'Vecino'}</span>
                        <div className="flex gap-2">
                          <span>🔊 {r.nota_ruido}/5</span>
                          <span>🛡️ {r.nota_seguridad}/5</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL ADMIN LEADS */}
      {modalAdminAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-white max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalAdminAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <ShieldAlert className="text-amber-400" /> Panel de Leads / Alertas de Arriendo
            </h3>
            {listaAlertas.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No hay alertas registradas todavía.</p>
            ) : (
              <div className="space-y-2.5 mt-4">
                {listaAlertas.map((alerta) => (
                  <div key={alerta.id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-400">{alerta.edificios?.nombre || 'Edificio'}</div>
                      <div className="text-[10px] text-slate-400">{alerta.edificios?.comuna || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{alerta.correo}</div>
                      <div className="text-[10px] text-slate-500">{new Date(alerta.creado_en).toLocaleDateString('es-CL')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ALERTA ARRIENDO */}
      {modalAlertaAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAlertaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">🔔 Alerta de Arriendo</h3>
            <p className="text-xs text-slate-400 mb-4">Te avisaremos de inmediato si se publica un arriendo en <b>{edificioSeleccionado?.nombre}</b>.</p>
            <form onSubmit={handleGuardarAlerta} className="space-y-4 text-xs">
              <input 
                type="email" required placeholder="tu@email.com"
                value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
              />
              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg">
                {enviando ? 'Guardando...' : 'Activar Alerta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR FOTO */}
      {modalFotoAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalFotoAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-1">Agregar Foto</h3>
            <form onSubmit={handleGuardarFotoRapida} className="space-y-4 text-xs mt-3">
              <input 
                type="file" accept="image/*" required
                onChange={(e) => setArchivoFotoRapida(e.target.files[0])}
                className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400"
              />
              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg">
                {enviando ? 'Subiendo...' : 'Actualizar portada'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AUTH (CON OPCIÓN DE OLVIDÉ MI CONTRASEÑA) */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            {modoAuth !== 'recuperar' && (
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
                <button type="button" onClick={() => { setModoAuth('login'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${modoAuth === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Iniciar Sesión</button>
                <button type="button" onClick={() => { setModoAuth('registro'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${modoAuth === 'registro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Registrarse</button>
              </div>
            )}

            {recuperacionEnviada ? (
              <div className="bg-emerald-950/50 border border-emerald-800/80 p-4 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">¡Correo enviado!</h4>
                <p className="text-xs text-slate-300">Revisa tu bandeja para restablecer tu contraseña.</p>
                <button onClick={() => { setModoAuth('login'); setRecuperacionEnviada(false); }} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs">Volver a Iniciar Sesión</button>
              </div>
            ) : modoAuth === 'recuperar' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                <h3 className="text-base font-bold mb-1">Recuperar Contraseña</h3>
                <p className="text-slate-400 mb-3">Te enviaremos un enlace a tu correo para que crees una nueva clave.</p>
                {authError && <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded-xl">{authError}</p>}
                <div>
                  <label className="block text-slate-300 mb-1">Tu Correo Electrónico</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white" />
                </div>
                <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl transition shadow-lg">{enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}</button>
                <button type="button" onClick={() => { setModoAuth('login'); setAuthError(''); }} className="w-full text-slate-400 hover:text-white pt-2 text-center block">← Volver al inicio de sesión</button>
              </form>
            ) : registroExitosoMsg ? (
              <div className="bg-emerald-950/50 border border-emerald-800/80 p-4 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">¡Registro completado!</h4>
                <p className="text-xs text-slate-300">Revisa tu correo para activar la cuenta.</p>
                <button onClick={() => { setModoAuth('login'); setRegistroExitosoMsg(false); }} className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs">Ir a Iniciar Sesión</button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                {authError && <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded-xl">{authError}</p>}
                <div>
                  <label className="block text-slate-300 mb-1">Correo</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Contraseña</label>
                  <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white" />
                </div>

                {modoAuth === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setModoAuth('recuperar'); setAuthError(''); }} className="text-[11px] text-indigo-400 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl transition mt-2 shadow-lg">{enviando ? 'Procesando...' : modoAuth === 'login' ? 'Entrar' : 'Registrarse'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL NUEVA OPINIÓN */}
      {modalResenaAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
            <button onClick={() => setModalResenaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-1">Publicar Opinión</h3>
            <p className="text-xs text-slate-400 mb-3">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-3.5 text-xs">
              <input type="text" required placeholder="Título (Ej: Excelente ubicación)" value={nuevaResena.titulo} onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none" />
              
              <select value={nuevaResena.etiqueta} onChange={(e) => setNuevaResena({...nuevaResena, etiqueta: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="Excelente conectividad al metro">🚇 Excelente conectividad al metro</option>
                <option value="Ascensores rápidos y bien mantenidos">🛗 Ascensores rápidos</option>
                <option value="Zona muy segura y tranquila">🛡️ Zona muy segura y tranquila</option>
                <option value="Problemas frecuentes con ruidos">🔊 Problemas con ruidos</option>
                <option value="Gastos comunes elevados">💰 Gastos comunes elevados</option>
              </select>

              <textarea required rows="3" placeholder="Comentario detallado sobre tu experiencia..." value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none" />

              {/* INTERRUPTOR OPCIONAL PARA DATOS ECONÓMICOS */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-semibold text-slate-300">📊 ¿Agregar datos de arriendo o gastos comunes? (Opcional)</span>
                  <input 
                    type="checkbox" 
                    checked={incluirDatosEconomicos} 
                    onChange={(e) => setIncluirDatosEconomicos(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                {incluirDatosEconomicos && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Dormitorios</label>
                      <select value={nuevaResena.habitaciones} onChange={(e) => setNuevaResena({...nuevaResena, habitaciones: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl">
                        <option value="1">1 Dorm</option><option value="2">2 Dorm</option><option value="3">3 Dorm</option><option value="4">4+ Dorm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Gasto Común ($)</label>
                      <input type="number" placeholder="Ej: 90000" value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Arriendo ($)</label>
                      <input type="number" placeholder="Ej: 450000" value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Foto o comprobante (Opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files[0])} className="w-full text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:bg-indigo-600/20 file:text-indigo-400" />
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg mt-2 transition">
                {enviando ? 'Guardando...' : 'Publicar Opinión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO EDIFICIO */}
      {modalEdificioAbierto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-1">Registrar Nuevo Edificio</h3>
            <form onSubmit={handleGuardarEdificio} className="space-y-3.5 text-xs mt-3">
              <input type="text" required placeholder="Nombre (Ej: Edificio Parque)" value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none" />
              <input type="text" required placeholder="Dirección exacta (Ej: Av. Bustamante 456)" value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl outline-none" />
              <select value={nuevoEdificio.comuna} onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                <option value="Santiago Centro">Santiago Centro</option><option value="Providencia">Providencia</option><option value="Ñuñoa">Ñuñoa</option><option value="Las Condes">Las Condes</option>
              </select>
              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg mt-2">{enviando ? 'Registrando...' : 'Registrar Edificio'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}