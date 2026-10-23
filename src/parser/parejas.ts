import { claveComparacion, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, repetidos, t, type Resultado } from './comun.ts'
import type { Pareja } from './tipos.ts'

/** El memorice se lee bien proyectado hasta con esta cantidad de parejas. */
export const MAXIMO_PAREJAS = 12
/** En términos pareados las definiciones son más largas: caben menos en la pantalla. */
export const MAXIMO_TERMINOS = 10

const DOS_PUNTOS = /\s*:\s+/
/** Separadores, del más claro al más dudoso. Se usa el primero que aparezca en la línea. */
const SEPARADORES: RegExp[] = [/\s*=\s*/, /\s*\|\s*/, /\s*(?:→|->|⇒)\s*/, DOS_PUNTOS, /\s+[-–—]\s+/]

/** Títulos de columna de una tabla de conceptos ("Concepto | Definición"): no son una pareja. */
const TITULO_DE_COLUMNA =
  /^(?:conceptos?|t[eé]rminos?|palabras?|columna [ab12]|definici[oó]n(?:es)?|significados?|descripci[oó]n(?:es)?|caracter[ií]sticas?|ejemplos?)$/i

const TIENE_CONTENIDO = /[\p{L}\p{N}]/u
/** "Ana", "Benjamín": una sola palabra con mayúscula, como un nombre o un apellido. */
const NOMBRE_PROPIO = /^\p{Lu}[\p{Ll}'’-]+$/u

function lado(texto: string) {
  return texto.trim().replace(/^\*\*|\*\*$/g, '')
}

/** Lee una pareja de la línea, o null si no tiene separador o un lado queda vacío. */
export function leerPareja(linea: Linea): Pareja | null {
  if (linea.celdas.length === 2) {
    const [a, b] = linea.celdas
    return { a, b }
  }
  return separarPareja(linea.texto)
}

/** Parte el texto en sus dos lados ("perro = dog"), o null si no tiene separador o un lado queda vacío. */
export function separarPareja(texto: string): Pareja | null {
  for (const separador of SEPARADORES) {
    const m = texto.match(separador)
    if (!m) continue
    const a = lado(texto.slice(0, m.index))
    const b = lado(texto.slice(m.index! + m[0].length))
    // Una definición con dos puntos debe tener un término corto antes.
    const terminoLargo = separador === DOS_PUNTOS && a.split(/\s+/).length > 6
    return TIENE_CONTENIDO.test(a) && TIENE_CONTENIDO.test(b) && !terminoLargo ? { a, b } : null
  }
  return null
}

/** Dos columnas que parecen nombre y apellido: es una lista de curso, no parejas. */
export function pareceListaDeNombres(lineas: Linea[]): boolean {
  const filas = lineas.filter((l) => l.celdas.length === 2)
  if (filas.length === 0) return false
  const nombres = filas.filter((l) => l.celdas.every((c) => NOMBRE_PROPIO.test(c)))
  return nombres.length >= filas.length * 0.8
}

/** La fila de títulos de una tabla, como "Concepto | Definición". */
function esFilaDeTitulos(linea: Linea): boolean {
  const pareja = leerPareja(linea)
  return pareja !== null && TITULO_DE_COLUMNA.test(pareja.a) && TITULO_DE_COLUMNA.test(pareja.b)
}

/** Para qué actividad se leen las parejas: cambia el máximo y cómo se explican los problemas. */
export type UsoParejas = 'memorice' | 'pareados'

export function leerParejas(
  lineas: Linea[],
  hayTexto: boolean,
  uso: UsoParejas = 'memorice',
): Resultado<Pareja> & { conSeparador: number } {
  const { contenido, descartadas } = recortarBordes(
    conContenido(lineas),
    (l) => (l.titulo && !leerPareja(l)) || esFilaDeTitulos(l),
  )
  const elementos: Pareja[] = []
  let conSeparador = 0
  for (const linea of contenido) {
    const pareja = linea.titulo ? null : leerPareja(linea)
    if (pareja) {
      elementos.push(pareja)
      conSeparador++
    } else {
      descartadas.push(linea)
    }
  }

  // La fila de títulos se descarta sin avisar: es lo esperable en una tabla.
  const advertencias = ignoradas(
    descartadas.filter((l) => !esFilaDeTitulos(l)),
    t.lineasSinPareja,
  )
  const sinParejas = uso === 'memorice' ? t.sinParejas : t.sinTerminos
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-parejas', sinParejas))
    return { elementos, advertencias, conSeparador }
  }
  const repetidas = repetidos(elementos, (p) => claveComparacion(p.a))
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas.map((p) => p.a))))
  if (elementos.length < 2) advertencias.push(advertencia('sin-parejas', sinParejas))
  const maximo = uso === 'memorice' ? MAXIMO_PAREJAS : MAXIMO_TERMINOS
  if (elementos.length > maximo) {
    const mensaje = uso === 'memorice' ? t.demasiadasParejas : t.demasiadosTerminos
    advertencias.push(advertencia('demasiadas-parejas', mensaje(elementos.length, maximo)))
  }
  return { elementos, advertencias, conSeparador }
}

/**
 * Definiciones largas (frases) se leen mejor en términos pareados que en cartas de memorice.
 * Se mira el promedio de palabras del lado derecho.
 */
export function parecenDefiniciones(parejas: Pareja[]): boolean {
  if (parejas.length === 0) return false
  const palabras = parejas.reduce((suma, p) => suma + p.b.split(/\s+/).length, 0) / parejas.length
  return palabras >= 5
}
