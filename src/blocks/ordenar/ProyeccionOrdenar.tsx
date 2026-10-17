import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { useArrastrar } from '../../projection/useArrastrar.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import { letra } from '../preguntas/logica.ts'
import { deshacer, nuevoOrdenar, proponer, revelarSiguiente, terminado, type Ordenar } from './logica.ts'

const t = textos.proyeccion

/** Casillas en una, dos o tres columnas según cuántas son, para que quepan en 4:3. */
function columnasCasillas(cantidad: number) {
  return cantidad <= 4 ? 1 : cantidad <= 8 ? 2 : 3
}

interface Props {
  titulo: string
  elementos: string[]
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionOrdenar({ titulo, elementos, onSalir, textoVolver }: Props) {
  const [orden, setOrden] = useState<Ordenar>(() => nuevoOrdenar(elementos.length))
  const pantallaCompleta = usePantallaCompleta()
  const listo = terminado(orden)
  /** Ficha soltada fuera del orden: queda agarrada hasta que se toque el orden (o Esc). */
  const [agarrado, setAgarrado] = useState<number | null>(null)

  function proponerFicha(indice: number) {
    setAgarrado(null)
    setOrden((o) => proponer(o, indice))
  }

  const { fantasma, arrastrable, fueArrastre } = useArrastrar<number>({
    agarrado,
    alSoltar: (indice) => proponerFicha(indice),
    alSoltarFuera: (indice) => setAgarrado(indice),
  })

  useAtajos({
    avanzar: () => {
      setAgarrado(null)
      setOrden(revelarSiguiente)
    },
    retroceder: () => {
      setAgarrado(null)
      setOrden(deshacer)
    },
    // Con una ficha agarrada, Esc solo la suelta; si no, sale de la proyección.
    salir: () => (agarrado !== null ? setAgarrado(null) : onSalir()),
    pantallaCompleta: pantallaCompleta.alternar,
  })

  // El tamaño de letra se calcula una sola vez, con todas las casillas ya ocupadas (texto reservado) y el
  // banco completo, así no cambia en cada jugada. Solo se recalcula si cambia el tamaño de la pantalla.
  const contenido = useTextoAjustado<HTMLDivElement>('ordenar', 56)

  // Cada elemento conserva la letra con que apareció, aunque los demás se muevan.
  const porOrdenar = orden.desorden.map((indice, posicion) => ({ indice, letra: letra(posicion) }))
  const letraDe = (indice: number) => porOrdenar.find((p) => p.indice === indice)!.letra

  return (
    <div className="proyeccion proyeccion-ordenar">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero proyeccion__titulo" title={titulo}>
          {titulo}
        </p>
        <p className="proyeccion-parejas__aviso" aria-live="polite">
          {listo ? t.ordenTerminado : t.enSuLugar(orden.colocados, elementos.length)}
        </p>
        <div className="proyeccion__secundarios">
          <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
          <Boton variante="herramienta" onClick={() => setOrden(nuevoOrdenar(elementos.length))}>{t.volverAEmpezar}</Boton>
          {pantallaCompleta.disponible && (
            <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
              {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
            </Boton>
          )}
        </div>
      </div>

      <div ref={contenido} className="proyeccion-ordenar__contenido">
        <section
          className={agarrado !== null ? 'proyeccion-ordenar__columna proyeccion-ordenar__destino' : 'proyeccion-ordenar__columna'}
          data-destino="orden"
          onClick={() => agarrado !== null && proponerFicha(agarrado)}
        >
          <h2 className="proyeccion-ordenar__titulo">{t.ordenCorrecto}</h2>
          <ol
            className="proyeccion-ordenar__lista proyeccion-ordenar__casillas"
            style={{ gridTemplateRows: `repeat(${Math.ceil(elementos.length / columnasCasillas(elementos.length))}, auto)` }}
          >
            {elementos.map((elemento, i) => (
              <li
                key={i}
                className={
                  i < orden.colocados
                    ? 'casilla casilla--llena'
                    : i === orden.colocados
                      ? fantasma?.destino === 'orden'
                        ? 'casilla casilla--siguiente casilla--destino'
                        : 'casilla casilla--siguiente'
                      : 'casilla'
                }
              >
                <span className="casilla__numero">{i + 1}</span>
                {/* El texto que va en la casilla ocupa su lugar desde el inicio (invisible hasta que se coloca). */}
                <span
                  className={i < orden.colocados ? 'casilla__texto' : 'casilla__texto casilla__texto--reservado'}
                  aria-hidden={i >= orden.colocados}
                >
                  <span className="ficha__letra">{letraDe(i)}</span> {elemento}
                </span>
                {i === orden.colocados && <span className="casilla__pregunta">{t.cualSigue}</span>}
              </li>
            ))}
          </ol>
        </section>

        <section className="proyeccion-ordenar__columna">
          <h2 className="proyeccion-ordenar__titulo">{t.porOrdenar}</h2>
          <ul className="proyeccion-ordenar__fichas">
            {porOrdenar.map((p) =>
              // Una ficha ya colocada deja su hueco: las demás no se corren.
              p.indice < orden.colocados ? (
                <li key={p.indice} aria-hidden="true">
                  <span className="ficha ficha--hueco">
                    <span className="ficha__letra">{p.letra}</span> {elementos[p.indice]}
                  </span>
                </li>
              ) : (
                <li key={p.indice}>
                  <button
                    type="button"
                    className={[
                      'ficha',
                      orden.errado === p.indice && 'ficha--errada',
                      agarrado === p.indice && 'ficha--elegida',
                      fantasma?.ancho !== undefined && fantasma.item === p.indice && 'ficha--arrastrada',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    {...arrastrable(p.indice)}
                    onClick={() => !fueArrastre(p.indice) && proponerFicha(p.indice)}
                  >
                    <span className="ficha__letra">{p.letra}</span> {elementos[p.indice]}
                    {orden.errado === p.indice && <strong className="ficha__marca">✗ {t.noVaAqui}</strong>}
                  </button>
                </li>
              ),
            )}
          </ul>
        </section>

        {/* La copia que sigue al puntero (dentro del contenido, para tener su mismo tamaño de letra). */}
        {fantasma && (
          <div
            className="ficha ficha--fantasma"
            aria-hidden="true"
            style={{ left: fantasma.x, top: fantasma.y, width: fantasma.ancho }}
          >
            <span className="ficha__letra">{letraDe(fantasma.item)}</span> {elementos[fantasma.item]}
          </div>
        )}
      </div>

      <div className="proyeccion-preguntas__controles">
        <Boton variante="herramienta" onClick={() => setOrden(deshacer)} disabled={orden.colocados === 0}>
          {t.deshacerPaso}
        </Boton>
        <Boton
          variante="principal"
          className="proyeccion-preguntas__avanzar"
          onClick={() => setOrden(revelarSiguiente)}
          disabled={listo}
        >
          {t.revelarSiguiente}
        </Boton>
      </div>
      <AyudaTeclas indicacion={agarrado !== null}>{agarrado !== null ? t.tocarOrden : t.teclasOrdenar}</AyudaTeclas>
    </div>
  )
}
