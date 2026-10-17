import { textos } from '../i18n/es-CL.ts'
import { esCharla, type Linea } from './lineas.ts'
import type { Advertencia } from './tipos.ts'

export const t = textos.lector

export interface Resultado<T> {
  elementos: T[]
  advertencias: Advertencia[]
}

export function advertencia(codigo: Advertencia['codigo'], mensaje: string, lineas: number[] = []): Advertencia {
  return { codigo, mensaje, lineas }
}

/** Una sola advertencia con todas las líneas que no se usaron, en orden. */
export function ignoradas(lineas: Linea[], mensaje: (citas: string[]) => string): Advertencia[] {
  if (lineas.length === 0) return []
  const ordenadas = [...lineas].sort((a, b) => a.numero - b.numero)
  return [advertencia('lineas-ignoradas', mensaje(ordenadas.map((l) => l.texto)), ordenadas.map((l) => l.numero))]
}

/** Agrupa los textos repetidos; devuelve el primero de cada grupo. */
export function repetidos<T>(elementos: T[], clave: (e: T) => string): T[] {
  const vistos = new Map<string, { primero: T; veces: number }>()
  for (const e of elementos) {
    const k = clave(e)
    if (!k) continue
    const visto = vistos.get(k)
    if (visto) visto.veces++
    else vistos.set(k, { primero: e, veces: 1 })
  }
  return [...vistos.values()].filter((v) => v.veces > 1).map((v) => v.primero)
}

/** Líneas con contenido, sin separadores. */
export function conContenido(lineas: Linea[]): Linea[] {
  return lineas.filter((l) => !l.separador && l.texto !== '')
}

/**
 * Saca del comienzo los saludos de ChatGPT y las líneas que cumplen `esTitulo`,
 * y del final las preguntas de cierre ("¿Quieres que…?"). Devuelve lo que queda y lo descartado.
 */
export function recortarBordes(lineas: Linea[], esTitulo: (l: Linea) => boolean) {
  const contenido = [...lineas]
  const descartadas: Linea[] = []
  while (contenido.length > 0 && (esTitulo(contenido[0]) || esCharla(contenido[0].texto))) {
    descartadas.push(contenido.shift()!)
  }
  while (contenido.length > 0 && esCharla(contenido[contenido.length - 1].texto)) {
    descartadas.push(contenido.pop()!)
  }
  return { contenido, descartadas }
}
