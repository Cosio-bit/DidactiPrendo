import { useSyncExternalStore } from 'react'

/** Celular, vertical (angosto) u horizontal (bajo): ahí el editor se divide en pasos. */
export const CONSULTA_CELULAR = '(max-width: 600px), (max-height: 500px)'

function suscribir(avisar: () => void) {
  const lista = window.matchMedia(CONSULTA_CELULAR)
  lista.addEventListener('change', avisar)
  return () => lista.removeEventListener('change', avisar)
}

export function useEsCelular(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA_CELULAR).matches)
}
