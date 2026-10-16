import { textos } from '../i18n/es-CL.ts'

export interface AccionDeshacible {
  /** Texto corto para el aviso, ej. "cambio de nombre". */
  descripcion: string
  deshacer: () => Promise<unknown> | unknown
}

export interface EstadoGuardado {
  puedeDeshacer: boolean
  /** Último aviso para mostrar al profe; null al comenzar. */
  aviso: string | null
  error: boolean
}

/**
 * Pila de acciones para "Deshacer" y aviso de "Guardado".
 * Vive en memoria: se pierde al cerrar la página, pero los datos ya están guardados.
 */
export function crearPilaDeshacer(limite = 50) {
  let pila: AccionDeshacible[] = []
  let estado: EstadoGuardado = { puedeDeshacer: false, aviso: null, error: false }
  const oyentes = new Set<() => void>()

  function cambiar(parcial: Partial<EstadoGuardado>) {
    estado = { ...estado, ...parcial, puedeDeshacer: pila.length > 0 }
    oyentes.forEach((oyente) => oyente())
  }

  return {
    registrar(accion: AccionDeshacible) {
      pila = [...pila, accion].slice(-limite)
      cambiar({})
    },

    avisar(aviso: string, error = false) {
      cambiar({ aviso, error })
    },

    async deshacer(): Promise<boolean> {
      const accion = pila.at(-1)
      if (!accion) return false
      pila = pila.slice(0, -1)
      try {
        await accion.deshacer()
        cambiar({ aviso: textos.avisos.deshecho(accion.descripcion), error: false })
        return true
      } catch {
        pila = [...pila, accion]
        cambiar({ aviso: textos.avisos.errorDeshacer, error: true })
        return false
      }
    },

    obtenerEstado: () => estado,

    suscribir(oyente: () => void) {
      oyentes.add(oyente)
      return () => {
        oyentes.delete(oyente)
      }
    },
  }
}

export type PilaDeshacer = ReturnType<typeof crearPilaDeshacer>

export const pilaDeshacer = crearPilaDeshacer()
