import { useEffect, useState } from 'react'
import { ProyeccionRuleta } from '../blocks/ruleta/ProyeccionRuleta.tsx'
import { leerConfigRuleta } from '../blocks/ruleta/logica.ts'
import { textos } from '../i18n/es-CL.ts'
import { volverDeProyeccion } from '../navegacion.ts'
import { entrarPantallaCompleta, salirPantallaCompleta } from '../projection/usePantallaCompleta.ts'
import { useAtajos } from '../projection/useAtajos.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import type { Resultado } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'

function esListaDeTextos(items: unknown): items is string[] {
  return Array.isArray(items) && items.every((i) => typeof i === 'string')
}

function salir(id: string) {
  salirPantallaCompleta()
  volverDeProyeccion(id)
}

/** Mensaje en vez de la proyección cuando la actividad no se puede mostrar. */
function Aviso({ id, mensaje }: { id: string; mensaje: string }) {
  useAtajos({ salir: () => salir(id) })
  return (
    <div className="proyeccion proyeccion--aviso">
      <p>{mensaje}</p>
      <Boton variante="principal" onClick={() => salir(id)}>
        {textos.proyeccion.salir}
      </Boton>
    </div>
  )
}

export function Proyectar({ id }: { id: string }) {
  // Se lee una sola vez: un cambio en otra pestaña no debe mover la ruleta en plena clase.
  const [bloque, setBloque] = useState<Resultado<Block | undefined>>({ listo: false })
  useEffect(() => {
    let vigente = true
    almacen
      .obtener(id)
      .catch(() => undefined)
      .then((valor) => vigente && setBloque({ listo: true, valor }))
    return () => {
      vigente = false
    }
  }, [id])
  const listo = bloque.listo

  useEffect(() => {
    // Si se llegó con un clic en "Proyectar", el navegador permite pasar a pantalla completa.
    if (listo) entrarPantallaCompleta()
  }, [listo])

  if (!bloque.listo) return <div className="proyeccion" />
  const b = bloque.valor
  if (!b) return <Aviso id={id} mensaje={textos.editor.noEncontrada} />

  if (b.type === 'ruleta') {
    if (!esListaDeTextos(b.items) || b.items.length < 2) {
      return <Aviso id={id} mensaje={textos.proyeccion.ruletaPocosElementos} />
    }
    return (
      <ProyeccionRuleta
        key={b.id}
        elementos={b.items}
        config={leerConfigRuleta(b.config)}
        onSalir={() => salir(id)}
      />
    )
  }

  return <Aviso id={id} mensaje={textos.proyeccion.tipoNoDisponible} />
}
