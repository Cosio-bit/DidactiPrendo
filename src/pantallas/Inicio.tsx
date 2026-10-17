import { textos } from '../i18n/es-CL.ts'
import { irA } from '../navegacion.ts'
import { almacen } from '../storage/bloques.ts'
import { Boton } from '../ui/Boton.tsx'
import { pilaDeshacer } from '../ui/deshacer.ts'

async function crearActividad() {
  try {
    const bloque = await almacen.crear({
      type: 'ruleta',
      title: '',
      texto: '',
      items: [],
      config: {},
    })
    irA({ pantalla: 'editor', id: bloque.id })
  } catch {
    pilaDeshacer.avisar(textos.avisos.errorGuardar, true)
  }
}

export function Inicio() {
  return (
    <section className="inicio">
      <h1 tabIndex={-1}>{textos.inicio.saludo}</h1>
      <div className="inicio__acciones">
        <Boton variante="principal" grande onClick={() => void crearActividad()}>
          {textos.inicio.crearActividad}
        </Boton>
        <Boton grande onClick={() => irA({ pantalla: 'mis-actividades' })}>
          {textos.inicio.misActividades}
        </Boton>
      </div>
    </section>
  )
}
