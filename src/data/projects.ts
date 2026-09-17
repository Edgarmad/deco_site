import type { Project } from '../types/projects';

export const projectPlaceholders: Project[] = [
  {
    name: 'Residencia Norte',
    slug: 'residencia-norte',
    category: 'Residencial',
    description: 'Una fachada contemporánea construida con lambrín exterior, piedra tecnológica y acentos cálidos.',
    visual: 'wood-stripes',
    imageAlt: 'Fachada residencial con lambrines verticales en tonos madera',
    featured: true,
    location: 'Mérida, Yucatán',
    year: '2026',
    surface: 'Fachada exterior',
    materials: ['Lambrín exterior', 'Piedra tecnológica', 'Perfiles decorativos'],
    challenge: 'Resolver una fachada expuesta al clima con una lectura cálida, contemporánea y de bajo mantenimiento.',
    result: 'Se combinaron líneas verticales con tonos madera para dar ritmo a la fachada y enfatizar los accesos principales.'
  },
  {
    name: 'Lobby Hotel Boutique',
    slug: 'lobby-hotel-boutique',
    category: 'Hospitalidad',
    description: 'Un lobby compacto con superficies claras, textura lineal y una atmósfera cálida de bienvenida.',
    visual: 'paper-lines',
    imageAlt: 'Textura clara con líneas horizontales para un lobby de hotel boutique',
    location: 'Playa del Carmen, Quintana Roo',
    year: '2026',
    surface: 'Muros interiores',
    materials: ['Panel decorativo', 'Lambrín interior', 'Acabado claro'],
    challenge: 'Aportar textura sin saturar el espacio de recepción ni competir con el mobiliario existente.',
    result: 'El patrón lineal ordena visualmente el lobby y mantiene una base neutra para iluminación y señalética.'
  },
  {
    name: 'Showroom Mérida',
    slug: 'showroom-merida',
    category: 'Comercial',
    description: 'Un espacio comercial diseñado para presentar materiales con contraste, profundidad y lectura técnica.',
    visual: 'dark-diagonal',
    imageAlt: 'Patrón oscuro diagonal aplicado en showroom comercial',
    location: 'Mérida, Yucatán',
    year: '2026',
    surface: 'Exhibición comercial',
    materials: ['Panel SPC', 'Lambrín decorativo', 'Módulos de exhibición'],
    challenge: 'Construir un recorrido de exhibición que ordenara varias familias de productos en un área reducida.',
    result: 'El contraste oscuro define zonas de muestra y ayuda a que cada material destaque con claridad.'
  },
  {
    name: 'Casa Patio',
    slug: 'casa-patio',
    category: 'Residencial',
    description: 'Una intervención residencial con materialidad cálida para conectar patio, fachada y áreas sociales.',
    visual: 'wood-stripes',
    imageAlt: 'Textura vertical en tonos madera aplicada en casa patio',
    location: 'Mérida, Yucatán',
    year: '2026',
    surface: 'Patio y fachada',
    materials: ['Lambrín coextruido', 'Deck exterior', 'Remates de instalación'],
    challenge: 'Unificar zonas interiores y exteriores con un material resistente y visualmente continuo.',
    result: 'La dirección vertical del lambrín genera altura visual y el deck completa una transición más natural hacia el patio.'
  }
];
