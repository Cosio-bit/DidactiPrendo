// Términos pareados sin interfaz: unir cada concepto (columna A) con su definición (columna B).
import type { Pareja } from '../../parser/tipos.ts'
import { barajar } from '../azar.ts'

/** Un concepto o una definición, por el índice de su pareja. */
export interface Lado {
  lado: 'concepto' | 'definicion'
  pareja: number
}

export interface Pareados {
  /** Las definiciones en el orden en que se muestran (índices de pareja). */
  orden: number[]
  /** Parejas ya unidas, en el orden en que se unieron (para deshacer). */
  unidas: number[]
  /** Lo que se tocó primero, esperando que se toque su otra mitad. */
  elegido: Lado | null
  /** Último intento equivocado. */
  errado: { concepto: number; definicion: number } | null
}

/**
 * Desordena las definiciones. Si por azar quedan en el mismo orden que los conceptos,
 * se corren en uno: así nunca quedan todas al frente de su concepto.
 */
export function nuevoPareados(parejas: Pareja[], mezclar: (l: number[]) => number[] = barajar): Pareados {
  const indices = parejas.map((_, i) => i)
  let orden = mezclar(indices)
  if (orden.length > 1 && orden.every((p, i) => p === i)) orden = [...orden.slice(1), orden[0]]
  return { orden, unidas: [], elegido: null, errado: null }
}

export function terminado(p: Pareados): boolean {
  return p.unidas.length === p.orden.length
}

export function estaUnida(p: Pareados, pareja: number): boolean {
  return p.unidas.includes(pareja)
}

/** Intenta unir un concepto con una definición: si son pareja quedan unidos; si no, queda marcado el error. */
export function unir(p: Pareados, concepto: number, definicion: number): Pareados {
  if (estaUnida(p, concepto) || estaUnida(p, definicion)) return p
  if (concepto === definicion) return { ...p, unidas: [...p.unidas, concepto], elegido: null, errado: null }
  return { ...p, elegido: null, errado: { concepto, definicion } }
}

/**
 * Toca un concepto o una definición. Si ya había algo elegido del otro lado, se intenta unir;
 * si era del mismo lado, se cambia la elección (o se suelta, si se tocó lo mismo).
 */
export function tocar(p: Pareados, tocado: Lado): Pareados {
  if (estaUnida(p, tocado.pareja) || tocado.pareja < 0 || tocado.pareja >= p.orden.length) return p
  const { elegido } = p
  if (elegido && elegido.lado !== tocado.lado) {
    const concepto = tocado.lado === 'concepto' ? tocado.pareja : elegido.pareja
    const definicion = tocado.lado === 'definicion' ? tocado.pareja : elegido.pareja
    return unir(p, concepto, definicion)
  }
  const mismo = elegido?.lado === tocado.lado && elegido.pareja === tocado.pareja
  return { ...p, elegido: mismo ? null : tocado, errado: null }
}

/** Deja algo agarrado (elegido), sin alternar: soltarlo sin querer no lo cancela. */
export function agarrar(p: Pareados, agarrado: Lado): Pareados {
  if (estaUnida(p, agarrado.pareja)) return p
  return { ...p, elegido: agarrado, errado: null }
}

/** Suelta a propósito lo que estaba elegido (Esc). */
export function soltarElegido(p: Pareados): Pareados {
  return p.elegido === null ? p : { ...p, elegido: null }
}

/** Arrastrar una mitad y soltarla sobre la otra: lo mismo que tocar una y después la otra. */
export function soltarSobre(p: Pareados, arrastrado: Lado, destino: Lado): Pareados {
  if (arrastrado.lado === destino.lado) return agarrar(p, arrastrado)
  const agarrado = agarrar(p, arrastrado)
  return agarrado === p ? p : tocar(agarrado, destino)
}

/** Espacio: une lo elegido con su pareja o, si no hay nada elegido, el primer concepto sin unir. */
export function revelarSiguiente(p: Pareados): Pareados {
  const siguiente = p.elegido?.pareja ?? p.orden.map((_, i) => i).find((i) => !estaUnida(p, i))
  if (siguiente === undefined) return p
  return unir(p, siguiente, siguiente)
}

/** Flecha izquierda: separa la última pareja unida. */
export function deshacer(p: Pareados): Pareados {
  return { ...p, unidas: p.unidas.slice(0, -1), elegido: null, errado: null }
}
