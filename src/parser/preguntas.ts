import { claveComparacion, esCharla, MARCA_PREGUNTA, type Linea } from './lineas.ts'
import { advertencia, ignoradas, repetidos, t } from './comun.ts'
import type { Advertencia, Pregunta } from './tipos.ts'

interface AlternativaLeida {
  texto: string
  correcta: boolean
  negrita: boolean
}

interface PreguntaEnArmado {
  enunciado: string
  alternativas: AlternativaLeida[]
  /** Letra indicada en una línea "Respuesta: b". */
  respuesta?: string
}

const ALTERNATIVA = /^(\*\s*)?(?:\(([a-h])\)|([a-h])\)|([a-h])(?:\.-|[.-])(?=\s))\s*(.*)$/i
const MARCA_CORRECTA_INICIO = /^(?:✅|✔️?|☑️?|✓)\s*/
const MARCA_CORRECTA_FINAL = /\s*(?:\((?:respuesta\s+)?correcta\)|✅|✔️?|☑️?|✓|\*)\s*$/i
const RESPUESTA =
  /^(?:la\s+)?(?:respuesta(?:\s+correcta)?|alternativa\s+correcta|correcta|clave)\s*(?:es)?\s*[:=-]?\s*\(?([a-h])(?:\)|[.,:]|\s|$)/i
const ALTERNATIVA_EN_LINEA = /(^|\s)(\*?)\(?([a-h])\)/gi

function leerAlternativa(linea: Linea): AlternativaLeida | null {
  let texto = linea.texto
  let correcta = false
  if (MARCA_CORRECTA_INICIO.test(texto)) {
    correcta = true
    texto = texto.replace(MARCA_CORRECTA_INICIO, '')
  }
  const m = texto.match(ALTERNATIVA)
  if (!m) return null
  let resto = m[5]
  if (m[1]) correcta = true
  if (resto.startsWith('*')) {
    correcta = true
    resto = resto.slice(1)
  }
  if (MARCA_CORRECTA_FINAL.test(resto)) {
    correcta = true
    resto = resto.replace(MARCA_CORRECTA_FINAL, '')
  }
  resto = resto.trim()
  if (!resto) return null
  return { texto: resto, correcta, negrita: linea.negrita }
}

/** "a) 54   *b) 56   c) 58" o "¿Cuánto es 9 × 6? a) 54 b) 56" se separan en varias líneas. */
function separarAlternativasEnLinea(linea: Linea): Linea[] {
  const marcas = [...linea.texto.matchAll(ALTERNATIVA_EN_LINEA)]
  if (marcas.length < 2) return [linea]
  const letras = marcas.map((m) => m[3].toLowerCase().charCodeAt(0))
  if (letras[0] !== 'a'.charCodeAt(0) || letras.some((l, i) => l !== letras[0] + i)) return [linea]

  const inicios = marcas.map((m) => m.index! + m[1].length)
  const prefijo = linea.texto.slice(0, inicios[0]).trim()
  const partes = inicios.map((inicio, i) => linea.texto.slice(inicio, inicios[i + 1]).trim())
  const alternativas = partes.map((texto) => ({ ...linea, texto, numerada: false, negrita: false, titulo: false }))
  return prefijo ? [{ ...linea, texto: prefijo }, ...alternativas] : alternativas
}

interface Pendiente {
  linea: Linea
  /** Había una línea vacía justo antes. */
  trasVacia: boolean
}

/**
 * De las líneas sueltas antes de unas alternativas, elige cuáles forman el enunciado.
 * Empieza en la última línea numerada o, si no hay, en el último párrafo.
 * Si dentro hay otra pregunta terminada en "?", esa quedó sin alternativas.
 */
function elegirEnunciado(pendientes: Pendiente[]): { enunciado: string; sobrantes: Linea[] } {
  let inicio = 0
  pendientes.forEach((p, i) => {
    if (p.trasVacia) inicio = i
  })
  const ultimaNumerada = pendientes.findLastIndex((p) => p.linea.numerada || MARCA_PREGUNTA.test(p.linea.texto))
  if (ultimaNumerada >= 0) inicio = ultimaNumerada
  for (let i = inicio; i < pendientes.length - 1; i++) {
    if (pendientes[i].linea.texto.endsWith('?')) inicio = i + 1
  }

  const sobrantes = pendientes.slice(0, inicio).map((p) => p.linea)
  const partes: string[] = []
  for (const { linea } of pendientes.slice(inicio)) {
    if (linea.texto === '' || MARCA_PREGUNTA.test(linea.texto)) continue
    if (linea.titulo || esCharla(linea.texto)) sobrantes.push(linea)
    else partes.push(linea.texto)
  }
  return { enunciado: partes.join(' '), sobrantes }
}

