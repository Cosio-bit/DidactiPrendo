import { entregarMaterial, esMaterial } from '../ai-bridge/material.ts'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { importar, leerArchivo } from '../storage/intercambio.ts'
import type { Block } from '../storage/modelo.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

/**
 * Carga las actividades de uno o más archivos descargados antes (en este u otro computador),
 * ya sea elegidos con "Cargar material" o soltados sobre la página. Se puede deshacer.
 * Después lleva a Mis actividades, para que el profe las vea.
 * Si en vez de actividades es una guía o material (PDF, Word, una foto…), lo lleva a Crear con IA.
 */
export async function cargarMaterial(archivos: File[]) {
  const t = textos.respaldo
  const guia = archivos.find(esMaterial)
  if (guia && !archivos.some((a) => !esMaterial(a))) {
    entregarMaterial(guia)
    irA({ pantalla: 'crear-con-ia' })
    return
  }
  try {
    const bloques: Block[] = []
    let validos = 0
    for (const archivo of archivos) {
      const leidos = leerArchivo(await archivo.text())
      if (!leidos) continue
      validos++
      bloques.push(...leidos)
    }
    if (validos === 0) return pilaDeshacer.avisar(t.archivoInvalido, true)
    if (bloques.length === 0) return pilaDeshacer.avisar(t.archivoVacio, true)

    const { agregadas, yaEstaban } = await importar(almacen, bloques)
    irA({ pantalla: 'mis-actividades' })
    if (agregadas.length === 0) return pilaDeshacer.avisar(t.yaEstaban)
    pilaDeshacer.registrar({
      descripcion: textos.acciones.importacion,
      deshacer: () => Promise.all(agregadas.map((b) => almacen.borrar(b.id))),
    })
    pilaDeshacer.avisar(t.agregadas(agregadas.length, yaEstaban))
  } catch {
    pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
  }
}
