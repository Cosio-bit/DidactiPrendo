import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

/** Crea una actividad vacía y abre el editor, listo para pegar. */
export async function crearActividad() {
  try {
    const bloque = await almacen.crear({
      type: 'ruleta',
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
