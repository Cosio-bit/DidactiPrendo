import { useEffect, useId, useRef, useState } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { pilaDeshacer } from '../ui/deshacer.ts'

/** Cambios seguidos con menos de esta pausa se deshacen de una sola vez. */
const PAUSA_ENTRE_CAMBIOS_MS = 1500

export function Editor({ id }: { id: string }) {
  const guardado = useConsulta(() => almacen.obtener(id), id)
  const [titulo, setTitulo] = useState<string | null>(null)
  const idCampo = useId()

  // Se guarda en cada tecla. Mientras hay guardados en curso, o si lo que llega
  // de la base es más antiguo que lo último escrito, se ignora para no pisar lo que se está tecleando.
  const escriturasEnCurso = useRef(0)
  const ultimaEscritura = useRef(0)
  const rafaga = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!guardado.listo || !guardado.valor) return
    if (escriturasEnCurso.current > 0 || guardado.valor.updatedAt <= ultimaEscritura.current) {
      if (titulo !== null) return
    }
    setTitulo(guardado.valor.title)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardado])

  useEffect(() => () => window.clearTimeout(rafaga.current), [])

  // El título se muestra desde el primer momento para que el foco tenga dónde llegar.
  const encabezado = <h1 tabIndex={-1}>{textos.editor.titulo}</h1>

  if (!guardado.listo) {
    return (
      <section className="editor">
        {encabezado}
        <p>{textos.editor.cargando}</p>
      </section>
    )
  }

  if (!guardado.valor) {
    return (
      <section className="editor">
        {encabezado}
        <p>{textos.editor.noEncontrada}</p>
        <Boton variante="principal" onClick={() => irA({ pantalla: 'mis-actividades' })}>
          {textos.inicio.misActividades}
        </Boton>
      </section>
    )
  }

  function cambiarTitulo(nuevo: string) {
    if (rafaga.current === undefined) {
      const anterior = titulo ?? ''
      pilaDeshacer.registrar({
        descripcion: textos.acciones.cambioNombre,
        deshacer: () => {
          window.clearTimeout(rafaga.current)
          rafaga.current = undefined
          return almacen.actualizar(id, { title: anterior })
        },
      })
    } else {
      window.clearTimeout(rafaga.current)
    }
    rafaga.current = window.setTimeout(() => (rafaga.current = undefined), PAUSA_ENTRE_CAMBIOS_MS)

    setTitulo(nuevo)
    escriturasEnCurso.current++
    almacen
      .actualizar(id, { title: nuevo })
      .then((bloque) => {
        if (bloque) ultimaEscritura.current = bloque.updatedAt
        pilaDeshacer.avisar(textos.avisos.guardado)
      })
      .catch(() => pilaDeshacer.avisar(textos.avisos.errorGuardar, true))
      .finally(() => escriturasEnCurso.current--)
  }

  return (
    <section className="editor">
      {encabezado}
      <label htmlFor={idCampo} className="campo__etiqueta">
        {textos.editor.nombre}
      </label>
      <input
        id={idCampo}
        className="campo__entrada"
        value={titulo ?? ''}
        onChange={(evento) => cambiarTitulo(evento.target.value)}
        autoComplete="off"
      />
      <p className="nota">{textos.editor.proximamente}</p>
      <Boton variante="principal" onClick={() => irA({ pantalla: 'mis-actividades' })}>
        {textos.editor.listo}
      </Boton>
    </section>
  )
}
