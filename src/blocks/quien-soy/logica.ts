// ¿Quién soy? sin interfaz: las pistas aparecen de a una y al final se revela la respuesta.
import type { Adivinanza } from '../../parser/tipos.ts'

export function esListaDeAdivinanzas(items: unknown): items is Adivinanza[] {
  return (
    Array.isArray(items) &&
    items.every(
      (a) =>
        typeof a === 'object' &&
        a !== null &&
        typeof a.respuesta === 'string' &&
        Array.isArray(a.pistas) &&
        a.pistas.every((p: unknown) => typeof p === 'string'),
    )
  )
}

export interface EstadoAdivinanza {
  /** Cuántas pistas están a la vista (la primera se ve desde el comienzo). */
  pistas: number
  revelada: boolean
}

export interface Juego {
  actual: number
  estados: EstadoAdivinanza[]
  /** Se pasó de la última adivinanza: pantalla de cierre. */
  terminado: boolean
}

export function nuevoJuego(adivinanzas: Adivinanza[]): Juego {
  return {
    actual: 0,
    estados: adivinanzas.map((a) => ({ pistas: Math.min(1, a.pistas.length), revelada: false })),
    terminado: false,
  }
}

function cambiarActual(juego: Juego, cambio: Partial<EstadoAdivinanza>): Juego {
  return { ...juego, estados: juego.estados.map((e, i) => (i === juego.actual ? { ...e, ...cambio } : e)) }
}

/** Espacio o flecha derecha: otra pista; sin más pistas, la respuesta; ya revelada, la adivinanza siguiente. */
export function avanzar(juego: Juego, adivinanzas: Adivinanza[]): Juego {
  if (juego.terminado) return juego
  const { pistas, revelada } = juego.estados[juego.actual]
  if (!revelada && pistas < adivinanzas[juego.actual].pistas.length) return cambiarActual(juego, { pistas: pistas + 1 })
  if (!revelada) return cambiarActual(juego, { revelada: true })
  if (juego.actual < juego.estados.length - 1) return { ...juego, actual: juego.actual + 1 }
  return { ...juego, terminado: true }
}

/** Si el curso adivina antes: se revela la respuesta y, para comentarlas, todas las pistas. */
export function revelar(juego: Juego, adivinanzas: Adivinanza[]): Juego {
  if (juego.terminado) return juego
  return cambiarActual(juego, { revelada: true, pistas: adivinanzas[juego.actual].pistas.length })
}

/** Flecha izquierda: vuelve a la adivinanza anterior tal como quedó. */
export function retroceder(juego: Juego): Juego {
  if (juego.terminado) return { ...juego, terminado: false }
  if (juego.actual > 0) return { ...juego, actual: juego.actual - 1 }
  return juego
}
