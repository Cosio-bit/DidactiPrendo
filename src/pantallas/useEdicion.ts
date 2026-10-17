import { useEffect, useRef } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block, CambiosBloque } from '../storage/modelo.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

/** Cambios seguidos en un mismo campo con menos de esta pausa se deshacen de una sola vez. */
const PAUSA_ENTRE_CAMBIOS_MS = 1500

/**
 * Guarda cada cambio de un bloque apenas ocurre y lo deja listo para deshacer.
 * También dice si lo que llega de la base hay que mostrarlo (por ejemplo, tras "Deshacer")
 * o ignorarlo porque es más viejo que lo que se está escribiendo.
 */
export function useEdicion(id: string) {
  const escriturasEnCurso = useRef(0)
  const ultimaEscritura = useRef(0)
  const rafagas = useRef(new Map<string, number>())

  useEffect(() => {
    const pendientes = rafagas.current
    return () => pendientes.forEach((t) => window.clearTimeout(t))
  }, [])

  function terminarRafaga(campo: string) {
    window.clearTimeout(rafagas.current.get(campo))
    rafagas.current.delete(campo)
  }

  function guardar(
    campo: string,
    cambios: CambiosBloque,
    anterior: CambiosBloque,
    descripcion: string,
    agrupar = true,
  ) {
    if (!agrupar || !rafagas.current.has(campo)) {
      pilaDeshacer.registrar({
        descripcion,
        deshacer: () => {
          terminarRafaga(campo)
          return almacen.actualizar(id, anterior)
        },
      })
    }
    if (agrupar) {
      window.clearTimeout(rafagas.current.get(campo))
      rafagas.current.set(
        campo,
        window.setTimeout(() => rafagas.current.delete(campo), PAUSA_ENTRE_CAMBIOS_MS),
      )
    }

    escriturasEnCurso.current++
    almacen
      .actualizar(id, cambios)
      .then((bloque) => {
        if (bloque) ultimaEscritura.current = bloque.updatedAt
        pilaDeshacer.avisar(textos.avisos.guardado)
      })
      .catch(() => pilaDeshacer.avisar(textos.avisos.errorGuardar, true))
      .finally(() => escriturasEnCurso.current--)
  }

  function debeMostrar(bloque: Block): boolean {
    return escriturasEnCurso.current === 0 && bloque.updatedAt > ultimaEscritura.current
  }

  return { guardar, debeMostrar }
}
