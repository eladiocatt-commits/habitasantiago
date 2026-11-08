import React, { useState } from 'react';
import { MapPin, Star, DollarSign, Filter, ChevronUp, Navigation } from 'lucide-react';

export default function HabitaMapUI() {
  // Estado para simular el edificio seleccionado al hacer clic en el mapa
  const [selectedBuilding, setSelectedBuilding] = useState({
    nombre: "Edificio Vicuña Mackenna",
    comuna: "Santiago Centro",
    precioArriendo: "$420.000 / mes",
    rating: 4.8,
    reviewsCount: 34,
    imagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
    etiquetas: ["Acepta Mascotas", "Metro Cerca", "Gastos Comunes Bajos"]
  });

  const [filtroActivo, setFiltroActivo] = useState('todos');

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
      
      {/* 1. BARRA SUPERIOR CON FILTROS FLOTANTES (Glassmorphism) */}
      <div className="absolute top-4 left-0 right-0 z-20 px-4 flex justify-center">
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 p-2 rounded-full shadow-2xl flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar">
          <button 
            onClick={() => setFiltroActivo('todos')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filtroActivo === 'todos' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'}`}
          >
            🏢 Todos
          </button>
          <button 
            onClick={() => setFiltroActivo('rating')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${filtroActivo === 'rating' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'}`}
          >
            <Star size={14} className="text-yellow-400 fill-yellow-400" /> Mejor Valorados
          </button>
          <button 
            onClick={() => setFiltroActivo('precio')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${filtroActivo === 'precio' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700'}`}
          >
            <DollarSign size={14} /> Económicos
          </button>
        </div>
      </div>

      {/* 2. ÁREA DEL MAPA (Simulada con fondo interactivo) */}
      <div className="flex-1 relative bg-gray-950 flex items-center justify-center">
        {/* Aquí iría tu componente de mapa (ej. Leaflet o Mapbox) */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Pin de ejemplo en el mapa */}
        <button 
          onClick={() => setSelectedBuilding({
            nombre: "Edificio Parque Forestal",
            comuna: "Santiago",
            precioArriendo: "$550.000 / mes",
            rating: 4.9,
            reviewsCount: 52,
            imagen: "https://images.unsplash.com/photo-1574362848149-11396d984bba?w=600&auto=format&fit=crop&q=80",
            etiquetas: ["Vista despejada", "Piscina", "Seguridad 24/7"]
          })}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center gap-2 border-2 border-white/20 animate-bounce"
        >
          <MapPin size={20} />
          <span className="text-xs font-bold pr-1">$550k</span>
        </button>
      </div>

      {/* 3. TARJETA INFERIOR DESLIZANTE (BOTTOM SHEET / MODAL FLOTANTE) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent">
        <div className="max-w-md mx-auto bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 shadow-2xl transition-all duration-300">
          
          {/* Indicador superior de arrastre para móviles */}
          <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-3"></div>

          <div className="flex gap-4 items-center">
            <img 
              src={selectedBuilding.imagen} 
              alt={selectedBuilding.nombre} 
              className="w-24 h-24 rounded-2xl object-cover shadow-md border border-gray-800"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md">
                  {selectedBuilding.comuna}
                </span>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                  <Star size={14} className="fill-yellow-400" />
                  <span>{selectedBuilding.rating}</span>
                  <span className="text-gray-400 text-xs font-normal">({selectedBuilding.reviewsCount})</span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mt-1 leading-snug">{selectedBuilding.nombre}</h3>
              <p className="text-indigo-400 font-extrabold text-sm mt-0.5">{selectedBuilding.precioArriendo}</p>
            </div>
          </div>

          {/* Etiquetas de características */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedBuilding.etiquetas.map((tag, idx) => (
              <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700/50">
                {tag}
              </span>
            ))}
          </div>

          {/* Botones de acción rápida / Monetización / Contacto */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
            <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors text-center">
              Ver Reseñas
            </button>
            <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 text-center">
              Cotizar / Arrendar
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}