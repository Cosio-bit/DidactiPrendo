import { useEffect, useId, useRef, useState } from 'react'
import { pedirActividades, type ActividadIA, type ResultadoIA } from '../ai-bridge/crearConIA.ts'
import { IconoTipo } from '../blocks/IconoTipo.tsx'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { ajustes } from '../storage/ajustes.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { Boton } from '../ui/Boton.tsx'
import { pilaDeshacer } from '../ui/deshacer.ts'
import { useAltoAutomatico } from '../ui/useAltoAutomatico.ts'
import { VistaPrevia } from './VistaPrevia.tsx'

const t = textos.crearConIA
const CLAVE_CODIGO = 'codigoIA'

/** Lo último que se pidió y lo que respondió la IA: si el profe sale y vuelve, no se pierde ni se paga de nuevo. */
let memoria: { pedido: string; guia: string; resultado: ResultadoIA | null } = { pedido: '', guia: '', resultado: null }

function guardarBloque(actividad: ActividadIA) {
  return almacen.crear({
    type: actividad.tipo,
    title: actividad.nombre,
    texto: actividad.texto,
    items: actividad.lectura.elementos,
    config: {},
  })
}

export function CrearConIA() {
  const [pedido, setPedido] = useState(memoria.pedido)
  const [guia, setGuia] = useState(memoria.guia)
  const [conGuia, setConGuia] = useState(memoria.guia !== '')
  const [codigo, setCodigo] = useState('')
  const [pideCodigo, setPideCodigo] = useState(false)
  const [esperando, setEsperando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoIA | null>(memoria.resultado)
  const idPedido = useId()
  const idGuia = useId()
  const idCodigo = useId()
  const cuadroPedido = useAltoAutomatico(pedido)
  const cuadroGuia = useAltoAutomatico(guia)
  const tituloResultado = useRef<HTMLHeadingElement>(null)

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
    memoria = { pedido, guia: conGuia ? guia : '', resultado }
  }, [pedido, guia, conGuia, resultado])

  async function crear() {
    if (esperando || !pedido.trim()) return
    setEsperando(true)
    setResultado(null)
    const respuesta = await pedirActividades({ pedido, guia: conGuia ? guia : '', codigo })
    setEsperando(false)
    setResultado(respuesta)
    if (!respuesta.ok && respuesta.error === 'codigo') setPideCodigo(true)
    if (respuesta.ok && codigo.trim()) void ajustes.guardar(CLAVE_CODIGO, codigo.trim())
    // El foco va a la respuesta, para quien usa teclado o lector de pantalla.
    requestAnimationFrame(() => tituloResultado.current?.focus())
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
          <textarea
            ref={cuadroPedido}
            id={idPedido}
            className="campo__entrada crear-con-ia__area"
            value={pedido}
            placeholder={t.pedidoEjemplo}
            maxLength={1500}
            rows={2}
            onChange={(evento) => setPedido(evento.target.value)}
          />
        </div>

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
              maxLength={40_000}
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
              {t.agregarGuia}
            </Boton>
          </div>
        )}

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
          <Boton type="submit" variante="principal" className="crear-con-ia__crear" disabled={esperando || !pedido.trim()}>
            {t.crear}
          </Boton>
        </div>
      </form>

      <div aria-live="polite">
        {esperando && <p className="crear-con-ia__esperando">{t.esperando}</p>}
      </div>

      {resultado && !resultado.ok && (
        <p ref={tituloResultado} tabIndex={-1} className="crear-con-ia__error" role="alert">
          {t.errores[resultado.error]}
        </p>
      )}

      {resultado?.ok && (
        <section className="crear-con-ia__resultado" aria-labelledby="propuestas">
          {resultado.actividades.length === 0 ? (
            <p id="propuestas" ref={tituloResultado} tabIndex={-1} className="crear-con-ia__error" role="alert">
              {resultado.mensaje || t.nada}
            </p>
          ) : (
            <>
              <h2 id="propuestas" ref={tituloResultado} tabIndex={-1}>
                {t.propuestas(resultado.actividades.length)}
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
        </section>
      )}
    </section>
  )
}
