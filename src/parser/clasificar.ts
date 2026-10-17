import { claveComparacion, esCharla, type Linea } from './lineas.ts'
import { advertencia, conContenido, ignoradas, t, type Resultado } from './comun.ts'
import type { Categoria } from './tipos.ts'

/** Más categorías no caben lado a lado en la proyección. */
export const MAXIMO_CATEGORIAS = 4

/** "Mamíferos: perro, ballena, murciélago" */
const CATEGORIA_EN_LINEA = /^([^:]{1,40}):\s+(.+)$/

/** "perro, ballena, murciélago" → tres elementos. */
function separarElementos(texto: string): string[] {
  return texto
    .split(/\s*[,;]\s*/)
    .map((p) => p.trim().replace(/\.$/, ''))
    .filter(Boolean)
}

/**
 * Una categoría en línea "se nota" si tiene dos o más elementos cortos.
 * Así "Sustantivo: palabra que nombra personas, animales o cosas" no se confunde con una categoría.
 */
function pareceCategoria(elementos: string[]) {
  return elementos.length >= 2 && elementos.every((e) => e.split(/\s+/).length <= 3)
}

function esEncabezado(linea: Linea) {
  return (
    !linea.encabezadoDeLista &&
    (linea.titulo || linea.texto.endsWith(':') || (linea.negrita && linea.texto.split(/\s+/).length <= 5))
  )
}

export interface LecturaClasificar extends Resultado<Categoria> {
  /** Qué tan claro es que el texto es para clasificar. */
  claridad: 'clara' | 'tabla-de-dos' | 'dudosa' | 'no'
}

function desdeTabla(contenido: Linea[]): Categoria[] | null {
  const [encabezado, ...filas] = contenido
  if (!encabezado || encabezado.encabezadoDeLista || encabezado.columnas.length < 2) return null
  if (filas.length === 0 || filas.some((f) => f.columnas.length < 2)) return null
  return encabezado.columnas.map((nombre, i) => ({
    nombre,
    elementos: filas.map((f) => f.columnas[i] ?? '').filter(Boolean),
  }))
}

export function leerClasificar(lineas: Linea[], hayTexto: boolean): LecturaClasificar {
  const contenido = conContenido(lineas)
  const descartadas: Linea[] = []
  let categorias: Categoria[] = []
  let claridad: LecturaClasificar['claridad'] = 'no'

  const tabla = desdeTabla(contenido)
  if (tabla) {
    categorias = tabla
    claridad = tabla.length >= 3 ? 'clara' : 'tabla-de-dos'
  } else {
    let actual: Categoria | null = null
    let porEncabezado = 0
    const enLinea: Categoria[] = []
    for (const linea of contenido) {
      const m = linea.titulo ? null : linea.texto.match(CATEGORIA_EN_LINEA)
      if (m && !esCharla(linea.texto)) {
        actual = { nombre: m[1].trim(), elementos: separarElementos(m[2]) }
        categorias.push(actual)
        enLinea.push(actual)
      } else if (esEncabezado(linea) && !esCharla(linea.texto)) {
        actual = { nombre: linea.texto.replace(/:$/, '').trim(), elementos: [] }
        categorias.push(actual)
        porEncabezado++
      } else if (actual && !esCharla(linea.texto)) {
        actual.elementos.push(...separarElementos(linea.texto.replace(/[,;]$/, '')))
      } else {
        descartadas.push(linea)
      }
    }
    const conElementos = categorias.filter((c) => c.elementos.length > 0).length
    // Solo categorías en línea: puede ser una lista de definiciones; se exige que se note.
    const notorias = enLinea.filter((c) => pareceCategoria(c.elementos)).length
    const enLineaClaras = notorias >= 2 && notorias >= enLinea.length / 2
    if (conElementos >= 2) claridad = porEncabezado > 0 || enLineaClaras ? 'clara' : 'dudosa'
  }

  const advertencias = ignoradas(descartadas, t.lineasSinCategoria)
  const conElementos = categorias.filter((c) => c.elementos.length > 0)
  if (conElementos.length < 2) {
    if (hayTexto) advertencias.push(advertencia('pocas-categorias', t.pocasCategorias))
    return { elementos: categorias, advertencias, claridad: 'no' }
  }

  const vacias = categorias.filter((c) => c.elementos.length === 0).map((c) => c.nombre)
  if (vacias.length > 0) advertencias.push(advertencia('categoria-vacia', t.categoriasVacias(vacias)))

  const vistos = new Map<string, string>()
  const enDos = new Set<string>()
  for (const c of categorias) {
    for (const e of new Set(c.elementos.map(claveComparacion))) {
      if (vistos.has(e)) enDos.add(vistos.get(e)!)
      else vistos.set(e, c.elementos.find((x) => claveComparacion(x) === e)!)
    }
  }
  if (enDos.size > 0) advertencias.push(advertencia('repetidos', t.enDosCategorias([...enDos])))

  if (categorias.length > MAXIMO_CATEGORIAS) {
    advertencias.push(
      advertencia('demasiadas-categorias', t.demasiadasCategorias(categorias.length, MAXIMO_CATEGORIAS)),
    )
  }
  return { elementos: categorias, advertencias, claridad }
}
