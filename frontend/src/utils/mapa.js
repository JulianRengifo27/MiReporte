// Estilo de mapa con teselas raster de OpenStreetMap (gratis, sin llave)
export const ESTILO_OSM = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escapa texto para insertarlo en HTML sin riesgo (evita inyección de código)
export function escaparHTML(t = '') {
  return String(t).replace(/[&<>"']/g, (c) => ENTIDADES_HTML[c]);
}
