import { claveComparacion, type Linea } from './lineas.ts'
import { advertencia, repetidos, t, type Resultado } from './comun.ts'
import { leerElementos } from './lista.ts'

export const MINIMO_ORDENAR = 3
/** Más que esto no se alcanza a leer ni a discutir en la sala. */
export const MAXIMO_ORDENAR = 12

/** Los elementos en el orden correcto. Si todos venían numerados, manda el número. */
export function leerOrdenar(lineas: Linea[], hayTexto: boolean): Resultado<string> {
  const { elementos, advertencias, usadas } = leerElementos(lineas, hayTexto)
  if (elementos.length === 0) return { elementos, advertencias }

  let ordenados = elementos
  const numeros = usadas.map((l) => l.numeroDeLista)
  const todosNumerados = usadas.length === elementos.length && numeros.every((n) => n !== null)
  if (todosNumerados && new Set(numeros).size === numeros.length) {
    const porNumero = usadas
      .map((l, i) => ({ numero: l.numeroDeLista!, elemento: elementos[i] }))
      .sort((a, b) => a.numero - b.numero)
      .map((x) => x.elemento)
    if (porNumero.some((e, i) => e !== elementos[i])) {
      ordenados = porNumero
      advertencias.push(advertencia('ordenado-por-numero', t.ordenadoPorNumero))
    }
  }

  const repetidas = repetidos(ordenados, claveComparacion)
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas)))
  if (ordenados.length < MINIMO_ORDENAR) {
    advertencias.push(advertencia('pocos-para-ordenar', t.pocosParaOrdenar(MINIMO_ORDENAR)))
  }
  if (ordenados.length > MAXIMO_ORDENAR) {
    advertencias.push(advertencia('demasiados-para-ordenar', t.demasiadosParaOrdenar(ordenados.length, MAXIMO_ORDENAR)))
  }
  return { elementos: ordenados, advertencias }
}
