import { useSyncExternalStore } from 'react'

/** Celular, vertical (angosto) u horizontal (bajo): ahí el editor se divide en pasos. */
const CONSULTA = '(max-width: 600px), (max-height: 500px)'

function suscribir(avisar: () => void) {
  const lista = window.matchMedia(CONSULTA)
  lista.addEventListener('change', avisar)
  return () => lista.removeEventListener('change', avisar)
}

export function useEsCelular(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches)
}
