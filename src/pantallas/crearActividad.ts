import { textos } from '../i18n/es-CL.ts'
import type { TipoLectura } from '../parser/tipos.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

/**
 * Crea una actividad vacía y abre el editor, listo para pegar.
 * Con un tipo, el editor parte con esa actividad elegida y muestra cómo escribirla.
 */
export async function crearActividad(tipo: TipoLectura = 'ruleta') {
  try {
    const bloque = await almacen.crear({
      type: tipo,
      title: '',
      texto: '',
      items: [],
      config: {},
    })
    irA({ pantalla: 'editor', id: bloque.id })
  } catch {
    pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
  }
}
