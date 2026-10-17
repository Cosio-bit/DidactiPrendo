// Lógica de la ruleta sin interfaz: opciones, sorteo y ángulos del giro.

export interface ConfigRuleta {
  /** Lo que sale se saca de la ruleta antes del siguiente giro. */
  eliminarAlSalir: boolean
  sonido: boolean
}

export const CONFIG_RULETA_INICIAL: ConfigRuleta = { eliminarAlSalir: true, sonido: true }

/** Lee las opciones guardadas; lo que falte o venga mal toma el valor inicial. */
export function leerConfigRuleta(config: unknown): ConfigRuleta {
  const c = (typeof config === 'object' && config !== null ? config : {}) as Partial<Record<keyof ConfigRuleta, unknown>>
  return {
    eliminarAlSalir:
      typeof c.eliminarAlSalir === 'boolean' ? c.eliminarAlSalir : CONFIG_RULETA_INICIAL.eliminarAlSalir,
    sonido: typeof c.sonido === 'boolean' ? c.sonido : CONFIG_RULETA_INICIAL.sonido,
  }
}

export interface Sorteo {
  total: number
  /** Índices (en la lista completa) que siguen en la ruleta. */
  enRueda: number[]
  /** Lo que salió en el último giro. */
  ganador: number | null
  /** Si hay que sacar al ganador, se saca al empezar el siguiente giro para que se vea mientras tanto. */
  porSacar: number | null
}

export function nuevoSorteo(total: number): Sorteo {
  return { total, enRueda: Array.from({ length: total }, (_, i) => i), ganador: null, porSacar: null }
}

/** Cuántos quedan por salir. */
export function quedan(sorteo: Sorteo): number {
  return sorteo.enRueda.length - (sorteo.porSacar === null ? 0 : 1)
}

/** Antes de girar: saca lo que salió la vez anterior, si corresponde. */
export function prepararGiro(sorteo: Sorteo): Sorteo {
  if (sorteo.porSacar === null) return sorteo
  return { ...sorteo, enRueda: sorteo.enRueda.filter((i) => i !== sorteo.porSacar), porSacar: null }
}

export function terminarGiro(sorteo: Sorteo, ganador: number, eliminarAlSalir: boolean): Sorteo {
  return { ...sorteo, ganador, porSacar: eliminarAlSalir ? ganador : null }
}

export { azar } from '../azar.ts'

function modulo(a: number, n: number) {
  return ((a % n) + n) % n
}

/*
 * Geometría: el segmento i de n ocupa, en sentido horario desde arriba, de i·(360/n) a (i+1)·(360/n).
 * Girar la rueda R grados en sentido horario deja bajo el puntero (arriba) el ángulo -R de la rueda.
 */

/** Índice (en la rueda) del segmento que queda bajo el puntero. */
export function segmentoBajoPuntero(rotacion: number, n: number): number {
  return Math.floor(modulo(-rotacion, 360) / (360 / n)) % n
}

/**
 * Rotación final para que el segmento `indice` termine bajo el puntero, después de dar `vueltas` vueltas.
 * `desfase` (entre -0,4 y 0,4) mueve el punto de parada dentro del segmento para que no se vea siempre igual.
 */
export function rotacionFinal(rotacionActual: number, indice: number, n: number, vueltas: number, desfase = 0): number {
  const objetivo = (indice + 0.5 + desfase) * (360 / n)
  const base = rotacionActual + vueltas * 360
  return base + modulo(-objetivo - base, 360)
}

/** Desaceleración natural: parte rápido y frena al final. */
export function frenado(t: number): number {
  return 1 - (1 - t) ** 3
}