function cerrarPregunta(armado: PreguntaEnArmado): Pregunta {
  const alternativas = armado.alternativas.map((a) => ({ texto: a.texto, correcta: a.correcta }))
  if (armado.respuesta !== undefined) {
    const indice = armado.respuesta.charCodeAt(0) - 'a'.charCodeAt(0)
    if (alternativas[indice]) alternativas[indice].correcta = true
  }
  // Si ninguna está marcada, ChatGPT a veces deja en negrita la correcta.
  const enNegrita = armado.alternativas.filter((a) => a.negrita)
  if (!alternativas.some((a) => a.correcta) && enNegrita.length === 1 && armado.alternativas.length > 1) {
    alternativas[armado.alternativas.indexOf(enNegrita[0])].correcta = true
  }
  return { enunciado: armado.enunciado, alternativas }
}

export function leerPreguntas(lineas: Linea[], hayTexto: boolean): { preguntas: Pregunta[]; validas: number; advertencias: Advertencia[] } {
  const armadas: PreguntaEnArmado[] = []
  const sobrantes: Linea[] = []
  let pendientes: Pendiente[] = []
  let trasVacia = false
  let actual: PreguntaEnArmado | null = null

  for (const linea of lineas.flatMap(separarAlternativasEnLinea)) {
    if (linea.vacia || linea.separador) {
      trasVacia = true
      continue
    }

    const respuesta = linea.texto.match(RESPUESTA)
    if (respuesta && actual && pendientes.length === 0) {
      actual.respuesta = respuesta[1].toLowerCase()
      trasVacia = false
      continue
    }

    const alternativa = leerAlternativa(linea)
    if (alternativa) {
      if (!actual || pendientes.length > 0) {
        const { enunciado, sobrantes: extra } = elegirEnunciado(pendientes)
        sobrantes.push(...extra)
        actual = { enunciado, alternativas: [] }
        armadas.push(actual)
        pendientes = []
      }
      actual.alternativas.push(alternativa)
    } else {
      pendientes.push({ linea, trasVacia })
    }
    trasVacia = false
  }
  sobrantes.push(...pendientes.map((p) => p.linea).filter((l) => l.texto !== ''))

  const preguntas = armadas.map(cerrarPregunta)
  const validas = preguntas.filter((p) => p.enunciado && p.alternativas.length >= 2).length

  if (preguntas.length === 0) {
    const advertencias: Advertencia[] = hayTexto
      ? [advertencia('sin-preguntas', t.sinPreguntas)]
      : []
    return { preguntas, validas, advertencias }
  }

  const advertencias = ignoradas(sobrantes, t.lineasIgnoradasPreguntas)
  const numeros = (filtro: (p: Pregunta) => boolean) =>
    preguntas.flatMap((p, i) => (filtro(p) ? [i + 1] : []))
  const agregar = (codigo: Advertencia['codigo'], nums: number[], mensaje: (n: number[]) => string) => {
    if (nums.length > 0) advertencias.push(advertencia(codigo, mensaje(nums)))
  }
  const correctas = (p: Pregunta) => p.alternativas.filter((a) => a.correcta).length

  agregar('sin-enunciado', numeros((p) => !p.enunciado), t.sinEnunciado)
  agregar('sin-correcta', numeros((p) => correctas(p) === 0), t.sinCorrecta)
  agregar('varias-correctas', numeros((p) => correctas(p) > 1), t.variasCorrectas)
  agregar('pocas-alternativas', numeros((p) => p.alternativas.length < 2), t.pocasAlternativas)

  const repetidas = repetidos(preguntas, (p) => claveComparacion(p.enunciado))
  agregar('repetidos', repetidas.map((p) => preguntas.indexOf(p) + 1), t.preguntasRepetidas)

  return { preguntas, validas, advertencias }
}
