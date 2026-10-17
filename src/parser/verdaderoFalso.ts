import { claveComparacion, sinTildes, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, recortarBordes, repetidos, t, type Resultado } from './comun.ts'
import type { Afirmacion } from './tipos.ts'

const VALOR = String.raw`(v|f|verdadero|falso|verdadera|falsa)`
/** "V) …", "(F) …", "V. …", "Verdadero: …" */
const MARCA_INICIO = new RegExp(String.raw`^(?:[(\[]\s*${VALOR}\s*[)\]]|${VALOR}\s*(?:\)|\.-|[.:-](?=\s)))\s*`, 'i')
/** "… (V)", "… [F]", "… - F", "… → Verdadero" */
const MARCA_FINAL = new RegExp(String.raw`\s*(?:[(\[]\s*${VALOR}\s*[)\]]|\s[-–—:→=]\s*${VALOR})\s*\.?$`, 'i')
/** "Respuesta: Falso", en la línea de abajo (ChatGPT). */
const RESPUESTA = new RegExp(String.raw`^(?:respuesta|r)\s*[:.-]\s*${VALOR}\.?$`, 'i')
/** "____ La ballena…" o "( ) La ballena…": la guía deja el espacio para responder. */
const ESPACIO_PARA_RESPONDER = /^(?:_{2,}|\(\s*\)|\[\s*\])\s*/
/** "Escribe V si es verdadero o F si es falso." */
const INSTRUCCION = /\b(?:v\s+o\s+f|verdader[oa]s?\b.*\bfals[oa]s?)\b/i

function esVerdadero(valor: string) {
  return sinTildes(valor.toLowerCase()).startsWith('v')
}

/** Lee la afirmación de la línea y si dice verdadera o falsa. */
export function leerAfirmacion(texto: string): { afirmacion: Afirmacion; marcada: boolean } {
  let verdadera: boolean | null = null
  let resto = texto.replace(ESPACIO_PARA_RESPONDER, '')
  const inicio = resto.match(MARCA_INICIO)
  if (inicio) {
    verdadera = esVerdadero(inicio[1] ?? inicio[2])
    resto = resto.slice(inicio[0].length)
  } else {
    const final = resto.match(MARCA_FINAL)
    if (final) {
      verdadera = esVerdadero(final[1] ?? final[2])
      resto = resto.slice(0, final.index)
    }
  }
  return { afirmacion: { texto: resto.trim(), verdadera }, marcada: verdadera !== null }
}

export function leerVerdaderoFalso(lineas: Linea[], hayTexto: boolean): Resultado<Afirmacion> & { marcadas: number } {
  const { contenido, descartadas } = recortarBordes(
    conContenido(lineas),
    (l) => l.titulo || l.texto.endsWith(':') || INSTRUCCION.test(l.texto),
  )
  const elementos: Afirmacion[] = []
  let marcadas = 0
  for (const linea of contenido) {
    const respuesta = linea.texto.match(RESPUESTA)
    const anterior = elementos[elementos.length - 1]
    if (respuesta && anterior && anterior.verdadera === null) {
      anterior.verdadera = esVerdadero(respuesta[1])
      marcadas++
      continue
    }
    if (linea.titulo || INSTRUCCION.test(linea.texto) || respuesta) {
      descartadas.push(linea)
      continue
    }
    const { afirmacion, marcada } = leerAfirmacion(linea.texto)
    if (!afirmacion.texto) {
      descartadas.push(linea)
      continue
    }
    elementos.push(afirmacion)
    if (marcada) marcadas++
  }

  const advertencias = ignoradas(descartadas, t.lineasIgnoradasLista)
  if (elementos.length === 0) {
    if (hayTexto) advertencias.push(advertencia('sin-afirmaciones', t.sinAfirmaciones))
    return { elementos, advertencias, marcadas }
  }
  const sinRespuesta = elementos.flatMap((a, i) => (a.verdadera === null ? [i + 1] : []))
  if (sinRespuesta.length > 0) advertencias.push(advertencia('sin-respuesta', t.sinRespuesta(sinRespuesta)))
  const repetidas = repetidos(elementos, (a) => claveComparacion(a.texto))
  if (repetidas.length > 0) advertencias.push(advertencia('repetidos', t.repetidos(repetidas.map((a) => a.texto))))
  return { elementos, advertencias, marcadas }
}
