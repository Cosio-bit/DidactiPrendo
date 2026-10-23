import { useEffect, useId, useRef, useState } from 'react'
import { pedirActividades, type ActividadIA, type PedidoIA, type ResultadoIA } from '../ai-bridge/crearConIA.ts'
import {
  alLlegarMaterial,
  leerMaterial,
  tomarMaterial,
  TIPOS_DE_MATERIAL,
  type ErrorMaterial,
  type Material,
} from '../ai-bridge/material.ts'
import { TIPOS_CON_TEXTO } from '../blocks/catalogo.ts'
import { IconoTipo } from '../blocks/IconoTipo.tsx'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import type { TipoLectura } from '../parser/tipos.ts'
import { ajustes } from '../storage/ajustes.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { Boton } from '../ui/Boton.tsx'
import { pilaDeshacer } from '../ui/deshacer.ts'
import { useAltoAutomatico } from '../ui/useAltoAutomatico.ts'
import { VistaPrevia } from './VistaPrevia.tsx'

const t = textos.crearConIA
const CLAVE_CODIGO = 'codigoIA'

interface Memoria {
  pedido: string
  guia: string
  material: Material | null
  resultado: ResultadoIA | null
  /** Todas las actividades que la IA ya propuso, para no repetirlas al pedir otras. */
  anteriores: { tipo: TipoLectura; nombre: string }[]
  intento: number
}

/** Lo último que se pidió y lo que respondió la IA: si el profe sale y vuelve, no se pierde ni se paga de nuevo. */
let memoria: Memoria = { pedido: '', guia: '', material: null, resultado: null, anteriores: [], intento: 0 }

function guardarBloque(actividad: ActividadIA) {
  return almacen.crear({
    type: actividad.tipo,
    title: actividad.nombre,
    texto: actividad.texto,
    items: actividad.lectura.elementos,
    config: {},
  })
}

function describir(material: Material) {
  if (material.tipo === 'texto') return t.materialCargado.texto(material.texto.split(/\s+/).filter(Boolean).length)
  return t.materialCargado[material.tipo]
}

