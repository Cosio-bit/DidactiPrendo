import { useEffect, useId, useMemo, useState } from 'react'
import { leerConfigPreguntas, OPCIONES_DE_TIEMPO } from '../blocks/preguntas/logica.ts'
import { leerConfigRuleta } from '../blocks/ruleta/logica.ts'
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
  config: unknown
}

function estadoDesde(bloque: Block): Estado {
  const texto = bloque.texto ?? ''
  const sugerido = parseText(texto).tipoSugerido
  const tipo = bloque.type === 'ruleta' || bloque.type === 'preguntas' ? bloque.type : sugerido
  return {
    titulo: bloque.title,
    texto,
    tipoManual: texto.trim() && tipo !== sugerido ? tipo : null,
    config: bloque.config,
  }
}

export function Editor({ id }: { id: string }) {
  const guardado = useConsulta(() => almacen.obtener(id), id)
  const [estado, setEstado] = useState<Estado | null>(null)
  const [nueva, setNueva] = useState(false)
  const edicion = useEdicion(id)
  const idNombre = useId()
  const idTexto = useId()

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

  /** Las opciones de cada tipo conviven en `config`; cada bloque lee las suyas con sus valores iniciales. */
  function cambiarOpcion(cambio: Record<string, boolean | number>) {
    const anterior = actual.config
    const base = typeof anterior === 'object' && anterior !== null ? anterior : {}
    const config = { ...base, ...cambio }
    edicion.guardar('opciones', { config }, { config: anterior }, textos.acciones.cambioOpciones, false)
    setEstado({ ...actual, config })
  }

  const esRuleta = lectura.tipo === 'ruleta'
  const configRuleta = leerConfigRuleta(actual.config)
  const configPreguntas = leerConfigPreguntas(actual.config)
  const sePuedeProyectar = lectura.elementos.length >= (esRuleta ? 2 : 1)

  return (
    <section className="editor">
      <div className="editor__cabecera">
        {encabezado}
        <div className="editor__acciones">
          <Boton onClick={() => irA({ pantalla: 'mis-actividades' })}>{textos.editor.listo}</Boton>
          {!esRuleta && (
            <Boton disabled={!sePuedeProyectar} onClick={() => irA({ pantalla: 'imprimir', id })}>
              {textos.editor.imprimir}
            </Boton>
          )}
          <Boton variante="principal" disabled={!sePuedeProyectar} onClick={() => irA({ pantalla: 'proyectar', id })}>
            {textos.editor.proyectar}
          </Boton>
        </div>
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

      {esRuleta && (
        <fieldset className="opciones">
          <legend className="solo-lector">{textos.ruleta.opciones}</legend>
          <label className="opcion">
            <input
              type="checkbox"
              checked={configRuleta.eliminarAlSalir}
              onChange={(evento) => cambiarOpcion({ eliminarAlSalir: evento.target.checked })}
            />
            {textos.ruleta.eliminarAlSalir}
          </label>
          <label className="opcion">
            <input
              type="checkbox"
              checked={configRuleta.sonido}
              onChange={(evento) => cambiarOpcion({ sonido: evento.target.checked })}
            />
            {textos.ruleta.sonido}
          </label>
        </fieldset>
      )}

      {!esRuleta && (
        <fieldset className="opciones">
          <legend className="solo-lector">{textos.preguntas.opciones}</legend>
          <label className="opcion">
            {textos.preguntas.temporizador}
            <select
              className="campo__entrada opcion__lista"
              value={configPreguntas.segundosPorPregunta}
              onChange={(evento) => cambiarOpcion({ segundosPorPregunta: Number(evento.target.value) })}
            >
              {OPCIONES_DE_TIEMPO.map((s) => (
                <option key={s} value={s}>
                  {s === 0 ? textos.preguntas.sinTiempo : textos.preguntas.segundos(s)}
                </option>
              ))}
            </select>
          </label>
          {configPreguntas.segundosPorPregunta > 0 && (
            <label className="opcion">
              <input
                type="checkbox"
                checked={configPreguntas.sonido}
                onChange={(evento) => cambiarOpcion({ sonido: evento.target.checked })}
              />
              {textos.preguntas.sonido}
            </label>
          )}
        </fieldset>
      )}

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
            // Actividad recién creada: se puede pegar al tiro con Ctrl+V.
            autoFocus={nueva}
            spellCheck={false}
            onChange={(evento) => cambiarTexto(evento.target.value)}
          />
        </div>
        <VistaPrevia lectura={lectura} hayTexto={actual.texto.trim() !== ''} onCambiarTipo={cambiarTipo} />
      </div>
    </section>
  )
}
