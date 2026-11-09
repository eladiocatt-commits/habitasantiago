import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, PlusCircle, Camera, Heart, Home, Bell, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, Menu, User, Trash2, Bookmark, Settings, KeyRound, Sparkles
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
    <div className="space-y-2 pt-3 border-t border-violet-500/20">
      <h3 className="font-bold text-[11px] text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Fotos de la comunidad ({fotosConResena.length})
      </h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
        {fotosConResena.map((r, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-violet-500/40 shadow-xl group cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={() => window.open(r.url_imagen, '_blank')}
          >
            <img src={r.url_imagen} alt="Foto vecinal" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

const VistaMapaEdificio = ({ direccion, nombre }) => {
  const textoBusqueda = encodeURIComponent(`${nombre}, ${direccion}, Santiago, Chile`);
  return (
    <div className="w-full h-28 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-violet-950/80 to-slate-950 mt-3 border border-violet-500/40 flex flex-col items-center justify-center p-3 text-center">
      <div className="mb-1 flex items-center gap-1.5 text-violet-300 font-bold text-xs">
        <span>🗺️</span> Ubicación exacta del edificio
      </div>
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${textoBusqueda}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-violet-600/40 flex items-center gap-1 hover:scale-105"
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

  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [vistaSidebar, setVistaSidebar] = useState('perfil');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [nuevaPasswordSidebar, setNuevaPasswordSidebar] = useState('');

  const [modalResenaAbierto, setModalResenaAbierto] = useState(false);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState(false);
  const [modalAdminAbierto, setModalAdminAbierto] = useState(false);
  const [modalEdificioAbierto, setModalEdificioAbierto] = useState(false);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login');
  const [enviando, setEnviando] = useState(false);
  const [incluirDatosEconomicos, setIncluirDatosEconomicos] = useState(false);
  const [mensajeNotificacion, setMensajeNotificacion] = useState(null);

  const mostrarAviso = (texto, tipo = 'success') => {
    setMensajeNotificacion({ texto, tipo });
    setTimeout(() => setMensajeNotificacion(null), 4000);
  };

  const [listaAlertas, setListaAlertas] = useState([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [registroExitosoMsg, setRegistroExitosoMsg] = useState(false);
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false);

  const [archivoFoto, setArchivoFoto] = useState(null);
  const [nuevaResena, setNuevaResena] = useState({
    titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3,
    gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro'
  });

  const [correoAlerta, setCorreoAlerta] = useState('');
  const [archivoFotoRapida, setArchivoFotoRapida] = useState(null);
  const [nuevoEdificio, setNuevoEdificio] = useState({
    nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) setNombreUsuario(session.user.user_metadata?.nombre || session.user.email.split('@')[0]);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) setNombreUsuario(session.user.user_metadata?.nombre || session.user.email.split('@')[0]);
    });

    setFavoritos(JSON.parse(localStorage.getItem('habitasantiago_favs') || '[]'));
    setLikesUsuario(JSON.parse(localStorage.getItem('habitasantiago_likes') || '[]'));
    return () => subscription.unsubscribe();
  }, []);

  const toggleFavorito = (edificioId, e) => {
    e.stopPropagation();
    let nuevosFavs = favoritos.includes(edificioId) ? favoritos.filter(id => id !== edificioId) : [...favoritos, edificioId];
    setFavoritos(nuevosFavs);
    localStorage.setItem('habitasantiago_favs', JSON.stringify(nuevosFavs));
  };

  const cargarEdificios = async () => {
    try {
      const { data, error } = await supabase.from('vista_edificios_con_promedios').select('*');
      if (!error) setEdificios(data || []);
    } catch (err) { console.error(err); } 
    finally { setCargando(false); }
  };

  useEffect(() => { cargarEdificios(); }, []);

  useEffect(() => {
    if (!edificioSeleccionado) return;
    async function cargarResenas() {
      setCargandoResenas(true);
      const { data, error } = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      if (!error) setResenas(data || []);
      setCargandoResenas(false);
    }
    cargarResenas();
  }, [edificioSeleccionado]);

  const handleDarUtil = async (resenaId, actualCount) => {
    const yaVotado = likesUsuario.includes(resenaId);
    const nuevoCount = yaVotado ? Math.max(0, (Number(actualCount) || 1) - 1) : (Number(actualCount) || 0) + 1;
    const { error } = await supabase.from('resenas').update({ util_count: nuevoCount }).eq('id', resenaId);
    if (!error) {
      setResenas(resenas.map(r => r.id === resenaId ? { ...r, util_count: nuevoCount } : r));
      let nuevosLikes = yaVotado ? likesUsuario.filter(id => id !== resenaId) : [...likesUsuario, resenaId];
      setLikesUsuario(nuevosLikes);
      localStorage.setItem('habitasantiago_likes', JSON.stringify(nuevosLikes));
      mostrarAviso(yaVotado ? 'Voto de utilidad retirado.' : '¡Gracias! Reseña marcada como útil.');
    }
  };

  const handleEliminarResena = async (resenaId) => {
    if (!confirm('¿Estás seguro de eliminar esta opinión?')) return;
    const { error } = await supabase.from('resenas').delete().eq('id', resenaId);
    if (!error) {
      setResenas(resenas.filter(r => r.id !== resenaId));
      cargarEdificios();
      mostrarAviso('Reseña eliminada.');
    }
  };

  const cargarAlertasAdmin = async () => {
    const { data, error } = await supabase.from('alertas_arriendo').select('*, edificios(nombre, comuna)').order('creado_en', { ascending: false });
    if (!error) { setListaAlertas(data || []); setModalAdminAbierto(true); }
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
      promediosArriendoPorHab[hab] = `$${Math.round(lista.reduce((a, b) => a + b, 0) / lista.length).toLocaleString('es-CL')}`;
    });
    return { promedioGasto, promediosArriendoPorHab };
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAuthError('');
    if (modoAuth === 'registro') {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { emailRedirectTo: window.location.origin } });
      if (error) setAuthError(error.message); else setRegistroExitosoMsg(true);
    } else if (modoAuth === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError('Correo o contraseña incorrectos.'); else { setModalAuthAbierto(false); mostrarAviso('¡Bienvenido de vuelta!'); }
    } else if (modoAuth === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin });
      if (error) setAuthError(error.message); else setRecuperacionEnviada(true);
    }
    setEnviando(false);
  };

  const handleCambiarPasswordSidebar = async (e) => {
    e.preventDefault();
    if (!nuevaPasswordSidebar) return;
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: nuevaPasswordSidebar });
    if (!error) { mostrarAviso('¡Contraseña actualizada!'); setNuevaPasswordSidebar(''); } else { mostrarAviso('Error al actualizar.', 'error'); }
    setEnviando(false);
  };

  const handleCerrarSesion = async () => { await supabase.auth.signOut(); setSidebarAbierto(false); mostrarAviso('Sesión cerrada.'); };

  const handleGuardarResena = async (e) => {
    e.preventDefault();
    if (!edificioSeleccionado || !session) return;
    setEnviando(true);
    let fotoUrl = null;
    if (archivoFoto) {
      const fileExt = archivoFoto.name.split('.').pop();
      const filePath = `resenas/${Math.random()}.${fileExt}`;
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
      setModalResenaAbierto(false); setArchivoFoto(null); setIncluirDatosEconomicos(false);
      setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro' });
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []); cargarEdificios(); mostrarAviso('¡Opinión publicada!');
    } else { mostrarAviso('Error al guardar.', 'error'); }
    setEnviando(false);
  };

  const handleGuardarAlerta = async (e) => {
    e.preventDefault();
    if (!correoAlerta || !edificioSeleccionado) return;
    setEnviando(true);
    const { error } = await supabase.from('alertas_arriendo').insert([{ edificio_id: edificioSeleccionado.id, correo: correoAlerta }]);
    if (!error) { mostrarAviso(`¡Alerta activada para ${correoAlerta}!`); setCorreoAlerta(''); setModalAlertaAbierto(false); }
    setEnviando(false);
  };

  const handleGuardarFotoRapida = async (e) => {
    e.preventDefault();
    if (!edificioSeleccionado || !session || !archivoFotoRapida) return;
    setEnviando(true);
    const fileExt = archivoFotoRapida.name.split('.').pop();
    const filePath = `resenas/${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(filePath, archivoFotoRapida);
    let fotoUrl = null;
    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('fotos-edificios').getPublicUrl(filePath);
      fotoUrl = publicUrlData.publicUrl;
    }
    const { error } = await supabase.from('resenas').insert([{
      edificio_id: edificioSeleccionado.id, titulo: 'Foto de fachada', comentario: 'Aporte fotográfico.',
      nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3,
      url_imagen: fotoUrl, usuario_email: session.user.email, es_verificado: true
    }]);
    if (!error) {
      setModalFotoAbierto(false); setArchivoFotoRapida(null);
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      setResenas(res.data || []); cargarEdificios(); mostrarAviso('¡Foto actualizada!');
    }
    setEnviando(false);
  };

  const handleGuardarEdificio = async (e) => {
    e.preventDefault();
    if (!session) return;
    setEnviando(true);
    let lat = parseFloat(nuevoEdificio.latitud); let lon = parseFloat(nuevoEdificio.longitud);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${nuevoEdificio.direccion}, ${nuevoEdificio.comuna}, Santiago, Chile`)}`);
      const datosMapa = await res.json();
      if (datosMapa && datosMapa.length > 0) { lat = parseFloat(datosMapa[0].lat); lon = parseFloat(datosMapa[0].lon); }
    } catch (err) { console.warn(err); }
    const { data, error } = await supabase.from('edificios').insert([{
      nombre: nuevoEdificio.nombre, direccion: nuevoEdificio.direccion, comuna: nuevoEdificio.comuna, latitud: lat, longitud: lon
    }]).select();
    if (!error) {
      setModalEdificioAbierto(false);
      setNuevoEdificio({ nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693' });
      await cargarEdificios();
      if (data && data.length > 0) setEdificioSeleccionado(data[0]);
      mostrarAviso('¡Edificio registrado!');
    }
    setEnviando(false);
  };

  const edificiosFiltrados = edificios.filter(e => {
    const matchTexto = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || e.comuna.toLowerCase().includes(busqueda.toLowerCase()) || e.direccion.toLowerCase().includes(busqueda.toLowerCase());
    const matchComuna = filtroComuna === 'todas' || e.comuna.toLowerCase() === filtroComuna.toLowerCase();
    const matchRating = !filtroRating || (e.calificacion_promedio >= 4.0);
    return matchTexto && matchComuna && matchRating;
  });

  const { promedioGasto, promediosArriendoPorHab } = calcularPromediosEdificio();
  const esAdmin = session?.user?.email === 'eladiocatt@gmail.com';

  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-sans relative text-white selection:bg-violet-500 selection:text-white">
      
      {/* NOTIFICACIONES */}
      {mensajeNotificacion && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[99999] bg-violet-950/90 backdrop-blur-2xl border border-violet-500/50 shadow-2xl shadow-violet-500/30 px-5 py-3 rounded-2xl flex items-center gap-3 animate-bounce">
          {mensajeNotificacion.tipo === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
          <span className="text-xs font-bold text-white tracking-wide">{mensajeNotificacion.texto}</span>
        </div>
      )}

      {/* BARRA SUPERIOR ULTRA ESTILIZADA (CON NUEVO COLOR VIOLETA NEÓN) */}
      <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5">
          {session && (
            <button 
              onClick={() => setSidebarAbierto(true)}
              className="bg-slate-900/90 backdrop-blur-2xl border border-violet-500/40 p-3 rounded-2xl shadow-2xl text-slate-300 hover:text-white hover:border-violet-400 transition-all duration-300 hover:scale-105"
              title="Menú de Usuario"
            >
              <Menu className="w-5 h-5 text-violet-400" />
            </button>
          )}
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-violet-500/40 px-4.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5">
            <div className="p-1.5 bg-violet-600/30 border border-violet-400/50 rounded-xl text-violet-400 shadow-inner">
              <Building className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-indigo-400 bg-clip-text text-transparent">HabitaSantiago ⚡</h1>
          </div>
        </div>

        <div className="pointer-events-auto hidden md:flex items-center bg-slate-900/90 backdrop-blur-2xl border border-violet-500/40 px-3.5 py-2 rounded-2xl shadow-2xl w-80">
          <Search className="w-4 h-4 text-violet-400 mr-2.5" />
          <input 
            type="text" placeholder="Buscar comuna, edificio..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none w-full placeholder-slate-400 font-medium"
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-2xl border border-violet-500/40 p-1.5 rounded-2xl shadow-2xl">
          {esAdmin && (
            <button onClick={cargarAlertasAdmin} className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg hover:scale-105">
              <ShieldAlert className="w-3.5 h-3.5" /> Admin
            </button>
          )}
          <button onClick={() => { if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); } else { setModalEdificioAbierto(true); } }} className="text-xs bg-violet-600 hover:bg-violet-500 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-violet-600/30 hover:scale-105">
            <PlusCircle className="w-3.5 h-3.5" /> Nuevo Edificio
          </button>
          {session ? (
            <button onClick={() => setSidebarAbierto(true)} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all font-bold border border-slate-700 hover:scale-105">
              <User className="w-3.5 h-3.5 text-violet-400" /> Mi Cuenta
            </button>
          ) : (
            <button onClick={() => { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 hover:scale-105">
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}
        </div>
      </header>

      {/* MENÚ LATERAL */}
      {sidebarAbierto && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex justify-start animate-fadeIn">
          <div className="bg-slate-900 border-r border-violet-500/30 w-80 h-full p-6 shadow-2xl flex flex-col justify-between relative text-white">
            <button onClick={() => setSidebarAbierto(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full">
              <X className="w-4.5 h-4.5" />
            </button>
            <div>
              <div className="flex items-center gap-3.5 mb-6 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-400/50 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white truncate w-44">{nombreUsuario || 'Vecino'}</h3>
                  <p className="text-[11px] text-slate-400 truncate w-44">{session?.user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <button onClick={() => setVistaSidebar('perfil')} className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${vistaSidebar === 'perfil' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <Settings className="w-4 h-4" /> Mi Perfil
                </button>
                <button onClick={() => setVistaSidebar('password')} className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${vistaSidebar === 'password' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <KeyRound className="w-4 h-4" /> Cambiar Contraseña
                </button>
                <button onClick={() => setVistaSidebar('favoritos')} className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${vistaSidebar === 'favoritos' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : 'text-slate-300 hover:bg-slate-800'}`}>
                  <Bookmark className="w-4 h-4" /> Favoritos ({favoritos.length})
                </button>
              </div>
              <div className="max-h-[42vh] overflow-y-auto pr-1 space-y-3 no-scrollbar">
                {vistaSidebar === 'perfil' && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-violet-500/30 space-y-3 text-xs">
                    <h4 className="font-bold text-violet-400">Editar Perfil</h4>
                    <div>
                      <label className="block text-slate-400 mb-1">Nombre</label>
                      <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-violet-500" />
                    </div>
                    <button onClick={() => mostrarAviso('¡Perfil actualizado!')} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition">Guardar</button>
                  </div>
                )}
                {vistaSidebar === 'password' && (
                  <form onSubmit={handleCambiarPasswordSidebar} className="bg-slate-950 p-4 rounded-2xl border border-violet-500/30 space-y-3 text-xs">
                    <h4 className="font-bold text-violet-400">Seguridad</h4>
                    <div>
                      <label className="block text-slate-400 mb-1">Nueva contraseña</label>
                      <input type="password" required minLength={6} placeholder="Mínimo 6 caracteres" value={nuevaPasswordSidebar} onChange={(e) => setNuevaPasswordSidebar(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-violet-500" />
                    </div>
                    <button type="submit" disabled={enviando} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition">{enviando ? 'Actualizando...' : 'Actualizar clave'}</button>
                  </form>
                )}
                {vistaSidebar === 'favoritos' && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Tus favoritos</h4>
                    {favoritos.length === 0 ? <p className="text-[11px] text-slate-500 italic p-2 bg-slate-950 rounded-xl">No tienes favoritos aún.</p> : edificios.filter(e => favoritos.includes(e.id)).map(ed => (
                      <div key={ed.id} onClick={() => { setEdificioSeleccionado(ed); setSidebarAbierto(false); }} className="bg-slate-950 hover:bg-slate-800 p-3 rounded-2xl border border-slate-800 cursor-pointer transition text-xs">
                        <div className="font-bold text-white truncate">{ed.nombre}</div>
                        <div className="text-[10px] text-violet-400">{ed.comuna}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <button onClick={handleCerrarSesion} className="w-full bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS RÁPIDOS */}
      <div className="absolute top-20 left-4 right-4 z-20 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-2xl border border-violet-500/40 p-1.5 rounded-full shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar">
          <button onClick={() => setFiltroComuna('todas')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroComuna === 'todas' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>🏢 Todas</button>
          <button onClick={() => setFiltroComuna('Santiago Centro')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroComuna === 'Santiago Centro' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>Santiago Centro</button>
          <button onClick={() => setFiltroComuna('Providencia')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroComuna === 'Providencia' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>Providencia</button>
          <button onClick={() => setFiltroComuna('Ñuñoa')} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filtroComuna === 'Ñuñoa' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>Ñuñoa</button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
          <button onClick={() => setFiltroRating(!filtroRating)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filtroRating ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <Star size={12} className={filtroRating ? 'fill-white' : 'text-yellow-400 fill-yellow-400'} /> ⭐ 4.0+
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer center={[-33.4489, -70.6693]} zoom={13} style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} zoomControl={false}>
          <MapResizer />
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {edificiosFiltrados.map((edificio) => (
            <Marker key={edificio.id} position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]} eventHandlers={{ click: () => setEdificioSeleccionado(edificio) }}>
              <Popup>
                <div className="p-1.5 text-slate-900 font-sans">
                  <h4 className="font-extrabold text-sm">{edificio.nombre}</h4>
                  <p className="text-xs text-slate-600 mb-1">{edificio.direccion}</p>
                  <div className="text-xs text-amber-600 font-bold">★ {edificio.calificacion_promedio || 'Sin notas'} ({edificio.total_resenas || 0} reseñas)</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* TARJETA INFERIOR */}
      {edificioSeleccionado && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-30 transition-all duration-300 ease-out transform translate-y-0 opacity-100">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-violet-500/40 rounded-3xl p-5 shadow-2xl relative max-h-[78vh] overflow-y-auto no-scrollbar">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button onClick={(e) => toggleFavorito(edificioSeleccionado.id, e)} className={`p-2.5 rounded-full transition hover:scale-110 shadow-md ${favoritos.includes(edificioSeleccionado.id) ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                <Heart className={`w-4 h-4 ${favoritos.includes(edificioSeleccionado.id) ? 'fill-rose-500' : ''}`} />
              </button>
              <button onClick={() => setEdificioSeleccionado(null)} className="text-slate-400 hover:text-white bg-slate-800 border border-slate-700 p-2.5 rounded-full transition hover:scale-110 shadow-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-violet-500/20 text-violet-300 rounded-xl border border-violet-500/40">
              {edificioSeleccionado.comuna}
            </span>

            <h2 className="text-lg font-black text-white mt-2 tracking-tight">{edificioSeleccionado.nombre}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4 font-medium">
              <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" /> {edificioSeleccionado.direccion}
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button onClick={() => { if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); } else { setModalResenaAbierto(true); } }} className="bg-violet-600 hover:bg-violet-500 text-white py-2.5 px-3 rounded-2xl font-bold text-xs transition shadow-lg shadow-violet-600/40 flex items-center justify-center gap-1.5 hover:scale-[1.02]">
                <Plus className="w-4 h-4" /> Dejar Opinión
              </button>
              <button onClick={() => mostrarAviso('Próximamente: Conexión con corredores.')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-2xl font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5 hover:scale-[1.02]">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Cotizar Arriendo
              </button>
            </div>

            {/* FOTO PORTADA */}
            {(() => {
              const fotoResena = resenas.find(r => r.url_imagen)?.url_imagen;
              const fotosPorComuna = {
                'Santiago Centro': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
                'Providencia': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
                'Ñuñoa': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
              };
              const fotoFinal = fotoResena || fotosPorComuna[edificioSeleccionado.comuna] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';

              return (
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-violet-500/30 shadow-xl mb-3 relative group">
                  <img src={fotoFinal} alt="Edificio" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" onClick={() => window.open(fotoFinal, '_blank')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3 pointer-events-none">
                    <span className="text-[10px] text-white font-bold bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700">
                      {fotoResena ? '📷 Foto comunitaria' : '🏙️ Vista referencial'}
                    </span>
                  </div>
                  <button onClick={() => { if (!session) { setModoAuth('login'); setRegistroExitosoMsg(false); setModalAuthAbierto(true); } else { setModalFotoAbierto(true); } }} className="absolute top-2.5 left-2.5 bg-slate-900/90 hover:bg-violet-600 text-white p-2 rounded-xl backdrop-blur-md transition shadow-lg flex items-center gap-1.5 text-[10px] font-bold hover:scale-105">
                    <Camera className="w-3.5 h-3.5" /> Foto
                  </button>
                </div>
              );
            })()}

            <VistaMapaEdificio direccion={edificioSeleccionado.direccion} nombre={edificioSeleccionado.nombre} />

            <div className="space-y-2.5 my-3">
              <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-400"><DollarSign className="w-4 h-4" /></div>
                  <span className="text-xs text-slate-300 font-semibold">Gasto Común Promedio</span>
                </div>
                <span className="text-xs font-black text-white">{promedioGasto}</span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-500/20 rounded-xl text-emerald-400"><Home className="w-4 h-4" /></div>
                  <span className="text-xs text-slate-300 font-bold">Arriendo por Tipología</span>
                </div>
                {Object.keys(promediosArriendoPorHab).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic pl-1">Sin datos de arriendo.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {Object.entries(promediosArriendoPorHab).map(([hab, monto]) => (
                      <div key={hab} className="bg-slate-900 p-2 rounded-xl text-center border border-slate-800 shadow-inner">
                        <div className="text-[10px] text-violet-400 font-black">{hab} Dorm.</div>
                        <div className="text-xs font-bold text-white mt-0.5">{monto}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 px-3.5 py-2 rounded-2xl mb-3 text-xs text-slate-300 shadow-sm">
              <span className="flex items-center gap-1.5 text-amber-400 font-black">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {edificioSeleccionado.calificacion_promedio || 'N/A'}
              </span>
              <span className="font-semibold text-slate-400">{resenas.length} opiniones</span>
            </div>

            <button onClick={() => setModalAlertaAbierto(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-violet-300 border border-violet-500/40 py-2.5 px-3 rounded-2xl font-bold text-xs transition mb-3.5 flex items-center justify-center gap-2 shadow-lg">
              <Bell className="w-4 h-4 text-violet-400" /> 🔔 Avisarme de arriendos aquí
            </button>

            <GaleriaFotosEdificio resenas={resenas} />

            {/* OPINIONES */}
            <div className="space-y-3 pt-3.5 border-t border-slate-800">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Opiniones de la comunidad</h3>
              {cargandoResenas ? (
                <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
              ) : resenas.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 italic">Sé el primero en opinar.</p>
              ) : (
                resenas.map((r) => {
                  const yaVotado = likesUsuario.includes(r.id);
                  const esMia = session?.user?.email === r.usuario_email;
                  return (
                    <div key={r.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs shadow-md">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white tracking-wide">{r.titulo}</h4>
                        <div className="flex items-center gap-1.5">
                          {esMia && (
                            <button onClick={() => handleEliminarResena(r.id)} className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-xl transition" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDarUtil(r.id, r.util_count)} className={`flex items-center gap-1 border px-2.5 py-1 rounded-xl transition text-[10px] font-bold ${yaVotado ? 'bg-violet-600 text-white border-violet-500' : 'bg-slate-900 hover:bg-violet-600/20 text-slate-300 border-slate-800'}`}>
                            <ThumbsUp className={`w-3 h-3 ${yaVotado ? 'text-white fill-white' : 'text-violet-400'}`} /> 
                            <span>{r.util_count || 0}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{r.comentario}</p>
                      {r.etiqueta && (
                        <span className="inline-block bg-violet-500/20 text-violet-300 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-violet-500/30">
                          🏷️ {r.etiqueta}
                        </span>
                      )}
                      {(r.habitaciones || r.gasto_comun || r.arriendo) && (
                        <div className="flex flex-wrap gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px]">
                          {r.habitaciones && <span className="text-violet-400 font-bold">🛏️ {r.habitaciones} Dorm.</span>}
                          {r.gasto_comun && <span className="text-amber-400 font-bold">GC: ${Number(r.gasto_comun).toLocaleString('es-CL')}</span>}
                          {r.arriendo && <span className="text-emerald-400 font-bold">Arriendo: ${Number(r.arriendo).toLocaleString('es-CL')}</span>}
                        </div>
                      )}
                      {r.url_imagen && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 mt-2 max-h-36">
                          <img src={r.url_imagen} alt="Evidencia" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-semibold">
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

      {/* MODAL ADMIN */}
      {modalAdminAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-white max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalAdminAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><ShieldAlert className="text-amber-400" /> Leads / Alertas</h3>
            {listaAlertas.length === 0 ? <p className="text-xs text-slate-500 text-center py-8">No hay alertas aún.</p> : (
              <div className="space-y-2.5 mt-4">
                {listaAlertas.map((alerta) => (
                  <div key={alerta.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-violet-400">{alerta.edificios?.nombre || 'Edificio'}</div>
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

      {/* MODAL ALERTA */}
      {modalAlertaAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAlertaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-1">🔔 Alerta de Arriendo</h3>
            <p className="text-xs text-slate-400 mb-4">Te avisaremos si hay arriendos en <b>{edificioSeleccionado?.nombre}</b>.</p>
            <form onSubmit={handleGuardarAlerta} className="space-y-4 text-xs">
              <input type="email" required placeholder="tu@email.com" value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)} className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-violet-500" />
              <button type="submit" disabled={enviando} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl transition shadow-lg">{enviando ? 'Guardando...' : 'Activar Alerta'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOTO */}
      {modalFotoAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalFotoAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-1">Agregar Foto</h3>
            <form onSubmit={handleGuardarFotoRapida} className="space-y-4 text-xs mt-3">
              <input type="file" accept="image/*" required onChange={(e) => setArchivoFotoRapida(e.target.files[0])} className="w-full text-slate-400 file:mr-2 file:py-2.5 file:px-3 file:rounded-xl file:bg-violet-600/20 file:text-violet-400" />
              <button type="submit" disabled={enviando} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl transition shadow-lg">{enviando ? 'Subiendo...' : 'Actualizar Portada'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AUTH */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            {modoAuth !== 'recuperar' && (
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-5">
                <button type="button" onClick={() => { setModoAuth('login'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${modoAuth === 'login' ? 'bg-violet-600 text-white shadow' : 'text-slate-400'}`}>Iniciar Sesión</button>
                <button type="button" onClick={() => { setModoAuth('registro'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${modoAuth === 'registro' ? 'bg-violet-600 text-white shadow' : 'text-slate-400'}`}>Registrarse</button>
              </div>
            )}
            {recuperacionEnviada ? (
              <div className="bg-emerald-950/50 border border-emerald-800 p-5 rounded-3xl text-center space-y-3">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">¡Correo enviado!</h4>
                <p className="text-xs text-slate-300">Revisa tu bandeja.</p>
                <button onClick={() => { setModoAuth('login'); setRecuperacionEnviada(false); }} className="w-full bg-emerald-600 text-white py-2.5 rounded-2xl text-xs font-bold">Volver</button>
              </div>
            ) : modoAuth === 'recuperar' ? (
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                <h3 className="text-base font-bold mb-1">Recuperar Clave</h3>
                <p className="text-slate-400 mb-3">Te enviaremos un enlace a tu correo.</p>
                {authError && <p className="text-xs text-rose-400 bg-rose-950 p-3 rounded-2xl">{authError}</p>}
                <div>
                  <label className="block text-slate-300 mb-1">Correo</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white focus:border-violet-500" />
                </div>
                <button type="submit" disabled={enviando} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-2xl shadow-lg">{enviando ? 'Enviando...' : 'Enviar enlace'}</button>
                <button type="button" onClick={() => { setModoAuth('login'); setAuthError(''); }} className="w-full text-slate-400 hover:text-white pt-2 text-center block font-bold">← Volver</button>
              </form>
            ) : registroExitosoMsg ? (
              <div className="bg-emerald-950/50 border border-emerald-800 p-5 rounded-3xl text-center space-y-3">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">¡Registro completado!</h4>
                <p className="text-xs text-slate-300">Revisa tu correo.</p>
                <button onClick={() => { setModoAuth('login'); setRegistroExitosoMsg(false); }} className="w-full bg-emerald-600 text-white py-2.5 rounded-2xl text-xs font-bold">Ir a Iniciar Sesión</button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {authError && <p className="text-xs text-rose-400 bg-rose-950 p-3 rounded-2xl">{authError}</p>}
                <div>
                  <label className="block text-slate-300 mb-1">Correo</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Contraseña</label>
                  <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none text-white focus:border-violet-500" />
                </div>
                {modoAuth === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setModoAuth('recuperar'); setAuthError(''); }} className="text-[11px] text-violet-400 font-bold hover:underline">¿Olvidaste tu contraseña?</button>
                  </div>
                )}
                <button type="submit" disabled={enviando} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-2xl shadow-lg mt-2">{enviando ? 'Procesando...' : modoAuth === 'login' ? 'Entrar' : 'Registrarse'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL RESEÑA */}
      {modalResenaAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white no-scrollbar">
            <button onClick={() => setModalResenaAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-extrabold mb-1">Publicar Opinión</h3>
            <p className="text-xs text-violet-400 mb-4 font-bold">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Título</label>
                <input type="text" required placeholder="Ej: Excelente ubicación" value={nuevaResena.titulo} onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Etiqueta</label>
                <select value={nuevaResena.etiqueta} onChange={(e) => setNuevaResena({...nuevaResena, etiqueta: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <option value="Excelente conectividad al metro">🚇 Excelente conectividad al metro</option>
                  <option value="Ascensores rápidos y bien mantenidos">🛗 Ascensores rápidos</option>
                  <option value="Zona muy segura y tranquila">🛡️ Zona muy segura y tranquila</option>
                  <option value="Problemas frecuentes con ruidos">🔊 Problemas con ruidos</option>
                  <option value="Gastos comunes elevados">💰 Gastos comunes elevados</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Comentario</label>
                <textarea required rows="3" placeholder="Detalles de tu experiencia..." value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-violet-500" />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-slate-200">📊 ¿Agregar arriendo / gastos comunes?</span>
                  <input type="checkbox" checked={incluirDatosEconomicos} onChange={(e) => setIncluirDatosEconomicos(e.target.checked)} className="w-4 h-4 accent-violet-600 rounded cursor-pointer" />
                </label>
                {incluirDatosEconomicos && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">Dormitorios</label>
                      <select value={nuevaResena.habitaciones} onChange={(e) => setNuevaResena({...nuevaResena, habitaciones: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl">
                        <option value="1">1 Dorm</option><option value="2">2 Dorm</option><option value="3">3 Dorm</option><option value="4">4+ Dorm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">Gasto Común ($)</label>
                      <input type="number" placeholder="90000" value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-bold">Arriendo ($)</label>
                      <input type="number" placeholder="450000" value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})} className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Foto (Opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files[0])} className="w-full text-slate-400 file:mr-2 file:py-2 file:px-3.5 file:rounded-xl file:bg-violet-600/20 file:text-violet-400" />
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl shadow-lg mt-2 transition">
                {enviando ? 'Guardando...' : 'Publicar Opinión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIFICIO */}
      {modalEdificioAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-extrabold mb-1">Registrar Edificio</h3>
            <form onSubmit={handleGuardarEdificio} className="space-y-4 text-xs mt-3">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Nombre</label>
                <input type="text" required placeholder="Ej: Edificio Parque" value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Dirección</label>
                <input type="text" required placeholder="Ej: Av. Bustamante 456" value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-bold">Comuna</label>
                <select value={nuevoEdificio.comuna} onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <option value="Santiago Centro">Santiago Centro</option><option value="Providencia">Providencia</option><option value="Ñuñoa">Ñuñoa</option><option value="Las Condes">Las Condes</option>
                </select>
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-2xl shadow-lg mt-2">{enviando ? 'Registrando...' : 'Registrar'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}