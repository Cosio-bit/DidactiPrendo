import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Categoria } from '../../parser/tipos.ts'
import { useArrastrar } from '../../projection/useArrastrar.ts'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  agarrar,
  deshacer,
  elegir,
  nuevoClasificar,
  revelarSiguiente,
  soltarElegido,
  soltarEn,
  terminado,
  ubicarEn,
  type Clasificar,
} from './logica.ts'

const t = textos.proyeccion

interface Props {
  titulo: string
  categorias: Categoria[]
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionClasificar({ titulo, categorias, onSalir, textoVolver }: Props) {
  const [juego, setJuego] = useState<Clasificar>(() => nuevoClasificar(categorias))
  const pantallaCompleta = usePantallaCompleta()
  const listo = terminado(juego)
  const total = juego.elementos.length

  // Números 1 a 9: llevar el elemento elegido a esa categoría.
  const numeros = Object.fromEntries(
    categorias.slice(0, 9).map((_, i) => [String(i + 1), () => setJuego((j) => ubicarEn(j, i))]),
  )
  useAtajos({
    avanzar: () => setJuego(revelarSiguiente),
    retroceder: () => setJuego(deshacer),
    // Con un elemento agarrado, Esc solo lo suelta; si no, sale de la proyección.
    salir: () => (juego.elegido !== null ? setJuego(soltarElegido) : onSalir()),
    pantallaCompleta: pantallaCompleta.alternar,
    otras: numeros,
  })

  // Tomar y arrastrar un elemento hasta su categoría (mouse, dedo o lápiz).
  // Si se suelta fuera de una categoría, queda agarrado: no se pierde la elección.
  const { fantasma, arrastrable, fueArrastre } = useArrastrar<number>({
    agarrado: juego.elegido,
    alSoltar: (elemento, destino) => {
      const categoria = Number(destino.replace('categoria-', ''))
      setJuego((j) => soltarEn(j, elemento, categoria))
    },
    alSoltarFuera: (elemento) => setJuego((j) => agarrar(j, elemento)),
  })

  const contenido = useTextoAjustado<HTMLDivElement>(`${juego.ubicados.length}-${juego.elegido}-${juego.errado?.categoria}`, 56)
  const sueltos = juego.elementos.map((e, i) => ({ ...e, indice: i })).filter((e) => !juego.ubicados.includes(e.indice))

  return (
    <div className="proyeccion proyeccion-ordenar proyeccion-clasificar">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero proyeccion__titulo" title={titulo}>
          {titulo}
        </p>
        <p className="proyeccion-parejas__aviso" aria-live="polite">
          {listo ? t.clasificacionTerminada : t.ubicados(juego.ubicados.length, total)}
        </p>
        <div className="proyeccion__secundarios">
          <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
          <Boton variante="herramienta" onClick={() => setJuego(nuevoClasificar(categorias))}>{t.volverAEmpezar}</Boton>
          {pantallaCompleta.disponible && (
            <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
              {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
            </Boton>
          )}
        </div>
      </div>

      <div ref={contenido} className="proyeccion-ordenar__contenido">
        <div
          className="proyeccion-clasificar__categorias"
          style={{ gridTemplateColumns: `repeat(${Math.min(categorias.length, 4)}, minmax(0, 1fr))` }}
        >
          {categorias.map((categoria, i) => {
            const errada = juego.errado?.categoria === i
            return (
              <button
                key={i}
                type="button"
                className={[
                  'categoria',
                  errada && 'categoria--errada',
                  fantasma?.destino === `categoria-${i}` && 'categoria--destino',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-destino={`categoria-${i}`}
                onClick={() => setJuego((j) => ubicarEn(j, i))}
                aria-label={t.categoriaBoton(i + 1, categoria.nombre)}
              >
                <span className="categoria__nombre">
                  <span className="ficha__letra">{i + 1}</span> {categoria.nombre}
                </span>
                <span className="categoria__elementos">
                  {juego.ubicados
                    .filter((u) => juego.elementos[u].categoria === i)
                    .map((u) => (
                      <span key={u} className="categoria__elemento">
                        {juego.elementos[u].texto}
                      </span>
                    ))}
                </span>
              </button>
            )
          })}
        </div>

        <ul className="proyeccion-ordenar__fichas">
          {sueltos.map((e) => {
            const elegido = juego.elegido === e.indice
            const errado = juego.errado?.elemento === e.indice
            const clases = ['ficha']
            if (elegido) clases.push('ficha--elegida')
            if (errado) clases.push('ficha--errada')
            if (fantasma?.ancho !== undefined && fantasma.item === e.indice) clases.push('ficha--arrastrada')
            return (
              <li key={e.indice}>
                <button
                  type="button"
                  className={clases.join(' ')}
                  aria-pressed={elegido}
                  {...arrastrable(e.indice)}
                  onClick={() => !fueArrastre(e.indice) && setJuego((j) => elegir(j, e.indice))}
                >
                  {e.texto}
                  {errado && (
                    <strong className="ficha__marca"> ✗ {t.noVaEn(categorias[juego.errado!.categoria].nombre)}</strong>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* La copia que sigue al puntero (dentro del contenido, para tener su mismo tamaño de letra). */}
        {fantasma && (
          <div
            className="ficha ficha--fantasma"
            aria-hidden="true"
            style={{ left: fantasma.x, top: fantasma.y, width: fantasma.ancho }}
          >
            {juego.elementos[fantasma.item].texto}
          </div>
        )}
      </div>

      <div className="proyeccion-preguntas__controles">
        <Boton variante="herramienta" onClick={() => setJuego(deshacer)} disabled={juego.ubicados.length === 0}>
          {t.deshacerPaso}
        </Boton>
        <Boton
          variante="principal"
          className="proyeccion-preguntas__avanzar"
          onClick={() => setJuego(revelarSiguiente)}
          disabled={listo}
        >
          {t.ubicarSiguiente}
        </Boton>
      </div>
      <p className="proyeccion__teclas">{juego.elegido !== null ? t.elegirCategoria : t.teclasClasificar}</p>
    </div>
  )
}
