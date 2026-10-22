import { useSyncExternalStore } from 'react'

// Rutas en el "#" para que el botón Atrás del navegador funcione sin servidor.
export type Ruta =
  | { pantalla: 'inicio' }
  | { pantalla: 'mis-actividades' }
  | { pantalla: 'crear-con-ia' }
  | { pantalla: 'editor'; id: string }
  | { pantalla: 'proyectar'; id: string }
  | { pantalla: 'imprimir'; id: string }
  /** Actividad compartida por enlace: viene completa en `datos` (nunca pasa por un servidor). */
  | { pantalla: 'recibir'; datos: string }

export function leerRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/')
  if (partes[0] === 'actividades') return { pantalla: 'mis-actividades' }
  if (partes[0] === 'crear-con-ia') return { pantalla: 'crear-con-ia' }
  if (partes[0] === 'actividad' && partes[1]) {
    return { pantalla: 'editor', id: decodeURIComponent(partes[1]) }
  }
  if (partes[0] === 'proyectar' && partes[1]) {
    return { pantalla: 'proyectar', id: decodeURIComponent(partes[1]) }
  }
  if (partes[0] === 'imprimir' && partes[1]) {
    return { pantalla: 'imprimir', id: decodeURIComponent(partes[1]) }
  }
  if (partes[0] === 'recibir' && partes[1]) {
    return { pantalla: 'recibir', datos: partes.slice(1).join('/') }
  }
  return { pantalla: 'inicio' }
}

export function hashDe(ruta: Ruta): string {
  switch (ruta.pantalla) {
    case 'inicio':
      return '#/'
    case 'mis-actividades':
      return '#/actividades'
    case 'crear-con-ia':
      return '#/crear-con-ia'
    case 'editor':
      return `#/actividad/${encodeURIComponent(ruta.id)}`
    case 'proyectar':
      return `#/proyectar/${encodeURIComponent(ruta.id)}`
    case 'imprimir':
      return `#/imprimir/${encodeURIComponent(ruta.id)}`
    case 'recibir':
      return `#/recibir/${ruta.datos}`
  }
}

// Cuántas pantallas se recorrieron dentro de la app en esta visita (para saber si "Atrás" sigue en la app).
let pasosDentroDeLaApp = 0

// La pantalla anterior, para que la proyección diga adónde vuelve ("Volver a Mis actividades").
let rutaActual: Ruta = typeof location === 'undefined' ? { pantalla: 'inicio' } : leerRuta(location.hash)
let rutaAnterior: Ruta | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    rutaAnterior = rutaActual
    rutaActual = leerRuta(location.hash)
  })
}

/** Adónde lleva "volver" desde la proyección: a donde estaba el profe o, si llegó por un enlace, a la actividad. */
export function destinoAlVolver(id: string): Ruta {
  if (rutaAnterior && (rutaAnterior.pantalla === 'mis-actividades' || rutaAnterior.pantalla === 'editor')) {
    return rutaAnterior
  }
  return { pantalla: 'editor', id }
}

export function irA(ruta: Ruta) {
  if (location.hash === hashDe(ruta)) return
  pasosDentroDeLaApp++
  location.hash = hashDe(ruta)
}

/** Al salir de la proyección se vuelve a donde estaba el profe; si llegó por un enlace, a la actividad. */
export function volverDeProyeccion(id: string) {
  const destino = destinoAlVolver(id)
  if (pasosDentroDeLaApp > 0 && rutaAnterior && hashDe(rutaAnterior) === hashDe(destino)) {
    pasosDentroDeLaApp--
    history.back()
  } else {
    location.replace(hashDe(destino))
  }
}

function suscribir(avisar: () => void) {
  window.addEventListener('hashchange', avisar)
  return () => window.removeEventListener('hashchange', avisar)
}

export function useRuta(): Ruta {
  const hash = useSyncExternalStore(suscribir, () => location.hash)
  return leerRuta(hash)
}
