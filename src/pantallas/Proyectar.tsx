import { useEffect, useState } from 'react'
import { ProyeccionRuleta } from '../blocks/ruleta/ProyeccionRuleta.tsx'
import { leerConfigRuleta } from '../blocks/ruleta/logica.ts'
import { esListaDePreguntas, leerConfigPreguntas } from '../blocks/preguntas/logica.ts'
import { esListaDeCategorias } from '../blocks/clasificar/logica.ts'
import { ProyeccionClasificar } from '../blocks/clasificar/ProyeccionClasificar.tsx'
import { sePuedeProyectar } from '../blocks/catalogo.ts'
import { esListaDeFrases, leerConfigCompletar } from '../blocks/completar/logica.ts'
import { ProyeccionCompletar } from '../blocks/completar/ProyeccionCompletar.tsx'
import { esListaDeTextos } from '../blocks/ordenar/logica.ts'
import { ProyeccionOrdenar } from '../blocks/ordenar/ProyeccionOrdenar.tsx'
import { esListaDeParejas } from '../blocks/parejas/logica.ts'
import { ProyeccionParejas } from '../blocks/parejas/ProyeccionParejas.tsx'
import { ProyeccionPareados } from '../blocks/pareados/ProyeccionPareados.tsx'
import { esListaDeDefiniciones } from '../blocks/rosco/logica.ts'
import { ProyeccionRosco } from '../blocks/rosco/ProyeccionRosco.tsx'
import { ProyeccionPreguntas } from '../blocks/preguntas/ProyeccionPreguntas.tsx'
import { comoPreguntas, esListaDeAfirmaciones } from '../blocks/preguntas/verdaderoFalso.ts'
import { esListaDeAdivinanzas } from '../blocks/quien-soy/logica.ts'
import { ProyeccionQuienSoy } from '../blocks/quien-soy/ProyeccionQuienSoy.tsx'
import { leerConfigTarjetas } from '../blocks/tarjetas/logica.ts'
import { ProyeccionTarjetas } from '../blocks/tarjetas/ProyeccionTarjetas.tsx'
import { textos } from '../i18n/es-CL.ts'
import { destinoAlVolver, volverDeProyeccion } from '../navegacion.ts'
import { entrarPantallaCompleta, salirPantallaCompleta } from '../projection/usePantallaCompleta.ts'
import { MarcoProyeccion } from '../projection/MarcoProyeccion.tsx'
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
  const aviso = mensajeSiNoSePuede(b)
  if (aviso) return <Aviso id={id} mensaje={aviso} />

  // El marcador y el temporizador acompañan a cualquier actividad.
  return (
    <MarcoProyeccion>
      <Actividad bloque={b} />
    </MarcoProyeccion>
  )
}

/** Por qué no se puede proyectar, o undefined si se puede. */
function mensajeSiNoSePuede(b: Block): string | undefined {
  const t = textos.proyeccion
  switch (b.type) {
    case 'ruleta':
      return esListaDeTextos(b.items) && b.items.length >= 2 ? undefined : t.ruletaPocosElementos
    case 'preguntas':
      return esListaDePreguntas(b.items) && b.items.length > 0 ? undefined : t.sinPreguntas
    case 'verdadero-falso':
      return esListaDeAfirmaciones(b.items) && b.items.length > 0 ? undefined : t.sinAfirmaciones
    case 'parejas':
      return esListaDeParejas(b.items) && b.items.length >= 2 ? undefined : t.sinParejas
    case 'terminos-pareados':
      return esListaDeParejas(b.items) && b.items.length >= 2 ? undefined : t.sinTerminos
    case 'ordenar':
      return esListaDeTextos(b.items) && b.items.length >= 2 ? undefined : t.sinElementosOrdenar
    case 'clasificar':
      return esListaDeCategorias(b.items) && sePuedeProyectar('clasificar', b.items) ? undefined : t.sinCategorias
    case 'tarjetas':
      return esListaDeParejas(b.items) && b.items.length > 0 ? undefined : t.sinTarjetas
    case 'completar':
      return esListaDeFrases(b.items) && sePuedeProyectar('completar', b.items) ? undefined : t.sinFrases
    case 'rosco':
      return esListaDeDefiniciones(b.items) && b.items.length > 0 ? undefined : t.sinDefiniciones
    case 'quien-soy':
      return esListaDeAdivinanzas(b.items) && sePuedeProyectar('quien-soy', b.items) ? undefined : t.sinAdivinanzas
    default:
      return t.tipoNoDisponible
  }
}

function Actividad({ bloque: b }: { bloque: Block }) {
  const id = b.id

  if (b.type === 'ruleta' && esListaDeTextos(b.items)) {
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

  if (b.type === 'preguntas' && esListaDePreguntas(b.items)) {
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

  if (b.type === 'verdadero-falso' && esListaDeAfirmaciones(b.items)) {
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

  if (b.type === 'parejas' && esListaDeParejas(b.items)) {
    return (
      <ProyeccionParejas
        key={b.id}
        parejas={b.items}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'terminos-pareados' && esListaDeParejas(b.items)) {
    return (
      <ProyeccionPareados
        key={b.id}
        titulo={nombreVisible(b)}
        parejas={b.items}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'ordenar' && esListaDeTextos(b.items)) {
    return (
      <ProyeccionOrdenar
        key={b.id}
        titulo={nombreVisible(b)}
        elementos={b.items}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'clasificar' && esListaDeCategorias(b.items)) {
    // Las categorías sin elementos no aportan nada a la proyección.
    const categorias = b.items.filter((c) => c.elementos.length > 0)
    return (
      <ProyeccionClasificar
        key={b.id}
        titulo={nombreVisible(b)}
        categorias={categorias}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'tarjetas' && esListaDeParejas(b.items)) {
    return (
      <ProyeccionTarjetas
        key={b.id}
        tarjetas={b.items}
        config={leerConfigTarjetas(b.config)}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'completar' && esListaDeFrases(b.items)) {
    // Una frase sin palabras ocultas no tiene nada que completar.
    const frases = b.items.filter((f) => f.partes.some((p) => p.oculta))
    return (
      <ProyeccionCompletar
        key={b.id}
        frases={frases}
        config={leerConfigCompletar(b.config)}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'rosco' && esListaDeDefiniciones(b.items)) {
    return (
      <ProyeccionRosco
        key={b.id}
        definiciones={b.items}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  if (b.type === 'quien-soy' && esListaDeAdivinanzas(b.items)) {
    const adivinanzas = b.items.filter((a) => a.pistas.length > 0)
    return (
      <ProyeccionQuienSoy
        key={b.id}
        adivinanzas={adivinanzas}
        onSalir={() => salir(id)}
        textoVolver={textoVolver(id)}
      />
    )
  }

  return null
}
