import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { esTipoConTexto, sePuedeImprimir, sePuedeProyectar, usaTemporizador } from '../blocks/catalogo.ts'
import { leerConfigCompletar } from '../blocks/completar/logica.ts'
import { leerConfigPreguntas, OPCIONES_DE_TIEMPO } from '../blocks/preguntas/logica.ts'
import { leerConfigRuleta } from '../blocks/ruleta/logica.ts'
import { leerConfigTarjetas } from '../blocks/tarjetas/logica.ts'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { parseText } from '../parser/parseText.ts'
import type { TipoLectura } from '../parser/tipos.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { useAltoAutomatico } from '../ui/useAltoAutomatico.ts'
import { useEsCelular } from '../ui/useEsCelular.ts'
import { useEdicion } from './useEdicion.ts'
import { nombreAutomatico, nombreVisible } from './nombreVisible.ts'
import { SelectorTipo } from './SelectorTipo.tsx'
import { VistaPrevia } from './VistaPrevia.tsx'
import { DialogoCompartir } from './DialogoCompartir.tsx'

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
  const tipo = esTipoConTexto(bloque.type) ? bloque.type : sugerido
  return {
    titulo: bloque.title,
    texto,
    tipoManual: tipo !== sugerido ? tipo : null,
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

  const cuadroTexto = useAltoAutomatico(estado?.texto ?? '')
  const celular = useEsCelular()
  const [paso, setPaso] = useState(1)
  const [compartiendo, setCompartiendo] = useState(false)
  const tituloPaso = useRef<HTMLHeadingElement>(null)

  /** Cambia de paso y lleva el foco (y la vista) al título del paso nuevo. */
  function irAPaso(nuevo: number) {
    setPaso(nuevo)
    requestAnimationFrame(() => {
      tituloPaso.current?.focus()
      tituloPaso.current?.scrollIntoView({ block: 'start' })
    })
  }

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
  const configTarjetas = leerConfigTarjetas(actual.config)
  const configCompletar = leerConfigCompletar(actual.config)
  const proyectable = sePuedeProyectar(lectura.tipo, lectura.elementos)

  const hayTexto = actual.texto.trim() !== ''

  const acciones = (
    <>
      <Boton variante="navegacion" onClick={() => irA({ pantalla: 'mis-actividades' })}>{textos.editor.listo}</Boton>
      <Boton variante="herramienta" disabled={!proyectable} onClick={() => setCompartiendo(true)}>
        {textos.compartir.boton}
      </Boton>
      {sePuedeImprimir(lectura.tipo) && (
        <Boton variante="herramienta" disabled={!proyectable} onClick={() => irA({ pantalla: 'imprimir', id })}>
          {textos.editor.imprimir}
        </Boton>
      )}
      <Boton variante="principal" disabled={!proyectable} onClick={() => irA({ pantalla: 'proyectar', id })}>
        {textos.editor.proyectar}
      </Boton>
    </>
  )

  const campoNombre = (
    <div className="campo campo--en-linea">
      <label htmlFor={idNombre} className="campo__etiqueta">
        {textos.editor.nombre}
      </label>
      <input
        id={idNombre}
        className="campo__entrada"
        value={actual.titulo}
        placeholder={nombreAutomatico({ type: lectura.tipo, items: lectura.elementos })}
        onChange={(evento) => cambiarTitulo(evento.target.value)}
        autoComplete="off"
      />
    </div>
  )

  const selector = (
    <SelectorTipo
      elegido={lectura.tipo}
      sugerido={hayTexto ? lectura.tipoSugerido : null}
      onCambiar={cambiarTipo}
    />
  )

  const opciones = (
    <>
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

      {lectura.tipo === 'tarjetas' && (
        <fieldset className="opciones">
          <legend className="solo-lector">{textos.tarjetas.opciones}</legend>
          <label className="opcion">
            <input
              type="checkbox"
              checked={configTarjetas.mezclarTarjetas}
              onChange={(evento) => cambiarOpcion({ mezclarTarjetas: evento.target.checked })}
            />
            {textos.tarjetas.mezclar}
          </label>
        </fieldset>
      )}

      {lectura.tipo === 'completar' && (
        <fieldset className="opciones">
          <legend className="solo-lector">{textos.completar.opciones}</legend>
          <label className="opcion">
            <input
              type="checkbox"
              checked={configCompletar.bancoDePalabras}
              onChange={(evento) => cambiarOpcion({ bancoDePalabras: evento.target.checked })}
            />
            {textos.completar.banco}
          </label>
        </fieldset>
      )}

      {usaTemporizador(lectura.tipo) && (
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
    </>
  )

  const cuadroDeTexto = (
    <div className="editor__texto">
      <label htmlFor={idTexto} className="campo__etiqueta">
        {textos.editor.pegaTuTexto}
      </label>
      <textarea
        ref={cuadroTexto}
        id={idTexto}
        className="campo__entrada editor__area"
        value={actual.texto}
        placeholder={textos.editor.porEjemplo(textos.editor.ejemplos[lectura.tipo])}
        // Actividad recién creada en el computador: se puede pegar al tiro con Ctrl+V.
        // En el celular no, porque abriría el teclado y taparía la pantalla.
        autoFocus={nueva && !celular}
        spellCheck={false}
        onChange={(evento) => cambiarTexto(evento.target.value)}
      />
    </div>
  )

  // Se comparte tal como está en pantalla (ya quedó guardado).
  const dialogoCompartir = (
    <DialogoCompartir
      bloque={
        compartiendo
          ? { ...guardado.valor, title: actual.titulo, texto: actual.texto, type: lectura.tipo, items: lectura.elementos, config: actual.config }
          : null
      }
      onCerrar={() => setCompartiendo(false)}
    />
  )

  const vistaPrevia = <VistaPrevia lectura={lectura} hayTexto={hayTexto} onUsarEjemplo={cambiarTexto} />

  if (celular) {
    const t = textos.editor.pasos
    const titulos = t.cortos
    return (
      <section className="editor editor--pasos">
        <ol className="pasos" aria-label={t.nombre}>
          {titulos.map((titulo, i) => (
            <li key={titulo}>
              <button
                type="button"
                className="pasos__paso"
                aria-current={paso === i + 1 ? 'step' : undefined}
                disabled={i > 0 && !hayTexto}
                onClick={() => irAPaso(i + 1)}
              >
                <span className="pasos__numero">{i + 1}</span>
                {titulo}
              </button>
            </li>
          ))}
        </ol>
        <h1 ref={tituloPaso} tabIndex={-1} className="pasos__titulo">
          {t.titulo(paso, titulos.length, t.largos[paso - 1])}
        </h1>

        {paso === 1 && (
          <>
            {campoNombre}
            {cuadroDeTexto}
            {!hayTexto && <div className="pasos__ayuda">{vistaPrevia}</div>}
          </>
        )}
        {paso === 2 && (
          <>
            {selector}
            {vistaPrevia}
          </>
        )}
        {paso === 3 && (
          <>
            <p className="pasos__resumen">
              <strong>{nombreVisible({ ...guardado.valor, title: actual.titulo, type: lectura.tipo, items: lectura.elementos })}</strong>
              <br />
              {textos.tipos[lectura.tipo]} · {textos.vistaPrevia.cantidad(lectura.tipo, lectura.elementos.length)}
            </p>
            {opciones}
            <div className="pasos__acciones">{acciones}</div>
          </>
        )}

        <div className="pasos__navegacion">
          {paso > 1 ? <Boton variante="navegacion" onClick={() => irAPaso(paso - 1)}>{t.atras}</Boton> : <span />}
          {paso < 3 && (
            <Boton variante="principal" disabled={!hayTexto} onClick={() => irAPaso(paso + 1)}>
              {t.siguiente}
            </Boton>
          )}
        </div>
        {paso === 1 && !hayTexto && <p className="nota">{t.escribeParaSeguir}</p>}
        {dialogoCompartir}
      </section>
    )
  }

  return (
    <section className="editor">
      <div className="editor__cabecera">
        {encabezado}
        <div className="editor__acciones">{acciones}</div>
      </div>

      {campoNombre}
      {selector}
      {opciones}

      <div className="editor__columnas">
        {cuadroDeTexto}
        {vistaPrevia}
      </div>
      {dialogoCompartir}
    </section>
  )
}
