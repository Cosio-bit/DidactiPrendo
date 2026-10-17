/** Una línea del texto pegado, ya limpia de viñetas, numeración y formato. */
export interface Linea {
  /** Número de línea en el texto original, desde 1. */
  numero: number
  texto: string
  /** Sin contenido útil (puede ser numerada igual, como "Pregunta 3"). */
  vacia: boolean
  /** Tenía numeración ("1.", "2.-", "Pregunta 3:"): suele marcar el inicio de una pregunta. */
  numerada: boolean
  /** Título de markdown ("### Mamíferos") o encabezado de tabla ("N°  Nombre"). */
  titulo: boolean
  /** Línea divisoria ("---") o fila de formato de una tabla. */
  separador: boolean
  /** Toda la línea (o la alternativa) venía en negrita. */
  negrita: boolean
}

const INVISIBLES = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g
const SALTOS = /\r\n?|[\v\f\u2028\u2029\u0085]/g
const ESPACIOS_DUROS = /[\u00A0\u2007\u202F]/g

const CELDA_NUMERO = /^\(?\d{1,3}\)?(?:\.-|[.)-])?$/
const CELDA_VINETA = /^(?:[•·◦▪▫●○■□►▶➢➤→§Ø*+o\-–—]|[\uE000-\uF8FF])$/
const CELDA_ENCABEZADO = /^(?:n[°º.]?|nro\.?|núm\.?|num\.?|#|número|numero)$/i
/** Títulos de columna típicos de una lista de curso copiada de Excel. */
const COLUMNA_DE_LISTA =
  /^(?:n[°º.]?|nro\.?|#|n[uú]mero|nombres?|apellidos?|estudiantes?|alumn[oa]s?|curso|rut|correo|e-?mail)$/i

const VINETA = /^(?:[•·◦▪▫●○■□►▶➢➤→\uE000-\uF8FF]\s*|[-–—*+]\s+)/
const NUMERO = /^(?:\(\d{1,3}\)|\d{1,3}(?:\.-|[.)-]))\s+/
const PREGUNTA_N = /^(?:pregunta|ejercicio|[íi]tem)\s*(?:n[°º.]?\s*)?\d{1,3}\s*(?:\.-|[:.)-])\s*/i
/** "Pregunta 3" sola en su línea (o como título): solo marca dónde empieza una pregunta. */
export const MARCA_PREGUNTA = /^(?:pregunta|ejercicio|[íi]tem)\s*(?:n[°º.]?\s*)?\d{1,3}\s*[:.]?$/i
const SEPARADOR = /^([-*_])(?:\s*\1){2,}$/
const TITULO_MD = /^#{1,6}\s+/
/** "*b) 3/4" o "* b) 3/4": el asterisco marca la correcta, no es viñeta. */
const ASTERISCO_DE_CORRECTA = /^\*\s*\(?[a-h](?:\)|\.-|[.-]\s)/i
const NEGRITA_COMPLETA = /^(?:\*?\s*\(?[a-h](?:\)|\.-|\.)\s*)?\*\*[^*].*\*\*$|^__.+__$/i

export function normalizar(texto: string): string {
  return texto.replace(INVISIBLES, '').replace(SALTOS, '\n').replace(ESPACIOS_DUROS, ' ')
}

export function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function quitarViñetasYNumeros(texto: string, linea: Pick<Linea, 'numerada'>): string {
  for (;;) {
    const antes = texto
    if (!ASTERISCO_DE_CORRECTA.test(texto)) texto = texto.replace(VINETA, '')
    const numero = texto.match(NUMERO) ?? texto.match(PREGUNTA_N)
    if (numero) {
      linea.numerada = true
      texto = texto.slice(numero[0].length)
    }
    if (texto === antes) return texto.trim()
  }
}

export function limpiarLinea(original: string, numero: number): Linea {
  const linea: Linea = {
    numero,
    texto: '',
    vacia: false,
    numerada: false,
    titulo: false,
    separador: false,
    negrita: false,
  }
  let texto = original

  // Tablas de markdown (ChatGPT): se tratan como columnas de Excel.
  if (/^\s*\|.*\|\s*$/.test(texto)) {
    if (/^\s*\|[\s|:-]+\|\s*$/.test(texto) && texto.includes('-')) {
      return { ...linea, vacia: true, separador: true }
    }
    texto = texto.trim().slice(1, -1).split('|').join('\t')
  }

  // Columnas de Excel y listas de Word ("1.\tTexto", "•\tTexto").
  const celdas = texto
    .split('\t')
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (celdas.length > 1) {
    if (CELDA_ENCABEZADO.test(celdas[0]) || celdas.every((c) => COLUMNA_DE_LISTA.test(c))) linea.titulo = true
    else if (CELDA_NUMERO.test(celdas[0])) {
      linea.numerada = true
      celdas.shift()
    } else if (CELDA_VINETA.test(celdas[0]) && !(celdas[0] === '*' && ASTERISCO_DE_CORRECTA.test(`*${celdas[1]}`))) {
      celdas.shift()
    }
  }
  texto = celdas.join(' ')

  if (SEPARADOR.test(texto)) return { ...linea, vacia: true, separador: true }

  if (TITULO_MD.test(texto)) {
    linea.titulo = true
    texto = texto.replace(TITULO_MD, '')
  }
  texto = texto.replace(/^>\s*/, '')

  texto = quitarViñetasYNumeros(texto, linea)

  // Negritas de ChatGPT.
  linea.negrita = NEGRITA_COMPLETA.test(texto)
  texto = texto
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*\*/g, '')
  texto = quitarViñetasYNumeros(texto, linea)

  linea.texto = texto
  linea.vacia = texto === '' && !linea.numerada
  return linea
}

export function leerLineas(texto: string): Linea[] {
  return normalizar(texto)
    .split('\n')
    .map((l, i) => limpiarLinea(l, i + 1))
}

const CHARLA =
  /^(?:¡\s*)?(?:claro|por supuesto|aqui (?:tienes|te dejo|va|van)|aca (?:tienes|te dejo)|te (?:comparto|dejo)|con gusto|listo|perfecto|excelente|genial)\b|^(?:¿\s*)?(?:quieres|te gustaria|necesitas|deseas|prefieres)\b|^si (?:quieres|necesitas|deseas|te sirve|gustas)\b|^espero que\b/

/** Frases de saludo o cierre que agrega ChatGPT ("¡Claro! Aquí tienes…", "¿Quieres que…?"). */
export function esCharla(texto: string): boolean {
  const comparable = sinTildes(texto.toLowerCase())
  if (!CHARLA.test(comparable)) return false
  return texto.split(/\s+/).length >= 3 || /[!:?.]$/.test(texto)
}

/** Para comparar repetidos: sin mayúsculas, tildes ni espacios de más. */
export function claveComparacion(texto: string): string {
  return sinTildes(texto.toLowerCase()).replace(/\s+/g, ' ').trim()
}
