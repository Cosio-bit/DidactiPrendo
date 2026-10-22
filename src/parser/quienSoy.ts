import { claveComparacion, esCharla, type Linea } from './lineas.ts'
import { advertencia, ignoradas, repetidos, t, type Resultado } from './comun.ts'
import type { Adivinanza } from './tipos.ts'

/** Más pistas no se alcanzan a leer en la sala. */
export const MAXIMO_PISTAS = 8

/** "Respuesta: Bernardo O'Higgins", "Soy: …", "Solución: …". */
const RESPUESTA = /^(?:respuesta|soluci[oó]n|soy|r)\s*[:=.-]\s*(.+)$/i
/** Títulos que no son ni respuesta ni pista: "¿Quién soy?", "Adivinanza 2", "Personaje 3:". */
const TITULO = /^(?:¿\s*)?(?:qui[eé]n|qu[eé])\s+soy\s*\??:?$|^(?:adivinanza|personaje|ronda)\s*(?:n[°º.]?\s*)?\d*\s*:?$/i
/** "Pista 1: …" */
const PISTA = /^pista\s*(?:n[°º.]?\s*)?\d*\s*[:.)-]\s*/i
/** "Respuesta: F" es de Verdadero o falso, no de ¿Quién soy? */
const VALOR_VF = /^(?:v|f|verdader[oa]|fals[oa])\.?$/i

export function esRespuesta(texto: string): string | null {
  const m = texto.match(RESPUESTA)
  return m && !VALOR_VF.test(m[1].trim()) ? m[1].trim() : null
}

export function esTituloDeAdivinanza(texto: string): boolean {
  return TITULO.test(texto.trim())
}

/**
 * Cada adivinanza: la respuesta en la primera línea y debajo las pistas, de la más difícil a la más fácil.
 * También sirve una línea "Respuesta: …" en cualquier lugar. Las adivinanzas se separan con una línea vacía
 * (o con un título como "Adivinanza 2").
 */
export function leerQuienSoy(lineas: Linea[], hayTexto: boolean): Resultado<Adivinanza> & { conRespuesta: number } {
  const grupos: Linea[][] = [[]]
  const descartadas: Linea[] = []
  for (const linea of lineas) {
    const actual = grupos[grupos.length - 1]
    if (linea.separador || linea.vacia || linea.texto === '') {
      if (actual.length > 0) grupos.push([])
    } else if (linea.encabezadoDeLista || esCharla(linea.texto)) {
      descartadas.push(linea)
    } else if (esTituloDeAdivinanza(linea.texto)) {
      if (actual.length > 0) grupos.push([])
    } else {
      actual.push(linea)
      // Con la respuesta escrita, la adivinanza termina ahí aunque no venga una línea vacía.
      if (esRespuesta(linea.texto)) grupos.push([])
    }
  }

  const elementos: Adivinanza[] = []
  const sinPistas: string[] = []
  let conRespuesta = 0
  for (const grupo of grupos.filter((g) => g.length > 0)) {
    const explicita = grupo.find((l) => esRespuesta(l.texto))
    const resto = grupo.filter((l) => l !== explicita)
    let respuesta: string
    if (explicita) respuesta = esRespuesta(explicita.texto)!
    else respuesta = resto.shift()!.texto.replace(/:$/, '').trim()
    const pistas = resto.map((l) => l.texto.replace(PISTA, '').trim()).filter(Boolean)
    if (explicita && pistas.length > 0) conRespuesta++
    if (pistas.length > 0) elementos.push({ respuesta, pistas })
    // Una línea suelta, sin pistas ni respuesta, es un título o un comentario.
    else if (explicita) sinPistas.push(respuesta)
    else descartadas.push(grupo[0])
  }

  const advertencias = ignoradas(descartadas, t.lineasIgnoradasLista)
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-adivinanzas', t.sinAdivinanzas))
    return { elementos, advertencias, conRespuesta }
  }
  if (sinPistas.length > 0) advertencias.push(advertencia('sin-pistas', t.sinPistas(sinPistas)))
  const repetidas = repetidos(elementos, (a) => claveComparacion(a.respuesta))
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas.map((a) => a.respuesta))))
  const largas = elementos.filter((a) => a.pistas.length > MAXIMO_PISTAS).map((a) => a.respuesta)
  if (largas.length > 0) advertencias.push(advertencia('demasiadas-pistas', t.demasiadasPistas(largas, MAXIMO_PISTAS)))
  return { elementos, advertencias, conRespuesta }
}
