import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { useArrastrar } from '../../projection/useArrastrar.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import { letra } from '../preguntas/logica.ts'
import {
  agarrar,
  deshacer,
  elegir,
  estaColocado,
  nuevoOrdenar,
  ponerEn,
  revelarSiguiente,
  soltarElegido,
  soltarEn,
  terminado,
  type Ordenar,
} from './logica.ts'

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
  const colocados = orden.colocados.length

  // Tomar y arrastrar un elemento hasta su casilla (mouse, dedo o lápiz).
  // Si se suelta fuera de una casilla, queda agarrado: no se pierde la elección.
  const { fantasma, arrastrable, fueArrastre } = useArrastrar<number>({
    agarrado: orden.elegido,
    alSoltar: (elemento, destino) => {
      const casilla = Number(destino.replace('casilla-', ''))
      setOrden((o) => soltarEn(o, elemento, casilla))
    },
    alSoltarFuera: (elemento) => setOrden((o) => agarrar(o, elemento)),
  })

  // Números 1 a 9: llevar el elemento elegido a esa casilla.
  const numeros = Object.fromEntries(
    elementos.slice(0, 9).map((_, i) => [String(i + 1), () => setOrden((o) => ponerEn(o, i))]),
  )
  useAtajos({
    avanzar: () => setOrden(revelarSiguiente),
    retroceder: () => setOrden(deshacer),
    // Con un elemento agarrado, Esc solo lo suelta; si no, sale de la proyección.
    salir: () => (orden.elegido !== null ? setOrden(soltarElegido) : onSalir()),
    pantallaCompleta: pantallaCompleta.alternar,
    otras: numeros,
  })

  // El tamaño de letra se calcula una sola vez, con todas las casillas ya ocupadas (texto reservado) y el
  // banco completo, así no cambia en cada jugada. Solo se recalcula si cambia el tamaño de la pantalla.
  const contenido = useTextoAjustado<HTMLDivElement>('ordenar', 56)

  // Cada elemento conserva la letra con que apareció, aunque los demás se muevan.
  const porOrdenar = orden.desorden.map((indice, posicion) => ({ indice, letra: letra(posicion) }))
  const letraDe = (indice: number) => porOrdenar.find((p) => p.indice === indice)!.letra
  const filas = Math.ceil(elementos.length / columnasCasillas(elementos.length))

  return (
    <div className="proyeccion proyeccion-ordenar">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero proyeccion__titulo" title={titulo}>
          {titulo}
        </p>
        <p className="proyeccion-parejas__aviso" aria-live="polite">
          {listo ? t.ordenTerminado : t.enSuLugar(colocados, elementos.length)}
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
        <section className="proyeccion-ordenar__columna">
          <h2 className="proyeccion-ordenar__titulo">{t.ordenCorrecto}</h2>
          <ol
            className="proyeccion-ordenar__lista proyeccion-ordenar__casillas"
            style={{ gridTemplateRows: `repeat(${filas}, auto)` }}
          >
            {elementos.map((elemento, i) => {
              const lleno = estaColocado(orden, i)
              // El texto que va en la casilla ocupa su lugar desde el inicio (invisible hasta que se coloca).
              const texto = (
                <span className={lleno ? 'casilla__texto' : 'casilla__texto casilla__texto--reservado'} aria-hidden={!lleno}>
                  <span className="ficha__letra">{letraDe(i)}</span> {elemento}
                </span>
              )
              if (lleno) {
                return (
                  <li key={i} className="casilla casilla--llena">
                    <span className="casilla__numero">{i + 1}</span>
                    {texto}
                  </li>
                )
              }
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={[
                      'casilla',
                      'casilla--vacia',
                      orden.elegido !== null && 'casilla--disponible',
                      orden.errado?.casilla === i && 'casilla--errada',
                      fantasma?.destino === `casilla-${i}` && 'casilla--destino',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-destino={`casilla-${i}`}
                    aria-label={t.lugarBoton(i + 1)}
                    onClick={() => setOrden((o) => ponerEn(o, i))}
                  >
                    <span className="casilla__numero">{i + 1}</span>
                    {texto}
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="proyeccion-ordenar__columna">
          <h2 className="proyeccion-ordenar__titulo">{t.porOrdenar}</h2>
          <ul className="proyeccion-ordenar__fichas">
            {porOrdenar.map((p) => {
              // Una ficha ya colocada deja su hueco: las demás no se corren.
              if (estaColocado(orden, p.indice)) {
                return (
                  <li key={p.indice} aria-hidden="true">
                    <span className="ficha ficha--hueco">
                      <span className="ficha__letra">{p.letra}</span> {elementos[p.indice]}
                    </span>
                  </li>
                )
              }
              const elegido = orden.elegido === p.indice
              const errado = orden.errado?.elemento === p.indice ? orden.errado : null
              return (
                <li key={p.indice}>
                  <button
                    type="button"
                    className={[
                      'ficha',
                      errado && 'ficha--errada',
                      elegido && 'ficha--elegida',
                      fantasma?.ancho !== undefined && fantasma.item === p.indice && 'ficha--arrastrada',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={elegido}
                    {...arrastrable(p.indice)}
                    onClick={() => !fueArrastre(p.indice) && setOrden((o) => elegir(o, p.indice))}
                  >
                    <span className="ficha__letra">{p.letra}</span> {elementos[p.indice]}
                    {errado && <strong className="ficha__marca">✗ {t.noVaEnLugar(errado.casilla + 1)}</strong>}
                  </button>
                </li>
              )
            })}
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
        <Boton variante="herramienta" onClick={() => setOrden(deshacer)} disabled={colocados === 0}>
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
      <AyudaTeclas indicacion={orden.elegido !== null}>
        {orden.elegido !== null ? t.elegirLugar : t.teclasOrdenar}
      </AyudaTeclas>
    </div>
  )
}
