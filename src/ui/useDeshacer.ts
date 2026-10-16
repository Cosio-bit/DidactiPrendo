import { useSyncExternalStore } from 'react'
import { pilaDeshacer } from './deshacer.ts'

export function useEstadoGuardado() {
  return useSyncExternalStore(pilaDeshacer.suscribir, pilaDeshacer.obtenerEstado)
}
