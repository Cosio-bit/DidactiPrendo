import { claveComparacion, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, repetidos, t, type Resultado } from './comun.ts'
import type { Pareja } from './tipos.ts'

/** El memorice se lee bien proyectado hasta con esta cantidad de parejas. */
export const MAXIMO_PAREJAS = 12

/** Separadores, del más claro al más dudoso. Se usa el primero que aparezca en la línea. */
const SEPARADORES: RegExp[] = [/\s*=\s*/, /\s*(?:→|->|⇒)\s*/, /\s*:\s+/, /\s+[-–—]\s+/]

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
  for (const separador of SEPARADORES) {
    const m = linea.texto.match(separador)
    if (!m) continue
    const a = lado(linea.texto.slice(0, m.index))
    const b = lado(linea.texto.slice(m.index! + m[0].length))
    // Una definición con dos puntos debe tener un término corto antes.
    const terminoLargo = separador === SEPARADORES[2] && a.split(/\s+/).length > 6
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

export function leerParejas(lineas: Linea[], hayTexto: boolean): Resultado<Pareja> & { conSeparador: number } {
  const { contenido, descartadas } = recortarBordes(conContenido(lineas), (l) => l.titulo && !leerPareja(l))
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

  const advertencias = ignoradas(descartadas, t.lineasSinPareja)
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-parejas', t.sinParejas))
    return { elementos, advertencias, conSeparador }
  }
  const repetidas = repetidos(elementos, (p) => claveComparacion(p.a))
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas.map((p) => p.a))))
  if (elementos.length < 2) advertencias.push(advertencia('sin-parejas', t.sinParejas))
  if (elementos.length > MAXIMO_PAREJAS) {
    advertencias.push(advertencia('demasiadas-parejas', t.demasiadasParejas(elementos.length, MAXIMO_PAREJAS)))
  }
  return { elementos, advertencias, conSeparador }
}
