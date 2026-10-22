import { esTipoConTexto } from '../blocks/catalogo.ts'
import { textos } from '../i18n/es-CL.ts'
import type { Block } from '../storage/modelo.ts'

const LARGO_MAXIMO = 48

/** Los primeros elementos en palabras, para reconocer la actividad sin abrirla. */
function primerosElementos(bloque: Pick<Block, 'items'>): string {
  const items = Array.isArray(bloque.items) ? bloque.items : []
  const textosDe = items.map((item: unknown) => {
    if (typeof item === 'string') return item
    if (typeof item !== 'object' || item === null) return ''
    const i = item as Record<string, unknown>
    // Completar la frase: las palabras ocultas no se muestran, por si la lista se ve proyectada.
    if (Array.isArray(i.partes)) {
      return i.partes.map((p: { texto?: unknown; oculta?: unknown }) => (p.oculta ? '___' : String(p.texto ?? ''))).join('')
    }
    // Pasapalabra y ¿Quién soy?: lo que se ve primero, no la respuesta.
    const primeraPista = Array.isArray(i.pistas) ? i.pistas[0] : undefined
    return String(i.enunciado ?? i.texto ?? i.nombre ?? i.a ?? i.definicion ?? primeraPista ?? '')
  })
  return textosDe.filter(Boolean).join(', ')
}

function recortar(texto: string) {
  if (texto.length <= LARGO_MAXIMO) return texto
  return `${texto.slice(0, LARGO_MAXIMO - 1).replace(/[\s,;:]+$/, '')}…`
}

/** Nombre que se pone solo si el profe no escribió uno: lo primero que contiene. */
export function nombreAutomatico(bloque: Pick<Block, 'type' | 'items'>): string {
  const contenido = primerosElementos(bloque)
  if (!contenido || !esTipoConTexto(bloque.type)) return textos.editor.nombrePorDefecto
  return recortar(contenido)
}

export function nombreVisible(bloque: Pick<Block, 'title' | 'type' | 'items'>) {
  return bloque.title.trim() || nombreAutomatico(bloque)
}
