// Ordenar sin interfaz: el curso lleva cada elemento a la casilla donde cree que va y se comprueba.
import { barajar } from '../azar.ts'

export interface Ordenar {
  /** Índices (en el orden correcto) tal como se muestran, desordenados. */
  desorden: number[]
  /**
   * Elementos ya puestos en su casilla, en el orden en que se pusieron (para deshacer).
   * Solo se pone uno donde va, así que el elemento `i` está en la casilla `i`.
   */
  colocados: number[]
  /** Elemento tomado, esperando que se toque su casilla. */
  elegido: number | null
  /** Último intento equivocado: ese elemento no va en esa casilla. */
  errado: { elemento: number; casilla: number } | null
}

export function esListaDeTextos(items: unknown): items is string[] {
  return Array.isArray(items) && items.every((i) => typeof i === 'string')
}

/** Desordena; si por azar queda en orden, lo vuelve a intentar para que haya algo que ordenar. */
export function nuevoOrdenar(total: number, mezclar: (l: number[]) => number[] = barajar): Ordenar {
  const indices = Array.from({ length: total }, (_, i) => i)
  let desorden = mezclar(indices)
  for (let intento = 0; total > 1 && intento < 10 && desorden.every((v, i) => v === i); intento++) {
    desorden = mezclar(indices)
  }
  return { desorden, colocados: [], elegido: null, errado: null }
}

export function terminado(o: Ordenar): boolean {
  return o.colocados.length === o.desorden.length
}

export function estaColocado(o: Ordenar, elemento: number): boolean {
  return o.colocados.includes(elemento)
}

const existe = (o: Ordenar, elemento: number) => elemento >= 0 && elemento < o.desorden.length

/** Toca un elemento suelto: queda elegido (o deja de estarlo si se toca de nuevo). */
export function elegir(o: Ordenar, elemento: number): Ordenar {
  if (!existe(o, elemento) || estaColocado(o, elemento)) return o
  return { ...o, elegido: o.elegido === elemento ? null : elemento, errado: null }
}

/** Deja el elemento agarrado, sin alternar: soltarlo sin querer no lo cancela. */
export function agarrar(o: Ordenar, elemento: number): Ordenar {
  if (!existe(o, elemento) || estaColocado(o, elemento)) return o
  return { ...o, elegido: elemento, errado: null }
}

/** Suelta a propósito el elemento agarrado (Esc). */
export function soltarElegido(o: Ordenar): Ordenar {
  return o.elegido === null ? o : { ...o, elegido: null }
}

/**
 * Toca una casilla con un elemento elegido: si va ahí se coloca; si no, queda marcado el error
 * y el elemento sigue elegido para probar en otra casilla.
 */
export function ponerEn(o: Ordenar, casilla: number): Ordenar {
  if (o.elegido === null || !existe(o, casilla) || estaColocado(o, casilla)) return o
  if (o.elegido === casilla) return { ...o, colocados: [...o.colocados, casilla], elegido: null, errado: null }
  return { ...o, errado: { elemento: o.elegido, casilla } }
}

/** Arrastrar un elemento y soltarlo sobre una casilla: lo mismo que elegirlo y tocar la casilla. */
export function soltarEn(o: Ordenar, elemento: number, casilla: number): Ordenar {
  const agarrado = agarrar(o, elemento)
  return agarrado === o ? o : ponerEn(agarrado, casilla)
}

/** Espacio: el profe muestra el que va en la primera casilla vacía. */
export function revelarSiguiente(o: Ordenar): Ordenar {
  const siguiente = o.desorden.findIndex((_, i) => !estaColocado(o, i))
  if (siguiente < 0) return o
  return { ...o, colocados: [...o.colocados, siguiente], elegido: null, errado: null }
}

/** Flecha izquierda: devuelve el último colocado. */
export function deshacer(o: Ordenar): Ordenar {
  return { ...o, colocados: o.colocados.slice(0, -1), elegido: null, errado: null }
}
