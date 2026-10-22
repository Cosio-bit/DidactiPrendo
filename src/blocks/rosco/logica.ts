// El rosco de letras sin interfaz: aciertos, errores, pasar y deshacer.
import type { Definicion } from '../../parser/tipos.ts'

export type EstadoLetra = 'pendiente' | 'acierto' | 'error'

export interface Rosco {
  estados: EstadoLetra[]
  /** La letra que se está preguntando. */
  actual: number
  /** La letra actual ya se respondió: se ve la palabra y falta pasar a la siguiente. */
  respondida: boolean
  /** Letras respondidas, en orden, para poder deshacer. */
  historial: number[]
  /** Ya no quedan letras por responder. */
  terminado: boolean
}

export function esListaDeDefiniciones(items: unknown): items is Definicion[] {
  return (
    Array.isArray(items) &&
    items.every(
      (d) =>
        typeof d === 'object' &&
        d !== null &&
        typeof d.letra === 'string' &&
        typeof d.contiene === 'boolean' &&
        typeof d.definicion === 'string' &&
        typeof d.respuesta === 'string',
    )
  )
}

export function nuevoRosco(total: number): Rosco {
  return { estados: Array(total).fill('pendiente'), actual: 0, respondida: false, historial: [], terminado: total === 0 }
}

/** La siguiente letra por responder después de `desde`, dando la vuelta; -1 si no queda ninguna. */
function siguientePendiente(estados: EstadoLetra[], desde: number): number {
  for (let paso = 1; paso <= estados.length; paso++) {
    const i = (desde + paso) % estados.length
    if (estados[i] === 'pendiente') return i
  }
  return -1
}

/** Correcta o incorrecta: la letra queda marcada y se ve la palabra. */
export function responder(rosco: Rosco, resultado: 'acierto' | 'error'): Rosco {
  if (rosco.terminado || rosco.respondida) return rosco
  return {
    ...rosco,
    estados: rosco.estados.map((e, i) => (i === rosco.actual ? resultado : e)),
    respondida: true,
    historial: [...rosco.historial, rosco.actual],
  }
}

/**
 * Espacio o flecha derecha. Sin responder es "rosco": la letra queda para la próxima vuelta.
 * Ya respondida, pasa a la siguiente letra por responder (o termina el rosco).
 */
export function avanzar(rosco: Rosco): Rosco {
  if (rosco.terminado) return rosco
  const siguiente = siguientePendiente(rosco.estados, rosco.actual)
  if (siguiente === -1) return { ...rosco, respondida: false, terminado: true }
  return { ...rosco, actual: siguiente, respondida: false }
}

/** Flecha izquierda: la última letra respondida vuelve a quedar por responder, y se pregunta de nuevo. */
export function deshacer(rosco: Rosco): Rosco {
  const ultima = rosco.historial[rosco.historial.length - 1]
  if (ultima === undefined) return rosco
  return {
    estados: rosco.estados.map((e, i) => (i === ultima ? 'pendiente' : e)),
    actual: ultima,
    respondida: false,
    historial: rosco.historial.slice(0, -1),
    terminado: false,
  }
}

export function contar(rosco: Rosco) {
  const cuantos = (estado: EstadoLetra) => rosco.estados.filter((e) => e === estado).length
  return { aciertos: cuantos('acierto'), errores: cuantos('error'), pendientes: cuantos('pendiente') }
}
