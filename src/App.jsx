import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createPathComponent } from '@react-leaflet/core';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, Camera, Heart, Home, Bell, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, Menu, Trash2, Bookmark, Settings, KeyRound, MessageSquare, ShieldCheck, FileText, Check, Ban
} from 'lucide-react';

const modernIcon = L.divIcon({
  className: 'custom-modern-marker',
  html: `
    <div style="
      width: 32px; height: 32px; 
      background: linear-gradient(135deg, #6366f1, #4f46e5); 
      border: 2px solid #ffffff; 
      border-radius: 50% 50% 50% 0; 
      transform: rotate(-45deg); 
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36]
});

function MapResizer({ edificioSeleccionado }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => { map.invalidateSize(true); }, 300);
    if (edificioSeleccionado && window.innerWidth > 768) {
      map.setView([parseFloat(edificioSeleccionado.latitud), parseFloat(edificioSeleccionado.longitud)], 15, { animate: true });
    }
    return () => clearTimeout(timer);
  }, [map, edificioSeleccionado]);
  return null;
}

const LeafletClusterGroup = createPathComponent(({ children, ...options }, ctx) => {
  const clusterGroup = L.markerClusterGroup(options);
  Object.keys(options).forEach((prop) => {
    if (prop.startsWith('on')) {
      const event = prop.replace('on', '').toLowerCase();
      clusterGroup.on(event, options[prop]);
    }
  });
  return {
    instance: clusterGroup,
    context: { ...ctx, layerContainer: clusterGroup },
  };
});

const PanelEdificio = ({ 
  edificio, cerrar, resenas, promedios, favoritos, toggleFavorito, 
  abrirModalResena, abrirModalFoto, abrirModalAlerta, 
  likesUsuario, handleDarUtil, handleEliminarResena, session, modoAuth, setModoAuth, setModalAuthAbierto 
}) => {
  if (!edificio) return null;

  const fotoResena = resenas.find(r => r.url_imagen)?.url_imagen;
  const fotosPorComuna = {
    'Santiago Centro': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'Providencia': 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
    'Ñuñoa': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
  };
  const fotoFinal = fotoResena || fotosPorComuna[edificio.comuna] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80';

  const { promedioGasto, promediosArriendoPorHab, calificacionPromedio } = promedios;
  
  const habitacionesDisponibles = Object.keys(promediosArriendoPorHab);
  const [habSeleccionada, setHabSeleccionada] = React.useState(
    habitacionesDisponibles.length > 0 ? habitacionesDisponibles[0] : '1'
  );

  React.useEffect(() => {
    if (habitacionesDisponibles.length > 0 && !habitacionesDisponibles.includes(habSeleccionada)) {
      setHabSeleccionada(habitacionesDisponibles[0]);
    }
  }, [promediosArriendoPorHab]);

  const arriendoActual = promediosArriendoPorHab[habSeleccionada] || 'Sin datos';

  const requerirAuth = (accion) => {
    if (!session) { setModoAuth('login'); setModalAuthAbierto(true); } else { accion(); }
  };

  return (
    <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto w-full md:w-[500px] bg-[#09090b] shadow-2xl z-40 overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
      
      <div className="relative h-72 md:h-80 w-full flex-shrink-0 bg-[#09090b]">
        <img src={fotoFinal} alt="Portada" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent"></div>
        
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
          <button onClick={cerrar} className="p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white transition-all active:scale-95 hover:bg-black/60">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={(e) => toggleFavorito(edificio.id, e)} className={`p-2.5 backdrop-blur-xl rounded-full transition-all active:scale-95 ${favoritos.includes(edificio.id) ? 'bg-rose-500/20 text-rose-500' : 'bg-black/40 text-white hover:bg-black/60'}`}>
              <Heart className={`w-5 h-5 ${favoritos.includes(edificio.id) ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 left-6 right-6 z-10 flex flex-col gap-4">
          <div>
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-indigo-600 text-white rounded-full mb-2 inline-block shadow-lg shadow-indigo-500/30">
              {edificio.comuna}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{edificio.nombre}</h2>
            <p className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium truncate opacity-80">
              <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" /> {edificio.direccion}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl flex flex-col justify-center">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Gasto Común Prom.</p>
              <p className="text-sm md:text-base font-black text-amber-400">{promedioGasto}</p>
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Arriendo Prom.</span>
                {habitacionesDisponibles.length > 0 && (
                  <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
                    {habitacionesDisponibles.map(hab => (
                      <button 
                        key={hab}
                        onClick={() => setHabSeleccionada(hab)}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${habSeleccionada === hab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        {hab}D
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm md:text-base font-black text-emerald-400">{arriendoActual}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-28 no-scrollbar bg-[#09090b]">
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => requerirAuth(abrirModalResena)} className="flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-4 rounded-3xl transition-all shadow-[0_8px_20px_rgba(99,102,241,0.25)] active:scale-95">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wide">Dar Opinión</span>
          </button>
          <button onClick={() => abrirModalFoto()} className="flex flex-col items-center justify-center gap-2 bg-[#141417] hover:bg-[#1a1a1f] text-white py-3.5 px-4 rounded-3xl transition-all active:scale-95">
            <Camera className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold tracking-wide text-slate-400">Aportar Foto</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 pl-1">
             <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Reseñas Vecinales
             </h3>
             <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-full">
               <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
               <span className="text-[11px] font-bold text-indigo-400">{calificacionPromedio}</span>
             </div>
          </div>

          <div className="space-y-4">
            {resenas.length === 0 ? (
              <div className="flex flex-col items-center text-center p-8 bg-[#141417] rounded-3xl">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                   <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">Sé el primero en opinar</h4>
                <p className="text-[11px] text-slate-400 mb-5 leading-relaxed max-w-[200px]">Tu experiencia ayuda a otros a tomar mejores decisiones sobre dónde vivir.</p>
                <button onClick={() => requerirAuth(abrirModalResena)} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform">Escribir Reseña</button>
              </div>
            ) : (
              resenas.map((r) => {
                const yaVotado = likesUsuario.includes(r.id);
                const esMia = session?.user?.email === r.usuario_email;
                return (
                  <div key={r.id} className="bg-[#141417] p-5 rounded-3xl relative">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3.5 h-3.5 ${s <= (r.calificacion || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {r.es_verificado && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Vecino Verificado
                        </span>
                      )}
                      {r.etiqueta && (
                        <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full ${r.etiqueta.includes('Mala') || r.etiqueta.includes('lentos') || r.etiqueta.includes('insegura') || r.etiqueta.includes('Ruidos') || r.etiqueta.includes('altísimos') ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {r.etiqueta}
                        </span>
                      )}
                      {esMia && (
                        <button onClick={() => handleEliminarResena(r.id)} className="text-rose-500 bg-rose-500/10 p-2 rounded-xl ml-auto">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap font-medium">{r.comentario}</p>
                    
                    {(r.habitaciones || r.gasto_comun || r.arriendo) && (
                      <div className="flex flex-wrap gap-2 mb-4 bg-[#09090b] p-3 rounded-2xl text-[10px]">
                        {r.habitaciones && <span className="text-slate-400 font-bold bg-white/5 px-2 py-1 rounded-lg">🛏️ {r.habitaciones} D</span>}
                        {r.gasto_comun && <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg">GC: ${Number(r.gasto_comun).toLocaleString('es-CL')}</span>}
                        {r.arriendo && <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">Arr: ${Number(r.arriendo).toLocaleString('es-CL')}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-md">
                          {r.usuario_email ? r.usuario_email.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold">{new Date(r.creado_en).toLocaleDateString('es-CL')}</span>
                      </div>
                      <button onClick={() => requerirAuth(() => handleDarUtil(r.id, r.util_count))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${yaVotado ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                        <ThumbsUp className={`w-3.5 h-3.5 ${yaVotado ? 'fill-white' : ''}`} /> {r.util_count || 0}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent pointer-events-none">
         <button onClick={() => requerirAuth(abrirModalAlerta)} className="pointer-events-auto w-full bg-[#141417] hover:bg-[#1a1a1f] border border-white/5 text-white font-bold py-4 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl">
           <Bell className="w-4 h-4 text-indigo-400" /> Activar Alerta de Disponibilidad
         </button>
      </div>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [buscadorActivo, setBuscadorActivo] = useState(false);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [modalLegalInfo, setModalLegalInfo] = useState(null);

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

  const [listaVerificaciones, setListaVerificaciones] = useState([]);
  const [archivoDocVerificacion, setArchivoDocVerificacion] = useState(null);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [registroExitosoMsg, setRegistroExitosoMsg] = useState(false);
  
  const [nuevaResena, setNuevaResena] = useState({ 
    comentario: '', 
    gasto_comun: '', 
    arriendo: '', 
    habitaciones: '1', 
    etiqueta: '🚇 Excelente conectividad al metro',
    calificacion: 5 
  });
  
  const opcionesEtiquetas = [
    '🚇 Excelente conectividad al metro', '🚇 Mala conectividad / Lejos del metro',
    '🛗 Ascensores rápidos y mantenidos', '🛗 Ascensores lentos o siempre rotos',
    '🛡️ Zona muy segura y tranquila', '⚠️ Zona insegura / Portonazos frecuentes',
    '🔊 Edificio silencioso y tranquilo', '🔊 Ruidos molestos / Mala aislación',
    '💰 Gastos comunes bajos y estables', '💰 Gastos comunes altísimos'
  ];

  const comunasOpciones = ['Santiago Centro', 'Providencia', 'Ñuñoa', 'Las Condes'];

  const [correoAlerta, setCorreoAlerta] = useState('');
  const [nuevoEdificio, setNuevoEdificio] = useState({ nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693' });

  const mostrarAviso = (texto, tipo = 'success') => { setMensajeNotificacion({ texto, tipo }); setTimeout(() => setMensajeNotificacion(null), 4000); };

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

  const cargarEdificios = async () => {
    try {
      const { data, error } = await supabase.from('vista_edificios_con_promedios').select('*');
      if (!error) setEdificios(data || []);
    } catch (err) { console.error(err); } finally { setCargando(false); }
  };
  useEffect(() => { cargarEdificios(); }, []);

  useEffect(() => {
    if (!edificioSeleccionado) return;
    async function cargarResenas() {
      const { data, error } = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
      if (!error) setResenas(data || []);
    }
    cargarResenas();
  }, [edificioSeleccionado]);

  const toggleFavorito = (edificioId, e) => {
    e.stopPropagation();
    let nuevosFavs = favoritos.includes(edificioId) ? favoritos.filter(id => id !== edificioId) : [...favoritos, edificioId];
    setFavoritos(nuevosFavs);
    localStorage.setItem('habitasantiago_favs', JSON.stringify(nuevosFavs));
  };

  const handleDarUtil = async (resenaId, actualCount) => {
    const yaVotado = likesUsuario.includes(resenaId);
    const nuevoCount = yaVotado ? Math.max(0, (Number(actualCount) || 1) - 1) : (Number(actualCount) || 0) + 1;
    const { error } = await supabase.from('resenas').update({ util_count: nuevoCount }).eq('id', resenaId);
    if (!error) {
      setResenas(resenas.map(r => r.id === resenaId ? { ...r, util_count: nuevoCount } : r));
      let nuevosLikes = yaVotado ? likesUsuario.filter(id => id !== resenaId) : [...likesUsuario, resenaId];
      setLikesUsuario(nuevosLikes);
      localStorage.setItem('habitasantiago_likes', JSON.stringify(nuevosLikes));
    }
  };

  const handleEliminarResena = async (resenaId) => {
    if (!confirm('¿Deseas eliminar esta opinión?')) return;
    const { error } = await supabase.from('resenas').delete().eq('id', resenaId);
    if (!error) { setResenas(resenas.filter(r => r.id !== resenaId)); cargarEdificios(); mostrarAviso('Reseña eliminada.'); }
  };

  const cargarVerificacionesAdmin = async () => {
    const { data, error } = await supabase
      .from('resenas')
      .select('*, edificios(nombre, comuna)')
      .not('doc_verificacion_url', 'is', null)
      .eq('es_verificado', false)
      .order('creado_en', { ascending: false });
      
    if (!error) {
      setListaVerificaciones(data || []);
      setModalAdminAbierto(true);
    }
  };

  const responderVerificacion = async (resenaId, aprobar) => {
    const { error } = await supabase
      .from('resenas')
      .update({ es_verificado: aprobar })
      .eq('id', resenaId);

    if (!error) {
      setListaVerificaciones(listaVerificaciones.filter(v => v.id !== resenaId));
      mostrarAviso(aprobar ? '¡Vecino Verificado aprobado!' : 'Solicitud rechazada');
      if (edificioSeleccionado) {
        const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false });
        setResenas(res.data || []);
      }
    }
  };

  const calcularPromediosEdificio = () => {
    const resenasConNota = resenas.filter(r => r.calificacion && Number(r.calificacion) > 0);
    let calificacionPromedio = 'N/A';
    if (resenasConNota.length > 0) {
      const sumaNotas = resenasConNota.reduce((acc, curr) => acc + Number(curr.calificacion), 0);
      calificacionPromedio = (sumaNotas / resenasConNota.length).toFixed(1);
    }

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
    return { promedioGasto, promediosArriendoPorHab, calificacionPromedio };
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setEnviando(true); setAuthError('');
    if (modoAuth === 'registro') { 
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { emailRedirectTo: window.location.origin } }); 
      if (error) setAuthError(error.message); else setRegistroExitosoMsg(true); 
    } 
    else if (modoAuth === 'login') { 
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); 
      if (error) setAuthError('Correo o contraseña incorrectos. Inténtalo de nuevo.'); 
      else { setModalAuthAbierto(false); mostrarAviso('¡Bienvenido de vuelta!'); } 
    }
    setEnviando(false);
  };

  const handleCambiarPasswordSidebar = async (e) => { e.preventDefault(); if (!nuevaPasswordSidebar) return; setEnviando(true); const { error } = await supabase.auth.updateUser({ password: nuevaPasswordSidebar }); if (!error) { mostrarAviso('¡Contraseña actualizada!'); setNuevaPasswordSidebar(''); } setEnviando(false); };
  const handleCerrarSesion = async () => { await supabase.auth.signOut(); setSidebarAbierto(false); mostrarAviso('Sesión cerrada.'); };

  const handleGuardarResena = async (e) => {
    e.preventDefault(); if (!edificioSeleccionado || !session) return; setEnviando(true);
    
    let docUrl = null;
    if (archivoDocVerificacion) {
      const fileExt = archivoDocVerificacion.name.split('.').pop();
      const fileName = `doc_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(fileName, archivoDocVerificacion);
      if (!uploadError) {
        const { data } = supabase.storage.from('fotos-edificios').getPublicUrl(fileName);
        docUrl = data?.publicUrl || null;
      }
    }
    
    const objetoResena = { 
      edificio_id: edificioSeleccionado.id, 
      titulo: nuevaResena.etiqueta,
      comentario: nuevaResena.comentario, 
      calificacion: parseInt(nuevaResena.calificacion) || 5,
      nota_ruido: 3, 
      nota_administracion: 3, 
      nota_gastos_comunes: 3, 
      nota_seguridad: 3, 
      etiqueta: nuevaResena.etiqueta, 
      doc_verificacion_url: docUrl,
      es_verificado: false,
      usuario_email: session.user.email, 
      util_count: 0 
    };

    if (incluirDatosEconomicos) { 
      objetoResena.habitaciones = parseInt(nuevaResena.habitaciones)||1; 
      objetoResena.gasto_comun = parseFloat(nuevaResena.gasto_comun)||null; 
      objetoResena.arriendo = parseFloat(nuevaResena.arriendo)||null; 
    }
    
    const { error } = await supabase.from('resenas').insert([objetoResena]);
    if (!error) { 
      setModalResenaAbierto(false); 
      setArchivoDocVerificacion(null);
      setIncluirDatosEconomicos(false); 
      setNuevaResena({ comentario: '', gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: '🚇 Excelente conectividad al metro', calificacion: 5 }); 
      const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false }); 
      setResenas(res.data || []); 
      cargarEdificios(); 
      mostrarAviso(docUrl ? '¡Reseña enviada! Revisaremos tu comprobante en breve.' : '¡Opinión publicada con éxito!'); 
    } else {
      mostrarAviso('Error al publicar la opinión: ' + error.message, 'error');
    }
    setEnviando(false);
  };

  const handleGuardarAlerta = async (e) => { e.preventDefault(); if (!correoAlerta) return; setEnviando(true); const { error } = await supabase.from('alertas_arriendo').insert([{ edificio_id: edificioSeleccionado.id, correo: correoAlerta }]); if (!error) { mostrarAviso('Alerta activada'); setCorreoAlerta(''); setModalAlertaAbierto(false); } setEnviando(false); };

  const handleGuardarEdificio = async (e) => {
    e.preventDefault(); if (!session) return; setEnviando(true);
    let lat = parseFloat(nuevoEdificio.latitud); let lon = parseFloat(nuevoEdificio.longitud);
    try { const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${nuevoEdificio.direccion}, ${nuevoEdificio.comuna}, Santiago, Chile`)}`); const datosMapa = await res.json(); if (datosMapa && datosMapa.length > 0) { lat = parseFloat(datosMapa[0].lat); lon = parseFloat(datosMapa[0].lon); } } catch (err) {}
    const { data, error } = await supabase.from('edificios').insert([{ nombre: nuevoEdificio.nombre, direccion: nuevoEdificio.direccion, comuna: nuevoEdificio.comuna, latitud: lat, longitud: lon }]).select();
    if (!error) { setModalEdificioAbierto(false); setNuevoEdificio({ nombre: '', direccion: '', comuna: 'Santiago Centro', latitud: '-33.4489', longitud: '-70.6693' }); await cargarEdificios(); if (data?.length > 0) setEdificioSeleccionado(data[0]); mostrarAviso('¡Edificio registrado!'); }
    setEnviando(false);
  };

  const edificiosFiltrados = edificios.filter(e => {
    const matchTexto = e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || e.comuna.toLowerCase().includes(busqueda.toLowerCase()) || e.direccion.toLowerCase().includes(busqueda.toLowerCase());
    const matchComuna = filtroComuna === 'todas' || e.comuna.toLowerCase() === filtroComuna.toLowerCase();
    
    // Forzamos conversión numérica segura para que el filtro 4.0+ funcione de inmediato
    const ratingNum = Number(e.calificacion_promedio) || 0;
    const matchRating = !filtroRating || (ratingNum >= 4.0);
    
    return matchTexto && matchComuna && matchRating;
  });

  const resetearApp = () => {
    setEdificioSeleccionado(null);
    setBusqueda('');
    setFiltroComuna('todas');
    setFiltroRating(false);
  };

  const esAdmin = session?.user?.email === 'eladiocatt@gmail.com';

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#09090b] font-sans relative text-slate-200 selection:bg-indigo-500 selection:text-white flex antialiased">
      
      {mensajeNotificacion && (
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-[99999] bg-[#141417] text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-top-5 font-bold text-[11px] tracking-wide border border-white/10">
          {mensajeNotificacion.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          {mensajeNotificacion.texto}
        </div>
      )}

      <div className="relative w-full h-full">
        <header className="absolute top-5 left-5 right-5 z-30 flex items-start justify-between gap-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 w-full max-w-md">
             <div onClick={resetearApp} className="bg-[#09090b]/40 backdrop-blur-2xl p-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center cursor-pointer active:scale-95 transition-all">
               <Building className="w-5 h-5 text-indigo-400" />
             </div>

             <div className="relative w-full">
               <div className="bg-[#09090b]/40 backdrop-blur-2xl px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center transition-all">
                 <Search className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
                 <input 
                   type="text" 
                   placeholder="Buscar edificio, comuna..." 
                   value={busqueda} 
                   onChange={(e) => setBusqueda(e.target.value)} 
                   onFocus={() => setBuscadorActivo(true)}
                   onBlur={() => setTimeout(() => setBuscadorActivo(false), 200)}
                   className="bg-transparent text-xs text-white focus:outline-none w-full font-bold placeholder:text-slate-500 placeholder:font-medium" 
                 />
               </div>
               
               {busqueda && buscadorActivo && (
                 <div className="absolute top-full left-0 right-0 mt-3 bg-[#141417]/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto">
                   {edificiosFiltrados.length > 0 ? (
                     edificiosFiltrados.slice(0, 5).map(ed => (
                       <div key={ed.id} onClick={() => { setEdificioSeleccionado(ed); setBusqueda(''); setBuscadorActivo(false); }} className="px-5 py-4 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors">
                         <div>
                           <p className="text-[11px] font-bold text-white mb-0.5">{ed.nombre}</p>
                           <p className="text-[10px] text-slate-400 font-medium">{ed.direccion}</p>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="px-5 py-4 text-[11px] text-slate-500 font-medium text-center">No encontramos ese edificio.</div>
                   )}
                 </div>
               )}
             </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => { if(!session){setModoAuth('login'); setModalAuthAbierto(true);} else {setSidebarAbierto(true);} }} className="bg-[#09090b]/40 backdrop-blur-2xl p-3.5 rounded-2xl text-white hover:bg-white/10 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] active:scale-95">
               {session ? <Menu className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none w-full max-w-sm px-4">
          <div className="pointer-events-auto bg-[#09090b]/60 backdrop-blur-2xl p-1.5 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
            <button onClick={() => setFiltroComuna('todas')} className={`px-4 py-2.5 rounded-2xl text-[10px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'todas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Todas</button>
            <button onClick={() => setFiltroComuna('Santiago Centro')} className={`px-4 py-2.5 rounded-2xl text-[10px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Santiago Centro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Stgo Centro</button>
            <button onClick={() => setFiltroComuna('Providencia')} className={`px-4 py-2.5 rounded-2xl text-[10px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Providencia' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Providencia</button>
            <button onClick={() => setFiltroRating(!filtroRating)} className={`px-3 py-2.5 rounded-2xl text-[10px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filtroRating ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-white/5'}`}>
              <Star size={12} className={filtroRating ? 'fill-white' : ''} /> 4.0+
            </button>
          </div>
        </div>

        <MapContainer center={[-33.4489, -70.6693]} zoom={13} style={{ width: '100%', height: '100%', backgroundColor: '#09090b' }} zoomControl={false}>
          <style>{`
            .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
          `}</style>
          <MapResizer edificioSeleccionado={edificioSeleccionado} />
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LeafletClusterGroup>
            {edificiosFiltrados.map((edificio) => (
              <Marker 
                key={edificio.id} 
                position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]} 
                icon={modernIcon}
                eventHandlers={{ click: () => setEdificioSeleccionado(edificio) }}
              >
                <Popup>
                  <div className="min-w-[180px] p-1 flex flex-col">
                    <h3 className="font-black text-[13px] text-slate-800 mb-1 leading-tight">{edificio.nombre}</h3>
                    <p className="text-[10px] font-bold text-slate-500 mb-3">{edificio.direccion}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEdificioSeleccionado(edificio); }} 
                      className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl text-[11px] active:scale-95 transition-all shadow-md"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LeafletClusterGroup>
        </MapContainer>
      </div>

      {edificioSeleccionado && (
         <PanelEdificio 
           edificio={edificioSeleccionado} 
           cerrar={() => setEdificioSeleccionado(null)} 
           resenas={resenas} 
           promedios={calcularPromediosEdificio()}
           favoritos={favoritos}
           toggleFavorito={toggleFavorito}
           abrirModalResena={() => setModalResenaAbierto(true)}
           abrirModalFoto={() => setModalFotoAbierto(true)}
           abrirModalAlerta={() => setModalAlertaAbierto(true)}
           likesUsuario={likesUsuario}
           handleDarUtil={handleDarUtil}
           handleEliminarResena={handleEliminarResena}
           session={session}
           modoAuth={modoAuth}
           setModoAuth={setModoAuth}
           setModalAuthAbierto={setModalAuthAbierto}
         />
      )}

      {sidebarAbierto && (
        <div className="fixed inset-0 z-[99999] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setSidebarAbierto(false)}></div>
          <div className="relative w-full max-w-xs bg-[#09090b] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 pb-0 flex justify-between items-center">
              <h2 className="text-base font-black text-white">Mi Perfil</h2>
              <button onClick={() => setSidebarAbierto(false)} className="p-2.5 hover:bg-white/10 rounded-full active:scale-95 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
                  {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-white text-sm truncate">{nombreUsuario || 'Usuario'}</h3>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <button onClick={() => setVistaSidebar('perfil')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${vistaSidebar === 'perfil' ? 'bg-[#141417] text-white' : 'text-slate-400 hover:bg-[#141417]'}`}><Settings className="w-4 h-4" /> Mis Datos</button>
                <button onClick={() => setVistaSidebar('password')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${vistaSidebar === 'password' ? 'bg-[#141417] text-white' : 'text-slate-400 hover:bg-[#141417]'}`}><KeyRound className="w-4 h-4" /> Seguridad</button>
                <button onClick={() => setVistaSidebar('favoritos')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold transition-all ${vistaSidebar === 'favoritos' ? 'bg-[#141417] text-white' : 'text-slate-400 hover:bg-[#141417]'}`}><Bookmark className="w-4 h-4" /> Guardados ({favoritos.length})</button>
                
                {esAdmin && (
                  <button onClick={() => { cargarVerificacionesAdmin(); setSidebarAbierto(false); }} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-all mt-4">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aprobar Verificaciones
                  </button>
                )}

                <button onClick={() => { setModalEdificioAbierto(true); setSidebarAbierto(false); }} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[11px] font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 mt-2 active:scale-95"><Plus className="w-4 h-4" /> Nuevo Edificio</button>
              </div>

              {vistaSidebar === 'perfil' && (
                <div className="space-y-3">
                  <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-[#141417] rounded-2xl px-4 py-3.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  <button onClick={() => mostrarAviso('¡Perfil actualizado!')} className="w-full bg-white text-black font-extrabold py-3.5 rounded-2xl text-[11px] active:scale-95 transition-all">Guardar</button>
                </div>
              )}

              {vistaSidebar === 'password' && (
                <form onSubmit={handleCambiarPasswordSidebar} className="space-y-3">
                  <input type="password" required minLength={6} placeholder="Nueva contraseña" value={nuevaPasswordSidebar} onChange={(e) => setNuevaPasswordSidebar(e.target.value)} className="w-full bg-[#141417] rounded-2xl px-4 py-3.5 text-xs text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  <button type="submit" className="w-full bg-white text-black font-extrabold py-3.5 rounded-2xl text-[11px] active:scale-95 transition-all">Actualizar</button>
                </form>
              )}
            </div>
            
            <div className="p-6">
              <button onClick={handleCerrarSesion} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white font-bold py-4 rounded-2xl text-[11px] transition-all">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {modalResenaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center md:px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModalResenaAbierto(false)}></div>
          <div className="relative bg-[#09090b] md:bg-[#141417] md:rounded-[32px] rounded-t-[32px] w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar pb-10">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 md:hidden"></div>
            <h3 className="text-xl font-black text-white mb-1">Tu Opinión</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Ayuda a otros sobre <span className="text-indigo-400 font-bold">{edificioSeleccionado?.nombre}</span></p>

            <form onSubmit={handleGuardarResena} className="space-y-6">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Calificación General</label>
                <div className="flex items-center gap-2 bg-[#1a1a1f] p-4 rounded-2xl">
                  {[1, 2, 3, 4, 5].map((estrella) => (
                    <button
                      key={estrella}
                      type="button"
                      onClick={() => setNuevaResena({...nuevaResena, calificacion: estrella})}
                      className="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star 
                        className={`w-6 h-6 ${estrella <= nuevaResena.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                      />
                    </button>
                  ))}
                  <span className="ml-auto text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                    {nuevaResena.calificacion}.0 Estrellas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Aspecto Principal</label>
                <div className="flex flex-wrap gap-2">
                  {opcionesEtiquetas.map(opt => {
                    const isSelected = nuevaResena.etiqueta === opt;
                    const isNegative = opt.includes('Mala') || opt.includes('lentos') || opt.includes('insegura') || opt.includes('Ruidos') || opt.includes('altísimos');
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNuevaResena({...nuevaResena, etiqueta: opt})}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${isSelected ? (isNegative ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30') : 'bg-[#1a1a1f] text-slate-400 hover:bg-[#22222a]'}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Detalles</label>
                <textarea required rows="3" placeholder="Ej: Me mudé hace 6 meses y la verdad es que..." value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} className="w-full bg-[#1a1a1f] p-4 rounded-2xl text-xs text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium placeholder:text-slate-600" />
              </div>
              
              <div className="bg-[#1a1a1f] p-5 rounded-3xl space-y-3 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-[11px]">Obtener insignia "Vecino Verificado" (Opcional)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Subes una foto de tu boleta de gasto común o contrato. 
                  <strong className="text-slate-200 font-bold block mt-1">🔒 Aviso de Privacidad: Puedes tapar o difuminar tu nombre, RUT y depto. Solo revisamos la dirección del edificio.</strong>
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setArchivoDocVerificacion(e.target.files[0])} 
                  className="w-full text-[10px] text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer" 
                />
              </div>

              <div className="bg-[#1a1a1f] p-5 rounded-3xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-white text-[11px]">Agregar Precios Reales</span>
                  <input type="checkbox" checked={incluirDatosEconomicos} onChange={(e) => setIncluirDatosEconomicos(e.target.checked)} className="w-5 h-5 accent-indigo-600 rounded-md" />
                </label>
                {incluirDatosEconomicos && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-2">Dormitorios</label>
                      <div className="flex gap-2">
                        {['1', '2', '3', '4+'].map(num => (
                          <button key={num} type="button" onClick={() => setNuevaResena({...nuevaResena, habitaciones: num})} className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${nuevaResena.habitaciones === num ? 'bg-indigo-600 text-white' : 'bg-[#09090b] text-slate-400'}`}>
                            {num}D
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2">Gasto Común ($)</label>
                        <input type="number" placeholder="Ej: 90000" value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})} className="w-full bg-[#09090b] p-3 rounded-xl text-[11px] font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-2">Arriendo ($)</label>
                        <input type="number" placeholder="Ej: 450000" value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})} className="w-full bg-[#09090b] p-3 rounded-xl text-[11px] font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-95 transition-all mt-2 text-xs">
                {enviando ? 'Publicando...' : 'Publicar Opinión'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modalAdminAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModalAdminAbierto(false)}></div>
          <div className="relative bg-[#141417] rounded-[32px] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
            <button onClick={() => setModalAdminAbierto(false)} className="absolute top-5 right-5 text-slate-400"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-black text-white">Aprobar Verificaciones</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 font-medium">Revisa las boletas/contratos subidos por la comunidad.</p>

            <div className="space-y-4">
              {listaVerificaciones.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-bold">No hay solicitudes pendientes.</div>
              ) : (
                listaVerificaciones.map(v => (
                  <div key={v.id} className="bg-[#09090b] p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-white">{v.edificios?.nombre}</p>
                        <p className="text-[10px] text-slate-400">{v.usuario_email}</p>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-1 rounded-lg">{v.etiqueta}</span>
                    </div>

                    <p className="text-xs text-slate-300 italic">"{v.comentario}"</p>

                    {v.doc_verificacion_url && (
                      <a href={v.doc_verificacion_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                        <FileText className="w-3.5 h-3.5" /> Ver Documento Subido
                      </a>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <button onClick={() => responderVerificacion(v.id, true)} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all">
                        <Check className="w-4 h-4" /> Aprobar Badges
                      </button>
                      <button onClick={() => responderVerificacion(v.id, false)} className="bg-rose-500/10 text-rose-400 font-bold px-3 py-2.5 rounded-xl text-xs active:scale-95 transition-all">
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {modalEdificioAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModalEdificioAbierto(false)}></div>
          <div className="relative bg-[#141417] rounded-[32px] w-full max-w-sm p-6 shadow-2xl">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-5 right-5 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-white mb-6">Nuevo Edificio</h3>
            
            <form onSubmit={handleGuardarEdificio} className="space-y-4">
              <input type="text" required placeholder="Nombre (Ej: Edificio Parque)" value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})} className="w-full bg-[#09090b] p-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <input type="text" required placeholder="Dirección exacta" value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})} className="w-full bg-[#09090b] p-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-2 mt-4 uppercase">Comuna</label>
                <div className="grid grid-cols-2 gap-2">
                  {comunasOpciones.map(c => (
                    <button key={c} type="button" onClick={() => setNuevoEdificio({...nuevoEdificio, comuna: c})} className={`py-3 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${nuevoEdificio.comuna === c ? 'bg-indigo-600 text-white shadow-md' : 'bg-[#09090b] text-slate-400'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-white text-black font-extrabold py-4 rounded-2xl mt-4 active:scale-95 transition-all text-xs">Crear Edificio</button>
            </form>
          </div>
        </div>
      )}

      {modalAuthAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModalAuthAbierto(false)}></div>
          <div className="relative bg-[#141417] rounded-[32px] w-full max-w-sm p-6 shadow-2xl">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-5 right-5 text-slate-400"><X className="w-5 h-5" /></button>
            
            <div className="flex bg-[#09090b] p-1.5 rounded-2xl mb-6">
              <button onClick={() => setModoAuth('login')} className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all ${modoAuth === 'login' ? 'bg-[#1a1a1f] text-white shadow' : 'text-slate-400'}`}>Entrar</button>
              <button onClick={() => setModoAuth('registro')} className={`flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all ${modoAuth === 'registro' ? 'bg-[#1a1a1f] text-white shadow' : 'text-slate-400'}`}>Registro</button>
            </div>

            {modalLegalInfo ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="text-sm font-black text-white">{modalLegalInfo.titulo}</h4>
                <div className="bg-[#09090b] p-4 rounded-2xl text-[11px] text-slate-300 leading-relaxed max-h-48 overflow-y-auto no-scrollbar font-medium whitespace-pre-line">
                  {modalLegalInfo.texto}
                </div>
                <button onClick={() => setModalLegalInfo(null)} className="w-full bg-white text-black font-extrabold py-3 rounded-xl text-xs active:scale-95 transition-all">Volver al Registro</button>
              </div>
            ) : registroExitosoMsg ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 font-bold">✓</div>
                <h4 className="text-sm font-bold text-white">¡Cuenta creada con éxito!</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Te hemos enviado un correo de confirmación. Revisa tu bandeja para activar tu cuenta.</p>
                <button onClick={() => { setRegistroExitosoMsg(false); setModalAuthAbierto(false); }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs mt-4">Entendido</button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {authError}
                  </div>
                )}
                <input type="email" required placeholder="Correo" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-[#09090b] p-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                <input type="password" required minLength={6} placeholder="Contraseña" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-[#09090b] p-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                
                {modoAuth === 'registro' && (
                  <div className="flex items-start gap-2 pt-2">
                    <input type="checkbox" required className="mt-0.5 accent-indigo-600 rounded cursor-pointer" />
                    <label className="text-[10px] text-slate-400 leading-tight">
                      Acepto los <span className="text-indigo-400 font-bold underline cursor-pointer" onClick={() => setModalLegalInfo({
                        titulo: 'Términos y Condiciones',
                        texto: '1. HabitaSantiago es una comunidad colaborativa e informativa para compartir experiencias residenciales.\n\n2. Te comprometes a publicar información respetuosa, verídica y basada en experiencias reales.'
                      })}>Términos y Condiciones</span> y la <span className="text-indigo-400 font-bold underline cursor-pointer" onClick={() => setModalLegalInfo({
                        titulo: 'Política de Privacidad',
                        texto: '1. Almacenamos únicamente tu correo electrónico para la autenticación y notificaciones de la plataforma.'
                      })}>Política de Privacidad</span>.
                    </label>
                  </div>
                )}

                <button type="submit" disabled={enviando} className="w-full bg-indigo-600 text-white font-extrabold py-4 rounded-2xl text-xs mt-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">
                  {enviando ? 'Procesando...' : (modoAuth === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {modalAlertaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModalAlertaAbierto(false)}></div>
          <div className="relative bg-[#141417] rounded-[32px] w-full max-w-xs p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><Bell className="w-6 h-6 text-indigo-400" /></div>
            <h3 className="text-lg font-black text-white mb-2">No te lo pierdas</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">Te avisaremos al correo si alguien publica disponibilidad aquí.</p>
            <form onSubmit={handleGuardarAlerta} className="space-y-3">
              <input type="email" required placeholder="tu@email.com" value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)} className="w-full bg-[#09090b] p-4 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
              <button type="submit" className="w-full bg-white text-black font-extrabold py-4 rounded-2xl">Confirmar</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}