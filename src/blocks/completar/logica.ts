// Completar la frase sin interfaz: opciones, palabras a la vista y avance.
import type { Frase } from '../../parser/tipos.ts'
import { barajar } from '../azar.ts'

export interface ConfigCompletar {
  /** Mostrar debajo de la frase, en desorden, las palabras que faltan. */
  bancoDePalabras: boolean
}

export const CONFIG_COMPLETAR_INICIAL: ConfigCompletar = { bancoDePalabras: false }

export function leerConfigCompletar(config: unknown): ConfigCompletar {
  const c = (typeof config === 'object' && config !== null ? config : {}) as Record<string, unknown>
  return {
    bancoDePalabras:
      typeof c.bancoDePalabras === 'boolean' ? c.bancoDePalabras : CONFIG_COMPLETAR_INICIAL.bancoDePalabras,
  }
}

export function esListaDeFrases(items: unknown): items is Frase[] {
  return (
    Array.isArray(items) &&
    items.every(
      (f) =>
        typeof f === 'object' &&
        f !== null &&
        Array.isArray(f.partes) &&
        f.partes.every(
          (p: unknown) =>
            typeof p === 'object' &&
            p !== null &&
            typeof (p as { texto?: unknown }).texto === 'string' &&
            typeof (p as { oculta?: unknown }).oculta === 'boolean',
        ),
    )
  )
}

/** Las palabras ocultas de la frase, en orden. */
export function palabrasOcultas(frase: Frase): string[] {
  return frase.partes.filter((p) => p.oculta).map((p) => p.texto)
}

export interface Completar {
  actual: number
  /** Por frase, qué palabras ocultas ya están a la vista. */
  visibles: boolean[][]
  /** Por frase, el orden (desordenado) de las palabras que se muestran abajo. */
  bancos: number[][]
  /** Se pasó de la última frase: pantalla de cierre. */
  terminado: boolean
}

export function nuevoCompletar(frases: Frase[], desordenar: <T>(l: readonly T[]) => T[] = barajar): Completar {
  return {
    actual: 0,
    visibles: frases.map((f) => palabrasOcultas(f).map(() => false)),
    bancos: frases.map((f) => desordenar(palabrasOcultas(f).map((_, i) => i))),
    terminado: false,
  }
}

function cambiarActual(estado: Completar, visibles: boolean[]): Completar {
  return { ...estado, visibles: estado.visibles.map((v, i) => (i === estado.actual ? visibles : v)) }
}

/** Espacio o flecha derecha: muestra la primera palabra oculta; si ya están todas, pasa a la frase siguiente. */
export function avanzar(estado: Completar): Completar {
  if (estado.terminado) return estado
  const visibles = estado.visibles[estado.actual]
  const oculta = visibles.indexOf(false)
  if (oculta !== -1) return cambiarActual(estado, visibles.map((v, i) => v || i === oculta))
  if (estado.actual < estado.visibles.length - 1) return { ...estado, actual: estado.actual + 1 }
  return { ...estado, terminado: true }
}

/** Flecha izquierda: vuelve a la frase anterior tal como quedó. */
export function retroceder(estado: Completar): Completar {
  if (estado.terminado) return { ...estado, terminado: false }
  if (estado.actual > 0) return { ...estado, actual: estado.actual - 1 }
  return estado
}

/** Tocar una palabra (o presionar su número): se muestra o se vuelve a ocultar. */
export function alternarPalabra(estado: Completar, indice: number): Completar {
  const visibles = estado.visibles[estado.actual]
  if (estado.terminado || indice < 0 || indice >= visibles.length) return estado
  return cambiarActual(estado, visibles.map((v, i) => (i === indice ? !v : v)))
}

export function mostrarTodas(estado: Completar): Completar {
  if (estado.terminado) return estado
  return cambiarActual(estado, estado.visibles[estado.actual].map(() => true))
}
