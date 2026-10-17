import { useSyncExternalStore } from 'react'

// Rutas en el "#" para que el botón Atrás del navegador funcione sin servidor.
export type Ruta =
  | { pantalla: 'inicio' }
  | { pantalla: 'mis-actividades' }
  | { pantalla: 'editor'; id: string }
  | { pantalla: 'proyectar'; id: string }

export function leerRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/')
  if (partes[0] === 'actividades') return { pantalla: 'mis-actividades' }
  if (partes[0] === 'actividad' && partes[1]) {
    return { pantalla: 'editor', id: decodeURIComponent(partes[1]) }
  }
  if (partes[0] === 'proyectar' && partes[1]) {
    return { pantalla: 'proyectar', id: decodeURIComponent(partes[1]) }
  }
  return { pantalla: 'inicio' }
}

export function hashDe(ruta: Ruta): string {
  switch (ruta.pantalla) {
    case 'inicio':
      return '#/'
    case 'mis-actividades':
      return '#/actividades'
    case 'editor':
      return `#/actividad/${encodeURIComponent(ruta.id)}`
    case 'proyectar':
      return `#/proyectar/${encodeURIComponent(ruta.id)}`
  }
}

// Cuántas pantallas se recorrieron dentro de la app en esta visita (para saber si "Atrás" sigue en la app).
let pasosDentroDeLaApp = 0

export function irA(ruta: Ruta) {
  if (location.hash === hashDe(ruta)) return
  pasosDentroDeLaApp++
  location.hash = hashDe(ruta)
}

/** Al salir de la proyección se vuelve a donde estaba el profe; si llegó por un enlace, a la actividad. */
export function volverDeProyeccion(id: string) {
  if (pasosDentroDeLaApp > 0) {
    pasosDentroDeLaApp--
    history.back()
  } else {
    location.replace(hashDe({ pantalla: 'editor', id }))
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
