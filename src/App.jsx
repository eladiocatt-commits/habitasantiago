import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, PlusCircle, Camera, Heart, Home, Bell, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, Menu, User, Trash2, Bookmark, Settings, KeyRound, ChevronRight, MessageSquare
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapResizer({ edificioSeleccionado }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => { map.invalidateSize(true); }, 300);
    
    // Si se selecciona un edificio, centrar el mapa ligeramente a la izquierda en desktop
    if (edificioSeleccionado && window.innerWidth > 768) {
      map.setView([parseFloat(edificioSeleccionado.latitud), parseFloat(edificioSeleccionado.longitud)], 15, { animate: true });
    }
    return () => clearTimeout(timer);
  }, [map, edificioSeleccionado]);
  return null;
}

// COMPONENTE: PANEL LATERAL DE EDIFICIO (WORLD CLASS)
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

  const { promedioGasto, promediosArriendoPorHab } = promedios;
  const fotosComunidad = resenas.filter(r => r.url_imagen);

  const requerirAuth = (accion) => {
    if (!session) { setModoAuth('login'); setModalAuthAbierto(true); } else { accion(); }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#09090b] border-l border-white/5 shadow-2xl z-40 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* HEADER PANORÁMICO (HERO) */}
      <div className="relative h-64 w-full flex-shrink-0 bg-slate-900 group">
        <img src={fotoFinal} alt="Portada" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent"></div>
        
        {/* Controles Flotantes Superiores */}
        <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
          <button onClick={cerrar} className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={(e) => toggleFavorito(edificio.id, e)} className={`p-2 backdrop-blur-md border rounded-full transition-all ${favoritos.includes(edificio.id) ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 'bg-black/40 hover:bg-black/60 border-white/10 text-white'}`}>
              <Heart className={`w-5 h-5 ${favoritos.includes(edificio.id) ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Título y Dirección sobre la imagen */}
        <div className="absolute bottom-5 left-6 right-6 z-10">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white backdrop-blur-md rounded-lg border border-white/10 mb-2 inline-block">
            {edificio.comuna}
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">{edificio.nombre}</h2>
          <p className="text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium">
            <MapPin className="w-4 h-4 text-indigo-400" /> {edificio.direccion}
          </p>
        </div>
      </div>

      {/* CUERPO SCROLLABLE DEL PANEL */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        {/* Acciones Principales */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button onClick={() => requerirAuth(abrirModalResena)} className="flex flex-col items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:scale-[1.02]">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-bold">Opinar</span>
          </button>
          <button onClick={() => abrirModalFoto()} className="flex flex-col items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 p-3 rounded-2xl transition-all hover:scale-[1.02]">
            <Camera className="w-5 h-5" />
            <span className="text-xs font-bold">Subir Foto</span>
          </button>
        </div>

        {/* Bento Grid: Datos Financieros */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Información Financiera</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-amber-500" /></div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Gasto Común Promedio</p>
                  <p className="text-base font-black text-white mt-0.5">{promedioGasto}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Home className="w-5 h-5 text-emerald-500" /></div>
                <p className="text-[11px] text-slate-400 font-medium">Arriendo por Tipología</p>
              </div>
              {Object.keys(promediosArriendoPorHab).length === 0 ? (
                <p className="text-[11px] text-slate-600 italic">No hay datos registrados por los vecinos.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(promediosArriendoPorHab).map(([hab, monto]) => (
                    <div key={hab} className="bg-black/20 rounded-xl p-2.5 text-center border border-white/5">
                      <div className="text-[10px] text-slate-400 font-bold mb-1">{hab} Dorm</div>
                      <div className="text-xs font-black text-emerald-400">{monto}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calificación Global */}
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl mb-8">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <p className="text-lg font-black text-white leading-none">{edificio.calificacion_promedio || 'N/A'}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Calificación Vecinal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-white leading-none">{resenas.length}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Opiniones Totales</p>
          </div>
        </div>

        {/* Galería Comunitaria Mini */}
        {fotosComunidad.length > 0 && (
          <div className="mb-8">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fotos de Vecinos</h3>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
               {fotosComunidad.map((r, i) => (
                 <img key={i} src={r.url_imagen} alt="Vecinal" onClick={() => window.open(r.url_imagen, '_blank')} className="w-24 h-24 rounded-2xl object-cover border border-white/10 cursor-pointer hover:border-indigo-500 transition-all flex-shrink-0" />
               ))}
             </div>
          </div>
        )}

        {/* Opiniones Detailed List */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Últimas Reseñas</h3>
          <div className="space-y-4">
            {resenas.length === 0 ? (
              <p className="text-sm text-slate-600 italic">Este edificio aún no tiene opiniones. Sé el primero.</p>
            ) : (
              resenas.map((r) => {
                const yaVotado = likesUsuario.includes(r.id);
                const esMia = session?.user?.email === r.usuario_email;
                return (
                  <div key={r.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-white">{r.titulo}</h4>
                      {esMia && (
                        <button onClick={() => handleEliminarResena(r.id)} className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1.5 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {r.etiqueta && (
                      <span className="inline-block bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-500/20 mb-2">
                        {r.etiqueta}
                      </span>
                    )}
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{r.comentario}</p>
                    
                    {/* Datos adjuntos en la reseña */}
                    {(r.habitaciones || r.gasto_comun || r.arriendo) && (
                      <div className="flex flex-wrap gap-2 mb-3 bg-black/20 p-2 rounded-xl border border-white/5 text-[10px]">
                        {r.habitaciones && <span className="text-slate-300">🛏️ {r.habitaciones} D.</span>}
                        {r.gasto_comun && <span className="text-amber-400/80">GC: ${Number(r.gasto_comun).toLocaleString('es-CL')}</span>}
                        {r.arriendo && <span className="text-emerald-400/80">Arr: ${Number(r.arriendo).toLocaleString('es-CL')}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {r.usuario_email ? r.usuario_email.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">{new Date(r.creado_en).toLocaleDateString('es-CL')}</span>
                      </div>
                      <button onClick={() => requerirAuth(() => handleDarUtil(r.id, r.util_count))} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${yaVotado ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <ThumbsUp className={`w-3 h-3 ${yaVotado ? 'fill-white' : ''}`} /> {r.util_count || 0}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Footer Fijo del Panel */}
      <div className="p-4 border-t border-white/10 bg-[#09090b]/90 backdrop-blur-xl">
         <button onClick={() => requerirAuth(abrirModalAlerta)} className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2">
           <Bell className="w-4 h-4" /> Recibir alertas de arriendos
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
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);
  const [resenas, setResenas] = useState([]);
  
  const [filtroComuna, setFiltroComuna] = useState('todas');
  const [filtroRating, setFiltroRating] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [likesUsuario, setLikesUsuario] = useState([]);

  // Modales y Estados UI
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

  // Formularios
  const [listaAlertas, setListaAlertas] = useState([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [registroExitosoMsg, setRegistroExitosoMsg] = useState(false);
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [nuevaResena, setNuevaResena] = useState({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro' });
  const [correoAlerta, setCorreoAlerta] = useState('');
  const [archivoFotoRapida, setArchivoFotoRapida] = useState(null);
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

  // Auth & Submits (Acortados para limpieza visual, misma lógica)
  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setEnviando(true); setAuthError('');
    if (modoAuth === 'registro') { const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { emailRedirectTo: window.location.origin } }); if (error) setAuthError(error.message); else setRegistroExitosoMsg(true); } 
    else if (modoAuth === 'login') { const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); if (error) setAuthError('Credenciales incorrectas.'); else { setModalAuthAbierto(false); mostrarAviso('¡Bienvenido de vuelta!'); } } 
    else if (modoAuth === 'recuperar') { const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin }); if (error) setAuthError(error.message); else setRecuperacionEnviada(true); }
    setEnviando(false);
  };

  const handleCambiarPasswordSidebar = async (e) => { e.preventDefault(); if (!nuevaPasswordSidebar) return; setEnviando(true); const { error } = await supabase.auth.updateUser({ password: nuevaPasswordSidebar }); if (!error) { mostrarAviso('¡Contraseña actualizada!'); setNuevaPasswordSidebar(''); } setEnviando(false); };
  const handleCerrarSesion = async () => { await supabase.auth.signOut(); setSidebarAbierto(false); mostrarAviso('Sesión cerrada.'); };

  const handleGuardarResena = async (e) => {
    e.preventDefault(); if (!edificioSeleccionado || !session) return; setEnviando(true);
    let fotoUrl = null;
    if (archivoFoto) {
      const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(`resenas/${Math.random()}.${archivoFoto.name.split('.').pop()}`, archivoFoto);
      if (!uploadError) { const { data } = supabase.storage.from('fotos-edificios').getPublicUrl(`resenas/${Math.random()}.${archivoFoto.name.split('.').pop()}`); fotoUrl = data?.publicUrl || null; }
    }
    const objetoResena = { edificio_id: edificioSeleccionado.id, titulo: nuevaResena.titulo, comentario: nuevaResena.comentario, nota_ruido: parseInt(nuevaResena.nota_ruido)||3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: parseInt(nuevaResena.nota_seguridad)||3, etiqueta: nuevaResena.etiqueta, url_imagen: fotoUrl, usuario_email: session.user.email, util_count: 0 };
    if (incluirDatosEconomicos) { objetoResena.habitaciones = parseInt(nuevaResena.habitaciones)||1; objetoResena.gasto_comun = parseFloat(nuevaResena.gasto_comun)||null; objetoResena.arriendo = parseFloat(nuevaResena.arriendo)||null; }
    const { error } = await supabase.from('resenas').insert([objetoResena]);
    if (!error) { setModalResenaAbierto(false); setArchivoFoto(null); setIncluirDatosEconomicos(false); setNuevaResena({ titulo: '', comentario: '', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, gasto_comun: '', arriendo: '', habitaciones: '1', etiqueta: 'Excelente conectividad al metro' }); const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false }); setResenas(res.data || []); cargarEdificios(); mostrarAviso('¡Opinión publicada!'); }
    setEnviando(false);
  };

  const handleGuardarAlerta = async (e) => { e.preventDefault(); if (!correoAlerta) return; setEnviando(true); const { error } = await supabase.from('alertas_arriendo').insert([{ edificio_id: edificioSeleccionado.id, correo: correoAlerta }]); if (!error) { mostrarAviso('Alerta activada'); setCorreoAlerta(''); setModalAlertaAbierto(false); } setEnviando(false); };
  const handleGuardarFotoRapida = async (e) => {
    e.preventDefault(); if (!edificioSeleccionado || !session || !archivoFotoRapida) return; setEnviando(true);
    const { error: uploadError } = await supabase.storage.from('fotos-edificios').upload(`resenas/${Math.random()}.${archivoFotoRapida.name.split('.').pop()}`, archivoFotoRapida);
    let fotoUrl = null; if (!uploadError) { const { data } = supabase.storage.from('fotos-edificios').getPublicUrl(`resenas/${Math.random()}.${archivoFotoRapida.name.split('.').pop()}`); fotoUrl = data?.publicUrl; }
    const { error } = await supabase.from('resenas').insert([{ edificio_id: edificioSeleccionado.id, titulo: 'Foto de fachada', comentario: 'Aporte fotográfico.', nota_ruido: 3, nota_administracion: 3, nota_gastos_comunes: 3, nota_seguridad: 3, url_imagen: fotoUrl, usuario_email: session.user.email, es_verificado: true }]);
    if (!error) { setModalFotoAbierto(false); setArchivoFotoRapida(null); const res = await supabase.from('resenas').select('*').eq('edificio_id', edificioSeleccionado.id).order('creado_en', { ascending: false }); setResenas(res.data || []); cargarEdificios(); mostrarAviso('¡Foto actualizada!'); }
    setEnviando(false);
  };

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
    const matchRating = !filtroRating || (e.calificacion_promedio >= 4.0);
    return matchTexto && matchComuna && matchRating;
  });

  const esAdmin = session?.user?.email === 'eladiocatt@gmail.com';

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#09090b] font-sans relative text-slate-200 selection:bg-indigo-500 selection:text-white flex">
      
      {mensajeNotificacion && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[99999] bg-white text-black px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-black/50 animate-in slide-in-from-top-4 font-bold text-xs tracking-wide">
          {mensajeNotificacion.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          {mensajeNotificacion.texto}
        </div>
      )}

      {/* ÁREA IZQUIERDA: MAPA Y CONTROLES FLOTANTES */}
      <div className={`relative h-full transition-all duration-500 ease-in-out ${edificioSeleccionado ? 'w-full md:w-[calc(100%-480px)]' : 'w-full'}`}>
        
        {/* HEADER FLOTANTE MINIMALISTA */}
        <header className="absolute top-6 left-6 right-6 z-30 flex items-start justify-between gap-4 pointer-events-none">
          
          {/* Logo y Buscador */}
          <div className="pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full max-w-md">
             <div className="bg-[#09090b]/80 backdrop-blur-xl border border-white/10 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 hover:border-white/20 transition-all cursor-pointer group" onClick={() => setEdificioSeleccionado(null)}>
               <div className="bg-white text-black p-1.5 rounded-lg shadow-md group-hover:scale-110 transition-transform"><Building className="w-4 h-4" /></div>
               <h1 className="text-sm font-black tracking-tight text-white">HabitaSantiago</h1>
             </div>

             <div className="bg-[#09090b]/80 backdrop-blur-xl border border-white/10 px-4 py-3.5 rounded-2xl shadow-2xl flex items-center w-full focus-within:border-indigo-500/50 transition-all">
               <Search className="w-4 h-4 text-slate-400 mr-3" />
               <input type="text" placeholder="Buscar comuna o edificio..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-transparent text-xs text-white focus:outline-none w-full font-medium" />
             </div>
          </div>

          {/* Menú de Usuario */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => { if(!session){setModoAuth('login'); setModalAuthAbierto(true);} else {setModalEdificioAbierto(true);} }} className="hidden sm:flex bg-white hover:bg-slate-200 text-black text-xs font-bold px-4 py-3 rounded-2xl items-center gap-2 transition-all shadow-lg hover:scale-105">
              <Plus className="w-4 h-4" /> Nuevo Edificio
            </button>
            <button onClick={() => { if(!session){setModoAuth('login'); setModalAuthAbierto(true);} else {setSidebarAbierto(true);} }} className="bg-[#09090b]/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-white hover:bg-white/10 transition-all shadow-2xl">
               {session ? <Menu className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* FILTROS FLOTANTES INFERIORES */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none w-full max-w-lg px-4">
          <div className="pointer-events-auto bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl shadow-black flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            <button onClick={() => setFiltroComuna('todas')} className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'todas' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>Todas</button>
            <button onClick={() => setFiltroComuna('Santiago Centro')} className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Santiago Centro' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>Stgo Centro</button>
            <button onClick={() => setFiltroComuna('Providencia')} className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Providencia' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>Providencia</button>
            <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
            <button onClick={() => setFiltroRating(!filtroRating)} className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${filtroRating ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>
              <Star size={12} className={filtroRating ? 'fill-amber-400' : ''} /> 4.0+
            </button>
          </div>
        </div>

        {/* MAPA */}
        <MapContainer center={[-33.4489, -70.6693]} zoom={13} style={{ width: '100%', height: '100%', backgroundColor: '#09090b' }} zoomControl={false}>
          <MapResizer edificioSeleccionado={edificioSeleccionado} />
          {/* Se utiliza un TileLayer oscuro premium de CartoDB (gratis y hermoso para modo oscuro) */}
          <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {edificiosFiltrados.map((edificio) => (
            <Marker key={edificio.id} position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]} eventHandlers={{ click: () => setEdificioSeleccionado(edificio) }}>
              <Popup className="premium-popup">
                <div className="p-1">
                  <h4 className="font-bold text-sm text-slate-900">{edificio.nombre}</h4>
                  <div className="text-[11px] text-amber-600 font-bold mt-1">★ {edificio.calificacion_promedio || 'Sin notas'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ÁREA DERECHA: PANEL LATERAL DEL EDIFICIO */}
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

      {/* MENÚ DE USUARIO (DRAWER IZQUIERDO) */}
      {sidebarAbierto && (
        <div className="fixed inset-0 z-[99999] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarAbierto(false)}></div>
          <div className="relative w-full max-w-sm bg-[#09090b] h-full shadow-2xl border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 pb-0 flex justify-between items-center">
              <h2 className="text-lg font-black text-white">Mi Cuenta</h2>
              <button onClick={() => setSidebarAbierto(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center font-black text-xl">
                  {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{nombreUsuario || 'Usuario'}</h3>
                  <p className="text-xs text-slate-400">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <button onClick={() => setVistaSidebar('perfil')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${vistaSidebar === 'perfil' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}><Settings className="w-4 h-4" /> Mi Perfil</button>
                <button onClick={() => setVistaSidebar('password')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${vistaSidebar === 'password' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}><KeyRound className="w-4 h-4" /> Seguridad</button>
                <button onClick={() => setVistaSidebar('favoritos')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${vistaSidebar === 'favoritos' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}><Bookmark className="w-4 h-4" /> Guardados ({favoritos.length})</button>
                {esAdmin && <button onClick={cargarAlertasAdmin} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-amber-500 hover:bg-amber-500/10 transition-all"><ShieldAlert className="w-4 h-4" /> Admin Leads</button>}
              </div>

              {/* Vistas Dinámicas del Menú */}
              {vistaSidebar === 'perfil' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-bold mb-2">Nombre Público</label>
                    <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={() => mostrarAviso('¡Perfil actualizado!')} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Guardar Cambios</button>
                </div>
              )}

              {vistaSidebar === 'password' && (
                <form onSubmit={handleCambiarPasswordSidebar} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-bold mb-2">Nueva Contraseña</label>
                    <input type="password" required minLength={6} value={nuevaPasswordSidebar} onChange={(e) => setNuevaPasswordSidebar(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <button type="submit" disabled={enviando} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">{enviando ? 'Guardando...' : 'Actualizar'}</button>
                </form>
              )}

              {vistaSidebar === 'favoritos' && (
                <div className="space-y-3">
                  {favoritos.length === 0 ? <p className="text-sm text-slate-500">No hay guardados.</p> : edificios.filter(e => favoritos.includes(e.id)).map(ed => (
                    <div key={ed.id} onClick={() => { setEdificioSeleccionado(ed); setSidebarAbierto(false); }} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 cursor-pointer transition-colors">
                      <div className="font-bold text-white text-sm">{ed.nombre}</div>
                      <div className="text-xs text-slate-400 mt-1">{ed.comuna}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-auto p-6">
              <button onClick={handleCerrarSesion} className="w-full flex items-center justify-center gap-2 text-rose-500 font-bold py-3 rounded-xl hover:bg-rose-500/10 transition-colors">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALES (Con diseño renovado minimalista tipo iOS/Vercel) --- */}
      
      {/* MODAL AUTH */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAuthAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            
            {modoAuth !== 'recuperar' && (
              <div className="flex bg-black/50 p-1 rounded-xl mb-6">
                <button onClick={() => { setModoAuth('login'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modoAuth === 'login' ? 'bg-white text-black' : 'text-slate-400'}`}>Entrar</button>
                <button onClick={() => { setModoAuth('registro'); setAuthError(''); setRegistroExitosoMsg(false); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${modoAuth === 'registro' ? 'bg-white text-black' : 'text-slate-400'}`}>Registro</button>
              </div>
            )}

            {recuperacionEnviada || registroExitosoMsg ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-6 h-6" /></div>
                <h3 className="text-white font-bold text-lg mb-2">{recuperacionEnviada ? 'Correo Enviado' : 'Registro Exitoso'}</h3>
                <p className="text-sm text-slate-400 mb-6">Revisa tu bandeja de entrada.</p>
                <button onClick={() => { setModoAuth('login'); setRecuperacionEnviada(false); setRegistroExitosoMsg(false); }} className="w-full bg-white text-black py-3 rounded-xl font-bold">Volver</button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">{authError}</div>}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Correo</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                {modoAuth !== 'recuperar' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Contraseña</label>
                    <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                )}
                {modoAuth === 'login' && <div className="text-right"><button type="button" onClick={() => setModoAuth('recuperar')} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">¿Olvidaste tu clave?</button></div>}
                
                <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 rounded-xl mt-2 transition-colors">
                  {enviando ? 'Cargando...' : modoAuth === 'login' ? 'Iniciar Sesión' : modoAuth === 'registro' ? 'Crear Cuenta' : 'Enviar Link'}
                </button>
                {modoAuth === 'recuperar' && <button type="button" onClick={() => setModoAuth('login')} className="w-full text-xs text-slate-400 font-bold mt-4">Volver</button>}
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL RESEÑA */}
      {modalResenaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalResenaAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
            <button onClick={() => setModalResenaAbierto(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-white mb-1">Escribir Reseña</h3>
            <p className="text-xs text-indigo-400 font-bold mb-6">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Título</label>
                <input type="text" required placeholder="Ej: Excelente conectividad" value={nuevaResena.titulo} onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Etiqueta Principal</label>
                <select value={nuevaResena.etiqueta} onChange={(e) => setNuevaResena({...nuevaResena, etiqueta: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none">
                  <option value="Excelente conectividad al metro">🚇 Excelente conectividad</option>
                  <option value="Ascensores rápidos y bien mantenidos">🛗 Ascensores rápidos</option>
                  <option value="Zona muy segura y tranquila">🛡️ Zona segura</option>
                  <option value="Problemas frecuentes con ruidos">🔊 Problemas con ruidos</option>
                  <option value="Gastos comunes elevados">💰 Gastos comunes altos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Experiencia</label>
                <textarea required rows="3" placeholder="Detalla tu experiencia..." value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-bold text-white">💰 Agregar datos de costo (Opcional)</span>
                  <input type="checkbox" checked={incluirDatosEconomicos} onChange={(e) => setIncluirDatosEconomicos(e.target.checked)} className="w-4 h-4 rounded" />
                </label>
                {incluirDatosEconomicos && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Dormitorios</label>
                      <select value={nuevaResena.habitaciones} onChange={(e) => setNuevaResena({...nuevaResena, habitaciones: e.target.value})} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-xs text-white">
                        <option value="1">1 D</option><option value="2">2 D</option><option value="3">3 D</option><option value="4">4+ D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">GC ($)</label>
                      <input type="number" placeholder="Ej: 90000" value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Arriendo ($)</label>
                      <input type="number" placeholder="Ej: 450000" value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})} className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-xs text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Foto Adjunta (Opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files[0])} className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 transition-all cursor-pointer" />
              </div>

              <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 text-black font-black py-3.5 rounded-xl transition-colors mt-2">
                {enviando ? 'Guardando...' : 'Publicar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVO EDIFICIO */}
      {modalEdificioAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalEdificioAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-white mb-6">Nuevo Edificio</h3>
            
            <form onSubmit={handleGuardarEdificio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Nombre</label>
                <input type="text" required placeholder="Ej: Edificio Parque" value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Dirección</label>
                <input type="text" required placeholder="Ej: Av. Bustamante 456" value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Comuna</label>
                <select value={nuevoEdificio.comuna} onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none">
                  <option value="Santiago Centro">Santiago Centro</option><option value="Providencia">Providencia</option><option value="Ñuñoa">Ñuñoa</option><option value="Las Condes">Las Condes</option>
                </select>
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 text-black font-black py-3.5 rounded-xl transition-colors mt-2">{enviando ? 'Procesando...' : 'Crear Edificio'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ALERTA */}
      {modalAlertaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAlertaAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setModalAlertaAbierto(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-white mb-2">Alerta de Arriendo</h3>
            <p className="text-sm text-slate-400 mb-6">Te avisaremos al correo si hay disponibilidad en <span className="text-white font-bold">{edificioSeleccionado?.nombre}</span>.</p>
            <form onSubmit={handleGuardarAlerta} className="space-y-4">
              <input type="email" required placeholder="tu@email.com" value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)} className="w-full bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
              <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 text-black font-black py-3.5 rounded-xl transition-colors">{enviando ? 'Guardando...' : 'Confirmar Alerta'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR FOTO */}
      {modalFotoAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalFotoAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <button onClick={() => setModalFotoAbierto(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-white mb-2">Aportar Foto</h3>
            <p className="text-sm text-slate-400 mb-6">Sube una foto de la fachada o áreas comunes de este edificio.</p>
            <form onSubmit={handleGuardarFotoRapida} className="space-y-4">
              <input type="file" accept="image/*" required onChange={(e) => setArchivoFotoRapida(e.target.files[0])} className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-white/10 file:text-white file:font-bold hover:file:bg-white/20 transition-all cursor-pointer" />
              <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 text-black font-black py-3.5 rounded-xl transition-colors">{enviando ? 'Subiendo...' : 'Publicar Foto'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}