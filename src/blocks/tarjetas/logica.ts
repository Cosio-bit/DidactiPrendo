// Tarjetas sin interfaz: opciones, orden y volteo.
import { barajar } from '../azar.ts'

export interface ConfigTarjetas {
  /** Mostrarlas en desorden (cada vez que se proyecta o se vuelve a empezar). */
  mezclarTarjetas: boolean
}

export const CONFIG_TARJETAS_INICIAL: ConfigTarjetas = { mezclarTarjetas: false }

export function leerConfigTarjetas(config: unknown): ConfigTarjetas {
  const c = (typeof config === 'object' && config !== null ? config : {}) as Record<string, unknown>
  return {
    mezclarTarjetas:
      typeof c.mezclarTarjetas === 'boolean' ? c.mezclarTarjetas : CONFIG_TARJETAS_INICIAL.mezclarTarjetas,
  }
}

export interface Mazo {
  /** Índices de las tarjetas en el orden en que se muestran. */
  orden: number[]
  /** Posición en `orden` de la tarjeta a la vista. */
  actual: number
  /** Se ve lo de atrás. */
  volteada: boolean
  /** Se pasó de la última: pantalla de cierre. */
  terminado: boolean
}

export function nuevoMazo(total: number, mezclar: boolean, desordenar: <T>(l: readonly T[]) => T[] = barajar): Mazo {
  const orden = Array.from({ length: total }, (_, i) => i)
  return { orden: mezclar ? desordenar(orden) : orden, actual: 0, volteada: false, terminado: false }
}

/** Tocar la tarjeta: se da vuelta y vuelve. */
export function voltear(mazo: Mazo): Mazo {
  return mazo.terminado ? mazo : { ...mazo, volteada: !mazo.volteada }
}

/** Espacio o flecha derecha: primero voltea, después pasa a la siguiente (por adelante). */
export function avanzar(mazo: Mazo): Mazo {
  if (mazo.terminado) return mazo
  if (!mazo.volteada) return { ...mazo, volteada: true }
  if (mazo.actual < mazo.orden.length - 1) return { ...mazo, actual: mazo.actual + 1, volteada: false }
  return { ...mazo, terminado: true }
}

/** Flecha izquierda: vuelve a la tarjeta anterior, por atrás, como quedó al pasar. */
export function retroceder(mazo: Mazo): Mazo {
  if (mazo.terminado) return { ...mazo, terminado: false, volteada: true }
  if (mazo.actual > 0) return { ...mazo, actual: mazo.actual - 1, volteada: true }
  return mazo
}
