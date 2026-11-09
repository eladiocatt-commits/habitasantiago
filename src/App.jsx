import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Star, MapPin, Building, Search, Plus, X, LogIn, LogOut, DollarSign, Camera, Heart, Home, Bell, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, Menu, Trash2, Bookmark, Settings, KeyRound, MessageSquare, ChevronDown
} from 'lucide-react';

const modernIcon = L.divIcon({
  className: 'custom-modern-marker',
  html: `
    <div style="
      width: 28px; height: 28px; 
      background: linear-gradient(135deg, #6366f1, #8b5cf6); 
      border: 2px solid #ffffff; 
      border-radius: 50% 50% 50% 0; 
      transform: rotate(-45deg); 
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.6);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -32]
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
    <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto w-full md:w-[480px] bg-[#09090b] border-l border-white/5 shadow-2xl z-40 overflow-hidden flex flex-col animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
      
      {/* HEADER PANORÁMICO (HERO) */}
      <div className="relative h-56 md:h-64 w-full flex-shrink-0 bg-slate-900 group">
        <img src={fotoFinal} alt="Portada" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button onClick={cerrar} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={(e) => toggleFavorito(edificio.id, e)} className={`p-2.5 backdrop-blur-md border rounded-full transition-all active:scale-95 ${favoritos.includes(edificio.id) ? 'bg-rose-500/20 border-rose-500/50 text-rose-500' : 'bg-black/60 border-white/10 text-white'}`}>
              <Heart className={`w-5 h-5 ${favoritos.includes(edificio.id) ? 'fill-rose-500' : ''}`} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white backdrop-blur-md rounded-lg border border-white/10 mb-2 inline-block">
            {edificio.comuna}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{edificio.nombre}</h2>
          <p className="text-xs md:text-sm text-slate-300 flex items-center gap-1.5 mt-1 font-medium truncate">
            <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" /> {edificio.direccion}
          </p>
        </div>
      </div>

      {/* CUERPO SCROLLABLE OPTIMIZADO TÁCTIL */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-5 md:p-6 pb-24 no-scrollbar">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => requerirAuth(abrirModalResena)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-4 rounded-2xl transition-all shadow-lg active:scale-95">
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-bold">Opinar</span>
          </button>
          <button onClick={() => abrirModalFoto()} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 py-3.5 px-4 rounded-2xl transition-all active:scale-95">
            <Camera className="w-4 h-4" />
            <span className="text-xs font-bold">Subir Foto</span>
          </button>
        </div>

        <div className="space-y-4 mb-6">
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
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Home className="w-5 h-5 text-emerald-500" /></div>
                <p className="text-[11px] text-slate-400 font-medium">Arriendo por Tipología</p>
              </div>
              {Object.keys(promediosArriendoPorHab).length === 0 ? (
                <p className="text-[11px] text-slate-600 italic">No hay datos registrados aún.</p>
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

        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl mb-6">
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <p className="text-lg font-black text-white leading-none">{edificio.calificacion_promedio || 'N/A'}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Calificación</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-white leading-none">{resenas.length}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Opiniones</p>
          </div>
        </div>

        {fotosComunidad.length > 0 && (
          <div className="mb-6">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fotos de Vecinos</h3>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
               {fotosComunidad.map((r, i) => (
                 <img key={i} src={r.url_imagen} alt="Vecinal" onClick={() => window.open(r.url_imagen, '_blank')} className="w-24 h-24 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
               ))}
             </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Reseñas</h3>
          <div className="space-y-4">
            {resenas.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Sin opiniones aún.</p>
            ) : (
              resenas.map((r) => {
                const yaVotado = likesUsuario.includes(r.id);
                const esMia = session?.user?.email === r.usuario_email;
                return (
                  <div key={r.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-white">{r.titulo}</h4>
                      {esMia && (
                        <button onClick={() => handleEliminarResena(r.id)} className="text-rose-500 bg-rose-500/10 p-1.5 rounded-lg">
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
                    
                    {(r.habitaciones || r.gasto_comun || r.arriendo) && (
                      <div className="flex flex-wrap gap-2 mb-3 bg-black/20 p-2 rounded-xl border border-white/5 text-[10px]">
                        {r.habitaciones && <span className="text-slate-300">🛏️ {r.habitaciones} D.</span>}
                        {r.gasto_comun && <span className="text-amber-400">GC: ${Number(r.gasto_comun).toLocaleString('es-CL')}</span>}
                        {r.arriendo && <span className="text-emerald-400">Arr: ${Number(r.arriendo).toLocaleString('es-CL')}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {r.usuario_email ? r.usuario_email.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(r.creado_en).toLocaleDateString('es-CL')}</span>
                      </div>
                      <button onClick={() => requerirAuth(() => handleDarUtil(r.id, r.util_count))} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${yaVotado ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
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

      <div className="p-4 border-t border-white/10 bg-[#09090b]/95 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20">
         <button onClick={() => requerirAuth(abrirModalAlerta)} className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
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
  const [buscadorActivo, setBuscadorActivo] = useState(false);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState(null);
  const [resenas, setResenas] = useState([]);
  
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

  const resetearApp = () => {
    setEdificioSeleccionado(null);
    setBusqueda('');
    setFiltroComuna('todas');
    setFiltroRating(false);
  };

  const esAdmin = session?.user?.email === 'eladiocatt@gmail.com';

  return (
    <div className="w-screen h-[100dvh] overflow-hidden bg-[#09090b] font-sans relative text-slate-200 selection:bg-indigo-500 selection:text-white flex">
      
      {mensajeNotificacion && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-white text-black px-5 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl shadow-black/50 animate-in slide-in-from-top-4 font-bold text-xs">
          {mensajeNotificacion.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          {mensajeNotificacion.texto}
        </div>
      )}

      {/* ÁREA DE MAPA (Ocupa toda la pantalla en móvil, o se ajusta si hay panel abierto en PC) */}
      <div className="relative w-full h-full">
        
        {/* HEADER FLOTANTE TÁCTIL OPTIMIZADO */}
        <header className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between gap-3 pointer-events-none">
          
          <div className="pointer-events-auto flex items-center gap-2 w-full max-w-md">
             <div onClick={resetearApp} className="bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all">
               <Building className="w-5 h-5 text-white" />
             </div>

             <div className="relative w-full">
               <div className="bg-[#09090b]/90 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-2xl flex items-center focus-within:border-indigo-500/50 transition-all">
                 <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
                 <input 
                   type="text" 
                   placeholder="Buscar edificio..." 
                   value={busqueda} 
                   onChange={(e) => setBusqueda(e.target.value)} 
                   onFocus={() => setBuscadorActivo(true)}
                   onBlur={() => setTimeout(() => setBuscadorActivo(false), 200)}
                   className="bg-transparent text-xs text-white focus:outline-none w-full font-medium" 
                 />
               </div>
               
               {busqueda && buscadorActivo && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-60 overflow-y-auto">
                   {edificiosFiltrados.length > 0 ? (
                     edificiosFiltrados.slice(0, 5).map(ed => (
                       <div key={ed.id} onClick={() => { setEdificioSeleccionado(ed); setBusqueda(''); setBuscadorActivo(false); }} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-0">
                         <div>
                           <p className="text-xs font-bold text-white">{ed.nombre}</p>
                           <p className="text-[10px] text-slate-400">{ed.direccion}</p>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="px-4 py-3 text-xs text-slate-400 italic">Sin resultados.</div>
                   )}
                 </div>
               )}
             </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => { if(!session){setModoAuth('login'); setModalAuthAbierto(true);} else {setSidebarAbierto(true);} }} className="bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl text-white hover:bg-white/10 transition-all shadow-2xl active:scale-95">
               {session ? <Menu className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* FILTROS FLOTANTES INFERIORES */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none w-full max-w-sm px-4">
          <div className="pointer-events-auto bg-[#09090b]/95 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            <button onClick={() => setFiltroComuna('todas')} className={`px-3.5 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'todas' ? 'bg-white text-black' : 'text-slate-400'}`}>Todas</button>
            <button onClick={() => setFiltroComuna('Santiago Centro')} className={`px-3.5 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Santiago Centro' ? 'bg-white text-black' : 'text-slate-400'}`}>Stgo Centro</button>
            <button onClick={() => setFiltroComuna('Providencia')} className={`px-3.5 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${filtroComuna === 'Providencia' ? 'bg-white text-black' : 'text-slate-400'}`}>Providencia</button>
            <button onClick={() => setFiltroRating(!filtroRating)} className={`px-3 py-2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${filtroRating ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}>
              <Star size={11} className={filtroRating ? 'fill-amber-400' : ''} /> 4.0+
            </button>
          </div>
        </div>

        {/* MAPA */}
        <MapContainer center={[-33.4489, -70.6693]} zoom={13} style={{ width: '100%', height: '100%', backgroundColor: '#09090b' }} zoomControl={false}>
          <style>{`
            .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
            .leaflet-popup-content-wrapper, .leaflet-popup-tip {
              background-color: #18181b !important;
              color: #f8fafc !important;
              border: 1px solid rgba(255,255,255,0.1) !important;
            }
            .leaflet-container a.leaflet-popup-close-button { color: #94a3b8 !important; }
            .leaflet-popup-content { margin: 10px !important; }
          `}</style>
          
          <MapResizer edificioSeleccionado={edificioSeleccionado} />
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {edificiosFiltrados.map((edificio) => (
            <Marker key={edificio.id} position={[parseFloat(edificio.latitud), parseFloat(edificio.longitud)]} icon={modernIcon} eventHandlers={{ click: () => setEdificioSeleccionado(edificio) }}>
              <Popup>
                <div>
                  <h4 className="font-bold text-xs text-white">{edificio.nombre}</h4>
                  <div className="text-[10px] text-amber-500 font-bold mt-0.5">★ {edificio.calificacion_promedio || 'Sin notas'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* PANEL LATERAL DE EDIFICIO */}
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

      {/* MENÚ LATERAL */}
      {sidebarAbierto && (
        <div className="fixed inset-0 z-[99999] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarAbierto(false)}></div>
          <div className="relative w-full max-w-xs bg-[#09090b] h-full shadow-2xl border-l border-white/5 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 pb-0 flex justify-between items-center">
              <h2 className="text-base font-black text-white">Mi Cuenta</h2>
              <button onClick={() => setSidebarAbierto(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-black text-lg">
                  {nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-white text-sm truncate">{nombreUsuario || 'Usuario'}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <button onClick={() => setVistaSidebar('perfil')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${vistaSidebar === 'perfil' ? 'bg-white/10 text-white' : 'text-slate-400'}`}><Settings className="w-4 h-4" /> Perfil</button>
                <button onClick={() => setVistaSidebar('password')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${vistaSidebar === 'password' ? 'bg-white/10 text-white' : 'text-slate-400'}`}><KeyRound className="w-4 h-4" /> Seguridad</button>
                <button onClick={() => setVistaSidebar('favoritos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${vistaSidebar === 'favoritos' ? 'bg-white/10 text-white' : 'text-slate-400'}`}><Bookmark className="w-4 h-4" /> Guardados ({favoritos.length})</button>
                <button onClick={() => { setModalEdificioAbierto(true); setSidebarAbierto(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/10"><Plus className="w-4 h-4" /> Nuevo Edificio</button>
                {esAdmin && <button onClick={cargarAlertasAdmin} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-amber-500"><ShieldAlert className="w-4 h-4" /> Admin Leads</button>}
              </div>

              {vistaSidebar === 'perfil' && (
                <div className="space-y-3">
                  <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white" />
                  <button onClick={() => mostrarAviso('¡Perfil actualizado!')} className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-xs">Guardar</button>
                </div>
              )}

              {vistaSidebar === 'password' && (
                <form onSubmit={handleCambiarPasswordSidebar} className="space-y-3">
                  <input type="password" required minLength={6} placeholder="Nueva contraseña" value={nuevaPasswordSidebar} onChange={(e) => setNuevaPasswordSidebar(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white" />
                  <button type="submit" className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-xs">Actualizar</button>
                </form>
              )}

              {vistaSidebar === 'favoritos' && (
                <div className="space-y-2">
                  {favoritos.length === 0 ? <p className="text-xs text-slate-500">Sin favoritos.</p> : edificios.filter(e => favoritos.includes(e.id)).map(ed => (
                    <div key={ed.id} onClick={() => { setEdificioSeleccionado(ed); setSidebarAbierto(false); }} className="bg-white/5 p-3 rounded-xl cursor-pointer">
                      <div className="font-bold text-white text-xs">{ed.nombre}</div>
                      <div className="text-[10px] text-slate-400">{ed.comuna}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-white/5">
              <button onClick={handleCerrarSesion} className="w-full flex items-center justify-center gap-2 text-rose-500 font-bold py-2.5 rounded-xl text-xs bg-rose-500/10">
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES TÁCTILES */}
      {modalAuthAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAuthAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
            <button onClick={() => setModalAuthAbierto(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            
            <div className="flex bg-black/50 p-1 rounded-xl mb-5">
              <button onClick={() => setModoAuth('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${modoAuth === 'login' ? 'bg-white text-black' : 'text-slate-400'}`}>Entrar</button>
              <button onClick={() => setModoAuth('registro')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${modoAuth === 'registro' ? 'bg-white text-black' : 'text-slate-400'}`}>Registro</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authError && <div className="p-2.5 bg-rose-500/10 text-rose-400 text-xs rounded-xl">{authError}</div>}
              <input type="email" required placeholder="Correo" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 px-3.5 py-3 rounded-xl text-xs text-white" />
              <input type="password" required minLength={6} placeholder="Contraseña" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 px-3.5 py-3 rounded-xl text-xs text-white" />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl text-xs mt-1">{modoAuth === 'login' ? 'Entrar' : 'Registrarse'}</button>
            </form>
          </div>
        </div>
      )}

      {modalResenaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalResenaAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-sm p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setModalResenaAbierto(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-black text-white mb-1">Escribir Reseña</h3>
            <p className="text-[11px] text-indigo-400 font-bold mb-4">{edificioSeleccionado?.nombre}</p>

            <form onSubmit={handleGuardarResena} className="space-y-3.5 text-xs">
              <input type="text" required placeholder="Título (Ej: Muy tranquilo)" value={nuevaResena.titulo} onChange={(e) => setNuevaResena({...nuevaResena, titulo: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
              <select value={nuevaResena.etiqueta} onChange={(e) => setNuevaResena({...nuevaResena, etiqueta: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white">
                <option value="Excelente conectividad al metro" className="bg-[#18181b]">🚇 Excelente conectividad</option>
                <option value="Ascensores rápidos y bien mantenidos" className="bg-[#18181b]">🛗 Ascensores rápidos</option>
                <option value="Zona muy segura y tranquila" className="bg-[#18181b]">🛡️ Zona segura</option>
                <option value="Problemas frecuentes con ruidos" className="bg-[#18181b]">🔊 Problemas con ruidos</option>
              </select>
              <textarea required rows="3" placeholder="Comentario..." value={nuevaResena.comentario} onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white resize-none" />
              
              <div className="bg-white/5 p-3 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold">💰 Costos (Opcional)</span>
                  <input type="checkbox" checked={incluirDatosEconomicos} onChange={(e) => setIncluirDatosEconomicos(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                </label>
                {incluirDatosEconomicos && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <select value={nuevaResena.habitaciones} onChange={(e) => setNuevaResena({...nuevaResena, habitaciones: e.target.value})} className="bg-black/50 border border-white/10 p-2 rounded-lg text-[10px]">
                      <option value="1">1 D</option><option value="2">2 D</option><option value="3">3 D</option>
                    </select>
                    <input type="number" placeholder="GC ($)" value={nuevaResena.gasto_comun} onChange={(e) => setNuevaResena({...nuevaResena, gasto_comun: e.target.value})} className="bg-black/50 border border-white/10 p-2 rounded-lg text-[10px]" />
                    <input type="number" placeholder="Arriendo" value={nuevaResena.arriendo} onChange={(e) => setNuevaResena({...nuevaResena, arriendo: e.target.value})} className="bg-black/50 border border-white/10 p-2 rounded-lg text-[10px]" />
                  </div>
                )}
              </div>

              <input type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files[0])} className="w-full text-[11px] text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white" />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl mt-1">Publicar</button>
            </form>
          </div>
        </div>
      )}

      {modalEdificioAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalEdificioAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-xs p-5 shadow-2xl">
            <button onClick={() => setModalEdificioAbierto(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-black text-white mb-4">Nuevo Edificio</h3>
            
            <form onSubmit={handleGuardarEdificio} className="space-y-3.5 text-xs">
              <input type="text" required placeholder="Nombre (Ej: Edificio Parque)" value={nuevoEdificio.nombre} onChange={(e) => setNuevoEdificio({...nuevoEdificio, nombre: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
              <input type="text" required placeholder="Dirección exacta" value={nuevoEdificio.direccion} onChange={(e) => setNuevoEdificio({...nuevoEdificio, direccion: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
              <select value={nuevoEdificio.comuna} onChange={(e) => setNuevoEdificio({...nuevoEdificio, comuna: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white">
                <option value="Santiago Centro" className="bg-[#18181b]">Santiago Centro</option>
                <option value="Providencia" className="bg-[#18181b]">Providencia</option>
                <option value="Ñuñoa" className="bg-[#18181b]">Ñuñoa</option>
                <option value="Las Condes" className="bg-[#18181b]">Las Condes</option>
              </select>
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl mt-1">Crear Edificio</button>
            </form>
          </div>
        </div>
      )}

      {modalAlertaAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAlertaAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-xs p-5 shadow-2xl">
            <button onClick={() => setModalAlertaAbierto(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-black text-white mb-1">Alerta de Arriendo</h3>
            <p className="text-xs text-slate-400 mb-4">Te avisaremos si hay disponibilidad en este edificio.</p>
            <form onSubmit={handleGuardarAlerta} className="space-y-3.5 text-xs">
              <input type="email" required placeholder="tu@email.com" value={correoAlerta} onChange={(e) => setCorreoAlerta(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white" />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl">Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {modalFotoAbierto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalFotoAbierto(false)}></div>
          <div className="relative bg-[#18181b] border border-white/10 rounded-3xl w-full max-w-xs p-5 shadow-2xl">
            <button onClick={() => setModalFotoAbierto(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-black text-white mb-2">Aportar Foto</h3>
            <form onSubmit={handleGuardarFotoRapida} className="space-y-3.5 text-xs">
              <input type="file" accept="image/*" required onChange={(e) => setArchivoFotoRapida(e.target.files[0])} className="w-full text-slate-400 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white" />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl">Subir</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}