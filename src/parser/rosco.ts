import { claveComparacion, sinTildes, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, t, type Resultado } from './comun.ts'
import { separarPareja } from './parejas.ts'
import type { Definicion, Pareja } from './tipos.ts'

/** El orden del rosco: la Ñ va después de la N. */
export const ABECEDARIO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'

/** Más letras no caben en el rosco con letra que se lea desde el fondo. */
export const MAXIMO_ROSCO = 30

/**
 * "A: …", "Con la A: …", "Empieza con A: …", "Contiene la Z: …".
 * El profe también puede escribir "A) …" o "A. …"; solo "A:" sirve para sugerir el rosco,
 * porque "a) …" es una alternativa de selección múltiple.
 */
const LETRA = /^(?:(contiene)\s+(?:la\s+)?|(?:empieza|comienza)\s+(?:con|por)\s+(?:la\s+)?|con\s+(?:la\s+)?)?([a-zñ])\s*([:.)]|[-–—](?=\s))\s*/i
/** "… Respuesta: abeja", en la misma línea (ChatGPT). */
const RESPUESTA = /^(.+?)[\s.]*\b(?:respuesta|r)\s*[:=]\s*(.+)$/i

/** Primera letra de la palabra, sin tilde (la Ñ sigue siendo Ñ). */
export function primeraLetra(palabra: string): string {
  const letra = [...palabra.trim()].find((c) => /\p{L}/u.test(c)) ?? ''
  return letra.toLowerCase() === 'ñ' ? 'Ñ' : sinTildes(letra).toUpperCase()
}

/** ¿La palabra tiene esa letra? Sin mirar tildes; la Ñ no es N. */
function tieneLetra(palabra: string, letra: string) {
  const sinMarcas = (texto: string) => [...texto.toUpperCase()].map((c) => (c === 'Ñ' ? c : sinTildes(c))).join('')
  return sinMarcas(palabra).includes(letra)
}

const palabras = (texto: string) => texto.split(/\s+/).length

interface Leida {
  definicion: Definicion
  /** El profe escribió la letra al comienzo con dos puntos ("A: …"). */
  conLetraYDosPuntos: boolean
}

/** Lee una línea del rosco, o null si no tiene la definición y la palabra. */
export function leerDefinicion(linea: Linea): Leida | null {
  let texto = linea.texto
  let letra: string | null = null
  let contiene = false
  let conLetraYDosPuntos = false
  let respuestaFija = false

  // Tabla de Excel: Letra | Definición | Palabra.
  let celdas = linea.celdas
  if (celdas.length === 3 && /^\p{L}$/u.test(celdas[0])) {
    letra = primeraLetra(celdas[0])
    celdas = celdas.slice(1)
  }
  let pareja: Pareja | null = celdas.length === 2 ? { a: celdas[0], b: celdas[1] } : null

  if (!pareja) {
    const m = texto.match(LETRA)
    if (m) {
      letra = primeraLetra(m[2])
      contiene = Boolean(m[1])
      conLetraYDosPuntos = m[3] === ':'
      texto = texto.slice(m[0].length)
    }
    const conRespuesta = texto.match(RESPUESTA)
    if (conRespuesta) {
      // "Respuesta: …" deja claro cuál es la palabra.
      pareja = { a: conRespuesta[2], b: conRespuesta[1] }
      respuestaFija = true
    } else {
      pareja = separarPareja(texto)
    }
  }
  if (!pareja) return null

  // La palabra es el lado que empieza con la letra; si no se sabe, el más corto (y si empatan, el de la izquierda).
  const [a, b] = [pareja.a, pareja.b].map((lado) => lado.replace(/\.$/, '').trim())
  if (!a || !b) return null
  let respuesta = respuestaFija || palabras(a) <= palabras(b) ? a : b
  if (letra && !respuestaFija) {
    const empiezanBien = [a, b].filter((lado) => primeraLetra(lado) === letra)
    if (empiezanBien.length === 1) respuesta = empiezanBien[0]
  }
  const definicion = respuesta === a ? b : a
  letra ??= primeraLetra(respuesta)
  if (!letra) return null
  if (primeraLetra(respuesta) !== letra) contiene = true
  return { definicion: { letra, contiene, definicion, respuesta }, conLetraYDosPuntos }
}

function posicion(letra: string) {
  const i = ABECEDARIO.indexOf(letra)
  return i === -1 ? ABECEDARIO.length : i
}

/** Una letra por línea: la definición y la palabra, separadas por =. El rosco queda en orden alfabético. */
export function leerRosco(lineas: Linea[], hayTexto: boolean): Resultado<Definicion> & { conLetra: number } {
  const { contenido, descartadas } = recortarBordes(conContenido(lineas), (l) => l.titulo && !leerDefinicion(l))
  const leidas: Definicion[] = []
  let conLetra = 0
  for (const linea of contenido) {
    const leida = linea.titulo ? null : leerDefinicion(linea)
    if (!leida) {
      descartadas.push(linea)
      continue
    }
    leidas.push(leida.definicion)
    if (leida.conLetraYDosPuntos) conLetra++
  }
  // sort es estable: dos palabras con la misma letra quedan en el orden en que se escribieron.
  const elementos = [...leidas].sort((x, y) => posicion(x.letra) - posicion(y.letra))

  const advertencias = ignoradas(descartadas, t.lineasSinDefinicion)
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-definiciones', t.sinDefiniciones))
    return { elementos, advertencias, conLetra }
  }

  const noCalzan = elementos.filter((d) => !tieneLetra(d.respuesta, d.letra))
  if (noCalzan.length > 0) {
    advertencias.push(advertencia('letra-no-calza', t.letraNoCalza(noCalzan.map((d) => `${d.letra}: ${d.respuesta}`))))
  }
  const letras = elementos.map((d) => d.letra)
  const repetidas = [...new Set(letras.filter((l, i) => letras.indexOf(l) !== i))]
  if (repetidas.length > 0) advertencias.push(advertencia('letra-repetida', t.letrasRepetidas(repetidas)))
  const respuestas = elementos.map((d) => claveComparacion(d.respuesta))
  const mismaPalabra = elementos.filter((_, i) => respuestas.indexOf(respuestas[i]) !== i).map((d) => d.respuesta)
  if (mismaPalabra.length > 0) advertencias.push(advertencia('repetidos', t.repetidos([...new Set(mismaPalabra)])))
  if (elementos.length > MAXIMO_ROSCO) {
    advertencias.push(advertencia('demasiadas-definiciones', t.demasiadasDefiniciones(elementos.length, MAXIMO_ROSCO)))
  }
  return { elementos, advertencias, conLetra }
}
