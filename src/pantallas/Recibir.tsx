import { useEffect, useState } from 'react'
import { esTipoConTexto } from '../blocks/catalogo.ts'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { parseText } from '../parser/parseText.ts'
import { almacen } from '../storage/bloques.ts'
import { decodificar, type Compartida } from '../storage/intercambio.ts'
import type { Block } from '../storage/modelo.ts'
import { Boton } from '../ui/Boton.tsx'
import { pilaDeshacer } from '../ui/deshacer.ts'
import { nombreVisible } from './nombreVisible.ts'
import { VistaPrevia } from './VistaPrevia.tsx'

const t = textos.recibir

type Estado =
  | { cargando: true }
  | { cargando: false; error: string }
  | { cargando: false; actividad: Compartida; existente: Block | undefined }

const igual = (b: Block, a: Compartida) => b.type === a.type && b.title === a.title && (b.texto ?? '') === a.texto

/** Se abrió un enlace compartido: se muestra la actividad y el profe decide si la guarda. */
export function Recibir({ datos }: { datos: string }) {
  const [estado, setEstado] = useState<Estado>({ cargando: true })

  useEffect(() => {
    let vigente = true
    ;(async () => {
      const resultado = await decodificar(datos)
      if (!resultado.ok || !esTipoConTexto(resultado.actividad.type)) {
        const error = !resultado.ok && resultado.motivo === 'navegador-antiguo' ? t.navegadorAntiguo : t.danado
        if (vigente) setEstado({ cargando: false, error })
        return
      }
      const actividad = resultado.actividad
      const existente = (await almacen.listar().catch(() => [])).find((b) => igual(b, actividad))
      if (vigente) setEstado({ cargando: false, actividad, existente })
    })()
    return () => {
      vigente = false
    }
  }, [datos])

  const encabezado = <h1 tabIndex={-1}>{t.titulo}</h1>

  if (estado.cargando) {
    return (
      <section className="recibir">
        {encabezado}
        <p>{t.cargando}</p>
      </section>
    )
  }

  if ('error' in estado) {
    return (
      <section className="recibir">
        {encabezado}
        <p className="aviso-error">{estado.error}</p>
        <Boton variante="navegacion" onClick={() => irA({ pantalla: 'inicio' })}>
          {textos.app.volverAlInicio}
        </Boton>
      </section>
    )
  }

  const { actividad, existente } = estado
  const tipo = esTipoConTexto(actividad.type) ? actividad.type : 'ruleta'
  const lectura = parseText(actividad.texto, tipo)
  const nombre = nombreVisible({ title: actividad.title, type: tipo, items: lectura.elementos })

  async function guardar(proyectar: boolean) {
    try {
      const bloque = await almacen.crear({
        type: tipo,
        title: actividad.title,
        texto: actividad.texto,
        items: lectura.elementos,
        config: actividad.config,
      })
      pilaDeshacer.avisar(t.guardada(nombre))
      irA(proyectar ? { pantalla: 'proyectar', id: bloque.id } : { pantalla: 'mis-actividades' })
    } catch {
      pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
    }
  }

  return (
    <section className="recibir">
      {encabezado}
      <p className="recibir__nombre">
        <strong>{nombre}</strong>
        <br />
        {textos.tipos[tipo]} · {textos.vistaPrevia.cantidad(tipo, lectura.elementos.length)}
      </p>

      {existente ? (
        <>
          <p className="nota">{t.yaLaTienes}</p>
          <div className="recibir__acciones">
            <Boton variante="principal" onClick={() => irA({ pantalla: 'proyectar', id: existente.id })}>
              {textos.misActividades.proyectar}
            </Boton>
            <Boton variante="navegacion" onClick={() => irA({ pantalla: 'mis-actividades' })}>
              {textos.inicio.misActividades}
            </Boton>
          </div>
        </>
      ) : (
        <div className="recibir__acciones">
          <Boton variante="principal" onClick={() => void guardar(true)}>
            {t.guardarYProyectar}
          </Boton>
          <Boton variante="herramienta" onClick={() => void guardar(false)}>
            {t.guardar}
          </Boton>
          <Boton variante="navegacion" onClick={() => irA({ pantalla: 'inicio' })}>
            {t.noGuardar}
          </Boton>
        </div>
      )}

      <VistaPrevia lectura={lectura} hayTexto onUsarEjemplo={() => undefined} />
    </section>
  )
}
