import { textos } from '../i18n/es-CL.ts'
import { claveComparacion, esCharla, leerLineas, MARCA_PREGUNTA, normalizar, type Linea } from './lineas.ts'
import type { Advertencia, Lectura, Pregunta, TipoLectura } from './tipos.ts'

/** La ruleta se lee bien proyectada hasta con esta cantidad de elementos. */
export const MAXIMO_RULETA = 60

const t = textos.lector

/**
 * Lee el texto que pegó el profe y lo convierte en elementos de un bloque.
 * Sugiere un tipo de bloque; con `tipo` se fuerza la lectura como ese tipo.
 * Nunca lanza errores: lo que no entiende lo explica en `advertencias`.
 */
export function parseText(texto: string, tipo?: TipoLectura): Lectura {
  const lineas = leerLineas(texto)
  // Si había algo escrito y no sale nada útil, hay que explicarlo.
  const hayTexto = normalizar(texto).trim() !== ''
  const preguntas = leerPreguntas(lineas, hayTexto)
  const tipoSugerido: TipoLectura = preguntas.validas > 0 ? 'preguntas' : 'ruleta'
  const elegido = tipo ?? tipoSugerido

  if (elegido === 'preguntas') {
    return { tipo: 'preguntas', tipoSugerido, elementos: preguntas.preguntas, advertencias: preguntas.advertencias }
  }
  const lista = leerLista(lineas, hayTexto)
  return { tipo: 'ruleta', tipoSugerido, elementos: lista.elementos, advertencias: lista.advertencias }
}

function citas(lineas: Linea[]) {
  return lineas.map((l) => l.texto)
}

function ignoradas(lineas: Linea[], mensaje: (citas: string[]) => string): Advertencia[] {
  if (lineas.length === 0) return []
  const ordenadas = [...lineas].sort((a, b) => a.numero - b.numero)
  return [{ codigo: 'lineas-ignoradas', mensaje: mensaje(citas(ordenadas)), lineas: ordenadas.map((l) => l.numero) }]
}

/** Agrupa los textos repetidos; devuelve el primero de cada grupo. */
function repetidos<T>(elementos: T[], clave: (e: T) => string): T[] {
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

// ---------------------------------------------------------------- Lista (ruleta)

function leerLista(lineas: Linea[], hayTexto: boolean): { elementos: string[]; advertencias: Advertencia[] } {
  const contenido = lineas.filter((l) => !l.separador && l.texto !== '')
  const descartadas: Linea[] = []

  // Títulos y saludos antes del primer elemento; preguntas de cierre de ChatGPT al final.
  while (contenido.length > 0) {
    const primera = contenido[0]
    if (!(primera.titulo || esCharla(primera.texto) || primera.texto.endsWith(':'))) break
    descartadas.push(contenido.shift()!)
  }
  while (contenido.length > 0 && esCharla(contenido[contenido.length - 1].texto)) {
    descartadas.push(contenido.pop()!)
  }

  const usadas = contenido.filter((l) => {
    if (l.titulo) descartadas.push(l)
    return !l.titulo
  })
  let elementos = usadas.map((l) => l.texto.replace(/\s*[,;]$/, ''))

  const advertencias: Advertencia[] = []

  // Todo en una sola línea separado por comas: "rojo, azul, verde".
  if (elementos.length === 1) {
    const separador = elementos[0].includes(';') ? ';' : ','
    const partes = elementos[0].split(separador).map((p) => p.trim()).filter(Boolean)
    if (partes.length >= 3 && partes.every((p) => p.length <= 40)) {
      elementos = partes
      advertencias.push({ codigo: 'separado-por-comas', mensaje: t.separadoPorComas, lineas: [usadas[0].numero] })
    }
  }

  advertencias.unshift(...ignoradas(descartadas, t.lineasIgnoradasLista))

  if (elementos.length === 0) {
    if (hayTexto) advertencias.push({ codigo: 'sin-elementos', mensaje: t.sinElementos, lineas: [] })
    return { elementos, advertencias }
  }

  const repetidas = repetidos(elementos, claveComparacion)
  if (repetidas.length > 0) {
    advertencias.push({ codigo: 'repetidos', mensaje: t.repetidos(repetidas), lineas: [] })
  }
  if (elementos.length < 2) {
    advertencias.push({ codigo: 'pocos-elementos', mensaje: t.pocosElementos, lineas: [] })
  }
  if (elementos.length > MAXIMO_RULETA) {
    advertencias.push({
      codigo: 'demasiados-elementos',
      mensaje: t.demasiadosElementos(elementos.length, MAXIMO_RULETA),
      lineas: [],
    })
  }
  return { elementos, advertencias }
}

// ---------------------------------------------------------------- Preguntas

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

function leerPreguntas(lineas: Linea[], hayTexto: boolean): { preguntas: Pregunta[]; validas: number; advertencias: Advertencia[] } {
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
      ? [{ codigo: 'sin-preguntas', mensaje: t.sinPreguntas, lineas: [] }]
      : []
    return { preguntas, validas, advertencias }
  }

  const advertencias = ignoradas(sobrantes, t.lineasIgnoradasPreguntas)
  const numeros = (filtro: (p: Pregunta) => boolean) =>
    preguntas.flatMap((p, i) => (filtro(p) ? [i + 1] : []))
  const agregar = (codigo: Advertencia['codigo'], nums: number[], mensaje: (n: number[]) => string) => {
    if (nums.length > 0) advertencias.push({ codigo, mensaje: mensaje(nums), lineas: [] })
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
