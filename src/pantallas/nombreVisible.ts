import { textos } from '../i18n/es-CL.ts'
import type { Block } from '../storage/modelo.ts'

export function nombreVisible(bloque: Block) {
  return bloque.title.trim() || textos.editor.nombrePorDefecto
}
