import { useState, type CSSProperties } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import { Boton } from '../../ui/Boton.tsx'
import { Figura } from './Figura.tsx'
import { nombreDeColor } from './nombres.ts'
import { COLORES_EQUIPO, nombreDeEquipo, sumar, type Marcador } from './logica.ts'

const t = textos.herramientas

interface Props {
  marcador: Marcador
  onCambiar: (cambio: (m: Marcador) => Marcador) => void
}

/** Los equipos con sus puntos y botones grandes de +1 y −1, para tocar en la pizarra. */
export function PanelMarcador({ marcador, onCambiar }: Props) {
  /** Para lectores de pantalla: el último cambio de puntos. */
  const [anuncio, setAnuncio] = useState('')

  function cambiarPuntos(indice: number, delta: number) {
    const equipo = marcador.equipos[indice]
    const puntos = Math.max(0, equipo.puntos + delta)
    setAnuncio(`${nombreDeEquipo(equipo, nombreDeColor)}: ${t.puntos(puntos)}`)
    onCambiar((m) => sumar(m, indice, delta))
  }

  return (
    <section className="marcador" aria-label={t.regionMarcador}>
      <ul className="marcador__equipos">
        {marcador.equipos.map((equipo, i) => {
          const nombre = nombreDeEquipo(equipo, nombreDeColor)
          return (
            <li key={i} className="equipo" style={{ '--equipo-color': COLORES_EQUIPO[equipo.color].valor } as CSSProperties}>
              <span className="equipo__nombre">{nombre}</span>
              <span className="equipo__puntos">
                <Figura color={equipo.color} />
                <span aria-label={t.puntos(equipo.puntos)}>{equipo.puntos}</span>
              </span>
              <Boton
                variante="herramienta"
                className="equipo__boton"
                onClick={() => cambiarPuntos(i, -1)}
                disabled={equipo.puntos === 0}
                aria-label={t.restarPunto(nombre)}
              >
                −1
              </Boton>
              <Boton
                variante="principal"
                className="equipo__boton"
                onClick={() => cambiarPuntos(i, 1)}
                aria-label={t.sumarPunto(nombre)}
              >
                +1
              </Boton>
            </li>
          )
        })}
      </ul>
      <p className="solo-lector" aria-live="polite">
        {anuncio}
      </p>
    </section>
  )
}
