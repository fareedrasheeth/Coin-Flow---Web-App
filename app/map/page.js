'use client';
import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { generateMockLocations } from '@/lib/mockData';
import { LOCATION_CATEGORIES } from '@/lib/constants';

export default function MapPage() {
  const [locations, setLocations] = useState(() => generateMockLocations());
  const [activeCategory, setActiveCategory] = useState('all');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamically load Leaflet
    const loadMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) return;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [6.9271, 79.8612],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add markers
      locations.forEach((loc) => {
        const cat = LOCATION_CATEGORIES.find((c) => c.id === loc.category);
        const icon = L.divIcon({
          html: `<div style="background:${cat?.color || '#6C63FF'};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 0 12px ${cat?.color || '#6C63FF'}60;border:2px solid rgba(255,255,255,0.2);">${cat?.icon || '📍'}</div>`,
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;padding:4px;">
              <strong style="font-size:13px;">${loc.name}</strong><br/>
              <span style="font-size:11px;color:#888;">${cat?.label || 'Location'} · ${loc.distance}</span><br/>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}" 
                 target="_blank" 
                 style="color:#6C63FF;font-size:11px;text-decoration:none;font-weight:600;">
                Navigate →
              </a>
            </div>`
          );
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    if (locations.length > 0) {
      loadMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  const filteredLocations = activeCategory === 'all'
    ? locations
    : locations.filter((l) => l.category === activeCategory);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Nearby Cash Exchange</h1>
        <p className="text-text-secondary text-sm">Find banks and exchange centers near you</p>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        <FilterChip
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          icon="📍"
          label="All"
        />
        {LOCATION_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.id}
            active={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            icon={cat.icon}
            label={cat.label}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card overflow-hidden"
          style={{ height: 500 }}
        >
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          )}
        </motion.div>

        {/* Location List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4 overflow-y-auto"
          style={{ maxHeight: 500 }}
        >
          <h3 className="font-heading font-bold text-sm mb-3">
            {filteredLocations.length} Locations Found
          </h3>
          <div className="space-y-2">
            {filteredLocations.map((loc, i) => {
              const cat = LOCATION_CATEGORIES.find((c) => c.id === loc.category);
              return (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-card-border hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${cat?.color || '#6C63FF'}15` }}
                    >
                      {cat?.icon || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{loc.name}</p>
                      <p className="text-[10px] text-text-secondary">{cat?.label} · {loc.distance}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-[10px] font-semibold hover:underline flex-shrink-0"
                    >
                      Navigate →
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}

function FilterChip({ active, onClick, icon, label }) {
  return (
    <motion.button
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
        active
          ? 'bg-primary/20 text-primary border border-primary/40'
          : 'bg-white/5 text-text-secondary border border-card-border hover:border-primary/20'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span>{icon}</span>
      {label}
    </motion.button>
  );
}
