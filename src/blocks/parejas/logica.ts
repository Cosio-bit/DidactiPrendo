// Memorice sin interfaz: cartas, volteo y tamaño de la grilla.
import type { Pareja } from '../../parser/tipos.ts'
import { barajar } from '../azar.ts'

export interface Carta {
  /** Índice de la pareja a la que pertenece. */
  pareja: number
  texto: string
}

export interface Memorice {
  cartas: Carta[]
  /** Parejas ya encontradas (por índice de pareja). */
  encontradas: number[]
  /** Cartas boca arriba que aún no forman pareja (máximo dos). */
  abiertas: number[]
  /** Cómo salió el último par volteado. */
  ultimo: 'pareja' | 'no-pareja' | null
}

export function esListaDeParejas(items: unknown): items is Pareja[] {
  return (
    Array.isArray(items) &&
    items.every((p) => typeof p === 'object' && p !== null && typeof p.a === 'string' && typeof p.b === 'string')
  )
}

export function nuevoMemorice(parejas: Pareja[], mezclar: <T>(l: readonly T[]) => T[] = barajar): Memorice {
  const cartas = parejas.flatMap((p, i) => [
    { pareja: i, texto: p.a },
    { pareja: i, texto: p.b },
  ])
  return { cartas: mezclar(cartas), encontradas: [], abiertas: [], ultimo: null }
}

export function estaVisible(memorice: Memorice, indice: number): boolean {
  return memorice.abiertas.includes(indice) || memorice.encontradas.includes(memorice.cartas[indice].pareja)
}

export function terminado(memorice: Memorice): boolean {
  return memorice.encontradas.length * 2 === memorice.cartas.length
}

/**
 * Voltea una carta. Si ya había dos que no eran pareja, primero se tapan.
 * Al voltear la segunda, si son pareja quedan descubiertas para siempre.
 */
export function voltear(memorice: Memorice, indice: number): Memorice {
  const carta = memorice.cartas[indice]
  if (!carta || memorice.encontradas.includes(carta.pareja) || memorice.abiertas.includes(indice)) return memorice

  const abiertas = memorice.abiertas.length === 2 ? [indice] : [...memorice.abiertas, indice]
  if (abiertas.length < 2) return { ...memorice, abiertas, ultimo: null }

  const [primera, segunda] = abiertas.map((i) => memorice.cartas[i])
  if (primera.pareja === segunda.pareja) {
    return { ...memorice, abiertas: [], encontradas: [...memorice.encontradas, carta.pareja], ultimo: 'pareja' }
  }
  return { ...memorice, abiertas, ultimo: 'no-pareja' }
}

/** Tapa las dos cartas que no eran pareja. */
export function tapar(memorice: Memorice): Memorice {
  return memorice.abiertas.length === 2 ? { ...memorice, abiertas: [], ultimo: null } : memorice
}

/**
 * Columnas para que las cartas queden lo más grandes posible en el espacio disponible.
 * Las cartas se piensan un poco más anchas que altas, para que quepa el texto.
 */
export function columnasParaGrilla(cantidad: number, ancho: number, alto: number, proporcion = 1.3): number {
  let mejor = 1
  let mejorTamano = 0
  for (let columnas = 1; columnas <= cantidad; columnas++) {
    const filas = Math.ceil(cantidad / columnas)
    const tamano = Math.min(ancho / columnas / proporcion, alto / filas)
    if (tamano > mejorTamano) {
      mejor = columnas
      mejorTamano = tamano
    }
  }
  return mejor
}
