import { useSyncExternalStore } from 'react'

// Rutas en el "#" para que el botón Atrás del navegador funcione sin servidor.
export type Ruta =
  | { pantalla: 'inicio' }
  | { pantalla: 'mis-actividades' }
  | { pantalla: 'editor'; id: string }

export function leerRuta(hash: string): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/')
  if (partes[0] === 'actividades') return { pantalla: 'mis-actividades' }
  if (partes[0] === 'actividad' && partes[1]) {
    return { pantalla: 'editor', id: decodeURIComponent(partes[1]) }
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
  }
}

export function irA(ruta: Ruta) {
  location.hash = hashDe(ruta)
}

function suscribir(avisar: () => void) {
  window.addEventListener('hashchange', avisar)
  return () => window.removeEventListener('hashchange', avisar)
}

export function useRuta(): Ruta {
  const hash = useSyncExternalStore(suscribir, () => location.hash)
  return leerRuta(hash)
}
