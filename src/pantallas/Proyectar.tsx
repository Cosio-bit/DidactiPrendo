import { useEffect, useState } from 'react'
import { ProyeccionRuleta } from '../blocks/ruleta/ProyeccionRuleta.tsx'
import { leerConfigRuleta } from '../blocks/ruleta/logica.ts'
import { esListaDePreguntas, leerConfigPreguntas } from '../blocks/preguntas/logica.ts'
import { esListaDeCategorias } from '../blocks/clasificar/logica.ts'
import { ProyeccionClasificar } from '../blocks/clasificar/ProyeccionClasificar.tsx'
import { sePuedeProyectar } from '../blocks/catalogo.ts'
import { esListaDeTextos } from '../blocks/ordenar/logica.ts'
import { ProyeccionOrdenar } from '../blocks/ordenar/ProyeccionOrdenar.tsx'
import { esListaDeParejas } from '../blocks/parejas/logica.ts'
import { ProyeccionParejas } from '../blocks/parejas/ProyeccionParejas.tsx'
import { ProyeccionPreguntas } from '../blocks/preguntas/ProyeccionPreguntas.tsx'
import { comoPreguntas, esListaDeAfirmaciones } from '../blocks/preguntas/verdaderoFalso.ts'
import { textos } from '../i18n/es-CL.ts'
import { destinoAlVolver, volverDeProyeccion } from '../navegacion.ts'
import { entrarPantallaCompleta, salirPantallaCompleta } from '../projection/usePantallaCompleta.ts'
import { useAtajos } from '../projection/useAtajos.ts'
import { nombreVisible } from './nombreVisible.ts'
import { almacen } from '../storage/bloques.ts'
import type { Block } from '../storage/modelo.ts'
import type { Resultado } from '../storage/useConsulta.ts'
import { Boton } from '../ui/Boton.tsx'

function textoVolver(id: string) {
  const destino = destinoAlVolver(id).pantalla
  return destino === 'mis-actividades' ? textos.proyeccion.volverA['mis-actividades'] : textos.proyeccion.volverA.editor
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
        {textoVolver(id)}
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
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'preguntas') {
    if (!esListaDePreguntas(b.items) || b.items.length === 0) {
      return <Aviso id={id} mensaje={textos.proyeccion.sinPreguntas} />
    }
    return (
      <ProyeccionPreguntas
        key={b.id}
        preguntas={b.items}
        config={leerConfigPreguntas(b.config)}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'verdadero-falso') {
    if (!esListaDeAfirmaciones(b.items) || b.items.length === 0) {
      return <Aviso id={id} mensaje={textos.proyeccion.sinAfirmaciones} />
    }
    return (
      <ProyeccionPreguntas
        key={b.id}
        preguntas={comoPreguntas(b.items)}
        config={leerConfigPreguntas(b.config)}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
        verdaderoFalso
      />
    )
  }

  if (b.type === 'parejas') {
    if (!esListaDeParejas(b.items) || b.items.length < 2) {
      return <Aviso id={id} mensaje={textos.proyeccion.sinParejas} />
    }
    return <ProyeccionParejas key={b.id} parejas={b.items} onSalir={() => salir(id)}
        textoVolver={textoVolver(id)} />
  }

  if (b.type === 'ordenar') {
    if (!esListaDeTextos(b.items) || b.items.length < 2) {
      return <Aviso id={id} mensaje={textos.proyeccion.sinElementosOrdenar} />
    }
    return <ProyeccionOrdenar key={b.id} titulo={nombreVisible(b)} elementos={b.items} onSalir={() => salir(id)}
        textoVolver={textoVolver(id)} />
  }

  if (b.type === 'clasificar') {
    if (!esListaDeCategorias(b.items) || !sePuedeProyectar('clasificar', b.items)) {
      return <Aviso id={id} mensaje={textos.proyeccion.sinCategorias} />
    }
    // Las categorías sin elementos no aportan nada a la proyección.
    const categorias = b.items.filter((c) => c.elementos.length > 0)
    return <ProyeccionClasificar key={b.id} titulo={nombreVisible(b)} categorias={categorias} onSalir={() => salir(id)}
        textoVolver={textoVolver(id)} />
  }

  return <Aviso id={id} mensaje={textos.proyeccion.tipoNoDisponible} />
}
