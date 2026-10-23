// La guía o el material que sube el profe para crear con IA.
// Word y PowerPoint se leen aquí mismo y se envía solo su texto; un PDF o una foto se envían tal cual,
// porque la IA los lee directamente (incluidos los dibujos y tablas del PDF).
import { leerZip } from './zip.ts'

/** Lo más pesado que se puede enviar (un PDF o una foto ya achicada): el servidor no recibe más de 4,5 MB. */
export const MAXIMO_BYTES_ARCHIVO = 3 * 1024 * 1024
/** Texto de una guía (pegado o sacado de un Word): unas 30 páginas. */
export const MAXIMO_LETRAS_GUIA = 100_000
/** La foto se achica a este lado mayor: se lee igual de bien y pesa mucho menos. */
const LADO_MAXIMO_FOTO = 1568

export type Material =
  | { tipo: 'texto'; nombre: string; texto: string }
  | { tipo: 'pdf'; nombre: string; datos: string; mediaType: 'application/pdf' }
  | { tipo: 'imagen'; nombre: string; datos: string; mediaType: 'image/jpeg' }

/**
 * formato: no es un tipo que se pueda leer; antiguo: Word o PowerPoint antiguo (.doc, .ppt) u OpenOffice;
 * pesado: pasa del máximo; vacio: no trae texto; danado: no se pudo abrir.
 */
export type ErrorMaterial = 'formato' | 'antiguo' | 'pesado' | 'vacio' | 'danado'

export type LecturaMaterial = { ok: true; material: Material } | { ok: false; error: ErrorMaterial }

type Clase = 'pdf' | 'docx' | 'pptx' | 'texto' | 'imagen' | 'antiguo' | 'actividades'

function extension(nombre: string) {
  return nombre.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ''
}

function clase(archivo: Pick<File, 'name' | 'type'>): Clase | null {
  const ext = extension(archivo.name)
  if (ext === 'json') return 'actividades'
  if (ext === 'pdf' || archivo.type === 'application/pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'pptx') return 'pptx'
  if (ext === 'txt' || ext === 'md') return 'texto'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || /^image\/(jpeg|png|webp|gif)$/.test(archivo.type)) {
    return 'imagen'
  }
  if (['doc', 'ppt', 'odt', 'odp', 'rtf', 'pages', 'key'].includes(ext)) return 'antiguo'
  return null
}

/** ¿Es una guía o material (y no un archivo de actividades de DidactiPrendo)? */
export function esMaterial(archivo: Pick<File, 'name' | 'type'>): boolean {
  const c = clase(archivo)
  return c !== null && c !== 'actividades'
}

/** Lo que acepta el selector de archivos. */
export const TIPOS_DE_MATERIAL = '.pdf,.docx,.pptx,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.doc,.ppt,.odt,.odp,.rtf'

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodificar(texto: string) {
  return texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (todo, entidad: string) => {
    if (entidad[0] === '#') {
      const codigo = entidad[1].toLowerCase() === 'x' ? parseInt(entidad.slice(2), 16) : parseInt(entidad.slice(1), 10)
      return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : todo
    }
    return ENTIDADES[entidad.toLowerCase()] ?? todo
  })
}

/** Párrafos de un XML de Office: cada `<w:p>` (Word) o `<a:p>` (PowerPoint) es una línea. */
function parrafos(xml: string, prefijo: 'w' | 'a'): string[] {
  const parrafo = new RegExp(`<${prefijo}:p[ >][\\s\\S]*?</${prefijo}:p>`, 'g')
  const pieza = new RegExp(`<${prefijo}:t(?: [^>]*)?>([\\s\\S]*?)</${prefijo}:t>|<${prefijo}:tab/>|<${prefijo}:br/>`, 'g')
  return (xml.match(parrafo) ?? [])
    .map((p) =>
      [...p.matchAll(pieza)]
        .map((m) => (m[1] !== undefined ? decodificar(m[1]) : m[0].includes('tab') ? '\t' : '\n'))
        .join('')
        .trim(),
    )
    .filter(Boolean)
}

/** El texto de un Word, un párrafo por línea (las celdas de una tabla también quedan una por línea). */
export function textoDeWord(documento: string): string {
  return parrafos(documento, 'w').join('\n')
}

