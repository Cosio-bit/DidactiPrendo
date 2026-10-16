import { useState } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import { useConsulta } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'
import { DialogoConfirmacion } from '../ui/DialogoConfirmacion.tsx'
import { nombreVisible } from './nombreVisible.ts'
import { pilaDeshacer } from '../ui/deshacer.ts'

function fecha(ms: number) {
  return new Date(ms).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
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
  const bloques = useConsulta(() => almacen.listar(), 'lista')
  const [porBorrar, setPorBorrar] = useState<Block | null>(null)

  return (
    <section className="mis-actividades">
      <h1 tabIndex={-1}>{textos.misActividades.titulo}</h1>

      {!bloques.listo && <p>{textos.misActividades.cargando}</p>}

      {bloques.listo && bloques.valor.length === 0 && (
        <div className="vacio">
          <p>{textos.misActividades.vacio}</p>
        </div>
      )}

      {bloques.listo && bloques.valor.length > 0 && (
        <ul className="lista-actividades">
          {bloques.valor.map((bloque) => (
            <li key={bloque.id} className="actividad">
              <div className="actividad__datos">
                <h2 className="actividad__nombre">{nombreVisible(bloque)}</h2>
                <p className="actividad__fecha">{textos.misActividades.modificada(fecha(bloque.updatedAt))}</p>
              </div>
              <div className="actividad__acciones">
                <Boton variante="principal" onClick={() => irA({ pantalla: 'editor', id: bloque.id })}>
                  {textos.misActividades.abrir}
                </Boton>
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
