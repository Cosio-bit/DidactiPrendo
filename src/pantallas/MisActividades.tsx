import { useEffect, useState } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { esTipoConTexto, sePuedeProyectar } from '../blocks/catalogo.ts'
import { almacen, esVacio } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { DialogoConfirmacion } from '../ui/DialogoConfirmacion.tsx'
import { crearActividad } from './crearActividad.ts'
import { nombreVisible } from './nombreVisible.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

/** "hoy", "ayer", "el 3 de octubre" (con el año solo si no es este año). */
function fecha(ms: number) {
  const dia = new Date(ms)
  const hoy = new Date()
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
  if (dia.toDateString() === hoy.toDateString()) return textos.misActividades.hoy
  if (dia.toDateString() === ayer.toDateString()) return textos.misActividades.ayer
  const conAno = dia.getFullYear() !== hoy.getFullYear()
  const texto = dia.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', ...(conAno && { year: 'numeric' }) })
  return textos.misActividades.elDia(texto)
}

function resumen(bloque: Block) {
  const partes: string[] = []
  if (esTipoConTexto(bloque.type)) {
    partes.push(textos.tipos[bloque.type])
    if (Array.isArray(bloque.items)) partes.push(textos.vistaPrevia.cantidad(bloque.type, bloque.items.length))
  }
  partes.push(textos.misActividades.modificada(fecha(bloque.updatedAt)))
  return partes.join(' · ')
}

async function borrar(bloque: Block) {
  try {
    const borrado = await almacen.borrar(bloque.id)
    if (!borrado) return
    const nombre = nombreVisible(borrado)
    pilaDeshacer.registrar({
      descripcion: textos.acciones.borrado(nombre),
      deshacer: () => almacen.restaurar(borrado),
    })
    pilaDeshacer.avisar(textos.avisos.borrada(nombre))
  } catch {
    pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
  }
}

export function MisActividades() {
  // Las actividades creadas y abandonadas sin escribir nada no se muestran.
  const bloques = useConsulta(async () => (await almacen.listar()).filter((b) => !esVacio(b)), 'lista')
  const [porBorrar, setPorBorrar] = useState<Block | null>(null)

  useEffect(() => {
    almacen.borrarVacios().catch(() => {})
  }, [])

  return (
    <section className="mis-actividades">
      <h1 tabIndex={-1}>{textos.misActividades.titulo}</h1>

      {!bloques.listo && <p>{textos.misActividades.cargando}</p>}

      {bloques.listo && bloques.valor.length === 0 && (
        <div className="vacio">
          <p>{textos.misActividades.vacio}</p>
          <Boton variante="principal" onClick={() => void crearActividad()}>
            {textos.inicio.crearActividad}
          </Boton>
        </div>
      )}

      {bloques.listo && bloques.valor.length > 0 && (
        <ul className="lista-actividades">
          {bloques.valor.map((bloque) => (
            <li key={bloque.id} className="actividad">
              <div className="actividad__datos">
                <h2 className="actividad__nombre">{nombreVisible(bloque)}</h2>
                <p className="actividad__fecha">{resumen(bloque)}</p>
              </div>
              <div className="actividad__acciones">
                {esTipoConTexto(bloque.type) && (
                  <Boton
                    variante="principal"
                    disabled={!sePuedeProyectar(bloque.type, bloque.items)}
                    onClick={() => irA({ pantalla: 'proyectar', id: bloque.id })}
                  >
                    {textos.misActividades.proyectar}
                  </Boton>
                )}
                <Boton onClick={() => irA({ pantalla: 'editor', id: bloque.id })}>{textos.misActividades.editar}</Boton>
                <Boton variante="peligro" onClick={() => setPorBorrar(bloque)}>
                  {textos.misActividades.borrar}
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DialogoConfirmacion
        abierto={porBorrar !== null}
        titulo={textos.confirmarBorrado.titulo}
        mensaje={porBorrar ? textos.confirmarBorrado.mensaje(nombreVisible(porBorrar)) : ''}
        textoConfirmar={textos.confirmarBorrado.confirmar}
        textoCancelar={textos.confirmarBorrado.cancelar}
        onCancelar={() => setPorBorrar(null)}
        onConfirmar={() => {
          if (porBorrar) void borrar(porBorrar)
          setPorBorrar(null)
        }}
      />
    </section>
  )
}
