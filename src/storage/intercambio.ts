// Pasar actividades de un computador a otro sin servidor: en un archivo o dentro de un enlace.
import type { Almacen } from './bloques.ts'
import { SCHEMA_VERSION, type Block, type BlockType } from './modelo.ts'

const TIPOS: BlockType[] = ['ruleta', 'preguntas', 'parejas', 'terminos-pareados', 'verdadero-falso', 'ordenar', 'clasificar', 'marcador', 'temporizador']
const APLICACION = 'DidactiPrendo'
const FORMATO_ARCHIVO = 1

// ---------- Archivo ----------

/** Contenido del archivo de respaldo: las actividades tal como están guardadas. */
export function paraArchivo(bloques: Block[], ahora = new Date()): string {
  return JSON.stringify(
    { aplicacion: APLICACION, formato: FORMATO_ARCHIVO, exportado: ahora.toISOString(), actividades: bloques },
    null,
    1,
  )
}

const esTextoOpcional = (v: unknown) => v === undefined || typeof v === 'string'

function esBloque(b: unknown): b is Block {
  if (typeof b !== 'object' || b === null) return false
  const x = b as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    x.id !== '' &&
    TIPOS.includes(x.type as BlockType) &&
    typeof x.title === 'string' &&
    esTextoOpcional(x.texto) &&
    esTextoOpcional(x.course) &&
    esTextoOpcional(x.subject) &&
    esTextoOpcional(x.oa) &&
    Number.isFinite(x.createdAt) &&
    Number.isFinite(x.updatedAt) &&
    x.schemaVersion === SCHEMA_VERSION
  )
}

/** Las actividades de un archivo, o null si el archivo no es de DidactiPrendo o está dañado. */
export function leerArchivo(texto: string): Block[] | null {
  try {
    const datos = JSON.parse(texto) as { aplicacion?: unknown; actividades?: unknown }
    if (datos?.aplicacion !== APLICACION || !Array.isArray(datos.actividades)) return null
    const bloques = datos.actividades.filter(esBloque)
    return bloques.length === datos.actividades.length ? bloques : null
  } catch {
    return null
  }
}

export interface ResultadoImportar {
  /** Las que se agregaron (para poder deshacer). */
  agregadas: Block[]
  /** Las que ya estaban iguales y no se volvieron a agregar. */
  yaEstaban: number
}

const mismoContenido = (a: Block, b: Block) =>
  a.type === b.type && a.title === b.title && (a.texto ?? '') === (b.texto ?? '') && JSON.stringify(a.config) === JSON.stringify(b.config)

/**
 * Agrega las actividades del archivo sin reemplazar nunca nada:
 * - si no existe, se agrega tal cual (con su fecha);
 * - si ya está igual, no se repite;
 * - si existe una con el mismo identificador pero distinta, se agrega como copia aparte.
 */
export async function importar(almacen: Almacen, bloques: Block[]): Promise<ResultadoImportar> {
  const agregadas: Block[] = []
  let yaEstaban = 0
  for (const bloque of bloques) {
    const existente = await almacen.obtener(bloque.id)
    if (!existente) {
      await almacen.restaurar(bloque)
      agregadas.push(bloque)
    } else if (mismoContenido(existente, bloque)) {
      yaEstaban++
    } else {
      const { type, title, items, config, texto, course, subject, oa } = bloque
      agregadas.push(await almacen.crear({ type, title, items, config, texto, course, subject, oa }))
    }
  }
  return { agregadas, yaEstaban }
}

// ---------- Enlace ----------

/** Lo que viaja en un enlace: lo necesario para volver a armar la actividad (los items se leen del texto). */
export interface Compartida {
  type: BlockType
  title: string
  texto: string
  config: unknown
}

function aBase64Url(bytes: Uint8Array): string {
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64Url(texto: string): Uint8Array {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binario, (c) => c.charCodeAt(0))
}

async function transformar(bytes: Uint8Array, flujo: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const salida = new Blob([bytes as BlobPart]).stream().pipeThrough(flujo)
  return new Uint8Array(await new Response(salida).arrayBuffer())
}

const sePuedeComprimir = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'

/**
 * La actividad convertida en el texto que va después de "#/recibir/".
 * Va comprimida (empieza con "z"); en navegadores sin compresión, sin comprimir (empieza con "j").
 */
export async function codificar(bloque: Pick<Block, 'type' | 'title' | 'texto' | 'config'>): Promise<string> {
  const datos: Compartida = { type: bloque.type, title: bloque.title, texto: bloque.texto ?? '', config: bloque.config ?? {} }
  const bytes = new TextEncoder().encode(JSON.stringify(datos))
  if (sePuedeComprimir()) return 'z' + aBase64Url(await transformar(bytes, new CompressionStream('deflate')))
  return 'j' + aBase64Url(bytes)
}

export type ResultadoDecodificar =
  | { ok: true; actividad: Compartida }
  | { ok: false; motivo: 'danado' | 'navegador-antiguo' }

/** Lee lo que viene en el enlace. Nunca lanza error: si está cortado o dañado, lo dice. */
export async function decodificar(texto: string): Promise<ResultadoDecodificar> {
  try {
    const tipo = texto[0]
    let bytes = deBase64Url(texto.slice(1))
    if (tipo === 'z') {
      if (!sePuedeComprimir()) return { ok: false, motivo: 'navegador-antiguo' }
      bytes = await transformar(bytes, new DecompressionStream('deflate'))
    } else if (tipo !== 'j') {
      return { ok: false, motivo: 'danado' }
    }
    const datos = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as Record<string, unknown>
    if (!TIPOS.includes(datos.type as BlockType) || typeof datos.title !== 'string' || typeof datos.texto !== 'string') {
      return { ok: false, motivo: 'danado' }
    }
    return { ok: true, actividad: { type: datos.type as BlockType, title: datos.title, texto: datos.texto, config: datos.config ?? {} } }
  } catch {
    return { ok: false, motivo: 'danado' }
  }
}