export function CrearConIA() {
  const [pedido, setPedido] = useState(memoria.pedido)
  const [guia, setGuia] = useState(memoria.guia)
  const [conGuia, setConGuia] = useState(memoria.guia !== '')
  const [material, setMaterial] = useState<Material | null>(memoria.material)
  const [errorMaterial, setErrorMaterial] = useState<ErrorMaterial | null>(null)
  const [leyendo, setLeyendo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [pideCodigo, setPideCodigo] = useState(false)
  const [esperando, setEsperando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoIA | null>(memoria.resultado)
  const [anteriores, setAnteriores] = useState(memoria.anteriores)
  const [intento, setIntento] = useState(memoria.intento)
  // Pedir otras propuestas.
  const [reintentando, setReintentando] = useState(false)
  const [comentario, setComentario] = useState('')
  const [tiposElegidos, setTiposElegidos] = useState<TipoLectura[]>([])
  const [faltaComentario, setFaltaComentario] = useState(false)

  const idPedido = useId()
  const idPedidoAyuda = useId()
  const idGuia = useId()
  const idCodigo = useId()
  const idMaterial = useId()
  const idComentario = useId()
  const idTipos = useId()
  const cuadroPedido = useAltoAutomatico(pedido)
  const cuadroGuia = useAltoAutomatico(guia)
  const cuadroComentario = useAltoAutomatico(comentario)
  const tituloResultado = useRef<HTMLHeadingElement>(null)
  const selector = useRef<HTMLInputElement>(null)

  const hayGuia = material !== null || (conGuia && guia.trim() !== '')

  // El código del piloto se escribe una vez y queda guardado en este computador.
  useEffect(() => {
    void ajustes.leer(CLAVE_CODIGO).then((guardado) => {
      if (typeof guardado === 'string' && guardado) {
        setCodigo(guardado)
        setPideCodigo(true)
      }
    })
  }, [])

  useEffect(() => {
    memoria = { pedido, guia: conGuia ? guia : '', material, resultado, anteriores, intento }
  }, [pedido, guia, conGuia, material, resultado, anteriores, intento])

  async function cargar(archivo: File) {
    setLeyendo(true)
    setErrorMaterial(null)
    const lectura = await leerMaterial(archivo)
    setLeyendo(false)
    if (lectura.ok) setMaterial(lectura.material)
    else setErrorMaterial(lectura.error)
  }

  // Una guía soltada sobre la página o subida con "Cargar material" en otra pantalla.
  useEffect(() => {
    function recibir() {
      const archivo = tomarMaterial()
      if (archivo) void cargar(archivo)
    }
    recibir()
    return alLlegarMaterial(recibir)
  }, [])

  function quitarMaterial() {
    setMaterial(null)
    setErrorMaterial(null)
  }

  async function pedir(extra: Pick<PedidoIA, 'comentario' | 'anteriores' | 'tipos'> = {}) {
    setEsperando(true)
    const respuesta = await pedirActividades({
      pedido,
      guia: conGuia ? guia : '',
      material,
      codigo,
      ...extra,
    })
    setEsperando(false)
    if (!respuesta.ok && respuesta.error === 'codigo') setPideCodigo(true)
    if (respuesta.ok && codigo.trim()) void ajustes.guardar(CLAVE_CODIGO, codigo.trim())
    // El foco va a la respuesta, para quien usa teclado o lector de pantalla.
    requestAnimationFrame(() => tituloResultado.current?.focus())
    return respuesta
  }

  async function crear() {
    if (esperando || leyendo || (!pedido.trim() && !hayGuia)) return
    setResultado(null)
    setReintentando(false)
    const respuesta = await pedir()
    setResultado(respuesta)
    setAnteriores([])
    setIntento(respuesta.ok ? 1 : 0)
  }

  async function pedirOtras() {
    if (esperando) return
    if (!comentario.trim() && tiposElegidos.length === 0) {
      setFaltaComentario(true)
      cuadroComentario.current?.focus()
      return
    }
    const vistas = [
      ...anteriores,
      ...(resultado?.ok ? resultado.actividades.map((a) => ({ tipo: a.tipo, nombre: a.nombre })) : []),
    ]
    const respuesta = await pedir({ comentario, anteriores: vistas, tipos: tiposElegidos })
    if (respuesta.ok) {
      // Si la IA no repite lo que entendió de la guía, se conserva lo de antes.
      const entendido = respuesta.entendido || (resultado?.ok ? resultado.entendido : '')
      setResultado({ ...respuesta, entendido })
      setAnteriores(vistas)
      setIntento((n) => n + 1)
      setReintentando(false)
      setComentario('')
      setTiposElegidos([])
    } else {
      setResultado(respuesta)
    }
  }

  function alternarTipo(tipo: TipoLectura) {
    setFaltaComentario(false)
    setTiposElegidos((elegidos) => (elegidos.includes(tipo) ? elegidos.filter((x) => x !== tipo) : [...elegidos, tipo]))
  }

  async function usar(actividad: ActividadIA) {
    try {
      const bloque = await guardarBloque(actividad)
      irA({ pantalla: 'editor', id: bloque.id })
    } catch {
      pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
    }
  }

  async function guardarTodas(actividades: ActividadIA[]) {
    try {
      const bloques: Block[] = []
      for (const actividad of actividades) bloques.push(await guardarBloque(actividad))
      irA({ pantalla: 'mis-actividades' })
      pilaDeshacer.registrar({
        descripcion: textos.acciones.creadasConIA,
        deshacer: () => Promise.all(bloques.map((b) => almacen.borrar(b.id))),
      })
      pilaDeshacer.avisar(t.guardadas(bloques.length))
    } catch {
      pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
    }
  }

  const usables = resultado?.ok ? resultado.actividades.filter((a) => a.usable) : []

  const zonaMaterial = (
    <section className="crear-con-ia__material" aria-labelledby={idMaterial}>
      <h2 id={idMaterial} className="campo__etiqueta">
        {t.material}
      </h2>
      {material ? (
        <div className="material-cargado">
          <p>
            <strong className="material-cargado__nombre">{material.nombre}</strong>
            <span className="material-cargado__tipo">{describir(material)}</span>
          </p>
          <div className="material-cargado__acciones">
            <Boton variante="herramienta" onClick={() => selector.current?.click()}>
              {t.cambiarMaterial}
            </Boton>
            <Boton variante="herramienta" onClick={quitarMaterial}>
              {t.quitarMaterial}
            </Boton>
          </div>
        </div>
      ) : (
        <div className="material-subir">
          <Boton variante="herramienta" grande disabled={leyendo} onClick={() => selector.current?.click()}>
            {t.subirMaterial}
          </Boton>
          <p className="zona-cargar__ayuda">{t.subirAyuda}</p>
        </div>
      )}
      <input
        ref={selector}
        // Oculto: se abre con el botón.
        hidden
        type="file"
        accept={TIPOS_DE_MATERIAL}
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          evento.target.value = ''
          if (archivo) void cargar(archivo)
        }}
      />
      <div aria-live="polite">{leyendo && <p className="crear-con-ia__esperando">{t.leyendoMaterial}</p>}</div>
      {errorMaterial && (
        <p className="crear-con-ia__error" role="alert">
          {t.erroresMaterial[errorMaterial]}
        </p>
      )}

      {conGuia ? (
        <div className="campo">
          <label htmlFor={idGuia} className="campo__etiqueta">
            {t.guia}
          </label>
          <p className="zona-cargar__ayuda">{t.guiaAyuda}</p>
          <textarea
            ref={cuadroGuia}
            id={idGuia}
            className="campo__entrada crear-con-ia__area"
            value={guia}
            maxLength={100_000}
            rows={4}
            onChange={(evento) => setGuia(evento.target.value)}
          />
          <div>
            <Boton variante="herramienta" onClick={() => setConGuia(false)}>
              {t.quitarGuia}
            </Boton>
          </div>
        </div>
      ) : (
        <div>
          <Boton variante="herramienta" onClick={() => setConGuia(true)}>
            {material ? t.agregarTexto : t.pegarGuia}
          </Boton>
        </div>
      )}
    </section>
  )

  const pedirOtrasPropuestas = resultado?.ok && (
    <section className="crear-con-ia__otra-vez" aria-labelledby="ninguna-sirve">
      <h2 id="ninguna-sirve">{t.ningunaSirve}</h2>
      {!reintentando ? (
        <>
          <p>{t.ningunaSirveAyuda}</p>
          <div>
            <Boton
              variante="herramienta"
              onClick={() => {
                setReintentando(true)
                requestAnimationFrame(() => cuadroComentario.current?.focus())
              }}
            >
              {t.pedirOtras}
            </Boton>
          </div>
        </>
      ) : (
        <form
          className="crear-con-ia__pedido"
          onSubmit={(evento) => {
            evento.preventDefault()
            void pedirOtras()
          }}
        >
          <div className="campo">
            <label htmlFor={idComentario} className="campo__etiqueta">
              {t.comentario}
            </label>
            <p className="zona-cargar__ayuda">{t.comentarioAyuda}</p>
            <textarea
              ref={cuadroComentario}
              id={idComentario}
              className="campo__entrada crear-con-ia__area"
              value={comentario}
              placeholder={t.comentarioEjemplo}
              maxLength={1500}
              rows={3}
              onChange={(evento) => {
                setComentario(evento.target.value)
                setFaltaComentario(false)
              }}
            />
          </div>
          <fieldset className="tipos-pedidos" aria-describedby={faltaComentario ? idTipos : undefined}>
            <legend className="campo__etiqueta">{t.tiposQueQuieres}</legend>
            <div className="tipos-pedidos__lista">
              {TIPOS_CON_TEXTO.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className="tipo-pedido"
                  aria-pressed={tiposElegidos.includes(tipo)}
                  style={{ borderColor: `var(--tipo-${tipo})` }}
                  onClick={() => alternarTipo(tipo)}
                >
                  <IconoTipo tipo={tipo} className="tipo-pedido__icono" />
                  {textos.tipos[tipo]}
                </button>
              ))}
            </div>
          </fieldset>
          {faltaComentario && (
            <p id={idTipos} className="crear-con-ia__error" role="alert">
              {t.faltaComentario}
            </p>
          )}
          <div className="crear-con-ia__botones">
            <Boton type="submit" variante="principal" disabled={esperando}>
              {t.pedirOtras}
            </Boton>
            <Boton variante="navegacion" onClick={() => setReintentando(false)}>
              {t.cancelar}
            </Boton>
          </div>
        </form>
      )}
    </section>
  )

  return (
    <section className="crear-con-ia">
      <h1 tabIndex={-1}>{t.titulo}</h1>
      <p className="inicio__descripcion">{t.explicacion}</p>

      <form
        className="crear-con-ia__pedido"
        onSubmit={(evento) => {
          evento.preventDefault()
          void crear()
        }}
      >
        <div className="campo">
          <label htmlFor={idPedido} className="campo__etiqueta">
            {t.pedido}
          </label>
          {hayGuia && (
            <p id={idPedidoAyuda} className="zona-cargar__ayuda">
              {t.pedidoConGuiaAyuda}
            </p>
          )}
          <textarea
            ref={cuadroPedido}
            id={idPedido}
            className="campo__entrada crear-con-ia__area"
            value={pedido}
            placeholder={hayGuia ? t.pedidoConGuiaEjemplo : t.pedidoEjemplo}
            aria-describedby={hayGuia ? idPedidoAyuda : undefined}
            maxLength={1500}
            rows={3}
            onChange={(evento) => setPedido(evento.target.value)}
          />
        </div>

        {zonaMaterial}

        {pideCodigo && (
          <div className="campo">
            <label htmlFor={idCodigo} className="campo__etiqueta">
              {t.codigo}
            </label>
            <p className="zona-cargar__ayuda">{t.codigoAyuda}</p>
            <input
              id={idCodigo}
              className="campo__entrada crear-con-ia__codigo"
              value={codigo}
              autoComplete="off"
              spellCheck={false}
              onChange={(evento) => setCodigo(evento.target.value)}
            />
          </div>
        )}

        <p className="crear-con-ia__privacidad">{t.privacidad}</p>
        <div>
          <Boton
            type="submit"
            variante="principal"
            grande
            disabled={esperando || leyendo || (!pedido.trim() && !hayGuia)}
          >
            {hayGuia ? t.proponer : t.crear}
          </Boton>
        </div>
      </form>

      <div aria-live="polite">
        {esperando && <p className="crear-con-ia__esperando">{hayGuia ? t.esperandoGuia : t.esperando}</p>}
      </div>

      {resultado && !resultado.ok && (
        <p ref={tituloResultado} tabIndex={-1} className="crear-con-ia__error" role="alert">
          {t.errores[resultado.error]}
        </p>
      )}

      {resultado?.ok && (
        <section className="crear-con-ia__resultado" aria-labelledby="propuestas">
          {resultado.entendido && (
            <div className="crear-con-ia__entendido">
              <h2>{t.entendido}</h2>
              <p>{resultado.entendido}</p>
            </div>
          )}
          {resultado.actividades.length === 0 ? (
            <p id="propuestas" ref={tituloResultado} tabIndex={-1} className="crear-con-ia__error" role="alert">
              {resultado.mensaje || t.nada}
            </p>
          ) : (
            <>
              <h2 id="propuestas" ref={tituloResultado} tabIndex={-1}>
                {t.propuestas(resultado.actividades.length)}
                {intento > 1 && <span className="etiqueta"> ({t.intento(intento)})</span>}
              </h2>
              <p className="advertencias">{t.revisa}</p>
              {resultado.actividades.map((actividad, i) => (
                <article key={i} className="propuesta" style={{ borderColor: `var(--tipo-${actividad.tipo})` }}>
                  <header className="propuesta__cabecera">
                    <IconoTipo tipo={actividad.tipo} className="propuesta__icono" />
                    <div>
                      <h3>{actividad.nombre || textos.tipos[actividad.tipo]}</h3>
                      <p className="propuesta__tipo">{textos.tipos[actividad.tipo]}</p>
                    </div>
                  </header>
                  {actividad.motivo && (
                    <p>
                      <strong>{t.porQue}</strong> {actividad.motivo}
                    </p>
                  )}
                  <VistaPrevia lectura={actividad.lectura} hayTexto onUsarEjemplo={() => {}} />
                  {actividad.usable ? (
                    <div>
                      <Boton variante="principal" onClick={() => void usar(actividad)}>
                        {t.usar}
                      </Boton>
                    </div>
                  ) : (
                    <p className="crear-con-ia__error">{t.noSirve}</p>
                  )}
                </article>
              ))}
              {usables.length > 1 && (
                <div>
                  <Boton variante="navegacion" onClick={() => void guardarTodas(usables)}>
                    {t.guardarTodas(usables.length)}
                  </Boton>
                </div>
              )}
            </>
          )}
          {pedirOtrasPropuestas}
        </section>
      )}
    </section>
  )
}
