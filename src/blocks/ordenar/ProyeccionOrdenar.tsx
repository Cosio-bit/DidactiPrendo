import { useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
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
}

export function ProyeccionOrdenar({ titulo, elementos, onSalir }: Props) {
  const [orden, setOrden] = useState<Ordenar>(() => nuevoOrdenar(elementos.length))
  const pantallaCompleta = usePantallaCompleta()
  const listo = terminado(orden)

  useAtajos({
    avanzar: () => setOrden(revelarSiguiente),
    retroceder: () => setOrden(deshacer),
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
  })

  const contenido = useTextoAjustado<HTMLDivElement>(`${orden.colocados}-${orden.errado}`, 56)

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
          <Boton onClick={() => setOrden(nuevoOrdenar(elementos.length))}>{t.volverAEmpezar}</Boton>
          <Boton onClick={pantallaCompleta.alternar}>
            {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
          </Boton>
          <Boton onClick={onSalir}>{t.salir}</Boton>
        </div>
      </div>

      <div ref={contenido} className="proyeccion-ordenar__contenido">
        <section className="proyeccion-ordenar__columna">
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
                      ? 'casilla casilla--siguiente'
                      : 'casilla'
                }
              >
                <span className="casilla__numero">{i + 1}</span>
                <span className="casilla__texto">
                  {i < orden.colocados ? (
                    <>
                      <span className="ficha__letra">{letraDe(i)}</span> {elemento}
                    </>
                  ) : i === orden.colocados ? (
                    t.cualSigue
                  ) : (
                    ''
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="proyeccion-ordenar__columna">
          <h2 className="proyeccion-ordenar__titulo">{t.porOrdenar}</h2>
          <ul className="proyeccion-ordenar__fichas">
            {porOrdenar
              .filter((p) => p.indice >= orden.colocados)
              .map((p) => (
                <li key={p.indice}>
                  <button
                    type="button"
                    className={orden.errado === p.indice ? 'ficha ficha--errada' : 'ficha'}
                    onClick={() => setOrden((o) => proponer(o, p.indice))}
                  >
                    <span className="ficha__letra">{p.letra}</span> {elementos[p.indice]}
                    {orden.errado === p.indice && <strong className="ficha__marca"> ✗ {t.noVaAqui}</strong>}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <div className="proyeccion-preguntas__controles">
        <Boton onClick={() => setOrden(deshacer)} disabled={orden.colocados === 0}>
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
      <p className="proyeccion__teclas">{t.teclasOrdenar}</p>
    </div>
  )
}
