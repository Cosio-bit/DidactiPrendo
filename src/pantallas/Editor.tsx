import { useEffect, useId, useMemo, useState } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { parseText } from '../parser/parseText.ts'
import type { TipoLectura } from '../parser/tipos.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { useEdicion } from './useEdicion.ts'
import { VistaPrevia } from './VistaPrevia.tsx'

interface Estado {
  titulo: string
  texto: string
  /** null: se usa el tipo que sugiere el lector. */
  tipoManual: TipoLectura | null
}

function estadoDesde(bloque: Block): Estado {
  const texto = bloque.texto ?? ''
  const sugerido = parseText(texto).tipoSugerido
  const tipo = bloque.type === 'ruleta' || bloque.type === 'preguntas' ? bloque.type : sugerido
  return { titulo: bloque.title, texto, tipoManual: texto.trim() && tipo !== sugerido ? tipo : null }
}

export function Editor({ id }: { id: string }) {
  const guardado = useConsulta(() => almacen.obtener(id), id)
  const [estado, setEstado] = useState<Estado | null>(null)
  const [nueva, setNueva] = useState(false)
  const edicion = useEdicion(id)
  const idNombre = useId()
  const idTexto = useId()
  const idAyuda = useId()

  useEffect(() => {
    if (!guardado.listo || !guardado.valor) return
    if (estado === null) setNueva(!(guardado.valor.texto ?? '').trim())
    else if (!edicion.debeMostrar(guardado.valor)) return
    setEstado(estadoDesde(guardado.valor))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guardado])

  const lectura = useMemo(
    () => parseText(estado?.texto ?? '', estado?.tipoManual ?? undefined),
    [estado?.texto, estado?.tipoManual],
  )

  // El título se muestra desde el primer momento para que el foco tenga dónde llegar.
  const encabezado = <h1 tabIndex={-1}>{textos.editor.titulo}</h1>

  if (!guardado.listo || (guardado.valor && !estado)) {
    return (
      <section className="editor">
        {encabezado}
        <p>{textos.editor.cargando}</p>
      </section>
    )
  }

  if (!guardado.valor || !estado) {
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

  const actual = estado

  function cambiarTitulo(titulo: string) {
    edicion.guardar('nombre', { title: titulo }, { title: actual.titulo }, textos.acciones.cambioNombre)
    setEstado({ ...actual, titulo })
  }

  function cambiarTexto(texto: string) {
    const lecturaNueva = parseText(texto, actual.tipoManual ?? undefined)
    edicion.guardar(
      'texto',
      { texto, type: lecturaNueva.tipo, items: lecturaNueva.elementos },
      { texto: actual.texto, type: lectura.tipo, items: lectura.elementos },
      textos.acciones.cambioTexto,
    )
    setEstado({ ...actual, texto })
  }

  function cambiarTipo(tipo: TipoLectura) {
    if (tipo === lectura.tipo) return
    const lecturaNueva = parseText(actual.texto, tipo)
    edicion.guardar(
      'tipo',
      { type: tipo, items: lecturaNueva.elementos },
      { type: lectura.tipo, items: lectura.elementos },
      textos.acciones.cambioTipo,
      false,
    )
    setEstado({ ...actual, tipoManual: tipo === lectura.tipoSugerido ? null : tipo })
  }

  return (
    <section className="editor">
      <div className="editor__cabecera">
        {encabezado}
        <Boton variante="principal" onClick={() => irA({ pantalla: 'mis-actividades' })}>
          {textos.editor.listo}
        </Boton>
      </div>

      <div className="campo campo--en-linea">
        <label htmlFor={idNombre} className="campo__etiqueta">
          {textos.editor.nombre}
        </label>
        <input
          id={idNombre}
          className="campo__entrada"
          value={actual.titulo}
          placeholder={textos.editor.nombrePorDefecto}
          onChange={(evento) => cambiarTitulo(evento.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="editor__columnas">
        <div className="editor__texto">
          <label htmlFor={idTexto} className="campo__etiqueta">
            {textos.editor.pegaTuTexto}
          </label>
          <textarea
            id={idTexto}
            className="campo__entrada editor__area"
            value={actual.texto}
            placeholder={textos.editor.ejemplo}
            aria-describedby={idAyuda}
            // Actividad recién creada: se puede pegar al tiro con Ctrl+V.
            autoFocus={nueva}
            spellCheck={false}
            onChange={(evento) => cambiarTexto(evento.target.value)}
          />
          <p id={idAyuda} className="nota editor__ayuda">
            {textos.editor.ayuda}
          </p>
        </div>
        <VistaPrevia lectura={lectura} hayTexto={actual.texto.trim() !== ''} onCambiarTipo={cambiarTipo} />
      </div>
    </section>
  )
}
