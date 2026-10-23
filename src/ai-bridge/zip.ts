// Lector mínimo de archivos .zip, para sacar el texto de Word (.docx) y PowerPoint (.pptx),
// que por dentro son un .zip con archivos XML. Usa la descompresión que ya trae el navegador: sin dependencias.

const FIN_DEL_DIRECTORIO = 0x06054b50
const ENTRADA_DEL_DIRECTORIO = 0x02014b50
const ENCABEZADO_LOCAL = 0x04034b50

export class ZipDanado extends Error {}

async function descomprimir(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flujo).arrayBuffer())
}

/**
 * Los archivos del .zip cuyo nombre cumple `quiero`, ya descomprimidos y leídos como texto (UTF-8).
 * Lanza ZipDanado si el archivo no es un .zip o está cortado.
 */
export async function leerZip(contenido: ArrayBuffer, quiero: (nombre: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(contenido)
  const vista = new DataView(contenido)
  const texto = new TextDecoder()

  // El índice del .zip está al final: se busca su firma desde atrás (puede haber un comentario después).
  let fin = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (vista.getUint32(i, true) === FIN_DEL_DIRECTORIO) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new ZipDanado()

  const cantidad = vista.getUint16(fin + 10, true)
  let posicion = vista.getUint32(fin + 16, true)
  const archivos = new Map<string, string>()
  for (let n = 0; n < cantidad; n++) {
    if (posicion + 46 > bytes.length || vista.getUint32(posicion, true) !== ENTRADA_DEL_DIRECTORIO) throw new ZipDanado()
    const metodo = vista.getUint16(posicion + 10, true)
    const largoComprimido = vista.getUint32(posicion + 20, true)
    const largoNombre = vista.getUint16(posicion + 28, true)
    const largoExtra = vista.getUint16(posicion + 30, true)
    const largoComentario = vista.getUint16(posicion + 32, true)
    const local = vista.getUint32(posicion + 42, true)
    const nombre = texto.decode(bytes.subarray(posicion + 46, posicion + 46 + largoNombre))
    posicion += 46 + largoNombre + largoExtra + largoComentario

    if (!quiero(nombre)) continue
    if (local + 30 > bytes.length || vista.getUint32(local, true) !== ENCABEZADO_LOCAL) throw new ZipDanado()
    const inicio = local + 30 + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true)
    const comprimido = bytes.subarray(inicio, inicio + largoComprimido)
    if (comprimido.length < largoComprimido) throw new ZipDanado()
    // 0: guardado tal cual; 8: comprimido (deflate). Otros métodos no los usa Office.
    if (metodo === 0) archivos.set(nombre, texto.decode(comprimido))
    else if (metodo === 8) archivos.set(nombre, texto.decode(await descomprimir(comprimido)))
    else throw new ZipDanado()
  }
  return archivos
}
