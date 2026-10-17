import type { Ruta } from './navegacion.ts'

/** Pantallas donde recargar no interrumpe nada: no se está escribiendo ni proyectando. */
const PANTALLAS_SEGURAS = new Set<Ruta['pantalla']>(['inicio', 'mis-actividades'])

/**
 * Decide cuándo aplicar una versión nueva de la app.
 * Se aplica apenas el profe esté en el inicio o en "Mis actividades"; nunca en medio de una clase.
 */
export function crearActualizador(aplicar: () => void, pantallaActual: () => Ruta['pantalla']) {
  let pendiente = false

  function intentar() {
    if (!pendiente || !PANTALLAS_SEGURAS.has(pantallaActual())) return
    pendiente = false
    aplicar()
  }

  return {
    /** Llegó una versión nueva. */
    hayVersionNueva() {
      pendiente = true
      intentar()
    },
    /** El profe cambió de pantalla. */
    cambioDePantalla: intentar,
  }
}