/** El texto de un PowerPoint, diapositiva por diapositiva. */
export function textoDePowerPoint(diapositivas: string[]): string {
  return diapositivas
    .map((xml, i) => {
      const lineas = parrafos(xml, 'a')
      return lineas.length > 0 ? `Diapositiva ${i + 1}\n${lineas.join('\n')}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function aBase64(bytes: Uint8Array): string {
  let binario = ''
  const trozo = 0x8000
  for (let i = 0; i < bytes.length; i += trozo) binario += String.fromCharCode(...bytes.subarray(i, i + trozo))
  return btoa(binario)
}

/** Achica la foto y la pasa a JPEG. */
async function prepararFoto(archivo: File): Promise<string | null> {
  const imagen = await createImageBitmap(archivo)
  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(imagen.width, imagen.height))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(imagen.width * escala)
  lienzo.height = Math.round(imagen.height * escala)
  const contexto = lienzo.getContext('2d')
  if (!contexto) return null
  // Fondo blanco: una imagen con transparencia no queda negra al pasar a JPEG.
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, lienzo.width, lienzo.height)
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  imagen.close()
  const datos = lienzo.toDataURL('image/jpeg', 0.85)
  return datos.slice(datos.indexOf(',') + 1)
}

function comoTexto(nombre: string, texto: string): LecturaMaterial {
  const limpio = texto.replace(/\r\n?/g, '\n').trim()
  if (!limpio) return { ok: false, error: 'vacio' }
  if (limpio.length > MAXIMO_LETRAS_GUIA) return { ok: false, error: 'pesado' }
  return { ok: true, material: { tipo: 'texto', nombre, texto: limpio } }
}

const numeroDeDiapositiva = (nombre: string) => Number(nombre.match(/slide(\d+)\.xml$/)?.[1] ?? 0)

/** Lee el archivo que subió el profe. Nunca lanza errores: lo que no puede leer lo dice en `error`. */
export async function leerMaterial(archivo: File): Promise<LecturaMaterial> {
  const nombre = archivo.name
  const tipo = clase(archivo)
  if (tipo === 'antiguo') return { ok: false, error: 'antiguo' }
  if (tipo === null || tipo === 'actividades') return { ok: false, error: 'formato' }
  try {
    switch (tipo) {
      case 'texto':
        return comoTexto(nombre, await archivo.text())
      case 'docx': {
        const partes = await leerZip(await archivo.arrayBuffer(), (n) => n === 'word/document.xml')
        const documento = partes.get('word/document.xml')
        return documento === undefined ? { ok: false, error: 'danado' } : comoTexto(nombre, textoDeWord(documento))
      }
      case 'pptx': {
        const partes = await leerZip(await archivo.arrayBuffer(), (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        const ordenadas = [...partes.keys()].sort((a, b) => numeroDeDiapositiva(a) - numeroDeDiapositiva(b))
        if (ordenadas.length === 0) return { ok: false, error: 'danado' }
        return comoTexto(nombre, textoDePowerPoint(ordenadas.map((n) => partes.get(n)!)))
      }
      case 'pdf': {
        if (archivo.size > MAXIMO_BYTES_ARCHIVO) return { ok: false, error: 'pesado' }
        const bytes = new Uint8Array(await archivo.arrayBuffer())
        if (bytes.length === 0) return { ok: false, error: 'vacio' }
        return { ok: true, material: { tipo: 'pdf', nombre, datos: aBase64(bytes), mediaType: 'application/pdf' } }
      }
      case 'imagen': {
        const datos = await prepararFoto(archivo)
        if (!datos) return { ok: false, error: 'danado' }
        if (datos.length * 0.75 > MAXIMO_BYTES_ARCHIVO) return { ok: false, error: 'pesado' }
        return { ok: true, material: { tipo: 'imagen', nombre, datos, mediaType: 'image/jpeg' } }
      }
    }
  } catch {
    return { ok: false, error: 'danado' }
  }
}

// ---------- Un archivo que llega desde otra pantalla ----------

const EVENTO = 'didactiprendo:material'
let pendiente: File | null = null

/** Deja el archivo para que lo tome la pantalla Crear con IA (al abrirse, o al tiro si ya está abierta). */
export function entregarMaterial(archivo: File) {
  pendiente = archivo
  window.dispatchEvent(new Event(EVENTO))
}

/** El archivo que llegó y todavía nadie tomó (y lo saca, para no tomarlo dos veces). */
export function tomarMaterial(): File | null {
  const archivo = pendiente
  pendiente = null
  return archivo
}

export function alLlegarMaterial(avisar: () => void) {
  window.addEventListener(EVENTO, avisar)
  return () => window.removeEventListener(EVENTO, avisar)
}
