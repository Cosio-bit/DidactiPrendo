import { memo, useState } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Definicion } from '../../parser/tipos.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import { avanzar, contar, deshacer, nuevoRosco, responder, type EstadoLetra, type Rosco } from './logica.ts'

const t = textos.proyeccion

/** Radio del círculo en que van las letras (la vista del dibujo va de -100 a 100). */
const R = 84

interface PropsRueda {
  letras: string[]
  estados: EstadoLetra[]
  actual: number | null
}

/** El rosco: las letras en círculo, cada una con el color de cómo le fue; la que se pregunta, más grande. */
const Rueda = memo(function Rueda({ letras, estados, actual }: PropsRueda) {
  const n = letras.length
  // Lo más grandes posible sin que se toquen.
  const radio = Math.min(13, ((Math.PI * R) / n) * 0.78)
  return (
    <svg className="rosco" viewBox="-100 -100 200 200" role="img" aria-label={t.rosco}>
      {letras.map((letra, i) => {
        const angulo = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = R * Math.cos(angulo)
        const y = R * Math.sin(angulo)
        const esActual = i === actual
        const r = esActual ? radio * 1.25 : radio
        return (
          <g key={i} className={`rosco__letra rosco__letra--${estados[i]}${esActual ? ' rosco__letra--actual' : ''}`}>
            <title>{t.letraDelRosco(letra, estados[i])}</title>
            <circle cx={x} cy={y} r={r} />
            <text x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={r * 1.15}>
              {letra}
            </text>
          </g>
        )
      })}
      {actual !== null && (
        <text className="rosco__centro" y="0" dy="0.36em" textAnchor="middle" fontSize={Math.min(90, R * 1.1)}>
          {letras[actual]}
        </text>
      )}
    </svg>
  )
})

interface Props {
  definiciones: Definicion[]
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionPasapalabra({ definiciones, onSalir, textoVolver }: Props) {
  const [rosco, setRosco] = useState<Rosco>(() => nuevoRosco(definiciones.length))
  const pantallaCompleta = usePantallaCompleta()
  const { aciertos, errores, pendientes } = contar(rosco)

  const marcar = (resultado: 'acierto' | 'error') => setRosco((r) => responder(r, resultado))
  useAtajos({
    avanzar: () => setRosco(avanzar),
    retroceder: () => setRosco(deshacer),
    salir: onSalir,
    pantallaCompleta: pantallaCompleta.alternar,
    otras: { c: () => marcar('acierto'), i: () => marcar('error') },
  })

  const definicion = definiciones[rosco.actual]
  const fueAcierto = rosco.estados[rosco.actual] === 'acierto'
  // La letra se calcula para cada definición con la respuesta ya reservada: al responder, nada cambia de tamaño.
  const texto = useTextoAjustado<HTMLDivElement>(`${rosco.actual}-${rosco.terminado}`, 64)

  return (
    <div className="proyeccion proyeccion-pasapalabra">
      <Rueda
        letras={definiciones.map((d) => d.letra)}
        estados={rosco.estados}
        actual={rosco.terminado ? null : rosco.actual}
      />

      <div className="proyeccion-pasapalabra__panel">
        <div className="proyeccion-preguntas__barra">
          <p className="proyeccion-pasapalabra__cuenta" aria-live="polite">
            <span className="cuenta--acierto">{t.aciertos(aciertos)}</span>
            {' · '}
            <span className="cuenta--error">{t.errores(errores)}</span>
            {' · '}
            {t.porResponder(pendientes)}
          </p>
          <div className="proyeccion__secundarios">
            <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
            {pantallaCompleta.disponible && (
              <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
                {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
              </Boton>
            )}
          </div>
        </div>

        {rosco.terminado ? (
          <div className="proyeccion-preguntas__cierre">
            <p className="proyeccion-preguntas__cierre-titulo">{t.roscoTerminado}</p>
            <p>
              {t.aciertos(aciertos)} · {t.errores(errores)}
            </p>
            <div className="proyeccion__secundarios">
              <Boton variante="navegacion" onClick={() => setRosco(deshacer)}>{t.deshacerPaso}</Boton>
              <Boton variante="principal" onClick={() => setRosco(nuevoRosco(definiciones.length))}>
                {t.volverAEmpezar}
              </Boton>
            </div>
          </div>
        ) : (
          <div ref={texto} className="proyeccion-pasapalabra__texto">
            <p className="proyeccion-pasapalabra__letra">
              {definicion.contiene ? t.contieneLa(definicion.letra) : t.empiezaCon(definicion.letra)}
            </p>
            <p className="proyeccion-pasapalabra__definicion">{definicion.definicion}</p>
            <p
              className={[
                'proyeccion-pasapalabra__respuesta',
                rosco.respondida ? (fueAcierto ? 'respuesta--acierto' : 'respuesta--error') : 'respuesta--reservada',
              ].join(' ')}
              aria-hidden={!rosco.respondida}
            >
              {rosco.respondida && fueAcierto ? t.respuestaCorrecta(definicion.respuesta) : t.respuestaIncorrecta(definicion.respuesta)}
            </p>
          </div>
        )}

        {!rosco.terminado && (
          // Siempre los mismos cuatro botones: así el espacio de la definición nunca cambia.
          <div className="proyeccion-pasapalabra__controles">
            <Boton variante="herramienta" className="boton--acierto" disabled={rosco.respondida} onClick={() => marcar('acierto')}>
              {t.correctaBoton}
            </Boton>
            <Boton variante="herramienta" className="boton--error" disabled={rosco.respondida} onClick={() => marcar('error')}>
              {t.incorrectaBoton}
            </Boton>
            <Boton variante="navegacion" onClick={() => setRosco(deshacer)} disabled={rosco.historial.length === 0}>
              {t.deshacerPaso}
            </Boton>
            <Boton variante="principal" onClick={() => setRosco(avanzar)}>
              {!rosco.respondida ? t.pasapalabra : pendientes === 0 ? t.terminar : t.siguiente}
            </Boton>
          </div>
        )}
      </div>
      <AyudaTeclas>{t.teclasPasapalabra}</AyudaTeclas>
    </div>
  )
}
